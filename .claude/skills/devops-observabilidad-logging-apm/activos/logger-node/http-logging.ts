// activos/logger-node/http-logging.ts
// Middleware de logging de peticiones con correlationId (trazabilidad extremo a extremo).
// Uso en Express:  app.use(httpLogger)
// El id llega por cabecera 'x-correlation-id' (si un gateway u otro servicio lo propaga) o se genera.
// N0 (sin verificar aún en proyecto propio): fijada contra pino-http v10 / pino v9.
import pinoHttp from 'pino-http';
import { randomUUID } from 'node:crypto';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { logger } from './logger';

export const httpLogger = pinoHttp({
  logger,
  genReqId: (req: IncomingMessage, res: ServerResponse) => {
    const existente = (req.headers['x-correlation-id'] as string) || randomUUID();
    res.setHeader('x-correlation-id', existente);
    return existente;
  },
  // No inundar los logs con el health check (el monitor de uptime lo golpea cada pocos segundos).
  autoLogging: {
    ignore: (req) => req.url === '/api/health' || Boolean(req.url?.startsWith('/api/health/')),
  },
  // Errores 5xx -> error; 4xx -> warn; resto -> info.
  customLogLevel: (_req, res, err) => {
    if (res.statusCode >= 500 || err) return 'error';
    if (res.statusCode >= 400) return 'warn';
    return 'info';
  },
});
