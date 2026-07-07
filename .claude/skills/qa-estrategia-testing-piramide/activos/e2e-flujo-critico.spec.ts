import { test, expect } from '@playwright/test'
// Un (1) flujo crítico end-to-end. Criterio para que algo sea E2E:
// si se rompe, el producto NO cumple su propósito. Validar cada campo o cada
// mensaje de error es trabajo de los tests unit/integración, no de E2E.
// La sesión ya viene autenticada por auth.setup.ts (storageState).
test('usuario autenticado consulta el catálogo y filtra por departamento', async ({ page }) => {
  await page.goto('/catalogo')

  await expect(page.getByRole('heading', { name: /catálogo/i })).toBeVisible()

  await page.getByRole('combobox', { name: /departamento/i }).selectOption('${DEPARTAMENTO}')

  const resultados = page.getByRole('listitem')
  await expect(resultados.first()).toBeVisible()
  await expect(resultados).not.toHaveCount(0)
})
