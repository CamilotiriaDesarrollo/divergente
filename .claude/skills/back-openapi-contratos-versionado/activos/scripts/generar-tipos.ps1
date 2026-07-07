# generar-tipos.ps1 — regenera los tipos TypeScript compartidos desde el contrato OpenAPI.
# SO del Dueno: Windows/PowerShell. Correr en la raiz del proyecto.
# El .d.ts resultante se COMMITEA; el job de CI verifica que no diverja del contrato.
param(
  [string]$Contrato = "contracts/openapi.yaml",
  [string]$Salida   = "client/src/types/api.d.ts"
)
$ErrorActionPreference = "Stop"
if (-not (Test-Path $Contrato)) { throw "No existe el contrato: $Contrato" }
npx --yes openapi-typescript@^7 $Contrato -o $Salida
Write-Host "Tipos regenerados en $Salida"
