# main.tf — IaC de Vercel para la LÍNEA PRIVADA (Next.js 16): proyecto, variables de entorno, dominio.
# Cuándo SÍ: cuando se gestionan varios proyectos/entornos y se quiere versionar la config.
# Cuándo NO: para una sola demo, el dashboard de Vercel basta — no sobre-ingenierizar (ver gotcha).
# N0: VERIFICAR la última versión del provider `vercel/vercel` antes de fijar.

terraform {
  required_providers {
    vercel = {
      source  = "vercel/vercel"
      version = "~> 3.0" # VERIFICAR versión vigente
    }
  }
}

provider "vercel" {
  # api_token vía variable de entorno VERCEL_API_TOKEN (secreto en el CI, NUNCA en el código)
}

variable "proyecto" { type = string }
variable "github_repo" {
  type        = string
  description = "org/repo del monorepo"
}
variable "api_url" {
  type        = string
  description = "URL del backend (patrón backend durmiente); '' si el frontend es autónomo"
  default     = ""
}

resource "vercel_project" "web" {
  name      = "${var.proyecto}-web"
  framework = "nextjs"
  git_repository = {
    type = "github"
    repo = var.github_repo
  }
  # Root Directory se deja SIN fijar: la receta de la fábrica usa vercel.json en la raíz
  # (ver skill devops-monorepo-client-server-vercel).
}

resource "vercel_project_environment_variable" "api_url" {
  count      = var.api_url == "" ? 0 : 1
  project_id = vercel_project.web.id
  key        = "NEXT_PUBLIC_API_URL"
  value      = var.api_url
  target     = ["production", "preview"]
}
