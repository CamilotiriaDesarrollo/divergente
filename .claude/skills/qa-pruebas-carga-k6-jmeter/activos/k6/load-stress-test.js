// load-stress-test.js — Prueba de carga (y estrés opcional) con k6.
// Verificado contra la API estable de k6 v1.x (options/scenarios/thresholds).
//
// Uso:
//   k6 run load-stress-test.js -e BASE_URL=https://staging.example.co -e TOKEN=xxxx
// Reporte HTML (k6 >= v0.49):
//   $env:K6_WEB_DASHBOARD="true"; $env:K6_WEB_DASHBOARD_EXPORT="reporte-carga.html"
//   k6 run load-stress-test.js -e BASE_URL=... --summary-export=summary.json
//
// k6 devuelve exit code 99 si se incumple algún threshold -> falla el pipeline (gate).

import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Trend, Rate } from 'k6/metrics';

// --- Configuración por entorno (nunca hardcodear) ---
const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';
const TOKEN = __ENV.TOKEN || '';

// --- Métricas de negocio custom ---
const erroresNegocio = new Rate('errores_negocio');
const tBusqueda = new Trend('t_busqueda_ms', true);

export const options = {
  scenarios: {
    // Carga esperada: rampa -> meseta sostenida -> bajada.
    carga_normal: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '1m', target: 20 }, // rampa de subida
        { duration: '3m', target: 20 }, // meseta = concurrencia esperada
        { duration: '1m', target: 0 },  // bajada
      ],
      gracefulRampDown: '30s',
      tags: { tipo: 'carga' },
    },

    // Estrés (opcional): modelo de llegada abierto para buscar el punto de quiebre.
    // Descomentar para medir RPS crecientes. startTime lo corre tras la carga normal.
    // estres: {
    //   executor: 'ramping-arrival-rate',
    //   startRate: 10, timeUnit: '1s',
    //   preAllocatedVUs: 50, maxVUs: 500,
    //   stages: [
    //     { duration: '2m', target: 50 },
    //     { duration: '2m', target: 150 },
    //     { duration: '2m', target: 0 },
    //   ],
    //   tags: { tipo: 'estres' },
    //   startTime: '5m',
    // },
  },

  // SLO aprobado por el Dueño (decisión abierta del blueprint). AJUSTAR a los valores reales.
  thresholds: {
    http_req_duration: ['p(95)<500', 'p(99)<1000'],
    http_req_failed: ['rate<0.01'], // <1% de fallos HTTP
    errores_negocio: ['rate<0.01'],
    checks: ['rate>0.99'],
  },
};

const params = () => ({
  headers: TOKEN ? { Authorization: `Bearer ${TOKEN}` } : {},
});

export default function () {
  group('home', () => {
    const res = http.get(`${BASE_URL}/`, params());
    const ok = check(res, {
      'status 200': (r) => r.status === 200,
      'cuerpo no vacío': (r) => r.body && r.body.length > 0,
    });
    erroresNegocio.add(!ok);
  });

  group('busqueda', () => {
    const res = http.get(`${BASE_URL}/api/buscar?q=cultura`, params());
    tBusqueda.add(res.timings.duration);
    check(res, { 'busqueda 200': (r) => r.status === 200 });
  });

  // Think time 1-3s: usuarios reales no martillan sin pausa. Sin esto el resultado es ficción.
  sleep(Math.random() * 2 + 1);
}
