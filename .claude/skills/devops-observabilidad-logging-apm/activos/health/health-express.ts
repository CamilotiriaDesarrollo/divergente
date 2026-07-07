// activos/health/health-express.ts
// Sube /api/health de "timestamp y ya" a health checks REALES: liveness + readiness con sondeo de dependencias.
// Diferencia clave:
//   - liveness  (/api/health/live)  -> ¿el proceso está vivo? (para el orquestador o el monitor de uptime)
//   - readiness (/api/health/ready) -> ¿puede atender? Comprueba BD y dependencias críticas; 503 si alguna falla.
// DI-GSI-010 / M-GSI-002: el endpoint de readiness alimenta el monitoreo y las alertas de disponibilidad.
import { Router, type Request, type Response } from 'express';

// Inyecta aquí tu comprobación real de cada dependencia. Ejemplos:
//   - SQL Server (mssql):   async () => { await pool.request().query('SELECT 1'); }
//   - Postgres (pg):        async () => { await pool.query('SELECT 1'); }
type Probe = () => Promise<void>;

export function crearHealthRouter(probes: Record<string, Probe> = {}): Router {
  const router = Router();
  const inicio = Date.now();

  // Liveness: barato, sin tocar dependencias.
  router.get('/live', (_req: Request, res: Response) => {
    res.status(200).json({ status: 'ok', check: 'live', timestamp: new Date().toISOString() });
  });

  // Readiness: comprueba cada dependencia en paralelo; 503 si alguna falla.
  router.get('/ready', async (_req: Request, res: Response) => {
    const resultados: Record<string, 'ok' | 'fail'> = {};
    let saludable = true;
    await Promise.all(
      Object.entries(probes).map(async ([nombre, probe]) => {
        try {
          await probe();
          resultados[nombre] = 'ok';
        } catch {
          resultados[nombre] = 'fail';
          saludable = false;
        }
      }),
    );
    res.status(saludable ? 200 : 503).json({
      status: saludable ? 'ok' : 'degraded',
      check: 'ready',
      dependencias: resultados,
      uptime_s: Math.round((Date.now() - inicio) / 1000),
      timestamp: new Date().toISOString(),
    });
  });

  // Compat: /api/health original (no romper monitores ya configurados).
  router.get('/', (_req, res) =>
    res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() }),
  );

  return router;
}

// Montaje en Express:
//   import { crearHealthRouter } from './health-express';
//   app.use('/api/health', crearHealthRouter({
//     sqlserver: async () => { await pool.request().query('SELECT 1'); },
//   }));
