"""
config.py — Configuración centralizada del Scraper Empleos.

Carga variables de entorno desde .env y expone constantes para todo el proyecto.
NO contiene lógica de negocio — solo configuración.
"""

import os
from pathlib import Path

from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parent
load_dotenv(BASE_DIR / ".env")


# ============================================================
# Google Sheets
# ============================================================
SHEET_ID = os.getenv("SHEET_ID", "")
GOOGLE_CREDENTIALS_PATH = BASE_DIR / os.getenv(
    "GOOGLE_CREDENTIALS_PATH", "credentials/service-account.json"
)

# Nombres exactos de las pestañas
TAB_FUENTES = "FUENTES"
TAB_QUERIES = "QUERIES"
TAB_PERFILES = "PERFILES"
TAB_OFERTAS = "OFERTAS"  # legacy: pre-separación por perfil (la migración la renombra)
TAB_CONTROL = "CONTROL"
TAB_LOG = "LOG"
TAB_MANUAL = "MANUAL"

# A partir de la separación por perfil, las ofertas viven en una pestaña por
# perfil: OFERTAS_CT, OFERTAS_DIV, … El nombre se deriva del perfil (data-driven):
# si mañana POL tiene criterios, su pestaña OFERTAS_POL se crea sola.
TAB_OFERTAS_PREFIX = "OFERTAS_"


def tab_ofertas(perfil: str) -> str:
    """Nombre de la pestaña de ofertas de un perfil. Ej: 'CT' → 'OFERTAS_CT'."""
    return f"{TAB_OFERTAS_PREFIX}{perfil.upper()}"


# ============================================================
# Claude API (pre-scoring LLM)
# ============================================================
ANTHROPIC_API_KEY = os.getenv("ANTHROPIC_API_KEY", "")
CLAUDE_MODEL = "claude-sonnet-4-5"  # ajustable


# ============================================================
# WhatsApp (Fase 6)
# ============================================================
WA_CANALES = {
    "TEST": os.getenv("WA_CANAL_TEST", "Test Empleos Divergente"),
    "EMPRESA": os.getenv("WA_CANAL_EMPRESA", ""),
    "PROF2": os.getenv("WA_CANAL_PROF2", ""),
    "PROF3": os.getenv("WA_CANAL_PROF3", ""),
    "ONG": os.getenv("WA_CANAL_ONG", ""),
}

# Ventana horaria de publicación (8:30 a 22:00)
WA_VENTANA_HORARIA = (8, 30, 22, 0)

# Intervalo entre publicaciones — VALIDAR EN TEST primero
# (eventos usa mínimo 9 min; aquí queremos 7 min, hay que comprobar tolerancia)
WA_INTERVALO_SEC = 7 * 60


# ============================================================
# Devex Pro (Fase 4, opcional)
# ============================================================
DEVEX_USER = os.getenv("DEVEX_USER", "")
DEVEX_PASS = os.getenv("DEVEX_PASS", "")


# ============================================================
# Salarios mínimos (filtrado de ofertas)
# ============================================================
SALARIO_MIN = {
    "full_time_cop": 20_000_000,   # 20M COP/mes
    "full_time_usd": 5_000,        # 5K USD/mes
    "freelance_cop_hora": 250_000, # 250K COP/hora
    "freelance_usd_hora": 70,      # 70 USD/hora
    "proyecto_cop": 10_000_000,    # 10M COP/proyecto
    "proyecto_usd": 3_000,         # 3K USD/proyecto
}


# ============================================================
# Scraping — parámetros generales
# ============================================================
REQUEST_TIMEOUT = 20            # segundos por request HTTP
DELAY_BETWEEN_REQUESTS = 1.5    # segundos entre requests dentro de un scraper
                                # (los scrapers corren en paralelo entre sí;
                                # el delay aplica POR dominio, sigue siendo cortés)
USER_AGENT = (
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
    "AppleWebKit/537.36 (KHTML, like Gecko) "
    "Chrome/120.0.0.0 Safari/537.36"
)

# Filtro de anticipación para convocatorias con deadline
DEADLINE_MIN_DIAS_ANTICIPACION = 2


# ============================================================
# Modo / debug
# ============================================================
DRY_RUN = os.getenv("DRY_RUN", "false").lower() == "true"
LOG_LEVEL = os.getenv("LOG_LEVEL", "INFO")


# ============================================================
# Rutas internas
# ============================================================
LOGS_DIR = BASE_DIR / "logs"
LOGS_DIR.mkdir(exist_ok=True)

BOOTSTRAP_OUTPUT_DIR = BASE_DIR / "bootstrap_output"


# ============================================================
# Validación al cargar
# ============================================================
def validar_config(estricto: bool = False) -> list[str]:
    """
    Devuelve lista de problemas detectados. Si estricto=True, lanza excepción.
    Usar al inicio de main.py para fail-fast.
    """
    problemas = []
    if not SHEET_ID:
        problemas.append("SHEET_ID vacío en .env")
    if not GOOGLE_CREDENTIALS_PATH.exists():
        problemas.append(f"No existe credentials: {GOOGLE_CREDENTIALS_PATH}")
    if not ANTHROPIC_API_KEY:
        problemas.append("ANTHROPIC_API_KEY vacío (skill curador no podrá pre-scorear)")

    if estricto and problemas:
        raise RuntimeError("Config inválida:\n  - " + "\n  - ".join(problemas))
    return problemas


if __name__ == "__main__":
    print("=== Estado de configuración ===")
    print(f"BASE_DIR: {BASE_DIR}")
    print(f"SHEET_ID: {SHEET_ID or '(vacío)'}")
    print(f"GOOGLE_CREDENTIALS_PATH: {GOOGLE_CREDENTIALS_PATH} (existe: {GOOGLE_CREDENTIALS_PATH.exists()})")
    print(f"ANTHROPIC_API_KEY: {'(set)' if ANTHROPIC_API_KEY else '(vacío)'}")
    print(f"DRY_RUN: {DRY_RUN}")
    print()
    problemas = validar_config()
    if problemas:
        print("Problemas detectados:")
        for p in problemas:
            print(f"  - {p}")
    else:
        print("Config OK")
