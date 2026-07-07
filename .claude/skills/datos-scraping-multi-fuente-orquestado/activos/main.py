"""
main.py — Orquestador del scraping.

Flujo:
  1. Carga FUENTES activas (de bootstrap_output/fuentes.json o, si --sheet, desde el Sheet).
  2. Para cada fuente con scraper_class definido, instancia y ejecuta.
  3. Deduplica todas las ofertas (hash por título + empresa + fuente).
  4. Calcula score_match CT y DIV con matcher.py.
  5. Asigna `perfiles_match` y `destinos` según umbral y `aplica_ct/div`.
  6. Guarda en data/ofertas.json (modo local) o pushea al Sheet (modo --upload).

Uso:
  python main.py                       # corre todas las fuentes scrapeables (modo local)
  python main.py --fuente "SECOP II"   # corre una sola fuente
  python main.py --upload              # pushea al Sheet (requiere credenciales)
  python main.py --dry-run             # no guarda nada, solo log
"""

from __future__ import annotations

import argparse
import json
import logging
import sys
import time
from datetime import datetime
from pathlib import Path
from typing import Any

import config
import matcher
from scrapers.base import BaseScraper, Oferta, calcular_hash_oferta

# Importaciones de scrapers concretos
from scrapers.sitios.secop_ii import SECOPIIScraper
from scrapers.sitios.getonboard import GetOnBoardScraper
from scrapers.sitios.reliefweb import ReliefWebScraper
from scrapers.sitios.weworkremotely import WeWorkRemotelyScraper
from scrapers.sitios.remoteok import RemoteOKScraper
from scrapers.sitios.torre import TorreScraper
from scrapers.sitios.undp import UNDPScraper
from scrapers.sitios.techjobsforgood import TechJobsForGoodScraper
from scrapers.sitios.cultured import CulturedScraper
from scrapers.sitios.invitaciones_scrd import InvitacionesSCRDScraper
from scrapers.sitios.trabajosihay import TrabajoSiHayScraper
from scrapers.sitios.consejoderedaccion import ConsejoRedaccionScraper
from scrapers.sitios.latamjr import LatAmJRScraper
from scrapers.sitios.segib import SegibScraper
from scrapers.sitios.sinac import SINACScraper
from scrapers.sitios.elempleo import ElempleoScraper
from scrapers.sitios.computrabajo import ComputrabajoScraper
from scrapers.sitios.unesco import UNESCOScraper
from scrapers.sitios.eightyk import EightyKScraper
from scrapers.sitios.idealist import IdealistScraper
from scrapers.sitios.dynamite import DynamiteScraper
from scrapers.sitios.workingnomads import WorkingNomadsScraper
from scrapers.sitios.aijobs import AIJobsScraper
from scrapers.sitios.wikimedia import WikimediaScraper
from scrapers.sitios.theimpactjob import ImpactJobScraper
from scrapers.sitios.matteria import MateriaScraper
from scrapers.sitios.remoteimpact import RemoteImpactScraper
from scrapers.sitios.ffwd import FFWDScraper
from scrapers.sitios.osf import OSFScraper
# Bloque B — multilaterales
from scrapers.sitios.unjobs import UNJobsScraper
from scrapers.sitios.undp_procurement import UNDPProcurementScraper
from scrapers.sitios.mellon import MellonScraper
# Bloque C — remote/tech
from scrapers.sitios.remotive import RemotiveScraper
from scrapers.sitios.climatebase import ClimatebaseScraper
from scrapers.sitios.dailyremote import DailyRemoteScraper
from scrapers.sitios.jobgether import JobgetherScraper
from scrapers.sitios.builtin import BuiltInScraper
from scrapers.sitios.remoteco import RemoteCoScraper
# Bloque D — ATS multi-org + Escape the City
from scrapers.sitios.greenhouse_multi import GreenhouseMultiScraper
from scrapers.sitios.lever_multi import LeverMultiScraper
from scrapers.sitios.escapethecity import EscapeTheCityScraper
from scrapers.sitios.dataorg import DataOrgScraper

BASE_DIR = Path(__file__).resolve().parent
BOOTSTRAP_DIR = BASE_DIR / "bootstrap_output"
DATA_DIR = BASE_DIR / "data"
DATA_DIR.mkdir(exist_ok=True)


