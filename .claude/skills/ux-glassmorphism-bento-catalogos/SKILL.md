---
name: ux-glassmorphism-bento-catalogos
regimen: universal
description: Dirección visual "Bento + Vidrio" para catálogos de servicios/sistemas sobre fotografía temática, con reglas verificables de contraste AA. Cárgala al maquetar una vitrina o landing de catálogo con tarjetas glassmorphism, al elegir acentos/fondos por sector, o al escribir el documento de cierre de dirección visual de una fase.
---

# UX — Glassmorphism + Bento para catálogos

**Nivel actual:** N2 · **Dominio:** ux · **Agente(s):** `disenador-uiux`
**Proyectos fuente:** Portal ISI (`002 Desarrollos/Interfase Pagina Inicial`)

> Criterio de ascenso a N1: los 5 bloques completos, con activos copiables de ruta real y gotchas verificados (no genéricos). A N2: ≥1 uso real aceptado por el Dueño. A N3: ≥3 usos exitosos en ≥2 proyectos + checklist propio.

## 1. Propósito

Maquetar un **catálogo de servicios/sistemas** como una **rejilla bento uniforme** de **tarjetas en vidrio esmerilado** (glassmorphism) apoyadas sobre **fotografía temática difuminada**, con contraste de texto **AA (NTC 5854)** garantizado por reglas verificables, no por "buen ojo". Nació en Portal ISI (landing de los sistemas del Ministerio de las Culturas de Colombia): 32 plataformas, cada una una "puerta a explorar la cultura".

Se carga cuando: hay que diseñar/maquetar una vitrina o landing de catálogo con muchas entradas equivalentes; elegir acentos y fondos por sector/categoría; humanizar nomenclatura institucional (siglas → nombres); o cerrar la fase de diseño con un documento de decisión. La justificación completa está en `docs/direccion-visual.md` del proyecto fuente (decidido con el Dueño el 2026-06-11), copiado como activo.

## 2. Procedimiento

1. **Modela los temas antes que las celdas.** Define el eje por el que agrupas (sector cultural, categoría de servicio…) como un `Record<Tema, TemaMeta>` con `color` (acento) e `imagen` (fondo). Base copiable: `activos/temas-meta.ts`. Regla: **una foto por SECTOR, no por sistema** (9 temas → 9 fondos).
2. **Prepara la fotografía.** Un `.jpg` por tema en `client/public/fondos/{tema}.jpg`, ya difuminado/oscurecido en origen. En Portal ISI los 9 archivos pesan 83–273 KB; optimízalos (evita >300 KB).
3. **Arma la tarjeta como 4 capas apiladas** (ver `activos/TarjetaSistema.tsx` + `activos/glassmorphism-bento.css`), controlando el `z-index` dentro de un `.sistema-card__link` con `isolation: isolate`:
   - `__bg` (z0): `background-color: var(--c-tema)` **+** `background-image: var(--c-foto)` con `background-blend-mode: multiply`. El color es a la vez tinte y **fallback** si la foto no carga.
   - `__veil` (z1): gradiente oscuro `rgba(8,6,16, .12 → .4 → .86)` de arriba a abajo. **Esta capa es la que compra el contraste AA**, no es decorativa.
   - `__glass` (z2): panel inferior con `backdrop-filter: blur(10px) saturate(1.1)`, `background: rgba(18,13,34,.32)`, `border-top: 1px rgba(255,255,255,.18)`.
   - `__go` (z3): indicador "ir ↗" que aparece en `:hover`/`:focus-visible`.
4. **Inyecta acento y foto por celda vía CSS custom properties desde React** — no clases por tema:
   ```tsx
   const style = { '--c-tema': meta.color, '--c-foto': `url('/fondos/${meta.imagen}')` } as CSSProperties
   ```
   Un solo bloque CSS sirve para los N temas.
5. **Aplica "cero siglas en la fachada".** Titular = **nombre humanizado** (`SIARTES` → "Catálogo de las Artes"); la sigla va como `marca` en un subtítulo discreto (`.sistema-card__marca`). Inspiración: España es Cultura, GOV.UK. `descripcion` = una frase de qué encuentra el ciudadano.
6. **Etiqueta el acceso** por tarjeta con `data-acceso` (`abierto`/`registro`/`mixto`) → pill con color por estado (verde/ámbar/gris).
7. **Monta el buscador + chips de filtro accesibles** (`activos/VitrinaSistemas.tsx`): `<input type="search">`, chips con `aria-pressed`, contador con `aria-live="polite"`. Búsqueda insensible a tildes (`normalize('NFD')` + rango `U+0300–036F`).
8. **Rejilla bento uniforme:** `grid-template-columns: repeat(auto-fill, minmax(264px, 1fr))`, celdas de igual peso, sin destacados fijos; la jerarquía la dan los filtros. En móvil baja a `minmax(158px, 1fr)`.
9. **Cierra la fase con el documento de decisión** (`activos/direccion-visual.md`): dirección elegida, referencias, **reglas numeradas verificables** y alcance de datos, fechado y acordado con el Dueño.

**Criterios de decisión ya fijados** (no reinventar sin cerrarlo en el doc): blur del vidrio **8–14px** (buscador 8px, panel de tarjeta 10px); borde translúcido `rgba(255,255,255, .12–.25)`; radio `18px`; alto de tarjeta `252px` (216px móvil). Cualquier cambio se registra como nueva regla numerada.

## 3. Activos copiables

Todos en `.claude/skills/ux-glassmorphism-bento-catalogos/activos/`:

- **`direccion-visual.md`** — plantilla del "documento de cierre de dirección visual": 7 reglas numeradas verificables + tabla de color por tema + alcance de datos. Cópialo al iniciar; sustituye temas, colores y referencias. Origen: `Interfase Pagina Inicial/docs/direccion-visual.md`.
- **`TarjetaSistema.tsx`** — componente de tarjeta de vidrio (4 capas, inyección de `--c-tema`/`--c-foto`, `aria-label` que anuncia "abre en pestaña nueva"). Origen: `client/src/components/TarjetaSistema.tsx`. Adaptar: campos de tu modelo.
- **`glassmorphism-bento.css`** — bloques `.vitrina` y `.sistema-card` extraídos tal cual (rejilla bento, velo de contraste, panel de vidrio, pills de acceso, responsive, `prefers-reduced-motion`). Origen: `client/src/index.css` líneas **3221–3371** (.vitrina) y **3665–3859** (.sistema-card).
- **`VitrinaSistemas.tsx`** — orquestador: buscador + dos filas de chips (`aria-pressed`), contador `aria-live`, estado vacío con "Limpiar filtros", inyección de `--chip-c` por tema. Origen: `client/src/components/VitrinaSistemas.tsx`.
- **`temas-meta.ts`** — contrato `Tema`/`TemaMeta`/`temas[]`/`temaMeta`/`accesoLabel` (color + imagen por sector). Origen: extracto de `client/src/data/sistemas.ts`. Adaptar: tus sectores.

Fotografías de referencia (no copiadas, pesan MB): `Interfase Pagina Inicial/client/public/fondos/*.jpg` (9 archivos, uno por tema).

## 4. Gotchas verificados

- **La tarjeta bento quedó "huérfana": el render real usa otra visualización.** `TarjetaSistema` y `.vitrina__grid` existen, pero `VitrinaSistemas.tsx` (línea 109) monta `<ConstelacionSistemas>`, no una rejilla de tarjetas — `TarjetaSistema` **no se importa en ninguna parte** (verificado por grep en `client/src`). Para activar Bento + Vidrio hay que renderizar explícitamente `<ul className="vitrina__grid">{lista.map(s => <TarjetaSistema key={s.id} sistema={s} />)}</ul>`. No asumas que la dirección documentada es la que se ve en pantalla.
- **Texto sobre foto sin velo = falla de contraste AA.** El contraste no lo da el vidrio; lo da la capa `__veil` (gradiente que llega a `rgba(8,6,16,.86)` abajo). Si la eliminas, el texto blanco sobre fotos claras baja de 4.5:1. Reglas 1–2 de `direccion-visual.md`. Verifica siempre contra el **peor caso** del fondo, no el promedio.
- **Foto que no carga = tarjeta rota, salvo por el fallback.** `__bg` combina `background-color: var(--c-tema)` con `background-image: var(--c-foto)` y `background-blend-mode: multiply`: si el `.jpg` falta, la celda sigue legible con el color del tema. No pongas la foto como `<img>` ni quites el `background-color`. Evidencia: `.sistema-card__bg`, `index.css` línea 3691.
- **El acento del tema `datos` diverge entre doc y código.** `direccion-visual.md` regla 4 fija `datos #00A9A5`, pero `sistemas.ts` (línea 46) usa `#0E7C79`. Reconcilia doc↔código antes de reutilizar la paleta; el doc de decisión es la fuente de verdad.
- **`backdrop-filter` necesita prefijo y contexto de apilado propio.** El CSS incluye `-webkit-backdrop-filter` **antes** de `backdrop-filter` y el contenedor usa `isolation: isolate`; sin el nuevo stacking context el blur no aísla bien las capas `__veil`/`__glass`. No borres ninguna de las dos declaraciones.
- **Sin `prefers-reduced-motion` no pasa la auditoría NTC 5854.** El bloque `@media (prefers-reduced-motion: reduce)` (index.css 3845) anula `transform`/`transition` de tarjeta, fondo, chips y buscador. Es obligatorio, no opcional.

## 5. Criterios de done

- [ ] Cada tarjeta tiene las 4 capas (`__bg` con color+foto y `blend multiply`, `__veil`, `__glass` con `backdrop-filter`, `__go`) y `isolation: isolate` en el `__link`.
- [ ] Contraste del texto ≥ **4.5:1** contra el **peor caso** del fondo (con el velo aplicado); verificado, no estimado.
- [ ] Existe fallback: al quitar/renombrar un `.jpg`, la celda sigue legible con `--c-tema`.
- [ ] Blur del vidrio dentro de **8–14px**; borde translúcido presente; radio y alto según reglas fijadas.
- [ ] "Cero siglas en la fachada": titular humanizado, sigla como subtítulo; ningún acrónimo como título.
- [ ] Buscador + chips con `aria-pressed`; contador con `aria-live="polite"`; búsqueda insensible a tildes.
- [ ] Rejilla `auto-fill minmax(264px→158px móvil)`; celdas de igual peso, sin destacados fijos.
- [ ] Bloque `@media (prefers-reduced-motion: reduce)` presente y anulando transiciones/hover.
- [ ] `-webkit-backdrop-filter` presente junto a `backdrop-filter` en todos los paneles de vidrio.
- [ ] La rejilla de tarjetas está efectivamente renderizada (no solo definida en CSS) — revisar que `VitrinaSistemas` mapee la lista a `TarjetaSistema`.
- [ ] Documento de decisión numerado y fechado, acordado con el Dueño; doc↔código reconciliados (p. ej. el color de cada tema coincide).

## Registro de uso
| Fecha | Proyecto | Tarea | Resultado | Lección |
|---|---|---|---|---|
| histórico | Portal ISI | Uso original (fuente de esta skill) | ok | - |
