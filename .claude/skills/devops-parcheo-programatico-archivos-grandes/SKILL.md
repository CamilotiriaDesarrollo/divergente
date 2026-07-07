---
name: devops-parcheo-programatico-archivos-grandes
regimen: universal
description: Edita programáticamente archivos de código demasiado grandes (>50 KB) para las herramientas de edición directa, usando scripts Python que localizan marcadores-comentario únicos sembrados en el código y reemplazan por slicing de índices. Cárgala cuando el Edit tool falle o sea inviable por tamaño de archivo, cuando un componente supere ~50 KB (JSX/JS/HTML con estilos inline o imágenes base64 embebidas), o cuando haya que insertar/colapsar un bloque delimitado dentro de un archivo enorme.
---

# DevOps — Parcheo programático de archivos grandes

**Nivel actual:** N2 · **Dominio:** devops-despliegue · **Agente(s):** `devops-plataforma`
**Proyectos fuente:** Plataforma GEDII

> Criterio de ascenso a N1: los 5 bloques completos, con activos copiables de ruta real y gotchas verificados (no genéricos). A N2: ≥1 uso real aceptado por el Dueño. A N3: ≥3 usos exitosos en ≥2 proyectos + checklist propio.

## 1. Propósito

Cuando un archivo fuente crece por encima de ~50 KB, el Edit tool se vuelve inviable: el `old_string` que hay que reproducir es tan largo que no se puede transcribir sin errores (comillas escapadas, entidades, saltos de línea), y una coincidencia parcial reemplaza en el sitio equivocado. Esta skill resuelve la edición quirúrgica de esos archivos con un **script Python de un solo uso** que abre el archivo con `encoding='utf-8'`, localiza el bloque a cambiar por **marcadores-comentario únicos** ya sembrados en el código, y lo sustituye por **slicing de índices** (`content[:start] + nuevo + content[end:]`).

Regla operativa del proyecto fuente (Plataforma GEDII, `CLAUDE.md` §11): *"Archivos grandes (>50 KB): usar Python con `open(..., encoding='utf-8')` para ediciones, no el Edit tool directamente"*. En ese proyecto `ArquitecturaMetodologica.js` mide 67 KB, `dashboard.js` 60 KB y `page.js` 130 KB — todos por encima del umbral.

## 2. Procedimiento

1. **Decidir si aplica.** Mide el archivo. Si supera ~50 KB (o el Edit tool ya falló por longitud de `old_string`), usa un script Python. Por debajo de 50 KB, edita normal.
2. **Verificar/sembrar marcadores.** El bloque a tocar debe estar delimitado por comentarios únicos e **inequívocos**. Convención verificada en GEDII: `{/* ═══ TAB: NOMBRE ═══ */}` (JSX). Un buen marcador **no lleva comillas** — así no hay que escaparlo en el script. Si no existen, siémbralos primero (una edición pequeña, o dentro del propio script).
3. **Escribir el script de un solo uso** junto a la raíz del proyecto (nómbralo `_patch_<algo>.py`, prefijo `_` = temporal). Estructura mínima probada:
   ```python
   content = open('app/components/ArquitecturaMetodologica.js','r',encoding='utf-8').read()
   start = content.find("      {/* ═══ TAB: CARACTERIZACIÓN DE ACTORES ═══ */}")
   end   = content.find("      {/* ═══ TAB: NIVELES DE VINCULACIÓN ═══ */}")
   if start == -1 or end == -1:
       print("Markers not found, start=%d end=%d" % (start, end))
   else:
       old_block = content[start:end]
       new_block = '''...JSX nuevo...'''
       content = content[:start] + new_block + content[end:]
       open('app/components/ArquitecturaMetodologica.js','w',encoding='utf-8').write(content)
       print("OK — replaced %d chars" % len(old_block))
   ```
4. **Criterio de decisión — localizar vs. reemplazar:**
   - **Insertar/colapsar un bloque delimitado** (dos marcadores) → `find()` de inicio y fin + slicing. Es el caso robusto.
   - **Un único punto de anclaje** (p. ej. añadir un import tras `'use client';`) → `content.replace(ancla, ancla+nuevo, 1)` **solo si el ancla es corta y sin comillas escapadas**. Nunca uses `str.replace` con un bloque JSX largo copiado con comillas.
5. **Guardas obligatorias antes de escribir:** comprobar que `start != -1` **y** `end != -1`. Si buscas varios reemplazos, lleva un contador (`Changed {n}/N blocks`) para saber cuántos matchearon.
6. **Reportar el cambio:** imprime cuántos caracteres se reemplazaron (`replaced %d chars`) o cuántos bloques cambiaron. Sin salida verificable, no sabes si el parche corrió.
7. **Ejecutar** desde la raíz del proyecto (`python _patch_actores3.py`) para que las rutas relativas resuelvan, y verificar la salida `OK`.
8. **Limpiar caché si aplica.** En Next.js/Turbopack (GEDII), tras editar componentes: `Remove-Item -Recurse -Force .next` (PowerShell). Borra el `_patch_*.py` cuando el cambio esté validado.

## 3. Activos copiables

Todos en `activos/` de esta skill (copiados del proyecto fuente Plataforma GEDII, raíz `002 Desarrollos/Plataforma GEDII/`):

