# Runbook: flujo git de equipo con PRs

Modelo: **trunk-based** con `main` protegida + ramas de vida corta + **squash merge**.
Encaja con la fábrica: fases rápidas (F3 en días), demos cada 2-3 componentes, patrón "backend durmiente".
GitFlow (ramas `develop`/`release` de larga vida) se evita por sobrecosto; los releases se cortan con tags.

## Ciclo de una misión
1. `git switch -c feat/f4-mapa-leaflet main`  (una rama por misión).
2. Commits atómicos siguiendo `commit-convention.md`.
3. `git fetch origin && git rebase origin/main` antes de publicar.
4. `git push -u origin feat/f4-mapa-leaflet`
5. Abrir PR con la plantilla → título en Conventional Commits → enlazar misión (F#·C#, blueprint §).
6. CI corre (lint+test+build). CODEOWNERS asigna al revisor (`qa-ingeniero`; + `seguridad-appsec` si toca auth/roles/datos).
7. **Revisor ≠ constructor** revisa. Antes de aprobar, el REVISOR agrega la fila en `metricas/scoreboard.csv`
   como commit en la misma rama (se squashea junto al entregable → Regla 5 satisfecha en un solo commit de `main`).
8. Todas las conversaciones resueltas + CI verde + 1 approval → **Squash and merge**. La rama se borra.

## Configuración inicial (F3, una vez por repo)
- Copiar `pull_request_template.md`, `CODEOWNERS`, `lint-pr-title.yml`.
- GitHub: `./configurar-proteccion-github.ps1 -Repo "org/repo"`.
- GitLab institucional: ver `gitlab-merge-request-template.md` (protected branches + MR approvals por UI/API).

## Estado deseado de `main`
Sin push directo · ≥1 approval · CODEOWNERS obligatorio · CI y lint de título requeridos ·
conversaciones resueltas · historial lineal · solo squash merge.
