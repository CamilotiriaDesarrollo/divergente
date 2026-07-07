---
name: docs-entregable-supuestos-y-placeholders
regimen: universal
description: Redacta el documento de acompañamiento a un build (supuestos con "cómo cambiarlo", variantes a elegir, imágenes y placeholders pendientes) para cerrar decisiones con el cliente y traspasar contexto al siguiente agente. Cárgala al terminar una página/feature con decisiones tomadas por defecto, contenido de muestra o assets faltantes, antes de entregar al Dueño o de pasar la posta a otra sesión.
---

# Entregable de supuestos y placeholders

**Nivel actual:** N2 · **Dominio:** docs · **Agente(s):** documentador
**Proyectos fuente:** DivergenteWEB

> Criterio de ascenso a N1: los 5 bloques completos, con activos copiables de ruta real y gotchas verificados (no genéricos). A N2: ≥1 uso real aceptado por el Dueño. A N3: ≥3 usos exitosos en ≥2 proyectos + checklist propio.

## 1. Propósito

Cuando un agente construye una página o feature, toma decenas de decisiones por defecto (qué H1, a qué canal salen los leads, qué variante de animación), deja contenido de muestra y sugiere assets que el cliente debe aportar. Si eso no se documenta, el cliente pregunta "¿dónde cambio esto?" y el siguiente agente no sabe qué es final y qué es placeholder → ida y vuelta y trabajo perdido.

Esta skill produce **un `.md` de acompañamiento por build** que hace ese contexto explícito y rastreable: qué se construyó (mapeado al roadmap), qué supuse y **cómo cambiarlo** (archivo + sección exactos), qué variantes puede elegir el cliente con su costo, qué imágenes crear (ruta en `/public` + concepto) y qué placeholders faltan (checkboxes). Reduce la ida y vuelta y convierte cada decisión en algo que el Dueño cierra en una pasada.

Se carga: al cerrar el DoD de una página/componente con decisiones abiertas; antes de una compuerta GO/NO-GO; o al traspasar una feature a medias a otra sesión/PC.

## 2. Procedimiento

Estructura el documento en 7 secciones numeradas (el orden importa: el cliente lee de arriba a abajo). Plantilla en `activos/PLANTILLA_SUPUESTOS_Y_PLACEHOLDERS.md`; ejemplo real completo en `activos/EJEMPLO_REAL_metodologias_DivergenteWEB.md`.

1. **Qué se construyó** — lista de lo entregado **mapeado 1:1 a las secciones numeradas del roadmap/blueprint** (p. ej. "las 8 secciones del roadmap 5.1–5.8: Hero · El Problema · El Giro…"). El cliente debe reconocer su propio roadmap. Incluye sistemas transversales (movimiento, theming) con el archivo donde viven.

2. **Cohesión con lo existente** *(opcional)* — solo si el build se apoya en trabajo previo: qué patrones replicaste y por qué (da confianza de que no rompiste la marca). Incluye el esquema de color bloqueado con sus hex reales.

3. **Supuestos tomados** — tabla `| # | Supuesto | Cómo cambiarlo |`. **Regla de oro: cada supuesto abierto lleva su "cómo cambiarlo" con archivo Y sección exactos** (`En page.tsx, sección HERO`). Los ya resueltos llevan `—` para que el cliente no re-litigue lo decidido. Cruza con el número de decisión del roadmap cuando exista (`decisión 11.6 del roadmap`).
   - Criterio: ¿el cliente podría querer otro valor? → es supuesto abierto, ubícalo. ¿Ya está cerrado por el stack o por decisión previa? → `—` y anota "(resuelto: …)".

4. **Imágenes sugeridas** — tabla `| Ubicación | Archivo sugerido | Qué debería mostrar |`. Cada fila: **ruta exacta en `/public/...` + concepto visual**. Marca explícitamente la pieza más importante. Distingue "opcional (hoy resuelto con CSS)" de imprescindible.

