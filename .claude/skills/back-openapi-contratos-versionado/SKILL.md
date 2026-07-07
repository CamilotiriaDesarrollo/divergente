---
name: back-openapi-contratos-versionado
regimen: universal
description: Diseña la API como un contrato OpenAPI 3.1 versionado y verificable, no como código improvisado: estructura del contrato, versionado SemVer + /api/v{n}, política de deprecación (Sunset/Deprecation), tests de contrato y detección de cambios incompatibles (oasdiff) en CI, para las dos líneas del Dueño (Express/TS sobre Vercel y .NET sobre gobierno). Cargar cuando haya que firmar el contrato OpenAPI inicial de la compuerta G3, definir convenciones de versionado más allá de un /api/v1 suelto, evitar romper el frontend al cambiar el backend, generar tipos/mocks desde el contrato para el patrón "backend durmiente", o documentar la interfaz de la capa Servicios Distribuidos exigida por M-GSI-002.
---

# API como contrato: OpenAPI, versionado y tests de contrato

**Nivel actual:** N0 · **Dominio:** Backend · **Agente(s):** `back-node-api`, `back-dotnet-gobierno`
**Proyectos fuente:** ninguno — creada desde buenas prácticas (VACÍO del portafolio)

> Criterio de ascenso a N1: los 5 bloques completos, con activos copiables de ruta real y gotchas verificados (no genéricos). A N2: ≥1 uso real aceptado por el Dueño. A N3: ≥3 usos exitosos en ≥2 proyectos + checklist propio.

## 1. Propósito

Cubrir un vacío real del portafolio: **ningún proyecto del Dueño ejercitó el diseño formal de APIs**. Hoy no hay contrato OpenAPI/Swagger versionado, ni tests de contrato, ni convención de versionado más allá de un `/api/v1` escrito a mano. La consecuencia práctica ya vivida en otras skills: el frontend consume la API por acuerdo tácito de tipos (`interface Sistema` copiada a mano entre `client` y `server`), y cualquier cambio del backend puede romper el cliente en silencio.

Esta skill convierte la API en un **artefacto revisable**: un archivo `contracts/openapi.yaml` que es la única fuente de verdad, del que se derivan los tipos del frontend, los mocks para el "backend durmiente" y los tests que fallan si el código se desvía. Se apoya directamente en dos puntos ya escritos del sistema:

- **F3 / compuerta G3** exige un "contrato OpenAPI inicial firmado entre `front-lider` y el backend del stack elegido". Esta skill es el *cómo* de ese entregable.
- En la línea gobierno, el **M-GSI-002** modela una capa "Servicios Distribuidos" cuya interfaz publicada es, exactamente, lo que documenta este contrato (ver `back-arquitectura-ncapas-ddd-dotnet`).

Se carga cuando: se firma el contrato de G3, se añade un endpoint nuevo y hay que versionarlo sin romper consumidores, se quiere generar tipos/mock desde el contrato, o se necesita atar un cambio de API al proceso de cambios ITIL.

No cubre: montar el esqueleto Express (`back-api-express-typescript-minima`), la arquitectura N-capas .NET (`back-arquitectura-ncapas-ddd-dotnet`), el pipeline CI completo (`devops-cicd-github-gitlab`), ni la implementación del IdP OIDC (`seg-implementacion-sso-ldap-oidc`) — solo referencia sus puntos de contacto.

## 2. Procedimiento

**Enfoque contract-first.** El contrato se escribe (o se acuerda) ANTES de implementar; frontend y backend trabajan contra él en paralelo. En .NET, donde el documento suele generarse desde el código, se exporta a archivo y se le aplica el mismo pipeline (paso 6) para que siga siendo un artefacto revisable, no algo oculto en runtime.

1. **Escribir el contrato** partiendo de `activos/contracts/openapi.yaml` (OpenAPI **3.1**). Reglas de la Fábrica: cada operación con `operationId` estable (lo consumen los generadores de tipos), errores en formato **Problem Details (RFC 9457)** con `application/problem+json`, paginación explícita, y esquema de seguridad **OIDC** apuntando al IdP institucional (`${OIDC_AUTHORITY}`, ver DI-GSI-010). Nombres de negocio en español, claves técnicas en inglés (convención de los CLAUDE.md del portafolio).
2. **Versionar bien desde el día 1.** La versión vive en el `server.url` (`/api/v1`), NO embebida en cada path. Adoptar **SemVer para la API**: cambio incompatible → nueva MAYOR y nueva ruta `/api/v2`; adiciones retrocompatibles → MENOR. Documentar cada cambio en `activos/CHANGELOG-API.md`.
3. **Política de deprecación explícita.** Un endpoint/versión en retirada responde con la cabecera `Deprecation` (RFC 9745) y `Sunset: <fecha-http>` (RFC 8594), con ventana mínima de convivencia (sugerido 90 días). **Confirmar la sintaxis del valor de `Deprecation` antes de emitirlo:** la versión final de la RFC 9745 usa un *structured field* de tipo fecha (`@<epoch-unix>`), no el booleano `true` de los borradores previos. En gobierno, **cada salto de versión es un cambio ITIL (M-GSI-003)**: SDC, comité, rollback (ver `devops-gestion-cambios-itil-gobierno`).
4. **Lint del contrato** con Spectral (`activos/.spectral.yaml`, extiende `spectral:oas`): `spectral lint contracts/openapi.yaml --fail-severity=error`. Atrapa `operationId` faltantes, operaciones sin respuesta de error y versión embebida en el path.
5. **Derivar artefactos del contrato** (no escribirlos a mano):
   - **Tipos TS compartidos** con `openapi-typescript` (`scripts/generar-tipos.ps1` → `client/src/types/api.d.ts`, commiteado). Sustituye la copia manual de interfaces entre `client` y `server`.
   - **Mock para el "backend durmiente"** con Prism: `prism mock contracts/openapi.yaml -p 4010`. El frontend arranca contra el mock mientras el backend duerme (encaja con el patrón de F4 y con `back-api-express-typescript-minima`).
