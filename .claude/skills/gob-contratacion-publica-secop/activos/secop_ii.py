"""
scrapers/sitios/secop_ii.py — Scraper de SECOP II (Colombia Compra Eficiente).

Usa la API oficial de datos.gov.co (Socrata):
  Endpoint: https://www.datos.gov.co/resource/jbjy-vk9h.json
  Doc:      https://www.datos.gov.co/Gastos-Gubernamentales/SECOP-II-Procesos-de-Contrataci-n/jbjy-vk9h

Estrategia:
- Filtra por "objeto_del_contrato" usando keywords del perfil DIV.
- Filtra por fecha de publicación (últimos N días configurables).
- Filtra por estado del proceso (publicado/recepción de ofertas, no cerrados).
- Devuelve list[Oferta] con tipo_oferta=convocatoria_publica.

Esta fuente sirve PRINCIPALMENTE a DIV (Persona Jurídica via Divergente AMC),
pero algunas convocatorias permiten contractor individual (CT).
"""

from __future__ import annotations

import logging
import unicodedata
from datetime import date, datetime, timedelta
from typing import Any

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

# Dataset SECOP II - Procesos de Contratación (validado mayo 2026)
# Resource ID: p6dx-8zbt (NO jbjy-vk9h, ése es "Contratos Electrónicos" = ya firmados)
API_URL = "https://www.datos.gov.co/resource/p6dx-8zbt.json"

# Keywords en el objeto contractual para filtrar (extraídas de tu BD curada)
KEYWORDS_OBJETO = [
    "inteligencia artificial",
    "analítica",
    "analitica",
    "observatorio",
    "plataforma digital",
    "sistema de información",
    "sistema de informacion",
    "transformación digital",
    "transformacion digital",
    "datos",
    "dashboard",
    "consultoría",
    "consultoria",
    "cultura",
    "patrimonio cultural",
    "innovación",
    "innovacion",
]

# Estados del proceso que nos interesan (abiertos a recibir ofertas)
# Basado en campo `estado_resumen` y `estado_de_apertura_del_proceso`
ESTADOS_RESUMEN_VALIDOS = [
    "presentación de oferta",
    "presentacion de oferta",
    "publicado",
    "convocado",
    "borrador",
    "recepción de ofertas",
    "recepcion de ofertas",
]

# Días hacia atrás para considerar procesos recientes
DIAS_RETROACTIVOS_DEFAULT = 14

# Límite por keyword para no saturar la API
LIMIT_POR_KEYWORD = 100

# Piso de valor del contrato (COP). El PLAN fija proyecto puntual ≥ 10M COP.
# Procesos con precio_base conocido por debajo de esto se descartan (ruido PSP admin).
# Los procesos SIN precio_base no se descartan por valor (pueden ser convocatorias válidas).
VALOR_MINIMO_DEFAULT = 10_000_000

# Exclusiones quirúrgicas: objetos contractuales inequívocamente operativos/manuales
# que nunca son el nicho de Camilo (datos/IA/cultura/consultoría). Se evita excluir
# términos ambiguos como "mantenimiento" o "suministro" (pueden ser de software/licencias).
# Se normalizan (sin tildes) porque se comparan contra el título normalizado.
EXCLUSIONES_OBJETO = [
    _normalizar(t)
    for t in (
        "apoyo a la gestion administrativa",
        "servicios generales",
        "operador logistico",
        "apoyo logistico",
        "poliza",
        "seguros que amparen",
        "agencia de seguros",
        "corredor de seguros",
        "corretaje de seguros",
        "vigilancia",
        "aseo y cafeteria",
        "cafeteria",
        "conductor",
        "mensajeria",
        "jardineria",
        "fumigacion",
        "combustible",
        "transporte escolar",
        "alimentacion escolar",
    )
]


# ============================================================
# Scraper
# ============================================================