5. **Variantes de diseño** — lista numerada de alternativas para una decisión de diseño abierta. **Marca cuál está `(Implementada)`** y da el **costo de cambio** ("comparten el mismo motor de canvas; cambiar es ~10 líneas"). Sin costo, el cliente no puede sopesar.

6. **Placeholders pendientes** — lista de contenido real que falta, con **checkboxes `- [ ]`** (rastreables por ambas partes). Cada ítem dice el estado actual ("hoy hay 4 de muestra en `/conferencias`"). Marca los opcionales.

7. **Checklist de accesibilidad / performance** — `- [x]` lo garantizado, `- [ ]` lo pendiente. **Los pendientes deben ser medibles: umbral + acción**, nunca "revisar X" (ver Gotcha 4).

Criterios de decisión transversales:
- **Archivo por build, no por proyecto.** El nombre refleja el alcance (`METODOLOGIAS_SUPUESTOS.md`), vive en la raíz del repo del proyecto.
- **Verifica cada ruta que cites** (Grep/Read) antes de entregar: `page.tsx`, `globals.css`, `/public/mt/...`, el `href` de WhatsApp deben existir de verdad.
- **Datos personales fuera** (regla 4 de gotchas): al reusar/compartir la plantilla, redacta teléfonos, correos y nombres — el portafolio corre habeas data.

## 3. Activos copiables

- **`activos/PLANTILLA_SUPUESTOS_Y_PLACEHOLDERS.md`** — plantilla en blanco con las 7 secciones, comentarios `<!-- -->` de guía y los `<placeholders>` a rellenar. Cópiala a la raíz del repo del proyecto, renómbrala por el alcance (`<FEATURE>_SUPUESTOS.md`), rellena y borra los comentarios guía al entregar. Origen: derivada de `DivergenteWEB/METODOLOGIAS_SUPUESTOS.md`.
- **`activos/EJEMPLO_REAL_metodologias_DivergenteWEB.md`** — el entregable real completo (copia con el teléfono redactado). Úsalo como referencia de "cómo se ve uno bien hecho"; NO lo entregues tal cual (es de otro proyecto). Origen: `DivergenteWEB/METODOLOGIAS_SUPUESTOS.md`.
- **Fuente viva:** `C:\Users\camil\Desktop\IA Raiz Proyectos\002 Desarrollos\DivergenteWEB\METODOLOGIAS_SUPUESTOS.md` (83 líneas). Ábrelo si necesitas ver el original sin redacciones.
- **Contexto de patrón:** `DivergenteWEB/README.md` §"Decisiones de diseño documentadas" y §"Roadmap (lo que falta)" — muestran cómo este entregable se acompaña de un README con decisiones y un roadmap con checkboxes (documentación en capas; ver skill `docs-documentacion-en-capas`).

## 4. Gotchas verificados

