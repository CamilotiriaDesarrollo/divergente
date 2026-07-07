---
name: pm-changelog-estimacion-esfuerzo
regimen: universal
description: Capitaliza la evolución de un proyecto en tres artefactos versionados — CHANGELOG semántico por hito, tabla problema→solución de bugs resueltos y tabla de estimación de horas por área funcional para cotizar — apoyados en commits convencionales en español. Cárgala al cerrar un hito o entrega, al preparar una cotización de un proyecto similar, o cuando el Dueño pide "documentar qué se hizo", "un changelog", "cuánto costó/tomó" o "estandarizar los mensajes de commit".
---

# PM · Changelog y estimación de esfuerzo

**Nivel actual:** N3 · **Dominio:** pm (Gestión de Proyectos) · **Agente(s):** `gerente-proyecto`
**Proyectos fuente:** Plataforma GEDII, Plataforma Conecta

> Criterio de ascenso a N1: los 5 bloques completos, con activos copiables de ruta real y gotchas verificados (no genéricos). A N2: ≥1 uso real aceptado por el Dueño. A N3: ≥3 usos exitosos en ≥2 proyectos + checklist propio.

## 1. Propósito

Convertir el trabajo ya hecho en **memoria capitalizable** en vez de dejarlo enterrado en el código. Produce y mantiene tres artefactos que se refuerzan entre sí:

1. **`CHANGELOG.md`** con **versionado semántico por hito** (no por release formal de biblioteca): cada bloque documenta qué se agregó, qué se quitó y con qué métrica.
2. **Tabla problema→solución** ("Notas técnicas") con cada bug no trivial ya resuelto — evita re-tropezar y alimenta la sección de troubleshooting de la documentación.
3. **Tabla de estimación de esfuerzo** por área funcional (horas), que es la **base para presupuestar** el siguiente proyecto por analogía.

El pegamento de los tres es el **historial git como documentación de decisiones**: commits convencionales en español (`feat/fix/refactor/perf/chore/docs`) cuyos cuerpos registran el *porqué* y la *métrica* (kB ahorrados, líneas eliminadas). El changelog es una redacción curada de esos commits; la estimación se deriva de los hitos del changelog.

Se carga al **cerrar un hito, sprint o entrega**, al **preparar una cotización** de un proyecto parecido, o cuando el Dueño pide un changelog / "documentar qué se hizo" / "cuánto tomó esto".

## 2. Procedimiento

1. **Versiona por hito, no por semver estricto de librería.** Encabeza cada bloque con `## [MAJOR.MINOR.PATCH] — YYYY-MM-DD · Título del hito`. Criterio de incremento observado en GEDII (`0.1.0` dashboard inicial → `0.2.0` nueva sección + limpieza):
   - **MINOR** → nueva sección/funcionalidad visible (`feat`).
   - **PATCH** → fix o ajuste acotado.
   - **MAJOR** → rediseño estructural o cambio incompatible de flujo.
   El más reciente va arriba (orden descendente).

2. **Estructura cada versión en sub-secciones concretas**, no en un párrafo. Patrón real de GEDII: `### Nuevas funcionalidades`, `### Cambios en <archivo>`, `### Arquitectura general`, `### CSS (globals.css)`. **Cita el archivo tocado entre paréntesis** y **cuantifica** cada limpieza:
   ```
   - Reducción del archivo: ~875 KB → ~50 KB (quita 10 imágenes base64)
   - Elimina sus bloques CSS muertos (~528 líneas; bundle CSS 104->96 kB)
   ```
   Sin número, un renglón de `refactor`/`perf` no sirve ni para estimar ni para cotizar.

3. **Escribe los commits como espejo del changelog.** Prefijo convencional + asunto imperativo en minúscula y en español + cuerpo con viñetas de *qué + porqué + métrica*. Tabla de decisión de prefijo (uso real en Conecta):

   | Prefijo | Cuándo | Ejemplo real (Conecta) |
   |---|---|---|
   | `feat` | funcionalidad nueva visible | `feat: seccion Ecosistema de Circulacion con carrusel paginado` |
   | `fix` | corrige bug/comportamiento | `fix: corrige errores TypeScript que bloqueaban el build en Vercel` |
   | `refactor` | reestructura sin cambiar comportamiento | `refactor: modulariza index.css en parciales por seccion` |
   | `perf` | mejora de rendimiento (con número) | `perf: code-splitting de la ventana internacional y vendors` |
   | `chore` | tooling / mantenimiento | `chore: configura ESLint, Prettier y EditorConfig` |
   | `docs` | solo documentación | `docs: documentacion completa para desarrolladores` |

   El asunto debe **nombrar la causa concreta**, no "arregla build" (ver Gotcha 4).

