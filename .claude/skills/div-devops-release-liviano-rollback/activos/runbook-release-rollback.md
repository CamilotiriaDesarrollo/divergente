# Runbook de release liviano + rollback — <NOMBRE_PRODUCTO>

> Plantilla N0 (hermana divergente de la gestión de cambios ITIL). Copia a `docs/` del
> producto y rellena los `<...>`. Este runbook reemplaza a la SDC F-GSI-037 de la línea
> institucional: aquí no hay comité, pero el rollback probado y el registro siguen siendo
> obligatorios.

## 0. Identificación del release
- Versión (SemVer): `v<X.Y.Z>`
- Tipo: [ ] reversible en caliente  [ ] con cambio de datos  [ ] hotfix/incidente
- Responsable del deploy: `<persona>`
- Guardia (quien puede ejecutar el rollback): `<persona>` — permisos confirmados: [ ]
- Ventana propuesta: `<fecha/hora, horario de bajo tráfico>`  (¿es viernes/tarde-noche? [ ] no)

## 1. Pre-deploy (checklist)
- [ ] CI en verde (lint + tests + build) sobre la rama que se va a promover.
- [ ] Deploy **preview** revisado y aprobado (paridad de env vars con prod verificada).
- [ ] Entrada de `CHANGELOG.md` redactada para `v<X.Y.Z>`.
- [ ] Plan de rollback definido y **probado** (ver §3) — destino de rollback confirmado disponible.
- [ ] Criterio de disparo del rollback acordado (ver §4).
- [ ] Si hay migración de BD: es retrocompatible (expand); lo destructivo se pospone; backup/PITR confirmado.
- [ ] Comunicación preparada según impacto (ver §5).

## 2. Deploy
1. Etiquetar el commit: `git tag v<X.Y.Z> && git push --tags`.
2. Migración de BD **antes** del código (si aplica y es retrocompatible).
3. Promover a producción (compuerta del pipeline / `vercel --prod` / redeploy de imagen).
4. Anotar la referencia del deployment de destino (URL de Vercel / SHA de imagen) para poder revertir.

## 3. Procedimiento de ROLLBACK por plataforma
Elige la sección de tu stack. Anota aquí el destino ANTES de desplegar.

### Vercel (deployments inmutables)
- Deployment anterior estable: `<url-o-id>` — confirmado disponible: [ ]
- Revertir: Dashboard → *Instant Rollback*, **o** `vercel rollback <url-anterior>` / `vercel promote <url-anterior>`.
- Ojo: NO revierte BD ni env vars. Si el release migró datos o cambió variables, ver §BD.

### Contenedores / registry
- Imagen anterior tagueada por SHA: `<registry>/app:git-<sha-anterior>` — retenida: [ ]
- Revertir: redeploy del tag anterior (no de `:latest`).

### Base de datos (Postgres gestionado)
- Migración de este release: `<archivo/id>` — es retrocompatible (expand): [ ]
- Script `down` probado en staging: [ ]  · Backup/PITR disponible antes del deploy: [ ]
- Regla: revertir el **código** promoviendo el deployment/imagen anterior; el esquema **no** se revierte
  si se aplicó expand/contract. Solo se restaura BD (PITR/backup) ante corrupción o migración destructiva.

## 4. Criterio de disparo (cuándo revertir sin debatir)
Se ejecuta el rollback de §3 si tras el deploy ocurre cualquiera de:
- [ ] Health check `GET <url>/api/health` no responde `ok`.
- [ ] `error rate` > `<umbral>` durante `<N>` min.
- [ ] Smoke test del flujo crítico `<describir>` falla.
- [ ] `<otra señal específica del producto>`.

## 5. Comunicación (proporcional al impacto)
- Sin impacto visible → GitHub/GitLab Release con la nota de versión.
- Cambio visible / breve indisponibilidad → aviso por `<status page / Slack / Discord / banner in-app / correo>`.
- SaaS con SLA → incidente programado en la status page con antelación razonable.

## 6. Cierre (post-deploy)
- [ ] Smoke test / health check en verde.
- [ ] Si se disparó el rollback: ejecutado y verificado el servicio estable.
- [ ] `CHANGELOG.md` y tag `v<X.Y.Z>` confirmados.
- [ ] Si hubo rollback o incidente: **mini-postmortem** abajo.
- [ ] Fila del scoreboard escrita por el revisor.

### Mini-postmortem (solo si hubo rollback/incidente)
- Qué falló:
- Qué señal disparó el rollback:
- Tiempo hasta recuperar (equivalente ligero del RTO):
- Acción de fondo para que no se repita:
