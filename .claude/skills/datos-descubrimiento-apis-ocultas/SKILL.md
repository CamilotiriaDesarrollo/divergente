---
name: datos-descubrimiento-apis-ocultas
regimen: divergente
description: Playbook para descubrir el método de extracción más barato y robusto de cada fuente ANTES de escribir un scraper de DOM (APIs ocultas tipo Algolia con key pública, APIs de ATS, RSS, trucos de URL). Cárgala cuando vayas a añadir una fuente nueva a un scraper, cuando un scraper de DOM sea frágil o lento, o cuando la búsqueda de un sitio "no filtra" / devuelve el feed completo.
---

# Descubrimiento de APIs ocultas (antes de scrapear el DOM)

**Nivel actual:** N2 · **Dominio:** Datos y Scraping · **Agente(s):** `datos-scraping`
**Proyectos fuente:** Scraper-Empleos (`002 Desarrollos/Scraper-Empleos`)

> Criterio de ascenso a N1: los 5 bloques completos, con activos copiables de ruta real y gotchas verificados (no genéricos). A N2: ≥1 uso real aceptado por el Dueño. A N3: ≥3 usos exitosos en ≥2 proyectos + checklist propio.

## 1. Propósito

Scrapear el DOM renderizado con Playwright es lo más caro (arranca Chromium, es lento, se rompe con cada rediseño). Casi todo sitio moderno pinta su listado consumiendo una API JSON que **también** puedes consumir tú directamente: más rápida, más estable y sin depender de selectores CSS. Esta skill fija el **orden de exploración** para encontrar ese camino barato antes de escribir una línea de scraper, y captura los patrones concretos ya validados en el proyecto Scraper-Empleos (16 fuentes, ~760 ofertas/run en ~55 s; los 3 mejores hallazgos fueron APIs Algolia ocultas resueltas en HTTP puro sub-3 s cada una).

Se carga cuando: (a) vas a añadir una fuente nueva a un pipeline de scraping; (b) un scraper Playwright existente es lento o frágil; (c) la búsqueda de un sitio "no filtra", devuelve resultados irrelevantes o el feed completo; (d) un board de empleo/convocatorias corre sobre un ATS conocido (Greenhouse, Lever, Workday, Oracle HCM, SuccessFactors).

## 2. Procedimiento

Explora en este orden y **detente en el primer nivel que funcione** (cada nivel siguiente es más caro):

**Paso 0 — Abre DevTools → pestaña Network → filtra XHR/Fetch, recarga la búsqueda.** Antes de leer HTML, mira qué peticiones dispara el listado. Casi siempre una de ellas es la API que buscas. Reproduce esa petición con `curl`/`requests` fuera del navegador; si responde igual sin cookies, ya ganaste.

**Nivel 1 — API oculta en el HTML / bundle JS (lo más común y barato):**
- **Algolia.** Muchos boards indexan en Algolia y exponen `appId` + una `apiKey` de solo-búsqueda + `indexName` en el cliente (es su diseño: esa key es pública). Búscalas en el HTML/bundle con `appId`, `apiKey`, `algolia`, `indexName`, o en un config inyectado tipo `window.Idealist`, `window.__NUXT__`, `__NEXT_DATA__`. Endpoint: `POST https://{APP_ID}-dsn.algolia.net/1/indexes/{index}/query` con headers `X-Algolia-Application-Id` y `X-Algolia-API-Key`, body `{"hitsPerPage":20,"page":N,"filters":"...","facetFilters":[...],"attributesToRetrieve":[...]}`. Ver `activos/eightyk_algolia.py` (canónico) y `torre`/`getonboard` para otras formas.
- **API REST/JSON pública documentada.** Get on Board (`/api/v0/...`), Socrata (SECOP), etc. Valida los catálogos de la API en vivo (ids de seniority, categorías, modalidades) — no los adivines.
- **ATS conocido.** Si el board corre sobre un ATS, la API es pública y estándar por-organización:
  - Greenhouse: `GET https://boards-api.greenhouse.io/v1/boards/{slug}/jobs?content=true`
  - Lever: `GET https://api.lever.co/v0/postings/{slug}?mode=json`
  - Oracle HCM (Candidate Experience): `GET .../hcmRestApi/resources/latest/recruitingCEJobRequisitions?...&finder=findReqs;siteNumber=CX_1,...` (ver `undp.py`)
  - Curas una lista de `slug → nombre` de las orgs que te importan y las recorres (patrón multi-org: `activos/greenhouse_multi_ats.py`).
- **RSS como fallback.** Si la API "buena" exige aprobación/appname o fue decomisionada, busca el feed RSS público: suele aceptar la MISMA sintaxis de búsqueda del sitio sin auth (ver `activos/reliefweb_rss_fallback.py`).

