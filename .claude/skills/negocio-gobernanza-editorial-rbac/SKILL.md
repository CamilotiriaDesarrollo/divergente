---
name: negocio-gobernanza-editorial-rbac
regimen: universal
description: Modela la gobernanza de contenidos de plataformas publicas — flujo editorial de 7 estados validado en backend, RBAC de 6 roles con confinamiento multi-tenant por EntidadAliadaId, auditoria inmutable por transicion y enmascaramiento Habeas Data (DTO publico vs administrativo). Cargala al especificar/revisar moderacion de contenido, permisos por rol, colas de revision, auditoria de cambios, deteccion de duplicados o exposicion de datos personales en APIs publicas.
---

> **Régimen: universal.** Las referencias a normativa estatal (M-GSI-002, DI-GSI-010, ITIL, GOV.CO, «entidad pública») aplican SOLO en proyectos `institucional`; en un proyecto `divergente` ignóralas y usa la variante de la línea privada (Vercel/Node/Postgres). El enmascaramiento Habeas Data (Ley 1581/2012) NO es de régimen: aplica a AMBOS.

# Gobernanza editorial y RBAC para plataformas publicas

**Nivel actual:** N2 · **Dominio:** negocio (Analisis de Negocio) · **Agente(s):** `analista-negocio`
**Proyectos fuente:** PNMC SIMUS (Plan Nacional de Musica para la Convivencia — Ministerio de las Culturas de Colombia)

> Criterio de ascenso a N1: los 5 bloques completos, con activos copiables de ruta real y gotchas verificados. A N2: ≥1 uso real aceptado por el Dueño. A N3: ≥3 usos exitosos en ≥2 proyectos + checklist propio.

## 1. Proposito

Resuelve el diseño funcional de la **gobernanza de contenidos** de una plataforma publica donde ciudadanos, entidades aliadas y personal de la entidad estatal cargan, revisan y publican informacion sensible. Cubre cuatro piezas que siempre aparecen juntas y suelen especificarse mal:

1. **Flujo editorial de 7 estados** con transiciones validadas SOLO en backend.
2. **RBAC de 6 roles** con confinamiento multi-tenant por `EntidadAliadaId`.
3. **Auditoria inmutable** (INSERT-only) de cada transicion.
4. **Enmascaramiento Habeas Data** (Ley 1581/2012): DTO publico enmascarado vs DTO administrativo crudo.

Se carga cuando la tarea menciona: moderacion, cola de revision, aprobar/rechazar/solicitar-ajustes, permisos por rol, "quien puede ver/hacer que", multi-tenant/entidades aliadas, auditoria/trazabilidad de cambios, deteccion de duplicados, banderas de calidad, registros huerfanos/reclamacion, o exposicion de correos/telefonos en endpoints publicos.

**Regla transversal inviolable:** la autorizacion real vive en el backend y en los roles persistidos en SQL; **nunca** se delega al frontend (el backend responde 403 aunque la UI muestre el boton). Fuente: `Entorno_Virtual_PNMC/CLAUDE.md` §Reglas de negocio transversales.

## 2. Procedimiento

**Paso 1 — Fijar el vocabulario de estados como catalogo, no como enum suelto.**
Los 7 estados editoriales del PNMC: `borrador` → `en_revision` → `ajustes_solicitados` | `aprobado` → `publicado` | `rechazado` | `archivado`.
- `ajustes_solicitados` es un **estado propio**: el moderador encontro campos erroneos y el registro vuelve al colaborador. **No normalizarlo a `en_revision`** (regla inviolable del proyecto; ver Gotcha 4.1).
- Persistir los codigos en minusculas y sin espacios (CHECK `CodigoEstado = LOWER(...) AND NOT LIKE '% %'`).
- Guardar el catalogo en tabla (`EstadosContenido`) y validar contra ella; no hardcodear listas paralelas en cada endpoint.

