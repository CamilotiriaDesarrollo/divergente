"""
matcher.py — Calcula score_match entre una Oferta y un Perfil (data-driven).

A partir del refactor 2026-06-15 (Fase 0 onboarding Paula), el scoring es
GENÉRICO para N perfiles: la calibración de cada perfil (keywords, ciudades,
roles penalizados, tipos de oferta) vive en `config/perfiles.json` › perfil ›
`match`. Antes estaba hardcodeada solo para CT y DIV. Añadir un perfil nuevo
(Paula, Gisselle, Polisemia) es ahora poblar su bloque `match` en el JSON.

Lo que queda GLOBAL en este módulo (no depende del perfil):
  - KEYWORDS_NEGATIVAS: ruido universal (junior, becario, call center…).
  - MODALIDAD_BONUS: lógica de modalidad (remoto suma, presencial fuera de base resta).
  - SENIORITY_BASE: mid/senior/lead/director suman; junior resta.
  - Los PESOS del algoritmo (base 30, +4/kw, -10/kw, penalties de roles).

Estrategia de score (sin LLM):
  base 30 + keywords positivas (≤+40) - negativas (≤-40) + geografía (0..+12)
  + modalidad (-6..+12) + seniority (-25..+14) - roles penalizados del perfil.

Output: ScoreResult(score 0-100, razones). Ver scorear() / scorear_todos().
"""

from __future__ import annotations

import json
import re
import unicodedata
from dataclasses import dataclass
from functools import lru_cache
from pathlib import Path
from typing import Any

_RAIZ = Path(__file__).resolve().parent
_PERFILES_PATH = _RAIZ / "config" / "perfiles.json"

# Preferencias aprendidas desde la landing ("me encanta" / "descartar").
# Archivo opcional: si no existe, el matcher se comporta igual que siempre.
_PREFS_PATH = _RAIZ / "data" / "preferencias.json"
_prefs_cache: dict[str, Any] | None = None


def _cargar_preferencias() -> dict[str, Any]:
    """Lee data/preferencias.json una vez por proceso. Tolera ausencia/errores."""
    global _prefs_cache
    if _prefs_cache is None:
        try:
            _prefs_cache = json.loads(_PREFS_PATH.read_text(encoding="utf-8"))
        except Exception:
            _prefs_cache = {"gustos": {}, "descartes": {}}
    return _prefs_cache


def _ajuste_preferencias(texto_norm: str) -> tuple[int, str]:
    """Ajuste ACOTADO según lo que el usuario marcó en la landing. Las claves de
    preferencias vienen ya normalizadas (ascii/minúsculas) desde la API route.
    Bonus máx +12, penalización máx -16: no domina sobre la calibración base."""
    prefs = _cargar_preferencias()
    gustos = prefs.get("gustos", {}) or {}
    descartes = prefs.get("descartes", {}) or {}
    if not gustos and not descartes:
        return 0, ""
    pos = [kw for kw in gustos if kw and len(kw) >= 4 and kw in texto_norm]
    neg = [kw for kw in descartes if kw and len(kw) >= 4 and kw in texto_norm]
    bonus = min(len(pos) * 3, 12)
    penalty = min(len(neg) * 4, 16)
    delta = bonus - penalty
    if delta == 0:
        return 0, ""
    partes = []
    if bonus:
        partes.append(f"+{bonus} te gusta ({', '.join(pos[:3])})")
    if penalty:
        partes.append(f"-{penalty} descartas ({', '.join(neg[:3])})")
    return delta, "; ".join(partes)


# ============================================================
# Config de perfiles (data-driven) — fuente: config/perfiles.json
# ============================================================

@lru_cache(maxsize=1)
def _cargar_perfiles() -> dict[str, dict[str, Any]]:
    """Mapa {id: bloque_match} desde config/perfiles.json. Cacheado por proceso."""
    try:
        doc = json.loads(_PERFILES_PATH.read_text(encoding="utf-8"))
    except Exception:
        return {}
    out: dict[str, dict[str, Any]] = {}
    for p in doc.get("perfiles", []):
        out[p.get("id", "")] = p.get("match", {}) or {}
    return out


# Default seguro para perfiles sin `match` poblado (GIS, POL): score solo base.
_MATCH_VACIO: dict[str, Any] = {
    "keywords_positivas": [], "keywords_negativas": [],
    "roles_handson": [], "roles_funcion_excluida": [], "roles_exec_generico": [],
    "ciudades": {}, "modalidad_ciudades_base": [],
    "modalidad_penalty_presencial_fuera": -6, "tipos_oferta": [],
    # Si True: una oferta sin NINGUNA keyword positiva del perfil no puede cruzar
    # el umbral por geografía/modalidad/seniority sola (cap a CAP_SIN_CONTENIDO).
    # CT/DIV lo dejan en False (su calibración no lo necesita → regresión exacta).
    "requiere_keyword_contenido": False,
}

