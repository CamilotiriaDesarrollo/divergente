---
name: ux-arquitectura-informacion-portales
regimen: universal
description: Reorganiza la capa de contenidos de portales gubernamentales sobrecargados produciendo 3 propuestas de arquitectura de información comparables (por intención del usuario, por públicos, por tipo de contenido) y su implementación como vitrina buscable con chips de filtro tema/público. Cárgala cuando haya que diagnosticar una landing/portal estatal con decenas de sistemas sueltos, agrupar o dar taxonomía a sistemas de información, decidir el menú/estructura de una capa de entrada, o implementar filtros de tema/público/búsqueda sobre un catálogo institucional.
---

> **Régimen: universal.** El encuadre de «portal estatal», «ciudadanía/funcionarios», «lógica institucional» y los ejemplos del Ministerio de las Culturas (32 sistemas, GOV.UK/España es Cultura) aplican SOLO en proyectos `institucional`. El MÉTODO —inventario verificado → 3 propuestas comparables → decisión fechada → taxonomía tipada → vitrina buscable con chips— es régimen-neutral: en un proyecto `divergente` consérvalo tal cual y sustituye los públicos, el catálogo y las referencias de gobierno por los de tu producto (línea privada Vercel/Node/Postgres).

# UX — Arquitectura de información para portales

**Nivel actual:** N3 · **Dominio:** ux · **Agente(s):** disenador-uiux
**Proyectos fuente:** Plataformas Ministerio (`002 INTERFASE/`) · Portal ISI (`Interfase Pagina Inicial/`)

> Criterio de ascenso a N1: los 5 bloques completos, con activos copiables de ruta real y gotchas verificados (no genéricos). A N2: ≥1 uso real aceptado por el Dueño. A N3: ≥3 usos exitosos en ≥2 proyectos + checklist propio.

## 1. Propósito

Resuelve el problema de una **capa de entrada sobrecargada**: un portal estatal que lista decenas de sistemas por lógica institucional (orden alfabético, por dependencia, con siglas crudas y duplicados portal+app), donde el ciudadano no encuentra nada. El método no elige una estructura "a ojo": produce **3 propuestas de arquitectura de información comparables** —la misma lista de sistemas redistribuida de tres formas— para que el Dueño decida con evidencia, y luego baja la decisión a una **vitrina buscable con chips de filtro** accesible AA.

Se carga cuando la tarea es: diagnosticar/reorganizar la landing de un portal gubernamental, agrupar un inventario de sistemas de información, definir la taxonomía/menú de una capa de contenidos, o implementar filtros por tema/público/búsqueda sobre un catálogo. Caso base real: los 32 sistemas del Ministerio de las Culturas de Colombia.

## 2. Procedimiento

1. **Inventariar y verificar.** Parte de un inventario en Excel con una hoja de verificación (en el caso base, `Plataformas_MinCulturas_Verificado.xlsx`, hoja "5. Operativas Confirmadas"). **Solo entran las plataformas verificadas técnicamente Y confirmadas operativas por el equipo** (32 en el caso base). No vuelques el inventario crudo.

2. **Diagnosticar la capa actual.** Documenta cómo está hoy (lista alfabética / por dependencia institucional) y sus problemas: duplicados aparentes (portal + app del mismo trámite), siglas sin traducir, ítems de uso interno mezclados con los ciudadanos. Esto es la sección "Capa actual" del entregable.

3. **Producir 3 propuestas comparables** — la clave del método es que las tres redistribuyen **la misma lista**, para que sean comparables:
   - **P1 · Por intención del usuario ("¿Qué quiero hacer?")**: grupos con verbos —Explorar/conocer, Participar y crear, Investigar y consultar. Parte de la motivación del ciudadano, no de la lógica institucional.
   - **P2 · Por públicos de interés**: Ciudadanía general, Creadores y gestores, Investigadores y funcionarios *(públicos de ejemplo del caso institucional; en un proyecto divergente usa los públicos de tu producto —p. ej. visitantes, clientes, administradores)*.
   - **P3 · Por tipo de contenido/servicio**: Datos y estadísticas, Memoria y patrimonio, Creación y formación, Difusión y acceso público.
   - **Criterio de carga cognitiva**: máximo ~5 grupos visibles al primer nivel; si sobran, agrupa el resto en "Otros". Cada propuesta lleva su **justificación** (por qué reduce la carga cognitiva) y un **mockup navegable**.

