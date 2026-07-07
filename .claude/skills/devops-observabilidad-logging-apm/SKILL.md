---
name: devops-observabilidad-logging-apm
regimen: universal
description: Dota a un servicio de observabilidad de producción — logging estructurado JSON centralizado, trazas/APM con OpenTelemetry, health checks reales (liveness/readiness), métricas y alertas — para las dos líneas del dueño (Node/Next en Vercel y .NET/SQL Server en gobierno) y la línea Python de datos. Cárgala cuando: haya que instrumentar un servicio más allá de `/api/health` con timestamp; montar la observabilidad exigida en F3/F6 (DI-GSI-010 "observabilidad activa desde el día uno"); configurar Application Insights / OpenTelemetry / Serilog / pino; definir dashboards o alertas de salud; o decidir entre APM en la nube (Azure) y un stack on-prem por residencia de datos.
---

# DevOps — Observabilidad, logging estructurado y APM

**Nivel actual:** N0 · **Dominio:** devops · **Agente(s):** `devops-plataforma` (dueño); consumida por `qa-ingeniero` (evidencia de monitoreo/alertas en F5), `seguridad-appsec` (auditoría de logs + Habeas Data), `back-node-api` y `back-dotnet-gobierno` (instrumentan su código)
**Proyectos fuente:** ninguno — creada desde buenas prácticas (VACÍO del portafolio)

> Criterio de ascenso a N1: los 5 bloques completos, con activos copiables de ruta real y gotchas verificados (no genéricos). A N2: ≥1 uso real aceptado por el Dueño. A N3: ≥3 usos exitosos en ≥2 proyectos + checklist propio.

## 1. Propósito

El portafolio del dueño **no tiene observabilidad**: la única señal de salud es `GET /api/health` devolviendo `{ status:'ok', timestamp }`, y Application Insights aparece **solo en el plan**, sin implementar. No hay logging estructurado centralizado, ni trazas/APM, ni alertas, ni dashboards. Cuando algo falle en producción no habrá con qué diagnosticarlo. Esta skill cierra ese hueco convirtiendo cuatro capacidades en configuración copiable: **logging estructurado JSON** (con correlationId y redacción de datos personales), **trazas/APM con OpenTelemetry** (estándar neutral de proveedor), **health checks reales** (liveness vs readiness con sondeo de dependencias) y **métricas + alertas** hacia dashboards.

FABRICA.md la exige explícitamente: F3/G3 pide "CI mínimo desde el día 1" y F6 exige "**observabilidad y backups activos desde el día uno**" para producción estatal. DI-GSI-010 y M-GSI-002 (base ISO 27001, controles de registro y monitoreo) obligan a trazas de auditoría y vigilancia; ITIL M-GSI-003 alimenta la gestión de eventos/incidentes con esas alertas. Se carga cuando `devops-plataforma` instrumenta un servicio, monta la observabilidad de F3/F6, o cuando hay que decidir el APM (Azure vs on-prem).

## 2. Procedimiento

### Paso 1 — Elegir el camino según línea y plataforma
- **Línea privada (Node/Next, Vercel):** `logger-node/` (pino) + `nextjs/instrumentation.ts` (OpenTelemetry vía `@vercel/otel`) + `health/health-express.ts`. Logs a **stdout** (los captura Vercel); retención larga requiere Log Drain o colector propio (ver gotcha).
- **Línea gobierno (.NET/SQL Server, GitLab institucional):** `dotnet/Observabilidad.Setup.cs` + `dotnet/appsettings.Observabilidad.json` (Serilog + OpenTelemetry + HealthChecks). APM: Application Insights **o** colector on-prem (paso 4).
- **Línea datos (Python, Windows scheduler):** `python/logging_config.py` (structlog → JSON).

### Paso 2 — Logging estructurado (la base, primero)
1. Nunca `console.log`/`Console.WriteLine` sueltos: todo evento sale como **JSON con nivel, timestamp, servicio y correlationId**. Node → pino; .NET → Serilog (`CompactJsonFormatter`); Python → structlog.
2. **correlationId** por petición (`x-correlation-id`, se genera si no llega) para trazar extremo a extremo; en .NET lo aporta el `TraceId` de OpenTelemetry.
3. **Redacción obligatoria** de credenciales y datos personales (cédula, correo, contraseña, tokens, cookies) — es requisito de Habeas Data (Ley 1581), no opcional. Ya viene en `logger.ts` (`redact`) y en el colector (`attributes/redaccion`). Coordina con `seg-habeas-data-implementacion`.

### Paso 3 — Health checks reales (sube el `/api/health`)
Separa **liveness** (`/health/live`: ¿el proceso vive?) de **readiness** (`/health/ready`: ¿puede atender? comprueba BD y dependencias, responde 503 si fallan). Node → `crearHealthRouter({...})`; .NET → `AddHealthChecks().AddSqlServer(...)` con tag `ready`. El de readiness es el que consume el monitor de uptime y las alertas de disponibilidad.

