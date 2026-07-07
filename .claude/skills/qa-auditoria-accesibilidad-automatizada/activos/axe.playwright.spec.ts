/**
 * Auditoría de accesibilidad automatizada a nivel de PÁGINA con axe-core + Playwright.
 * Recorre una lista de rutas, corre axe con las etiquetas WCAG 2.1 AA (homólogas a NTC 5854)
 * y deja evidencia (JSON por ruta + resumen) en `${A11Y_OUT}` para el informe DI-GSI-010.
 *
 * Requisitos (fijar versiones en package.json — pueden haber avanzado tras tu cutoff):
 *   npm i -D @playwright/test @axe-core/playwright
 *   npx playwright install chromium
 *
 * Uso:
 *   BASE_URL=http://localhost:3000 npx playwright test axe.playwright.spec.ts
 *
 * Adaptar: la constante RUTAS, BASE_URL y (si tu norma lo pide) las etiquetas WCAG.
 */
import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const BASE_URL = process.env.BASE_URL ?? "http://localhost:3000";
const OUT = process.env.A11Y_OUT ?? "reportes-a11y";

// NTC 5854 es homóloga a WCAG 2.0/2.1. Mantén 2.1 AA como línea base;
// añade "wcag22aa" solo si el contrato lo exige explícitamente.
const TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"];

// Rutas a auditar. En Next.js/Vite suelen ser paths; en .NET/Razor pon las URLs servidas.
const RUTAS = ["/", "/servicios", "/contacto"];

mkdirSync(OUT, { recursive: true });
const resumen: Array<{ ruta: string; violaciones: number; criticas: number }> = [];

for (const ruta of RUTAS) {
  test(`a11y ${ruta}`, async ({ page }) => {
    await page.goto(`${BASE_URL}${ruta}`, { waitUntil: "networkidle" });
    // Espera a que la UI cliente hidrate (React 19) ANTES de analizar (gotcha 2):
    // `networkidle` de arriba cubre la red; esto asegura que el DOM esté montado.
    // Reemplaza "main" por un selector estable propio de tu app.
    await page.locator("main").first().waitFor({ state: "visible" });

    const resultados = await new AxeBuilder({ page }).withTags(TAGS).analyze();

    const criticas = resultados.violations.filter(
      (v) => v.impact === "critical" || v.impact === "serious",
    ).length;
    const nombre = ruta === "/" ? "home" : ruta.replace(/\//g, "_").replace(/^_/, "");
    writeFileSync(join(OUT, `axe-${nombre}.json`), JSON.stringify(resultados, null, 2));
    resumen.push({ ruta, violaciones: resultados.violations.length, criticas });

    // Gate: 0 violaciones critical/serious. Las moderate/minor se registran y se triagean.
    expect(criticas, `Violaciones critical/serious en ${ruta}`).toBe(0);
  });
}

test.afterAll(() => {
  writeFileSync(join(OUT, "resumen-axe.json"), JSON.stringify(resumen, null, 2));
});
