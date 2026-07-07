---
name: ux-css-bem-responsive-320-a-4k
regimen: universal
description: Organiza CSS puro con BEM para portales completos sin frameworks, con cascada responsive de 320px a 4K y convenciones touch-first. Cárgala al escribir/refactorizar hojas de estilo, al añadir un componente con su bloque CSS, al arreglar scroll horizontal o :hover "pegado" en táctil, o al ordenar breakpoints de 4K a mobile.
---

> **Régimen: universal.** Las referencias a normativa estatal (M-GSI-002, DI-GSI-010, ITIL, GOV.CO, «entidad pública») aplican SOLO en proyectos `institucional`; en un proyecto `divergente` ignóralas y usa la variante de la línea privada (Vercel/Node/Postgres). La técnica (BEM prefijado, cascada 320→4K, cadena anti-scroll, gateo de hover, tokens en `:root`) es universal a ambos regímenes.

# UX · CSS puro con BEM y responsive 320px → 4K

**Nivel actual:** N3 · **Dominio:** ux · **Agente(s):** `front-lider` (equipo frontend); consumida junto a `disenador-uiux`
**Proyectos fuente:** Portal ISI (Interfase Pagina Inicial), Interfase Sistemas, Plataforma Conecta, DivergenteWEB

> Criterio de ascenso a N1: los 5 bloques completos, con activos copiables de ruta real y gotchas verificados (no genéricos). A N2: ≥1 uso real aceptado por el Dueño. A N3: ≥3 usos exitosos en ≥2 proyectos + checklist propio.

## 1. Propósito

Vestir portales institucionales (arranque MinCulturas / Divergente) **sin ninguna librería de UI** — decisión estratégica repetida en los cuatro proyectos: nada de Tailwind/Bootstrap/MUI hasta que exista un sistema de diseño institucional, para no chocar después con los lineamientos gráficos oficiales. En su lugar: CSS puro con metodología **BEM prefijada por componente** y una **cascada responsive única de 320px a 4K** que cumple el "Responsive Design" exigido por DI-GSI-010 (NTC 5854 AA) (solo si el proyecto es institucional; en divergente el responsive se hace por calidad de producto, no por norma). Se carga cuando hay que escribir la hoja de estilos de un portal, añadir un componente con su bloque CSS, ordenar breakpoints, o corregir defectos clásicos de responsive (scroll horizontal, hover pegado en táctil, teléfono en horizontal).

## 2. Procedimiento

1. **Reset + tokens + cadena anti-scroll (primero de todo).** Copia el bloque cabecera de `activos/base-reset-tokens-overflow.css`:
   - `*, *::before, *::after { box-sizing: border-box; margin:0; padding:0; }`
   - `:root { font-size:16px; ... --min-morado:#512DA8; --min-acento:#F7D000; --gov-bar-bg:#0D0D2B; }` — tokens institucionales como variables CSS, nunca colores sueltos.
   - Cadena de `overflow-x:hidden` en **los 4 niveles**: `html, body`, `#root` y `.page-layout` (más `max-width:100%` en html/body). Es la única forma fiable de matar el scroll horizontal en mobile.

2. **Un bloque CSS por componente, con BEM prefijado.** Cada componente lleva su propio prefijo de bloque: `tirilla-f__`, `eco__`, `acc-bar__`, `hdr-main__`, `hdr-govbar__`, `hdr-nav__`, `footer-min__`. Elemento con `__`, modificador con `--` (`.hdr-main__burger--open`, `.tirilla-f--dark`, `.tirilla-f--static`). El prefijo evita colisiones entre componentes en una hoja única.

3. **Elige arquitectura de hoja según tamaño:**
   - Portal pequeño/medio → **hoja única** por secciones con separadores comentados (ver `activos/index-hoja-unica-responsive-4k-a-320.css`, 1.806 líneas).
   - Portal grande (>4.000 líneas) → **parciales orquestados por `@import`** en `index.css` (ver `activos/index-orquestador-import.css`). El orden de los `@import` reproduce la cascada original y lleva el comentario **`No reordenar`** porque los parciales posteriores dependen de que los anteriores ya estén declarados.

