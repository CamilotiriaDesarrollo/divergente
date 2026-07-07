---
name: pm-flujo-git-equipo-prs
regimen: universal
description: Flujo git de equipo con Pull Requests, protección de ramas, CODEOWNERS y revisión cruzada para los 15 agentes de la fábrica. Cárgala cuando se monten las fundaciones de un repo (F3), haya que definir estrategia de ramas/PR, configurar protección de main, revisar o mergear una misión, o replicar el flujo en GitLab institucional (DI-GSI-010). Disparadores: "flujo git", "pull request", "proteger rama", "branch protection", "CODEOWNERS", "merge", "estrategia de ramas", "revisión de PR", "squash".
---

# Flujo git de equipo y Pull Requests

**Nivel actual:** N0 · **Dominio:** pm · **Agente(s):** `gerente-proyecto` (co-ejecuta con `devops-plataforma` en F3)
**Proyectos fuente:** ninguno — creada desde buenas prácticas (VACÍO del portafolio)

> Criterio de ascenso a N1: los 5 bloques completos, con activos copiables de ruta real y gotchas verificados (no genéricos). A N2: ≥1 uso real aceptado por el Dueño. A N3: ≥3 usos exitosos en ≥2 proyectos + checklist propio.

## 1. Propósito

La fábrica tiene 15 agentes escribiendo sobre repos compartidos y varias reglas inviolables que dependen del git
(Regla 1: revisor ≠ constructor; Regla 5: la fila del scoreboard la escribe el revisor en el mismo commit del
entregable). F3 exige "repo con flujo git y protección de ramas" desde el día 1. Pero **ningún proyecto del
portafolio formalizó ese flujo**: el trabajo en equipo con PRs, protección de `main` y revisión cruzada solo aparece
como plan futuro (PNMC, Scraper). Esta skill da al `gerente-proyecto` un flujo git accionable y portable
(GitHub → GitLab institucional) que convierte las reglas de la fábrica en mecanismos técnicos que el repo hace
cumplir solo. No cubre la pipeline de CI en sí (lint/test/build/deploy) — eso es `devops-cicd-github-gitlab`; aquí
la CI aparece solo como *status check requerido* que bloquea el merge.

## 2. Procedimiento

**A. Elegir modelo de ramas.** Por defecto **trunk-based**: `main` protegida + ramas de vida corta + squash merge.
Encaja con fases rápidas, demos cada 2-3 componentes y el patrón "backend durmiente". Evita GitFlow (ramas
`develop`/`release` de larga vida) salvo que el Dueño lo pida; los releases se cortan con tags SemVer.

**B. Convención de nombres y commits.** Ramas `<tipo>/<fase>-<slug>` (`feat/f4-mapa-leaflet`). Commits y **título de
PR** en **Conventional Commits 1.0.0** — el título se vuelve el mensaje del commit squash y alimenta el changelog de
`pm-changelog-estimacion-esfuerzo`. Ver `activos/commit-convention.md`.

**C. Instalar los artefactos en el repo (F3, una vez):**
1. `.github/pull_request_template.md` ← `activos/pull_request_template.md` (un PR = una misión).
2. `CODEOWNERS` ← `activos/CODEOWNERS`: enruta `qa-ingeniero` a todo y `seguridad-appsec` a `auth/roles/datos`
   (materializa la Regla 1). Ajustar los equipos `@${ORG}/...` a cuentas reales.
3. `.github/workflows/lint-pr-title.yml` ← `activos/lint-pr-title.yml` (status check `pr-title-conventional`).

**D. Proteger `main`.** GitHub (recomendado hoy: **rulesets**, no la protección clásica):
```powershell
./activos/configurar-proteccion-github.ps1 -Repo "org/repo"
```
El ruleset (`activos/github-ruleset-main.json`) exige: sin push directo, ≥1 approval, CODEOWNERS obligatorio,
status checks `ci` + `pr-title-conventional`, conversaciones resueltas, historial lineal y solo squash merge.
*Verificar el esquema del ruleset contra la doc vigente de GitHub: la API puede haber cambiado tras ene-2026.*

**E. Ciclo por misión.** Rama corta → commits atómicos → `rebase origin/main` → push → PR con plantilla enlazando
"Fase X, componente Y, blueprint §Z" → CI y CODEOWNERS activan revisor → el **revisor (≠ constructor)** revisa,
**agrega la fila del scoreboard como commit en la rama** (se squashea junto al entregable → Regla 5 en un solo commit
de `main`) → CI verde + 1 approval + conversaciones resueltas → **Squash and merge** → rama borrada.
`qa-ingeniero` revisa toda misión; `seguridad-appsec` co-revisa lo que toque login/roles/datos personales.

