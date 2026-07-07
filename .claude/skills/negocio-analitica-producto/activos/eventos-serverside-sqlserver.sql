-- eventos-serverside-sqlserver.sql
-- Opción para la LÍNEA GOBIERNO (.NET / SQL Server) cuando el dato de uso
-- NO puede salir de la infraestructura de la entidad (residencia de datos,
-- DI-GSI-010 / Habeas Data Ley 1581/2012). En vez de un tercero (Google),
-- se registran eventos de uso en la propia BD y se agregan para el informe.
--
-- Convenciones alineadas con datos-sqlserver-convenciones-y-scripts-versionados:
--   PascalCase, script idempotente y versionado.
-- NO guardar PII: nada de cédula/correo/nombre. Usuario referenciado por Id
-- interno, y solo si la capa lo requiere. IP anonimizada (último octeto a 0).

IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'EventosUso')
BEGIN
    CREATE TABLE dbo.EventosUso (
        EventoUsoId   BIGINT IDENTITY(1,1) PRIMARY KEY,
        Evento        NVARCHAR(64)  NOT NULL,   -- ver tracking-plan.csv
        Propiedades   NVARCHAR(MAX) NULL,       -- JSON, SIN PII (validar en app)
        CapaAcceso    NVARCHAR(16)  NOT NULL,   -- publico | registrado | interno
        Region        NVARCHAR(64)  NULL,       -- departamento, no dirección
        SesionHash    CHAR(16)      NULL,       -- id de sesión pseudonimizado
        FechaUtc      DATETIME2(0)  NOT NULL CONSTRAINT DF_EventosUso_Fecha DEFAULT SYSUTCDATETIME()
    );
    CREATE INDEX IX_EventosUso_Evento_Fecha ON dbo.EventosUso (Evento, FechaUtc);
END
GO

-- Vista de apropiación mensual (producto/resultado de la cadena de valor DNP).
CREATE OR ALTER VIEW dbo.vw_ApropiacionMensual AS
SELECT
    CONVERT(CHAR(7), FechaUtc, 126)              AS Mes,           -- yyyy-MM
    COUNT(DISTINCT SesionHash)                    AS SesionesUnicas,
    SUM(CASE WHEN Evento = 'registro_completado' THEN 1 ELSE 0 END) AS Activaciones,
    SUM(CASE WHEN Evento = 'ficha_vista'         THEN 1 ELSE 0 END) AS FichasConsultadas,
    COUNT(DISTINCT Region)                        AS DepartamentosConUso
FROM dbo.EventosUso
GROUP BY CONVERT(CHAR(7), FechaUtc, 126);
GO
