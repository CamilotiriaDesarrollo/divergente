---
name: negocio-analitica-producto
regimen: universal
description: Define y opera la analítica de producto de una plataforma — plan de medición, taxonomía de eventos, KPIs de adopción atados a la cadena de valor pública (producto/resultado/impacto), instrumentación en el stack (Next.js/React o eventos server-side en SQL Server) e informe de apropiación. Cárgala cuando el Dueño pida "medir el uso/adopción", definir KPIs o un North Star, montar GA4/Matomo, diseñar un plan de tracking o eventos, o cuando una plataforma pública deba reportar apropiación (DI-GSI-010).
---

# Analítica de producto y medición de adopción

**Nivel actual:** N0 · **Dominio:** negocio (Análisis de Negocio) · **Agente(s):** `analista-negocio` (define el plan y el informe; se apoya en `front-lider`/`front-visualizaciones` para instrumentar y en `front-dashboard-filtros-multinivel` para el tablero; `seguridad-appsec` + `cumplimiento-normativo` revisan el tratamiento de datos)
**Proyectos fuente:** ninguno — creada desde buenas prácticas (VACÍO del portafolio).

> Criterio de ascenso a N1: los 5 bloques completos, con activos copiables de ruta real y gotchas verificados (no genéricos). A N2: ≥1 uso real aceptado por el Dueño. A N3: ≥3 usos exitosos en ≥2 proyectos + checklist propio.

## 1. Propósito
Cerrar un vacío real del portafolio: **ningún portal entregado mide su adopción**. Se publican plataformas —varias de ellas públicas, obligadas a reportar apropiación— sin GA4/Matomo, sin taxonomía de eventos y sin KPIs de uso. El "módulo de analítica" aparece especificado como el último módulo de medición en `negocio-especificacion-modular-plataformas`, pero nunca se operacionaliza.

Esta skill produce el puente entre esa especificación y datos reales: (1) un **plan de medición** con North Star y árbol de KPIs; (2) una **taxonomía de eventos** sin PII; (3) la **instrumentación** en el stack real; (4) el **informe de apropiación** periódico. El foco es de negocio (qué medir y por qué), no solo técnico (dónde poner el script).

Se carga cuando el Dueño pide medir uso/adopción, definir KPIs o North Star, montar analítica web, o cuando una entidad estatal exige evidencia de apropiación de la plataforma.

## 2. Procedimiento
> Advertencia de frescura (N0): Next.js 16 y React 19 son recientes; `@next/third-parties` (para GA4) y las APIs de los proveedores pueden haber cambiado tras el cutoff. Verifica contra la doc vigente antes de instrumentar. GA4 es el estándar actual (Universal Analytics quedó descontinuado en 2023).

1. **Escribe el plan de medición ANTES de instrumentar** (`activos/plan-de-medicion.md`). Define **una** North Star Metric y el árbol de KPIs. Para entidad pública, ata cada KPI a la **cadena de valor DNP (producto → resultado → impacto)** — mismo vocabulario que la especificación modular; no uses jerga de startup (DAU/retención) en el reporte oficial, tradúcela a producto/resultado/impacto. Aprueba el plan con el Dueño/enlace: no se mide un evento que no responda a una pregunta de negocio del plan.

2. **Elige herramienta con criterio documentado** (queda registrado en el plan):
   - **Línea gobierno (.NET/SQL Server, DI-GSI-010):** por defecto **Matomo self-hosted** en infra de la entidad, o **eventos server-side a SQL Server** (`activos/eventos-serverside-sqlserver.sql`). Motivo: GA4 envía el dato a servidores de Google (EE. UU.) = **transferencia internacional de datos personales**, sensible bajo Habeas Data (Ley 1581/2012) y el tratamiento de datos que revisa `cumplimiento-normativo`. La IP es dato personal → siempre anonimizarla.
   - **Línea privada (Next.js/Vercel, no estatal):** GA4 (vía `@next/third-parties/google`), Vercel Analytics o Plausible son aceptables. Igual: consentimiento + sin PII.

   | Criterio | GA4 | Matomo self-hosted | Eventos server-side (SQL Server) |
   |---|---|---|---|
   | Dato sale de la entidad | Sí (Google, EE. UU.) | No | No |
   | Apto línea gobierno / DI-GSI-010 | Riesgoso (habeas data) | Sí | Sí |
   | Costo de operación | Bajo (gratis) | Medio (infra propia) | Bajo (BD existente) |
   | Sampling en tráfico bajo | Sí | No | No |
   | Esfuerzo de montaje | Bajo | Medio | Medio-alto |
   | Cuándo elegirlo | proyecto privado, tráfico alto | portal público con infra | dato ultra-sensible, sin front |