# Tope para ofertas sin contenido del perfil cuando requiere_keyword_contenido=True.
CAP_SIN_CONTENIDO = 40


def _config_perfil(perfil_id: str) -> dict[str, Any]:
    cfg = _cargar_perfiles().get(perfil_id)
    if not cfg:
        return _MATCH_VACIO
    return {**_MATCH_VACIO, **cfg}


def perfil_tiene_criterios(perfil_id: str) -> bool:
    """True si el perfil tiene keywords positivas (está calibrado y se puede scorear)."""
    return bool(_config_perfil(perfil_id).get("keywords_positivas"))


UMBRAL_MATCH_DEFAULT = 50


def umbral_perfil(perfil_id: str) -> int:
    """Umbral de match del perfil. Default 50; un perfil cuyas fuentes son más
    curadas/concisas (p.ej. Paula: periodismo/cultura con títulos cortos) puede
    bajarlo en su `match.umbral_match` sin afectar a los demás."""
    try:
        return int(_config_perfil(perfil_id).get("umbral_match") or UMBRAL_MATCH_DEFAULT)
    except (TypeError, ValueError):
        return UMBRAL_MATCH_DEFAULT


def recargar_perfiles() -> None:
    """Invalida el cache (tests / cambios en caliente de perfiles.json)."""
    _cargar_perfiles.cache_clear()


# ============================================================
# Constantes GLOBALES (no dependen del perfil)
# ============================================================

KEYWORDS_NEGATIVAS = {
    "junior", "trainee", "becario", "becaria", "practicante", "pasante",
    "internship", "intern", "entry level", "entry-level",
    "call center", "telemarketing", "bpo", "ventas frías", "cold calling",
    "data entry", "data-entry", "captura de datos",
    "soporte nivel 1", "help desk", "mesa de ayuda", "tier 1",
    "cajero", "atención al cliente puro",
    "qa manual", "tester manual",
    "voluntariado", "volunteer",
}

# Pesos de penalización de roles en el TÍTULO (calibración del algoritmo).
PENALTY_ROL_HANDSON = -45        # implementador técnico hands-on
PENALTY_FUNCION_EXCLUIDA = -38   # función ajena dura (ventas/finanzas/recaudación)
PENALTY_EXEC_GENERICO = -30      # liderazgo ejecutivo genérico (rescatable)

MODALIDAD_BONUS = {
    "remoto": 10, "remote": 10,
    "remote global": 12, "remoto global": 12,
    "hibrido": 6, "híbrido": 6, "hybrid": 6,
    "part time": 8, "part-time": 8,
    "freelance": 6,
    "presencial": -3,
}

SENIORITY_BASE = {
    "junior": -20, "entry-level": -20, "entry level": -20, "intern": -25,
    "mid": 5, "mid-level": 5, "intermediate": 5,
    "senior": 8, "sr.": 8, "sr": 8,
    "lead": 10, "tech lead": 10, "team lead": 10,
    "principal": 10,
    "manager": 8, "director": 12, "head": 10, "head of": 10,
    "vp": 12, "vice president": 12,
    "chief": 14, "c-level": 14, "cto": 14, "cpo": 14, "cdo": 14, "ceo": 14,
    "fractional": 10,
}


# ============================================================
# Utilidades
# ============================================================

def _normalizar(s: str) -> str:
    """Lowercase + sin tildes."""
    if not s:
        return ""
    s = unicodedata.normalize("NFD", s).encode("ascii", "ignore").decode("ascii")
    return s.lower()


def _contar_matches(texto_norm: str, keywords) -> tuple[int, list[str]]:
    """
    Cuenta cuántas keywords del iterable aparecen en el texto.

    Para keywords cortas (≤4 chars o siglas ≤5) usa word boundaries (evita que
    "ia" matchee "creativa"). Para las largas, substring directo.
    Devuelve (count, lista de keywords encontradas).
    """
    encontradas = []
    for kw in keywords:
        kw_norm = _normalizar(kw)
        if not kw_norm:
            continue
        if len(kw_norm) <= 4 or kw_norm.replace(" ", "").isalpha() and len(kw_norm) <= 5:
            pattern = r"\b" + re.escape(kw_norm) + r"\b"
            if re.search(pattern, texto_norm):
                encontradas.append(kw)
        else:
            if kw_norm in texto_norm:
                encontradas.append(kw)
    return len(encontradas), encontradas


