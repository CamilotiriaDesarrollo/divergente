---
name: devops-iac-bicep-terraform
regimen: universal
description: Define la infraestructura como código (IaC) con Bicep (Azure nativo) o Terraform/OpenTofu (multi-nube y Vercel) — App Service, Azure SQL, Key Vault, dominios y variables de entorno versionadas, parametrizadas por entorno y con estado remoto seguro. Cárgala al montar las fundaciones de infraestructura en F3, al provisionar recursos de nube para la línea gobierno (.NET/SQL) o privada (Vercel), al elegir entre Bicep y Terraform, al escribir main.bicep/main.tf o el pipeline de IaC, o cuando aparezcan terraform apply, tfstate, what-if, OIDC a nube o "capacidad de cómputo".
---

# DevOps — Infraestructura como código con Bicep y Terraform

**Nivel actual:** N0 · **Dominio:** devops · **Agente(s):** `devops-plataforma` (dueño), `seguridad-appsec` (revisa gestión de estado/secretos y permisos), `cumplimiento-normativo` (valida el apply a prod como cambio ITIL)
**Proyectos fuente:** ninguno — creada desde buenas prácticas (VACÍO del portafolio)

> Criterio de ascenso a N1: los 5 bloques completos, con activos copiables de ruta real y gotchas verificados (no genéricos). A N2: ≥1 uso real aceptado por el Dueño. A N3: ≥3 usos exitosos en ≥2 proyectos + checklist propio.

## 1. Propósito

En el portafolio del Dueño **no existe todavía infraestructura como código**: Docker solo se usa para levantar SQL Server local en PNMC (`devops-entorno-local-sqlserver-reproducible`), y Bicep/Terraform figura únicamente como objetivo declarado — no hay recursos de nube provisionados por código, ni estado gestionado, ni pipeline de IaC. Hoy la infraestructura se pide y se configura a mano, lo que en la línea gobierno choca con un lead time real de **+2 meses para capacidad de cómputo** (FABRICA F0) y con la trazabilidad que exige un auditor estatal.

Esta skill cierra ese hueco: convierte la creación de infraestructura en **código versionado, revisable y repetible** para las dos líneas del Dueño —privada (Next.js 16 / Vercel) y gobierno (.NET 8 / Azure SQL bajo DI-GSI-010 y M-GSI-002)— sobre su SO Windows. Se carga cuando `devops-plataforma`: monta las fundaciones de **F3**; debe provisionar App Service / SQL / Key Vault / dominios; elige la herramienta IaC; escribe `main.bicep` / `main.tf` o el pipeline; o necesita que el `apply` a producción pase como cambio formal ITIL.

## 2. Procedimiento

