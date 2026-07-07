---
name: gob-contratacion-publica-secop
regimen: divergente
description: Conocimiento operativo del ecosistema de contratación pública colombiana (SECOP II vía API Socrata de datos.gov.co, convocatorias de estímulos SINAC/CultuRed/SCRD) para detectar oportunidades B2B. Cargar cuando se hable de SECOP, Colombia Compra Eficiente, datos.gov.co, procesos de contratación estatal, licitaciones, convocatorias culturales (Mincultura, IDARTES, SCRD, Programa Distrital de Estímulos), RUP o modalidad PSP.
---

# Contratación pública colombiana (SECOP II y convocatorias)

**Nivel actual:** N2 · **Dominio:** Gobierno y Normativa (gob) · **Agente(s):** analista-negocio
**Proyectos fuente:** Scraper-Empleos (`C:\Users\camil\Desktop\IA Raiz Proyectos\002 Desarrollos\Scraper-Empleos`)

> Criterio de ascenso a N1: los 5 bloques completos, con activos copiables de ruta real y gotchas verificados (no genéricos). A N2: ≥1 uso real aceptado por el Dueño. A N3: ≥3 usos exitosos en ≥2 proyectos + checklist propio.

## 1. Propósito

Detectar y filtrar oportunidades de negocio B2B en la contratación pública colombiana: procesos abiertos de SECOP II (consulta programática, no scraping del portal) y convocatorias de estímulos del sector cultura (nacional y Bogotá). Resuelve tres problemas concretos, todos ya ejecutados en Scraper-Empleos:

1. **Consultar SECOP II sin fricción:** la API Socrata de datos.gov.co evita Playwright/anti-bot; un run trae ~230 procesos en ~32s (evidencia: `docs/REPORTE_SCRAPING_2026-06-10.md` del proyecto fuente).
2. **Separar señal de ruido:** el grueso de SECOP son contratos PSP administrativos de bajo monto y servicios operativos (vigilancia, aseo, seguros) — se filtran con exclusiones quirúrgicas y piso de valor.
3. **Cubrir el circuito cultural completo:** SINAC (Mincultura, nacional) + CultuRed (Bogotá: IDARTES/SCRD/FUGA/OFB en un solo portal) + Invitaciones SCRD (contrataciones culturales que NO son estímulos).

Se carga cuando un proyecto necesita: monitorear licitaciones, construir un radar de oportunidades públicas, integrar datos de contratación estatal, o entender el vocabulario del sector (PSP, RUP, PN/PJ).

## 2. Procedimiento

### Paso 1 — Elegir el dataset correcto de datos.gov.co

- **Procesos ABIERTOS (buscar oportunidades):** resource `p6dx-8zbt` → `https://www.datos.gov.co/resource/p6dx-8zbt.json` ("SECOP II - Procesos de Contratación", validado mayo 2026).
- **Contratos YA FIRMADOS (análisis histórico/mercado):** resource `jbjy-vk9h` ("Contratos Electrónicos"). **Nunca sirve para detectar oportunidades** — llega tarde por definición.
- Criterio de decisión: ¿quieres ofertar? → `p6dx-8zbt`. ¿Quieres estudiar quién ganó qué? → `jbjy-vk9h`.

### Paso 2 — Consultar con SoQL (sin API key, HTTP puro)

Patrón real de `activos/secop_ii.py` (método `_consultar_api`):

```python
where_clauses = [
    f"upper(descripci_n_del_procedimiento) like upper('%{keyword}%')",
    f"fecha_de_publicacion_del >= '{fecha_desde}T00:00:00.000'",
]
params = {
    "$limit": 100,                                   # límite POR keyword
    "$where": " AND ".join(where_clauses),
    "$order": "fecha_de_publicacion_del DESC",
}
```

