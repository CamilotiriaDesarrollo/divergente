#!/usr/bin/env python3
"""Curaduría automática batch de pendientes con match."""
import json, sys
from datetime import datetime

sys.stdout.reconfigure(encoding='utf-8')

DATA = 'data/ofertas_latest.json'
data = json.load(open(DATA, encoding='utf-8'))

pendientes_idx = [
    i for i, o in enumerate(data)
    if o.get('estado') == 'pendiente'
    and o.get('perfiles_match') not in [None, '[]', '']
    and o.get('perfiles_match')
]
print(f"Pendientes con match: {len(pendientes_idx)}")

# Asserts de integridad
titulos_lower = [data[i]['titulo'].lower() for i in pendientes_idx]
assert any('director of data strategy' in t for t in titulos_lower), "Anchor 1 faltante"
assert any('ai operations lead' in t for t in titulos_lower), "Anchor 2 faltante"
assert any('partnerships director' in t for t in titulos_lower), "Anchor 3 faltante"
print("Asserts OK\n")


def match(o, fid, tsub, esub=''):
    if o.get('fuente_id') != fid:
        return False
    if tsub.lower() not in o.get('titulo', '').lower():
        return False
    if esub and esub.lower() not in o.get('empresa_entidad', '').lower():
        return False
    return True


# ── APROBAR ───────────────────────────────────────────────────────────────────
APROBAR = [
    ('F051', 'Cultural Research Specialist', 'STEM Sync',
     'evaluador cultura+IA $80-120/hr contrato flexible remoto = sweet spot CT; CT=68'),
    ('F061', 'Partnerships Director', 'what3words',
     'what3words=empresa GIS/geolocalización; partnerships director en nicho SIG de Camilo; CT=62'),
    ('F062', 'Director of Education', 'Heal Trafficking',
     'dirección educación+engagement ONG impacto; CT=82 $70-85k remoto'),
    ('F067', 'Director of Data Strategy', 'Basta',
     'director datos+educación (first-gen students); CT=74 $130-163k remoto'),
    ('F077', 'Data & Policy Director', 'Idealist',
     'datos+política+director en Idealist; CT=70 remoto'),
    ('F082', 'AI Operations Lead', 'Puente',
     'automatizaciones IA lead ops; CT=74 $2500-3750/mes sweet spot'),
    ('F119', 'Especialista en Coordinación Institucional', 'UNDP',
     'coordinación institucional proyectos educativos+culturales en UNDP; CT=60'),
    ('F004', 'Fellowship Curriculum Lead', 'Climatebase',
     'curriculum/educación en plataforma clima; CT=66 liderazgo formación'),
    ('F076', 'Fellowship Curriculum Lead', 'Climatebase',
     'curriculum/educación en plataforma clima (Remote Impact); CT=62'),
]

# ── PENDIENTES GENUINOS (máx 9, ambiguos reales) ─────────────────────────────
KEEP_PENDIENTE = [
    ('F036', 'Technical AI Instructor', '',
     'pendiente: instructor IA vs engineer hands-on; CT=66 $110-218k; revisar descripción completa'),
    ('F002', 'AI Deployment Strategist', 'Mistral',
     'pendiente: rol muy alineado CT pero "Singapore"; verificar si es remoto global'),
    ('F067', 'Consultant', 'Edgility',
     'pendiente: consultoría social impact CT=68; descripción cortada sin contexto del rol'),
    ('F118', 'Senior ICT/Digital Policy', 'ITU',
     'pendiente: roster consultoría GovTech/política digital para ITU; CT=60'),
    ('F118', 'Roster - ITU-FCDO', 'ITU',
     'pendiente: roster consultoría técnica ITU-FCDO; CT=66'),
    ('F120', 'INCL-Realizar metodología', 'UNDP',
     'pendiente: metodología+análisis+reporte impacto Fondo PTP → posible DIV=64'),
    ('F120', 'Diplomado', 'UNDP',
     'pendiente: servicio formación en formulación proyectos sociales → posible DIV'),
    ('F120', 'SINERGIA', 'UNDP',
     'pendiente: evaluación proyecto SINERGIA+ → posible DIV; revisar objeto'),
    ('F120', 'mercado laboral', 'UNDP',
     'pendiente: análisis exploratorio mercado laboral → posible DIV; revisar objeto'),
    ('F010', 'PEDAGOGÍA', '',
     'pendiente: asesoría pedagógica UNESCO-QUELLAVECO; revisar si objeto califica para DIV'),
    ('F118', 'Conservation Data Advisor - Latin America', 'Nature Conservancy',
     'pendiente: data advisory LATAM en TNC; CT=56; dominio ambiental con componente datos'),
    ('F118', 'IC - Consultoría para Apoyo Técnico en Innovación', 'UNDP',
     'pendiente: consultoría innovación técnica UNDP; DIV=54; descripción incompleta'),
]