**Nivel 2 — Trucos de URL cuando la búsqueda oficial está rota:**
- **Slug en la ruta.** Si `?q=` no filtra (devuelve el listado genérico), prueba búsqueda por slug en la URL: elempleo usa `https://www.elempleo.com/co/ofertas-empleo/trabajo-{terminos-con-guiones}` (verifica los slugs reales en el sitio; no los inventes).
- **Feed paginado + gate por título.** Si el search server-side está roto y devuelve el feed completo ignorando el keyword (caso Torre.ai), no pelees con él: escanea unas cuantas páginas del feed por `offset` y filtra localmente con un gate estricto sobre el título. Yield bajo pero gratis y robusto (`activos/torre_feed_gate.py`).

**Nivel 3 — Playwright, SOLO si el contenido exige render JS** y no hay API detrás. Hereda de `BasePlaywrightScraper`. Espera `wait_until="domcontentloaded"` + `wait_for_timeout` y localiza cards con selectores. Es el nivel frágil: si el sitio rediseña, se rompe.

**Nivel 4 — Sesión real vía navegador autenticado (Claude-in-Chrome MCP)** solo para muros DataDome/login (LinkedIn, Wellfound, WTTJ, Glassdoor, Devex/IADB 403). Esto es dominio de la skill `datos-fuentes-antibot-sesion-real-mcp`; aquí solo se decide que la fuente cae en este nivel.

**Criterios de decisión de campos comunes** (convenciones del proyecto):
- Filtra **relevancia por el TÍTULO**, no por el cuerpo full-text: la búsqueda del feed matchea cuerpos enteros y casi toda vacante menciona "data" en algún párrafo (ver comentario en `reliefweb.py` líneas 79-81).
- Regex de keywords/exclusión **siempre con `\b`** (word boundary), o "intern" matchea "internos" y "Perú" matchea "Perugia".
- Normaliza strings con `unicodedata` (minúsculas sin tildes) antes de comparar.
- Deduplica por URL dentro del scraper (`dict[url] → Oferta`) y respeta un `limit_total`.
- Envuelve cada hit/página en try/except con `logger.warning` y sigue; nunca dejes que un item roto tumbe el run.

## 3. Activos copiables

Todos en `activos/` de esta skill, copiados de `002 Desarrollos/Scraper-Empleos/scrapers/sitios/`. Cada uno hereda de `BaseScraper` (ver `scrapers/base.py`, con la `Oferta` dataclass y los helpers `_get_json`/`_get_soup`). Al reusar: cambia endpoint/filtros/keywords y el `fuente_id`; conserva la estructura de `scrapear()` (paginar → parsear → dedup → limit) y los try/except por item.

- **`activos/eightyk_algolia.py`** (origen `scrapers/sitios/eightyk.py`) — Patrón Algolia canónico. Cópialo cuando halles `appId`+`apiKey`+`index` en el cliente. Adapta: la URL `{APP_ID}-dsn.algolia.net`, `filters`/`facetFilters` y `attributesToRetrieve`. Nota: la key es de solo-búsqueda y pública por diseño.
- **`activos/getonboard_api_json.py`** (origen `getonboard.py`) — API REST/JSON pública con catálogos (seniority, categorías, modalidades) validados en vivo, paginación con `total_pages`, salario formateado, HTML→texto con BeautifulSoup. Cópialo para cualquier API documentada con paginación y catálogos por id.
- **`activos/greenhouse_multi_ats.py`** (origen `greenhouse_multi.py`) — Patrón multi-org sobre un ATS: un `dict {slug → nombre}` curado y un loop que consulta la API pública de cada org. Cópialo para Greenhouse/Lever/Workday. Para Lever cambia el endpoint a `api.lever.co/v0/postings/{slug}?mode=json` (respuesta es lista, no dict — ver `lever_multi.py`).
- **`activos/reliefweb_rss_fallback.py`** (origen `reliefweb.py`) — Cuando la API v2 exige appname aprobado (403 anónimo) o la v1 fue decomisionada (410): fallback al RSS público que acepta la sintaxis de búsqueda Lucene del sitio. Muestra parseo de RSS con `BeautifulSoup(..., "xml")`, varias queries temáticas y filtro de ubicación/relevancia por título.
- **`activos/torre_feed_gate.py`** (origen `torre.py`) — Cuando el search server-side está roto: feed paginado por `offset` + gate estricto de título + exclusión de ruido (ventas/seguros/call center que dominan el marketplace).

Base y utilidades a copiar junto con cualquiera de los anteriores (no duplicadas en `activos/`, viven en el proyecto fuente): `scrapers/base.py` (`BaseScraper`, `Oferta`, `_get_json`, `calcular_hash_oferta`), `scrapers/base_playwright.py` (para Nivel 3), `scrapers/perfil_keywords.py` (`normalizar`, `es_relevante`).

## 4. Gotchas verificados

Todos observados y resueltos en Scraper-Empleos; evidencia en `docs/REPORTE_SCRAPING_2026-06-10.md` (tabla §5) y en los docstrings de cada scraper.

