// activos/logger-node/logger.ts
// Logger estructurado (JSON) para la LÍNEA PRIVADA (Express + TS y route handlers Next.js/Node).
// Cierra el vacío "solo /api/health": emite logs JSON con nivel, timestamp, servicio y
// correlationId, y REDACTA datos sensibles (Habeas Data, Ley 1581 — ver seg-habeas-data-implementacion).
//
// N0 (sin verificar aún en proyecto propio): fijada contra pino v9. Confirma la versión antes de usar:
//   npm i pino pino-http
//   npm i -D pino-pretty   (solo dev; pino trae sus propios tipos)
import pino from 'pino';

const nivel =
  process.env.LOG_LEVEL ?? (process.env.NODE_ENV === 'production' ? 'info' : 'debug');

export const logger = pino({
  level: nivel,
  // En prod: JSON a stdout (lo captura Vercel o el colector OTLP). En dev: legible con pino-pretty.
  transport:
    process.env.NODE_ENV !== 'production'
      ? { target: 'pino-pretty', options: { colorize: true, translateTime: 'SYS:standard' } }
      : undefined,
  base: {
    servicio: process.env.OTEL_SERVICE_NAME ?? '${SERVICE_NAME}',
    entorno: process.env.NODE_ENV ?? 'development',
  },
  timestamp: pino.stdTimeFunctions.isoTime,
  // REDACCIÓN OBLIGATORIA: nunca registrar credenciales ni datos personales en claro.
  redact: {
    paths: [
      'req.headers.authorization',
      'req.headers.cookie',
      'password',
      '*.password',
      'contrasena',
      '*.contrasena',
      'cedula',
      '*.cedula',
      'correo',
      '*.correo',
      'token',
      '*.token',
    ],
    censor: '[REDACTADO]',
  },
});

export type Logger = typeof logger;