**F. Releases y línea gobierno.** Tag anotado SemVer (`v1.2.0`). El tag **no despliega**: en proyectos estatales el
despliegue va por ITIL **M-GSI-003** (SDC F-GSI-037, comité del jueves, rollback obligatorio) y **nunca** dentro del
congelamiento 15dic–15ene. La entrega de código se replica al **GitLab institucional** (DI-GSI-010): el PR se traduce
a Merge Request y la protección de rama se configura por UI/API de GitLab — ver `activos/gitlab-merge-request-template.md`.
La línea .NET/SQL Server además exige que el diff cumpla el estándar de codificación **M-GSI-002** (verificable en la
revisión del PR).

## 3. Activos copiables
Todos en `.claude/skills/pm-flujo-git-equipo-prs/activos/` (placeholders `${VAR}`, sin secretos):
- **`pull_request_template.md`** — plantilla de PR/MR: misión, DoD, checklist normativo, recordatorio de scoreboard. Copiar en F3.
- **`CODEOWNERS`** — enrutamiento de revisores obligatorios. Ajustar `@${ORG}/...` a equipos reales.
- **`github-ruleset-main.json`** + **`configurar-proteccion-github.ps1`** — protección de `main` por ruleset, aplicable con `gh` en Windows.
- **`lint-pr-title.yml`** — valida el título como Conventional Commit; sin dependencias de terceros → portable a GitLab.
- **`commit-convention.md`** — convención de commits/ramas/tags. Copiar a `CONTRIBUTING.md` del proyecto.
- **`git-flujo-equipo.md`** — runbook del ciclo por misión y estado deseado de `main`.
- **`gitlab-merge-request-template.md`** — equivalencias y API para portar la protección a GitLab institucional.

## 4. Gotchas verificados
> N0: riesgos documentados de la práctica. **Ninguno verificado aún en proyecto propio** — validar en el primer uso.

- **Enforcement real de "revisor ≠ constructor" (sin verificar aún, N0).** CODEOWNERS y "require review" solo funcionan
  si cada agente mapea a una cuenta/equipo distinto. Si todos los agentes commitean con una sola cuenta del Dueño, el
  repo NO puede impedir el auto-approve. Decidir el mapeo agente→identidad antes de confiar el enforcement al git.
- **Rulesets vs protección clásica (sin verificar aún, N0).** El JSON de ruleset incluido sigue el esquema conocido a
  ene-2026; GitHub cambia estos campos con frecuencia. Si `gh api` rechaza el payload, revisar el esquema actual.
- **Paridad GitHub↔GitLab (sin verificar aún, N0).** El GitLab institucional puede ser una versión self-managed antigua;
  approvals, protected branches y CODEOWNERS pueden diferir o requerir plan Premium. No asumir paridad; verificar versión.
- **Squash borra el historial fino (sin verificar aún, N0).** Se gana `main` lineal y 1 commit por misión, pero se pierde
  granularidad para `git bisect`. Si gobierno exige historial completo por auditoría, reconsiderar la estrategia de merge.
- **Firma de commits (sin verificar aún, N0).** DI-GSI-010 podría exigir firma GPG/SSH; el ruleset base NO la activa.
  Confirmar con `cumplimiento-normativo` si es requisito y añadir la regla `required_signatures`.
- **`gh` en Windows (sin verificar aún, N0).** El script asume `gh` instalado y `gh auth login` hecho con permisos admin.
- **Título de PR y changelog (sin verificar aún, N0).** Con squash, un título fuera de convención rompe el changelog
  automatizado; por eso `pr-title-conventional` debe ser status check **requerido**, no informativo.

## 5. Criterios de done
- [ ] `main` protegida: sin push directo, ≥1 approval, CODEOWNERS obligatorio, status checks `ci` + `pr-title-conventional`, conversaciones resueltas, historial lineal, solo squash.
- [ ] `pull_request_template.md`, `CODEOWNERS` y `lint-pr-title.yml` presentes en el repo y con equipos reales (no `${ORG}`).
- [ ] Cada PR referencia su misión (Fase·componente·blueprint §) y trae el DoD marcado.
- [ ] Approver verificablemente distinto del author en cada PR (Regla 1).
- [ ] La fila de `metricas/scoreboard.csv` fue agregada por el revisor dentro del PR antes del merge (Regla 5).
- [ ] Commits y títulos de PR pasan el lint de Conventional Commits.
- [ ] Línea gobierno: flujo replicado en GitLab institucional (protected branches + MR approvals) y merge a producción coordinado por ITIL M-GSI-003, fuera del congelamiento.

## Registro de uso
| Fecha | Proyecto | Tarea | Resultado | Lección |
|---|---|---|---|---|
