---
name: seg-sast-dast-dependencias
regimen: universal
description: Automatiza las pruebas de seguridad en el pipeline (SAST estático, DAST dinámico y escaneo continuo de dependencias vulnerables con Dependabot/Renovate/npm audit/dotnet vulnerable/pip-audit), en vez de gestionarlas a mano. Cárgala al montar el CI de seguridad en Fase 3 o Fase 5, cuando aparezca una dependencia vulnerable (tipo el caso xlsx), al preparar el ethical hacking exigido por DI-GSI-010, o cuando una compuerta G4/G5 requiera evidencia de SAST/DAST sobre login, roles o datos personales.
---

> **Régimen: universal.** Las referencias a normativa estatal (M-GSI-002, DI-GSI-010, ITIL/M-GSI-003, F-GSI-037, «comité del jueves», GitLab institucional, «recepción estatal», ethical hacking L7) aplican SOLO en proyectos `institucional`; en un proyecto `divergente` ignóralas y usa la variante de la línea privada (GitHub Actions + Vercel + auto-merge controlado por el Dueño). SAST/DAST/escaneo de dependencias es buena práctica de ingeniería en ambos regímenes; lo que se condiciona a `institucional` es la *obligación* normativa, las compuertas con veto y el envoltorio ITIL de las actualizaciones.

# Seguridad automatizada — SAST, DAST y dependencias en el pipeline

**Nivel actual:** N0 · **Dominio:** seg · **Agente(s):** `seguridad-appsec` (dueño), `devops-plataforma` (lo integra en CI/CD), `qa-ingeniero` (lo consume en F5)
**Proyectos fuente:** ninguno — creada desde buenas prácticas (VACÍO del portafolio)

> Criterio de ascenso a N1: los 5 bloques completos, con activos copiables de ruta real y gotchas verificados (no genéricos). A N2: ≥1 uso real aceptado por el Dueño. A N3: ≥3 usos exitosos en ≥2 proyectos + checklist propio.

## 1. Propósito

El marco de la fábrica **exige** desarrollo seguro y OWASP (M-GSI-002 cap. 14, DI-GSI-010, y la skill hermana `seg-desarrollo-seguro-sdl-owasp-gobierno`) **(esa exigencia normativa aplica solo si el proyecto es institucional; en divergente SAST/DAST/deps es buena práctica que el Dueño adopta por calidad, no obligación estatal)**, pero **no existe todavía la práctica de automatizarlo**: no hay SAST/DAST corriendo en CI, ni Dependabot/Renovate, ni `npm audit`/`dotnet list --vulnerable` como gate del pipeline. La evidencia del vacío es concreta: el caso de la librería `xlsx` vulnerable (OWASP A9) **se detectó y remedió a mano**, tarde, no por una alerta automática. Esta skill cierra ese hueco: convierte la exigencia normativa en tres controles automáticos y repetibles —**SAST** (análisis estático del código), **DAST** (análisis dinámico contra la app corriendo) y **escaneo continuo de dependencias**— para las dos líneas del dueño (privada Node/Next en GitHub+Vercel; gobierno .NET/SQL Server en GitLab institucional) y su SO Windows.

Se carga cuando un agente: monta el CI mínimo de seguridad en **F3 (Fundaciones)**; ejecuta el endurecimiento de **F5** (OWASP Top 10 + SAST/DAST que pide DI-GSI-010); encuentra o debe vigilar dependencias vulnerables; prepara el paquete de **ethical hacking** pre-producción (DI-GSI-010 L7); o necesita evidencia de seguridad para cerrar G4/G5.

## 2. Procedimiento

### Paso 1 — Elegir el camino según línea y plataforma
- **Línea privada (GitHub + Vercel):** usa `activos/.github/workflows/security.yml` + `activos/dependabot.yml`. DAST con ZAP baseline contra la **preview de Vercel**.
- **Línea gobierno (GitLab institucional):** usa `activos/.gitlab-ci-security.yml` + `activos/Directory.Build.props` + `activos/renovate.json` (bot self-hosted). **Decisión clave:** ¿el GitLab institucional es **Ultimate**? Si sí, activa las plantillas oficiales `Security/*.gitlab-ci.yml`; si es CE/Premium, usa los jobs manuales (Semgrep + `dotnet list --vulnerable` + gitleaks + ZAP), que son gratis. Pregúntalo a la OTI en F0/F3; no lo asumas.

