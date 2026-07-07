---
name: devops-docker-aplicaciones
regimen: universal
description: Conteneriza las APLICACIONES del portafolio (API Express+TS, API .NET n-capas de la línea gobierno, Next.js 16 auto-hospedado, jobs Python de datos/scraping) con Dockerfiles multi-stage, usuario no-root, orquestación local con SQL Server y publicación a un registry. Cárgala cuando haya que escribir un Dockerfile o docker-compose para una app (no solo para la BD), empaquetar la API para PaaS/on-prem en vez de Vercel, dar paridad dev/prod, resolver builds lentos/imágenes gigantes/permisos root en contenedor, o preparar la entrega en imagen a infraestructura estatal. NO aplica a frontends estáticos que ya sirve Vercel.
---

# DevOps — Contenerización de aplicaciones (Docker)

**Nivel actual:** N0 · **Dominio:** devops · **Agente(s):** `devops-plataforma`
**Proyectos fuente:** ninguno — creada desde buenas prácticas (VACÍO del portafolio).

> Criterio de ascenso a N1: los 5 bloques completos, con activos copiables de ruta real y gotchas verificados (no genéricos). A N2: ≥1 uso real aceptado por el Dueño. A N3: ≥3 usos exitosos en ≥2 proyectos + checklist propio.

## 1. Propósito

Cubre un vacío real del portafolio: **Docker hoy solo se usa para el SQL Server local de PNMC** (skill `devops-entorno-local-sqlserver-reproducible`); **no existe ninguna imagen de aplicación, ni registry, ni entrega en contenedor**. Esta skill lleva el contenedor de "la base de datos local" a "la aplicación": empaquetar la API y los jobs para que corran igual en cualquier máquina y en el destino de despliegue.

Se carga cuando hay que:
- Empaquetar el **backend Express (`server/`)** para desplegarlo fuera de Vercel — PaaS (Railway/Render) o infra propia (IIS/Nginx como reverse proxy) — con una imagen reproducible en vez de "copiar `dist/` a mano".
- Entregar la **API .NET / SQL Server (línea gobierno, normativa M-GSI-002 / DI-GSI-010)** como imagen a infraestructura institucional (Azure Container Registry / GitLab Registry), con paridad exacta dev↔prod.
- Contener un **job Python de datos/scraping** para ejecutarlo de forma reproducible (hoy se lanza con `devops-scheduler-windows-powershell` sobre Windows).
- **Auto-hospedar Next.js con SSR** fuera de Vercel (`output: 'standalone'`).
- Dar **paridad e integración local**: levantar API + SQL Server juntos con `docker compose`.

**Criterio de decisión primero (qué NO contener):** un frontend **estático** (Vite build o Next export, skills `front-nextjs-export-estatico-sin-backend`) NO se contenedoriza: va a Vercel/CDN sin imagen. Contenerizar lo que Vercel ya sirve gratis es coste sin valor. Docker aquí es para **procesos de servidor**: APIs, SSR y jobs.

## 2. Procedimiento

1. **Elegir el activo base según la app** (bloque 3): `Dockerfile.node` (Express+TS), `Dockerfile.dotnet` (API .NET n-capas), `Dockerfile.nextjs` (SSR auto-hospedado) o `Dockerfile.python` (job/servicio). Todos son **multi-stage**: etapa `build` con toolchain, etapa `runtime` mínima.

2. **Copiar el `.dockerignore` SIEMPRE** junto al Dockerfile (activo `activos/.dockerignore`). Sin él, el contexto de build arrastra `node_modules`, `bin/obj`, `.git` y —peligroso— `.env`. Es la primera línea contra filtrar secretos en una capa.

3. **Ordenar capas para cachear dependencias:** copiar primero solo los manifiestos (`package*.json`, `*.csproj/*.sln`, `requirements.txt`), instalar/restaurar, y **después** copiar el código. Así un cambio de código no re-descarga dependencias.

4. **Correr como no-root SIEMPRE.** `node:*` trae el usuario `node`; `aspnet:8.0+` trae `app`; en Python se crea `appuser`. Nunca dejar el proceso como root (requisito de endurecimiento; alineado con `seg-desarrollo-seguro-sdl-owasp-gobierno`).