def normalizar_estado(e: str) -> str:
    """Convención canónica del campo estado (femenino). Tolera variantes viejas
    (aprobado/rechazado) y de género para que la curaduría no se pierda."""
    e = (e or "").strip().lower()
    if e.startswith("aprob"):
        return "aprobada"
    if e.startswith("rechaz"):
        return "rechazada"
    if e.startswith("pend"):
        return "pendiente"
    return e or "pendiente"


def _actualizar_historial(ts: str, stats_fuentes: dict[str, Any]) -> None:
    """Acumula métricas de cada run en data/fuentes_historial.json (rolling 30 runs)."""
    path = DATA_DIR / "fuentes_historial.json"
    historial: dict = {}
    if path.exists():
        try:
            historial = json.loads(path.read_text(encoding="utf-8"))
        except Exception:
            pass
    for nombre, f in stats_fuentes.items():
        entry = {
            "ts": ts,
            "n": f["scrapeadas"],
            "err": f["errores"],
            "dur": round(f.get("duracion_seg", 0.0), 1),
        }
        fuente_hist = historial.setdefault(nombre, {"runs": []})
        fuente_hist["runs"].append(entry)
        fuente_hist["runs"] = fuente_hist["runs"][-30:]
    path.write_text(json.dumps(historial, ensure_ascii=False, indent=2), encoding="utf-8")

logger = logging.getLogger(__name__)

# ============================================================
# Registro de scrapers
# ============================================================
# Mapea nombre_de_clase (columna scraper_class del Sheet) → clase Python.
# A medida que implementemos más scrapers en Fase 4, los registramos aquí.
SCRAPER_REGISTRY: dict[str, type[BaseScraper]] = {
    "SECOPIIScraper": SECOPIIScraper,
    "GetOnBoardScraper": GetOnBoardScraper,
    "ReliefWebScraper": ReliefWebScraper,
    "WeWorkRemotelyScraper": WeWorkRemotelyScraper,
    "RemoteOKScraper": RemoteOKScraper,
    "TorreScraper": TorreScraper,
    "UNDPScraper": UNDPScraper,
    "TechJobsForGoodScraper": TechJobsForGoodScraper,
    "CulturedScraper": CulturedScraper,
    "InvitacionesSCRDScraper": InvitacionesSCRDScraper,
    "TrabajoSiHayScraper": TrabajoSiHayScraper,
    "ConsejoRedaccionScraper": ConsejoRedaccionScraper,
    "LatAmJRScraper": LatAmJRScraper,
    "SegibScraper": SegibScraper,
    "SINACScraper": SINACScraper,
    "ElempleoScraper": ElempleoScraper,
    "ComputrabajoScraper": ComputrabajoScraper,
    "UNESCOScraper": UNESCOScraper,
    "EightyKScraper": EightyKScraper,
    "IdealistScraper": IdealistScraper,
    "DynamiteScraper": DynamiteScraper,
    "WorkingNomadsScraper": WorkingNomadsScraper,
    "AIJobsScraper": AIJobsScraper,
    # Bloque B — multilaterales
    "UNJobsScraper": UNJobsScraper,
    "UNDPProcurementScraper": UNDPProcurementScraper,
    "MellonScraper": MellonScraper,
    # Bloque D — ATS multi-org + Escape the City
    "GreenhouseMultiScraper": GreenhouseMultiScraper,
    "LeverMultiScraper": LeverMultiScraper,
    "EscapeTheCityScraper": EscapeTheCityScraper,
}

