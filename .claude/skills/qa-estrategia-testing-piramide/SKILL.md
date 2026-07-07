---
name: qa-estrategia-testing-piramide
regimen: universal
description: Define y monta la estrategia de testing automatizado en pirámide (unit -> integración/API -> E2E) para el stack de la fábrica, con cobertura, tests de contrato OpenAPI y E2E Playwright autenticado por OIDC. Cárgala al planear la Fase 5 (endurecimiento), al preguntar "qué tests hacemos / cuánta cobertura", al arrancar la suite de un proyecto, al integrar tests en CI, o cuando exista Playwright/Vitest instalado pero sin usar.
---

> **Régimen: universal.** Las referencias a normativa estatal (M-GSI-002, DI-GSI-010, ITIL, GOV.CO, «entidad pública») aplican SOLO en proyectos `institucional`; en un proyecto `divergente` ignóralas y usa la variante de la línea privada (Vercel/Node/Postgres).

# QA — Estrategia de testing en pirámide

**Nivel actual:** N0 · **Dominio:** QA y Calidad · **Agente(s):** `qa-ingeniero` (coordina con `devops-plataforma` para CI y con `back-node-api`/`back-dotnet-gobierno` para los contratos)
**Proyectos fuente:** ninguno — creada desde buenas prácticas (VACÍO del portafolio)

> Criterio de ascenso a N1: los 5 bloques completos, con activos copiables de ruta real y gotchas verificados (no genéricos). A N2: ≥1 uso real aceptado por el Dueño. A N3: ≥3 usos exitosos en ≥2 proyectos + checklist propio.

## 1. Propósito

El portafolio del Dueño **no tiene testing automatizado sistemático**: hay Vitest/xUnit incipiente en PNMC, un test de regresión baseline en Scraper-Empleos, QA visual puntual en Divergente, y **Playwright instalado en GEDII pero sin un solo test**. Falta lo que ata todo eso: una **estrategia de pirámide** que decida cuántos tests de cada tipo, con qué herramienta, con qué cobertura, y cómo corren en CI.

Esta skill da esa estrategia, aterrizada al stack real (Next.js 16/React 19, client/server Vite+Express, .NET/SQL Server, Python) y a las 7 fases: el CI mínimo nace en F3 y la **pirámide completa es la exigencia central de la compuerta G5** (F5 Endurecimiento), donde DI-GSI-010 pide informes de pruebas (solo si el proyecto es institucional). Se carga al planear F5, al arrancar la suite de un proyecto, al meter tests en el pipeline, o cuando alguien pregunta "¿qué probamos y cuánta cobertura?".

## 2. Procedimiento

La pirámide tiene tres niveles: **muchos** unit (base, baratos y rápidos), **algunos** de integración/API (medio), **muy pocos** E2E (cima). El anti-patrón a evitar es el "cono de helado" (todo E2E: lento y frágil).

1. **Elige la herramienta por paquete del stack** (todas activas a 2026; fija la versión en `package.json`/`.csproj`):
   - Frontend/Node TS (Next 16, Vite+Express): **Vitest 3.x** + React Testing Library (unit), **supertest** (API).
   - .NET línea gobierno: **xUnit** + `WebApplicationFactory<Program>` (integración), respetando el estándar de codificación **M-GSI-002**.
   - Python (datos/scraping): **pytest**.
   - E2E cualquier stack web: **Playwright** (reusa el que ya está en GEDII).
