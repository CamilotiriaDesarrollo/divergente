-- 202607_consentimiento_y_retencion.sql  (SQL Server, script versionado e idempotente)
-- Habeas Data: Ley 1581/2012 + Decreto 1074/2015. Evidencia de consentimiento previo, expreso e informado
-- y soporte de la política de retención. Convenciones alineadas con datos-sqlserver-convenciones-y-scripts-versionados.
-- Las columnas IpOrigen/HashEvidencia atienden el mínimo de auditoría de DI-GSI-010.

-------------------------------------------------------------------------------
-- 1) Registro de consentimiento por finalidad (una fila por otorgamiento)
-------------------------------------------------------------------------------
IF OBJECT_ID('dbo.ConsentimientoTratamiento', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.ConsentimientoTratamiento (
        Id               BIGINT IDENTITY(1,1) CONSTRAINT PK_ConsentimientoTratamiento PRIMARY KEY,
        TitularId        INT           NOT NULL,
        FinalidadCodigo  VARCHAR(40)   NOT NULL,   -- 'BOLETIN', 'CONTACTO_ALIADO', ... (ver politica-retencion.yaml)
        PoliticaVersion  VARCHAR(20)   NOT NULL,   -- versión del aviso de privacidad aceptado
        Canal            VARCHAR(30)   NOT NULL,   -- 'WEB_FORM', 'IMPORTACION', 'ADMIN', ...
        IpOrigen         VARCHAR(45)   NULL,       -- IPv4/IPv6 (exigido por DI-GSI-010)
        UserAgent        VARCHAR(400)  NULL,
        HashEvidencia    CHAR(64)      NOT NULL,   -- SHA-256 de {TitularId|Finalidad|PoliticaVersion|FechaOtorgado}
        FechaOtorgado    DATETIME2     NOT NULL CONSTRAINT DF_Consent_Otorgado DEFAULT SYSUTCDATETIME(),
        FechaRevocado    DATETIME2     NULL        -- NULL = vigente
    );
    CREATE INDEX IX_Consent_TitularFinalidad
        ON dbo.ConsentimientoTratamiento (TitularId, FinalidadCodigo)
        WHERE FechaRevocado IS NULL;
END
GO

-------------------------------------------------------------------------------
-- 2) Vista de conveniencia: consentimientos vigentes
-------------------------------------------------------------------------------
CREATE OR ALTER VIEW dbo.ConsentimientoVigente AS
    SELECT TitularId, FinalidadCodigo, PoliticaVersion, FechaOtorgado
    FROM dbo.ConsentimientoTratamiento
    WHERE FechaRevocado IS NULL;
GO

-------------------------------------------------------------------------------
-- 3) Purga por retención (principio de finalidad y temporalidad, Ley 1581/2012).
--    ANONIMIZA (no borra) titulares sin finalidad vigente y vencidos por inactividad.
--    Requiere en dbo.Persona: Anonimizado BIT, FechaAnonimizado DATETIME2 NULL, FechaUltimaActividad DATETIME2.
--    Ejecutar como cambio controlado (ITIL M-GSI-003); ver Gotchas antes de correrlo en producción.
-------------------------------------------------------------------------------
CREATE OR ALTER PROCEDURE dbo.sp_PurgarPorRetencion
    @DiasRetencion INT = 1825,      -- 5 años por defecto; ajústese por finalidad
    @DryRun        BIT = 1          -- 1 = solo cuenta; 0 = aplica
AS
BEGIN
    SET NOCOUNT ON;

    IF @DryRun = 1
    BEGIN
        SELECT COUNT(*) AS TitularesAAnonimizar
        FROM dbo.Persona p
        WHERE p.Anonimizado = 0
          AND NOT EXISTS (SELECT 1 FROM dbo.ConsentimientoVigente c WHERE c.TitularId = p.Id)
          AND p.FechaUltimaActividad < DATEADD(DAY, -@DiasRetencion, SYSUTCDATETIME());
        RETURN;
    END

    UPDATE p SET
        p.Documento        = CONCAT('ANON-', p.Id),
        p.Correo           = NULL,
        p.Telefono         = NULL,
        p.DireccionExacta  = NULL,
        p.Anonimizado      = 1,
        p.FechaAnonimizado = SYSUTCDATETIME()
    FROM dbo.Persona p
    WHERE p.Anonimizado = 0
      AND NOT EXISTS (SELECT 1 FROM dbo.ConsentimientoVigente c WHERE c.TitularId = p.Id)
      AND p.FechaUltimaActividad < DATEADD(DAY, -@DiasRetencion, SYSUTCDATETIME());
END
GO
