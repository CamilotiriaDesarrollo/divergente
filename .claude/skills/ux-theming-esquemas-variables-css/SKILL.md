---
name: ux-theming-esquemas-variables-css
regimen: universal
description: Theming multi-sección barato con variables CSS y clase en el <body> (Tailwind v4 sin config file), más acento por categoría inyectado como custom property desde React. Cárgala al montar un shell con paleta que cambia por ruta/sección, al necesitar auto-cycle de esquemas con pausa en hover y bloqueo en subpáginas, o al pintar tarjetas con color/foto por categoría.
---

# Theming por esquemas y variables CSS

**Nivel actual:** N3 · **Dominio:** ux · **Agente(s):** front-lider
**Proyectos fuente:** DivergenteWEB · Interfase Pagina Inicial (Portal ISI · MinCulturas)

> Criterio de ascenso a N1: los 5 bloques completos, con activos copiables de ruta real y gotchas verificados (no genéricos). A N2: ≥1 uso real aceptado por el Dueño. A N3: ≥3 usos exitosos en ≥2 proyectos + checklist propio.

## 1. Propósito

Cambiar la paleta completa de una app (o el acento de un componente) **sin re-renderizar ni re-montar nada**: se redefine un bloque de variables CSS y todo lo que las lee cambia solo. Resuelve dos problemas distintos que suelen confundirse:

- **Esquema por sección (global):** la marca tiene un color por sección/ruta (Analítica lila, Metodologías verde, Creatividad naranja…). El shell permanece montado entre rutas; al navegar solo cambia **una clase en el `<body>`** y la transición hace el resto. Barato porque no toca el árbol de React. Evidencia: `DivergenteWEB/app/globals.css` + `app/components/SiteShell.tsx`.
- **Acento por instancia (local):** cada tarjeta de un catálogo tiene el color de su categoría. React inyecta el color como custom property por instancia (`style={{ '--c-tema': color }}`) y el CSS lo consume con fallback. Evidencia: `Portal ISI/client/src/components/TarjetaSistema.tsx` + `client/src/index.css`.

Se carga al construir cualquier landing/portal con identidad que cambia por sección o por categoría, o al pedir auto-cycle de esquemas con pausa en hover.

## 2. Procedimiento

### A. Esquema por sección (paleta global que cambia por ruta)

1. **Declara los tokens de marca.** En Tailwind v4 **no hay `tailwind.config.ts`**: la paleta va en `@theme inline { --color-bg: …; --color-mint: … }` dentro de `globals.css`, justo bajo `@import "tailwindcss";`. `postcss.config.mjs` solo tiene `@tailwindcss/postcss`.
2. **Define el esquema base en el `body`**, no en `:root`, con las variables que van a mutar:
   ```css
   body { --bg:#1a1b2e; --fg:#f5f5f0; --mint:#91fee6; --nav-hover:#91fee6; --copy:#9ca3af; }
   ```
   Todo componente lee `var(--mint)`, `var(--bg)`… **nunca un hex fijo.**
3. **Pon la transición en los CONSUMIDORES**, una por propiedad concreta y a `0.35s ease`:
   ```css
   .wordmark { color: var(--mint); transition: color 0.35s ease; }
   .bg-layer { background: var(--bg); transition: background 0.35s ease; }
   ```
   Nunca `transition: all` ni la transición sobre el `body`.
4. **Un bloque de esquema por sección**, nombrado como la sección. Redefine el bloque entero de tokens:
   ```css
   body.hover-creatividad { --bg:#1e2030; --fg:#ffb26b; --mint:#ff6a00; --nav-hover:#ff6a00; --copy:#ffb26b; }
   ```
   Añade overrides sueltos solo para elementos cuyo color no deriva 1:1 de un token (`body.hover-creatividad .nav-link { color:#ffb26b; }`).
