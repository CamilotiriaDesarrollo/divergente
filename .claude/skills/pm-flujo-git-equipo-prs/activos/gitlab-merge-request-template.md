# Portabilidad a GitLab institucional (línea gobierno — DI-GSI-010)

La entrega de código de proyectos estatales va al **GitLab institucional**. El flujo de PR se traduce a
**Merge Requests**; la protección de rama NO se configura con un JSON de ruleset sino por UI/API de GitLab.

## Equivalencias GitHub -> GitLab
| GitHub | GitLab |
|---|---|
| Pull Request | Merge Request (MR) |
| `.github/pull_request_template.md` | `.gitlab/merge_request_templates/mision.md` (reutiliza `pull_request_template.md`) |
| Ruleset / branch protection | **Settings > Repository > Protected branches** + **Merge request approvals** |
| CODEOWNERS | `CODEOWNERS` (mismo formato; requiere plan que lo soporte) |
| Required status checks | **Pipelines must succeed** (Settings > Merge requests) |
| Squash merge | **Squash commits when merging** (activar por defecto) |

## Configuración mínima (por API, ajustar a la versión self-managed real)
```bash
# Proteger la rama por defecto: solo maintainers pueden mergear, nadie hace push directo
curl --request POST --header "PRIVATE-TOKEN: ${GITLAB_TOKEN}" \
  "https://${GITLAB_HOST}/api/v4/projects/${PROJECT_ID}/protected_branches?name=main&push_access_level=0&merge_access_level=40"

# Exigir >=1 aprobación por MR
curl --request POST --header "PRIVATE-TOKEN: ${GITLAB_TOKEN}" \
  "https://${GITLAB_HOST}/api/v4/projects/${PROJECT_ID}/approvals" \
  --data "approvals_before_merge=1"
```

> AVISO: los niveles de acceso, endpoints y flags de aprobación cambian entre versiones de GitLab.
> Verificar contra la versión exacta del GitLab institucional antes de ejecutar. La pipeline `.gitlab-ci.yml`
> equivalente al CI de GitHub es dominio de la skill `devops-cicd-github-gitlab`.