3. **Diseña la taxonomía de eventos** (`activos/tracking-plan.csv`). Convención de nombres: `sustantivo_verbo` en minúscula y snake_case (`resultado_abierto`, `registro_completado`). Cada evento declara propiedades permitidas, capa de acceso (`público`/`registrado`/`interno`, igual que en las historias de usuario), el KPI que alimenta y `contiene_pii = no`. El allowlist de propiedades del código debe quedar sincronizado con este CSV.

4. **Instrumenta en el stack:**
   - **Next.js 16 / React+Vite:** copia `activos/analytics.ts` (capa fina agnóstica: un solo `track(evento, props)`, gateado por consentimiento, con allowlist de props y `hashText()` para minimizar datos como el término de búsqueda). En Next monta `activos/AnalyticsProvider.tsx` en `app/layout.tsx`: rastrea cambios de ruta del App Router con `usePathname`/`useSearchParams` (la navegación cliente **no** dispara `page_view` sola) y **nunca** envía el querystring crudo.
   - **Línea gobierno sin salida del dato:** registra eventos con `dbo.EventosUso` y agrega con `dbo.vw_ApropiacionMensual` (script SQL versionado, alineado a `datos-sqlserver-convenciones-y-scripts-versionados`).
   - Variables en `activos/.env.analytics.example` (sin secretos; el token de reporting va **solo** backend, sin prefijo `NEXT_PUBLIC_`). La gestión del secreto sigue `seg-gestion-secretos-keyvault`.

5. **Consentimiento y Habeas Data (bloque normativo):** banner de cookies que registra `consent_otorgado`; **no** se dispara ningún evento de analítica antes del consentimiento (ver `grantConsent()`). IP anonimizada, cero PII en propiedades ni en URLs, política de retención declarada. Esto lo revisa `seguridad-appsec` (toca datos personales) y `cumplimiento-normativo`; sin su GO no cierra la compuerta (veto normativo).

6. **Construye el tablero y el informe:** usa el dashboard nativo de la herramienta o uno propio con `front-dashboard-filtros-multinivel`. El entregable de negocio es `activos/informe-apropiacion.md`: informe mensual con North Star, producto/resultado/impacto, embudo y cobertura territorial (departamentos con uso). Para estatal, átalo a la obligación de reporte (DI-GSI-010) y a la cadencia del marco de seguimiento de la entidad.

7. **Cierra el ciclo:** cada KPI tiene meta y responsable; se revisa por compuerta/retro. Las brechas de meta vuelven como recomendaciones accionables en el informe, no como métricas de vanidad.

## 3. Activos copiables
Todos en `activos/` de esta skill (creados desde buenas prácticas; sin ruta de proyecto porque es N0):
- **`plan-de-medicion.md`** — plantilla del plan: North Star + árbol de KPIs atado a la cadena de valor DNP, embudos, segmentaciones y cadencia. **Cópialo primero, siempre.** Adapta dominio, North Star y metas.
- **`tracking-plan.csv`** — diccionario de eventos (11 eventos base con propiedades, capa y KPI). **Adapta** los eventos al flujo real; mantén la columna `contiene_pii` en `no`. Es la fuente de verdad del allowlist del código.
- **`analytics.ts`** — capa de envío agnóstica de proveedor (Matomo/GA4/none) con consentimiento, allowlist de props y hashing. **Adapta** el allowlist al tracking-plan del proyecto.
- **`AnalyticsProvider.tsx`** — montaje para Next.js App Router: script del proveedor + rastreo de rutas + anonimización de URL. **Verifica** la API de `@next/third-parties`/Matomo vigente al copiarlo.
- **`eventos-serverside-sqlserver.sql`** — alternativa server-side para la línea gobierno cuando el dato no puede salir de la entidad: tabla `EventosUso` + vista `vw_ApropiacionMensual`. **Adapta** columnas a la BD real.
- **`.env.analytics.example`** — variables con placeholders `${VAR}`, sin secretos. El token de reporting queda backend-only.
- **`informe-apropiacion.md`** — plantilla del informe mensual de apropiación (producto/resultado/impacto + cobertura territorial). **Adapta** al marco de reporte de la entidad.

