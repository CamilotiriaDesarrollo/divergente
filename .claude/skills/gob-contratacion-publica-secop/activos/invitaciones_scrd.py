"""
scrapers/sitios/invitaciones_scrd.py — Invitaciones culturales de la Secretaría
de Cultura, Recreación y Deporte de Bogotá (invitaciones.scrd.gov.co).

Plataforma SPA (requiere Playwright). Lista invitaciones del sector cultura de
Bogotá (IDARTES, SCRD, …) en /dashboard; cada card enlaza a /verInvitacion/{id}
con el título. COMPLEMENTA a CultuRed: CultuRed cubre el Programa Distrital de
Estímulos; aquí están las INVITACIONES culturales (contrataciones, videotecas,
digitalización de cine, circulación…). Universo de Paula (cultura/audiovisual/cine)
y de DIV (Divergente puede licitar invitaciones del sector).

Fuente nueva (Fase 2b, onboarding Paula). Aplica PAU, DIV y CT.
"""

from __future__ import annotations

import logging
import re
from typing import Any

from scrapers.base import Oferta
from scrapers.base_playwright import BasePlaywrightScraper

logger = logging.getLogger(__name__)

BASE = "https://invitaciones.scrd.gov.co"
URL_DASHBOARD = f"{BASE}/dashboard"
RE_INVITACION = re.compile(r"/verInvitacion/\d+")


class InvitacionesSCRDScraper(BasePlaywrightScraper):
    """Invitaciones culturales del sector cultura de Bogotá (SCRD/IDARTES)."""

    nombre = "Invitaciones SCRD Bogotá"
    aplica_perfiles = ["PAU", "DIV", "CT"]

    def __init__(self, fuente_row: dict[str, Any], limit_total: int = 50):
        super().__init__(fuente_row)
        self.limit_total = limit_total

    def scrapear(self) -> list[Oferta]:
        ofertas: dict[str, Oferta] = {}

        with self.pagina() as page:
            page.goto(URL_DASHBOARD, wait_until="networkidle", timeout=45000)
            page.wait_for_timeout(3000)
            # Scroll para disparar lazy-load de toda la lista
            for _ in range(5):
                page.mouse.wheel(0, 2500)
                page.wait_for_timeout(600)

            links = page.locator('a[href*="/verInvitacion/"]')
            total = links.count()
            logger.info(f"Invitaciones SCRD: {total} links de invitación")

            for i in range(total):
                if len(ofertas) >= self.limit_total:
                    break
                try:
                    el = links.nth(i)
                    href = el.get_attribute("href") or ""
                    titulo = (el.inner_text() or "").strip()
                    oferta = self._parse(href, titulo)
                except Exception as e:
                    logger.warning(f"Invitaciones SCRD: error en card {i}: {e}")
                    continue
                if oferta and oferta.url_original not in ofertas:
                    ofertas[oferta.url_original] = oferta

        logger.info(f"Invitaciones SCRD: {len(ofertas)} invitaciones únicas")
        return list(ofertas.values())

    # ---------- Privados ----------
    def _parse(self, href: str, titulo: str) -> Oferta | None:
        if not href or not RE_INVITACION.search(href):
            return None
        if not titulo or len(titulo) < 8:
            return None
        url = href if href.startswith("http") else f"{BASE}{href}"

        # Muchos títulos terminan en "- IDARTES" / "- SCRD" → entidad
        entidad = "Sector Cultura Bogotá"
        m = re.search(r"-\s*([A-ZÁÉÍÓÚ][\w .]{2,40})\s*$", titulo)
        if m:
            entidad = m.group(1).strip()

        return Oferta(
            fuente_id=self.fuente_id or "F101",
            fuente_nombre=self.fuente_nombre,
            tipo_oferta="convocatoria_cultural",
            titulo=titulo[:300],
            empresa_entidad=entidad,
            ubicacion="Bogotá, Colombia",
            modalidad="",
            seniority="",
            salario="",
            descripcion="Invitación cultural del sector cultura de Bogotá (SCRD/IDARTES).",
            url_original=url,
            deadline="",
            notas="Portal: invitaciones.scrd.gov.co",
        )


# ============================================================
# Test manual
# ============================================================
if __name__ == "__main__":
    import logging as lg
    import sys

    sys.stdout.reconfigure(encoding="utf-8")
    lg.basicConfig(level=lg.INFO, format="%(levelname)s - %(name)s - %(message)s")

    fuente_fake = {"id": "F101", "nombre": "Invitaciones SCRD Bogotá",
                   "url_principal": BASE}
    ofertas = InvitacionesSCRDScraper(fuente_fake).scrapear()
    print(f"\n=== {len(ofertas)} invitaciones ===")
    for o in ofertas[:10]:
        print(f"  {o.titulo[:75]} | {o.empresa_entidad}")
        print(f"     {o.url_original}")
