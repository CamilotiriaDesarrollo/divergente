---
name: pm-backlog-azure-devops-csv
regimen: universal
description: Construye un CSV importable a Azure DevOps Boards que crea la jerarquía Epic → Product Backlog Item de una sola pasada, sin corromper tildes/ñ. Cárgala cuando haya que subir un backlog o historias de usuario a Azure Boards, migrar un backlog en Markdown/Excel a Azure DevOps, o preparar un import masivo de work items con anidamiento padre-hijo.
---

# Backlog importable a Azure DevOps por CSV (jerarquía Epic → PBI)

**Nivel actual:** N2 · **Dominio:** pm · **Agente(s):** gerente-proyecto
**Proyectos fuente:** PNMC SIMUS (Plan Nacional de Música)

> Criterio de ascenso a N1: los 5 bloques completos, con activos copiables de ruta real y gotchas verificados (no genéricos). A N2: ≥1 uso real aceptado por el Dueño. A N3: ≥3 usos exitosos en ≥2 proyectos + checklist propio.

## 1. Propósito

Convertir un backlog ya redactado (historias de usuario, épicas) en un único archivo CSV que Azure DevOps Boards importa creando **la jerarquía completa Epic → Product Backlog Item en una sola pasada**, con Description y Acceptance Criteria renderizados como texto enriquecido y sin corrupción de caracteres. Resuelve el problema real de que Azure Boards, vía import CSV, **no admite relaciones de vínculo arbitrarias**: la única forma de establecer padre-hijo por CSV es la indentación por columnas `Title 1` / `Title 2`. Se carga cuando el Dueño o la mesa técnica pide "subir el backlog a Azure", migrar historias desde Markdown/Excel, o dejar el proyecto listo para sprint planning.

En PNMC generó 17 Epics + 62 Product Backlog Items anidados de una sola importación (`HISTORIAS_DE_USUARIO_PNMC_AzureDevOps.csv`), además de una variante con tags de análisis de brechas contra otro sistema (SIMUS).

## 2. Procedimiento

1. **Fija el esquema de columnas exacto** (una sola fila de cabecera, en este orden):
   ```
   "ID","Work Item Type","Title 1","Title 2","Description","Acceptance Criteria","Tags"
   ```
2. **Una fila por work item.** Regla de anidamiento (criterio de decisión clave):
   - **Épica** → `Work Item Type = Epic`, texto en `Title 1`, `Title 2` **vacío**.
   - **Historia/PBI** → `Work Item Type = Product Backlog Item`, `Title 1` **vacío**, texto en `Title 2`.
   - El importador anida cada PBI bajo la Epic de las filas anteriores. **El orden de las filas ES la jerarquía**: nunca reordenes el archivo ni intercales una Epic entre los PBIs de otra.
   - Ejemplo real (una Epic seguida de su primer PBI):
     ```
     "","Epic","E2 · Identidad, autenticación y roles","","","","PNMC; E2"
     "","Product Backlog Item","","HU-AUT-01 · Inicio de sesión interno","<p>Como Webmaster quiero iniciar sesión…</p>","<p>Dado credenciales válidas, cuando inicio sesión, entonces recibo una sesión por cookie…</p>","PNMC; E2; HU-AUT-01; capa: interno; estado: Implementado; prioridad: Must; entrega: MVP"
     ```
3. **Deja `ID` vacío en TODAS las filas** → cada fila se crea como work item **nuevo**. Si pones un ID, Azure intentará actualizar uno existente y el import puede fallar.
4. **Omite deliberadamente `State`, `Area Path` e `Iteration Path`** (no los agregues como columnas):
   - Sin `State` → Azure asigna el estado inicial **New** (recomendación oficial para altas). Poner un State inválido para el proceso rompe el import.
   - Sin `Area Path` / `Iteration Path` → se asignan al **nodo raíz**; se reasignan después dentro de Boards.
