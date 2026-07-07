---
name: qa-auditoria-accesibilidad-automatizada
regimen: universal
description: Auditar accesibilidad AA (NTC 5854 / WCAG 2.1) de forma automatizada y generar la evidencia documental que exige DI-GSI-010. Cárgala en F5 Endurecimiento o cuando haya que montar axe-core, Lighthouse CI o pa11y en el pipeline, escribir pruebas a11y de componente/E2E, correr un lector de pantalla (NVDA), o producir el informe de accesibilidad para la compuerta G5. Complementa a ux-accesibilidad-ntc5854-aa (que implementa a mano); esta la audita y evidencia.
---

> **Régimen: universal.** Las referencias a normativa estatal (M-GSI-002, DI-GSI-010, ITIL, GOV.CO, «entidad pública») aplican SOLO en proyectos `institucional`; en un proyecto `divergente` ignóralas y usa la variante de la línea privada (Vercel/Node/Postgres). La accesibilidad AA (WCAG 2.1 / NTC 5854) sigue siendo deseable en ambos regímenes; lo que es institucional es el *informe formal DI-GSI-010*, no el hecho de auditar.

# QA · Auditoría de accesibilidad automatizada

**Nivel actual:** N0 · **Dominio:** qa · **Agente(s):** `qa-ingeniero` (co-revisa `cumplimiento-normativo` el dictamen normativo)
**Proyectos fuente:** ninguno — creada desde buenas prácticas (VACÍO del portafolio)

> Criterio de ascenso a N1: los 5 bloques completos, con activos copiables de ruta real y gotchas verificados (no genéricos). A N2: ≥1 uso real aceptado por el Dueño. A N3: ≥3 usos exitosos en ≥2 proyectos + checklist propio.

## 1. Propósito

El portafolio del Dueño **implementa** accesibilidad AA a mano y con el gate `eslint-plugin-jsx-a11y` (skill `ux-accesibilidad-ntc5854-aa`), pero **nunca la ha auditado ni evidenciado con herramienta**: no hay axe-core, ni Lighthouse CI, ni pruebas con lectores de pantalla que produzcan el **informe de accesibilidad** que DI-GSI-010 exige entregar (solo si el proyecto es institucional). jsx-a11y revisa el JSX en tiempo de lint, pero no ve el DOM renderizado, ni el contraste real sobre fotografías, ni el orden de foco entre páginas, ni lo que anuncia un lector de pantalla.

Esta skill cubre ese vacío: convierte la accesibilidad en un **gate de CI con evidencia archivable**. Se carga en **F5 Endurecimiento** (la fase que "genera los informes exigidos por DI-GSI-010", ver FABRICA.md), o cuando la misión sea montar axe/Lighthouse/pa11y, escribir pruebas a11y, correr NVDA, o redactar el informe para **G5** (compuerta NO-GO duro). Aplica a las dos líneas del stack: Next.js 16/React 19 y client/server React+Vite (Playwright + axe), y .NET/estático (pa11y barriendo URLs).

## 2. Procedimiento

1. **Elige las capas según la línea del proyecto.** Tres capas, de barata a cara:
   - **Componente** (Vitest + axe): regresión rápida en PR. Prioriza componentes con estado (wizard multipaso, modal, filtros con `aria-live`, barra de accesibilidad).
   - **Página/E2E** (Playwright + `@axe-core/playwright`): ve el DOM hidratado y el contraste real. Es la capa principal para la línea Next/Vite.
   - **Barrido de URLs** (`pa11y-ci`): para la línea de gobierno .NET/Razor sin suite Playwright, o para auditar un preview de Vercel ya desplegado.
   La cobertura automatizada tope es ~30–57% de los criterios WCAG → **la capa manual (paso 5) es obligatoria**, no opcional.

2. **Componente:** instala `vitest-axe` (o `jest-axe`), registra el matcher con `vitest.a11y.setup.ts` y escribe pruebas tipo `component.a11y.test.tsx`. Corre en el job unit del CI.

