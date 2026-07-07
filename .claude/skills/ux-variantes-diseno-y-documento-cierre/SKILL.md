---
name: ux-variantes-diseno-y-documento-cierre
regimen: universal
description: Converge en un diseño cuando el cliente aún no entregó lineamientos gráficos: prototipa varias variantes en paralelo como archivos hermanos, las monta todas en la página real para comparar lado a lado, elige la ganadora y cierra la fase con un documento de decisión fechado. Cárgala al empezar una fase de UI sin design system definitivo, al recibir "necesito varias propuestas / opciones de diseño", o al cerrar una exploración y limpiar los bocetos.
---

# UX — Variantes de diseño en paralelo y documento de cierre

**Nivel actual:** N3 · **Dominio:** ux · **Agente(s):** disenador-uiux
**Proyectos fuente:** Portal ISI (`Interfase Pagina Inicial`), Interfase Sistemas (`Interfase Sistemas`)

> Criterio de ascenso a N1: los 5 bloques completos, con activos copiables de ruta real y gotchas verificados (no genéricos). A N2: ≥1 uso real aceptado por el Dueño. A N3: ≥3 usos exitosos en ≥2 proyectos + checklist propio.

## 1. Propósito

Resuelve el problema de **decidir el diseño de un producto cuando el cliente todavía no entregó su sistema de diseño institucional** (caso real: el Ministerio de las Culturas aún no daba los lineamientos gráficos). En vez de apostar a una sola dirección o discutir sobre mockups estáticos, se construyen **varias variantes funcionales en paralelo**, se montan **todas en la página real** (mismo navegador, datos reales, responsive real) para evaluación comparativa con el equipo/Dueño, se elige la ganadora y se **cierra la fase con un documento de decisión fechado** que se vuelve la fuente de verdad de la fase siguiente.

Se carga cuando: arranca una fase de UI sin design system definitivo; el Dueño pide "varias opciones/propuestas"; hay que elegir entre direcciones visuales; o toca cerrar una exploración y limpiar los prototipos descartados sin perder el trabajo.

## 2. Procedimiento

1. **Nombra las variantes de forma sistemática, como archivos hermanos.** Mismo prefijo + sufijo:
   - Variantes de un mismo **componente** → sufijo de letra: `tirillaA.tsx`, `tirillaB.tsx`, …, `tirillaG.tsx` (más `tirillaStatic.tsx` para la variante sin animación). Real en ambos proyectos.
   - Variantes de una **sección/landing** → sufijo de versión: `portalSectionV1.tsx`, `portalSectionV2.tsx`, `portalSectionV3.tsx`, dejando `portalSection.tsx` (sin sufijo) como la candidata a producción.
   - El CSS de cada una va en un bloque rotulado en el `index.css` único: `/* ─── PROPUESTA A — Tirilla plana con hover lift ─── */` … `PROPUESTA G — Ghost reveal`.

2. **Da a cada variante una hipótesis de una línea.** No hagas siete variantes casi iguales; cada una explora un concepto distinto y se documenta en el commit y/o README (ej. real: V1 flip 3D, V2 positivo/negativo, V3 acordeón horizontal; tirillas: A hover-lift, B pill, C logos+tooltip, D spotlight, F magnetic dock, G ghost reveal, Static B&W).

3. **Móntalas TODAS en la página real (`Home.tsx`), una debajo de otra, con separadores rotulados.** No en Storybook ni mockups: en la Home real con datos reales para verlas responsive y en el navegador. Usa `<section>` con una etiqueta visible por zona para que el equipo sepa qué mira. Ver activo `Home-montaje-variantes.tsx`. Dos modos reales:
   - **Variantes distintas** apiladas: `<PortalSection/> <PortalSectionV1/> <PortalSectionV2/> <PortalSectionV3/>`.
   - **Una variante en sus estados** vía props: `<TirillaF/>`, `<TirillaF dark/>`, `<TirillaF staticMode/>`, `<TirillaF staticMode dark/>` — para decidir claro/oscuro y animado/estático en la misma vista.

