# Estrategia de pruebas — ${PROYECTO}

> Plantilla del documento de estrategia y del informe de pruebas que exige DI-GSI-010
> en la compuerta G5 (F5 Endurecimiento). Rellena los ${PLACEHOLDER}. Un párrafo por
> celda basta en proyectos pequeños; lo innegociable es el registro, no la extensión.

## 1. Alcance y niveles de la pirámide

| Nivel | Herramienta | Qué cubre | Dónde corre | Meta cobertura |
|---|---|---|---|---|
| Unit (base) | Vitest / xUnit / pytest | Lógica pura, componentes cliente aislados | Cada PR | ${COB_UNIT}% líneas |
| Integración/API (medio) | supertest + validador OpenAPI / WebApplicationFactory | Rutas reales, contrato OpenAPI, acceso a datos | Cada PR | rutas críticas |
| E2E (cima) | Playwright | ${N_FLUJOS} flujos críticos de usuario | push a main / nightly | flujos críticos |

Complementos (skills hermanas, fuera del conteo de la pirámide):
- Regresión por baseline (`qa-test-regresion-baseline`) para refactors sin cambio de comportamiento.
- Regresión visual (`qa-visual-puppeteer-scroll-shots`).
- Carga (`qa-pruebas-carga-k6-jmeter`) e informe de rendimiento exigido por DI-GSI-010.
- Accesibilidad automatizada (`qa-auditoria-accesibilidad-automatizada`, NTC 5854 AA).

## 2. Reparto objetivo (heurístico, ajústalo con datos)

Muchos unit, algunos de integración, muy pocos E2E. Referencia orientativa ~70/20/10;
NO es una cuota rígida: lo que importa es que el grueso del costo/tiempo esté en la base.

## 3. Flujos E2E cubiertos (justificar cada uno)

| # | Flujo | Por qué es crítico | Requiere auth OIDC |
|---|---|---|---|
| 1 | ${FLUJO_1} | ${JUSTIFICACION_1} | sí/no |

## 4. Datos de prueba y secretos

- Datos: ${sintéticos ponderados / fixtures}; nunca datos personales reales (Habeas Data).
- Secretos: usuarios de prueba y contraseñas SOLO por variables de entorno / secrets de CI.
- Base de datos: SQL Server efímero en contenedor para integración (línea gobierno).

## 5. Resultado del ciclo (se llena en G5)

- Cobertura obtenida: unit ${X}% / branches ${Y}%. Informe adjunto: `coverage/index.html`.
- E2E: ${P} pasados / ${F} fallidos. Reporte: `playwright-report/`.
- Defectos abiertos: críticos ${C} (debe ser 0 para GO), mayores ${M}, menores ${m}.
- Dictamen QA (`qa-ingeniero`): GO / NO-GO. Los defectos vuelven como misiones de corrección.
