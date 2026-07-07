// PersonaDtos.cs — Patrón de doble DTO para Habeas Data (Ley 1581/2012).
// Regla de oro: los endpoints PÚBLICOS solo pueden emitir el DTO enmascarado.
// El DTO administrativo SOLO se sirve tras verificar el rol EN EL BACKEND (nunca en el front).
// Analogía real: en el PNMC son MarcadorPublicoDto vs MarcadorDetalleAdministrativoDto.
// Adaptar el namespace ${Proyecto} y los nombres de campo al dominio.
using ${Proyecto}.Application.Common;   // Enmascaramiento (utilidades puras)

namespace ${Proyecto}.Application.Personas.Dtos;

/// DTO PÚBLICO. Nunca incluye documento, correo completo, teléfono ni dirección exacta.
public sealed record PersonaPublicoDto(
    int Id,
    string NombreVisible,          // solo primer nombre + inicial del apellido
    string? Ciudad,                // ubicación aproximada, jamás dirección exacta
    string? CorreoEnmascarado,     // c****@dominio.com (omitir si no hay finalidad que lo justifique)
    string? TelefonoEnmascarado    // 3**-***-89
);

/// DTO ADMINISTRATIVO. Requiere autenticación + rol. Se proyecta solo en endpoints protegidos.
public sealed record PersonaAdministrativoDto(
    int Id,
    string Nombres,
    string Apellidos,
    string Documento,              // documento en claro SOLO aquí
    string Correo,
    string Telefono,
    string DireccionExacta,
    bool ConsentimientoVigente,   // proyectado desde dbo.ConsentimientoVigente
    DateTime? FechaConsentimiento
);

/// Proyecciones. Mantener el mapeo público en un solo lugar evita fugas por copiar/pegar.
public static class PersonaProjections
{
    public static PersonaPublicoDto AVistaPublica(this Persona p) => new(
        p.Id,
        Enmascaramiento.NombreVisible(p.Nombres, p.Apellidos),
        p.Ciudad,
        Enmascaramiento.Correo(p.Correo),
        Enmascaramiento.Telefono(p.Telefono)
    );

    public static PersonaAdministrativoDto AVistaAdministrativa(this Persona p, bool consentVigente) => new(
        p.Id, p.Nombres, p.Apellidos, p.Documento, p.Correo, p.Telefono, p.DireccionExacta,
        consentVigente, p.FechaConsentimiento
    );
}