4. **Mantén la tabla problema→solución** en `## Notas técnicas > ### Problemas resueltos`. Una fila por bug no trivial resuelto, redactada desde los cuerpos de los commits `fix` y los incidentes del hito. Formato exacto (GEDII):
   ```
   | Problema | Solución |
   |---|---|
   | Turbopack cache corrupta | `Remove-Item -Recurse -Force .next` en PowerShell |
   | Mapa desaparece con 0 resultados | Eliminada condición `filtered.length === 0` que ocultaba el mapa |
   ```

5. **Construye la tabla de estimación de esfuerzo** en `## Notas técnicas > ### Estimación de esfuerzo`: `| Área | Horas estimadas |` con una fila por **área funcional** (no por archivo) y una fila `**Total estimado**`. Granularidad por área es lo que permite cotizar el próximo proyecto por analogía ("un dashboard con mapa + filtros ≈ 8 h"). Referencia GEDII: dashboard+mapa+dataset ~6 h, cadena de filtros ~2 h, nube de palabras ~2 h, … **Total ~18 h**.

6. **Cierra con `## Próximas automatizaciones planificadas`** (o "Pendientes"): backlog visible de lo que falta, para que el changelog también sirva de hoja de ruta.

7. **Ubicación:** `CHANGELOG.md` en la **raíz del repo** (junto a `README.md` y `CLAUDE.md`). Los commits viven en git; el changelog es su lectura curada por hito.

## 3. Activos copiables

- **`activos/CHANGELOG-plantilla-gedii.md`** — copia literal de `Plataforma GEDII/CHANGELOG.md`. Es la **plantilla maestra**: cabecera con stack, dos versiones semánticas (`0.2.0`, `0.1.0`) con sub-secciones y métricas, la tabla `Notas técnicas > Problemas resueltos`, la tabla `Estimación de esfuerzo` (~18 h) y `Próximas automatizaciones`. **Qué adaptar:** cabecera (nombre/stack), contenido de cada versión, y las dos tablas con los datos del proyecto en curso. Conserva la estructura de encabezados tal cual.
  - Origen: `C:/Users/camil/Desktop/IA Raiz Proyectos/002 Desarrollos/Plataforma GEDII/CHANGELOG.md`

- **`activos/commits-conecta-referencia.md`** — historial real de `Plataforma Conecta` curado y anotado: 9 commits ejemplares con el porqué/métrica en el cuerpo, la tabla de prefijos y la serie de 3 `fix` iterativos de despliegue. Úsalo como **modelo de redacción** de mensajes de commit y para poblar la tabla problema→solución. **Qué adaptar:** es de solo lectura/referencia; no se copia al repo destino.
  - Origen: `git log` de `C:/Users/camil/Desktop/IA Raiz Proyectos/002 Desarrollos/Plataforma Conecta` (rama `main`).

Para reproducir el extracto en cualquier repo (base para redactar el changelog del hito):
```bash
git log --format="%h | %ci%n%s%n%n%b" -20
```

## 4. Gotchas verificados

1. **Archivos gigantes bloquean la edición y hay que registrarlo en el changelog.** `app/page.js` de GEDII llegó a **~875 KB** (imágenes base64 embebidas) y el Edit tool no podía procesarlo. Solución aplicada: transformaciones por rangos de línea con Python/PowerShell, y luego eliminar el peso (875 KB → 50 KB) documentándolo como métrica en el changelog. Evidencia: fila "page.js demasiado grande para edición (875 KB)" en `Plataforma GEDII/CHANGELOG.md` (§ Notas técnicas) y regla 11 de `Plataforma GEDII/CLAUDE.md` ("Archivos grandes (>50 KB): usar Python…"). Lección: si un `refactor` bajó el peso, la cifra antes→después **es** el contenido del renglón del changelog.

