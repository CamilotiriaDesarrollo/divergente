"""
scrapers/sitios/reliefweb.py — Scraper de ReliefWeb Jobs (reliefweb.int).

NOTA SOBRE LA API (validado en vivo junio 2026):
- La API v1 (https://api.reliefweb.int/v1/jobs) fue DECOMISIONADA → HTTP 410:
  "The API version 'v1' has been decommissioned. Please use version 'v2' instead."
- La API v2 exige un `appname` APROBADO manualmente por ReliefWeb → HTTP 403
  anónimo ("You are not using an approved appname"). Registro:
  https://apidoc.reliefweb.int/parameters#appname
- ALTERNATIVA implementada aquí: el feed RSS público de jobs, que acepta la
  MISMA sintaxis de búsqueda del sitio (Lucene-like, campos country.exact,
  type.exact, etc.) sin auth:
    https://reliefweb.int/jobs/rss.xml?search=<query>
  Devuelve máx ~20 items por query; por eso se lanzan varias queries temáticas.

Estrategia:
- Una query RSS por tema relevante a CT y DIV (data, digital, information
  management, M&E, innovation, culture) + filtro de ubicación en la query.
- Post-filtro de ubicación: Colombia, país LATAM, sin país (global) o
  mención de remote/home-based en título o inicio del cuerpo.
- tipo_oferta: STTA si el título sugiere consultoría; empleo en caso contrario.
- deadline del tag "Closing date" embebido en la descripción del RSS.

Esta fuente sirve a CT (roles data/IM/innovación en cooperación) y a DIV
(consultorías institucionales para Divergente AMC).
"""

from __future__ import annotations

import logging
import re
import unicodedata
from datetime import date, datetime
from typing import Any

from bs4 import BeautifulSoup

from scrapers.base import BaseScraper, Oferta

logger = logging.getLogger(__name__)


def _normalizar(texto: str) -> str:
    """Minúsculas sin tildes, para comparaciones robustas (convención del proyecto)."""
    s = unicodedata.normalize("NFKD", texto or "")
    s = "".join(c for c in s if not unicodedata.combining(c))
    return s.lower()


# ============================================================
# Configuración del scraper
# ============================================================

RSS_URL = "https://reliefweb.int/jobs/rss.xml"

# Para cuando el usuario obtenga un appname aprobado y se migre a la API v2:
API_V2_URL = "https://api.reliefweb.int/v2/jobs"
APPNAME = "scraper-empleos-divergente"  # pendiente de aprobación por ReliefWeb

# Cláusula de ubicación reutilizada en las queries (sintaxis de búsqueda RW)
_LOC = '(country.exact:"Colombia" OR remote OR "home-based")'

# Queries temáticas (perfil CT: data/IM/innovación · perfil DIV: consultoría/cultura)
QUERIES_DEFAULT = [
    f'"information management" AND {_LOC}',
    f"(data OR analytics) AND {_LOC}",
    f"(digital OR technology) AND {_LOC}",
    f'("monitoring and evaluation" OR MEAL) AND {_LOC}',
    f"innovation AND {_LOC}",
    f'("information system" OR GIS OR ICT OR "knowledge management") AND {_LOC}',
    '(culture OR cultural) AND (country.exact:"Colombia" OR remote)',
    'type.exact:"Consultancy" AND (data OR digital OR "information management" OR innovation)',
    'country.exact:"Colombia"',  # todo Colombia; el filtro de relevancia por título decide
    # Paula — comunicación, periodismo, medios, advocacy en cooperación/humanitario
    f'(communications OR "public information" OR "communications officer") AND {_LOC}',
    f"(advocacy OR journalism OR media OR editorial) AND {_LOC}",
]

# Keywords de relevancia (regex sobre el TÍTULO normalizado). Se aplican solo
# al título porque la búsqueda full-text del RSS matchea cuerpos enteros y casi
# toda vacante humanitaria menciona "data" o "monitoring" en algún párrafo.
KEYWORDS_RELEVANCIA = [
    r"\bdata\b",
    r"\bdatos\b",
    r"database",
    r"analytic",
    r"digital",
    r"information",
    r"\bgis\b",
    r"\bict\b",
    r"monitoring",
    r"evaluation",
    r"\bmeal\b",
    r"\bm&e\b",
    r"innovation",
    r"innovacion",
    r"technolog",
    r"tecnolog",
    r"knowledge management",
    r"artificial intelligence",
    r"\bai\b",
    r"cultur",
    # Paula — comunicación, periodismo, medios
    r"communicat",
    r"comunicac",
    r"\bmedia\b",
    r"journalis",
    r"periodis",
    r"advocacy",
    r"editorial",
    r"storytelling",
]

