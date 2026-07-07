# Historias de Usuario — Plataforma PNMC (backlog fusionado v2)

**Propósito.** Backlog unificado de la plataforma PNMC (prototipo de Divergente) que **fusiona**: (a) las historias derivadas de lo realmente construido y (b) la propuesta de fortalecimiento del equipo de SIMUS (gestión estructural, mapa relacional, roles diferenciados, importación masiva e interoperabilidad por IDs). Sirve como **base para el análisis de brechas** y la planeación de sprints (Scrum/Azure DevOps) del sistema fusionado.

**Cambio clave de esta v2:** cada historia indica su **Estado en PNMC**, verificado contra el código (entidades, esquema SQL y endpoints), para no atribuir a la plataforma cosas que no hace.

---

## Cómo leer este documento (metodología)

- **Épica** ≈ *Epic* en Azure Boards · **Historia (HU)** ≈ *Product Backlog Item*, en formato *"Como [rol] quiero [objetivo] para [beneficio]"* (INVEST) · **Criterios** en **Gherkin** (Dado/Cuando/Entonces).
- Cada HU trae una línea de metadatos: **`Estado PNMC` · `Prioridad` (MoSCoW) · `Entrega` (MVP/Evolutivo)`**, y la **capa de acceso** en el título: `[público]` / `[registrado]` / `[interno]`.

**Leyenda de `Estado PNMC`** (lo más importante de esta versión):

| Estado | Significado |
| --- | --- |
| **Implementado** | Hay evidencia directa en el código: entidad + tabla (`ToTable`) + endpoint. |
| **Parcial** | Existe la base (esquema/datos/endpoint) pero la cobertura funcional o de interfaz es limitada, o solo está descrito en documentación. |
| **Propuesto** | Aporte nuevo (de la propuesta SIMUS); no se halló en el backend actual. |

> ⚠️ **Honestidad sobre el alcance:** el `Estado` refleja la **evidencia encontrada en el backend a la fecha** (entidades en `Rows.cs`, mapeos en `PnmcDbContext`, endpoints en `AdminDataEndpoints` y módulos). Los marcados *Implementado/Parcial* **deben confirmarse en una demo conjunta**; no certifican cobertura completa de interfaz, validaciones ni pruebas. Donde no hubo evidencia, se marca *Propuesto* o *Parcial (verificar)* — no se afirma como hecho.

**Cruce con SIMUS:** el dictamen de qué cubre SIMUS lo da su equipo; aquí solo señalamos *posible solapamiento* en módulos que SIMUS ya declaró tener (mapa y agenda).

---

## Glosario de roles

| Rol | Descripción |
| --- | --- |
| **Visitante / Ciudadano** | Público sin autenticación |
| **Actor del sector** | Persona/organización del sector que se registra y gestiona **sus propios** procesos (sin permisos administrativos). En el backend hoy corresponde al canal/rol `externo`. |
| **Aliado lector / editor / admin** | Usuarios de una **entidad aliada** aprobada; confinados a su `EntidadAliadaId` |
| **Gestor interno** | Revisión, validación y publicación (`gestor_interno`) |
| **Webmaster** | Control total de la plataforma (`webmaster`) |
| **Sistema** | Actor técnico, para requisitos no funcionales (p. ej. asignación de identificadores). Las personas de consulta (músico, docente, investigador, "usuario del mapa") equivalen a **Visitante/Ciudadano**. |

> Los **aliados** y **actores del sector** quedan confinados a su entidad/propiedad; la autorización real vive en el backend. Algunas historias usan **"Como Ministerio"** como voz institucional para requisitos de cumplimiento/sistema (Habeas Data, seguridad, auditoría).

---

## Resumen de estado (panorama)

| Bloque | Estado general |
| --- | --- |
| Módulos del ecosistema (festivales, escuelas, mercados, organizaciones, espacios/infraestructura) | **Implementado** (CRUD + estado + mapa + carga masiva) |
| Modelo relacional (entidades, relaciones proceso↔proceso/entidad, registros fuente, etiquetas) | **Implementado/Parcial** |
| Territorios sonoros y prácticas musicales | **Parcial** (tablas existen) |
| Agenda, Noticias, Galería, Catálogo editorial | **Implementado** (admin + flujo) |
| Identidad, RBAC, aliados, auditoría, notificaciones | **Implementado** |
| Gobernanza de datos (duplicados, calidad, reclamación) | **Implementado** |
| Importación masiva por módulo | **Parcial** (endpoint `/records/{moduleId}/bulk`) |
| Estructura institucional (ejes/componentes como entidades) | **Propuesto** |
| CMS de textos editables | **Propuesto** (descrito en docs; no existe en el backend) |
| Enmascaramiento Habeas Data en capa pública | **Propuesto** (hoy los endpoints públicos exponen contacto sin enmascarar) |
| Revisión por campo, huérfanos, sugerencias IA, vistas relacionales de mapa | **Propuesto** |

---

# E1 · Modelo de datos relacional, identificadores e interoperabilidad

**Qué es.** La base que conecta los módulos: identificadores únicos, una entidad transversal ("Entidad/Organización") y tablas de relación entre procesos, entidades, territorios y prácticas.

### HU-DAT-01 · Identificadores únicos por registro `[interno]`
**Estado PNMC:** Implementado · **Prioridad:** Must · **Entrega:** MVP
**Como** sistema **quiero** que cada registro y entidad tenga un identificador único interno **para** relacionar información sin duplicarla.
- **Dado** cualquier registro (módulo del ecosistema, noticia, evento, recurso, álbum, entidad), **cuando** se crea, **entonces** recibe un Id único y las relaciones se construyen por Id (claves foráneas), no por texto.

### HU-DAT-02 · Entidad transversal y relaciones entre procesos `[interno]`
**Estado PNMC:** Implementado · **Prioridad:** Must · **Entrega:** MVP
**Como** Gestor interno **quiero** vincular una organización/entidad con varios procesos (festivales, mercados, escuelas, espacios, redes) **para** representar cómo actúan los actores en el ecosistema.
- **Dado** una entidad, **cuando** la relaciono con uno o más registros, **entonces** la relación queda persistida (tabla `EntidadesRelaciones` y endpoint `/process-relations`).
- **Dado** una entidad, **cuando** consulto su ficha interna, **entonces** veo sus relaciones activas sin duplicar los procesos.

### HU-DAT-03 · Vinculación a registros fuente / históricos `[interno]`
**Estado PNMC:** Parcial · **Prioridad:** Should · **Entrega:** MVP
**Como** Gestor interno **quiero** vincular una entidad a sus registros fuente del ecosistema **para** consolidar información histórica sin perder trazabilidad.
- **Dado** una entidad, **cuando** la asocio a un registro fuente, **entonces** el vínculo se guarda (`EntidadesRegistrosFuente`).
- *Brecha:* el flujo de adopción/consolidación de cara al usuario está parcialmente cubierto (ver E14).

### HU-DAT-04 · Catálogos transversales y DIVIPOLA `[interno]`
**Estado PNMC:** Parcial · **Prioridad:** Must · **Entrega:** MVP
**Como** Webmaster **quiero** catálogos controlados (DIVIPOLA, etiquetas, prácticas musicales, territorios sonoros, estados) **para** mantener consistencia.
- **Dado** un registro, **cuando** asigno departamento/municipio, **entonces** se validan contra DIVIPOLA (1.122 municipios).
- **Dado** prácticas musicales / territorios sonoros / etiquetas, **cuando** se usan, **entonces** existen como catálogos (`PracticasMusicales`, `Etiquetas`, `RegistrosEcosistemaTerritoriosSonoros`).
- *Brecha:* la administración (alta/baja) de estos catálogos desde consola está por confirmar.

### HU-DAT-05 · Etiquetado transversal de contenidos `[interno]`
**Estado PNMC:** Parcial · **Prioridad:** Should · **Entrega:** MVP
**Como** Gestor interno **quiero** etiquetar noticias, eventos y álbumes **para** construir filtros y relaciones.
- **Dado** un contenido, **cuando** le asigno etiquetas, **entonces** se persisten (`NoticiasEtiquetas`, `AgendaEtiquetas`, `AlbumesGaleriaEtiquetas`).

---

# E2 · Identidad, autenticación y roles

**Qué es.** Inicio de sesión y control de acceso por roles, con autorización en el backend. Diferencia gestión interna, aliados institucionales y actores del sector.

### HU-AUT-01 · Inicio de sesión interno `[interno]`
**Estado PNMC:** Implementado · **Prioridad:** Must · **Entrega:** MVP
**Como** Webmaster / Gestor interno **quiero** iniciar sesión **para** entrar a la consola administrativa.
- **Dado** credenciales válidas, **cuando** inicio sesión, **entonces** recibo una sesión por cookie (`pnmc.admin`, 8 h sliding) y acceso según mi rol.
- **Dado** credenciales inválidas, **cuando** intento entrar, **entonces** recibo 401 sin revelar si el usuario existe.

### HU-AUT-02 · Inicio de sesión de aliados y sector `[registrado]`
**Estado PNMC:** Implementado · **Prioridad:** Must · **Entrega:** MVP
**Como** Aliado / Actor del sector **quiero** iniciar sesión **para** acceder a mi portal y mis registros.
- **Dado** credenciales válidas, **cuando** inicio sesión, **entonces** accedo con las opciones de mi rol.

### HU-AUT-03 · Autorización por rol en backend `[transversal]`
**Estado PNMC:** Implementado · **Prioridad:** Must · **Entrega:** MVP
**Como** Ministerio **quiero** que cada acción valide el rol en el backend **para** que la seguridad no dependa del frontend.
- **Dado** una acción protegida, **cuando** la solicita un rol sin permiso, **entonces** el backend responde 403.

### HU-AUT-04 · Confinamiento de aliados a su entidad `[registrado]`
**Estado PNMC:** Implementado · **Prioridad:** Must · **Entrega:** MVP
**Como** Ministerio **quiero** que los aliados queden limitados a su entidad **para** aislar la información.
- **Dado** un aliado, **cuando** opera, **entonces** sus consultas se filtran por su `EntidadAliadaId`.

### HU-AUT-05 · Diferenciar actor del sector vs aliado institucional `[transversal]`
**Estado PNMC:** Parcial · **Prioridad:** Should · **Entrega:** MVP
**Como** Ministerio **quiero** distinguir entidades aliadas (con convenio) de actores del sector que registran de forma independiente **para** asignar permisos y alcances distintos.
- **Dado** un usuario, **cuando** se crea, **entonces** queda en un canal (`interno`/`aliado`/`externo`).
- *Brecha:* la figura "actor del sector" hoy se apoya en el rol `externo`; falta formalizar su perfil y permisos diferenciados.

---

# E3 · Estructura institucional del PNMC: ejes y componentes  ★ aporte nuevo

**Qué es.** Administrar la arquitectura conceptual del Plan (ejes, componentes, líneas de acción) como **entidades** con URL propia, metadatos y documentos, y relacionarlas con los contenidos.

### HU-EST-01 · Administrar ejes y componentes como entidades `[interno]`
**Estado PNMC:** Propuesto · **Prioridad:** Must · **Entrega:** MVP
**Como** Webmaster / Gestor interno **quiero** crear, editar, ordenar y desactivar ejes y componentes **para** que el portal refleje la estructura del plan.
- **Dado** un eje/componente, **cuando** lo creo, **entonces** tiene URL propia, metadatos, texto, imagen y documentos, y puede guardarse como borrador antes de publicar.
- *Nota:* hoy los ejes/componentes son contenido del frontend, no entidades administrables (no hay tablas Ejes/Componentes).

### HU-EST-02 · Relacionar ejes/componentes con contenidos `[interno]`
**Estado PNMC:** Propuesto · **Prioridad:** Must · **Entrega:** MVP
**Como** Gestor interno **quiero** vincular noticias, eventos, publicaciones, galerías y registros del mapa a un eje/componente **para** mostrar la acción del PNMC de forma integrada.
- **Dado** un contenido, **cuando** lo asocio a uno o varios ejes/componentes, **entonces** la relación se construye por Id y la página pública del eje muestra los contenidos publicados relacionados.

### HU-EST-03 · Documentos institucionales relacionados `[interno]`
**Estado PNMC:** Parcial · **Prioridad:** Should · **Entrega:** MVP
**Como** Webmaster **quiero** asociar documentos institucionales a páginas, ejes o componentes **para** que la ciudadanía consulte lineamientos y memorias.
- **Dado** un documento, **cuando** lo cargo, **entonces** se gestiona como archivo (`Archivos` ya existe) con metadatos y estado.
- *Brecha:* falta el vínculo documento↔eje/componente y la ficha documental con categoría/autoría.

---

# E4 · Portal público y CMS de textos

**Qué es.** El sitio público y la edición de sus textos sin tocar código.

### HU-CMS-01 · Editar textos del portal sin código `[interno]`
**Estado PNMC:** Propuesto · **Prioridad:** Must · **Entrega:** MVP
**Como** Webmaster **quiero** editar los textos del portal desde un panel **para** actualizar mensajes públicos sin un desarrollador.
- **Dado** una llave de texto, **cuando** edito su valor y guardo, **entonces** se refleja en el portal.
- *Nota:* el CMS de textos está descrito en la documentación funcional, pero **no se halló la entidad/endpoint en el backend actual**; debe verificarse o construirse.

### HU-CMS-02 · Previsualización de alta fidelidad `[interno]`
**Estado PNMC:** Propuesto · **Prioridad:** Should · **Entrega:** MVP
**Como** Webmaster **quiero** previsualizar el cambio antes de publicar **para** evitar errores en el sitio.
- **Dado** que edito un texto, **cuando** escribo, **entonces** una maqueta muestra el resultado.

### HU-POR-01 · Home con mensaje estratégico y acceso a participar `[público]`
**Estado PNMC:** Implementado · **Prioridad:** Must · **Entrega:** MVP
**Como** Visitante **quiero** una página de inicio con el mensaje del Plan y un acceso a participar **para** entender el PNMC y vincularme.
- **Dado** el portal, **cuando** carga el Home, **entonces** veo el hero y un enlace a Participación.

### HU-POR-02 · Explorar las rutas/estrategias del Plan `[público]`
**Estado PNMC:** Parcial · **Prioridad:** Should · **Entrega:** MVP
**Como** Visitante **quiero** explorar las Rutas de Acción Territorial del PNMC **para** conocer sus líneas de acción.
- **Dado** el Home, **cuando** navego las estrategias, **entonces** veo las rutas del Plan.
- *Brecha:* su carga dinámica desde BD depende del CMS (ver HU-CMS-01).

---

# E5 · Agenda cultural

**Qué es.** Módulo administrable de eventos del PNMC, con flujo editorial, relaciones y consulta pública filtrable. **Cruce con SIMUS:** ⟂ posible solapamiento (SIMUS ya tiene agenda).

### HU-AGE-01 · Crear y administrar eventos `[interno]`
**Estado PNMC:** Implementado · **Prioridad:** Must · **Entrega:** MVP
**Como** Gestor interno / Webmaster **quiero** crear y editar eventos **para** publicar actividades del PNMC.
- **Dado** el formulario, **cuando** creo un evento (nombre, descripción, fecha/hora, lugar, municipio/departamento, categoría, responsable), **entonces** queda en estado `borrador` sujeto al flujo.
- **Dado** un evento, **cuando** lo relaciono con festival/categoría, **entonces** el vínculo se persiste (`Agenda.FestivalId`, `CategoryId`).

### HU-AGE-02 · Consultar agenda pública con filtros `[público]`
**Estado PNMC:** Implementado · **Prioridad:** Must · **Entrega:** MVP
**Como** Ciudadano **quiero** consultar la agenda con filtros **para** encontrar actividades relevantes.
- **Dado** la agenda, **cuando** filtro por fecha/territorio/categoría, **entonces** veo solo los eventos publicados que cumplen, ordenados por fecha de inicio.
- **Dado** que ningún evento cumple, **cuando** aplico filtros, **entonces** se muestra un mensaje de vacío.

### HU-AGE-03 · Relacionar eventos con mapa, noticias y galería `[interno]`
**Estado PNMC:** Parcial · **Prioridad:** Should · **Entrega:** MVP
**Como** Gestor interno **quiero** relacionar un evento con noticias, álbumes y registros del mapa **para** documentar integralmente las acciones.
- **Dado** un evento, **cuando** lo asocio a otro contenido, **entonces** la relación se construye por Id y la ficha pública muestra lo relacionado publicado.
- *Brecha:* existen etiquetas y relaciones; la vinculación cruzada UI evento↔noticia↔galería es parcial.

---

# E6 · Noticias y comunicaciones

**Qué es.** Contenidos editoriales administrables, enlazados con agenda, mapa, galerías, componentes y territorios.

### HU-NOT-01 · Crear y administrar noticias `[interno]`
**Estado PNMC:** Implementado · **Prioridad:** Must · **Entrega:** MVP
**Como** Gestor interno / Webmaster **quiero** crear y editar noticias **para** comunicar avances y procesos.
- **Dado** el editor, **cuando** creo una noticia (título, bajada, cuerpo, imagen, autoría, etiquetas), **entonces** puedo guardarla como borrador y el contenido se sanitiza al publicarse (`Noticias`, `NoticiasArchivos`, `NoticiasEtiquetas`).

### HU-NOT-02 · Consultar noticias públicas y relacionadas `[público]`
**Estado PNMC:** Implementado · **Prioridad:** Must · **Entrega:** MVP
**Como** Visitante **quiero** leer noticias y ver contenidos relacionados **para** comprender el contexto.
- **Dado** noticias publicadas, **cuando** las consulto, **entonces** se listan cronológicamente y puedo filtrar por etiqueta; el HTML enriquecido se interpreta de forma segura.
- *Brecha:* el enlace noticia↔mapa/territorio es parcial.

---

# E7 · Proyecto editorial y gestión documental

**Qué es.** Catálogo bibliográfico y documental del PNMC, con metadatos ricos, filtros y descarga.

### HU-EDI-01 · Administrar catálogo editorial y documental `[interno]`
**Estado PNMC:** Implementado · **Prioridad:** Must · **Entrega:** MVP
**Como** Gestor interno / Webmaster **quiero** registrar publicaciones, documentos e investigaciones **para** consolidar el proyecto editorial.
- **Dado** un recurso, **cuando** lo registro, **entonces** guarda metadatos ricos (título, autoría, año, tipo, ISBN/ISMN, práctica, palabras clave, sección): `CatalogoEditorial` ya soporta estos campos e importación.

### HU-EDI-02 · Consultar el catálogo como biblioteca digital `[público]`
**Estado PNMC:** Implementado · **Prioridad:** Must · **Entrega:** MVP
**Como** Músico / docente / investigador / ciudadano **quiero** buscar y filtrar publicaciones **para** encontrar materiales.
- **Dado** el catálogo, **cuando** busco/filtro por eje, año, sección o práctica, **entonces** veo fichas con archivos disponibles para abrir/descargar.
- **Dado** que no hay resultados, **cuando** filtro, **entonces** se informa claramente.

### HU-EDI-03 · Trazabilidad documental `[interno]`
**Estado PNMC:** Parcial · **Prioridad:** Should · **Entrega:** MVP
**Como** Webmaster **quiero** historial básico de los recursos **para** controlar cambios y disponibilidad.
- **Dado** un recurso, **cuando** se actualiza/reemplaza, **entonces** queda fecha, responsable y estado.
- *Brecha:* el versionado de archivos y la detección de enlaces rotos es parcial.

---

# E8 · Galería y memoria visual

**Qué es.** Álbumes fotográficos relacionados con eventos, noticias, componentes, prácticas y territorios.

### HU-GAL-01 · Crear álbumes de procesos `[interno]`
**Estado PNMC:** Implementado · **Prioridad:** Should · **Entrega:** MVP
**Como** Gestor interno / Webmaster **quiero** crear álbumes y cargar imágenes **para** documentar visualmente los procesos.
- **Dado** la consola, **cuando** creo un álbum y subo imágenes ordenadas, **entonces** quedan disponibles para publicación (`AlbumesGaleria`, `AlbumesGaleriaArchivos`, `AlbumesGaleriaEtiquetas`).

### HU-GAL-02 · Consultar memoria visual relacionada `[público]`
**Estado PNMC:** Implementado · **Prioridad:** Should · **Entrega:** MVP
**Como** Visitante **quiero** explorar álbumes y fotografías **para** conocer las acciones en territorio.
- **Dado** la galería, **cuando** abro un álbum publicado, **entonces** recorro sus imágenes con texto alternativo/descripción.
- *Brecha:* el filtrado por territorio/componente/práctica depende de metadatos.

---

# E9 · Mapa ecosistémico (territorial y relacional)

**Qué es.** Geovisor que consolida el ecosistema musical (festivales, escuelas, mercados, organizaciones, espacios/infraestructura, redes) por capas y, en evolución, como herramienta relacional. **Cruce con SIMUS:** ⟂ posible solapamiento (SIMUS ya tiene mapas).

### HU-MAP-01 · Visualizar módulos del ecosistema `[público]`
**Estado PNMC:** Implementado · **Prioridad:** Must · **Entrega:** MVP
**Como** Ciudadano **quiero** ver registros del ecosistema con marcadores diferenciados **para** ubicar actores y procesos.
- **Dado** el mapa, **cuando** carga, **entonces** veo pines por tipo (festivales, escuelas, mercados, organizaciones, espacios/infraestructura) con agrupación por densidad y leyenda.
- **Dado** un registro, **cuando** lo abro, **entonces** veo su ficha pública sin datos personales restringidos.

### HU-MAP-02 · Capas de densidad (calor y coropletas) `[público]`
**Estado PNMC:** Parcial · **Prioridad:** Should · **Entrega:** MVP
**Como** Visitante (tomador de decisiones) **quiero** capas de calor y coropletas **para** evaluar la concentración territorial.
- **Dado** el mapa, **cuando** activo la capa, **entonces** veo densidad (calor) o coropletas por departamento según registros aprobados (`sp_ActualizarMetricasMapa` alimenta métricas).

### HU-MAP-03 · Filtros DIVIPOLA con transición `[público]`
**Estado PNMC:** Implementado · **Prioridad:** Must · **Entrega:** MVP
**Como** Visitante **quiero** filtrar por Departamento/Municipio **para** enfocar un territorio.
- **Dado** los desplegables DIVIPOLA, **cuando** elijo un departamento, **entonces** el mapa hace *flyTo* y carga sus municipios.

### HU-MAP-04 · Enmascaramiento de datos personales `[público]`
**Estado PNMC:** Propuesto · **Prioridad:** Must · **Entrega:** MVP
**Como** Ministerio **quiero** enmascarar datos de contacto personales en la capa pública **para** cumplir Habeas Data (Ley 1581/2012).
- **Dado** un registro con contacto, **cuando** lo consulta un usuario con privilegio, **entonces** ve el dato; **y cuando** lo consulta el público, **entonces** los datos personales se enmascaran.
- *Nota:* ⚠️ **No implementado en el backend actual.** Hoy los endpoints públicos del catálogo exponen correo y teléfono de contacto **sin enmascarar**. Es un requisito (Ley 1581/2012) pendiente de construir y debe priorizarse antes de exponer datos reales en producción.

### HU-MAP-05 · Territorios sonoros y prácticas musicales `[público]`
**Estado PNMC:** Parcial · **Prioridad:** Should · **Entrega:** Evolutivo
**Como** Investigador / gestor cultural **quiero** visualizar territorios sonoros y prácticas musicales **para** leer el ecosistema desde lo cultural.
- **Dado** datos disponibles, **cuando** filtro por práctica o activo la capa de territorios sonoros, **entonces** veo los registros asociados (`RegistrosEcosistemaPracticasMusicales`, `RegistrosEcosistemaTerritoriosSonoros`).
- *Nota:* las tablas existen; la curaduría de datos y la visualización son evolutivas; deben presentarse como lectura cultural, no división administrativa.

### HU-MAP-06 · Relacionar organizaciones con múltiples procesos `[interno]`
**Estado PNMC:** Implementado · **Prioridad:** Must · **Entrega:** MVP
**Como** Gestor interno / Aliado autorizado **quiero** vincular una organización con varios procesos **para** representar su rol en el ecosistema.
- **Dado** una organización, **cuando** la relaciono con festivales/mercados/escuelas/espacios/redes, **entonces** el vínculo se persiste (endpoint `/process-relations`, `EntidadesRelaciones`) y la ficha interna muestra todas sus relaciones.

### HU-MAP-07 · Vistas relacionales del mapa `[público]`
**Estado PNMC:** Propuesto · **Prioridad:** Should · **Entrega:** Evolutivo
**Como** usuario del mapa **quiero** alternar vistas (territorial, por práctica, por entidad) **para** leer el ecosistema desde distintas dimensiones.
- **Dado** las vistas, **cuando** alterno, **entonces** respetan los filtros y explican qué representan; los datos de origen no cambian.
- *Nota:* las relaciones existen en datos; las vistas relacionales de UI son nuevas.

---

# E10 · Caracterización del ecosistema (registros)

**Qué es.** Alta y administración de los registros del ecosistema: festivales, escuelas, mercados musicales, organizaciones (redes/documentación) y espacios e infraestructura, catalogados por DIVIPOLA y coordenadas.

### HU-REG-01 · Alta de registros del ecosistema `[registrado]/[interno]`
**Estado PNMC:** Implementado · **Prioridad:** Must · **Entrega:** MVP
**Como** Aliado editor / Gestor interno **quiero** crear registros (festival, escuela, mercado, organización, espacio/infraestructura) **para** ampliar el inventario.
- **Dado** el formulario del tipo, **cuando** guardo, **entonces** se crea en estado `borrador` (endpoints `/map/festivals`, `/map/schools`, `/map/markets`, `/organizations`, `/spaces-infrastructure`).

### HU-REG-02 · Catalogación geográfica `[registrado]/[interno]`
**Estado PNMC:** Implementado · **Prioridad:** Must · **Entrega:** MVP
**Como** editor de registros (Aliado editor / Gestor interno) **quiero** asociar municipio DIVIPOLA y coordenadas **para** que el registro aparezca correctamente en el mapa.
- **Dado** un registro, **cuando** asigno municipio (5 dígitos) y coordenadas, **entonces** queda geolocalizable.

### HU-REG-03 · Confinamiento por entidad/propiedad `[registrado]`
**Estado PNMC:** Implementado · **Prioridad:** Must · **Entrega:** MVP
**Como** Ministerio **quiero** que cada aliado/actor gestione solo sus registros **para** mantener la gobernanza.
- **Dado** un aliado/actor, **cuando** lista o edita, **entonces** solo accede a lo de su entidad/propiedad; el backend rechaza lo fuera de alcance.

---

# E11 · Participación ciudadana y datos vivos  ★ diferenciador

**Qué es.** Mecanismos para que ciudadanía y actores alimenten y mantengan vivos los datos: envío desde el mapa, autorregistro y wizard con captura de coordenadas por arrastre, con control de abuso.

### HU-PAR-01 · Envío de participación desde el mapa `[público]`
**Estado PNMC:** Implementado · **Prioridad:** Must · **Entrega:** MVP
**Como** Ciudadano **quiero** aportar información desde el mapa **para** sumar un proceso al ecosistema.
- **Dado** el formulario, **cuando** lo envío, **entonces** queda registrado para revisión (`Participaciones`); el exceso (>30/min) se rechaza.

### HU-PAR-02 · Autorregistro de actor del sector `[público]→[registrado]`
**Estado PNMC:** Implementado · **Prioridad:** Must · **Entrega:** MVP
**Como** Ciudadano (persona sin cuenta) **quiero** registrarme **para** obtener acceso como actor del sector y caracterizar mi proceso.
- **Dado** el registro externo, **cuando** lo completo, **entonces** se crea mi cuenta; el exceso (>10/min) se bloquea.

### HU-PAR-03 · Wizard de caracterización con coordenadas por arrastre `[registrado]`
**Estado PNMC:** Implementado · **Prioridad:** Must · **Entrega:** MVP
**Como** Actor del sector **quiero** caracterizar mi proceso por pasos y marcar mi sede en el mapa **para** entregar información completa sin transcribir coordenadas.
- **Dado** el wizard, **cuando** arrastro el marcador, **entonces** se autocompletan latitud/longitud (evento `dragend`); al enviar, el registro queda en revisión.

---

# E12 · Entidades aliadas y actores del sector

**Qué es.** Ciclo de vinculación de entidades aliadas y registro de actores del sector, con alcances y responsabilidades distintos.

### HU-ALI-01 · Solicitud y aprobación de entidad aliada `[público]→[interno]`
**Estado PNMC:** Implementado · **Prioridad:** Must · **Entrega:** MVP
**Como** Visitante (representante de una organización) **quiero** solicitar ser entidad aliada **para** participar formalmente; **y como** Gestor interno **quiero** revisarla.
- **Dado** una solicitud, **cuando** se envía, **entonces** queda `pendiente` (`SolicitudesAliado`); **cuando** el gestor aprueba, **entonces** se crea la entidad y su administrador; **cuando** pide ajustes, **entonces** vuelve con comentarios.

### HU-ALI-02 · Gestión de usuarios de la entidad `[registrado]`
**Estado PNMC:** Implementado · **Prioridad:** Must · **Entrega:** MVP
**Como** Aliado admin **quiero** vincular y administrar usuarios de mi entidad **para** organizar a mi equipo.
- **Dado** mi entidad aprobada, **cuando** vinculo un usuario con rol, **entonces** queda asociado a mi `EntidadAliadaId` (`UsuariosEntidadesAliadas`).

### HU-ALI-03 · Consultar y exportar como aliado `[registrado]`
**Estado PNMC:** Parcial · **Prioridad:** Should · **Entrega:** MVP
**Como** Aliado lector/editor/admin **quiero** consultar y exportar información autorizada **para** apoyar la gestión de mi entidad.
- **Dado** mi alcance, **cuando** exporto, **entonces** se respeta entidad/rol y se identifica usuario/fecha/criterios.
- *Brecha:* la exportación con alcance fino por entidad es parcial.

### HU-SEC-01 · Registrar procesos como actor del sector `[registrado]`
**Estado PNMC:** Parcial · **Prioridad:** Must · **Entrega:** MVP
**Como** Actor del sector **quiero** registrar mis procesos musicales **para** hacer parte del ecosistema.
- **Dado** mi cuenta, **cuando** registro una organización/proceso, **entonces** queda en revisión y mis datos privados no se exponen sin autorización.
- *Brecha:* el perfil "sector" se apoya hoy en el rol `externo`; falta formalizarlo (ver HU-AUT-05).

### HU-SEC-02 · Adoptar o reclamar registros históricos `[registrado]`
**Estado PNMC:** Parcial · **Prioridad:** Should · **Entrega:** Evolutivo
**Como** Actor del sector / Aliado **quiero** reclamar un registro que corresponde a mi proceso **para** actualizarlo y evitar duplicidades.
- **Dado** un registro, **cuando** solicito su reclamación, **entonces** pasa a revisión de un gestor antes de otorgar edición (`SolicitudesVinculacionRegistros`/`RecordLinkRequests`).
- *Brecha:* la sugerencia de registros candidatos por nombre/territorio y el bloqueo anti-reclamación simultánea son nuevos.

---

# E13 · Flujo editorial, revisión por apartado, moderación y auditoría

**Qué es.** Flujo de 7 estados por el que pasa todo registro, consola de moderación, retroalimentación e historial inmutable.
**Estados:** `borrador` → `en_revision` → `ajustes_solicitados` | `aprobado` → `publicado` | `rechazado` | `archivado`.

### HU-MOD-01 · Ciclo de vida controlado del registro `[interno]`
**Estado PNMC:** Implementado · **Prioridad:** Must · **Entrega:** MVP
**Como** Ministerio **quiero** que cada registro siga un flujo de estados controlado **para** garantizar calidad antes de publicar.
- **Dado** un registro en `borrador`, **cuando** se envía a revisión, **entonces** pasa a `en_revision`.
- **Dado** un registro en `borrador`, **cuando** se intenta publicarlo sin pasar por revisión/aprobación, **entonces** el backend rechaza la transición y el estado permanece.

### HU-MOD-02 · Revisión con decisión y comentario `[interno]`
**Estado PNMC:** Implementado · **Prioridad:** Must · **Entrega:** MVP
**Como** Gestor interno / Webmaster **quiero** aprobar, rechazar o solicitar ajustes con comentario **para** dar trazabilidad a la decisión.
- **Dado** un registro `en_revision`, **cuando** decido, **entonces** cambia de estado y se guarda el comentario; `ajustes_solicitados` es un estado propio.

### HU-MOD-03 · Solo lo publicado es visible al público `[interno]/[público]`
**Estado PNMC:** Implementado · **Prioridad:** Must · **Entrega:** MVP
**Como** Ministerio **quiero** que el público vea solo registros `publicado` **para** no exponer material no validado.
- **Dado** un registro no publicado, **cuando** un visitante consulta, **entonces** no aparece.

### HU-MOD-04 · Auditoría inmutable de cambios `[interno]`
**Estado PNMC:** Implementado · **Prioridad:** Must · **Entrega:** MVP
**Como** Ministerio **quiero** historial inalterable de cada cambio **para** rendición de cuentas.
- **Dado** una transición o edición, **cuando** ocurre, **entonces** se registra (`BitacoraAuditoria`, `EntidadesHistorialRevision`) con autor, fecha y valores previo/nuevo.

### HU-MOD-05 · Revisión y feedback por campo/sección `[interno]`
**Estado PNMC:** Propuesto · **Prioridad:** Must · **Entrega:** MVP
**Como** Gestor interno **quiero** revisar por apartados y dejar observaciones por campo/sección **para** que el usuario sepa exactamente qué corregir.
- **Dado** la ficha por apartados, **cuando** dejo una observación, **entonces** queda asociada a un campo/sección, no puedo devolver sin al menos una, y el usuario la ve donde debe corregir.
- **Dado** un reenvío, **cuando** reviso, **entonces** veo qué cambió desde la última revisión y puedo marcar observaciones como resueltas.
- *Nota:* hoy la revisión es a nivel de registro (comentario + historial); la granularidad por campo es nueva.

---

# E14 · Gobernanza y calidad de datos

**Qué es.** Detección de duplicados, banderas de calidad, vinculación/reclamación de registros y gestión de huérfanos.

### HU-GOB-01 · Detección y resolución de duplicados `[interno]`
**Estado PNMC:** Implementado · **Prioridad:** Should · **Entrega:** MVP
**Como** Gestor interno **quiero** que el sistema señale duplicados y poder resolverlos **para** evitar redundancia.
- **Dado** registros similares, **cuando** el sistema los detecta (puntaje y nivel de coincidencia), **entonces** los presenta como candidatos con evidencia (`RegistrosDuplicadosCandidatos`) y puedo confirmar/descartar.

### HU-GOB-02 · Banderas de calidad de datos `[interno]`
**Estado PNMC:** Implementado · **Prioridad:** Should · **Entrega:** MVP
**Como** Gestor interno **quiero** marcar y seguir banderas de calidad por registro **para** priorizar correcciones.
- **Dado** un registro con problemas, **cuando** abro una bandera, **entonces** queda con severidad y estado (`RegistrosCalidadDatos`).

### HU-GOB-03 · Solicitudes de vinculación de registros `[interno]`
**Estado PNMC:** Implementado · **Prioridad:** Should · **Entrega:** MVP
**Como** Aliado editor / Gestor interno **quiero** solicitar vincular un registro a mi entidad **para** gestionarlo legítimamente.
- **Dado** una solicitud, **cuando** el revisor la aprueba, **entonces** se asigna el alcance y queda auditada (`SolicitudesVinculacionRegistros`).

### HU-GOB-04 · Gestión de registros huérfanos `[interno]`
**Estado PNMC:** Parcial · **Prioridad:** Should · **Entrega:** Evolutivo
**Como** Gestor interno **quiero** identificar registros sin responsable **para** permitir su actualización, reclamación o archivo.
- **Dado** registros sin usuario/entidad, **cuando** los consulto, **entonces** puedo asociarlos, marcarlos como candidatos a reclamación o archivarlos, con auditoría.
- *Nota:* el dato base existe (`EntidadesRegistrosFuente`); la consola de huérfanos es nueva.

---

# E15 · Importación masiva, validación y comparación

**Qué es.** Carga amplia por módulo con plantillas, validaciones, comparación de duplicados y confirmación.

### HU-IMP-01 · Importar registros masivamente por módulo `[interno]/[registrado]`
**Estado PNMC:** Parcial · **Prioridad:** Should · **Entrega:** MVP
**Como** Gestor interno / Aliado editor / Webmaster **quiero** importar registros de forma masiva **para** cargar información eficientemente.
- **Dado** un módulo, **cuando** importo, **entonces** el sistema procesa la carga (endpoint `/records/{moduleId}/bulk`).
- *Brecha:* plantilla por módulo, validación DIVIPOLA/catálogos, resumen de filas válidas/advertencias/errores y confirmación previa están parcialmente cubiertos.

### HU-IMP-02 · Validar y comparar datos importados `[interno]`
**Estado PNMC:** Parcial · **Prioridad:** Should · **Entrega:** MVP/Evolutivo
**Como** Gestor interno **quiero** comparar lo importado con lo existente **para** evitar duplicidades.
- **Dado** una importación, **cuando** hay coincidencias (nombre, municipio, correo, web, coordenadas), **entonces** se presentan como alertas (no fusiones automáticas) y decido crear/actualizar/dejar pendiente.
- *Nota:* la detección de duplicados existe (E14); su integración dentro del flujo de importación es la brecha.

### HU-IMP-03 · Sugerencias automáticas de clasificación/relación `[interno]`
**Estado PNMC:** Propuesto · **Prioridad:** Could · **Entrega:** Evolutivo
**Como** Gestor interno **quiero** que el sistema sugiera etiquetas, relaciones o posibles duplicados **para** agilizar la organización sin perder control humano.
- **Dado** un registro, **cuando** el sistema sugiere, **entonces** nada se aplica sin confirmación, y cada sugerencia aceptada/rechazada queda registrada.

---

# E16 · Notificaciones

**Qué es.** Avisos a usuarios ante eventos relevantes, con bandeja y administración. **Estado actual:** la persistencia existe; los proveedores de envío externo (correo/WhatsApp) están **simulados**.

### HU-NOC-01 · Bandeja de notificaciones `[registrado]/[interno]`
**Estado PNMC:** Implementado · **Prioridad:** Should · **Entrega:** MVP
**Como** usuario de la plataforma **quiero** recibir notificaciones de eventos que me competen **para** estar al tanto.
- **Dado** un evento relevante (p. ej. mi registro pasa a `ajustes_solicitados`), **cuando** ocurre, **entonces** se genera una notificación (`Notificaciones`).

### HU-NOC-02 · Administración de notificaciones `[interno]`
**Estado PNMC:** Implementado · **Prioridad:** Could · **Entrega:** MVP
**Como** Gestor interno / Webmaster **quiero** consultar y gestionar notificaciones **para** dar seguimiento.
- **Dado** el panel, **cuando** lo abro, **entonces** veo el estado de cada una (pendiente/enviada/leída/error).
- *Nota:* el canal real de envío (SMTP/WhatsApp) está simulado — candidato a usar el de SIMUS.

---

# E17 · Administración de la plataforma y roles

**Qué es.** Capacidades transversales: gestión de usuarios y roles, datos maestros y operación de la consola.

### HU-ADM-01 · Gestión de usuarios y roles `[interno]`
**Estado PNMC:** Implementado · **Prioridad:** Must · **Entrega:** MVP
**Como** Webmaster **quiero** crear y administrar usuarios y asignar rol **para** controlar el acceso.
- **Dado** la consola, **cuando** creo/edito un usuario y le asigno rol, **entonces** sus permisos se aplican según el RBAC.

### HU-ADM-02 · Consola administrativa por módulos `[interno]`
**Estado PNMC:** Implementado · **Prioridad:** Must · **Entrega:** MVP
**Como** Webmaster / Gestor interno **quiero** una consola con los paneles a los que tengo permiso **para** operar desde un solo lugar.
- **Dado** mi rol, **cuando** entro a `/admin`, **entonces** veo monitores por módulo, colas y acciones permitidas.

### HU-ADM-03 · Operación por rol (webmaster, gestor, aliado, sector) `[interno]/[registrado]`
**Estado PNMC:** Implementado · **Prioridad:** Must · **Entrega:** MVP
**Como** usuario **quiero** operar según mi rol **para** ejercer solo mis permisos.
- **Dado** mi rol, **cuando** opero, **entonces** el webmaster administra todo; el gestor revisa/publica; el aliado gestiona su entidad; el actor del sector solo sus registros; el backend valida siempre.

---

## Anexo · Estado del prototipo (transparencia para el cruce)

Puntos del prototipo que **no están listos para producción** (ver `Entorno_Virtual_PNMC/docs/backlog/`):

- Envío real de correo (SMTP) y WhatsApp: **simulados**.
- Importación/exportación Excel: vulnerabilidad en `xlsx` pendiente de migrar al backend.
- CMS de textos editables: descrito en documentación; **no confirmado** como entidad/endpoint en el backend.
- Ejes/Componentes como entidades administrables: **no existen** (hoy contenido de frontend).
- Accesibilidad WCAG 2.1 AA: parcial. Logging estructurado: pendiente. `AdminShellPage.jsx` (~7.900 líneas): pendiente de desacople.

---

## Orden de implementación recomendado (alineado con SIMUS)

1. Modelo de datos, IDs, catálogos, DIVIPOLA, roles y permisos.
2. Autenticación, autorización y separación de perfiles (webmaster, gestor, aliado, sector).
3. CMS estructural: páginas, ejes, componentes, textos y documentos institucionales.
4. Módulos públicos administrables: agenda, noticias, editorial, galería.
5. Mapa ecosistémico básico: registros publicados, filtros territoriales, protección de datos.
6. Gestión de registros: borrador, revisión por campo, ajustes, aprobación, publicación, archivo.
7. Portal de aliados y sector: registro, edición, seguimiento, usuarios de entidad y reclamación.
8. Importación masiva por módulos, validación y comparación.
9. Mapa avanzado: territorios sonoros, prácticas musicales, vistas relacionales.
10. Evolutivos: automatización/sugerencias, huérfanos, reclamaciones avanzadas, analítica.

## Definición de Terminado (común)

Una historia está terminada cuando cumple sus criterios de aceptación, respeta el modelo de permisos por rol/entidad/propiedad, mantiene trazabilidad de cambios, contempla estados de carga/vacío/error/éxito, protege datos personales desde el backend, se integra con catálogos y relaciones, cuenta con pruebas proporcionales al riesgo, no introduce fallos críticos de accesibilidad y documenta su comportamiento funcional, técnico y editorial.

## Siguientes pasos

1. **Reconciliar con SIMUS:** cruzar este backlog (con su `Estado PNMC`) contra el modelo de datos de SIMUS para decidir, por historia, *Cubierta por SIMUS / Reutilizar de PNMC / Construir*.
2. **Confirmar en demo conjunta** los `Estado: Implementado/Parcial` antes de planear sprints.
3. Cargar en Azure DevOps (CSV) y priorizar con MoSCoW.
4. Revisión en la mesa técnica semanal (viernes).

> Cada **Épica (E#)** → *Epic*; cada **HU** → *Product Backlog Item*; criterios en *Acceptance Criteria*. El campo `Estado PNMC` viaja como etiqueta para filtrar el análisis de brechas.
