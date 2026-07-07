---
name: datos-google-sheets-bd-operacional
regimen: divergente
description: Usar Google Sheets como base de datos operacional de un pipeline (scraper, ETL, curaduría) respetando sus rate limits estrictos. Cargar cuando un proyecto necesite leer/escribir un Sheet vía gspread + service account, deduplicar contra el histórico del Sheet, generar ids consecutivos por pestaña, o testear la capa Sheets sin credenciales.
---

# Google Sheets como BD operacional

**Nivel actual:** N2 · **Dominio:** datos (Datos y Scraping) · **Agente(s):** `datos-scraping`
**Proyectos fuente:** Scraper-Empleos (`C:\Users\camil\Desktop\IA Raiz Proyectos\002 Desarrollos\Scraper-Empleos`)

> Criterio de ascenso a N1: los 5 bloques completos, con activos copiables de ruta real y gotchas verificados (no genéricos). A N2: ≥1 uso real aceptado por el Dueño. A N3: ≥3 usos exitosos en ≥2 proyectos + checklist propio.

## 1. Propósito

Montar y operar un Google Sheet como base de datos de un pipeline automatizado: pestañas de datos + pestañas de operación (LOG, CONTROL, MANUAL), escritura batch, dedup por hash contra el histórico e ids consecutivos legibles (`CT00001`). Se carga cuando:

- El destino de los datos es un Sheet que un humano cura desde la UI de Google (estados, notas), no una BD SQL.
- El volumen es bajo-medio (cientos de filas por corrida, como las ~760 ofertas/run de Scraper-Empleos) y hay UN solo escritor programático — el Sheet no soporta escritores concurrentes ni transacciones.
- Google API impone rate limits estrictos: cada lectura/escritura de celda cuenta como API call, por lo que TODO acceso debe ser batch (regla explícita en `Scraper-Empleos\CLAUDE.md`: "Batch updates en Sheets (rate limits estrictos de Google API)").

NO usarla si hay concurrencia de escritores, necesidad de joins/consultas, o >decenas de miles de filas: ahí aplica `datos-sqlserver-convenciones-y-scripts-versionados`.

## 2. Procedimiento

1. **Configuración centralizada** (patrón `config.py`): `SHEET_ID` y `GOOGLE_CREDENTIALS_PATH` desde `.env` con `python-dotenv`; nombres de pestañas como constantes (`TAB_LOG = "LOG"`); credenciales en `credentials/service-account.json` (carpeta gitignoreada). Función `validar_config(estricto)` que devuelve la lista de problemas — fail-fast al arrancar.
2. **Cliente singleton con `lru_cache`** — un solo login por proceso:
   ```python
   @lru_cache(maxsize=1)
   def get_client() -> gspread.Client:
       creds = Credentials.from_service_account_file(str(config.GOOGLE_CREDENTIALS_PATH), scopes=SCOPES)
       return gspread.authorize(creds)
   ```
   `SCOPES = ["https://www.googleapis.com/auth/spreadsheets", "https://www.googleapis.com/auth/drive"]`. Igual con `get_spreadsheet()`. Toda la lógica del Sheet vive en UN módulo (`sheets_client.py`), nunca dispersa.
3. **Headers como constantes** (`HEADERS_OFERTAS`, `HEADERS_LOG`, …) y creación idempotente:
   ```python
   try:
       ws = sp.worksheet(name)
   except gspread.WorksheetNotFound:
       ws = sp.add_worksheet(title=name, rows=1000, cols=max(26, len(headers) + 2))
       ws.update("A1", [headers])
   ```
   Criterio de decisión: pestañas de operación (CONTROL/LOG/MANUAL) se crean eager al inicio del upload (`asegurar_pestanas_operacion`); pestañas de datos por partición (`OFERTAS_CT`, `OFERTAS_DIV`) se crean **lazy**, solo si hay filas de esa partición que subir (`asegurar_pestana_ofertas(perfil)`). El nombre se deriva data-driven: `tab_ofertas(perfil)` → `f"OFERTAS_{perfil.upper()}"` — una partición nueva no requiere código nuevo.
4. **UNA lectura por pestaña por corrida**, compartida entre consumidores: `registros = leer_pestana_como_dicts(tab)` (envuelve `get_all_records()`) y pasar esos `registros` pre-leídos tanto a `leer_hashes_ofertas(registros)` como a `siguiente_id_oferta(registros)`. Nunca leer celda a celda.
5. **Dedup por hash con fórmula única**: el hash (`md5(fuente|titulo_normalizado|empresa_normalizada)`) vive en UNA función (`calcular_hash_oferta` en `scrapers/base.py`) usada por el objeto en memoria (`Oferta.hash`) Y por la lectura del Sheet. Normalizar antes de hashear con `unicodedata` (lowercase, sin tildes, espacios colapsados) para que "CONSULTORÍA  Datos" y "consultoria datos" dedupliquen.
6. **Ids consecutivos legibles por pestaña**: `siguiente_id_oferta` extrae el máximo con `re.match(r"^[A-Za-z]+(\d+)$", ...)` (tolera prefijos `CT`/`DIV` y legacy `O`); `formatear_id_oferta(n, perfil)` → `f"{prefijo}{n:05d}"`. El consecutivo es POR pestaña: usar siempre los registros de ESA pestaña.
7. **Escritura: UN `append_rows` batch por pestaña por corrida**, mapeando por nombre de columna (robusto ante reordenar columnas en el Sheet):
   ```python
   headers = ws.row_values(1)
   rows_as_lists = [[f.get(h, "") for h in headers] for f in filas]
   ws.append_rows(rows_as_lists, value_input_option="USER_ENTERED")
   ```