- **La búsqueda oficial devuelve el feed completo ignorando el keyword.** Torre.ai: el operador `keyword` de `POST search.torre.co/opportunities/_search` es ignorado por el backend (devuelve ~22k por recencia). Solución: escanear páginas del feed por `offset` y filtrar con gate de título. Evidencia: `torre.py` líneas 30-36 y `_parse_job` líneas 137-149.
- **`?q=` no filtra.** elempleo.com: el parámetro `?q=` devuelve el listado genérico. Solución: búsqueda por slug en la ruta `/co/ofertas-empleo/trabajo-{slug}`. Evidencia: `elempleo.py` líneas 4-12, 27.
- **Regex sin word boundary → falsos positivos.** UNESCO: "Perú" matcheaba "Perugia"; UNDP: "intern" matcheaba "candidatos internos" (frase común en títulos UNDP en español). Solución: regex compiladas con `\b`. Evidencia: `undp.py` líneas 62-84 (`TITULOS_EXCLUIDOS`) y reporte §5.
- **Filtrar full-text por el cuerpo mete ruido presencial.** ReliefWeb: casi toda vacante humanitaria menciona "data"/"remote" incidentalmente en algún párrafo, así que buscar en el cuerpo dejaba pasar puestos presenciales (Uganda, Jordania). Solución: aplicar keywords y señal de remoto SOLO sobre el título. Evidencia: `reliefweb.py` líneas 79-81 y 140-144.
- **API "buena" tras muro de aprobación → usar RSS.** ReliefWeb API v1 = HTTP 410 (decomisionada); v2 = HTTP 403 anónimo ("You are not using an approved appname"). Solución: RSS público `reliefweb.int/jobs/rss.xml?search=<query Lucene>`, tope ~20 items/query → lanzar varias queries temáticas. Evidencia: `reliefweb.py` líneas 4-15.
- **API que ignora los filtros de país → inviable.** Himalayas (F045): capa a 20/página e ignora todos los filtros de país; escanear 101k jobs para hallar LATAM no compensa. Lección: si la API no filtra server-side y el universo es enorme, descártala en vez de escanear todo. Evidencia: reporte §3.
- **Paginación que cambia / 404 en página 2.** Tech Jobs for Good devuelve 404 en page 2. Tolerado con try/except + `break` (sigue trayendo page 1); no es crítico. Aplica el mismo patrón: un fallo de página corta la fuente, no el run. Evidencia: reporte §5.
- **Señales de salud para el run recurrente** (`docs/REPORTE_SCRAPING_2026-06-10.md` §6):
  - **Algolia (Idealist, 80k, Dynamite) → 403** = la API key pública rotó. Re-extraer del HTML.
  - **Playwright (elempleo, CultuRed, SINAC) → 0 ofertas** = probablemente cambió el DOM. Revisar selectores primero (es el nivel más frágil).
  - **Fuente a `scrapeadas: 0` dos runs seguidos** = cambió su DOM/API. Revisar en `data/stats_latest.json`.
  - **SECOP 503 intermitente** de datos.gov.co no es fallo propio; reintentar.

Nota de seguridad: las Algolia app-id/api-key que verás en estos activos son **keys de solo-búsqueda públicas** (expuestas en el navegador de cualquier visitante por diseño). No son secretos. Nunca comitees keys de escritura/admin, tokens de sesión, `.env` ni credenciales de service account — esas van fuera del repo.

## 5. Criterios de done

- [ ] Se exploró Network/DevTools y se documentó en el docstring del scraper **qué nivel** resolvió la fuente (Algolia / API JSON / ATS / RSS / slug / feed+gate / Playwright / sesión real) y **por qué** no uno más barato.
- [ ] El scraper hereda de `BaseScraper` (o `BasePlaywrightScraper`) y devuelve `list[Oferta]` con `fuente_id`, `titulo`, `url_original` no vacíos.
- [ ] Endpoints/catálogos/slugs **validados en vivo** (fecha en el docstring), no adivinados.
- [ ] Dedup por URL, `limit_total` respetado, y cada item envuelto en try/except con `logger.warning` (un item o página rotos no tumban el run).
- [ ] Filtros de relevancia/exclusión sobre el TÍTULO normalizado (`unicodedata`) con regex `\b`; verificado que no hay falsos positivos obvios (tipo "intern"/"Perugia").
- [ ] Test manual `if __name__ == "__main__"` que imprime N ofertas y un muestreo (título, empresa, ubicación, url) — corre y da resultados plausibles.
- [ ] Anotadas las señales de salud esperadas (qué significa que la fuente caiga a 0) para el monitoreo del run recurrente.

## Registro de uso
| Fecha | Proyecto | Tarea | Resultado | Lección |
|---|---|---|---|---|
| histórico | Scraper-Empleos | uso original (fuente de esta skill): 16 fuentes, 3 hallazgos Algolia ocultos (Idealist/80k/Dynamite) + ATS + RSS fallback + feed/gate Torre | ok | - |