### Paso 2 — Dependencias: alerta continua + gate en CI
1. Instala el bot: **Dependabot** (nativo GitHub, gratis en privados) o **Renovate** (portable a GitLab). Config semanal, zona `America/Bogota`, etiquetas `dependencias`/`seguridad`.
2. Añade el **gate** que faltó en el caso xlsx: `npm audit --audit-level=high` (client y server por separado), `dotnet list package --vulnerable --include-transitive` (requiere SDK ≥ 8.0.100; **verifica la versión del entorno**), `pip-audit` para Python.
3. Cuando no haya parche (como xlsx): no lo dejes pasar. Fuerza `overrides`/`resolutions` en `package.json`, o **migra la lógica al backend** (patrón ya probado: Excel a ClosedXML/EPPlus en .NET) y documenta la deuda. Esto lo dicta la skill hermana; aquí lo que cambia es que **la alerta llega sola y rompe el build**.

### Paso 3 — SAST (estático) en cada PR
- Portable y sin licencia de pago: **Semgrep** (`semgrep ci --config p/owasp-top-ten` + `p/javascript`/`p/react` o `p/csharp`). Mismo motor en GitHub y GitLab → una sola regla para las dos líneas.
- Profundo en GitHub: **CodeQL** (`security-extended`) para js/ts y python. **OJO licencia:** en repos **privados** requiere GitHub Advanced Security (de pago); si no está contratada, quítalo y confía en Semgrep (ver gotcha).
- .NET: activa los **analizadores del SDK** (reglas `CA3xxx` de seguridad) vía `Directory.Build.props`, y opcionalmente un SAST dedicado.

### Paso 4 — DAST (dinámico) contra la app desplegada
- **OWASP ZAP baseline** contra una URL corriendo (preview Vercel / staging). Afínalo con `activos/zap-rules.tsv` (todo hallazgo silenciado deja motivo escrito y auditable).
- DAST necesita un **objetivo desplegado**: córrelo `schedule`/nightly, no en cada PR. Y recuerda: el DAST automático **no reemplaza** el ethical hacking contractual (DI-GSI-010 L7), lo **alimenta**.

### Paso 5 — Secretos
- **gitleaks** en CI (historia completa, `fetch-depth: 0`) para que no se cuelen credenciales sembradas. Complementa `seg-gestion-secretos-keyvault`; aquí es el candado del pipeline.

### Paso 6 — Windows local antes del push
- Corre `activos/scan-seguridad-local.ps1` (PowerShell) para reproducir el CI en el equipo del dueño y no descubrir el hallazgo hasta la nube. Autodetecta npm/.NET/Python.

### Paso 7 — Atar a normativa y a las compuertas
- **F3/G3:** el CI de seguridad existe desde el día 1 (SAST + deps como mínimo).
- **F5/G5 (NO-GO duro):** informe SAST/DAST + auditoría de dependencias sin críticos abiertos, como pide DI-GSI-010; sin eso la compuerta no cierra (veto de `seguridad-appsec`).
- **Línea gobierno + ITIL (M-GSI-003):** en `main`/producción **NUNCA** auto-merge de Dependabot/Renovate: cada actualización es un **RFC** (SDC F-GSI-037, comité del jueves). El auto-merge se limita a `develop`/devDependencies. Esto ya está codificado en `renovate.json`.

## 3. Activos copiables

Todos en `activos/` de esta skill. Son **plantillas base (N0)**: sin secretos, con placeholders `${VAR}`; las versiones de actions/imágenes deben confirmarse antes de fijarlas.

- **`.github/workflows/security.yml`** — pipeline de seguridad completo para la línea privada: `npm audit` (client+server), `dependency-review` en PRs, Semgrep (SARIF), CodeQL, gitleaks y ZAP baseline programado. Copiar a `.github/workflows/`; **adaptar** la matriz `[client, server]` a la estructura real (Next.js monolito → `["."]`) y la `ZAP_TARGET_URL`.
- **`.gitlab-ci-security.yml`** — equivalente para el GitLab institucional (gobierno). Trae Opción A (plantillas Ultimate, comentadas) y Opción B (jobs manuales gratis: `dotnet --vulnerable`, Semgrep `p/csharp`, gitleaks, ZAP). `include:` o pégalo en el `.gitlab-ci.yml`; **adaptar** versión del SDK y accesibilidad de imágenes desde la red institucional.
- **`dependabot.yml`** — actualización semanal para npm (client/server), pip y github-actions. Va en `.github/dependabot.yml`.
- **`renovate.json`** — alternativa portable (bot self-hosted en GitLab). Incluye la regla ITIL: `main` sin automerge, con etiqueta `requiere-rfc-itil`.
- **`Directory.Build.props`** — activa `NuGetAudit` (paquetes vulnerables como error de build: NU1901-04) y los analizadores `CA3xxx` del SDK. En la **raíz** de la solución .NET; aplica a todos los `.csproj` sin tocarlos.
- **`zap-rules.tsv`** — afinado del DAST (IGNORE/WARN/FAIL con motivo auditable por regla).
- **`scan-seguridad-local.ps1`** — runner local Windows que reproduce el CI (npm/.NET/Python/Semgrep/gitleaks) antes del push.

