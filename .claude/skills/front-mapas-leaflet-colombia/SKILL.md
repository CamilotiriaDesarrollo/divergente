---
name: front-mapas-leaflet-colombia
regimen: universal
description: Construye mapas interactivos de Colombia (coropléticos por departamento, marcadores/rutas, constelaciones d3-force) con Leaflet/GeoJSON en React+Vite o Next.js SSR-safe. Cargar cuando una misión pida "mapa de Colombia", "coroplético por departamento", geovisor con capas/filtros territoriales, integrar Leaflet en Next.js, o casar nombres de departamentos de un GeoJSON con datos propios.
---

# Mapas Leaflet de Colombia

**Nivel actual:** N3 · **Dominio:** front (Frontend) · **Agente(s):** `front-visualizaciones`
**Proyectos fuente:** Plataforma Conecta, Plataforma GEDII, PNMC SIMUS, Portal ISI

> Criterio de ascenso a N1: los 5 bloques completos, con activos copiables de ruta real y gotchas verificados (no genéricos). A N2: ≥1 uso real aceptado por el Dueño. A N3: ≥3 usos exitosos en ≥2 proyectos + checklist propio.

## 1. Propósito

Montar visualizaciones territoriales de Colombia que funcionen a la primera: coropléticos por departamento (GEDII: conteo de investigaciones; PNMC: 5 capas de escuelas/festivales/mercados/redes/lutieres), mapas de puntos y rutas (Conecta: nodos culturales, `Polyline` de circulación), y constelaciones de catálogo sin geografía real (Portal ISI: d3-force sobre SVG).

Los tres problemas que esta skill resuelve y que han costado horas reales en los 4 proyectos fuente:

1. **Los nombres de departamento del GeoJSON nunca coinciden** con los del dataset propio (Bogotá D.C., San Andrés, tildes, mayúsculas) — resuelto 3 veces de forma independiente antes de esta skill.
2. **Leaflet rompe el SSR de Next.js** (`window is not defined`) — requiere aislamiento en dos capas.
3. **Restilizar la capa GeoJSON al cambiar filtros** sin recrearla ni caer en stale closures.

## 2. Procedimiento

### Paso 0 — Elegir el enfoque según el stack (criterio de decisión)

| Situación | Enfoque | Proyecto de referencia |
|---|---|---|
| Next.js (App Router) | Leaflet **imperativo** + doble capa SSR-safe (`next/dynamic ssr:false` + `import('leaflet')` en `useEffect`) | GEDII (`app/components/MapaColombia.js` + `MapaColombiaInner.js`) |
| SPA Vite + React | **react-leaflet declarativo** (`MapContainer`/`GeoJSON`/`CircleMarker`) | Conecta (`client/src/pages/MapaCirculacion.tsx`); PNMC usa react-leaflet 5 + `leaflet.markercluster` para volúmenes altos |
| Catálogo sin coordenadas reales | Constelación SVG con **d3-force pre-computado** (sin Leaflet) | Portal ISI (`client/src/components/ConstelacionSistemas.tsx`) |

### Paso 1 — Conseguir el GeoJSON de Colombia

- **Copia local en `public/`** (recomendado): `Plataforma GEDII/public/colombia-depts.json` (870 KB, 33 features: 32 departamentos + Bogotá D.C., propiedad `NAME_1` estilo GADM). Se sirve con `fetch('/colombia-depts.json')`.
- **Gist remoto** (solo prototipos): Conecta consume `gist john-guerra/43c7656821069d00dcbc/...colombia.geo.json` (propiedad `NOMBRE_DPT` en MAYÚSCULAS) con `.catch(() => {})` — si el gist cae, el mapa queda sin contornos. No usar en producción.
- **Servido por backend** (producción estatal): PNMC expone `/api/v1/map/topojson/territories` (TopoJSON DIVIPOLA ~28 MB con municipios, `pnmc-api/src/PNMC.Api/Assets/geo/Departamentos-Municipos-COL.json`) y lo convierte a GeoJSON en `pnmc-web/src/services/data/catalogService.js:127` (endpoint definido en `pnmc-api/src/PNMC.Api/Endpoints/MapEndpoints.cs:15`).

