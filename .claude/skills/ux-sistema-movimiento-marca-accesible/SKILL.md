---
name: ux-sistema-movimiento-marca-accesible
regimen: divergente
description: Construye un lenguaje de movimiento de marca como sistema CSS reutilizable (clases .mt-*) con neutralización total por prefers-reduced-motion. Cárgala al diseñar reveals de scroll, líneas que se dibujan, halos que "respiran" o cualquier microinteracción de marca, y siempre que una página con animación deba pasar accesibilidad de movimiento (WCAG 2.3.3 / NTC5854).
---

# UX · Sistema de movimiento de marca accesible ("Respiración")

**Nivel actual:** N2 · **Dominio:** ux · **Agente(s):** `front-visualizaciones` (también consumible por `disenador-uiux` y `front-formularios-a11y`)
**Proyectos fuente:** DivergenteWEB (`/metodologias`, `/metodologias/conferencias`)

> Criterio de ascenso a N1: los 5 bloques completos, con activos copiables de ruta real y gotchas verificados (no genéricos). A N2: ≥1 uso real aceptado por el Dueño. A N3: ≥3 usos exitosos en ≥2 proyectos + checklist propio.

## 1. Propósito

Resuelve el problema de que las animaciones de una web de marca se hagan una a una, incoherentes entre sí y —lo más grave— sin salida para usuarios con `prefers-reduced-motion`, dejando la página **en blanco** cuando el motor de movimiento se apaga.

En vez de eso define un **sistema pequeño de clases utilitarias `.mt-*`** con una sola curva firma (`--breathe-ease`), unas pocas primitivas (reveal, línea que se dibuja, halo que respira, pulso, hover calmado) y **un único activador JS** por `IntersectionObserver`, más un bloque `@media (prefers-reduced-motion: reduce)` que colapsa todo a "aparición instantánea". La regla editorial: **un solo momento fuerte por página** ("El Giro" en Divergente); el resto es respiración de fondo.

Se carga cuando: se diseña o construye una landing con reveals de scroll; hay que dar identidad de movimiento a una marca; se audita accesibilidad de movimiento; o se replica el gesto entre páginas de un mismo sitio.

## 2. Procedimiento

1. **Copia el CSS base** de `activos/respiracion-sistema.css` a los estilos globales del proyecto (en Divergente: `app/globals.css`). Renombra los tokens de color (`--mt-green`, `--mt-sage`, `--mt-cream`, `--mt-accent`) a la paleta de la marca destino. **No toques la curva** `--breathe-ease: cubic-bezier(0.22, 1, 0.36, 1)` — es la firma "inhala rápido, exhala largo, sin rebote".

2. **Elige el momento fuerte de la página.** Criterio editorial verificado: exactamente **uno** (en `/metodologias` es "El Giro" = campo de ruido que se aquieta en un anillo que respira). Todo lo demás usa solo las primitivas de fondo. Si te piden un segundo clímax, súbelo como decisión abierta al blueprint, no lo agregues por defecto.

3. **Marca el contenido con las clases utilitarias en el JSX:**
   - Texto/bloques que aparecen al hacer scroll → `className="mt-reveal"`.
   - Divisores entre secciones → `<span className="mt-rule" />`.
   - Forma orgánica de fondo del momento fuerte → `className="mt-breathe"`.
   - Punto/indicador vivo → `className="mt-pulse"`.
   - El **stagger** (cascada) se hace con `style={{ transitionDelay: "0.15s" }}` inline, **no** con clases distintas por elemento. Valores reales usados: `0.15s / 0.3s / 0.55s` en secuencias fijas, o `${i * 0.16}s` / `${0.1 + i * 0.12}s` en listas mapeadas.

4. **Pega el activador JS** de `activos/reveal-observer.tsx` en el componente de página (`"use client"`). Es el hook `useRespiracion()`: lee `matchMedia("(prefers-reduced-motion: reduce)")` en un `ref`, y monta un `IntersectionObserver` con `threshold: 0.08, rootMargin: "0px 0px -4% 0px"` que añade `.is-in` una sola vez (`io.unobserve`). Reglas de decisión embebidas:
   - Si `reduceMotion` está activo → añade `.is-in` a **todos** los `.mt-reveal/.mt-rule` de una y **no** crea observer.
   - Re-ejecuta `observe()` a **400 ms** con `setTimeout` para rescatar elementos que en el primer paint aún no existían o cuyo layout no se había estabilizado (fuentes/imágenes).

5. **Provee el fallback estático.** El hook devuelve `reduced`; úsalo para elegir JSX: `{isMobile || reduced ? <FallbackEstatico/> : <VersionAnimada/>}`. Las secuencias ancladas por scroll (sticky + `requestAnimationFrame`) deben tener **siempre** una versión apilada. Patrón real: `if (reduced || isMobile) return;` como primera línea de cada `useEffect` de scroll.

6. **Verifica la neutralización** activando reduced motion en el SO/DevTools: la página debe verse completa y quieta, sin partículas ni parallax, y **sin ningún `.mt-reveal` invisible**.

## 3. Activos copiables

