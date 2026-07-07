---
name: ux-accesibilidad-ntc5854-aa
regimen: universal
description: Cumplir y evidenciar accesibilidad grado AA (NTC 5854 / WCAG) en portales estatales colombianos. Cárgala al construir o revisar UI para el Ministerio (o cualquier entidad GOV.CO), al añadir barra de accesibilidad, alto contraste, escalado de fuente, ARIA en filtros/modales, gestión de foco, prefers-reduced-motion, o al configurar el gate jsx-a11y.
---

> **Régimen: universal.** Las referencias a normativa estatal (M-GSI-002, DI-GSI-010, ITIL, GOV.CO, «entidad pública») aplican SOLO en proyectos `institucional`; en un proyecto `divergente` ignóralas y usa la variante de la línea privada (Vercel/Node/Postgres). Las técnicas de accesibilidad AA (barra, ARIA, foco, contraste, `prefers-reduced-motion`, gate jsx-a11y) son universales y aplican a ambos regímenes.

# UX · Accesibilidad AA (NTC 5854)

**Nivel actual:** N3 · **Dominio:** ux · **Agente(s):** `disenador-uiux`, `front-formularios-a11y`
**Proyectos fuente:** Políticas TI MinCulturas · Portal ISI · Interfase Sistemas · Plataforma Conecta

> Criterio de ascenso a N1: los 5 bloques completos, con activos copiables de ruta real y gotchas verificados (no genéricos). A N2: ≥1 uso real aceptado por el Dueño. A N3: ≥3 usos exitosos en ≥2 proyectos + checklist propio.

## 1. Propósito

La accesibilidad grado AA de la norma **NTC 5854** (homóloga colombiana de WCAG 2.0/2.1) es un **requisito legal vinculante** (solo si el proyecto es institucional), no un extra de UX: lo exige el lineamiento **DI-GSI-010** del Ministerio de las Culturas y su marco legal es Ley 1346/2009, Ley estatutaria 1618/2013, Ley 1712/2014 (transparencia) y Resolución 1519/2020. Todo portal entregable debe cumplirlo **y entregar un documento que evidencie la implementación**.

Esta skill se carga cuando un agente construye o revisa la interfaz de un portal estatal y necesita: montar la barra flotante de accesibilidad (alto contraste + escalado de fuente), poner ARIA operativo en filtros/contadores/toggles, gestionar el foco de un modal, garantizar contraste ≥4.5:1 sobre fotografías, respetar `prefers-reduced-motion`, y dejar el gate `eslint-plugin-jsx-a11y` en verde. El patrón está probado idéntico en tres portales (Portal ISI, Interfase Sistemas, Plataforma Conecta).

## 2. Procedimiento

1. **Monta la barra de accesibilidad** (`accesibilidadBar.tsx`, activo 3.1). Es un `role="complementary"` fijo al borde derecho con 4 controles: alto contraste, A+, A−, restablecer. Dos mecanismos:
   - **Alto contraste**: `document.documentElement.classList.toggle('high-contrast', next)` + `aria-pressed={highContrast}` en el botón. El CSS reacciona con `.high-contrast body { background:#000; color:#fff }` y `.high-contrast a { color:#ff0 }`.
   - **Escalado de fuente**: estado entero acotado con `Math.min(2, Math.max(-1, fontSize + delta))` sobre la escala `['14px','16px','18px','20px']`, aplicado a `document.documentElement.style.fontSize`. Criterio de decisión: **esto obliga a que TODO el CSS de texto use unidades relativas al root (rem)** — si algún texto está en `px` fijos, el botón A+ no lo escala. Verifícalo antes de dar por hecha la barra.

2. **Etiqueta cada control interactivo con ARIA** (evidencia: `VitrinaSistemas.tsx`, `ConstelacionSistemas.tsx`):
   - Chips/toggles de filtro → `aria-pressed={activo}` y agrúpalos en `role="group" aria-label="Filtrar por tema"`.
   - Contadores de resultados que cambian → `aria-live="polite"` (ej. `<p className="vitrina__meta" aria-live="polite">`), para que el lector anuncie el nuevo total sin robar el foco.
   - Botón hamburguesa → `aria-expanded`. Botones icónicos (solo SVG) → `aria-label` textual. SVG decorativo → `aria-hidden="true"`. Enlaces de logo → `title`.

