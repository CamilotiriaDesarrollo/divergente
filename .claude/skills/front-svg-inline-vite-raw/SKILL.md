---
name: front-svg-inline-vite-raw
regimen: universal
description: Gestiona logos SVG sin dependencias en React+Vite — importa el SVG como texto con `?raw`, lo inyecta inline y lo recolorea con CSS vía `currentColor`. Cárgala cuando haya que mostrar/recolorear logos o íconos SVG, cuando un logo importado como URL/`<img>` no carga o no cambia de color, o cuando aparezca la declaración `<?xml?>` rompiendo `dangerouslySetInnerHTML`.
---

> **Régimen: universal.** Las referencias a normativa estatal (M-GSI-002, DI-GSI-010, ITIL, GOV.CO, «entidad pública») aplican SOLO en proyectos `institucional`; en un proyecto `divergente` ignóralas y usa la variante de la línea privada (Vercel/Node/Postgres). La regla técnica de fondo (nunca inyectar contenido externo/de usuario con `?raw`/`dangerouslySetInnerHTML`) es universal y aplica igual en ambas líneas.

# Frontend — SVG inline con Vite `?raw` y recoloreo por `currentColor`

**Nivel actual:** N3 · **Dominio:** front · **Agente(s):** `front-lider`
**Proyectos fuente:** Portal ISI (Interfase Pagina Inicial), Interfase Sistemas, Plataforma Conecta

> Criterio de ascenso a N1: los 5 bloques completos, con activos copiables de ruta real y gotchas verificados (no genéricos). A N2: ≥1 uso real aceptado por el Dueño. A N3: ≥3 usos exitosos en ≥2 proyectos + checklist propio.

## 1. Propósito

Mostrar logos/íconos de marca como **SVG inline** en un frontend React 18 + Vite + TypeScript **sin librerías** (ni `vite-plugin-svgr`, ni sprites, ni componentes por logo). El SVG se importa como *string* con el sufijo `?raw` de Vite, se guarda en un catálogo de datos tipado y se inyecta con `dangerouslySetInnerHTML`. Como el SVG queda en el DOM, hereda el color del contenedor vía `fill="currentColor"`: las variantes clara/oscura/activo se resuelven **solo con CSS** (`color`), sin duplicar el archivo ni recolorearlo en build.

Se carga cuando: hay que renderizar logos SVG que cambian de color según tema o estado hover; un logo importado como `logoUrl`/`<img src>` no aparece o no se puede recolorear; o al toparse con que la declaración `<?xml … ?>` de un SVG exportado rompe la inyección inline. Nace de tres portales institucionales (Ministerio de las Culturas de Colombia) con la misma tirilla de logos y header GOV.CO.

## 2. Procedimiento

1. **Declara el tipo del import `?raw`** en `client/src/vite-env.d.ts`. Sin esto TypeScript no compila el import y, como el build es `tsc && vite build`, bloquea el despliegue:
   ```ts
   /// <reference types="vite/client" />
   declare module '*.svg?raw' {
     const content: string
     export default content
   }
   ```
2. **Prepara cada SVG**: colócalo en `client/src/assets/logos/`. Abre el archivo y reemplaza todo `fill="#hex"`/`fill="negro"` por `fill="currentColor"` (en el `<svg>` raíz y en cada `<path>`). Si no lo haces, el color queda fijo y el recoloreo por CSS no surte efecto. Evita "SVG" que envuelvan un raster base64: inflan el bundle (ver gotcha).
3. **Importa como texto** en el módulo de datos, con `?raw`:
   ```ts
   import sipaLogoRaw from '@/assets/logos/logo_sipa.svg?raw'
   ```
4. **Modela un catálogo tipado** con `svgRaw?` opcional y una `sigla` como fallback textual (degradación elegante cuando un sistema aún no tiene logo):
   ```ts
   export interface SistemaDemo {
     id: string
     sigla: string        // texto fallback si no hay SVG
     descripcion: string
     svgRaw?: string      // SVG inline (heredado vía currentColor)
   }
   ```
5. **Limpia la declaración XML antes de inyectar.** Define un helper y pásalo siempre a `dangerouslySetInnerHTML`; nunca inyectes `svgRaw` crudo:
   ```ts
   const stripXmlDecl = (svg: string) => svg.replace(/^<\?xml[^?]*\?>\s*/i, '')
   ```
6. **Renderiza con ternario** svgRaw → sigla, envuelto en un `<span>` cuyo `color` controla el CSS:
   ```tsx
   {s.svgRaw ? (
     <span className="tirilla-f__svg-logo"
           dangerouslySetInnerHTML={{ __html: stripXmlDecl(s.svgRaw) }} />
   ) : (
     <span className="tirilla-f__sigla">{s.sigla}</span>
   )}
   ```
