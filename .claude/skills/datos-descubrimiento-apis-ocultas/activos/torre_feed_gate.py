"""
scrapers/sitios/torre.py — Scraper de Torre.ai (API de búsqueda pública).

Endpoint validado en vivo (junio 2026):
  POST https://search.torre.co/opportunities/_search?size=N
  body: {"and": [{"keyword": {"term": "...", "locale": "es"}},
                 {"status": {"code": "open"}}]}

Se ejecutan varias búsquedas con términos del perfil CT (automatización,
BI, producto, analítica, transformación digital) y se filtra por remoto
o ubicación LATAM/Colombia.

Fuente exclusiva CT (F094). URL pública del aviso: https://torre.ai/post/{id}
"""

from __future__ import annotations

import logging
import time
from typing import Any

import config
from scrapers.base import BaseScraper, Oferta
from scrapers.perfil_keywords import es_relevante, normalizar

logger = logging.getLogger(__name__)

SEARCH_URL = "https://search.torre.co/opportunities/_search"

# OJO (validado en vivo): el operador `keyword` de la API es ignorado por el
# backend (devuelve el feed completo, total ~22k, ordenado por recencia).
# Estrategia real: escanear UNA página grande del feed de oportunidades open
# y filtrar con el gate de títulos. Yield bajo pero gratis; si Torre arregla
# el keyword search, volver a queries específicas.
# Queries por perfil (término, locale). El scraper corre la UNIÓN; el gate +
# matcher + routing reparten cada oferta a su(s) perfil(es).
QUERIES_CT = [
    ("data analytics", "en"),
]
# Paula: comunicación, periodismo, contenido (LATAM, es/en).
QUERIES_PAU = [
    ("comunicación", "es"),
    ("periodismo", "es"),
    ("content strategy", "en"),
]
# Intercaladas para que ambos perfiles tengan cupo aunque se corte por límite.
QUERIES_DEFAULT = [
    q for i in range(max(len(QUERIES_CT), len(QUERIES_PAU)))
    for q in (QUERIES_CT[i:i + 1] + QUERIES_PAU[i:i + 1])
]

PAISES_OK = [
    "colombia", "mexico", "peru", "chile", "argentina", "ecuador",
    "uruguay", "paraguay", "bolivia", "brazil", "brasil", "costa rica",
    "panama", "guatemala", "venezuela", "latam", "latin america", "remote",
]

RESULTADOS_POR_QUERY = 30  # la API rechaza size>~50 con 400
OFFSETS = [0, 30, 60, 90, 120, 150]  # ~180 oportunidades recientes por run
DESCRIPCION_MAX_CHARS = 500


