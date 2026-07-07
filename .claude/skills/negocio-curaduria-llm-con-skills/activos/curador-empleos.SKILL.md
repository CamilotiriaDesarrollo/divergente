---
name: curador-empleos
description: Curaduría AUTOMÁTICA de ofertas laborales y convocatorias scrapeadas. Lee data/ofertas_latest.json, aplica los criterios calibrados de Camilo (aprobar/rechazar con razón en notas), guarda decisiones y entrega solo el resumen final. Activar cuando el usuario diga "curar ofertas", "revisar ofertas", "/curador-empleos", o tras ejecutar main.py.
---

# Skill: curador-empleos (modo automático)

Curador automático. El agente decide oferta por oferta aplicando los criterios
calibrados de Camilo, guarda cada decisión con su razón y presenta SOLO el
resumen final. **NO preguntar oferta por oferta** (calibrado 2026-06-09:
"no vamos a revisar uno a uno, la idea es que tome tu criterio").

## Criterios de decisión

### Perfil CT (Camilo persona natural) — para tipo_oferta=empleo/contractor

**APROBAR:**
- Automatizaciones con IA / no-code / low-code / integraciones (Zapier, Make,
  n8n, APIs, vibe coding). Su sweet spot. Ej. aprobó "AI Automations Specialist"
  (The Business of Dance) y "AI Automation Architect & Ops Director".
- Configuración de agentes IA (prompts, tools, knowledge bases, flujos
  conversacionales) — aprobó "AI Voice Agent Engineer" AUNQUE pedía JS/Node:
  si el corazón del rol es configurar agentes, el stack listado no descarta.
- Dirección/consultoría: head of AI, gestor de proyectos/producto, consultor
  técnico de clientes, transformación digital, GovTech, monitoreo de medios.
- Cultura, educación, creativo, media/streaming, GIS/geoportales/catastro.
- Monitoreo & Evaluación / Impact & Evaluation (usan datos/analítica; suelen ser
  educación/cultura/media). Calibrado 2026-06-10: aprobar como regla.
- Part-time / freelance / fractional = PLUS (compatible con dirigir Divergente).

**RECHAZAR:**
- Implementador hands-on: data scientist, ML/data engineer, full-stack,
  backend/frontend, DevOps, cloud engineer ("no soy experto en código").
- **Función ajena al perfil** (calibrado 2026-06-10, ya penalizado en matcher.py
  `ROLES_FUNCION_NO_CT` / `ROLES_EXEC_GENERICO_CT` — el matcher sobre-puntuaba
  liderazgo de ONG por "Director + impacto + remoto"):
  - Recaudación / development / philanthropy / individual giving / fund director.
  - Finanzas / controller / CFO / treasurer.
  - Ventas / marketing / growth / brand / SEO / inside sales / account executive.
  - COO / CEO / Director Ejecutivo / Managing Director GENÉRICO (sin núcleo de
    datos, producto, IA o cultura). Si el ejecutivo es de una org data/product/
    cultura y la descripción lo respalda, sí pasa (penalty suave, rescatable).
- Dominio profundo de stack específico como núcleo del rol: Azure ETL/DWH/T-SQL,
  Data Mesh, Spark/Databricks, SAP, Salesforce, computer vision.
- "Strong/fluent English C1" como requisito duro (tiene intermedio; B2 tolerable
  si el rol es muy bueno).
- Seniority por debajo del suyo (asistente, especialista 2-4 años, BA 1-3 años).
  Incluye analista hands-on aunque sea de su dominio (ej. "BI Analyst" 3-5 años a
  USD ~1.200/mes = rechazar: analítica sí, pero a nivel dirección, no analista).
- Salario bajo para rol de liderazgo (< ~USD 2.500/mes full-time).
- Ojo: rechazó "Líder de GenAI / AI Product Owner" (automatización de VENTAS
  omnicanal) — el foco sales/comercial no le atrae.

### Perfil DIV (Divergente AMC, persona jurídica) — para convocatorias/contratos