**Paso 2 — Definir el grafo de transiciones permitidas y ubicarlo en backend.**
Solo estas transiciones son legales (todo lo demas se rechaza):
`borrador→en_revision`; `en_revision→{ajustes_solicitados|aprobado|rechazado}`; `ajustes_solicitados→en_revision`; `aprobado→publicado`; `publicado→archivado`.
Criterio de decision por rol (funcion `CanSetRecordStatus`): `webmaster` puede fijar cualquier estado conocido (salto administrativo, igual auditado); `gestor_interno` solo `ajustes_solicitados|aprobado|rechazado`; aliados y `externo` **no** cambian estado editorial. Ver activo `flujo-editorial-maquina-estados.cs`.
Prueba de aceptacion obligatoria: "Dado un registro en `borrador`, cuando se intenta publicar sin pasar por revision, entonces el backend rechaza la transicion y el estado permanece" (HU-MOD-01).

**Paso 3 — Modelar el RBAC de 6 roles con su matriz de permisos.**
Roles: `webmaster` (admin total, CMS, logs), `gestor_interno` (moderacion/calidad del Ministerio), `aliado_admin`, `aliado_editor`, `aliado_lector` (entidad aliada, confinados a su `EntidadAliadaId`), `externo` (ciudadano/gestor territorial). No-registrado = Publico.
- Homologar rol tecnico (DB) ↔ rol funcional (UI) ↔ consola (`/admin` vs `/colaboradores`) en una tabla unica para evitar discrepancias.
- Producir la **matriz de permisos** accion×rol (ver `manual_roles.md` §3). Cada fila es una prueba.
- Roles historicos (p. ej. `admin_entidad`, `colaborador_editor`) se migran por SQL incremental y **no se usan en codigo nuevo**.

**Paso 4 — Especificar el confinamiento multi-tenant.**
Todo aliado queda atado a su `EntidadAliadaId` (tabla `UsuariosEntidadesAliadas`). El backend filtra cada consulta por ese id (y opcionalmente por `MunicipiosAsignados` de su convenio). Criterio: un aliado NUNCA ve registros de otra entidad; la validacion se hace con el claim inyectado al login, no con un parametro que envie el cliente. Ver pseudocodigo en `convenios_y_privilegios.md` §3.1.

**Paso 5 — Diseñar la auditoria inmutable.**
Cada transicion administrativa escribe una fila INSERT-only en `RegistrosRevisionHistorial` con: modulo, registro, estado anterior, estado nuevo, accion, comentario, motivo de rechazo, campos observados (JSON), autor y fecha UTC. Nunca UPDATE/DELETE. Por exigencia de seguridad estatal *(solo si el proyecto es institucional)*, dejar el campo `MetadataJson` (o columnas dedicadas) preparado para **IP origen + hash por evento** (en `divergente` el IP+hash sigue siendo buena práctica de auditoría, no una obligación normativa). Ver activo `gobernanza-tablas.sql`.

**Paso 6 — Definir dos vistas de datos por Habeas Data (Ley 1581/2012).**
Dos DTOs desde el mismo registro: **publico enmascarado** (oculta nombres de directores, correos, telefonos, direcciones) y **administrativo crudo** (para roles con privilegio dentro de su red). El transformador de enmascaramiento corre en backend antes de serializar el JSON (`"Carlos Andres Mendoza"` → `"C***** A***** M******"`; `"3157890123"` → `"315*******"`). Ver `convenios_y_privilegios.md` §3.2. Datos de caracter publico (nombre de escuela, municipio, especialidades, coordenadas) siempre visibles; datos de contacto siempre enmascarados al publico.

**Paso 7 — Añadir la gobernanza de calidad de datos (si el alcance lo pide).**
Tres colas con revision humana (nada se aplica automatico): candidatos a **duplicado** con puntaje y nivel (`RegistrosDuplicadosCandidatos`, decision `fusionar|mantener_separados|no_duplicado`), **banderas de calidad** con severidad (`RegistrosCalidadDatos`, `baja|media|alta`), y **registros huerfanos/reclamacion territorial** (motor que cruza el municipio DIVIPOLA del colaborador con registros historicos `UsuarioCreadorId IS NULL`). Ver `motor_reclamaciones.md` para el flujo completo de 6 fases y las dos lineas de estado (editorial vs vinculacion).

