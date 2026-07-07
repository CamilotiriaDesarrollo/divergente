// activos/robots.ts — app/robots.ts para Next.js 16 App Router.
// N0 (buenas prácticas, sin verificar en proyecto propio).
// Genera /robots.txt en build. Compatible con output:'export'.

import type { MetadataRoute } from 'next';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://${DOMINIO}';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        // Bloquear áreas privadas/administrativas si existen (nunca indexar back-office):
        disallow: ['/admin', '/api'],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