# Mapa por nombre de fuente (para fallback cuando scraper_class está vacío)
# Útil mientras no actualizamos el Excel con los scraper_class.
# Nota: "Get on Board World" (F083) NO se mapea — usa la misma API que LATAM
# (F082); mapear ambos scrapearía lo mismo dos veces con fuente_nombre distinto
# y el dedup por hash no los uniría.
NOMBRE_A_SCRAPER: dict[str, type[BaseScraper]] = {
    "SECOP II": SECOPIIScraper,
    "SECOP II + Colombia Compra Eficiente": SECOPIIScraper,
    "Get on Board LATAM": GetOnBoardScraper,
    "ReliefWeb Jobs": ReliefWebScraper,
    "We Work Remotely": WeWorkRemotelyScraper,        # F056
    "Remote OK": RemoteOKScraper,                     # F051
    "Torre.ai": TorreScraper,                         # F094
    # "UNDP Jobs — IC / empresa" (F120) NO se mapea: mismo portal que F119,
    # mapear ambos duplicaría el scrape (mismo caso que Get on Board World).
    "UNDP Jobs": UNDPScraper,                         # F119
    "Tech Jobs for Good": TechJobsForGoodScraper,     # F078
    # CultuRed (cultured.gov.co) es el portal consolidado del sector cultura
    # Bogotá: cubre IDARTES, SCRD, FUGA, OFB. Se mapea desde la fuente IDARTES.
    "IDARTES": CulturedScraper,                       # F008 (Playwright)
    "Invitaciones SCRD Bogotá": InvitacionesSCRDScraper,  # F101 (Playwright, cultura)
    "TrabajoSíHay": TrabajoSiHayScraper,              # F102 (RSS, sector creativo LATAM)
    "Consejo de Redacción": ConsejoRedaccionScraper,  # F103 (periodismo investigación CO)
    "LatAm Journalism Review": LatAmJRScraper,        # F104 (periodismo LATAM)
    "SEGIB": SegibScraper,                            # F105 (Playwright, cultura ibero)
    "Mincultura SINAC": SINACScraper,                 # F009 (Playwright)
    "elempleo.com": ElempleoScraper,                  # F106 (Playwright)
    "Computrabajo Colombia": ComputrabajoScraper,     # F102
    "UNESCO Careers — Consultor empresa": UNESCOScraper,  # F010
    "80,000 Hours Job Board": EightyKScraper,            # F072 (Algolia)
    "Idealist": IdealistScraper,                         # F062 (Algolia)
    "Dynamite Jobs": DynamiteScraper,                    # F043 (Algolia, low yield)
    "Working Nomads LATAM": WorkingNomadsScraper,         # F058
    "AI Jobs (ai-jobs.net)": AIJobsScraper,              # F036
    # Bloque B — multilaterales
    "UN Jobs": UNJobsScraper,                            # F118 (HTML estático)
    "UNDP Jobs – IC / empresa": UNDPProcurementScraper,  # F120 (procurement notices LATAM)
    "Mellon Foundation": MellonScraper,                  # F029 (HTML estático, ~4 pos)
    # Bloque C — remote/tech
    "Remotive": RemotiveScraper,                          # F054 (API JSON pública)
    "Climatebase": ClimatebaseScraper,                    # F004 (Next.js SSR)
    "DailyRemote": DailyRemoteScraper,                    # F042 (HTML estático)
    "Jobgether": JobgetherScraper,                        # F046 (sitemap XML + JSON-LD)
    "Built In": BuiltInScraper,                           # F041 (HTML estático)
    "Remote.co": RemoteCoScraper,                         # F053 (NEXT_DATA; anti-bot intermitente)
    # Bloque D — ATS multi-org + Escape the City
    "Greenhouse Job Boards (ATS)": GreenhouseMultiScraper,  # F001 (Greenhouse API pública)
    "Lever Jobs (ATS)": LeverMultiScraper,                  # F002 (Lever API pública)
    "Escape the City": EscapeTheCityScraper,                # F061 (Algolia admin-jobs)
    "data.org Jobs": DataOrgScraper,                        # F070
    # Bloque A — impacto social
    "Wikimedia Foundation Jobs": WikimediaScraper,        # F005 (Greenhouse API)
    "The Impact Job": ImpactJobScraper,                   # F067 (window.jobsList HTML)
    "Matteria": MateriaScraper,                           # F074 (jobs.matteria.co HTML)
    "Remote Impact": RemoteImpactScraper,                 # F076 (remoteimpact.org HTML)
    "Fast Forward Tech Nonprofit": FFWDScraper,           # F077 (jobs.ffwd.org SSR)
    "Open Society Foundations": OSFScraper,               # F030 (Workday API)
}


# ============================================================
# Carga de fuentes y perfiles
# ============================================================
def cargar_fuentes_locales() -> list[dict[str, Any]]:
    """Carga FUENTES desde bootstrap_output/fuentes.json (modo local)."""
    p = BOOTSTRAP_DIR / "fuentes.json"
    if not p.exists():
        raise FileNotFoundError(
            f"No existe {p}. Corre primero: python scripts/bootstrap_from_excel.py"
        )
    return json.loads(p.read_text(encoding="utf-8"))