- **`activos/respiracion-sistema.css`** — el sistema completo de clases `.mt-*` (tokens, `mt-reveal`, `mt-rule`, `@keyframes mt-breathe`/`mt-pulse`, `mt-card` hover, y el bloque `@media (prefers-reduced-motion)` que lo neutraliza). Origen: `DivergenteWEB/app/globals.css` líneas ~942-1225. Copiar entero; adaptar solo los 4 tokens de color. **Conservar** la curva y el ciclo de 8s.
- **`activos/reveal-observer.tsx`** — hook `useRespiracion()` con el `IntersectionObserver` y el guard de reduced motion. Origen: `DivergenteWEB/app/metodologias/page.tsx` líneas ~34-88. Pegar en la página cliente; ajustar `threshold`/`rootMargin` solo si el diseño lo pide (ver Gotcha 4).
- **Referencia de aplicación real (no copiar, leer):** `DivergenteWEB/app/metodologias/page.tsx` — muestra el stagger inline, el fallback `isMobile || reduced`, y las secciones sticky con `rAF`. `DivergenteWEB/app/metodologias/conferencias/page.tsx` (líneas ~19-48) muestra el **mismo** sistema replicado en una sub-página con valores de observer distintos.
- **Documento de decisiones/supuestos:** `DivergenteWEB/METODOLOGIAS_SUPUESTOS.md` §1, §5 y §7 — justifica la regla del momento único, las variantes de "El Giro" y el checklist de accesibilidad/performance.

## 4. Gotchas verificados

- **El halo dejaba de estar centrado al animar `transform`.** Los halos se centran con `transform: translate(...)`; animar `transform: scale()` en el `@keyframes` pisaba ese translate y el halo se descolocaba. Solución real: animar la **propiedad `scale`** (independiente de `transform`), no `transform: scale()`. Evidencia: `globals.css` `@keyframes mt-breathe` (`scale: 1 → 1.06`, con comentario explícito "para no pisar el translate de centrado"). El `mt-pulse`, que NO está centrado con transform, sí usa `transform: scale()` sin problema.

- **La página quedaba en blanco con reduced motion.** `.mt-reveal` arranca en `opacity: 0`; el JS es quien añade `.is-in`. Si el usuario tiene `prefers-reduced-motion`, el observer no se monta y sin más nada el contenido nunca aparece. Doble salvaguarda verificada: (a) en el JS, si `reduceMotion.current` → añadir `.is-in` a todos de una (`page.tsx` líneas 64-67); (b) en el CSS, el bloque `@media (prefers-reduced-motion)` fuerza `opacity:1 !important; transform:none !important`. Hay que tener **las dos**: el CSS cubre el caso de que el JS no llegue a correr.

- **Reveals que nunca disparaban en el primer paint.** Con fuentes/imágenes cargando, algunos `.mt-reveal` no existían o su layout no estaba estable cuando se creó el observer, y se perdían. Solución real: segunda pasada `setTimeout(() => observe(), 400)` que vuelve a observar los `:not(.is-in)` restantes. Evidencia: `page.tsx` líneas 84-87.

- **Los valores de `threshold`/`rootMargin` son por-página, no universales.** `/metodologias` usa `threshold: 0.08, rootMargin: "-4%"` con re-observación a 400ms; la sub-página `/metodologias/conferencias` usa `threshold: 0.18, rootMargin: "-8%"` y **sin** el `setTimeout`. Al replicar, copia el patrón pero re-calibra estos números al layout concreto; no asumas que 0.08 sirve en todas partes. Evidencia: comparar `metodologias/page.tsx:78` vs `conferencias/page.tsx:44`.

- **Animar por scroll continuo es caro; el reveal no.** Las apariciones van por `IntersectionObserver` (barato, dispara una vez y `unobserve`), reservando `requestAnimationFrame` + scroll solo para el momento fuerte y las secuencias sticky. Además esas secuencias hacen `if (reduced || isMobile) return;` de entrada. Evidencia: `METODOLOGIAS_SUPUESTOS.md` §7 ("Animaciones por IntersectionObserver, no por scroll continuo costoso") y los guards en `page.tsx:375,424,450,499`.

## 5. Criterios de done

- [ ] Existe un único `--breathe-ease` y todas las transiciones/animaciones del sistema lo usan; ningún movimiento tiene rebote/overshoot.
- [ ] Hay **exactamente un** momento fuerte por página; el resto es respiración de fondo.
- [ ] Con `prefers-reduced-motion: reduce` activo: la página se ve **completa y quieta**, sin ningún `.mt-reveal` invisible, sin partículas ni parallax (verificado en DevTools → Rendering → Emulate CSS prefers-reduced-motion).
- [ ] Existe la doble salvaguarda: guard en el JS (añade `.is-in` a todos) **y** bloque `@media (prefers-reduced-motion)` en el CSS.
- [ ] Todo `.mt-reveal` que entra al viewport dispara una sola vez (`unobserve`); ninguno queda oculto tras cargar fuentes/imágenes (re-observación a 400ms presente si el layout es tardío).
- [ ] Toda sección sticky animada por scroll tiene fallback apilado para móvil y reduced motion (`if (reduced || isMobile) return;`).
- [ ] Halos centrados animan la propiedad `scale`, no `transform: scale()`.
- [ ] El stagger se hace con `transitionDelay` inline, sin proliferación de clases por elemento.

## Registro de uso
| Fecha | Proyecto | Tarea | Resultado | Lección |
|---|---|---|---|---|
| histórico | DivergenteWEB | Uso original (fuente de esta skill): sistema "Respiración" en `/metodologias` y `/metodologias/conferencias` con neutralización por prefers-reduced-motion | ok | - |
