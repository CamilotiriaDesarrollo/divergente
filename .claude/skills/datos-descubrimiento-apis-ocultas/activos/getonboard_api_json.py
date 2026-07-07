"""
scrapers/sitios/getonboard.py — Scraper de Get on Board (getonbrd.com).

Usa la API pública v0 (sin auth, validada en vivo junio 2026):
  Endpoint: https://www.getonbrd.com/api/v0/categories/{categoria}/jobs
  Doc:      https://www.getonbrd.com/api-docs

Estrategia:
- Recorre las categorías relevantes al perfil CT (datos, IA/ML, producto, innovación).
- Filtra por keywords en título + descripción (data, AI, analytics, product, director...).
- Filtra por ubicación: remoto, o país LATAM/Colombia.
- Filtra por seniority (default: Senior y Expert; ids del catálogo de la API).
- Devuelve list[Oferta] con tipo_oferta=empleo (o contractor si modality=Freelance).

Esta fuente sirve EXCLUSIVAMENTE a CT (roles senior remoto LATAM, muchos en USD).
Cubre tanto getonbrd.com (LATAM) como getonbrd.world (la API es la misma).
"""

from __future__ import annotations

import logging
import re
import unicodedata
from datetime import datetime, timezone
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

API_BASE = "https://www.getonbrd.com/api/v0"

# Categorías de la API relevantes al perfil CT (validadas contra /api/v0/categories)
CATEGORIAS_DEFAULT = [
    "data-science-analytics",
    "machine-learning-ai",
    "innovation-agile",
    "design-ux",
    "operations-management",
    "programming",
]

# Keywords (regex sobre texto normalizado sin tildes) en título o descripción.
# Perfil CT: datos, IA, analytics, producto digital, dirección/liderazgo.
KEYWORDS_PERFIL_CT = [
    r"\bdata\b",
    r"\bdatos\b",
    r"analytic",
    r"\banalitica\b",
    r"machine learning",
    r"\bml\b",
    r"\bai\b",
    r"\bia\b",
    r"inteligencia artificial",
    r"artificial intelligence",
    r"\bllm\b",
    r"\bgenai\b",
    r"generative",
    r"product",
    r"\bproducto\b",
    r"director",
    r"\blead\b",
    r"\bhead\b",
    r"\bcto\b",
    r"\bchief\b",
    r"\bvp\b",
    r"strategy",
    r"estrateg",
    r"\bbi\b",
    r"business intelligence",
    r"scientist",
    r"innovacion",
    r"innovation",
    r"govtech",
    r"transformacion digital",
    r"digital transformation",
]

# Países aceptados en el campo `countries` de la API ("Remote" es un valor real)
PAISES_OK = {
    "Remote",
    "Colombia",
    "Mexico",
    "México",
    "Peru",
    "Perú",
    "Chile",
    "Argentina",
    "Ecuador",
    "Uruguay",
    "Paraguay",
    "Bolivia",
    "Brazil",
    "Brasil",
    "Costa Rica",
    "Panama",
    "Panamá",
    "Guatemala",
    "Honduras",
    "El Salvador",
    "Nicaragua",
    "Dominican Republic",
    "Venezuela",
}

# Catálogo /api/v0/seniorities (validado junio 2026)
SENIORITY_MAP = {
    1: "Sin experiencia",
    2: "Junior",
    3: "Semi Senior",
    4: "Senior",
    5: "Expert",
}

# Catálogo /api/v0/modalities (validado junio 2026)
MODALITY_MAP = {
    1: "Full time",
    2: "Part time",
    3: "Freelance",
    4: "Práctica/Internship",
}

# Seniority mínimo para CT (10+ años, dirección): Senior (4) y Expert (5).
SENIORITY_IDS_DEFAULT = {4, 5}

# Etiquetas legibles para remote_modality de la API
REMOTE_MODALITY_LABELS = {
    "fully_remote": "Remoto global",
    "remote_local": "Remoto (zona limitada)",
    "hybrid": "Híbrido",
    "no_remote": "Presencial",
}

# Paginación conservadora
PER_PAGE = 25
MAX_PAGINAS_POR_CATEGORIA = 3

# Largo máximo de la descripción en la Oferta
DESCRIPCION_MAX_CHARS = 500


# ============================================================
# Scraper
# ============================================================

