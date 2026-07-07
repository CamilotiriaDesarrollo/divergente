# Runner idempotente de esquema + seeds para Postgres local, en Windows SIN bash.
# Plantilla N0 (hermana divergente del runner SQL Server). Aplica db/schema/*.sql
# y db/seed/*.sql en orden. Requiere psql en el PATH y DATABASE_URL en el entorno/.env.
$ErrorActionPreference = 'Stop'

# Carga básica de .env si existe (KEY=VALUE, ignora comentarios).
if (Test-Path ".env") {
  Get-Content ".env" | Where-Object { $_ -match '^\s*[^#].*=' } | ForEach-Object {
    $k, $v = $_ -split '=', 2
    [Environment]::SetEnvironmentVariable($k.Trim(), $v.Trim())
  }
}

$dbUrl = $env:DATABASE_URL
if (-not $dbUrl) { throw "Define DATABASE_URL (o POSTGRES_* en .env) antes de correr el runner." }

$dbDir = if ($env:DB_DIR) { $env:DB_DIR } else { "db" }

function Invoke-SqlDir($dir) {
  if (-not (Test-Path $dir)) { Write-Host ">> (sin carpeta $dir, se omite)"; return }
  Get-ChildItem -Path $dir -Filter *.sql | Sort-Object Name | ForEach-Object {
    Write-Host ">> aplicando $($_.FullName)"
    # ON_ERROR_STOP=1 corta al primer error; -1 = una transacción por archivo.
    & psql $dbUrl -v ON_ERROR_STOP=1 -1 -q -f $_.FullName
    if ($LASTEXITCODE -ne 0) { throw "Fallo aplicando $($_.Name)" }
  }
}

Write-Host "== Esquema =="
Invoke-SqlDir (Join-Path $dbDir "schema")
Write-Host "== Seeds =="
Invoke-SqlDir (Join-Path $dbDir "seed")
Write-Host "OK — esquema y seeds aplicados. Re-ejecutable: los scripts son idempotentes."