### Paso 1 — Elegir herramienta y nube (DECISIÓN DE BLUEPRINT, no la inventa el agente)
La nube destino es una decisión abierta: **anótala en la tabla del blueprint y ciérrala el Dueño** (regla inviolable #2). Matriz de decisión:
- **Destino solo Azure** (típico si la entidad gubernamental ya vive en Azure) → **Bicep**: nativo, sin estado remoto que asegurar (el estado vive en Azure), revisable por seguridad, alineado con .NET/Microsoft. Menos superficie de secretos.
- **Multi-nube, AWS, on-prem, o Vercel** → **Terraform/OpenTofu**: un solo lenguaje (HCL) para todos los proveedores; provider `vercel/vercel` para la línea privada.
- **Entidad que exige software OSS** → **OpenTofu** (fork MPL-2.0), no Terraform (licencia BSL desde 2023). Comandos idénticos (`tofu` en vez de `terraform`). Ver gotcha.
- Si aún no hay nube definida, **empieza por el IaC de Vercel** (línea privada) que sí es accionable hoy, y deja el gobierno como plantilla lista para cuando llegue la capacidad.

### Paso 2 — Estructura del repo
`infra/` con subcarpeta por herramienta: `infra/terraform/` (`main.tf`, `variables.tf`, `backend.tf`, `terraform.tfvars` ignorado) o `infra/bicep/` (`main.bicep`, `main.parameters.<entorno>.json`). Un mismo código, **parametrizado por entorno** (dev/staging/prod) — nunca copiar-pegar carpetas por ambiente.

### Paso 3 — Estado y secretos (lo que revisa `seguridad-appsec`)
- **Terraform:** estado remoto **cifrado y con bloqueo** (`backend.tf`: backend `azurerm` en Storage, o backend HTTP nativo de GitLab). El `.tfstate` **jamás** se commitea: guarda secretos en claro.
- **Bicep:** sin archivo de estado (Azure lo administra) — una ventaja de seguridad.
- **Secretos SIEMPRE por referencia**, nunca en el código: contraseñas y claves se leen de **Key Vault** (parámetro `reference.keyVault` en Bicep; data source / identidad administrada en Terraform). Complementa `seg-gestion-secretos-keyvault`. La app usa **identidad administrada** (`SystemAssigned`) para leer el Key Vault sin cadenas con secreto.

### Paso 4 — Autenticación del CI sin secretos de larga vida
Usa **OIDC / federated credentials** hacia la nube (`azure/login@v2` con `id-token: write`); solo se guardan IDENTIFICADORES (client/tenant/subscription), no credenciales. Nunca un service principal con secreto de larga vida en el CI.

### Paso 5 — Pipeline: plan en PR, apply con aprobación
- **`plan` / `what-if` en cada PR** (dry-run obligatorio; sin plan no hay apply).
- **`apply` solo tras aprobación humana**: GitHub Environment con *Required reviewers* (`activos/.github/workflows/iac.yml`) o job `when: manual` en GitLab (`activos/.gitlab-ci-iac.yml`).
- `terraform fmt -check` + `validate` como puerta de estilo.

### Paso 6 — Atar a normativa y a las compuertas
- **F3/G3:** el IaC existe desde el día 1; la infraestructura base se levanta por código y el pipeline de IaC está en verde. Radicar temprano la **solicitud de capacidad (+2 meses)** con la definición IaC ya escrita, para que el `apply` sea inmediato al concederla.
- **F6 / línea gobierno:** todo `apply` a producción es un **cambio formal ITIL (M-GSI-003)** — SDC F-GSI-037, comité del jueves, plan de rollback, **fuera del congelamiento 15 dic–15 ene**. La compuerta manual del pipeline *representa* esa aprobación del CCC (ver `devops-gestion-cambios-itil-gobierno`).
- **DI-GSI-010 / M-GSI-002:** endurecimiento en el propio código — `httpsOnly`, `minTlsVersion 1.2`, `publicNetworkAccess Disabled`, `ftpsState Disabled`, etiquetas con `normativa` para trazabilidad.

### Paso 7 — Windows local antes del push
Terraform/OpenTofu y `az bicep` corren nativos en Windows (Bicep requiere Azure CLI). Ejecuta `fmt`, `validate` y `plan`/`what-if` localmente antes de subir. Cuida CRLF en los `.tf`/`.bicep` (config `.gitattributes` con `text=auto`).

## 3. Activos copiables

Todos en `activos/` de esta skill. Son **plantillas base (N0)**: sin secretos, con placeholders `${VAR}`; las versiones de providers/imágenes/apiVersion deben confirmarse antes de fijarlas.

- **`bicep/main.bicep`** + **`bicep/main.parameters.dev.json`** — línea base Azure para .NET 8: App Service (identidad administrada), Azure SQL + BD, endurecimiento DI-GSI-010, etiquetas normativas. El secreto SQL se **referencia desde Key Vault** en el archivo de parámetros. Copiar a `infra/bicep/`; adaptar SKUs, apiVersion y el nombre del Key Vault.
- **`terraform/`** (`main.tf`, `variables.tf`, `backend.tf`, `terraform.tfvars.example`) — equivalente en Terraform/OpenTofu: RG + App Service + Windows Web App con identidad administrada, estado remoto `azurerm` con OIDC, validación de `entorno`. Copiar a `infra/terraform/`; fijar la major de `azurerm` tras verificar y rellenar el `backend-config` en `init`.
- **`terraform-vercel/main.tf`** — IaC de Vercel para la línea privada (proyecto Next.js, dominio, variables de entorno). Accionable hoy sin nube gubernamental. Adaptar `github_repo` y `api_url`.
- **`.github/workflows/iac.yml`** — pipeline GitHub: `plan` en PR + `apply` en `main` con Environment protegido (revisor obligatorio) y OIDC a Azure. Copiar a `.github/workflows/`.
- **`.gitlab-ci-iac.yml`** — equivalente para el GitLab institucional: estado gestionado por GitLab, `apply` a prod como job **manual = aprobación del CCC**. `include:` o pégalo en `.gitlab-ci.yml`.
- **`gitignore-iac.txt`** — fragmento `.gitignore` (ignora `*.tfstate`, `.terraform/`, `*.tfvars`; recuerda **versionar** `.terraform.lock.hcl`).

**Skills hermanas a consultar:** `devops-cicd-github-gitlab` (portabilidad del pipeline), `seg-gestion-secretos-keyvault` (Key Vault), `devops-gestion-cambios-itil-gobierno` (apply a prod como RFC), `devops-monorepo-client-server-vercel` (despliegue del frontend).

## 4. Gotchas verificados

Riesgos **documentados de la práctica**, marcados honestamente como **sin verificar aún en proyecto propio (N0)**. Ascenderán a evidencia real al usarse.

- **El `tfstate` filtra secretos (N0, sin verificar).** El estado de Terraform guarda contraseñas y claves en **texto plano**; commitearlo o dejarlo en un backend sin cifrar/permisos es una fuga. Mitigación: backend remoto cifrado con bloqueo, acceso mínimo, `*.tfstate` en `.gitignore`. Bicep evita esto por ser sin estado — factor a favor de Bicep en gobierno.
- **Licencia BSL de Terraform vs OSS (N0, sin verificar).** HashiCorp cambió Terraform a licencia **BSL 1.1** (2023); ya no es OSS. Una entidad estatal que exija software libre debe usar **OpenTofu** (fork MPL-2.0, drop-in). Confirmar la restricción de licencia con la OTI en F0/F3 antes de estandarizar.
- **`apply` a prod sin plan ni aprobación destruye recursos (N0, sin verificar).** Un `terraform apply` directo puede recrear o borrar infraestructura. Mitigación: `plan`/`what-if` obligatorio + aprobación humana; en gobierno esa aprobación **es** el CCC (M-GSI-003) — nunca auto-apply a `main` estatal.
- **Versiones de providers/imágenes/apiVersion se mueven tras el cutoff (N0, sin verificar).** `azurerm` (~>4.0), `vercel/vercel` (~>3.0), la imagen `hashicorp/terraform` y las apiVersion de Bicep cambian. Mitigación: verificar la versión vigente y **fijarla**; versionar `.terraform.lock.hcl`; en gobierno, imágenes por digest.
- **OIDC mal configurado = auth falla o permisos excesivos (N0, sin verificar).** La federated credential es delicada: mal atada no autentica, o el service principal queda con rol de más. Mitigación: **least privilege** (rol acotado al RG), probar el `plan` antes que el `apply`.
- **Sobre-ingenierizar Vercel (N0, sin verificar).** Vercel es mayormente gestionado; escribir IaC para una sola demo es esfuerzo perdido. El provider `vercel` rinde solo al gestionar varios proyectos/entornos/dominios como código. Para una demo, el dashboard basta.
- **Drift por cambios manuales en el portal (N0, sin verificar).** Tocar recursos a mano en Azure diverge del código y el siguiente `apply` los revierte o falla. Mitigación: `what-if`/`plan` en CI como detector de drift; tratar el portal como **solo lectura** en gobierno.
- **Capacidad de cómputo con lead time de +2 meses (N0, sin verificar).** Descubrir en el go-live que falta infraestructura corre el proyecto semanas. Mitigación: escribir el IaC en F1/F3 y radicar la solicitud de capacidad temprano, con la definición ya lista para `apply` inmediato.

## 5. Criterios de done

- [ ] Herramienta elegida (Bicep vs Terraform/OpenTofu) con **justificación escrita**, decisión cerrada por el Dueño en el blueprint.
- [ ] **Ningún secreto** en los archivos IaC; todo secreto se referencia desde Key Vault; `*.tfstate` y `*.tfvars` están en `.gitignore` y `.terraform.lock.hcl` versionado.
- [ ] Estado remoto **cifrado y con bloqueo** (Terraform) o sin estado (Bicep), documentado.
- [ ] Infraestructura **parametrizada por entorno** (dev/staging/prod) desde un solo código; no hay carpetas duplicadas por ambiente.
- [ ] CI autentica por **OIDC/federated** (sin credenciales de larga vida); rol con least privilege.
- [ ] `plan`/`what-if` corre en cada PR; el `apply` exige **aprobación humana**; en gobierno queda como **RFC/SDC F-GSI-037** (M-GSI-003).
- [ ] Endurecimiento en código verificado: `httpsOnly`, TLS ≥ 1.2, acceso privado, etiquetas `normativa` (DI-GSI-010 / M-GSI-002).
- [ ] Versiones de providers/imágenes **fijadas y verificadas** como vigentes.
- [ ] **Idempotencia:** re-aplicar produce cero cambios (drift = 0).
- [ ] IaC escrito antes de la concesión de capacidad, dado el lead time de +2 meses.

## Registro de uso
| Fecha | Proyecto | Tarea | Resultado | Lección |
|---|---|---|---|---|
