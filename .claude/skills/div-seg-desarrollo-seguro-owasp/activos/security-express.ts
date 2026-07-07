// PLANTILLA (sin verificar en proyecto propio) — endurecimiento base de una API Express/Node de Divergente.
// Hermana divergente del SecurityHeadersMiddleware.cs + GlobalExceptionMiddleware.cs de la línea gobierno,
// pero SIN normativa estatal: el baseline lo fija Divergente sobre OWASP Top 10 + ASVS L2.
//
// Deps sugeridas: express, helmet, cors, express-rate-limit, cookie-parser, zod.
//   npm i helmet cors express-rate-limit cookie-parser zod
//
// Orden del pipeline (equivalente al de la línea gobierno, en clave Express):
//   helmet -> cors(por env) -> body parser -> cookieParser -> rateLimit(rutas públicas)
//   -> routers -> notFound -> errorHandler(al final)

import express, { type Request, type Response, type NextFunction } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import cookieParser from 'cookie-parser';

const isProd = process.env.NODE_ENV === 'production';
const app = express();

// 1) Cabeceras de seguridad + CSP. helmet trae buenos defaults (nosniff, frameguard DENY,
//    Referrer-Policy...), PERO su CSP por defecto NO encaja con tu app: defínela explícita.
app.use(
  helmet({
    contentSecurityPolicy: {
      useDefaults: true,
      directives: {
        defaultSrc: ["'self'"],
        // Ajusta a los orígenes reales de tu app (Vercel, Postgres proxy, etc.). No dejes 'unsafe-inline'.
        scriptSrc: ["'self'"],
        connectSrc: ["'self'"],
        imgSrc: ["'self'", 'data:'],
        objectSrc: ["'none'"],
        frameAncestors: ["'none'"],
      },
    },
    crossOriginResourcePolicy: { policy: 'same-site' },
  }),
);

// 2) CORS restringido a un solo origin leído de env — nunca cors() abierto.
app.use(
  cors({
    origin: process.env.CLIENT_URL ?? 'http://localhost:5173',
    credentials: true, // solo si usas cookies de sesión cross-site
  }),
);

app.use(express.json({ limit: '1mb' })); // límite explícito de body (anti-DoS por payload)
app.use(cookieParser());

// 3) Rate limiting en rutas públicas (login, registro, formularios abiertos).
//    Aplícalo por router: app.use('/api/auth', authLimiter, authRouter)
export const publicLimiter = rateLimit({
  windowMs: 60_000,
  limit: 10, // p.ej. registro/login externo: 10/min por IP
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { error: 'Too many requests' },
});

// 4) Autorización SIEMPRE en el backend (regla de oro, stack-neutral).
//    403 aunque la UI lo permita. Deny-by-default. Resuelve rol/tenant en cada request.
export function requireRole(...roles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = (req as Request & { user?: { id: string; role: string; tenantId?: string } }).user;
    if (!user) return res.status(401).json({ error: 'Unauthorized' });
    if (!roles.includes(user.role)) return res.status(403).json({ error: 'Forbidden' });
    return next();
  };
}

// Confinamiento multi-tenant: nunca confíes en el tenantId que venga del cliente;
// tómalo de la sesión y fíltralo en la query.
//   const rows = await db.query('select ... where tenant_id = $1', [req.user.tenantId])

// 5) 404 controlado.
app.use((_req: Request, res: Response) => res.status(404).json({ error: 'Not found' }));

// 6) Manejador de errores AL FINAL: detalle técnico solo fuera de producción (NODE_ENV gate).
//    Equivale al GlobalExceptionMiddleware.cs de la línea gobierno ("mínima información en errores").
app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  const status = (err as { statusCode?: number })?.statusCode ?? 500;
  // Loguea el error completo del lado servidor (sin filtrarlo al cliente).
  console.error(err);
  res.status(status).json(
    isProd
      ? { error: 'Internal Server Error' }
      : { error: (err as Error)?.message, stack: (err as Error)?.stack },
  );
});

export default app;