8. **Arrays/dicts en celdas → JSON-string** (`json.dumps` en `Oferta.to_dict()` para `perfiles_match`, `score_match`, `destinos`); al leer, parseo tolerante que acepta JSON-string, lista o texto plano (ver `_parse_perfiles` en `scripts/migrar_sheet_por_perfil.py`).
9. **Pestaña LOG de observabilidad**: headers `["fecha", "fuente", "nuevas", "duplicadas", "errores", "duracion_seg"]`; una fila por fuente por corrida, todas en UN solo append batch al final (`registrar_logs_scrape`), fecha ISO automática.
10. **Validar credenciales ANTES del trabajo caro**: `validar_credenciales_upload()` al inicio del pipeline (no solo al subir) lanza un error de dominio (`CredencialesFaltantesError`) con instrucciones de remediación paso a paso, capturado en el `main` sin traceback.
11. **Tests sin tocar producción**: mockear a nivel de `sheets_client.get_spreadsheet` con fakes mínimos (`FakeWorksheet`/`FakeSpreadsheet` que implementan solo `row_values`, `get_all_records`, `append_rows`, `update`, `add_worksheet`) y `mock.patch.object`. Correr con `python scripts/test_upload_mock.py` — no requiere red ni credenciales.
12. **Smoke test de conexión**: el propio módulo cliente es CLI (`python sheets_client.py`) — imprime título del spreadsheet y pestañas existentes, o sale con código 1.

## 3. Activos copiables

Todos en `activos/` de esta skill; origen verificado en Scraper-Empleos.

| Activo | Origen | Qué es / cuándo copiarlo | Qué adaptar |
|---|---|---|---|
| `activos/sheets_client.py` | `Scraper-Empleos\sheets_client.py` | Cliente completo: singleton lru_cache, creación idempotente de pestañas, `append_filas` batch por nombre de columna, hashes+ids con lectura compartida, LOG batch, CLI de smoke test. Copiarlo como base de cualquier capa Sheets nueva. | Constantes `HEADERS_*`, nombres de pestañas, el import de `calcular_hash_oferta` (apuntarlo a la fórmula de hash del dominio nuevo). |
| `activos/config.py` | `Scraper-Empleos\config.py` | Config centralizada: `.env` + dotenv, constantes de pestañas, `tab_ofertas()` data-driven, `validar_config()` fail-fast con modo CLI. | Variables de dominio (salarios, WhatsApp); conservar el bloque Google Sheets y `validar_config`. |
| `activos/test_upload_mock.py` | `Scraper-Empleos\scripts\test_upload_mock.py` | Suite unittest con gspread mockeado: fakes mínimos, tests de dedup, consecutivos con prefijo, idempotencia de pestañas, enrutamiento por partición y columnas de LOG. Copiarlo al crear la capa Sheets para tener red de seguridad desde el día 1. | Los datos de ejemplo (`_oferta`, `_fila_ofertas`) y los asserts de columnas al esquema del proyecto. |
| `activos/.env.example` | `Scraper-Empleos\.env.example` | Plantilla de variables (sin valores): `SHEET_ID`, `GOOGLE_CREDENTIALS_PATH`, flags `DRY_RUN`/`LOG_LEVEL`. | Quitar las variables ajenas (WhatsApp, Devex) si no aplican. |

Referencia adicional (no copiada, leer en el proyecto fuente): `Scraper-Empleos\main.py` líneas 294-411 — `subir_ofertas_al_sheet` es el orquestador de referencia del upload completo (agrupar por partición → asegurar pestaña lazy → una lectura → dedup → ids → un append → LOG).

## 4. Gotchas verificados

