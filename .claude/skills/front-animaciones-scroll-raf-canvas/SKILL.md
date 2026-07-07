---
name: front-animaciones-scroll-raf-canvas
regimen: divergente
description: Construye animaciones scroll-driven y momentos signature en canvas 2D sin librerías (sin GSAP/Framer Motion), con presupuesto de performance y accesibilidad de movimiento. Cargar cuando haya que animar en función del scroll (melt de letras, logo que viaja, secuencias sticky ancladas, partículas en canvas), o cuando aparezcan bugs de jank, hydration mismatch o prefers-reduced-motion en animaciones frontend.
---

# Animaciones scroll-driven + rAF + canvas (sin librerías)

**Nivel actual:** N2 · **Dominio:** front · **Agente(s):** front-visualizaciones
**Proyectos fuente:** DivergenteWEB (`C:\Users\camil\Desktop\IA Raiz Proyectos\002 Desarrollos\DivergenteWEB`)

> Criterio de ascenso a N1: los 5 bloques completos, con activos copiables de ruta real y gotchas verificados (no genéricos). A N2: ≥1 uso real aceptado por el Dueño. A N3: ≥3 usos exitosos en ≥2 proyectos + checklist propio.

## 1. Propósito

Implementar animaciones ligadas al scroll y "momentos signature" (melt de letras, logo que viaja al header, campo de partículas ruido→orden) en React/Next.js **sin ninguna librería de animación**: listener de scroll pasivo + `requestAnimationFrame` mutando `el.style` directamente, con **cero re-renders de React** durante el scroll. Incluye el presupuesto de performance (conteo de partículas por dispositivo, cap de `devicePixelRatio`, throttle de jitter) y la accesibilidad de movimiento (`prefers-reduced-motion` → frame estático, fallbacks apilados en mobile).

Se carga cuando la misión pide: hero animado por scroll, secuencia sticky "una tarjeta a la vez", canvas de partículas, texto que se derrite/aparece letra a letra, o cuando hay que depurar jank / hydration mismatch / closures obsoletos en animaciones existentes.

## 2. Procedimiento

1. **Elegir la técnica según el tipo de animación** (criterio verificado en DivergenteWEB):
   - *Reveal único al entrar en viewport* → `IntersectionObserver` + clase CSS (`.mt-reveal` → `.is-in`), con `unobserve` tras revelar. No usar rAF para esto.
   - *Progreso continuo ligado al scroll* → listener `scroll` pasivo o loop rAF que lee `scrollTop`, calcula progreso normalizado y muta `el.style`. Nunca `setState` por frame.
   - *Momento denso (cientos de elementos)* → canvas 2D con partículas interpoladas por un `progressRef` que escribe el listener de scroll.
   - *Parpadeo/loop ambiental desacoplado del scroll* → `@keyframes` CSS con `animation-duration/delay` por elemento vía inline style (ver `HeroDataField` + `.mt-data-num`).
   - *Cambio de estado discreto disparado por scroll* (acordeón que abre tarjeta N) → sí puede usar `setState`, pero solo cuando cambia el índice (`if (nextCard !== lastCardIdx)`), no por frame.
2. **Identificar el contenedor de scroll real.** En DivergenteWEB el scroll NO es de `window`: es un div `[data-scroll-container]` (`h-screen overflow-y-auto` en `SiteShell.tsx`). Leer `container.scrollTop`, no `window.scrollY`, y registrar el listener sobre ese contenedor con `{ passive: true }`.
3. **Setup de accesibilidad y dispositivo ANTES de animar:**
   - `reduceMotion = useRef(false)` poblado con `matchMedia("(prefers-reduced-motion: reduce)").matches` + un `useState` espejo (`reduced`) para el render condicional de fallbacks.
   - **Patrón isMobile doble**: `useState` (decide qué JSX renderizar: demo animado vs bloque apilado) **y** `useRef` paralelo actualizado en `resize` (lo que se lee dentro de rAF/onScroll — el state quedaría congelado en el closure). Verbatim de `metodologias/page.tsx:36-58`:

   ```tsx
   const [isMobile, setIsMobile] = useState(() =>
     typeof window !== "undefined" ? window.innerWidth <= 768 : false
   );
   const isMobileRef = useRef(/* mismo valor inicial */);
   // en useEffect:
   const check = () => {
     const m = window.innerWidth <= 768;
     isMobileRef.current = m;   // lo lee el loop rAF
     setIsMobile(m);            // lo lee el JSX
   };
   ```
