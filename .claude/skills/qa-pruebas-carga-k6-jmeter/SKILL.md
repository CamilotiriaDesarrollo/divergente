---
name: qa-pruebas-carga-k6-jmeter
regimen: universal
description: Diseña y ejecuta pruebas de rendimiento y carga (k6 para el stack Node/Vercel/Next; JMeter para la línea .NET/SQL Server de gobierno) y produce el informe de pruebas de carga exigido por DI-GSI-010. Cárgala en F5 (endurecimiento) cuando el DoD pida "informe de pruebas de carga", al definir o validar SLOs de latencia/throughput, antes de un despliegue con concurrencia esperada, o cuando el checklist normativo liste pruebas de rendimiento como entregable.
---

> **Régimen: universal.** Las referencias a normativa estatal (M-GSI-002, DI-GSI-010, ITIL, GOV.CO, «entidad pública») aplican SOLO en proyectos `institucional`; en un proyecto `divergente` ignóralas y usa la variante de la línea privada (Vercel/Node/Postgres).

# QA — Pruebas de carga y rendimiento (k6 / JMeter)

**Nivel actual:** N0 · **Dominio:** QA y Calidad · **Agente(s):** `qa-ingeniero` (co-implementa con `devops-plataforma` para el entorno y la CI)
**Proyectos fuente:** ninguno — creada desde buenas prácticas (VACÍO del portafolio: DI-GSI-010 exige informes de pruebas de carga como entregable, pero ningún proyecto del portafolio ejerció la práctica ni fijó una herramienta).

> Criterio de ascenso a N1: los 5 bloques completos, con activos copiables de ruta real y gotchas verificados (no genéricos). A N2: ≥1 uso real aceptado por el Dueño. A N3: ≥3 usos exitosos en ≥2 proyectos + checklist propio.

## 1. Propósito

DI-GSI-010 lista el **informe de pruebas de carga** entre los entregables exigibles del ciclo de desarrollo para entidades públicas (se produce en F5 — endurecimiento — y se empaqueta en F7). Ningún proyecto lo ha hecho aún: no hay herramienta elegida, ni plantilla de escenario, ni criterio de aceptación pactado. Esta skill cierra ese vacío con un punto de partida accionable para los dos frentes del portafolio:

- **Línea Node/Vercel** (Next.js 16 / React 19; client/server React+Vite/Express): pruebas con **k6** (scripting en JavaScript, footprint bajo, encaja en CI/CD y falla el pipeline al incumplir un umbral).
- **Línea gobierno** (.NET / SQL Server bajo M-GSI-002): pruebas con **Apache JMeter** (plan `.jmx`, reporte HTML reconocido en entornos estatales, y sampler JDBC para medir contra SQL Server) o k6, según decida el revisor.

El objetivo no es "generar tráfico", sino **verificar un SLO contra un criterio de aceptación escrito** y dejar la evidencia que un auditor estatal pueda leer (el encuadre "auditor estatal" y el informe DI-GSI-010 aplican solo si el proyecto es institucional; en un proyecto divergente basta un informe de resultados de carga simple).

## 2. Procedimiento

> Verificar versiones antes de usar (pueden haber cambiado tras el cutoff): la línea vigente de k6 es **v2.x** (verificado 2026-07 vía `winget`: `GrafanaLabs.k6` 2.1.0; confirma con `k6 version`). La API `options`/`scenarios`/`thresholds` se mantiene estable de v1 a v2 y el dashboard web (`K6_WEB_DASHBOARD`) es GA desde v1.0. Ojo: `--summary-export` quedó deprecado en favor de `handleSummary()`; si tu k6 v2 ya no lo acepta, genera el `summary.json` con `handleSummary()`. JMeter 5.6.x requiere Java 8+ (recomendado 17 LTS).

1. **Fija el SLO ANTES de escribir un solo script.** ¿Qué p95/p99 de latencia? ¿Qué tasa de error máxima? ¿Cuántos usuarios concurrentes / RPS esperados? Si el blueprint no lo define, **es una decisión abierta → la cierra el Dueño** (regla inviolable 2); marca la misión como bloqueada mientras tanto. El informe DI-GSI-010 empieza por este criterio, no por los resultados.

2. **Elige herramienta (matriz).** Línea Node/Vercel → **k6** por defecto (mismo lenguaje que el equipo, gate de CI trivial). Línea .NET/SQL Server → **JMeter** si se necesita JDBC contra SQL Server, protocolos no-HTTP, o el reporte HTML institucional; k6 si es API REST pura. Ambas producen entregables válidos para DI-GSI-010.

