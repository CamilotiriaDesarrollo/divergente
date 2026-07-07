---
name: devops-cicd-github-gitlab
regimen: universal
description: Monta pipelines de CI/CD (lint + tests + build + despliegue) en GitHub Actions y su equivalente portable en GitLab CI institucional, para las tres lineas del portafolio (Node/Vite/Next.js en Vercel, .NET/SQL Server en gobierno, Python de scraping). Cargala en F3 al pedir "CI minimo desde el dia 1", al crear/arreglar .github/workflows/*.yml o .gitlab-ci.yml, al configurar el gate "verde antes de mergear", al portar un pipeline de GitHub a GitLab, o cuando aparezcan runners, artifacts, service containers, secrets de CI o despliegue automatizado.
---

# DevOps — CI/CD en GitHub Actions y GitLab CI

**Nivel actual:** N0 · **Dominio:** devops · **Agente(s):** `devops-plataforma`
**Proyectos fuente:** ninguno — creada desde buenas prácticas (VACÍO del portafolio)

> Criterio de ascenso a N1: los 5 bloques completos, con activos copiables de ruta real y gotchas verificados (no genéricos). A N2: ≥1 uso real aceptado por el Dueño. A N3: ≥3 usos exitosos en ≥2 proyectos + checklist propio.

## 1. Propósito

**Vacío que la origina:** ningún proyecto del portafolio tiene pipelines de CI/CD funcionando; solo aparece como *plan futuro* en PNMC y en el Scraper. Hoy el gate "todo en verde antes de subir" se ejecuta a mano (ver `qa-kit-eslint9-prettier-monorepo`) y los despliegues son manuales. Esta skill cierra ese vacío: automatizar **lint + tests + build + despliegue** como pipeline versionado, y —crítico— hacerlo **portable** para que lo escrito en GitHub Actions se traslade sin reescribir la lógica al **GitLab institucional** del ministerio.

Se carga cuando `devops-plataforma` aborda la **Fase F3 (Fundaciones)**: "CI mínimo desde el día 1 (lint+build+test, portable GitHub→GitLab institucional)", cuya compuerta **G3** exige *pipeline en verde*. También al crear/arreglar workflows, configurar la protección de ramas que obliga al pipeline verde para mergear, o montar el CD (Vercel en la línea privada; despliegue gobernado por ITIL en la estatal).

Por ser N0, es un **punto de partida correcto y accionable**, no experiencia acumulada: las plantillas de `activos/` funcionan como esqueleto y se corrigen en el primer uso real.

## 2. Procedimiento

1. **Identifica la línea y su par plataforma→destino:**
   - Privada (Vite+React 19 / Express, o Next.js 16) → **GitHub Actions** + **Vercel** (auto-deploy del frontend, ver `devops-monorepo-client-server-vercel`).
   - Gobierno (.NET 8 / SQL Server, normativa **M-GSI-002** y **DI-GSI-010**) → **GitLab institucional**; CD a producción bajo **ITIL M-GSI-003**.
   - Datos/scraping (Python) → GitHub o GitLab, lint + tests.

2. **Escribe el CI con las 4 etapas mínimas** (mismas en toda línea): `lint` → `format:check` → `test` → `build`. Copia el activo correspondiente (`activos/github/ci-*.yml`). El CI corre en `push` y en `pull_request`/`merge_request` sobre `main`/`develop`.

3. **Reproduce el gate local en CI.** Los mismos comandos que ya se corren a mano (`npm run lint`, `npm run format:check`, `npm run build` con `tsc && vite build`) son los pasos del job. El tipado es gate de despliegue: un error de `tsc` aborta el build y bloquea el merge.

4. **Configura caché y `npm ci`** anclado al lockfile (`package-lock.json` commiteado) para builds reproducibles; publica el `dist`/reportes como **artifact** (evidencia para G3–G5, DI-GSI-010).

5. **Endurece el pipeline:** `permissions: contents: read` (mínimo privilegio del `GITHUB_TOKEN`), `concurrency` con `cancel-in-progress` para no gastar minutos, y en gobierno **ancla cada action a su SHA** (cadena de suministro).

6. **Protege la rama:** en el repo, exige que el pipeline pase para poder mergear (GitHub: *branch protection → required status checks*; GitLab: *merge request approvals + pipeline succeeds*). Sin esto el CI es decorativo.

7. **Gestiona secretos fuera del repo** (nunca sembrados): GitHub *Secrets*, GitLab *CI/CD Variables* (Protected+Masked). En la nube prefiere **OIDC** sobre llaves de larga vida; en gobierno el origen es **Azure Key Vault** (ver `seg-gestion-secretos-keyvault` y `seg-implementacion-sso-ldap-oidc` para el patrón OIDC contra Azure AD/LDAP que exige DI-GSI-010).

8. **CD según la línea:**
   - Privada: normalmente basta la **integración Git nativa de Vercel** (auto-deploy) + el CI como gate. Si necesitas control explícito, usa `activos/github/cd-vercel.yml` con **una sola** vía de deploy.
   - Gobierno: el paso a producción es una **compuerta manual** (`when: manual` / `environment` con reviewers) que representa el **cambio ITIL aprobado por el CCC** (F-GSI-037, ver `devops-gestion-cambios-itil-gobierno`). Nunca auto-deploy a producción estatal, ni dentro del congelamiento 15dic–15ene.

9. **Porta a GitLab.** Traduce con `activos/PORTABILIDAD-github-actions-a-gitlab-ci.md` (tabla de equivalencias) y mantén ambos como el **mismo pipeline lógico**. Recuerda: los runners institucionales suelen estar aislados → usa el **mirror interno** de imágenes y feeds npm/NuGet internos.

10. **Verifica versiones antes de fijarlas.** Node 22 LTS (Next.js 16/React 19 exigen ≥20.9), .NET SDK 8.0, Python 3.12, `actions/*` en v4, imagen SQL Server 2022. Todo esto **pudo avanzar tras el cutoff (ene-2026)**: confirma la versión vigente y lo que fije el proyecto antes de commitear.

## 3. Activos copiables

Todos en `activos/` de esta skill (ver `activos/README.md` para la tabla completa de qué adaptar). **Creados desde buenas prácticas, sin validar en proyecto propio (N0)**; sin secretos, con placeholders.

- **`activos/github/ci-node-monorepo.yml`** — CI GitHub para monorepo client/server o Next.js. Copiar a `.github/workflows/ci.yml`. Adaptar: versión de Node, ruta `client/`; en single-package Next.js usar `.` y borrar el job server.
- **`activos/github/ci-dotnet-sqlserver.yml`** — CI .NET 8 + SQL Server como *service container* con healthcheck y artifact de resultados (evidencia DI-GSI-010). Adaptar: versión SDK, cadena de conexión, BD de test.
- **`activos/github/ci-python-scraping.yml`** — CI Python (ruff + pytest) para el Scraper.
- **`activos/github/cd-vercel.yml`** — CD a Vercel (preview en PR, prod con `environment` protegido). Elegir una sola vía de deploy (leer cabecera).
- **`activos/gitlab/gitlab-ci-node.yml`** y **`activos/gitlab/gitlab-ci-dotnet.yml`** — espejos institucionales (GitLab CI) de los CI de Node y .NET, con deploy manual = compuerta CCC.
- **`activos/PORTABILIDAD-github-actions-a-gitlab-ci.md`** — tabla de equivalencias GHA↔GitLab + guía de secretos/OIDC + especificidades del GitLab de gobierno.

## 4. Gotchas verificados

*Riesgos documentados de la práctica, **sin verificar aún en proyecto propio (N0)**. Se confirmarán y datarán con evidencia en el primer uso real.*

- **Doble despliegue Vercel.** Si dejas activa la integración Git de Vercel **y** un workflow con Vercel CLI, cada push despliega dos veces (condición de carrera + minutos gastados). Mitigación: elegir una sola vía. *(sin verificar en proyecto propio — N0)*
- **Dev en Windows, CI en Linux.** `ubuntu-latest` es case-sensitive: un `import './Componente'` que en Windows resuelve a `componente.tsx` compila local pero rompe en CI. Además CRLF vs LF hace fallar `prettier --check` (mitigado por `.gitattributes` de `qa-kit-eslint9-prettier-monorepo`). *(sin verificar — N0)*
- **`npm ci` sin lockfile falla.** Requiere `package-lock.json` commiteado y en sync con `package.json`; si no, el job aborta. Usar `npm ci`, no `npm install`, para builds reproducibles. *(sin verificar — N0)*
- **Runners de GitLab institucional sin internet.** No pueden bajar `node:22` ni paquetes de npmjs/NuGet.org. Hay que apuntar a un **mirror/registry interno** y feeds privados; asumir acceso público es el error clásico al portar. *(sin verificar — N0)*
- **SQL Server tarda en aceptar conexiones.** El service container necesita healthcheck (`SELECT 1` con `sqlcmd -C`, ruta `mssql-tools18`); sin `--health-*` los tests de integración fallan por conexión rechazada al arrancar. *(sin verificar — N0)*
- **`GITHUB_TOKEN` con permisos por defecto amplios.** Riesgo de supply-chain. Fijar `permissions:` al mínimo y anclar actions a SHA en la línea gobierno (DI-GSI-010). *(sin verificar — N0)*
- **Versiones a la deriva.** Fijar `node-version: '22'`/SDK/imagen sin verificar puede chocar con lo que exige el framework (p. ej. Next.js 16 y Node <20.9). Confirmar contra doc vigente antes de commitear. *(sin verificar — N0)*
- **Deploy a producción estatal fuera de proceso.** Un auto-deploy a prod sin la SDC F-GSI-037/CCC incumple ITIL M-GSI-003; el CD gubernamental debe ser compuerta manual. *(riesgo normativo; el proceso ITIL sí está verificado en `devops-gestion-cambios-itil-gobierno`, la integración en pipeline no).*

## 5. Criterios de done

- [ ] Existe el workflow en la ruta correcta (`.github/workflows/ci.yml` o `.gitlab-ci.yml`) con las 4 etapas: **lint, format:check, test, build**.
- [ ] El pipeline corre en `push` y en `pull_request`/`merge_request` sobre `main`/`develop` y termina **en verde**.
- [ ] La **protección de rama** impide mergear si el pipeline no pasa (required status check / pipeline succeeds).
- [ ] `npm ci`/`dotnet restore`/`pip install` usan lockfile/manifiesto y hay **caché** configurada; el build es reproducible.
- [ ] Se publican **artifacts/reportes** (dist, `.trx`/JUnit) como evidencia para G3–G5.
- [ ] **Cero secretos en el repo**: sólo `.env.example`; los reales en el gestor de secretos (Key Vault en gobierno), preferir OIDC.
- [ ] `permissions` al mínimo; en gobierno, actions ancladas a SHA e imágenes desde mirror interno.
- [ ] Existe el **espejo portable** GitHub↔GitLab (mismo pipeline lógico) cuando la línea lo requiere.
- [ ] En gobierno, el CD a producción es **compuerta manual** atada al CCC (F-GSI-037), fuera del congelamiento 15dic–15ene.
- [ ] Versiones (Node/.NET/Python/actions/imágenes) **verificadas** contra doc vigente y contra lo que fija el proyecto.

## Registro de uso
| Fecha | Proyecto | Tarea | Resultado | Lección |
|---|---|---|---|---|