3. **Gestiona el foco en todo panel/modal** (patrón `usePanelFoco`, activo 3.4). Los 4 pasos obligatorios: (a) al abrir, guarda en un ref el botón que lo lanzó (`focoPrevio.current = el`); (b) al aparecer el panel, mueve el foco al botón cerrar (`cerrarRef.current?.focus()`); (c) `Escape` cierra (listener en `useEffect`, con cleanup); (d) al cerrar, devuelve el foco al origen (`focoPrevio.current?.focus()`). El panel lleva `role="dialog" aria-label`. **Criterio**: los elementos clicables deben ser `<button>` reales (foco por Tab + Enter/Space nativos), nunca `<div onClick>`.

4. **Garantiza contraste ≥4.5:1 contra el peor caso del fondo**. En tarjetas glassmorphism sobre fotografía, el texto va sobre una **capa de oscurecimiento** (gradiente) más un fallback de gradiente cromático si la imagen no carga (regla 1-2 de `direccion-visual.md`). Nunca calcules el contraste contra el color medio de la foto: hazlo contra su zona más clara.

5. **Respeta el movimiento**: envuelve animaciones de adorno en `@media (prefers-reduced-motion: reduce) { … transition:none; transform:none }` (activo 3.2). Además, **pausa toda animación automática** (carruseles, dock) cuando el usuario interactúa.

6. **Pon el gate jsx-a11y en CI** (activo 3.3): añade `eslint-plugin-jsx-a11y` con `...jsxA11y.configs.recommended.rules` al flat config. Criterio de excepción: cuando una regla no se pueda cumplir todavía (ej. enlace `href="#"` sin URL real), **NO apagues la regla globalmente**; usa `// eslint-disable-next-line jsx-a11y/anchor-is-valid -- TODO: <condición de cierre>` en la línea, dejando el backlog documentado en el código.

7. **Entrega el documento de evidencia** de implementación AA (lo exige DI-GSI-010, sección Accesibilidad — solo si el proyecto es institucional). Puedes apoyarte en la revisión automatizada del gate más una lista de verificación (bloque 5).

## 3. Activos copiables

Todos en `.claude/skills/ux-accesibilidad-ntc5854-aa/activos/`.

1. **`accesibilidadBar.tsx`** — barra flotante completa (alto contraste + escalado de fuente en 4 pasos, `role="complementary"`, `aria-pressed`, `aria-label` en botones icónicos, SVG `aria-hidden`). Origen: `Plataforma Conecta/client/src/components/accesibilidadBar.tsx` (prácticamente idéntico en Portal ISI e Interfase Sistemas: esas dos variantes difieren solo en el espaciado de formato de dos etiquetas SVG, ` />` vs `/>`). Copiar tal cual; solo adaptar los nombres de clase si tu portal no usa `acc-bar`.
2. **`acc-bar.css`** — estilos de la barra + reglas de `.high-contrast` + bloque `prefers-reduced-motion`. Origen: `Plataforma Conecta/client/src/styles/base.css` (líneas 347-419) y `Portal ISI/client/src/index.css` (línea 3845). Adaptar variables `--min-morado` a la paleta del portal. **Lee la nota del encabezado: exige texto en rem.**
3. **`eslint.config.js`** — flat config ESLint 9 con `jsx-a11y`, `react-hooks` y `react-refresh` + `eslint-config-prettier` al final. Origen: `Plataforma Conecta/client/eslint.config.js`. Copiar y ajustar `ignores`.
4. **`gestion-foco-modal.tsx`** — hook `usePanelFoco` con los 4 pasos de foco (guardar origen, foco al cerrar, Escape, devolución) + marcado `role="dialog"` de referencia. Extraído VERIFICADO de `Portal ISI/client/src/components/ConstelacionSistemas.tsx` (líneas 57-113, 193-215). Adaptar el tipo genérico y el cuerpo del panel.

Activos fuente adicionales (referencia, no copiados aquí): `VitrinaSistemas.tsx` (chips `aria-pressed` + `aria-live`), `docs/direccion-visual.md` regla 7 (checklist de dirección AA), `docs/LINEAMIENTOS-DE-DESARROLLO.md` §3 (lista DI-GSI-010).

## 4. Gotchas verificados

