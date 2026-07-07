# CLAUDE.md

<!-- ORIGEN: copia de 002 Desarrollos/Plan Nacional de Musica SIMUS/Entorno_Virtual_PNMC/CLAUDE.md.
     Ejemplo de CLAUDE.md "manual maestro" de un monorepo grande y maduro (front + API + BD).
     Las contraseñas de desarrollo se REDACTARON en este activo: en el proyecto real la tabla
     existe con valores; aquí van como placeholder para no filtrar credenciales. -->

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Qué es este proyecto

Plataforma del Plan Nacional de Música para la Convivencia (PNMC) del Ministerio de las Culturas de Colombia. Monorepo con tres piezas: `pnmc-web/` (React 19 + Vite 8 + Tailwind 4), `pnmc-api/` (.NET 10 Minimal APIs + EF Core) y `pnmc-database/` (SQL versionable para SQL Server/Azure SQL). El frontend consume datos **solo** a través del backend; la única fuente de verdad es SQL Server.

La documentación oficial vive en `docs/DOCUMENTACION_PROYECTO.md` (Manual Maestro) con sub-documentos en `docs/tecnico/`, `docs/funcional/`, `docs/gobernanza/` y `docs/backlog/`. Los cambios de arquitectura deben reflejarse en el sub-documento correspondiente y en la bitácora del Manual Maestro.

## Comandos

### Frontend (`pnmc-web/`)

```bash
npm install
npm run dev        # Vite en http://127.0.0.1:5173 (proxy /api, /health, /swagger → :8080)
npm run test       # Vitest (suite completa)
npx vitest run src/features/map   # un solo directorio/archivo de tests
npm run build      # bundle de producción
```

### Backend (`pnmc-api/`)

```bash
dotnet restore PNMC.Api.sln
dotnet test PNMC.Api.sln                       # xUnit + integración (usan SQLite, sin Docker)
dotnet run --project src/PNMC.Api              # API en http://localhost:8080 (requiere SQL Server)
```

- Swagger: `http://localhost:8080/swagger` · Health: `http://localhost:8080/health/live`

### Base de datos local

Modo completo (Docker + SQL Server 2022 en `127.0.0.1,14333`, base `PNMC_LOCAL`):

```bash
docker compose -f docker-compose.local.yml up -d
./scripts/seed-local-db.sh      # crea esquema y siembra datos (bash; en Windows usar Git Bash/WSL)
./scripts/api-local.sh          # arranca la API forzando la conexión local sin tocar pnmc-api/.env
```

### Variables de entorno

- Backend: `pnmc-api/.env` desde `.env.example`. Nunca commitear `.env` reales.
- Frontend: `pnmc-web/.env` con `VITE_API_BASE_URL` (ej. `http://localhost:8080`).

### Credenciales sembradas (solo desarrollo)

| Rol | Usuario | Contraseña | Consola |
| --- | --- | --- | --- |
| Webmaster | `admin@pnmc.local` | `•••••• (ver repo, no publicar)` | `/admin` |
| Gestor interno | `gestor@pnmc.local` | `•••••• (ver repo, no publicar)` | `/admin` |
| Aliado admin | `aliado-admin@pnmc.local` | `•••••• (ver repo, no publicar)` | `/colaboradores` |

> Nota de calibración: verifica SIEMPRE las credenciales sembradas contra el código
> (`DatabaseBootstrapper`/seeds), no contra docs heredadas — en este proyecto la doc quedó
> desfasada respecto al valor real vigente. Ver gotcha en la SKILL.

## Arquitectura

### Backend (`pnmc-api/src/`)

Cuatro proyectos: `PNMC.Api` (Program.cs, middlewares, endpoints), `PNMC.Contracts` (DTOs), `PNMC.Domain` (entidades), `PNMC.Infrastructure` (DbContext de EF Core, bootstrapper). Patrón Minimal APIs: cada módulo es una clase estática en `PNMC.Api/Endpoints/` mapeada bajo `/api/v1` en `Program.cs`. `AdminDataEndpoints.cs` (~144 KB) concentra la API administrativa de datos.

- Autenticación por cookie (`pnmc.admin`, 8 h, sliding) que devuelve 401/403 en vez de redirigir.
- Rate limiting en endpoints públicos: `participation-submit` (30/min) y `external-register` (10/min).
- `PNMC.Api/Assets/geo/Departamentos-Municipos-COL.json` (~28 MB) es el TopoJSON DIVIPOLA.

### Frontend (`pnmc-web/src/`)

Organización por dominios en `features/`, con `app/` (shell, ruteo, sesión), `components/`, `services/` (clientes HTTP) y `hooks/`. Las llamadas al backend se centralizan en `src/services`; los componentes no llaman a la API directamente.

Deuda conocida: `features/admin/pages/AdminShellPage.jsx` tiene ~7.900 líneas y concentra todos los paneles administrativos; el plan de desacoplamiento está en `docs/backlog/deuda_tecnica.md`.

### Reglas de negocio transversales

- **Estados de registros**: `borrador` → `en_revision` → `ajustes_solicitados` | `aprobado` → `publicado` | `rechazado` | `archivado`. `ajustes_solicitados` es un estado propio; **no normalizarlo a `en_revision`**. Toda transición registra historial en `RegistrosRevisionHistorial`.
- **Roles activos** (RBAC): `webmaster`, `gestor_interno`, `aliado_admin`, `aliado_editor`, `aliado_lector`, `externo`. Los aliados están confinados a su `EntidadAliadaId`. Roles históricos no deben usarse en código nuevo.
- **Habeas Data** (Ley 1581/2012): los endpoints públicos del mapa deben enmascarar datos de contacto personales.
- La seguridad real de permisos vive en el backend; **nunca delegarla al frontend**.

## Riesgos y pendientes conocidos

Detallados en `docs/backlog/`: vulnerabilidad sin fix en `xlsx` (plan: migrar import/export Excel al backend), refactor de `AdminShellPage.jsx`, proveedores reales SMTP/WhatsApp pendientes (hoy simulados), accesibilidad WCAG 2.1 AA parcial.
