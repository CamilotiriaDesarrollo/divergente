---
name: datos-catalogo-estatico-tipado-desde-excel
regimen: universal
description: Convierte un inventario verificado en Excel en un catálogo frontend TypeScript tipado (unions estrictos, Records de metadatos, filtro puro con búsqueda insensible a tildes) que permite demos sin backend. Cargar cuando haya que modelar datos de catálogo desde un Excel/CSV/inventario, construir una vitrina filtrable sin API, o definir el contrato de tipos que luego consumirá el backend.
---

# Catálogo estático tipado desde Excel

**Nivel actual:** N3 · **Dominio:** datos (Datos y Scraping) · **Agente(s):** `front-visualizaciones`
**Proyectos fuente:** Portal ISI (`002 Desarrollos/Interfase Pagina Inicial`), Interfase Sistemas (`002 Desarrollos/Interfase Sistemas`), Plataforma Conecta (`002 Desarrollos/Plataforma Conecta`)

> Criterio de ascenso a N1: los 5 bloques completos, con activos copiables de ruta real y gotchas verificados (no genéricos). A N2: ≥1 uso real aceptado por el Dueño. A N3: ≥3 usos exitosos en ≥2 proyectos + checklist propio.

## 1. Propósito

Convertir un inventario verificado en Excel en un módulo TypeScript de catálogo que el frontend consume directamente, sin base de datos ni API. Resuelve tres problemas reales de los proyectos fuente:

- **Demos sin infraestructura:** el frontend funciona 100% autónomo con datos estáticos y se despliega en Vercel sin backend ("backend durmiente"); la API Express existe con el mismo contrato de tipos para conmutar a SQL Server después sin reescribir el cliente.
- **Calidad de datos garantizada en la fuente:** al catálogo solo entran ítems de la hoja de verificación (en Portal ISI, las 32 plataformas de la hoja "5. Operativas Confirmadas": verificadas técnicamente Y confirmadas operativas por el equipo dueño). Los enlaces caídos nunca llegan al usuario.
- **Filtrado consistente:** una única función pura combina búsqueda de texto + facetas, con normalización de tildes, reutilizable desde cualquier vista (rejilla, constelación, mapa, tabla).

Se carga cuando: hay que transcribir un Excel/CSV/inventario a datos de frontend; se pide una vitrina/catálogo filtrable sin backend; hay que definir tipos de dominio que servirán también a la API futura; o una búsqueda falla con tildes/nombres que no casan.

## 2. Procedimiento

1. **Verificar el inventario fuente antes de transcribir nada.** El Excel patrón (`Interfase Pagina Inicial/Plataformas_MinCulturas_Verificado.xlsx`) tiene 7 hojas: `1. Resumen Ejecutivo`, `2. Inventario Verificado`, `3. Caídos (No incluir)`, `4. Rescatables (Revisar acceso)`, `5. Operativas Confirmadas`, `6. Metodología`, `7. Propuesta UX Misional`. **Criterio de inclusión:** solo la hoja de confirmadas (doble check: verificación técnica del enlace Y confirmación del equipo dueño). Los "Caídos" no entran; los "Rescatables" quedan como pendiente, no se incluyen "por si acaso". Si el Excel del proyecto nuevo no tiene esta separación, pedirla o construirla antes de transcribir.
2. **Diseñar el contrato de tipos con unions estrictos, no `string`.** Cada faceta cerrada es un tipo union (`sistemas.ts` líneas 5-18):
   ```ts
   export type Tema = 'artes' | 'cine' | 'estimulos' | /* … */ 'gestion'
   export type Acceso = 'abierto' | 'registro' | 'mixto'
   export type Publico = 'ciudadania' | 'agentes' | 'gestores' | 'investigadores' | 'funcionarios'
   ```
   Criterios: union cuando el conjunto de valores es cerrado y conocido (el compilador atrapa typos en cada ítem transcrito); `Publico[]` en array porque un ítem sirve a varias audiencias; campos con comentario de propósito (`marca: string // sigla o marca corta (subtítulo discreto)`).