# Países aceptados (normalizados sin tildes) en el tag Country del RSS.
# "world" aparece en algunas vacantes globales.
PAISES_LATAM = {
    "colombia",
    "mexico",
    "peru",
    "ecuador",
    "chile",
    "argentina",
    "brazil",
    "bolivia",
    "uruguay",
    "paraguay",
    "venezuela",
    "panama",
    "costa rica",
    "guatemala",
    "honduras",
    "el salvador",
    "nicaragua",
    "dominican republic",
    "cuba",
    "haiti",
    "world",
}

# Señales de trabajo remoto. Solo se evalúan sobre el TÍTULO: escanear el
# cuerpo deja pasar vacantes presenciales (Uganda, Jordania...) cuyo texto
# menciona "remote" incidentalmente. Las remotas reales en ReliefWeb o lo
# dicen en el título o no tienen tag de país (caso cubierto aparte).
REGEX_REMOTO = re.compile(r"\b(remote|home[- ]?based|teletrabajo|remoto)\b")

# Señales de consultoría/STTA en el título
REGEX_CONSULTORIA = re.compile(r"\b(consultan|consultor|consultancy|stta|short[- ]term)")

# Largo máximo de la descripción en la Oferta
DESCRIPCION_MAX_CHARS = 500


# ============================================================
# Scraper
# ============================================================