def _bonus_geografia(ubicacion_norm: str, ciudades_perfil: dict[str, int]) -> tuple[int, str]:
    """Mayor bonus de las ciudades del perfil que aparezcan en la ubicación."""
    mejor = 0
    razon = ""
    for ciudad, bonus in ciudades_perfil.items():
        ciudad_norm = _normalizar(ciudad)
        if ciudad_norm in ubicacion_norm and bonus > mejor:
            mejor = bonus
            razon = ciudad
    return mejor, razon


def _bonus_modalidad(
    modalidad: str, ubicacion_norm: str, ciudades_base: list[str], penalty_fuera: int
) -> tuple[int, str]:
    """
    Bonus/penalty por modalidad. Presencial en ciudad base del perfil suma poco;
    presencial fuera de la base resta `penalty_fuera`. Remoto/híbrido/part-time suman.
    """
    mod_norm = _normalizar(modalidad)
    if not mod_norm:
        return 0, ""

    for k, bonus in MODALIDAD_BONUS.items():
        if _normalizar(k) in mod_norm:
            if "presencial" in mod_norm or "on-site" in mod_norm or "on site" in mod_norm:
                if any(_normalizar(c) in ubicacion_norm for c in ciudades_base):
                    return 4, f"presencial en ciudad base ({modalidad})"
                return penalty_fuera, f"presencial fuera de base ({modalidad})"
            return bonus, modalidad
    return 0, ""


def _bonus_seniority(seniority: str, titulo_norm: str) -> tuple[int, str]:
    """Bonus por seniority. Mira tanto el campo seniority como el título."""
    fuente = (_normalizar(seniority) + " " + titulo_norm).strip()
    mejor = 0
    razon = ""
    for kw, bonus in SENIORITY_BASE.items():
        if _normalizar(kw) in fuente and abs(bonus) > abs(mejor):
            mejor = bonus
            razon = kw
    return mejor, razon


def _penalizacion_primer_match(titulo_norm: str, roles, penalty: int) -> tuple[int, str]:
    """Si el TÍTULO matchea (word-boundary) alguno de `roles`, devuelve (penalty, rol).
    Solo el primero. Listas vacías → sin penalización (perfiles que no las usan)."""
    for rol in roles:
        rol_norm = _normalizar(rol)
        if rol_norm and re.search(r"\b" + re.escape(rol_norm) + r"\b", titulo_norm):
            return penalty, rol
    return 0, ""


# ============================================================
# Función principal
# ============================================================

@dataclass
class ScoreResult:
    score: int          # 0-100
    razones: list[str]  # qué sumó/restó

    def to_dict(self) -> dict:
        return {"score": self.score, "razones": self.razones}


