// Program.cs (fragmento) — .NET 10 Minimal API con VERSIONADO por segmento de URL
// y documento OpenAPI NATIVO (Microsoft.AspNetCore.OpenApi, integrado desde .NET 9).
// Paquetes NuGet: Asp.Versioning.Http (verificar major actual, probado 8.x),
//                 Scalar.AspNetCore (UI moderna; Swashbuckle ya no viene en la plantilla por defecto).
// Encaja en la capa "Servicios Distribuidos" del M-GSI-002 (ver back-arquitectura-ncapas-ddd-dotnet).
using Asp.Versioning;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddApiVersioning(options =>
{
    options.DefaultApiVersion = new ApiVersion(1, 0);
    options.AssumeDefaultVersionWhenUnspecified = true;
    options.ReportApiVersions = true; // emite headers api-supported-versions / api-deprecated-versions
    options.ApiVersionReader = new UrlSegmentApiVersionReader();
});

builder.Services.AddOpenApi("v1"); // un documento OpenAPI por version

var app = builder.Build();

app.MapOpenApi(); // expone /openapi/v1.json  (fuente para Spectral/oasdiff en CI)

var versionSet = app.NewApiVersionSet()
    .HasApiVersion(new ApiVersion(1, 0))
    .Build();

var v1 = app.MapGroup("/api/v{version:apiVersion}")
    .WithApiVersionSet(versionSet)
    .MapToApiVersion(1, 0);

v1.MapGet("/sistemas", (int page = 1, int pageSize = 20) =>
    Results.Ok(new { data = Array.Empty<object>(), page, pageSize, total = 0 }))
    .WithName("listarSistemas");

app.Run();
