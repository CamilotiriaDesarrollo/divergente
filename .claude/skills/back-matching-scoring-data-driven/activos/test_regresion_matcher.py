"""
scripts/test_regresion_matcher.py — Red de seguridad del refactor data-driven.

Garantiza que generalizar matcher.py a N perfiles NO altera el scoring de los
perfiles ya calibrados (CT y DIV). Patrón:

  1. ANTES de tocar el matcher:   python scripts/test_regresion_matcher.py --baseline
     → scorea las ofertas de data/ofertas_latest.json con el matcher actual y
       guarda {hash: {CT, DIV}} en data/_regresion_baseline.json
  2. DESPUÉS del refactor:        python scripts/test_regresion_matcher.py --check
     → re-scorea y compara contra el baseline. Diff esperado: 0.

El hash identifica la oferta (mismo del dedup). Comparamos el score entero
0-100 de CT y DIV; las razones (texto) pueden cambiar de formato sin romper.
"""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

# Consola Windows en cp1252 rompe con flechas/acentos; forzar UTF-8.
try:
    sys.stdout.reconfigure(encoding="utf-8")
except Exception:
    pass

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

import matcher  # noqa: E402
from scrapers.base import calcular_hash_oferta  # noqa: E402

RAIZ = Path(__file__).resolve().parent.parent
OFERTAS = RAIZ / "data" / "ofertas_latest.json"
BASELINE = RAIZ / "data" / "_regresion_baseline.json"

PERFILES_REGRESION = ["CT", "DIV"]


def _hash_de(o: dict) -> str:
    return calcular_hash_oferta(
        o.get("fuente_nombre", ""), o.get("titulo", ""), o.get("empresa_entidad", "")
    )


def _scorear_todas() -> dict[str, dict[str, int]]:
    ofertas = json.loads(OFERTAS.read_text(encoding="utf-8"))
    out: dict[str, dict[str, int]] = {}
    for o in ofertas:
        h = _hash_de(o)
        fila: dict[str, int] = {}
        for p in PERFILES_REGRESION:
            fila[p] = matcher.scorear(o, p).score
        out[h] = fila
    return out


def generar_baseline() -> None:
    datos = _scorear_todas()
    BASELINE.write_text(json.dumps(datos, ensure_ascii=False, indent=0), encoding="utf-8")
    print(f"Baseline generado: {len(datos)} ofertas → {BASELINE.name}")


def verificar() -> int:
    if not BASELINE.exists():
        print("ERROR: no hay baseline. Corre primero --baseline (antes del refactor).")
        return 2
    base = json.loads(BASELINE.read_text(encoding="utf-8"))
    actual = _scorear_todas()

    difs: list[str] = []
    faltan = 0
    for h, fila_base in base.items():
        fila_now = actual.get(h)
        if fila_now is None:
            faltan += 1
            continue
        for p in PERFILES_REGRESION:
            if fila_base.get(p) != fila_now.get(p):
                difs.append(f"  {h[:10]}… {p}: {fila_base.get(p)} → {fila_now.get(p)}")

    print(f"Ofertas en baseline: {len(base)} · re-scoreadas: {len(actual)}")
    if faltan:
        print(f"⚠ {faltan} ofertas del baseline ya no están (¿cambió el dataset?)")
    if difs:
        print(f"✖ REGRESIÓN: {len(difs)} scores cambiaron:")
        print("\n".join(difs[:40]))
        if len(difs) > 40:
            print(f"  … y {len(difs) - 40} más")
        return 1
    print("✓ Sin regresión: todos los scores CT/DIV son idénticos.")
    return 0


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("--baseline", action="store_true", help="genera el baseline (correr ANTES del refactor)")
    ap.add_argument("--check", action="store_true", help="compara contra el baseline (correr DESPUÉS)")
    args = ap.parse_args()

    if args.baseline:
        generar_baseline()
    elif args.check:
        sys.exit(verificar())
    else:
        ap.print_help()
