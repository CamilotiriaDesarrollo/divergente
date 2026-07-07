---
name: back-matching-scoring-data-driven
regimen: divergente
description: Diseña motores de scoring 0-100 genéricos para N perfiles con toda la calibración externalizada en JSON y razones explicables por cada punto sumado o restado. Cargar cuando haya que puntuar/rankear ítems de texto contra perfiles o criterios (ofertas, leads, convocatorias, candidatos), añadir un perfil nuevo a un matcher existente, o refactorizar un scoring hardcodeado a data-driven sin alterar resultados ya calibrados.
---

# Matching y scoring data-driven (0-100, N perfiles)

**Nivel actual:** N2 · **Dominio:** Backend · **Agente(s):** `back-node-api`
**Proyectos fuente:** Scraper-Empleos (`C:\Users\camil\Desktop\IA Raiz Proyectos\002 Desarrollos\Scraper-Empleos`)

> Criterio de ascenso a N1: los 5 bloques completos, con activos copiables de ruta real y gotchas verificados (no genéricos). A N2: ≥1 uso real aceptado por el Dueño. A N3: ≥3 usos exitosos en ≥2 proyectos + checklist propio.

## 1. Propósito

Puntuar ítems de texto (ofertas laborales, convocatorias, leads…) contra N perfiles con un score 0-100 **sin LLM**: determinista, barato, explicable y re-ejecutable sobre miles de ítems en segundos. La clave del patrón, probada en Scraper-Empleos (`matcher.py`, refactor 2026-06-15):

- **El motor es genérico; la calibración vive en JSON** (`config/perfiles.json` › perfil › `match`). Añadir un perfil (allí pasó con PAU) = poblar su bloque `match`; el código no se toca.
- **Cada score trae sus razones** (`ScoreResult(score, razones)`): el usuario final ve "+16 keywords positivas (…)", "-45 rol técnico hands-on (…)" y puede auditar/calibrar.
- **Todo refactor del motor se protege con test de regresión baseline** (diff = 0 sobre los perfiles ya calibrados).

Se carga cuando: se diseña un matcher/scorer nuevo; se añade o recalibra un perfil; se migra calibración hardcodeada a config; se depura por qué algo matchea (o no).

## 2. Procedimiento

1. **Definir la fórmula aditiva con topes.** La calibrada en Scraper-Empleos (`matcher.py` líneas 16-19):
   `base 30 + keywords positivas (+4 c/u, tope +40) − negativas (−10 c/u, tope −40) + geografía (0..+12 por diccionario) + modalidad (−6..+12) + seniority (−25..+14) − penalizaciones por rol en el TÍTULO`, y al final `max(0, min(100, score))`. Los topes evitan que una dimensión domine; la base 30 deja espacio para que las penalizaciones hundan sin llegar siempre a 0.
2. **Separar lo GLOBAL de lo POR-PERFIL.** Global en el módulo: keywords negativas universales (junior, becario, call center…), tabla de modalidad, tabla de seniority y los **pesos** del algoritmo. Por-perfil en JSON: keywords positivas/negativas extra, roles penalizados, ciudades con bonus, ciudades base de presencialidad, tipos de oferta, umbral. Criterio: si cambiarlo requiere re-pensar el algoritmo → código; si es gusto/criterio de un perfil → JSON.
3. **Tres niveles de penalización por rol, solo sobre el TÍTULO** (el título define el rol; la descripción mete ruido):
   - `roles_handson` −45: el oficio que el perfil NO ejerce (para CT: developer, data scientist…). Irrescatable.
   - `roles_funcion_excluida` −38: función ajena dura (ventas, finanzas, fundraising).
   - `roles_exec_generico` −30: ejecutivo genérico (CEO, executive director) — **rescatable** si el contenido suma keywords. Se aplica solo el primer match y `funcion_excluida` tiene prioridad sobre `exec_generico` (ver `_penalizacion_primer_match` y el paso 6.5 de `scorear()`).
