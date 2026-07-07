<#
  ef-core-migrations.ps1 — helper para la línea .NET / SQL Server (gobierno) cuando el modelo
  EF Core es la fuente de verdad. Genera artefactos AUDITABLES para adjuntar a la SDC F-GSI-037:
    - script SQL idempotente (para que un DBA lo revise/aplique sin el SDK), y
    - bundle autocontenido (efbundle.exe) para ejecutar la migración en un servidor sin .NET SDK.

  Windows/PowerShell (SO del Dueño). Verifica la versión de EF Core contra tu .NET SDK:
    dotnet --version   ;   dotnet ef --version
  Los comandos abajo son estables en EF Core 8/9/10, pero confírmalo si tu SDK cambió tras el cutoff.

  Uso:
    .\ef-core-migrations.ps1 -Action add   -Name AgregarTablaSolicitudes
    .\ef-core-migrations.ps1 -Action script
    .\ef-core-migrations.ps1 -Action bundle
    .\ef-core-migrations.ps1 -Action rollback -To NombreMigracionAnterior
#>
param(
  [ValidateSet("add","script","bundle","rollback","list")]
  [string]$Action = "list",
  [string]$Name,
  [string]$To,
  # Ajusta a tu solución (placeholders):
  [string]$DataProject   = "${DATA_PROJECT_PATH}",     # p. ej. src/MiApp.Infrastructure
  [string]$StartupProject= "${STARTUP_PROJECT_PATH}",  # p. ej. src/MiApp.Api
  [string]$DbContext     = "${DBCONTEXT_NAME}",        # p. ej. AppDbContext
  [string]$OutDir        = "artifacts/migrations"
)

# La cadena de conexión se toma del entorno (NUNCA en el script):
$env:ConnectionStrings__Default = $env:DB_CONNECTION_STRING

# Asegura la herramienta EF (idempotente):
if (-not (Get-Command dotnet-ef -ErrorAction SilentlyContinue)) {
  dotnet tool install --global dotnet-ef
}
New-Item -ItemType Directory -Force -Path $OutDir | Out-Null
$common = @("--project", $DataProject, "--startup-project", $StartupProject, "--context", $DbContext)

switch ($Action) {
  "add" {
    if (-not $Name) { throw "Falta -Name (nombre de la migración en PascalCase)." }
    dotnet ef migrations add $Name @common
  }
  "script" {
    # --idempotent: el script chequea __EFMigrationsHistory y solo aplica lo pendiente.
    # Este .sql es el soporte que se adjunta a la SDC para revisión del DBA de la entidad.
    dotnet ef migrations script --idempotent --output "$OutDir/migrations.sql" @common
    Write-Host "Script idempotente generado en $OutDir/migrations.sql"
  }
  "bundle" {
    # Ejecutable autocontenido para aplicar migraciones en prod sin instalar el SDK.
    dotnet ef migrations bundle --self-contained -r win-x64 --force --output "$OutDir/efbundle.exe" @common
    Write-Host "Bundle generado en $OutDir/efbundle.exe (se ejecuta con --connection en el servidor)."
  }
  "rollback" {
    # OJO: 'database update <migracion-anterior>' aplica los métodos Down(). Es fiable para ESQUEMA,
    # NO para datos ya perdidos. El rollback real en prod es RESTAURAR EL RESPALDO (ver plan de rollback).
    if (-not $To) { throw "Falta -To (nombre de la migración a la que revertir)." }
    dotnet ef database update $To @common
  }
  "list" { dotnet ef migrations list @common }
}
