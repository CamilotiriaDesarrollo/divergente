# Plan de rollback de migración de BD — <PROYECTO> / SDC F-GSI-037 nº <____>

> Adjunto obligatorio de toda migración de BD a producción de una entidad estatal.
> M-GSI-003 §1.4 y P-GSI-004 §2: **sin plan de rollback documentado no hay cambio**.
> Ver skill `devops-gestion-cambios-itil-gobierno`. Rellena TODOS los campos; los `(*)` bloquean la aprobación.

## 1. Identificación
- Migración / versión Flyway (o migración EF): `<Vaaaammdd_nn__descripcion / NombreMigracion>`
- Motor y ambiente objetivo: `<SQL Server 2022 | Azure SQL>` — `<producción>`
- Responsable técnico (sustenta en el CCC) (*): `<nombre>`
- Ventana propuesta (fuera de jornada, fuera de congelamiento 15dic–15ene) (*): `<fecha/hora>`

## 2. Respaldo previo (*)
- [ ] Respaldo `FULL` tomado y **verificado (RESTORE VERIFYONLY)** antes de migrar.
- Ubicación del respaldo: `<ruta/bucket>`  ·  Tamaño/hora: `<____>`
- Comando de referencia:
  ```sql
  BACKUP DATABASE [<DB_NAME>] TO DISK = N'<ruta>\<DB>_preMig_<version>.bak' WITH INIT, CHECKSUM;
  RESTORE VERIFYONLY FROM DISK = N'<ruta>\<DB>_preMig_<version>.bak';
  ```

## 3. Criterio de disparo del rollback (*)
Se ejecuta el rollback si durante o tras la ventana ocurre cualquiera de:
- [ ] La migración termina con error (código de salida ≠ 0 / excepción de Flyway/EF).
- [ ] Las pruebas de humo post-migración fallan (ver §5).
- [ ] Aparece **actividad no contemplada** (M-GSI-003 §1.4): no se improvisa, se revierte.

## 4. Procedimiento de reversión (elige la vía y detállala)
- **Vía A — Restaurar respaldo (por defecto para cambios con pérdida de datos):**
  ```sql
  ALTER DATABASE [<DB_NAME>] SET SINGLE_USER WITH ROLLBACK IMMEDIATE;
  RESTORE DATABASE [<DB_NAME>] FROM DISK = N'<ruta>\<DB>_preMig_<version>.bak' WITH REPLACE;
  ALTER DATABASE [<DB_NAME>] SET MULTI_USER;
  ```
- **Vía B — Script/undo de esquema (solo cambios reversibles sin pérdida):**
  - Flyway Community NO trae `undo` (es de pago): adjunta un script inverso versionado `<...__undo.sql>` probado en staging.
  - EF Core: `dotnet ef database update <migracion-anterior>` (aplica `Down()`; NO recupera datos borrados).
- Tiempo estimado de reversión (*): `<____ min>`  ·  RTO comprometido: `<____>`

## 5. Validación post-migración y post-rollback
- [ ] Pruebas de humo: `<consultas/endpoints clave>` responden y devuelven datos esperados.
- [ ] Conteos/integridad: `<validar_*.sql>` sin duplicados ni FK huérfanas.
- [ ] Tras rollback (si se ejecuta): la app opera sobre el estado previo sin errores.

## 6. Cierre (M-GSI-003 §3)
- [ ] Resultado clasificado: Exitoso / No exitoso / Cancelado / Rechazado / No ejecutado.
- [ ] CMDB actualizada con la versión de esquema desplegada.
- [ ] RIP/PIR documentada en ≤ 2 días hábiles.
