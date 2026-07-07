---
name: front-code-splitting-vite
regimen: universal
description: Optimiza el bundle de una SPA React+Vite difiriendo vistas pesadas con React.lazy+Suspense y separando vendors con manualChunks. Cárgala cuando Vite muestre el warning "chunk > 500 kB", cuando una vista secundaria arrastre un dataset o librería grande (mapas, leaflet), o cuando el bundle inicial tarde en cargar.
---

# Front — Code splitting en React + Vite

**Nivel actual:** N2 · **Dominio:** frontend · **Agente(s):** front-lider
**Proyectos fuente:** Plataforma Conecta (Interfase Sistemas — Ministerio de las Culturas)

> Criterio de ascenso a N1: los 5 bloques completos, con activos copiables de ruta real y gotchas verificados (no genéricos). A N2: ≥1 uso real aceptado por el Dueño. A N3: ≥3 usos exitosos en ≥2 proyectos + checklist propio.

## 1. Propósito

Reducir el peso del bundle inicial de una SPA React montada con Vite mediante **dos estrategias complementarias**:

1. **Diferir vistas pesadas** (y los datasets/librerías que solo ellas usan) con `React.lazy` + `Suspense`, de modo que su código se descargue únicamente cuando el usuario abre esa vista.
2. **Separar vendors** en chunks propios con `manualChunks` de Rollup, para que librerías estables (react, leaflet) se cacheen aparte del código de la app.

Se carga cuando: aparece el warning de Vite `Some chunks are larger than 500 kB after minification`; una vista secundaria importa un dataset TypeScript grande o una librería voluminosa (p. ej. `leaflet`) que no se necesita en el arranque; o el time-to-interactive del landing es alto por descargar todo de golpe.

Caso de referencia real (commit `2c54d2a`, Plataforma Conecta): la Ventana Internacional (`InternacionalizacionPage`, 506 líneas) arrastraba su dataset `eventosInternacionales.ts` (**48 kB**) y toda la librería `leaflet` al bundle inicial, aunque el landing no muestra ningún mapa. Diferirla eliminó el warning y aligeró el arranque.

## 2. Procedimiento

### Paso 1 — Identificar qué diferir
Una vista es candidata a `lazy` si cumple **al menos una**:
- Solo se muestra tras una interacción (no está en la primera pantalla). En Plataforma Conecta, `Home.tsx` arranca en `vista === 'landing'` y solo pasa a `'internacional'` al pulsar un botón.
- Importa un dataset local grande (`@/data/eventosInternacionales.ts` = 48 kB, 1.582 líneas) o una librería voluminosa que ninguna vista inicial usa (`leaflet`/`react-leaflet`: verificado que `HomeLanding.tsx` y los componentes del header/footer NO importan leaflet).

Criterio negativo: NO difieras componentes que están en el primer render (header, footer, landing). Diferirlos solo añade un flash de fallback sin ahorro real.

### Paso 2 — Convertir el import estático en dinámico
En el contenedor (`client/src/pages/Home.tsx`):

```tsx
import { useState, lazy, Suspense } from 'react'
// ANTES: import InternacionalizacionPage from '@/pages/InternacionalizacionPage'
// DESPUÉS:
const InternacionalizacionPage = lazy(() => import('@/pages/InternacionalizacionPage'))
```

El comentario que dejó el proyecto explica el porqué (cópialo, es buena práctica):
`// La ventana internacional solo se carga cuando el usuario la abre: difiere su código y el dataset de eventos del bundle inicial.`

### Paso 3 — Envolver en `<Suspense>` con fallback visible
El componente lazy DEBE renderizarse dentro de un `Suspense`, o React lanza error. Fallback real usado:

```tsx
<Suspense
  fallback={
    <div style={{ padding: '80px 24px', textAlign: 'center', color: '#7a6faa' }}>
      Cargando ventana internacional…
    </div>
  }
>
  <InternacionalizacionPage />
</Suspense>
```

Criterio: pon el `Suspense` lo más cerca posible de la vista diferida (no en la raíz de la app) para que el resto del layout —header, footer, tirilla— siga visible mientras carga el chunk.

### Paso 4 — Separar vendors con `manualChunks`
En `client/vite.config.ts`, dentro de `build.rollupOptions.output`:

```ts
build: {
  rollupOptions: {
    output: {
      manualChunks: {
        react: ['react', 'react-dom', 'react-router-dom'],
        leaflet: ['leaflet', 'react-leaflet'],
      },
    },
  },
},
```

Criterio de agrupación: junta en un mismo chunk las librerías que cambian de versión juntas y se usan juntas. `react`/`react-dom`/`react-router-dom` van juntas (núcleo estable). `leaflet`/`react-leaflet` van en su propio chunk porque solo las consumen vistas de mapa; así el navegador cachea leaflet aparte y no lo revalida cuando cambia el código de la app.

### Paso 5 — Verificar el alias `@` → `src` en los DOS archivos
El proyecto usa imports absolutos `@/pages/...`. El alias debe estar declarado en `vite.config.ts` (`resolve.alias`) Y en `tsconfig.json` (`compilerOptions.paths`). Si falta en tsconfig, el `tsc` del build falla aunque `vite dev` funcione (ver Gotcha 3). Plantilla en `activos/alias-arroba-src.snippet.md`.