**Criterio:** identificar SIEMPRE la propiedad del nombre antes de programar — `NAME_1` (GADM/GEDII), `NOMBRE_DPT` (gist/Conecta) o `name`. Conecta lee ambas defensivamente: `feature?.properties?.NOMBRE_DPT || feature?.properties?.name || ''`.

### Paso 2 — Normalizar nombres de departamento (obligatorio, nunca omitir)

Copiar `activos/normalizacion-departamentos.js` y adaptar el diccionario de alias. Núcleo del patrón (Conecta, `MapaCirculacion.tsx:31-49`):

```ts
function normDept(s: string) {
  return s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/\./g, '').trim()
}
const DEPT_MAP: Record<string, string> = {
  bogota: 'Cundinamarca',
  'archipielago de san andres': 'San Andrés y Providencia',
  // ...
}
```

**Decisión de negocio previa:** ¿Bogotá es departamento propio o se agrega a Cundinamarca? GEDII la trata como feature propia (33 entradas, alias `{"BogotáD.C.": "Bogotá D.C."}` porque el GeoJSON la trae SIN espacio); Conecta la mapea a Cundinamarca (su catálogo `TODOS_DEPARTAMENTOS` tiene 32 nombres, ver `client/src/data/nodosCulturales.ts:34-67` — lista canónica reutilizable).

### Paso 3 — Montar el mapa base

- **Bounds de Colombia** para encuadre automático (Conecta, `MapaCirculacion.tsx:25-28`):
  ```ts
  const COLOMBIA_BOUNDS: [[number, number], [number, number]] = [[1.5, -79.0], [14.2, -66.8]]
  // <MapContainer bounds={COLOMBIA_BOUNDS} boundsOptions={{ padding: [10, 10] }} ...>
  ```
  GEDII en cambio ajusta a la capa real: `map.fitBounds(layer.getBounds(), { padding: [6, 6] })`.
- **`scrollWheelZoom: false` SIEMPRE** (ambos proyectos): el mapa embebido en una página con scroll secuestra la rueda. Conecta va más allá: `dragging: false` por defecto + botón de control Leaflet propio (`PanButton`, `MapaCirculacion.tsx:146-184`) que habilita movimiento libre bajo demanda.
- **Tiles neutros** para que el coroplético domine: Conecta usa CARTO light (`light_all`); GEDII usa OSM desaturado aplicando filtro solo al pane de tiles: `map.getPanes().tilePane.style.filter = 'grayscale(1) opacity(0.5)'` (`MapaColombiaInner.js:84` — no afecta la capa GeoJSON).

### Paso 4 — Coroplético: colorear y RE-colorear sin recrear la capa

- Escala de color por conteo con umbrales fijos (GEDII `mapColor`: 0/1/≤3/≤7/8+; PNMC define `MAP_LAYER_CHOROPLETH_STEPS` con 5 tramos y color propio POR CAPA, `mapDomain.js:78-99`).
- **Patrón imperativo (GEDII):** una función `applyColors()` que recorre `layerRef.current.eachLayer(lyr => lyr.setStyle({...}))` y se invoca desde `useEffect(() => { applyColors() }, [data, fDepts])` (`MapaColombiaInner.js:36-56,129`). La capa GeoJSON se crea UNA vez; solo cambian estilos y tooltips (`unbindTooltip()` + `bindTooltip(...)` para refrescar el conteo).
- **Patrón declarativo (Conecta):** `<GeoJSON key={dept} data={geoData} style={deptGeoStyle} onEachFeature={onEachFeature} />` — el `key={dept}` fuerza recreación al cambiar departamento porque react-leaflet no re-ejecuta `style` solo (`MapaCirculacion.tsx:563-570`).

### Paso 5 — Interactividad territorial

- Tooltip `sticky: true` con nombre + conteo por feature.
- Click en departamento = filtro con toggle: `setDept(prev => (normDept(prev) === normDept(match) ? 'Todos' : match))` (`MapaCirculacion.tsx:264`).
- `mouseout` debe restaurar el **estilo calculado**, no uno fijo: GEDII recalcula `count` y `selected` dentro del handler (`MapaColombiaInner.js:100-109`); Conecta llama `deptGeoStyle(feature)` (`MapaCirculacion.tsx:269`).
- Animación de vista según filtro: componente `MapController` con hook `useMap` que hace `fitBounds`/`setView` cuando cambia `dept` (`MapaCirculacion.tsx:109-133` — 1 punto→`setView` zoom 10, N puntos→`latLngBounds` con `maxZoom: 10`).