def cargar_perfiles_locales() -> list[dict[str, Any]]:
    p = BOOTSTRAP_DIR / "perfiles.json"
    if not p.exists():
        raise FileNotFoundError(f"No existe {p}")
    return json.loads(p.read_text(encoding="utf-8"))


def cargar_linkedin_store() -> list[Oferta]:
    """Carga las ofertas LinkedIn cosechadas (data/linkedin_latest.json).

    El archivo lo produce scripts/ingest_linkedin.py tras una sesión MCP.
    Cada entrada trae exactamente los campos del constructor de Oferta.
    """
    p = DATA_DIR / "linkedin_latest.json"
    if not p.exists():
        return []
    try:
        filas = json.loads(p.read_text(encoding="utf-8"))
    except (json.JSONDecodeError, OSError) as e:
        logger.warning(f"No se pudo leer linkedin_latest.json: {e}")
        return []
    ofertas: list[Oferta] = []
    for d in filas:
        try:
            ofertas.append(Oferta(**d))
        except TypeError as e:
            logger.warning(f"Fila LinkedIn inválida (se omite): {e}")
    return ofertas


def filtrar_fuentes_activas_scrapeables(fuentes: list[dict[str, Any]]) -> list[dict[str, Any]]:
    """Solo fuentes con activo=True, scrapeable=True y scraper disponible."""
    out = []
    for f in fuentes:
        if not f.get("activo", True):
            continue
        if not f.get("scrapeable", True):
            continue
        # Hay scraper disponible para esta fuente?
        scraper_cls = f.get("scraper_class") or ""
        if scraper_cls and scraper_cls in SCRAPER_REGISTRY:
            out.append(f)
        elif f.get("nombre", "") in NOMBRE_A_SCRAPER:
            out.append(f)
        # Si no hay scraper, salta silenciosamente (lo implementamos en Fase 4)
    return out


def obtener_scraper(fuente: dict[str, Any]) -> type[BaseScraper] | None:
    """Resuelve la clase de scraper para una fuente."""
    sc = fuente.get("scraper_class")
    if sc and sc in SCRAPER_REGISTRY:
        return SCRAPER_REGISTRY[sc]
    return NOMBRE_A_SCRAPER.get(fuente.get("nombre", ""))


# ============================================================
# Subida al Sheet (modo --upload)
# ============================================================
class CredencialesFaltantesError(RuntimeError):
    """Faltan credenciales/SHEET_ID para el modo --upload. Se reporta limpio, sin traceback."""


def validar_credenciales_upload() -> None:
    """
    Verifica que existan SHEET_ID y el JSON del service account antes de tocar
    el Sheet. Lanza CredencialesFaltantesError con instrucciones si falta algo.
    """
    problemas: list[str] = []
    if not config.SHEET_ID:
        problemas.append("SHEET_ID está vacío en .env")
    if not config.GOOGLE_CREDENTIALS_PATH.exists():
        problemas.append(f"No existe el archivo de credenciales: {config.GOOGLE_CREDENTIALS_PATH}")
    if not problemas:
        return
    msg = (
        "No se puede usar --upload: faltan credenciales de Google Sheets.\n"
        + "".join(f"  - {p}\n" for p in problemas)
        + "Cómo resolverlo:\n"
        "  1. Crea el service account en Google Cloud y descarga su JSON\n"
        "     (ver PLAN.md, sección 'Pasos manuales pendientes').\n"
        f"  2. Guarda el archivo como: {config.GOOGLE_CREDENTIALS_PATH}\n"
        "  3. Comparte el Sheet con el email del service account (permiso Editor).\n"
        "Mientras tanto, corre sin --upload: las ofertas quedan en data/ofertas_*.json."
    )
    raise CredencialesFaltantesError(msg)


