// activos/nextjs/instrumentation.ts
// Instrumentación OpenTelemetry para Next.js (LÍNEA PRIVADA, deploy Vercel).
// Colócalo en la RAÍZ del proyecto (junto a next.config.js) o en src/ si usas ese layout.
// Next.js llama a register() automáticamente al arrancar. El archivo 'instrumentation.ts' es estable
// desde Next 15: ya NO requiere experimental.instrumentationHook (ese flag solo hacía falta en Next 13/14).
// En Next 16 sigue sin necesitarlo — verifica de todos modos en tu versión.
//
// N0 (sin verificar aún en proyecto propio):
//   npm i @vercel/otel @opentelemetry/api
// @vercel/otel gestiona el flush de spans en entorno serverless (evita perder trazas al congelarse la función).
import { registerOTel } from '@vercel/otel';

export function register() {
  registerOTel({
    serviceName: process.env.OTEL_SERVICE_NAME ?? '${SERVICE_NAME}',
    // Por defecto exporta a Vercel/OTLP. Para enviar a un colector propio (gobierno on-prem),
    // define en el entorno:  OTEL_EXPORTER_OTLP_ENDPOINT=${OTLP_ENDPOINT}
    // (p.ej. http://otel-collector:4318). Ver activos/selfhosted/.
  });
}
