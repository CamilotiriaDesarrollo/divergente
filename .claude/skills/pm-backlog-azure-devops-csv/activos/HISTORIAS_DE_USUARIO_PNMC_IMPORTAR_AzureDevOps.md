# Guía de importación a Azure DevOps — Historias de Usuario PNMC

Archivo a importar: **`HISTORIAS_DE_USUARIO_PNMC_AzureDevOps.csv`**
Documento legible de referencia (mismo contenido): `HISTORIAS_DE_USUARIO_PNMC.md`

## Pasos para importar

1. En Azure DevOps, ve a **Boards → Work Items** (o **Backlogs**).
2. Abre el menú **⋮ (acciones) → Import Work Items**.
3. Selecciona el archivo `HISTORIAS_DE_USUARIO_PNMC_AzureDevOps.csv`.
4. Revisa la previsualización y pulsa **Import**.
5. Verifica que la jerarquía Epic → Product Backlog Item se vea correcta y pulsa **Save** (guardado masivo).

> El CSV crea **14 Epics** y **59 Product Backlog Items** anidados (73 work items + cabecera).

## Notas importantes

- **Proceso del proyecto = Scrum.** El CSV usa los tipos `Epic` y `Product Backlog Item`. Si tu proyecto usa el proceso **Agile**, reemplaza en el CSV `Product Backlog Item` por `User Story` (buscar/reemplazar) antes de importar. En **CMMI** sería `Requirement`.
- **Jerarquía por columnas.** `Title 1` = Epic, `Title 2` = Product Backlog Item. El importador anida cada PBI bajo la Epic de las filas anteriores; **no reordenes el archivo**. (La importación por CSV no admite otros tipos de vínculo: la relación padre-hijo se establece solo por esta indentación de columnas — [doc oficial de Microsoft](https://learn.microsoft.com/en-us/azure/devops/boards/queries/import-work-items-from-csv).)
- **⚠️ Codificación: UTF-8 sin BOM.** El archivo ya está guardado así. **No lo abras ni lo guardes con Excel** antes de importar: Excel en Windows tiende a guardarlo en Windows-1252 y **corrompe** tildes, `ñ` y el carácter `·` de los títulos. Si necesitas editarlo, usa **VS Code** o **Notepad++** y guarda como *UTF-8 (sin BOM)*.
- **Campos `Description` y `Acceptance Criteria`** vienen en HTML (envueltos en `<p>…</p>`); Azure los renderiza como texto enriquecido.
- **Columnas omitidas a propósito** (para que el import no falle):
  - `ID` va vacía → cada fila se crea como work item **nuevo**.
  - No se incluye `State` → se asigna el estado inicial **New** (recomendación oficial para altas).
  - No se incluye `Area Path` / `Iteration Path` → se asignan al **nodo raíz** del proyecto. Reasígnalos después si lo necesitas.

## Para el análisis de brechas con SIMUS

Cada work item trae **Tags** que facilitan el cruce. Filtra en Boards por:

- `posible solapamiento` → candidatas a estar ya cubiertas por SIMUS (incluye todo el Mapa **E2** y la Agenda **E4**).
- `diferenciador` → aportes propios de Divergente (CMS, moderación/auditoría, aliados, datos vivos, Habeas Data).
- `capa: público` / `capa: registrado` / `capa: interno` → la capa de acceso.
- `E1`…`E14` → la épica; `HU-XXX-NN` → el identificador de cada historia.

Sugerencia: agreguen un campo/tag de dictamen (`cubierta` / `parcial` / `nueva`) al revisar, para consolidar la matriz de brechas.
