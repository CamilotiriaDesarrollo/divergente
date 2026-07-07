# main.tf — línea base IaC con Terraform/OpenTofu para Azure (línea gobierno o multi-nube).
# N0: VERIFICAR la última major del provider antes de fijar. SIN SECRETOS en el código.
# Los comandos (init/plan/apply) son idénticos con OpenTofu: sustituir `terraform` por `tofu`.

terraform {
  required_version = ">= 1.6" # OpenTofu >= 1.6 compatible (ver gotcha de licencia BSL)
  required_providers {
    azurerm = {
      source  = "hashicorp/azurerm"
      version = "~> 4.0" # VERIFICAR última major antes de fijar
    }
  }
  # backend remoto en backend.tf (NUNCA estado local commiteado)
}

provider "azurerm" {
  features {}
  # Autenticación por OIDC en CI (sin secretos de larga vida):
  # ARM_USE_OIDC=true + ARM_CLIENT_ID / ARM_TENANT_ID / ARM_SUBSCRIPTION_ID
}

locals {
  etiquetas = {
    proyecto       = var.proyecto
    entorno        = var.entorno
    gestionado_por = "IaC-Terraform"
    normativa      = "DI-GSI-010"
  }
}

resource "azurerm_resource_group" "main" {
  name     = "rg-${var.proyecto}-${var.entorno}"
  location = var.ubicacion
  tags     = local.etiquetas
}

resource "azurerm_service_plan" "main" {
  name                = "plan-${var.proyecto}-${var.entorno}"
  resource_group_name = azurerm_resource_group.main.name
  location            = azurerm_resource_group.main.location
  os_type             = "Windows"
  sku_name            = var.entorno == "prod" ? "P1v3" : "B1"
  tags                = local.etiquetas
}

resource "azurerm_windows_web_app" "main" {
  name                = "app-${var.proyecto}-${var.entorno}"
  resource_group_name = azurerm_resource_group.main.name
  location            = azurerm_resource_group.main.location
  service_plan_id     = azurerm_service_plan.main.id
  https_only          = true

  identity {
    type = "SystemAssigned" # identidad administrada: leer Key Vault sin secretos incrustados
  }

  site_config {
    minimum_tls_version = "1.2"
    ftps_state          = "Disabled"
    application_stack {
      current_stack  = "dotnet"
      dotnet_version = "v8.0"
    }
  }
  tags = local.etiquetas
}

output "app_hostname" {
  value = azurerm_windows_web_app.main.default_hostname
}
