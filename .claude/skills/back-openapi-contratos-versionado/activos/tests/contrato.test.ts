// contrato.test.ts — test de contrato del lado Node (Vitest + supertest).
// Ejercita el app con express-openapi-validator montado (ver activos/node/openapi-validator.ts):
// si la peticion/respuesta viola el contrato, el middleware responde 4xx y el test lo verifica.
// Script sugerido en package.json:  "test:contract": "vitest run tests/contrato.test.ts"
import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { app } from '../src/app'; // el Express app que monta el validador

describe('contrato /api/v1/sistemas', () => {
  it('rechaza pageSize fuera de rango (max 100) con 400 problem+json', async () => {
    const res = await request(app).get('/api/v1/sistemas?pageSize=999');
    expect(res.status).toBe(400);
    expect(res.headers['content-type']).toMatch(/application\/problem\+json/);
  });

  it('devuelve 200 con la forma del contrato (data[] + paginacion)', async () => {
    const res = await request(app).get('/api/v1/sistemas');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body).toHaveProperty('total');
  });

  it('rechaza id no-uuid en la ruta con 400', async () => {
    const res = await request(app).get('/api/v1/sistemas/no-es-uuid');
    expect(res.status).toBe(400);
  });
});
