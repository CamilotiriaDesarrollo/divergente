---
name: div-pm-plan-release-propio-dod
regimen: divergente
description: Estructura un plan de release por hitos para un producto propio de Divergente (stack Node/Next/Vercel/Postgres) con Definition of Done propio y compuertas ligeras GO/NO-GO que decide el Dueño, enfocado en time-to-market. Cargar cuando haya que convertir una idea o maqueta de marca propia en una hoja de ruta a producción en Vercel, definir el DoD de un release divergente, secuenciar hitos MVP→v1, o poner las compuertas de lanzamiento de un producto propio (sin aparato normativo estatal).
---

# Plan de release por hitos con GO/NO-GO ligero (producto propio)

**Nivel actual:** N0 · **Dominio:** Gestión de Proyectos · **Agente(s):** gerente-proyecto
**Proyectos fuente:** ninguno — creada desde buenas prácticas (hermana divergente de `pm-plan-fases-go-nogo-produccion`)

> Criterio de ascenso a N1: los 5 bloques completos, con activos copiables de ruta real y gotchas verificados (no genéricos). A N2: ≥1 uso real aceptado por el Dueño. A N3: ≥3 usos exitosos en ≥2 proyectos + checklist propio.

## 1. Propósito

Convertir una idea, una maqueta o un handoff de un **producto propio de Divergente** en una **hoja de ruta a producción por hitos**, optimizada para **time-to-market de marca propia** y desplegada en el stack divergente (Node · Next.js · Vercel · Postgres gestionado). Cada hito cierra con una compuerta ligera GO/NO-GO que **decide el Dueño mirando un preview deploy**, y el criterio de "listo" no lo dicta ninguna entidad: lo dicta un **Definition of Done propio** escrito una sola vez y reusado en cada release.

Es la **hermana divergente** de `pm-plan-fases-go-nogo-produccion`. Conserva su núcleo reutilizable —plan por hitos, hitos de salida verificables, compuertas GO/NO-GO, prácticas transversales con cadencia, riesgos con mitigación— y **le quita todo el aparato estatal**:

- Fuera las **etiquetas normativas citables** (C1–C18 de P-GSI-003, L1–L14 de DI-GSI-010, A1–A10 de M-GSI-002): el producto propio se rige por su DoD, no por códigos de una OTI.
- Fuera la **Fase 0 de radicación y viabilidad de comité** (formato F-GSI-007, acta de homologación tecnológica): un producto propio no pide permiso para existir.
- Fuera los **trámites de largo lead-time del Estado** (capacidad de cómputo de un datacenter con ≥2 meses de anticipación, Comité de Control de Cambios solo los jueves, congelamiento 15 dic–15 ene): en divergente el provisioning de Vercel/Postgres es de minutos.
- Fuera el **go-live como cambio formal ITIL** y el **veto normativo de `cumplimiento-normativo`**: el Dueño aprieta el GO directamente.
- Fuera las **14–16 semanas ante una Oficina de TI**: el horizonte lo fija el time-to-market de la marca.

No cubre: la mecánica del monorepo/despliegue en Vercel (skill `devops-monorepo-client-server-vercel`), el pipeline de CI (skill `devops-cicd-github-gitlab`), la estrategia de testing (skill `qa-estrategia-testing-piramide`) ni la analítica de producto (skill `negocio-analitica-producto`). Esta skill los **orquesta** en un plan por hitos con compuertas ligeras.

## 2. Procedimiento

Referencia de estructura completa: `activos/PLAN_DE_RELEASE.template.md` + `activos/DEFINITION_OF_DONE.template.md`. Los pasos siguientes explican cómo instanciarlos.

### Paso 1 — Fijar el objetivo de negocio y el criterio de éxito (no un marco normativo)
Donde el plan institucional inventaría políticas del cliente, aquí se escribe una frase de propuesta de valor, **una métrica de éxito del release** (p. ej. "landing en producción con CTA a WhatsApp", "primeros N signups"), la **fecha objetivo de time-to-market** y —crítico— una lista explícita de **"fuera de alcance"** que blinda el cronograma contra el scope creep. La fecha es dura pero la mueve el Dueño, no un comité.

### Paso 2 — Escribir el Definition of Done propio (reemplaza las etiquetas citables)
El institucional cita códigos normativos al inicio de cada paso; el divergente define **un DoD propio de la marca** una sola vez y lo reusa. Instanciar `activos/DEFINITION_OF_DONE.template.md`: build/lint/typecheck en verde, tests de la ruta crítica, `npm audit` sin altas sin mitigar, **preview deploy aprobado por el Dueño**, presupuesto de performance (Lighthouse móvil), a11y básica, secretos solo en env de Vercel, analítica instrumentada. Regla dura: **sin DoD escrito, "done" se negocia cada release y el time-to-market se diluye**.

### Paso 3 — Estructurar los hitos (ligero: 3–4 hitos, no 7 fases estatales)
Usar la secuencia de la plantilla, adaptando el número de hitos al tamaño del producto:

| Hito | Foco | Regla de arranque |
|---|---|---|
| **H0** Fundamentos | Repo, CI mínimo (lint+build por PR), proyecto en Vercel, BD Postgres provisionada, `.env.example`, DoD acordado | *Las buenas prácticas se instauran antes de tocar producto; pero sin comité que las apruebe* |
| **H1** MVP navegable | Pantallas principales con datos estáticos tipados (patrón "backend durmiente"), identidad de marca | Meta: el Dueño navega el flujo end-to-end en el preview |
| **H2** Datos reales | Postgres gestionado (pooler serverless), migraciones, seed, captura/lectura real | Corre sobre el MVP ya aprobado |
| **H3** Pulido + lanzamiento | Performance, a11y, SEO/OG, analítica, dominio propio, promote to Production | *Único go-live; lo aprieta el Dueño* |

Numerar cada paso `H.N` (0.1, 0.2, …). **Ningún paso lleva etiqueta normativa**: el gate de cada paso es el DoD del Paso 2.

### Paso 4 — Secuenciar dependencias externas por su lead-time REAL
El cuello de botella divergente no es capacidad de cómputo estatal; casi todo (cuenta Vercel, provisioning de Postgres) es de minutos. Los lead-times reales a vigilar: **dominio + DNS** (horas–días de propagación), **claves de API de terceros** (verificación de cuenta), y sobre todo los **copys/imágenes/decisiones de marca del Dueño**, que son el verdadero cuello de botella. Regla: pedir los assets del Dueño en H0, no en H3, y trabajar con placeholders marcados mientras llegan.

### Paso 5 — Definir el hito de salida verificable de cada hito (compuerta)
Cada hito cierra con una condición, no una fecha: **un preview deploy que cumple el DoD**. Ejemplos: H0 "un PR de prueba genera preview verde automáticamente"; H1 "el Dueño navega el preview end-to-end y aprueba"; H2 "el flujo crítico corre contra la BD de Preview"; H3 "producción en el dominio propio cumpliendo el DoD".

### Paso 6 — Añadir las prácticas transversales con cadencia (ligeras)
Tabla `Práctica | Cadencia`: preview deploy **por PR**; demo al Dueño **por hito**; revisión de analítica **semanal tras lanzar**; `npm audit`/deps **semanal en CI**; actualización del `CLAUDE.md`/README del producto **por PR relevante**. Sin mesa de trabajo con acta quincenal ni Manual Maestro: el equipo es pequeño y el Dueño está en el loop.

### Paso 7 — Dibujar el calendario y numerar los GO/NO-GO ligeros
Gantt ASCII simple por semanas, y debajo una lista **numerada de puntos de decisión que decide el Dueño** (no un CCC): GO/NO-GO #1 al fin de H1 (¿el MVP merece invertir en datos reales? — seguir/pivotar/cortar alcance) y GO/NO-GO #2 al fin de H3 (**promote to Production**). Aviso clave: **compuerta ligera ≠ compuerta ausente** — sin un GO explícito del Dueño no se promueve a producción.

### Paso 8 — Cerrar con riesgos numerados con mitigación explícita
Formato `enunciado → consecuencia → **Mitigación:**` con puntero al paso que lo cubre. Los riesgos divergentes giran en torno al time-to-market y al stack, no a la norma: scope creep sin corte, assets del Dueño tarde, conexiones de Postgres agotadas en serverless, "preview verde" confundido con producción, lanzar sin analítica. Nunca dejar un riesgo sin su paso mitigador.

## 3. Activos copiables

Ambos en `activos/` de esta skill. **Son plantillas, no rutas de proyecto real:** ningún producto divergente ha ejercitado aún esta skill (nivel N0), así que se entregan como pautas a instanciar, no como archivos extraídos de un proyecto fuente.

| Activo | Qué es | Cuándo copiarlo / qué adaptar |
|---|---|---|
| `activos/PLAN_DE_RELEASE.template.md` | **La plantilla maestra.** Plan de release por hitos: objetivo y métrica de éxito, DoD resumido, tabla de hitos H0–H3 con hito de salida, dependencias con lead-time real, transversales con cadencia, Gantt ASCII, GO/NO-GO ligeros del Dueño y riesgos con mitigación | Base de todo release de producto propio. Adaptar: nombre y propuesta de valor, número de hitos, alcance/fuera de alcance, dependencias de terceros reales |
| `activos/DEFINITION_OF_DONE.template.md` | **El DoD propio** que reemplaza los checklists normativos codificados del régimen institucional: build/lint/tests, seguridad de secretos, performance, a11y, datos (Postgres), lanzamiento y revisión cruzada | Al iniciar el Paso 2 con un producto nuevo. Marcar/desmarcar casillas según lo que el release toque; es la fuente del "gate" de cada paso del plan |

