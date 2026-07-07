---
name: front-dock-magnetico-carrusel-infinito
regimen: universal
description: Construye una barra de logos institucional con dock magnético estilo macOS y carrusel infinito en React + CSS puro, sin librerías de animación. Cargar cuando se pida una tira/barra de logos animada, un carrusel infinito de aliados/sistemas, un efecto dock de escala al pasar el cursor, o al reutilizar/adaptar el componente TirillaF.
---

# Dock magnético + carrusel infinito (TirillaF)

**Nivel actual:** N3 · **Dominio:** Frontend · **Agente(s):** front-visualizaciones
**Proyectos fuente:** Portal ISI, Interfase Sistemas, Plataforma Conecta

> Criterio de ascenso a N1: los 5 bloques completos, con activos copiables de ruta real y gotchas verificados (no genéricos). A N2: ≥1 uso real aceptado por el Dueño. A N3: ≥3 usos exitosos en ≥2 proyectos + checklist propio.

## 1. Propósito

Implementar una barra de logos institucionales de alto pulido con dos zonas: una sección fija con **dock magnético** (los logos crecen suavemente al acercar el cursor, como el dock de macOS) y un **carrusel infinito** con auto-scroll imperceptible, **sin ninguna librería de animación** (ni framer-motion, ni GSAP, ni Swiper). El componente TirillaF se construyó para el portal del Ministerio de las Culturas y se replicó en 3 proyectos; la decisión de CSS/JS puro fue deliberada: no comprometer el futuro sistema de diseño institucional con dependencias de UI.

Se carga cuando la tarea pida: tira de logos de sistemas/aliados/patrocinadores, carrusel infinito sin librerías, efecto de magnificación por cercanía del cursor, o adaptación del componente TirillaF existente.

## 2. Procedimiento

1. **Copiar los activos base** (bloque 3): `tirillaF.tsx` (lógica completa), `tirillaF.css` (estilos BEM autocontenidos con responsive 320px→4K) y `sistemasDemo.ts` (modelo de datos). Renombrar prefijo BEM `tirilla-f__` solo si el proyecto ya lo usa.

2. **Decidir dónde vive el CSS.** Criterio de los proyectos fuente: si el proyecto tiene hoja única pequeña, pegar el bloque `/* ─── PROPUESTA F — Magnetic dock */` en `index.css` (así se hizo en Portal ISI e Interfase Sistemas); si el CSS global supera ~2.000 líneas, usar parcial `src/styles/tirillaF.css` importado con `@import` respetando el orden de cascada (así lo refactorizó Plataforma Conecta, verificando CSS compilado byte-idéntico por hash, commit 611f0df).

3. **Preparar los datos.** Interfaz mínima (de `sistemasDemo.ts`):
   ```ts
   export interface SistemaDemo {
     id: string
     sigla: string        // texto fallback si no hay SVG
     descripcion: string  // texto bajo el logo
     svgRaw?: string      // SVG inline (heredado vía currentColor)
   }
   ```
   Los SVG se importan como texto con el sufijo `?raw` de Vite (`import logo from '@/assets/logos/logo_sipa.svg?raw'`) y se inyectan inline con `dangerouslySetInnerHTML` tras pasar por `stripXmlDecl` (ver gotcha 5). Los SVG deben usar `fill="currentColor"` para heredar el color del contenedor (habilita la variante `dark` solo con CSS). Si un sistema no tiene logo aún, se omite `svgRaw` y el componente degrada a la sigla (ej.: `{ id: 'cineproyecto', sigla: 'CIN', descripcion: 'Cineproyecto' }`).

4. **Ajustar las constantes de tuning** — siempre al tope del archivo, nunca enterradas en la lógica:
   ```ts
   const FIXED_COUNT    = 4    // logos en la sección fija (izquierda)
   const MAX_SCALE      = 1.9  // escala pico del dock magnético
   const INFLUENCE      = 100  // radio de influencia en px
   const CAROUSEL_SPEED = 0.3  // px por fotograma (~18 px/s a 60 fps)
   ```
   Los primeros `FIXED_COUNT` items del array van al dock; el resto al carrusel automáticamente.

5. **Dock magnético** (ya implementado en el activo; entender antes de tocar): en `onMouseMove` del contenedor fijo se calcula la distancia euclidiana cursor→centro de cada logo y se aplica curva de potencia:
   ```ts
   const r = el.getBoundingClientRect()
   const dist = Math.hypot(e.clientX - (r.left + r.width / 2), e.clientY - (r.top + r.height / 2))
   if (dist > INFLUENCE) return 1
   return 1 + (MAX_SCALE - 1) * Math.pow(1 - dist / INFLUENCE, 1.8)
   ```
   El exponente `1.8` da caída suave (lineal se siente robótico). Cada logo recibe `style={{ transform: scale(...), zIndex: Math.round(scales[i] * 10) }}` para que el más grande quede encima, y el "activo" (que muestra su nombre) es el de mayor escala **solo si supera 1.05** (evita parpadeo de etiqueta con el cursor lejos).

