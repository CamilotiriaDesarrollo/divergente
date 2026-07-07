---
name: pm-handoff-diseno-a-codigo
regimen: universal
description: Empaqueta un prototipo y su contexto en un bundle versionado para transferirlo entre fases de IA (humano → Claude Design para iterar UX, o Claude Design → Claude Code para implementar). Cárgala cuando haya que preparar un handoff de diseño, escribir un BRIEF para Claude Design, exportar un prototipo HTML a implementación, o montar la carpeta `.handoff/`/`<proyecto>-handoff/` de un proyecto.
---

# PM · Handoff de diseño a código

**Nivel actual:** N3 · **Dominio:** pm (Gestión de Proyectos) · **Agente(s):** `disenador-uiux`
**Proyectos fuente:** DivergenteWEB (`.handoff/`), Plataformas Ministerio · GEDII (`gedii-handoff/`)

> Criterio de ascenso a N1: los 5 bloques completos, con activos copiables de ruta real y gotchas verificados (no genéricos). A N2: ≥1 uso real aceptado por el Dueño. A N3: ≥3 usos exitosos en ≥2 proyectos + checklist propio.

## 1. Propósito

Un prototipo pierde contexto cuando cambia de manos (de una fase de IA a otra, de una máquina a otra, de una sesión a otra). Esta skill empaqueta el prototipo **y todo lo que un agente necesita para continuar sin re-preguntar** en un bundle que se commitea al repo. Resuelve dos fronteras concretas, verificadas en proyectos reales:

- **Humano → Claude Design** (caso GEDII): llevas un prototipo HTML funcional a Claude Design para **iterar UX/diseño** antes de implementar. El bundle carga contexto de negocio, decisión estética justificada, tokens replicables y prioridades de iteración ordenadas. Ejemplo: `gedii-handoff/` — digitalización de una ficha Excel de 75 filas en un wizard de 12 pasos.
- **Claude Design → Claude Code** (caso DivergenteWEB): exportas los diseños de Claude Design para que un agente de código los **implemente pixel-perfect** en el stack real. El bundle vive en `.handoff/` dentro del repo Next.js. Ejemplo: `.handoff/nueva-pagina-divergente/` — landing con wordmark gigante y esquemas de color por sección.

Se carga al preparar cualquiera de las dos transferencias, o al montar/actualizar la carpeta de handoff de un proyecto.

## 2. Procedimiento

### Paso 0 — Decide la dirección del handoff (criterio de decisión)

| Si vas a… | Usa el patrón | Artefacto principal |
|---|---|---|
| Iterar UX en Claude Design partiendo de un prototipo | **BRIEF rico** (estilo GEDII) | `BRIEF_PARA_CLAUDE_DESIGN.md` extenso + screenshots por estado |
| Implementar en código diseños ya cerrados | **README de export escueto** (estilo Divergente) | `README.md` con regla pixel-perfect + prototipo como codebase |

Ambos comparten la misma columna vertebral: **carpeta commiteada al repo + prototipo HTML como codebase + README de instrucciones**. Cambia el peso: hacia Design pesa el BRIEF; hacia Code pesa la regla de implementación.

### Paso 1 — Crea la carpeta del bundle DENTRO del repo

