---
name: curador-paula
description: Curaduría AUTOMÁTICA del radar de Paula Martín (perfil PAU). Lee data/ofertas_latest.json, filtra las ofertas con PAU en perfiles_match y estado pendiente, aplica los criterios calibrados de Paula (comunicación/periodismo/cultura/investigación social), guarda cada decisión con su razón y entrega solo el resumen final. Activar cuando el usuario diga "curar Paula", "curaduría de Paula", "/curador-paula", o tras un scrape para revisar el perfil PAU.
---

# Skill: curador-paula (modo automático)

Curador automático del perfil **PAU (Paula Martín)**. Decide oferta por oferta
con los criterios de Paula, guarda cada decisión con su razón y presenta SOLO el
resumen final. **NO preguntar oferta por oferta** (mismo criterio que
[[curador-empleos]]: toma su criterio, no revisa uno a uno).

Distinto de `curador-empleos` (que cura CT y DIV): Paula es comunicadora social /
periodista enfocada en cultura, investigación y cambio social. Sus criterios son
propios; ver `user_camilo_perfil_profesional` no aplica aquí — el perfil de Paula
vive en `config/perfiles.json › PAU` y en su entrevista (2026-06-15).

## Criterios de decisión — Perfil PAU

### APROBAR
- **Periodismo**: periodismo de investigación, periodismo de fondo, reportería,
  crónica, medios. Becas/premios/fellowships de periodismo (Consejo de Redacción,
  LatAm JR, etc.). Ej. "CdR/Lab Hilando la memoria: periodismo para investigar".
- **Comunicación estratégica/corporativa**: dirección de comunicación, comunicación
  organizacional, estrategia de comunicación, vocería, contenido (desde la
  estrategia). Ej. "Consultor senior de comunicaciones", "Técnico de Comunicación
  del Programa Ibermuseos".
- **Cultura y patrimonio**: gestión cultural, museografía, museos, bibliotecas,
  literatura, editorial, conservación cultural, convocatorias culturales (becas,
  premios, estímulos de arte/escritura). Ej. "premio de ensayo sobre arte",
  "Clínicas de escrituras creativas de narrativa y poesía".
- **Audiovisual/documental**: cine, documental, cinemateca, videoteca, producción
  audiovisual — desde la dirección creativa/investigación (apoyar a productoras).
- **Investigación social y cambio social**: memoria histórica, derechos humanos,
  procesos colectivos, cosmovisiones, etnografía, comunidades. Su sweet spot.
- **Cooperación internacional** en roles de **comunicación** (no logística).
- **Responsabilidad social** / comunicación para organizaciones con propósito
  cultural (tipo Crepes & Waffles, Servientrega).
- **Mediación, dirección creativa, dirección de arte** — la estrategia/ideación,
  no la ejecución.
- **Modalidad PLUS**: híbrido Bogotá, remoto, part-time/fractional.

### RECHAZAR
- **Diseño gráfico ejecutor**: "diseñador gráfico", "graphic designer", "product
  designer", "design system", "diseñador UX/UI". Paula es dirección de arte /
  comunicación, NO diseño gráfico operativo. (Ojo: "dirección de arte" sí; "diseñador
  gráfico senior" no.)
- **Community management / redes**: community manager, social media manager,
  administración de redes sociales, gestión de redes.
- **Pauta/ADS**: performance marketing, paid media, ads manager, media buyer, SEM/SEO.
- **Ventas/comercial/negociación**: asesor comercial, ventas, account executive,
  business development, "ser la cara" para vender.
- **Marketing de consumo masivo** / agencias de publicidad puro y duro.
- **Roles técnicos**: desarrollo, datos, ingeniería, IT, telecomunicaciones,
  arquitectura de software, data scientist, devops. No es su campo.
- **Operativo**: digitador, auxiliar administrativo, call center, asistente de citas,
  recepción.
- **Presencial puro 8-5** (única línea roja de modalidad).
- **Militancia partidista** (apoyar instituciones públicas como el Senado sí; ser
  defensora de un partido, no).
- **Licitaciones de obra/equipos/interventoría** que matchean por "audio/video"
  o "consultoría" pero no son comunicación/cultura (ej. "alquiler de equipos de
  iluminación", "interventoría técnica") — esas son ruido de SECOP, no Paula.

### AMBIGUOS (aprobar con criterio)
- **Marketing creativo desde la estrategia/contenido** (no ejecución de redes):
  aprobar si el corazón es estrategia/dirección creativa.
- **Eventos**: aprobar si es diseño/ideación estratégica del evento; rechazar si
  es solo logística/producción operativa.
- **Management de influencers**: aprobar "el puente" (curaduría/conexión); rechazar
  si es negociación/ventas.
- Si el objeto es genuinamente ambiguo: `estado=pendiente` con nota
  "[auto-curador-paula] pendiente: revisar manualmente". Máx ~5 por sesión.

## Flujo

1. Leer `data/ofertas_latest.json` (cwd = raíz del proyecto). Parsear campos
   JSON-string (`perfiles_match`, `score_match`) con `json.loads()`.
2. Filtrar `estado == "pendiente"` **con "PAU" en `perfiles_match`**. Listar TODAS
   (título + empresa + score PAU + fuente + tipo + 140 chars de descripción).
3. Decidir cada una con los criterios de arriba. Anotar SIEMPRE la razón:
   `notas += " | [auto-curador-paula] <razón>"`. Solo cambiar el estado de las
   ofertas PAU (no tocar CT/DIV).
4. Guardar `data/ofertas_latest.json` + snapshot `data/ofertas_curated_{timestamp}.json`.
5. Regenerar la landing: `python scripts/export_landing.py`.
6. Presentar resumen: aprobadas (lista completa con título, empresa, score PAU y
   URL — es lo que Paula usa para postular), rechazadas (conteo + patrones),
   pendientes (lista corta).
7. Si Camilo/Paula corrigen una decisión, tratarlo como calibración: actualizar
   esta skill y/o el bloque `match` de PAU en `config/perfiles.json` (keywords,
   `roles_funcion_excluida`) y re-correr `scripts/escribir_perfil_paula.py`.

## Notas técnicas

- Aplicar decisiones por lote en UN script Python (no un subprocess por oferta).
- Verificar con asserts (total esperado + 2-3 anclas de título) antes de escribir,
  para no aplicar decisiones a la lista equivocada.
- Una oferta puede estar en CT y PAU a la vez (routing multi-persona): al curar
  PAU, **no** cambiar su estado global si también es de CT sin querer. El estado
  es por oferta (compartido); si una oferta sirve a ambos, la decisión debe valer
  para ambos. En la práctica el solape CT∩PAU es bajo; ante duda, dejar pendiente.
- Patrones de ruido que se repiten (diseño gráfico, licitaciones SECOP de
  audio/video) → bajarlos al `match` de PAU (`roles_funcion_excluida` /
  `keywords_negativas`) para que el score ya llegue calibrado al próximo scrape.
- La landing muestra aprobadas y pendientes; las rechazadas quedan en el JSON como
  histórico para no re-evaluarlas.