5. **Configuración por variables de entorno, jamás horneada.** La cadena de conexión, URLs y claves llegan por `-e`/`env`/secret del orquestador. En la imagen no va ningún secreto ni `appsettings.*.json` con credenciales (lo bloquea el `.dockerignore`). La gestión de secretos vive en `seg-gestion-secretos-keyvault`.

6. **Definir salud.** Node y Next exponen `/api/health` → `HEALTHCHECK` en el propio Dockerfile. La imagen `aspnet` **no trae curl/wget** (superficie mínima): su healthcheck se define en el orquestador (compose/k8s) apuntando al endpoint `/health` de ASP.NET HealthChecks.

7. **Build y verificación local:**
   ```bash
   docker build -f Dockerfile.node -t miorg/mi-api:$(git rev-parse --short HEAD) ./server
   docker run --rm -p 3000:3000 --env-file server/.env miorg/mi-api:<sha>
   # sanity: curl http://localhost:3000/api/health -> 200
   ```
   Para el stack completo: `cp .env.example .env && docker compose up --build` (activo `docker-compose.yml`), que espera con `depends_on: condition: service_healthy` a que SQL Server acepte conexiones antes de arrancar la API.

8. **Etiquetado y registry.** Tag inmutable por **SHA de commit** + tag semver de release; `latest` solo en dev. Registries: **GHCR** (`ghcr.io/<org>/<app>`) para la línea privada; **Azure Container Registry** o **GitLab Container Registry institucional** para la línea gobierno (login vía OIDC contra Entra ID, coherente con DI-GSI-010 §6/L4 y con la entrega de código en GitLab institucional que exige la F6). El build+push automatizado es de la skill `devops-cicd-github-gitlab` (esta skill provee el Dockerfile que ese pipeline construye).

9. **Escaneo de imagen antes de publicar:** `docker scout cves <imagen>` o Trivy; enlaza con `seg-sast-dast-dependencias`. Una imagen con CVEs críticos es un ítem vinculante en G5.

10. **Despliegue a producción estatal = cambio ITIL.** Publicar/promover una imagen a producción de la entidad se opera como cambio formal (SDC F-GSI-037, comité, rollback = re-desplegar el tag anterior), según `devops-gestion-cambios-itil-gobierno` (M-GSI-003) y la disciplina de F6. El rollback en contenedores es trivial y es una ventaja a documentar en el plan.

**Nota de versiones (verificar antes de usar):** Node 22 es LTS (Node 24 pasa a Active LTS oct-2025); .NET 8 es LTS con soporte hasta nov-2026 y .NET 10 LTS salió nov-2025 — la línea gobierno usa **LTS**, nunca STS (9.0). Python 3.12-slim estable (3.13 disponible). Los `ARG *_VERSION` de los activos permiten subir versión en un solo punto; en producción, pinnear además por **digest `@sha256:`**.

## 3. Activos copiables

Todos en `.claude/skills/devops-docker-aplicaciones/activos/`. Sin secretos; placeholders `${VAR}` y claves de ejemplo a rotar. Al ser N0, son plantillas de buenas prácticas, **aún no probadas en un proyecto propio**.

- **`Dockerfile.node`** — Express 4 + TS, multi-stage, `npm ci` cacheado, `npm prune --omit=dev`, usuario `node`, healthcheck a `/api/health`. **Adaptar:** puerto (`EXPOSE`/`PORT`), y que exista el script `build` (`tsc`) y el endpoint de salud.
- **`Dockerfile.dotnet`** — API .NET n-capas/DDD, restore cacheado por `.csproj`, runtime `aspnet` no-root. **Adaptar:** nombres de proyectos de la solución (`src/Api`, `src/Application`, …), el `.dll` de arranque y `DOTNET_VERSION` al LTS aprobado por la entidad.
- **`Dockerfile.nextjs`** — Next 16 SSR auto-hospedado (`output: 'standalone'`), `HOSTNAME=0.0.0.0`. **Adaptar:** solo si NO es export estático. Verificar que `next.config` tenga `standalone`.
- **`Dockerfile.python`** — job/servicio de datos-scraping, venv aislado, `appuser`. **Adaptar:** `ENTRYPOINT` al módulo real; si usa navegador, cambiar la base a `mcr.microsoft.com/playwright/python`.
- **`.dockerignore`** — cubre Node/.NET/Python y bloquea `.env`, claves y `appsettings.*`. Copiar tal cual junto al Dockerfile.
- **`docker-compose.yml`** — API + SQL Server 2022 con `healthcheck` de la BD y `depends_on: service_healthy`. **Adaptar:** `dockerfile:` (node/dotnet) y las variables. Extiende el patrón de contenedor de BD ya usado en PNMC.
- **`.env.example`** — variables de compose (SA password, cadena de conexión) con valores de ejemplo. Copiar a `.env` (git-ignored) y reemplazar.