6. **Carrusel infinito**: triplicar el array (`[...items, ...items, ...items]`) y en un loop de `requestAnimationFrame` avanzar `posRef.current += CAROUSEL_SPEED`; al alcanzar el primer tercio de `scrollWidth`, restar ese tercio — el salto es invisible porque la copia B es idéntica a la A:
   ```ts
   const third = el.scrollWidth / 3
   if (third > 0 && posRef.current >= third) posRef.current -= third
   el.scrollLeft = posRef.current
   ```
   Pausa con `mouseenter`/`mouseleave` y con `touchstart` (pausa) / `touchend` (reanuda tras `setTimeout` de 1500 ms). Listeners táctiles con `{ passive: true }`. La posición vive en un `ref`, no en estado (evita re-render por frame).

7. **Elegir modo por prop**, no por componente duplicado: `staticMode` (sin RAF, sin triplicado, con scroll-snap solo en esa variante — gotcha 4), `dark` (fondo `#0D0B1A`, tonos violeta vía `currentColor`), `labelFixed`/`labelCarousel` para los títulos.

8. **Cleanup exhaustivo** en el return del `useEffect`: `cancelAnimationFrame(raf)`, `clearTimeout(resumeTimer)` y los 4 `removeEventListener`. Sin esto, el RAF sigue corriendo tras desmontar y el timer puede despausar un carrusel muerto.

9. **Verificar accesibilidad**: flechas con `aria-label="Anterior"/"Siguiente"`, cada logo es `<a>` con `title={descripcion}`, el auto-scroll se pausa cuando el usuario interactúa (exigencia NTC 5854 AA en portales estatales). Si los enlaces son placeholder `href="#"`, aplicar gotcha 9.

## 3. Activos copiables

Todos verificados y copiados a `activos/` de esta skill:

| Activo | Qué es | Origen | Qué adaptar |
|---|---|---|---|
| `activos/tirillaF.tsx` | Componente completo (dock + carrusel + modos), versión más evolucionada: reset de escalas con setState funcional y deuda a11y documentada con TODO | `Plataforma Conecta\client\src\components\tirillaF.tsx` | Import del tipo de datos, `labelFixed` por defecto, los `href="#"` por URLs reales |
| `activos/tirillaF.css` | CSS BEM autocontenido: bloque base + comentario de "PARÁMETROS CSS AJUSTABLES" + 8 media queries 4K→320px, scroll-snap solo estático y `@media (hover: none)` | `Plataforma Conecta\client\src\styles\tirillaF.css` | Colores institucionales, tamaños de slot (comentados línea a línea con `/* ← */`) |
| `activos/TIRILLA_F_README.md` | Documentación técnica co-ubicada: algoritmos con diagrama ASCII, tabla de props, tabla responsive, guía "añadir un nuevo sistema" | `Plataforma Conecta\client\src\components\TIRILLA_F_README.md` | Nombres de sistemas del dominio; mantenerla junto al componente (patrón de doc en 3 niveles) |
| `activos/sistemasDemo.ts` | Catálogo de datos tipado con SVG vía `?raw` y fallback de sigla | `Interfase Sistemas\client\src\data\sistemasDemo.ts` | IDs, siglas, descripciones y rutas de logos del proyecto destino |

Rutas fuente adicionales (no copiadas, consultar en el proyecto):
- `Interfase Sistemas\client\src\index.css` — la misma solución con CSS en hoja única (bloque responsive líneas ~1017-1398; scroll-snap estático 1316-1321; hover:none 1329-1334).
- `Interfase Pagina Inicial\client\src\components\tirillaA.tsx` a `tirillaG.tsx` — las 7 variantes de la exploración de diseño que perdieron contra la F (referencia si piden otro estilo: hover-lift, pill, tooltip, spotlight, ghost reveal).

Carpetas fuente: `C:\Users\camil\Desktop\IA Raiz Proyectos\002 Desarrollos\Interfase Pagina Inicial` (Portal ISI), `...\Interfase Sistemas` y `...\Plataforma Conecta`.

## 4. Gotchas verificados

1. **Salto visible al reiniciar el carrusel.** Con una sola copia del array, el reset a `scrollLeft = 0` se ve. Solución: triplicar items y restar el tercio al cruzarlo (`posRef.current -= third`), nunca asignar 0. Evidencia: `Interfase Sistemas\client\src\components\tirillaF.tsx` líneas 65-73 y diagrama en `TIRILLA_F_README.md` sección "Cómo funciona el auto-scroll".

2. **El auto-scroll pelea con el dedo en táctiles.** Si solo se pausa en hover, en móvil el carrusel "se resiste" al arrastre. Solución: `touchstart` pausa y `touchend` reanuda tras 1500 ms con `clearTimeout` del timer anterior en cada nuevo toque. Evidencia: `tirillaF.tsx` (los tres proyectos), handlers `touchStart`/`touchEnd`.

