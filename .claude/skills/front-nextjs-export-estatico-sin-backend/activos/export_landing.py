"""Exporta ofertas con match + reporte de control al JSON estatico de la landing.

Salidas:
  landing/public/data/ofertas.json  — ofertas con al menos un perfil en match
  landing/public/data/reporte.json  — tablero de control del ultimo scrape:
      cobertura de fuentes, resultados por fuente, distribucion de scores,
      tipos, estados, match por perfil y proximas fuentes sugeridas.

Insumos:
  data/ofertas_latest.json          — todas las ofertas del ultimo run (con y sin match)
  data/stats_latest.json            — metricas por fuente del run (lo escribe main.py)
  bootstrap_output/fuentes.json     — registro completo de fuentes (cobertura)

Uso:
    python scripts/export_landing.py
"""

from __future__ import annotations

import json
import sys
from collections import Counter
from datetime import datetime
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT))

# Negativas globales del motor — para derivar el display de "Mi perfil" del
# esquema rico de config/perfiles.json (la calibración ya no vive en constantes).
from matcher import KEYWORDS_NEGATIVAS  # noqa: E402

INPUT_PATH = ROOT / "data" / "ofertas_latest.json"
STATS_PATH = ROOT / "data" / "stats_latest.json"
HISTORIAL_PATH = ROOT / "data" / "fuentes_historial.json"
FUENTES_PATH = ROOT / "bootstrap_output" / "fuentes.json"
PERFILES_PATH = ROOT / "config" / "perfiles.json"
OUTPUT_PATH = ROOT / "landing" / "public" / "data" / "ofertas.json"
OUTPUT_REPORTE = ROOT / "landing" / "public" / "data" / "reporte.json"
OUTPUT_PERFILES = ROOT / "landing" / "public" / "data" / "perfiles.json"

PRIORIDAD_ORDEN = {"Muy alta": 0, "Alta": 1, "Media alta": 2, "Media": 3}

BUCKETS_SCORE = [
    ("90-100", 90, 100),
    ("70-89", 70, 89),
    ("50-69", 50, 69),
    ("30-49", 30, 49),
    ("0-29", 0, 29),
]

# Sectores temáticos derivados de los clusters de matcher.py. Una oferta puede
# caer en varios. Se etiqueta escaneando titulo+descripcion+notas+empresa norm.
SECTORES_TAXONOMIA: dict[str, list[str]] = {
    "Datos & BI": [
        "data", "datos", "analitica", "analytics", "dashboard", "bi",
        "business intelligence", "power bi", "tableau", "looker", "bigquery",
        "kpi", "metricas", "metrics", "visualizacion", "observatorio", "observatory",
    ],
    "IA & Automatizacion": [
        "ia", "inteligencia artificial", " ai ", "genai", "llm", "agentes", "agents",
        "prompt", "automatizacion", "automation", "no-code", "no code", "low-code",
        "low code", "zapier", "make.com", "n8n", "rpa", "integraciones", "integrations",
        "workflow", "machine learning", " ml ", "nlp",
    ],
    "Cultura & Educacion": [
        "cultura", "cultural", "culture", "patrimonio", "economia creativa",
        "industrias creativas", "creative", "educacion", "education", "edtech",
        "danza", "dance", "musica", "music", "teatro", "museo", "museum",
        "biblioteca", "library", "audiovisual", "media", "podcast",
    ],
    "Plataformas & Producto": [
        "plataforma digital", "digital platform", "producto digital", "digital product",
        "product manager", "product owner", "project manager", "program manager",
        "arquitectura", "architecture", "sistema de informacion", "information system",
        "ux", "ui",
    ],
    "GIS & Geoespacial": [
        "sig", " gis", "qgis", "arcgis", "geoportal", "geomarketing", "cartografia",
        "geospatial", "geoespacial",
    ],
    "Sector Publico & GovTech": [
        "sector publico", "public sector", "gobierno", "government", "govtech",
        "secretaria", "ministerio", "ministry", "politica publica", "public policy",
    ],
    "Direccion & Estrategia": [
        "director", "head of", " lead", "chief", " vp", "estrategia", "strategy",
        "consultor", "consultant", "asesor", "advisor", "transformacion digital",
        "digital transformation", "innovacion", "innovation", "fractional", "founder",
    ],
    "Multilateral & Cooperacion": [
        "unesco", "unicef", "undp", "pnud", "bid", "iadb", " idb", "banco mundial",
        "world bank", " caf ", "usaid", "naciones unidas", "un women", "cooperacion",
        "stta", " ods", " sdg",
    ],
}