def subir_ofertas_al_sheet(
    ofertas: list[Oferta],
    stats_fuentes: dict[str, dict[str, Any]],
) -> dict[str, int]:
    """
    Sube las ofertas nuevas a la pestaña de SU perfil (OFERTAS_CT, OFERTAS_DIV, …)
    y registra el resultado en LOG.

    Cada oferta tiene a lo sumo UN perfil (enrutamiento exclusivo del paso 3 del
    pipeline). Se agrupan por perfil y, por cada perfil con ofertas:
      1. Asegura su pestaña OFERTAS_<perfil> (lazy, idempotente).
      2. UNA lectura de esa pestaña → hashes existentes + máximo id, compartida.
      3. Filtra duplicadas contra el histórico (mismo hash que Oferta.hash).
      4. Asigna ids consecutivos con prefijo (CT00001, DIV00001, …) y estado=pendiente.
      5. UN append batch a la pestaña del perfil.
    Las ofertas SIN match no se suben al Sheet (quedan en el JSON local de respaldo).
    Al final, UN append batch a LOG (una fila por fuente, global).

    En LOG, `duplicadas` por fuente = scrapeadas - nuevas subidas (incluye
    duplicados en memoria, duplicados contra el histórico y ofertas sin match).

    Devuelve {"nuevas": M, "duplicadas_sheet": K, "sin_match": S}.
    """
    validar_credenciales_upload()
    import sheets_client  # import tardío: solo --upload necesita gspread

    sheets_client.asegurar_pestanas_operacion()  # CONTROL/LOG/MANUAL

    # Agrupar por perfil único. Las sin match quedan fuera del Sheet.
    por_perfil: dict[str, list[Oferta]] = {}
    sin_match = 0
    for o in ofertas:
        if not o.perfiles_match:
            sin_match += 1
            continue
        por_perfil.setdefault(o.perfiles_match[0], []).append(o)

    nuevas_total = 0
    duplicadas_sheet = 0
    nuevas_por_fuente: dict[str, int] = {}

    for perfil, ofs in por_perfil.items():
        tab = config.tab_ofertas(perfil)
        sheets_client.asegurar_pestana_ofertas(perfil)
        # Una sola lectura de la pestaña del perfil, compartida entre hashes e ids
        registros = sheets_client.leer_pestana_como_dicts(tab)
        hashes_sheet = sheets_client.leer_hashes_ofertas(registros)
        n_siguiente = sheets_client.siguiente_id_oferta(registros)

        nuevas: list[Oferta] = []
        for o in ofs:
            if o.hash in hashes_sheet:
                duplicadas_sheet += 1
                continue
            nuevas.append(o)
            nuevas_por_fuente[o.fuente_nombre] = nuevas_por_fuente.get(o.fuente_nombre, 0) + 1

        filas: list[dict[str, Any]] = []
        for i, o in enumerate(nuevas):
            d = o.to_dict()
            d["id"] = sheets_client.formatear_id_oferta(n_siguiente + i, perfil)
            d["estado"] = "pendiente"
            filas.append(d)

        if filas:
            sheets_client.append_filas(tab, filas)
            logger.info(f"Sheet {tab}: {len(filas)} nuevas subidas (ids {filas[0]['id']}..{filas[-1]['id']})")
        else:
            logger.info(f"Sheet {tab}: nada nuevo que subir.")
        nuevas_total += len(nuevas)

    if duplicadas_sheet:
        logger.info(f"Duplicadas contra histórico del Sheet: {duplicadas_sheet} (no se suben).")
    if sin_match:
        logger.info(f"Sin match: {sin_match} (no van al Sheet; quedan en el JSON local).")

    # LOG: una fila por fuente, en un solo append batch (global, no por perfil)
    sheets_client.registrar_logs_scrape([
        {
            "fuente": nombre,
            "nuevas": nuevas_por_fuente.get(nombre, 0),
            "duplicadas": st.get("scrapeadas", 0) - nuevas_por_fuente.get(nombre, 0),
            "errores": st.get("errores", 0),
            "duracion_seg": st.get("duracion_seg", 0.0),
        }
        for nombre, st in stats_fuentes.items()
    ])

    return {"nuevas": nuevas_total, "duplicadas_sheet": duplicadas_sheet, "sin_match": sin_match}


