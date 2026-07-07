---
name: front-dashboard-filtros-multinivel
regimen: universal
description: Construye dashboards React multi-filtro donde los conteos de cada sección NO colapsan al seleccionar un filtro de su propia dimensión, mediante una cadena de niveles memoizados (filteredNoTerr → filteredBase → filtered), chips de filtros activos con limpieza individual, KPIs con useMemo y gráficos SVG inline sin librerías. Cargar al crear o modificar dashboards con filtros cruzados/facetas, mapas coropléticos filtrables, o cuando al filtrar "se apagan" los conteos o desaparece una visualización.
---

# Dashboard con filtros multinivel (facetas que no colapsan)

**Nivel actual:** N2 · **Dominio:** Frontend · **Agente(s):** front-visualizaciones
**Proyectos fuente:** Plataforma GEDII (`C:\Users\camil\Desktop\IA Raiz Proyectos\002 Desarrollos\Plataforma GEDII`)

> Criterio de ascenso a N1: los 5 bloques completos, con activos copiables de ruta real y gotchas verificados (no genéricos). A N2: ≥1 uso real aceptado por el Dueño. A N3: ≥3 usos exitosos en ≥2 proyectos + checklist propio.

## 1. Propósito

Resuelve el problema clásico de los dashboards con facetas: si todas las secciones de UI leen del mismo array `filtered`, al hacer clic en "Dirección de Artes" las barras de las demás dependencias caen a 0 y la sección queda inútil para seguir navegando. La solución probada en GEDII (`app/components/dashboard.js`, 1160 líneas, Next.js 16 + React 19) es una **cadena de tres niveles memoizados** donde cada sección consume el nivel que **excluye su propia dimensión**.

Se carga cuando la tarea incluye: dashboard con ≥3 dimensiones de filtro combinables (año, estado, territorio, categoría…), conteos reactivos junto a cada opción de filtro, mapa coroplético que filtra al clic, KPIs derivados del subconjunto filtrado, o el bug reportado "al filtrar X desaparecen los números / el mapa".

## 2. Procedimiento

1. **Modelar el dataset plano en memoria.** Array de objetos con campos escalares (`año`, `estado`, `tipo`, `dependencia`) y campos array para dimensiones multivaluadas (`departamentos[]`, `temas[]`, `comunidad[]`). En GEDII: `INVESTIGATIONS` (dashboard.js líneas 125-138). El filtrado de campos array usa `d.temas.some(t => fTemas.includes(t))` (semántica OR).

2. **Declarar el estado de filtros con la convención de tipos.** Single-select = string vacío `""`; multi-select = array `[]`. Prefijo `f` + dimensión: `fAño`, `fDepts`, `fDep`, `fEst`, `fTemas`, `fTipo`, `fMetod`, `fAlcance`, `fComunidad`, más `search` (dashboard.js 988-997). Toggle single: `onClick={()=>setFEst(act?"":e)}`. Toggle multi: `setFDepts(prev => prev.includes(d) ? prev.filter(x=>x!==d) : [...prev, d])`.

3. **Decidir qué dimensiones se "excluyen" de la cadena.** Criterio: una dimensión se excluye si su sección de UI muestra conteos por opción que sirven para SEGUIR navegando (barras clicables, chips con número, mapa). En GEDII se excluyeron 2: territorio (`fDepts`, multi con mapa + acordeón por regiones) y dependencia (`fDep`, barras de navegación). Las demás (año, estado, temas…) leen de `filtered` porque su UI tolera el colapso (timeline de puntos, chips que muestran co-ocurrencia).

4. **Construir la cadena memoizada** — cada nivel filtra sobre el anterior y añade UNA dimensión (dashboard.js 1005-1022, copia verbatim en `activos/cadena-filtros-fragmento.js`):

