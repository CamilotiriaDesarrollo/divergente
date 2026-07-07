# scan-seguridad-local.ps1 — auditoría de seguridad LOCAL antes del push (Windows / PowerShell)
# Corre las mismas comprobaciones que el CI para no descubrir el hallazgo hasta la nube.
# Detecta automáticamente qué stack hay en el repo (npm / .NET / Python).
# N0 (sin verificar aún en proyecto propio): las herramientas externas (semgrep, gitleaks,
# pip-audit) deben estar instaladas; el script las omite con aviso si no están en PATH.
#
# Uso:  .\scan-seguridad-local.ps1 [-Nivel high|moderate|critical]
param(
  [ValidateSet("low", "moderate", "high", "critical")]
  [string]$Nivel = "high"
)
$ErrorActionPreference = "Continue"
$fallos = @()

function Test-Cmd($nombre) { return [bool](Get-Command $nombre -ErrorAction SilentlyContinue) }
function Titulo($t) { Write-Host "`n=== $t ===" -ForegroundColor Cyan }

# --- npm audit en cada package.json (client/, server/, o raíz) ---
Get-ChildItem -Recurse -Depth 2 -Filter package.json |
  Where-Object { $_.FullName -notmatch "node_modules" } | ForEach-Object {
    $dir = $_.Directory.FullName
    Titulo "npm audit :: $dir"
    Push-Location $dir
    npm audit --audit-level=$Nivel
    if ($LASTEXITCODE -ne 0) { $fallos += "npm audit ($dir)" }
    Pop-Location
  }

# --- .NET: paquetes vulnerables (línea gobierno) ---
if (Get-ChildItem -Recurse -Depth 3 -Include *.sln, *.csproj -ErrorAction SilentlyContinue) {
  if (Test-Cmd dotnet) {
    Titulo "dotnet list package --vulnerable"
    dotnet restore | Out-Null
    $out = dotnet list package --vulnerable --include-transitive | Out-String
    Write-Host $out
    if ($out -match "High|Critical") { $fallos += "dotnet vulnerable (High/Critical)" }
  } else { Write-Host "dotnet no está en PATH, se omite" -ForegroundColor Yellow }
}

# --- Python: pip-audit sobre requirements.txt ---
if (Get-ChildItem -Recurse -Depth 2 -Filter requirements.txt -ErrorAction SilentlyContinue) {
  if (Test-Cmd pip-audit) {
    Titulo "pip-audit"
    pip-audit
    if ($LASTEXITCODE -ne 0) { $fallos += "pip-audit" }
  } else { Write-Host "pip-audit no instalado (pip install pip-audit), se omite" -ForegroundColor Yellow }
}

# --- SAST: Semgrep (si está instalado) ---
if (Test-Cmd semgrep) {
  Titulo "semgrep (OWASP Top Ten)"
  semgrep --config p/owasp-top-ten --error .
  if ($LASTEXITCODE -ne 0) { $fallos += "semgrep" }
} else { Write-Host "semgrep no instalado, se omite" -ForegroundColor Yellow }

# --- Secretos: gitleaks (si está instalado) ---
if (Test-Cmd gitleaks) {
  Titulo "gitleaks"
  gitleaks detect --source . --redact --verbose
  if ($LASTEXITCODE -ne 0) { $fallos += "gitleaks (posibles secretos)" }
} else { Write-Host "gitleaks no instalado, se omite" -ForegroundColor Yellow }

# --- Resumen ---
Titulo "RESUMEN"
if ($fallos.Count -eq 0) {
  Write-Host "OK — sin hallazgos que bloqueen el push." -ForegroundColor Green
  exit 0
} else {
  Write-Host "HALLAZGOS:" -ForegroundColor Red
  $fallos | ForEach-Object { Write-Host " - $_" -ForegroundColor Red }
  exit 1
}