**Paso 8 — Marcar el estado real de cada capacidad (honestidad de alcance).**
Al escribir historias, etiquetar cada una como Implementado/Parcial/Propuesto verificado contra el codigo. Ejemplo real: el enmascaramiento Habeas Data estaba documentado como hecho pero era `Propuesto — no implementado` (ver Gotcha 4.3). No atribuir a la plataforma lo que no hace.

## 3. Activos copiables

Todos en `activos/` de esta skill (copiados de PNMC SIMUS; rutas de origen anotadas dentro de cada archivo):

- **`manual_roles.md`** — Manual RBAC completo: homologacion rol DB↔UI↔consola, responsabilidades por rol y **matriz de permisos accion×rol**. Copialo como plantilla del documento de gobernanza de acceso; adapta nombres de roles y filas de la matriz. Origen: `Entorno_Virtual_PNMC/docs/gobernanza/manual_roles.md`.
- **`convenios_y_privilegios.md`** — Marco Habeas Data, matriz de visualizacion/enmascaramiento por tipo de dato×rol, pseudocodigo de autorizacion en el endpoint y ejemplos de enmascaramiento. Cuando el proyecto exponga datos personales en APIs publicas. Origen: `docs/gobernanza/convenios_y_privilegios.md`.
- **`motor_reclamaciones.md`** — Flujo de reclamacion de registros huerfanos (6 fases) y la separacion de **dos lineas de estado**: editorial (publicacion) vs vinculacion (propiedad). Cuando exista un stock historico de datos sin dueño. Origen: `docs/gobernanza/motor_reclamaciones.md`.
- **`flujo-editorial-maquina-estados.cs`** — Extracto verificado (no el archivo de 144 KB) del endpoint de cambio de estado + guardas de rol (`CanSetRecordStatus`, `IsValidStatusTransition`) + escritura de historial inmutable. Plantilla de la maquina de estados en .NET Minimal APIs. Origen: `pnmc-api/src/PNMC.Api/Endpoints/AdminDataEndpoints.cs` (l.553-579, 1859-1925, 2000-2030).
- **`gobernanza-tablas.sql`** — DDL idempotente de `EstadosContenido`, `RegistrosRevisionHistorial` (auditoria INSERT-only con CHECK de los 7 estados), `RegistrosDuplicadosCandidatos`, `RegistrosCalidadDatos`, `UsuariosEntidadesAliadas` + el gotcha CHECK/sp_rename. Origen: `pnmc-database/schema/V20260519_02`, `V20260525_01`, `V20260525_04`, `V20260525_02`.

Referencia adicional (no copiada): historias E12-E14 en `Plan Nacional de Musica SIMUS/Historias de Usuario/HISTORIAS_DE_USUARIO_PNMC.md` — formato de HU de gobernanza (INVEST + Gherkin + Estado PNMC verificado).

## 4. Gotchas verificados

**4.1 `ajustes_solicitados` normalizado a `en_revision` rompe el flujo.**
Es un estado con semantica propia (el colaborador debe corregir, no es una revision en curso). Si se colapsa, se pierde la distincion y la notificacion "tu registro necesita ajustes". El proyecto lo declara regla inviolable en `Entorno_Virtual_PNMC/CLAUDE.md` §Reglas de negocio: *"`ajustes_solicitados` es un estado propio; no normalizarlo a `en_revision`"*. La maquina de estados solo permite `ajustes_solicitados→en_revision` (el usuario reenvia), nunca al reves automatico.

**4.2 Autorizacion delegada al frontend = fuga de datos.**
La tentacion es ocultar botones en la UI y confiar en eso. El PNMC lo resuelve en backend: `CanSetRecordStatus` devuelve 403 aunque la UI lo permita, y el enmascaramiento se aplica en la capa .NET "nunca en el frontend, garantizando seguridad absoluta ante ataques de inspeccion de consola" (`convenios_y_privilegios.md` §3). Especifica siempre la validacion como responsabilidad del endpoint.