def _parse_json_field(valor: Any, default: Any) -> Any:
    """Parsea un campo que puede venir como JSON-string o ya parseado."""
    if isinstance(valor, (list, dict)):
        return valor
    if isinstance(valor, str) and valor.strip():
        try:
            return json.loads(valor)
        except json.JSONDecodeError:
            return default
    return default


def _norm_sector(s: str) -> str:
    import unicodedata
    s = unicodedata.normalize("NFKD", s or "").encode("ascii", "ignore").decode("ascii")
    return f" {s.lower()} "  # padding para que los keywords con espacios (' ai ') matcheen bordes


def taggear_sectores(oferta: dict) -> list[str]:
    blob = _norm_sector(
        f"{oferta.get('titulo','')} {oferta.get('descripcion','')} "
        f"{oferta.get('notas','')} {oferta.get('empresa_entidad','')}"
    )
    encontrados = [
        sector for sector, kws in SECTORES_TAXONOMIA.items()
        if any(kw in blob for kw in kws)
    ]
    return encontrados or ["Otros"]


def parsear(oferta: dict[str, Any]) -> dict[str, Any]:
    """Devuelve la oferta con perfiles_match/score_match parseados y max_score."""
    perfiles = _parse_json_field(oferta.get("perfiles_match"), [])
    if not isinstance(perfiles, list):
        perfiles = []

    scores = _parse_json_field(oferta.get("score_match"), {})
    if not isinstance(scores, dict):
        scores = {}

    # max_score: el mejor score entre los perfiles que hicieron match;
    # si no hay match, el mejor score absoluto (para distribuciones).
    scores_match = [
        scores[p] for p in perfiles if isinstance(scores.get(p), (int, float))
    ]
    if scores_match:
        max_score = max(scores_match)
    else:
        numericos = [v for v in scores.values() if isinstance(v, (int, float))]
        max_score = max(numericos) if numericos else 0

    salida = dict(oferta)
    salida["perfiles_match"] = perfiles
    salida["score_match"] = scores
    salida["max_score"] = max_score
    salida["sectores"] = taggear_sectores(oferta)
    return salida


