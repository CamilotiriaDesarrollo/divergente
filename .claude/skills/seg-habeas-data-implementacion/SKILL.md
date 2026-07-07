---
name: seg-habeas-data-implementacion
regimen: universal
description: Implementa el patrón técnico probado de protección de datos personales bajo Habeas Data Colombia (Ley 1581/2012, Decreto 1074/2015) — DTOs públicos enmascarados vs administrativos con rol, captura y evidencia de consentimiento por finalidad, derechos del titular (ARCO) y política de retención/anonimización. Cárgala cuando un endpoint o pantalla exponga datos personales (correo, teléfono, documento, dirección), al capturar consentimiento en formularios, al diseñar la BD de personas, al definir retención/borrado, o al cerrar una compuerta que toque datos personales.
---

> **Régimen: universal.** Las referencias a normativa estatal (M-GSI-002, DI-GSI-010, ITIL/M-GSI-003, «entidad pública») aplican SOLO en proyectos `institucional`; en un proyecto `divergente` ignóralas y usa la variante de la línea privada (Vercel/Node/Postgres).
> **Excepción crítica de esta skill:** el núcleo Habeas Data —Ley 1581/2012 y Decreto 1074/2015— NO es normativa estatal opcional: es de cumplimiento **OBLIGATORIO en AMBOS regímenes** para cualquiera que trate datos personales en Colombia (empresa privada incluida). NO lo ignores en un proyecto divergente. Lo único que se condiciona a `institucional` son los *envoltorios estatales* (M-GSI-002 enmascaramiento, DI-GSI-010 auditoría, ITIL/M-GSI-003 para el job de purga); el patrón técnico (doble DTO, consentimiento por finalidad, ARCO, retención/anonimización) se implementa igual en divergente con su propio control de cambios.

# Implementación técnica de Habeas Data (Ley 1581/2012)

**Nivel actual:** N0 · **Dominio:** seg · **Agente(s):** `seguridad-appsec` (dueño); co-implementan `back-dotnet-gobierno`, `back-node-api`, `datos-bd`, `front-formularios-a11y`
**Proyectos fuente:** ninguno — creada desde buenas prácticas (VACÍO del portafolio)

> Criterio de ascenso a N1: los 5 bloques completos, con activos copiables de ruta real y gotchas verificados (no genéricos). A N2: ≥1 uso real aceptado por el Dueño. A N3: ≥3 usos exitosos en ≥2 proyectos + checklist propio.

## 1. Propósito

El enmascaramiento Habeas Data está **priorizado pero sin implementar** en el portafolio: en el PNMC la historia quedó marcada honestamente como *"Propuesto — no implementado"* y `seg-desarrollo-seguro-sdl-owasp-gobierno` lo cita solo como gotcha. Falta el **patrón técnico end-to-end**: DTOs públicos enmascarados, captura y evidencia de consentimiento, derechos del titular y retención. Esta skill lo cubre para el stack real (.NET/SQL Server de gobierno y Node/React de la línea privada) y lo amarra a la normativa (M-GSI-002 enmascaramiento, DI-GSI-010 auditoría, ITIL M-GSI-003 para el job de purga) **(estos amarres estatales aplican solo si el proyecto es institucional; la Ley 1581/2012 y el Decreto 1074/2015 siguen siendo obligatorios en divergente)**.

Se carga cuando un agente: expone datos personales en un endpoint o pantalla; captura consentimiento en un formulario; modela la tabla de personas; define retención/borrado; o cuando `seguridad-appsec` revisa una compuerta que toca datos personales (regla inviolable 1). **Honestidad N0:** es un punto de partida correcto y accionable, aún no probado en proyecto propio.

## 2. Procedimiento

### Paso 1 — Clasificar los datos antes de escribir código
Lista qué campos son datos personales y cuáles **sensibles** (art. 5-6 Ley 1581: salud, biométricos, orientación, origen, etc.). Los sensibles exigen consentimiento explícito, son opcionales y no pueden condicionar el servicio; prohibido tratarlos en menores. Toda decisión de qué se expone públicamente se anota como decisión de blueprint, no se improvisa.