### Paso 6 — Solo Next.js: refs espejo contra stale closures

Los handlers de Leaflet se registran UNA vez en `onEachFeature`; si leen props directamente, capturan la versión del primer render. Patrón (GEDII, `MapaColombiaInner.js:24-34`):

```js
const dataRef = useRef(data); const fDeptsRef = useRef(fDepts); const onClickRef = useRef(onDeptClick);
dataRef.current = data; fDeptsRef.current = fDepts; onClickRef.current = onDeptClick;
// dentro de los handlers: buildByDept(dataRef.current), fDeptsRef.current.includes(name), onClickRef.current(name)
```

Además: `let cancelled = false` en el efecto asíncrono y `map.remove()` en el cleanup (`MapaColombiaInner.js:58-127`) — sin esto, el hot-reload de Next duplica mapas ("Map container is already initialized").

### Paso 7 — Constelación d3-force (cuando no hay coordenadas)

Simulación **pre-computada, no animada** (Portal ISI, `ConstelacionSistemas.tsx:60-88`): anclas normalizadas 0..1 por categoría escaladas a viewBox 1000×640, dispersión inicial determinista por ángulo áureo (`i * 137.5°`), `forceX/forceY(0.2) + forceManyBody(-24) + forceCollide(r+9, 0.95)`, `.stop()` + 300 `tick()` síncronos dentro de `useMemo` con `firma = sistemas.map(s => s.id).join(',')` como dependencia, y clamping final al viewBox. Nodos como `<button>` con `aria-pressed`, panel `role="dialog"` con gestión de foco (guardar origen → foco al cerrar → `Escape` → devolver foco).

### Paso 8 — Performance del bundle

Separar Leaflet en chunk propio (Conecta, `client/vite.config.ts:21-30`): `manualChunks: { react: ['react','react-dom','react-router-dom'], leaflet: ['leaflet','react-leaflet'] }` — elimina el warning de chunk >500 kB y mejora el cacheo.

## 3. Activos copiables

Todos en `activos/` de esta skill (rutas de origen verificadas el 2026-07-03):

| Activo | Origen | Qué es / qué adaptar |
|---|---|---|
| `activos/MapaColombiaInner.js` | `002 Desarrollos/Plataforma GEDII/app/components/MapaColombiaInner.js` | Coroplético imperativo SSR-safe completo (refs espejo, `applyColors`, tiles en grises, leyenda). Adaptar: `mapColor` (paleta), `buildByDept` (agregación), `DEPT_ALIAS` según tu GeoJSON, altura 480px. |
| `activos/MapaColombia-wrapper-dynamic.js` | `002 Desarrollos/Plataforma GEDII/app/components/MapaColombia.js` | Wrapper `next/dynamic ssr:false` con placeholder de carga. Copiar tal cual en Next.js; en Vite no se necesita. |
| `activos/MapaCirculacion.tsx` | `002 Desarrollos/Plataforma Conecta/client/src/pages/MapaCirculacion.tsx` | Página completa react-leaflet: `COLOMBIA_BOUNDS`, `normDept`/`DEPT_MAP`, `MapController`, `PanButton`, capas por tipo (`CircleMarker`/`Marker` divIcon/`Polyline`), conmutación mapa/gráfico/tabla. Adaptar: dataset (`nodosCulturales.ts`), `TIPO_CONFIG`, clases CSS `mcirc__*`. |
| `activos/ConstelacionSistemas.tsx` | `002 Desarrollos/Interfase Pagina Inicial/client/src/components/ConstelacionSistemas.tsx` | Constelación d3-force accesible. Adaptar: `anclas` por categoría, radio (`22 + publico.length * 4`), tipos de `@/data/sistemas`. Requiere `d3-force` + `@types/d3-force`. |
| `activos/normalizacion-departamentos.js` | Extracto literal de PNMC `pnmc-web/src/features/map/domain/mapDomain.js:63-76,286-297,449-466` y Conecta `MapaCirculacion.tsx:30-49` | Las dos variantes de normalización + alias + escalado visual de San Andrés. Elegir UNA variante y su diccionario. |