def construir_reporte(
    todas: list[dict[str, Any]],
    exportadas: list[dict[str, Any]],
) -> dict[str, Any]:
    """Arma el payload del tablero de control a partir del ultimo run."""

    # --- Stats del run (si main.py las dejó) ---
    scrape: dict[str, Any] | None = None
    if STATS_PATH.exists():
        try:
            scrape = json.loads(STATS_PATH.read_text(encoding="utf-8"))
        except json.JSONDecodeError:
            scrape = None

    # --- Historial acumulado por fuente ---
    historial: dict[str, Any] = {}
    if HISTORIAL_PATH.exists():
        try:
            historial = json.loads(HISTORIAL_PATH.read_text(encoding="utf-8"))
        except json.JSONDecodeError:
            pass

    # --- Por fuente: parte de TODAS las fuentes que corrieron este run
    #     (incluye las que devolvieron 0 ofertas, para saber qué se scrapeó).
    stats_fuentes: dict[str, dict[str, Any]] = (scrape or {}).get("fuentes", {})
    por_fuente: dict[str, dict[str, Any]] = {}
    for nombre, st in stats_fuentes.items():
        por_fuente[nombre] = {
            "nombre": nombre,
            "scrapeadas": st.get("scrapeadas", 0),
            "con_match": 0,
            "top_score": 0,
            "duracion_seg": round(st.get("duracion_seg", 0.0), 1),
            "errores": st.get("errores", 0),
        }

    # Agrega match/top_score desde las ofertas (post-dedup, con perfil).
    for o in todas:
        nombre = o.get("fuente_nombre", "—")
        f = por_fuente.setdefault(
            nombre,
            {"nombre": nombre, "scrapeadas": 0, "con_match": 0, "top_score": 0,
             "duracion_seg": 0.0, "errores": 0},
        )
        if o["perfiles_match"]:
            f["con_match"] += 1
        f["top_score"] = max(f["top_score"], o["max_score"])

    ahora = datetime.now()
    for nombre, f in por_fuente.items():
        runs = historial.get(nombre, {}).get("runs", [])
        if runs:
            ultimo = runs[-1]
            f["ultimo_run"] = ultimo["ts"]
            try:
                ultimo_dt = datetime.fromisoformat(ultimo["ts"])
                f["dias_desde_run"] = (ahora - ultimo_dt).days
            except Exception:
                f["dias_desde_run"] = None
            if len(runs) >= 2:
                n_ant, n_act = runs[-2]["n"], runs[-1]["n"]
                if n_act > n_ant * 1.1:
                    f["tendencia"] = "↑"
                elif n_act < n_ant * 0.9:
                    f["tendencia"] = "↓"
                else:
                    f["tendencia"] = "="
            else:
                f["tendencia"] = "nueva"
        else:
            f["ultimo_run"] = None
            f["dias_desde_run"] = None
            f["tendencia"] = "—"

        # Salud del scrape: agrupa la fuente en la landing.
        if f["errores"]:
            f["salud"] = "error"
        elif f["scrapeadas"] == 0:
            f["salud"] = "sin_resultados"
        else:
            f["salud"] = "ok"

    lista_fuentes = sorted(
        por_fuente.values(),
        key=lambda f: (f["salud"] != "ok", -f["scrapeadas"], f["nombre"]),
    )

    # --- Cobertura del registro de fuentes ---
    cobertura = {"registradas": 0, "activas_scrapeables": 0, "implementadas": len(por_fuente)}
    siguientes: list[dict[str, Any]] = []
    if FUENTES_PATH.exists():
        registro = json.loads(FUENTES_PATH.read_text(encoding="utf-8"))
        cobertura["registradas"] = len(registro)
        implementadas = set(por_fuente)
        candidatas = []
        for f in registro:
            if not (f.get("activo", True) and f.get("scrapeable", True)):
                continue
            cobertura["activas_scrapeables"] += 1
            if f.get("nombre") in implementadas:
                continue
            candidatas.append(f)
        candidatas.sort(key=lambda f: PRIORIDAD_ORDEN.get(f.get("prioridad", ""), 9))
        siguientes = [
            {
                "id": f.get("id", ""),
                "nombre": f.get("nombre", ""),
                "prioridad": f.get("prioridad", ""),
                "aplica": "ambos"
                if f.get("aplica_ct") and f.get("aplica_div")
                else ("CT" if f.get("aplica_ct") else "DIV"),
            }
            for f in candidatas[:10]
        ]
    cobertura["pendientes"] = max(
        cobertura["activas_scrapeables"] - cobertura["implementadas"], 0
    )

    # --- Perfiles ---
    n_ct = sum(1 for o in todas if "CT" in o["perfiles_match"])
    n_div = sum(1 for o in todas if "DIV" in o["perfiles_match"])
    n_ambos = sum(
        1 for o in todas if "CT" in o["perfiles_match"] and "DIV" in o["perfiles_match"]
    )
    n_sin = sum(1 for o in todas if not o["perfiles_match"])

    # --- Distribucion de score (mejor score por oferta, todas) ---
    distribucion = []
    for etiqueta, lo, hi in BUCKETS_SCORE:
        distribucion.append(
            {
                "rango": etiqueta,
                "total": sum(1 for o in todas if lo <= o["max_score"] <= hi),
            }
        )

    # --- Tipos y estados ---
    por_tipo = [
        {"tipo": t or "—", "total": n}
        for t, n in Counter(o.get("tipo_oferta", "") for o in todas).most_common()
    ]
    por_estado = [
        {"estado": e or "—", "total": n}
        for e, n in Counter(o.get("estado", "") for o in todas).most_common()
    ]

    return {
        "generado_en": datetime.now().isoformat(timespec="seconds"),
        "scrape_ejecutado_en": (scrape or {}).get("ejecutado_en", ""),
        "totales": {
            "raw": (scrape or {}).get("totales", {}).get("raw", len(todas)),
            "unicas": len(todas),
            "con_match": len(exportadas),
        },
        "cobertura": cobertura,
        "por_fuente": lista_fuentes,
        "perfiles": {"CT": n_ct, "DIV": n_div, "ambos": n_ambos, "sin_match": n_sin},
        "distribucion_score": distribucion,
        "por_tipo": por_tipo,
        "por_estado": por_estado,
        "siguientes_fuentes": siguientes,
    }