def scorear(oferta: dict[str, Any], perfil: str) -> ScoreResult:
    """
    Calcula el score de match para una oferta contra un perfil dado (por id).

    perfil: id del perfil ("CT", "DIV", "PAU", …). Su calibración se lee de
            config/perfiles.json › perfil › match. Si el perfil no tiene
            criterios, el score queda en torno a la base (30) + geo/modalidad.
    """
    cfg = _config_perfil(perfil)

    titulo_norm = _normalizar(oferta.get("titulo", ""))
    desc_norm = _normalizar(oferta.get("descripcion", ""))
    ubicacion_norm = _normalizar(oferta.get("ubicacion", ""))
    texto_all = f"{titulo_norm} {desc_norm}"

    score = 30  # base
    razones: list[str] = []

    # 1. Keywords positivas (del perfil)
    pos_count, pos_found = _contar_matches(texto_all, cfg["keywords_positivas"])
    pos_bonus = min(pos_count * 4, 40)
    score += pos_bonus
    if pos_count:
        razones.append(f"+{pos_bonus} keywords positivas ({', '.join(pos_found[:4])}{'...' if len(pos_found)>4 else ''})")

    # 2. Keywords negativas (globales + extra del perfil)
    negativas = KEYWORDS_NEGATIVAS | set(cfg["keywords_negativas"])
    neg_count, neg_found = _contar_matches(texto_all, negativas)
    neg_penalty = min(neg_count * 10, 40)
    score -= neg_penalty
    if neg_count:
        razones.append(f"-{neg_penalty} keywords negativas ({', '.join(neg_found[:3])})")

    # 3. Geografía (ciudades del perfil)
    geo_bonus, geo_razon = _bonus_geografia(ubicacion_norm, cfg["ciudades"])
    score += geo_bonus
    if geo_bonus:
        razones.append(f"+{geo_bonus} geografía ({geo_razon})")

    # 4. Modalidad (ciudades base del perfil)
    mod_bonus, mod_razon = _bonus_modalidad(
        oferta.get("modalidad", ""), ubicacion_norm,
        cfg["modalidad_ciudades_base"], cfg["modalidad_penalty_presencial_fuera"],
    )
    score += mod_bonus
    if mod_bonus:
        sign = "+" if mod_bonus > 0 else ""
        razones.append(f"{sign}{mod_bonus} modalidad ({mod_razon})")

    # 5. Seniority (global)
    sen_bonus, sen_razon = _bonus_seniority(oferta.get("seniority", ""), titulo_norm)
    score += sen_bonus
    if sen_bonus:
        sign = "+" if sen_bonus > 0 else ""
        razones.append(f"{sign}{sen_bonus} seniority ({sen_razon})")

    # 6. Roles técnicos hands-on en el título (del perfil): el rol que el perfil NO ejerce
    rol_penalty, rol_razon = _penalizacion_primer_match(
        titulo_norm, cfg["roles_handson"], PENALTY_ROL_HANDSON)
    score += rol_penalty
    if rol_penalty:
        razones.append(f"{rol_penalty} rol técnico hands-on ({rol_razon})")

    # 6.5 Función ajena: excluida dura (-38) o ejecutivo genérico rescatable (-30)
    fn_penalty, fn_razon = _penalizacion_primer_match(
        titulo_norm, cfg["roles_funcion_excluida"], PENALTY_FUNCION_EXCLUIDA)
    if not fn_penalty:
        fn_penalty, fn_razon = _penalizacion_primer_match(
            titulo_norm, cfg["roles_exec_generico"], PENALTY_EXEC_GENERICO)
        if fn_penalty:
            fn_razon = f"{fn_razon} (genérico)"
    score += fn_penalty
    if fn_penalty:
        razones.append(f"{fn_penalty} función excluida ({fn_razon})")

    # 7. Preferencias aprendidas desde la landing (me encanta / descartar).
    pref_delta, pref_razon = _ajuste_preferencias(texto_all)
    if pref_delta:
        score += pref_delta
        razones.append(f"{'+' if pref_delta > 0 else ''}{pref_delta} preferencias ({pref_razon})")

    # 8. Gate de contenido (opt-in por perfil): sin keyword positiva propia, no
    # se cruza el umbral solo por geo/modalidad/seniority (evita ruido ejecutivo).
    if cfg.get("requiere_keyword_contenido") and pos_count == 0 and score > CAP_SIN_CONTENIDO:
        razones.append(f"cap {CAP_SIN_CONTENIDO} (sin keyword de contenido del perfil)")
        score = CAP_SIN_CONTENIDO

    score = max(0, min(100, score))
    return ScoreResult(score=score, razones=razones)


def scorear_todos(oferta: dict[str, Any], perfiles: list[str] | None = None) -> dict[str, ScoreResult]:
    """Scorea la oferta contra cada perfil dado (default: todos los que tienen
    criterios en config/perfiles.json). Perfiles sin keywords se omiten."""
    if perfiles is None:
        perfiles = [pid for pid in _cargar_perfiles() if perfil_tiene_criterios(pid)]
    return {p: scorear(oferta, p) for p in perfiles}


def scorear_ambos(oferta: dict[str, Any]) -> dict[str, ScoreResult]:
    """Compat: CT y DIV en una sola llamada (usado por código legacy)."""
    return {"CT": scorear(oferta, "CT"), "DIV": scorear(oferta, "DIV")}


def determinar_perfiles_match(scores: dict[str, ScoreResult], umbral: int = 50) -> list[str]:
    """Devuelve los perfiles cuyo score >= umbral."""
    return [p for p, s in scores.items() if s.score >= umbral]


# ============================================================
# CLI: test rápido
# ============================================================
if __name__ == "__main__":
    import sys
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except Exception:
        pass

    ejemplos = [
        {
            "titulo": "Director de Datos e Inteligencia Artificial",
            "descripcion": "Lideramos la transformación digital del Ministerio. Buscamos director con experiencia en plataformas digitales, analítica avanzada, IA generativa, sector público. Equipo 30+ personas. Bogotá híbrido.",
            "ubicacion": "Bogotá, Colombia",
            "modalidad": "Híbrido",
            "seniority": "Director",
        },
        {
            "titulo": "Junior QA Manual Tester",
            "descripcion": "Buscamos junior QA para testing manual de aplicaciones. Becario aceptable.",
            "ubicacion": "Bogotá",
            "modalidad": "Presencial",
            "seniority": "Junior",
        },
    ]
    perfiles = [pid for pid in _cargar_perfiles() if perfil_tiene_criterios(pid)]
    print(f"Perfiles con criterios: {perfiles}\n")
    for i, of in enumerate(ejemplos, 1):
        print(f"=== Oferta {i}: {of['titulo']} ===")
        for perfil, res in scorear_todos(of).items():
            print(f"  {perfil}: {res.score}/100")
            for r in res.razones:
                print(f"      · {r}")
        print(f"  → match: {determinar_perfiles_match(scorear_todos(of))}\n")