3. **Estados `:hover` que quedan "pegados" en pantallas táctiles.** El tap dispara hover y el logo queda escalado/coloreado. Solución: `@media (hover: none)` dentro del bloque mobile que neutraliza `transform`, `filter`, `color` y `text-shadow` de los items del carrusel. Evidencia: `Interfase Sistemas\client\src\index.css` líneas 1329-1334; `Plataforma Conecta\client\src\styles\tirillaF.css` línea 1200.

4. **`scroll-snap` interfiere con el auto-scroll por RAF.** El snap corrige la posición que el RAF escribe y el movimiento tiembla. Solución: `scroll-snap-type: x proximity` SOLO bajo `.tirilla-f--static .tirilla-f__carousel`, nunca en la variante animada. Evidencia: `Interfase Sistemas\client\src\index.css` líneas 1316-1321 (comentario explícito "no interfiere con auto-scroll").

5. **SVGs exportados con declaración `<?xml ...?>` rompen la inyección inline** con `dangerouslySetInnerHTML`. Solución: helper `stripXmlDecl = (svg) => svg.replace(/^<\?xml[^?]*\?>\s*/i, '')` antes de inyectar, y `fill="currentColor"` en los SVG para heredar color (la carga como URL falló primero: commit 77a42ee de Portal ISI "reemplazar logoUrl por svgRaw"). Evidencia: `tirillaF.tsx` línea 11 en los tres proyectos.

6. **El scroll manual con flechas puede dejar la posición fuera del tercio válido**, sobre todo hacia atrás (módulo de negativo en JS es negativo). Solución: normalizar con módulo doble `(((posRef.current + dir * 200) % third) + third) % third`. Evidencia: `Interfase Sistemas\...\tirillaF.tsx` línea 103; `Plataforma Conecta\...\tirillaF.tsx` línea 117.

7. **El logo agrandado queda tapado por sus vecinos.** Sin z-index, el stacking sigue el orden del DOM. Solución: `zIndex: Math.round(scale * 10)` dinámico + umbral `maxScale > 1.05` para decidir cuál muestra su nombre. Evidencia: `tirillaF.tsx` (render de la sección fija, los tres proyectos).

8. **Warning `react-hooks/exhaustive-deps` al resetear escalas en `mouseleave`.** La versión original (`setScales(sistemasFixed.map(() => 1))` con dep `[sistemasFixed.length]`) se corrigió con setState funcional `setScales(prev => prev.map(() => 1))` y deps `[]`. Usar siempre la versión del activo. Evidencia: `Plataforma Conecta\...\tirillaF.tsx` líneas 51-54 (commit a2eb1e6) vs `Interfase Sistemas\...\tirillaF.tsx` líneas 48-51.

9. **Enlaces placeholder `href="#"` disparan `jsx-a11y/anchor-is-valid`.** No degradar la semántica `<a>` ni apagar la regla globalmente: marcar cada caso con `// eslint-disable-next-line jsx-a11y/anchor-is-valid -- TODO: enlazar a cada sistema cuando exista su URL`. Evidencia: `Plataforma Conecta\...\tirillaF.tsx` líneas 153 y 193 (commit 65e849c).

## 5. Criterios de done

- [ ] El carrusel completa ≥2 ciclos sin salto visible (observar el punto de reinicio en desktop y mobile).
- [ ] Hover sobre el carrusel lo pausa; al salir, reanuda. En emulación táctil (DevTools), `touchstart` pausa y reanuda ~1,5 s tras soltar.
- [ ] El dock escala suave hasta ~1.9 dentro de 100 px del cursor; el nombre aparece solo en el logo dominante y el logo grande queda por encima de sus vecinos.
- [ ] En emulación táctil no quedan logos escalados ni coloreados tras un tap (hover:none activo).
- [ ] `scroll-snap` solo actúa con `staticMode`; la variante animada no tiembla.
- [ ] Desmontar el componente (navegar a otra ruta) no deja errores en consola ni RAF activo (verificable en el panel Performance).
- [ ] Logos sin `svgRaw` muestran su sigla; ningún SVG renderiza roto (declaración XML eliminada).
- [ ] `npm run lint` en 0 errores: flechas con `aria-label`, enlaces con `title`, placeholders con eslint-disable + TODO.
- [ ] Responsive verificado en 320 px, 767 px, 1440 px y ≥1920 px (layout vertical en mobile: fija arriba, carrusel abajo).
- [ ] Constantes de tuning al tope del archivo y README técnico co-ubicado junto al componente.

## Registro de uso
| Fecha | Proyecto | Tarea | Resultado | Lección |
|---|---|---|---|---|
| histórico | Portal ISI | uso original (fuente de esta skill) | ok | - |
| histórico | Interfase Sistemas | uso original (fuente de esta skill) | ok | - |
| histórico | Plataforma Conecta | uso original (fuente de esta skill) | ok | - |
