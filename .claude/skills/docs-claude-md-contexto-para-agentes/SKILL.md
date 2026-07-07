---
name: docs-claude-md-contexto-para-agentes
regimen: universal
description: Escribe y mantiene el CLAUDE.md/AGENTS.md que funciona como sistema operativo del proyecto para agentes IA (qué es, stack, árbol, comandos exactos, contexto institucional, reglas inviolables, estado y riesgos). Cárgala al iniciar un proyecto nuevo, al montar el repo para trabajar con Claude Code, cuando un agente "alucina" arquitectura o versiones, al preparar un repo para publicación, o cuando el CLAUDE.md quedó desfasado del código.
---

> **Régimen: universal.** Las referencias a normativa estatal (M-GSI-002, DI-GSI-010, ITIL, GOV.CO, «entidad pública») aplican SOLO en proyectos `institucional`; en un proyecto `divergente` ignóralas y usa la variante de la línea privada (Vercel/Node/Postgres).

# CLAUDE.md como contexto operativo para agentes IA

**Nivel actual:** N3 · **Dominio:** docs · **Agente(s):** `documentador`
**Proyectos fuente:** DivergenteWEB, Portal ISI (Interfase Pagina Inicial), Interfase Sistemas, Plataforma Conecta, Plataforma GEDII, PNMC SIMUS, Scraper-Empleos

> Criterio de ascenso a N1: los 5 bloques completos, con activos copiables de ruta real y gotchas verificados (no genéricos). A N2: ≥1 uso real aceptado por el Dueño. A N3: ≥3 usos exitosos en ≥2 proyectos + checklist propio. (Esta skill nace en N3: es la práctica más repetida del portafolio — CLAUDE.md presente en 7 de 9 proyectos.)

## 1. Propósito

Producir el archivo `CLAUDE.md` (y su gemelo `AGENTS.md` cuando aplica) que un agente IA lee ANTES de tocar el repo, para ejecutar sin inventar: sin adivinar comandos, sin recrear arquitectura, sin romper reglas de negocio y sin alucinar APIs de frameworks recientes. Es la capa operativa concisa; la documentación extensa vive en otras capas (`docs/`, `README.md`, blueprint — ver skill `docs-documentacion-en-capas`).

Se carga cuando: (a) arranca un proyecto o se monta el repo para trabajar con Claude Code; (b) un agente confunde versiones o convenciones (post-cutoff); (c) se va a publicar un repo y hay que decidir higiene; (d) el CLAUDE.md quedó desfasado del código y produce errores. En la Fábrica es responsabilidad del agente `documentador`.

## 2. Procedimiento

1. **Elige el molde según madurez del proyecto:**
   - Proyecto en fase temprana o institucional → molde *institucional* (`activos/ejemplo-CLAUDE-institucional.md`): secciones Qué es → Stack (tabla) → Estructura (árbol anotado) → Cómo correr → Contexto institucional → Tipos base → Estado (checkboxes) → Convenciones.
   - Monorepo grande/maduro (front + API + BD) → molde *manual maestro* (`activos/ejemplo-CLAUDE-manual-maestro.md`): añade Comandos exactos por pieza, Arquitectura con rutas de archivos clave, **Reglas de negocio transversales inviolables** y **Riesgos con puntero al backlog**.
   - Parte SIEMPRE de `activos/CLAUDE.plantilla.md` y borra lo que no aplique.

2. **Redacta "Qué es este proyecto"** en 1-2 frases, incluyendo qué NO es y si se construye por fases (ej. Interfase Sistemas: "No es un sistema robusto: es una interfaz de aterrizaje…").

3. **Stack en tabla**, una fila por capa, con columna de Notas para marcar versiones peligrosas. Si el stack incluye un framework posterior al corte de conocimiento del modelo (Next.js 16, Tailwind v4, React 19, .NET 10), la Nota es obligatoria (ver paso 8).

4. **Árbol de estructura anotado:** solo carpetas/archivos clave, cada uno con un comentario de una línea (`# Entry point — puerto 3000`, `# Lista de sistemas (fuente de datos inicial)`). No vuelques el árbol completo.

5. **Comandos exactos por pieza**, copiables, con el shell correcto (**PowerShell en Windows**) y el **puerto real verificado**. Incluye cómo correr UN solo test, no solo la suite (`npx vitest run src/features/map`). Verifica los puertos contra el código, no contra tu memoria (gotcha del proxy, §4).

6. **Contexto institucional y lineamientos heredables** (proyectos de gobierno): infraestructura destino (Windows Server, SQL Server 2016+, IIS, LDAP/AD, GitLab interno), lineamientos obligatorios DI-GSI-010 y documentos de referencia (P-GSI-003, M-GSI-003, M-GSI-005). Esto hace que cualquier agente herede las restricciones reales del cliente sin que se las repitan.