Skills hermanas que aportan los activos técnicos que este plan orquesta (no se copian aquí): `devops-monorepo-client-server-vercel` (vercel.json, proxy, esqueleto), `devops-cicd-github-gitlab` (workflow de CI), `qa-kit-eslint9-prettier-monorepo` (lint del DoD), `negocio-analitica-producto` (instrumentación).

## 4. Gotchas verificados

Nivel N0: **ningún proyecto divergente propio ha ejercitado aún esta skill**, así que estos son riesgos conocidos de la práctica y del stack (Node/Next/Vercel/Postgres), **sin verificar en proyecto propio**. Se documentan para que el primer uso ya los evite; se confirmarán (con evidencia y commit) cuando un release real los toque.

1. **"Preview verde" confundido con "producción lista" — sin verificar en proyecto propio.** El preview deploy de Vercel puede correr con env vars y BD de Preview, no las de Production; un release que se ve perfecto en preview puede romper al promover (dominio, claves, connection string distintos). Mitigación esperada: el DoD exige verificar contra el entorno de Production antes del GO #2. A confirmar en el primer release.
2. **Conexiones a Postgres agotadas en funciones serverless — sin verificar en proyecto propio.** Cada invocación de una función en Vercel puede abrir su propia conexión; sin un pooler (pooled connection de Neon/Supabase o pgBouncer) la BD agota conexiones bajo carga y aparecen errores intermitentes. Mitigación esperada: usar la connection string *pooled* desde H2. A confirmar.
3. **Sin DoD escrito, "done" se renegocia cada release — riesgo de práctica, sin verificar.** Es la traducción divergente de "diseñar sin el manual completo": aquí no hay manual del cliente, pero si no se congela un DoD propio, cada entrega discute qué significa "listo" y el time-to-market se diluye en re-trabajo. Mitigación: Paso 2 obligatorio antes de H1.
4. **Compuerta ligera tratada como compuerta ausente — riesgo de práctica, sin verificar.** Quitar el comité y el acta formal NO es quitar el GO/NO-GO: sin un GO explícito del Dueño se promueve a producción algo a medio hacer. Mitigación: los dos puntos de decisión del Paso 7 son de registro obligatorio aunque no haya acta.
5. **Assets/copys de marca del Dueño llegan tarde y bloquean H3 — sin verificar en proyecto propio.** El producto queda técnicamente listo pero sin contenido real; es el equivalente divergente del lead-time institucional, solo que el cuello de botella es el Dueño, no un datacenter. Mitigación: pedirlos en H0 y usar placeholders marcados (skill `docs-entregable-supuestos-y-placeholders`).
6. **Lanzar sin analítica instrumentada — riesgo de práctica, sin verificar.** Hermana divergente del "sistema estatal sin uso se apaga a los 3 meses": un producto propio sin eventos de funnel se lanza a ciegas y no se sabe si retiene. Mitigación: analítica en el DoD (H3), no como extra posterior.
7. **`tsc && build` como gate de despliegue silencioso — sin verificar en proyecto propio.** En el stack de Vercel un error de tipos aborta el build y por tanto el deploy; planear un GO sin correr el build local en verde arriesga una compuerta que "no cierra" por una causa trivial. Mitigación: el DoD exige build local verde antes del push (heredado de la práctica de la skill `devops-monorepo-client-server-vercel`).

## 5. Criterios de done

- [ ] Existe el **objetivo de negocio** con una métrica de éxito del release y una lista explícita de **"fuera de alcance"** que blinda el time-to-market.
- [ ] Hay un **Definition of Done propio escrito** (instancia de `DEFINITION_OF_DONE.template.md`); es el gate de cada paso del plan y **no** hay etiquetas normativas citables (`[Código Cx]`).
- [ ] El plan está estructurado en **3–4 hitos** (no 7 fases), cada uno con pasos `H.N` y una **línea "hito de salida" verificable** = un preview deploy que cumple el DoD (condición, no fecha).
- [ ] Las **dependencias externas** están listadas con su lead-time real; los **assets del Dueño** se piden en H0, no en H3.
- [ ] Hay una tabla de **prácticas transversales con cadencia** (por PR / por hito / semanal).
- [ ] Hay un **Gantt ASCII** y una lista **numerada de puntos GO/NO-GO que decide el Dueño**; queda claro que compuerta ligera ≠ compuerta ausente.
- [ ] La sección de **riesgos** usa formato `enunciado → consecuencia → Mitigación:` con puntero al paso; ningún riesgo queda sin paso mitigador.
- [ ] El go-live está planteado como **promote to Production que aprueba el Dueño** (sin cambio formal ITIL, sin comité, sin acta estatal).
- [ ] Revisión cruzada: **`qa-ingeniero`** revisa el release (revisor ≠ constructor, aplica a toda entrega); **`seguridad-appsec`** si toca auth, roles o datos personales (Habeas Data obliga también a privados). **No** aplica veto de `cumplimiento-normativo` en este régimen.

## Registro de uso
| Fecha | Proyecto | Tarea | Resultado | Lección |
|---|---|---|---|---|
