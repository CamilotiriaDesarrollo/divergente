# bootstrap-secretos-local.ps1 — prepara los secretos LOCALES del dev (Windows).
# Idempotente. NO toca producción. Objetivo: onboarding de config en minutos (meta F3: <30 min).
$ErrorActionPreference = "Stop"

# 1) .env local desde la plantilla (si no existe)
if (-not (Test-Path ".env")) {
    Copy-Item ".env.example" ".env"
    Write-Host "Creado .env desde .env.example. Edítalo con tus valores LOCALES."
} else {
    Write-Host ".env ya existe; no se sobrescribe."
}

# 2) .NET: user-secrets (se guardan en el perfil del usuario, FUERA del repo)
if (Get-ChildItem -Filter *.csproj -ErrorAction SilentlyContinue) {
    try { dotnet user-secrets init | Out-Null } catch {}
    Write-Host "user-secrets inicializado. Carga un secreto con:"
    Write-Host '  dotnet user-secrets set "ConnectionStrings:Default" "<cadena local>"'
}

# 3) Key Vault en local: DefaultAzureCredential usa tu sesión de az
Write-Host "Para probar Key Vault en local sin sembrar secretos, ejecuta primero: az login"
