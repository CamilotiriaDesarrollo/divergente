---
name: front-seo-i18n
regimen: universal
description: SEO técnico e internacionalización para sitios web públicos. Cubre metadata/Open Graph, sitemap.xml, robots.txt, datos estructurados JSON-LD (schema.org) y i18n multi-idioma con hreflang — incluidas lenguas nativas de Colombia (relevante para MinCultura). Cargar cuando la tarea pida indexar/posicionar un sitio, añadir <title>/meta/canonical, generar sitemap o datos estructurados, soportar varios idiomas o cumplir el requisito de idioma (lang) de accesibilidad. Aplica a la línea Next.js 16 (SSG/SSR/export) y, con límites, a la línea Vite/React 19.
---

# Front · SEO técnico e i18n

**Nivel actual:** N0 · **Dominio:** Frontend · **Agente(s):** `front-lider`
**Proyectos fuente:** ninguno — creada desde buenas prácticas (VACÍO del portafolio).

> Criterio de ascenso a N1: los 5 bloques completos, con activos copiables de ruta real y gotchas verificados (no genéricos). A N2: ≥1 uso real aceptado por el Dueño. A N3: ≥3 usos exitosos en ≥2 proyectos + checklist propio.

> **Honestidad N0:** ningún proyecto del portafolio ejercitó SEO estructurado ni i18n. Todo lo de abajo son buenas prácticas actuales adaptadas al stack real del Dueño, **sin verificar aún en proyecto propio**. El valor de esta skill es un punto de partida correcto que ascenderá al usarse. Verificar toda API dependiente de versión (Next 16, next-intl, React 19) contra su documentación instalada antes de codificar.

## 1. Propósito

Cierra un vacío del portafolio: los sitios públicos se construyeron sin estrategia de SEO técnico (metadata, canonical, sitemap, datos estructurados) ni de internacionalización. Para la línea de gobierno esto es doblemente relevante: MinCultura tiene contenido cultural que se beneficia de indexación rica (schema.org) y Colombia reconoce lenguas nativas por la **Ley 1381 de 2010**, por lo que un portal cultural puede necesitar servir contenido en Wayuunaiki, Nasa Yuwe, Emberá, etc. Además, el atributo `lang` correcto y los cambios de idioma marcados son un requisito de accesibilidad **NTC 5854 / WCAG 3.1.1 y 3.1.2** (ver `ux-accesibilidad-ntc5854-aa`), que en gobierno es vinculante bajo DI-GSI-010.

Se carga cuando la tarea implique: hacer indexable/compartible un sitio, añadir `<title>`/`<meta>`/`canonical`/Open Graph, generar `sitemap.xml` o `robots.txt`, agregar datos estructurados (JSON-LD), habilitar más de un idioma con URLs por idioma y `hreflang`, o cumplir el requisito de idioma de la a11y. NO aplica a apps privadas tras login sin necesidad de indexación (ahí basta el `lang` por a11y).

## 2. Procedimiento

**Paso 0 — Elegir la línea correcta (decisión de arquitectura, anotar en blueprint F1).**
- Sitio público que DEBE posicionar bien → **línea Next.js 16** (SSG/SSR/export). El HTML se entrega ya renderizado y toda la metadata es server-side. Es el camino recomendado.
- App privada / tras login → la **línea Vite/React 19** basta (SEO no aplica; solo fijar `lang` por a11y).
- Si un sitio público está en Vite, marcar el límite SEO como decisión abierta (SPA cliente indexa mal): migrar a Next.js o hacer prerender/SSR real desde Express. Ver `activos/vite-react/SeoHead.tsx`.

**Paso 1 — Configurar la base de metadata (Next.js).** En `app/layout.tsx` exportar `metadata` con `metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL)`, `title.template`, `description`, `openGraph` y `twitter`. Definir `NEXT_PUBLIC_SITE_URL` en variables de entorno de Vercel y en `.env.local` (nunca hardcodear el dominio ni secretos). Copiar `activos/metadata.tsx`. En Next 16 la API `Metadata` reemplaza a `<Head>`; confirmar contra `node_modules/next/dist/docs/` antes de escribir (regla `AGENTS.md` de los proyectos Next del Dueño).

**Paso 2 — Metadata por página + canonical.** Cada `page.tsx` exporta `generateMetadata` (asíncrona; `params` es `Promise` en Next 15/16 → `await`). Fijar `alternates.canonical` a la URL absoluta de la variante actual para evitar contenido duplicado. Usar `buildPageMetadata` de `activos/metadata.tsx`.

**Paso 3 — sitemap.xml y robots.txt.** Crear `app/sitemap.ts` y `app/robots.ts` (convención de archivos de Next; se generan en build y funcionan también con `output:'export'`). En sitios con datos, derivar las rutas del catálogo/CMS, no listarlas a mano. Copiar `activos/sitemap.ts` y `activos/robots.ts`. Nunca permitir indexación de back-office (`disallow: ['/admin','/api']`).