4. **Normalizar TODO texto antes de comparar** — convención transversal del proyecto: `unicodedata.normalize("NFD", s).encode("ascii","ignore").decode("ascii")` + `lower()` (función `_normalizar`). Las keywords del JSON se escriben ya normalizadas (minúsculas, sin tildes).
5. **Word boundaries para keywords cortas.** Regla de `_contar_matches`: keyword ≤4 chars o sigla ≤5 → regex `r"\b" + re.escape(kw) + r"\b"`; keyword larga → substring directo (más barato y tolera pluralizaciones). Sin esto, "ia" matchea "creat**ia**"/"creativa" y "Perú" matchea "Perugia" (ver gotcha 1).
6. **Defaults seguros + merge.** Un dict `_MATCH_VACIO` con todas las claves en vacío/False y `{**_MATCH_VACIO, **cfg}` al cargar: un perfil a medio configurar (GIS, POL) scorea cerca de la base en vez de romper con `KeyError`. `perfil_tiene_criterios()` (tiene `keywords_positivas`) decide si el perfil entra al scoring masivo.
7. **Gate de contenido opt-in** (`requiere_keyword_contenido: true` + `CAP_SIN_CONTENIDO = 40`): si la oferta no tiene NINGUNA keyword positiva del perfil, el score se capea a 40 y no cruza el umbral solo por geografía+modalidad+seniority. Opt-in por perfil: CT/DIV lo dejan en `False` porque su calibración no lo necesita y así la regresión da diff exacto 0.
8. **Umbral configurable por perfil** (`umbral_match`, default 50): PAU lo bajó a 45 porque sus fuentes son curadas con títulos cortos (menos texto = menos keywords acumulables). Bajar umbral es la palanca cuando el perfil es preciso pero el score no alcanza; añadir keywords es la palanca cuando faltan matches temáticos.
9. **Devolver razones siempre.** Cada componente que suma/resta agrega una línea legible: `f"+{pos_bonus} keywords positivas ({', '.join(pos_found[:4])}...)"`. Sin razones no hay calibración posible con el Dueño.
10. **Al refactorizar el motor: baseline primero.** ANTES de tocar código: `python scripts/test_regresion_matcher.py --baseline` (guarda `{hash_oferta: {perfil: score}}`); DESPUÉS: `--check` y exigir **diff = 0**. Se compara solo el score entero; las razones (texto) pueden cambiar de formato sin romper.
11. **Al recalibrar keywords/perfiles: re-scorear sin re-scrapear.** `python scripts/rescorear.py` (dry-run: reporta transiciones de perfil `∅ → CT: n`), revisar el delta, y solo entonces `--apply`. **Preserva la curaduría humana**: `estado` y `notas` no se tocan.
12. **Cachear la config con invalidación explícita:** `@lru_cache(maxsize=1)` en la carga del JSON + `recargar_perfiles()` que hace `cache_clear()` para tests y cambios en caliente.

## 3. Activos copiables

Copiados a `activos/` de esta skill (origen: `C:\Users\camil\Desktop\IA Raiz Proyectos\002 Desarrollos\Scraper-Empleos`):

| Activo | Origen | Qué es / cuándo copiarlo | Qué adaptar |
|---|---|---|---|
| `activos/matcher.py` | `matcher.py` (raíz del proyecto) | Motor completo: fórmula, normalización, word boundaries, 3 niveles de penalización, gate, umbral por perfil, `ScoreResult`. Punto de partida de cualquier scorer nuevo. | Rutas `_PERFILES_PATH`/`_PREFS_PATH`; tablas globales (`KEYWORDS_NEGATIVAS`, `MODALIDAD_BONUS`, `SENIORITY_BASE`) al dominio; eliminar `scorear_ambos` (compat legacy CT/DIV). |
| `activos/perfiles.ejemplo.json` | esquema de `config/perfiles.json` (SANITIZADO: el original tiene datos personales y no se copia) | Esquema del bloque `match` con la semántica de cada campo documentada en `_semantica_match`. Base para el JSON de calibración de un proyecto nuevo. | Poblar perfiles reales; borrar `_semantica_match` en producción si estorba. |
| `activos/test_regresion_matcher.py` | `scripts/test_regresion_matcher.py` | Red de seguridad `--baseline` / `--check` con diff=0 por hash de ítem. Copiar SIEMPRE que se vaya a refactorizar un scoring ya calibrado. | Función de hash del ítem (`calcular_hash_oferta`), ruta del dataset, lista `PERFILES_REGRESION`. |
| `activos/rescorear.py` | `scripts/rescorear.py` | Re-aplica el matcher al último dataset sin re-scrapear, dry-run por defecto, preserva `estado`/`notas`, reporta transiciones entre perfiles. | Lógica de enrutamiento (`enrutar()` replica el paso 3 de `main.py`: tipos por perfil + mutuamente excluyente); umbral; nombres de campos. |
| `activos/migrar_calibracion_a_json.py` | `scripts/migrar_calibracion_a_json.py` | Patrón one-shot idempotente para volcar calibración hardcodeada a JSON, corriéndolo ANTES del refactor (importa las constantes que el refactor eliminará). | Nombres de constantes y mapeo constante→campo del esquema. |

## 4. Gotchas verificados

