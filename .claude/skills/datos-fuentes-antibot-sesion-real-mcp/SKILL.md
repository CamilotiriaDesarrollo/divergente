---
name: datos-fuentes-antibot-sesion-real-mcp
regimen: divergente
description: Extraer datos de fuentes con anti-bot agresivo (LinkedIn y similares) usando un Chrome real logueado, manejado por Claude vía Chrome DevTools MCP con pausas humanas, e ingestarlos al pipeline común. Cárgala cuando una fuente esté marcada claude_in_chrome:true, bloquee al scraper desatendido (login/checkpoint/DataDome/403), o pida "sesión real", "Chrome logueado", "puerto 9222" o "MCP chrome".
---

# Fuentes anti-bot con sesión real vía Chrome DevTools MCP

**Nivel actual:** N2 · **Dominio:** Datos y Scraping · **Agente(s):** `datos-scraping`
**Proyectos fuente:** Scraper-Empleos (Fase 3 LinkedIn, operativo desde 2026-06-10)

> Criterio de ascenso a N1: los 5 bloques completos, con activos copiables de ruta real y gotchas verificados (no genéricos). A N2: ≥1 uso real aceptado por el Dueño. A N3: ≥3 usos exitosos en ≥2 proyectos + checklist propio.

## 1. Propósito

Algunas fuentes de datos NO se pueden scrapear desatendidas: exigen navegador logueado + ritmo humano (LinkedIn Jobs es el caso canónico, fuente F039 en Scraper-Empleos). Un harvester autónomo se banea al primer checkpoint. Esta skill resuelve el patrón completo:

- **Chrome real logueado** con perfil aislado y remote-debugging en el puerto 9222.
- **Claude maneja ese Chrome** vía el MCP `chrome-devtools-mcp`, iterando búsquedas parametrizadas **con pausas** (humano en el loop implícito: para al primer checkpoint).
- **Volcado raw → ingesta con merge por hash** a un store persistente que el orquestador inyecta como **una fuente más** (mismo matcher, misma curaduría, sobrevive a re-scrapes).

Se carga cuando: una fuente está marcada `claude_in_chrome: true` en el catálogo; un scraper desatendido falla por login/checkpoint/DataDome/403 (Wellfound, WTTJ, Devex, IADB, Glassdoor son ejemplos reales bloqueados); o el Dueño pide explícitamente cosechar con su sesión real.

## 2. Procedimiento

**Setup (una sola vez por proyecto):**

1. Declara el MCP en `.mcp.json` (NO en `settings.json`) con este bloque exacto (ver `activos/mcp.chrome.json`):
   ```json
   { "mcpServers": { "chrome": { "command": "npx",
     "args": ["-y", "chrome-devtools-mcp@latest", "--browserUrl", "http://127.0.0.1:9222"] } } }
   ```
2. Copia `abrir_chrome_linkedin.ps1`. Ajusta el nombre del perfil aislado (`$automationDir = "$env:LOCALAPPDATA\ChromeScraperEmpleos"`) al proyecto. NUNCA apuntes al `User Data` real de Chrome.
3. Primera corrida del script: en la ventana que abre, loguéate en la fuente (LinkedIn) y marca "recordar sesión". Queda persistida para siempre en ese perfil aislado.

**Cosecha (cada run):**

4. **ORDEN CRÍTICO** (ver gotcha 4.1): PRIMERO `.\scripts\abrir_chrome_linkedin.ps1` (deja Chrome escuchando en 9222), DESPUÉS abre/reinicia Claude Code (el MCP solo se conecta al arrancar).
5. Verifica la conexión del MCP a `http://127.0.0.1:9222`. Si el puerto no escucha, el MCP no levanta.
6. Itera las búsquedas de `linkedin_searches.json` (id, perfil, label, keywords booleanas, location). Construye cada URL de `/jobs/search/` con los `defaults` (`f_TPR=r604800` = últimos 7 días, `sortBy=DD`). Corre **con pausas** entre búsquedas — no en ráfaga.
7. Extrae cards aplicando el filtro de calidad (ver gotcha 4.5): quédate solo con las que tienen `/jobs/view/{id}`; descarta promocionados `/collections/` y el sufijo "with verification". Scrollea el contenedor `.scaffold-layout__list` para forzar el lazy-load.
8. Escribe el raw en `data/linkedin_raw.json` con el esquema de `activos/linkedin_raw.ejemplo.json`: `{ cosechado_en, ofertas: [{ jobId, perfil_origen, search_id, titulo, empresa, ubicacion, url }] }`.
9. `python scripts/ingest_linkedin.py --dry-run` para revisar; luego sin flag para normalizar y **mergear por hash** en `data/linkedin_latest.json`.
10. `python main.py` (o `--upload`): la fuente entra al pipeline como una más y sobrevive re-scrapes.