def _normalizar_match_para_landing(perfiles_doc: dict[str, Any]) -> None:
    """Deriva el `match` RICO de config/perfiles.json al esquema simple que la
    landing consume: {keywords_positivas, keywords_negativas, roles_excluidos,
    tipos_oferta}. Data-driven (cualquier perfil), no hardcodea CT/DIV.

    - positivas      = match.keywords_positivas (suman al score)
    - negativas      = KEYWORDS_NEGATIVAS globales + extra del perfil + funciones excluidas
    - roles_excluidos = roles_handson + roles_exec_generico (penalización por rol en el título)
    """
    for perfil in perfiles_doc.get("perfiles", []):
        m = perfil.get("match")
        if not m:
            continue
        roles_excluidos = sorted(
            set(m.get("roles_handson", [])) | set(m.get("roles_exec_generico", []))
        )
        negativas = sorted(
            KEYWORDS_NEGATIVAS
            | set(m.get("keywords_negativas", []))
            | set(m.get("roles_funcion_excluida", []))
        )
        perfil["match"] = {
            "keywords_positivas": sorted(m.get("keywords_positivas", [])),
            "keywords_negativas": negativas,
            "roles_excluidos": roles_excluidos,
            "tipos_oferta": m.get("tipos_oferta", []),
        }


def main() -> int:
    if not INPUT_PATH.exists():
        print(f"ERROR: no existe {INPUT_PATH}")
        return 1

    with INPUT_PATH.open(encoding="utf-8") as f:
        ofertas: list[dict[str, Any]] = json.load(f)

    # Visible = tiene match de perfil y NO está rechazada. Filtra por prefijo
    # ('rechaz*') en vez de string exacto, para tolerar género/variantes viejas
    # (rechazado/rechazada) y no perder ofertas aprobadas (aprobado/aprobada).
    def _es_rechazada(estado: Any) -> bool:
        return (estado or "").strip().lower().startswith("rechaz")

    todas = [parsear(o) for o in ofertas]
    exportadas = [
        o for o in todas
        if o["perfiles_match"] and not _es_rechazada(o.get("estado"))
    ]
    exportadas.sort(key=lambda o: o["max_score"], reverse=True)

    payload = {
        "generado_en": datetime.now().isoformat(timespec="seconds"),
        "total_fuente": len(ofertas),
        "total_exportadas": len(exportadas),
        "ofertas": exportadas,
    }

    OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    with OUTPUT_PATH.open("w", encoding="utf-8") as f:
        json.dump(payload, f, ensure_ascii=False, indent=1)

    reporte = construir_reporte(todas, exportadas)
    with OUTPUT_REPORTE.open("w", encoding="utf-8") as f:
        json.dump(reporte, f, ensure_ascii=False, indent=1)

    # Perfiles: fuente única config/perfiles.json -> la landing la sirve estática.
    # Derivamos el match RICO al esquema simple que la UI consume (data-driven).
    if PERFILES_PATH.exists():
        perfiles_doc = json.loads(PERFILES_PATH.read_text(encoding="utf-8"))
        _normalizar_match_para_landing(perfiles_doc)
        with OUTPUT_PERFILES.open("w", encoding="utf-8") as f:
            json.dump(perfiles_doc, f, ensure_ascii=False, indent=1)

    por_perfil: dict[str, int] = {}
    for o in exportadas:
        for p in o["perfiles_match"]:
            por_perfil[p] = por_perfil.get(p, 0) + 1

    print(f"Exportadas {len(exportadas)} de {len(ofertas)} ofertas")
    print(f"Por perfil: {por_perfil}")
    print(f"Salida ofertas: {OUTPUT_PATH}")
    print(f"Salida reporte: {OUTPUT_REPORTE}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
