---
name: qa-kit-eslint9-prettier-monorepo
regimen: universal
description: Instala y opera el kit de calidad de código homogéneo (ESLint 9 flat config + Prettier + EditorConfig + scripts espejo) en un monorepo TypeScript client/server. Cárgala al iniciar un monorepo TS/React, al pedir "configurar lint/prettier/formato", al preparar el gate "todo en verde antes de subir", o al resolver warnings de exhaustive-deps o `any`.
---

# Kit de calidad ESLint 9 + Prettier para monorepo TS

**Nivel actual:** N2 · **Dominio:** qa · **Agente(s):** `qa-ingeniero`
**Proyectos fuente:** Plataforma Conecta (Interfase Sistemas — Ministerio de las Culturas)

> Criterio de ascenso a N1: los 5 bloques completos, con activos copiables de ruta real y gotchas verificados (no genéricos). A N2: ≥1 uso real aceptado por el Dueño. A N3: ≥3 usos exitosos en ≥2 proyectos + checklist propio.

## 1. Propósito

Dar a un monorepo TypeScript con paquetes npm independientes (típicamente `client/` React+Vite y `server/` Express+TS) un tooling de calidad **idéntico y automatizable** que funcione como gate antes de subir código: mismo formato, mismas reglas de lint, mismos finales de línea en Windows/Linux/Mac, y los mismos cuatro scripts en cada paquete. Resuelve el problema de estilo inconsistente entre paquetes y personas, y convierte lint/format en una compuerta verificable ("verde antes de subir") en vez de una opinión.

Se carga cuando: se arranca un monorepo TS nuevo, se pide "configura ESLint/Prettier/formato", se homogeniza un repo existente, o se necesita apagar/gestionar warnings reales de `react-hooks/exhaustive-deps`, `jsx-a11y` o `@typescript-eslint/no-explicit-any` sin degradar el código.

## 2. Procedimiento

1. **ESLint 9 flat config, uno por paquete.** No hay `.eslintrc`; el archivo es `eslint.config.js` (cliente, `"type":"module"`) o `eslint.config.mjs` (servidor, `"type":"commonjs"` → la extensión `.mjs` fuerza ESM). Se usa el helper `tseslint.config(...)` de `typescript-eslint`.
2. **Orden de la config (importa):** primero `{ ignores: ['dist','node_modules'] }`, luego el bloque con `extends: [js.configs.recommended, ...tseslint.configs.recommended]`, y **`prettier` (eslint-config-prettier) SIEMPRE de último** para desactivar las reglas de estilo que chocan con Prettier. Si Prettier no va al final, ESLint y Prettier pelean por las comas/comillas.
3. **Cliente vs servidor — diferencias mínimas y deliberadas:**
   - Cliente: `files: ['**/*.{ts,tsx}']`, `globals.browser`, y plugins `react-hooks`, `react-refresh`, `jsx-a11y`. Se hace spread de `reactHooks.configs.recommended.rules` y `jsxA11y.configs.recommended.rules`.
   - Servidor: `files: ['**/*.ts']`, `globals.node`, sin plugins de React.
   - Regla común en ambos: `'@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }]` (permite `_req`, `_next`).
4. **Prettier concreto y único en la raíz** (`.prettierrc.json`, uno solo para todo el monorepo): `semi:false`, `singleQuote:true`, `trailingComma:"es5"`, `printWidth:100`, `tabWidth:2`, `arrowParens:"avoid"`, `endOfLine:"lf"`. Estos valores son la convención del proyecto fuente; cópialos tal cual salvo que el Dueño decida otra cosa.
5. **Finales de línea LF a prueba de Windows:** `.editorconfig` (`end_of_line = lf`, `insert_final_newline = true`, `indent_size = 2`; excepción `[*.md]` con `trim_trailing_whitespace = false`) **y** `.gitattributes` con `* text=auto eol=lf` más los binarios marcados `binary` (png/jpg/jpeg/gif/ico/woff/woff2). Sin el `.gitattributes`, Git en Windows reintroduce CRLF y Prettier `--check` falla en CI aunque en local pase.
6. **Scripts espejo en CADA package.json** — los mismos cuatro nombres para que un agente no tenga que recordar rutas:
   - `"lint": "eslint ."`
   - `"lint:fix": "eslint . --fix"`
   - `"format": "prettier --write \"src/**/*.{ts,tsx,css}\""` (servidor: `\"src/**/*.ts\"`)
   - `"format:check": "prettier --check \"src/**/*.{ts,tsx,css}\""`
