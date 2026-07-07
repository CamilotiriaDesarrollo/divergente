---
name: front-nextjs-export-estatico-sin-backend
regimen: universal
description: Construir web-apps de datos con Next.js en modo output:'export' (cero backend, cero infraestructura): datos como JSON estáticos regenerados por un script, estado de usuario en localStorage y filtros/perfil en la URL. Cárgala cuando la tarea pida una landing/panel privado sin login, un dashboard que consume JSON público, "output: 'export'", desplegar HTML estático (Vercel static / npx serve out), o mover estado a localStorage/URL en lugar de a un servidor.
---

# Front · Next.js export estático sin backend

**Nivel actual:** N2 · **Dominio:** Frontend · **Agente(s):** `front-lider`
**Proyectos fuente:** Scraper-Empleos (`002 Desarrollos/Scraper-Empleos/landing`)

> Criterio de ascenso a N1: los 5 bloques completos, con activos copiables de ruta real y gotchas verificados (no genéricos). A N2: ≥1 uso real aceptado por el Dueño. A N3: ≥3 usos exitosos en ≥2 proyectos + checklist propio.

## 1. Propósito

Web-app de datos (panel privado, dashboard, catálogo, "radar") que necesita cero infraestructura de servidor: se compila a HTML estático con `next build` (`output: 'export'`) y se sirve desde cualquier host de estáticos (`npx serve out`, Vercel static, GitHub Pages). El backend es opcional y degradable.

Se carga cuando el dato es **pre-generado y de solo lectura para la web** (un script lo escribe como JSON en `public/data/`), y todo lo "dinámico" que el usuario necesita vive en el navegador:
- **estado de usuario** → `localStorage` (marcadores, notas, "nuevas por revisar", capturas del usuario),
- **estado de navegación compartible** → la URL (`?p=` perfil, `?v=` vista),
- **edición de configuración** → export JSON desde la UI → reemplazo en el repo → re-proceso por script.

No aplica si necesitas auth real, escritura multi-usuario concurrente, SSR/ISR o datos que cambian por request. Referencia viva: `Scraper-Empleos/landing` (Next 15.3 App Router + React 19 + TypeScript + CSS Modules).

## 2. Procedimiento

1. **Configura el export estático.** `landing/next.config.mjs` con exactamente:
   ```js
   const nextConfig = { output: 'export', trailingSlash: false, images: { unoptimized: true } };
   ```
   `images.unoptimized` es **obligatorio**: sin servidor no hay optimizador de imágenes (ver gotcha 3). Path alias `@/*` → `./*` en `tsconfig.json` (`moduleResolution: "bundler"`, `strict: true`).

2. **Genera los datos con un script fuera de la app.** Un script Python (`scripts/export_landing.py`) lee los datos crudos (`data/*.json`) y **escribe** `landing/public/data/{ofertas,reporte,perfiles}.json`. La app nunca calcula estos agregados en runtime; el script hace el trabajo pesado (tagging de sectores, buckets de score, cobertura) y deja JSON plano. Regenera **antes** de cada build si cambió el dato: `python scripts/export_landing.py`. Criterio: si un cómputo depende de TODO el dataset o de fuentes que la web no debe ver, va en el script, no en el cliente.

3. **Carga los datos en cliente con `cache: 'no-store'`.** En un componente `'use client'`, `fetch('/data/ofertas.json', { cache: 'no-store' })` dentro de `useEffect`. Sin `no-store` el host de estáticos sirve JSON viejo y aparecen bugs fantasma (ver gotcha 1). Auto-refresh opcional: `setInterval` que re-fetchea y compara `generado_en` para no re-renderizar en vano (`OfertasApp.tsx:114-124`).

4. **Estado de usuario en `localStorage`, con claves versionadas y try/catch.** Cada acceso envuelto (`try {…} catch { /* ignore */ }`) porque storage puede estar lleno o deshabilitado. Convención de claves con sufijo de versión: `scraper-empleos-marcadores-v1`, `…-vistas-v1`, `sugeridas-v1`, `perfil-notas-v1`. Indexa por una clave estable del dato (aquí `url_original`), no por índice de array.
   - Para el patrón "nuevas por revisar": la primera vez, **siembra** todas las URLs actuales como ya-vistas (baseline) para que nada aparezca falsamente como nuevo; después, una oferta es nueva si su URL no está en el set (`OfertasApp.tsx:155-169`).
   - Sincroniza entre componentes con `CustomEvent` (dispatch al guardar, `addEventListener`/`removeEventListener` en efectos). Ver `activos/sugeridas.localStorage-store.ts`.

