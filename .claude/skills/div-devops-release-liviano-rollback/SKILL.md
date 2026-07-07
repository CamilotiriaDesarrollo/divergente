---
name: div-devops-release-liviano-rollback
regimen: divergente
description: Proceso de release LIVIANO para producto propio de Divergente sobre Vercel/contenedores (Node/Next/Postgres) — ventana de despliegue, plan de rollback probado, changelog y comunicación proporcional, conservando la disciplina de rollback+registro sin comité ITIL. Cárgala al planear un go-live o release de un producto propio, al definir la estrategia de rollback (Instant Rollback de Vercel, redeploy de imagen previa, migración reversible de Postgres), al escribir el CHANGELOG/nota de versión, o al cablear la compuerta de deploy a producción en el pipeline de CD.
---

# DevOps — Release liviano con rollback probado (línea divergente)

**Nivel actual:** N0 · **Dominio:** devops · **Agente(s):** `devops-plataforma`
**Proyectos fuente:** ninguno — creada desde buenas prácticas (hermana divergente de `devops-gestion-cambios-itil-gobierno`)

> Criterio de ascenso a N1: los 5 bloques completos, con activos copiables de ruta real y gotchas verificados (no genéricos). A N2: ≥1 uso real aceptado por el Dueño. A N3: ≥3 usos exitosos en ≥2 proyectos + checklist propio.

## 1. Propósito

En la **línea divergente** (producto propio de Divergente) el paso a producción puede ser un `git push` que Vercel promueve solo, o un `docker push` a un registry. No hay comité CCC del jueves, ni SDC F-GSI-037 en Magic, ni congelamiento navideño, ni CMDB. Pero **eso no significa desplegar a ciegas**: esta skill conserva el único núcleo de la gestión de cambios ITIL que sigue valiendo fuera del Estado —**plan de rollback probado + registro del cambio**— y lo traduce a un proceso ligero sobre el stack real de la línea privada: Vercel / contenedores, Node / Next.js, Postgres gestionado (Neon/Vercel Postgres).

Se carga cuando `devops-plataforma` va a: planear un **go-live o release** de un producto propio; definir la **estrategia de rollback** (Instant Rollback de Vercel, redeploy de la imagen anterior, migración reversible de Postgres); escribir el **CHANGELOG / nota de versión**; comunicar un despliegue con indisponibilidad; o **cablear la compuerta de deploy a producción** en el pipeline de CD. El costo de ignorarla no es un rechazo formal de recepción (como en gobierno), sino peor en producto propio: un release roto sin vuelta atrás, con usuarios reales encima.

**Es la hermana divergente de `devops-gestion-cambios-itil-gobierno`.** Comparten disciplina; se diferencian en el aparato: aquí no hay comité, formulario estatal, ventana fija de miércoles 17:00 ni RIP/PIR obligatoria. La versión institucional aplica a proyectos del Ministerio; **no mezclar regímenes** en un mismo proyecto.

## 2. Procedimiento

**Paso 1 — Clasificar el release por reversibilidad (no por comité).** En vez de tipificar el cambio para un CCC, decide la ruta según qué tan barato es revertirlo:
- **Reversible en caliente** — solo frontend/estático, sin cambio de esquema ni de env vars incompatibles. Rollback = promover el deployment/imagen anterior en un click. Es el caso por defecto.
- **Con cambio de datos** — incluye migración de Postgres. **Nunca** es "reversible en un click": exige el plan de rollback de BD del Paso 4 y, casi siempre, desacoplar el esquema del deploy (expand/contract).
- **Hotfix / incidente** — salta la ventana, pero **no** el rigor mínimo: rollback listo antes de tocar prod, y registro después. Es el equivalente ligero del cambio de emergencia, sin CCCE.