**Paso 4 — Datos estructurados (JSON-LD).** Añadir schema.org según el tipo de entidad: `GovernmentOrganization` (entidad estatal), `WebSite` con `SearchAction` (caja de búsqueda), `BreadcrumbList` (migas), y `CreativeWork`/`Article`/`Dataset` para contenido cultural/datos abiertos. Renderizar con `<JsonLd>` de `activos/jsonld.tsx`. Validar SIEMPRE en validator.schema.org y en el Rich Results Test de Google antes de dar por hecho.

**Paso 5 — Definir los locales en una fuente única.** `activos/i18n-locales.ts` centraliza `LOCALES` (segmentos de URL), su `hreflang` BCP 47 y las etiquetas del selector. Para lenguas nativas: el `hreflang` DEBE ser una etiqueta BCP 47 válida (subtag ISO 639-3 de 3 letras; las 2 letras ISO 639-1 no existen para la mayoría). **Validar cada código** contra el registro ISO 639-3 (SIL) y el listado oficial de lenguas del Ministerio de Cultura; si no hay código ISO, usar extensión privada `es-x-<slug>` y documentarlo. Un `hreflang` inválido hace que Google ignore la anotación.

**Paso 6 — Enrutado i18n con next-intl (App Router).** Estrategia de URL por subruta con prefijo siempre visible (`/es/...`, `/en/...`) — es la mejor para SEO. Estructura: `middleware.ts` (solo modo servidor), `i18n/request.ts` (`getRequestConfig`), `app/[locale]/layout.tsx` (fija `<html lang>` y `generateStaticParams`), `messages/*.json`. Registrar el plugin en `next.config.mjs`. Copiar la carpeta `activos/next-intl/` completa y seguir `activos/next-intl/next.config.notes.md`. **La API de next-intl cambia entre v3/v4** → verificar contra la versión instalada.

**Paso 7 — Caso export estático.** Si el proyecto usa `output:'export'` (patrón sin backend del Dueño, ver `front-nextjs-export-estatico-sin-backend`): el `middleware.ts` NO se ejecuta. Pre-renderizar cada locale con `generateStaticParams` (ya incluido) y resolver la raíz `/` con página selectora o redirect de cliente. Decidirlo en F1.

**Paso 8 — hreflang y `<html lang>`.** Cada página declara sus variantes con `alternates.languages` (metadata) y las mismas en `sitemap.ts`; deben ser bidireccionales, auto-referenciales e incluir `x-default`. El `<html lang>` se fija en `app/[locale]/layout.tsx` y todo bloque en otro idioma lleva su propio `lang` (a11y 3.1.2). Selector de idioma con `<a>` reales que preservan la ruta: `activos/next-intl/LocaleSwitcher.tsx`.

**Paso 9 — Línea Vite/React 19.** React 19 iza `<title>`/`<meta>`/`<link>` al `<head>` sin react-helmet. Usar `activos/vite-react/SeoHead.tsx` para metadata por vista e i18n con `react-i18next`. Recordar el límite SEO de la SPA (paso 0).

**Paso 10 — Verificar (F5 endurecimiento).** Lighthouse SEO ≥ 95, `next build` sin warnings, sitemap/robots accesibles, JSON-LD validado, hreflang recíproco. Coordinar con `qa-ingeniero` (revisor ≠ constructor) y, si toca a11y de idioma, con la auditoría NTC 5854.

## 3. Activos copiables

Todos en `activos/` de esta skill (creados desde buenas prácticas, **no** de un proyecto fuente):

| Activo | Qué es | Cuándo copiarlo / qué adaptar |
|---|---|---|
| `activos/metadata.tsx` | `baseMetadata` + `buildPageMetadata` (canonical, OG, hreflang) para Next 16 | Root layout y páginas. Adaptar textos, dominio (`NEXT_PUBLIC_SITE_URL`) e imagen OG. |
| `activos/sitemap.ts` | `app/sitemap.ts` multi-locale con `alternates.languages` | Reemplazar `ROUTES` por rutas reales o derivarlas del catálogo. |
| `activos/robots.ts` | `app/robots.ts` con sitemap y `disallow` de back-office | Ajustar rutas privadas a bloquear. |
| `activos/jsonld.tsx` | Componente `<JsonLd>` + builders schema.org (GovernmentOrganization, WebSite, BreadcrumbList, CreativeWork) | Elegir el `@type` por entidad/contenido; rellenar `${ENTIDAD}`, `${NOMBRE_SITIO}`. |
| `activos/i18n-locales.ts` | Fuente única de locales + tabla de lenguas nativas (BCP 47 a validar) | Añadir/quitar locales; **validar códigos ISO 639-3** antes de publicar. |
| `activos/next-intl/` (middleware, i18n-request, locale-layout, LocaleSwitcher, messages, next.config.notes.md) | Setup completo de i18n en App Router | Copiar la carpeta; seguir `next.config.notes.md`; verificar API contra la versión de next-intl. |
| `activos/vite-react/SeoHead.tsx` | SEO por vista para la línea Vite (React 19 native metadata) | Adaptar `VITE_SITE_URL`; leer el bloque de límite SEO de SPA. |