5. **Monta el shell en `layout.tsx`** para que persista entre rutas (`<body><SiteShell>{children}</SiteShell></body>`). Ese es el motivo de que el cambio sea barato: el shell no se desmonta al navegar.
6. **Aplica/quita la clase por JS** en un `useEffect`. Siempre `classList.remove(...SCHEMES)` antes de `add`, para no acumular clases.
7. **Criterio home vs subpágina** con `resolveIndex(pathname)`:
   - Subpágina (`lockedIndex !== null`): **esquema bloqueado**, sin auto-cycle ni hover. Rutas anidadas heredan el esquema del padre con `pathname.startsWith(base + '/')`.
   - Home (`lockedIndex === null`): **auto-cycle** con `setTimeout` de delay aleatorio `4000 + Math.random()*3000` ms; `pickNext()` elige del `POOL = [null,0,1,2,3,4]` evitando repetir el actual (`null` = esquema neutral). Hover de nav pausa el ciclo y fija el esquema; `leave` reanuda.
8. **Limpia en el cleanup** del `useEffect`: `clearTimeout`, quitar clases de esquema y `is-active`. La dependencia `[lockedIndex]` re-arranca el ciclo al volver de una subpágina a home.

### B. Acento por instancia (color por categoría)

1. **Centraliza el mapa categoría→color** en un `Record` tipado (`temaMeta[tema].color`), no repartas hex por los componentes. Ver `temaMeta.ts`.
2. **Inyecta el token desde React** casteando a `CSSProperties` (TypeScript rechaza `--custom` en `style` sin el cast):
   ```tsx
   const style = { '--c-tema': meta.color, '--c-foto': `url('/fondos/${meta.imagen}')` } as CSSProperties
   ```
3. **Consúmelo con fallback** en CSS: `background: var(--c-tema, #512da8)`. El fallback evita tarjetas sin color si el componente no inyecta el token; aquí además sirve de color de respaldo si la foto no carga (`background-blend-mode: multiply`).
4. **Garantiza contraste** con un velo oscuro (gradiente rgba) sobre la foto/color antes del texto → AA sobre cualquier imagen.

## 3. Activos copiables

Todos en `./activos/` de esta skill (extraídos de los proyectos fuente):

| Activo | Qué es | Cuándo copiarlo / qué adaptar |
|---|---|---|
| `activos/SiteShell.tsx` | Motor completo React del esquema por sección: aplica/quita clase en `<body>`, auto-cycle con pausa en hover, bloqueo y herencia en subpáginas, cleanup correcto. Origen: `DivergenteWEB/app/components/SiteShell.tsx`. | Copia y ajusta `NAV_ITEMS`, `ROUTE_TO_INDEX` y los delays. Elimina lo no-theming (parallax `bg-offset`, SVG sociales, alineación de nav) si no lo usas. |
| `activos/theming-schemes.css` | Extracto real de `globals.css`: `@theme inline`, esquema base en `body`, transición en consumidores y los 5 bloques `body.hover-*`. Origen: `DivergenteWEB/app/globals.css` (líneas 3-32, 531-580). | Renombra los tokens y define un `body.hover-<seccion>` por sección. Mantén la transición en los consumidores, no en el body. |
| `activos/TarjetaSistema.tsx` | Componente que inyecta `--c-tema` y `--c-foto` por instancia con cast `as CSSProperties`. Origen: `Portal ISI/client/src/components/TarjetaSistema.tsx`. | Cambia la fuente del color (`temaMeta[...]`) y el markup. Conserva el patrón `style={...} as CSSProperties`. |
| `activos/sistema-card.css` | CSS que consume `var(--c-tema, fallback)` con `background-blend-mode: multiply` + velo AA. Origen: `Portal ISI/client/src/index.css` (~3690-3744). | Ajusta radios/tamaños; conserva el fallback en cada `var()` y el velo antes del texto. |
| `activos/temaMeta.ts` | Mapa categoría→{color,imagen} como `Record` tipado, fuente de verdad del acento. Origen: `Portal ISI/client/src/data/sistemas.ts` (líneas 32-53). | Redefine `Tema` y la lista `temas`. Es el único sitio donde viven los hex de categoría. |

## 4. Gotchas verificados

