"""
scripts/ingest_linkedin.py — Ingesta de la cosecha LinkedIn al pipeline.

LinkedIn (F039) NO se puede scrapear desatendido: requiere el navegador logueado
+ ritmo humano (ver memoria fase3-linkedin-chrome-mcp). El flujo es:

  1. Correr scripts/abrir_chrome_linkedin.ps1 (Chrome con sesión real en 9222).
  2. En una sesión de Claude Code, Claude maneja el navegador vía el MCP `chrome`,
     itera las búsquedas de bootstrap_output/linkedin_searches.json con PAUSAS,
     extrae las cards y escribe data/linkedin_raw.json.
  3. Este script normaliza ese raw y lo MERGEA (dedup por hash) en el store
     persistente data/linkedin_latest.json.
  4. main.py carga data/linkedin_latest.json en cada run, así las ofertas LinkedIn
     fluyen al pipeline (matcher + curaduría + Sheet) como una fuente más, y
     SOBREVIVEN a los re-scrapes (la curaduría se preserva vía ofertas_latest.json).

Uso:
  python scripts/ingest_linkedin.py            # mergea linkedin_raw.json -> linkedin_latest.json
  python scripts/ingest_linkedin.py --dry-run  # muestra qué haría, no escribe
"""

from __future__ import annotations

import argparse
import json
import re
import sys
from datetime import date
from pathlib import Path

sys.stdout.reconfigure(encoding="utf-8")
BASE_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(BASE_DIR))

from scrapers.base import calcular_hash_oferta  # noqa: E402

DATA_DIR = BASE_DIR / "data"
RAW = DATA_DIR / "linkedin_raw.json"
STORE = DATA_DIR / "linkedin_latest.json"

FUENTE_ID = "F039"
FUENTE_NOMBRE = "LinkedIn Jobs"

# Persistimos exactamente los campos del constructor de Oferta; los derivados
# (perfiles_match, score_match, estado, destinos) los recalcula/preserva main.py.

_MODALIDAD_RE = re.compile(r"\(([^)]+)\)\s*$")


def _parse_modalidad(ubicacion: str) -> tuple[str, str]:
    """De 'Bogotá, ... (Híbrido)' -> ('Bogotá, ...', 'Híbrido')."""
    m = _MODALIDAD_RE.search(ubicacion or "")
    if not m:
        return ubicacion.strip(), ""
    modal = m.group(1).strip()
    # Normalizar variantes
    low = modal.lower()
    if "remoto" in low or "remote" in low:
        modal = "Remoto"
    elif "híbrido" in low or "hibrido" in low or "hybrid" in low:
        modal = "Híbrido"
    elif "presencial" in low or "on-site" in low or "onsite" in low:
        modal = "Presencial"
    ubic = _MODALIDAD_RE.sub("", ubicacion).strip().rstrip("·").strip()
    return ubic, modal


def _normalizar_oferta(raw: dict) -> dict:
    titulo = (raw.get("titulo") or "").strip()
    empresa = (raw.get("empresa") or raw.get("empresa_entidad") or "").strip()
    ubic, modalidad = _parse_modalidad(raw.get("ubicacion") or "")
    url = (raw.get("url") or raw.get("url_original") or "").strip()
    search_id = raw.get("search_id", "")
    return {
        "fuente_id": FUENTE_ID,
        "fuente_nombre": FUENTE_NOMBRE,
        "tipo_oferta": "empleo",
        "titulo": titulo[:300],
        "url_original": url,
        "empresa_entidad": empresa[:150],
        "ubicacion": ubic[:120],
        "modalidad": modalidad,
        "seniority": "",
        "salario": "",
        "descripcion": "",
        "deadline": "",
        "notas": f"LinkedIn · búsqueda {search_id}" if search_id else "LinkedIn",
        "fecha_extraccion": date.today().isoformat(),
    }


def _hash(o: dict) -> str:
    return calcular_hash_oferta(o["fuente_nombre"], o["titulo"], o["empresa_entidad"])


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--dry-run", action="store_true")
    args = ap.parse_args()

    if not RAW.exists():
        print(f"[!] No existe {RAW}. Primero cosecha LinkedIn vía el MCP chrome.")
        sys.exit(1)

    raw_data = json.loads(RAW.read_text(encoding="utf-8"))
    raw_ofertas = raw_data.get("ofertas", raw_data) if isinstance(raw_data, dict) else raw_data

    nuevas = [_normalizar_oferta(r) for r in raw_ofertas if (r.get("titulo") and (r.get("url") or r.get("url_original")))]

    # Store existente
    existentes = []
    if STORE.exists():
        try:
            existentes = json.loads(STORE.read_text(encoding="utf-8"))
        except json.JSONDecodeError:
            existentes = []

    por_hash = {_hash(o): o for o in existentes}
    n_antes = len(por_hash)
    n_nuevas = 0
    for o in nuevas:
        h = _hash(o)
        if h not in por_hash:
            por_hash[h] = o
            n_nuevas += 1
        # si ya existe, conservamos la entrada vieja (fecha_extraccion original)

    final = list(por_hash.values())

    print(f"Cosecha cruda:        {len(raw_ofertas)} ofertas")
    print(f"Normalizadas válidas: {len(nuevas)}")
    print(f"Store antes:          {n_antes}")
    print(f"Nuevas agregadas:     {n_nuevas}")
    print(f"Store después:        {len(final)}")

    if args.dry_run:
        print("\n[DRY-RUN] No se escribió nada.")
        for o in nuevas[:10]:
            print(f"  - {o['titulo'][:55]} | {o['empresa_entidad'][:25]} | {o['ubicacion'][:30]} | {o['modalidad']}")
        return

    STORE.write_text(json.dumps(final, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"\n💾 Guardado: {STORE}")
    print("Siguiente: corre `python main.py` (o --upload) — LinkedIn ya entra al pipeline.")


if __name__ == "__main__":
    main()
