"""
scrapers/base_playwright.py — Clase base para scrapers que requieren Playwright.

Usar cuando:
- El sitio carga las ofertas con JS (Magneto, Wellfound, Idealist, etc.).
- Requiere login con sesión persistente.

NO usar para LinkedIn — para eso, ver base_chrome_mcp.py (Fase 3).
"""

from __future__ import annotations

import logging
from contextlib import contextmanager
from pathlib import Path
from typing import Any

from playwright.sync_api import Browser, BrowserContext, Page, sync_playwright

import config
from scrapers.base import BaseScraper

logger = logging.getLogger(__name__)


class BasePlaywrightScraper(BaseScraper):
    """
    Scrapers que requieren navegador completo.

    Subclases pueden:
    - Usar `with self.pagina() as page:` para una página efímera.
    - Definir `user_data_dir` si requieren sesión persistente (login).
    """

    headless: bool = True
    user_data_dir: Path | None = None  # subclase puede sobrescribir
    timeout_ms: int = 30_000

    @contextmanager
    def pagina(self):
        """
        Context manager: abre Chromium, devuelve Page, cierra al salir.
        Usa perfil persistente si self.user_data_dir está seteado.
        """
        with sync_playwright() as p:
            if self.user_data_dir:
                self.user_data_dir.mkdir(parents=True, exist_ok=True)
                context: BrowserContext = p.chromium.launch_persistent_context(
                    user_data_dir=str(self.user_data_dir),
                    headless=self.headless,
                    user_agent=config.USER_AGENT,
                )
                page = context.new_page()
                page.set_default_timeout(self.timeout_ms)
                try:
                    yield page
                finally:
                    context.close()
            else:
                browser: Browser = p.chromium.launch(headless=self.headless)
                context = browser.new_context(user_agent=config.USER_AGENT)
                page = context.new_page()
                page.set_default_timeout(self.timeout_ms)
                try:
                    yield page
                finally:
                    context.close()
                    browser.close()