1. **Rate limits de Google API: cada operación de celda es un API call.** El proyecto lo trató como restricción de diseño, no como retry: escritura solo vía `append_rows` batch (una llamada por lote) y lectura solo vía `get_all_records()` (una llamada por pestaña). Evidencia: regla "Batch updates en Sheets (rate limits estrictos de Google API)" en `Scraper-Empleos\CLAUDE.md` y docstring de `leer_hashes_ofertas` en `sheets_client.py`: "UNA sola lectura de toda la pestaña (no celda a celda)".
2. **Lecturas duplicadas ocultas: dedup e ids leían la misma pestaña dos veces.** Solución: ambas funciones aceptan `registros` pre-leídos y `main.py` (líneas 367-370) hace UNA lectura y la comparte. Evidencia: firma `leer_hashes_ofertas(registros=None)` y docstring "compartir esa lectura ... y no duplicar API calls" en `sheets_client.py`.
3. **Deriva de la fórmula de hash entre memoria y Sheet rompe el dedup silenciosamente.** Si el hash del objeto en memoria y el calculado desde las filas del Sheet difieren (tildes, mayúsculas, espacios), todo se re-sube como "nuevo". Solución: fórmula única `calcular_hash_oferta` ("ÚNICA fuente de verdad ... si cambia aquí, cambia en ambos lados", `scrapers/base.py` líneas 86-94) + normalización `unicodedata` + test `test_leer_hashes_coincide_con_oferta_hash` que verifica que `"  CONSULTORIA   DATOS "` deduplica contra `"Consultoría datos"` (`scripts/test_upload_mock.py` líneas 145-155).
4. **gspread 6.x cambió el orden de argumentos de `update()`** — `update(values, range_name)` vs el histórico `update(range_name, values)`. El código usa `ws.update("A1", [headers])` y el fake de tests acepta ambos órdenes por compatibilidad. Evidencia: comentario "gspread 6.x: update(values, range_name) — el código usa update('A1', [headers])" en `scripts/test_upload_mock.py` líneas 64-69. Al subir de versión de gspread, revisar este call site primero.
5. **Las celdas no guardan listas: los arrays van como JSON-string, pero vuelven "sucios".** Al leer, `perfiles_match` puede llegar como `'["CT"]'`, lista real o texto plano `'CT'` (filas editadas a mano). Solución: parseo tolerante con fallback a split por comas — `_parse_perfiles` en `scripts/migrar_sheet_por_perfil.py` líneas 42-62. Nunca hacer `json.loads` a secas sobre celdas del Sheet.
6. **Crear pestañas eager que quizá nunca se usen ensucia el Sheet.** La versión inicial creaba OFERTAS al asegurar operación; se corrigió a creación lazy por partición solo cuando hay filas que subir. Evidencia: docstring de `asegurar_pestanas_operacion` ("Las pestañas de ofertas ... NO se crean aquí: se crean lazy") y el test que afirma "Ya NO crea OFERTAS: solo CONTROL/LOG/MANUAL" (`scripts/test_upload_mock.py` líneas 168-183).
7. **Validar credenciales al final desperdicia el run completo.** Un scrape de 16 fuentes (~55s) que falla al subir por falta de `service-account.json` es trabajo perdido. Solución: `validar_credenciales_upload()` se llama ANTES de scrapear — comentario "Fail-fast: validar credenciales ANTES de scrapear para no desperdiciar el run" en `main.py` líneas 425-427 — y el error lista remediación (crear service account, guardar JSON, compartir el Sheet con el email del service account como Editor).
8. **`append_filas` sobre una pestaña sin headers corrompe el mapeo por columna.** El cliente lo detecta y lanza `ValueError(f"Pestaña {tab_name} no tiene headers en la fila 1")` en vez de escribir filas desalineadas (`sheets_client.py` líneas 97-99). Para re-bootstrap usar `limpiar_pestana_conservando_headers` (borra desde la fila 2, preserva headers).
9. **El consecutivo de ids es por pestaña, no global.** Con particiones por perfil, calcular el siguiente id con registros de otra pestaña genera ids duplicados. Evidencia: docstring de `siguiente_id_oferta` ("los registros deben ser los de ESA pestaña") y el test de enrutamiento donde OFERTAS_CT arranca en `CT00001` mientras OFERTAS_DIV continúa en `DIV00008` (`scripts/test_upload_mock.py` líneas 234-259).

## 5. Criterios de done

- [ ] `python config.py` (o equivalente) reporta "Config OK" con `SHEET_ID` y ruta de credenciales existentes; `.env` y `credentials/` están en `.gitignore` y hay `.env.example` sin valores.
- [ ] `python sheets_client.py` conecta y lista las pestañas del spreadsheet real.
- [ ] Toda escritura de datos es batch: máximo UN `append_rows` por pestaña por corrida; ninguna llamada `update_cell`/lectura celda a celda en el código nuevo.
- [ ] Correr el upload dos veces con los mismos datos: la segunda corrida reporta 0 nuevas y no agrega filas (dedup contra histórico verificado, como `test_segundo_upload_todo_duplicado_no_sube_nada`).
- [ ] Los ids nuevos continúan el consecutivo de su pestaña con prefijo y padding (`DIV00007` → `DIV00008`).
- [ ] La pestaña LOG tiene una fila por fuente por corrida con fecha ISO y conteos (nuevas/duplicadas/errores/duración).
- [ ] La suite mock (`python scripts/test_upload_mock.py` adaptada) pasa en verde SIN credenciales ni red.
- [ ] Crear pestañas es idempotente: correr el bootstrap/asegurado dos veces no duplica pestañas ni pisa filas existentes.

## Registro de uso
| Fecha | Proyecto | Tarea | Resultado | Lección |
|---|---|---|---|---|
| histórico | Scraper-Empleos | uso original (fuente de esta skill) | ok | - |
