"""
scrapers/sitios/sinac.py — Scraper del SINAC (convocatorias Mincultura).

Sistema Nacional de Convocatorias del Ministerio de las Culturas:
https://sistemaconvocatorias.mincultura.gov.co

SPA con filtros; el listado de abiertas es accesible por URL directa:
  /dashboard?estado=1&programas[]=0&lineas_programa[]=0&estimulos[]=0&perfiles[]=0&search=

Cada card trae: título, programa/portafolio, fecha de apertura, fecha de
cierre (formato "16 junio del 2026 11:59 p. m.") y valor del estímulo.
Requiere Playwright (render JS).

Fuente F009 ("Mincultura SINAC", prioridad Muy alta). Aplica CT y DIV.
"""

from __future__ import annotations

import logging
import re
from typing import Any

from scrapers.base import Oferta
from scrapers.base_playwright import BasePlaywrightScraper

logger = logging.getLogger(__name__)

URL_ABIERTAS = (
    "https://sistemaconvocatorias.mincultura.gov.co/dashboard"
    "?estado=1&programas%5B%5D=0&lineas_programa%5B%5D=0"
    "&estimulos%5B%5D=0&perfiles%5B%5D=0&search="
)

MESES = {
    "enero": 1, "febrero": 2, "marzo": 3, "abril": 4, "mayo": 5, "junio": 6,
    "julio": 7, "agosto": 8, "septiembre": 9, "octubre": 10,
    "noviembre": 11, "diciembre": 12,
}

# Desde cualquier nodo con "Fecha de cierre", subir al card individual
JS_CARDS = """
() => {
  const todos = [...document.querySelectorAll('div, article, li')];
  const cards = todos.filter(n => {
    const t = n.innerText || '';
    return (t.match(/Fecha de cierre/g) || []).length === 1
        && (t.match(/Fecha de apertura/g) || []).length === 1
        && t.length > 60 && t.length < 2000;
  });
  // quedarse con los más internos (que no contengan a otro candidato)
  const hojas = cards.filter(c => !cards.some(o => o !== c && c.contains(o)));
  return hojas.map(c => {
    const a = c.querySelector('a[href]');
    return { texto: c.innerText, href: a ? a.href : '' };
  });
}
"""


class SINACScraper(BasePlaywrightScraper):
    """Scraper de convocatorias abiertas del SINAC (Mincultura)."""

    nombre = "Mincultura SINAC"
    aplica_perfiles = ["CT", "DIV", "PAU"]

    def __init__(self, fuente_row: dict[str, Any], limit_total: int = 60):
        super().__init__(fuente_row)
        self.limit_total = limit_total

    def scrapear(self) -> list[Oferta]:
        ofertas: dict[str, Oferta] = {}

        with self.pagina() as page:
            page.goto(URL_ABIERTAS, wait_until="domcontentloaded")
            page.wait_for_timeout(6000)
            for _ in range(4):
                page.mouse.wheel(0, 2500)
                page.wait_for_timeout(600)

            cards = page.evaluate(JS_CARDS) or []
            logger.info(f"SINAC: {len(cards)} cards en el listado")

            for i, card in enumerate(cards[: self.limit_total]):
                try:
                    oferta = self._parse_card(card.get("texto", ""), card.get("href", ""))
                except Exception as e:
                    logger.warning(f"SINAC: error en card {i}: {e}")
                    continue
                if oferta and oferta.url_original not in ofertas:
                    ofertas[oferta.url_original] = oferta

        logger.info(f"SINAC: {len(ofertas)} convocatorias únicas")
        return list(ofertas.values())

    # ---------- Privados ----------
    def _parse_card(self, texto: str, href: str) -> Oferta | None:
        lineas = [l.strip() for l in texto.split("\n") if l.strip()]
        if not lineas:
            return None

        titulo = lineas[0]
        if not titulo or len(titulo) < 5:
            return None

        programa = ""
        if len(lineas) > 1 and not lineas[1].lower().startswith("fecha"):
            programa = lineas[1]

        deadline = self._parse_fecha_es(texto, "Fecha de cierre")

        valor = ""
        m = re.search(r"Valor del est[ií]mulo[^:]*:\s*(\$[\d.,]+)", texto)
        if m:
            valor = m.group(1)

        # Sin href en la card: enlazar al listado filtrado (la convocatoria
        # se encuentra ahí por título)
        url = href or f"{URL_ABIERTAS}#{re.sub(r'[^a-z0-9]+', '-', titulo.lower())[:60]}"

        desc = f"Programa: {programa}. " if programa else ""
        desc += "Convocatoria del Sistema Nacional de Convocatorias de Mincultura."

        return Oferta(
            fuente_id=self.fuente_id or "F009",
            fuente_nombre=self.fuente_nombre,
            tipo_oferta="convocatoria_cultural",
            titulo=titulo[:300],
            empresa_entidad="Ministerio de las Culturas, las Artes y los Saberes",
            ubicacion="Colombia",
            modalidad="",
            seniority="",
            salario=valor,
            descripcion=desc[:500],
            url_original=url,
            deadline=deadline,
            notas="Portal: sistemaconvocatorias.mincultura.gov.co",
        )

    @staticmethod
    def _parse_fecha_es(texto: str, etiqueta: str) -> str:
        """Convierte '16 junio del 2026' (tras la etiqueta) a '2026-06-16'."""
        m = re.search(
            etiqueta + r":?\s*(\d{1,2})\s+(?:de\s+)?([a-záéíóú]+)\s+(?:del?\s+)?(\d{4})",
            texto,
            re.IGNORECASE,
        )
        if not m:
            return ""
        dia, mes_txt, anio = m.groups()
        mes = MESES.get(mes_txt.lower())
        if not mes:
            return ""
        return f"{anio}-{mes:02d}-{int(dia):02d}"


# ============================================================
# Test manual
# ============================================================
if __name__ == "__main__":
    import logging as lg
    import sys

    sys.stdout.reconfigure(encoding="utf-8")
    lg.basicConfig(level=lg.INFO, format="%(levelname)s - %(name)s - %(message)s")

    fuente_fake = {"id": "F009", "nombre": "Mincultura SINAC",
                   "url_principal": "https://sistemaconvocatorias.mincultura.gov.co/"}
    ofertas = SINACScraper(fuente_fake).scrapear()
    print(f"\n=== {len(ofertas)} convocatorias ===")
    for o in ofertas[:8]:
        print(f"  {o.titulo[:70]} | cierra: {o.deadline or 'n/a'} | {o.salario or '-'}")
        print(f"     {o.url_original[:100]}")
