---
name: datos-migraciones-gestionadas
regimen: universal
description: Adopta una herramienta de migraciones de BD gestionada (Flyway, EF Core Migrations, DbUp o Alembic) con historial versionado en la propia base, baseline de una BD ya existente, rollback probado e integración a CI/CD — elevando los scripts T-SQL versionados a mano a un flujo auditable. Cárgala cuando haya que elegir/introducir una herramienta de migraciones, baselinear una BD existente, meter migraciones en un pipeline (GitHub Actions o GitLab CI), o definir el plan de rollback de una migración a producción bajo cambio ITIL.
---

> **Régimen: universal.** Las referencias a normativa estatal (M-GSI-002/003, DI-GSI-010, ITIL, SDC F-GSI-037, CCC, congelamiento 15dic–15ene, GitLab institucional) aplican SOLO en proyectos `institucional`; en un proyecto `divergente` ignóralas y usa la variante de la línea privada (Postgres/MySQL con node-pg-migrate/Knex/Prisma o Alembic, GitHub Actions, Vercel/Neon). La metodología de migraciones (elección de herramienta, baseline, forward-only inmutable, validate en CI, compuerta manual a prod) es universal a ambos regímenes.

# Migraciones de BD gestionadas

**Nivel actual:** N0 · **Dominio:** datos · **Agente(s):** `datos-bd` (revisa `qa-ingeniero`; `seguridad-appsec` si la migración toca datos personales; `devops-plataforma` cablea el pipeline; el paso a prod estatal lo gobierna `cumplimiento-normativo`)
**Proyectos fuente:** ninguno — creada desde buenas prácticas (VACÍO del portafolio).

> Criterio de ascenso a N1: los 5 bloques completos, con activos copiables de ruta real y gotchas verificados (no genéricos). A N2: ≥1 uso real aceptado por el Dueño. A N3: ≥3 usos exitosos en ≥2 proyectos + checklist propio.

## 1. Propósito

En el portafolio la BD se versiona **a mano**: scripts `VAAAAMMDD_NN__descripcion.sql` idempotentes en `schema/seed/migrations`, ejecutados en orden con `sqlcmd -b` (skill hermana `datos-sqlserver-convenciones-y-scripts-versionados`, PNMC SIMUS). Funciona, pero el **vacío** es real: no hay una herramienta que lleve el **historial de qué se aplicó en cada ambiente**, no existe **rollback probado**, y las migraciones **no están integradas al pipeline** — el paso a producción depende de correr scripts a mano en el orden correcto y de recordar dependencias (p. ej. el seed 07 de PNMC que dependía del bootstrap del backend).

Esta skill cubre ese salto: introducir una herramienta de migraciones gestionada que (a) registra el estado en la propia BD, (b) aplica cada cambio **una sola vez** de forma **forward-only**, (c) permite **baselinear** una BD que ya existe sin re-crearla, y (d) se ejecuta desde CI/CD con **producción como compuerta manual** = el cambio formal ITIL (SDC F-GSI-037, M-GSI-003) (solo si el proyecto es institucional; en divergente la compuerta manual sigue existiendo, pero sin aparato ITIL — ver `div-devops-release-liviano-rollback`). Se carga al elegir herramienta, baselinear, integrar migraciones a un pipeline, o escribir el plan de rollback de una migración a prod.

## 2. Procedimiento

**Paso 0 — Elegir la herramienta según el stack** (detalle en `activos/README-baseline-y-convenciones.md`):
- **.NET + SQL Server con scripts T-SQL ya escritos a mano** → **Flyway** o **DbUp**: reusan los `.sql` existentes casi sin reescribir y respetan M-GSI-002. Vía de menor fricción desde el estado actual.
- **.NET + SQL Server con el modelo EF Core como fuente de verdad** → **EF Core Migrations** (la migración deriva del modelo). Genera script idempotente + bundle para el DBA.
- **Node/Express (línea privada) sobre Postgres/MySQL** → node-pg-migrate / Knex / Prisma Migrate. (Muchos proyectos privados son "backend durmiente"/export estático y no necesitan migraciones.)
- **Python (datos)** → Alembic.
- **Default portable multi-motor** → **Flyway Community** (CLI agnóstica, misma invocación en GitHub y GitLab).

**Paso 1 — Baselinear la BD existente ANTES de la primera migración.** El error clásico es apuntar la herramienta a una BD poblada y que intente re-crear todo. Con Flyway: `baseline` marca el estado actual y solo aplica versiones posteriores (`baselineOnMigrate=true` + `baselineVersion` en `activos/flyway.conf`). La convención actual `VAAAAMMDD_NN__descripcion.sql` es casi Flyway-nativa (el `_` interno se lee como separador decimal), así que los scripts existentes se mueven a `db/migrations/` casi tal cual — **verifícalo con `flyway info`** antes de confiar en el orden.

**Paso 2 — Fijar reglas del repositorio de migraciones:**
- **Forward-only e inmutable:** una migración aplicada **nunca se edita** (rompe el checksum; `flyway validate` falla). Un cambio se corrige con una migración **nueva**.
- Los `.sql` nuevos ya no necesitan las guardas `IF OBJECT_ID... IS NULL` porque la herramienta lleva historial; mantenerlas no estorba pero deja de ser obligatorio.
- Nada de credenciales en los scripts ni en `flyway.conf`: todo por `${VAR}` de entorno (F3 exige gestión de secretos desde el día 1).

**Paso 3 — Escribir migración forward + su reversión.**
- Flyway Community **no** trae `undo` automático (es de pago): por cada migración de esquema reversible, adjunta un script inverso versionado y **probado en staging**.
- EF Core sí genera `Down()`, pero **solo es fiable para esquema, no para datos ya borrados**.
- Regla dura del dominio (M-GSI-003 §1.4): el rollback real en producción con pérdida de datos es **restaurar el respaldo**, no confiar en un `Down()`. Documenta el plan con `activos/plantilla-plan-rollback-migracion.md`.

**Paso 4 — Integrar al pipeline** (se apoya en `devops-cicd-github-gitlab`; usa `activos/db-migrations.github.yml` y su gemelo `activos/gitlab-ci.db-migrations.yml`):
1. **validate**: levantar una BD **efímera** (service container SQL Server 2022) y correr `flyway migrate` desde cero + `flyway validate` en cada PR. Prueba que todo aplica limpio y que ningún script aplicado fue editado.
2. **staging**: `migrate` automático al mergear a la rama por defecto.
3. **producción**: **compuerta MANUAL** (`environment: production` con revisores en GitHub / `when: manual` en GitLab) que **representa la aprobación del CCC** y la SDC F-GSI-037 (solo si el proyecto es institucional). Registrar el nº de SDC antes de aprobar (trazabilidad ante auditor, DI-GSI-010) (solo si el proyecto es institucional).

**Paso 5 (solo si el proyecto es institucional) — Ejecutar el paso a producción como cambio ITIL.** Antes de la ventana: respaldo `FULL` verificado (`RESTORE VERIFYONLY`), plan de rollback adjunto a la SDC, ventana **fuera de jornada** y **fuera del congelamiento 15dic–15ene**. Tras migrar: pruebas de humo, y si algo se desvía → rollback documentado (no improvisar). Cierre: clasificar resultado, actualizar CMDB, RIP/PIR en ≤2 días hábiles. Todo esto lo detalla la skill `devops-gestion-cambios-itil-gobierno`.

> Nota de frescura: los comandos de Flyway (10/11), EF Core (`migrations add/script --idempotent/bundle`, EF Core 8–10) y las imágenes de acciones/contenedores pueden haber cambiado tras el cutoff. Verifica versiones (`flyway --version`, `dotnet ef --version`) y el modelo de licenciamiento de Flyway (Redgate mueve features entre Community/Teams) antes de usar.

## 3. Activos copiables

Todos en `.claude/skills/datos-migraciones-gestionadas/activos/`. Sin secretos: credenciales por `${VAR}` / secrets del CI.

| Activo | Qué es | Cuándo copiarlo / qué adaptar |
|---|---|---|
| `flyway.conf` | Config base de Flyway (SQL Server/Postgres) con baseline, `cleanDisabled=true`, `validateOnMigrate`, credenciales por entorno | Al adoptar Flyway. Adaptar `flyway.url`, `locations`, `baselineVersion` |
| `db-migrations.github.yml` | Workflow GitHub Actions: validate en BD efímera + staging auto + **producción manual** (compuerta = CCC) | Copiar a `.github/workflows/`. Definir secrets/vars; ajustar rutas de `db/migrations` |
| `gitlab-ci.db-migrations.yml` | Equivalente en GitLab CI (`when: manual` para prod) para la entrega en GitLab institucional | Integrar al `.gitlab-ci.yml` del proyecto de gobierno. Marcar variables Protected/Masked |
| `ef-core-migrations.ps1` | Helper PowerShell (SO del Dueño) para la línea .NET: `add`, `script --idempotent`, `bundle`, `rollback`, `list` | Cuando EF Core es la fuente de verdad. Adaptar proyecto/contexto; conexión por `$env:DB_CONNECTION_STRING` |
| `plantilla-plan-rollback-migracion.md` | Plan de rollback rellenable atado a SDC F-GSI-037 (respaldo, criterio de disparo, reversión, cierre CMDB/RIP) | Adjunto obligatorio de toda migración a prod estatal. Rellenar campos `(*)` |
| `README-baseline-y-convenciones.md` | Cómo baselinear una BD existente y el puente desde `VAAAAMMDD_NN__` a Flyway/EF; tabla de elección de herramienta | Leer antes de adoptar la herramienta en un proyecto con BD ya poblada |

## 4. Gotchas verificados

> **Todos marcados "sin verificar aún en proyecto propio (N0)"**: son riesgos documentados de la práctica, no errores ya vividos en el portafolio. El primer uso real debe confirmarlos y bajarlos a evidencia (ascenso a N1/N2).

1. **Apuntar la herramienta a una BD ya poblada sin baseline → intenta re-crear objetos existentes y falla** (o peor, choca a medias). *Mitigación:* `baseline`/`baselineOnMigrate` antes de la primera `migrate`. *Sin verificar aún en proyecto propio (N0).*
2. **Editar un script ya aplicado rompe el checksum y `flyway validate` falla** en el siguiente ambiente. Con scripts a mano se editaba libremente; con historial gestionado NO. *Mitigación:* toda corrección es una migración nueva, inmutabilidad estricta. *Sin verificar aún en proyecto propio (N0).*
3. **Flyway Community no incluye `undo`** (feature de Teams/Enterprise): asumir que existe deja migraciones sin reversión. *Mitigación:* script inverso versionado probado en staging, o restaurar respaldo. Confirmar el tier vigente (Redgate cambia el licenciamiento). *Sin verificar aún en proyecto propio (N0).*
4. **`Down()` de EF Core no recupera datos borrados**: un `DROP COLUMN`/`DELETE` no se revierte con `database update <anterior>`. *Mitigación:* rollback real = restaurar respaldo `FULL` verificado; el `Down()` solo para esquema sin pérdida. *Sin verificar aún en proyecto propio (N0).*
5. **Baseline de EF Core sobre una BD nacida de scripts a mano genera drift modelo↔BD**: EF cree que el esquema salió de su modelo cuando no fue así. *Mitigación:* en ese caso preferir Flyway/DbUp, que adoptan los `.sql` sin asumir un modelo. *Sin verificar aún en proyecto propio (N0).*
6. **Automatizar la migración a prod sin compuerta humana viola la gestión de cambios ITIL**: un `migrate` que corre solo al mergear salta el CCC/SDC F-GSI-037. *Mitigación:* prod siempre como aprobación manual del pipeline (M-GSI-003, DI-GSI-010). *Sin verificar aún en proyecto propio (N0).*
7. **Dependencias seed ↔ arranque de la app se pierden al "gestionar" migraciones** (caso real cercano: seed 07 de PNMC dependía del bootstrap del backend). Una herramienta de esquema no conoce ese orden con la app. *Mitigación:* documentar y ordenar esas dependencias explícitamente; separar migraciones de esquema de seeds dependientes de runtime. *Sin verificar aún en proyecto propio (N0).*
8. **`sqlcmd`/LocalDB reciente no resuelve `(localdb)\MSSQLLocalDB`** (heredado de la skill hermana): al probar migraciones localmente puede fallar la conexión. *Mitigación:* usar la tubería con nombre (`SqlLocalDB info MSSQLLocalDB`) o un contenedor SQL Server. *Sin verificar aún en proyecto propio (N0).*

## 5. Criterios de done

- [ ] Herramienta elegida y **justificada por el stack** (tabla del README); registrada en el blueprint si diverge de lo esperado.
- [ ] BD existente **baselineada**: la herramienta no intenta re-crear lo ya presente; `info` muestra el historial correcto.
- [ ] Migraciones **forward-only e inmutables**; ninguna credencial en scripts ni en config (todo por `${VAR}`/secrets).
- [ ] **Prueba en CI**: `migrate` desde una BD efímera vacía + `validate` pasan en verde en cada PR.
- [ ] **Rollback probado en staging** (script inverso o restore) antes de cualquier migración a prod; plan de rollback adjunto a la SDC.
- [ ] Pipeline con **producción como compuerta manual** (= aprobación CCC / SDC F-GSI-037 — solo si el proyecto es institucional), portable GitHub↔GitLab.
- [ ] Paso a prod estatal: respaldo `FULL` verificado, ventana fuera de jornada y fuera del congelamiento 15dic–15ene, cierre con CMDB + RIP/PIR (según `devops-gestion-cambios-itil-gobierno`).
- [ ] Dependencias seed ↔ arranque de la aplicación documentadas y ordenadas explícitamente.

## Registro de uso
| Fecha | Proyecto | Tarea | Resultado | Lección |
|---|---|---|---|---|