class ReliefWebScraper(BaseScraper):
    """
    Scraper de ReliefWeb Jobs via RSS público (fallback de la API v2, ver docstring).

    Configurable:
      - queries: override de las queries temáticas por defecto
      - limit_total: hard cap de resultados (default 50)
    """

    nombre = "ReliefWeb Jobs"
    aplica_perfiles = ["CT", "DIV", "PAU"]

    def __init__(
        self,
        fuente_row: dict[str, Any],
        queries: list[str] | None = None,
        limit_total: int = 50,
    ):
        super().__init__(fuente_row)
        self.queries = queries or QUERIES_DEFAULT
        self.limit_total = limit_total
        self.keywords = [re.compile(k) for k in KEYWORDS_RELEVANCIA]

    def scrapear(self) -> list[Oferta]:
        """Recorre las queries RSS, filtra, deduplica por URL. Devuelve Ofertas."""
        ofertas: dict[str, Oferta] = {}  # url → oferta (dedup interno)

        for query in self.queries:
            try:
                items = self._consultar_rss(query)
            except Exception as e:
                logger.warning(f"ReliefWeb: error con query '{query[:60]}...': {e}")
                continue

            for item in items:
                try:
                    oferta = self._parse_item(item)
                except Exception as e:
                    logger.warning(f"ReliefWeb: error parseando item: {e}")
                    continue
                if oferta and oferta.url_original not in ofertas:
                    ofertas[oferta.url_original] = oferta
                if len(ofertas) >= self.limit_total:
                    logger.info(f"ReliefWeb: límite de {self.limit_total} alcanzado")
                    return list(ofertas.values())

        logger.info(f"ReliefWeb: {len(ofertas)} ofertas únicas tras filtros y dedup")
        return list(ofertas.values())

    # ---------- Métodos privados ----------
    def _consultar_rss(self, query: str) -> list[Any]:
        """GET del RSS con la query de búsqueda; devuelve los <item> parseados."""
        logger.debug(f"ReliefWeb query RSS: {query}")
        soup = self._get_soup_xml(RSS_URL, params={"search": query})
        return soup.find_all("item")

    def _get_soup_xml(self, url: str, params: dict | None = None) -> BeautifulSoup:
        """
        Variante XML de BaseScraper._get_soup (el parser lxml-HTML rompe
        los tags del RSS). Mantiene delay y timeout de config.
        """
        import time

        import config

        time.sleep(config.DELAY_BETWEEN_REQUESTS)
        r = self.session.get(url, params=params, timeout=config.REQUEST_TIMEOUT)
        r.raise_for_status()
        return BeautifulSoup(r.text, "xml")

    def _parse_item(self, item: Any) -> Oferta | None:
        """Convierte un <item> del RSS a Oferta. Devuelve None si no pasa filtros."""
        titulo = item.find("title").text.strip() if item.find("title") else ""
        url = item.find("link").text.strip() if item.find("link") else ""
        if not titulo or not url:
            return None

        # La descripción del RSS trae HTML escapado con divs de metadata:
        #   <div class="tag country">Countries: X, Y</div>
        #   <div class="tag source">Organization: Z</div>
        #   <div class="date closing">Closing date: 31 Aug 2026</div>
        desc_raw = item.find("description").text if item.find("description") else ""
        dsoup = BeautifulSoup(desc_raw, "lxml")

        paises = self._extraer_tag(dsoup, "country")    # "Country: X" / "Countries: X, Y"
        organizacion = self._extraer_tag(dsoup, "source")  # "Organization: Z"
        closing_raw = self._extraer_tag(dsoup, "closing")  # "Closing date: 31 Aug 2026"

        # Cuerpo sin los divs de metadata
        for div in dsoup.find_all("div"):
            div.decompose()
        cuerpo = re.sub(r"\s+", " ", dsoup.get_text(separator=" ")).strip()

        # ---- Filtro de ubicación ----
        lista_paises = [p.strip() for p in paises.split(",") if p.strip()]
        paises_norm = {_normalizar(p) for p in lista_paises}
        titulo_norm = _normalizar(titulo)
        ubicacion_ok = (
            not lista_paises                     # sin país → global/remota
            or paises_norm & PAISES_LATAM        # Colombia / LATAM / World
            or REGEX_REMOTO.search(titulo_norm)  # remoto declarado en el título
        )
        if not ubicacion_ok:
            return None

        # ---- Filtro de relevancia (sobre el título, ver KEYWORDS_RELEVANCIA) ----
        if not any(k.search(titulo_norm) for k in self.keywords):
            return None

        # ---- Deadline ("Closing date: 31 Aug 2026") ----
        deadline = self._parse_closing(closing_raw)
        if deadline:
            try:
                if date.fromisoformat(deadline) < date.today():
                    return None  # ya cerró
            except ValueError:
                pass

        # ---- tipo_oferta: consultoría/STTA vs empleo ----
        tipo_oferta = "STTA" if REGEX_CONSULTORIA.search(_normalizar(titulo)) else "empleo"

        # ---- Notas ----
        notas_partes = ["Vía RSS ReliefWeb"]
        pub = item.find("pubDate")
        if pub and pub.text:
            try:
                fecha_pub = datetime.strptime(
                    pub.text.strip(), "%a, %d %b %Y %H:%M:%S %z"
                )
                notas_partes.append(f"Publicado: {fecha_pub.date().isoformat()}")
            except ValueError:
                pass

        ubicacion = ", ".join(lista_paises)
        if not ubicacion:
            ubicacion = "Remoto/global"  # sin país en RW ≈ vacante global/remota

        return Oferta(
            fuente_id=self.fuente_id or "F117",
            fuente_nombre=self.fuente_nombre,
            tipo_oferta=tipo_oferta,
            titulo=titulo[:300],
            empresa_entidad=organizacion,
            ubicacion=ubicacion,
            modalidad="Remoto" if REGEX_REMOTO.search(_normalizar(titulo)) else "",
            seniority="",  # el RSS no expone seniority
            salario="",    # ReliefWeb casi nunca publica salario
            descripcion=cuerpo[:DESCRIPCION_MAX_CHARS],
            url_original=url,
            deadline=deadline,
            notas=" · ".join(notas_partes),
        )

    @staticmethod
    def _extraer_tag(dsoup: BeautifulSoup, clase: str) -> str:
        """Extrae el valor de un div de metadata ('Prefijo: valor' → 'valor')."""
        div = dsoup.find("div", class_=clase)
        if not div:
            return ""
        texto = div.get_text(separator=" ").strip()
        # Quitar prefijo "Country:", "Countries:", "Organization:", "Closing date:"
        if ":" in texto:
            texto = texto.split(":", 1)[1]
        return texto.strip()

    @staticmethod
    def _parse_closing(closing_raw: str) -> str:
        """'31 Aug 2026' → '2026-08-31'. Devuelve '' si no parsea."""
        if not closing_raw:
            return ""
        try:
            return datetime.strptime(closing_raw.strip(), "%d %b %Y").date().isoformat()
        except ValueError:
            return ""


# ============================================================
# Test manual
# ============================================================
if __name__ == "__main__":
    import logging as lg

    lg.basicConfig(level=lg.INFO, format="%(levelname)s - %(name)s - %(message)s")

    # Simular una fila de FUENTES
    fuente_fake = {
        "id": "F117",
        "nombre": "ReliefWeb Jobs",
        "url_principal": "https://reliefweb.int/jobs",
        "busqueda_sugerida_ct": "information management data innovation consultant",
    }

    scraper = ReliefWebScraper(fuente_fake, limit_total=50)

    print("Scrapeando ReliefWeb Jobs (RSS)...")
    ofertas = scraper.scrapear()
    print(f"\n=== {len(ofertas)} ofertas encontradas ===\n")
    for o in ofertas[:5]:
        print(f"  [{o.tipo_oferta}] {o.titulo[:100]}")
        print(f"     {o.empresa_entidad} · {o.ubicacion or 'n/a'}")
        print(f"     deadline: {o.deadline or 'n/a'} · {o.notas}")
        print(f"     {o.url_original}")
        print()