def razon_rechazo(o):
    t = o.get('titulo', '').lower()
    e = o.get('empresa_entidad', '').lower()

    checks = [
        (['engineer', 'developer', 'devops', 'coder', 'programmer',
          'développeur', 'desenvolvedor', 'engenheiro'],
         'implementador hands-on (engineer/developer)'),
        (['legal counsel', 'attorney', 'paralegal', 'abogad', 'jurídico', 'deputy legal', 'privacy counsel'],
         'función jurídica'),
        (['director of development', 'development director', 'senior director, development',
          'donor relations', 'philanthrop', 'grant writ', 'funder relations', 'fundrais'],
         'función fundraising/recaudación (no perfil CT/DIV)'),
        (['partner development manager', 'inside sales', 'account executive',
          'corporate partnerships manager', 'vp of sales', 'growth operator',
          'performance marketing', 'business developer'],
         'función ventas/BD'),
        (['seo ', 'brand manager', 'paid media', 'paid social', 'social media manager',
          'copywriter', 'content creator', 'creative partner', 'communications specialist',
          'communications lead', 'climate communications'],
         'función marketing/comunicaciones específica (no datos/cultura)'),
        (['human resource', 'talent acquisition', 'recursos humanos', 'people partner', 'hr '],
         'función RRHH'),
        (['financial reporting', 'tax analyst', 'gl accountant', 'treasury',
          'controller', 'cfo ', 'finance director', 'finance manager',
          'operational risk', 'analista de operaciones'],
         'función finanzas/contabilidad'),
        (['sap ', 'salesforce developer', 'crm developer', 'erp impl', 'analista funcional sap',
          'consultor sap', 'revops manager'],
         'stack SAP/Salesforce/ERP fuera de perfil'),
        (['customer service', 'customer success', 'support specialist', 'care specialist',
          'technical support specialist', 'soporte técnico'],
         'soporte/atención al cliente'),
        (['data entry', 'office assistant', 'virtual assistant', 'field representative',
          'field data collector', 'procurement consultant sadep'],
         'seniority bajo / función administrativa/campo'),
        (['civil engineer', 'revit', 'manufacturing director', 'manufactur', 'zootec',
          'veterinary', 'rehoming', 'fostering services', 'medtronic'],
         'dominio no relevante (manufactura/salud animal/infraestructura)'),
        (['scrum master', 'quality assurance rater', 'qa engineer'],
         'rol técnico QA/Scrum'),
        (['react native', 'java developer', 'php developer', 'ruby developer', 'outsystems'],
         'developer hands-on'),
        (['vice president, corporate partnerships', 'vp, corporate partnerships',
          'strategic partnerships director', 'senior director, development'],
         'función BD/partnerships o fundraising en organización social'),
    ]
    for keywords, label in checks:
        if any(kw in t for kw in keywords):
            return label

    # Seniority bajo por título
    if any(t.startswith(p) for p in ['coordinator', 'assistant ', 'associate,', 'associate ', 'specialist,']):
        return 'seniority bajo (coordinator/assistant/associate)'
    # Empresa off-domain
    if any(k in e for k in ['running', 'barber', 'nearcut', 'lawnstarter', 'anime',
                             'cakes body', 'mixlab', 'supplyhouse']):
        return 'empresa fuera de nicho (B2C / dominio no relevante)'

    return 'función o dominio no alineado con perfil CT/DIV'


