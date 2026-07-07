import { test as setup, expect } from '@playwright/test'
// Login OIDC hecho UNA vez y persistido como storageState.
// La línea gobierno exige autenticación federada (OIDC contra Azure AD / LDAP, DI-GSI-010);
// ver la skill seg-implementacion-sso-ldap-oidc para el lado de implementación.
// REGLA: credenciales SOLO por variable de entorno (secrets de CI). Nunca hardcodeadas,
// nunca commiteadas. El archivo .auth/ va en .gitignore.
const authFile = '.auth/user.json'

setup('autenticar contra el IdP OIDC', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: /iniciar sesión|login/i }).click()

  // Formulario del IdP (Azure AD / ADFS). Ajusta los selectores a tu tenant real.
  await page.getByLabel(/correo|email/i).fill(process.env.OIDC_TEST_USER ?? '')
  await page.getByRole('button', { name: /siguiente|next/i }).click()
  await page.getByLabel(/contraseña|password/i).fill(process.env.OIDC_TEST_PASSWORD ?? '')
  await page.getByRole('button', { name: /iniciar|sign in/i }).click()

  // Confirma que la sesión quedó activa ANTES de guardar el estado.
  await expect(page.getByTestId('sesion-activa')).toBeVisible({ timeout: 15_000 })
  await page.context().storageState({ path: authFile })
})
