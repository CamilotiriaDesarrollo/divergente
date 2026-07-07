---
name: qa-test-regresion-baseline
regimen: universal
description: Protege refactors "sin cambio de comportamiento" (scoring, cálculo, transformación de negocio) capturando la salida sobre un dataset real ANTES del cambio y exigiendo diff = 0 DESPUÉS. Cárgala al migrar lógica hardcodeada a data-driven, al generalizar un algoritmo, o siempre que el DoD diga "el resultado debe ser idéntico".
---

# QA — Test de regresión por baseline (diff exigido = 0)

**Nivel actual:** N2 · **Dominio:** QA y Calidad · **Agente(s):** `qa-ingeniero`
**Proyectos fuente:** Scraper-Empleos (refactor del matcher de scoring: hardcodeado → data-driven, commit `631366e`, 2026-06-15)

> Criterio de ascenso a N3: ≥3 usos exitosos en ≥2 proyectos + checklist propio.

## 1. Propósito

Cuando un refactor promete "no cambia el comportamiento" (generalizar un algoritmo, mover constantes a config, reescribir un motor de cálculo), la única prueba honesta es: correr el sistema real sobre un dataset real antes y después, y exigir que la salida sea **idéntica**. No tests unitarios de casos inventados — el sistema completo sobre datos de producción.

Caso fuente: en Scraper-Empleos el `matcher.py` scoreaba ofertas contra 2 perfiles (CT, DIV) con la calibración **cableada en constantes de Python**. Había que generalizarlo a N perfiles moviendo esa calibración a `config/perfiles.json`. El riesgo: que al reescribir el motor, el score de las ofertas ya calibradas cambiara sin que nadie lo notara. La red de seguridad fue `scripts/test_regresion_matcher.py`: capturó el score CT/DIV de ~2.014 ofertas reales, y tras el refactor exigió **diff = 0**. Resultado: los scores CT/DIV quedaron idénticos.

Se carga siempre que el trabajo sea un refactor de lógica de negocio con invariante de salida: scoring, pricing, transformación de datos, migración de reglas a config. No aplica a features nuevas (ahí no hay baseline que preservar).

## 2. Procedimiento

El patrón es **baseline → refactor → check**, con una regla de oro: **capturar solo el invariante que prometes preservar**, no toda la salida.

1. **Identifica el invariante.** ¿Qué exactamente debe quedar idéntico? En el matcher fue el score entero 0-100 de CT y DIV — NO las `razones` (texto explicativo), que pueden cambiar de formato sin romper nada. Diferenciar invariante (score) de salida volátil (texto) evita falsas regresiones. Docstring de `test_regresion_matcher.py`, líneas 13-14.

2. **Elige una clave de identidad estable por registro.** No el índice del array (un re-scrape cambia orden y cantidad → falsos diffs). En el matcher se usó el **mismo hash de deduplicación** de la oferta: `calcular_hash_oferta(fuente, titulo, empresa)` de `scrapers/base.py`. Así el baseline sobrevive a re-scrapes y solo compara ofertas presentes en ambos lados.

3. **Si el refactor va a borrar constantes, extráelas ANTES en un script one-shot.** En el caso fuente `migrar_calibracion_a_json.py` volcó `matcher.KEYWORDS_CT_POSITIVAS`, `ROLES_HANDSON_CT`, `CIUDADES_CT`, etc. a `config/perfiles.json`. **Debe correr mientras las constantes aún existen** — importa símbolos que el refactor eliminará. Es idempotente (re-ejecutar da el mismo resultado).

4. **Genera el baseline con el código ORIGINAL, sin tocar aún:**
   ```
   python scripts/test_regresion_matcher.py --baseline
   ```
   Escribe `{hash: {CT, DIV}}` en `data/_regresion_baseline.json`. Verifica que git no reporte cambios en el módulo objetivo en este momento — el baseline debe ser del código viejo.

5. **Haz el refactor.** Al añadir capacidades nuevas durante un refactor "sin cambio", esas capacidades deben **nacer inertes** para los registros bajo regresión, o el diff no dará 0. En el matcher: el gate `requiere_keyword_contenido` default `False` y `keywords_negativas: []` para CT/DIV (`matcher.py` línea 103; `migrar_calibracion_a_json.py` línea 44 — comentario "regresión exacta").

6. **Corre el check y exige exit 0:**
   ```
   python scripts/test_regresion_matcher.py --check
   ```
   Compara re-score contra baseline. Exit codes: `0` sin regresión, `1` regresión (imprime los scores que cambiaron), `2` no hay baseline. Las ofertas del baseline que ya no están se reportan aparte (`faltan`), no como regresión.

7. **Si hay diff:** cada línea muestra `hash CT: viejo → nuevo`. O el refactor sí cambió comportamiento (bug), o una capacidad nueva no quedó inerte (paso 5). No se cierra la tarea hasta diff = 0 o hasta que el Dueño apruebe explícitamente el cambio de comportamiento.

## 3. Activos copiables

Ambos en `activos/` de esta skill (copiados de `Scraper-Empleos/scripts/`, sin secretos):

