# scrape_programado.ps1 — Wrapper para el scrape automatico (Task Scheduler).
#
# Flujo:
#   1. Corre main.py (agrega --upload automaticamente si existen credenciales).
#   2. Regenera los datos de la landing (scripts/export_landing.py).
#   3. Log completo en logs/scrape_programado_YYYYMMDD_HHMMSS.log (UTF-8).
#
# Registrar/desregistrar la tarea: ver scripts/programar_tarea.ps1

$ErrorActionPreference = "Continue"
$proyecto = Split-Path -Parent $PSScriptRoot
Set-Location -LiteralPath $proyecto

$stamp = Get-Date -Format "yyyyMMdd_HHmmss"
$logFile = Join-Path $proyecto "logs\scrape_programado_$stamp.log"
$env:PYTHONIOENCODING = "utf-8"

# Toda la salida de python se redirige via cmd /c (bytes crudos UTF-8),
# evitando el encoding mixto de *>> en PowerShell 5.1 (UTF-16).
function Log([string]$texto) {
    [System.IO.File]::AppendAllText($logFile, $texto + "`r`n", [System.Text.UTF8Encoding]::new($false))
}

Log "=== Scrape programado: $stamp ==="

# --upload solo si ya existen las credenciales del service account
$creds = Join-Path $proyecto "credentials\service-account.json"
$flagUpload = ""
if (Test-Path -LiteralPath $creds) {
    $flagUpload = "--upload"
    Log "Credenciales detectadas: se sube al Sheet (--upload)."
} else {
    Log "Sin credenciales: solo JSON local (data/ofertas_*.json)."
}

cmd /c "python main.py $flagUpload >> `"$logFile`" 2>&1"
Log "--- exit main.py: $LASTEXITCODE ---"

cmd /c "python scripts\export_landing.py >> `"$logFile`" 2>&1"
Log "--- exit export_landing.py: $LASTEXITCODE ---"

Log "=== Fin: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss') ==="
