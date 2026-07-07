import { defineConfig } from 'vitest/config'
// Config BASE de la pirámide (unit) + parte del MEDIO (integración en proceso).
// Stack: monorepo client/server (React+Vite / Express+TS). Vitest 3.x a 2026.
// AVISO DE VERSIÓN: la forma de declarar umbrales cambió entre Vitest 1.x
// (coverage.lines) y >=2.x (coverage.thresholds.*). Verifica contra package.json
// antes de copiar; si la versión difiere, ajusta esta clave.
export default defineConfig({
  test: {
    // 'jsdom' para el paquete client/ (React Testing Library);
    // usa 'node' en el vitest.config.ts del paquete server/.
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./vitest.setup.ts'], // p.ej. import '@testing-library/jest-dom'
    // E2E lo corre Playwright, NO Vitest: exclúyelo para no mezclar capas.
    exclude: ['**/node_modules/**', '**/dist/**', '**/e2e/**'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'text-summary', 'html', 'lcov', 'cobertura'], // text-summary -> badge GitLab (regex Lines:); cobertura -> reporte MR; html/lcov -> informe F5
      // Umbral HONESTO: arranca donde estás y súbelo por PR. No pongas 90% el día 1:
      // fabricar cobertura con tests vacíos es peor que no tenerla.
      thresholds: {
        lines: 70,
        functions: 70,
        branches: 60,
        statements: 70,
      },
      exclude: ['**/*.config.*', '**/*.d.ts', '**/dist/**', 'e2e/**', '**/*.stories.*'],
    },
  },
})
