---
name: negocio-curaduria-llm-con-skills
regimen: divergente
description: Curaduría automática de lotes de datos (ofertas, convocatorias, leads) usando el juicio de un LLM guiado por una SKILL.md que codifica los criterios calibrados del dueño — no un dashboard ni un clasificador ML. Cargar cuando el usuario pida "curar/revisar" un lote, quiera que un agente decida por él aplicando su criterio, necesite replicar la curaduría por perfil/persona, o cuando una corrección deba retroalimentar el criterio (loop de calibración).
---

# Curaduría asistida por LLM como skill (con loop de calibración)

**Nivel actual:** N2 · **Dominio:** Análisis de Negocio · **Agente(s):** `datos-scraping`
**Proyectos fuente:** Scraper-Empleos (`.claude/skills/curador-empleos/SKILL.md`, `.claude/skills/curador-paula/SKILL.md`)

> Criterio de ascenso a N1: los 5 bloques completos, con activos copiables de ruta real y gotchas verificados (no genéricos). A N2: ≥1 uso real aceptado por el Dueño. A N3: ≥3 usos exitosos en ≥2 proyectos + checklist propio.

## 1. Propósito

Cuando un scraper (u otra fuente) produce cientos de registros pendientes por lote, el cuello de botella es el juicio humano: cuáles aprobar, cuáles descartar. Esta skill resuelve ese juicio **sin dashboard y sin modelo ML entrenado**: se codifica el criterio del dueño en una `SKILL.md` con reglas explícitas de APROBAR/RECHAZAR (con ejemplos reales y excepciones), y el agente LLM decide registro por registro, guarda cada decisión con su razón y presenta solo el resumen.

Se carga cuando:
- Hay un lote de items `estado == "pendiente"` que revisar y el dueño no quiere verlos uno a uno (calibrado 2026-06-09 en Scraper-Empleos: *"no vamos a revisar uno a uno, la idea es que tome tu criterio"*).
- Se necesita **replicar** la curaduría por persona/perfil: una skill por perfil (`curador-empleos` cura CT+DIV; `curador-paula` cura el perfil PAU con criterios propios).
- Una decisión corregida por el dueño debe **retroalimentar** el criterio (loop de 3 niveles).

Arquitectura de la decisión en 3 capas (clave del enfoque):
1. **Pre-scoring determinista** (`matcher.py`, `config/perfiles.json`) — asigna un score 0-100 por perfil antes de que el LLM mire nada.
2. **Juicio LLM guiado por la SKILL.md** — segunda capa: aplica criterios que el score no captura (contexto, matices, excepciones).
3. **Revisión humana** para lo de alto riesgo/monto (SECOP, montos grandes → nunca auto-aprobar, dejar `pendiente`).

## 2. Procedimiento

Para crear/operar un curador para un perfil P:

1. **Escribir/actualizar la SKILL.md del perfil** con criterios EXPLÍCITOS, no aspiracionales. Estructura probada (ver `activos/curador-empleos.SKILL.md`):
   - Bloque `APROBAR`: categorías con **ejemplos reales** (títulos concretos que el dueño aprobó) y el porqué.
   - Bloque `RECHAZAR`: categorías con ejemplos, incluyendo casos-trampa ("Ojo: rechazó X aunque parecía encajar, porque…").
   - Bloque `AMBIGUOS`: qué se deja `pendiente` y con qué tope (ej. "máx ~5 por sesión").
   - Políticas diferenciadas por **riesgo**: lo de mucho dinero (SECOP) → revisión humana, "más selectivo", nunca auto-aprobar (calibrado 2026-06-10).
2. **Leer el lote**: `data/ofertas_latest.json` desde la raíz del proyecto. Parsear campos que vienen como JSON-string (`perfiles_match`, `score_match`) con `json.loads()`.
3. **Filtrar** `estado == "pendiente"` **y** que el perfil P esté en `perfiles_match` (no vacío). Listar TODAS antes de decidir (título + empresa + scores + 140 chars de descripción).
4. **Decidir por lote en UN solo script** (no un subprocess por item). Criterio de estructura: mapa `{fragmento_distintivo → razón}` para APROBAR/RECHAZAR/PENDIENTE; el que no cae en ninguna regla se decide por una función `razon_rechazo(o)` de keywords (ver `activos/curar_batch.py`) o se aborta si quedan sin regla (ver `activos/_curar_paula_lote.py`).
5. **Verificar con asserts ANTES de escribir**: total esperado + 2-3 anclas de título conocidas, para no aplicar decisiones a la lista equivocada. Si algún item queda sin regla → abortar (`sys.exit(1)`), no escribir a medias.
6. **Anotar SIEMPRE la razón** en `notas`, con prefijo trazable:
   `o["notas"] += f" | [auto-curador] {razon}"` (o `[auto-curador-paula]` por perfil). Solo cambiar el estado de los items del perfil P; no tocar otros perfiles.
