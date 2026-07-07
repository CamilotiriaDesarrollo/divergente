# exportar-openapi.ps1 — vuelca el documento OpenAPI generado por ASP.NET Core a un archivo.
# Objetivo: versionar el contrato del lado .NET y correr el MISMO pipeline (Spectral/oasdiff)
# que la linea Node. Asi el contrato es un artefacto revisable, no algo oculto en runtime.
# Requiere la app corriendo (Kestrel) exponiendo /openapi/v1.json via app.MapOpenApi().
# Alternativa build-time: paquete Microsoft.Extensions.ApiDescription.Server (genera en /obj al compilar).
param(
  [string]$Url    = "http://localhost:5000/openapi/v1.json",
  [string]$Salida = "contracts/openapi.json"
)
$ErrorActionPreference = "Stop"
New-Item -ItemType Directory -Force -Path (Split-Path $Salida) | Out-Null
Invoke-WebRequest -Uri $Url -OutFile $Salida
Write-Host "Contrato exportado a $Salida"
# Nota: el generador nativo emite OpenAPI 3.0/3.1 segun SDK. Verificar la version del documento
# ($.openapi) antes de correr Spectral con reglas 3.1 (ver gotcha sobre 3.1).