- **TypeScript rechaza custom properties en `style`.** `style={{ '--c-tema': x }}` no compila sin castear el objeto `as CSSProperties`. Evidencia: `TarjetaSistema.tsx` línea 14 (`} as CSSProperties`).
- **Timeouts colgados y clases pegadas al navegar.** Si el `useEffect` del ciclo no hace `clearTimeout` + `classList.remove(...SCHEMES)` en el cleanup, al ir a una subpágina el auto-cycle sigue vivo y pisa el esquema bloqueado. Se resolvió con `return` de limpieza en **cada** rama y dependencia `[lockedIndex]` que re-monta el efecto. Evidencia: `SiteShell.tsx` líneas 138-197.
- **Transición sobre el `body` o `transition: all` = saltos y reflows.** La transición debe ir en cada consumidor y solo sobre la propiedad que cambia (`color`, `background`), a `0.35s ease`. Evidencia: `globals.css` (`.wordmark`, `.bg-layer`, `.page-title` con `transition: … 0.35s ease`).
- **Rutas anidadas se quedan sin esquema.** `/metodologias/conferencias` no está en `ROUTE_TO_INDEX`; sin herencia quedaría con el esquema neutral. Solución: `resolveIndex` hace fallback con `pathname.startsWith(base + '/')`. Evidencia: `SiteShell.tsx` líneas 42-49.
- **Hover dispara cambios erráticos en táctil.** El hover que fija/pausa el esquema solo debe correr con mouse: `if (e.pointerType === 'mouse') navAutoRef.current?.hover(i)`. Evidencia: `SiteShell.tsx` líneas 248-253. Complementar con `@media (hover: hover)` para que los estilos `:hover` no se peguen en touch (`globals.css` línea 131, 496).
- **`var()` sin fallback deja el elemento transparente/negro** si el componente no inyecta el token. Regla: siempre `var(--c-tema, #512da8)`. Evidencia: `index.css` líneas 3695, 3742.
- **Texto ilegible sobre foto/color.** Obligatorio un velo con gradiente rgba oscuro antes del texto para pasar AA contra el peor caso del fondo; es regla escrita de la dirección visual del portal. Evidencia: `sistema-card.css` (`.sistema-card__veil`) + `Portal ISI/docs/direccion-visual.md` reglas 1-2.
- **Buscar `tailwind.config.ts` que no existe.** En Tailwind v4 la paleta está en `@theme inline` de `globals.css`; el `postcss.config.mjs` solo referencia `@tailwindcss/postcss`. Cambiar colores editando un config file inexistente es tiempo perdido. Evidencia: `DivergenteWEB/postcss.config.mjs` + ausencia de config en la raíz.
- **Next post-cutoff.** `DivergenteWEB/AGENTS.md` advierte "This is NOT the Next.js you know" (Next 16.2.4, React 19.2.4): leer `node_modules/next/dist/docs/` antes de tocar `layout.tsx` o el App Router.

## 5. Criterios de done

- [ ] Navegar entre secciones/rutas cambia **todos** los tokens con transición suave (~0.35s), sin recargar la página ni desmontar el shell.
- [ ] Ningún componente tiene hex de marca hardcodeados: todo color lee `var(--token…)`.
- [ ] Al ir de home a subpágina y volver, **no quedan** timeouts del auto-cycle vivos ni clases `hover-*`/`is-active` pegadas (verificar en DevTools el `<body>` y con perfil de timers).
- [ ] Subpáginas muestran esquema **fijo** (sin auto-cycle); las rutas anidadas heredan el esquema del padre.
- [ ] Cada `var(--…)` tiene fallback y el proyecto **compila TS** (custom properties casteadas `as CSSProperties`).
- [ ] Texto sobre color/foto pasa contraste **AA** (velo presente sobre cada tarjeta con imagen).
- [ ] `@media (prefers-reduced-motion: reduce)` desactiva las transiciones de esquema.
- [ ] La paleta se edita en un único lugar: `@theme inline` + bloques `body.hover-*` (global) y `temaMeta` (acento por categoría).

## Registro de uso
| Fecha | Proyecto | Tarea | Resultado | Lección |
|---|---|---|---|---|
| histórico | DivergenteWEB | Uso original (fuente de esta skill): esquema por sección con clase en `<body>`, auto-cycle con pausa en hover y bloqueo en subpáginas sobre Tailwind v4 | ok | - |
| histórico | Interfase Pagina Inicial (Portal ISI) | Uso original (fuente de esta skill): acento por categoría inyectado como `--c-tema` desde React con fallback y velo AA | ok | - |