5. **Description y Acceptance Criteria en HTML**, envueltos en `<p>…</p>` (varios `<p>` para multi-párrafo). Azure los renderiza como texto enriquecido. Acceptance Criteria usa formato Gherkin dentro del `<p>`: `Dado… cuando… entonces…`.
6. **Tags: separador `;`** dentro de una sola celda entrecomillada. Convención PNMC por historia: `PNMC; <épica>; <id-historia>; capa: <público|registrado|interno>; …`. Los tags son la palanca de filtrado posterior en Boards (ver bloque de brechas).
7. **Adapta el `Work Item Type` al proceso del proyecto Azure** (criterio de decisión, hazlo ANTES de importar con buscar/reemplazar):
   - **Scrum** → `Product Backlog Item` (el default del CSV PNMC).
   - **Agile** → reemplaza `Product Backlog Item` por `User Story`.
   - **CMMI** → reemplaza por `Requirement`.
   - `Epic` es común a los tres procesos, no se toca.
8. **Guarda como UTF-8 SIN BOM.** No abras ni guardes el archivo con Excel en ningún momento (ver Gotcha 1). Si necesitas editarlo, usa **VS Code** o **Notepad++** → *Guardar con codificación: UTF-8 (sin BOM)*.
9. **Importa en Azure DevOps:** Boards → **Work Items** (o Backlogs) → menú **⋮ → Import Work Items** → selecciona el CSV → revisa la **previsualización** (verifica que el anidamiento Epic→PBI se vea correcto) → **Import** → confirma la jerarquía → **Save** (guardado masivo). Referencia oficial: `learn.microsoft.com/azure/devops/boards/queries/import-work-items-from-csv`.
10. **Genera/actualiza la guía de handoff** (`*_IMPORTAR_AzureDevOps.md`) junto al CSV, con los pasos, el proceso asumido y los conteos reales (nº de Epics y PBIs) — y **regenéralos si cambias el CSV** (ver Gotcha 2).

## 3. Activos copiables

Copiados a `activos/` de esta skill (verificados UTF-8 sin BOM, bytes intactos):

- **`activos/HISTORIAS_DE_USUARIO_PNMC_AzureDevOps.csv`** — CSV canónico (17 Epics + 62 PBIs, 80 líneas). Úsalo como **plantilla de estructura**: conserva la fila de cabecera y el patrón Epic/PBI; reemplaza el contenido por tu backlog. Convención de tags aquí: `estado: …; prioridad: <MoSCoW>; entrega: <MVP|Evolutivo>`. Origen: `…/Plan Nacional de Musica SIMUS/Historias de Usuario/HISTORIAS_DE_USUARIO_PNMC_AzureDevOps.csv`.
- **`activos/HISTORIAS_DE_USUARIO_PNMC_IMPORTAR_AzureDevOps.md`** — guía de importación con todos los pasos y gotchas. Cópiala como base del handoff; **ajusta los conteos y el proceso** al proyecto destino. Origen: `…/Historias de Usuario/HISTORIAS_DE_USUARIO_PNMC_IMPORTAR_AzureDevOps.md`.
- **`activos/HISTORIAS_DE_USUARIO_PNMC_AzureDevOps_variante-brechas.csv`** — variante (14 Epics + 59 PBIs) con **Description también en las Epics** y tags de análisis de brechas contra otro sistema: `posible solapamiento` / `diferenciador` / `capa: X`. Cópiala cuando el objetivo, además de cargar el backlog, sea cruzar cobertura contra una plataforma existente. Origen: CSV raíz `…/Plan Nacional de Musica SIMUS/HISTORIAS_DE_USUARIO_PNMC_AzureDevOps.csv`.

Qué adaptar en los tres: los códigos de épica (`E1…En`) y de historia (`HU-XXX-NN`), el `Work Item Type` según el proceso Azure, y el prefijo de proyecto en `Tags` (aquí `PNMC`).

## 4. Gotchas verificados

