---
name: devops-backup-dr
regimen: universal
description: Diseña la política de copias de seguridad y el plan de recuperación ante desastres (backup & DR) exigidos como entregable por la normativa, para el stack real de la fábrica — SQL Server (línea gobierno), BD gestionada Postgres/Vercel (línea privada), código en Git, datasets y secretos. Cárgala cuando haya que redactar una política de backup, definir RPO/RTO, escribir un script de respaldo o de restauración, montar un backup verificado en CI, ensayar una restauración, armar un runbook DR, o cuando aparezcan las siglas RPO, RTO, 3-2-1, DBCC CHECKDB, pg_dump, PITR, M-GSI-002, ISO 27001 A.8.13/A.17.
---

> **Régimen: universal.** Sirve a ambos regímenes. Las referencias a normativa estatal (M-GSI-002, DI-GSI-010, ITIL/M-GSI-003, SDC F-GSI-037, aprobación de `cumplimiento-normativo`, «entidad pública») aplican SOLO en proyectos `institucional`; en un proyecto `divergente`, ignóralas y usa la variante de la línea privada (Postgres/Vercel: `pg_dump`/PITR, backup verificado en CI, runbook propio). El núcleo (RPO/RTO, regla 3-2-1, restauración ensayada) es universal y **no** exime a un producto propio de tener backups.

# DevOps: copias de seguridad y recuperación ante desastres (backup & DR)

**Nivel actual:** N0 · **Dominio:** devops · **Agente(s):** `devops-plataforma` (con `cumplimiento-normativo` en aprobación y `seguridad-appsec` cuando hay datos personales)
**Proyectos fuente:** ninguno — creada desde buenas prácticas (VACÍO del portafolio).

> Criterio de ascenso a N1: los 5 bloques completos, con activos copiables de ruta real y gotchas verificados (no genéricos). A N2: ≥1 uso real aceptado por el Dueño. A N3: ≥3 usos exitosos en ≥2 proyectos + checklist propio.

## 1. Propósito

La normativa estatal exige una **política de backup y un plan de recuperación como entregable**, pero ningún proyecto del portafolio la ha ejercitado: **no hay práctica propia ni una sola restauración ensayada**. Esta skill cubre ese vacío con un punto de partida correcto y accionable para el stack real de la fábrica, no un consejo genérico.

Se carga cuando `devops-plataforma` debe: redactar la **política de backup/DR** de un proyecto (entregable de F3 "backups activos desde el día uno" y de G6); definir **RPO/RTO** por sistema; escribir scripts de **respaldo** y de **restauración**; automatizar un **backup verificado** en el pipeline; ejecutar un **ensayo de restauración** trimestral; o construir un **runbook DR**. Ata directamente a **M-GSI-002** (política de respaldo/seguridad de la entidad), a **DI-GSI-010** (marco de desarrollo Min. de las Culturas), a **ITIL M-GSI-003** (toda ejecución sobre producción es un cambio formal) e **ISO/IEC 27001:2022 A.8.13** (Information backup) y **A.5.29/A.5.30** (continuidad TIC). Complementa a `devops-observabilidad-logging-apm` (detección) y a `seg-gestion-secretos-keyvault` (recuperación de secretos).

## 2. Procedimiento

**Paso 1 — Inventariar qué se respalda y clasificar criticidad.** Recorre el stack del proyecto y clasifica cada dato según la línea:

- **BD SQL Server** (línea gobierno, .NET/SQL Server) → el activo más crítico; estrategia nativa (Paso 4).
- **BD gestionada Postgres/Neon** (línea privada, Next.js/Vercel) → dump + PITR del proveedor (Paso 5).
- **Código y config** → Git es la fuente de verdad, pero las **variables de entorno de Vercel NO están en Git** (`vercel env pull`) y el mirror del remoto conviene.
- **Datasets / Google Sheets operacional** (línea Python de datos/scraping) → export versionado diario.
- **Secretos** (Key Vault) → metadatos + procedimiento de re-provisión (no el secreto en claro).
- **Marcar lo *reconstruible*** (cachés, `node_modules`, artefactos de build, export estático regenerable) → NO se respalda; anotarlo evita respaldar ruido.