**Paso 2 — Fijar la ventana de despliegue (autoimpuesta, no del comité).** No hay jueves 2:30 pm ni congelamiento 15 dic–15 ene. En su lugar, reglas propias:
- Despliega en **horario de bajo tráfico** según tu propia analítica de producto, no a la hora punta.
- **"No deploy on Friday"** (ni tarde-noche) salvo hotfix: no dejes un release grande sin nadie que pueda revertirlo.
- Define **quién está de guardia** durante y después del deploy: la persona que puede ejecutar el rollback y tiene los permisos para hacerlo. Sin comité que frene, la ventana y la guardia se autoimponen.

**Paso 3 — Plan de rollback PROBADO (el núcleo que se conserva).** Regla dura heredada de la ITIL: **sin rollback probado no hay release**, y ante una señal de fallo se ejecuta el rollback, no se improvisa un fix en caliente. La mecánica depende de la plataforma:
- **Vercel** — los deployments son **inmutables**; rollback = re-promover el deployment anterior con **Instant Rollback** del dashboard o `vercel rollback [url]` / `vercel promote [url]`. **Verifica ANTES** que ese deployment previo sigue disponible (no purgado por retención) y que no dependía de env vars que ya cambiaste.
- **Contenedores** — retén siempre la **imagen anterior tagueada por SHA** (`app:git-<sha>`), no solo `:latest`. Rollback = redeploy del tag anterior. Nunca sobrescribas `:latest` sin conservar el SHA previo al que volver.
- **Postgres (BD)** — las migraciones **no** se revierten con un click. Usa **expand/contract**: migraciones aditivas y compatibles hacia atrás, para que revertir el *código* no exija revertir el *esquema*. Si una migración es destructiva, sepárala en un release posterior y ten backup/PITR + script `down` probado. El detalle está en la skill `datos-migraciones-gestionadas`.
- **Criterio de disparo** — define **qué señal** dispara el rollback (health check rojo, `error rate` sobre umbral, smoke test fallido) *antes* de desplegar, y ejecútalo sin debatir cuando se cumpla.

**Paso 4 — Desacoplar esquema de deploy (para que el rollback sea real).** Aplica **expand/contract** (a.k.a. parallel change) a todo cambio de datos: primero migra el esquema de forma retrocompatible (expand) y despliega el código que lo tolera; en un release **posterior** eliminas lo viejo (contract). Para cambios de comportamiento riesgosos, envuélvelos en un **feature flag** para poder apagarlos sin redeploy. Regla operativa: **migra la BD antes del deploy del código** y de forma que el código anterior siga funcionando contra el esquema nuevo; así "revertir" es solo promover el deployment/imagen anterior.

**Paso 5 — Changelog y versionado (el registro que reemplaza la SDC).** El cambio queda registrado **en el repo**, no en Magic:
- Mantén un **`CHANGELOG.md`** estilo *Keep a Changelog* con secciones `Added / Changed / Fixed / Removed`, y versiona con **SemVer** (`MAJOR.MINOR.PATCH`).
- Etiqueta cada release con un **tag git `vX.Y.Z`** y, si aplica, una **GitHub/GitLab Release** con la nota de versión.
- El PR de release + el tag + la entrada del CHANGELOG son el rastro auditable. Regla de la fábrica: **misión sin fila en el registro = misión no cerrada** (aquí el registro es el CHANGELOG + el tag, más la fila del scoreboard que escribe el revisor).

**Paso 6 — Comunicación proporcional (no ≥24 h burocrático).** Comunica **según el impacto real**, no por plantilla estatal:
- **Sin indisponibilidad ni cambio visible** → basta la nota de versión / GitHub Release.
- **Cambio visible o breve indisponibilidad** → aviso por canal propio (status page, Slack/Discord, banner in-app, correo a usuarios) con antelación razonable.
- **SaaS con usuarios/SLA** → status page con incidente programado. El principio ITIL de "avisar antes" se conserva; la rigidez del comunicado pre-aprobado por el CCC no.

