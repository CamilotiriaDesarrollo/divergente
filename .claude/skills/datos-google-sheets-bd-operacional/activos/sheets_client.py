"""
sheets_client.py — Cliente para CRUD del Google Sheet de operación.

Encapsula gspread + service account. Toda la lógica de lectura/escritura
del Sheet va aquí, NO en otros módulos.
"""

from __future__ import annotations

import logging
import re
from datetime import datetime
from functools import lru_cache
from typing import Any

import gspread
from google.oauth2.service_account import Credentials

import config
from scrapers.base import calcular_hash_oferta

logger = logging.getLogger(__name__)

SCOPES = [
    "https://www.googleapis.com/auth/spreadsheets",
    "https://www.googleapis.com/auth/drive",
]

# ============================================================
# Headers de las pestañas de operación
# (FUENTES/QUERIES/PERFILES las crea scripts/bootstrap_from_excel.py)
# ============================================================
HEADERS_OFERTAS = [
    "id", "fecha_extraccion", "fuente_id", "fuente_nombre", "tipo_oferta",
    "titulo", "empresa_entidad", "ubicacion", "modalidad", "seniority",
    "salario", "descripcion", "url_original", "deadline", "perfiles_match",
    "score_match", "estado", "destinos", "fecha_publicacion", "notas",
]
HEADERS_CONTROL = ["canal", "activo", "comando", "bot_pid", "bot_estado"]
HEADERS_LOG = ["fecha", "fuente", "nuevas", "duplicadas", "errores", "duracion_seg"]
HEADERS_MANUAL = ["fuente", "accion_inmediata", "estado", "fecha_objetivo", "notas"]


@lru_cache(maxsize=1)
def get_client() -> gspread.Client:
    """
    Cliente autenticado vía service account. Cacheado (singleton).
    """
    if not config.GOOGLE_CREDENTIALS_PATH.exists():
        raise FileNotFoundError(
            f"No se encontró {config.GOOGLE_CREDENTIALS_PATH}. "
            "Ver PLAN.md sección 'Pasos manuales pendientes'."
        )
    creds = Credentials.from_service_account_file(
        str(config.GOOGLE_CREDENTIALS_PATH), scopes=SCOPES
    )
    return gspread.authorize(creds)


@lru_cache(maxsize=1)
def get_spreadsheet() -> gspread.Spreadsheet:
    """
    Abre el spreadsheet del proyecto. Cacheado.
    """
    if not config.SHEET_ID:
        raise ValueError("SHEET_ID no configurado en .env")
    return get_client().open_by_key(config.SHEET_ID)


def get_worksheet(tab_name: str) -> gspread.Worksheet:
    """
    Obtiene una pestaña específica del spreadsheet.
    """
    return get_spreadsheet().worksheet(tab_name)


# ============================================================
# Helpers genéricos
# ============================================================

def leer_pestana_como_dicts(tab_name: str) -> list[dict[str, Any]]:
    """
    Lee toda la pestaña y devuelve lista de dicts (la primera fila = headers).
    """
    ws = get_worksheet(tab_name)
    return ws.get_all_records()


def append_filas(tab_name: str, filas: list[dict[str, Any]]) -> None:
    """
    Agrega filas al final de la pestaña. Mapea por nombre de columna.
    Usa batch_append para eficiencia (un único API call).
    """
    if not filas:
        return
    ws = get_worksheet(tab_name)
    headers = ws.row_values(1)
    if not headers:
        raise ValueError(f"Pestaña {tab_name} no tiene headers en la fila 1")

    rows_as_lists = []
    for f in filas:
        row = [f.get(h, "") for h in headers]
        rows_as_lists.append(row)

    ws.append_rows(rows_as_lists, value_input_option="USER_ENTERED")
    logger.info(f"{tab_name}: {len(filas)} filas agregadas")


def limpiar_pestana_conservando_headers(tab_name: str) -> None:
    """
    Borra todos los datos de la pestaña pero conserva la fila 1 (headers).
    Útil para re-bootstrap de FUENTES/QUERIES/PERFILES.
    """
    ws = get_worksheet(tab_name)
    if ws.row_count > 1:
        ws.delete_rows(2, ws.row_count)
    logger.info(f"{tab_name}: limpiada (headers preservados)")


def crear_pestana_si_no_existe(name: str, headers: list[str]) -> gspread.Worksheet:
    """
    Crea una pestaña con los headers dados si no existe. Idempotente.
    """
    sp = get_spreadsheet()
    try:
        ws = sp.worksheet(name)
        logger.info(f"Pestaña {name} ya existe")
    except gspread.WorksheetNotFound:
        ws = sp.add_worksheet(title=name, rows=1000, cols=max(26, len(headers) + 2))
        ws.update("A1", [headers])
        logger.info(f"Pestaña {name} creada con {len(headers)} headers")
    return ws


# ============================================================
# Operación del pipeline (main.py --upload)
# ============================================================