1. **Substring sin word boundary matchea falsos cognados.** "Perú" matcheaba "Perugia, Italy" (UNESCO) e "intern" matcheaba "internos" (UNDP); en el matcher, "ia" matchearía "creativa". Solución: regex compiladas con `\b` para keywords ≤4 chars o siglas. Evidencia: `Scraper-Empleos\docs\REPORTE_SCRAPING_2026-06-10.md` (tabla §5, fila "Word boundaries en filtros"), `scrapers\sitios\unesco.py` línea 34, y `matcher.py::_contar_matches`.
2. **Refactorizar un scoring calibrado sin baseline cambia scores en silencio.** El refactor hardcode→data-driven (2026-06-15) se hizo con `test_regresion_matcher.py --baseline` antes y `--check` después exigiendo diff=0 sobre CT/DIV. Detalle fino: comparar solo el score entero por hash — las razones cambian de formato legítimamente. Evidencia: `Scraper-Empleos\scripts\test_regresion_matcher.py` (docstring líneas 1-15).
3. **Perfiles ejecutivos genéricos cruzaban el umbral sin contenido del perfil** (sumando solo geografía + modalidad + seniority: 30+12+12 ≈ 54 > 50). Solución: gate `requiere_keyword_contenido` con cap 40, **opt-in por perfil** — activarlo globalmente habría roto la regresión de CT/DIV. Evidencia: `matcher.py` líneas 95-107 y paso 8 de `scorear()` (líneas 366-370); PAU lo activa en `config\perfiles.json` (`"requiere_keyword_contenido": true`).
4. **Recalibrar y re-scrapear para ver el efecto es lento y arriesga la curaduría.** Los estados aprobado/rechazado son trabajo humano; un re-score ingenuo los pisaría. Solución: `rescorear.py` re-puntúa `ofertas_latest.json` en dry-run (tabla antes/después + transiciones) y en `--apply` reescribe solo `score_match`/`perfiles_match`, nunca `estado`/`notas`. Evidencia: `Scraper-Empleos\scripts\rescorear.py` (docstring y líneas 96-98).
5. **`lru_cache` sobre el JSON de perfiles deja tests y cambios en caliente leyendo config vieja.** Solución: exponer `recargar_perfiles()` → `_cargar_perfiles.cache_clear()`. Evidencia: `matcher.py` líneas 81-91 y 135-137.
6. **Un peso único de penalización de rol o mata de más o filtra de menos.** Se calibraron 3 niveles con semántica distinta: hands-on −45 (irrescatable con tope de keywords +40), función ajena −38, ejecutivo genérico −30 (rescatable: +40 de keywords lo devuelve a zona de match). Y solo sobre el TÍTULO: en la descripción esas palabras aparecen como contexto, no como rol. Evidencia: `matcher.py` líneas 155-158 y 341-358.
7. **Señales aprendidas del usuario deben ir acotadas o dominan la calibración.** Las preferencias "me encanta/descartar" de la landing ajustan como máximo +12/−16 y exigen keyword ≥4 chars. Evidencia: `matcher.py::_ajuste_preferencias` (líneas 53-74).
8. **Consola Windows en cp1252 revienta con flechas/acentos en los reportes de scripts.** Solución al inicio de cada CLI: `sys.stdout.reconfigure(encoding="utf-8")` envuelto en try/except. Evidencia: `scripts\test_regresion_matcher.py` líneas 24-28, `scripts\rescorear.py` línea 27.

## 5. Criterios de done

- [ ] Toda la calibración por-perfil vive en un JSON versionado; el módulo del motor no contiene keywords/ciudades/roles de ningún perfil concreto.
- [ ] Añadir un perfil nuevo NO requiere tocar el motor: solo poblar su bloque `match` (probado añadiendo un perfil de juguete).
- [ ] El score es 0-100 con clamp final, y **cada** componente que suma/resta deja una razón legible en `ScoreResult.razones`.
- [ ] Keywords ≤4 chars y siglas se evalúan con `\b`; todo texto y keyword pasa por la normalización NFD→ascii+lower (verificado con un caso tipo "ia"/"creativa").
- [ ] Existe test de regresión baseline y, si hubo refactor del motor, `--check` reporta diff = 0 en los perfiles previamente calibrados.
- [ ] Existe camino de re-score sin re-ingesta, con dry-run por defecto, que preserva los campos de curaduría humana.
- [ ] Perfil sin calibrar no rompe el scoring masivo (default vacío + merge) ni aparece en resultados (`perfil_tiene_criterios`).
- [ ] Umbral y gate de contenido son por-perfil; activar el gate en un perfil no altera los scores de los demás.
- [ ] Ningún dato personal (nombres, salarios, descripciones de personas) queda embebido en código; solo en el JSON de config del proyecto.

## Registro de uso

| Fecha | Proyecto | Tarea | Resultado | Lección |
|---|---|---|---|---|
| histórico | Scraper-Empleos | uso original (fuente de esta skill) | ok | - |