aprobadas_list = []
rechazadas_count = 0
pendientes_kept = 0
already_done = set()

for i in pendientes_idx:
    o = data[i]
    fid = o.get('fuente_id', '')

    # F008 IDARTES/CultuRed: política Camilo = no tocar, mantener pendiente
    if fid == 'F008':
        continue

    # Check APROBAR
    aprobado = False
    for af, at, ae, ar in APROBAR:
        if match(o, af, at, ae):
            data[i]['estado'] = 'aprobada'
            data[i]['notas'] = (o.get('notas') or '') + f' | [auto-curador] aprobada: {ar}'
            aprobadas_list.append(data[i])
            aprobado = True
            break
    if aprobado:
        continue

    # Check KEEP PENDIENTE
    kept = False
    for pf, pt, pe, pnota in KEEP_PENDIENTE:
        if match(o, pf, pt, pe):
            if '[auto-curador]' not in (o.get('notas') or ''):
                data[i]['notas'] = (o.get('notas') or '') + f' | [auto-curador] {pnota}'
            pendientes_kept += 1
            kept = True
            break
    if kept:
        continue

    # RECHAZAR
    razon = razon_rechazo(o)
    data[i]['estado'] = 'rechazada'
    data[i]['notas'] = (o.get('notas') or '') + f' | [auto-curador] rechazada: {razon}'
    rechazadas_count += 1

# ── Guardar ───────────────────────────────────────────────────────────────────
with open(DATA, 'w', encoding='utf-8') as f:
    json.dump(data, f, ensure_ascii=False, indent=2)

ts = datetime.now().strftime('%Y%m%d_%H%M%S')
snap = f'data/ofertas_curated_{ts}.json'
with open(snap, 'w', encoding='utf-8') as f:
    json.dump(data, f, ensure_ascii=False, indent=2)

# ── Resumen ───────────────────────────────────────────────────────────────────
f008_count = sum(1 for i in pendientes_idx if data[i].get('fuente_id') == 'F008'
                 and data[i].get('estado') == 'pendiente')

print(f"{'='*60}")
print(f"APROBADAS:   {len(aprobadas_list)}")
print(f"RECHAZADAS:  {rechazadas_count}")
print(f"PENDIENTES conservadas (ambiguos): {pendientes_kept}")
print(f"PENDIENTES no tocadas (F008 IDARTES): {f008_count}")
print(f"Snapshot: {snap}")
print(f"{'='*60}")
print("\n=== APROBADAS (para postular) ===")
for o in aprobadas_list:
    scores = o['score_match'] if isinstance(o['score_match'], dict) else json.loads(o['score_match'])
    ct = scores.get('CT', 0)
    dv = scores.get('DIV', 0)
    sal = o.get('salario', '') or ''
    print(f"  CT={ct} DIV={dv} | {o['titulo'][:65]}")
    print(f"           {o['empresa_entidad'][:40]} | {sal[:30]}")
    print(f"           {o['url_original'][:80]}")
print()
print("=== PENDIENTES para revisión manual ===")
for i in pendientes_idx:
    o = data[i]
    if o.get('estado') == 'pendiente' and '[auto-curador] pendiente' in (o.get('notas') or ''):
        scores = o['score_match'] if isinstance(o['score_match'], dict) else json.loads(o['score_match'])
        print(f"  CT={scores.get('CT',0)} DIV={scores.get('DIV',0)} | {o['titulo'][:65]} | {o['empresa_entidad'][:30]}")
