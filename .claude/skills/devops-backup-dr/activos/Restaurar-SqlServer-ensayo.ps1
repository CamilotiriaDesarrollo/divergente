<#
.SYNOPSIS
  Ensayo de restauracion de SQL Server: restaura el ultimo backup a una BD desechable,
  corre DBCC CHECKDB, cuenta filas de tablas clave y mide el RTO. Genera evidencia auditable.
  Fabrica de Software Divergente — skill devops-backup-dr (activo base N0, sin verificar en proyecto propio).

.DESCRIPTION
  "Un backup no probado no es un backup". Este script materializa el ensayo trimestral exigido
  por la politica. NO toca la BD de produccion: restaura con un nombre nuevo (_ENSAYO) y con MOVE
  a rutas de scratch. Al terminar deja la BD de ensayo para inspeccion o la borra con -Limpiar.

.NOTES
  Ejecutar en un servidor de pruebas. Si se hace contra el ambiente productivo estatal,
  tramitar como cambio ITIL (M-GSI-003). Requiere el modulo SqlServer o sqlcmd.
#>
param(
  [string]$Instancia = $env:SQL_INSTANCE_TEST,   # instancia de PRUEBAS, no produccion
  [string]$BaseDatos = $env:SQL_DATABASE,        # nombre logico original, ej. "MiSistema_PROD"
  [string]$Backup    = $env:BACKUP_FILE,         # ruta al .bak FULL a probar; vacio = el mas reciente en BACKUP_DIR
  [string]$BackupDir = $env:BACKUP_DIR,
  [string]$ScratchDir= $env:RESTORE_SCRATCH_DIR, # carpeta para los .mdf/.ldf restaurados
  [string[]]$TablasClave = @('dbo.Usuarios','dbo.Transacciones'),  # ajusta a tu dominio
  [switch]$Limpiar
)
$ErrorActionPreference = 'Stop'
if (-not $Backup) {
  $Backup = (Get-ChildItem (Join-Path $BackupDir $BaseDatos) -Filter '*_FULL_*.bak' |
             Sort-Object LastWriteTime -Descending | Select-Object -First 1).FullName
}
if (-not $Backup) { throw "No se encontro backup FULL. Define BACKUP_FILE o revisa BACKUP_DIR." }

$destino = "$($BaseDatos)_ENSAYO"
$t0 = Get-Date
Write-Host "[$(Get-Date -Format s)] Ensayo de restauracion: $Backup -> [$destino]"

# 1) Leer los archivos logicos del backup para construir el MOVE
$files = Invoke-Sqlcmd -ServerInstance $Instancia -Query "RESTORE FILELISTONLY FROM DISK = N'$Backup';"
$moves = foreach ($f in $files) {
  $ext = if ($f.Type -eq 'L') { 'ldf' } else { 'mdf' }
  "MOVE N'$($f.LogicalName)' TO N'$(Join-Path $ScratchDir ($destino + '_' + $f.LogicalName + '.' + $ext))'"
}
$moveClause = ($moves -join ", ")

# 2) Restaurar a la BD desechable
$restore = "RESTORE DATABASE [$destino] FROM DISK = N'$Backup' WITH $moveClause, REPLACE, RECOVERY, STATS = 10;"
Invoke-Sqlcmd -ServerInstance $Instancia -Query $restore -QueryTimeout 0
$rto = (Get-Date) - $t0

# 3) Integridad fisica y logica
Write-Host "DBCC CHECKDB..."
$checkdb = Invoke-Sqlcmd -ServerInstance $Instancia -Database $destino -Query "DBCC CHECKDB WITH NO_INFOMSGS, ALL_ERRORMSGS;"
$dbccOk  = ($null -eq $checkdb) -or ($checkdb.Count -eq 0)

# 4) Conteos de tablas clave (senal de que los datos llegaron completos)
$conteos = foreach ($t in $TablasClave) {
  try {
    $n = (Invoke-Sqlcmd -ServerInstance $Instancia -Database $destino -Query "SELECT COUNT(*) AS n FROM $t;").n
    "{0}: {1} filas" -f $t, $n
  } catch { "{0}: ERROR ({1})" -f $t, $_.Exception.Message }
}

# 5) Reporte de evidencia (rellena registro-ensayo-restauracion.md con estos datos)
Write-Host "==================== EVIDENCIA DE ENSAYO ===================="
Write-Host ("Backup probado : {0}" -f $Backup)
Write-Host ("RTO medido     : {0:hh\:mm\:ss}" -f $rto)
Write-Host ("DBCC CHECKDB   : {0}" -f ($(if ($dbccOk) { 'SIN ERRORES' } else { 'ERRORES — REVISAR' })))
$conteos | ForEach-Object { Write-Host ("Conteo         : {0}" -f $_) }
Write-Host "============================================================"

if ($Limpiar) {
  Invoke-Sqlcmd -ServerInstance $Instancia -Query "DROP DATABASE [$destino];"
  Write-Host "BD de ensayo eliminada."
} else {
  Write-Host "BD [$destino] conservada para inspeccion. Borrala manualmente o re-ejecuta con -Limpiar."
}
if (-not $dbccOk) { exit 1 }
