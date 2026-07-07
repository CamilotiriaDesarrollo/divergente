// activos/sitemap.ts — app/sitemap.ts para Next.js 16 App Router, multi-locale con hreflang.
// N0 (buenas prácticas, sin verificar en proyecto propio).
//
// Genera /sitemap.xml en build. Compatible con output:'export' (se emite como archivo estático).
// Cada URL declara sus variantes de idioma en `alternates.languages` (recomendación de Google
// para sitios multilingües). Reemplazar ROUTES por las rutas reales o derivarlas del contenido.

import type { MetadataRoute } from 'next';
import { LOCALES, LOCALE_HREFLANG } from './i18n-locales';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://${DOMINIO}';

// Rutas canónicas SIN prefijo de locale. En un sitio con datos, derivarlas del catálogo/CMS.
const ROUTES: { path: string; priority: number; changeFrequency: MetadataRoute.Sitemap[number]['changeFrequency'] }[] = [
  { path: '', priority: 1.0, changeFrequency: 'weekly' },
  { path: '/catalogo', priority: 0.8, changeFrequency: 'weekly' },
  { path: '/acerca', priority: 0.5, changeFrequency: 'monthly' },
];

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  return ROUTES.flatMap((r) => {
    const languages: Record<string, string> = {};
    for (const l of LOCALES) languages[LOCALE_HREFLANG[l]] = `${SITE_URL}/${l}${r.path}`;

    // Una entrada por locale; cada una lista TODAS las variantes en alternates.
    return LOCALES.map((l) => ({
      url: `${SITE_URL}/${l}${r.path}`,
      lastModified: now,
      changeFrequency: r.changeFrequency,
      priority: r.priority,
      alternates: { languages },
    }));
  });
}