4. **Escribe la cascada responsive como UN solo bloque al final, de mayor a menor.** Encabézalo con el comentario de orden `RESPONSIVE — orden: 4K → 2K → xl → lg → tablet → mobile`. Los 9 tramos verificados en Interfase Sistemas:

   | Tramo | Media query |
   |---|---|
   | 4K | `@media (min-width: 2560px)` |
   | 2K | `@media (min-width: 1920px) and (max-width: 2559px)` |
   | base | (sin media query — 1440–1919px, estilos por defecto) |
   | xl | `@media (min-width: 1280px) and (max-width: 1439px)` |
   | lg | `@media (min-width: 1024px) and (max-width: 1279px)` |
   | tablet | `@media (min-width: 768px) and (max-width: 1023px)` |
   | mobile | `@media (max-width: 767px)` |
   | mobile M | `@media (max-width: 375px)` |
   | mobile S | `@media (max-width: 320px)` |

   En `mobile` el layout horizontal pasa a **vertical** (`.tirilla-f__inner { flex-direction: column }`) y se muestra el hamburger. Añade una rama de **teléfono en horizontal** cuando el layout dependa de la altura: `@media (orientation: landscape) and (max-height: 500px)` (DivergenteWEB).

5. **Tipografía fluida con `clamp()` donde el texto deba escalar** entre breakpoints, tabulando min/preferido/max: `font-size: clamp(40px, 5.5vw, 72px)` (títulos hero), `clamp(15px, 1.6vw, 18px)` (cuerpo). Requisito: todo el texto en **unidades relativas al root** para que la barra de accesibilidad pueda reescalar la fuente base (14/16/18/20px sobre `documentElement`).

6. **Gatea el hover en dos capas** (nunca dejes `:hover` que se "pegue" al tocar):
   - CSS: envuelve los efectos hover en `@media (hover: hover) { ... }` y/o neutralízalos en `@media (hover: none) { ...:hover { transform:none; filter:none; } }`.
   - JS (handlers de puntero): `onPointerEnter={(e) => { if (e.pointerType === "mouse") ... }}` — así el dock/animación no se dispara con el dedo.

7. **Hamburger 100% CSS** sobre 3 `<span>`: el modificador `--open` rota el 1.º y 3.º ±45° y colapsa el central con `opacity:0; transform:scaleX(0)`. La nav se despliega animando `max-height: 0 → 400px`.

8. **Si refactorizas la hoja, verifica que no cambió el resultado.** Al partir un `index.css` monolítico en parciales, compara el **CSS compilado byte a byte por hash** (antes vs. después). Sólo así el refactor es seguro. Igual criterio al borrar bloques de propuestas descartadas.

## 3. Activos copiables

En `.claude/skills/ux-css-bem-responsive-320-a-4k/activos/` (copiados de los proyectos fuente):

- **`base-reset-tokens-overflow.css`** — origen: `Plataforma Conecta/client/src/styles/base.css`. Reset universal, `:root` con tokens institucionales, cadena `overflow-x:hidden` y hamburger CSS. **Cópialo primero**; adapta los tokens de color a la entidad.
- **`index-orquestador-import.css`** — origen: `Plataforma Conecta/client/src/index.css`. Plantilla del `index.css` de 9 líneas que orquesta parciales con `@import` y el comentario `No reordenar`. Úsalo cuando la hoja pase de ~4.000 líneas.
- **`index-hoja-unica-responsive-4k-a-320.css`** — origen: `Interfase Sistemas/client/src/index.css`. Hoja única completa de referencia: reset, tokens, BEM por componente (header GOV.CO, tirilla, footer, acc-bar) y la **cascada responsive de 9 tramos 4K→320** ya escrita. Es el mejor mapa de "cómo se ve terminado".
- **`tirillaF-parcial-bem-responsive.css`** — origen: `Plataforma Conecta/client/src/styles/tirillaF.css`. Un parcial de UN componente con su bloque BEM (`tirilla-f__`), variantes `--dark`/`--static` y su propia cascada responsive `4K → 2K → xl → lg → tablet → mobile`. Modelo de cómo aislar un componente.

Activos referenciados **en sitio** (no copiados, consúltalos en el proyecto):
- `DivergenteWEB/app/globals.css` — gateo de hover `@media (hover: hover)` (líneas 131, 496) y `@media (hover: none)` (525); rama de teléfono horizontal `@media (orientation: landscape) and (max-height: 500px)` (líneas 67, 662).
- `DivergenteWEB/app/components/SiteShell.tsx` (líneas 248-253) — gateo JS `e.pointerType === "mouse"`.
- `Plataforma Conecta/client/src/styles/homeLanding.css` (líneas 36, 82) e `internacionalizacion.css` (líneas 21, 48) — tabla de `clamp()` de tipografía fluida.
- `.../TIRILLA_F_README.md` (tabla de breakpoints) — documentación de referencia del patrón responsive por componente.

## 4. Gotchas verificados