4. **Cerrar con documento de decisión fechado.** El Dueño elige; se registra en un `direccion-visual.md` con fecha, dirección elegida, referencias guía, reglas verificables numeradas y el "alcance de datos". Ese documento pasa a ser la fuente de verdad de la fase de implementación (ver activo).

5. **Bajar la decisión a taxonomía tipada.** Modela el catálogo como módulo TypeScript con tipos union estrictos —en el caso base `Tema`, `Acceso`, `Publico`, `Tipo`— y metadatos centralizados en `Record` (`temaMeta`, `accesoLabel`, `publicoLabel`). Cada sistema lleva `marca` (sigla, subtítulo discreto) y `nombre` (humanizado, titular).

6. **Implementar la vitrina.** Buscador transversal + dos filas de **chips de filtro** (tema · público) + contador de resultados. Los chips usan `aria-pressed`, el contador `aria-live="polite"`, y la búsqueda es **insensible a tildes** (`filtrarSistemas`). Un sistema puede pertenecer a varios públicos (`publico: Publico[]`), y el filtro comprueba pertenencia, no igualdad.

**Criterios de decisión rápidos:**
- ¿Un sistema es de uso interno? No lo ocultes: etiquétalo con público `funcionarios` para que el filtro lo separe de la experiencia ciudadana sin borrarlo del catálogo.
- ¿Dos entradas parecen el mismo sistema (portal + app)? No las fusiones: diferéncialas por `tipo` (`portal` vs `sistema`) y por `acceso`. Son puertas distintas para el usuario.
- ¿La tarjeta muestra una sigla? Regla "cero siglas en la fachada": el titular es el nombre humanizado; la sigla queda de subtítulo.

## 3. Activos copiables

Todos en `activos/` de esta skill (copiados de los proyectos fuente):

- **`activos/plantilla-3-propuestas.md`** — plantilla del entregable de arquitectura de información: objetivo → diagnóstico de la capa actual → las 3 propuestas comparables con distribución + justificación. **Origen:** extraída de `Plataformas Ministerio/002 INTERFASE/Propuesta Sistemas de información.pptx.pdf` (el PDF pesa 1.7 MB, no se copia; esta plantilla reproduce su esqueleto). Cópiala al arrancar el diagnóstico y rellena los `<marcadores>`.

- **`activos/direccion-visual.md`** — documento de decisión de diseño para **cerrar la fase**: dirección elegida, referencias, reglas verificables numeradas y "alcance de datos". **Origen:** `Interfase Pagina Inicial/docs/direccion-visual.md`. Cópialo para registrar la propuesta ganadora; adapta las reglas y el color por tema.

- **`activos/sistemas.ts`** — modelo de catálogo tipado (`Tema`/`Acceso`/`Publico`/`Tipo`, `SistemaOperativo`, `TemaMeta`), metadatos en `Record` y `filtrarSistemas()` con normalización de diacríticos. **Origen:** `Interfase Pagina Inicial/client/src/data/sistemas.ts`. Reemplaza el array `sistemas[]` por tu inventario; conserva los tipos y la función de filtro.

- **`activos/VitrinaSistemas.tsx`** — componente de vitrina: buscador + chips de tema + chips de público + contador `aria-live`, con estado vacío y botón "Limpiar filtros". **Origen:** `Interfase Pagina Inicial/client/src/components/VitrinaSistemas.tsx`. Ajusta el título y el componente de resultados (aquí renderiza `ConstelacionSistemas`; puedes cambiarlo por una rejilla de tarjetas).

- **`activos/vitrina-chips.css`** — estilos de los chips y el contador (píldoras, estado `--activo` = `aria-pressed`, foco visible, punto de color por tema `--chip-c`). **Origen:** `Interfase Pagina Inicial/client/src/index.css` (líneas 3310-3356).

## 4. Gotchas verificados