### Paso 2 — Doble DTO (regla de oro)
Nunca serialices la entidad cruda. Define **dos** proyecciones: pública enmascarada y administrativa con rol.
- **.NET:** copia `activos/PersonaDtos.cs` + `activos/Enmascaramiento.cs`. El endpoint público retorna `PersonaPublicoDto`; el administrativo exige rol y devuelve **403 desde el backend aunque la UI lo permita** (patrón de `seg-desarrollo-seguro`). Analogía real en PNMC: `MarcadorPublicoDto` vs `MarcadorDetalleAdministrativoDto`.
- **Node:** copia `activos/enmascarar.ts` y aplícalo en el mapper del backend Express. Con "backend durmiente" (front sobre datos estáticos), el catálogo estático **ya debe venir enmascarado** — nunca dejes el dato completo "para que el front lo recorte".

### Paso 3 — Consentimiento previo, expreso e informado
Copia `activos/ConsentimientoCheckbox.tsx` (React 19; sirve en Next.js 16 App Router con `"use client"` y en Vite sin la directiva). Reglas SIC: casilla **NO pre-marcada**, **una por finalidad**, separada de "acepto términos", con enlace a la política vigente. Persiste la **evidencia** con `activos/sql/202607_consentimiento_y_retencion.sql`: titular, finalidad, versión de política, canal, IP, UserAgent, hash SHA-256 y fecha. El hash y la IP también atienden el mínimo de auditoría de DI-GSI-010.

### Paso 4 — Derechos del titular (ARCO)
Expón las rutas de `activos/arco.routes.ts` (línea Node) o su equivalente .NET: consultar, rectificar/actualizar, revocar consentimiento y solicitar supresión (art. 8). Publica el canal de atención. Toda revocación **detiene el tratamiento** de esa finalidad; toda operación queda auditada (fecha, IP, hash).

### Paso 5 — Retención y anonimización
Define la matriz `activos/politica-retencion.yaml` (finalidad → base legal → días → acción). Implementa la purga con `dbo.sp_PurgarPorRetencion`: **anonimiza, no borra** salvo obligación legal (entonces bloquea el tratamiento). Programa el job con `devops-scheduler-windows-powershell` y despliégalo como **cambio controlado ITIL (M-GSI-003)** **(solo si el proyecto es institucional; en divergente despliégalo con tu propio proceso de release y rollback — ver `div-devops-release-liviano-rollback`)**. Corre siempre primero con `@DryRun=1`.

### Paso 6 — Cerrar contra el checklist
Verifica con `activos/checklist_habeas_data.md` (H1–H12) y cítalo en el acta de compuerta. Lo legal (textos de política, si aplica RNBD ante la SIC) lo valida `cumplimiento-normativo`.

> **Frescura (regla 8 de la fábrica):** las piezas dependientes de framework — `"use client"`/Server Actions de Next.js 16, `record`/Minimal API de .NET 10, API de Express 5 — pueden cambiar entre versiones. Reverifica contra la documentación vigente del proyecto antes de copiar. Lo legal (Ley 1581/2012, Decreto 1074/2015) es estable, pero umbrales del RNBD se actualizan por decreto.

## 3. Activos copiables

Todos en `activos/` de esta skill (creados para N0, **sin verificar aún en proyecto propio**). Placeholders `${VAR}`, sin secretos.

- **`PersonaDtos.cs`** — doble DTO (`PersonaPublicoDto` enmascarado / `PersonaAdministrativoDto` con rol) + proyecciones. Adaptar namespace y campos. Para la línea .NET de gobierno.
- **`Enmascaramiento.cs`** — utilidades puras (correo, teléfono, documento, nombre visible). Copiar a `Application.Common/`.
- **`enmascarar.ts`** — equivalente TypeScript para backend Express y, si hace falta, cliente Next.js/Vite.
- **`sql/202607_consentimiento_y_retencion.sql`** — tabla `ConsentimientoTratamiento`, vista `ConsentimientoVigente` y `sp_PurgarPorRetencion` (SQL Server, idempotente). Adaptar columnas de `dbo.Persona` (`Anonimizado`, `FechaAnonimizado`, `FechaUltimaActividad`).
- **`politica-retencion.yaml`** — matriz finalidad → retención → acción; fuente de verdad del job de purga.
- **`ConsentimientoCheckbox.tsx`** — casilla accesible (NTC 5854 AA) no pre-marcada, por finalidad.
- **`arco.routes.ts`** — rutas Express de derechos del titular; `repo`/`audit` son puertos a implementar.
- **`checklist_habeas_data.md`** — DoD citable H1–H12 con amarres normativos.

