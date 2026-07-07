# Integración de next-intl en next.config (Next.js 16)

> N0 — buenas prácticas, sin verificar en proyecto propio. La API del plugin puede cambiar entre
> versiones de next-intl (v3/v4). Confirmar contra `node_modules/next-intl/README.md` de la
> versión instalada y contra `node_modules/next/dist/docs/` (regla AGENTS.md de los proyectos Next).

```mjs
// next.config.mjs
import createNextIntlPlugin from 'next-intl/plugin';

// Ruta al archivo getRequestConfig (activos/next-intl/i18n-request.ts en este repo de skill).
const withNextIntl = createNextIntlPlugin('./i18n/request.ts');

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Para sitio estático (línea Vercel privada sin backend):
  // output: 'export',            // OJO: middleware NO corre en export; ver middleware.ts
  // images: { unoptimized: true },
  // trailingSlash: false,
};

export default withNextIntl(nextConfig);
```

## Estructura de archivos resultante

```
proyecto/
  next.config.mjs
  middleware.ts                 <- solo modo servidor (SSR/ISR); NO en output:'export'
  i18n/request.ts               <- getRequestConfig (activos/next-intl/i18n-request.ts)
  messages/
    es.json                     <- activos/next-intl/messages/es.json
    en.json
  app/
    [locale]/
      layout.tsx                <- activos/next-intl/locale-layout.tsx (fija <html lang>)
      page.tsx
    sitemap.ts                  <- activos/sitemap.ts
    robots.ts                   <- activos/robots.ts
  lib/i18n-locales.ts           <- activos/i18n-locales.ts (fuente única de locales)
```

## Decisión clave: SSR/ISR vs export estático

- **Servidor (Vercel, SSR/ISR):** usar `middleware.ts` para negociar idioma y redirigir `/` → `/es`.
- **Export estático (`output: 'export'`):** el middleware no se ejecuta. Pre-renderizar cada locale
  con `generateStaticParams` (ya en `locale-layout.tsx`) y resolver la raíz `/` con una página
  selectora o un redirect de cliente. Anotar la elección como decisión abierta del blueprint (F1).