6. **Enforcar el contrato con tests de contrato** (que es lo que hoy no existe):
   - **Línea Node/Express:** montar `express-openapi-validator` (`activos/node/openapi-validator.ts`) para validar request (y response en dev/CI) contra el `.yaml`. Con eso, los tests de integración pasan a ser tests de contrato (`activos/tests/contrato.test.ts`, Vitest + supertest). Alternativa property-based: `schemathesis run` contra el documento vivo (encaja con el Python del stack).
   - **Línea .NET:** versionado con `Asp.Versioning.*` y documento OpenAPI nativo (`Microsoft.AspNetCore.OpenApi`, `activos/dotnet/Program.cs`); exportar `/openapi/v1.json` a archivo (`exportar-openapi.ps1`) y correr Spectral/oasdiff sobre él.
7. **Bloquear rupturas en CI** con `oasdiff breaking` (`activos/workflows/contract.yml`): compara el contrato del PR contra `main` y **falla el PR si hay un cambio incompatible no acompañado de subida de versión**. Portable a GitLab (`gitlab-ci-contract.yml`) instalando el binario `oasdiff` (allí no hay GitHub Action).
8. **Firmar y versionar.** El `.yaml` (o `.json`) se commitea en `contracts/`, se referencia en el acta de G3 y queda como base para el próximo `oasdiff`.