**APROBAR** (objeto alineado con servicios Divergente):
- Plataformas digitales, sistemas de información (diseño, evaluación, estrategia).
- Analítica/big data/IA como servicio; gobierno de datos institucional.
- SIG / sistemas de información geográfica / catastro (especialidad nuclear).
- Estrategia de innovación, comunicación, UX/wayfinding, diseño editorial.
- Cultura + tecnología (ej. software de automatización para Secretaría de Cultura).
- Capacitación en IA/datos; consultoría para ONG/cooperación (ReliefWeb STTA).
- Fortalecimiento de observatorios (nicho exacto: dirigió el Observatorio de
  Cultura de Bogotá).

**RECHAZAR:**
- Obras civiles, infraestructura física, acueductos, estudios arquitectónicos, BIM.
- Interventorías (línea especializada que Divergente no ejerce).
- Jurídico puro, zootecnia, salud, laboratorios, aforos.
- Compra/alquiler de hardware, dotación, reventa de licencias, soporte de infra.
- Operación/soporte de plataformas a gran escala (trabajo de MSP, no consultoría).
- Pauta/divulgación en medios, plan de medios (central de medios, no es Divergente).
- Logística/eventos, suministro/administración de personal (staffing).
- Servicios profesionales INDIVIDUALES (un formador, un director de grupo): es
  contratación de una persona, no de la firma.
- Empleos full-time: un empleo no es un contrato B2B (ya filtrado en main.py por
  naturaleza — los `tipo_oferta=empleo/contractor` solo matchean CT, no DIV).

### SECOP — política de Camilo (calibrado 2026-06-10): "más selectivo"
Los contratos SECOP son decisiones de mucho dinero → Camilo los revisa él mismo.
**Auto-aprobar SOLO lo nuclear de Divergente:** consultoría en datos, sistemas de
información, evaluación/medición (ej. "medición de actividades CTI/ACTI",
"evaluación integral del Sistema de Información X"). **El resto de SECOP → dejar
PENDIENTE** (no rechazar salvo que sea claramente obras/interventoría/hardware),
para su revisión en la landing.

### Convocatorias culturales IDARTES / Programa Distrital de Estímulos
Becas/premios de creación artística (música, danza, teatro, artes plásticas).
**Decisión de Camilo (2026-06-10): mantenerlas TODAS** (no rechazar) — las revisa
como oportunidades culturales (conoce el sector, dirigió el Observatorio). Dejar
en `pendiente`. NO penalizarlas en matcher.

### Ambiguos
Si el objeto del contrato está cortado o es genuinamente ambiguo: dejar
`estado=pendiente` con nota "[auto-curador] pendiente: revisar manualmente".
Se revisan en la landing.

## Flujo

1. Leer `data/ofertas_latest.json` (cwd = raíz del proyecto). Parsear campos
   JSON-string (`perfiles_match`, `score_match`) con `json.loads()`.
2. Filtrar `estado == "pendiente"` con `perfiles_match` no vacío. Listar TODAS
   (título + empresa + scores + modalidad + salario + 140 chars de descripción).
3. Decidir cada una con los criterios de arriba. Anotar SIEMPRE la razón:
   `notas += " | [auto-curador] <razón>"`.
4. Guardar `data/ofertas_latest.json` + snapshot
   `data/ofertas_curated_{timestamp}.json`.
5. Regenerar la landing: `python scripts/export_landing.py`.
6. Presentar resumen: aprobadas (lista completa con título, empresa, scores y
   URL — es lo que Camilo usa para postular), rechazadas (conteo + patrones),
   pendientes de revisión (lista corta).
7. Si Camilo corrige una decisión, tratarlo como calibración: actualizar esta
   skill y/o `matcher.py` (keywords, `ROLES_HANDSON_CT`) y la memoria
   (`feedback-calibracion-match-ct`).

## Notas técnicas

- Aplicar decisiones por lote en UN script Python (no un subprocess por oferta).
- Verificar con asserts (total esperado + 2-3 anclas de título) antes de
  escribir, para no aplicar decisiones a la lista equivocada.
- El pre-scoring vive en `matcher.py`; esta skill es la segunda capa de juicio.
  Si un patrón de rechazo se repite, bajarlo a `matcher.py` para que el score
  ya llegue calibrado.
- La landing muestra aprobadas y pendientes (filtro de estado); las rechazadas
  quedan en el JSON/Sheet como histórico para no re-evaluarlas.
