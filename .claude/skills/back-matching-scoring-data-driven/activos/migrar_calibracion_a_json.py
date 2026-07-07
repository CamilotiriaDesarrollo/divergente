"""
scripts/migrar_calibracion_a_json.py — One-shot: vuelca la calibración de CT/DIV
desde las constantes de matcher.py al bloque `match` de config/perfiles.json.

Tras esto, config/perfiles.json es la ÚNICA fuente de verdad del scoring
(matcher.py pasa a leer de ahí, data-driven). Correr ANTES de refactorizar
matcher.py — importa las constantes que el refactor va a eliminar.

Esquema rico que escribe en cada `match`:
  keywords_positivas, keywords_negativas (extra de scoring; CT/DIV vacío),
  roles_handson (-45), roles_funcion_excluida (-38), roles_exec_generico (-30),
  ciudades {ciudad: peso}, modalidad_ciudades_base, modalidad_penalty_presencial_fuera,
  tipos_oferta.

Idempotente: re-ejecutar produce el mismo resultado.
"""

from __future__ import annotations

import json
import sys
from pathlib import Path

try:
    sys.stdout.reconfigure(encoding="utf-8")
except Exception:
    pass

RAIZ = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(RAIZ))

import matcher  # noqa: E402  (importa las constantes aún vivas)

CONFIG = RAIZ / "config" / "perfiles.json"

# Ciudades base presencial + penalty: hoy literales dentro de _bonus_modalidad.
MODALIDAD_CT = {"ciudades_base": ["pereira", "manizales", "armenia", "eje cafetero"], "penalty": -6}
MODALIDAD_DIV = {"ciudades_base": ["bogota", "medellin", "colombia"], "penalty": -3}


def match_ct() -> dict:
    return {
        "keywords_positivas": sorted(matcher.KEYWORDS_CT_POSITIVAS),
        "keywords_negativas": [],  # CT usa solo las globales (regresión exacta)
        "roles_handson": sorted(matcher.ROLES_HANDSON_CT),
        "roles_funcion_excluida": sorted(matcher.ROLES_FUNCION_NO_CT),
        "roles_exec_generico": sorted(matcher.ROLES_EXEC_GENERICO_CT),
        "ciudades": dict(matcher.CIUDADES_CT),
        "modalidad_ciudades_base": MODALIDAD_CT["ciudades_base"],
        "modalidad_penalty_presencial_fuera": MODALIDAD_CT["penalty"],
        "tipos_oferta": ["empleo", "contractor", "fractional", "freelance"],
    }


def match_div() -> dict:
    return {
        "keywords_positivas": sorted(matcher.KEYWORDS_DIV_POSITIVAS),
        "keywords_negativas": [],
        "roles_handson": [],            # DIV no penaliza roles técnicos
        "roles_funcion_excluida": [],
        "roles_exec_generico": [],
        "ciudades": dict(matcher.CIUDADES_DIV),
        "modalidad_ciudades_base": MODALIDAD_DIV["ciudades_base"],
        "modalidad_penalty_presencial_fuera": MODALIDAD_DIV["penalty"],
        "tipos_oferta": ["convocatoria_publica", "contrato", "licitacion"],
    }


def main() -> None:
    doc = json.loads(CONFIG.read_text(encoding="utf-8"))
    nuevos = {"CT": match_ct(), "DIV": match_div()}
    tocados = []
    for p in doc.get("perfiles", []):
        if p["id"] in nuevos:
            p["match"] = nuevos[p["id"]]
            tocados.append(p["id"])
    CONFIG.write_text(json.dumps(doc, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"Migrados: {', '.join(tocados)}")
    for pid in tocados:
        m = nuevos[pid]
        print(f"  {pid}: {len(m['keywords_positivas'])} kw+ · "
              f"{len(m['roles_handson'])} handson · {len(m['roles_funcion_excluida'])} func · "
              f"{len(m['ciudades'])} ciudades")


if __name__ == "__main__":
    main()