3. **Elige entorno — NUNCA producción.** Corre contra staging/preview con **datos representativos** (usa `datos-dataset-sintetico-ponderado`; nada de datos personales reales — Habeas Data). En infra estatal compartida, toda prueba de carga pasa por **gestión de cambios ITIL (M-GSI-003): SDC F-GSI-037, comité del jueves, fuera de jornada, y nunca dentro del congelamiento 15dic–15ene**, porque una prueba puede degradar servicios vecinos.

4. **Sube la escalera de tipos de prueba** (según alcance del blueprint): **smoke** (¿responde bajo carga mínima? gate rápido de CI) → **carga** (concurrencia esperada, meseta sostenida) → **estrés** (subir hasta el punto de quiebre) → **pico** (subida abrupta y repentina) → **resistencia/soak** (carga media por 30–60 min, caza fugas de memoria y degradación).

5. **k6 — escribe, parametriza, ejecuta:** parte de `activos/k6/load-stress-test.js`. Nunca cablees URL ni token: pásalos por `-e BASE_URL=... -e TOKEN=...` y léelos con `__ENV`. Codifica los `thresholds` = SLO del paso 1. Ejecuta con dashboard web y resumen:
   ```powershell
   $env:K6_WEB_DASHBOARD="true"; $env:K6_WEB_DASHBOARD_EXPORT="reporte-carga.html"
   k6 run activos/k6/load-stress-test.js -e BASE_URL=$env:BASE_URL --summary-export=summary.json
   ```
   Instalación en Windows: `winget install GrafanaLabs.k6` o `choco install k6`. **k6 devuelve exit code 99 si se incumple un umbral** → esto es lo que hace de gate en CI.

6. **JMeter — diseña en GUI, ejecuta headless.** Construye/depura el `.jmx` en la GUI, pero **genera la carga siempre en modo no-GUI** (la GUI colapsa bajo carga y falsea resultados). Parte de `activos/jmeter/plan-carga.jmx` (parametrizado con `${__P(...)}`):
   ```powershell
   jmeter -n -t activos/jmeter/plan-carga.jmx -Jhost=staging.example.co -Jusuarios=50 -Jduracion=300 -l resultados.jtl -e -o informe-html
   ```
   `-e -o` genera el dashboard HTML institucional. Requiere `JAVA_HOME` configurado.

7. **Cablea la CI como gate** (co-implementa con `devops-plataforma`). Copia `activos/ci/pruebas-carga.github.yml` a `.github/workflows/`; es portable a GitLab con `activos/ci/pruebas-carga.gitlab-ci.yml` (misma imagen `grafana/k6`). Ejecución **manual o programada fuera de jornada**, no en cada push (costo y tiempo). El smoke es el gate mínimo; la carga completa se publica como artefacto.

8. **Redacta el informe** desde `activos/informe-pruebas-carga-plantilla.md`: criterio de aceptación, entorno, herramienta/método, escenarios, tabla de resultados (p50/p90/p95/p99, tasa de error, throughput, VUs/RPS), veredicto GO/NO-GO y remediación. Los defectos vuelven como **misiones de corrección** a sus constructores y se anotan como `defectos_post_aceptacion` en sus fichas (FABRICA.md F5).

## 3. Activos copiables

Todos en `activos/` de esta skill. Sin secretos: usan placeholders `${VAR}` / `__ENV` / `${__P(...)}`.

| Activo | Qué es | Cuándo copiarlo / qué adaptar |
|---|---|---|
| `activos/k6/smoke-test.js` | Smoke mínimo (2 VUs, 30s) para el gate de CI | Adaptar la ruta probada y los umbrales; casi copiar tal cual |
| `activos/k6/load-stress-test.js` | Prueba de carga/estrés con escenarios (`ramping-vus`, `ramping-arrival-rate`), grupos, checks, métricas custom y `thresholds` | Ajustar `stages`/`target`, `thresholds` = SLO, endpoints y think time |
| `activos/jmeter/plan-carga.jmx` | Plan JMeter HTTP parametrizado por propiedades (`host`, `usuarios`, `rampa`, `duracion`, `ruta`) | Abrir en GUI, añadir samplers/JDBC reales; ejecutar headless con `-J` |
| `activos/ci/pruebas-carga.github.yml` | Workflow GitHub Actions (smoke gate + carga con artefacto HTML) | Copiar a `.github/workflows/`; setear `vars.BASE_URL_STAGING` y `secrets.LOAD_TEST_TOKEN` |
| `activos/ci/pruebas-carga.gitlab-ci.yml` | Equivalente portable para GitLab CI institucional (imagen `grafana/k6`) | Fusionar en `.gitlab-ci.yml`; variables CI/CD protegidas/enmascaradas |
| `activos/run-carga.ps1` | Runner PowerShell para Windows (SO del Dueño): setea env, corre k6, avisa exit 99, abre el HTML | Ajustar defaults de `-BaseUrl`/`-Script` |
| `activos/informe-pruebas-carga-plantilla.md` | Plantilla del entregable alineada a DI-GSI-010 | Rellenar criterio, entorno, resultados y veredicto |

