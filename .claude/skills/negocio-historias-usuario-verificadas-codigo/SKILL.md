---
name: negocio-historias-usuario-verificadas-codigo
regimen: universal
description: Escribe backlogs "honestos" de historias de usuario en formato INVEST + Gherkin cuyo estado (Implementado/Parcial/Propuesto) se verifica contra el código real (entidad + ToTable + endpoint), con MoSCoW, entrega MVP/Evolutivo, capa de acceso y tags de brechas. Cárgala cuando pidan redactar/actualizar historias de usuario, un backlog, épicas, criterios de aceptación, un análisis de brechas contra otro sistema, o preparar la importación a Azure DevOps.
---

# Historias de usuario verificadas contra el código

**Nivel actual:** N2 · **Dominio:** negocio (análisis-negocio) · **Agente(s):** `analista-negocio`
**Proyectos fuente:** PNMC SIMUS (Plan Nacional de Música)

> Criterio de ascenso a N1: los 5 bloques completos, con activos copiables de ruta real y gotchas verificados (no genéricos). A N2: ≥1 uso real aceptado por el Dueño. A N3: ≥3 usos exitosos en ≥2 proyectos + checklist propio.

## 1. Propósito

Producir un backlog que **no miente sobre el alcance**. El problema recurrente: la documentación funcional describe la plataforma como si todo estuviera hecho, y el cliente planea sprints (o presenta a un tercero) sobre funciones que en realidad no existen en el backend. Esta skill escribe cada historia con un campo **`Estado`** cuyo valor está verificado contra evidencia directa en el repositorio (entidad de dominio + mapeo a tabla + endpoint), de modo que "Implementado" signifique algo comprobable y no una aspiración.

Se carga cuando se pide: redactar o actualizar historias de usuario / épicas / criterios de aceptación; construir un backlog para Scrum/Azure DevOps; **fusionar** dos fuentes de backlog (lo ya construido + una propuesta del cliente); o preparar un **análisis de brechas** contra un sistema existente (en PNMC, el sistema SIMUS) para decidir por historia si se *Cubre / Reutiliza / Construye*.

Caso fuente real: `Historias de Usuario/HISTORIAS_DE_USUARIO_PNMC.md` — backlog v2 fusionado, **17 épicas y 62 historias**, sobre una plataforma .NET + React.

## 2. Procedimiento

**Formato de cada historia (obligatorio).** Título con la **capa de acceso** entre corchetes; una línea de metadatos; narrativa INVEST; criterios en Gherkin. Ejemplo real (HU-DAT-02):

```markdown
### HU-DAT-02 · Entidad transversal y relaciones entre procesos `[interno]`
**Estado PNMC:** Implementado · **Prioridad:** Must · **Entrega:** MVP
**Como** Gestor interno **quiero** vincular una organización con varios procesos **para** representar cómo actúan los actores en el ecosistema.
- **Dado** una entidad, **cuando** la relaciono con uno o más registros, **entonces** la relación queda persistida (tabla `EntidadesRelaciones` y endpoint `/process-relations`).
```

Convenciones fijas (respetarlas literalmente):
- **Capa de acceso** en el título: `[público]` / `[registrado]` / `[interno]` (o `[transversal]`, y transiciones como `[público]→[registrado]`).
- **Épica** ≈ *Epic*; **HU** ≈ *Product Backlog Item*. ID de historia `HU-XXX-NN` (XXX = mnemónico del dominio: DAT, AUT, MAP, MOD, GOB, IMP…).
- Metadatos por línea: `Estado · Prioridad (MoSCoW: Must/Should/Could/Won't) · Entrega (MVP/Evolutivo)`.
- Narrativa: *"Como [rol] quiero [objetivo] para [beneficio]"*. Roles del **glosario** (no inventar roles nuevos por historia).
- Criterios en **Gherkin** (Dado/Cuando/Entonces), incluyendo siempre el camino negativo/vacío (ej. "cuando ningún evento cumple, entonces se muestra un mensaje de vacío"; "credenciales inválidas → 401 sin revelar si el usuario existe").

**Paso a paso:**

1. **Reúne las dos fuentes.** (a) lo realmente construido (derivado del código) y (b) la propuesta de fortalecimiento del cliente/tercero. El backlog resultante es la **fusión** de ambas — decláralo en el encabezado del documento.

2. **Define el glosario de roles ANTES de escribir historias.** Mapea cada rol de negocio a su rol técnico real en el backend. Ejemplo verificado: "Actor del sector" no es un rol propio, hoy se apoya en el rol `externo`; "Aliado admin/editor/lector" están confinados a su `EntidadAliadaId`. Si un rol de negocio no tiene respaldo técnico, se anota como brecha, no como hecho.

