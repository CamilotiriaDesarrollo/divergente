---
name: pm-blueprint-decisiones-abiertas-agentes
regimen: universal
description: Metodología "plan antes que código" para dirigir agentes de build con un blueprint que numera las decisiones abiertas y las cierra con el Dueño ANTES de construir. Cárgala al arrancar un proyecto o una fase nueva, al despachar misiones a subagentes ("Fase X, componente Y, según blueprint §Z"), cuando un agente topa con una decisión de arquitectura que no puede inventar, o al montar la revisión cruzada (revisor ≠ constructor).
---

# Blueprint con decisiones abiertas para dirigir agentes

**Nivel actual:** N2 · **Dominio:** Gestión de Proyectos (pm) · **Agente(s):** `gerente-proyecto`
**Proyectos fuente:** Scraper-Empleos (`BLUEPRINT_LANDING.md`, rediseño de la landing "Radar de Oportunidades")

> Criterio de ascenso a N1: los 5 bloques completos, con activos copiables de ruta real y gotchas verificados (no genéricos). A N2: ≥1 uso real aceptado por el Dueño. A N3: ≥3 usos exitosos en ≥2 proyectos + checklist propio.

## 1. Propósito

Evitar el "vibe-coding" sin plan: en vez de que los agentes construyan "a ojo" y se rompa todo mañana, se escribe **un único documento blueprint que es la fuente de verdad del proyecto** y contra el cual trabajan todos los agentes. Su idea central: las decisiones que aún no están tomadas **no se inventan** — se numeran en una tabla de "decisiones abiertas" y las cierra el Dueño (Camilo) antes de tocar código de esa fase.

Se carga cuando:
- Arranca un proyecto o una fase nueva y hay que ordenar visión → arquitectura → fases → DoD.
- Se despachan misiones a subagentes de build (cada misión cita "Fase X, componente Y, según blueprint §Z").
- Un agente topa con una decisión de arquitectura/UX que no le corresponde inventar (persistencia, patrón de menú, criterio de negocio).
- Hay que montar la revisión cruzada: un subagente revisor **distinto** al que construyó valida responsive, interacción y a11y.

Evidencia viva de que funciona: en Scraper-Empleos este método permitió ejecutar las Fases 0–5 en una sola pasada con build verde y un solo ciclo de fixes del revisor (`BLUEPRINT_LANDING.md` §13, entrada 2026-06-11 "EJECUTADAS Fases 0–5").

## 2. Procedimiento

El blueprint real (`ejemplo-BLUEPRINT_LANDING.md` en `activos/`) tiene 13 secciones. El esqueleto operativo son 5 piezas; el resto (visión, mapa UX, estrategia por breakpoints) es relleno de dominio.

1. **Encabezado + §0 "Cómo usar este blueprint".** Fija las 4 reglas del contrato, copiadas literales del proyecto fuente:
   1. Cada **Fase** tiene: objetivo, entregable, criterio de "hecho" (DoD) y qué agentes la ejecutan.
   2. Las **decisiones abiertas** (§9) se cierran con el Dueño antes de tocar código de esa fase.
   3. Los agentes trabajan contra el doc: un build-agent recibe "Fase X, componente Y, según blueprint §Z".
   4. **Ningún agente inventa arquitectura:** si necesita una decisión, la sube a la tabla.
   Regla de oro del encabezado: *"Si algo no está en el blueprint, no se construye 'a ojo'."*

2. **Visión + arquitectura de información (§1–§3).** Qué es, para quién, y el modelo de datos que será *"una sola fuente de verdad"* (en el fuente: `config/perfiles.json` alimenta a la vez la UI y el matcher Python). Criterio de decisión: si agregar una variante obliga a recablear UI, el diseño está mal — debe ser **data-driven** (editar datos, no código).