3. **Centralizar metadatos de presentación en Records, nunca en componentes.** Labels, colores e imágenes por faceta viven junto a los datos (`sistemas.ts` líneas 39-67): un array `temas: TemaMeta[]` (orden de presentación) del que se deriva el Record de acceso directo:
   ```ts
   export const temaMeta: Record<Tema, TemaMeta> = Object.fromEntries(
     temas.map(t => [t.id, t]),
   ) as Record<Tema, TemaMeta>
   ```
   más `accesoLabel: Record<Acceso, string>` y `publicoLabel: Record<Publico, string>`. Así añadir un tema nuevo obliga (por tipo) a darle label/color/imagen, y ningún componente hardcodea textos.
4. **Transcribir los datos con trazabilidad y nombres humanizados.** Cabecera del módulo citando la fuente exacta (`sistemas.ts` líneas 1-3: archivo Excel + hoja + regla editorial); ítems agrupados por tema con separadores comentados (`// ── Museos ──…`); principio "cero siglas en la fachada": `nombre` humanizado como titular (SIARTES → "Catálogo de las Artes") y la sigla en `marca` como subtítulo (regla 5 de `docs/direccion-visual.md`).
5. **Etiquetar los ítems internos, no ocultarlos.** Las plataformas de uso interno (evaluaciones, gestión documental) entran al catálogo con `publico: ['funcionarios']`; el filtro de público las separa de la experiencia ciudadana sin borrarlas del inventario (sección "Alcance de datos" de `docs/direccion-visual.md`).
6. **Escribir la función pura de filtrado combinando texto + facetas.** Sin dependencias de React, en el mismo módulo de datos (`sistemas.ts` líneas 378-404): interfaz `FiltroSistemas` con campos opcionales/anulables, facetas con comparación estricta (`publico` con `.includes` por ser array), y búsqueda de texto insensible a tildes:
   ```ts
   const RANGO_DIACRITICOS = new RegExp('[\\u0300-\\u036f]', 'g')
   const normaliza = (s: string) =>
     s.normalize('NFD').replace(RANGO_DIACRITICOS, '').toLowerCase()
   ```
   El "heno" de búsqueda concatena nombre + marca + descripción + label del tema, para que "cine" encuentre también por categoría.
7. **Consumir desde React con `useMemo` y controles accesibles.** `VitrinaSistemas.tsx` (líneas 19-25): estado local por faceta, `const lista = useMemo(() => filtrarSistemas(sistemas, { texto, tema, publico }), [texto, tema, publico])`, chips con `aria-pressed` (toggle: clic sobre el activo lo desactiva) y contador de resultados con `aria-live="polite"`. Si además hay paginación, el reset de página al cambiar filtros se hace con ajuste de estado durante el render, no con `useEffect` (ver gotcha 5).
8. **Mantener el mismo contrato para el backend futuro.** El server sirve el mismo shape desde JSON (`server/src/config/sistemas.json` + routes→controllers en los 3 proyectos): cuando llegue SQL Server se cambia la fuente sin tocar tipos ni cliente.
9. **Escalar cuando el dataset crece:** en Plataforma Conecta un dataset de ~48 kB se difirió con `React.lazy` + `Suspense` junto a su página (`client/src/pages/Home.tsx`, commit 2c54d2a) para eliminar el warning de chunk >500 kB. Criterio: dataset >30-40 kB usado solo en una vista → lazy con la vista.

## 3. Activos copiables

Copias locales en `FABRICA DE SOFTWARE/.claude/skills/datos-catalogo-estatico-tipado-desde-excel/activos/`:

| Activo | Origen real | Qué es / cuándo copiarlo | Qué adaptar |
|---|---|---|---|
| `activos/sistemas.ts` | `002 Desarrollos/Interfase Pagina Inicial/client/src/data/sistemas.ts` | El patrón completo: unions, interface del ítem, Records de metadatos, 32 ítems reales y `filtrarSistemas()` con normalización NFD. Copiar como plantilla de cualquier catálogo nuevo. | Renombrar tipos/facetas al dominio del proyecto; reemplazar los ítems; conservar cabecera con fuente y separadores por grupo. |
| `activos/VitrinaSistemas.tsx` | `002 Desarrollos/Interfase Pagina Inicial/client/src/components/VitrinaSistemas.tsx` | Consumidor de referencia: `useMemo` + chips `aria-pressed` + contador `aria-live`. Copiar al montar la UI de filtros del catálogo. | Clases CSS (BEM propio del proyecto) y facetas expuestas. |
| `activos/ecosistema.tsx` | `002 Desarrollos/Plataforma Conecta/client/src/components/ecosistema.tsx` | Variante con filtros combinados (categoría + dirección + búsqueda), conteos por categoría y paginación con reset vía ajuste de estado durante el render (líneas 43-51). Copiar cuando el catálogo necesite paginación. | `PAGE_SIZE`, facetas y dataset importado. |
| `activos/sistemasDemo.ts` | `002 Desarrollos/Interfase Sistemas/client/src/data/sistemasDemo.ts` | Patrón de catálogo con logos: SVG importado vía `?raw` de Vite, `svgRaw?: string` opcional y `sigla` como fallback textual. Copiar cuando los ítems llevan logo. | Rutas de los SVG en `assets/logos/`; los SVG deben usar `fill='currentColor'`. |
| `activos/direccion-visual.md` | `002 Desarrollos/Interfase Pagina Inicial/docs/direccion-visual.md` | Documento de decisión que fija el alcance de datos ("solo Confirmadas Operativas", internos etiquetados) y las reglas editoriales (cero siglas). Copiar como plantilla del acuerdo de alcance de datos con el Dueño. | Dirección visual, colores por tema y la hoja/fuente concreta. |

Referencia adicional (no copiada, consultar in situ): `002 Desarrollos/Interfase Pagina Inicial/Plataformas_MinCulturas_Verificado.xlsx` — patrón de Excel de verificación con hojas separadas Caídos / Rescatables / Operativas Confirmadas / Metodología.

## 4. Gotchas verificados

