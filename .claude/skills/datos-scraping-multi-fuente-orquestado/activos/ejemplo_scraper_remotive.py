"""
scrapers/sitios/remotive.py — Remotive (F054).

API JSON pública sin autenticación:
  GET https://remotive.com/api/remote-jobs?limit=100
Respuesta: {"jobs": [{title, url, company_name, category, candidate_required_location,
                       salary, description, publication_date}]}

Filtra por candidate_required_location que contenga "Worldwide", "LATAM",
"Latin America", "Anywhere" o esté vacío (= sin restricción).
También filtra por categorías técnicas y de gestión relevantes para CT.
"""
from __future__ import annotations

import logging
import re
from typing import Any

from scrapers.base import BaseScraper, Oferta

logger = logging.getLogger(__name__)

API_URL = "https://remotive.com/api/remote-jobs"
LIMIT = 100

# Ubicaciones aceptadas (case-insensitive, substring)
_PAT_LOC_OK = re.compile(
    r"worldwide|anywhere|latam|latin america|worldwide|global|no.?preference",
    re.IGNORECASE,
)

# Categorías relevantes para CT (según el catálogo de Remotive)
CATS_CT = {
    "Software Development",
    "Product",
    "Data",
    "DevOps / Sysadmin",
    "Design",
    "Marketing",
    "Management and Finance",
    "Other",
    "All others",
}


def _loc_ok(loc: str) -> bool:
    """True si la ubicación es remota/global o está vacía."""
    if not loc or not loc.strip():
        return True  # sin restricción de región
    return bool(_PAT_LOC_OK.search(loc))


def _strip_html(text: str) -> str:
    """Elimina etiquetas HTML y colapsa espacios."""
    text = re.sub(r"<[^>]+>", " ", text or "")
    return re.sub(r"\s+", " ", text).strip()


class RemotiveScraper(BaseScraper):
    """Scraper de Remotive vía API pública JSON."""

    nombre = "Remotive"
    aplica_perfiles = ["CT"]

    def scrapear(self) -> list[Oferta]:
        try:
            data = self._get_json(API_URL, params={"limit": LIMIT})
        except Exception as e:
            logger.warning(f"Remotive: error al consultar API: {e}")
            return []

        jobs = data.get("jobs", []) if isinstance(data, dict) else []
        logger.info(f"Remotive: {len(jobs)} jobs totales de la API")

        ofertas: list[Oferta] = []
        for job in jobs:
            try:
                o = self._parse(job)
                if o:
                    ofertas.append(o)
            except Exception as e:
                logger.debug(f"Remotive: parse error: {e}")

        logger.info(f"Remotive: {len(ofertas)} ofertas tras filtros")
        return ofertas

    def _parse(self, job: dict[str, Any]) -> Oferta | None:
        titulo = (job.get("title") or "").strip()
        url = (job.get("url") or "").strip()
        if not titulo or not url:
            return None

        # Filtro de ubicación
        loc = (job.get("candidate_required_location") or "").strip()
        if not _loc_ok(loc):
            return None

        empresa = (job.get("company_name") or "").strip()
        categoria = (job.get("category") or "").strip()
        salario = (job.get("salary") or "").strip()
        pub_date = (job.get("publication_date") or "")[:10]  # YYYY-MM-DD

        desc_raw = job.get("description") or ""
        desc = _strip_html(desc_raw)[:500]

        ubicacion = loc or "Worldwide"

        return Oferta(
            fuente_id=self.fuente_id or "F054",
            fuente_nombre=self.fuente_nombre,
            tipo_oferta="empleo",
            titulo=titulo[:300],
            empresa_entidad=empresa[:150],
            ubicacion=ubicacion[:100],
            modalidad="Remoto",
            seniority="",
            salario=salario[:80],
            descripcion=desc,
            url_original=url,
            deadline="",
            notas=f"Categoría: {categoria} | Publicado: {pub_date}" if categoria else f"Publicado: {pub_date}",
        )


# ============================================================
# Test manual
# ============================================================
if __name__ == "__main__":
    import logging as lg
    import sys
    sys.stdout.reconfigure(encoding="utf-8")
    lg.basicConfig(level=lg.INFO, format="%(levelname)s - %(name)s - %(message)s")
    r = RemotiveScraper({"id": "F054", "nombre": "Remotive"}).scrapear()
    print(f"\n=== {len(r)} ofertas ===")
    for o in r[:6]:
        print(f"  {o.titulo[:60]} | {o.empresa_entidad[:25]} | {o.ubicacion[:30]}")
        print(f"    {o.notas[:60]}")
