---
name: front-patrones-react-estado-render
regimen: universal
description: Patrones idiomáticos de React 18/19 verificados en producción para manejar estado y render sin bugs sutiles. Cargar al escribir o revisar componentes React con filtros+paginación, efectos imperativos (rAF, Leaflet, IntersectionObserver, listeners nativos), warnings de react-hooks/exhaustive-deps, refs escritas en render o "any" en callbacks de librerías.
---

# Patrones React de estado y render

**Nivel actual:** N3 · **Dominio:** front · **Agente(s):** front-lider
**Proyectos fuente:** Plataforma Conecta, Plataforma GEDII, DivergenteWEB (+ landing de Scraper-Empleos, ver dudas de la ficha)

> Criterio de ascenso a N1: los 5 bloques completos, con activos copiables de ruta real y gotchas verificados (no genéricos). A N2: ≥1 uso real aceptado por el Dueño. A N3: ≥3 usos exitosos en ≥2 proyectos + checklist propio.

## 1. Propósito

Evitar los tres tipos de bug que más costaron en los proyectos fuente: (a) re-renders extra y estados inconsistentes por resetear estado derivado dentro de `useEffect`; (b) closures viejas en handlers imperativos que se registran una sola vez (controles Leaflet, loops de `requestAnimationFrame`, listeners nativos); (c) efectos imperativos con cleanup incompleto que dejan rAF, timers o listeners vivos tras desmontar. Incluye además las convenciones que mantienen `react-hooks/exhaustive-deps` y `tsc` en verde — en Conecta el build es `tsc && vite build`, así que el tipado estricto es literalmente el gate de despliegue (commit 65d5ddd).

Se carga cuando la tarea toque: componentes con filtros + paginación, animaciones con rAF/scroll/IntersectionObserver, integración con librerías imperativas (react-leaflet), drawers/modales con foco gestionado, o limpieza de warnings de hooks.

## 2. Procedimiento

1. **¿Hay que resetear estado cuando cambia otro estado/prop?** NO usar `useEffect`. Decidir así:
   - Si el reset depende de una combinación de valores del mismo componente → **ajuste de estado durante el render**: derivar una clave, guardar su valor previo en estado y comparar. Patrón real de `ecosistema.tsx` (Conecta, líneas 43-51):
     ```tsx
     // Cualquier cambio de filtro vuelve a la primera página.
     // Ajuste de estado durante el render (patrón recomendado por React): evita
     // el re-render adicional que provocaría hacerlo dentro de un useEffect.
     const filtroKey = `${categoria}|${direccion}|${query}`
     const [filtroPrev, setFiltroPrev] = useState(filtroKey)
     if (filtroKey !== filtroPrev) {
       setFiltroPrev(filtroKey)
       setPagina(0)
     }
     ```
     React re-ejecuta el render inmediatamente sin pintar el estado intermedio ni disparar efectos de más.
   - Si hay que resetear TODO el estado de un subárbol → prop `key` en el componente hijo.
   - Complementar con clamping render-safe: `const paginaActual = Math.min(pagina, totalPaginas - 1)` (ecosistema.tsx:55) protege contra páginas fuera de rango sin más estado.
2. **¿Un handler imperativo registrado una sola vez necesita props/estado frescos?** → **ref espejo**. Escribir la ref SOLO en `useEffect`, nunca en el cuerpo del render (corregido en commit df71bfb de Conecta). Patrón real de `MapaCirculacion.tsx` (PanButton, líneas 148-175): el control Leaflet se crea una vez con `[map]` como deps, pero el click lee `onToggleRef.current()`:
   ```tsx
   const onToggleRef = useRef(onToggle)
   useEffect(() => { onToggleRef.current = onToggle }, [onToggle])
   // ...dentro del useEffect que crea el control (deps: [map]):
   L.DomEvent.on(btn, 'click', e => { L.DomEvent.stopPropagation(e); onToggleRef.current() })
   ```
   Mismo patrón en DivergenteWEB (`app/metodologias/page.tsx:39-58`): `isMobile` vive duplicado como estado (para JSX) y como `isMobileRef` (para handlers de scroll/rAF), ambos actualizados en el mismo listener de `resize`.
3. **¿Efecto imperativo con varios recursos (rAF + timers + listeners)?** → UN solo `useEffect` por sistema, con cleanup simétrico completo. Referencia: `tirillaF.tsx` (Conecta, líneas 60-108) monta rAF + 4 listeners + timer de reanudación y su cleanup hace `cancelAnimationFrame`, `clearTimeout` y los 4 `removeEventListener`. La posición del carrusel vive en `posRef` (ref, no estado) porque cambia 60 veces/segundo y no debe re-renderizar.
4. **¿Warning de `exhaustive-deps`?** No silenciarlo: resolverlo con estas tres jugadas (todas del commit a2eb1e6 de Conecta):
   - setState funcional para no depender del valor: `setScales(prev => prev.map(() => 1))` en vez de reconstruir desde `sistemasFixed` (tirillaF.tsx:53).
   - Incluir la ref/valor que el linter pide cuando es legítimo (se añadió `ref` a las deps del efecto de scroll en `InternacionalizacionPage.tsx:134-137`).
   - Eliminar dependencias redundantes que el callback ya no lee (se quitó `dept` de `onEachFeature`; el click usa `setDept(prev => ...)` funcional, MapaCirculacion.tsx:264).