## 4. Gotchas verificados

Riesgos **documentados de la práctica**, marcados honestamente como **sin verificar aún en proyecto propio (N0)**. Ascenderán a evidencia real al usarse.

- **CodeQL/GHAS cuesta en repos privados (N0, sin verificar).** CodeQL es gratis en repos públicos, pero en privados exige licencia GitHub Advanced Security. Montar el workflow "porque sí" puede fallar o facturar. Mitigación: en la línea privada apóyate en **Semgrep** (gratis, portable) y reserva CodeQL para cuando exista GHAS. Confirmar el estado de la licencia antes de F3.
- **DAST sin app desplegada no encuentra nada (N0, sin verificar).** El patrón "backend durmiente" de la fábrica publica el frontend estático y **no despliega el backend** en demos; un ZAP contra esa preview solo verá cabeceras, no lógica de API. Mitigación: apuntar el DAST a un **staging con backend real** en F5; en demos, limitarse a SAST + deps y decirlo.
- **`dotnet list package --vulnerable` y `NuGetAudit` dependen de la versión del SDK (N0, sin verificar).** El flag `--vulnerable` existe desde .NET Core 3.1, pero la auditoría en *restore* (`NuGetAudit`, avisos NU1901–NU1904) requiere SDK ≥ 8.0.100, y auditar **transitivas** (`NuGetAuditMode=all`) requiere ≥ 8.0.200 (default en .NET 9); en un runner con SDK viejo el gate pasa "en verde" sin auditar nada (falso OK peligroso). Mitigación: fijar la imagen del SDK (≥ 8.0.200, idealmente .NET 9) y validar `dotnet --version` en el job.
- **Auto-merge de bots choca con ITIL en gobierno (N0, sin verificar).** Un Renovate/Dependabot que auto-mergea a producción **viola M-GSI-003** (todo cambio pasa por RFC y comité del jueves). Ya mitigado en `renovate.json` (main sin automerge), pero revísalo en cada proyecto estatal.
- **Los umbrales rompen el build el primer día (N0, sin verificar).** `--audit-level` bajo o `WarningsAsErrors` sobre un repo con deuda preexistente puede dejar todo en rojo y empujar a la gente a saltarse el gate. Mitigación: arrancar en `high`, registrar la deuda como misiones de corrección, y endurecer a `moderate` cuando esté limpio — no al revés.
- **Silenciar hallazgos sin trazabilidad (N0, sin verificar).** Meter `IGNORE` en ZAP o `--audit-level=critical` para "que pase" es el anti-patrón clásico. Mitigación: todo silencio va en `zap-rules.tsv` con motivo escrito; auditable en recepción estatal.
- **Versiones de actions/imágenes se mueven (N0, sin verificar).** Los tags de `github/codeql-action`, `zaproxy/action-baseline`, `semgrep/semgrep`, `gitleaks-action` cambian tras el cutoff del modelo. Mitigación: confirmar la última versión y, en gobierno, **fijar por SHA/digest** (una action mutable es superficie de supply-chain).

## 5. Criterios de done

- [ ] El bot de dependencias (Dependabot o Renovate) está activo con agenda semanal y etiquetas `dependencias`/`seguridad`.
- [ ] El CI **rompe** ante dependencias High/Critical: `npm audit` (client+server), `dotnet list --vulnerable` y/o `pip-audit` según stack; probado con un paquete vulnerable conocido.
- [ ] SAST corre en cada PR (Semgrep como mínimo; CodeQL si hay GHAS) y publica resultados (SARIF a Security / artefacto en GitLab).
- [ ] `Directory.Build.props` con `NuGetAudit` activo en la solución .NET, verificado sobre SDK ≥ 8.0.100.
- [ ] DAST (ZAP baseline) corre contra un objetivo desplegado en F5 con `zap-rules.tsv` afinado; cada silencio tiene motivo escrito.
- [ ] gitleaks en CI con historia completa; una credencial de prueba sembrada es detectada.
- [ ] `scan-seguridad-local.ps1` corre en el Windows del dueño y reproduce el veredicto del CI.
- [ ] En gobierno: ningún auto-merge a `main`; las actualizaciones de producción quedan como RFC (M-GSI-003).
- [ ] Evidencia SAST/DAST + auditoría de dependencias adjunta al acta de G5; sin críticos abiertos (veto de `seguridad-appsec`). El DAST automático se documenta como insumo, no sustituto, del ethical hacking L7 **(el ethical hacking L7 de DI-GSI-010 y el veto de compuerta aplican solo si el proyecto es institucional)**.

## Registro de uso
| Fecha | Proyecto | Tarea | Resultado | Lección |
|---|---|---|---|---|
