# Informe de apropiación — ${NOMBRE_PLATAFORMA}
**Periodo:** ${AAAA-MM} · **Elaborado por:** analista-negocio · **Fuente de datos:** ${GA4 | Matomo | vw_ApropiacionMensual}

> Este informe responde a la obligación de reportar apropiación de plataformas públicas.
> Cuando el cliente es estatal, atarlo al lineamiento aplicable (DI-GSI-010) y al marco de
> seguimiento de la entidad. El vocabulario es el de la cadena de valor DNP: producto / resultado / impacto.

## 1. Resumen ejecutivo (3-5 líneas)
${Qué pasó este periodo en una lectura. Ej.: "MAU creció X% vs mes anterior; la activación
sigue por debajo de la meta (Y% vs Z%); el uso se concentra en N departamentos."}

## 2. North Star y metas
| Métrica | Valor periodo | Periodo anterior | Δ | Meta | Estado |
|---|---|---|---|---|---|
| North Star (${definición}) | ${v} | ${v} | ${%} | ${meta} | 🟢/🟡/🔴 |

## 3. Producto — ¿la usan?
| KPI | Valor | Δ vs anterior |
|---|---|---|
| Usuarios activos (MAU) | ${v} | ${%} |
| Sesiones | ${v} | ${%} |
| Fichas/servicios consultados | ${v} | ${%} |
| Páginas por sesión | ${v} | ${%} |

## 4. Resultado — ¿se activan y vuelven?
| KPI | Valor | Meta |
|---|---|---|
| Tasa de activación (registro_completado/iniciado) | ${%} | ${meta} |
| Retención M1 (cohorte) | ${%} | ${meta} |
| Conversión embudo clave | ${%} | ${meta} |

- **Embudo clave (${nombre}):** paso1 ${v} → paso2 ${v} → paso3 ${v}. Mayor caída en: ${paso}.

## 5. Impacto — ¿apropiación territorial?
| Departamento | Sesiones | % del total |
|---|---|---|
| ${dpto} | ${v} | ${%} |

- Departamentos con uso: ${N} de 33. Brecha territorial: ${observación}.

## 6. Hallazgos y recomendaciones
1. ${Hallazgo accionable} → **Acción propuesta** (dueño/equipo) → **KPI que movería**.

## 7. Notas de calidad del dato
- Consentimiento de analítica: ${% de sesiones con consent_otorgado}. Los no consentidos NO se miden → posible subconteo.
- Bloqueadores/ad-block o proxy institucional pueden subestimar el tráfico (ver gotchas de la skill).
- Umbrales/sampling de la herramienta en tráfico bajo: ${aplica/no aplica}.
