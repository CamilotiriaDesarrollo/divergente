# Activos — back-openapi-contratos-versionado

Plantillas de arranque para diseñar una API como **contrato OpenAPI versionado** con tests de
contrato y detección de cambios incompatibles en CI. Sin secretos: placeholders `${VAR}`.
Creados desde buenas prácticas (skill **N0**, aún sin uso en proyecto propio) — verificar
versiones de herramientas antes de copiar.

| Activo | Qué es | Cuándo copiarlo / qué adaptar |
|---|---|---|
| `contracts/openapi.yaml` | Contrato OpenAPI 3.1 base (recurso `sistemas`, paginación, errores RFC 9457, seguridad OIDC) | Al firmar el contrato inicial en G3. Renombrar recurso; ajustar `${API_BASE_URL}` y `${OIDC_AUTHORITY}`; ampliar schemas |
| `.spectral.yaml` | Ruleset de linting del contrato (extiende `spectral:oas` + reglas propias) | Copiar a la raíz. Ajustar severidades; validar las 2 reglas propias contra tu Spectral |
| `workflows/contract.yml` | GitHub Actions: lint + oasdiff (breaking) + tipos al día + tests de contrato | A `.github/workflows/`. Fijar el tag de `oasdiff-action`; ajustar rutas |
| `workflows/gitlab-ci-contract.yml` | Job equivalente para GitLab CI (línea institucional) | Pegar en `.gitlab-ci.yml`. Instala el binario `oasdiff` (no hay Action) |
| `scripts/generar-tipos.ps1` | Regenera los tipos TS compartidos desde el contrato (Windows) | Correr tras cada cambio del contrato; el `.d.ts` se commitea |
| `node/openapi-validator.ts` | Cablea `express-openapi-validator` para enforcar el contrato en runtime | Montar en el `app.ts` del server (línea Express/Vercel) |
| `tests/contrato.test.ts` | Test de contrato Node (Vitest + supertest) | Copiar a `tests/`; añadir script `test:contract` |
| `dotnet/Program.cs` | Minimal API .NET 10 con versionado por URL + OpenAPI nativo | Línea gobierno. Verificar major de `Asp.Versioning.*` |
| `dotnet/exportar-openapi.ps1` | Vuelca `/openapi/v1.json` a archivo para el mismo pipeline de CI | Correr con Kestrel arriba, o usar generación en build |
| `CHANGELOG-API.md` | Changelog de la API + política de deprecación atada a ITIL M-GSI-003 | Copiar a la raíz de la API; llenar `${PROYECTO}` y `${FECHA}` |