5. **¿Callbacks de librería tipados con `any`?** Usar los tipos del paquete de la librería: `import type { Feature, FeatureCollection } from 'geojson'` para react-leaflet (MapaCirculacion.tsx:14, 222, 239, 255; reemplazó 3 `any` en commit df71bfb).
6. **¿Reveal por IntersectionObserver que "no dispara" al montar?** El layout puede no estar estable (fuentes, imágenes, hidratación). Patrón de DivergenteWEB (`app/metodologias/page.tsx:60-88`): función `observe()` que solo selecciona `.mt-reveal:not(.is-in)`, `unobserve` de cada elemento al revelarlo, y **re-invocación con `setTimeout(observe, 400)`** para capturar lo que quedó fuera del primer pase; cleanup con `io.disconnect()` + `clearTimeout`. Si `prefers-reduced-motion`, marcar todo como visible de entrada y no observar.
7. **¿Conmutar vistas dentro de una página?** Estado local + render condicional en la página contenedora, no rutas nuevas: `Home.tsx` (Conecta) usa `type Vista = 'landing' | 'internacional'` con `useState<Vista>`, y difiere la vista pesada con `React.lazy` + `Suspense` para que su código y dataset (~48 kB) no entren al bundle inicial.
8. **¿Drawer/modal con foco?** Dos efectos separados por responsabilidad (AppShell.tsx de la landing de Scraper-Empleos, líneas 53-96): uno para Escape + focus-trap (montado solo si `menuAbierto`), otro para `body.overflow` + atributo `inert` + devolución de foco al botón hamburguesa — usando la ref `estuvoAbierto` para no robar el foco en el primer render.

## 3. Activos copiables

Copias verificadas en `activos/` de esta skill (sin secretos; son componentes de UI):

| Activo | Origen real | Qué es / cuándo copiarlo | Qué adaptar |
|---|---|---|---|
| `activos/ecosistema.tsx` | `Plataforma Conecta\client\src\components\ecosistema.tsx` | Filtros combinados (categoría+dirección+búsqueda) con paginación y reset vía ajuste de estado durante render (líneas 43-51). Base para cualquier catálogo filtrable. | Dataset (`@/data/iniciativas`), `PAGE_SIZE`, clases CSS `eco__*` |
| `activos/tirillaF.tsx` | `Plataforma Conecta\client\src\components\tirillaF.tsx` | Carrusel infinito rAF + dock magnético con el `useEffect` de cleanup completo (60-108) y constantes de tuning al tope. Documentación en `TIRILLA_F_README.md` junto al original. | `SistemaDemo`, constantes CONFIG, CSS `tirilla-f__*` |
| `activos/MapaCirculacion.tsx` | `Plataforma Conecta\client\src\pages\MapaCirculacion.tsx` | Mapa react-leaflet con ref espejo en control imperativo (PanButton, 148-175), tipos `Feature/FeatureCollection`, `MapController` (useMap+fitBounds) y normalización de departamentos (`normDept`/`DEPT_MAP`). | Dataset de entidades, bounds, URL del GeoJSON |
| `activos/AppShell.tsx` | `Scraper-Empleos\landing\components\AppShell.tsx` | Shell con drawer accesible: focus-trap por teclado, `inert`, bloqueo de scroll y devolución de foco con ref `estuvoAbierto` (53-96). | Props de navegación, CSS Modules |
| `activos/metodologias-page.tsx` | `DivergenteWEB\app\metodologias\page.tsx` | Página Next.js "use client" con los patrones de refs espejo (`isMobileRef`, `reduceMotion`, 36-58), IntersectionObserver con re-observe a 400ms (60-88) y scroll-handlers que escriben en refs de progreso. Copiar solo las secciones de hooks, no la página entera. | Todo el contenido de marca; conservar la estructura de efectos |