1. **El botón A+ no escala parte del texto.** Causa real: el escalado se hace con `document.documentElement.style.fontSize` sobre `['14px','16px','18px','20px']`, así que **solo reescala lo definido en unidades relativas al root**; cualquier texto en `px` fijos queda inmóvil. Solución: usar `rem`/`em` en toda tipografía. Evidencia: aprendizaje "Accesibilidad operativa" en Interfase Sistemas + `accesibilidadBar.tsx` líneas 16-17.
2. **Contraste insuficiente del texto sobre fotografía en tarjetas de vidrio.** Cometido en Portal ISI. Solución verificada: capa de oscurecimiento (gradiente) sobre cada celda glassmorphism **más** fallback de gradiente cromático del tema si la imagen no carga, garantizando ≥4.5:1 contra el peor caso. Evidencia: `Portal ISI/docs/direccion-visual.md` reglas 1-2 y 7.
3. **Apagar una regla de accesibilidad para "callar" el linter.** En Plataforma Conecta había 14 enlaces `href="#"` sin URL real que disparaban `jsx-a11y/anchor-is-valid`. Antipatrón: degradar el `<a>` o desactivar la regla globalmente. Solución adoptada: `// eslint-disable-next-line jsx-a11y/anchor-is-valid -- TODO: enlazar cuando exista la URL` por línea, manteniendo el lint en 0 con el backlog visible en el código. Evidencia: `Plataforma Conecta/client/src/components/tirillaF.tsx` líneas 153 y 193, commit 65e849c.
4. **Usuario de teclado "perdido" al cerrar un modal.** Si no se devuelve el foco, al cerrar el panel el foco cae al `<body>` y el usuario debe re-tabular desde el inicio. Solución verificada: guardar `focoPrevio` al abrir y hacer `focoPrevio.current?.focus()` al cerrar. Evidencia: `Portal ISI/client/src/components/ConstelacionSistemas.tsx` líneas 96-103.
5. **Estados `:hover` "pegados" en pantallas táctiles** deterioran la lectura del contenido. Solución: neutralizar `transform`/`filter`/`text-shadow` dentro de `@media (hover: none)`. Evidencia: `Interfase Sistemas/client/src/index.css` ~línea 1329 (error documentado en la ficha del proyecto).
6. **Animaciones que no respetan la preferencia del sistema.** Solución verificada: bloque `@media (prefers-reduced-motion: reduce)` que anula transiciones/transforms, y pausar carruseles/dock automáticos al interactuar. Evidencia: `Portal ISI/client/src/index.css` líneas 3498 y 3845.

## 5. Criterios de done

- [ ] Barra de accesibilidad presente con `role="complementary"`; alto contraste con `aria-pressed`; A+/A−/reset funcionando y **todo el texto reescala** (comprobado: no queda tipografía en px fijos).
- [ ] Alto contraste real: fondo negro, texto blanco, enlaces amarillos (`.high-contrast`), sin perder legibilidad.
- [ ] Todo control interactivo tiene nombre accesible: `aria-pressed` en toggles/chips, `aria-expanded` en desplegables, `aria-label` en botones icónicos, `aria-live="polite"` en contadores, `aria-hidden` en SVG decorativo.
- [ ] Cada modal/panel: foco al abrir va al cierre, `Escape` cierra, foco se devuelve al origen; clicables son `<button>` reales, navegables por Tab+Enter.
- [ ] Contraste de texto ≥4.5:1 contra el **peor caso** del fondo (verificado sobre la zona más clara de cada fotografía).
- [ ] `@media (prefers-reduced-motion: reduce)` presente y animaciones automáticas pausables.
- [ ] `eslint-plugin-jsx-a11y` en verde; excepciones solo con `eslint-disable`-de-línea + `TODO`, nunca regla apagada.
- [ ] Documento de evidencia de implementación AA (NTC 5854) redactado y adjunto a la entrega (exigencia DI-GSI-010, solo si el proyecto es institucional).

## Registro de uso
| Fecha | Proyecto | Tarea | Resultado | Lección |
|---|---|---|---|---|
| histórico | Políticas TI MinCulturas | uso original (fuente de esta skill) | ok | - |
| histórico | Portal ISI | uso original (fuente de esta skill) | ok | - |
| histórico | Interfase Sistemas | uso original (fuente de esta skill) | ok | - |
| histórico | Plataforma Conecta | uso original (fuente de esta skill) | ok | - |