3. **Tabla de decisiones abiertas (§9) — el corazón del método.** Una fila por decisión que bloquearía construir bien. Columnas del fuente: `# | Decisión | Resuelto | Estado` (⬜ abierta / ✅ cerrada). La versión canónica de la fábrica (`plantillas/BLUEPRINT.md` §5) añade `Opciones | Recomendación (quién) | Cerrada por / fecha` para trazabilidad — úsala en proyectos de cliente.
   - **Criterio de qué entra a la tabla:** todo lo que un agente tendría que *asumir* para avanzar (persistencia, patrón de UI, definición de negocio, orden de migración). Ejemplos reales cerrados en el fuente: A) persistencia de edición con export estático; B) patrón de menú móvil; C) definición de "nueva por revisar"; D) criterio de "destacado"; F) orden de migración de keywords.
   - **Criterio de bloqueo por alcance (clave):** una decisión abierta bloquea **solo las fases que dependen de ella**, no todo el proyecto. En el fuente, la decisión E (definir 3 perfiles nuevos) quedó ⬜ abierta pero anotada *"bloquea Fase 6, no Fase 0–5"* — el resto se construyó igual dejando esos perfiles como `inactivos` en el JSON.
   - Cada agente que se bloquea marca su misión visiblemente y **sube la fila**; no adivina.

4. **Plan de ejecución por fases (§10) con DoD por fase.** Cada fase: objetivo, entregable y DoD *verificable* (no opinable). Regla del fuente: **Fase 0 = fundaciones antes de cualquier pixel** (design tokens en una sola fuente, el JSON de datos esquematizado, inventario de componentes con contratos de props). DoD de ejemplo real: *"tokens definidos, perfiles.json esquematizado, build verde, TS sin errores"* (§10 Fase 0); *"navegable y usable en 360–430px; Lighthouse móvil > 90; revisor aprueba"* (Fase 1).

5. **Despacho de misiones + revisión cruzada.** Cada misión se despacha con la plantilla `plantillas/MISION.md`: referencia textual al §, componente concreto, skills a cargar, DoD y **revisor asignado ≠ constructor**. Al cerrar la fase, un subagente revisor independiente valida responsive + interacción + a11y + performance (§10 Fase 4) *antes* de avanzar. El constructor no aprueba su propio trabajo.

6. **Bitácora de decisiones fechada (§13).** Cada decisión cerrada se registra con fecha y su porqué, para poder volver a ella. También se anota qué encontró el revisor. Esto convierte el blueprint en el registro auditable del proyecto, no solo en un plan inicial.

## 3. Activos copiables

- **`activos/ejemplo-BLUEPRINT_LANDING.md`** — el blueprint real y completo de Scraper-Empleos (origen: `C:\Users\camil\Desktop\IA Raiz Proyectos\002 Desarrollos\Scraper-Empleos\BLUEPRINT_LANDING.md`). Es el mejor modelo: muestra las 13 secciones rellenas, la tabla §9 con 6 decisiones (5 cerradas + 1 abierta con bloqueo acotado), las 7 fases con DoD (§10) y la bitácora fechada (§13). **Cuándo copiarlo:** al iniciar cualquier proyecto con front/UI. **Qué adaptar:** §1–§8 (visión, perfiles, mapa UX, breakpoints) son de ese dominio; conserva intactos §0 (las 4 reglas), la estructura de §9 (tabla), §10 (fases + DoD) y §13 (bitácora).
- **`plantillas/BLUEPRINT.md`** (en la fábrica: `C:\...\FABRICA DE SOFTWARE\plantillas\BLUEPRINT.md`) — plantilla en blanco canónica. Su §5 "Tabla de decisiones abiertas — SOLO el Dueño las cierra" es la versión con trazabilidad (`Opciones | Recomendación | Cerrada por / fecha`). **Cuándo:** proyectos de cliente donde importa la auditoría de quién cerró qué. **Qué adaptar:** llenar MoSCoW (§2), stack (§3) y checklists normativos (§7) si es estatal.
- **`plantillas/MISION.md`** (`C:\...\FABRICA DE SOFTWARE\plantillas\MISION.md`) — plantilla de despacho de misión que materializa "Fase X, componente Y, según blueprint §Z": cita textual del §, DoD verificable, revisor ≠ constructor, y el cierre que llena el revisor. **Cuándo:** cada misión despachada contra el blueprint. **Qué adaptar:** el id `PROYECTO-Fx-nnn`, el constructor y el revisor.

## 4. Gotchas verificados

