<#
  Aplica la proteccion de rama (ruleset) a un repo de GitHub.
  Requisitos: gh CLI instalado y autenticado (gh auth login) con permisos de admin sobre el repo.
  El Dueño trabaja en Windows -> este script es PowerShell.

  Uso:
    ./configurar-proteccion-github.ps1 -Repo "mi-org/mi-repo"
#>
param(
  [Parameter(Mandatory = $true)][string]$Repo   # formato owner/repo
)
$ErrorActionPreference = "Stop"

$rulesetPath = Join-Path $PSScriptRoot "github-ruleset-main.json"
if (-not (Test-Path $rulesetPath)) { throw "No se encuentra $rulesetPath" }

Write-Host "Verificando autenticacion de gh..."
gh auth status | Out-Null

Write-Host "Aplicando ruleset 'proteccion-main' a $Repo ..."
# --input lee el JSON; gh ignora el campo _comentario que no existe en la API real,
# por eso conviene quitarlo antes de enviar si la API es estricta:
$tmp = New-TemporaryFile
$payload = (Get-Content $rulesetPath -Raw | ConvertFrom-Json) `
  | Select-Object -Property * -ExcludeProperty _comentario `
  | ConvertTo-Json -Depth 10
# UTF-8 SIN BOM: 'Set-Content -Encoding utf8' en Windows PowerShell 5.1 escribe BOM y
# 'gh api --input' (parser JSON de Go) falla si el archivo empieza con BOM.
[System.IO.File]::WriteAllText($tmp.FullName, $payload, (New-Object System.Text.UTF8Encoding($false)))

gh api "repos/$Repo/rulesets" --method POST --input $tmp.FullName
Remove-Item $tmp.FullName -Force

Write-Host "Listo. Verifica en Settings > Rules del repo que 'proteccion-main' este 'Active'."
