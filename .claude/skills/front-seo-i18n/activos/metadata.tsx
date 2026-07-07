// activos/metadata.tsx — Plantilla de metadata SEO para Next.js 16 App Router.
// N0 (buenas prácticas, sin verificar en proyecto propio). Adaptar dominio, textos y locales.
//
// Requisitos:
//   - Variable de entorno NEXT_PUBLIC_SITE_URL (en Vercel: Project Settings > Environment Variables;
//     en local: .env.local). Ej: https://${DOMINIO}
//   - En output:'export' metadataBase DEBE ser una URL absoluta o las OG/canonical salen relativas.
//
// La API `Metadata` de Next puede cambiar entre majors; verificar contra
// node_modules/next/dist/docs/ (regla AGENTS.md de los proyectos Next 16 del Dueño).

import type { Metadata } from 'next';
import { LOCALES, LOCALE_HREFLANG, type Locale } from './i18n-locales';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://${DOMINIO}';

// 1) Metadata estática compartida (root layout). Sirve de default heredable por cada página.
export const baseMetadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: '${NOMBRE_SITIO}',
    template: '%s · ${NOMBRE_SITIO}', // páginas hijas rellenan %s con su title
  },
  description: '${DESCRIPCION_150_CHARS}',
  applicationName: '${NOMBRE_SITIO}',
  authors: [{ name: '${ENTIDAD}' }],
  robots: { index: true, follow: true },
  openGraph: {
    type: 'website',
    siteName: '${NOMBRE_SITIO}',
    locale: 'es_CO',
    images: [{ url: '/og/default.png', width: 1200, height: 630, alt: '${NOMBRE_SITIO}' }],
  },
  twitter: { card: 'summary_large_image' },
  icons: { icon: '/favicon.ico' },
};

// 2) Metadata por página con alternates hreflang. Usar en cada page.tsx localizada.
//    `params` es asíncrono en Next 15/16: SIEMPRE await.
export async function buildPageMetadata(opts: {
  params: Promise<{ locale: Locale }>;
  path: string; // ruta canónica SIN locale, ej: '/catalogo/obras'
  title: string;
  description: string;
}): Promise<Metadata> {
  const { locale } = await opts.params;

  // hreflang: una entrada por locale + x-default. Todas absolutas y auto-referenciales.
  const languages: Record<string, string> = { 'x-default': `${SITE_URL}${opts.path}` };
  for (const l of LOCALES) {
    languages[LOCALE_HREFLANG[l]] = `${SITE_URL}/${l}${opts.path}`;
  }

  return {
    title: opts.title,
    description: opts.description,
    alternates: {
      canonical: `${SITE_URL}/${locale}${opts.path}`, // canónico = la variante actual
      languages,
    },
    openGraph: {
      title: opts.title,
      description: opts.description,
      url: `${SITE_URL}/${locale}${opts.path}`,
    },
  };
}
