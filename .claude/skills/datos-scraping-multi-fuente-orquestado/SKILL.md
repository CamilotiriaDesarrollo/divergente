---
name: datos-scraping-multi-fuente-orquestado
regimen: divergente
description: Estructura sistemas de decenas de scrapers heterogéneos en Python con deduplicación por hash, paralelismo por dominio y métricas por fuente. Cargar cuando haya que scrapear/agregar múltiples sitios o APIs hacia un destino común (Sheet, BD, JSON), añadir una fuente nueva a un orquestador existente, o decidir qué hacer con fuentes bloqueadas por anti-bot o login.
---

# Datos — Scraping multi-fuente orquestado

**Nivel actual:** N2 · **Dominio:** Datos y Scraping · **Agente(s):** `datos-scraping`
**Proyectos fuente:** Scraper-Empleos (`C:\Users\camil\Desktop\IA Raiz Proyectos\002 Desarrollos\Scraper-Empleos`)

> Criterio de ascenso a N1: los 5 bloques completos, con activos copiables de ruta real y gotchas verificados (no genéricos). A N2: ≥1 uso real aceptado por el Dueño. A N3: ≥3 usos exitosos en ≥2 proyectos + checklist propio.

## 1. Propósito

Montar (o extender) un sistema de scraping con **decenas de fuentes heterogéneas** (APIs JSON, Algolia, RSS, HTML estático, sitios con JS) que convergen a un esquema único, sin duplicados y sin perder trabajo manual entre corridas. El patrón fue probado en Scraper-Empleos: 16→35+ scrapers en paralelo, run completo en ~55 s, ~760 ofertas únicas/run, con curaduría humana que sobrevive los re-scrapes (evidencia: `Scraper-Empleos\docs\REPORTE_SCRAPING_2026-06-10.md`).

Se carga cuando: (a) el proyecto necesita agregar contenido de ≥3 sitios distintos a un destino común; (b) hay que añadir una fuente nueva a un orquestador de este tipo; (c) una fuente se bloquea y hay que decidir entre borrarla o diferirla a sesión autenticada.

## 2. Procedimiento

1. **Esqueleto del proyecto** (copiar de `activos/`): `config.py` (constantes: `REQUEST_TIMEOUT=20`, `DELAY_BETWEEN_REQUESTS=1.5`, `USER_AGENT` de Chrome real), `scrapers/base.py` (BaseScraper + dataclass de dominio + hash), `scrapers/base_playwright.py` (solo sitios con JS), `scrapers/sitios/<fuente>.py` (uno por fuente), `main.py` (orquestador).

2. **Dataclass de dominio que ES el esquema del destino.** En el proyecto fuente: `Oferta` en `scrapers/base.py` coincide campo a campo con la tabla OFERTAS del Sheet. Las listas se serializan como JSON-string en `to_dict()` porque Sheets no acepta arrays. Campos derivados (score, estado, destinos) los calcula el orquestador, no los scrapers.

3. **UNA sola función de hash para el dedup** — la decisión más importante del sistema:
   ```python
   def calcular_hash_oferta(fuente_nombre, titulo, empresa_entidad) -> str:
       key = f"{fuente_nombre}|{_normalizar(titulo)}|{_normalizar(empresa_entidad)}"
       return hashlib.md5(key.encode()).hexdigest()
   ```
   `_normalizar` = NFD sin tildes + lowercase + colapsar espacios (unicodedata). Esta función se usa en **tres puntos** y debe ser exactamente la misma: dedup en memoria (paso 2 de `main.py`), dedup contra el histórico del Sheet (`sheets_client.leer_hashes_ofertas`, línea 163-181), y preservación de curaduría (paso 4.5 de `main.py`). El docstring del proyecto lo dice literal: "ÚNICA fuente de verdad de la fórmula — si cambia aquí, cambia en ambos lados".

4. **Un archivo por fuente con test manual en `__main__`.** Cada scraper hereda de `BaseScraper`, implementa `scrapear() -> list[Oferta]` y cierra con un bloque `if __name__ == "__main__":` que lo corre aislado (`python -m scrapers.sitios.remotive`) e imprime muestra. Así se valida una fuente sin tocar el pipeline. Ver `activos/ejemplo_scraper_remotive.py`.

5. **Elegir el método de extracción por orden de costo** (criterio de decisión, validado en 35+ fuentes):
   1. API JSON pública sin auth (Remotive, SECOP/Socrata, Greenhouse/Lever ATS).
   2. **Algolia con credenciales públicas en el cliente**: inspeccionar HTML/bundle JS buscando `appId` + `apiKey` + `indexName` y pegarle directo al endpoint (Idealist, 80,000 Hours, Dynamite; sub-3 s cada una). "Es el camino más barato y robusto — no depende del DOM" (`docs/REPORTE_SCRAPING_2026-06-10.md` §5).
   3. RSS (We Work Remotely) o sitemap XML + JSON-LD (Jobgether).
   4. HTML estático con BeautifulSoup (`self._get_soup()` de la base, que ya aplica delay + timeout).
   5. Playwright (`BasePlaywrightScraper`) SOLO si el contenido es JS-rendered (elempleo, CultuRed, SINAC). Son los más frágiles ante rediseños.
   6. Sesión real autenticada (LinkedIn, Devex, IADB) → se difiere a fase aparte, no se scrapea desatendido.

