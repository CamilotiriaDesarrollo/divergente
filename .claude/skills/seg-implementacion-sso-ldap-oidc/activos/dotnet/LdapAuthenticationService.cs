// LdapAuthenticationService.cs — Autenticación contra Active Directory por LDAPS.
// Usar SOLO cuando la OTI no tenga Entra ID / Azure AD y exija Directorio Activo on-prem
// (DI-GSI-010 §6 acepta "LDAP — Directorio Activo de Windows O Azure AD"). Preferir OIDC/Entra.
//
// Paquete: System.DirectoryServices.Protocols (multiplataforma desde .NET 5; contra AD normalmente
//   sobre Windows Server). No requiere el módulo COM antiguo System.DirectoryServices.
//
// Patrón robusto de "search + bind": (1) bind con cuenta de servicio de solo lectura,
// (2) buscar al usuario con el FILTRO ESCAPADO (evita LDAP injection), (3) re-bind con el DN real
// y la contraseña del usuario para verificarla. Nunca construyas el filtro concatenando el input.

using System.DirectoryServices.Protocols;
using System.Net;
using System.Text;

public sealed record LdapOptions(
    string Host, int Port, string Domain, string BindDn, string BindPassword,
    string BaseDn, string UserFilter); // UserFilter con {0}, p.ej. "(sAMAccountName={0})"

public sealed class LdapAuthenticationService
{
    private readonly LdapOptions _o;
    public LdapAuthenticationService(LdapOptions o) => _o = o;

    public LdapAuthResult Authenticate(string username, string password)
    {
        // Bind anónimo con password vacío devuelve "éxito" en muchos AD: bloquéalo explícitamente.
        if (string.IsNullOrWhiteSpace(username) || string.IsNullOrEmpty(password))
            return LdapAuthResult.Fail();

        var id = new LdapDirectoryIdentifier(_o.Host, _o.Port);

        // 1) Bind con la cuenta de servicio (solo lectura) para localizar al usuario.
        using var svc = NewSecureConnection(id);
        svc.Bind(new NetworkCredential(_o.BindDn, _o.BindPassword));

        var filter = _o.UserFilter.Replace("{0}", EscapeLdapFilter(username));
        var search = new SearchRequest(_o.BaseDn, filter, SearchScope.Subtree,
            "distinguishedName", "displayName", "mail", "memberOf");
        var res = (SearchResponse)svc.SendRequest(search);
        if (res.Entries.Count != 1) return LdapAuthResult.Fail();

        var entry = res.Entries[0];
        var userDn = entry.DistinguishedName;

        // 2) Re-bind con el DN real + la contraseña del usuario => verifica la credencial.
        try
        {
            using var userConn = NewSecureConnection(id);
            userConn.Bind(new NetworkCredential(userDn, password));
        }
        catch (LdapException)
        {
            // No reveles si el usuario existe o si la clave es incorrecta (mensaje único).
            return LdapAuthResult.Fail();
        }

        var groups = entry.Attributes["memberOf"]?.GetValues(typeof(string))?.Cast<string>() ?? [];
        return LdapAuthResult.Ok(userDn, GetAttr(entry, "displayName"), GetAttr(entry, "mail"), groups);
    }

    private LdapConnection NewSecureConnection(LdapDirectoryIdentifier id)
    {
        var conn = new LdapConnection(id) { AuthType = AuthType.Basic };
        conn.SessionOptions.ProtocolVersion = 3;
        conn.SessionOptions.SecureSocketLayer = true;   // LDAPS obligatorio (TLS, DI-GSI-010 §6)
        conn.Timeout = TimeSpan.FromSeconds(30);
        return conn;
    }

    private static string GetAttr(SearchResultEntry e, string name) =>
        e.Attributes[name]?[0]?.ToString() ?? "";

    // Escapado RFC 4515 para valores usados dentro de un filtro LDAP.
    private static string EscapeLdapFilter(string input)
    {
        var sb = new StringBuilder(input.Length);
        foreach (var c in input)
            sb.Append(c switch
            {
                '\\' => "\\5c", '*' => "\\2a", '(' => "\\28",
                ')' => "\\29", '\0' => "\\00", _ => c.ToString()
            });
        return sb.ToString();
    }
}

public sealed record LdapAuthResult(bool Success, string? Dn, string? DisplayName, string? Mail, IEnumerable<string> Groups)
{
    public static LdapAuthResult Fail() => new(false, null, null, null, []);
    public static LdapAuthResult Ok(string dn, string name, string mail, IEnumerable<string> groups) =>
        new(true, dn, name, mail, groups);
}