Rutas base: `C:\Users\camil\Desktop\IA Raiz Proyectos\002 Desarrollos\`.

## 4. Gotchas verificados

1. **Resetear paginación en `useEffect` provoca un render con estado inconsistente** (página vieja + filtro nuevo) y un re-render extra. Corregido con ajuste de estado durante render en `ecosistema.tsx:43-51` — commit `df71bfb` de Plataforma Conecta ("reset de pagina con ajuste de estado en render en vez de useEffect. Sin cambios de comportamiento; tsc y vite build verdes").
2. **Escribir una ref en el cuerpo del render** rompe con StrictMode/render concurrente. En Conecta se detectó y se movió a `useEffect` (mismo commit `df71bfb`); el resultado es el patrón `onToggleRef` de `MapaCirculacion.tsx:149-152`.
3. **Closure vieja en control Leaflet:** el control se registra una vez (`useEffect` con deps `[map]`); si el click captura `onToggle` directamente, ejecuta la versión del primer render para siempre. Solución: ref espejo (`MapaCirculacion.tsx:165-168`). Igual con rAF/scroll en DivergenteWEB: `isMobileRef`/`giroProgressRef` (`app/metodologias/page.tsx:39-42, 158-165`).
4. **Warnings reales de `exhaustive-deps` y su fix exacto** (commit `a2eb1e6`, Conecta): dependencia de `sistemasFixed` eliminada con `setScales(prev => prev.map(() => 1))` (tirillaF.tsx:53); `ref` añadida a deps del efecto de scroll (InternacionalizacionPage.tsx); dep redundante `dept` eliminada de `onEachFeature` usando `setDept(prev => ...)` (MapaCirculacion.tsx:264). Nunca se usó `eslint-disable` para hooks.
5. **`any` en callbacks de react-leaflet ocultaba errores de forma:** 3 `any` reemplazados por `Feature`/`FeatureCollection` del paquete `geojson` (MapaCirculacion.tsx:14; commit `df71bfb`). El gate es duro: con `tsc && vite build`, un `any` mal resuelto que luego se tipa mal bloquea el despliegue en Vercel (commit `65d5ddd`).
6. **Cleanup incompleto de efectos imperativos deja rAF y timers vivos** tras desmontar (fuga + `setState` sobre componente desmontado). El patrón correcto está en `tirillaF.tsx:100-107`: `cancelAnimationFrame(raf)` + `clearTimeout(resumeTimer)` + 4 `removeEventListener`, todo en el return del MISMO efecto que los creó.
7. **IntersectionObserver que no revela contenido al montar** porque el layout aún se mueve (fuentes/hidratación): resuelto con segundo pase `setTimeout(() => observe(), 400)` sobre los elementos aún sin `.is-in`, y bypass total si `prefers-reduced-motion` (DivergenteWEB `app/metodologias/page.tsx:60-88`).
8. **SVG inline con declaración XML rompe `dangerouslySetInnerHTML`:** helper `stripXmlDecl` elimina `<?xml …?>` antes de inyectar; los SVG usan `fill="currentColor"` para heredar color (tirillaF.tsx:11, 162).
9. **Re-render con `innerHTML` destruye el input y sus listeners** — versión vanilla del problema que React resuelve con reconciliación: en GEDII, `renderChips()` debe re-vincular el `keydown` al input nuevo y devolverle el foco (`Plataformas Ministerio\001 GEDII\gedii-handoff\gedii-prototipo.html:1134-1156`, comentario `// rebind input`). Moraleja React: si usas `dangerouslySetInnerHTML` sobre zonas interactivas heredas exactamente este bug; deja que React posea el DOM interactivo.
10. **Drawer que roba el foco en el primer render:** sin la ref `estuvoAbierto`, el efecto de foco devuelve el foco al botón hamburguesa al montar la página (cuando el drawer nunca estuvo abierto). Ver `AppShell.tsx:51, 90-92` (Scraper-Empleos landing).

## 5. Criterios de done

- [ ] `npm run lint` en verde sin ningún `eslint-disable` de `react-hooks/*` (los disable de `jsx-a11y` solo con `-- TODO:` documentado, convención de Conecta commit `65e849c`).
- [ ] Ningún `useEffect` cuya única función sea copiar/resetear estado derivable de props u otro estado — usar ajuste durante render o prop `key`.
- [ ] Ninguna escritura de `ref.current` en el cuerpo del render; solo en efectos o handlers.
- [ ] Todo `useEffect` que registre listeners/rAF/timers/observers tiene cleanup que libera cada recurso creado (revisar simetría línea a línea).
- [ ] Handlers registrados una sola vez que lean props/estado cambiantes lo hacen vía ref espejo actualizada en su propio `useEffect`.
- [ ] Cero `any` en callbacks de librerías: usar los tipos del paquete (`geojson`, tipos de `leaflet`, etc.).
- [ ] `tsc` (o `npm run build` si es `tsc && vite build`) en verde — es gate de despliegue.
- [ ] Animaciones/reveals respetan `prefers-reduced-motion` con fallback visible.
- [ ] Estado de alta frecuencia (posición de scroll/animación) vive en refs, no en `useState`.

## Registro de uso
| Fecha | Proyecto | Tarea | Resultado | Lección |
|---|---|---|---|---|
| histórico | Plataforma Conecta | uso original (fuente de esta skill) | ok | - |
| histórico | Plataforma GEDII | uso original (fuente de esta skill) | ok | - |
| histórico | DivergenteWEB | uso original (fuente de esta skill) | ok | - |