```js
// filteredNoTerr: all filters except territory — for territory section dept counts
const filteredNoTerr = useMemo(()=>INVESTIGATIONS.filter(d=>
  (!fAño    || String(d.año)===fAño) &&
  (!fEst    || d.estado===fEst) &&
  (!fTemas.length  || d.temas.some(t => fTemas.includes(t))) &&
  /* ...resto de dimensiones excepto fDepts y fDep... */
  (!search  || d.titulo.toLowerCase().includes(search.toLowerCase()) || d.id.toLowerCase().includes(search.toLowerCase()))
),[fAño,fEst,fTemas,fTipo,fMetod,fAlcance,fComunidad,search]);

// filteredBase: all filters except fDep — dep bars use this so they don't collapse on dep select
const filteredBase = useMemo(()=>filteredNoTerr.filter(d=>
  !fDepts.length || d.departamentos.some(dep => fDepts.includes(dep))
),[filteredNoTerr,fDepts]);

const filtered = useMemo(()=>filteredBase.filter(d=>!fDep||d.dependencia===fDep),[filteredBase,fDep]);
```

5. **Asignar a cada sección de UI su nivel.** Regla: la sección de la dimensión X consume el nivel inmediatamente ANTERIOR a la aplicación de X; todo lo demás consume `filtered`:
   - `<TerritorySection allData={filteredNoTerr} .../>` (dashboard.js 645) — los conteos por departamento no colapsan al marcar departamentos.
   - `<InstitucionPanel allData={filteredBase} .../>` (1124) y `byDep = freq(filteredBase,"dependencia")` (1037) — las barras de dependencia no colapsan al elegir una.
   - Mapa, KPIs, DonutChart, LineChart, WordCloud y tabla "Últimas" consumen `filtered` (1107, 1081-1084, 1036-1039).

6. **Derivar KPIs y series con `useMemo` desde `filtered`.** Ejemplos reales: `nDeps = new Set(filtered.map(d=>d.dependencia)).size`, `nDepts = new Set(filtered.flatMap(d=>d.departamentos)).size`, `byAño = años.map(y=>({label:y,count:filtered.filter(...).length}))` (1030-1039). El helper `freq(arr,key)` (141-145) genera `{label,count}` ordenado desc.

7. **Chips de filtros activos con limpieza individual.** Cada panel construye `otrosActivos`: array de `{label, clear}` donde `clear` es un closure que borra SOLO ese filtro (`clear: () => setFTemas(p=>p.filter(x=>x!==t))`, dashboard.js 585-591); lo pinta `ActiveFiltersBadge` (559-571). Añadir además `hasFilters` (OR de todos los filtros, 1041) que condiciona el botón `ClearBtn` "Limpiar todos los filtros" con `clearAll()` que resetea los 10 estados (1042-1046).

8. **El mapa NUNCA se oculta con 0 resultados.** Se renderiza siempre con `data={filtered}` y `mapColor(0)` devuelve el tono más claro `#EAE5F2` (MapaColombiaInner.js 8-14); la leyenda incluye el escalón "0". Los paneles secundarios sí pueden mostrar placeholder `"Sin datos"` (WordCloud/LineChart, dashboard.js 1134-1148) — la distinción es deliberada: el mapa es el ancla espacial del dashboard.

9. **Gráficos en SVG inline, sin librería de charts.** `DonutChart` con `strokeDasharray` sobre `<circle>` (285-317), `LineChart` con `polyline` + `polygon` de área y hover por punto (351-374), `NavBars` con divs (322-348), `WordCloud` con tamaño 9-33px proporcional a `(count-min)/span` y color por rango de frecuencia (220-282), `Counter` animado con `requestAnimationFrame` + easing cúbico (148-164). No agregar recharts/chart.js: el proyecto entero funciona sin ellas.

10. **Pasar el estado a los paneles con un objeto `commonProps`** (1050-1057) que incluye `allData`, `filteredData: filtered`, `filteredNoTerr` y todos los pares `fX/setFX`, y hacer spread `{...commonProps}` en cada tab de panel (1098-1100). Los tabs de panel (`MODES`/`RIGHT_MODES` + `ModeTab`, 963-984) permiten 3 vistas de filtros y 3 de análisis sin perder estado al cambiar.

