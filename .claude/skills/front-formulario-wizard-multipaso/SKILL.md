---
name: front-formulario-wizard-multipaso
regimen: universal
description: Construye formularios wizard largos (10-12 pasos) de registro institucional con autoguardado, progreso no bloqueante por conteo de campos, lógica condicional entre pasos y rehidratación completa de estado. Cargar cuando se pida digitalizar una ficha/instrumento normativo como formulario multipaso, un wizard con sidebar de progreso, o un formulario colaborativo que se diligencia parcialmente entre varias personas.
---

# Formulario wizard multipaso

**Nivel actual:** N3 · **Dominio:** front · **Agente(s):** front-formularios-a11y
**Proyectos fuente:** Plataforma GEDII, Plataformas Ministerio

> Criterio de ascenso a N1: los 5 bloques completos, con activos copiables de ruta real y gotchas verificados (no genéricos). A N2: ≥1 uso real aceptado por el Dueño. A N3: ≥3 usos exitosos en ≥2 proyectos + checklist propio.

## 1. Propósito

Convertir instrumentos largos (la ficha GEDII-002 era un Excel de 75 filas) en un wizard web de 10-12 pasos que **no bloquea el avance con validación**: el usuario navega libre entre pasos, todo se autoguarda en cada input, y el progreso se calcula contando campos con contenido. Esto es deliberado — el formulario lo diligencian varias personas de una dependencia de forma parcial y colaborativa, así que la validación bloqueante rompería el flujo real de trabajo.

Se carga cuando la tarea incluye: wizard multipaso, formulario de registro institucional/gubernamental, digitalización de fichas normativas a web, sidebar sticky de progreso, lógica condicional entre pasos (select dependiente, badge por selección), o componentes de chips/ratings/opt-cards en formularios.

Existen dos implementaciones de referencia del mismo patrón: vanilla HTML/CSS/JS en un solo archivo (prototipo GEDII completo, 12 pasos) y React/Next.js App Router (versión productiva parcial, paleta morada institucional).

## 2. Procedimiento

1. **Mapear el instrumento fuente a pasos.** Cada paso se declara en un array `STEPS` con `id/num/label/title/eyebrow/desc` (vanilla) o `{ label, done }` (React). Si los pasos vienen de un documento normativo, la estructura es **innegociable** — documentarlo en el brief como "Lo que NO cambiar" (así se hizo con los 12 pasos de GEDII-002). Solo la UX es iterable.
2. **Tipificar los campos por paso** antes de escribir HTML: textareas, radios, checkboxes múltiples, chips con límite, ratings 1-5, fechas, checklists. En GEDII quedó en una tabla del brief (BRIEF_PARA_CLAUDE_DESIGN.md, sección "Estructura de los 12 pasos"). Esta tabla es la fuente para el mapa de progreso del paso 4.
3. **Estado central único.** Vanilla: `let state = { currentStep: 'id', fields: {}, keywords: [], ratings: {} }`. Todo input escribe en `state.fields[el.dataset.field]`; radios guardan string, checkboxes guardan array de values. Patrón real de `setupListeners()` (gedii-prototipo.html:1086-1098):
   ```js
   document.querySelectorAll('input[type=checkbox], input[type=radio]').forEach(el => {
     el.addEventListener('change', () => {
       if (!el.name) return;
       const all = document.querySelectorAll(`input[name="${el.name}"]`);
       if (el.type === 'radio') state.fields[el.name] = el.value;
       else state.fields[el.name] = [...all].filter(x => x.checked).map(x => x.value);
       persist(); updateUI();
     });
   });
   ```
   No dispersar estado por componente: con un solo objeto, `persist()`/`loadState()` y el cálculo de progreso operan sobre una sola fuente.
4. **Progreso por conteo, no por validación.** Cada paso declara cuántos campos "cuentan" y cuáles, en un mapa `stepProgress(stepId)` (gedii-prototipo.html:1250-1274):
   ```js
   const g = (f) => { const v = state.fields[f];
     if (Array.isArray(v)) return v.length > 0;
     return v !== undefined && v !== '' && v !== null; };
   const map = { '2': { total: 4, filled: countTrue(g('pregunta'), g('obj_general'), state.keywords.length >= 3, g('obj_esp_1')) }, ... };
   ```
   Tres estados visuales por paso en el sidebar: vacío / `has-content` (punto ocre, `0 < filled < total`) / `complete` (punto verde). El % global es `100 * totalFilled / totalFields`.