4. **Criterio de decisión con el Dueño.** La ganadora se elige comparando en pantalla contra restricciones no negociables del proyecto: accesibilidad AA (NTC 5854, contraste ≥4.5:1), responsive 320px→4K, y "sin librerías de UI externas hasta que exista el sistema de diseño institucional" (todo en CSS puro / JS sin librerías de animación, para no crear dependencias que luego choquen con los lineamientos oficiales).

5. **Cierra la fase con un documento de decisión fechado** — este es el entregable clave. Créalo en `docs/direccion-visual.md` (plantilla en activos). Debe contener, en este orden:
   - Encabezado con **fase que cierra + fecha + con quién se decidió** ("Decidido con el usuario el 2026-06-11").
   - **Dirección elegida** con nombre propio ("Bento + Vidrio") y la sensación buscada en una frase.
   - **Referencias visuales guía** citadas (ej.: Tomorrow.io, Apple, Vercel, USWDS, España es Cultura, GOV.UK).
   - **Reglas verificables NUMERADAS** (no adjetivos): "blur 8–14px", "borde 1px `rgba(255,255,255,.25)`", "contraste ≥4.5:1", color por tema con hex exactos. Cada regla debe poder auditarse.
   - **Alcance de datos**: qué entra y qué no (ej.: "las 32 plataformas 'Confirmadas Operativas', hoja 5 del Excel").
   - **Ubicación**: dónde aterriza en el código ("reemplaza `PortalSectionV1` en `client/src/pages/Home.tsx`").

6. **Registra el ciclo en los commits** (convencionales, en español). Un `feat:` al construir las variantes que las lista, y un `feat:` de cierre al limpiar. Ver activo `mensajes-commit-ciclo-variantes.txt`.

7. **Limpia SOLO después de aprobar la ganadora.** Commit de limpieza que borra los `.tsx` de las variantes perdedoras y actualiza README. **Conserva los bloques CSS** de las propuestas en `index.css` como referencia histórica (no se borran en el mismo golpe). El mensaje de commit enumera qué se conserva y qué se elimina (métricas del cleanup).

## 3. Activos copiables

Todos en `.claude/skills/ux-variantes-diseno-y-documento-cierre/activos/`:

- **`direccion-visual.md`** — EL activo central: plantilla del documento de decisión/cierre de fase. Origen: `Interfase Pagina Inicial/docs/direccion-visual.md` (copia verbatim). Cópialo al cerrar cualquier exploración de UI; adapta dirección elegida, referencias, las reglas numeradas (mantén valores exactos, no adjetivos) y el alcance de datos. Es la fuente de verdad de la fase siguiente.
- **`Home-montaje-variantes.tsx`** — patrón de montaje simultáneo de variantes en la página real. Origen: reconstruido de dos `Home.tsx` reales (`Interfase Pagina Inicial` commit c2f8a36 con V1/V2/V3, e `Interfase Sistemas` post-limpieza con 4 estados de `TirillaF`). Pega el bloque que apliques durante la exploración; borra los imports al limpiar.
- **`mensajes-commit-ciclo-variantes.txt`** — plantillas verbatim del commit de construcción (c2f8a36) y del commit de cierre/limpieza (1a8bd99). Cópialas para redactar tus commits del ciclo; incluye la nota de "no borrar el CSS junto al .tsx".
- **`LINEAMIENTOS-DE-DESARROLLO.md`** — doc de lineamientos que registra en §2 la decisión "sin librerías de UI externas hasta que se defina el sistema de diseño institucional" (la razón de explorar en CSS puro) y las convenciones de código. Origen: `Interfase Sistemas/docs/LINEAMIENTOS-DE-DESARROLLO.md` (verbatim). Cópialo cuando el proyecto de gobierno aún no tiene design system y necesitas dejar por escrito por qué se explora sin frameworks.