5. **Estado de navegación compartible en la URL.** Lee params al montar; escribe con `window.history.replaceState(null, '', '?'+params)` (no `pushState`, para no llenar el historial) cuando cambian perfil/vista (`OfertasApp.tsx:126-140`). Valida y auto-corrige params inválidos una vez cargue la config (`?p=basura` → primer perfil activo, `:244-249`).

6. **Edición de config por export JSON (round-trip sin backend).** La UI captura entradas en localStorage; el usuario las exporta con "Copiar para Claude" (texto) o "Descargar JSON" (mismo shape que el archivo del repo) → reemplaza `data/oportunidades_sugeridas.json` → corre el script Python que lo procesa. La fuente de verdad de config (p. ej. `config/perfiles.json`) vive en el repo; `export_landing.py` la copia/normaliza a `public/data/perfiles.json` para que la web la sirva estática. Ver `exportarJSON`/`exportarTexto` en el store.

7. **Backend opcional y degradable.** Si quieres una API route de conveniencia para modo local (`app/api/*/route.ts`, funciona con `npm run dev`/`next start`), el cliente debe llamarla **best-effort**: `fetch(...).catch(() => { /* sin backend: no-op */ })`. En el export estático la ruta no se emite (`out/` no tiene `/api`) y la UI sigue funcionando (`OfertasApp.tsx:30-47`).

8. **Componentes tipados, CSS Modules, responsabilidad única.** Un `.tsx` + su `.module.css` por componente; tipos en `lib/types.ts`; helpers puros en `lib/` (`format.ts`, `analitica.ts`). El `AppShell` monta el shell (header + drawer accesible) y recibe todo por props; el orquestador (`OfertasApp`) tiene el estado. Drawer móvil accesible: `role="dialog"` + `aria-modal`, Escape cierra, focus-trap en Tab, `inert` cuando está cerrado, `body.overflow='hidden'` al abrir y foco de vuelta al botón hamburguesa al cerrar (`AppShell.tsx:54-96`).

9. **Tema sin parpadeo (FOUC).** Script inline en `<head>` (vía `dangerouslySetInnerHTML`) que lee `localStorage.'tema'` y pone `data-theme` en `<html>` **antes del primer paint**; el toggle React solo sincroniza desde ese atributo y se oculta hasta montar (`layout.tsx:26`, `ThemeToggle.tsx`).

10. **Build y verificación.** `cd landing && npm run build` → genera `landing/out/`. Servir: `npx serve out`. `out/` va en `.gitignore`.

## 3. Activos copiables

Todos en `activos/` de esta skill (copiados de Scraper-Empleos), verificados:

- **`next.config.mjs`** — origen `Scraper-Empleos/landing/next.config.mjs`. La config mínima y completa del export estático. Cópiala tal cual; no le quites `images.unoptimized`.
- **`layout.anti-fouc.tsx`** — origen `Scraper-Empleos/landing/app/layout.tsx`. Patrón de `RootLayout` con fuentes `next/font` (variables CSS) + script anti-FOUC de tema. Adapta `title`/`description`, la key de localStorage (`tema`) y las fuentes.
- **`sugeridas.localStorage-store.ts`** — origen `Scraper-Empleos/landing/lib/sugeridas.ts`. Plantilla de "store localStorage": `leer/guardar/agregar/eliminar/contar` + `CustomEvent` para sincronizar UI + `exportarJSON`/`exportarTexto` para el round-trip al script. Renombra la `CLAVE`, el `EVENTO_*` y la interfaz al dominio nuevo.
- **`AppShell.tsx`** — origen `Scraper-Empleos/landing/components/AppShell.tsx`. Drawer/header accesible de referencia (focus-trap + `inert` + Escape + retorno de foco). Requiere un `AppShell.module.css` propio (las clases `styles.*`); copia la lógica de accesibilidad, adapta secciones/props.
- **`export_landing.py`** — origen `Scraper-Empleos/scripts/export_landing.py`. Script de referencia del pipeline "datos crudos → JSON de `public/data/`": muestra `ROOT`/paths, `mkdir(parents=True, exist_ok=True)`, `json.dump(..., ensure_ascii=False)` y cómo derivar agregados (buckets, tagging, cobertura). Reescribe la lógica de negocio; conserva la estructura de I/O.

Referencia de tipos (no copiada, léela en fuente): `Scraper-Empleos/landing/lib/types.ts` (contrato `Oferta`/`DatosOfertas`/`PerfilConfig`) y `lib/analitica.ts` (helpers de estado por prefijo — ver gotcha 2).

## 4. Gotchas verificados

1. **El host de estáticos sirve JSON cacheado y aparecen bugs fantasma.** Síntoma real: "el filtro de sector no filtra" — el navegador servía un `ofertas.json` viejo sin el campo `sectores`; el dato y la lógica eran correctos. Fix: `fetch(url, { cache: 'no-store' })` en toda carga de `/data/*.json`. Evidencia: commit `e0aa085` ("fix cache de datos"), `landing/components/OfertasApp.tsx:95,105`.