2. **BASE — unit.** Prioriza lógica pura (funciones de dominio, scoring, transformaciones): es el test más barato y estable. Para UI usa RTL sobre componentes **de cliente**. Config y ejemplo: `activos/vitest.config.ts`, `activos/ejemplo.unit.test.tsx`.
3. **MEDIO — integración/API + contrato.** Ejerce las rutas reales y **valida la respuesta contra el contrato OpenAPI** (skill `back-openapi-contratos-versionado`), convirtiendo el contrato en prueba ejecutable. Node: `activos/api-contrato.integration.test.ts`. .NET: `activos/DotnetWebApplicationFactoryTests.cs`.
4. **CIMA — E2E.** Solo flujos que, si se rompen, invalidan el producto. Autenticación **OIDC contra Azure AD/LDAP** (como exige DI-GSI-010 — solo si el proyecto es institucional; en un proyecto divergente usa el proveedor de identidad de la línea privada; ver `seg-implementacion-sso-ldap-oidc`) resuelta con el patrón `setup` de Playwright: login una vez, `storageState` reusado. Config: `activos/playwright.config.ts` + `activos/auth.setup.ts` + `activos/e2e-flujo-critico.spec.ts`.
5. **Cobertura honesta.** Define umbrales en `vitest.config.ts` (provider `v8`) / coverlet en .NET, y **súbelos por PR** desde donde estés; no arranques exigiendo 90%. La cobertura es señal, no meta: mide ramas (`branches`), no solo líneas.
6. **Intégrala en CI desde F3.** Unit+integración en **cada PR** (rápido, es la compuerta real); E2E solo en push a `main` o nightly (lento y frágil). Pipeline portable GitHub→GitLab institucional (skill `devops-cicd-github-gitlab`): `activos/ci.yml` + `activos/.gitlab-ci.yml`. Publica cobertura y reporte Playwright como artefactos → alimentan el informe G5.
7. **Encadena los complementos** (no cuentan en la pirámide pero cierran G5): regresión baseline (`qa-test-regresion-baseline`), visual (`qa-visual-puppeteer-scroll-shots`), carga k6 (`qa-pruebas-carga-k6-jmeter`) y a11y NTC 5854 (`qa-auditoria-accesibilidad-automatizada`).
8. **Respeta el patrón "backend durmiente" de F4.** Mientras el frontend avanza con datos estáticos y el backend aún no existe, los tests de front NO deben esperar al backend: **mockea la API** en el borde (p. ej. MSW / un doble del cliente HTTP) contra el mismo contrato OpenAPI. Cuando el backend despierta, el test de integración real (paso 3) valida ese contrato de verdad. Así front y back se prueban en paralelo sin acoplarse.
9. **Convención de ubicación** (fíjala en el `CLAUDE.md` del proyecto): unit e integración junto al código (`*.test.ts`/`*.spec.ts` o `__tests__/`); E2E aislado en `e2e/` para que Vitest no lo recoja y Playwright no recoja los unit. El reparto objetivo es heurístico (~70/20/10, orientativo, no cuota): que el grueso del costo viva en la base.
10. **Documenta la estrategia y el resultado** en `activos/ESTRATEGIA-PRUEBAS.md` (plantilla del informe DI-GSI-010 para G5). Recuerda la separación de deberes: **revisor ≠ constructor**; `qa-ingeniero` revisa, y si el flujo toca auth/datos personales, revisa además `seguridad-appsec`.

## 3. Activos copiables

Todos en `activos/` de esta skill. **Creados desde buenas prácticas (N0), aún sin validar en proyecto propio.** Sin secretos: usan placeholders `${VAR}` y toman credenciales de entorno.

| Activo | Qué es | Qué adaptar |
|---|---|---|
| `ci.yml` | Pipeline GitHub Actions: lint → unit/integración (cada PR) → E2E (solo main) + job .NET comentado | `NODE_VERSION`, nombres de scripts npm, descomentar el job .NET si aplica |
| `.gitlab-ci.yml` | Espejo del anterior para GitLab institucional (entrega F6) | La imagen de Playwright fija a tu versión; las CI/CD variables protected+masked |
| `vitest.config.ts` | Config Vitest 3.x: entorno, cobertura `v8`, umbrales por capa | `environment` (`jsdom` client / `node` server), los umbrales, exclusiones |
| `ejemplo.unit.test.tsx` | Unit de lógica pura + componente cliente con RTL | Sustituye por tu función/componente real |
| `api-contrato.integration.test.ts` | Integración supertest + validación contra contrato OpenAPI | Ruta del contrato, endpoint, elige el validador (ver gotcha 4) |
| `DotnetWebApplicationFactoryTests.cs` | Integración .NET con `WebApplicationFactory` + xUnit | Rutas, sustituir DbContext por uno de test |
| `playwright.config.ts` + `auth.setup.ts` + `e2e-flujo-critico.spec.ts` | E2E con login OIDC vía `storageState` y un flujo crítico | Selectores del IdP de tu tenant, `baseURL`, el flujo real |
| `ESTRATEGIA-PRUEBAS.md` | Plantilla de estrategia e informe de pruebas para G5 / DI-GSI-010 | Todos los `${PLACEHOLDER}` |

## 4. Gotchas verificados