1. **Excel corrompe la codificación al guardar (tildes, ñ y el `·` de los títulos).** Excel en Windows guarda el CSV en **Windows-1252**, no en UTF-8, y rompe los caracteres acentuados y el separador `·` (U+00B7) que usan todos los títulos tipo `E2 · Identidad…` / `HU-AUT-01 · …`. Verificado: los tres CSV empiezan en bytes `22 49 44` (`"ID`) sin BOM `EF BB BF`. **Solución:** mantener UTF-8 sin BOM, **nunca** abrir con Excel antes de importar, editar solo con VS Code / Notepad++. Evidencia: guía §Notas importantes ("⚠️ Codificación: UTF-8 sin BOM"); ficha de errores PNMC #10.
2. **Los conteos de la guía de handoff se quedan desfasados respecto al CSV.** Verificado en la fuente: la guía `_IMPORTAR_AzureDevOps.md` afirma "14 Epics y 59 Product Backlog Items (73 work items + cabecera)", pero el CSV co-ubicado tiene **17 Epics y 62 PBIs (79 + cabecera)** — los números de la guía corresponden en realidad a la *variante-brechas* (CSV raíz), no al CSV que la acompaña. **Solución:** regenerar los conteos de la guía cada vez que cambie el CSV; contar con `grep -c '","Epic","'` y `grep -c '","Product Backlog Item","'` antes de entregar. Evidencia: discrepancia entre `Historias de Usuario/HISTORIAS_DE_USUARIO_PNMC_IMPORTAR_AzureDevOps.md` línea 14 y el `.csv` de la misma carpeta.
3. **Coexisten dos CSV con esquemas de tags distintos; no los mezcles.** El CSV raíz usa `posible solapamiento` / `diferenciador` (análisis de brechas) y **pone Description en las Epics**; el de la carpeta `Historias de Usuario/` usa `estado: …; prioridad: …; entrega: …` y deja las Epics sin Description. **Solución:** elegir UNA convención de tags por proyecto y mantenerla en todo el archivo, para que los filtros de Boards funcionen. Evidencia: `diff` entre los dos `HISTORIAS_DE_USUARIO_PNMC_AzureDevOps.csv` del proyecto.
4. **Poner ID, State o reordenar filas hace fallar (o desvirtuar) el import.** Con `ID` no vacío Azure busca actualizar en vez de crear; con `State` incompatible con el proceso el work item se rechaza; si intercalas o reordenas filas, el anidamiento por `Title 1`/`Title 2` se rompe y los PBIs cuelgan de la Epic equivocada. **Solución:** ID siempre vacío, no incluir columna State/Area/Iteration, no reordenar. Evidencia: guía §"Columnas omitidas a propósito (para que el import no falle)" y §"Jerarquía por columnas… no reordenes el archivo".
5. **Importar con el `Work Item Type` equivocado para el proceso rompe el alta.** `Product Backlog Item` solo existe en Scrum; en Agile es `User Story` y en CMMI `Requirement`. **Solución:** buscar/reemplazar el tipo antes de importar según el proceso del proyecto Azure destino. Evidencia: guía §Notas ("Proceso del proyecto = Scrum… Si tu proyecto usa Agile, reemplaza… En CMMI sería Requirement").

## 5. Criterios de done

- [ ] El CSV tiene exactamente la cabecera `"ID","Work Item Type","Title 1","Title 2","Description","Acceptance Criteria","Tags"` y una sola fila de cabecera.
- [ ] Toda Epic lleva su texto en `Title 1` con `Title 2` vacío; todo PBI lleva `Title 1` vacío y su texto en `Title 2`; el orden de filas refleja la jerarquía deseada.
- [ ] Columna `ID` vacía en todas las filas; **no** existen columnas `State`, `Area Path` ni `Iteration Path`.
- [ ] `Description` y `Acceptance Criteria` van en HTML (`<p>…</p>`); los Acceptance Criteria siguen Gherkin (Dado/Cuando/Entonces).
- [ ] `Tags` separados por `;` con una única convención en todo el archivo.
- [ ] `Work Item Type` coincide con el proceso del proyecto Azure destino (Scrum/Agile/CMMI).
- [ ] Archivo guardado en **UTF-8 sin BOM** (verificado: primeros bytes ≠ `EF BB BF`); **nunca abierto/guardado con Excel**; tildes, `ñ` y `·` intactos.
- [ ] Import de prueba en Azure DevOps muestra en la previsualización la jerarquía Epic → PBI correcta antes de pulsar Save.
- [ ] La guía de handoff `*_IMPORTAR_AzureDevOps.md` acompaña al CSV con pasos, proceso asumido y **conteos reales regenerados** (nº de Epics y PBIs coinciden con el CSV).

## Registro de uso
| Fecha | Proyecto | Tarea | Resultado | Lección |
|---|---|---|---|---|
| histórico | PNMC SIMUS | Uso original (fuente de esta skill): CSV importable con jerarquía Epic→PBI + guía de importación | ok | - |