- **Ítems internos ocultos rompen el inventario.** Tentación: quitar del portal ciudadano los sistemas de funcionarios (evaluaciones, gestión documental). Solución aplicada: **no ocultarlos, etiquetarlos con público `funcionarios`** para que el filtro de público los separe. Evidencia: `docs/direccion-visual.md` ("Alcance de datos") y `sistemas.ts` — `evaluacion-concertacion`, `evaluacion-estimulos`, `az-digital`, `pqrs`, `siempre` llevan `publico: ['funcionarios']`.

- **Fusionar "duplicados" que no lo son.** El inventario tiene pares que parecen repetidos pero son puertas distintas: `pulep-portal` (información, `tipo: 'portal'`) vs `pulepapp` (trámite, `tipo: 'sistema'`); `portal-sidanza` vs `sidanza`; `cine-proyecto` vs `cine-producto`. Fusionarlos pierde la distinción que el usuario necesita. Solución: distinguir por `tipo` y `acceso`, no unificar. Evidencia: `sistemas.ts` (esos pares con distinto `tipo`/`acceso`).

- **Búsqueda que no encuentra por culpa de las tildes.** Sin normalizar, buscar "maguare" no encuentra "Maguaré", y "informacion" no encuentra "información". Solución: `normaliza()` con `normalize('NFD').replace(/[̀-ͯ]/g,'').toLowerCase()` aplicado a query y al "heno" (nombre + marca + descripción + label de tema). Evidencia: `sistemas.ts` líneas 385-403 (`RANGO_DIACRITICOS`, `normaliza`, `filtrarSistemas`).

- **Siglas en la fachada dejan al ciudadano sin pistas.** "SIARTES" no le dice nada a un ciudadano. Regla "cero siglas en la fachada": el titular de la tarjeta es el nombre humanizado ("Catálogo de las Artes") y la sigla va de subtítulo (`marca`). Inspirado en España es Cultura y GOV.UK. Evidencia: `docs/direccion-visual.md` regla 5; en `sistemas.ts`, `marca: 'SIARTES'` / `nombre: 'Catálogo de las Artes'`.

- **Volcar el inventario crudo en vez del verificado.** No todo lo que aparece en un Excel de sistemas está operativo. Solución: alimentar el portal **solo con la hoja de plataformas confirmadas operativas** (32 en el caso base), no con el listado completo. Evidencia: `docs/direccion-visual.md` ("Alcance de datos": hoja 5) y cabecera de `sistemas.ts`.

## 5. Criterios de done

- [ ] Existe el entregable con las **3 propuestas comparables** (P1 intención, P2 públicos, P3 tipo), cada una con distribución + justificación de carga cognitiva; ninguna con más de ~5 grupos al primer nivel (excedente en "Otros").
- [ ] Las tres propuestas reparten **la misma lista** de sistemas (verificable: los sistemas de P1 = P2 = P3, solo cambia el agrupamiento).
- [ ] La lista sale de un **inventario verificado** (solo plataformas confirmadas operativas), no del listado crudo.
- [ ] Decisión cerrada en un `direccion-visual.md` **fechado** con reglas numeradas y "alcance de datos".
- [ ] Ninguna tarjeta muestra una sigla como titular (regla "cero siglas": `nombre` humanizado, `marca` como subtítulo).
- [ ] Los ítems internos existen en el catálogo con público `funcionarios` (no eliminados) *(solo si el proyecto es institucional; en divergente, el público interno equivalente —admin/staff— con el mismo criterio de no ocultar)*.
- [ ] La vitrina filtra por tema y por público con chips `aria-pressed`, el contador usa `aria-live="polite"`, y la búsqueda encuentra con y sin tildes.
- [ ] Un sistema con varios públicos aparece al filtrar por cualquiera de ellos (filtro por pertenencia, no igualdad).

## Registro de uso
| Fecha | Proyecto | Tarea | Resultado | Lección |
|---|---|---|---|---|
| histórico | Plataformas Ministerio | uso original (fuente de esta skill) | ok | - |
| histórico | Portal ISI | uso original (fuente de esta skill) | ok | - |