2. **Comparar `estado` por string exacto descarta datos silenciosamente.** Convivían dos convenciones de género en los datos (`aprobada/rechazada` nuevo vs `aprobado/rechazado` viejo). El export filtraba `in (aprobada, pendiente)` y **tiró 74 ofertas**: Camilo veía 15 en vez de 89. Fix (defensa en profundidad): comparar por **prefijo** — `esRechazada = e.toLowerCase().startsWith('rechaz')`, `esAprobada → 'aprob'`, `esPendiente → 'pend'` — en cliente y en el export (`_es_rechazada` con `startswith('rechaz')`). Evidencia: commit `772be02`, `landing/lib/analitica.ts:14-16`, `scripts/export_landing.py:363-364`. Lección transferible: normaliza/compara por prefijo o canónico cualquier campo enum que venga de datos históricos.

3. **`output: 'export'` rompe si usas imágenes optimizadas.** No hay servidor que corra el optimizador de `next/image`. Sin `images: { unoptimized: true }` el build/deploy falla o las imágenes no cargan. Evidencia: `landing/next.config.mjs:5`.

4. **Parpadeo claro→oscuro (FOUC) en la primera carga.** React aplica el tema demasiado tarde. Fix: script síncrono inline en `<head>` que setea `data-theme` desde `localStorage` antes del primer paint; el `ThemeToggle` se oculta (`visibility:hidden`) hasta montar para no renderizar el estado por defecto. Evidencia: `landing/app/layout.tsx:26`, `components/ThemeToggle.tsx:34`.

5. **El patrón "nuevas" marca todo como nuevo en la primera visita.** Sin baseline, ninguna URL está "vista" y toda la lista aparece como novedad. Fix: si la key de vistas es `null` (primer uso), sembrar TODAS las URLs actuales como vistas; después, nuevo = URL no presente. Evidencia: `landing/components/OfertasApp.tsx:155-169`.

6. **API route de conveniencia + export estático: la ruta no existe en producción.** Una `app/api/*/route.ts` sirve solo en `npm run dev`/`next start`; el export (`out/`) no emite `/api`. Si el cliente asume que responde, rompe. Fix: llamada best-effort con `.catch(() => {})` que degrada a no-op (el "me encanta" no persiste, pero la UI sigue). Verificado: `out/` compilado con la ruta presente y sin carpeta `out/api/`; `landing/components/OfertasApp.tsx:30-47`, `app/api/preferencias/route.ts` (comentario de cabecera).

7. **`colorSuave` fijo del JSON de config rompe el dark mode.** El color suave "claro" hardcodeado se ve mal sobre fondo oscuro. Fix: derivar el suave en runtime con `color-mix(in srgb, ${color} 14%, transparent)` sobre una CSS var (`--perfil-suave`) en vez de usar el valor fijo. Evidencia: `landing/components/OfertasApp.tsx:395-397`.

## 5. Criterios de done

- [ ] `cd landing && npm run build` genera `landing/out/` con HTML + `out/data/*.json`; `npx serve out` levanta la app sin ningún servidor de aplicación.
- [ ] `next.config.mjs` tiene `output: 'export'` **y** `images: { unoptimized: true }`; no se usa `next/image` optimizado, ni `getServerSideProps`, ni route params dinámicos sin `generateStaticParams`.
- [ ] Los datos se regeneran por script a `public/data/*.json` **antes** del build; la app no computa agregados de todo el dataset en runtime.
- [ ] Toda carga de `/data/*.json` usa `cache: 'no-store'`.
- [ ] Claves de `localStorage` versionadas (`…-v1`) y cada acceso en `try/catch`; el patrón "nuevas" siembra baseline en el primer uso.
- [ ] La URL refleja el estado navegable (perfil/vista) vía `history.replaceState` y es compartible; params inválidos se auto-corrigen al cargar la config.
- [ ] Campos enum que vengan de datos (estado, etc.) se comparan por prefijo/canónico, no por igualdad exacta.
- [ ] Drawer/overlay: Escape cierra, foco atrapado en Tab, `inert` cuando está cerrado, `body.overflow` bloqueado al abrir y foco de vuelta al disparador al cerrar.
- [ ] El tema persiste sin parpadeo (script anti-FOUC en `<head>`); light y dark verificados.
- [ ] Cualquier llamada a backend opcional degrada a no-op (`.catch`) en el export estático.

## Registro de uso
| Fecha | Proyecto | Tarea | Resultado | Lección |
|---|---|---|---|---|
| histórico | Scraper-Empleos | uso original (fuente de esta skill) | ok | - |