- Los nombres de campo Socrata están mutilados: `descripci_n_del_procedimiento` (con `_` donde iba la ó), `fecha_de_publicacion_del` (truncado). Usar exactamente esos.
- Iterar una consulta por keyword y deduplicar por URL del proceso (dict `url → oferta`). Ventana temporal por defecto: 14 días retroactivos (los procesos rotan lento; 2 corridas/semana bastan).
- Campos útiles del dataset: `entidad`, `ciudad_entidad`, `departamento_entidad`, `nombre_del_procedimiento`, `descripci_n_del_procedimiento`, `fecha_de_recepcion_de` (deadline), `precio_base`, `modalidad_de_contratacion`, `estado_resumen`, `estado_de_apertura_del_proceso`, `tipo_de_contrato`, `urlproceso`.

### Paso 3 — Filtrar procesos realmente abiertos

Un proceso interesa si `estado_resumen` contiene alguno de: `presentación de oferta`, `publicado`, `convocado`, `borrador`, `recepción de ofertas` (con y sin tildes), **o** `estado_de_apertura_del_proceso == "abierto"`. Además: descartar si `fecha_de_recepcion_de` (deadline) ya pasó.

### Paso 4 — Filtros de calidad (calibrados contra ruido real)

1. **Piso de valor:** descartar solo si `precio_base` es parseable **y** `0 < valor < 10.000.000 COP` (umbral del PLAN: proyecto puntual ≥ 10M). Un proceso **sin** `precio_base` NO se descarta por monto — muchas convocatorias válidas no lo publican.
2. **Exclusiones quirúrgicas** sobre el objeto normalizado (minúsculas sin tildes vía `unicodedata`): solo objetos inequívocamente operativos — `apoyo a la gestion administrativa`, `servicios generales`, `vigilancia`, `aseo y cafeteria`, `poliza`/`seguros`/`corretaje de seguros`, `conductor`, `mensajeria`, `jardineria`, `fumigacion`, `combustible`, `transporte escolar`, `alimentacion escolar`, `operador logistico`. Lista completa en `activos/secop_ii.py` (`EXCLUSIONES_OBJETO`).
3. **NO excluir términos ambiguos** como "mantenimiento" o "suministro": pueden ser de software/licencias (decisión documentada en comentario del código).

### Paso 5 — Convocatorias culturales (3 portales, 3 scrapers)

| Portal | Cubre | Método | Activo |
|---|---|---|---|
| SINAC `sistemaconvocatorias.mincultura.gov.co` | Estímulos nacionales Mincultura (>$175.000M COP en 2026) | Playwright, SPA; listado directo vía URL con querystring `?estado=1&...` | `activos/sinac.py` |
| CultuRed `cultured.gov.co` | Programa Distrital de Estímulos Bogotá: IDARTES + SCRD + FUGA + OFB **con un solo scraper** | Playwright, SPA React; listado en `/todo/convocatorias-abiertas`, detalle en `/detalle/convocatorias/{id}` | `activos/cultured.py` |
| Invitaciones SCRD `invitaciones.scrd.gov.co` | INVITACIONES culturales (contrataciones, digitalización, circulación) — complementa a CultuRed, que solo trae estímulos | Playwright; cards en `/dashboard`, detalle en `/verInvitacion/{id}` | `activos/invitaciones_scrd.py` |

Criterio: si el objetivo es Bogotá-cultura, CultuRed + Invitaciones SCRD; si es nacional, añadir SINAC. No scrapear IDARTES/SCRD/FUGA/OFB por separado: CultuRed ya los consolida.

### Paso 6 — Curaduría con política de riesgo

Regla del Dueño (calibrada 2026-06-10): **los contratos SECOP son decisiones de mucho dinero → nunca se auto-aprueban en bloque.** Auto-aprobar SOLO lo nuclear del portafolio (consultoría en datos, sistemas de información, evaluación/medición); el resto queda `pendiente` para revisión humana (no rechazar salvo obras/interventoría/hardware evidentes). Convocatorias culturales: mantenerlas todas en `pendiente`. Plantilla completa: `activos/politica-curaduria-secop.md`.

### Glosario operativo (verificado en `CONTEXTO_COMPLETO.md` del proyecto fuente)