class GetOnBoardScraper(BaseScraper):
    """
    Scraper de Get on Board via API pública v0.

    Configurable:
      - categorias: override de la lista de categorías por defecto
      - keywords: override de los patrones regex de relevancia
      - seniority_ids: ids de seniority aceptados (default {4, 5} = Senior/Expert)
      - limit_total: hard cap de resultados (default 50)
    """

    nombre = "Get on Board"
    aplica_perfiles = ["CT"]

    def __init__(
        self,
        fuente_row: dict[str, Any],
        categorias: list[str] | None = None,
        keywords: list[str] | None = None,
        seniority_ids: set[int] | None = None,
        limit_total: int = 120,
    ):
        super().__init__(fuente_row)
        self.categorias = categorias or CATEGORIAS_DEFAULT
        self.keywords = [re.compile(k) for k in (keywords or KEYWORDS_PERFIL_CT)]
        self.seniority_ids = seniority_ids or SENIORITY_IDS_DEFAULT
        self.limit_total = limit_total

    def scrapear(self) -> list[Oferta]:
        """Recorre las categorías, pagina, filtra y deduplica. Devuelve Ofertas."""
        ofertas: dict[str, Oferta] = {}  # url → oferta (dedup interno)

        for categoria in self.categorias:
            for pagina in range(1, MAX_PAGINAS_POR_CATEGORIA + 1):
                try:
                    data = self._consultar_api(categoria, pagina)
                except Exception as e:
                    logger.warning(f"Get on Board: error en '{categoria}' p{pagina}: {e}")
                    break  # siguiente categoría

                jobs = data.get("data", []) if isinstance(data, dict) else []
                for raw in jobs:
                    try:
                        oferta = self._parse_job(raw)
                    except Exception as e:
                        logger.warning(f"Get on Board: error parseando job: {e}")
                        continue
                    if oferta and oferta.url_original not in ofertas:
                        ofertas[oferta.url_original] = oferta
                    if len(ofertas) >= self.limit_total:
                        logger.info(f"Get on Board: límite de {self.limit_total} alcanzado")
                        return list(ofertas.values())

                # No pedir más páginas de las que existen
                total_pages = (data.get("meta") or {}).get("total_pages", 1)
                if pagina >= total_pages:
                    break

        logger.info(f"Get on Board: {len(ofertas)} ofertas únicas tras filtros y dedup")
        return list(ofertas.values())

    # ---------- Métodos privados ----------
    def _consultar_api(self, categoria: str, pagina: int) -> dict[str, Any]:
        """GET /categories/{categoria}/jobs con company expandida."""
        url = f"{API_BASE}/categories/{categoria}/jobs"
        params = {
            "per_page": PER_PAGE,
            "page": pagina,
            "expand": '["company"]',
        }
        logger.debug(f"Get on Board query: cat='{categoria}' page={pagina}")
        data = self._get_json(url, params=params)
        if not isinstance(data, dict):
            return {}
        return data

    def _parse_job(self, raw: dict[str, Any]) -> Oferta | None:
        """Convierte un job de la API a Oferta. Devuelve None si no pasa filtros."""
        attrs = raw.get("attributes", {}) or {}
        links = raw.get("links", {}) or {}

        url = links.get("public_url", "")
        if not url:
            # Fallback: construir desde el slug del job
            slug = raw.get("id", "")
            if not slug:
                return None
            url = f"https://www.getonbrd.com/jobs/{slug}"

        titulo = (attrs.get("title") or "").strip()
        if not titulo:
            return None

        # Descartar prácticas/internships (modality 4): fuera del perfil CT
        modality_id = ((attrs.get("modality") or {}).get("data") or {}).get("id")
        if modality_id == 4:
            return None

        # Filtro de seniority (Senior/Expert por defecto)
        seniority_id = ((attrs.get("seniority") or {}).get("data") or {}).get("id")
        if seniority_id not in self.seniority_ids:
            return None

        # Filtro de ubicación: remoto, o país LATAM/Colombia
        countries: list[str] = attrs.get("countries") or []
        remoto = bool(attrs.get("remote")) or attrs.get("remote_modality") in (
            "fully_remote",
            "remote_local",
        )
        if not remoto and not any(c in PAISES_OK for c in countries):
            return None

        # Filtro de relevancia: keywords en título + descripción (sin HTML)
        descripcion_texto = self._html_a_texto(attrs.get("description") or "")
        texto_busqueda = _normalizar(f"{titulo} {descripcion_texto}")
        if not any(k.search(texto_busqueda) for k in self.keywords):
            return None

        # Empresa (viene expandida con expand=["company"])
        company_attrs = (
            ((attrs.get("company") or {}).get("data") or {}).get("attributes") or {}
        )
        empresa = (company_attrs.get("name") or "").strip()

        # Salario USD/mes si la API lo expone
        salario = self._formatear_salario(
            attrs.get("min_salary"), attrs.get("max_salary")
        )

        # Modalidad legible: remote_modality + tipo de jornada
        modalidad_partes = []
        rm = attrs.get("remote_modality") or ""
        if rm in REMOTE_MODALITY_LABELS:
            modalidad_partes.append(REMOTE_MODALITY_LABELS[rm])
        if modality_id in MODALITY_MAP:
            modalidad_partes.append(MODALITY_MAP[modality_id])
        modalidad = " · ".join(modalidad_partes)

        # tipo_oferta: Freelance en GoB ≈ contractor independiente
        tipo_oferta = "contractor" if modality_id == 3 else "empleo"

        # Ubicación legible
        ubicacion = ", ".join(countries) if countries else ("Remoto" if remoto else "")

        # Notas con metadata útil
        notas_partes = []
        pub_ts = attrs.get("published_at")
        if pub_ts:
            try:
                fecha_pub = datetime.fromtimestamp(int(pub_ts), tz=timezone.utc)
                notas_partes.append(f"Publicado: {fecha_pub.date().isoformat()}")
            except (ValueError, TypeError, OSError):
                pass
        if attrs.get("category_name"):
            notas_partes.append(f"Categoría: {attrs['category_name']}")
        if attrs.get("lang") and attrs["lang"] != "lang_not_specified":
            notas_partes.append(f"Idioma: {attrs['lang']}")

        return Oferta(
            fuente_id=self.fuente_id or "F082",
            fuente_nombre=self.fuente_nombre,
            tipo_oferta=tipo_oferta,
            titulo=titulo[:300],
            empresa_entidad=empresa,
            ubicacion=ubicacion,
            modalidad=modalidad,
            seniority=SENIORITY_MAP.get(seniority_id, ""),
            salario=salario,
            descripcion=descripcion_texto[:DESCRIPCION_MAX_CHARS],
            url_original=url,
            deadline="",  # la API no expone fecha de cierre
            notas=" · ".join(notas_partes),
        )

    @staticmethod
    def _html_a_texto(html: str) -> str:
        """Quita HTML y colapsa espacios."""
        if not html:
            return ""
        texto = BeautifulSoup(html, "lxml").get_text(separator=" ")
        return re.sub(r"\s+", " ", texto).strip()

    @staticmethod
    def _formatear_salario(min_s: Any, max_s: Any) -> str:
        """Formatea min/max USD mensuales que expone la API (pueden ser None)."""
        try:
            min_i = int(min_s) if min_s else 0
            max_i = int(max_s) if max_s else 0
        except (ValueError, TypeError):
            return ""
        if min_i and max_i:
            return f"USD {min_i:,}-{max_i:,}/mes"
        if min_i:
            return f"USD {min_i:,}+/mes"
        if max_i:
            return f"USD hasta {max_i:,}/mes"
        return ""


# ============================================================
# Test manual
# ============================================================
if __name__ == "__main__":
    import logging as lg

    lg.basicConfig(level=lg.INFO, format="%(levelname)s - %(name)s - %(message)s")

    # Simular una fila de FUENTES
    fuente_fake = {
        "id": "F082",
        "nombre": "Get on Board LATAM",
        "url_principal": "https://www.getonbrd.com/",
        "busqueda_sugerida_ct": "data OR analytics OR product OR innovation OR AI",
    }

    scraper = GetOnBoardScraper(fuente_fake, limit_total=50)

    print("Scrapeando Get on Board...")
    ofertas = scraper.scrapear()
    print(f"\n=== {len(ofertas)} ofertas encontradas ===\n")
    for o in ofertas[:5]:
        print(f"  [{o.tipo_oferta}] {o.titulo[:100]}")
        print(f"     {o.empresa_entidad} · {o.ubicacion} · {o.modalidad} · {o.seniority}")
        print(f"     salario: {o.salario or 'n/a'} · {o.notas}")
        print(f"     {o.url_original}")
        print()