## 4. Gotchas verificados

Riesgos documentados de la práctica, **marcados honestamente como "sin verificar aún en proyecto propio (N0)"**. Ascenderán a verificados al usarse.

- **La documentación miente sobre el enmascaramiento (sin verificar aún en proyecto propio — N0).** Es exactamente lo que pasó en el PNMC: la doc decía "hecho" y el código exponía correo/teléfono en llamadas AJAX del mapa. **Verifica contra el código real**, nunca contra la doc heredada. Marca la historia como "Propuesto — no implementado" si no la ves en el código.
- **Enmascarar en el cliente no protege (sin verificar aún en proyecto propio — N0).** Si el backend envía el dato completo y el front lo recorta, se lee en la respuesta de red. El enmascaramiento **debe ocurrir en el backend / en el dato estático servido**. Por eso el activo Node vive en el mapper del servidor.
- **Consentimiento pre-marcado o global es inválido ante la SIC (sin verificar aún en proyecto propio — N0).** Una sola casilla "acepto todo" no es consentimiento por finalidad. `checked` controlado y en `false` por defecto; una casilla por finalidad.
- **Borrar de verdad rompe integridad y obligaciones legales (sin verificar aún en proyecto propio — N0).** Un `DELETE` físico puede violar retención contable/contractual y romper claves foráneas. Por eso el patrón **anonimiza** (`ANON-{Id}`, contacto a NULL) y bloquea cuando hay obligación legal. Nunca borres sin consultar la matriz de retención con `cumplimiento-normativo`.
- **Job de purga sin control de cambios = incidente (sin verificar aún en proyecto propio — N0).** Anonimizar es irreversible. Corre `@DryRun=1`, revisa el conteo, y despliégalo como cambio ITIL (M-GSI-003) con rollback (backup previo, `devops-backup-dr`). No lo programes "y ya".
- **Datos de producción en dev/test sin anonimizar (sin verificar aún en proyecto propio — N0).** DI-GSI-010 exige datos de prueba anonimizados/ofuscados. Usa `datos-dataset-sintetico-ponderado` en vez de un dump de producción.

## 5. Criterios de done

- [ ] Ningún endpoint público emite documento, correo completo, teléfono o dirección exacta (verificado inspeccionando la respuesta HTTP real, no la doc).
- [ ] El DTO administrativo devuelve **403 desde el backend** si se invoca sin rol, saltándose la UI (probado).
- [ ] El enmascaramiento está centralizado en un único módulo; ningún controlador serializa la entidad cruda.
- [ ] Consentimiento capturado con casilla no pre-marcada, por finalidad y con enlace a la política; la evidencia (finalidad, versión, IP, hash, fecha) queda persistida y consultable.
- [ ] Las cuatro rutas de derechos del titular funcionan (consultar, rectificar, revocar, suprimir) y quedan auditadas con fecha+IP+hash.
- [ ] Supresión anonimiza (o bloquea si hay obligación legal); no hay `DELETE` físico de titulares.
- [ ] `sp_PurgarPorRetencion` probado en `@DryRun=1`; el job se despliega como cambio ITIL con rollback.
- [ ] Datos de prueba anonimizados/sintéticos; sin dump de producción en dev/test.
- [ ] Checklist H1–H12 revisado y citado en el acta; RNBD evaluado con `cumplimiento-normativo`.

## Registro de uso
| Fecha | Proyecto | Tarea | Resultado | Lección |
|---|---|---|---|---|
