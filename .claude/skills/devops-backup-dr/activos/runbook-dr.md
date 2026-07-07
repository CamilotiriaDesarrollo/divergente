# Runbook de Recuperación ante Desastres — ${NOMBRE_PROYECTO}

> Guía operativa para ejecutar una recuperación bajo presión. Reemplaza los `${...}`.
> En producción estatal, la ejecución que toque el ambiente productivo se tramita como **cambio ITIL (M-GSI-003)** (emergencia = CCCE, SDC formal en ≤3 días). Comunicar indisponibilidad según política.

## 0. Datos de activación
- **Disparador:** [qué evento activa este runbook — caída total, corrupción, ransomware, borrado].
- **Quién declara el desastre:** ${ROL_DECISOR} (`devops-plataforma` propone; el Dueño confirma).
- **Contactos:** [proveedor cloud, DBA, seguridad, funcional de la entidad].
- **RTO/RPO comprometidos:** ver `politica-backup-dr.md` §2.
- **Orden de restauración entre sistemas:** BD → backend → frontend → integraciones.

## 1. Escenario: pérdida o corrupción de BD SQL Server
1. Aislar: detener escrituras (poner la app en mantenimiento) para no perder datos nuevos ni sobrescribir.
2. Restaurar cadena: último **FULL** + último **DIFF** + todos los **LOG** posteriores `WITH NORECOVERY` y el último `WITH RECOVERY`.
3. Integridad: `DBCC CHECKDB` antes de reabrir tráfico.
4. Verificar conteos y últimos registros contra el RPO esperado. Reabrir escrituras.
5. Registrar RTO real y post-mortem (RIP/PIR si es estatal).

## 2. Escenario: BD gestionada (Vercel/Postgres) perdida
1. Preferir el **PITR del proveedor** si está disponible (menor RPO que el dump).
2. Si no: crear instancia nueva y `pg_restore` del último `.dump.gpg` (descifrar con la clave privada, que vive **fuera** del backup).
3. Reapuntar `DATABASE_URL` en Vercel (`vercel env`), redeploy.

## 3. Escenario: ransomware / cifrado malicioso de backups
1. **No** restaurar sobre infraestructura comprometida. Levantar entorno limpio.
2. Usar la copia **inmutable/offline** (object-lock/WORM) — por eso existe el "+1" del 3-2-1-1-0.
3. Escalar a `seguridad-appsec`; preservar evidencia forense antes de borrar.

## 4. Escenario: pérdida de región / proveedor (Vercel)
1. El **código es recuperable desde Git** (fuente de verdad). Redeploy en región/proveedor alterno.
2. Restaurar variables desde `.env.backup` (`vercel env pull`) y los datos desde §2.
3. Actualizar DNS/dominios; validar salud (`/health`).

## 5. Escenario: borrado accidental (una tabla, un registro)
1. No siempre hace falta DR completo: restaurar el backup a una BD `_ENSAYO` (ver `Restaurar-SqlServer-ensayo.ps1`) y **extraer** solo lo borrado con un `INSERT ... SELECT`.

## 6. Escenario: compromiso de secretos (Key Vault)
1. Rotar TODO secreto expuesto (coordinar con `seguridad-appsec`, skill seg-gestion-secretos-keyvault).
2. Los backups **no** contienen los secretos en claro; re-provisionar desde el procedimiento documentado.

## 7. Cierre (todos los escenarios)
- [ ] Servicio validado (pruebas de humo + `/health`).
- [ ] RTO y RPO reales registrados vs. comprometidos.
- [ ] Post-mortem / RIP-PIR documentado; lecciones a `politica-backup-dr.md` y a esta skill.
- [ ] Si fue estatal: cierre del cambio ITIL y comunicación de restablecimiento.