def asegurar_pestanas_operacion() -> None:
    """
    Crea idempotentemente las pestañas de operación si no existen:
    CONTROL, LOG y MANUAL (con sus headers exactos).

    Las pestañas de ofertas (OFERTAS_<PERFIL>) NO se crean aquí: se crean lazy
    por perfil en el upload (`asegurar_pestana_ofertas`), solo si hay ofertas de
    ese perfil que subir. FUENTES/QUERIES/PERFILES las crea el bootstrap.
    """
    for tab, headers in (
        (config.TAB_CONTROL, HEADERS_CONTROL),
        (config.TAB_LOG, HEADERS_LOG),
        (config.TAB_MANUAL, HEADERS_MANUAL),
    ):
        crear_pestana_si_no_existe(tab, headers)


def asegurar_pestana_ofertas(perfil: str) -> gspread.Worksheet:
    """Crea (idempotente) la pestaña de ofertas de un perfil y la devuelve.
    Ej: 'CT' → pestaña 'OFERTAS_CT' con HEADERS_OFERTAS."""
    return crear_pestana_si_no_existe(config.tab_ofertas(perfil), HEADERS_OFERTAS)


def leer_hashes_ofertas(registros: list[dict[str, Any]] | None = None) -> set[str]:
    """
    Set de hashes de las ofertas ya existentes en la pestaña OFERTAS, calculados
    con la MISMA fórmula que `Oferta.hash` (scrapers.base.calcular_hash_oferta).

    UNA sola lectura de toda la pestaña (no celda a celda). Acepta `registros`
    pre-leídos con `leer_pestana_como_dicts(TAB_OFERTAS)` para compartir esa
    lectura con `siguiente_id_oferta` y no duplicar API calls.
    """
    if registros is None:
        registros = leer_pestana_como_dicts(config.TAB_OFERTAS)
    return {
        calcular_hash_oferta(
            str(r.get("fuente_nombre", "") or ""),
            str(r.get("titulo", "") or ""),
            str(r.get("empresa_entidad", "") or ""),
        )
        for r in registros
    }


def siguiente_id_oferta(registros: list[dict[str, Any]] | None = None) -> int:
    """
    Número del siguiente id de oferta, continuando desde el máximo existente
    en una pestaña de ofertas. Tolera el prefijo por perfil (CT00001, DIV00001)
    y el formato legacy (O00001). Devuelve 1 si la pestaña está vacía.

    Acepta `registros` pre-leídos (misma lógica que `leer_hashes_ofertas`). Como
    cada pestaña es de un solo perfil, los `registros` deben ser los de ESA
    pestaña para que el consecutivo sea correcto.
    """
    if registros is None:
        registros = leer_pestana_como_dicts(config.TAB_OFERTAS)
    max_n = 0
    for r in registros:
        m = re.match(r"^[A-Za-z]+(\d+)$", str(r.get("id", "")).strip())
        if m:
            max_n = max(max_n, int(m.group(1)))
    return max_n + 1


def formatear_id_oferta(n: int, perfil: str = "") -> str:
    """Formatea el consecutivo como id de oferta con prefijo por perfil.
    Ej: (8, 'CT') → 'CT00008', (8, 'DIV') → 'DIV00008'. Sin perfil → 'O00008'
    (formato legacy, pre-separación)."""
    prefijo = perfil.upper() if perfil else "O"
    return f"{prefijo}{n:05d}"


def registrar_logs_scrape(registros: list[dict[str, Any]]) -> None:
    """
    Agrega varias filas a LOG en UN solo append (batch). Cada registro debe
    traer: fuente, nuevas, duplicadas, errores, duracion_seg. La fecha se
    agrega automáticamente.
    """
    if not registros:
        return
    ahora = datetime.now().isoformat(timespec="seconds")
    filas = [
        {
            "fecha": ahora,
            "fuente": r.get("fuente", ""),
            "nuevas": r.get("nuevas", 0),
            "duplicadas": r.get("duplicadas", 0),
            "errores": r.get("errores", 0),
            "duracion_seg": round(float(r.get("duracion_seg", 0.0)), 1),
        }
        for r in registros
    ]
    append_filas(config.TAB_LOG, filas)


def registrar_log_scrape(
    fuente: str,
    nuevas: int,
    duplicadas: int,
    errores: int,
    duracion_seg: float,
) -> None:
    """Agrega UNA fila a LOG con el resultado de un scrape de una fuente."""
    registrar_logs_scrape([
        {
            "fuente": fuente,
            "nuevas": nuevas,
            "duplicadas": duplicadas,
            "errores": errores,
            "duracion_seg": duracion_seg,
        }
    ])


# ============================================================
# CLI: test de conexión
# ============================================================
if __name__ == "__main__":
    import sys

    logging.basicConfig(level=logging.INFO, format="%(levelname)s - %(message)s")
    try:
        sp = get_spreadsheet()
        print(f"Conexión OK")
        print(f"Spreadsheet: {sp.title}")
        print(f"Pestañas existentes:")
        for ws in sp.worksheets():
            print(f"  - {ws.title} ({ws.row_count}x{ws.col_count})")
    except Exception as e:
        print(f"ERROR: {e}", file=sys.stderr)
        sys.exit(1)
