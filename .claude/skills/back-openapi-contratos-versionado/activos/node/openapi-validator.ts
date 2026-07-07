// openapi-validator.ts — cablea express-openapi-validator para que el contrato
// se ENFORCE en runtime: valida requests (y responses en dev/CI) contra openapi.yaml.
// Con esto, cualquier test de integracion existente pasa a ser test de contrato.
// Se monta en el app.ts del server (ver skill back-api-express-typescript-minima).
import express, { type Request, type Response, type NextFunction } from 'express';
import * as OpenApiValidator from 'express-openapi-validator';

export const app = express();
app.use(express.json());

app.use(
  OpenApiValidator.middleware({
    apiSpec: './contracts/openapi.yaml',
    validateRequests: true,
    // validateResponses: caro en prod. Encenderlo en NODE_ENV !== 'production'
    // para atrapar respuestas que rompan el contrato durante desarrollo/CI.
    validateResponses: process.env.NODE_ENV !== 'production',
  }),
);

// TODO: montar aqui los routers reales bajo /api/v1 (mismo prefijo que el server.url del contrato).

// Handler de errores -> Problem Details (RFC 9457) con content-type application/problem+json.
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  const status = err.status ?? 500;
  res.status(status).type('application/problem+json').json({
    type: 'about:blank',
    title: err.message ?? 'Error interno',
    status,
    detail: err.errors ? JSON.stringify(err.errors) : undefined,
  });
});