- **SECOP II:** Sistema Electrónico de Contratación Pública de Colombia. Fuente #1 para persona jurídica.
- **PSP:** Prestación de Servicios Profesionales — modalidad de contrato muy común en el sector público colombiano; individual, genera la mayor parte del ruido de bajo monto.
- **PN / PJ:** Persona Natural / Persona Jurídica. Un servicio profesional individual (un formador, un director de grupo) es contratación de una PN, no de la firma.
- **RUP:** Registro Único de Proponentes — se tramita en Cámara de Comercio; requisito para que una PJ oferte en SECOP II (en el proyecto fuente figura como acción previa: "Inscribir Divergente AMC en SECOP II (tramitar RUP en Cámara de Comercio)").
- **STTA:** Short-Term Technical Assistance (consultorías cortas internacionales).

## 3. Activos copiables

Todos en `activos/` de esta skill, copiados del proyecto fuente (verificados, <13KB c/u):

| Activo | Qué es | Cuándo copiarlo | Qué adaptar |
|---|---|---|---|
| `activos/secop_ii.py` | Scraper SECOP II vía API Socrata: SoQL, estados válidos, exclusiones, piso de valor, parseo de `urlproceso` | Cualquier radar de licitaciones o integración con datos.gov.co | `KEYWORDS_OBJETO` al nicho del cliente; `VALOR_MINIMO_DEFAULT`; la clase base `BaseScraper`/dataclass `Oferta` (importa de `scrapers.base` del proyecto original) |
| `activos/sinac.py` | Scraper SINAC Mincultura (Playwright): URL directa con filtros, parser de fechas en español | Monitoreo de estímulos culturales nacionales | Depende de `BasePlaywrightScraper`; reutilizar `_parse_fecha_es` y `JS_CARDS` tal cual |
| `activos/cultured.py` | Scraper CultuRed Bogotá (Playwright): un solo scraper para IDARTES/SCRD/FUGA/OFB | Monitoreo de estímulos culturales de Bogotá | Idem; ojo a la normalización del guion U+2011 (ver gotchas) |
| `activos/invitaciones_scrd.py` | Scraper de invitaciones culturales SCRD (no-estímulos) | Cuando se necesitan contrataciones culturales además de becas/premios | Idem base Playwright |
| `activos/politica-curaduria-secop.md` | Política de curaduría calibrada por el Dueño: aprobar/rechazar/pendiente por tipo de objeto contractual | Cualquier pipeline con auto-curaduría de oportunidades públicas | Lista APROBAR/RECHAZAR al portafolio de la firma cliente |

Origen: `C:\Users\camil\Desktop\IA Raiz Proyectos\002 Desarrollos\Scraper-Empleos\scrapers\sitios\{secop_ii,sinac,cultured,invitaciones_scrd}.py` y `...\Scraper-Empleos\.claude\skills\curador-empleos\SKILL.md`.

## 4. Gotchas verificados

