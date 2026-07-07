# ============================================================
# INICIAR PNMC EN WINDOWS (equivalente local de "Iniciar PNMC.command")
# Levanta: LocalDB (PNMC_LOCAL) + API .NET (8080) + Frontend Vite
# Uso: clic derecho > Ejecutar con PowerShell, o desde terminal: .\Iniciar-PNMC.ps1
# ============================================================

$ErrorActionPreference = "Stop"
$repo = Join-Path $PSScriptRoot "Entorno_Virtual_PNMC"

Write-Host "[1/3] Iniciando SQL Server LocalDB..." -ForegroundColor Cyan
& "C:\Program Files\Microsoft SQL Server\130\Tools\Binn\SqlLocalDB.exe" start MSSQLLocalDB | Out-Null

Write-Host "[2/3] Iniciando API (.NET) en http://localhost:8080 ..." -ForegroundColor Cyan
$apiEnv = @"
`$env:PATH = 'C:\Program Files\dotnet;' + `$env:PATH
`$env:ASPNETCORE_ENVIRONMENT = 'Local'
`$env:ASPNETCORE_URLS = 'http://localhost:8080'
`$env:AZURE_SQL_CONNECTION_STRING = 'Server=(localdb)\MSSQLLocalDB;Initial Catalog=PNMC_LOCAL;Integrated Security=True;MultipleActiveResultSets=False;Encrypt=False;TrustServerCertificate=True;Connection Timeout=30;'
`$env:Database__SeedBootstrapUsers = 'true'
Set-Location '$repo\pnmc-api'
dotnet run --project src/PNMC.Api --no-launch-profile
"@
Start-Process powershell -ArgumentList "-NoExit","-Command",$apiEnv

Write-Host "[3/3] Iniciando frontend (Vite)..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit","-Command","Set-Location '$repo\pnmc-web'; npm run dev"

Write-Host ""
Write-Host "Listo. URLs:" -ForegroundColor Green
Write-Host "  Frontend : revisa el puerto que anuncie Vite (5173/5175 si 5173 esta ocupado)"
Write-Host "  API      : http://localhost:8080  (Swagger: http://localhost:8080/swagger)"
Write-Host "  Login    : admin@pnmc.local / admin   (tambien gestor@, aliado-admin@, externo@ ... clave: admin)"