**Paso 2 — Fijar RPO y RTO por sistema, y firmarlos con el Dueño.** RPO = máxima pérdida de datos tolerable; RTO = máximo tiempo caído. No los inventes: son una **decisión abierta del blueprint** que cierra el Dueño (regla inviolable #2). La estrategia se deriva del RPO: RPO de minutos en SQL Server ⇒ backups de LOG frecuentes (exige *recovery model* FULL); RPO de 24 h ⇒ dump diario basta. Rellena la matriz de `politica-backup-dr.md` §2.

**Paso 3 — Aplicar el esquema 3-2-1-1-0.** 3 copias, 2 medios, 1 fuera de sitio, **+1 inmutable/offline** (object-lock/WORM, defensa anti-ransomware), **+0 errores** (toda copia verificada). Sin la copia inmutable, un ransomware que cifra la red cifra también los backups.

**Paso 4 — SQL Server (línea gobierno).** Usa `Backup-SqlServer.ps1`: `BACKUP DATABASE ... WITH COMPRESSION, CHECKSUM, INIT` para FULL/DIFF y `BACKUP LOG` para la cadena de logs; **cifrado** `WITH ENCRYPTION (ALGORITHM = AES_256, SERVER CERTIFICATE = ...)` (requiere crear el certificado UNA vez y respaldarlo aparte). Verificación obligatoria con `RESTORE VERIFYONLY ... WITH CHECKSUM`. Programa con **Task Scheduler** (skill `devops-scheduler-windows-powershell`). Cadencia típica: FULL diario + DIFF cada 6 h + LOG cada 15 min.

**Paso 5 — BD gestionada / línea Vercel.** Usa `backup-verify.yml` (GitHub Actions, portable a GitLab CI): `pg_dump -Fc` diario, **verificado con `pg_restore --list`** (si el dump está corrupto, el pipeline corta), cifrado con GPG a clave pública y subido a almacenamiento con object-lock. Prefiere el **PITR nativo** del proveedor cuando exista (menor RPO que el dump). Respalda también las variables con `vercel env pull`.

**Paso 6 — Ensayar la restauración (lo que cierra el vacío).** "Un backup no probado no es un backup". Ejecuta `Restaurar-SqlServer-ensayo.ps1` en un **servidor de pruebas**: restaura a una BD `_ENSAYO`, corre `DBCC CHECKDB`, cuenta filas de tablas clave y **mide el RTO real**. Cada ensayo produce evidencia en `registro-ensayo-restauracion.md`. Cadencia mínima trimestral. Si el simulacro toca producción estatal, tramítalo como **cambio ITIL (M-GSI-003)**.

**Paso 7 — Escribir el runbook DR y cablearlo a las compuertas.** Redacta `runbook-dr.md` con los escenarios (pérdida/corrupción de BD, ransomware, pérdida de región, borrado accidental, compromiso de secretos), orden de restauración (BD → backend → frontend) y verificación post-recuperación. La política + el primer ensayo son ítem de **G6** (despliegue: "observabilidad y backups activos desde el día uno").

**Nota de frescura (regla #8):** los detalles dependen de versiones que cambian — el cifrado de backup en SQL Server exige un certificado/clave y una edición que lo soporte; `pg_dump` debe ser de versión ≥ la del servidor; la disponibilidad de PITR y object-lock depende del proveedor. **Verifica contra la documentación vigente antes de usar en un proyecto real**, y confirma los numerales de M-GSI-002 contra el PDF oficial de la entidad (el PDF prevalece).

## 3. Activos copiables

Todos en `.claude/skills/devops-backup-dr/activos/`. **Creados desde buenas prácticas (N0), sin secretos**, con placeholders `${VAR}`; ninguno probado aún en proyecto propio.

- **`politica-backup-dr.md`** — plantilla del entregable: alcance, RACI, matriz **RPO/RTO**, esquema 3-2-1-1-0, cifrado/retención, tratamiento de datos personales (Habeas Data) y calendario de ensayos. Cópiala a `docs/` del proyecto; rellena `${...}` y borra las notas `[ ]`. Es el documento que pide la norma.
- **`Backup-SqlServer.ps1`** — respaldo FULL/DIFF/LOG con compresión, checksum, cifrado AES-256 y `RESTORE VERIFYONLY`, rotación por retención y copia offsite. Parametrizado por entorno (`SQL_INSTANCE`, `SQL_DATABASE`, `BACKUP_DIR`…). **Adaptar:** nombre de BD, cadencia, ruta offsite y el certificado de cifrado (bloque T-SQL de preparación al final). Compatible con Windows PowerShell 5.1.
- **`Restaurar-SqlServer-ensayo.ps1`** — ensayo de restauración a una BD `_ENSAYO` + `DBCC CHECKDB` + conteo de tablas clave + **medición de RTO**. Genera la evidencia del ensayo trimestral. **Adaptar:** instancia de PRUEBAS, `TablasClave` de tu dominio.
- **`backup-verify.yml`** — GitHub Actions: `pg_dump` diario **verificado** (`pg_restore --list`), cifrado GPG y artifact; incluye el equivalente **GitLab CI** comentado y los pasos opcionales de object-lock y `vercel env pull`. **Adaptar:** cron/zona horaria, secrets, destino inmutable.
- **`runbook-dr.md`** — guía de recuperación por escenario, orden de restauración y cierre (post-mortem/RIP-PIR). **Adaptar:** contactos, decisor, sistemas.
- **`registro-ensayo-restauracion.md`** — plantilla de evidencia auditable de cada ensayo (RPO/RTO logrado vs. meta, resultado DBCC, conteos, aprobación). Uno por ensayo.

## 4. Gotchas verificados

Riesgos **documentados de la práctica**, marcados honestamente como **sin verificar aún en proyecto propio (N0)** — se confirmarán y ganarán evidencia al primer uso real:

- **Un backup que nunca se restauró no es un backup (N0, sin verificar).** El fallo clásico de DR es descubrir en la emergencia que la copia está corrupta, incompleta o no restaura. Por eso el Paso 6 y `registro-ensayo-restauracion.md` son el núcleo de la skill: `RESTORE VERIFYONLY`/`pg_restore --list` en cada ciclo + restauración completa trimestral. Este es exactamente el vacío que originó la skill.
- **Backup cifrado sin resguardar la clave = pérdida total (N0, sin verificar).** Si cifras con `WITH ENCRYPTION` y no respaldas el **certificado y su clave privada FUERA** del servidor de datos, un desastre que se lleve el servidor deja los backups irrecuperables. El script incluye el `BACKUP CERTIFICATE` a ruta segura por esto.
- **LOG backups sin recovery model FULL fallan (N0, sin verificar).** `BACKUP LOG` exige que la BD esté en FULL recovery; en SIMPLE falla. Y si activas FULL pero nunca tomas LOG backups, el log de transacciones **crece sin límite** hasta llenar el disco. Decide RPO y recovery model juntos.
- **Backups en el mismo disco/servidor que los datos no son DR (N0, sin verificar).** Un fallo de disco o un ransomware se lleva ambos. De ahí el offsite y la copia inmutable del 3-2-1-1-0; escribir el `.bak` al lado del `.mdf` da falsa sensación de seguridad.
- **La línea Vercel esconde qué respaldar (N0, sin verificar).** El código está en Git (recuperable), pero las **variables de entorno de producción NO** — se pierden si no se hace `vercel env pull`. Y si la BD gestionada no tiene PITR/backup contratado, "está en la nube" no implica que esté respaldada.
- **Los backups son datos personales (N0, sin verificar).** Una copia con datos personales hereda la finalidad y el plazo de la Ley 1581 (Habeas Data): retención acotada, cifrado y **borrado seguro** al vencer. Un derecho de supresión debe poder atenderse también sobre lo respaldado — coordinar con `seguridad-appsec`.
- **Restaurar en producción sin cambio ITIL incumple (N0, sin verificar).** En entidad estatal, un ensayo o una recuperación que toque el ambiente productivo es un **cambio formal (M-GSI-003)**; improvisar salta la gestión de cambios. Por eso los ensayos van en servidor de pruebas y el runbook lo advierte.
- **`pg_dump` más viejo que el servidor puede fallar o truncar (N0, sin verificar).** El cliente de PostgreSQL debe ser de versión ≥ la del servidor; en el runner de CI fija una imagen coherente con la versión de la BD gestionada.

## 5. Criterios de done

- [ ] Existe **política de backup/DR aprobada** (`cumplimiento-normativo`) con matriz **RPO/RTO por sistema firmada por el Dueño** y citas a M-GSI-002 / DI-GSI-010 / ISO 27001 A.8.13.
- [ ] Todo dato **no reconstruible** del inventario tiene estrategia; lo reconstruible está explícitamente excluido.
- [ ] Se cumple **3-2-1-1-0**: 3 copias, 2 medios, 1 offsite, 1 inmutable/offline, 0 copias sin verificar.
- [ ] Los backups se **verifican automáticamente** (`RESTORE VERIFYONLY` / `pg_restore --list`) y están **cifrados**, con la clave/cert resguardada aparte.
- [ ] Se ejecutó **al menos un ensayo de restauración real** con `registro-ensayo-restauracion.md` diligenciado: RTO/RPO **medidos** dentro de objetivo y `DBCC CHECKDB` sin errores.
- [ ] Existe **runbook DR** con escenarios, orden de restauración y responsable de activación.
- [ ] Ningún secreto/credencial commiteado; scripts y workflow usan `${VAR}`/`secrets.*`.
- [ ] En producción estatal: la ejecución sobre el ambiente productivo está encuadrada como **cambio ITIL (M-GSI-003)** y los backups están **activos desde el go-live** (G6).

## Registro de uso
| Fecha | Proyecto | Tarea | Resultado | Lección |
|---|---|---|---|---|