4. **Calcular progreso normalizado 0→1 con clamp.** Dos variantes reales:
   - *Sección sticky*: wrapper de altura `200vh–360vh` con hijo `position: sticky; top: 0; height: 100vh`; el progreso se deriva del rect del wrapper (verbatim de `metodologias/page.tsx:387-389`):

   ```tsx
   const rect = wrap.getBoundingClientRect();
   const span = rect.height - window.innerHeight;
   const p = span > 0 ? clamp(-rect.top / span) : rect.top < 0 ? 1 : 0;
   ```
   - *Breakpoints absolutos de scrollTop*: constantes nombradas (`LOGO_START=20, LOGO_END=320, MELT_START, MELT_DUR…`) y `p = clamp((y - START) / DUR)`. Ver `analitica/page.tsx:172-182`.
5. **Interpolar y escribir estilos directamente:** `lerp = (a, b, t) => a + (b - a) * t` para posiciones, template strings para `transform`/`filter`/`opacity`. Cuando `p <= 0`, **limpiar** los estilos (`el.style.transform = ""`) para dejar el elemento en reposo sin residuos.
6. **Patrón "logo que viaja"** (cohesión de marca entre páginas): clon `position: fixed` del logo; al montar se mide el destino con `getBoundingClientRect()` del logo real del header (`[data-header-logo]`), se ocultan logo y texto reales, y en scroll se interpola `top/left` del clon del bottom al header. La "llegada" usa un sub-progreso que hace crossfade clon→logo real (verbatim de `metodologias/page.tsx:143-156`):

   ```tsx
   const logoP = clamp((y - LOGO_START) / (LOGO_END - LOGO_START));
   setStyle(fixedLogo, {
     top:  `${lerp(startTop, endTop, logoP)}px`,
     left: `${lerp(startLeft, endLeft, logoP)}px`,
   });
   const arrivalP = clamp((logoP - 0.8) / 0.2);   // último 20% del viaje
   if (headerLogo) headerLogo.style.opacity = String(arrivalP);
   fixedLogo.style.opacity = String(
     logoP < 0.8 ? lerp(0.22, 0.7, logoP / 0.8) : lerp(0.7, 0, arrivalP)
   );
   ```
   Ver también la variante de `analitica/page.tsx:369-388`.
7. **Pseudo-aleatoriedad SIEMPRE determinista en render:** nunca `Math.random()` para valores que pintan JSX o inicializan animaciones — rompe la hidratación SSR. Hash de primos, cada parámetro con su terna distinta (verbatim de `analitica/page.tsx:214` y `metodologias/page.tsx:194-204`):

   ```tsx
   const line1Delays = line1Letters.map((_, i) => ((i * 7919 + 2053) % 97) / 97 * 28);
   // metodologias generaliza:
   const hash = (i: number, a: number, b: number, c: number) => ((i * a + b) % c) / c;
   const driftX = letters.map((_, i) => (hash(i, 2741, 4099, 89) - 0.5) * 130);
   const rot    = letters.map((_, i) => (hash(i, 5381, 7013, 127) - 0.5) * 80);
   ```
   `Math.random()` solo es válido dentro de loops rAF post-montaje (jitter de "estática").
8. **Canvas 2D:** función `build()` que fija el dpr y las partículas y se re-ejecuta en `resize`; cada partícula guarda posición "caos" (`sx, sy`) y posición "orden" (ángulo sobre un anillo) y el draw interpola entre ambas con `easeInOut(progressRef.current)`. Núcleo verbatim de `metodologias/page.tsx:289-297`:

   ```tsx
   dpr = Math.min(window.devicePixelRatio || 1, 2);   // cap 2: nitidez suficiente
   canvas.width  = Math.round(canvas.clientWidth  * dpr);
   canvas.height = Math.round(canvas.clientHeight * dpr);
   ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
   const count = isMobileRef.current ? 130 : 320;      // presupuesto por dispositivo
   ```
   El progreso del scroll NO se calcula en el draw: lo escribe el listener de scroll en un ref (`giroProgressRef.current`) y el draw solo lo lee (`metodologias/page.tsx:158-165,322`).
9. **`prefers-reduced-motion` en canvas:** no arrancar el loop — dibujar **un único frame estático** con `p = 1` (estado final ordenado): `if (reduce) { draw(0); } else { raf = requestAnimationFrame(draw); }` (`metodologias/page.tsx:357-362`). Para el resto de la página, marcar todos los `.mt-reveal` como `is-in` de inmediato (`:64-68`).
10. **Jitter aleatorio throttled:** los efectos de "señal dañada" no corren a 60fps; dentro del loop rAF se ejecutan solo si `t - lastTick > 18` (o 28) ms. Ver `metodologias/page.tsx:234-257` y demo B `:465-479`.
11. **Medición de texto:** si hay que medir dónde termina un texto renderizado (para alinear otro elemento), usar `document.createRange()` + `range.selectNodeContents(el)` + `getBoundingClientRect()`, y ejecutarlo **después** de `document.fonts.ready.then(...)` y en cada `resize`. Ver `alignNav` en `SiteShell.tsx:107-124`.
12. **Cleanup completo del efecto:** `cancelAnimationFrame`, `removeEventListener`, y restaurar TODOS los estilos mutados — especialmente los de elementos compartidos fuera del componente (logo/texto del header) — o la siguiente página hereda un header invisible. Ver el return de `analitica/page.tsx:407-432`.

## 3. Activos copiables

Copias locales en `activos/` de esta skill (origen: `C:\Users\camil\Desktop\IA Raiz Proyectos\002 Desarrollos\DivergenteWEB`):

| Activo | Origen real | Qué es / cuándo copiar | Qué adaptar |
|---|---|---|---|
| `activos/metodologias-page.tsx` | `app/metodologias/page.tsx` | Página completa con: canvas ruido→anillo (partículas 130/320, dpr cap 2, reduced-motion 1 frame), secuencia sticky "Herramientas" (nodo+estela+contador+estaciones con `--vis`), 3 demos de texto scroll-driven (typewriter, entropía→claridad, slides), melt de letras con glitch, `HeroDataField` determinista. Copiar cuando se pida un momento signature o secuencia anclada. | Colores/fuentes, textos, alturas de wrappers (`220vh`), umbrales `MELT_START/DUR` |
| `activos/analitica-page.tsx` | `app/analitica/page.tsx` | Hero con crossfade línea1→línea2 letra a letra, melt con parámetros por primos, subrayados animados con flag one-way, acordeón scroll-driven con `setState` solo al cambiar índice, rama mobile con fórmula de altura documentada. Copiar para heros de texto animado por scroll. | Breakpoints de scroll (`LOGO_END`, `SLIDE_START`…), copy, paleta |
| `activos/SiteShell.tsx` | `app/components/SiteShell.tsx` | Shell con el contenedor `[data-scroll-container]`, medición de wordmark con Range API tras `document.fonts.ready`, fondo con drift automático + aporte del wheel/touch en rAF, fade de letras del label por scroll. Copiar como base de layout cuando el scroll vive en un div propio. | Rutas/NAV_ITEMS, logos, esquemas de color |
| `activos/mt-movimiento-respiracion.css` | `app/globals.css` líneas 942-1346 | Sistema de movimiento "Respiración": `.mt-reveal/.mt-rule` (IntersectionObserver), `@keyframes mt-breathe` con propiedad `scale` (el gotcha #1), `.mt-data-field/flicker`, toda la secuencia `.mt-tools-*` (rail, iris con `clip-path: circle(calc(var(--vis) * 52%))`, fallback apilado) y los demos `.da-/.db-/.dc-`. | Variables `--mt-*`, fuentes `var(--font-*)` |

No copiado (consultar en el proyecto fuente): `app/creatividad/page.tsx` (variante órbita con reduced-motion en CSS puro, `globals.css:911-940`).

## 4. Gotchas verificados

1. **`transform: scale()` en keyframes pisaba el `translate(-50%,-50%)` de centrado de los halos** → usar la propiedad CSS `scale` (independiente de `transform`): `@keyframes mt-breathe { 50% { scale: 1.06; } }`. Documentado en el comentario del propio CSS. Evidencia: `DivergenteWEB/app/globals.css:977-987`.
2. **`Math.random()` en render = hydration mismatch de Next.js** (el servidor y el cliente generan valores distintos) → pseudo-aleatoriedad determinista con hash de primos `((i*7919+2053)%97)/97`; el comentario de `HeroDataField` lo declara explícitamente: "Posiciones/valores deterministas (mismo render en servidor y cliente → sin mismatch de hidratación)". Evidencia: `DivergenteWEB/app/metodologias/page.tsx:1108-1159` y `app/analitica/page.tsx:213-242`.
3. **Closure obsoleto en rAF:** leer `isMobile` (useState) dentro del loop congela el valor del primer render; al rotar el teléfono el canvas seguía con conteo desktop → ref paralelo `isMobileRef` actualizado en `resize`, y el loop lee siempre `isMobileRef.current`. Evidencia: `DivergenteWEB/app/metodologias/page.tsx:36-58,297` y `app/analitica/page.tsx:19-35`.
4. **Medir texto antes de que cargue la fuente da rectángulos falsos** (paddings del nav calculados con la fuente fallback) → `document.fonts.ready.then(alignNav)` + re-medición en `resize`, midiendo con `document.createRange().selectNodeContents(wm)` en vez del rect del div (el div se estira; el Range mide el texto real). Evidencia: `DivergenteWEB/app/components/SiteShell.tsx:107-124`.
5. **El efecto oculta el logo/texto reales del header para el truco del clon; sin cleanup, al navegar a otra ruta el header quedaba invisible** → el return del `useEffect` restaura `opacity/transform/transition` de `[data-header-logo]` y `[data-header-text]` y todos los estilos de letras. Evidencia: `DivergenteWEB/app/analitica/page.tsx:407-432` y `app/metodologias/page.tsx:170-176`.
6. **En mobile el crossfade del hero no terminaba antes de que el acordeón entrara al viewport** (se pisaban) → altura del hero calculada con fórmula documentada en comentario: `accordion_enters_at = header + heroHeight - viewport > 480` ⇒ `minHeight = viewport + 560` (~45px de buffer). No usar valores mágicos sin dejar la derivación escrita. Evidencia: `DivergenteWEB/app/analitica/page.tsx:136-145`.
7. **Elementos que deben desaparecer una sola vez reaparecían al scrollear de vuelta** (subrayado "NO") → flag one-way `let noLineGone = false; ... if (noPL >= 1) noLineGone = true;` y el bloque se salta si el flag está activo. Evidencia: `DivergenteWEB/app/analitica/page.tsx:257-267,341-347`.
8. **Letras con `driftX` en el melt generaban scroll horizontal en la página** → `style={{ overflowX: "clip" }}` en el div raíz de la página (clip, no hidden: hidden crea un nuevo scroll container). Evidencia: `DivergenteWEB/app/metodologias/page.tsx:523`.
9. **IntersectionObserver registrado al montar se perdía elementos cuyo layout aún se estaba estabilizando** → segundo pase `setTimeout(() => observe(), 400)` que re-observa los `.mt-reveal:not(.is-in)` restantes. Evidencia: `DivergenteWEB/app/metodologias/page.tsx:84-87`.
10. **Jitter con `Math.random()` a 60fps es caro y visualmente exagerado** → dentro del loop rAF, el bloque de ruido solo corre si `t - lastNoise > 18` ms (28 ms en demo B), y cada letra tiene probabilidad (0.30/0.38) de "cortarse" en ese tick. Evidencia: `DivergenteWEB/app/metodologias/page.tsx:231-257,459-479`.
11. **`devicePixelRatio` sin tope cuadruplica los píxeles del canvas en pantallas 3x** (jank en móviles de gama alta) → `dpr = Math.min(window.devicePixelRatio || 1, 2)`. Evidencia: `DivergenteWEB/app/metodologias/page.tsx:290`.
12. **rAF que corre siempre aunque no haya nada que animar**: los loops de demos solo se montan cuando `!reduced && !isMobile` (guard al inicio del efecto, con deps `[reduced, isMobile]`), y el canvas con reduced-motion nunca agenda frames. Evidencia: `DivergenteWEB/app/metodologias/page.tsx:374-376,498-499`.

## 5. Criterios de done

- [ ] Durante el scroll no hay re-renders de React (verificar con React DevTools Profiler: 0 renders mientras se scrollea una sección animada; los estilos cambian por mutación directa).
- [ ] Con `prefers-reduced-motion: reduce` activado (emular en DevTools > Rendering): el canvas muestra un único frame estático en estado final, los reveals aparecen sin transición y no queda ningún rAF corriendo.
- [ ] En viewport ≤768px se renderiza el fallback (bloques apilados / conteo reducido de partículas), y al rotar/redimensionar el conteo y el layout se actualizan (ref, no closure).
- [ ] Sin scroll horizontal a 360px de ancho aunque las letras deriven fuera del cuadro (`overflowX: clip` verificado).
- [ ] Consola limpia de warnings de hidratación en el primer render de la página (ningún `Math.random`/`Date.now` en render).
- [ ] Navegar a otra ruta y volver deja header, títulos y subrayados en su estado normal (cleanup restaura todos los estilos mutados).
- [ ] Todo umbral de scroll es una constante nombrada (`MELT_START`, `LOGO_END`…) y toda fórmula no obvia tiene su derivación en comentario.
- [ ] Scroll fluido (~60fps) en un throttle 4x de CPU en DevTools sobre la sección más densa (canvas + melt simultáneos).
- [ ] Fila añadida al Registro de uso de esta skill.

## Registro de uso
| Fecha | Proyecto | Tarea | Resultado | Lección |
|---|---|---|---|---|
| histórico | DivergenteWEB | uso original (fuente de esta skill) | ok | - |
