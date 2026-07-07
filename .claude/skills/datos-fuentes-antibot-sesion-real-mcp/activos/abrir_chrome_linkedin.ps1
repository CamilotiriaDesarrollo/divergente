# scripts/abrir_chrome_linkedin.ps1
# Abre un Chrome de AUTOMATIZACION aislado, con remote-debugging en puerto 9222.
#
# Usa un perfil DEDICADO (carpeta propia), separado de tu Chrome normal:
#   - Puedes seguir usando tus 9 perfiles normales al mismo tiempo, sin colision.
#   - La sesion de LinkedIn se guarda SOLO en este perfil (login una vez).
#   - No comparte cookies ni perfil con el proyecto Eventos.
#
# Uso:  .\scripts\abrir_chrome_linkedin.ps1
# La PRIMERA vez: loguea LinkedIn en la ventana que se abre.
# Despues: en Claude Code el MCP "chrome" se conecta solo a http://127.0.0.1:9222

$ErrorActionPreference = "Stop"

$chromePath = @(
    "C:\Program Files\Google\Chrome\Application\chrome.exe",
    "C:\Program Files (x86)\Google\Chrome\Application\chrome.exe",
    "$env:LOCALAPPDATA\Google\Chrome\Application\chrome.exe"
) | Where-Object { Test-Path $_ } | Select-Object -First 1

if (-not $chromePath) {
    Write-Error "No se encontro Chrome. Instala Google Chrome primero."
    exit 1
}

# Perfil DEDICADO de automatizacion — NO es tu User Data real.
# Carpeta exclusiva de este proyecto (no colisiona con Eventos ni con tu Chrome diario).
$automationDir = "$env:LOCALAPPDATA\ChromeScraperEmpleos"

if (-not (Test-Path $automationDir)) {
    New-Item -ItemType Directory -Path $automationDir -Force | Out-Null
    Write-Host "[+] Perfil de automatizacion creado: $automationDir" -ForegroundColor Green
    $primeraVez = $true
} else {
    $primeraVez = $false
}

# Verificar que el puerto 9222 no este ya ocupado
$puertoOcupado = Get-NetTCPConnection -LocalPort 9222 -State Listen -ErrorAction SilentlyContinue
if ($puertoOcupado) {
    Write-Host "[!] El puerto 9222 ya esta en uso." -ForegroundColor Yellow
    Write-Host "    Probablemente ya hay un Chrome de automatizacion abierto. Usalo, o cierralo y reintenta." -ForegroundColor Yellow
    exit 0
}

Write-Host ""
Write-Host "Chrome de automatizacion:" -ForegroundColor Cyan
Write-Host "  Ejecutable : $chromePath"
Write-Host "  Perfil     : $automationDir  (aislado de tu Chrome normal)"
Write-Host "  Debugging  : http://127.0.0.1:9222"
Write-Host ""

Start-Process -FilePath $chromePath -ArgumentList @(
    "--remote-debugging-port=9222",
    "--user-data-dir=`"$automationDir`"",
    "--no-first-run",
    "--no-default-browser-check",
    "--disable-session-crashed-bubble",
    "https://www.linkedin.com/jobs/search/"
)

if ($primeraVez) {
    Write-Host "PRIMERA VEZ:" -ForegroundColor Yellow
    Write-Host "  1. En la ventana que se abrio, inicia sesion en LinkedIn." -ForegroundColor Yellow
    Write-Host "  2. Marca 'recordar sesion'. Queda guardada para siempre en este perfil." -ForegroundColor Yellow
    Write-Host ""
}
Write-Host "Listo. Tu Chrome normal (9 perfiles) sigue funcionando aparte." -ForegroundColor Green
Write-Host "Cuando LinkedIn este cargado, dime y verifico la conexion del MCP." -ForegroundColor Green