7. **Reglas de negocio inviolables + Estado + Riesgos:**
   - Reglas: lo que un agente NUNCA debe romper, cada una con su porqué (PNMC: "`ajustes_solicitados` es un estado propio; no normalizarlo a `en_revision`"; "la seguridad real vive en el backend; nunca delegarla al frontend").
   - Estado con checkboxes `[x]/[ ]`, marcando hecho SOLO lo verificado en código/demo (§4, honestidad sobre el alcance).
   - Riesgos conocidos con formato Riesgo → Impacto → Acción y puntero a `docs/backlog/`.

8. **Anti-alucinación de frameworks post-cutoff:** usa el patrón `CLAUDE.md = @AGENTS.md` y pon en `AGENTS.md` una advertencia que apunte a la doc REAL instalada (`node_modules/<pkg>/dist/docs/`). Repite la advertencia en el README donde el humano la ve. Plantilla en `activos/ejemplo-AGENTS-anti-alucinacion.md`.

9. **Convenciones:** español para negocio / inglés para código técnico, PascalCase componentes / camelCase archivos, commits convencionales en español, docs en español (en un proyecto `institucional` lo exige DI-GSI-010 — *solo si el proyecto es institucional*; en `divergente` es convención de la casa, no obligación normativa).

10. **Higiene de publicación:** si el repo será público, añade `CLAUDE.md`, `.claude/` y `.env` al `.gitignore` (`activos/gitignore-higiene-repo-publico.txt`). Si es repo privado interno y el equipo quiere versionar el CLAUDE.md, NO lo ignores — decide según visibilidad.

11. **Calibración continua:** cada vez que el CLAUDE.md induzca un error del agente, corrige el archivo en el mismo commit (regla inviolable 6 de la Fábrica). Si el proyecto tiene doc en capas, refleja los cambios de arquitectura también en el sub-documento y la bitácora del manual maestro.

## 3. Activos copiables

En `activos/` de esta skill (rutas relativas a la carpeta de la skill):
- `CLAUDE.plantilla.md` — plantilla en blanco con todas las secciones canónicas y comentarios-guía. **Punto de partida por defecto.**
- `ejemplo-CLAUDE-institucional.md` — copia real del CLAUDE.md de *Interfase Sistemas* (idéntico al de *Plataforma Conecta*). Cópialo para proyectos institucionales en fase temprana.
- `ejemplo-CLAUDE-manual-maestro.md` — copia del CLAUDE.md de *PNMC* (monorepo maduro), con credenciales de desarrollo redactadas. Cópialo para monorepos front+API+BD.
- `ejemplo-AGENTS-anti-alucinacion.md` — patrón `CLAUDE.md=@AGENTS.md` + advertencia post-cutoff. Cópialo cuando el stack tenga un framework más nuevo que el corte del modelo.
- `gitignore-higiene-repo-publico.txt` — líneas de `.gitignore` para no filtrar contexto de IA al publicar.

Fuentes originales verificadas (por si necesitas más contexto):
- `002 Desarrollos/Interfase Sistemas/CLAUDE.md` — molde institucional completo.
- `002 Desarrollos/Plan Nacional de Musica SIMUS/Entorno_Virtual_PNMC/CLAUDE.md` — molde manual maestro con reglas inviolables y riesgos.
- `002 Desarrollos/DivergenteWEB/CLAUDE.md` (una línea: `@AGENTS.md`) + `DivergenteWEB/AGENTS.md` — patrón anti-alucinación.
- `002 Desarrollos/DivergenteWEB/README.md` — ejemplo de sistema de diseño con tokens/paleta copiables literalmente (§Sistema de diseño) y advertencia post-cutoff repetida (líneas 21 y 275).
- `002 Desarrollos/Interfase Sistemas/.gitignore` (líneas de `CLAUDE.md`, `.claude/`, `.env`) — higiene repo público.

## 4. Gotchas verificados