1. **Supuesto sin "cómo cambiarlo" = supuesto muerto → provoca ida y vuelta.** En `METODOLOGIAS_SUPUESTOS.md` §3 cada fila abierta apunta al lugar exacto (`En page.tsx, sección HERO`; `Cambiar href si hay otro canal`). El cliente cambia el valor sin volver a preguntar. Si escribes "el H1 es provisional" sin decir dónde vive, generas una pregunta garantizada. Evidencia: `DivergenteWEB/METODOLOGIAS_SUPUESTOS.md` §3.
2. **Mezclar supuestos resueltos con abiertos hace que el cliente re-litigue lo ya decidido.** El doc marca `—` en "cómo cambiarlo" para los cerrados y anota el porqué (`#2 Stack = Next.js — resuelto: el sitio ya es Next 16`; `#5 Toggle de silencio: NO incluido, queda para v2`). Así el cliente solo gasta atención en lo genuinamente abierto. Evidencia: filas 2 y 5 de la tabla §3.
3. **Variante sin costo de cambio ni marca de "implementada" = decisión que el cliente no puede tomar.** §5 lista 3 variantes de "El Giro", marca `(Implementada) Anillo que respira` y cierra con "comparten el mismo motor de canvas; cambiar entre ellas es ~10 líneas". Sin ese costo el cliente no sabe si pedir otra variante es barato o caro. Evidencia: `METODOLOGIAS_SUPUESTOS.md` §5.
4. **"Pendiente: revisar performance/accesibilidad" no le sirve al siguiente agente; el pendiente debe ser medible (umbral + acción).** El checklist §7 no dice "revisar fps": dice "medir fps en móvil gama media (decisión 7) — si baja de 50fps, reducir partículas", y "revisar contraste de salvia `#7cc9a7` sobre crema en textos pequeños". Esos números están anclados a código real y verificado: `app/metodologias/page.tsx:297` (`const count = isMobileRef.current ? 130 : 320;`) y `:290` (`dpr = Math.min(window.devicePixelRatio || 1, 2);`). Evidencia: `METODOLOGIAS_SUPUESTOS.md` §7 + `DivergenteWEB/app/metodologias/page.tsx`.
5. **Imagen pendiente sin ruta en `/public` ni concepto = el cliente manda un JPG suelto y no sabes dónde va.** §4 da `/public/mt/camilo-tarima.jpg` + "Foto en tarima (la pieza visual más importante)". El cliente suelta el archivo en la ruta correcta y sabe qué fotografiar. Evidencia: tabla §4 de `METODOLOGIAS_SUPUESTOS.md`.
6. **Copiar el entregable como plantilla arrastra datos personales.** El original incrusta el teléfono real del cliente en el supuesto de leads (`wa.me/...`, verificado en `app/components/SiteShell.tsx:370` y `app/metodologias/conferencias/page.tsx:127,429`). Al llevar el doc a `activos/` de una skill compartida, ese número se redactó a `<numero-redactado>` — el portafolio corre habeas data (skill `seg-habeas-data-implementacion`). Redacta teléfonos/correos/nombres antes de reusar. Evidencia: comparación `METODOLOGIAS_SUPUESTOS.md` §3 fila 4 vs. `activos/EJEMPLO_REAL_...md`.

> Nota de alcance (dudas): la fuente directa de esta skill es **un** entregable real (`METODOLOGIAS_SUPUESTOS.md`, aceptado en DivergenteWEB → N2). Los "errores y soluciones" del proyecto fuente pertenecen a otras skills (scraping, matching); los gotchas de arriba se derivan de las decisiones reales tomadas en este documento y de código verificado, no de un histórico de fallos de este formato. Sube a N3 tras usarlo en ≥2 proyectos.

## 5. Criterios de done

- [ ] Existe un `.md` en la raíz del repo nombrado por el alcance del build (p. ej. `<FEATURE>_SUPUESTOS.md`).
- [ ] §1 mapea lo construido **1:1 a las secciones numeradas del roadmap/blueprint** del proyecto.
- [ ] Cada fila de la tabla de supuestos (§3) tiene "cómo cambiarlo" con **archivo + sección exactos**, o `—` si está resuelto (con el porqué anotado).
- [ ] Cada supuesto/pendiente cruzado con su **número de decisión del roadmap** cuando exista.
- [ ] Cada variante de diseño (§5) indica **cuál está implementada** y su **costo de cambio** (líneas/horas).
- [ ] Cada imagen pendiente (§4) tiene **ruta en `/public` + concepto visual**; la pieza clave está marcada.
- [ ] Los placeholders (§6) usan **checkboxes `- [ ]`** y anotan el estado actual ("hoy N de muestra").
- [ ] El checklist a11y/perf (§7) tiene pendientes **medibles** (umbral + acción), no "revisar X".
- [ ] **Todas las rutas citadas existen** (verificadas con Grep/Read): archivos, `/public/...`, `href`.
- [ ] **Sin datos personales** si el doc se comparte fuera del repo del cliente (teléfonos/correos redactados).

## Registro de uso
| Fecha | Proyecto | Tarea | Resultado | Lección |
|---|---|---|---|---|
| histórico | DivergenteWEB | uso original (fuente de esta skill) | ok | - |