5. **Autoguardado en cada evento**, sin botón "guardar": cada listener llama `persist()` + `updateUI()`, y el indicador muestra `Guardado · HH:MM` (`toLocaleTimeString('es-CO', {hour:'2-digit', minute:'2-digit'})`, línea 1247). Decisión de producto documentada en README-handoff ("Autoguardado (no botón guardar)").
6. **Lógica condicional — tres patrones probados:**
   - **Badge por selección:** marcar dimensión `TRANSV`/`D3`/`D4` activa el badge "Proyecto Innovador" (`innov-badge`, clase `.active` con animación `slideIn`, líneas 1217-1220).
   - **Select dependiente de otro paso:** las opciones de "sombrilla metodológica" dependen del campo elegido en el paso 4 (mapa `SOMBRILLAS` C1-C6). Ver gotcha 4 para el manejo del estado vacío.
   - **Campo "otro" condicional:** solo visible si el checkbox `otro` está marcado (`horizonte-otro-wrap`, línea 1225).
7. **Componentes custom:** chips con Enter para agregar, Backspace con input vacío para borrar el último, deduplicación y límite (6 en GEDII):
   ```js
   if (e.key === 'Enter' && chipInput.value.trim()) {
     e.preventDefault();
     const v = chipInput.value.trim();
     if (!state.keywords.includes(v) && state.keywords.length < 6) {
       state.keywords.push(v); renderChips(); persist(); updateUI();
     }
     chipInput.value = '';
   } else if (e.key === 'Backspace' && !chipInput.value && state.keywords.length) {
     state.keywords.pop(); renderChips(); persist(); updateUI();
   }
   ```
   Ratings 1-5 renderizados desde configuración declarativa `EVAL_DIMS` (`{ key, label, hint }` — 6 dimensiones en GEDII), nunca hardcodeados. Radios/checkboxes como "opt-cards": `label.opt-card > input + span.check + span.opt-label`, ocultando el input nativo y estilando el estado con `.opt-card:has(input:checked) { background: var(--paper-warm); border-color: var(--ink); }` (gedii-prototipo.html:319-358). En React el equivalente usa `div.iv-opt` con `role="radio"`/`role="checkbox"` y `aria-checked` (investigar-page-react.js:316-330).
8. **Navegación:** sidebar sticky con un botón por paso + botones Anterior/Siguiente en footer; en el último paso el botón "Siguiente" muta a la acción final (en GEDII: "↓ Exportar infografía PDF"). Al cambiar de paso: `window.scrollTo({ top: 0, behavior: 'smooth' })` y recálculo de los selects dependientes.
9. **Decidir vanilla vs React:**
   - Prototipo/artefacto para iterar diseño → vanilla en un solo archivo (activo `gedii-prototipo.html`).
   - Implementación productiva → React con `'use client'`, `useState` por grupo de estado, componentes `Section` (acordeón con `open/onToggle`) y arrays de configuración (`STEPS`, `URGENCIES`, `SOURCES`, `SECTIONS`) fuera del componente (activo `investigar-page-react.js`).
   - Nota: la versión React de `/investigar` sí bloquea el botón "Continuar" (`disabled={!desc || desc.length < 40 || !urgency}`) porque valida solo el paso activo con mínimos duros; el avance global sigue siendo no bloqueante vía sidebar clicable.
10. **Si hay handoff a diseño:** empaquetar README + BRIEF (contexto, tokens, tabla de pasos, prioridades de iteración, sección "Lo que NO cambiar") + prototipo como codebase + screenshots nombrados por convención `NN_dispositivo_estado.png` con ★ en los críticos. Esa parte la cubre la skill `pm-handoff-diseno-a-codigo`; aquí están las plantillas como activos.

## 3. Activos copiables

Todos en `activos/` de esta skill (rutas de origen verificadas):