- **Desfase doc↔código en credenciales/estado** (PNMC): la doc decía contraseña `pnmc-master` pero la vigente era `admin`; casi bloquea el arranque local. Regla: verifica credenciales sembradas y checkboxes de "Estado" contra el CÓDIGO (`DatabaseBootstrapper`/seeds), no contra docs heredadas. Evidencia: `CORREO_DESPLIEGUE_PNMC.md` §7 y Blueprint. Corolario: en historias de usuario, lo marcado "Implementado" se confirma en demo (`Historias de Usuario/HISTORIAS_DE_USUARIO_PNMC.md`).
- **Puerto documentado incorrecto** (Portal ISI): el `client/vite.config.ts` proxya `/api` a `localhost:3001` pero el server escucha en `3000` (y así lo dice el README) → si se usa la API local, el proxy falla hasta alinear. Antes de escribir el comando "cómo correr", lee el puerto real en `server/src/index.ts` y en `vite.config.ts`. Evidencia: ficha Portal ISI, errores y soluciones.
- **Publicar el repo con el contexto de IA dentro** (Interfase Sistemas): sin excluir `CLAUDE.md` y `.claude/`, se filtran infraestructura interna, rutas y reglas de negocio al GitHub público. Se resolvió con `.gitignore` + commit de limpieza "portal limpio para repositorio público" (1a8bd99) que además borró prototipos descartados. Evidencia: `Interfase Sistemas/.gitignore`.
- **Alucinación de framework post-cutoff** (DivergenteWEB): un agente con Next.js "de memoria" escribe APIs y estructura de archivos equivocadas para Next.js 16 + React 19 + Tailwind v4. Solución verificada: `CLAUDE.md=@AGENTS.md` con "This is NOT the Next.js you know… Read `node_modules/next/dist/docs/` before writing any code", repetido en el README. Evidencia: `DivergenteWEB/AGENTS.md` y `README.md` (líneas 21, 275).
- **Faltan las reglas de negocio inviolables → el agente las rompe** (PNMC): sin declararlas, un agente normaliza `ajustes_solicitados` a `en_revision`, usa roles históricos o mueve la autorización al frontend. El CLAUDE.md debe listarlas explícitamente con su porqué. Evidencia: `Entorno_Virtual_PNMC/CLAUDE.md` §Reglas de negocio transversales.
- **Archivos gigantes sin advertencia** (PNMC): `AdminShellPage.jsx` (~7.900 líneas), `AdminDataEndpoints.cs` (~144 KB) y un TopoJSON de ~28 MB degradan al agente si no están señalados como deuda/puntos clave en el CLAUDE.md. Documenta su tamaño y su plan de desacople (`docs/backlog/deuda_tecnica.md`). Nota Fábrica: para EDITAR archivos muy grandes existe la skill `devops-parcheo-programatico-archivos-grandes`; enlázala desde el CLAUDE.md.
- **Proyectos hermanos que no se deben tocar** (DivergenteWEB): un agente confunde el proyecto activo con uno de referencia. Se resolvió con aislamiento total (credenciales, Sheet, perfiles y logs propios) y un "NO TOCAR" repetido en `CLAUDE.md`, `PLAN.md` y la memoria. Evidencia: ficha DivergenteWEB, aprendizajes (proyecto Eventos como referencia).

## 5. Criterios de done

- [ ] El CLAUDE.md permite a un agente **correr el proyecto sin preguntar**: comandos exactos, shell correcto y puertos verificados contra el código.
- [ ] Stack en tabla; todo framework post-cutoff tiene Nota + advertencia anti-alucinación apuntando a su doc local.
- [ ] Árbol anotado presente; cada entrada clave con comentario de una línea.
- [ ] Reglas de negocio inviolables listadas con su porqué (si el dominio las tiene).
- [ ] Contexto institucional/lineamientos incluidos en proyectos de gobierno (DI-GSI-010 y afines).
- [ ] "Estado" con checkboxes refleja la realidad del código, no de docs heredadas.
- [ ] Riesgos conocidos con puntero al backlog; archivos gigantes señalados.
- [ ] Decisión de higiene tomada: repo público → `CLAUDE.md`, `.claude/`, `.env` en `.gitignore`.
- [ ] Todo en español; convenciones (negocio/técnico, PascalCase/camelCase) explícitas.
- [ ] Revisado por un agente distinto al que lo escribió (regla inviolable 1 de la Fábrica).

## Registro de uso
| Fecha | Proyecto | Tarea | Resultado | Lección |
|---|---|---|---|---|
| histórico | DivergenteWEB | Uso original (fuente de esta skill) | ok | Patrón `CLAUDE.md=@AGENTS.md` + anti-alucinación post-cutoff |
| histórico | Portal ISI | Uso original (fuente de esta skill) | ok | Contexto institucional heredable; cuidado con puertos documentados |
| histórico | Interfase Sistemas | Uso original (fuente de esta skill) | ok | Molde institucional canónico + higiene de repo público |
| histórico | Plataforma Conecta | Uso original (fuente de esta skill) | ok | Mismo molde reutilizado tal cual entre proyectos hermanos |
| histórico | Plataforma GEDII | Uso original (fuente de esta skill) | ok | Doc de handoff con "Lo que NO cambiar" complementa al CLAUDE.md |
| histórico | PNMC SIMUS | Uso original (fuente de esta skill) | ok | Molde manual maestro: reglas inviolables + riesgos + comandos por pieza |
| histórico | Scraper-Empleos | Uso original (fuente de esta skill) | ok | Sin detalle de habilidades en la ficha — ver dudas |
| 2026-07-04 | Fábrica de Software (repo maestro) | DOC-F7-001: README raíz que designa a CLAUDE.md como sistema operativo y remite a él sin duplicarlo (roster/reglas) | aceptada a la 1a (QA: sin duplicación, remite correctamente) | El README enlaza al CLAUDE.md como capa operativa; evita reescribir reglas inviolables |