Referencia normativa (no copiada): criterios WCAG 3.1.1/3.1.2 en `ux-accesibilidad-ntc5854-aa`; Ley 1381 de 2010 (lenguas nativas) para justificar el alcance i18n en gobierno.

## 4. Gotchas verificados

> **N0 — riesgos documentados de la práctica, sin verificar aún en proyecto propio.** Se confirmarán (o corregirán) en el primer uso real y la skill ascenderá.

1. **`hreflang` con código inválido = anotación ignorada por Google.** El error típico con lenguas nativas es inventar un código de 2 letras (ISO 639-1 no existe para la mayoría). Debe ser BCP 47 válido (ISO 639-3). *Sin verificar en proyecto propio (N0).*
2. **`params` síncrono revienta en Next 15/16.** Es `Promise`; olvidar el `await` da errores en runtime. Confirmar en `node_modules/next/dist/docs/`. *Sin verificar en proyecto propio (N0).*
3. **Middleware de next-intl NO corre en `output:'export'`.** La detección/redirección de idioma se cae silenciosamente y `/` queda sin locale. Solución: `generateStaticParams` + raíz selectora. *Sin verificar en proyecto propio (N0).*
4. **`metadataBase` faltante deja canonical y OG en URLs relativas.** Los crawlers y las tarjetas sociales las resuelven mal. Siempre absoluta desde env. *Sin verificar en proyecto propio (N0).*
5. **SPA Vite pura indexa mal.** Googlebot ejecuta JS de forma diferida y frágil; un sitio público en Vite puede quedar sin indexar. Preferir Next.js SSG/SSR para lo público. *Sin verificar en proyecto propio (N0).*
6. **`hreflang` no recíproco lo invalida.** Si A apunta a B pero B no apunta a A, Google descarta el par. Generar el mapa de idiomas desde una única fuente (`i18n-locales.ts`) y reusarlo en metadata Y sitemap. *Sin verificar en proyecto propio (N0).*
7. **JSON-LD sin sanear `<` permite inyección al cerrar el `<script>`.** Escapar `<` a `\u003c` al serializar contenido dinámico (ya en `jsonld.tsx`). *Sin verificar en proyecto propio (N0).*
8. **La API de next-intl cambió entre v3 y v4** (`requestLocale`, `setRequestLocale`, ruta del plugin). Copiar de memoria rompe el build. Verificar contra la versión instalada. *Sin verificar en proyecto propio (N0).*
9. **Traducir la UI pero no la metadata** deja `<title>`/`description`/OG en un solo idioma y el SEO multilingüe no funciona. La metadata también se localiza (mensajes en `messages/*.json`). *Sin verificar en proyecto propio (N0).*

## 5. Criterios de done

- [ ] `next build` pasa sin errores ni warnings de deprecación (Next 16); Lighthouse SEO ≥ 95 en las páginas clave.
- [ ] Cada página tiene `<title>`, `description`, `canonical` absoluto y Open Graph; `metadataBase` configurada desde env (sin dominio hardcodeado).
- [ ] `/sitemap.xml` y `/robots.txt` se generan, son accesibles y el sitemap lista las variantes de idioma; el back-office está en `disallow`.
- [ ] Los datos estructurados JSON-LD validan en validator.schema.org y en el Rich Results Test, sin errores.
- [ ] Multi-idioma: URLs por subruta (`/es`, `/en`, …), `<html lang>` correcto por locale, bloques en otro idioma con su `lang`, y `hreflang` recíproco + `x-default`.
- [ ] Todos los códigos de idioma (incl. lenguas nativas) son BCP 47 válidos, verificados contra ISO 639-3 y el listado del Ministerio de Cultura.
- [ ] La metadata está localizada (no solo la UI); el selector de idioma preserva la ruta y usa enlaces reales.
- [ ] Si es `output:'export'`: cada locale se pre-renderiza y la raíz `/` resuelve sin depender de middleware.
- [ ] Revisado por `qa-ingeniero` (revisor ≠ constructor); si tocó el requisito de idioma, verificado contra NTC 5854 (`ux-accesibilidad-ntc5854-aa`).

## Registro de uso
| Fecha | Proyecto | Tarea | Resultado | Lección |
|---|---|---|---|---|
