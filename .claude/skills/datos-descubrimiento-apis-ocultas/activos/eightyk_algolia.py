"""
scrapers/sitios/eightyk.py — Scraper de 80,000 Hours Job Board (Algolia).

API pública expuesta en el HTML (Nuxt config):
  appId: W6KM1UDIB3 | apiKey: d1d7f2c8696e7b36837d5ed337c4a319 | index: jobs_prod

Filtra por:
  - Áreas relevantes: AI safety & policy, policy-focused, global health/dev, biosecurity
  - Ubicación: Remote/Global (la mayoría del board es UK/USA)
  - Excluye: internships, cursos, voluntariados

Fuente F072 — aplica CT (impacto, estrategia, política de IA).
Nota: los empleos son de orgs EA (effective altruism) — por definición relevantes para
perfil de alto impacto, aunque el salario puede estar en GBP/USD.
"""

from __future__ import annotations

import logging
import json
import re
from datetime import datetime, timezone
from typing import Any
from urllib.request import Request, urlopen

from scrapers.base import BaseScraper, Oferta
from scrapers.perfil_keywords import normalizar

logger = logging.getLogger(__name__)

ALGOLIA_URL = "https://W6KM1UDIB3-dsn.algolia.net/1/indexes/jobs_prod/query"
ALGOLIA_APP_ID = "W6KM1UDIB3"
ALGOLIA_API_KEY = "d1d7f2c8696e7b36837d5ed337c4a319"

# Áreas relevantes en el índice Algolia de 80k Hours
AREAS_CT = [
    "AI safety & policy",
    "Other policy-focused",
    "Global health & development",
    "Biosecurity & pandemic preparedness",
    "Macrostrategy",
    "Climate change",
]

# Tipos que excluir
TIPOS_EXCLUIDOS = {"Internship", "Course", "Volunteering"}

# Ubicaciones que se aceptan (incluye "Remote, Global", "Global", "Various, Global", etc.)
_PAT_REMOTE_GLOBAL = re.compile(
    r"\bremote\b|\bglobal\b|\banywhere\b|\blatam\b|\blatin america\b|\bcolombia\b|\bmexico\b",
    re.IGNORECASE,
)


def _ts_to_iso(ts: int | None) -> str:
    if not ts:
        return ""
    try:
        return datetime.fromtimestamp(ts, tz=timezone.utc).strftime("%Y-%m-%d")
    except Exception:
        return ""


class EightyKScraper(BaseScraper):
    """Scraper del job board de 80,000 Hours vía Algolia."""

    nombre = "80,000 Hours Jobs"
    aplica_perfiles = ["CT"]

    def __init__(self, fuente_row: dict[str, Any], limit_total: int = 40):
        super().__init__(fuente_row)
        self.limit_total = limit_total

    def scrapear(self) -> list[Oferta]:
        ofertas: dict[str, Oferta] = {}

        for page in range(3):  # 3 páginas × 20 hits = hasta 60
            try:
                hits = self._query_algolia(page)
            except Exception as e:
                logger.warning(f"80kHours: error página {page}: {e}")
                break

            if not hits:
                break

            for h in hits:
                try:
                    oferta = self._parse_hit(h)
                except Exception as e:
                    logger.warning(f"80kHours: error en hit: {e}")
                    continue

                if oferta and oferta.url_original not in ofertas:
                    ofertas[oferta.url_original] = oferta

                if len(ofertas) >= self.limit_total:
                    logger.info(f"80kHours: límite {self.limit_total} alcanzado")
                    return list(ofertas.values())

        logger.info(f"80kHours: {len(ofertas)} ofertas únicas tras filtros")
        return list(ofertas.values())

    # ---------- Privados ----------

    def _query_algolia(self, page: int) -> list[dict]:
        areas_filter = " OR ".join(f'tags_area:"{a}"' for a in AREAS_CT)
        location_filter = (
            'tags_location_type:Remote OR tags_location_80k:"Remote, Global" '
            'OR tags_location_80k:Global OR tags_location_80k:"Various, Global"'
        )
        payload = json.dumps({
            "hitsPerPage": 20,
            "page": page,
            "filters": f"({areas_filter}) AND ({location_filter})",
            "facetFilters": [
                ["tags_role_type:Full-time", "tags_role_type:Part-time",
                 "tags_role_type:Fellowship", "tags_role_type:Funding"]
            ],
            "attributesToRetrieve": [
                "title", "url_external", "closes_at", "card_locations",
                "company_name", "salary", "tags_area", "tags_role_type",
                "description_short", "tags_location_80k",
            ],
        }).encode()

        req = Request(ALGOLIA_URL, data=payload, method="POST", headers={
            "X-Algolia-Application-Id": ALGOLIA_APP_ID,
            "X-Algolia-API-Key": ALGOLIA_API_KEY,
            "Content-Type": "application/json",
        })
        resp = urlopen(req, timeout=12)
        return json.loads(resp.read()).get("hits", [])

    def _parse_hit(self, h: dict) -> Oferta | None:
        titulo = (h.get("title") or "").strip()
        url = (h.get("url_external") or "").strip()
        if not titulo or not url:
            return None

        tipos = set(h.get("tags_role_type") or [])
        if tipos & TIPOS_EXCLUIDOS:
            return None

        locs = h.get("card_locations") or h.get("tags_location_80k") or []
        loc_str = ", ".join(locs[:2]) if isinstance(locs, list) else str(locs)

        # Aceptar solo si hay al menos una ubicación remota/global
        if locs and not any(_PAT_REMOTE_GLOBAL.search(str(l)) for l in locs):
            return None

        empresa = (h.get("company_name") or "").strip()
        salario = (h.get("salary") or "").strip()
        deadline = _ts_to_iso(h.get("closes_at"))

        areas = h.get("tags_area") or []
        desc_raw = re.sub(r"<[^>]+>", " ", h.get("description_short") or "")
        desc = re.sub(r"\s+", " ", desc_raw).strip()[:400]
        notas = f"Área EA: {', '.join(areas)}" if areas else "80,000 Hours"

        tipo_oferta = "STTA" if "Fellowship" in tipos or "Funding" in tipos else "empleo"

        return Oferta(
            fuente_id=self.fuente_id or "F072",
            fuente_nombre=self.fuente_nombre,
            tipo_oferta=tipo_oferta,
            titulo=titulo[:300],
            empresa_entidad=empresa[:150],
            ubicacion=loc_str[:100] or "Remote/Global",
            modalidad="Remoto",
            seniority="",
            salario=salario[:80],
            descripcion=desc,
            url_original=url,
            deadline=deadline,
            notas=notas,
        )


if __name__ == "__main__":
    import logging as lg
    import sys

    sys.stdout.reconfigure(encoding="utf-8")
    lg.basicConfig(level=lg.INFO, format="%(levelname)s - %(name)s - %(message)s")
    ofertas = EightyKScraper({"id": "F072", "nombre": "80,000 Hours Jobs"}).scrapear()
    print(f"\n=== {len(ofertas)} ofertas ===")
    for o in ofertas[:8]:
        print(f"  [{o.tipo_oferta}] {o.titulo[:60]} | {o.empresa_entidad[:25]} | {o.ubicacion[:30]}")
        print(f"    {o.notas} | {o.salario[:30]} | cierra: {o.deadline or 'n/a'}")
        print(f"    {o.url_original[:90]}")