## 4. Gotchas verificados
> Todos son riesgos **documentados de la práctica**, aún **sin verificar en proyecto propio (N0)**. El primero que se confirme en un proyecto real pasa a "verificado" y sube la skill hacia N2.

- **GA4 = transferencia internacional de datos personales (N0, sin verificar).** GA4 manda el dato a Google (EE. UU.). Para una plataforma pública colombiana bajo Ley 1581/2012 y DI-GSI-010 es un riesgo de cumplimiento real. Mitigación: Matomo self-hosted o eventos server-side; si igualmente se usa GA4, exigir consentimiento explícito, anonimizar IP y documentar la transferencia. Confirmar el veredicto con `cumplimiento-normativo`.
- **La IP y el querystring filtran PII sin querer (N0, sin verificar).** La IP es dato personal (anonimizarla siempre). Las herramientas capturan la URL completa por defecto, y un `?correo=...` o `?cc=...` termina en el analytics. Mitigación: nunca enviar el query crudo (ver `AnalyticsProvider.tsx`), allowlist de propiedades, y `hashText()` para términos sensibles.
- **App Router no cuenta las navegaciones cliente (N0, sin verificar).** En Next.js con navegación SPA, si no se engancha `usePathname`/eventos de router, solo se registra la primera carga y se subcuentan las vistas. Mitigación: el `RouteTracker` del provider.
- **Métricas de vanidad (N0, sin verificar).** Pageviews y "hits" no son apropiación. Medir tráfico sin activación/retención/cobertura da una foto engañosa a la entidad. Mitigación: North Star + árbol producto/resultado/impacto; el informe reporta embudo y departamentos con uso, no solo visitas.
- **Ad-blockers y proxy institucional subcuentan (N0, sin verificar).** Bloqueadores y proxies de red estatal suelen filtrar scripts de terceros (GA), subestimando el tráfico; la analítica first-party/self-hosted se ve menos afectada. Mitigación: preferir first-party y anotar la limitación en la sección de calidad del dato del informe.
- **Sampling/umbral en tráfico bajo (N0, sin verificar).** El nivel gratuito de GA4 aplica muestreo y umbrales de datos que distorsionan portales de bajo tráfico (típico en un portal público nuevo). Mitigación: para volúmenes bajos, herramienta sin sampling (Matomo/server-side) o lectura con cautela.
- **Medir sin consentimiento invalida el dato y la base legal (N0, sin verificar).** Disparar analítica antes del banner viola el principio de consentimiento previo. Mitigación: `track()` bloquea todo hasta `grantConsent()`; el % de consentimiento se reporta como calidad del dato.

## 5. Criterios de done
- [ ] Existe un **plan de medición aprobado** con **una** North Star y árbol de KPIs atado a **producto/resultado/impacto** (no jerga de startup en el reporte oficial).
- [ ] Taxonomía de eventos documentada (`tracking-plan.csv`): nombres `snake_case`, capa de acceso, KPI asociado y `contiene_pii = no` en todos; el allowlist del código está sincronizado.
- [ ] **Herramienta elegida con decisión documentada** (habeas data / DI-GSI-010 registrado): línea gobierno sin transferencia internacional salvo consentimiento y aval de `cumplimiento-normativo`.
- [ ] **Consentimiento operativo**: ningún evento se dispara antes del banner; IP anonimizada; cero PII en propiedades y URLs (query crudo no se envía). Con **GO de `seguridad-appsec`** (veto normativo si toca datos personales).
- [ ] **Instrumentación verificada en vivo**: los eventos clave aparecen en el debug/red de la herramienta y los cambios de ruta se cuentan.
- [ ] Existe **tablero** y la primera edición del **informe de apropiación** con North Star, producto/resultado/impacto, embudo y cobertura territorial.
- [ ] Cada KPI tiene meta y responsable; la sección de **calidad del dato** declara consentimiento, ad-block/proxy y sampling.

## Registro de uso
| Fecha | Proyecto | Tarea | Resultado | Lección |
|---|---|---|---|---|