- **`activos/test_regresion_matcher.py`** — plantilla del patrón baseline/check. Qué adaptar: `OFERTAS` (ruta al dataset), `BASELINE` (dónde guardar), `PERFILES_REGRESION` (las dimensiones a congelar), `_hash_de()` (tu clave de identidad estable) y la línea `matcher.scorear(o, p).score` (tu función bajo prueba + el campo invariante). El resto — argparse `--baseline`/`--check`, el bucle de comparación, el reporte de diffs y de faltantes, los exit codes — se reusa tal cual. Origen: `Scraper-Empleos/scripts/test_regresion_matcher.py`.

- **`activos/migrar_calibracion_a_json.py`** — plantilla del one-shot "extraer hardcode → config" que precede al refactor. Solo aplica cuando el refactor es una migración de constantes a data. Qué adaptar: los `match_*()` que mapean constantes viejas → esquema JSON nuevo, y la ruta `CONFIG`. Idempotente por diseño. Origen: `Scraper-Empleos/scripts/migrar_calibracion_a_json.py`.

Nota: NO se copió `config/perfiles.json` porque contiene calibraciones de perfiles de personas reales. El esquema del bloque `match` se lee del default seguro `_MATCH_VACIO` en `matcher.py` líneas 95-104.

## 4. Gotchas verificados

1. **Consola Windows en cp1252 rompe con flechas/acentos.** Los `print` con `→`, `✓`, `✖` lanzan `UnicodeEncodeError` en la terminal por defecto de Windows. Solución aplicada en ambos scripts (`test_regresion_matcher.py` líneas 24-28): `try: sys.stdout.reconfigure(encoding="utf-8") except Exception: pass`. Sin esto, el script muere al imprimir el reporte.

2. **Clave por posición = regresión fantasma.** Si el baseline se indexara por posición en el array, un re-scrape (cambia orden y cantidad de ofertas) generaría diffs masivos que no son regresiones reales. Por eso la clave es el hash de dedup, y las ofertas ausentes se cuentan como `faltan` (líneas 75-86), separadas de las diferencias de score. Diferenciar "cambió el dataset" de "cambió el algoritmo" es la mitad del valor del test.

3. **Diffear toda la salida = falso positivo garantizado.** El primer instinto es comparar el objeto completo. Pero las `razones` (texto humano) cambian de formato en cualquier refactor cosmético. El test compara **solo el entero del score**; el docstring documenta explícitamente que "las razones (texto) pueden cambiar de formato sin romper". Congela el contrato, no la presentación.

4. **El script de extracción debe correr ANTES de borrar las constantes.** `migrar_calibracion_a_json.py` hace `import matcher` y lee `matcher.KEYWORDS_CT_POSITIVAS`, que el refactor va a eliminar. Si se corre después, `AttributeError`. El orden es: extraer → baseline → refactor → check. Documentado en su docstring, líneas 6-7.

5. **Capacidades nuevas deben nacer inertes para lo que estás congelando.** El refactor a data-driven añadió un gate anti-ruido (`requiere_keyword_contenido`) y keywords negativas por perfil. Si CT/DIV los hubieran heredado activos, el score habría cambiado y el diff no daría 0. Se dejaron en `False` / `[]` a propósito, con el comentario "su calibración no lo necesita → regresión exacta" (`matcher.py` línea 103). Regla: en un refactor "sin cambio", toda feature nueva default = comportamiento viejo.

6. **Cache de config entre baseline y check.** `matcher._cargar_perfiles()` está bajo `@lru_cache` (línea 81). En corridas separadas (baseline y check son dos procesos) no hay problema. Pero si alguna vez se corren en el mismo proceso o se editan perfiles en caliente, hay que invalidar con `matcher.recargar_perfiles()` (línea 135) o el check leerá config vieja.

## 5. Criterios de done

- [ ] El invariante está declarado por escrito: qué campo/dimensión debe quedar idéntico y qué se permite cambiar (p. ej. "score entero CT/DIV; el texto de razones puede variar").
- [ ] El baseline se generó con el código ORIGINAL (git limpio en el módulo objetivo al momento del `--baseline`) y quedó versionado o registrado (`data/_regresion_baseline.json`).
- [ ] La clave de identidad es estable (no posicional): el baseline sobrevive a un re-run del dataset.
- [ ] `--check` devuelve exit `0` y "Sin regresión": **0 diffs** en el invariante.
- [ ] Las ofertas/registros faltantes están explicados como cambio de dataset, no como regresión no investigada.
- [ ] Si algún score cambió, o se corrigió el bug hasta diff = 0, o el Dueño aprobó explícitamente el cambio de comportamiento (y quedó anotado).

## Registro de uso
| Fecha | Proyecto | Tarea | Resultado | Lección |
|---|---|---|---|---|
| histórico | Scraper-Empleos | Uso original (fuente de esta skill): red de seguridad del refactor matcher hardcodeado → data-driven sobre ~2.014 ofertas reales (commit `631366e`) | ok | Congelar solo el invariante (score entero), usar la clave de dedup como identidad y dejar las features nuevas inertes → diff = 0 exacto |
