# provisionar-keyvault.ps1 — crea un Azure Key Vault endurecido y carga secretos.
# Requiere: Azure CLI (az) autenticado con `az login`. SO del dueño: Windows/PowerShell.
# NO contiene secretos: los valores se piden de forma interactiva y no se escriben en disco.
# LINEA GOBIERNO: ejecutar esto contra producción es un cambio ITIL (RFC, SDC F-GSI-037,
# comité del jueves, M-GSI-003). Nunca durante el congelamiento 15dic-15ene.

$ErrorActionPreference = "Stop"

# ── Parámetros (ajustar) ──
$RG       = "${RESOURCE_GROUP}"          # ej. rg-simus-prod
$LOCATION = "${LOCATION}"                # ej. eastus2
$KV_NAME  = "${KEYVAULT_NAME}"           # 3-24 chars, minúsculas/números, único global
$APP_MI   = "${MANAGED_IDENTITY_NAME}"   # identidad administrada de la app

# ── Crear grupo y Key Vault con protecciones (RBAC + purge protection) ──
az group create --name $RG --location $LOCATION | Out-Null
az keyvault create `
  --name $KV_NAME --resource-group $RG --location $LOCATION `
  --enable-rbac-authorization true `
  --enable-purge-protection true `
  --retention-days 90 | Out-Null
# RBAC (recomendado) en vez de access policies; purge-protection impide el borrado definitivo.

# ── Mínimo privilegio: la identidad de la app SOLO lee secretos ──
$MI_ID = az identity show --name $APP_MI --resource-group $RG --query principalId -o tsv
$KV_ID = az keyvault show --name $KV_NAME --query id -o tsv
az role assignment create `
  --assignee-object-id $MI_ID --assignee-principal-type ServicePrincipal `
  --role "Key Vault Secrets User" --scope $KV_ID | Out-Null
# NOTA: la propagación del rol puede tardar minutos; el primer arranque puede dar 403.

# ── Cargar un secreto con fecha de expiración (rotación 60 días — M-GSI-002) ──
$secure = Read-Host -AsSecureString "Valor de DB-PASSWORD"
$plain  = [System.Net.NetworkCredential]::new("", $secure).Password
$expira = (Get-Date).AddDays(60).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ssZ")
az keyvault secret set --vault-name $KV_NAME --name "DB-PASSWORD" `
  --value $plain --expires $expira | Out-Null
Remove-Variable plain

Write-Host "Key Vault '$KV_NAME' listo. Rotación 60 días; cambios en prod = RFC ITIL."