# ============================================================
# Pipeline principal
# ============================================================
def ejecutar_scraping(
    fuente_filter: str | None = None,
    dry_run: bool = False,
    upload: bool = False,
) -> list[dict[str, Any]]:
    """
    Pipeline completo. Devuelve list[dict] (ofertas serializables).
    """
    if upload:
        # Fail-fast: validar credenciales ANTES de scrapear para no desperdiciar el run.
        validar_credenciales_upload()

    fuentes_all = cargar_fuentes_locales()
    perfiles = cargar_perfiles_locales()
    perfiles_activos = [p for p in perfiles if p.get("activo")]

    fuentes = filtrar_fuentes_activas_scrapeables(fuentes_all)
    if fuente_filter:
        fuentes = [f for f in fuentes if fuente_filter.lower() in f.get("nombre", "").lower()]

    logger.info(f"Fuentes a scrapear: {len(fuentes)}/{len(fuentes_all)}")
    if not fuentes:
        logger.warning("No hay fuentes para scrapear.")
        return []

    # 1. Ejecutar scrapers EN PARALELO (un worker por fuente; cada fuente es un
    # dominio distinto, así que no compiten por rate limits — el delay de
    # cortesía aplica dentro de cada scraper). Métricas por fuente para LOG.
    from concurrent.futures import ThreadPoolExecutor, as_completed

    def _scrape_fuente(f: dict[str, Any]) -> tuple[str, list[Oferta], dict[str, Any]]:
        cls = obtener_scraper(f)
        nombre = f["nombre"]
        t0 = time.perf_counter()
        stats: dict[str, Any] = {"scrapeadas": 0, "errores": 0, "duracion_seg": 0.0}
        sub: list[Oferta] = []
        try:
            sub = cls(f).scrapear()
            stats["scrapeadas"] = len(sub)
            logger.info(f"✔ {nombre}: {len(sub)} ofertas")
        except Exception as e:
            logger.error(f"✖ Error en {nombre}: {e}", exc_info=True)
            stats["errores"] = 1
        stats["duracion_seg"] = time.perf_counter() - t0
        return nombre, sub, stats

    fuentes_con_scraper = [f for f in fuentes if obtener_scraper(f)]
    logger.info(f"▶ Scraping en paralelo: {len(fuentes_con_scraper)} fuentes")
    ofertas_raw: list[Oferta] = []
    stats_fuentes: dict[str, dict[str, Any]] = {}
    resultados: dict[str, list[Oferta]] = {}
    with ThreadPoolExecutor(max_workers=6) as pool:
        futuros = [pool.submit(_scrape_fuente, f) for f in fuentes_con_scraper]
        for fut in as_completed(futuros):
            nombre, sub, stats = fut.result()
            resultados[nombre] = sub
            stats_fuentes[nombre] = stats
    # Orden determinista (el de FUENTES) para que el dedup sea estable entre runs
    for f in fuentes_con_scraper:
        ofertas_raw.extend(resultados.get(f["nombre"], []))

    # 1.5 Fuente LinkedIn (F039): no se scrapea desatendido — su cosecha vive en
    # data/linkedin_latest.json (la alimenta scripts/ingest_linkedin.py tras una
    # sesión MCP). Se inyecta aquí para que fluya al pipeline (matcher + curaduría
    # + Sheet) como una fuente más y sobreviva a los re-scrapes.
    li_ofertas = cargar_linkedin_store()
    if li_ofertas:
        ofertas_raw.extend(li_ofertas)
        stats_fuentes["LinkedIn Jobs"] = {
            "scrapeadas": len(li_ofertas), "errores": 0, "duracion_seg": 0.0,
        }
        logger.info(f"✔ LinkedIn Jobs (store): {len(li_ofertas)} ofertas")

    # 2. Dedup global por hash
    vistas: set[str] = set()
    ofertas_unicas: list[Oferta] = []
    for o in ofertas_raw:
        h = o.hash
        if h in vistas:
            continue
        vistas.add(h)
        ofertas_unicas.append(o)
    logger.info(f"Tras dedup: {len(ofertas_unicas)}/{len(ofertas_raw)} ofertas")

    # 3. Match scoring + enrutamiento DATA-DRIVEN multi-perfil.
    # Cada oferta se evalúa contra todos los perfiles enrutables (activos en
    # bootstrap + con criterios en config/perfiles.json). El enrutamiento depende
    # del tipo de oferta y de la naturaleza del perfil (PN persona / PJ firma):
    #   - empleo/contractor/freelance → CADA persona (CT, PAU…) que pase umbral.
    #     A diferencia de antes, NO es excluyente entre personas: un mismo empleo
    #     puede servirle a varias (cada una es su propio universo de búsqueda).
    #   - convocatoria_publica/contrato/licitacion → CADA firma (DIV…) que pase.
    #   - ambiguos (STTA, convocatoria_cultural, fellowship) → cualquier perfil
    #     que pase el umbral (persona o firma).
    TIPOS_PERSONA = {"empleo", "contractor", "fractional", "freelance"}
    TIPOS_FIRMA = {"convocatoria_publica", "contrato", "licitacion"}

    perfiles_enrutables = [
        p for p in perfiles_activos
        if p.get("canal") and matcher.perfil_tiene_criterios(p["canal"])
    ]
    canales_enrutables = [p["canal"] for p in perfiles_enrutables]
    es_persona = {p["canal"]: p.get("tipo_persona") == "PN" for p in perfiles_enrutables}
    # Umbral por perfil (Paula usa uno más bajo: fuentes curadas, títulos concisos).
    umbrales = {c: matcher.umbral_perfil(c) for c in canales_enrutables}
    logger.info(f"Perfiles enrutables: {canales_enrutables} · umbrales: {umbrales}")

    for o in ofertas_unicas:
        scores = matcher.scorear_todos(o.__dict__, canales_enrutables)
        o.score_match = {p: s.score for p, s in scores.items()}

        tipo = o.tipo_oferta
        matches = []
        for canal in canales_enrutables:
            if scores[canal].score < umbrales[canal]:
                continue
            persona = es_persona[canal]
            if tipo in TIPOS_PERSONA:
                if persona:
                    matches.append(canal)
            elif tipo in TIPOS_FIRMA:
                if not persona:
                    matches.append(canal)
            else:  # ambiguo: cualquiera que pase el umbral
                matches.append(canal)
        o.perfiles_match = matches

        # 4. Destinos según perfil
        destinos = []
        for p_name in matches:
            perfil = next((p for p in perfiles_enrutables if p.get("canal") == p_name), None)
            if not perfil:
                continue
            d_type = perfil.get("destino_tipo")
            d_id = perfil.get("destino_id", "")
            destinos.append(f"{d_type}:{d_id}")
        o.destinos = list(set(destinos))

    # 4.5 Preservar curaduría previa: una oferta ya aprobada/rechazada en runs
    # anteriores NO vuelve a 'pendiente' aunque siga viva en la fuente.
    # Match por hash (misma fórmula del dedup). Las notas previas se conservan
    # porque traen la razón del curador ([auto-curador] ...).
    latest = DATA_DIR / "ofertas_latest.json"
    curados_previos: dict[str, tuple[str, str]] = {}
    if latest.exists():
        try:
            for prev in json.loads(latest.read_text(encoding="utf-8")):
                estado_prev = normalizar_estado(prev.get("estado", "pendiente"))
                if estado_prev and estado_prev != "pendiente":
                    h = calcular_hash_oferta(
                        prev.get("fuente_nombre", ""),
                        prev.get("titulo", ""),
                        prev.get("empresa_entidad", ""),
                    )
                    curados_previos[h] = (estado_prev, prev.get("notas", ""))
        except (json.JSONDecodeError, OSError) as e:
            logger.warning(f"No se pudo leer curaduría previa: {e}")
    preservadas = 0
    for o in ofertas_unicas:
        if o.hash in curados_previos:
            o.estado, notas_prev = curados_previos[o.hash]
            if notas_prev:
                o.notas = notas_prev
            preservadas += 1
    if preservadas:
        logger.info(f"Curaduría preservada en {preservadas} ofertas (no vuelven a pendiente)")

    # 5. Guardar
    payload = [o.to_dict() for o in ofertas_unicas]

    if dry_run:
        logger.info(f"DRY-RUN: {len(payload)} ofertas no se guardan.")
        return payload

    # JSON local SIEMPRE (también con --upload): es respaldo, no alternativo.
    out_file = DATA_DIR / f"ofertas_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
    out_file.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")
    # También una copia a "ofertas_latest.json" para fácil acceso
    latest = DATA_DIR / "ofertas_latest.json"
    latest.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")
    logger.info(f"💾 Guardado: {out_file}")
    logger.info(f"💾 Latest:   {latest}")

    # Stats del run para el tablero de la landing (scripts/export_landing.py)
    ts_run = datetime.now().isoformat(timespec="seconds")
    stats_path = DATA_DIR / "stats_latest.json"
    stats_path.write_text(
        json.dumps(
            {
                "ejecutado_en": ts_run,
                "fuentes": stats_fuentes,
                "totales": {
                    "raw": len(ofertas_raw),
                    "unicas": len(ofertas_unicas),
                    "con_match": sum(1 for o in ofertas_unicas if o.perfiles_match),
                },
            },
            ensure_ascii=False,
            indent=2,
        ),
        encoding="utf-8",
    )
    _actualizar_historial(ts_run, stats_fuentes)

    if upload:
        resumen = subir_ofertas_al_sheet(ofertas_unicas, stats_fuentes)
        print()
        print("=== Resumen --upload ===")
        print(f"  Scrapeadas (raw):            {len(ofertas_raw)}")
        print(f"  Únicas tras dedup en memoria: {len(ofertas_unicas)}")
        print(f"  Nuevas subidas (por perfil): {resumen['nuevas']}")
        print(f"  Duplicadas contra el Sheet:  {resumen['duplicadas_sheet']}")
        print(f"  Sin match (no van al Sheet): {resumen['sin_match']}")

    return payload


