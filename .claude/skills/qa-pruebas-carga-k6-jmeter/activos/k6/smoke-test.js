// smoke-test.js — Prueba de humo de rendimiento (gate rápido de CI, <30s).
// Verifica que el sistema responde correctamente bajo carga MÍNIMA antes de invertir
// en una prueba de carga completa. Si esto falla, no tiene sentido seguir.
//
// Uso:  k6 run smoke-test.js -e BASE_URL=https://staging.example.co
// Nunca cablear URL ni secretos: se pasan por -e y se leen con __ENV.

import http from 'k6/http';
import { check } from 'k6';

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';

export const options = {
  vus: 2,
  duration: '30s',
  thresholds: {
    // Umbrales laxos: aquí solo confirmamos que "funciona", no medimos SLO fino.
    http_req_failed: ['rate<0.01'], // <1% de errores HTTP
    http_req_duration: ['p(95)<800'],
  },
};

export default function () {
  const res = http.get(`${BASE_URL}/`);
  check(res, {
    'status 200': (r) => r.status === 200,
    'cuerpo no vacío': (r) => r.body && r.body.length > 0,
  });
}