### Paso 6 — Build y verificación
El script es `"build": "tsc && vite build"` (`client/package.json`). Corre `npm run build` en `client/` y confirma que:
- No aparece el warning de chunk > 500 kB.
- En `dist/assets/` existen chunks separados con nombres tipo `react-*.js` y `leaflet-*.js`.
- `tsc` pasa sin errores (es un gate de despliegue, ver Gotcha 3).

## 3. Activos copiables

Todos verificados en Plataforma Conecta y copiados a `activos/` de esta skill:

- **`activos/vite.config.ts`** — config Vite completa y probada: `manualChunks` (react + leaflet), alias `@`→`src`, y proxy dev `/api`→`localhost:3000`. Cópialo tal cual y ajusta los nombres de librerías en `manualChunks` a las que use tu proyecto. Origen: `Plataforma Conecta/client/vite.config.ts`.
- **`activos/Home.lazy-suspense.tsx`** — ejemplo real y completo del patrón `lazy` + `Suspense` con conmutación de vista por estado local (`vista: 'landing' | 'internacional'`) en vez de rutas. Úsalo como referencia de dónde va el `lazy()`, el comentario del porqué y el `Suspense` acotado. Origen: `Plataforma Conecta/client/src/pages/Home.tsx`.
- **`activos/alias-arroba-src.snippet.md`** — plantilla de las DOS declaraciones del alias `@` (vite.config.ts + tsconfig.json) que deben coincidir. Cópiala cuando montes imports absolutos. Origen: `Plataforma Conecta/client/{vite.config.ts,tsconfig.json}`.

Referencias vivas adicionales en el proyecto fuente (no copiadas, consultar in situ):
- `Plataforma Conecta/client/package.json` — el script `build: "tsc && vite build"` y las versiones exactas (Vite 5, React 18.3, react-leaflet 4.2).
- `Plataforma Conecta/client/src/pages/InternacionalizacionPage.tsx` — ejemplo de vista pesada legítima para diferir (importa leaflet + dataset de 48 kB).

## 4. Gotchas verificados

Todos provienen de errores reales resueltos en Plataforma Conecta (commit `2c54d2a` y su contexto):

1. **Warning "chunk > 500 kB" que no desaparece si solo tocas `manualChunks`.** El dataset de la vista internacional (48 kB) y leaflet seguían en el bundle inicial porque el import de `InternacionalizacionPage` era estático. Solución que funcionó: combinar `React.lazy` (para sacar el dataset + leaflet del arranque) CON `manualChunks` (para cachear vendors). Una sola de las dos no basta. Evidencia: commit `2c54d2a`, `client/src/pages/Home.tsx` + `client/vite.config.ts`.

2. **`lazy` sin `Suspense` rompe en runtime.** Un componente cargado con `lazy()` renderizado sin un `<Suspense>` ancestro lanza error en React. En el proyecto el `Suspense` se colocó justo alrededor de `<InternacionalizacionPage />`, no en la raíz, para no ocultar todo el layout durante la carga. Evidencia: `client/src/pages/Home.tsx` líneas 58-66.

3. **`tsc && vite build` convierte cualquier error de TypeScript en bloqueo de despliegue.** El build del cliente corre `tsc` antes que `vite build`; en Vercel un error de tipos aborta el deploy aunque `vite dev` funcionara localmente (documentado en commit `65d5ddd`). Consecuencia práctica para esta skill: si el alias `@` no está en `tsconfig.json`, `tsc` no resuelve los imports absolutos y el build falla. Evidencia: `client/package.json` (script build), `client/tsconfig.json` (paths `@/*`).

4. **No diferir por diferir.** El landing (`HomeLanding.tsx`), header, footer y la tirilla NO se difieren: están en el primer render y `lazy` solo añadiría un fallback parpadeante sin ahorro. Se verificó que esos componentes no importan leaflet, así que sacar leaflet a un chunk propio + diferir solo la vista de mapa fue suficiente. Evidencia: grep de `leaflet` sobre `HomeLanding.tsx` y componentes = sin coincidencias.

5. **Meta de tamaño heredada (referencia, no verificada en este proyecto).** El `contenidoClave` de la fábrica fija como objetivo "ningún archivo > 1.500 líneas, chunk admin < 500 KB", con la lección del "componente Dios de 7.900 líneas" del proyecto PNMC. PNMC no está entre los proyectos fuente de esta skill, así que ese umbral es una guía de la fábrica, no una métrica medida aquí. Úsalo como techo de alarma para partir componentes/vistas antes de que crezcan.

## 5. Criterios de done

- [ ] `npm run build` en `client/` termina **sin** el warning `Some chunks are larger than 500 kB`.
- [ ] En `client/dist/assets/` aparecen chunks de vendor separados (nombres con `react-*.js` y `leaflet-*.js` o equivalentes a tu `manualChunks`).
- [ ] La vista diferida NO aparece en el chunk de entrada: al abrirla en el navegador se descarga un `.js` adicional (visible en DevTools → Network).
- [ ] Cada componente `lazy()` está envuelto por un `<Suspense>` con fallback visible; el resto del layout permanece durante la carga.
- [ ] El alias `@`→`src` está declarado en `vite.config.ts` Y en `tsconfig.json`, y `tsc` pasa sin errores.
- [ ] No se difirieron componentes del primer render (header/footer/landing).

## Registro de uso
| Fecha | Proyecto | Tarea | Resultado | Lección |
|---|---|---|---|---|
| histórico | Plataforma Conecta | uso original (fuente de esta skill) | ok | - |