| Activo | Origen | Qué es / cuándo copiarlo | Qué adaptar |
|---|---|---|---|
| `activos/gedii-prototipo.html` | `C:/Users/camil/Desktop/IA Raiz Proyectos/002 Desarrollos/Plataformas Ministerio/001 GEDII/gedii-handoff/gedii-prototipo.html` | Wizard vanilla completo de 12 pasos en un archivo (1316 líneas): design tokens, sidebar de progreso, opt-cards, chips, ratings, TRIAGE, autosave, lógica condicional. Base de cualquier wizard nuevo o prototipo para artefacto. | `STEPS`, `SOMBRILLAS`, `EVAL_DIMS`, el mapa de `stepProgress()` y los tokens CSS de `:root` (líneas 11-38). Cambiar `window._gedii` por localStorage si NO es artefacto. |
| `activos/investigar-page-react.js` | `C:/Users/camil/Desktop/IA Raiz Proyectos/002 Desarrollos/Plataforma GEDII/app/investigar/page.js` | Versión React/Next.js del wizard (paso "Necesidades"): shell GOV.CO + header + breadcrumb con estado de guardado, sidebar sticky colapsable en mobile, acordeones `Section`, opt-cards radio/checkbox accesibles (`role`, `aria-checked`), action bar sticky con dots de progreso. | Paleta (constantes `PURPLE/ACCENT/BORDER`), arrays `STEPS/URGENCIES/SOURCES/SECTIONS`, y conectar persistencia real (el guardado es visual en esta versión). |
| `activos/BRIEF_PARA_CLAUDE_DESIGN.md` | `C:/Users/camil/Desktop/IA Raiz Proyectos/002 Desarrollos/Plataformas Ministerio/001 GEDII/gedii-handoff/BRIEF_PARA_CLAUDE_DESIGN.md` | Plantilla de brief de handoff: contexto, decisión estética justificada, tokens CSS, tabla de 12 pasos con tipos de campo, prioridades de iteración ordenadas, "Lo que NO cambiar", prompt de arranque. | Todo el contenido; conservar las secciones y el orden. |
| `activos/README-handoff.md` | `C:/Users/camil/Desktop/IA Raiz Proyectos/002 Desarrollos/Plataformas Ministerio/001 GEDII/gedii-handoff/README.md` | Plantilla del paquete de handoff: estructura de carpeta, convención de screenshots con ★, flujo Claude Design → Claude Code, "Decisiones clave ya tomadas". | Nombres de archivos y decisiones del proyecto. |

Referencia adicional (no copiada, consultar en origen): screenshots de estados clave en `C:/Users/camil/Desktop/IA Raiz Proyectos/002 Desarrollos/Plataformas Ministerio/001 GEDII/gedii-handoff/screenshots/` (9 PNG, convención `NN_dispositivo_estado.png`), y el design system React documentado en `C:/Users/camil/Desktop/IA Raiz Proyectos/002 Desarrollos/Plataforma GEDII/CLAUDE.md`.

## 4. Gotchas verificados

1. **localStorage no existe en artefactos de Claude.** El prototipo persiste en `window._gedii` con el comentario literal "Usamos variable global en vez de localStorage por compatibilidad artefact" (gedii-prototipo.html:1280). La contrapartida obligatoria es `loadState()` con **rehidratación manual completa** de cada tipo de control (líneas 1284-1303):
   ```js
   Object.keys(state.fields).forEach(k => {
     const el = document.querySelector(`[data-field="${k}"]`);
     if (el) el.value = state.fields[k];
     document.querySelectorAll(`input[name="${k}"]`).forEach(r => {
       if (r.type === 'radio') r.checked = (r.value === state.fields[k]);
       if (r.type === 'checkbox' && Array.isArray(state.fields[k])) r.checked = state.fields[k].includes(r.value);
     });
   });
   renderChips(); // + toggle de clase 'selected' en cada .rating-star
   ```
   Si se omite un tipo de control, el estado "se guarda" pero la UI vuelve vacía. En despliegue real (fuera de artefacto) cambiar `window._gedii` por localStorage manteniendo la misma rehidratación.