6. **Registry doble para añadir fuentes sin tocar el orquestador** (`main.py` líneas 128-219): `SCRAPER_REGISTRY` mapea `scraper_class` (columna del Sheet) → clase; `NOMBRE_A_SCRAPER` es fallback por nombre EXACTO del campo `"nombre"` de `fuentes.json`. Añadir fuente = escribir el archivo + 1 línea en el mapa. `filtrar_fuentes_activas_scrapeables()` salta en silencio las fuentes sin scraper.

7. **Paralelismo: `ThreadPoolExecutor(max_workers=6)`, un worker por fuente.** Funciona porque cada fuente es un dominio distinto — no compiten por rate limits; el delay de cortesía (1.5 s) aplica DENTRO de cada scraper, es decir por dominio. Tras `as_completed`, reensamblar los resultados **en el orden determinista de FUENTES** para que el dedup sea estable entre runs (`main.py` líneas 442-476).

8. **Métricas por fuente en cada run**: dict `{scrapeadas, errores, duracion_seg}` por fuente → `data/stats_latest.json` (consumido por el tablero) + historial rolling de 30 runs en `data/fuentes_historial.json` (`_actualizar_historial`, `main.py` líneas 100-119). Señal de mantenimiento: fuente en `scrapeadas: 0` dos runs seguidos = cambió su DOM/API.

9. **Regla "implementar o eliminar"** (`PLAN_SCRAPERS_GRUPO_F.md`): para cada fuente candidata, o se escribe scraper funcional o se borra de `fuentes.json`. "No dejar entradas fantasma." Si da 403/JS-rendered/0 ofertas consistente → eliminar, NO registrar en `main.py`.

10. **Taxonomía de bloqueos** (`docs/REPORTE_SCRAPING_2026-06-10.md` §3-4) — dos destinos distintos:
    - **Arquitectónicamente muerta** (sin camino ni con sesión: dominio caído, API que ignora filtros a escala inviable, mercado ya cubierto): **borrar** de `fuentes.json` dejando backup `fuentes.backup_<ts>.json`. Casos reales: GovTech LATAM (caído), Himalayas (API ignora filtros de país → escanear 101k jobs), Wellfound (DataDome + bajo valor), Magneto365 (cubierto por elempleo+Computrabajo).
    - **Recuperable con sesión** (login wall o 403 anti-bot pero contenido valioso): marcar `requiere_sesion: true, activo: false` en `fuentes.json` y diferir a la fase de navegador autenticado. Casos reales: WTTJ, Glassdoor, Devex, IADB, 15 fuentes LinkedIn.

11. **Fail-fast y respaldo local**: validar credenciales del destino ANTES de scrapear (`validar_credenciales_upload()`, error limpio sin traceback) y escribir SIEMPRE el JSON local (`ofertas_<ts>.json` + `ofertas_latest.json`) aunque haya upload — es respaldo, no alternativo.

## 3. Activos copiables

Copiados desde `C:\Users\camil\Desktop\IA Raiz Proyectos\002 Desarrollos\Scraper-Empleos` a `activos/` de esta skill:

| Activo | Origen | Qué es / qué adaptar |
|---|---|---|
| `activos/base.py` | `Scraper-Empleos\scrapers\base.py` | `BaseScraper` (helpers `_get_soup`/`_get_json` con delay+timeout) + dataclass `Oferta` + `calcular_hash_oferta()`. Adaptar: campos de la dataclass al dominio nuevo y los 3 componentes del hash. |
| `activos/base_playwright.py` | `Scraper-Empleos\scrapers\base_playwright.py` | Base Playwright con context manager `pagina()` y perfil persistente opcional (`user_data_dir`) para login. Adaptar: `timeout_ms`, `headless`. |
| `activos/main.py` | `Scraper-Empleos\main.py` | Orquestador completo: registry doble, ThreadPool, dedup, preservación de curaduría, métricas, upload batch. Adaptar: imports de scrapers, matcher/enrutamiento (es específico de empleos). |
| `activos/config.py` | `Scraper-Empleos\config.py` | Config centralizada desde `.env` con `validar_config()` fail-fast y `__main__` de diagnóstico. Sin secretos: todo se lee de entorno. |
| `activos/ejemplo_scraper_remotive.py` | `Scraper-Empleos\scrapers\sitios\remotive.py` | Scraper canónico de API JSON pública con filtros regex, truncados defensivos (`[:300]`, `[:150]`) y bloque `__main__` de test. Plantilla para toda fuente nueva. |

Referencias adicionales en el proyecto fuente (no copiadas): `scrapers/sitios/eightyk.py` (patrón Algolia, con las credenciales públicas extraídas del bundle), `sheets_client.py` (dedup contra Sheet con una sola lectura por pestaña), `scripts/bootstrap_from_excel.py` (carga inicial de fuentes desde Excel curado).