## 3. Activos copiables

| Activo | Qué es | Cuándo copiarlo / qué adaptar |
|---|---|---|
| `activos/dashboard.js` | Copia íntegra (60 KB, 1160 líneas) de `Plataforma GEDII/app/components/dashboard.js`: cadena de filtros, 3 paneles de filtros con tabs, ChipGroup con conteos, TerritorySection por regiones, ActiveFiltersBadge, KPICard con `WebkitTextStroke`, DonutChart/LineChart/WordCloud/NavBars en SVG | Base de cualquier dashboard nuevo. Adaptar: dataset (`INVESTIGATIONS` es sintético generado con `mkDist`), paleta (`P`, `PD`, `ACC`), dimensiones de la cadena y `REGIONES` (agrupación Colombia) |
| `activos/cadena-filtros-fragmento.js` | Extracto verbatim de las líneas 986-1057 (estado + cadena de 3 niveles + KPIs + commonProps) con comentarios de qué nivel consume cada sección | Cuando solo se necesita el patrón de la cadena sin todo el dashboard. Adaptar nombres de dimensiones y qué dimensiones se excluyen |
| `activos/MapaColombiaInner.js` | Copia de `Plataforma GEDII/app/components/MapaColombiaInner.js`: mapa Leaflet coroplético SSR-safe, `mapColor(count)` con escala de 5 tonos donde 0 tiene color propio, refs espejo para handlers, `applyColors()` sin recrear capa | Dashboards con mapa filtrable. Requiere `public/colombia-depts.json` del proyecto fuente (GeoJSON 32 deptos + Bogotá; propiedad `NAME_1` y alias `DEPT_ALIAS`) |
| `activos/MapaColombia.js` | Copia del wrapper `dynamic(() => import('./MapaColombiaInner'), { ssr:false, loading:... })` | Siempre que se use el mapa en Next.js App Router — Leaflet no soporta SSR |

Referencias en el proyecto fuente (no copiadas): `Plataforma GEDII/CHANGELOG.md` (tabla "Problemas resueltos" y estimación real de esfuerzo: cadena de filtros ≈ 2 h, dashboard+mapa+dataset ≈ 6 h) y `Plataforma GEDII/CLAUDE.md` (design system completo: paleta morada institucional, tipografías Barlow, patrones de chips/tags/heros).

## 4. Gotchas verificados

1. **Conteos que colapsan al filtrar su propia dimensión.** Error original en GEDII: con un solo `filtered`, elegir una dependencia dejaba las demás barras en 0. Solución: la cadena de 3 niveles. Evidencia: `Plataforma GEDII/CHANGELOG.md` — tabla Problemas resueltos: "Conteos de filtros no reactivos → Cadena de tres niveles `filteredNoTerr → filteredBase → filtered`" — y `app/components/dashboard.js` 1005-1022 con los comentarios explicativos en inglés en el propio código.

2. **El mapa desaparecía con 0 resultados.** Existía una condición `filtered.length === 0` que ocultaba el mapa; el usuario perdía el ancla visual y el modo de quitar el filtro territorial. Solución: eliminar la condición y pintar todos los departamentos con `mapColor(0) = "#EAE5F2"`. Evidencia: `CHANGELOG.md` ("Mapa desaparece con 0 resultados → Eliminada condición `filtered.length === 0` que ocultaba el mapa") y `MapaColombiaInner.js` líneas 8-14.

3. **`CLOUD_COLORS is not defined` en WordCloud.** Al iterar la nube de palabras quedó una constante renombrada a medias. Solución: renombrado consistente a `CLOUD_PURPLES` (dashboard.js 216). Evidencia: `CHANGELOG.md` tabla Problemas resueltos. Lección aplicable: al renombrar constantes de paleta en un archivo de 1000+ líneas, hacer Grep del nombre viejo antes de dar por cerrado.

