// MEDIO de la pirámide para la LÍNEA GOBIERNO (.NET / SQL Server).
// El estándar de codificación M-GSI-002 aplica también al código de pruebas.
// Prueba de integración de API con WebApplicationFactory<Program> + xUnit:
// levanta la app en memoria y ejerce las rutas reales sin desplegar.
// SIN secretos: la cadena de conexión de test entra por configuración/entorno
// (appsettings.Testing.json o variables), nunca embebida en el código.
using System.Net;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc.Testing;
using Xunit;

public class OfertasApiTests : IClassFixture<WebApplicationFactory<Program>>
{
    private readonly HttpClient _client;

    public OfertasApiTests(WebApplicationFactory<Program> factory)
        => _client = factory.CreateClient();

    [Fact]
    public async Task Get_Ofertas_RetornaOk()
    {
        var resp = await _client.GetAsync("/api/v1/ofertas?departamento=${DEPARTAMENTO}");
        Assert.Equal(HttpStatusCode.OK, resp.StatusCode);
    }

    [Theory]
    [InlineData("")]
    [InlineData("   ")]
    public async Task Get_Ofertas_ParametroInvalido_Retorna400(string departamento)
    {
        var resp = await _client.GetAsync($"/api/v1/ofertas?departamento={departamento}");
        Assert.Equal(HttpStatusCode.BadRequest, resp.StatusCode);
    }
}

// NOTA: WebApplicationFactory<Program> exige que la clase Program sea accesible.
// En minimal API hay que exponerla añadiendo al final de Program.cs:
//     public partial class Program { }
// Para no golpear la BD real, sustituye el DbContext por uno de test (SQL Server
// efímero en contenedor, o InMemory solo si no dependes de features de SQL Server).
