"""
scrapers/sitios/cultured.py — Scraper de CultuRed (convocatorias culturales Bogotá).

CultuRed (https://cultured.gov.co) es el portal oficial consolidado del sector
cultura de Bogotá desde 2026 — reemplazó al SICON de la SCRD (sicon.scrd.gov.co
hoy solo muestra un aviso de migración). Cubre convocatorias de IDARTES, SCRD,
FUGA, OFB y demás entidades del sector.

El sitio es una SPA (React) — requiere Playwright. El listado de abiertas vive
en /todo/convocatorias-abiertas; cada card enlaza a /detalle/convocatorias/{id}
y trae: título, fecha de cierre, # estímulos, monto, estado, área y entidad.

OJO: las fechas usan guion no-rompible U+2011 ("2026‑07‑03") — se normaliza.

Fuente F008 (registrada como "IDARTES" en el Excel; la entidad real de cada
convocatoria va en empresa_entidad). Aplica CT y DIV.
"""

from __future__ import annotations

import logging
import re
from typing import Any

from scrapers.base import Oferta
from scrapers.base_playwright import BasePlaywrightScraper

logger = logging.getLogger(__name__)

URL_ABIERTAS = "https://cultured.gov.co/todo/convocatorias-abiertas"
BASE = "https://cultured.gov.co"

# JS: desde el enlace "Ver más", subir hasta el ancestro que contiene UNA sola
# vez "Fecha de cierre" — ese es el card individual (los wrappers contienen todas).
JS_TEXTO_CARD = """
e => {
  let n = e;
  while (n.parentElement) {
    const t = n.innerText || '';
    const c = (t.match(/Fecha de cierre/g) || []).length;
    if (c === 1 && t.length > 40) return t;
    n = n.parentElement;
  }
  return e.innerText || '';
}
"""


class CulturedScraper(BasePlaywrightScraper):
    """Scraper de convocatorias culturales abiertas en CultuRed Bogotá."""

    nombre = "CultuRed Bogotá"
    aplica_perfiles = ["CT", "DIV", "PAU"]

    def __init__(self, fuente_row: dict[str, Any], limit_total: int = 60):
        super().__init__(fuente_row)
        self.limit_total = limit_total

    def scrapear(self) -> list[Oferta]:
        ofertas: dict[str, Oferta] = {}

        with self.pagina() as page:
            page.goto(URL_ABIERTAS, wait_until="domcontentloaded")
            page.wait_for_timeout(6000)
            # Scroll para disparar lazy-load de toda la lista
            for _ in range(6):
                page.mouse.wheel(0, 2500)
                page.wait_for_timeout(700)

            links = page.locator('a[href*="/detalle/convocatorias/"]')
            total = links.count()
            logger.info(f"CultuRed: {total} cards en el listado")

            for i in range(min(total, self.limit_total)):
                try:
                    el = links.nth(i)
                    href = el.get_attribute("href") or ""
                    texto = el.evaluate(JS_TEXTO_CARD) or ""
                    oferta = self._parse_card(href, texto)
                except Exception as e:
                    logger.warning(f"CultuRed: error en card {i}: {e}")
                    continue
                if oferta and oferta.url_original not in ofertas:
                    ofertas[oferta.url_original] = oferta

        logger.info(f"CultuRed: {len(ofertas)} convocatorias únicas")
        return list(ofertas.values())

    # ---------- Privados ----------
    def _parse_card(self, href: str, texto: str) -> Oferta | None:
        if not href:
            return None
        url = href if href.startswith("http") else f"{BASE}{href}"

        # Normalizar guiones no-rompibles y trocear líneas
        texto = texto.replace("‑", "-").replace("‐", "-")
        lineas = [l.strip() for l in texto.split("\n") if l.strip()]
        if not lineas:
            return None

        titulo = lineas[0]
        if not titulo or titulo.lower().startswith("ver m"):
            return None

        def campo(prefijo: str) -> str:
            for l in lineas:
                if l.lower().startswith(prefijo.lower()):
                    return l.split(":", 1)[-1].strip()
            return ""

        deadline = ""
        m = re.search(r"Fecha de cierre:?\s*(\d{4}-\d{2}-\d{2})", texto)
        if m:
            deadline = m.group(1)

        monto = ""
        m = re.search(r"Monto del recurso:?\s*\|?\s*(\$[\s\d.,]+)", texto)
        if m:
            monto = re.sub(r"\s+", " ", m.group(1)).strip()

        entidad = campo("Entidad") or "Sector Cultura Bogotá"
        area = campo("Área") or campo("Area")
        estimulos = campo("Estimulos") or campo("Estímulos")

        desc_partes = []
        if area:
            desc_partes.append(f"Área: {area}")
        if estimulos:
            desc_partes.append(f"Estímulos: {estimulos}")
        desc_partes.append("Convocatoria del Programa Distrital de Estímulos / sector cultura Bogotá (CultuRed).")

        return Oferta(
            fuente_id=self.fuente_id or "F008",
            fuente_nombre=self.fuente_nombre,
            tipo_oferta="convocatoria_cultural",
            titulo=titulo[:300],
            empresa_entidad=entidad,
            ubicacion="Bogotá, Colombia",
            modalidad="",
            seniority="",
            salario=monto,
            descripcion=" · ".join(desc_partes)[:500],
            url_original=url,
            deadline=deadline,
            notas="Portal: cultured.gov.co (consolidado IDARTES/SCRD/FUGA/OFB)",
        )


# ============================================================
# Test manual
# ============================================================
if __name__ == "__main__":
    import logging as lg
    import sys

    sys.stdout.reconfigure(encoding="utf-8")
    lg.basicConfig(level=lg.INFO, format="%(levelname)s - %(name)s - %(message)s")

    fuente_fake = {"id": "F008", "nombre": "IDARTES",
                   "url_principal": "https://cultured.gov.co/"}
    ofertas = CulturedScraper(fuente_fake).scrapear()
    print(f"\n=== {len(ofertas)} convocatorias ===")
    for o in ofertas[:8]:
        print(f"  {o.titulo[:70]} | {o.empresa_entidad} | cierra: {o.deadline or 'n/a'} | {o.salario or '-'}")
        print(f"     {o.url_original}")