7. **Recolorea con CSS**, no con más SVG. El `<span>` contenedor fija `color`; el SVG lo hereda por `currentColor`. Estados/temas = cambiar `color`:
   ```css
   .tirilla-f__svg-logo        { color: #c5bedd; transition: color .25s ease; }
   .tirilla-f__svg-logo svg    { max-width: 104px; max-height: 36px; width: auto; height: auto; display: block; }
   .tirilla-f__svg-logo--active            { color: var(--min-morado); }
   .tirilla-f--dark .tirilla-f__svg-logo   { color: rgba(210,180,255,.72); }
   ```
8. **Íconos "de sistema" (redes sociales, chevrons)**: no necesitan `?raw`. Guarda solo el atributo `d` del path en un array y renderízalos en un único template `<svg viewBox fill="currentColor">`. Menos peso que un archivo por ícono (ver `headerMincultura.tsx`, array `socialLinks`).

**Criterio de decisión — ¿`?raw` inline o `<img src>`?** Usa `?raw` inline cuando el logo debe **recolorearse** (tema/estado) o heredar `currentColor`. Usa `import logo from '…svg'` + `<img>` cuando el logo es **multicolor fijo** de marca (GOV.CO, Marca País) y no cambia de color — así no engorda el bundle JS. En los proyectos fuente conviven ambos: los logos de sistemas van inline (`sistemasDemo.ts`), y los institucionales GOV.CO van como `<img>` (`headerMincultura.tsx`, líneas 2-3).

**Criterio — recoloreo de raster:** si el asset es un raster (PNG/foto) que no puede usar `currentColor`, se tiñe con `filter` CSS (`sepia`/`hue-rotate`/`saturate`), no con inline. Ver gotcha y `homeLanding.css:391` en Plataforma Conecta.

## 3. Activos copiables

En `activos/` de esta skill (copiados de **Interfase Sistemas**, `client/src/…`):

- **`sistemasDemo.ts`** — catálogo tipado de referencia: 6 imports `?raw`, interface `SistemaDemo` con `svgRaw?` + `sigla` fallback, y 14 ítems (8 sin logo → renderizan sigla). Cópialo y cambia los imports/ítems por tus logos. Origen: `Interfase Sistemas/client/src/data/sistemasDemo.ts`.
- **`tirillaF.tsx`** — componente que muestra el patrón completo de inyección: `stripXmlDecl` (línea 11) y el ternario svgRaw→sigla en dos contextos (fijos línea 146-153, carrusel 181-188). Reutiliza el bloque de render; el resto (dock magnético/carrusel) es de otras skills. Origen: `Interfase Sistemas/client/src/components/tirillaF.tsx`.
- **`vite-env.d.ts`** — la declaración `declare module '*.svg?raw'`. Pequeño pero **obligatorio**: sin él `tsc` falla. Cópialo tal cual a `client/src/`. Origen: `Interfase Sistemas/client/src/vite-env.d.ts`.
- **`logo_sipa.svg`** — ejemplo real de SVG ya preparado con `fill="currentColor"` en el `<svg>` raíz y en el `<path>` (2.9 KB, vectorial puro). Úsalo como plantilla de cómo debe quedar un logo antes de importarlo. Origen: `Interfase Sistemas/client/src/assets/logos/logo_sipa.svg`.
- **`headerMincultura.tsx`** — patrón de íconos sociales como array de paths `d` en un solo template SVG (`socialLinks`, líneas 5-12) y el criterio mixto inline-vs-`<img>` (logos GOV.CO como `<img>`, líneas 2-3, 33, 42). Origen: `Interfase Sistemas/client/src/components/headerMincultura.tsx`.

Activo referenciado (no copiado, ver en el proyecto): bloque CSS de recoloreo por `currentColor` con variante `--dark` y `--active` en `Plataforma Conecta/client/src/styles/tirillaF.css` (líneas 78-99 base y 385-409 tema oscuro).

## 4. Gotchas verificados