## 4. Gotchas verificados

1. **Dos fuentes que comparten portal/API duplican todo y el hash NO las une** (porque `fuente_nombre` entra en el hash). Get on Board World (F083) usa la misma API que GOB LATAM (F082) y UNDP F120 el mismo portal que F119: mapear ambas scrapearía lo mismo dos veces con `fuente_nombre` distinto. Solución: mapear solo una y documentarlo en comentario junto al registry. Evidencia: `main.py` líneas 164-166 y 175-176.

2. **Filtros por substring sin word boundaries**: "Perú" matcheaba "Perugia" (UNESCO) e "intern" matcheaba "internos" (UNDP). Solución: regex compiladas con `\b`. Evidencia: `docs/REPORTE_SCRAPING_2026-06-10.md` §5.

3. **Consola Windows en cp1252 revienta con emoji/caracteres de caja** en los prints del resumen. Solución: `stream.reconfigure(encoding="utf-8")` sobre stdout/stderr al inicio de `main()` y de cada `__main__` de scraper, para no depender de `PYTHONIOENCODING` externo. Evidencia: `main.py` líneas 638-644, `remotive.py` línea 131.

4. **La búsqueda del sitio puede estar rota o ser mentira**: Torre.ai devuelve el feed completo ignorando la query (solución: escanear feed paginado + gate estricto por título) y en elempleo `?q=` no filtra (solución: búsqueda por slug en la URL, `/trabajo-{términos}`). No asumir que el parámetro de búsqueda funciona: verificar que resultados distintos salgan con queries distintas. Evidencia: `docs/REPORTE_SCRAPING_2026-06-10.md` §5.

5. **Rate limits de Google Sheets castigan el acceso celda a celda**: la capa Sheets hace UNA lectura por pestaña (compartida entre cálculo de hashes y siguiente id — `leer_hashes_ofertas(registros)` acepta registros pre-leídos justamente para eso) y UN append batch por pestaña + UN append batch a LOG. Evidencia: `sheets_client.py` líneas 163-196 y docstring de `subir_ofertas_al_sheet` en `main.py`.

6. **Re-scrapear pisaba la curaduría manual** (una oferta aprobada volvía a `pendiente` porque seguía viva en la fuente). Solución: paso 4.5 de `main.py` — cargar `ofertas_latest.json` previo, indexar estados no-pendientes por el MISMO hash del dedup y reaplicarlos, conservando notas del curador. Además `normalizar_estado()` tolera variantes viejas de género ("aprobado"→"aprobada") para no perder curaduría histórica. Evidencia: `main.py` líneas 87-97 y 555-582.

7. **Las API keys públicas de Algolia rotan**: cuando rotan, la fuente devuelve 403. Solución operativa: re-extraer `appId`/`apiKey`/`indexName` del HTML/bundle del sitio (en 80k Hours están en la config de Nuxt; en Idealist en `window.Idealist`). Evidencia: `docs/REPORTE_SCRAPING_2026-06-10.md` §6 "Monitoreo de salud" y `scrapers/sitios/eightyk.py` docstring.

8. **Errores intermitentes del origen no son bugs propios**: SECOP (datos.gov.co) da 503 ocasional y Tech Jobs for Good da 404 en la página 2 de paginación. Solución: reintentos dentro del scraper / tolerar y seguir con lo cosechado — un scraper que falla no tumba el run (el orquestador captura la excepción por fuente y la cuenta en `errores`). Evidencia: `docs/REPORTE_SCRAPING_2026-06-10.md` §5 y `_scrape_fuente` en `main.py` líneas 447-461.

## 5. Criterios de done

- [ ] El scraper nuevo corre aislado: `python -m scrapers.sitios.<nombre>` imprime N ofertas > 0 con campos clave poblados (título, url, empresa).
- [ ] Registrado en el registry con el nombre EXACTO del campo `"nombre"` de `fuentes.json` (un typo = la fuente se salta en silencio).
- [ ] Correr el pipeline dos veces seguidas: el conteo de únicas es estable y la segunda corrida no re-sube nada al destino (dedup por hash funcionando en memoria y contra histórico).
- [ ] Estados de curaduría/edición manual previos sobreviven al re-scrape (verificar con al menos 1 registro no-pendiente).
- [ ] Toda fuente evaluada terminó en uno de tres estados: scraper activo registrado, borrada de `fuentes.json` (con backup), o `requiere_sesion: true, activo: false`. Cero entradas fantasma.
- [ ] `data/stats_latest.json` registra la fuente con `scrapeadas/errores/duracion_seg` y el historial rolling se actualiza.
- [ ] Un fallo de una fuente no tumba el run (probar apagando la red de una fuente o con URL rota: el resto cosecha igual).
- [ ] Sin secretos en el código: credenciales solo vía `.env` + `validar_config()`; el modo upload falla ANTES de scrapear si faltan.

## Registro de uso

| Fecha | Proyecto | Tarea | Resultado | Lección |
|---|---|---|---|---|
| histórico | Scraper-Empleos | uso original (fuente de esta skill) | ok | - |
