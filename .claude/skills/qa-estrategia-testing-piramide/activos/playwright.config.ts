import { defineConfig, devices } from '@playwright/test'
// CIMA de la pirámide: E2E. POCOS flujos críticos, no una réplica de los unit.
// Playwright ~1.5x a 2026. El patrón `setup` (proyecto que hace login una vez y
// guarda storageState) es estable desde 1.31; verifica la versión del package.json.
export default defineConfig({
  testDir: './e2e',
  timeout: 30_000,
  fullyParallel: true,
  retries: process.env.CI ? 2 : 0, // reintenta en CI para amortiguar flakiness de red
  reporter: [['html'], ['list']],
  use: {
    baseURL: process.env.BASE_URL ?? 'http://localhost:3000',
    trace: 'on-first-retry', // traza descargable para depurar fallos en CI
    screenshot: 'only-on-failure',
  },
  projects: [
    // 1) Login OIDC una sola vez -> .auth/user.json
    { name: 'setup', testMatch: /auth\.setup\.ts/ },
    // 2) El resto reusa la sesión guardada (no vuelve a loguearse)
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'], storageState: '.auth/user.json' },
      dependencies: ['setup'],
    },
  ],
  // Levanta la app local para E2E en dev; en CI apunta a un entorno desplegado con BASE_URL.
  webServer: process.env.CI
    ? undefined
    : { command: 'npm run dev', url: 'http://localhost:3000', reuseExistingServer: true },
})