- **La declaración `<?xml … ?>` rompe la inyección inline.** SVGs exportados (Inkscape/editores) empiezan con `<?xml version="1.0"?>`; al pasarlos a `dangerouslySetInnerHTML` el logo no renderiza. Solución: `stripXmlDecl` con regex `^<\?xml[^?]*\?>\s*`. Evidencia: error documentado en ambos proyectos (`Interfase Sistemas` y `Plataforma Conecta`, sección "errores"), fix en `tirillaF.tsx` línea 11.
- **Logo importado como URL/`<img>` no cargaba → cambiar a `svgRaw` inline.** En Portal ISI el logo se guardaba como `logoUrl` y no aparecía; se corrigió importando el SVG con `?raw` e inyectándolo inline con `fill="currentColor"`. Evidencia: commit `77a42ee` "fix: reemplazar logoUrl por svgRaw en tirillaD y tirillaG" (Interfase Pagina Inicial).
- **Inyectar `svgRaw` sin limpiar (regresión real).** `tirillaG.tsx` de Portal ISI hace `dangerouslySetInnerHTML={{ __html: s.svgRaw }}` **sin** `stripXmlDecl` (línea 11), mientras `tirillaF.tsx` sí lo limpia (línea 149). Si esos SVG llevaran declaración XML, tirillaG fallaría. Al copiar el patrón, verifica que TODA inyección pase por `stripXmlDecl`. Evidencia: `Interfase Pagina Inicial/client/src/components/tirillaG.tsx:11` vs `tirillaF.tsx:149`.
- **Sin `declare module '*.svg?raw'`, el build de despliegue se cae.** El import `?raw` no tipa y el script `tsc && vite build` convierte el error TS en bloqueo de Vercel. Solución: la declaración en `vite-env.d.ts`. Evidencia: `Interfase Sistemas/client/src/vite-env.d.ts` + gate de build `tsc && vite build` documentado en Plataforma Conecta (commit `65d5ddd`).
- **`fill` con color fijo anula el recoloreo por CSS.** Si el SVG conserva `fill="#000"`, el `color` del contenedor no lo afecta y las variantes dark/active no cambian nada. Solución: reemplazar todos los `fill` por `currentColor` en el asset. Evidencia: `logo_sipa.svg`/`logo_sinic.svg` usan `fill="currentColor"`; el CSS solo cambia `color` (`tirillaF.css:96-98` active, `:385-386` dark) y funciona.
- **`?raw` inlina el archivo dentro del bundle JS — cuidado con "SVG" que envuelven un raster.** `banco.svg` mide ~125 KB porque incrusta un PNG base64 (`xlink:href="data:image/png;base64,…"`); importarlo con `?raw` mete esos 125 KB en el JS. Solución: usar logos vectoriales reales; si el asset es raster, tratarlo como imagen (`<img>`), no como `?raw`. Evidencia: `Interfase Sistemas/client/src/assets/logos/banco.svg` (~125 KB vs 2.9 KB de `logo_sipa.svg`).
- **`dangerouslySetInnerHTML` y el requisito anti-XSS (DI-GSI-010 *solo si el proyecto es institucional*).** Los lineamientos del Ministerio exigen protección contra XSS *(solo si el proyecto es institucional)*; la regla anti-XSS de fondo es universal y aplica también en la línea divergente. Aquí es seguro porque `svgRaw` proviene **solo** de assets locales versionados en `assets/logos/`, nunca de datos de usuario ni de API. Regla: nunca inyectar con `?raw`/`dangerouslySetInnerHTML` contenido de origen externo o del usuario. Evidencia: contexto institucional en `CLAUDE.md` de los tres proyectos (DI-GSI-010, "Protección contra XSS").
- **Recolorear raster con `filter` es una técnica distinta, no aplica a SVG inline.** Para teñir una foto de fondo (no vectorial) se usó `filter: sepia(.4) hue-rotate(220deg) saturate(1.2)`. No lo confundas con el recoloreo por `currentColor` (que es para SVG inline). Evidencia: `Plataforma Conecta/client/src/styles/homeLanding.css:391` (aplicado a `bailarines.jpg`).

## 5. Criterios de done

- [ ] `client/src/vite-env.d.ts` declara `module '*.svg?raw'` y `npm run build` (`tsc && vite build`) pasa sin error de tipos.
- [ ] Cada logo recoloreable se importa con sufijo `?raw` y vive en `assets/logos/`.
- [ ] Grep de control: ningún SVG inline conserva `fill="#"` (todos usan `fill="currentColor"`); ninguna inyección usa `svgRaw` sin `stripXmlDecl`.
- [ ] Cada ítem del catálogo con `svgRaw` opcional tiene `sigla`; un ítem sin logo renderiza la sigla sin romper el layout (probado, p. ej. `cineproyecto` → "CIN").
- [ ] Las variantes clara/oscura y el estado activo/hover cambian **solo** `color` en CSS; no hay archivos SVG duplicados por tema.
- [ ] Ningún `?raw` importa un "SVG" con raster base64 embebido (revisar peso del asset).
- [ ] `dangerouslySetInnerHTML` solo recibe SVG de assets locales versionados, nunca datos de usuario/API (regla anti-XSS universal; la cita DI-GSI-010 aplica solo si el proyecto es institucional).

## Registro de uso
| Fecha | Proyecto | Tarea | Resultado | Lección |
|---|---|---|---|---|
| histórico | Portal ISI (Interfase Pagina Inicial) | uso original (fuente de esta skill) | ok | - |
| histórico | Interfase Sistemas | uso original (fuente de esta skill) | ok | - |
| histórico | Plataforma Conecta | uso original (fuente de esta skill) | ok | - |