# ============================================================
# CLI
# ============================================================
def main():
    # En Windows la consola usa cp1252 y rompe con los caracteres de caja/emoji.
    # Forzamos UTF-8 en stdout/stderr para no depender de PYTHONIOENCODING externo.
    for stream in (sys.stdout, sys.stderr):
        try:
            stream.reconfigure(encoding="utf-8")
        except (AttributeError, ValueError):
            pass

    parser = argparse.ArgumentParser(description="Orquestador del scraping de ofertas.")
    parser.add_argument("--fuente", help="Filtrar a una sola fuente por nombre")
    parser.add_argument("--dry-run", action="store_true", help="No guarda salida")
    parser.add_argument("--upload", action="store_true", help="Sube al Sheet (Fase 4)")
    parser.add_argument("--verbose", "-v", action="store_true", help="Log DEBUG")
    args = parser.parse_args()

    logging.basicConfig(
        level=logging.DEBUG if args.verbose else logging.INFO,
        format="%(levelname)s - %(name)s - %(message)s",
    )

    try:
        ofertas = ejecutar_scraping(
            fuente_filter=args.fuente,
            dry_run=args.dry_run,
            upload=args.upload,
        )
    except CredencialesFaltantesError as e:
        # Falla esperada (Fase 0: aún no hay service account) → mensaje limpio, sin traceback.
        print(f"\n{e}", file=sys.stderr)
        sys.exit(1)
    except Exception as e:
        logger.error(f"ERROR: {e}", exc_info=True)
        sys.exit(1)

    # Resumen (multi-perfil, data-driven: muestra todos los perfiles enrutados)
    def _pm(o: dict) -> list:
        v = o.get("perfiles_match")
        if isinstance(v, str):
            try:
                return json.loads(v)
            except (json.JSONDecodeError, TypeError):
                return []
        return v or []

    def _sm(o: dict) -> dict:
        v = o.get("score_match")
        if isinstance(v, str):
            try:
                return json.loads(v)
            except (json.JSONDecodeError, TypeError):
                return {}
        return v or {}

    perfiles_vistos = sorted({p for o in ofertas for p in _sm(o)})
    n_sin_match = sum(1 for o in ofertas if not _pm(o))

    print()
    print(f"╔{'═'*60}╗")
    print(f"║ RESUMEN — {len(ofertas)} ofertas procesadas".ljust(61) + "║")
    print(f"╠{'═'*60}╣")
    for p in perfiles_vistos:
        n = sum(1 for o in ofertas if p in _pm(o))
        print(f"║   Match {p}:".ljust(25) + f"{n:>4}".ljust(36) + "║")
    print(f"║   Sin match (descart):{n_sin_match:>4}".ljust(61) + "║")
    print(f"╚{'═'*60}╝")

    # Top 5 por score de cada perfil presente
    for p in perfiles_vistos:
        print(f"\n🏆 Top 5 por score {p}:")
        top = sorted(ofertas, key=lambda o: _sm(o).get(p, 0), reverse=True)[:5]
        for o in top:
            sm = _sm(o)
            sc = " ".join(f"{q}={sm.get(q, 0):>3}" for q in perfiles_vistos)
            print(f"  {sc} | {o['titulo'][:58]}")


if __name__ == "__main__":
    main()
