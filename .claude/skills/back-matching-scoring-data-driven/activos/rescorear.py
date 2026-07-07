"""Re-aplica el matcher sobre data/ofertas_latest.json SIN volver a scrapear.

Cuando se afinan keywords/calibración en matcher.py o perfiles.json, los scores
del último scrape quedan viejos. Este script recalcula `score_match` y
`perfiles_match` con el matcher actual, replicando el enrutamiento MUTUAMENTE
EXCLUYENTE de main.py (paso 3): una oferta va a UN solo perfil.

PRESERVA la curaduría: `estado` y `notas` NO se tocan. Una oferta aprobada/
rechazada sigue igual; una sin-match que ahora matchea queda 'pendiente' con su
nuevo perfil, lista para curar.

Uso:
  python scripts/rescorear.py            # dry-run: reporta el delta, no escribe
  python scripts/rescorear.py --apply    # reescribe ofertas_latest.json
"""

from __future__ import annotations

import argparse
import json
import sys
from collections import Counter
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(BASE_DIR))
sys.stdout.reconfigure(encoding="utf-8")

import matcher  # noqa: E402

LATEST = BASE_DIR / "data" / "ofertas_latest.json"

# Espejo de main.py paso 3 (enrutamiento exclusivo).
UMBRAL_MATCH = 50
CANALES_ACTIVOS = {"CT", "DIV"}
TIPOS_CT = {"empleo", "contractor", "fractional", "freelance"}
TIPOS_DIV = {"convocatoria_publica", "contrato", "licitacion"}


def enrutar(oferta: dict) -> tuple[dict[str, int], list[str]]:
    """Devuelve (score_match, perfiles_match) con la lógica de main.py."""
    scores = matcher.scorear_ambos(oferta)
    score_match = {p: s.score for p, s in scores.items()}
    ct_ok = "CT" in CANALES_ACTIVOS and scores["CT"].score >= UMBRAL_MATCH
    div_ok = "DIV" in CANALES_ACTIVOS and scores["DIV"].score >= UMBRAL_MATCH

    tipo = oferta.get("tipo_oferta", "")
    if tipo in TIPOS_CT:
        matches = ["CT"] if ct_ok else []
    elif tipo in TIPOS_DIV:
        matches = ["DIV"] if div_ok else []
    else:  # ambiguos: al de mayor score (empate → CT)
        if ct_ok and div_ok:
            matches = ["CT"] if scores["CT"].score >= scores["DIV"].score else ["DIV"]
        elif ct_ok:
            matches = ["CT"]
        elif div_ok:
            matches = ["DIV"]
        else:
            matches = []
    return score_match, matches


def perfil_de(pm_raw) -> str:
    """Perfil único de un perfiles_match (string JSON o lista) para comparar."""
    try:
        pm = json.loads(pm_raw) if isinstance(pm_raw, str) else pm_raw
    except (json.JSONDecodeError, TypeError):
        pm = []
    return pm[0] if pm else ""


def main() -> int:
    ap = argparse.ArgumentParser(description="Re-scorea ofertas_latest.json sin scrapear.")
    ap.add_argument("--apply", action="store_true", help="Reescribe (default: dry-run)")
    args = ap.parse_args()

    if not LATEST.exists():
        print(f"No existe {LATEST}")
        return 1

    ofertas = json.loads(LATEST.read_text(encoding="utf-8"))
    total = len(ofertas)

    antes = Counter(perfil_de(o.get("perfiles_match")) or "(sin match)" for o in ofertas)
    transiciones: Counter = Counter()
    cambiadas = 0

    for o in ofertas:
        viejo = perfil_de(o.get("perfiles_match"))
        score_match, matches = enrutar(o)
        nuevo = matches[0] if matches else ""
        if viejo != nuevo:
            cambiadas += 1
            transiciones[f"{viejo or '∅'} → {nuevo or '∅'}"] += 1
        # Reescribir en el MISMO formato (strings JSON), sin tocar estado/notas
        o["score_match"] = json.dumps(score_match, ensure_ascii=False)
        o["perfiles_match"] = json.dumps(matches, ensure_ascii=False)

    despues = Counter(perfil_de(o.get("perfiles_match")) or "(sin match)" for o in ofertas)

    print(f"Re-score de {total} ofertas\n")
    print(f"{'perfil':<14}{'antes':>8}{'después':>10}")
    for k in sorted(set(antes) | set(despues)):
        print(f"{k:<14}{antes.get(k,0):>8}{despues.get(k,0):>10}")
    print(f"\nOfertas que cambiaron de perfil: {cambiadas}")
    if transiciones:
        print("Transiciones:")
        for t, n in transiciones.most_common():
            print(f"  {t}: {n}")

    # Cuántas CT quedan pendientes de curar
    ct_pend = sum(
        1 for o in ofertas
        if perfil_de(o.get("perfiles_match")) == "CT"
        and str(o.get("estado", "")).lower() in ("", "pendiente")
    )
    print(f"\nCT pendientes de curar tras re-score: {ct_pend}")

    if not args.apply:
        print("\n[DRY-RUN] No se escribió. Corre con --apply para guardar.")
        return 0

    LATEST.write_text(json.dumps(ofertas, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"\n✓ Reescrito {LATEST}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