7. **Gate "verde antes de subir":** en el paquete tocado, `npm run lint` y `npm run format:check` deben pasar en verde antes de commitear (documentado en el README del proyecto fuente). `format:check` es el que corre en CI; `format` es solo para el autofix local.
8. **Deuda visible, no reglas apagadas.** Cuando una regla de lint marca algo legítimamente pendiente (p. ej. `href="#"` placeholders), NO se apaga la regla globalmente ni se degrada la semántica: se usa `// eslint-disable-next-line <regla> -- TODO: <condición de cierre>` en la línea concreta. Así el lint queda en 0 y el backlog vive en el código.
9. **Warnings de hooks y `any`: se corrigen, no se silencian.** Ver bloque 4 para los patrones exactos (setState funcional, `ref` en deps, tipos de `geojson` en vez de `any`).

## 3. Activos copiables

Todos verificados en el proyecto fuente y copiados a `activos/` de esta skill. Son archivos pequeños (<1 KB c/u), sin secretos.

| Activo (en `activos/`) | Qué es | Origen real | Qué adaptar |
|---|---|---|---|
| `client.eslint.config.js` | ESLint 9 flat config del cliente (tseslint + react-hooks + react-refresh + jsx-a11y + prettier al final) | `Plataforma Conecta/client/eslint.config.js` | Nada si es React+Vite. Si no hay JSX, quita los plugins de React. |
| `server.eslint.config.mjs` | ESLint 9 flat config del servidor (tseslint + prettier, sin React) | `Plataforma Conecta/server/eslint.config.mjs` | Renombra a `.js` solo si el paquete es `"type":"module"`. |
| `.prettierrc.json` | Config Prettier única del monorepo | `Plataforma Conecta/.prettierrc.json` | Cópialo tal cual; cambiar `printWidth`/`singleQuote` solo por decisión del Dueño. |
| `.editorconfig` | Estilo base del editor (LF, 2 espacios, newline final) | `Plataforma Conecta/.editorconfig` | Ninguno. |
| `.gitattributes` | Normaliza LF y marca binarios | `Plataforma Conecta/.gitattributes` | Añade extensiones binarias propias (pdf, mp4, etc.). |

Referencia de scripts espejo (copiar al `scripts` de cada `package.json`):
- Cliente: `Plataforma Conecta/client/package.json` (líneas `lint`/`lint:fix`/`format`/`format:check`).
- Servidor: `Plataforma Conecta/server/package.json` (mismos nombres, glob `src/**/*.ts`).

Dependencias devDependencies exactas del cliente (versiones probadas): `eslint ^9.39.4`, `@eslint/js ^9.39.4`, `typescript-eslint ^8.61.0`, `eslint-config-prettier ^10.1.8`, `eslint-plugin-jsx-a11y ^6.10.2`, `eslint-plugin-react-hooks ^7.1.1`, `eslint-plugin-react-refresh ^0.5.2`, `globals ^17.6.0`, `prettier ^3.8.4`. El servidor usa el mismo set sin los plugins de React.

## 4. Gotchas verificados

Errores reales del proyecto fuente y su solución (con archivo/commit de evidencia):

- **`eslint-config-prettier` mal ubicado = guerra de estilos.** Debe ir como último elemento del array de `tseslint.config(...)`, después del bloque de reglas. Si va antes, ESLint sigue exigiendo `semi`/comillas que Prettier revierte. Evidencia: `client/eslint.config.js:30` y `server/eslint.config.mjs:19` (línea `prettier` al final). Commit `79c329a`.