## 4. Gotchas verificados

> N0: son riesgos documentados de la práctica y del stack del Dueño, **sin verificar aún en proyecto propio**. Al primer uso real, confirmar o corregir cada uno y ascender la skill.

1. **Cargar contra Vercel puede disparar el firewall/anti-DDoS y costar dinero real** (sin verificar aún en proyecto propio, N0). Vercel factura invocaciones serverless y ancho de banda, aplica rate-limiting/Attack Challenge, y los **cold starts** distorsionan la latencia. Prueba un entorno dedicado, calienta antes de medir, y confirma que el plan/ToS permite la carga que vas a generar.
2. **La máquina generadora es el cuello de botella** (sin verificar aún, N0). Un portátil Windows con k6 aguanta miles de VUs según CPU/RAM, pero si el cliente se satura, mides tu laptop, no el servidor. JMeter en GUI se cae mucho antes. Vigila CPU/RAM del generador; si se satura, distribuye la carga o usa nube.
3. **Sin think time y con el modelo de carga equivocado, el resultado es ficción** (sin verificar aún, N0). Faltar `sleep()` martillea de forma irreal; y el modelo cerrado (VUs) vs abierto (`constant/ramping-arrival-rate`, RPS fijos) dan números distintos. Para "N peticiones por segundo" usa arrival-rate; para "N usuarios concurrentes" usa VUs.
4. **Datos y caché no representativos falsean todo** (sin verificar aún, N0). BD vacía, CDN fría o sin índices = latencias que no se repetirán en producción. Usa dataset sintético con volumen realista y calienta la caché antes de la meseta de medición.
5. **k6 es protocolo HTTP, no navegador** (sin verificar aún, N0). No mide LCP/render del front (React 19); para métricas de front-end usa Lighthouse/`k6 browser`. No confundas prueba de carga con auditoría de rendimiento de front-end (esa es otra skill).
6. **Umbral sin SLO real = informe decorativo** (sin verificar aún, N0). Un `p(95)<500` inventado no prueba nada ante un auditor. El SLO debe venir del blueprint / decisión cerrada por el Dueño antes de medir.
7. **La carga ensucia la BD y puede tocar datos personales** (sin verificar aún, N0). En la línea SQL Server, cada corrida crea registros reales → usa entorno desechable o teardown, y **jamás datos personales reales** (Habeas Data). En infra estatal compartida, sin SDC ITIL (M-GSI-003) no se corre.

## 5. Criterios de done

- [ ] SLO documentado y **aprobado por el Dueño**: p95/p99 de latencia, tasa de error máxima y concurrencia/RPS objetivo.
- [ ] Prueba ejecutada contra entorno **no productivo** con datos representativos (sin datos personales reales).
- [ ] Tipos de prueba del alcance ejecutados (smoke como mínimo; carga; estrés/pico/soak si el blueprint los pide).
- [ ] `thresholds` (k6) o criterios (JMeter) = SLO; corrida con **exit 0** o incumplimiento documentado con su remediación.
- [ ] Informe generado (k6 dashboard HTML + `summary.json`, o JMeter dashboard `-e -o`) con **p50/p90/p95/p99, tasa de error y throughput**.
- [ ] Informe DI-GSI-010 relleno (solo si el proyecto es institucional): criterio, entorno, método, resultados, veredicto GO/NO-GO y remediación de cada hallazgo.
- [ ] Gate de CI cableado (smoke al menos), portable GitHub→GitLab; ejecución manual/programada fuera de jornada.
- [ ] Línea gobierno: SDC ITIL (M-GSI-003) referenciado si se tocó infra compartida; fuera de congelamiento 15dic–15ene.
- [ ] Defectos abiertos convertidos en misiones de corrección y anotados como `defectos_post_aceptacion`.

## Registro de uso
| Fecha | Proyecto | Tarea | Resultado | Lección |
|---|---|---|---|---|