**Todos marcados "sin verificar aún en proyecto propio (N0)": son riesgos documentados de la práctica, a confirmar en el primer uso real.**

1. **Cono de helado (demasiados E2E).** Duplicar en E2E lo que un unit ya cubre da una suite lenta, cara y flaky que el equipo termina ignorando. Regla: E2E solo para flujos que invalidan el producto. *(Sin verificar en proyecto propio, N0.)*
2. **React 19 / Next 16 y RSC.** React Testing Library monta componentes de **cliente**; los Server Components async no se prueban bien con RTL. Cúbrelos con integración de la ruta o E2E, no forzando RTL. *(Sin verificar; depende de versión — reconfirmar contra la doc de Next 16 y RTL vigentes.)*
3. **Umbral de cobertura Vitest cambió entre 1.x y ≥2.x** (`coverage.lines` → `coverage.thresholds.*`). Copiar la clave equivocada hace que el gate no falle nunca. Verifica la versión instalada. *(Sin verificar; dependiente de versión.)*
4. **Tests de contrato: la librería es intercambiable y no todas siguen vivas.** `openapi-response-validator`, `jest-openapi`, Dredd o Schemathesis (Python, property-based) resuelven lo mismo; algunas tienen mantenimiento irregular. Elige una por proyecto y fija versión. *(Sin verificar en proyecto propio, N0.)*
5. **`WebApplicationFactory<Program>` exige exponer `Program`** (`public partial class Program {}` en minimal API) o no compila el test. Y no golpees la BD real: usa SQL Server efímero en contenedor. *(Sin verificar en proyecto propio, N0.)*
6. **Secretos en E2E.** Nunca hardcodear el usuario de prueba OIDC; solo por variables de entorno / secrets de CI, y `.auth/` en `.gitignore`. Un `storageState` commiteado filtra una sesión válida. *(Sin verificar; disciplina obligatoria por Habeas Data / DI-GSI-010.)*
7. **CRLF de Windows rompe snapshots y `--check` en CI** aunque en local pase. Ata esta suite al `.gitattributes` (`eol=lf`) de `qa-kit-eslint9-prettier-monorepo`. *(Riesgo heredado, ya visto en la fábrica en otra skill.)*
8. **E2E en cada PR frena al equipo.** Su lentitud y flakiness deben quedar fuera del PR (main/nightly), o la gente aprende a saltarse el CI. *(Sin verificar en proyecto propio, N0.)*
9. **Mocks que no siguen el contrato dan confianza falsa.** Si el mock del "backend durmiente" (paso 8) se escribe a mano y diverge del OpenAPI, el front pasa en verde y rompe al integrar. Deriva los mocks del mismo contrato y deja que el test de integración real (paso 3) sea el juez. *(Sin verificar en proyecto propio, N0.)*
10. **E2E flaky por esperas fijas.** `waitForTimeout`/sleeps fijos hacen la suite intermitente. Usa las aserciones auto-retry de Playwright (`expect(locator).toBeVisible()`) y `retries` solo como amortiguador, no como parche. *(Sin verificar en proyecto propio, N0.)*

## 5. Criterios de done

- [ ] Existe `ESTRATEGIA-PRUEBAS.md` del proyecto con los tres niveles, herramienta por paquete y flujos E2E justificados uno a uno.
- [ ] Hay tests reales en los tres niveles: unit (base mayoritaria), ≥1 de integración validando el contrato OpenAPI, y solo los E2E de flujos críticos.
- [ ] `npm run test:coverage` (o `dotnet test`) pasa en verde y cumple los umbrales declarados; el informe de cobertura queda como artefacto.
- [ ] E2E Playwright corre autenticado por OIDC vía `storageState`, sin secretos en el repo, y publica su reporte (con trazas de fallo).
- [ ] El pipeline corre unit+integración en cada PR y E2E en main/nightly, y es portable GitHub↔GitLab.
- [ ] Revisión por `qa-ingeniero` (+ `seguridad-appsec` si toca auth/datos personales); fila del scoreboard escrita por el revisor.
- [ ] Para G5 (solo si el proyecto es institucional): 0 defectos críticos abiertos y el informe de pruebas anexado al acta (DI-GSI-010); cambios a producción bajo ITIL (M-GSI-003 / P-GSI-003).

## Registro de uso
| Fecha | Proyecto | Tarea | Resultado | Lección |
|---|---|---|---|---|
