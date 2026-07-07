# activos/check-observabilidad-local.ps1
# Verificación local (Windows, SO del dueño) de la observabilidad mínima ANTES del push.
# Comprueba: (1) los endpoints de salud responden; (2) los logs salen en JSON estructurado.
# N0 (sin verificar aún en proyecto propio): ajusta puertos/rutas a tu proyecto.
#   Uso:  .\check-observabilidad-local.ps1 -BaseUrl http://localhost:3000 -LogFile .\logs\app.log
param(
  [string]$BaseUrl = "http://localhost:3000",
  [string]$LogFile = ""   # opcional: un .log con una línea JSON por evento
)

$ErrorActionPreference = "Stop"
$fallos = 0

function Probar-Endpoint($ruta, $esperado) {
  $url = "$BaseUrl$ruta"
  try {
    $r = Invoke-WebRequest -Uri $url -UseBasicParsing -TimeoutSec 5
    if ($r.StatusCode -eq $esperado) {
      Write-Host "OK    $ruta -> $($r.StatusCode)" -ForegroundColor Green
    } else {
      Write-Host "FALLA $ruta -> $($r.StatusCode) (esperado $esperado)" -ForegroundColor Red; $script:fallos++
    }
  } catch {
    Write-Host "FALLA $ruta -> sin respuesta ($($_.Exception.Message))" -ForegroundColor Red; $script:fallos++
  }
}

Write-Host "== Health checks ==" -ForegroundColor Cyan
Probar-Endpoint "/api/health/live" 200
Probar-Endpoint "/api/health/ready" 200

if ($LogFile -and (Test-Path $LogFile)) {
  Write-Host "== Logs estructurados ==" -ForegroundColor Cyan
  $ultima = Get-Content $LogFile -Tail 1
  try {
    $obj = $ultima | ConvertFrom-Json
    if ($obj.level -or $obj.'@l' -or $obj.severity) {
      Write-Host "OK    la ultima linea de log es JSON con nivel" -ForegroundColor Green
    } else {
      Write-Host "AVISO JSON sin campo de nivel reconocible (level/@l/severity)" -ForegroundColor Yellow
    }
  } catch {
    Write-Host "FALLA la ultima linea de log NO es JSON valido" -ForegroundColor Red; $fallos++
  }
}

if ($fallos -gt 0) {
  Write-Host "`n$fallos verificacion(es) fallida(s)." -ForegroundColor Red
  exit 1
}
Write-Host "`nObservabilidad minima OK." -ForegroundColor Green