## 4. Gotchas verificados

**Riesgos documentados de la práctica, sin verificar aún en proyecto propio (N0).** Ascienden a "verificado" cuando ocurran (o se eviten) en un proyecto real y se anoten con evidencia.

1. **Contenerizar el frontend estático por inercia.** Envolver un Vite/Next export en Docker cuando Vercel/CDN ya lo sirve añade coste y superficie sin valor. Regla: Docker solo para procesos de servidor (API/SSR/jobs). *Sin verificar en proyecto propio (N0).*
2. **Proceso como root dentro del contenedor.** Muchos ejemplos omiten `USER`; una imagen que corre como root es hallazgo de endurecimiento en G5. Los activos ya fijan usuario no-root. *Sin verificar en proyecto propio (N0).*
3. **Secreto horneado en una capa.** `COPY . .` sin `.dockerignore` mete `.env`/`appsettings.*.json` en la imagen, y **una capa queda en el historial aunque se borre después**. Mitigación: `.dockerignore` + config por variable de entorno. *Sin verificar en proyecto propio (N0).*
4. **Imagen del SO del Dueño es Windows, la imagen es Linux.** En Windows, Docker corre bajo WSL2; rutas y saltos de línea (CRLF vs LF en scripts `ENTRYPOINT`) pueden romper el arranque. Usar `.gitattributes`/LF en archivos que entran a la imagen. *Sin verificar en proyecto propio (N0).*
5. **SQL Server en contenedor no arranca en Apple Silicon/ARM.** `mssql/server:2022` es x86_64; en ARM hay que usar `azure-sql-edge` (ya aprendido en `devops-entorno-local-sqlserver-reproducible`, pero se repetirá al orquestar la app). *Verificado en la skill de BD, no aún al contener la app (N0).*
6. **Healthcheck de .NET con curl inexistente.** La imagen `aspnet` no trae curl; un `HEALTHCHECK CMD curl ...` falla siempre y marca el contenedor unhealthy. Solución: healthcheck en el orquestador contra `/health`, o instalar una utilidad mínima (a coste de superficie). *Sin verificar en proyecto propio (N0).*
7. **`latest` mutable en producción.** Desplegar `:latest` impide saber qué commit corre y rompe el rollback. Usar tag por SHA/semver inmutable. *Sin verificar en proyecto propio (N0).*
8. **Scraping con navegador pesa cientos de MB.** Meter Playwright/Chromium sobre `python:slim` obliga a instalar decenas de libs de sistema y da builds frágiles; la imagen oficial `playwright/python` ya las trae. *Sin verificar en proyecto propio (N0).*

## 5. Criterios de done

- [ ] Se **justificó** que la app necesita contenedor (proceso de servidor), y NO se contenerizó un frontend estático que Vercel ya sirve.
- [ ] Dockerfile **multi-stage**: la imagen de runtime no incluye toolchain de build (SDK/tsc/pip wheels) ni dependencias de desarrollo.
- [ ] El proceso corre como **usuario no-root** (verificado: `docker run ... whoami` ≠ root).
- [ ] Existe `.dockerignore` y `docker history <img>` no revela `.env`, claves ni `appsettings` con secretos.
- [ ] Configuración y cadena de conexión llegan **por variable de entorno**; ningún secreto en la imagen.
- [ ] `docker build` pasa y `docker run` levanta la app; el endpoint de salud responde 200 (o el healthcheck del orquestador marca `healthy`).
- [ ] `docker compose up` levanta API + SQL Server y la API conecta a la BD (arranca tras `service_healthy`).
- [ ] Imagen **etiquetada por SHA/semver** (no solo `latest`) y **escaneada** (docker scout/Trivy) sin CVEs críticos abiertos.
- [ ] Si es línea gobierno: la promoción a producción está encuadrada como cambio ITIL (SDC, rollback = tag anterior) y la entrega en registry institucional/GitLab está prevista.

## Registro de uso
| Fecha | Proyecto | Tarea | Resultado | Lección |
|---|---|---|---|---|