**4.3 Documentar como "hecho" un enmascaramiento que no existe.**
Los endpoints publicos del mapa exponian correo y telefono sin enmascarar pese a que la documentacion lo describia como implementado — incumplimiento de Habeas Data. La correccion fue marcar la HU-MAP-04 honestamente como `Propuesto — no implementado` y priorizarla como Must antes de exponer datos reales. Evidencia: `HISTORIAS_DE_USUARIO_PNMC.md` (l.56, l.283) y erroresYSoluciones de la ficha. Leccion: verifica el enmascaramiento contra el codigo/DTO real, no contra la doc heredada.

**4.4 `sp_rename` sobre una columna con CHECK vigente falla en SQL Server 2016.**
El script de roles/aliados fallaba al renombrar `RolEnEntidad`→`RolAliado` porque un CHECK con los valores viejos seguia activo. Solucion (idempotente): 1) DROP del CHECK heredado, 2) `sp_rename` de la columna, 3) UPDATE de valores, 4) recrear el CHECK con el vocabulario nuevo. Evidencia comentada en el propio script: `pnmc-database/schema/V20260525_02__roles_finales_y_aliados.sql` (l.91-127), replicada en `gobernanza-tablas.sql`. Referida tambien en `CORREO_DESPLIEGUE_PNMC.md` §7b.

**4.5 El seed de la consola de moderacion falla si el bootstrap no crea los 6 usuarios.**
El seed 07 (`V20260519_07__datos_moderacion_consola.sql`) referencia `IdUsuario` 4-7, pero el backend solo creaba 2 de los 6 usuarios base en instalaciones nuevas → la cola de moderacion quedaba vacia/rota. Solucion: `Database__SeedBootstrapUsers=true` crea los 6 usuarios al arrancar. Al diseñar el RBAC, documenta explicitamente la dependencia entre el bootstrap de usuarios y los seeds que referencian sus ids. Evidencia: erroresYSoluciones de la ficha; `CORREO_DESPLIEGUE_PNMC.md` §7a.

**4.6 Confundir la linea de estado editorial con la de vinculacion.**
Son dos ciclos independientes: editorial (calidad/publicacion: `borrador…publicado`) y vinculacion/reclamacion (propiedad juridica: `sin responsable`/`posible coincidencia`/`reclamacion_en_revision`/`vinculacion_aprobada`). Mezclarlos genera colisiones (un registro puede estar `publicado` y a la vez con vinculacion pendiente). Mantenlas separadas como en `motor_reclamaciones.md` §3.

## 5. Criterios de done

- [ ] Los estados viven en un catalogo (`EstadosContenido`), no en enums duplicados; codigos en minuscula sin espacios.
- [ ] Existe el grafo explicito de transiciones permitidas y una prueba de que una transicion ilegal (p. ej. `borrador→publicado`) es **rechazada por backend con el estado intacto**.
- [ ] `ajustes_solicitados` figura como estado propio; ninguna regla lo colapsa a `en_revision`.
- [ ] Matriz de permisos accion×rol para los 6 roles, con homologacion DB↔UI↔consola; roles historicos marcados como no-usar.
- [ ] Todo aliado esta confinado a su `EntidadAliadaId` y la validacion usa el claim del token, no un parametro del cliente.
- [ ] Cada transicion escribe fila INSERT-only en la tabla de auditoria (estado previo/nuevo, accion, autor, fecha UTC); campo listo para IP + hash.
- [ ] Los endpoints publicos entregan DTO enmascarado; el DTO crudo solo a roles privilegiados dentro de su red. Verificado contra el codigo, no la doc.
- [ ] Colas de duplicados y banderas de calidad no aplican nada sin confirmacion humana (decision registrada).
- [ ] Cada capacidad esta etiquetada Implementado/Parcial/Propuesto verificada contra codigo (sin inflar alcance).
- [ ] `seguridad-appsec` reviso la especificacion (toca roles, autenticacion y datos personales — regla inviolable 1 de la fabrica).

## Registro de uso
| Fecha | Proyecto | Tarea | Resultado | Lección |
|---|---|---|---|---|
| histórico | PNMC SIMUS | uso original (fuente de esta skill) | ok | - |
