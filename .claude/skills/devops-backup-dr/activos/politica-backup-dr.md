# Política de Copias de Seguridad y Recuperación ante Desastres — ${NOMBRE_PROYECTO}

> Entregable exigido por la normativa (política de backup). Plantilla base — reemplaza los `${...}` y borra las notas entre `[ ]`.
> **Fuente normativa a citar/verificar:** política de respaldo/seguridad de la entidad (**M-GSI-002**), directriz de desarrollo **DI-GSI-010**, gestión de cambios **ITIL M-GSI-003** para ejecutar restauraciones/simulacros en producción, e **ISO/IEC 27001:2022** controles **A.8.13** (Information backup) y **A.5.29 / A.5.30** (ICT readiness for business continuity). Confirma los numerales exactos contra el PDF oficial de la entidad — este documento operativo NO reemplaza la norma.

## 1. Alcance y responsables
- **Sistemas cubiertos:** [listar BD, código, secretos, datasets, sitios estáticos].
- **Responsable de operación:** `devops-plataforma`. **Aprobación normativa:** `cumplimiento-normativo`. **Datos personales:** `seguridad-appsec` (Habeas Data, Ley 1581).
- **Fuera de alcance:** [ej. logs de más de N días, cachés reconstruibles].

## 2. Objetivos de recuperación (RPO / RTO)
| Sistema | Criticidad | RPO (máx. pérdida de datos) | RTO (máx. tiempo caído) | Estrategia |
|---|---|---|---|---|
| BD SQL Server (gobierno) | Alta | ${RPO_BD:-15 min} | ${RTO_BD:-4 h} | FULL diario + DIFF cada 6 h + LOG cada 15 min |
| BD gestionada (Vercel/Postgres) | Alta | ${RPO_PG:-24 h} | ${RTO_PG:-2 h} | `pg_dump` diario cifrado + PITR del proveedor |
| Código y config | Alta | 0 (Git es la fuente) | ${RTO_CODE:-1 h} | Git remoto + mirror + `vercel env pull` de variables |
| Datasets / Google Sheets operacional | Media | ${RPO_DATOS:-24 h} | ${RTO_DATOS:-8 h} | Export diario versionado |
| Secretos (Key Vault) | Alta | ${RPO_SECRETOS:-24 h} | ${RTO_SECRETOS:-2 h} | Export de metadatos + procedimiento de re-provisión |

## 3. Esquema 3-2-1(-1-0)
- **3** copias de cada dato, **2** medios distintos, **1** fuera de sitio (offsite/otra región).
- **+1** copia **inmutable u offline** (object-lock / WORM) como defensa ante ransomware y borrado accidental.
- **+0** errores: toda copia se **verifica** (`RESTORE VERIFYONLY`, checksum, `DBCC CHECKDB`); una copia no verificada no cuenta.

## 4. Cifrado, retención y disposición
- **Cifrado en reposo:** AES-256. SQL Server con `WITH ENCRYPTION` (certificado de servidor); dumps con `gpg`/`age` a clave pública. La clave/cert **nunca** viaja junto al backup.
- **Retención:** diarios ${RET_DIARIO:-14 d}, semanales ${RET_SEMANAL:-8 sem}, mensuales ${RET_MENSUAL:-12 meses}, anuales ${RET_ANUAL:-según contrato}.
- **Datos personales (Habeas Data):** los backups heredan la finalidad y el plazo del dato; su **borrado seguro** al vencer la retención es parte de la política. Documentar cómo se atiende un derecho de supresión sobre datos ya respaldados.

## 5. Ensayos de restauración (obligatorio — es lo que la auditoría exige)
- **Un backup no probado no es un backup.** Calendario mínimo: **restauración completa trimestral** + **verificación automática** en cada ciclo de copia.
- Cada ensayo produce un registro (`registro-ensayo-restauracion.md`) con RTO/RPO medidos, resultado de `DBCC CHECKDB` y conteos de filas. Se archiva como evidencia.
- En producción estatal, el simulacro que toque el ambiente productivo se tramita como **cambio ITIL (M-GSI-003)**.

## 6. Escenarios DR cubiertos
Ver `runbook-dr.md`: pérdida de BD, corrupción, borrado accidental, ransomware, pérdida de región/proveedor, y compromiso de secretos. Cada escenario con disparador, orden de restauración y verificación post-recuperación.