**Paso 7 — Ejecutar, smoke test y cierre.** Despliega dentro de la ventana; corre **smoke test / health check post-deploy** (`GET /api/health`, flujo crítico). Si se cumple el criterio de disparo → **rollback inmediato** (Paso 3). Al terminar:
1. Confirma el CHANGELOG y el tag.
2. Si **hubo rollback o incidente**, escribe una **mini-postmortem** (qué falló, qué disparó el rollback, acción de fondo) — el equivalente ligero y *no obligatorio-siempre* del RIP/PIR: se hace cuando aporta, no como trámite fijo.
3. No hay CMDB que actualizar.

**Compuerta en el pipeline de CD.** El equivalente liviano de la aprobación del CCC:
- **Preview automático** en cada PR (deploy preview de Vercel / entorno efímero) para revisar antes de mergear.
- **Deploy a producción** al mergear a `main`, ya sea automático o con **una aprobación ligera** vía *GitHub Environments* `production` con *required reviewer* (o `when: manual` en GitLab CI). Es una compuerta de una persona, no un comité.

**Nota de frescura (regla #8).** Los nombres de comandos y features cambian: `vercel rollback`/`promote`, "Instant Rollback", la disponibilidad de PITR en el Postgres gestionado y las opciones de *Environments/required reviewers* dependen del proveedor y su versión vigente. Al primer uso real, **verifica contra la documentación actual** y gana evidencia para subir esta skill de N0.

## 3. Activos copiables

Todos en `.claude/skills/div-devops-release-liviano-rollback/activos/`. **Creados desde buenas prácticas (N0)**: son **plantillas y pautas**, no rutas de un proyecto propio ya ejercitado. Sin secretos; con placeholders `${VAR}` / `<...>`.

- **`runbook-release-rollback.md`** — el runbook núcleo de la skill: checklist pre-deploy, definición de ventana y guardia, **procedimiento de rollback por plataforma** (Vercel / contenedor / Postgres), criterio de disparo, smoke test post-deploy y mini-postmortem. Cópialo a `docs/` del producto y adáptalo: nombres de servicios, comandos exactos del proveedor, umbrales del criterio de disparo. Es lo primero que se rellena para un go-live.
- **`CHANGELOG-plantilla.md`** — plantilla *Keep a Changelog* + SemVer, con la sección `[Unreleased]` y el formato de tag `vX.Y.Z`. Cópiala como `CHANGELOG.md` en la raíz del repo y empieza a registrar desde el primer release.
- **`deploy-prod.yml`** — workflow de GitHub Actions con la **compuerta ligera**: `environment: production` (required reviewer), build, deploy y **smoke test post-deploy**, con la nota de cómo revertir. Cópialo a `.github/workflows/`. **Adaptar:** proveedor de deploy, secrets, URL del health check, y portarlo a `.gitlab-ci.yml` con `when: manual` si el proyecto usa GitLab.

**Skills hermanas a consultar (no copiar):** `devops-gestion-cambios-itil-gobierno` (la versión institucional, para proyectos del Ministerio), `datos-migraciones-gestionadas` (rollback y expand/contract de la BD en detalle), `devops-backup-dr` (backup/PITR como red del rollback de datos), `devops-monorepo-client-server-vercel` y `devops-cicd-github-gitlab` (el pipeline sobre el que se monta la compuerta).

## 4. Gotchas verificados

Riesgos **documentados de la práctica**, marcados honestamente como **sin verificar en proyecto propio (N0)** — ganarán evidencia al primer uso real:

- **El Instant Rollback de Vercel NO revierte la base de datos ni las env vars (N0, sin verificar).** Promover el deployment anterior devuelve el *código*, pero si el release incluyó una migración de Postgres o cambió variables de entorno, el esquema/entorno nuevo se queda con el código viejo encima → roto. Mitigación: expand/contract (Paso 4) y no acoplar cambios de env vars a un release que quieras poder revertir en un click.
- **Sobrescribir `:latest` sin retener el SHA anterior deja sin imagen a la cual volver (N0, sin verificar).** En contenedores, si el pipeline pushea solo `:latest`, el rollback no tiene destino. Mitigación: taguear siempre por SHA (`app:git-<sha>`) y conservar al menos el tag inmediatamente anterior.
- **Una migración destructiva en el mismo release que el código que la usa hace el rollback imposible (N0, sin verificar).** `DROP COLUMN` + código nuevo en un solo deploy: al revertir el código, la columna ya no existe. Mitigación: separar la parte destructiva a un release posterior (contract) tras confirmar que nada la usa.
- **Sin comité que lo frene, la disciplina de ventana/guardia hay que autoimponerla (N0, sin verificar).** El riesgo que la burocracia estatal cubría "por accidente" (nadie despliega fuera del jueves) aquí desaparece: es fácil desplegar el viernes 6 pm sin nadie de guardia. Mitigación: regla "no deploy on Friday" y guardia asignada en el runbook.
- **Un rollback nunca probado no es un rollback (N0, sin verificar).** Descubrir en el incidente que el deployment previo fue purgado por retención, o que `vercel rollback` requiere permisos que nadie del equipo tiene, es el fallo clásico. Mitigación: ensayar el rollback una vez en preview/staging y anotarlo en el runbook, igual que la hermana institucional exige rollback documentado en la SDC.
- **Preview verde ≠ prod verde por *env drift* (N0, sin verificar).** El deploy preview funcionó con sus env vars, pero producción usa otra BD/otras variables y el deploy a prod falla o corre migraciones contra la BD equivocada. Mitigación: paridad de configuración documentada y health check post-deploy contra prod, no solo contra el preview.
- **Sin SDC obligatoria, es fácil saltarse el registro (N0, sin verificar).** La ITIL forzaba el rastro con el formulario; aquí nada obliga a escribir el CHANGELOG. Mitigación: la regla de la fábrica "misión sin registro = misión no cerrada" — el revisor no cierra el release sin entrada de CHANGELOG + tag + fila de scoreboard.

## 5. Criterios de done

Un release liviano hecho con esta skill queda bien cuando:

- [ ] El release está **clasificado por reversibilidad** (reversible en caliente / con cambio de datos / hotfix) y la ruta de rollback correspondiente está decidida.
- [ ] Existe un **plan de rollback probado** para la plataforma del proyecto (Instant Rollback de Vercel verificado / imagen anterior tagueada por SHA / migración expand-contract + `down` probado), con **criterio de disparo** explícito.
- [ ] Si hay cambio de datos: el **esquema está desacoplado del deploy** (migración retrocompatible; lo destructivo queda para un release posterior) y hay **backup/PITR** como red.
- [ ] La **ventana de despliegue** es de bajo tráfico, no viernes/tarde-noche sin cobertura, y hay **persona de guardia** con permisos para revertir.
- [ ] El cambio queda **registrado en el repo**: entrada en `CHANGELOG.md` (Keep a Changelog + SemVer) y **tag `vX.Y.Z`**.
- [ ] La **comunicación es proporcional** al impacto (nota de versión / status page / aviso in-app según corresponda).
- [ ] Tras desplegar: **smoke test / health check** post-deploy en verde; si falló el criterio de disparo, **rollback ejecutado**; si hubo rollback o incidente, **mini-postmortem** escrita.
- [ ] La **compuerta de deploy a producción** existe en el pipeline (preview por PR + aprobación ligera / `environment: production` o `when: manual`).
- [ ] El **revisor** (`qa-ingeniero`, y `seguridad-appsec` si el release toca auth/roles/datos personales) firmó la fila del scoreboard en el mismo commit del entregable.

## Registro de uso
| Fecha | Proyecto | Tarea | Resultado | Lección |
|---|---|---|---|---|
