---
name: docs-documentacion-en-capas
regimen: universal
description: Diseña la documentación de un proyecto en capas con propósito distinto por nivel (CLAUDE.md operativo → README de repo → README técnico co-ubicado → documento de transferencia total; y en monorepos, un Manual Maestro con sub-documentos por audiencia). Cárgala al arrancar un proyecto, al preparar un handoff/entrega, antes de publicar un repo, al documentar un componente complejo, o cuando el proyecto deba retomarse en otra máquina, otra sesión de IA u otro equipo.
---

> **Régimen: universal.** Las referencias a normativa estatal (M-GSI-002, DI-GSI-010, ITIL, GOV.CO, «entidad pública») aplican SOLO en proyectos `institucional`; en un proyecto `divergente` ignóralas y usa la variante de la línea privada (Vercel/Node/Postgres).

# Documentación en capas

**Nivel actual:** N3 · **Dominio:** docs · **Agente(s):** documentador
**Proyectos fuente:** Interfase Sistemas · PNMC SIMUS · Scraper-Empleos

> Criterio de ascenso a N1: los 5 bloques completos, con activos copiables de ruta real y gotchas verificados (no genéricos). A N2: ≥1 uso real aceptado por el Dueño. A N3: ≥3 usos exitosos en ≥2 proyectos + checklist propio.

## 1. Propósito

Evitar el punto de dolor recurrente del portafolio del Dueño: proyectos que se retoman meses después, en otra máquina, en una sesión nueva de Claude Code o por otra persona, y donde el contexto vive solo en la cabeza de quien lo construyó. La solución probada en tres proyectos es **una jerarquía de documentos, cada uno con un lector y un propósito distintos**, en lugar de un README gigante que nadie mantiene.

Se carga cuando: se arranca un proyecto nuevo, se documenta un componente complejo, se prepara un handoff a un equipo, se va a publicar un repositorio, o se necesita que un agente IA retome el trabajo sin re-investigar. Regla del Dueño: **toda documentación en español** (en un proyecto `institucional` esto además lo exige DI-GSI-010 del Ministerio de las Culturas — *solo si el proyecto es institucional*; en `divergente` es preferencia del Dueño, no obligación normativa).

## 2. Procedimiento

Las cuatro capas y **cuándo se crea cada una**. No todas aplican a todo proyecto: escala según tamaño.

**Capa 1 — `CLAUDE.md` en la raíz (contexto operativo conciso).** Lector: el agente IA en futuras sesiones. Siempre presente. Contiene: qué es el proyecto (1 párrafo), stack en tabla, árbol de estructura anotado, **comandos exactos para correr** cada pieza, contexto institucional, tipos base, estado con checkboxes `[x]/[ ]`, y convenciones. En proyectos con reglas de negocio críticas, añade una sección de **reglas transversales inviolables** (ej. PNMC: "`ajustes_solicitados` es un estado propio; no normalizarlo a `en_revision`"; "la seguridad real vive en el backend, nunca delegarla al frontend"). Mantenlo conciso: si crece, apunta a `PLAN.md`/`docs/` (Scraper-Empleos: *"Contexto técnico conciso. Para el plan completo ver PLAN.md"*).

**Capa 2 — `README.md` del repo (quick start para quien clona).** Lector: humano externo que clona. Portada + inicio rápido (`git clone` → instalar → correr), tabla de stack, estructura resumida, y **enlaces a las demás capas**. En proyectos grandes designa explícitamente el punto de entrada (PNMC README: *"Punto de entrada: abre `BLUEPRINT_PNMC.html`"*).

**Capa 3 — README técnico co-ubicado (junto al componente complejo).** Lector: quien va a tocar ese código. Se crea **solo para componentes con algoritmos no obvios**. Vive al lado del archivo (ej. `client/src/components/TIRILLA_F_README.md`, junto a `tirillaF.tsx`). Contiene: stack, archivos involucrados, tabla de props, **algoritmos explicados con diagramas ASCII**, tabla de breakpoints/responsive, constantes ajustables documentadas, y guía "cómo añadir un ítem". Criterio de decisión: *¿alguien que llega nuevo entendería este componente sin preguntarle al autor?* Si no → merece su README co-ubicado.
   - En **monorepos grandes** esta capa se generaliza a un **Manual Maestro** (`docs/DOCUMENTACION_PROYECTO.md`) con sub-documentos por audiencia en subcarpetas: `docs/tecnico/`, `docs/funcional/`, `docs/gobernanza/`, `docs/backlog/`. Regla operativa: **cada PR que cambie arquitectura actualiza su sub-documento y añade una fila a la bitácora del Manual Maestro** (sección "Historial de actualizaciones").

