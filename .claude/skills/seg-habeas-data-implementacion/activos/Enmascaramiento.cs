// Enmascaramiento.cs — Utilidades puras para enmascarar datos personales (Ley 1581/2012).
// Sin dependencias externas. Cópialo a ${Proyecto}.Application.Common/.
// Nota: enmascarar es reducir exposición, NO cifrar. El dato en claro sigue en BD para el rol autorizado.
using System.Linq;

namespace ${Proyecto}.Application.Common;

public static class Enmascaramiento
{
    public static string? Correo(string? correo)
    {
        if (string.IsNullOrWhiteSpace(correo) || !correo.Contains('@')) return null;
        var p = correo.Split('@', 2);
        var local = p[0];
        var visible = local.Length <= 1 ? local : local[0] + new string('*', System.Math.Min(local.Length - 1, 6));
        return $"{visible}@{p[1]}";
    }

    public static string? Telefono(string? tel)
    {
        if (string.IsNullOrWhiteSpace(tel)) return null;
        var d = new string(tel.Where(char.IsDigit).ToArray());
        if (d.Length < 4) return "***";
        return $"{d[0]}{new string('*', d.Length - 3)}{d[^2..]}";
    }

    // Para logs/soporte; NUNCA exponer en un DTO público.
    public static string Documento(string? doc)
        => string.IsNullOrEmpty(doc) || doc.Length < 4 ? "****" : new string('*', doc.Length - 4) + doc[^4..];

    public static string NombreVisible(string? nombres, string? apellidos)
    {
        var n = (nombres ?? string.Empty).Trim().Split(' ').FirstOrDefault() ?? string.Empty;
        var a = string.IsNullOrWhiteSpace(apellidos) ? string.Empty : apellidos.Trim()[0] + ".";
        return $"{n} {a}".Trim();
    }
}
