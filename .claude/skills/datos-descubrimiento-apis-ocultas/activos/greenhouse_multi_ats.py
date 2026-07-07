"""
scrapers/sitios/greenhouse_multi.py — Greenhouse ATS (múltiples orgs de impacto/tech).

Consulta la API pública de Greenhouse para un conjunto curado de organizaciones
de impacto, investigación y tecnología que publican en Greenhouse.

Endpoint: GET https://boards-api.greenhouse.io/v1/boards/{slug}/jobs?content=true

Organizaciones incluidas (slug → nombre):
  - anthropic     → Anthropic
  - mozilla       → Mozilla Foundation
  - aclu          → American Civil Liberties Union (ACLU)
  - khanacademy   → Khan Academy
  - duolingo      → Duolingo
  - mattermost    → Mattermost (open-source comms)

Fuente F001 — aplica CT (tech, IA, datos, producto, impacto).
Nota: Wikimedia (F005) ya tiene su propio scraper; se omite aquí.
"""

from __future__ import annotations

import logging
import re
from typing import Any

from scrapers.base import BaseScraper, Oferta

logger = logging.getLogger(__name__)

# Orgs curadas: slug → nombre de empresa
GREENHOUSE_ORGS: dict[str, str] = {
    "anthropic": "Anthropic",
    "mozilla": "Mozilla Foundation",
    "aclu": "ACLU",
    "khanacademy": "Khan Academy",
    "duolingo": "Duolingo",
    "mattermost": "Mattermost",
}

GREENHOUSE_API = "https://boards-api.greenhouse.io/v1/boards/{slug}/jobs"
BASE_JOB_URL = "https://job-boards.greenhouse.io/{slug}/jobs/{job_id}"

# Filtro de relevancia CT
_KEYWORDS_CT = re.compile(
    r"\b(data|analytic|engineer|developer|product|research|policy|strateg|"
    r"information|digital|technolog|privacy|security|infrastructure|devops|"
    r"machine.?learning|AI|software|program|manager|director|lead|senior|"
    r"scientist|intelligence|automation|platform|growth|insight|bi\b|"
    r"model|pipeline|governance|architect)\b",
    re.IGNORECASE,
)

_EXCLUIR = re.compile(r"\b(intern|volunteer|fellow)\b", re.IGNORECASE)


class GreenhouseMultiScraper(BaseScraper):
    """Scraper multi-org de Greenhouse ATS (F001)."""

    nombre = "Greenhouse Job Boards (ATS)"
    aplica_perfiles = ["CT"]

    def scrapear(self) -> list[Oferta]:
        ofertas: list[Oferta] = []
        for slug, empresa in GREENHOUSE_ORGS.items():
            try:
                jobs = self._fetch_jobs(slug)
                for job in jobs:
                    o = self._parse_job(job, slug, empresa)
                    if o:
                        ofertas.append(o)
                logger.info(f"Greenhouse/{slug}: {sum(1 for o in ofertas if o.empresa_entidad == empresa)} ofertas")
            except Exception as e:
                logger.warning(f"Greenhouse/{slug}: error → {e}")
        logger.info(f"Greenhouse total: {len(ofertas)} ofertas")
        return ofertas

    def _fetch_jobs(self, slug: str) -> list[dict]:
        data = self._get_json(
            GREENHOUSE_API.format(slug=slug),
            params={"content": "false"},
        )
        return data.get("jobs", []) if isinstance(data, dict) else []

    def _parse_job(self, job: dict, slug: str, empresa: str) -> Oferta | None:
        titulo = (job.get("title") or "").strip()
        job_id = job.get("id", "")
        if not titulo or not job_id:
            return None
        if _EXCLUIR.search(titulo):
            return None
        if not _KEYWORDS_CT.search(titulo):
            return None

        url = job.get("absolute_url") or BASE_JOB_URL.format(slug=slug, job_id=job_id)

        loc = job.get("location", {})
        ubicacion = (loc.get("name") or "Remote").strip() if isinstance(loc, dict) else "Remote"
        loc_lower = ubicacion.lower()
        if "remote" in loc_lower:
            modalidad = "Remoto"
        elif "hybrid" in loc_lower:
            modalidad = "Híbrido"
        else:
            modalidad = ""

        depts = job.get("departments", [])
        dept = ", ".join(d.get("name", "") for d in depts if d.get("name")) if depts else ""

        return Oferta(
            fuente_id=self.fuente_id or "F001",
            fuente_nombre=self.fuente_nombre,
            tipo_oferta="empleo",
            titulo=titulo[:300],
            empresa_entidad=empresa[:150],
            ubicacion=ubicacion[:100],
            modalidad=modalidad,
            seniority="",
            salario="",
            descripcion="",
            url_original=url,
            deadline="",
            notas=f"Greenhouse/{slug}" + (f" | Dept: {dept}" if dept else ""),
        )


if __name__ == "__main__":
    import logging as lg
    import sys

    sys.stdout.reconfigure(encoding="utf-8")
    lg.basicConfig(level=lg.INFO, format="%(levelname)s - %(name)s - %(message)s")
    r = GreenhouseMultiScraper({"id": "F001", "nombre": "Greenhouse Job Boards (ATS)"}).scrapear()
    print(f"\n=== {len(r)} ofertas ===")
    for o in r[:10]:
        print(f"  {o.titulo[:60]} | {o.empresa_entidad} | {o.ubicacion[:30]}")
        print(f"    {o.url_original[:80]}")
