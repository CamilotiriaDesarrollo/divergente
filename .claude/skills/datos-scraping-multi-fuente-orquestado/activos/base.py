"""
scrapers/base.py — Clase base de todos los scrapers.

Cada scraper de sitio hereda de BaseScraper e implementa `scrapear()`.
Devuelve una lista de dicts con el esquema de la tabla OFERTAS.
"""

from __future__ import annotations

import hashlib
import logging
import re
import time
import unicodedata
from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from datetime import date
from typing import Any

import requests
from bs4 import BeautifulSoup

import config

logger = logging.getLogger(__name__)


# ============================================================
# Esquema de oferta — coincide con la tabla OFERTAS del Sheet
# ============================================================
@dataclass
class Oferta:
    """
    Estructura de una oferta. Se serializa a fila del Sheet en main.py.
    """
    fuente_id: str
    fuente_nombre: str
    tipo_oferta: str           # empleo / contractor / fractional / freelance / STTA / convocatoria_publica / convocatoria_cultural / fellowship
    titulo: str
    url_original: str

    # Opcionales — se llenan según disponibilidad de la fuente
    empresa_entidad: str = ""
    ubicacion: str = ""
    modalidad: str = ""
    seniority: str = ""
    salario: str = ""
    descripcion: str = ""
    deadline: str = ""         # YYYY-MM-DD si aplica

    # Campos derivados (se calculan en main.py / matcher.py)
    perfiles_match: list[str] = field(default_factory=list)
    score_match: dict[str, int] = field(default_factory=dict)
    estado: str = "pendiente"
    destinos: list[str] = field(default_factory=list)

    # Metadata
    fecha_extraccion: str = field(default_factory=lambda: date.today().isoformat())
    notas: str = ""

    def to_dict(self) -> dict[str, Any]:
        d = self.__dict__.copy()
        # Serializar arrays como JSON-string para Google Sheets
        import json
        d["perfiles_match"] = json.dumps(self.perfiles_match)
        d["score_match"] = json.dumps(self.score_match)
        d["destinos"] = json.dumps(self.destinos)
        return d

    @property
    def hash(self) -> str:
        """Hash para deduplicación: fuente + título + empresa."""
        return calcular_hash_oferta(self.fuente_nombre, self.titulo, self.empresa_entidad)


def _normalizar(s: str) -> str:
    """Lowercase + sin tildes + sin espacios extra."""
    if not s:
        return ""
    s = unicodedata.normalize("NFD", s).encode("ascii", "ignore").decode("ascii")
    s = s.lower().strip()
    s = re.sub(r"\s+", " ", s)
    return s


def calcular_hash_oferta(fuente_nombre: str, titulo: str, empresa_entidad: str) -> str:
    """
    Hash md5 de deduplicación: fuente + título normalizado + empresa normalizada.

    ÚNICA fuente de verdad de la fórmula. La usan `Oferta.hash` y
    `sheets_client.leer_hashes_ofertas` — si cambia aquí, cambia en ambos lados.
    """
    key = f"{fuente_nombre}|{_normalizar(titulo)}|{_normalizar(empresa_entidad)}"
    return hashlib.md5(key.encode()).hexdigest()


# ============================================================
# Clase base
# ============================================================
class BaseScraper(ABC):
    """
    Clase base para scrapers HTTP simples (sin JS pesado).

    Subclases deben implementar `scrapear()` y devolver list[Oferta].

    Las subclases reciben en __init__ el dict de la fila de FUENTES
    correspondiente, con todas las columnas (id, url_principal, busqueda_sugerida, etc.).
    """

    nombre: str = "(abstract)"  # override en subclase
    aplica_perfiles: list[str] = []  # ["CT", "DIV"]

    def __init__(self, fuente_row: dict[str, Any]):
        self.fuente = fuente_row
        self.fuente_id = fuente_row.get("id", "")
        self.fuente_nombre = fuente_row.get("nombre", self.nombre)
        self.url_principal = fuente_row.get("url_principal", "")
        self.query_ct = fuente_row.get("busqueda_sugerida_ct", "")
        self.query_div = fuente_row.get("busqueda_sugerida_div", "")
        self.session = requests.Session()
        self.session.headers.update({"User-Agent": config.USER_AGENT})

    # ---------- API pública ----------
    @abstractmethod
    def scrapear(self) -> list[Oferta]:
        """Devuelve lista de Ofertas. Cada subclase implementa."""
        ...

    # ---------- Helpers HTTP ----------
    def _get_soup(self, url: str, params: dict | None = None) -> BeautifulSoup:
        """HTTP GET con timeout, delay y soup BS4."""
        time.sleep(config.DELAY_BETWEEN_REQUESTS)
        r = self.session.get(url, params=params, timeout=config.REQUEST_TIMEOUT)
        r.raise_for_status()
        return BeautifulSoup(r.text, "lxml")

    def _get_json(self, url: str, params: dict | None = None) -> dict | list:
        """HTTP GET para APIs JSON."""
        time.sleep(config.DELAY_BETWEEN_REQUESTS)
        r = self.session.get(url, params=params, timeout=config.REQUEST_TIMEOUT)
        r.raise_for_status()
        return r.json()
