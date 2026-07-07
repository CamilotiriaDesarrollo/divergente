# run-carga.ps1 — Ejecuta la prueba de carga k6 en Windows (SO del Dueño) y abre el informe.
#
# Requiere k6 instalado:  winget install GrafanaLabs.k6   (o  choco install k6)
# Uso:
#   .\run-carga.ps1 -BaseUrl "https://staging.example.co" -Token "xxxx"
#   .\run-carga.ps1 -BaseUrl "https://staging.example.co" -Script "k6\smoke-test.js"
#
# No cablea secretos: se pasan por parámetro y viven solo en variables de entorno de la sesión.
param(
  [string]$BaseUrl = "http://localhost:3000",
  [string]$Script  = "k6\load-stress-test.js",
  [string]$Token   = ""
)

$env:BASE_URL = $BaseUrl
$env:TOKEN = $Token
$env:K6_WEB_DASHBOARD = "true"
$env:K6_WEB_DASHBOARD_EXPORT = "reporte-carga.html"

Write-Host "Ejecutando k6 contra $BaseUrl ..." -ForegroundColor Cyan
k6 run $Script --summary-export=summary.json

# k6: exit 99 = se incumplió al menos un umbral SLO; otro !=0 = error de ejecución.
if ($LASTEXITCODE -eq 99) {
  Write-Warning "Se incumplió al menos un umbral SLO (exit 99). Revisa reporte-carga.html antes de dar GO."
} elseif ($LASTEXITCODE -ne 0) {
  Write-Error "k6 falló con exit $LASTEXITCODE"
} else {
  Write-Host "Todos los umbrales SLO cumplidos." -ForegroundColor Green
}

if (Test-Path "reporte-carga.html") { Start-Process "reporte-carga.html" }