- Nombra `<proyecto>-handoff/` (visible, para el que va hacia Design: `gedii-handoff/`) o `.handoff/<nombre-diseño>/` (oculta, para el que ya vive dentro del repo de código: `DivergenteWEB/.handoff/nueva-pagina-divergente/`).
- **Committéala al repo** (NO la pongas en `.gitignore` como `node_modules/`). Razón textual del Dueño: *"Se incluyó para que clonar el repo dé acceso completo al contexto"* (DivergenteWEB `README.md`, decisión de diseño #6). Un clon en otra PC debe reconstruir el contexto de diseño completo.

### Paso 2 — Escribe el BRIEF (hacia Claude Design)

Copia `activos/BRIEF_PARA_CLAUDE_DESIGN.md` y rellena **estas secciones en este orden** (todas presentes en el original GEDII):

1. **Contexto del proyecto** — qué es, quién lo usa, qué hace, dónde estás en el proceso.
2. **Dirección de diseño actual** — la decisión estética **justificada con un porqué** (GEDII: *"Editorial-institucional cálido. No el típico formulario gubernamental gris… como una publicación de un ministerio de cultura europeo, no un formulario burocrático"*), paleta, tipografía, elementos distintivos.
3. **Qué quiero iterar** — lista **ordenada por prioridad** y con opciones concretas a explorar por ítem (GEDII marca la #1 como PRIORITARIO).
4. **Sistema de Design Tokens (para replicar)** — bloque CSS copiable con variables exactas. Así el diseño nuevo hereda los tokens en vez de inventarlos:
   ```css
   --ink:#0B1220; --paper:#F5F1E8; --cream:#FBF8F0;
   --accent:#C73E1D; --ochre:#D4A017; --jade:#2D5F3F;
   font-display:'Fraunces',serif; font-body:'Inter Tight',sans-serif;
   ```
5. **Tabla de estructura** — una fila por pantalla/paso con su tipo de campos (GEDII: tabla de los 12 pasos con "Tipo de campos").
6. **Entregables adicionales** — lo que hay que diseñar además del flujo principal.
7. **Lo que NO cambiar** — blinda lo normativo/no negociable para que la IA de diseño **no lo re-litigue** (GEDII: los 12 pasos vienen del manual GEDII-002, la lógica de Proyecto Innovador, la escala TRIAGE de 5 niveles).
8. **Prompt sugerido para iniciar** — texto listo para pegar que instruye "léete el brief y hazme preguntas ANTES de generar nada".

### Paso 3 — Incluye el prototipo HTML como codebase

- Un solo HTML autocontenido que sea el prototipo funcional (`gedii-prototipo.html`, `Divergente.html`). Es lo que se sube como **"Attach codebase"** en Claude Design.
- Si usas el canvas de variantes (`activos/design-canvas.jsx` + `activos/preview-harness-artboards.html`), el preview monta cada pantalla como un `<DCArtboard>` en su tamaño real (`Desktop — 1440px`, `Mobile — 390px`) dentro de un `<DCSection>`; sirve para presentar 2-3 variantes lado a lado.

### Paso 4 — Nombra los screenshots por estado, ★ en los críticos

- Un screenshot por **estado clave**, nombrado `NN_dispositivo_estado.png` (`01_desktop_identificacion.png`, `07_mobile_identificacion.png`).
- Marca con **★** los críticos en el README e indica el **subconjunto mínimo** a subir (GEDII: *"Mínimo sube 03, 05, 07"*) — subirlos todos satura el contexto.

### Paso 5 — Escribe el README de instrucciones

- **Hacia Design** (`activos/README-instrucciones-paquete.md`): árbol de contenido, flujo de 3 pasos ("Attach codebase" → "Add screenshot" → pegar BRIEF), primera iteración sugerida, y **"Decisiones clave ya tomadas"** para que Claude Design no las cuestione.
- **Hacia Code** (`activos/README-export-claude-design.md`): encabezado `CODING AGENTS: READ THIS FIRST`, qué archivo abrir primero y "read it in full, don't skim", y la **regla pixel-perfect** (ver Gotcha 1).

### Paso 6 — Verifica y commitea

Aplica el checklist del bloque 5 y haz commit del bundle completo al repo.

## 3. Activos copiables

Todos en `activos/` de esta skill (copiados de los proyectos fuente, verificados). Rutas reales:

| Activo | Qué es / cuándo copiarlo | Qué adaptar | Origen |
|---|---|---|---|
| `activos/BRIEF_PARA_CLAUDE_DESIGN.md` | Plantilla del BRIEF completo con las 8 secciones (contexto, decisión estética justificada, iteración priorizada, tokens CSS, tabla de estructura, entregables, "Lo que NO cambiar", prompt). Cópialo para todo handoff hacia Claude Design. | Todo el contenido; conserva la estructura de secciones. | `Plataformas Ministerio/001 GEDII/gedii-handoff/BRIEF_PARA_CLAUDE_DESIGN.md` |
| `activos/README-instrucciones-paquete.md` | README de instrucciones de uso del paquete (árbol, flujo de 3 pasos, primera iteración, decisiones ya tomadas). | Nombre del proyecto, lista de screenshots, decisiones cerradas. | `.../gedii-handoff/README.md` |
| `activos/README-export-claude-design.md` | README de export Claude Design → Code con la regla pixel-perfect y "read in full". Es el patrón para la frontera hacia implementación. | Nombre del diseño primario y del directorio `project/`. | `DivergenteWEB/.handoff/nueva-pagina-divergente/README.md` |
| `activos/preview-harness-artboards.html` | Harness mínimo (React+Babel por CDN) que monta pantallas como artboards Desktop/Mobile en un `DesignCanvas`. Para presentar variantes lado a lado. | `src` de los iframes, `label`/`width`/`height` de cada `DCArtboard`. | `.../nueva-pagina-divergente/project/Divergente Preview.html` |
| `activos/design-canvas.jsx` | Canvas tipo Figma (secciones, artboards reordenables, notas, overlay de foco) que envuelve al preview. Reutilizable como lienzo de variantes. | Nada del motor; solo lo consumes desde el harness. Ojo con el bridge (Gotcha 3). | `.../nueva-pagina-divergente/project/design-canvas.jsx` |

Referencia adicional NO copiada (queda en el proyecto fuente): `Plataformas Ministerio/001 GEDII/gedii-handoff/screenshots/` — 9 capturas nombradas por estado con la convención `NN_dispositivo_estado.png`, ejemplo real de cómo etiquetar y marcar ★ los estados críticos.

## 4. Gotchas verificados

1. **Copiar la estructura interna del prototipo en vez del output visual.** Los prototipos de Claude Design son HTML/CSS/JS de mock, no código de producción. La regla textual del export: *"Your job is to recreate them pixel-perfectly in whatever technology makes sense for the target codebase… Match the visual output; don't copy the prototype's internal structure unless it happens to fit"*. Solución: el README de export lo dice explícitamente para que el agente de código no arrastre la estructura del mock. Evidencia: `DivergenteWEB/.handoff/nueva-pagina-divergente/README.md` (líneas 14-18).

2. **Renderizar el prototipo o pedir screenshots cuando ya está todo en el fuente.** El export instruye: *"Don't render these files in a browser or take screenshots unless the user asks… Everything you need — dimensions, colors, layout rules — is spelled out in the source. Read the HTML and CSS directly"*. Un screenshot no aporta nada que el fuente no diga y quema tiempo/contexto. Solución: leer el HTML directamente. Evidencia: mismo `README.md` (líneas 17-18).

3. **Editar el canvas de variantes fuera del runtime de Claude Design y creer que se guardó.** El estado del canvas (orden, títulos, foco) se lee por `fetch()` de un sidecar `.design-canvas.state.json`, pero las **escrituras van por `window.omelette?.writeFile(...)` con optional-chaining y `.catch(()=>{})`** — si el runtime host no está, la escritura es un no-op silencioso. Reordenar/renombrar artboards en un preview servido fuera de la herramienta no persiste nada. Solución: editar dentro de Claude Design; el sidecar solo garantiza *lectura* del arreglo guardado allí donde se sirvan juntos HTML+sidecar. Evidencia: `.../project/design-canvas.jsx` (líneas 63-66, 101).

4. **Poner el bundle en `.gitignore` y perder el contexto al clonar.** Si `.handoff/`/`<proyecto>-handoff/` se ignora como `node_modules/`, un clon en otra máquina o una nueva sesión de agente arranca sin los mockups, fuentes originales ni el BRIEF. Solución: commitearlo al repo a propósito — *"`.handoff/` está en el repo… Se incluyó para que clonar el repo dé acceso completo al contexto"*. Evidencia: `DivergenteWEB/README.md` (decisión de diseño #6, línea 286).

5. **Dejar que la IA de diseño re-cuestione lo normativo/no negociable.** Sin una sección explícita, Claude Design "mejora" restricciones que son de manual y desperdicia iteraciones. GEDII lo blinda por partida doble: el BRIEF trae **"Lo que NO cambiar"** (12 pasos normativos de GEDII-002, lógica Proyecto Innovador Transversal/D3/D4, escala TRIAGE de 5 niveles con sus colores) y el README lista **"Decisiones clave ya tomadas… para que Claude Design no las cuestione"** (12 pasos, mobile-first, autoguardado, paleta cálida no corporate-blue). Evidencia: `gedii-handoff/BRIEF_PARA_CLAUDE_DESIGN.md` (líneas 159-165) y `gedii-handoff/README.md` (líneas 60-71).

6. **Handoff a un stack que difiere del training del agente sin avisarlo.** DivergenteWEB corre Next.js 16 + React 19 + Tailwind v4 (tokens en `@theme inline`, sin `tailwind.config.ts`); un agente asume convenciones viejas de su training y escribe código roto. Solución: el repo destino lleva un `AGENTS.md` que advierte *"This is NOT the Next.js you know… Read the relevant guide in `node_modules/next/dist/docs/` before writing any code"*. El handoff debe apuntar a esa advertencia. Evidencia: `DivergenteWEB/AGENTS.md` y `DivergenteWEB/README.md` (línea 21).

## 5. Criterios de done

- [ ] La carpeta del bundle existe **dentro del repo** y **NO** está en `.gitignore`; un `git clone` limpio la trae completa.
- [ ] Contiene los 4 elementos: `README` de instrucciones + `BRIEF` (si va hacia Design) + prototipo HTML autocontenido + carpeta `screenshots/`.
- [ ] El BRIEF cubre las 8 secciones, con la **decisión estética justificada** (tiene un "porqué", no solo "se ve bien"), **tokens CSS copiables**, **tabla de estructura** e **iteración ordenada por prioridad**.
- [ ] Existe la sección **"Lo que NO cambiar"** (y/o "Decisiones ya tomadas") enumerando lo normativo/no negociable.
- [ ] Screenshots nombrados `NN_dispositivo_estado.png`, con **★** en los críticos y un **subconjunto mínimo** indicado en el README.
- [ ] Si va hacia código: el README trae la **regla pixel-perfect** ("recrear el output visual, NO copiar la estructura interna") y "leer el fuente, no renderizar/screenshot".
- [ ] Si el stack destino difiere del training esperado, el repo destino tiene un `AGENTS.md`/`CLAUDE.md` que lo advierte y el handoff lo referencia.
- [ ] El README trae un **prompt de arranque** listo para pegar que pide al agente leer el contexto y preguntar dudas ANTES de generar.

## Registro de uso

| Fecha | Proyecto | Tarea | Resultado | Lección |
|---|---|---|---|---|
| histórico | DivergenteWEB | Uso original (fuente de esta skill): bundle `.handoff/nueva-pagina-divergente/` committeado al repo Next.js para implementar la landing pixel-perfect desde el mock de Claude Design | ok | - |
| histórico | Plataformas Ministerio (GEDII) | Uso original (fuente de esta skill): bundle `gedii-handoff/` (BRIEF + prototipo + 9 screenshots) para iterar en Claude Design el wizard de 12 pasos | ok | - |