4. **Error de SSR con Leaflet en Next.js.** Leaflet toca `window` al importarse. Solución en dos capas: wrapper `next/dynamic` con `ssr: false` (`MapaColombia.js`) y `const L = (await import('leaflet')).default` DENTRO de `useEffect` (`MapaColombiaInner.js` 62-63). Evidencia: `CHANGELOG.md` ("SSR error con Leaflet → `import('leaflet')` dinámico dentro de useEffect").

5. **Closures obsoletos en los handlers de Leaflet.** Los handlers `mouseout`/`click` se registran una sola vez al crear la capa GeoJSON; si leyeran `data`/`fDepts` de props capturarían valores viejos. Solución del proyecto: refs espejo actualizadas en cada render (`dataRef.current = data; fDeptsRef.current = fDepts; onClickRef.current = onDeptClick`, MapaColombiaInner.js 28-34) y `applyColors()` re-ejecutado vía `useEffect(..., [data, fDepts])` (línea 129) sin recrear la capa ni el mapa.

6. **Archivo demasiado grande para el Edit tool.** `page.js` llegó a 875 KB (imágenes base64 embebidas) y las ediciones directas fallaban. Solución: transformaciones con Python/PowerShell por rangos de líneas y, después, extraer las imágenes (el archivo bajó a ~50 KB). Evidencia: `CHANGELOG.md` (Problemas resueltos y sección 0.2.0) y regla en `Plataforma GEDII/CLAUDE.md` §11: "Archivos grandes (>50 KB): usar Python con `open(..., encoding='utf-8')`".

7. **Caché de Turbopack corrupta tras ediciones masivas.** Síntoma: errores fantasma tras cambios grandes en componentes. Solución en Windows/PowerShell: `Remove-Item -Recurse -Force .next`. Evidencia: `CHANGELOG.md` Problemas resueltos y `CLAUDE.md` del proyecto.

## 5. Criterios de done

- [ ] Seleccionar una opción en una sección con conteos (territorio, dependencia u homóloga) NO deja en 0 las demás opciones de ESA misma sección; sí actualiza los conteos de las otras secciones.
- [ ] Cada nivel de la cadena es un `useMemo` cuyo array de dependencias contiene exactamente el nivel anterior + su dimensión propia (verificar contra `activos/cadena-filtros-fragmento.js`).
- [ ] Convención de estado respetada: single-select como string `""` con toggle `act?"":valor`; multi-select como array con `includes/filter`.
- [ ] Chips de filtros activos: cada filtro aplicado muestra su chip con `×` que borra SOLO ese filtro; "Limpiar todos los filtros" solo aparece cuando `hasFilters` es verdadero y resetea las 9 dimensiones de filtro + la búsqueda (10 estados en total, `clearAll` 1042-1046).
- [ ] Con una combinación de filtros que da 0 resultados: el mapa sigue visible con todos los territorios en el color de conteo 0 y la leyenda incluye el escalón "0"; los paneles secundarios muestran "Sin datos" en vez de romperse.
- [ ] KPIs derivados (`totalInv`, conteos por `Set`) reaccionan a cualquier filtro y usan `useMemo`.
- [ ] `package.json` sin librerías de gráficos (recharts/chart.js/d3): donuts, líneas y barras son SVG/divs inline.
- [ ] Si hay mapa Leaflet: import dinámico con `ssr:false`, `import('leaflet')` dentro de `useEffect`, y refs espejo para los handlers; probado que clic en departamento agrega/quita el filtro.
- [ ] Prueba manual cruzada: aplicar filtro de dimensión A + dimensión B, quitar A desde su chip, verificar que B sigue aplicado y los conteos son coherentes.

## Registro de uso
| Fecha | Proyecto | Tarea | Resultado | Lección |
|---|---|---|---|---|
| histórico | Plataforma GEDII | uso original (fuente de esta skill) | ok | - |
