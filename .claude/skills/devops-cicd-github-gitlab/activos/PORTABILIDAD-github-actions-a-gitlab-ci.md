# Portabilidad GitHub Actions -> GitLab CI

La linea privada arranca en GitHub (auto-deploy Vercel); la linea gobierno entrega en el
**GitLab institucional** del ministerio. La regla de F3 es que el CI sea **portable** desde el
dia 1: mismas etapas logicas (lint / format / test / build), traducibles sin reescribir la logica.
Escribe primero el pipeline en un solo lugar y manten el otro como espejo.

## Tabla de equivalencias

| Concepto | GitHub Actions | GitLab CI |
|---|---|---|
| Archivo | `.github/workflows/ci.yml` | `.gitlab-ci.yml` (raiz) |
| Unidad de trabajo | `job` | `job` dentro de un `stage` |
| Orden/fases | `needs:` entre jobs | `stages:` + orden |
| Imagen base | `runs-on` + `container:` | `image:` |
| Disparadores | `on: [push, pull_request]` | `rules:` con `$CI_PIPELINE_SOURCE`, `$CI_COMMIT_BRANCH` |
| Solo en MR/PR | `on: pull_request` | `if: $CI_PIPELINE_SOURCE == "merge_request_event"` |
| Pasos | `steps:` (`uses:` / `run:`) | `before_script:` + `script:` |
| Cache deps | `actions/setup-node` con `cache:'npm'` | `cache:` con `key.files` = lockfile |
| Artefactos | `actions/upload-artifact` | `artifacts: paths:` |
| Reporte de tests | subir `.trx`/`.xml` como artifact | `artifacts: reports: junit:` (se ve en el MR) |
| Servicio (BD) | `services:` en el job | `services:` con `alias` = hostname |
| Secreto | `${{ secrets.NOMBRE }}` | variable CI/CD protegida+enmascarada `$NOMBRE` |
| Aprobacion manual | `environment:` con reviewers | `when: manual` + `environment:` |
| Reutilizar bloque | `composite`/reusable workflow | `extends:` / anchors YAML (`&x`/`*x`) |

## Gestion de secretos (ambas plataformas)

- Nunca en el repo. GitHub: *Settings -> Secrets and variables -> Actions*. GitLab: *Settings -> CI/CD -> Variables* (marca **Protected** y **Masked**).
- En la nube, prefiere **OIDC** (federacion de identidad) sobre llaves de larga vida:
  GitHub OIDC -> Azure/AWS sin secreto estatico. Es lo que pide DI-GSI-010 para no sembrar credenciales.
- Para la linea gobierno, el origen de verdad de secretos es **Azure Key Vault**
  (ver skill `seg-gestion-secretos-keyvault`); el pipeline solo los inyecta en tiempo de ejecucion.

## Especificidades del GitLab institucional (gobierno)

1. Runners suelen estar **aislados de internet** -> usa el **mirror interno** de imagenes
   (`registry.entidad.gov.co/...`) en `image:`; configura `.npmrc` / feed NuGet interno.
2. El CD a produccion es **manual** y equivale al cambio ITIL aprobado por el CCC
   (`devops-gestion-cambios-itil-gobierno`, F-GSI-037): nunca auto-deploy a produccion estatal.
3. Deja evidencia: reportes JUnit y artefactos de build son insumo de las compuertas G3-G5 (DI-GSI-010).
