// ORIGEN (extracto verificado, NO copiar el archivo completo de 144 KB):
//   Plan Nacional de Musica SIMUS/Entorno_Virtual_PNMC/pnmc-api/src/PNMC.Api/Endpoints/AdminDataEndpoints.cs
//   - Endpoint POST /records/{moduleId}/{id}/status  (lineas ~553-579)
//   - Maquina de estados y guardas de rol (lineas ~1859-1925)
//   - Escritura de historial inmutable (lineas ~2000-2030)
//
// Regla de oro: la autorizacion del cambio de estado vive SIEMPRE en el backend.
// El frontend puede mostrar un boton, pero el backend rechaza la transicion invalida.
// 'ajustes_solicitados' es un estado PROPIO: nunca normalizarlo a 'en_revision'.

// ---------- 1) Endpoint: valida estado, resuelve estado actual, exige permiso, audita ----------
admin.MapPost("/records/{moduleId}/{id:int}/status", async (
    string moduleId, int id, AdminRecordStatusRequest request,
    PnmcDbContext dbContext, HttpContext httpContext, CancellationToken cancellationToken) =>
{
    var statusCode = CleanStatusCode(request.Status);
    // El estado destino debe existir en la tabla catalogo EstadosContenido
    if (!await dbContext.ContentStatuses.AsNoTracking().AnyAsync(s => s.Code == statusCode, cancellationToken))
        return Results.ValidationProblem(new Dictionary<string, string[]> { ["status"] = ["El estado no existe en EstadosContenido."] });

    var role = CleanRoleName(httpContext.User.FindFirstValue(ClaimTypes.Role));
    var previousStatus = await ResolveCurrentRecordStatusAsync(dbContext, moduleId, id, cancellationToken);
    if (previousStatus is null)
        return Results.NotFound(new { message = "Registro no encontrado o modulo no reconocido." });

    // El nucleo de gobernanza: cruza rol + estado actual + estado destino
    if (!CanSetRecordStatus(role, previousStatus, statusCode))
        return Results.ValidationProblem(new Dictionary<string, string[]>
        {
            ["permission"] = ["Tu rol no tiene permiso para aplicar ese cambio de estado."]
        });
    // ... (aplica el cambio y llama a WriteRevisionHistoryAsync) ...
});

// ---------- 2) Guardas de rol + maquina de estados ----------
private static bool CanSetRecordStatus(string role, string currentStatus, string targetStatus)
{
    if (role == "webmaster")                       // webmaster: puede fijar cualquier estado conocido
        return IsKnownContentStatus(targetStatus); //           (salto administrativo, aun asi auditado)

    if (!IsValidStatusTransition(currentStatus, targetStatus))
        return false;                              // transicion no contemplada -> rechazada

    return role switch                             // gestor_interno: solo decisiones de moderacion
    {
        "webmaster"      => true,
        "gestor_interno" => targetStatus is "ajustes_solicitados" or "aprobado" or "rechazado",
        _                => false                  // aliados/externos NO cambian estado editorial
    };
}

private static bool IsKnownContentStatus(string status) =>
    status is "borrador" or "en_revision" or "ajustes_solicitados"
        or "aprobado" or "publicado" or "rechazado" or "archivado";

// El grafo de transiciones permitidas (la unica verdad del flujo editorial):
private static bool IsValidStatusTransition(string currentStatus, string targetStatus) =>
    currentStatus switch
    {
        "borrador"            => targetStatus == "en_revision",
        "en_revision"         => targetStatus is "ajustes_solicitados" or "aprobado" or "rechazado",
        "ajustes_solicitados" => targetStatus == "en_revision",   // vuelve a revision, NO salta a publicado
        "aprobado"            => targetStatus == "publicado",
        "publicado"           => targetStatus == "archivado",
        _                     => false
    };

private static string ActionForStatus(string status) => status switch
{
    "en_revision"         => "enviar_revision",
    "ajustes_solicitados" => "solicitar_ajustes",
    "aprobado"            => "aprobar",
    "publicado"           => "publicar",
    "archivado"           => "archivar",
    "rechazado"           => "rechazar",
    _                     => "actualizar"
};

// ---------- 3) Auditoria inmutable: INSERT-only, nunca UPDATE/DELETE ----------
private static async Task WriteRevisionHistoryAsync(
    PnmcDbContext dbContext, string moduleId, string recordId,
    string previousStatus, string nextStatus, string action, int userId,
    string? comment, string? rejectionReason, string? observedFieldsJson,
    CancellationToken cancellationToken)
{
    // Solo INSERT: cada transicion deja una fila con estado previo/nuevo, accion, autor y fecha UTC.
    await dbContext.Database.ExecuteSqlInterpolatedAsync($@"
        INSERT INTO dbo.RegistrosRevisionHistorial
            (ModuloId, RegistroId, EstadoAnterior, EstadoNuevo, Accion, Comentario, MotivoRechazo, CamposObservados, IdUsuario, Fecha)
        VALUES
            ({moduleId}, {recordId}, {previousStatus}, {nextStatus}, {action}, {comment}, {rejectionReason}, {observedFieldsJson}, {userId}, SYSUTCDATETIME())",
        cancellationToken);
}