3. **Página/E2E:** integra `axe.playwright.spec.ts` en la suite Playwright. Recorre `RUTAS`, corre axe con etiquetas **`wcag2a`,`wcag2aa`,`wcag21a`,`wcag21aa`** (NTC 5854 es homóloga a WCAG 2.0/2.1; añade `wcag22aa` solo si el contrato lo pide) y escribe un JSON por ruta en `reportes-a11y/`. **Gate:** 0 violaciones `critical`/`serious`; las `moderate`/`minor` se registran y triagean, no bloquean.

4. **Score y reporte:** corre **Lighthouse CI** (`@lhci/cli`, `lighthouserc.json`) con `onlyCategories:["accessibility"]` y assertion `minScore 0.95`. Ojo: la categoría a11y de Lighthouse es un **subconjunto de axe** — sirve como score de tablero y reporte HTML archivable, **no reemplaza** el paso 3. Para .NET/estático usa `pa11y-ci` con `.pa11yci.json` (estándar `WCAG2AA`).

5. **Verificación semi-manual con lector de pantalla y teclado.** Ninguna herramienta automatiza el sentido del contenido, el orden de lectura ni los anuncios en vivo. Sigue `checklist-lector-pantalla-nvda.md` con **NVDA** (gratuito, Windows — el SO del Dueño) sobre las rutas críticas: navegación por Tab, foco visible, sin trampas de foco, skip link, campos que anuncian etiqueta/estado/error, `aria-live`, zoom 200%. Es la evidencia de "pruebas con lectores de pantalla" que pide DI-GSI-010 (solo si el proyecto es institucional).

6. **Cablea el CI.** Copia `a11y.github.yml` a `.github/workflows/a11y.yml` (y su gemelo `a11y.gitlab.yml` a `.gitlab-ci.yml` para el GitLab institucional — la línea de gobierno entrega ahí, F6). El workflow: unit a11y → levanta la app → axe E2E → Lighthouse → **sube `reportes-a11y/` como artefacto**. La portabilidad GitHub↔GitLab la gobierna la skill `devops-cicd-github-gitlab`; aquí solo se añade el job de accesibilidad.

7. **Redacta el informe** con `informe-accesibilidad-plantilla.md`: consolida resultados automatizados (resumen axe + score Lighthouse + pa11y) y semi-manuales (checklist NVDA), lista hallazgos con su criterio WCAG y su misión de corrección, y emite dictamen GO/NO-GO para **G5**. `cumplimiento-normativo` co-revisa (veto normativo: G5 no cierra con ítem vinculante pendiente). Los defectos vuelven como misiones de corrección a su constructor y se anotan como `defectos_post_aceptacion`.

> **Frescura (regla 8 de CLAUDE.md):** axe-core, @lhci/cli, pa11y y vitest-axe se mueven rápido y varias son post-cutoff (ene-2026). **Fija versiones en package.json** y re-verifica claves de config contra la doc vigente antes de usar (nombres de assertion de LHCI, runners de pa11y, matcher de vitest-axe).

## 3. Activos copiables

Todos en `.claude/skills/qa-auditoria-accesibilidad-automatizada/activos/`. Creados desde buenas prácticas (N0), con placeholders `${VAR}` y **sin secretos**.

1. **`axe.playwright.spec.ts`** — auditoría E2E por ruta con `@axe-core/playwright`; escribe JSON de evidencia y falla ante critical/serious. Adaptar `BASE_URL`, `RUTAS` y (si aplica) las etiquetas WCAG.
2. **`vitest.a11y.setup.ts`** + **`component.a11y.test.tsx`** — setup del matcher y prueba a11y de componente React 19. Adaptar el import del componente y la ruta del `setupFiles`.
3. **`lighthouserc.json`** — config de Lighthouse CI con assertion de score de accesibilidad y salida a `reportes-a11y/lighthouse`. Adaptar `${PORT}`, `${START_CMD}` y las URLs.
4. **`.pa11yci.json`** — barrido `pa11y-ci` estándar `WCAG2AA` para la línea .NET/estática o previews Vercel. Adaptar `${BASE_URL}` y la lista de URLs.
5. **`a11y.github.yml`** / **`a11y.gitlab.yml`** — workflow de CI (GitHub y su gemelo portable GitLab) que corre las 3 capas y sube la evidencia como artefacto.
6. **`checklist-lector-pantalla-nvda.md`** — checklist semi-manual NVDA + teclado (Windows) que produce la evidencia de lector de pantalla.
7. **`informe-accesibilidad-plantilla.md`** — informe DI-GSI-010 con tablas de resultados, hallazgos y dictamen G5.

