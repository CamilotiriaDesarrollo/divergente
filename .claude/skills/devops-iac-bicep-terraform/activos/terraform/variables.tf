# variables.tf — parámetros del módulo base. Un mismo código, tres entornos (dev/staging/prod).

variable "proyecto" {
  type        = string
  description = "Prefijo kebab-case del proyecto (p.ej. pnmc)"
}

variable "entorno" {
  type        = string
  description = "dev | staging | prod"
  validation {
    condition     = contains(["dev", "staging", "prod"], var.entorno)
    error_message = "entorno debe ser dev, staging o prod."
  }
}

variable "ubicacion" {
  type        = string
  default     = "brazilsouth" # región más cercana a Colombia; ajustar a la nube de la entidad
  description = "Región del proveedor"
}