**Capa 4 — Documento de transferencia total.** Lector: la persona/agente que retoma el proyecto en frío. Se crea al preparar un handoff o cuando el proyecto es lo bastante grande para no caber en `CLAUDE.md`. Tres formatos reales según el caso:
   - `CONTEXTO_COMPLETO.md` (Scraper-Empleos): documento único con tabla de contenidos, "qué es en una página", **decisiones de diseño numeradas con su porqué**, inventario de archivos, glosario y una sección final **"Para una nueva sesión"** con el comando exacto para que el agente retome.
   - Blueprint HTML autocontenido (`BLUEPRINT_PNMC.html`): abre en navegador sin dependencias, con **rutas guiadas por perfil** (directivo, gestor, desarrollador, tecnología), mapa documental hipervinculado y glosario para no desarrolladores. (Ver skill hermana `docs-blueprint-onboarding-por-perfiles`.)
   - Correo/nota de handoff (`CORREO_DESPLIEGUE_PNMC.md`): ruta de montaje verificada de punta a punta, orden de lectura sugerido y **notas de trazabilidad de errores ya resueltos**.

**Fichas de deuda técnica** (transversal, en `docs/backlog/`): cada deuda con formato fijo **Riesgo identificado → Impacto → Acción requerida (con pasos concretos)**. Ver `deuda_tecnica.md`.

**Orden de trabajo recomendado:** (1) `CLAUDE.md` desde el día 1 con el contexto institucional que condiciona decisiones futuras; (2) `README.md` cuando el repo se comparte; (3) README co-ubicado / Manual Maestro cuando aparece complejidad; (4) documento de transferencia al preparar la entrega. Antes de publicar: **higiene de repo** (ver bloque 4).

## 3. Activos copiables

En `activos/` de esta skill (plantillas reales, ya sanitizadas de datos personales):

| Activo | Qué es / cuándo copiarlo | Qué adaptar | Origen real |
|---|---|---|---|
| `CLAUDE-ejemplo-proyecto-client-server.md` | Plantilla de Capa 1 para proyecto simple: qué es, stack en tabla, árbol anotado, cómo correr, contexto institucional, tipos base, estado con checkboxes, convenciones. | Reemplazar stack, rutas, contexto institucional y tipos. | `Interfase Sistemas/CLAUDE.md` |
| `README-tecnico-co-ubicado-ejemplo.md` | Plantilla ejemplar de Capa 3: documenta un componente complejo con diagramas ASCII del algoritmo, tabla de props, tabla de breakpoints, constantes ajustables y guía de extensión. | Cambiar el componente, sus algoritmos y sus props/constantes. | `Interfase Sistemas/client/src/components/TIRILLA_F_README.md` |
| `MANUAL-MAESTRO-monorepo-ejemplo.md` | Plantilla de Manual Maestro para monorepo: catálogo de sub-documentos por audiencia (tecnico/funcional/gobernanza/backlog) con enlaces relativos + bitácora de actualizaciones. | Ajustar módulos, audiencias y filas de la bitácora. | `.../Entorno_Virtual_PNMC/docs/DOCUMENTACION_PROYECTO.md` |
| `ficha-deuda-tecnica-ejemplo.md` | Formato de ficha de deuda técnica (Riesgo → Impacto → Acción con pasos). | Sustituir cada deuda concreta. | `.../Entorno_Virtual_PNMC/docs/backlog/deuda_tecnica.md` |
| `DOCUMENTO-TRANSFERENCIA-esqueleto.md` | Esqueleto de Capa 4 (documento único de transferencia): TOC de 11 secciones, decisiones con su porqué, glosario y "Para una nueva sesión". Sanitizado: sin datos personales. | Rellenar cada sección; nunca poner secretos. | Estructura de `Scraper-Empleos/CONTEXTO_COMPLETO.md` |

Ejemplos completos in-situ para consultar (no copiados por contener credenciales de desarrollo o datos personales — leerlos como referencia, no clonarlos):
- `.gitignore` que excluye artefactos de IA para repo público — `Interfase Sistemas/.gitignore` (líneas 35-37: `CLAUDE.md`, `.claude/`).
- Correo de handoff con ruta verificada de punta a punta — `Plan Nacional de Musica SIMUS/CORREO_DESPLIEGUE_PNMC.md` (contiene credenciales de dev: no clonar).
- Documento único de transferencia real (con glosario y "Para una nueva sesión") — `Scraper-Empleos/CONTEXTO_COMPLETO.md` (contiene el perfil personal del Dueño: no clonar).

## 4. Gotchas verificados

1. **Rutas absolutas rompen la documentación al clonar en otra máquina.** El Manual Maestro del PNMC tenía enlaces `file:///Users/edderjimenez/...`; en cualquier otro equipo quedaban muertos. Solución documentada en la bitácora: reemplazar todo por **rutas relativas portables** (`./tecnico/guia_instalacion.md`). Evidencia: `Entorno_Virtual_PNMC/docs/DOCUMENTACION_PROYECTO.md` §4, fila 27/05/2026 "Rutas Portables".