2. **Re-render con innerHTML destruye el input de chips y sus listeners.** `renderChips()` reconstruye el HTML del contenedor (`wrap.innerHTML = ... + input.outerHTML`), por lo que el input resultante es un nodo nuevo: hay que re-seleccionarlo, **re-vincular el keydown y devolverle el focus** (`newInput.focus()`, líneas 1148-1163, comentario `// rebind input`). Síntoma si se olvida: el primer chip funciona y a partir del segundo Enter no hace nada.
3. **Formularios normativos densos abruman** (12 opciones de ética en el Paso 5, 14 tipos de producto en el Paso 7, 6 ratings en el Paso 9). El brief lo declara prioridad #1 de iteración con soluciones concretas: acordeones por sub-sección, sub-pasos, "modo enfoque", variantes chip compactas (`.ethics-grid .opt-card { padding: 8px 12px; font-size: 12px }`), agrupación visual y distinción explícita selección única vs múltiple. Evidencia: BRIEF_PARA_CLAUDE_DESIGN.md, sección "Qué quiero iterar". La versión React lo resolvió con acordeones `Section` colapsables.
4. **Select dependiente vacío o inconsistente.** Si el usuario llega a Metodología sin haber elegido campo en el Paso 4, el select de sombrilla quedaría vacío. `updateSombrillaOptions()` (gedii-prototipo.html:1193-1206) lo deshabilita con opción-guía "Primero seleccione un campo en el Paso 4…" y, al repoblar, **preserva la selección previa** (`prev === s ? 'selected' : ''`). Llamarla en cada `showSection()` y en cada `updateUI()`, no solo al cambiar el campo.
5. **El progreso por validación bloqueante mata el diligenciamiento colaborativo.** Error de enfoque evitado desde el diseño: en GEDII varias personas llenan pasos distintos en momentos distintos; por eso el progreso es conteo de campos con contenido (tres estados) y la navegación entre pasos es libre. Evidencia: mapa `stepProgress` (líneas 1250-1274) y aprendizaje documentado en la ficha del proyecto. Si el negocio exige mínimos duros, aplicarlos solo al CTA del paso activo como en la versión React (`disabled={desc.length < 40 || !urgency}`), nunca a la navegación.
6. **El export final no debe ser un espejo del instrumento de origen.** La primera intuición (replicar la ficha Excel) se descartó: el entregable de GEDII es una infografía PDF (portada, badge Innovador, TRIAGE por color, timeline, radar de evaluación, QR) porque el consumidor es la Mesa Técnica, no el archivo. Ver `exportPDF()` (gedii-prototipo.html:1306-1310) y la sección "Entregables adicionales" del brief. Preguntar siempre quién consume el output antes de diseñarlo.

## 5. Criterios de done

- [ ] Los pasos están declarados en un array de configuración (`STEPS`), no hardcodeados en el HTML/JSX de navegación; agregar un paso = agregar una entrada + su sección + su fila en el mapa de progreso.
- [ ] Recargar/re-montar la vista con estado guardado rehidrata TODO: texto, radios, checkboxes, chips y ratings quedan visualmente como estaban (probar cada tipo de control, no solo inputs de texto).
- [ ] El sidebar muestra los tres estados por paso (vacío / en progreso / completo) y el % global coincide con el conteo del mapa de progreso.
- [ ] Se puede navegar a cualquier paso sin completar los anteriores; ningún paso intermedio bloquea.
- [ ] El indicador "Guardado · HH:MM" se actualiza en cada input/change sin acción del usuario.
- [ ] La lógica condicional funciona en ambos sentidos: seleccionar dimensión innovadora muestra el badge y des-seleccionarla lo oculta; el select dependiente se deshabilita con mensaje-guía cuando falta su prerequisito y conserva la selección al repoblar.
- [ ] En chips: Enter agrega, Backspace con input vacío borra el último, no admite duplicados, respeta el límite, y tras agregar/borrar el input conserva focus y sigue respondiendo a Enter.
- [ ] En mobile (≤700px) el sidebar colapsa (barra horizontal, toggle o drawer) y el formulario es usable — decisión mobile-first documentada en README-handoff.
- [ ] Si la estructura de pasos viene de norma: existe sección "Lo que NO cambiar" en el brief/blueprint del proyecto.
- [ ] Revisado por `qa-ingeniero` (regla 1 de la fábrica); si captura datos personales, revisa también `seguridad-appsec`.

## Registro de uso
| Fecha | Proyecto | Tarea | Resultado | Lección |
|---|---|---|---|---|
| histórico | Plataforma GEDII | uso original (fuente de esta skill) | ok | - |
| histórico | Plataformas Ministerio | uso original (fuente de esta skill) | ok | - |