- **Scroll horizontal fantasma en mobile.** No basta con `overflow-x:hidden` en `body`. Solución aplicada: la cadena completa `html, body / #root / .page-layout` con `overflow-x:hidden` (`index-hoja-unica...css` líneas 20-31 y 1196) **más** `overflow-wrap:break-word; word-break:break-word` en textos largos del footer (línea 1353), que sin eso empujan el ancho. Evidencia: `Interfase Sistemas/client/src/index.css`.
- **`:hover` que se queda "pegado" al tocar en pantalla táctil.** Un logo escalaba y no volvía. Solución: `@media (hover: none)` dentro del bloque mobile que resetea `transform`, `filter` y `text-shadow` de los items (`index-hoja-unica...css` líneas 1329-1334). En proyectos nuevos se refuerza con gateo dual: aplicar sólo en `@media (hover: hover)` y no disparar handlers si `e.pointerType !== "mouse"` (`DivergenteWEB/app/globals.css` 131/496, `SiteShell.tsx` 248-253).
- **`scroll-snap` peleaba con el auto-scroll por requestAnimationFrame** (el carrusel infinito daba tirones). Solución: aplicar `scroll-snap-type: x proximity` **sólo** a la variante estática `.tirilla-f--static .tirilla-f__carousel`, nunca a la animada (`index-hoja-unica...css` líneas 1316-1321). Evidencia: Interfase Sistemas.
- **`index.css` monolítico (5.594 líneas) inmantenible.** Se partió en 6 parciales con `@import` ordenado; la validación fue **hash del CSS compilado byte-idéntico** antes/después (commit 611f0df). Al mover un parcial se rompió la ruta relativa del fondo `bailarines.jpg` → verificar rutas de assets tras el split. Por eso el `index.css` lleva el comentario `No reordenar`. Evidencia: `Plataforma Conecta/client/src/index.css`.
- **La barra de accesibilidad no reescalaba parte del texto.** El escalado global vía `document.documentElement.style.fontSize` (14/16/18/20px) sólo afecta a lo que usa unidades **relativas al root**; cualquier `font-size` en px absolutos en un texto queda inmune. Regla: texto siempre en rem/em o heredando del root. Evidencia: `accesibilidadBar.tsx` + convención de tokens en `:root`.
- **Teléfono en horizontal rompía layouts pensados sólo por ancho** (viewport corto en altura). Solución: rama extra `@media (orientation: landscape) and (max-height: 500px)` combinada con el breakpoint de ancho: `@media (max-width: 700px), (orientation: landscape) and (max-height: 500px)`. Evidencia: `DivergenteWEB/app/globals.css` líneas 67 y 662.

## 5. Criterios de done

- [ ] **Cero scroll horizontal** probado a 320, 375, 768, 1024, 1440, 1920 y 2560px. `overflow-x:hidden` presente en html/body/#root/layout.
- [ ] Media queries en **orden descendente 4K → 320px** con el comentario de orden; si hay parciales, `@import` en orden de cascada con el aviso `No reordenar`.
- [ ] **BEM con prefijo por componente** sin colisiones de nombres entre bloques; elementos `__`, modificadores `--`.
- [ ] Colores desde **tokens `:root`**, no valores sueltos repetidos.
- [ ] **Hover gateado** (`@media (hover: hover)` en CSS y/o `pointerType === "mouse"` en handlers); nada de `:hover` que persista tras un toque.
- [ ] Tipografía que escala usa **`clamp()`** tabulado; todo el texto en unidades relativas al root (el escalado de fuente de la barra de accesibilidad funciona).
- [ ] En mobile el layout horizontal colapsa a **vertical** y aparece el hamburger; si el layout depende de la altura, hay rama `orientation: landscape`.
- [ ] Si se refactorizó a parciales: **CSS compilado byte-idéntico por hash** verificado y rutas de assets revisadas.
- [ ] **Sin librerías de UI externas** (Tailwind/Bootstrap/MUI) en CSS puro; la decisión sigue vigente hasta el sistema de diseño institucional.

## Registro de uso
| Fecha | Proyecto | Tarea | Resultado | Lección |
|---|---|---|---|---|
| histórico | Portal ISI (Interfase Pagina Inicial) | uso original (fuente de esta skill) | ok | - |
| histórico | Interfase Sistemas | uso original (fuente de esta skill) | ok | - |
| histórico | Plataforma Conecta | uso original (fuente de esta skill) | ok | - |
| histórico | DivergenteWEB | uso original (fuente de esta skill) | ok | - |