class SECOPIIScraper(BaseScraper):
    """
    Scraper de SECOP II via API Socrata.

    Configurable:
      - dias_retroactivos: cuántos días atrás considerar (default 14)
      - keywords: override de la lista por defecto
      - limit_total: hard cap de resultados (default 200)
    """

    nombre = "SECOP II"
    aplica_perfiles = ["DIV", "CT"]  # principalmente DIV; algunos contratos PSP individuales para CT

    def __init__(
        self,
        fuente_row: dict[str, Any],
        dias_retroactivos: int = DIAS_RETROACTIVOS_DEFAULT,
        keywords: list[str] | None = None,
        limit_total: int = 500,
        valor_minimo: int = VALOR_MINIMO_DEFAULT,
    ):
        super().__init__(fuente_row)
        self.dias = dias_retroactivos
        self.keywords = keywords or KEYWORDS_OBJETO
        self.limit_total = limit_total
        self.valor_minimo = valor_minimo

    def scrapear(self) -> list[Oferta]:
        """Recorre las keywords, consulta la API, deduplica internamente, devuelve Ofertas."""
        ofertas: dict[str, Oferta] = {}  # url → oferta (dedup interno)
        fecha_desde = (date.today() - timedelta(days=self.dias)).isoformat()

        for kw in self.keywords:
            try:
                results = self._consultar_api(kw, fecha_desde)
            except Exception as e:
                logger.warning(f"SECOP II: error con keyword '{kw}': {e}")
                continue

            for raw in results:
                oferta = self._parse_record(raw)
                if oferta and oferta.url_original not in ofertas:
                    ofertas[oferta.url_original] = oferta
                if len(ofertas) >= self.limit_total:
                    logger.info(f"SECOP II: límite de {self.limit_total} alcanzado")
                    return list(ofertas.values())

        logger.info(f"SECOP II: {len(ofertas)} ofertas únicas tras dedup interno")
        return list(ofertas.values())

    # ---------- Métodos privados ----------
    def _consultar_api(self, keyword: str, fecha_desde: str) -> list[dict[str, Any]]:
        """
        Consulta la API de Socrata con un filtro por descripción del procedimiento.
        Usa $where para texto y fecha.
        """
        # SoQL: filtrar por descripción del procedimiento (contiene keyword) y fecha
        # Nota: el campo de fecha es timestamp; comparamos con isoformat completo
        where_clauses = [
            f"upper(descripci_n_del_procedimiento) like upper('%{keyword}%')",
            f"fecha_de_publicacion_del >= '{fecha_desde}T00:00:00.000'",
        ]
        params = {
            "$limit": LIMIT_POR_KEYWORD,
            "$where": " AND ".join(where_clauses),
            "$order": "fecha_de_publicacion_del DESC",
        }
        logger.debug(f"SECOP II query: kw='{keyword}' desde={fecha_desde}")
        data = self._get_json(API_URL, params=params)
        if not isinstance(data, list):
            return []
        return data

    def _parse_record(self, r: dict[str, Any]) -> Oferta | None:
        """
        Convierte un registro raw de Socrata a Oferta.

        Campos reales del dataset p6dx-8zbt:
          entidad, ciudad_entidad, departamento_entidad,
          nombre_del_procedimiento, descripci_n_del_procedimiento,
          fecha_de_publicacion_del, fecha_de_recepcion_de,
          precio_base, modalidad_de_contratacion, estado_resumen,
          estado_de_apertura_del_proceso, tipo_de_contrato, urlproceso (dict {url}).
        """
        # URL del proceso (es un dict {'url': '...'})
        url_field = r.get("urlproceso")
        if isinstance(url_field, dict):
            url_proceso = url_field.get("url", "")
        else:
            url_proceso = str(url_field) if url_field else ""

        if not url_proceso:
            return None  # sin URL no podemos linkear, descartamos

        titulo = (
            r.get("descripci_n_del_procedimiento")
            or r.get("nombre_del_procedimiento")
            or ""
        )
        if not titulo:
            return None

        # Filtro de exclusión: objetos operativos/manuales fuera del nicho
        titulo_norm = _normalizar(titulo)
        if any(excl in titulo_norm for excl in EXCLUSIONES_OBJETO):
            return None

        entidad = r.get("entidad", "")
        ciudad = r.get("ciudad_entidad", "")
        depto = r.get("departamento_entidad", "")
        ubicacion = ", ".join(filter(None, [ciudad, depto]))

        modalidad = r.get("modalidad_de_contratacion", "")
        fecha_pub = r.get("fecha_de_publicacion_del", "")
        deadline = r.get("fecha_de_recepcion_de", "")
        valor = r.get("precio_base", "")

        # Filtro: el proceso debe estar abierto (no adjudicado, no cerrado)
        estado_resumen = (r.get("estado_resumen", "") or "").strip().lower()
        estado_apertura = (r.get("estado_de_apertura_del_proceso", "") or "").strip().lower()

        valido = (
            any(e in estado_resumen for e in ESTADOS_RESUMEN_VALIDOS)
            or estado_apertura == "abierto"
        )
        if not valido:
            return None

        # Sanitizar deadline
        deadline_parsed = ""
        if deadline:
            try:
                deadline_parsed = datetime.fromisoformat(
                    str(deadline).replace("Z", "+00:00")
                ).date().isoformat()
            except (ValueError, TypeError):
                deadline_parsed = ""

        # Descartar si deadline ya pasó
        if deadline_parsed:
            try:
                if date.fromisoformat(deadline_parsed) < date.today():
                    return None
            except ValueError:
                pass

        # Parsear valor y aplicar piso (descarta PSP admin de bajo monto).
        # Si el valor no es parseable o es 0, NO se descarta por monto.
        valor_int: int | None = None
        if valor:
            try:
                valor_int = int(float(valor))
            except (ValueError, TypeError):
                valor_int = None

        if valor_int and 0 < valor_int < self.valor_minimo:
            return None

        # Formatear valor para mostrar
        salario_str = ""
        if valor_int and valor_int > 0:
            salario_str = f"COP {valor_int:,}".replace(",", ".")
        elif valor:
            salario_str = str(valor)

        # Notas con metadata útil
        tipo_contrato = r.get("tipo_de_contrato", "")
        notas_partes = []
        if estado_resumen:
            notas_partes.append(f"Estado: {estado_resumen}")
        if tipo_contrato:
            notas_partes.append(f"Tipo: {tipo_contrato}")
        if fecha_pub:
            notas_partes.append(f"Publicado: {fecha_pub[:10]}")

        return Oferta(
            fuente_id=self.fuente_id or "F_SECOP",
            fuente_nombre=self.fuente_nombre,
            tipo_oferta="convocatoria_publica",
            titulo=titulo[:300],
            empresa_entidad=entidad,
            ubicacion=ubicacion,
            modalidad=modalidad,
            seniority="",  # SECOP no expone seniority
            salario=salario_str,
            descripcion=titulo,  # objeto contractual ES la descripción
            url_original=url_proceso,
            deadline=deadline_parsed,
            notas=" · ".join(notas_partes),
        )


# ============================================================
# Test manual
# ============================================================
if __name__ == "__main__":
    import json
    import logging as lg

    lg.basicConfig(level=lg.INFO, format="%(levelname)s - %(name)s - %(message)s")

    # Simular una fila de FUENTES
    fuente_fake = {
        "id": "F001",
        "nombre": "SECOP II",
        "url_principal": "https://www.secop.gov.co/",
        "busqueda_sugerida_div": "inteligencia artificial OR analítica OR observatorio OR plataforma digital",
    }

    scraper = SECOPIIScraper(
        fuente_fake,
        dias_retroactivos=21,  # 3 semanas para tener volumen en test
        keywords=["inteligencia artificial", "observatorio", "cultura", "plataforma digital"],
        limit_total=30,
    )

    print("Scrapeando SECOP II...")
    ofertas = scraper.scrapear()
    print(f"\n=== {len(ofertas)} ofertas encontradas ===\n")
    for o in ofertas[:5]:
        print(f"  📄 {o.titulo[:100]}")
        print(f"     {o.empresa_entidad} · {o.ubicacion} · {o.modalidad}")
        print(f"     deadline: {o.deadline or 'n/a'} · valor: {o.salario or 'n/a'}")
        print(f"     {o.url_original}")
        print()
