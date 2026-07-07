// activos/jsonld.tsx — Datos estructurados schema.org (JSON-LD) para Next.js / React.
// N0 (buenas prácticas, sin verificar en proyecto propio).
//
// Uso: renderizar <JsonLd data={...} /> dentro del componente de página. En React 19 y en el
// App Router de Next el <script> se puede colocar en el árbol y el motor lo ubica correctamente.
// Validar el resultado en https://validator.schema.org y en Google Rich Results Test.

import * as React from 'react';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://${DOMINIO}';

export function JsonLd({ data }: { data: Record<string, unknown> | Record<string, unknown>[] }) {
  return (
    <script
      type="application/ld+json"
      // JSON.stringify escapa comillas; para contenido de usuario, sanear "<" -> "\u003c".
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, '\\u003c') }}
    />
  );
}

// Entidad pública (línea gobierno). Para MinCultura/GovCo usar GovernmentOrganization.
export const governmentOrganization = {
  '@context': 'https://schema.org',
  '@type': 'GovernmentOrganization',
  name: '${ENTIDAD}',
  url: SITE_URL,
  logo: `${SITE_URL}/logo.png`,
  areaServed: { '@type': 'Country', name: 'Colombia' },
  sameAs: ['https://www.gov.co'],
};

// Sitio con caja de búsqueda (habilita el sitelinks searchbox de Google si hay /buscar?q=).
export const webSite = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: '${NOMBRE_SITIO}',
  url: SITE_URL,
  inLanguage: ['es-CO'], // añadir cada locale publicado, incl. lenguas nativas (ver i18n-locales)
  potentialAction: {
    '@type': 'SearchAction',
    target: { '@type': 'EntryPoint', urlTemplate: `${SITE_URL}/buscar?q={query}` },
    'query-input': 'required name=query',
  },
};

// Migas de pan. `items` = [{ name, path }] en orden jerárquico.
export function breadcrumbList(locale: string, items: { name: string; path: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((it, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: it.name,
      item: `${SITE_URL}/${locale}${it.path}`,
    })),
  };
}

// Obra/contenido cultural (catálogos MinCultura). Ajustar @type: CreativeWork | Article | Dataset.
export function creativeWork(locale: string, obj: {
  path: string; name: string; description: string; datePublished?: string; inLanguage?: string;
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'CreativeWork',
    name: obj.name,
    description: obj.description,
    url: `${SITE_URL}/${locale}${obj.path}`,
    inLanguage: obj.inLanguage ?? locale,
    datePublished: obj.datePublished,
    publisher: { '@type': 'GovernmentOrganization', name: '${ENTIDAD}' },
  };
}