2. **Turbopack deja caché corrupta y el síntoma parece un bug del código.** En Windows/PowerShell el fix es `Remove-Item -Recurse -Force .next`, no depurar el componente. Está registrado como fila problema→solución para no repetir el diagnóstico. Evidencia: `Plataforma GEDII/CHANGELOG.md` (§ Notas técnicas, fila "Turbopack cache corrupta").

3. **Leaflet revienta en SSR de Next.js.** Importar la librería estáticamente rompe el build; la solución es `import('leaflet')` dinámico dentro de `useEffect`. Es exactamente el tipo de bug que debe quedar en la tabla problema→solución porque reaparece en cada proyecto con mapa. Evidencia: `Plataforma GEDII/CHANGELOG.md` (fila "SSR error con Leaflet").

4. **Un asunto de commit vago ("arregla build") no documenta nada.** El despliegue en Vercel de Conecta necesitó **3 iteraciones**; cada asunto nombra su causa distinta: `fix: corrige buildCommand en vercel.json para Root Directory = client` (06e8f61) → `fix: vercel.json con rutas explícitas desde raíz del repo` (77bc0a8) → `fix: corrige errores TypeScript que bloqueaban el build en Vercel` (65d5ddd). Si los tres se hubieran llamado "fix build", el historial no serviría de documentación. Evidencia: `git log` de `Plataforma Conecta`; réplica en `activos/commits-conecta-referencia.md`.

5. **Refactor/perf sin métrica no es capitalizable.** Los commits de Conecta cuantifican siempre: "difiere ~48 kB", "~528 lineas; bundle CSS 104->96 kB", "5.594 lineas → parciales, byte-identico por hash" (611f0df incluye la *prueba de no-regresión* en el propio mensaje). Un renglón de changelog sin número no permite después estimar horas ni justificar la mejora ante el Dueño. Evidencia: commits `2c54d2a`, `6049cf8`, `611f0df` en `activos/commits-conecta-referencia.md`.

6. **La estimación como número único no sirve para cotizar.** GEDII no reporta "18 horas" a secas: desglosa por área funcional (dashboard+mapa ~6 h, filtros ~2 h, nube de palabras ~2 h, principios ~3 h, …) y recién suma **~18 h**. El desglose es lo que permite presupuestar el siguiente proyecto por analogía de áreas. Evidencia: tabla `Estimación de esfuerzo` en `Plataforma GEDII/CHANGELOG.md`.

## 5. Criterios de done

- [ ] `CHANGELOG.md` existe en la **raíz del repo**, con cabecera (proyecto + stack) y al menos una versión `## [x.y.z] — YYYY-MM-DD · Título`.
- [ ] Cada versión tiene sub-secciones concretas (`Nuevas funcionalidades`, `Cambios en <archivo>`, …) y **cita los archivos** tocados.
- [ ] Todo renglón de `refactor`/`perf`/limpieza lleva **métrica numérica** (kB, líneas o % antes→después).
- [ ] Existe la tabla `Notas técnicas > Problemas resueltos` con ≥1 fila problema→solución por bug no trivial del hito.
- [ ] Existe la tabla `Estimación de esfuerzo` **desglosada por área funcional** + fila `**Total estimado**`.
- [ ] Existe la sección de pendientes / próximas automatizaciones.
- [ ] Los commits del hito usan prefijo convencional (`feat/fix/refactor/perf/chore/docs`), asunto imperativo en español que **nombra la causa**, y cuerpo con porqué + métrica cuando aplica.
- [ ] El changelog es **consistente con `git log`** (cada versión rastrea a commits reales; no hay hitos inventados).

## Registro de uso
| Fecha | Proyecto | Tarea | Resultado | Lección |
|---|---|---|---|---|
| histórico | Plataforma GEDII | Uso original (fuente de esta skill): CHANGELOG semántico 0.1.0→0.2.0 con tablas problema→solución y estimación ~18 h | ok | - |
| histórico | Plataforma Conecta | Uso original (fuente de esta skill): historial de commits convencionales en español con métricas en el cuerpo | ok | - |