1. **Búsqueda que falla con tildes.** Buscar "estimulos" no encontraba "Estímulos" con un `includes` directo. Solución en `sistemas.ts` (líneas 385-387): normalizar ambos lados con `normalize('NFD')` y quitar los diacríticos con la regex del rango `̀-ͯ` antes de comparar. Aplicar SIEMPRE a los dos lados (query y heno). Evidencia: `Interfase Pagina Inicial/client/src/data/sistemas.ts`.
2. **Nombres externos que no casan con el dataset propio.** En Plataforma Conecta los departamentos del GeoJSON no coincidían con los del catálogo ("Bogotá D.C.", "Archipiélago de San Andrés…"). La normalización NFD sola no basta: hizo falta además un diccionario de casos especiales `DEPT_MAP` y la función `resolverDept()` que primero consulta el mapa y luego compara normalizado. Evidencia: `Plataforma Conecta/client/src/pages/MapaCirculacion.tsx` líneas 31-49.
3. **Copiar el inventario completo mete enlaces muertos en producción.** El Excel fuente separa explícitamente `3. Caídos (No incluir)` y `4. Rescatables (Revisar acceso)` de `5. Operativas Confirmadas`; el módulo de datos declara en su cabecera que solo transcribe la hoja 5 (32 plataformas). Si se transcribe la hoja 2 (inventario completo) el catálogo publica plataformas caídas. Evidencia: hojas del workbook de `Plataformas_MinCulturas_Verificado.xlsx` y cabecera de `sistemas.ts` líneas 1-3.
4. **Ocultar los ítems internos rompe el inventario.** La tentación era excluir del catálogo las plataformas de uso interno (evaluaciones, gestión documental); la decisión registrada fue incluirlas etiquetadas con `publico: ['funcionarios']` para que el filtro de público las separe sin ocultarlas — el catálogo sigue siendo el inventario completo de lo operativo. Evidencia: `Interfase Pagina Inicial/docs/direccion-visual.md` sección "Alcance de datos" e ítems `evaluacion-concertacion`, `az-digital`, `siempre` en `sistemas.ts`.
5. **Reset de paginación con `useEffect` provoca un re-render extra.** Al cambiar filtros la página debe volver a 0; hacerlo en un `useEffect` renderiza primero la página vieja con los datos nuevos. Solución aplicada (commit df71bfb): derivar una clave `` filtroKey = `${categoria}|${direccion}|${query}` `` y compararla con su valor previo durante el render, reseteando ahí mismo. Evidencia: `Plataforma Conecta/client/src/components/ecosistema.tsx` líneas 43-51, con el comentario que cita el patrón recomendado por React.
6. **Los errores de tipos bloquean el despliegue — y eso es deliberado.** El build del cliente es `tsc && vite build`: un valor fuera del union (p. ej. un `tema` mal escrito al transcribir el Excel) tumba el build de Vercel. En Plataforma Conecta hubo que corregir tipos antes de poder desplegar (commit 65d5ddd). Correr `tsc` en local antes de subir; nunca "resolverlo" relajando el union a `string`. Evidencia: `Plataforma Conecta/client/package.json` (script build) y commit 65d5ddd.
7. **SVGs de logos con declaración XML rompen la inyección inline.** Los SVG exportados con `<?xml …?>` fallan al inyectarse con `dangerouslySetInnerHTML`; solución: helper `stripXmlDecl()` que la elimina con regex antes de inyectar, y `fill='currentColor'` en los SVG para heredar el color del contenedor. Evidencia: `Interfase Sistemas/client/src/components/tirillaF.tsx` (línea 11) y patrón `svgRaw`/`sigla` en `client/src/data/sistemasDemo.ts` (commit 77a42ee en Portal ISI).

## 5. Criterios de done

- [ ] El módulo de datos declara en comentario de cabecera la fuente exacta: archivo Excel + hoja + criterio de inclusión (como `sistemas.ts` líneas 1-3).
- [ ] El número de ítems del módulo coincide con el número de filas de la hoja verificada (en Portal ISI: 32), y ningún ítem proviene de las hojas de caídos/rescatables.
- [ ] Todas las facetas cerradas son tipos union (no `string`) y `npx tsc --noEmit` (o `npm run build`) pasa en verde — el tipado es el gate de despliegue.
- [ ] Labels, colores e imágenes de facetas viven en Records del módulo de datos; `grep` de esos textos en `components/` no devuelve hardcodeos.
- [ ] La búsqueda encuentra "estimulos" (sin tilde) escribiendo contra ítems con "Estímulos" — probado manualmente en la UI.
- [ ] La función de filtrado es pura (sin imports de React) y combina texto + todas las facetas; los chips de filtro tienen `aria-pressed` y el contador de resultados `aria-live="polite"`.
- [ ] Los ítems de uso interno están presentes y etiquetados (público `funcionarios` o equivalente), no eliminados.
- [ ] La demo corre sin backend (`npm run dev` solo en `client/`) y, si existe server, su JSON en `config/` respeta el mismo contrato de tipos.

## Registro de uso
| Fecha | Proyecto | Tarea | Resultado | Lección |
|---|---|---|---|---|
| histórico | Portal ISI | uso original (fuente de esta skill) | ok | - |
| histórico | Interfase Sistemas | uso original (fuente de esta skill) | ok | - |
| histórico | Plataforma Conecta | uso original (fuente de esta skill) | ok | - |