- **`activos/_patch_actores3.py`** — *plantilla canónica* (patrón bueno). Localiza por dos marcadores con `find()` y reemplaza por slicing, con guarda de existencia y reporte de caracteres. Cópialo y cambia ruta, marcadores y `new_block`. Origen: `_patch_actores3.py`.
- **`activos/parche_por_marcadores.py`** — versión genérica/parametrizada de la anterior (variables `RUTA`, `INICIO`, `FIN`, `NUEVO_BLOQUE`), con guarda extra de orden (`start >= end`). Punto de partida recomendado para un archivo nuevo.
- **`activos/_patch_actores2.py`** — ejemplo de **doble reemplazo con contador** (`Changed {changed}/2 blocks`): añade un import y colapsa un bloque en la misma corrida. Útil como referencia del patrón de contador. Origen: `_patch_actores2.py`. **Nota:** usa `str.replace` de un bloque con comillas escapadas — ver Gotcha 1 antes de reusarlo.
- **`activos/_patch_actores.py`** — el **antipatrón** (str.replace de bloque JSX largo con `\'...\'`). Se conserva solo como contraste de por qué se migró a `find()`+slicing. No lo uses como base.

Fuera de esta skill, evidencia del marcador real en su contexto: `002 Desarrollos/Plataforma GEDII/app/components/ArquitecturaMetodologica.js` (líneas 315 y 318).

## 4. Gotchas verificados

1. **`str.replace` de un bloque JSX largo falla por comillas escapadas.** En `_patch_actores.py` y `_patch_actores2.py` el `old` reproducía el JSX completo incluyendo `fontFamily:"\'Barlow Condensed\',Impact,sans-serif"`. Reproducir esos bytes escapados a mano es frágil: basta una comilla o un espacio distinto para que `old in content` sea `False` y el reemplazo no ocurra en silencio. La solución de `_patch_actores3.py` fue **localizar por los marcadores-comentario, que no tienen comillas**, y cortar por índices. Evidencia: comparar `activos/_patch_actores.py` (líneas 4-13, `old` con `\'`) contra `activos/_patch_actores3.py` (líneas 4-5, `find()` de marcadores).
2. **Reemplazo silencioso sin verificación.** `content.replace(old, new, 1)` no avisa si no matcheó — devuelve el string intacto y escribe un archivo "sin cambios". Por eso el patrón bueno **verifica `start/end != -1` antes de escribir** y reporta `replaced %d chars`; el patrón de doble reemplazo lleva contador `Changed {changed}/2 blocks` (`_patch_actores2.py` líneas 22-29). Sin ese reporte, crees que parcheaste y no.
3. **Imágenes base64 inline inflan el archivo por encima del umbral.** En `002 Desarrollos/Plataforma GEDII/app/page.js` la línea 10 es `const LOGO_IMG = "iVBORw0KGgo..."` — un PNG base64 de **103.280 caracteres** en una sola línea, que por sí solo hace que `page.js` pese 130 KB (el 79 % del archivo es esa línea; el JSX real son ~27 KB). **Lección documentada:** extraer las imágenes base64 a archivos servidos (`public/logos/*.svg`, referenciados con `src="/logos/..."` como en `page.js` líneas 249-265) devuelve el archivo a un tamaño editable con Edit y evita tener que parchear con Python. Un `page.js` inflado por base64 se redujo de forma drástica al extraer las imágenes; conviene hacerlo **antes** de necesitar parcheo programático.
4. **Olvidar `encoding='utf-8'` corrompe los marcadores.** Los marcadores usan `═` (U+2550) y el contenido lleva tildes y `→ ✓ ●`. En Windows, `open()` sin `encoding='utf-8'` usa cp1252 y rompe el archivo al reescribirlo. Todos los scripts fuente abren y escriben con `encoding='utf-8'` explícito (`_patch_actores3.py` líneas 1 y 16).
5. **Colocación del bloque = responsabilidad del autor, no del script.** El slicing inserta el `new_block` exactamente entre los dos marcadores; si el marcador de apertura quedó dentro de otra función/JSX, el bloque se inserta ahí (en GEDII el marcador `TAB: CARACTERIZACIÓN DE ACTORES` quedó dentro del componente `SecLabel`, `ArquitecturaMetodologica.js` líneas 310-328). Verifica que el par de marcadores delimite realmente el bloque que crees, y revisa el resultado tras correr el script.

## 5. Criterios de done

- [ ] El archivo objetivo supera ~50 KB (o el Edit tool falló por longitud) — el parcheo Python está justificado, no es preferencia.
- [ ] El script localiza por **marcadores únicos sin comillas** (verificados con `find()`), no por `str.replace` de un bloque JSX con comillas escapadas.
- [ ] Guarda de existencia (`start/end != -1`) presente **antes** de escribir; el script imprime un reporte verificable (`replaced N chars` o `Changed n/N blocks`).
- [ ] `open()` de lectura y escritura usan `encoding='utf-8'`.
- [ ] La salida ejecutada muestra `OK`/conteo esperado (no `Markers not found`), y una lectura posterior confirma que el bloque quedó en el lugar correcto.
- [ ] Caché de framework limpiada si aplica (`Remove-Item -Recurse -Force .next` en Next.js) y el script `_patch_*.py` temporal borrado tras validar.
- [ ] Si el archivo era grande por imágenes base64 inline, se evaluó extraerlas a `public/` para no volver a necesitar parcheo.

## Registro de uso
| Fecha | Proyecto | Tarea | Resultado | Lección |
|---|---|---|---|---|
| histórico | Plataforma GEDII | uso original (fuente de esta skill): parchear `ArquitecturaMetodologica.js` (67 KB) para colapsar el placeholder de la pestaña "Caracterización de actores" y montar `<ActoresEcosistema />`, tras fallar el reemplazo por `str.replace` con comillas escapadas | ok | - |