- **`.editorconfig` NO basta para LF en Windows.** Git reintroduce CRLF al hacer checkout y `prettier --check` (con `endOfLine:"lf"`) falla en CI aunque en local esté "bien". Solución verificada: `.gitattributes` con `* text=auto eol=lf` + binarios marcados `binary`. Evidencia: `.gitattributes` del proyecto fuente (comentario explícito "Normaliza finales de línea a LF").

- **`react-hooks/exhaustive-deps` — corregir con setState funcional, no añadir la dep.** En `tirillaF.tsx` el reset de escalas dependía de `sistemasFixed`; se resolvió con la forma funcional `setScales(prev => prev.map(() => 1))`, eliminando la dependencia en vez de agregarla al array. Evidencia: `client/src/components/tirillaF.tsx:53`, commit `a2eb1e6`.

- **`exhaustive-deps` por ref usada en efecto → incluir la ref en deps.** En `InternacionalizacionPage.tsx` faltaba `ref` en las deps del efecto de scroll: la solución fue añadirlo (aquí SÍ se añade). Y en `MapaCirculacion.tsx` sobraba una dep redundante `dept` en `onEachFeature`, que se quitó. Regla operativa: la forma funcional elimina deps de estado, pero una ref realmente leída sí debe declararse. Evidencia: commit `a2eb1e6` (3 archivos).

- **`any` prohibido: usar tipos de la librería.** En `MapaCirculacion.tsx` había 3 `any` que se reemplazaron por `Feature` / `FeatureCollection` importados de `geojson` (`import type { Feature, FeatureCollection } from 'geojson'`). Evidencia: `client/src/pages/MapaCirculacion.tsx:14,222,239,255`, commit `df71bfb`.

- **`jsx-a11y/anchor-is-valid` en enlaces placeholder — no apagar la regla, marcar deuda.** Los 14 `href="#"` sin URL real disparaban la regla. En vez de `eslint-disable` global, cada caso lleva `// eslint-disable-next-line jsx-a11y/anchor-is-valid -- TODO: <condición>`. Evidencia real: `client/src/components/tirillaF.tsx:153` y `:193`, `footerMincultura.tsx:49,112`, `headerMincultura.tsx:85,93`, commit `65e849c`.

- **Escritura de ref durante el render.** Anti-patrón detectado y corregido: la escritura de una ref se movió del cuerpo del render a un `useEffect`. Y el reset de paginación al cambiar filtros se hace como **ajuste de estado durante el render** (comparar clave derivada vs valor previo) en vez de `useEffect`, evitando un re-render extra. Evidencia: `client/src/components/ecosistema.tsx:43-51`, commit `df71bfb`.

## 5. Criterios de done

- [ ] Existe un `eslint.config.js`/`.mjs` por paquete, con `prettier` como último elemento del array.
- [ ] `.prettierrc.json` único en la raíz con los 7 valores: `semi:false`, `singleQuote:true`, `trailingComma:"es5"`, `printWidth:100`, `tabWidth:2`, `arrowParens:"avoid"`, `endOfLine:"lf"`.
- [ ] `.editorconfig` y `.gitattributes` (con `eol=lf`) presentes en la raíz.
- [ ] Cada `package.json` tiene los 4 scripts espejo con nombres idénticos (`lint`, `lint:fix`, `format`, `format:check`).
- [ ] `npm run lint` sale con **0 errores** en cada paquete (los `warn` intencionales van con `eslint-disable-next-line ... -- TODO:` justificado, nunca regla apagada global).
- [ ] `npm run format:check` pasa en verde en cada paquete (incluso tras un checkout limpio en Windows → confirma que `.gitattributes` hace su trabajo).
- [ ] No hay `any` sin justificar ni warnings de `exhaustive-deps` sin resolver.
- [ ] El README documenta la regla "lint y format:check en verde antes de subir".

## Registro de uso

| Fecha | Proyecto | Tarea | Resultado | Lección |
|---|---|---|---|---|
| histórico | Plataforma Conecta | Uso original (fuente de esta skill) | ok | - |