**Criterios de decisión:**
- ¿Cuenta a usar? La **personal del Dueño**, en modo job-search de bajo riesgo y pausado. Un perfil desechable es MÁS peligroso: se banea rápido y ve menos por el commercial-use limit (decisión de Camilo, gotcha 4.6).
- ¿Enriquecer con la descripción de cada oferta? NO por defecto: 10× navegaciones = 10× riesgo de checkpoint. Se acepta scoring title-only ruidoso porque la curaduría es el filtro real (gotcha 4.7).
- ¿Automático o desatendido? Estas fuentes van marcadas `claude_in_chrome: true` en el catálogo y quedan FUERA del cron desatendido; solo corren en sesión asistida.

## 3. Activos copiables

Todos verificados en `Scraper-Empleos` y copiados a `activos/` de esta skill.

- **`activos/abrir_chrome_linkedin.ps1`** (origen: `Scraper-Empleos/scripts/abrir_chrome_linkedin.ps1`). Lanza Chrome con `--remote-debugging-port=9222`, `--user-data-dir` a un perfil aislado, valida que 9222 esté libre con `Get-NetTCPConnection`, detecta el ejecutable de Chrome en 3 rutas típicas. Adaptar: `$automationDir` (nombre del perfil) y la URL de arranque.
- **`activos/mcp.chrome.json`** (origen: `Scraper-Empleos/.mcp.json`). Config del MCP `chrome`. Copiar a `.mcp.json` del proyecto tal cual; solo cambia si usas otro puerto.
- **`activos/linkedin_searches.json`** (origen: `Scraper-Empleos/bootstrap_output/linkedin_searches.json`). 8 búsquedas booleanas parametrizadas (CT/DIV) + `defaults`. Adaptar: reemplaza `keywords`/`location`/`perfil` por los del nuevo dominio; conserva la forma (id, perfil, label, keywords, location) que consume el ingest.
- **`activos/ingest_linkedin.py`** (origen: `Scraper-Empleos/scripts/ingest_linkedin.py`). Normaliza el raw (parsea modalidad de "(Híbrido)", recorta campos), mergea por hash conservando la entrada vieja (preserva `fecha_extraccion`). Depende de `calcular_hash_oferta(fuente_nombre, titulo, empresa_entidad)` de `scrapers/base.py` (md5 de `fuente|titulo_norm|empresa_norm`, normalizado NFD→ascii). Adaptar: `FUENTE_ID`, `FUENTE_NOMBRE`, y el mapeo de campos si tu `Oferta` difiere.
- **`activos/linkedin_raw.ejemplo.json`** (origen: `Scraper-Empleos/data/linkedin_raw.json`). Esquema de referencia del volcado crudo que produce la sesión MCP y consume el ingest. Datos de ofertas públicas, sin secretos.

Enganche en el orquestador (patrón, en `Scraper-Empleos/main.py`): `cargar_linkedin_store()` lee `linkedin_latest.json`, reconstruye `Oferta(**d)` por fila y las inyecta en `ofertas_raw` antes del dedup global, con su entrada en `stats_fuentes`. Así la fuente MCP fluye por matcher + curaduría + Sheet igual que las scrapeadas.

## 4. Gotchas verificados

Todos con evidencia en la memoria `fase3-linkedin-chrome-mcp.md` del proyecto Scraper-Empleos.