2. **La documentación miente sobre las credenciales si se copia de una versión heredada.** La doc del PNMC decía contraseñas tipo `pnmc-master`, pero la contraseña vigente de todas las cuentas de desarrollo era `admin`. Lección: **verificar credenciales y estados contra el código, no contra docs viejas**. Evidencia: `CORREO_DESPLIEGUE_PNMC.md` §6 ("la contraseña de todas es: admin") vs. tabla heredada del CLAUDE.md. Corolario: las historias de usuario del PNMC llevan un campo "Estado" verificado contra entidad+endpoint reales, no contra la doc.

3. **`docs/` se convierte en un basurero plano.** El PNMC llegó a tener 15 archivos sueltos y desorganizados en la raíz de `docs/`. Solución: reclasificarlos en **4 subdirectorios por audiencia** (`tecnico/`, `funcional/`, `gobernanza/`, `backlog/`) y escribir un Manual Maestro que los indexe con enlaces relativos. Evidencia: `DOCUMENTACION_PROYECTO.md` §4, fila "Reestructuración y Modularización Completa".

4. **Un repo público arrastra ruido de prototipos y archivos internos de IA.** En Interfase se prototiparon 6+ variantes de un componente (tirillaA–G) y los `CLAUDE.md`/`.claude/` son contexto interno de trabajo con IA, no producto. Solución: el `.gitignore` **excluye `CLAUDE.md` y `.claude/`** (líneas 35-37) y un commit de limpieza (`1a8bd99` "feat: portal limpio para repositorio público") borra los prototipos descartados antes de publicar. Separa el conocimiento interno de lo que se publica.

5. **Documentar como "hecho" algo que no está implementado erosiona toda la doc.** En el PNMC, endpoints públicos exponían contacto sin enmascarar pese a que la doc lo daba por resuelto (incumplimiento Habeas Data). Solución adoptada como principio: **honestidad sobre el alcance** — el `CLAUDE.md` del PNMC tiene una sección "Riesgos y pendientes conocidos" y la HU se marca honestamente como "Propuesto — no implementado". La deuda conocida se documenta, no se esconde. Evidencia: `Entorno_Virtual_PNMC/CLAUDE.md` sección final + `docs/backlog/`.

6. **El documento de transferencia acumula datos personales/secretos si no se separa.** `Scraper-Empleos/CONTEXTO_COMPLETO.md` mezcla la arquitectura (reutilizable) con el perfil profesional del Dueño y salarios (no publicable). Lección: el patrón/estructura es un activo; el contenido personal y las credenciales **nunca** se copian ni se versionan en repos compartidos (`.env` reales fuera del repo, credenciales de dev con nota "rotarlas antes de compartir"). Por eso el activo de esta skill es un esqueleto sanitizado, no el archivo real.

## 5. Criterios de done

- [ ] Existe `CLAUDE.md` en la raíz con: qué es, stack en tabla, árbol anotado, **comandos exactos** de arranque, estado con checkboxes y convenciones. Está conciso (si desborda, apunta a `PLAN.md`/`docs/`).
- [ ] `README.md` permite a alguien que clona correr el proyecto sin ayuda externa, y **enlaza** a las capas más profundas.
- [ ] Todo componente con lógica no obvia tiene README co-ubicado (o su sub-documento en el Manual Maestro) con **diagrama del algoritmo** y guía de extensión.
- [ ] En monorepo: el Manual Maestro indexa sub-documentos por audiencia con **rutas relativas** (ninguna ruta absoluta) y tiene bitácora de actualizaciones.
- [ ] Toda deuda técnica está fichada como **Riesgo → Impacto → Acción con pasos**.
- [ ] Credenciales, estados y comandos de la doc **verificados contra el código**, no contra docs heredadas.
- [ ] Higiene de repo: `.gitignore` excluye `.env`, `CLAUDE.md`/`.claude/` (si es público) y builds; sin prototipos muertos ni secretos versionados.
- [ ] El documento de transferencia (si aplica) tiene glosario y sección **"Para una nueva sesión"** con el comando de retomada.
- [ ] Todo en **español** (exigencia DI-GSI-010 para proyectos de gobierno).

## Registro de uso
| Fecha | Proyecto | Tarea | Resultado | Lección |
|---|---|---|---|---|
| histórico | Interfase Sistemas | Uso original (fuente de esta skill): CLAUDE.md + README + README técnico co-ubicado + .gitignore de repo público | ok | - |
| histórico | PNMC SIMUS | Uso original (fuente de esta skill): Manual Maestro de monorepo con sub-documentos por audiencia + bitácora + fichas de deuda técnica | ok | - |
| histórico | Scraper-Empleos | Uso original (fuente de esta skill): documento único de transferencia (CONTEXTO_COMPLETO.md) con glosario y "Para una nueva sesión" | ok | - |
| 2026-07-04 | Fábrica de Software (repo maestro) | DOC-F7-001: README.md raíz como Capa 2 (portada), remitiendo a CLAUDE.md (Capa 1) y FABRICA.md; rutas relativas portables | aceptada a la 1a (QA: cifras y enlaces verificados) | Portada de un monorepo de agentes = índice de capas, no duplicar el CLAUDE.md |
