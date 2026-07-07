# Activos — devops-cicd-github-gitlab (N0)

Plantillas base de CI/CD, **sin secretos** (placeholders `${VAR}` / `secrets.*`). Creadas desde
buenas practicas; **aun sin validar en proyecto propio**. Al usarse por primera vez, corrige el
activo con lo aprendido y sube el nivel de la skill.

| Activo | Que es | Cuando copiarlo | Que adaptar |
|---|---|---|---|
| `github/ci-node-monorepo.yml` | CI GitHub para client (Vite+React 19) / server (Express+TS) o Next.js 16 | Repo Node de la linea privada; F3 "CI minimo" | Node version; ruta `client/`; en Next.js single-package poner `.` y borrar job server |
| `github/ci-dotnet-sqlserver.yml` | CI GitHub .NET 8 + SQL Server (service container) | Linea gobierno .NET (M-GSI-002/DI-GSI-010) | Version SDK; cadena de conexion; nombre de la BD de test |
| `github/ci-python-scraping.yml` | CI GitHub Python 3.12 (ruff + pytest) | Proyecto Scraper / datos | Version Python; nombres de requirements |
| `github/cd-vercel.yml` | CD explicito a Vercel (preview + prod con compuerta) | Solo si NO usas la integracion Git nativa de Vercel | Elegir una sola via de deploy (ver cabecera del archivo) |
| `gitlab/gitlab-ci-node.yml` | Espejo institucional del CI Node | Entrega en GitLab del ministerio | Mirror interno de imagen; `.npmrc` interno; job server |
| `gitlab/gitlab-ci-dotnet.yml` | Espejo institucional del CI .NET + deploy manual | Linea gobierno en GitLab | Mirror interno; paso real de publish; reviewers |
| `PORTABILIDAD-github-actions-a-gitlab-ci.md` | Tabla de equivalencias GHA <-> GitLab + secretos | Al portar un pipeline entre plataformas | — |

**Regla:** en la linea privada el archivo va como `.github/workflows/ci.yml`; en la linea gobierno
como `.gitlab-ci.yml`. Manten ambos como el **mismo pipeline logico** (lint/format/test/build).