**No copiados (por tamaño), usar desde el proyecto fuente:**
- GeoJSON de departamentos: `002 Desarrollos/Plataforma GEDII/public/colombia-depts.json` (870 KB — copiar a `public/` del proyecto destino).
- Geovisor multi-capa completo: `002 Desarrollos/Plan Nacional de Musica SIMUS/Entorno_Virtual_PNMC/pnmc-web/src/features/map/` (`MapaEcosistemicoPage.jsx` ~3.100 líneas + `domain/mapDomain.js` + `MapInteractionControls.jsx`) — referencia para capas conmutables, clustering y export.
- Lista canónica de los 32 departamentos: `002 Desarrollos/Plataforma Conecta/client/src/data/nodosCulturales.ts:34-67`.

## 4. Gotchas verificados

1. **Nombres del GeoJSON ≠ dataset propio** — el error más repetido del portafolio (3 soluciones independientes). Bogotá aparece como `BogotáD.C.` SIN espacio en el GeoJSON de GEDII (`MapaColombiaInner.js:5`), como `BOGOTA D.C.`/`SANTAFE DE BOGOTA` en fuentes del PNMC, y San Andrés con nombre kilométrico variable. Hasta hay un typo real `CUNDINAMRCA` en una fuente de datos del PNMC (`mapDomain.js:75`). **Solución:** normalización NFD + diccionario de alias (`activos/normalizacion-departamentos.js`). Sin esto el coroplético pinta departamentos en 0 teniendo datos.
2. **Leaflet revienta el SSR de Next.js.** `next/dynamic ssr:false` NO basta por sí solo: el `import L from 'leaflet'` a nivel de módulo ya toca `window`. La solución verificada es en DOS capas: wrapper `dynamic(() => import('./MapaColombiaInner'), { ssr: false })` (`MapaColombia.js:3`) **y** `const L = (await import('leaflet')).default` dentro del `useEffect` (`MapaColombiaInner.js:63`). Regla escrita en `Plataforma GEDII/CLAUDE.md §11`: "No SSR con Leaflet".
3. **Stale closures en handlers de Leaflet.** Los handlers de `onEachFeature` se registran una vez; leer `data`/`fDepts` directo congela el primer render (el mapa nunca refleja filtros nuevos). **Solución:** refs espejo asignadas en cada render (`MapaColombiaInner.js:28-34`) y `onToggleRef` en el control custom de Conecta (`MapaCirculacion.tsx:149-152`).
4. **Recrear la capa GeoJSON en cada cambio de filtro parpadea y pierde tooltips.** GEDII restiliza in-place con `eachLayer/setStyle` + re-bind del tooltip (`MapaColombiaInner.js:39-55`). En react-leaflet, donde `style` no se re-evalúa, Conecta usa `key={dept}` sobre `<GeoJSON>` (`MapaCirculacion.tsx:565`) — recreación deliberada y puntual, no en cada render.
5. **`mouseout` con estilo fijo "des-selecciona" visualmente el departamento activo.** El handler debe recalcular conteo+selección (`MapaColombiaInner.js:100-109`) o delegar en la misma función de estilo (`deptGeoStyle(feature)`, `MapaCirculacion.tsx:269`).
6. **Zoom accidental con la rueda del mouse** al hacer scroll por la página: `scrollWheelZoom: false` en ambos mapas (`MapaCirculacion.tsx:549`, `MapaColombiaInner.js:69`). Conecta además desactiva `dragging` y lo re-habilita con un botón (`PanController`/`PanButton`), porque en móvil el mapa atrapaba el gesto de scroll.
7. **Warnings reales de `react-hooks/exhaustive-deps` y `any` en el mapa:** en Conecta se eliminó la dependencia redundante `dept` de `onEachFeature` y se reemplazaron 3 `any` por `Feature`/`FeatureCollection` del paquete `geojson` (commits a2eb1e6 y df71bfb; el código vigente de `MapaCirculacion.tsx:14,238-273` ya refleja ambas correcciones).
8. **San Andrés es inclickeable a escala nacional** (el archipiélago mide píxeles). PNMC lo re-proyecta alrededor de su centroide con factor 8.5 (`buildScaledFeature`, `mapDomain.js:449-466`, `ARCHIPELAGO_VISUAL_SCALE = 8.5`) — copiado en `activos/normalizacion-departamentos.js`.
9. **Habeas Data en endpoints públicos del mapa:** el geovisor del PNMC exponía correo y teléfono de contacto sin enmascarar aunque la documentación decía lo contrario; la HU-MAP-04 lo marca "Propuesto — no implementado" y como Must (Ley 1581/2012). Regla transversal en `Entorno_Virtual_PNMC/CLAUDE.md`: los endpoints públicos del mapa deben enmascarar datos de contacto (DTO público vs administrativo). Cualquier mapa con datos de personas pasa por `seguridad-appsec`.
10. **Chunk >500 kB por Leaflet en el bundle:** resuelto con `manualChunks` separando `leaflet`/`react-leaflet` (Conecta `client/vite.config.ts:24-27`, commit 2c54d2a).
11. **GeoJSON remoto de gist como única fuente** (`MapaCirculacion.tsx:228-236` con `.catch(() => {})`): si el gist cae no hay contornos ni error visible. Para producción, servir copia propia desde `public/` (GEDII) o backend (PNMC).
12. **Teclado/foco en Leaflet sigue siendo deuda AA** en PNMC ("teclado en Leaflet" listado en riesgos de `Entorno_Virtual_PNMC/CLAUDE.md`). La constelación del Portal ISI sí lo resuelve: nodos `<button>` con `aria-label` completo, `aria-pressed`, panel con foco al cerrar + `Escape` + devolución de foco (`ConstelacionSistemas.tsx:95-113`). En mapas Leaflet, ofrecer siempre una vista alternativa tabla/gráfico sobre el mismo dataset (patrón de 3 vistas de `MapaCirculacion.tsx`).

