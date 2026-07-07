# Política de curaduría de oportunidades SECOP / convocatorias culturales (perfil PJ)

> Extracto literal de la política calibrada por el Dueño (2026-06-10) en
> `Scraper-Empleos/.claude/skills/curador-empleos/SKILL.md` (secciones "Perfil DIV",
> "SECOP — política" y "Convocatorias culturales"). Reutilizable como plantilla de
> criterios para cualquier pipeline de detección de oportunidades B2B en contratación
> pública. Adaptar la lista APROBAR/RECHAZAR al portafolio de servicios del cliente.

## Perfil persona jurídica (firma consultora) — convocatorias/contratos

**APROBAR** (objeto alineado con servicios de la firma):
- Plataformas digitales, sistemas de información (diseño, evaluación, estrategia).
- Analítica/big data/IA como servicio; gobierno de datos institucional.
- SIG / sistemas de información geográfica / catastro.
- Estrategia de innovación, comunicación, UX/wayfinding, diseño editorial.
- Cultura + tecnología (ej. software de automatización para Secretaría de Cultura).
- Capacitación en IA/datos; consultoría para ONG/cooperación (STTA).
- Fortalecimiento de observatorios.

**RECHAZAR:**
- Obras civiles, infraestructura física, acueductos, estudios arquitectónicos, BIM.
- Interventorías (línea especializada que la firma no ejerce).
- Jurídico puro, zootecnia, salud, laboratorios, aforos.
- Compra/alquiler de hardware, dotación, reventa de licencias, soporte de infra.
- Operación/soporte de plataformas a gran escala (trabajo de MSP, no consultoría).
- Pauta/divulgación en medios, plan de medios (central de medios).
- Logística/eventos, suministro/administración de personal (staffing).
- Servicios profesionales INDIVIDUALES (un formador, un director de grupo): es
  contratación de una persona, no de la firma.
- Empleos full-time: un empleo no es un contrato B2B.

## SECOP — política de riesgo (calibrado 2026-06-10): "más selectivo"

Los contratos SECOP son decisiones de mucho dinero → los revisa el Dueño en persona.
**Auto-aprobar SOLO lo nuclear de la firma:** consultoría en datos, sistemas de
información, evaluación/medición (ej. "medición de actividades CTI/ACTI",
"evaluación integral del Sistema de Información X"). **El resto de SECOP → dejar
PENDIENTE** (no rechazar salvo que sea claramente obras/interventoría/hardware),
para revisión humana.

## Convocatorias culturales (Programa Distrital de Estímulos / IDARTES)

Becas/premios de creación artística (música, danza, teatro, artes plásticas).
Decisión del Dueño (2026-06-10): **mantenerlas TODAS** (no rechazar) — se revisan
como oportunidades culturales. Dejar en `pendiente`. NO penalizarlas en el matcher.

## Ambiguos

Si el objeto del contrato está cortado o es genuinamente ambiguo: dejar
`estado=pendiente` con nota "[auto-curador] pendiente: revisar manualmente".