- **4.1 Orden de arranque (rompe el MCP si se invierte).** PRIMERO correr el `.ps1` que deja Chrome escuchando en 9222; DESPUÉS abrir/reiniciar Claude Code. El MCP `chrome` solo se conecta al arrancar: si 9222 no escucha en ese momento, falla y no reintenta. Evidencia: `fase3-linkedin-chrome-mcp.md` ("ORDEN DE ARRANQUE CRÍTICO").
- **4.2 El flag es `--browserUrl`, NO la env var `BROWSER_URL`.** Configurar por variable de entorno no conecta el MCP. Evidencia: `fase3-linkedin-chrome-mcp.md` ("OJO: el flag es `--browserUrl`").
- **4.3 La config va en `.mcp.json`, NO en `settings.json`.** Se documentó primero mal en `settings.json`; el MCP `chrome` vive en `.mcp.json`. Evidencia: misma memoria ("config en `.mcp.json`, NO en settings.json").
- **4.4 Perfil aislado obligatorio, no el `User Data` real.** Usar el perfil real colisiona con el singleton-lock del Chrome diario (impide usarlo en paralelo) y viola la regla de no compartir perfil con otros proyectos (feedback-no-tocar-eventos). Solución: `--user-data-dir` a `%LOCALAPPDATA%\ChromeScraperEmpleos`, exclusivo del proyecto. Evidencia: `abrir_chrome_linkedin.ps1` (comentario de cabecera) + memoria.
- **4.5 Cards contaminadas.** El buscador mezcla promocionados y verificados. Si no filtras, ingieres basura: quédate solo con `/jobs/view/{id}`, descarta `/collections/` y el sufijo "with verification"; y scrollea `.scaffold-layout__list` o el lazy-load no carga todas las cards. Evidencia: `fase3-linkedin-chrome-mcp.md` (paso 2 del flujo de cosecha).
- **4.6 Cuenta desechable = peor, no mejor.** Un perfil nuevo se banea rápido y ve menos ofertas por el commercial-use limit de LinkedIn. Se decidió cuenta personal real, job-search de bajo riesgo, pausado; y "Claude maneja con pausas" por encima de un harvester autónomo, porque para al primer checkpoint. Evidencia: `fase3-linkedin-chrome-mcp.md` ("Decisión de cuenta").
- **4.7 Scoring title-only ruidoso (no lo arregles enriqueciendo).** Las cards no traen descripción → el matcher puntúa solo por título y se invierte (ej. "Growth Marketing Director" CT=75 quedó > "Head of Data & Analytics" CT=52). Enriquecer con la descripción = 10× navegaciones = 10× riesgo. Se acepta el ruido: la curaduría LLM es el filtro real. Evidencia: `fase3-linkedin-chrome-mcp.md` ("CAVEAT de scoring") + `feedback-calibracion-match-ct.md`.
- **4.8 Merge que preserva, no que pisa.** `ingest_linkedin.py` conserva la entrada vieja cuando el hash ya existe (mantiene la `fecha_extraccion` original); la curaduría del pipeline se preserva vía `ofertas_latest.json`. Si sobreescribieras, perderías el histórico y la curaduría en cada re-scrape. Evidencia: `ingest_linkedin.py` (comentario "si ya existe, conservamos la entrada vieja").

## 5. Criterios de done

- [ ] `.mcp.json` tiene el bloque `chrome` con `--browserUrl http://127.0.0.1:9222` (no en settings.json, no por env var).
- [ ] `abrir_chrome_linkedin.ps1` apunta a un perfil AISLADO (`--user-data-dir` propio del proyecto), valida el puerto 9222 y NO toca el `User Data` real.
- [ ] La sesión de la fuente quedó logueada y persiste entre runs (no re-loguear).
- [ ] Arranque en el orden correcto: Chrome en 9222 ANTES de abrir Claude Code, MCP conectado y verificado.
- [ ] La cosecha filtró cards (`/jobs/view/{id}`, sin `/collections/` ni "with verification") y escribió `data/linkedin_raw.json` con el esquema esperado.
- [ ] `ingest_linkedin.py` corrió (dry-run revisado) y mergeó por hash en `linkedin_latest.json` SIN duplicar ni pisar entradas viejas.
- [ ] `main.py` cargó el store: la fuente aparece en `stats_fuentes` y sus ofertas fluyen al pipeline (matcher + curaduría + Sheet).
- [ ] La fuente está marcada `claude_in_chrome: true` en el catálogo y queda FUERA del cron desatendido.
- [ ] Cero secretos/credenciales/.env copiados o versionados; se usó la cuenta acordada con el Dueño.

## Registro de uso
| Fecha | Proyecto | Tarea | Resultado | Lección |
|---|---|---|---|---|
| histórico | Scraper-Empleos | Uso original (fuente de esta skill): cosecha LinkedIn F039 vía Chrome DevTools MCP con sesión real e ingesta al pipeline | ok | - |