Referencia (no se copia): la skill `ux-accesibilidad-ntc5854-aa` es el lado **implementación** (barra de accesibilidad, ARIA, foco, gate jsx-a11y). Esta la **audita**; no dupliques su contenido.

## 4. Gotchas verificados

Riesgos documentados de la práctica. **Marcados honestamente como sin verificar aún en proyecto propio (N0)** — se confirmarán al primer uso real.

1. **Tratar el score de Lighthouse o axe como "100% accesible" (sin verificar, N0).** Los automatizados detectan ~30–57% de los criterios WCAG (Deque/WebAIM); un score verde NO garantiza AA. Mitigación: el paso 5 (NVDA/teclado) es obligatorio para el dictamen. Este es el error más caro y el que directamente originó el vacío.
2. **axe corre antes de que React 19 hidrate (sin verificar, N0).** Si escaneas en `domcontentloaded` sin esperar la UI cliente, auditas un DOM a medio montar y salen falsos negativos/positivos. Mitigación: `waitForLoadState('networkidle')` + esperar un selector estable antes de `.analyze()`.
3. **`vitest-axe` es un port comunitario que puede romper con la versión de Vitest (sin verificar, N0).** Mitigación: fijar versión; si el import falla, caer a `jest-axe` (API idéntica con los globals de Vitest).
4. **Claves de config de LHCI/pa11y cambian entre versiones (sin verificar, N0).** El nombre de la assertion (`categories:accessibility`), los runners de pa11y o el `preset` pueden variar. Mitigación: regla 8 — re-verificar contra doc vigente y fijar versiones.
5. **Contraste sobre imágenes: axe puede no evaluarlo si el texto va sobre un fondo con `background-image` o gradiente translúcido (sin verificar, N0).** Es justo el patrón glassmorphism del portafolio (ver gotcha 2 de `ux-accesibilidad-ntc5854-aa`). Mitigación: verificar contraste a mano contra la zona más clara del fondo; no confiar solo en axe aquí.
6. **Sandbox de Chromium en CI/GitLab (sin verificar, N0).** Sin `--no-sandbox` el runner suele fallar al lanzar el navegador. Mitigación: ya incluido en los activos; en GitLab usar la imagen oficial `mcr.microsoft.com/playwright`.
7. **NVDA es de Windows y no hay lector "de CI".** El paso 5 no se automatiza en el pipeline; es trabajo humano/agente asistido. Mitigación: dejarlo como checklist versionado adjunto al informe, no fingir que el CI lo cubre.

## 5. Criterios de done

- [ ] axe E2E (Playwright) corre sobre todas las rutas del MVP: **0 violaciones `critical`/`serious`**; las moderadas/menores quedan registradas y triageadas.
- [ ] axe de componente cubre los componentes con estado (wizard, modal, filtros, barra de accesibilidad) y está en verde en el job unit.
- [ ] Lighthouse CI: score `accessibility` **≥ 0.95** en cada ruta; reporte HTML archivado. (pa11y-ci en verde para la línea .NET/estática.)
- [ ] Checklist NVDA + teclado completado por ruta crítica, sin ítems bloqueantes abiertos; versión de NVDA y navegador registradas.
- [ ] CI de accesibilidad activo en `.github/workflows/a11y.yml` (y `.gitlab-ci.yml` si aplica gobierno), subiendo `reportes-a11y/` como artefacto.
- [ ] **Informe de accesibilidad** redactado con la plantilla, con evidencia bruta adjunta y dictamen GO/NO-GO; co-revisado por `cumplimiento-normativo` (sin veto normativo pendiente para G5).
- [ ] Cada hallazgo abierto tiene su misión de corrección asignada al constructor y su re-prueba.
- [ ] Versiones de todas las herramientas fijadas en `package.json` (regla de frescura 8).

## Registro de uso
| Fecha | Proyecto | Tarea | Resultado | Lección |
|---|---|---|---|---|