3. **Verifica el estado de CADA historia contra el código.** Regla de decisión — la cadena de tres evidencias:
   - **Implementado** ⟺ existe (1) la **entidad** de dominio (clase `*Row` en `Rows.cs`) **+** (2) su **mapeo a tabla** (`entity.ToTable("Nombre")` en `PnmcDbContext.cs`) **+** (3) el **endpoint** que la expone (`MapPost/MapGet` en `*Endpoints.cs`). Los tres deben existir.
   - **Parcial** ⟺ existe la base (esquema/dato/endpoint) pero la cobertura funcional o de UI es limitada, o solo está descrita en documentación. Añade una línea `*Brecha:*` explicando qué falta.
   - **Propuesto** ⟺ aporte nuevo de la propuesta; **no se halló** en el backend. Añade una `*Nota:*` diciendo explícitamente que no existe hoy.
   - Cómo verificar en la práctica (comandos reales sobre el repo fuente):
     ```bash
     grep -n 'ToTable("EntidadesRelaciones")' pnmc-api/src/PNMC.Infrastructure/Data/PnmcDbContext.cs
     grep -rn "/process-relations" pnmc-api/src/PNMC.Api/Endpoints/
     ```
   Cita la evidencia dentro del criterio Gherkin, entre paréntesis: `(tabla EntidadesRelaciones y endpoint /process-relations)`.

4. **Pon la advertencia de honestidad en cabecera.** Texto verbatim del caso fuente: *"El `Estado` refleja la evidencia encontrada en el backend a la fecha. Los marcados Implementado/Parcial deben confirmarse en una demo conjunta; no certifican cobertura completa de interfaz, validaciones ni pruebas."* Nunca atribuir a la plataforma algo que el código no respalda.

5. **Etiqueta las brechas para el cruce con el sistema existente.** Tags por historia: `posible solapamiento` (lo que el otro sistema ya cubre — en PNMC: Mapa y Agenda, que SIMUS declaró tener), `diferenciador` (aporte propio), y `capa: público/registrado/interno`. El dictamen final (**Cubierta / Reutilizar / Construir**) lo cierra la mesa técnica, no el redactor: se deja el tag y una columna para que decidan.

6. **Cierra con las secciones de plantilla:** Resumen de estado (panorama por bloque), Anexo de transparencia (qué NO está listo para producción), Orden de implementación recomendado, y una **Definición de Terminado común** a todas las historias.

7. **Exporta a Azure DevOps** cuando lo pidan (ver activo CSV y su guía). Adapta el tipo de work item al proceso: Scrum → `Product Backlog Item`; Agile → `User Story`; CMMI → `Requirement`.

## 3. Activos copiables

Los tres activos están en `activos/` de esta skill (copiados del proyecto fuente `Plan Nacional de Musica SIMUS/Historias de Usuario/`):

- **`activos/HISTORIAS_DE_USUARIO_PNMC.md`** — la plantilla maestra: backlog v2 fusionado, 17 épicas / 62 historias, con la leyenda de `Estado`, el glosario de roles, el panorama, el anexo de transparencia, el orden de implementación y la Definición de Terminado. **Cuándo copiarlo:** al arrancar cualquier backlog. **Qué adaptar:** los IDs `HU-XXX-NN` al dominio del nuevo proyecto, el glosario de roles a su RBAC real, y re-verificar cada `Estado` contra el código del proyecto nuevo (no heredar los estados de PNMC).

- **`activos/HISTORIAS_DE_USUARIO_PNMC_AzureDevOps.csv`** — CSV importable que crea la jerarquía Epic → PBI en una sola pasada. Columnas: `ID, Work Item Type, Title 1, Title 2, Description, Acceptance Criteria, Tags`. `Title 1` = Epic, `Title 2` = PBI (el anidamiento se establece **solo** por esta indentación de columnas). `Description` y `Acceptance Criteria` van en HTML (`<p>…</p>`). `Tags` separados por `;` incluyen `estado:`, `prioridad:`, `entrega:`, `capa:` y el ID de épica/historia para filtrar el análisis de brechas. **Qué adaptar:** el contenido; mantener `ID` vacío y omitir `State`/`Area Path`/`Iteration Path`.

- **`activos/HISTORIAS_DE_USUARIO_PNMC_IMPORTAR_AzureDevOps.md`** — guía de importación con todos los gotchas (codificación, jerarquía, proceso Scrum/Agile/CMMI, filtros de tags para el cruce con SIMUS). **Cuándo copiarlo:** al entregar el CSV al cliente.

**Evidencia de la técnica de verificación** (no se copia, vive en el proyecto fuente `Entorno_Virtual_PNMC/pnmc-api/src/`): entidades en `PNMC.Domain/Entities/Rows.cs`, mapeos en `PNMC.Infrastructure/Data/PnmcDbContext.cs` (líneas con `.ToTable(...)`), endpoints en `PNMC.Api/Endpoints/*Endpoints.cs` (`AdminDataEndpoints.cs` concentra `/process-relations`, `/records/{moduleId}/bulk`, `/map/festivals`).