1. **Dataset equivocado: `jbjy-vk9h` NO son procesos abiertos.** El proyecto arrancó apuntando a `jbjy-vk9h` (el docstring de `secop_ii.py` aún lo cita como endpoint) y se corrigió a `p6dx-8zbt` con el comentario: `# Resource ID: p6dx-8zbt (NO jbjy-vk9h, ése es "Contratos Electrónicos" = ya firmados)`. Con el dataset viejo el radar "funciona" pero solo muestra contratos ya adjudicados. Evidencia: `Scraper-Empleos/scrapers/sitios/secop_ii.py` líneas 5 y 41-43.
2. **`urlproceso` es un dict, no un string.** Socrata lo devuelve como `{'url': '...'}`; parsear con `isinstance(url_field, dict)` o el linkeo falla silenciosamente. Evidencia: `_parse_record` en `secop_ii.py`.
3. **Descartar por monto solo con `precio_base` parseable.** Primera versión del filtro descartaba procesos sin precio y perdía convocatorias válidas; la regla final es: piso de 10M COP **solo si** el valor parsea y es >0. Evidencia: comentarios `VALOR_MINIMO_DEFAULT` y bloque de parseo en `secop_ii.py`.
4. **No excluir "mantenimiento" ni "suministro".** Son ambiguos (mantenimiento de software, suministro de licencias); la lista de exclusión se limita a objetos inequívocamente operativos y se normaliza sin tildes porque se compara contra título normalizado. Evidencia: comentario sobre `EXCLUSIONES_OBJETO` en `secop_ii.py`.
5. **503 intermitente de datos.gov.co.** Ocurrió con la keyword "innovación"; no es fallo propio — capturar la excepción por keyword y continuar con las demás (el `try/except` del loop en `scrapear()`). Evidencia: `docs/REPORTE_SCRAPING_2026-06-10.md` §5 y §Monitoreo ("SECOP: 503 ocasional de datos.gov.co — no es nuestro fallo, reintentar").
6. **CultuRed usa guion no-rompible U+2011 en las fechas** ("2026‑07‑03"): un regex con `-` normal no matchea. Normalizar antes de parsear: `texto.replace("‑", "-").replace("‐", "-")`. Evidencia: docstring y `_parse_card` de `cultured.py`.
7. **El SICON de la SCRD murió:** `sicon.scrd.gov.co` solo muestra un aviso de migración desde 2026. Todo el sector cultura de Bogotá está en CultuRed — no construir scrapers contra SICON ni contra los portales individuales de IDARTES/FUGA/OFB. Evidencia: docstring de `cultured.py`.
8. **SINAC publica fechas en español coloquial** ("16 junio del 2026 11:59 p. m."): requiere parser propio con tabla de meses y tolerancia a "de/del" (`_parse_fecha_es` en `sinac.py`). Un `datetime.strptime` estándar no sirve.
9. **Cards de SPA sin selector estable:** tanto CultuRed como SINAC identifican el card individual buscando el ancestro/nodo cuyo texto contiene exactamente UNA vez "Fecha de cierre" (los wrappers contienen todas). Patrón JS reutilizable en `JS_TEXTO_CARD` (cultured) y `JS_CARDS` (sinac).
10. **Nunca auto-aprobar contratos de alto monto.** Calibración del Dueño 2026-06-10 tras revisar la primera curaduría automática: auto-aprobar solo lo nuclear del portafolio, el resto `pendiente`. Evidencia: `Scraper-Empleos/.claude/skills/curador-empleos/SKILL.md` §"SECOP — política de Camilo".

## 5. Criterios de done

- [ ] La consulta usa `p6dx-8zbt` (procesos) y NO `jbjy-vk9h` (contratos firmados) — verificable en la URL del código.
- [ ] El `$where` filtra por `descripci_n_del_procedimiento` (nombre mutilado exacto) y por `fecha_de_publicacion_del` con timestamp completo (`T00:00:00.000`).
- [ ] Solo pasan procesos con estado abierto (lista `ESTADOS_RESUMEN_VALIDOS` o `estado_de_apertura_del_proceso == "abierto"`) y deadline futuro.
- [ ] Ningún proceso sin `precio_base` fue descartado por monto; ninguno con valor parseable < 10M COP pasó.
- [ ] Las exclusiones de objeto están normalizadas (sin tildes) y no incluyen términos ambiguos (mantenimiento/suministro).
- [ ] Resultados deduplicados por URL de proceso; corrida de prueba devuelve >0 ofertas con URL, entidad y deadline poblados (test manual: `python scrapers/sitios/secop_ii.py`).
- [ ] Si hay curaduría automática: ningún contrato de alto monto quedó auto-aprobado; los dudosos quedaron en `pendiente` con nota.
- [ ] Si se cubren convocatorias culturales: CultuRed + SINAC responden (>0 cards); si un scraper Playwright baja a 0 dos runs seguidos, se revisa el DOM antes de dar por hecho que no hay convocatorias.

## Registro de uso

| Fecha | Proyecto | Tarea | Resultado | Lección |
|---|---|---|---|---|
| histórico | Scraper-Empleos | uso original (fuente de esta skill) | ok | - |
