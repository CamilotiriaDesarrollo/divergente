/**
 * Setup de axe para pruebas de componente con Vitest + jsdom.
 * Registra el matcher `toHaveNoViolations`.
 *
 *   npm i -D vitest @vitest/browser jsdom vitest-axe
 *   (alternativa madura: `jest-axe`, funciona con los globals de Vitest)
 *
 * En vitest.config.ts:
 *   test: { environment: "jsdom", setupFiles: ["./activos/vitest.a11y.setup.ts"] }
 *
 * NOTA N0: `vitest-axe` es un port comunitario; si tu versión rompe el import,
 * cambia a `jest-axe` (API idéntica: `import { axe, toHaveNoViolations } from "jest-axe"`).
 */
import { expect } from "vitest";
import * as matchers from "vitest-axe/matchers";

// Registra los matchers manualmente. NO importes además "vitest-axe/extend-expect":
// ese módulo ya llama a expect.extend por su cuenta y duplicaría el registro.
expect.extend(matchers);
