# activos/python/logging_config.py
# Logging estructurado (JSON) para la LÍNEA DE DATOS/SCRAPING (Python, orquestado en Windows).
# Cierra el vacío en los jobs de datos: cada corrida emite eventos JSON con timestamp, nivel,
# job y correlation_id, aptos para un colector OTLP o para revisar el .log del Task Scheduler.
#
# N0 (sin verificar aún en proyecto propio):
#   pip install structlog
import logging
import os
import sys
import uuid

import structlog


def configurar_logging(job: str = "${JOB_NAME}", nivel: str | None = None) -> structlog.BoundLogger:
    nivel = (nivel or os.getenv("LOG_LEVEL", "INFO")).upper()
    logging.basicConfig(format="%(message)s", stream=sys.stdout, level=nivel)

    structlog.configure(
        processors=[
            structlog.contextvars.merge_contextvars,
            structlog.processors.add_log_level,
            structlog.processors.TimeStamper(fmt="iso"),
            structlog.processors.dict_tracebacks,
            structlog.processors.JSONRenderer(),  # PROD: JSON a stdout (lo captura el scheduler/colector)
        ],
        wrapper_class=structlog.make_filtering_bound_logger(getattr(logging, nivel)),
        cache_logger_on_first_call=True,
    )
    # correlation_id por corrida: ata todos los eventos de un mismo job de scraping.
    structlog.contextvars.bind_contextvars(job=job, correlation_id=str(uuid.uuid4()))
    return structlog.get_logger()


# Uso:
#   from logging_config import configurar_logging
#   log = configurar_logging(job="secop-scraper")
#   log.info("fuente_iniciada", url="${URL}", fuente="SECOP")
#   log.warning("antibot_detectado", intento=2)
#   # NUNCA registres datos personales/credenciales en claro (Habeas Data, Ley 1581).