## 5. Criterios de done

- [ ] **Cobertura de matching al 100%:** cada feature del GeoJSON resuelve a un departamento del dataset o a un alias explícito; verificado logueando los no-resueltos en dev (0 features sin match, con atención a Bogotá D.C., San Andrés y tildes).
- [ ] La decisión Bogotá-como-departamento vs Bogotá→Cundinamarca está tomada y documentada en el blueprint del proyecto (no improvisada en el código).
- [ ] En Next.js: `npm run build` pasa sin `window is not defined` y el hot-reload no duplica el mapa (cleanup con `map.remove()` presente).
- [ ] Cambiar filtros re-colorea el mapa **sin** parpadeo de la capa y los tooltips muestran el conteo actualizado.
- [ ] Scroll de página sobre el mapa NO hace zoom (`scrollWheelZoom: false`) y en móvil el gesto de scroll no queda atrapado por el mapa.
- [ ] `lint` en verde: sin `any` (usar tipos de `geojson`), sin warnings de `exhaustive-deps` en los hooks del mapa.
- [ ] En Vite: Leaflet va en chunk propio (`manualChunks`) y no hay warning de chunk >500 kB.
- [ ] El GeoJSON se sirve desde el propio proyecto (public/ o backend), no desde un gist de terceros.
- [ ] Si el mapa muestra datos de contacto de personas: enmascaramiento verificado en el endpoint público (Ley 1581) y revisado por `seguridad-appsec`.
- [ ] Existe vista alternativa accesible (tabla o gráfico) del mismo dataset, o la visualización es nativamente navegable por teclado (patrón constelación).

## Registro de uso
| Fecha | Proyecto | Tarea | Resultado | Lección |
|---|---|---|---|---|
| histórico | Plataforma Conecta | uso original (fuente de esta skill) | ok | - |
| histórico | Plataforma GEDII | uso original (fuente de esta skill) | ok | - |
| histórico | PNMC SIMUS | uso original (fuente de esta skill) | ok | - |
| histórico | Portal ISI | uso original (fuente de esta skill) | ok | - |
