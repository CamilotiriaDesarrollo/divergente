// activos/dotnet/Observabilidad.Setup.cs
// Observabilidad para la LÍNEA GOBIERNO (.NET / SQL Server, GitLab institucional).
// Serilog (logging estructurado) + OpenTelemetry (trazas/métricas) + HealthChecks (SQL Server).
// APM: Azure Monitor / Application Insights (ya contemplado en el plan) VÍA OpenTelemetry Distro,
// o un colector OTLP propio si los datos deben quedarse on-prem (DI-GSI-010 — decisión abierta, ver SKILL §4).
//
// N0 (sin verificar aún en proyecto propio). Paquetes NuGet (confirma versiones para tu TFM, .NET 8/9):
//   Serilog.AspNetCore, Serilog.Formatting.Compact
//   OpenTelemetry.Extensions.Hosting, OpenTelemetry.Instrumentation.AspNetCore,
//   OpenTelemetry.Instrumentation.Http, OpenTelemetry.Instrumentation.SqlClient, OpenTelemetry.Exporter.OpenTelemetryProtocol
//   Azure.Monitor.OpenTelemetry.AspNetCore   (SOLO si se usa Application Insights)
//   AspNetCore.HealthChecks.SqlServer
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Diagnostics.HealthChecks;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using OpenTelemetry.Metrics;
using OpenTelemetry.Resources;
using OpenTelemetry.Trace;
using Serilog;
using Serilog.Formatting.Compact;

public static class ObservabilidadSetup
{
    public static WebApplicationBuilder AgregarObservabilidad(this WebApplicationBuilder builder)
    {
        var servicio = builder.Configuration["Observabilidad:ServiceName"] ?? "${SERVICE_NAME}";

        // 1) Serilog: JSON compacto a consola (lo recoge Docker o el colector) + enriquecido.
        builder.Host.UseSerilog((ctx, cfg) => cfg
            .ReadFrom.Configuration(ctx.Configuration)      // niveles/sinks desde appsettings
            .Enrich.FromLogContext()
            .Enrich.WithProperty("servicio", servicio)
            .WriteTo.Console(new CompactJsonFormatter()));

        // 2) OpenTelemetry: trazas + métricas con instrumentación automática.
        var otel = builder.Services.AddOpenTelemetry()
            .ConfigureResource(r => r.AddService(servicio))
            .WithTracing(t => t
                .AddAspNetCoreInstrumentation()
                .AddHttpClientInstrumentation()
                .AddSqlClientInstrumentation())
            .WithMetrics(m => m
                .AddAspNetCoreInstrumentation()
                .AddHttpClientInstrumentation());

        // 2a) APM: elige UNO según la decisión de residencia de datos (DI-GSI-010).
        //   Opción A (nube Azure): descomenta si hay Application Insights aprobado.
        //     otel.UseAzureMonitor(); // requiere Azure.Monitor.OpenTelemetry.AspNetCore + APPLICATIONINSIGHTS_CONNECTION_STRING (por env/Key Vault)
        //   Opción B (on-prem OTLP): exporta a un colector propio (Grafana/Tempo). Config por env:
        //     OTEL_EXPORTER_OTLP_ENDPOINT=${OTLP_ENDPOINT}
        otel.UseOtlpExporter();

        // 3) Health checks: readiness con SQL Server (tag "ready"). Liveness no lleva checks.
        builder.Services.AddHealthChecks()
            .AddSqlServer(
                connectionString: builder.Configuration.GetConnectionString("${DB_CONNECTION_NAME}")!,
                healthQuery: "SELECT 1;",
                name: "sqlserver",
                tags: new[] { "ready" });

        return builder;
    }

    public static WebApplication MapearObservabilidad(this WebApplication app)
    {
        app.UseSerilogRequestLogging(); // una línea estructurada por request, con el TraceId de la petición
        // Liveness: sin ejecutar checks -> responde 200 mientras el proceso viva.
        app.MapHealthChecks("/health/live", new HealthCheckOptions { Predicate = _ => false });
        // Readiness: ejecuta solo los checks con tag "ready" (BD y dependencias críticas).
        app.MapHealthChecks("/health/ready", new HealthCheckOptions { Predicate = r => r.Tags.Contains("ready") });
        return app;
    }
}

// Uso en Program.cs:
//   builder.AgregarObservabilidad();
//   var app = builder.Build();
//   app.MapearObservabilidad();
