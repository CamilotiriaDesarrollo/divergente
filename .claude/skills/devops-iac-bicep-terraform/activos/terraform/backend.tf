# backend.tf — ESTADO REMOTO cifrado y con bloqueo. NUNCA estado local commiteado.
# El estado de Terraform guarda secretos en CLARO (contraseñas, claves): protéjalo (ver gotcha).
# Los bloques backend NO admiten variables: los ${...} se rellenan con
#   terraform init -backend-config="key=<proyecto>-<entorno>.tfstate" ...
# El resource group y la storage account del estado se crean UNA vez, fuera de este código.

terraform {
  backend "azurerm" {
    resource_group_name  = "rg-tfstate"            # crear una sola vez
    storage_account_name = "sttfstate${PROYECTO}"  # nombre GLOBAL único, minúsculas
    container_name       = "tfstate"
    key                  = "${PROYECTO}-${ENTORNO}.tfstate"
    use_oidc             = true                     # sin claves de acceso de larga vida
    use_azuread_auth     = true
  }
}
