/**
 * Prueba de accesibilidad a nivel de COMPONENTE (React 19) con axe.
 * Corre rápido, sin navegador, y atrapa regresiones a11y en PR antes de tocar el E2E.
 *
 *   npm i -D @testing-library/react @testing-library/dom
 *
 * Requiere el setup `vitest.a11y.setup.ts`. Adaptar: el import y las props del componente.
 */
import { render } from "@testing-library/react";
import { axe } from "vitest-axe";
import { expect, test } from "vitest";
// import { ${Componente} } from "../src/components/${Componente}";

test("${Componente} no tiene violaciones de accesibilidad", async () => {
  const { container } = render(<div>{/* <${Componente} /> */}</div>);
  const resultados = await axe(container);
  expect(resultados).toHaveNoViolations();
});

/**
 * Recomendación: prioriza componentes con estado (wizards multipaso, modales,
 * filtros con aria-live, barra de accesibilidad). El axe de componente NO ve
 * contraste real sobre imágenes ni orden de foco entre páginas: eso va al E2E.
 */