## 4. Gotchas verificados

Todos observados en PNMC SIMUS; evidencia entre paréntesis.

- **La documentación mentía sobre Habeas Data.** La doc describía el enmascaramiento de contacto en la capa pública como hecho, pero los endpoints públicos exponían correo y teléfono **sin enmascarar** (incumple Ley 1581/2012). Solución: HU-MAP-04 se marca honestamente `Propuesto — no implementado en el backend actual` y se prioriza como **Must** antes de exponer datos reales. Lección: cuando la doc dice "hecho", **abrir el endpoint y confirmar** antes de escribir "Implementado" (evidencia: `HISTORIAS_DE_USUARIO_PNMC.md` §HU-MAP-04 y §Anexo).

- **Los conteos entre activos se desincronizan.** La guía `HISTORIAS_DE_USUARIO_PNMC_IMPORTAR_AzureDevOps.md` afirma "14 Epics y 59 PBIs", pero el `.md` v2 y el CSV vigentes tienen **17 épicas y 62 historias** (verificado con `grep -c "^### HU-"`). El texto de la guía quedó del snapshot anterior. Lección: al actualizar el backlog, re-generar el CSV **y** corregir los conteos citados en la guía; no confiar en números escritos a mano.

- **Excel corrompe el CSV al guardarlo.** Excel en Windows guarda en Windows-1252 y destroza tildes, `ñ` y el carácter `·` de los títulos de épica. Solución: mantener **UTF-8 sin BOM**, editar solo con VS Code o Notepad++, nunca abrir/guardar con Excel antes de importar (evidencia: guía de importación, "Notas importantes").

- **La jerarquía Epic→PBI se rompe si reordenas filas.** La importación por CSV de Azure DevOps **no admite** otro tipo de vínculo padre-hijo: se establece únicamente por la indentación `Title 1`/`Title 2` y el orden de las filas. Reordenar el archivo desanida los PBIs. Además, dejar `ID` vacío y omitir `State`/`Area Path`/`Iteration Path` para que el import cree work items nuevos sin fallar (evidencia: guía de importación).

- **Un rol de negocio sin respaldo técnico.** "Actor del sector" se pidió como perfil diferenciado, pero en el backend se apoyaba en el rol genérico `externo`. Se documentó como HU-AUT-05/HU-SEC-01 en estado **Parcial** con `*Brecha:* falta formalizar su perfil y permisos diferenciados`, en vez de fingir que el rol existía (evidencia: `HISTORIAS_DE_USUARIO_PNMC.md` §HU-AUT-05).

- **Credenciales demo desfasadas de la doc.** La documentación heredada decía contraseñas tipo `pnmc-master`, pero el código sembraba `admin`. Lección transversal a esta skill: verificar contra el código, nunca contra docs heredadas (evidencia: `CORREO_DESPLIEGUE_PNMC.md`, corrección en Blueprint).

## 5. Criterios de done

- [ ] Cada historia tiene: capa de acceso en el título, línea de metadatos (`Estado · Prioridad MoSCoW · Entrega MVP/Evolutivo`), narrativa INVEST y ≥1 criterio Gherkin **incluyendo el camino negativo/vacío**.
- [ ] Cada `Estado: Implementado` está respaldado por la cadena verificada **entidad + ToTable + endpoint**, citada en el criterio. Ningún "Implementado" sin evidencia en código.
- [ ] Todo `Parcial` lleva línea `*Brecha:*`; todo `Propuesto` lleva `*Nota:*` diciendo que no existe hoy.
- [ ] La cabecera incluye la advertencia de honestidad ("deben confirmarse en demo conjunta") y el documento declara que es una **fusión** de las dos fuentes.
- [ ] Existe glosario de roles con el mapeo negocio→rol técnico real (RBAC del backend).
- [ ] Cierre con: Resumen de estado (panorama), Anexo de transparencia (qué no está listo), Orden de implementación y Definición de Terminado común.
- [ ] Tags de brechas (`posible solapamiento`/`diferenciador`/`capa:`) presentes para el cruce; el dictamen Cubierta/Reutilizar/Construir queda como decisión de la mesa, no cerrado por el redactor.
- [ ] Si hay export a Azure DevOps: CSV en UTF-8 sin BOM, jerarquía por `Title 1/Title 2`, `ID` vacío, `State`/`Area Path`/`Iteration Path` omitidos, tipo de work item acorde al proceso (Scrum/Agile/CMMI), y conteos de la guía cuadrados con el CSV real.

## Registro de uso
| Fecha | Proyecto | Tarea | Resultado | Lección |
|---|---|---|---|---|
| histórico | PNMC SIMUS | Uso original (fuente de esta skill): backlog v2 fusionado de 17 épicas / 62 historias con Estado verificado contra código y export a Azure DevOps | ok | - |