class TorreScraper(BaseScraper):
    """Scraper de Torre.ai vía su API de búsqueda de oportunidades."""

    nombre = "Torre.ai"
    aplica_perfiles = ["CT", "PAU"]

    def __init__(
        self,
        fuente_row: dict[str, Any],
        queries: list[tuple[str, str]] | None = None,
        limit_total: int = 70,
    ):
        super().__init__(fuente_row)
        self.queries = queries or QUERIES_DEFAULT
        self.limit_total = limit_total

    def scrapear(self) -> list[Oferta]:
        ofertas: dict[str, Oferta] = {}
        # Cupo POR TÉRMINO para que las queries de cada perfil tengan representación.
        por_query = max(12, self.limit_total // max(1, len(self.queries)))

        for termino, locale in self.queries:
            n_q = 0
            for offset in OFFSETS:
                try:
                    resultados = self._buscar(termino, locale, offset)
                except Exception as e:
                    logger.warning(f"Torre: error en query '{termino}' offset {offset}: {e}")
                    break
                if not resultados:
                    break
                for raw in resultados:
                    try:
                        oferta = self._parse_job(raw)
                    except Exception as e:
                        logger.warning(f"Torre: error parseando job: {e}")
                        continue
                    if oferta and oferta.url_original not in ofertas:
                        ofertas[oferta.url_original] = oferta
                        n_q += 1
                    if len(ofertas) >= self.limit_total:
                        logger.info(f"Torre: límite de {self.limit_total} alcanzado")
                        return list(ofertas.values())
                if n_q >= por_query:
                    break

        logger.info(f"Torre: {len(ofertas)} ofertas únicas tras filtros")
        return list(ofertas.values())

    # ---------- Privados ----------
    def _buscar(self, termino: str, locale: str, offset: int = 0) -> list[dict[str, Any]]:
        time.sleep(config.DELAY_BETWEEN_REQUESTS)
        body = {
            "and": [
                {"keyword": {"term": termino, "locale": locale}},
                {"status": {"code": "open"}},
            ]
        }
        r = self.session.post(
            SEARCH_URL,
            params={"size": RESULTADOS_POR_QUERY, "offset": offset},
            json=body,
            timeout=config.REQUEST_TIMEOUT,
        )
        r.raise_for_status()
        data = r.json()
        return data.get("results", []) if isinstance(data, dict) else []

    def _parse_job(self, raw: dict[str, Any]) -> Oferta | None:
        oid = raw.get("id") or ""
        titulo = (raw.get("objective") or "").strip()
        if not oid or not titulo:
            return None

        # La búsqueda de Torre es semántica y difusa (devuelve p.ej. agentes de
        # seguros para "automatización IA"): gate estricto sobre el título +
        # exclusión de roles comerciales/ventas que dominan el marketplace.
        titulo_norm = normalizar(titulo)
        if any(
            ruido in titulo_norm
            for ruido in (
                "seguros", "ventas", "comercial", "atencion al cliente",
                "call center", "telemarketing", "vendedor", "cobranza",
            )
        ):
            return None
        if not es_relevante(titulo):
            return None

        # Ubicación: remoto, o algún lugar LATAM
        remoto = bool(raw.get("remote"))
        lugares = [normalizar(loc) for loc in (raw.get("locations") or []) if loc]
        if not remoto and not any(
            any(p in lugar for p in PAISES_OK) for lugar in lugares
        ):
            return None

        # Compensación
        comp = (raw.get("compensation") or {}).get("data") or {}
        salario = self._formatear_salario(comp)

        # Tipo: Torre marca "gigs" y empleos según commitment/agreement
        tipo_raw = normalizar(str(raw.get("commitment") or "") + str(raw.get("opportunity") or ""))
        tipo_oferta = "contractor" if ("gig" in tipo_raw or "freelance" in tipo_raw) else "empleo"

        orgs = raw.get("organizations") or []
        empresa = (orgs[0].get("name") or "").strip() if orgs else ""

        deadline = (raw.get("deadline") or "")[:10]

        return Oferta(
            fuente_id=self.fuente_id or "F094",
            fuente_nombre=self.fuente_nombre,
            tipo_oferta=tipo_oferta,
            titulo=titulo[:300],
            empresa_entidad=empresa,
            ubicacion=", ".join(raw.get("locations") or []) or ("Remote" if remoto else ""),
            modalidad="Remoto" if remoto else "",
            seniority="",
            salario=salario,
            descripcion="",  # el search no trae descripción; el aviso vive en la URL
            url_original=f"https://torre.ai/post/{oid}",
            deadline=deadline,
            notas="",
        )

    @staticmethod
    def _formatear_salario(comp: dict[str, Any]) -> str:
        """Formatea compensación de Torre (rango + moneda + periodicidad)."""
        if not comp or comp.get("code") == "to-be-agreed":
            return ""
        cur = comp.get("currency") or ""
        min_a = comp.get("minAmount") or 0
        max_a = comp.get("maxAmount") or 0
        per = {"monthly": "mes", "yearly": "año", "hourly": "hora"}.get(
            comp.get("periodicity") or "", comp.get("periodicity") or ""
        )
        if min_a and max_a:
            return f"{cur} {min_a:,.0f}-{max_a:,.0f}/{per}"
        if min_a:
            return f"{cur} {min_a:,.0f}+/{per}"
        return ""


# ============================================================
# Test manual
# ============================================================
if __name__ == "__main__":
    import logging as lg
    import sys

    sys.stdout.reconfigure(encoding="utf-8")
    lg.basicConfig(level=lg.INFO, format="%(levelname)s - %(name)s - %(message)s")

    fuente_fake = {"id": "F094", "nombre": "Torre.ai",
                   "url_principal": "https://torre.ai/jobs"}
    ofertas = TorreScraper(fuente_fake).scrapear()
    print(f"\n=== {len(ofertas)} ofertas ===")
    for o in ofertas[:5]:
        print(f"  [{o.tipo_oferta}] {o.titulo[:80]} | {o.empresa_entidad} | {o.ubicacion[:40]} | {o.salario or 'sin salario'}")
        print(f"     {o.url_original} | cierra: {o.deadline or 'n/a'}")