### Paso 4 — APM / trazas con OpenTelemetry, y la DECISIÓN de residencia de datos
Instrumenta con **OpenTelemetry** (neutral: no te casa con un proveedor). Luego elige el destino del APM:
- **Opción A — Application Insights (Azure):** rápido, ya está en el plan. `otel.UseAzureMonitor()` en .NET; en Node/Next, `OTEL_EXPORTER_OTLP_ENDPOINT` al endpoint de Azure Monitor. **Envía telemetría a la nube de Azure.**
- **Opción B — Stack on-prem OTLP:** `selfhosted/docker-compose.observabilidad.yml` (Grafana + Loki + Tempo + Prometheus + OTel Collector). Los datos **no salen de la entidad**.
- **CRITERIO DE DECISIÓN CLAVE:** en un proyecto estatal, ¿la telemetría (que puede contener rutas, IDs, trazas de BD) **puede salir a la nube**? Si DI-GSI-010 o la clasificación de la información lo restringen, va la Opción B. **No lo asumas: es una decisión abierta del blueprint que cierra el Dueño con la OTI** (regla inviolable #2). Application Insights "está en el plan" no equivale a "aprobado para datos reales".

### Paso 5 — Métricas, dashboards y alertas
Exporta métricas OTel (o Prometheus: `prom-client` en Node, `prometheus-net` en .NET) y vigila las **cuatro señales de oro**: latencia, tráfico, errores, saturación. Define **SLOs** y crea alertas sobre ellos (5xx > umbral, p95 de latencia, readiness caído, disco/CPU). Las alertas se enrutan al canal del equipo y, en gobierno, **alimentan la gestión de eventos/incidentes ITIL** (M-GSI-003): una alerta crítica abre incidente.

### Paso 6 — Verificar en Windows antes del push
Corre `check-observabilidad-local.ps1` (PowerShell) para confirmar en el equipo del dueño que `/health/live` y `/health/ready` responden y que la última línea de log es JSON válido, antes de subir.

### Paso 7 — Atar a las compuertas
- **F3/G3:** logging estructurado + health checks + correlationId existen desde el día 1 (mínimo viable de observabilidad).
- **F5/G5:** las pruebas de carga k6 (`qa-pruebas-carga-k6-jmeter`) se corren con el APM activo para leer latencia/errores bajo carga; alertas y SLOs definidos.
- **F6/G6:** dashboards + alertas activos y backups en marcha ("observabilidad activa desde el día uno"); alertas cableadas a ITIL. Sin esto, `cumplimiento-normativo` puede vetar la compuerta.

## 3. Activos copiables

Todos en `activos/` de esta skill. Son **plantillas base (N0)**: sin secretos, con placeholders `${VAR}`; las versiones de paquetes/imágenes deben confirmarse antes de fijarlas.

- **`logger-node/logger.ts`** y **`logger-node/http-logging.ts`** — logger pino JSON con redacción de datos personales + middleware `pino-http` con correlationId. Copiar a `server/src/lib/`; **adaptar** `${SERVICE_NAME}` y la lista `redact` a los campos reales del dominio.
- **`health/health-express.ts`** — router `/api/health` con `/live` y `/ready` (sondeo de dependencias). Montar con `app.use('/api/health', crearHealthRouter({ sqlserver: ... }))`; **adaptar** las probes a la BD real.
- **`nextjs/instrumentation.ts`** — instrumentación OpenTelemetry para Next.js vía `@vercel/otel`. Va en la **raíz** del proyecto (o `src/`); **adaptar** `${SERVICE_NAME}`. Verifica que tu versión de Next ya no exija `experimental.instrumentationHook`.
- **`dotnet/Observabilidad.Setup.cs`** + **`dotnet/appsettings.Observabilidad.json`** — Serilog + OpenTelemetry + HealthChecks SQL Server como métodos de extensión para `Program.cs`. **Adaptar** `${SERVICE_NAME}`, `${DB_CONNECTION_NAME}` y elegir Opción A/B del paso 4. El password de la cadena va en Key Vault/User Secrets, no en el JSON.
- **`python/logging_config.py`** — logging structlog JSON para jobs de datos/scraping con correlationId por corrida. **Adaptar** `${JOB_NAME}`.
- **`selfhosted/docker-compose.observabilidad.yml`** + **`selfhosted/otel-collector-config.yaml`** — stack on-prem (Grafana/Loki/Tempo/Prometheus/OTel Collector) para gobierno con residencia de datos. **Fijar** tags de imagen por digest y usar el registry interno; añadir los config de Loki/Tempo/Prometheus según su doc.
- **`check-observabilidad-local.ps1`** — verificación local Windows (health + logs JSON) antes del push.

## 4. Gotchas verificados

Riesgos **documentados de la práctica**, marcados honestamente como **sin verificar aún en proyecto propio (N0)**. Ascenderán a evidencia real al usarse.

- **Enviar telemetría a Azure puede violar la residencia de datos (N0, sin verificar).** Application Insights manda logs/trazas a la nube de Azure; en un sistema estatal con datos clasificados eso puede chocar con DI-GSI-010/M-GSI-002. Mitigación: tratar el destino del APM como **decisión abierta del blueprint** (Opción A vs B on-prem); que la cierre el Dueño con la OTI antes de F3, no el agente por defecto.
- **Vercel retiene los logs runtime muy poco tiempo (N0, sin verificar).** En planes bajos los logs de función se pierden en horas; "está en stdout" no es "está centralizado". Mitigación: para retención real, configurar un **Log Drain** (de pago) o exportar vía OTLP a un colector propio; documentarlo, no asumir que Vercel guarda la historia.
- **OTel en serverless pierde spans si no se hace flush (N0, sin verificar).** Al congelarse la función de Vercel, un batch processor sin flush descarta trazas y el APM se ve incompleto. Mitigación: usar `@vercel/otel` (gestiona el flush) en vez del SDK OTel crudo en funciones serverless.
- **Health check demasiado "pesado" tumba el servicio (N0, sin verificar).** Si `/ready` consulta la BD y el monitor lo golpea cada segundo, o si un orquestador usa readiness como liveness, un pico de latencia de BD reinicia contenedores sanos. Mitigación: liveness sin dependencias, readiness con timeout corto, y `autoLogging.ignore` del health para no inundar los logs (ya en `http-logging.ts`).
- **Loggear datos personales incumple Habeas Data (N0, sin verificar).** Un `log.info(req.body)` con cédula/correo en claro es hallazgo de auditoría (Ley 1581). Mitigación: `redact` en pino + `attributes/redaccion` en el colector + revisión de `seguridad-appsec`; nunca volcar `body`/`headers` completos.
- **Auto-actualizar o desplegar el stack de observabilidad sin ITIL (N0, sin verificar).** Cambiar el colector/dashboards en producción estatal es un cambio formal. Mitigación: en gobierno, todo cambio de la plataforma de observabilidad pasa por SDC F-GSI-037 y comité (ver `devops-gestion-cambios-itil-gobierno`).
- **Versiones e imágenes se mueven tras el cutoff (N0, sin verificar).** `@vercel/otel`, los paquetes `OpenTelemetry.*`/`Azure.Monitor.*`, el hook de instrumentación de Next y los tags `otel/`, `grafana/`, `prom/` cambian. Mitigación: confirmar la última versión de cada uno y, en gobierno, **fijar por digest** (una imagen mutable es superficie de supply-chain).
- **Alertas que nadie enruta = observabilidad decorativa (N0, sin verificar).** Un dashboard bonito sin alertas accionables no detecta el incidente a las 3am. Mitigación: definir SLOs y alertas desde F5 y cablearlas al canal del equipo y a la gestión de incidentes ITIL (M-GSI-003).

## 5. Criterios de done

- [ ] Ningún `console.log`/`Console.WriteLine` suelto: todo evento sale como **JSON estructurado** con nivel, timestamp, servicio y correlationId.
- [ ] La redacción de datos personales/credenciales está activa y verificada (una petición con cédula/token no aparece en claro en los logs).
- [ ] Existen `/health/live` (sin dependencias) y `/health/ready` (con sondeo de BD); readiness devuelve 503 cuando la BD está caída, probado.
- [ ] Hay trazas/APM con OpenTelemetry y la **decisión de residencia de datos** (Azure vs on-prem) está cerrada por el Dueño y registrada en el blueprint.
- [ ] Métricas de las cuatro señales de oro visibles en un dashboard; al menos una alerta accionable definida (p.ej. 5xx > umbral o readiness caído) y enrutada.
- [ ] En gobierno: alertas críticas alimentan la gestión de incidentes ITIL (M-GSI-003); telemetría sin datos personales (M-GSI-002/DI-GSI-010).
- [ ] `check-observabilidad-local.ps1` corre en el Windows del dueño y verifica health + logs JSON antes del push.
- [ ] Retención de logs resuelta (Log Drain o colector propio), no dependiente solo del buffer efímero de Vercel.
- [ ] Evidencia de observabilidad (dashboards + alertas activos) adjunta al acta de G6; "observabilidad activa desde el día uno" cumplido.

## Registro de uso
| Fecha | Proyecto | Tarea | Resultado | Lección |
|---|---|---|---|---|
