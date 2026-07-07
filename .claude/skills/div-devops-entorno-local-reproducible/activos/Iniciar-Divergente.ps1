# Arranque multiproceso del entorno local (LÍNEA PRIVADA de Divergente) en Windows.
# Plantilla N0 — hermana divergente de Iniciar-PNMC.ps1. Levanta, en orden:
#   1) Postgres en Docker   2) espera a que acepte conexiones   3) esquema+seeds
#   4) API Node en ventana nueva   5) Frontend (Vite o Next) en ventana nueva.
# Meta: una persona nueva clona el repo y lo tiene corriendo en ~30 min.
$ErrorActionPreference = 'Stop'
$root = $PSScriptRoot
Set-Location $root

# --- 0) .env desde plantilla si aún no existe ---
if (-not (Test-Path ".env")) {
  Copy-Item ".env.example" ".env"
  Write-Host "Creado .env desde .env.example — revisa las credenciales antes de compartir el entorno."
}

# --- 1) Postgres en Docker ---
Write-Host "Levantando Postgres (docker compose)..."
docker compose -f docker-compose.local.yml up -d

# --- 2) Esperar a que Postgres acepte conexiones DESDE EL HOST ---
# El healthcheck del contenedor no garantiza que el puerto mapeado ya conteste
# en el host; por eso probamos 127.0.0.1:PUERTO con Test-NetConnection.
$port = if ($env:POSTGRES_PORT) { $env:POSTGRES_PORT } else { "5433" }
Write-Host "Esperando a Postgres en 127.0.0.1:$port ..."
$ok = $false
for ($i = 0; $i -lt 30; $i++) {
  $r = Test-NetConnection -ComputerName 127.0.0.1 -Port $port -WarningAction SilentlyContinue
  if ($r.TcpTestSucceeded) { $ok = $true; break }
  Start-Sleep -Seconds 2
}
if (-not $ok) { throw "Postgres no respondió en el puerto $port tras el tiempo de espera." }

# --- 3) Esquema + seeds (idempotente) ---
Write-Host "Aplicando esquema y seeds..."
& "$root\seed-local-db.ps1"

# --- 4) API Node en ventana nueva ---
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location '$root\server'; npm install; npm run dev"

# --- 5) Frontend (Vite o Next, según el proyecto) en ventana nueva ---
# Con Next.js + Route Handlers puede no haber 'server/' aparte: elimina el paso 4.
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location '$root\client'; npm install; npm run dev"

$apiPort = if ($env:PORT) { $env:PORT } else { "3000" }
Write-Host "Entorno arriba: Postgres :$port, API :$apiPort, front en su ventana (Vite/Next)."
