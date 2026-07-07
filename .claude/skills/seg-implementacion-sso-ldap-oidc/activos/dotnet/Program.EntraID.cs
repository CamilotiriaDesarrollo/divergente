// Program.EntraID.cs — Arranque OIDC contra Microsoft Entra ID para una API/web .NET de gobierno.
// Paquetes: Microsoft.Identity.Web  (+ Microsoft.Identity.Web.UI si hay páginas Razor de login).
//   dotnet add package Microsoft.Identity.Web
// Verificado contra Microsoft.Identity.Web 3.x (.NET 8/9/10). La versión mayor cambia APIs: fija el
// número exacto en el .csproj y re-verifica si actualizas (regla de frescura de la fábrica).
//
// NOTA de sabor:
//  - App WEB que inicia sesión al usuario (renderiza vistas)  -> AddMicrosoftIdentityWebApp
//  - API que solo VALIDA tokens de un SPA/otro cliente        -> AddMicrosoftIdentityWebApi (valida
//    firma vía JWKS + issuer + audience). NO uses el ID token como access token entre SPA y API.

using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Authentication.OpenIdConnect;
using Microsoft.AspNetCore.Authorization;
using Microsoft.Identity.Web;

var builder = WebApplication.CreateBuilder(args);

// 1) OIDC (Authorization Code Flow + PKCE lo activa la librería por defecto en apps web).
builder.Services
    .AddAuthentication(OpenIdConnectDefaults.AuthenticationScheme)
    .AddMicrosoftIdentityWebApp(builder.Configuration.GetSection("AzureAd"));

// 2) Autorización: la AUTORIZACIÓN VIVE EN EL BACKEND (regla de oro de la fábrica).
//    Los App roles de Entra llegan en el claim "roles" y Microsoft.Identity.Web los mapea a rol.
builder.Services.AddAuthorization(options =>
{
    options.AddPolicy("Administrador", p => p.RequireRole("Administrador"));
    options.AddPolicy("Editor", p => p.RequireRole("Administrador", "Editor"));
    // Por defecto TODO requiere usuario autenticado; se abre explícitamente con [AllowAnonymous].
    options.FallbackPolicy = new AuthorizationPolicyBuilder()
        .RequireAuthenticatedUser()
        .Build();
});

// 3) Sesión: timeout por inactividad <= 15 min (M-GSI-002), INDEPENDIENTE de la vida del token.
//    El token de Entra puede durar 1 h; la normativa exige cerrar la sesión de la app a los 15 min.
builder.Services.Configure<CookieAuthenticationOptions>(
    CookieAuthenticationDefaults.AuthenticationScheme, o =>
    {
        o.ExpireTimeSpan = TimeSpan.FromMinutes(15);
        o.SlidingExpiration = true;
        o.Cookie.HttpOnly = true;
        o.Cookie.SameSite = SameSiteMode.Lax;                 // anti-CSRF en el redirect de vuelta
        o.Cookie.SecurePolicy = CookieSecurePolicy.Always;    // solo HTTPS (TLS, DI-GSI-010 §6)
    });

var app = builder.Build();

app.UseHttpsRedirection();       // TLS extremo a extremo
app.UseAuthentication();
app.UseAuthorization();

// 4) Endpoint de ejemplo: el 403 lo decide el backend aunque la UI oculte el botón.
app.MapGet("/api/admin/ping", () => Results.Ok("pong"))
   .RequireAuthorization("Administrador");

// 5) Logout RP-initiated: cierra sesión local Y en Entra.
app.MapGet("/signout", () => Results.SignOut(
    new() { RedirectUri = "/" },
    [CookieAuthenticationDefaults.AuthenticationScheme, OpenIdConnectDefaults.AuthenticationScheme]));

app.Run();