7. **Persistir**: sobrescribir `data/ofertas_latest.json` + snapshot `data/ofertas_curated_{timestamp}.json`. Regenerar salida: `python scripts/export_landing.py`.
8. **Presentar SOLO el resumen**: aprobadas (lista completa con título, empresa, scores y URL — es lo que el dueño usa para actuar), rechazadas (conteo + patrones), pendientes (lista corta).
9. **Loop de calibración de 3 niveles** cuando el dueño corrige una decisión:
   - Nivel 1: corregir el caso puntual.
   - Nivel 2: actualizar la SKILL.md del perfil (nueva regla/excepción con fecha).
   - Nivel 3: si el patrón se repite (≥2 veces), **bajarlo al motor de scoring** — `config/perfiles.json › perfil › match` (`keywords_negativas`, `roles_funcion_excluida`, `roles_handson`) — para que el score ya llegue calibrado al próximo scrape y el LLM no tenga que corregirlo cada vez.

## 3. Activos copiables

Todos verificados en `Scraper-Empleos` y copiados a `activos/` de esta skill.

- **`activos/curador-empleos.SKILL.md`** (origen: `Scraper-Empleos/.claude/skills/curador-empleos/SKILL.md`) — plantilla completa de una skill-curador multi-perfil (CT persona + DIV empresa). Cópiala como base; adapta los bloques APROBAR/RECHAZAR al dominio y la política de riesgo (aquí: SECOP = revisión humana; convocatorias culturales IDARTES = mantener todas en `pendiente`).
- **`activos/curador-paula.SKILL.md`** (origen: `Scraper-Empleos/.claude/skills/curador-paula/SKILL.md`) — ejemplo de **replicación por persona**: mismo mecanismo, criterios propios de otro perfil (comunicación/periodismo/cultura). Muéstralo cuando haya que crear un curador para un perfil nuevo sin partir de cero.
- **`activos/curar_batch.py`** (origen: `Scraper-Empleos/scripts/curar_batch.py`) — script de decisión por lote con: asserts de anclas antes de escribir, `APROBAR`/`KEEP_PENDIENTE` como listas de tuplas `(fuente_id, frag_titulo, frag_empresa, razon)`, función `razon_rechazo()` por keywords, snapshot con timestamp y resumen impreso. Adaptar los mapas de decisión; conservar el patrón de asserts y de `notas += [auto-curador]`.
- **`activos/_curar_paula_lote.py`** (origen: `Scraper-Empleos/scripts/_curar_paula_lote.py`) — variante one-shot con **normalización de tildes** (`unicodedata` → ascii) para el matching de fragmentos, y **aborto si queda algo sin decidir** (`sin_decidir` → `sys.exit(1)`). Úsalo cuando quieras garantía dura de cobertura total del lote.
- **`activos/test_regresion_matcher.py`** (origen: `Scraper-Empleos/scripts/test_regresion_matcher.py`) — red de seguridad para el Nivel 3 del loop: antes de tocar el motor de scoring `--baseline` guarda `{hash: {scores}}`; después `--check` re-scorea y exige diff 0 en los perfiles ya calibrados. Cópialo cuando vayas a bajar patrones a `config/perfiles.json` y no quieras romper la calibración existente.

## 4. Gotchas verificados

Errores reales cometidos y resueltos en Scraper-Empleos:

- **El pre-scoring sobre-puntuaba liderazgo de ONG.** El matcher daba score alto a "Director + impacto + remoto" y colaba roles ajenos (recaudación/fundraising, finanzas, ventas, COO/CEO genérico). Solución: se creó la penalización `ROLES_FUNCION_NO_CT` / `ROLES_EXEC_GENERICO_CT` en el motor y la regla explícita en `curador-empleos.SKILL.md` (calibrado 2026-06-10). Un ejecutivo genérico sin núcleo de datos/producto/IA/cultura se penaliza; si la org es data/product/cultura y la descripción lo respalda, es penalty suave rescatable. Evidencia: `activos/curador-empleos.SKILL.md` (sección RECHAZAR, perfil CT).
- **Aplicar decisiones a la lista equivocada.** Sin verificación, un script podía marcar estados sobre un lote distinto al esperado. Solución: **asserts de anclas** (total esperado + 2-3 títulos conocidos) ANTES de escribir. Evidencia: `activos/curar_batch.py` líneas 20-24 (`assert any('director of data strategy' in t …)`) y `activos/_curar_paula_lote.py` líneas 118-119 (`assert total == 47 …`).
- **Items sin regla se escribían silenciosamente como rechazados.** Si el lote traía títulos no contemplados, quedaban mal clasificados sin avisar. Solución: acumular `sin_decidir` y **abortar** (`sys.exit(1)`) imprimiendo los títulos, en vez de escribir a medias. Evidencia: `activos/_curar_paula_lote.py` líneas 112-117.
- **Las decisiones se perdían al re-scrapear.** Una oferta ya aprobada/rechazada volvía a `pendiente` en el siguiente run porque seguía viva en la fuente. Solución: preservar curaduría por **hash md5** (`fuente|titulo_normalizado|empresa_normalizada`, misma fórmula que el dedup) — si el hash ya tenía estado != `pendiente`, se restaura estado + notas. Evidencia: `Scraper-Empleos/main.py` líneas 555-582 y `scrapers/base.py` `calcular_hash_oferta()` línea 86.
- **La consola de Windows (cp1252) rompía con acentos/flechas** al imprimir el resumen. Solución: `sys.stdout.reconfigure(encoding="utf-8")` al inicio de todo script de curaduría. Evidencia: `activos/curar_batch.py` línea 6, `activos/test_regresion_matcher.py` líneas 25-28.
- **Solape entre perfiles (una oferta sirve a CT y a PAU).** El estado es por oferta (compartido); curar PAU no debe pisar el estado global de una oferta que también es de CT. Solución: al curar un perfil, filtrar por su presencia en `perfiles_match` y, ante duda de solape, dejar `pendiente`. En la práctica el solape CT∩PAU es bajo. Evidencia: `activos/curador-paula.SKILL.md` líneas 98-101 (Notas técnicas).
- **Auto-aprobar contratos de mucho dinero es peligroso.** Los contratos SECOP son decisiones de alto monto. Solución/política: NO auto-aprobar SECOP; auto-aprobar solo lo nuclear del negocio (datos, sistemas de información, evaluación/medición) y **dejar el resto en `pendiente`** para revisión humana en la landing; no rechazar salvo que sea claramente obras/interventoría/hardware. Evidencia: `activos/curador-empleos.SKILL.md` sección SECOP (calibrado 2026-06-10: "más selectivo").

## 5. Criterios de done

- [ ] La SKILL.md del perfil tiene bloques APROBAR/RECHAZAR/AMBIGUOS con **ejemplos reales** y al menos un caso-trampa documentado; incluye la política de riesgo (qué nunca se auto-aprueba).
- [ ] La decisión se aplicó en **UN** script por lote (no un subprocess por item), con `sys.stdout.reconfigure(encoding="utf-8")`.
- [ ] El script corre **asserts de anclas** (total + 2-3 títulos) antes de escribir, y **aborta** si algún item queda sin regla.
- [ ] Cada item modificado lleva su razón en `notas` con prefijo `[auto-curador…]`; solo se tocó el estado del perfil curado.
- [ ] Se generó snapshot `data/ofertas_curated_{timestamp}.json` además de sobrescribir `ofertas_latest.json`; se regeneró la salida (`export_landing.py`).
- [ ] El resumen presentado lista aprobadas completas (con URL), conteo+patrones de rechazadas y pendientes cortas — sin volcar el lote entero.
- [ ] Las decisiones sobreviven a un re-scrape (verificado: correr el scraper de nuevo no revierte estados; log "Curaduría preservada en N ofertas").
- [ ] Si se bajó un patrón al motor de scoring (Nivel 3): `test_regresion_matcher.py --check` da **diff 0** en los perfiles ya calibrados.

## Registro de uso
| Fecha | Proyecto | Tarea | Resultado | Lección |
|---|---|---|---|---|
| histórico | Scraper-Empleos | uso original (fuente de esta skill) | ok | - |
