<#
.SYNOPSIS
  Backup FULL/DIFF/LOG de SQL Server con verificacion, compresion, checksum y cifrado.
  Fabrica de Software Divergente — skill devops-backup-dr (activo base N0, sin verificar en proyecto propio).

.DESCRIPTION
  SIN SECRETOS: se parametriza por variables de entorno. Pensado para Windows (SO del Dueno) y para
  programarse con Task Scheduler (ver skill devops-scheduler-windows-powershell).
  Requiere el modulo SqlServer (Install-Module SqlServer) o, en su defecto, sqlcmd.

.NOTES
  - El cifrado de backup exige crear UNA SOLA VEZ un certificado de servidor (ver bloque T-SQL al final).
    Respalda ese certificado y su clave privada APARTE del backup; sin el, el backup cifrado es irrecuperable.
  - Modelo de recuperacion: para tomar backups LOG la BD debe estar en FULL recovery.
  - Verificar politicas de ventana y ubicacion contra M-GSI-002 antes de usar en produccion estatal.
#>
param(
  [string]$Instancia   = $env:SQL_INSTANCE,      # ej. "SERVIDOR\INSTANCIA"  o  "(localdb)\MSSQLLocalDB"
  [string]$BaseDatos   = $env:SQL_DATABASE,      # ej. "MiSistema_PROD"
  [ValidateSet('FULL','DIFF','LOG')]
  [string]$Tipo        = 'FULL',
  [string]$Destino     = $env:BACKUP_DIR,        # ej. "D:\Backups"  (disco DISTINTO al de datos)
  [string]$Offsite     = $env:BACKUP_OFFSITE,    # opcional: UNC/otra unidad para la copia fuera de sitio
  [string]$Certificado = $env:BACKUP_CERT_NAME   # nombre del certificado de cifrado en [master]; vacio = sin cifrado
)
$ErrorActionPreference = 'Stop'
if (-not $Instancia -or -not $BaseDatos -or -not $Destino) {
  throw "Faltan parametros. Define SQL_INSTANCE, SQL_DATABASE y BACKUP_DIR (o pasalos por argumento)."
}

$stamp = Get-Date -Format 'yyyyMMdd_HHmmss'
$ext   = @{ FULL='bak'; DIFF='dif'; LOG='trn' }[$Tipo]
$carpeta = Join-Path $Destino $BaseDatos
New-Item -ItemType Directory -Force -Path $carpeta | Out-Null
$archivo = Join-Path $carpeta "$($BaseDatos)_$($Tipo)_$stamp.$ext"

# --- Clausula de cifrado (opcional) ---
$cifrado = ''
if ($Certificado) { $cifrado = ", ENCRYPTION (ALGORITHM = AES_256, SERVER CERTIFICATE = [$Certificado])" }

# --- Comando BACKUP segun tipo ---
switch ($Tipo) {
  'FULL' { $tsql = "BACKUP DATABASE [$BaseDatos] TO DISK = N'$archivo' WITH COMPRESSION, CHECKSUM, INIT, STATS = 10$cifrado;" }
  'DIFF' { $tsql = "BACKUP DATABASE [$BaseDatos] TO DISK = N'$archivo' WITH DIFFERENTIAL, COMPRESSION, CHECKSUM, INIT, STATS = 10$cifrado;" }
  'LOG'  { $tsql = "BACKUP LOG [$BaseDatos] TO DISK = N'$archivo' WITH COMPRESSION, CHECKSUM, INIT, STATS = 10$cifrado;" }
}

Write-Host "[$(Get-Date -Format s)] Backup $Tipo de [$BaseDatos] -> $archivo"
Invoke-Sqlcmd -ServerInstance $Instancia -Query $tsql -QueryTimeout 0

# --- Verificacion OBLIGATORIA: un backup no verificado no cuenta ---
Write-Host "Verificando integridad (RESTORE VERIFYONLY)..."
Invoke-Sqlcmd -ServerInstance $Instancia -Query "RESTORE VERIFYONLY FROM DISK = N'$archivo' WITH CHECKSUM;" -QueryTimeout 0
Write-Host "OK: verificacion superada."

# --- Copia fuera de sitio (3-2-1) ---
if ($Offsite) {
  New-Item -ItemType Directory -Force -Path $Offsite | Out-Null
  Copy-Item -Path $archivo -Destination $Offsite -Force
  Write-Host "Copia offsite en $Offsite"
}

# --- Rotacion simple por retencion (ajusta los dias segun la politica) ---
# (evitamos el operador ?? para ser compatible con Windows PowerShell 5.1)
$retencionDias = if ($env:BACKUP_RETENTION_DAYS) { [int]$env:BACKUP_RETENTION_DAYS } else { 14 }
Get-ChildItem $carpeta -Filter "*.$ext" |
  Where-Object { $_.LastWriteTime -lt (Get-Date).AddDays(-$retencionDias) } |
  Remove-Item -Force
Write-Host "Rotacion aplicada (> $retencionDias dias)."

<#  ============================================================================
    PREPARACION UNICA — crear la infraestructura de cifrado (ejecutar una vez):
    ----------------------------------------------------------------------------
    USE master;
    CREATE MASTER KEY ENCRYPTION BY PASSWORD = '${MASTER_KEY_PASSWORD}';
    CREATE CERTIFICATE ${BACKUP_CERT_NAME}
        WITH SUBJECT = 'Backup cifrado ${NOMBRE_PROYECTO}';
    -- Respaldar el certificado y su clave privada FUERA del servidor de datos:
    BACKUP CERTIFICATE ${BACKUP_CERT_NAME}
        TO FILE = '${RUTA_SEGURA}\${BACKUP_CERT_NAME}.cer'
        WITH PRIVATE KEY (FILE = '${RUTA_SEGURA}\${BACKUP_CERT_NAME}.pvk',
                          ENCRYPTION BY PASSWORD = '${CERT_PRIVATE_KEY_PASSWORD}');
    -- Poner la BD en FULL recovery si se toman backups de log:
    -- ALTER DATABASE [${SQL_DATABASE}] SET RECOVERY FULL;
    ============================================================================ #>
