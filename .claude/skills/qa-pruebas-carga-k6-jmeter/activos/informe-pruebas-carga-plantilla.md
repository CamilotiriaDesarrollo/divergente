# Informe de pruebas de carga — ${PROYECTO}

> Entregable exigido por **DI-GSI-010** (ciclo de desarrollo para entidades públicas).
> Producido en F5 (endurecimiento) y empaquetado en F7. Línea .NET/SQL Server: criterios de
> rendimiento según **M-GSI-002**. Ejecución sobre infra estatal compartida: SDC ITIL **M-GSI-003**.

## 1. Identificación
- **Proyecto / componente:** ${PROYECTO} — ${COMPONENTE}
- **Fecha de ejecución:** ${FECHA}
- **Responsable (QA):** qa-ingeniero
- **Herramienta y versión:** ${HERRAMIENTA} (k6 vX.Y / JMeter 5.6.x + Java ${JAVA})
- **SDC ITIL / cambio asociado (si aplica):** ${SDC_F_GSI_037}

## 2. Objetivo y alcance
${DESCRIPCION}. Se prueban los flujos: ${FLUJOS}. Fuera de alcance: ${FUERA_ALCANCE}.

## 3. Criterio de aceptación (SLO aprobado por el Dueño)
| Métrica | Objetivo |
|---|---|
| Latencia p95 | < ${P95_MS} ms |
| Latencia p99 | < ${P99_MS} ms |
| Tasa de error | < ${ERROR_PCT} % |
| Concurrencia / throughput objetivo | ${VUS} VUs / ${RPS} RPS |

## 4. Entorno de prueba
- **Ambiente:** ${AMBIENTE} — **NO productivo**.
- **Datos:** ${DATOS} (sintéticos/representativos; sin datos personales reales — Habeas Data).
- **Generador de carga:** ${GENERADOR} (CPU/RAM; verificado que no fue el cuello de botella).
- **Notas de entorno:** cold start / caché / CDN: ${NOTAS_ENTORNO}.

## 5. Método y escenarios
| Tipo | Modelo | Perfil | Duración |
|---|---|---|---|
| Smoke | VUs | 2 VUs | 30 s |
| Carga | ramping-vus | 0→${VUS}→0 | ${DURACION} |
| Estrés | ramping-arrival-rate | ${RPS_INI}→${RPS_MAX} RPS | ${DURACION_ESTRES} |
| Pico / Soak | ${MODELO} | ${PERFIL} | ${DURACION_OTRO} |

## 6. Resultados
| Escenario | p50 | p90 | p95 | p99 | Tasa error | Throughput (RPS) | VUs máx |
|---|---|---|---|---|---|---|---|
| Carga | ${P50} | ${P90} | ${P95} | ${P99} | ${ERR} | ${RPS_OBS} | ${VUS_OBS} |
| Estrés | | | | | | | (punto de quiebre: ${QUIEBRE}) |

Artefactos: `reporte-carga.html` (k6 dashboard) / `informe-html/` (JMeter), `summary.json`, `resultados.jtl`.

## 7. Análisis
${ANALISIS}. Cuellos de botella detectados: ${CUELLOS}. Comparación contra el criterio (§3): ${COMPARACION}.

## 8. Veredicto
- [ ] **GO** — todos los umbrales del SLO cumplidos.
- [ ] **NO-GO** — incumplimiento(s): ${INCUMPLIMIENTOS}.

## 9. Hallazgos y remediación
| # | Hallazgo | Severidad | Constructor | Misión de corrección | Estado |
|---|---|---|---|---|---|
| 1 | ${HALLAZGO} | ${SEV} | ${CONSTRUCTOR} | ${MISION} | ${ESTADO} |

> Cada defecto vuelve como misión de corrección a su constructor y se anota como
> `defectos_post_aceptacion` en su ficha. Re-prueba requerida antes de cerrar la compuerta G5.

## 10. Anexos
- Scripts usados: ${SCRIPTS}
- Configuración de umbrales (thresholds): ${THRESHOLDS}
- Evidencia gráfica: ${EVIDENCIA}
