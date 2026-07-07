# Plan de medición — ${NOMBRE_PLATAFORMA}

> Plantilla base. Se aprueba con el Dueño (o el enlace de la entidad) ANTES de instrumentar.
> Regla de oro: no se mide un evento que no responda a una pregunta de negocio de esta tabla.

## 0. Contexto
- **Plataforma:** ${NOMBRE_PLATAFORMA}
- **Línea:** ${privada Next.js/Vercel | gobierno .NET/SQL Server}
- **Obligación de reporte:** ${p. ej. informe de apropiación DI-GSI-010 / ninguna}
- **Herramienta elegida:** ${GA4 | Matomo self-hosted | eventos server-side a SQL Server}
- **Responsable del dato:** ${rol} · **Revisión habeas data:** ${seguridad-appsec / cumplimiento-normativo}

## 1. North Star Metric (una sola)
La métrica que mejor representa el valor entregado al usuario. Ejemplo (portal cultural):
> **Consultas útiles por usuario activo mensual** = eventos `busqueda_resultado_abierto` / MAU.

**North Star de ${NOMBRE_PLATAFORMA}:** ${definición} · **Meta trimestre:** ${valor}

## 2. Árbol de KPIs — atado a la cadena de valor pública (DNP)
El vocabulario de métricas para entidad pública es fijo: **producto → resultado → impacto**
(el mismo de `negocio-especificacion-modular-plataformas`). No inventar KPIs "de startup" para el Estado.

| Nivel cadena de valor | Pregunta de negocio | KPI | Evento(s) fuente | Fórmula | Meta |
|---|---|---|---|---|---|
| Producto (lo entregado) | ¿La usan? | Usuarios activos (DAU/WAU/MAU) | `session_start` | usuarios únicos por ventana | ${meta} |
| Producto | ¿Publicamos/servimos? | Nº de fichas/servicios consultados | `ficha_vista` | conteo | ${meta} |
| Resultado (cambio en el usuario) | ¿Se activan? | Tasa de activación | `registro_completado` / `registro_iniciado` | % | ${meta} |
| Resultado | ¿Vuelven? | Retención D7 / M1 | cohortes de `session_start` | % que regresa | ${meta} |
| Resultado | ¿Completan el flujo? | Conversión del embudo clave | eventos del embudo (§3) | último/primero | ${meta} |
| Impacto (cambio en el entorno) | ¿Hay apropiación territorial? | Cobertura por departamento | `session_start` + región | Nº deptos con uso | ${meta} |

> AARRR / embudo pirata como guía de agrupación (Adquisición, Activación, Retención, Referencia, Ingreso),
> pero renombrado a producto/resultado/impacto para el reporte oficial.

## 3. Embudo(s) clave
Define el flujo que más importa al negocio y sus pasos ordenados. Ejemplo:
1. `landing_vista` → 2. `busqueda_realizada` → 3. `resultado_abierto` → 4. `contacto_iniciado`
Métrica del embudo: conversión paso a paso + drop-off por paso.

## 4. Segmentaciones mínimas
Región (departamento), capa de acceso (`público`/`registrado`/`interno`), dispositivo, canal de entrada.
**Nunca** segmentar por dato personal directo (cédula, correo, nombre).

## 5. Cadencia de reporte
| Reporte | Frecuencia | Audiencia | Formato |
|---|---|---|---|
| Tablero en vivo | continuo | equipo | dashboard de la herramienta |
| Informe de apropiación | mensual | entidad / Dueño | `informe-apropiacion.md` |
| Revisión de metas | por compuerta/trimestre | Dueño | retro |