- **Export estático no persiste ediciones de UI a disco.** En el fuente la landing es Next.js con `output: 'export'`; se quiso permitir editar el perfil desde la UI, pero un estático no escribe server-side. El agente **no inventó** una micro-API: subió la decisión A a §9 y el Dueño la cerró como *"editar en UI → exportar `perfiles.json` (botón que descarga el JSON) → reemplazar en el repo → re-scrapear"* (cero infra). Evidencia: `ejemplo-BLUEPRINT_LANDING.md` §2.1 (nota "Decisión arquitectónica §9-A"), §9 fila A, §13 entrada 2026-06-11 A. **Lección:** una restricción del stack (estático = sin escritura) es exactamente lo que va a la tabla, no un parche improvisado.

- **Bloquear todo el proyecto por una decisión que solo afecta una fase.** La decisión E (quiénes son y qué scrapean los 3 perfiles nuevos) quedó abierta, pero se anotó explícitamente *"bloquea Fase 6, no Fase 0–5"*. Se ejecutaron las Fases 0–5 dejando esos perfiles como `inactivos` en `perfiles.json`, listos para activar. Evidencia: §9 fila E, §10 Fase 6, §13 "Pendiente — Fase 6". **Lección:** acota el bloqueo a las fases dependientes; no congeles el avance por una decisión de una fase futura.

- **Que el constructor "revise" su propio trabajo deja pasar bugs de a11y/interacción/lógica.** En el fuente construyó un subagente y revisó **otro distinto**; ese revisor encontró y forzó fixes concretos que el build había dejado pasar: `focus-visible` global, focus-trap + `inert` del drawer, aria-labels, `role="group"`, área táctil ≥40px, validar el perfil que llega por URL, resetear filtros al cambiar de perfil, y un KPI "nuevas" deshabilitado cuando es 0. Evidencia: `ejemplo-BLUEPRINT_LANDING.md` §13, última entrada 2026-06-11. **Lección:** el DoD de cada fase (§10 Fase 4, §11) exige *"responsive verificado por un agente distinto al que construyó"* — no es burocracia, es lo que atrapa estos defectos.

- **Depender de `color-mix()` para colores derivados.** El build usó `color-mix` para el color suave del acento por perfil; el revisor lo cambió a un color sólido *"sin depender de color-mix"* por soporte/consistencia. Evidencia: §13 última entrada ("colorSuave sólido sin depender de color-mix"). **Lección:** en export estático que debe ser robusto, evita features CSS de borde; el revisor las va a marcar.

- **Migrar la config de golpe rompe lo que ya funciona.** Se iba a mover las keywords de match de `matcher.py`/`perfil_keywords.py` a `perfiles.json`. Hacerlo todo de una habría roto el matcher operativo. Decisión F: migración **gradual** — esquema del JSON en Fase 0, switch real en Fase 5, con `perfil_keywords` extendiendo su gate de forma *conservadora*. Evidencia: §9 fila F, §13 entrada 2026-06-11 F. **Lección:** cuando algo ya corre en producción, la migración es una decisión abierta con orden por fases, no un big-bang.

## 5. Criterios de done

- [ ] Existe un blueprint único con encabezado + §0 "cómo usar" (las 4 reglas), y está declarado como fuente de verdad del proyecto.
- [ ] La tabla de decisiones abiertas existe y numera **toda** decisión sin cerrar; cada una tiene estado (⬜/✅) y, si está abierta, el alcance de su bloqueo (qué fase(s) frena).
- [ ] Ninguna decisión de arquitectura fue inventada por un agente: cada duda quedó como fila en la tabla (comprobable revisando misiones bloqueadas vs. filas de §9).
- [ ] Cada fase del plan tiene DoD **verificable** (build/lint/tests, umbral medible, "revisor aprueba"), no opinable.
- [ ] Las misiones se despacharon citando "§ del blueprint" con revisor asignado **≠ constructor** (plantilla `MISION.md`).
- [ ] La revisión cruzada (responsive + interacción + a11y + performance) la hizo un agente distinto y sus hallazgos se resolvieron antes de avanzar de fase.
- [ ] La bitácora (§13) registra cada decisión cerrada con fecha y porqué, y lo que encontró el revisor.

## Registro de uso
| Fecha | Proyecto | Tarea | Resultado | Lección |
|---|---|---|---|---|
| histórico | Scraper-Empleos | uso original (fuente de esta skill) — blueprint de la landing "Radar de Oportunidades" con §9 decisiones abiertas, §10 fases+DoD, §13 bitácora; Fases 0–5 en una pasada + fixes del revisor | ok | - |