**Sensible a versiones (verificar antes de usar, regla inviolable #8):** OpenAPI 3.1 alinea con JSON Schema pero algunas herramientas aún cojean en 3.1; en .NET, `Microsoft.AspNetCore.OpenApi` es el generador por defecto desde **.NET 9** (Swashbuckle salió de la plantilla por defecto; para UI moderna, `Scalar.AspNetCore`); los paquetes de versionado se renombraron de `Microsoft.AspNetCore.Mvc.Versioning` a **`Asp.Versioning.*`** (probado con major 8.x — confirmar el actual). Versiones sugeridas de tooling: Spectral 6, `openapi-typescript` 7, Prism 5, `oasdiff-action` con tag fijado.

## 3. Activos copiables

Todos en `activos/` de esta skill (creados desde cero para N0; sin ruta de proyecto porque no hay proyecto fuente). Índice completo en `activos/README.md`.

| Activo | Qué es | Qué adaptar al copiar |
|---|---|---|
| `activos/contracts/openapi.yaml` | Contrato OpenAPI 3.1 base: recurso `sistemas`, paginación, errores RFC 9457, seguridad OIDC | Renombrar recurso; `${API_BASE_URL}`, `${OIDC_AUTHORITY}`; ampliar schemas al dominio |
| `activos/.spectral.yaml` | Ruleset de linting (extiende `spectral:oas` + 2 reglas propias) | Ajustar severidades; validar las reglas propias contra tu versión de Spectral |
| `activos/workflows/contract.yml` | GitHub Actions: lint + oasdiff (breaking) + tipos al día + tests de contrato | Fijar tag de `oasdiff-action`; ajustar rutas y `node-version` |
| `activos/workflows/gitlab-ci-contract.yml` | Job equivalente para GitLab CI institucional | Instala el binario `oasdiff` (no hay Action) |
| `activos/scripts/generar-tipos.ps1` | Regenera tipos TS compartidos desde el contrato (Windows) | Rutas de contrato/salida; el `.d.ts` se commitea |
| `activos/node/openapi-validator.ts` | Cablea `express-openapi-validator` (enforce en runtime) + handler Problem Details | Montar en el `app.ts` real; prefijo `/api/v1` |
| `activos/tests/contrato.test.ts` | Test de contrato Node (Vitest + supertest) | Import del `app`; añadir script `test:contract` |
| `activos/dotnet/Program.cs` | Minimal API .NET 10: versionado por URL + OpenAPI nativo | Verificar major de `Asp.Versioning.*`; endpoints reales |
| `activos/dotnet/exportar-openapi.ps1` | Vuelca `/openapi/v1.json` a archivo para el mismo pipeline | URL/puerto de Kestrel; o generación en build |
| `activos/CHANGELOG-API.md` | Changelog de API + política de deprecación atada a ITIL M-GSI-003 | `${PROYECTO}`, `${FECHA}` |

## 4. Gotchas verificados

> **Skill N0: los siguientes son riesgos documentados de la práctica, SIN VERIFICAR AÚN en proyecto propio del Dueño.** Ascenderán a gotchas con evidencia cuando la skill se use.

1. **OpenAPI 3.1 eliminó `nullable: true`** (sin verificar aún, N0). En 3.0 un campo opcional-nulo se marcaba `nullable: true`; en 3.1 eso es inválido y se declara como unión de tipos: `type: ["string", "null"]`. Copiar el patrón del `openapi.yaml` (campo `icono`). Algunos generadores viejos aún asumen 3.0 y fallan o ignoran el `null`.
2. **`/api/v1` en la ruta no es versionar** (sin verificar aún, N0). Poner `v1` en el path sin política de deprecación ni detección de rupturas es cosmético — es justo el estado que origina esta skill. Versionar = SemVer + `oasdiff` en CI + `Sunset`/`Deprecation`. Sin el gate de `oasdiff`, un cambio incompatible pasa el PR y rompe consumidores.
3. **Validar respuestas en producción cuesta** (sin verificar aún, N0). `validateResponses: true` de `express-openapi-validator` es valioso en dev/CI pero añade overhead por request; el activo lo condiciona a `NODE_ENV !== 'production'`. Requests sí conviene validarlas siempre.
4. **El documento .NET generado puede no coincidir con el contrato acordado** (sin verificar aún, N0). Si el equipo .NET diseña "code-first", el `/openapi/v1.json` refleja el código, no el acuerdo con `front-lider`. Mitigación: exportarlo (paso 6) y pasarle `oasdiff` contra el contrato firmado; discrepancia = bug del código, no del contrato.
5. **`fetch-depth: 0` es obligatorio para `oasdiff`** (sin verificar aún, N0). Comparar contra `main` necesita el historial git completo; con el checkout superficial por defecto, el job falla al resolver `git:main:...`. El activo ya lo trae; en GitLab es `GIT_DEPTH: 0` + `git fetch origin main`.
6. **OIDC en el contrato ≠ OIDC implementado** (sin verificar aún, N0). El `securityScheme` documenta la intención; la validación real del token es tarea de `seg-implementacion-sso-ldap-oidc`. No dar por seguro un endpoint solo porque el contrato lo marca con `security`.
7. **Placeholders `${VAR}` no son OpenAPI válido literal** (sin verificar aún, N0). Los `${API_BASE_URL}`/`${OIDC_AUTHORITY}` de la plantilla deben resolverse (por entorno o sustitución) antes de que Prism/validadores estrictos consuman el archivo; si no, algunos parsers protestan por la URL.

## 5. Criterios de done

- [ ] Existe `contracts/openapi.yaml` (3.1) versionado en git y referenciado en el acta de G3.
- [ ] `spectral lint` pasa con `--fail-severity=error` (cero errores; warnings justificados).
- [ ] Versión en `server.url` como `/api/v{n}`, no en los paths; `CHANGELOG-API.md` con la versión inicial y la política de deprecación.
- [ ] Los tipos del frontend se generan del contrato (`api.d.ts` commiteado) y el job de CI verifica que no divergen (`diff` en verde).
- [ ] Existe al menos un **test de contrato** que falla si el código viola el `.yaml` (validador en runtime o property-based), corriendo en CI.
- [ ] El job de CI ejecuta `oasdiff breaking` contra `main` y **bloquea** el PR ante un cambio incompatible sin subida de MAYOR.
- [ ] Errores en `application/problem+json` (RFC 9457); seguridad OIDC declarada en las operaciones protegidas.
- [ ] (Gobierno) El cambio de versión de API quedó registrado como cambio ITIL (M-GSI-003) con rollback; contrato documenta la interfaz de la capa Servicios Distribuidos (M-GSI-002).
- [ ] (.NET) El documento generado se exporta a `contracts/` y pasa el mismo `spectral`/`oasdiff` que la línea Node.

**Dudas / límites de la evidencia (N0):** (a) ningún proyecto del Dueño ha ejecutado este flujo — todo el procedimiento es diseño verificado contra documentación de las herramientas, no experiencia propia; (b) no está probado el interop exacto entre el OpenAPI que emite `Microsoft.AspNetCore.OpenApi` en la versión .NET del Dueño y las reglas 3.1 de Spectral/oasdiff — validar en el primer uso; (c) la elección entre `express-openapi-validator` (runtime) y `schemathesis` (property-based) para los tests de contrato no se ha comparado en un proyecto real; (d) los tags/versiones de `oasdiff-action`, Spectral, Prism y `Asp.Versioning.*` deben confirmarse contra el release vigente antes del primer uso (regla inviolable #8).

## Registro de uso
| Fecha | Proyecto | Tarea | Resultado | Lección |
|---|---|---|---|---|
