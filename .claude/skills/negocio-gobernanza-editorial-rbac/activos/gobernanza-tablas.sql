/*
  ORIGEN (extractos verificados, DDL idempotente, convencion VAAAAMMDD_NN__descripcion.sql):
    Plan Nacional de Musica SIMUS/Entorno_Virtual_PNMC/pnmc-database/schema/
      - V20260519_02__administracion_control.sql   -> EstadosContenido (catalogo)
      - V20260525_01__administracion_extendida.sql  -> RegistrosRevisionHistorial (auditoria)
      - V20260525_04__vinculacion_duplicados_calidad.sql -> duplicados + calidad de datos
      - V20260525_02__roles_finales_y_aliados.sql   -> aliados multi-tenant + gotcha CHECK/sp_rename

  Modelo de gobernanza de contenidos: catalogo de estados, auditoria INSERT-only,
  confinamiento multi-tenant por EntidadAliadaId, y colas de calidad (duplicados + banderas).
  Adaptar: prefijo de esquema (dbo), longitudes, y los CHECK IN (...) al vocabulario del proyecto.
*/

-- 1) Catalogo de estados editoriales (fuente de verdad; los endpoints validan contra esta tabla)
IF OBJECT_ID(N'dbo.EstadosContenido', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.EstadosContenido (
        IdEstadoContenido int IDENTITY(1,1) NOT NULL,
        CodigoEstado nvarchar(80) NOT NULL,
        NombreEstado nvarchar(120) NOT NULL,
        DescripcionEstado nvarchar(500) NULL,
        CONSTRAINT PK_EstadosContenido PRIMARY KEY (IdEstadoContenido),
        CONSTRAINT UQ_EstadosContenido_CodigoEstado UNIQUE (CodigoEstado),
        -- El codigo se guarda en minusculas y sin espacios (evita 'En_Revision' vs 'en_revision')
        CONSTRAINT CK_EstadosContenido_CodigoEstado_Formato CHECK (
            CodigoEstado = LOWER(CodigoEstado) AND CodigoEstado NOT LIKE '% %'
        )
    );
END;

-- 2) Auditoria inmutable: una fila por transicion. Solo se hace INSERT (nunca UPDATE/DELETE).
--    El CHECK sobre EstadoNuevo blinda el vocabulario de los 7 estados a nivel de motor de BD.
IF OBJECT_ID(N'dbo.RegistrosRevisionHistorial', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.RegistrosRevisionHistorial (
        IdRevisionHistorial bigint IDENTITY(1,1) NOT NULL,
        ModuloId nvarchar(80) NOT NULL,
        RegistroId nvarchar(120) NOT NULL,
        EstadoAnterior nvarchar(80) NULL,
        EstadoNuevo nvarchar(80) NOT NULL,
        Accion nvarchar(80) NOT NULL,
        Comentario nvarchar(1200) NULL,
        MotivoRechazo nvarchar(1200) NULL,
        CamposObservados nvarchar(max) NULL,       -- JSON de observaciones por campo/seccion
        IdUsuario int NULL,                         -- autor de la transicion
        IdEntidadAliada int NULL,                   -- traza multi-tenant (ver gotcha #4)
        Fecha datetime2(0) NOT NULL CONSTRAINT DF_RegistrosRevisionHistorial_Fecha DEFAULT (SYSUTCDATETIME()),
        MetadataJson nvarchar(max) NULL,            -- extensible: IP origen + hash por evento (normativa seguridad)
        CONSTRAINT PK_RegistrosRevisionHistorial PRIMARY KEY (IdRevisionHistorial),
        CONSTRAINT CK_RegistrosRevisionHistorial_EstadoNuevo CHECK (EstadoNuevo IN (
            N'borrador', N'en_revision', N'ajustes_solicitados', N'aprobado', N'publicado', N'rechazado', N'archivado'
        ))
    );
    CREATE INDEX IX_RegistrosRevisionHistorial_ModuloRegistro ON dbo.RegistrosRevisionHistorial (ModuloId, RegistroId, Fecha DESC);
    CREATE INDEX IX_RegistrosRevisionHistorial_EstadoFecha    ON dbo.RegistrosRevisionHistorial (EstadoNuevo, Fecha DESC);
END;

-- 3) Cola de calidad: candidatos a duplicado (con puntaje/nivel) y banderas de calidad (con severidad).
--    Nada se fusiona automaticamente: el gestor confirma/descarta (control humano en el bucle).
IF OBJECT_ID(N'dbo.RegistrosDuplicadosCandidatos', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.RegistrosDuplicadosCandidatos (
        IdDuplicadoCandidato bigint IDENTITY(1,1) NOT NULL,
        ModuloId nvarchar(80) NOT NULL,
        RegistroOrigenId nvarchar(120) NOT NULL,
        RegistroCandidatoId nvarchar(120) NOT NULL,
        Puntaje decimal(5,2) NULL,
        NivelCoincidencia nvarchar(20) NOT NULL,
        EvidenciaJson nvarchar(max) NOT NULL CONSTRAINT DF_RDC_Evidencia DEFAULT (N'{}'),
        Estado nvarchar(40) NOT NULL CONSTRAINT DF_RDC_Estado DEFAULT (N'pendiente'),
        Decision nvarchar(40) NULL,
        FechaCreacion datetime2(0) NOT NULL CONSTRAINT DF_RDC_FechaCreacion DEFAULT (SYSUTCDATETIME()),
        CONSTRAINT PK_RegistrosDuplicadosCandidatos PRIMARY KEY (IdDuplicadoCandidato),
        CONSTRAINT CK_RDC_Nivel    CHECK (NivelCoincidencia IN (N'alta', N'media', N'baja')),
        CONSTRAINT CK_RDC_Estado   CHECK (Estado IN (N'pendiente', N'resuelto')),
        CONSTRAINT CK_RDC_Decision CHECK (Decision IS NULL OR Decision IN (N'fusionar', N'mantener_separados', N'no_duplicado', N'pendiente'))
    );
END;

IF OBJECT_ID(N'dbo.RegistrosCalidadDatos', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.RegistrosCalidadDatos (
        IdRegistroCalidadDatos bigint IDENTITY(1,1) NOT NULL,
        ModuloId nvarchar(80) NOT NULL,
        RegistroId nvarchar(120) NOT NULL,
        Severidad nvarchar(20) NOT NULL CONSTRAINT DF_RCD_Severidad DEFAULT (N'media'),
        Estado nvarchar(40) NOT NULL CONSTRAINT DF_RCD_Estado DEFAULT (N'abierta'),
        FechaCreacion datetime2(0) NOT NULL CONSTRAINT DF_RCD_FechaCreacion DEFAULT (SYSUTCDATETIME()),
        CONSTRAINT PK_RegistrosCalidadDatos PRIMARY KEY (IdRegistroCalidadDatos),
        CONSTRAINT CK_RCD_Severidad CHECK (Severidad IN (N'baja', N'media', N'alta')),
        CONSTRAINT CK_RCD_Estado    CHECK (Estado IN (N'abierta', N'en_revision', N'resuelta', N'descartada'))
    );
END;

-- 4) Multi-tenant: usuarios confinados a su EntidadAliadaId con rol de aliado.
IF OBJECT_ID(N'dbo.UsuariosEntidadesAliadas', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.UsuariosEntidadesAliadas (
        IdUsuarioEntidadAliada int IDENTITY(1,1) NOT NULL,
        UsuarioId int NOT NULL,
        EntidadAliadaId int NOT NULL,
        RolAliado nvarchar(40) NOT NULL,
        Estado nvarchar(40) NOT NULL CONSTRAINT DF_UsuariosEntidadesAliadas_Estado DEFAULT (N'activo'),
        CONSTRAINT PK_UsuariosEntidadesAliadas PRIMARY KEY (IdUsuarioEntidadAliada),
        CONSTRAINT CK_UsuariosEntidadesAliadas_Rol CHECK (RolAliado IN (N'aliado_admin', N'aliado_editor', N'aliado_lector'))
    );
END;

/*
  GOTCHA VERIFICADO (SQL Server 2016) — extraido de V20260525_02__roles_finales_y_aliados.sql (~l.91-127):
  Renombrar (sp_rename) o reescribir una columna referenciada por un CHECK con valores NUEVOS
  falla mientras la restriccion vieja sigue vigente. Orden correcto e idempotente:
    1) DROP del CHECK heredado  2) sp_rename de la columna  3) UPDATE de valores  4) recrear el CHECK.
*/
-- IF OBJECT_ID(N'dbo.CK_UsuariosEntidadesColaboradoras_Rol', N'C') IS NOT NULL
--     ALTER TABLE dbo.UsuariosEntidadesAliadas DROP CONSTRAINT CK_UsuariosEntidadesColaboradoras_Rol;
-- EXEC sp_rename N'dbo.UsuariosEntidadesAliadas.RolEnEntidad', N'RolAliado', N'COLUMN';
-- UPDATE dbo.UsuariosEntidadesAliadas SET RolAliado = CASE RolAliado WHEN N'admin_entidad' THEN N'aliado_admin' ... END;
-- IF OBJECT_ID(N'dbo.CK_UsuariosEntidadesAliadas_Rol', N'C') IS NULL
--     ALTER TABLE dbo.UsuariosEntidadesAliadas ADD CONSTRAINT CK_UsuariosEntidadesAliadas_Rol CHECK (RolAliado IN (N'aliado_admin', N'aliado_editor', N'aliado_lector'));