## 4. Gotchas verificados

- **Borrar el CSS de las variantes junto con sus `.tsx` = perder la referencia.** En el commit de limpieza real `1a8bd99` (`Interfase Sistemas`) se eliminaron `tirillaA/B/C/D/G.tsx` y `tirillaStatic.tsx`, PERO los bloques CSS `PROPUESTA A`…`PROPUESTA G` se dejaron intactos en `client/src/index.css` (verificado: siguen en las líneas 424, 523, 1484, 1552, 1605). Solución: borra los componentes React perdedores, conserva su CSS como archivo de referencia histórica y no lo mezcles en el mismo cambio.
- **Limpiar antes de que el Dueño apruebe = rehacer el prototipo.** El README de `Interfase Pagina Inicial` deja la regla explícita en la sección "Bocetos de diseño": *"Se eliminan cuando se apruebe el diseño final."* La limpieza es un commit posterior a la aprobación, nunca parte de la construcción.
- **Documento de cierre con adjetivos en vez de números = no es auditable.** La regla 1 de `docs/direccion-visual.md` no dice "vidrio con blur suave"; dice `backdrop-filter: blur()` "moderado 8–14px", borde "1px `rgba(255,255,255,.25)`". Y la regla 7 fija contraste "≥ 4.5:1 del texto contra el peor caso del fondo". Solución: cada regla del documento debe ser verificable con una herramienta o inspección, no una impresión.
- **Contraste de texto sobre fotografía en tarjetas de vidrio.** Verificado en `docs/direccion-visual.md` reglas 1–2: el glassmorphism sobre foto no garantiza legibilidad. Solución: capa de oscurecimiento (gradiente) sobre cada celda + fallback de gradiente cromático del tema si la imagen no carga, para asegurar el ≥4.5:1 contra el peor caso.
- **Montar variantes en mockups en vez de la página real oculta problemas responsive.** Ambos proyectos las montaron en `Home.tsx` con datos reales precisamente para verlas en el navegador de 320px a 4K y en claro/oscuro. Un mockup no revela el hover pegado en táctil ni el scroll horizontal en mobile.
- **Sin nomenclatura sistemática, siete prototipos son un caos.** La convención archivo-hermano (`tirillaA..G`, `portalSectionV1..V3`, bloques `PROPUESTA A..G` en el CSS) es lo que hace navegable la exploración y trivial la limpieza posterior por patrón de nombre.

## 5. Criterios de done

- [ ] Cada variante es un archivo hermano con nomenclatura sistemática (sufijo de letra o `Vn`) y una hipótesis de diseño distinta documentada.
- [ ] Todas las variantes se montaron **simultáneamente en la página real** (`Home.tsx`), con separadores rotulados, y se vieron en el navegador en claro/oscuro y responsive.
- [ ] Existe `docs/direccion-visual.md` (o equivalente) **fechado**, con: dirección elegida nombrada, referencias visuales, reglas **numeradas y verificables** (valores exactos), alcance de datos y ubicación en el código.
- [ ] El documento de cierre queda declarado como fuente de verdad de la fase siguiente.
- [ ] La ganadora respeta las restricciones no negociables (AA/NTC 5854 contraste ≥4.5:1, responsive, sin librerías de UI externas si aplica).
- [ ] La limpieza ocurrió **solo tras la aprobación del Dueño**, en un commit de cierre que enumera qué se conserva y qué se borra; los bloques CSS de las variantes se conservaron como referencia.
- [ ] Los commits del ciclo (construcción y cierre) son convencionales, en español, y listan las variantes.

## Registro de uso
| Fecha | Proyecto | Tarea | Resultado | Lección |
|---|---|---|---|---|
| histórico | Portal ISI (Interfase Pagina Inicial) | uso original (fuente de esta skill) | ok | - |
| histórico | Interfase Sistemas | uso original (fuente de esta skill) | ok | - |
