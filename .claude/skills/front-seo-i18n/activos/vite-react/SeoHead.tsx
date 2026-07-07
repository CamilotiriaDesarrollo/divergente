// activos/vite-react/SeoHead.tsx — SEO en la línea Vite (React 19 SPA cliente/servidor + Express).
// N0 (buenas prácticas, sin verificar en proyecto propio).
//
// React 19 IZA (hoist) automáticamente <title>, <meta> y <link> renderizados en cualquier parte
// del árbol hacia el <head> real: ya NO hace falta react-helmet en React 19. Verificar la versión
// (React <19 requiere react-helmet-async).
//
// LÍMITE SEO IMPORTANTE (marcarlo en el blueprint):
//   Una SPA Vite pura renderiza en cliente. Googlebot ejecuta JS pero de forma diferida y frágil.
//   Para páginas que DEBEN indexarse bien (sitios públicos, catálogos MinCultura), preferir la
//   línea Next.js con SSG/SSR (skill front-nextjs-app-router-shell-compartido). La línea Vite es
//   adecuada para apps privadas/tras login (SEO no aplica) o si el Express hace SSR/prerender real.
//   Alternativa sin migrar: pre-render por ruta con un paso de build (p.ej. servir HTML por ruta
//   desde Express) — decisión de arquitectura, anotarla como decisión abierta del blueprint.

import * as React from 'react';

const SITE_URL = import.meta.env.VITE_SITE_URL ?? 'https://${DOMINIO}';

export function SeoHead(props: {
  title: string;
  description: string;
  path: string; // ruta actual con locale, ej '/es/catalogo'
  lang: string; // etiqueta BCP 47, ej 'es-CO' (sincroniza también document.documentElement.lang)
  alternates?: { hreflang: string; href: string }[]; // variantes de idioma
  jsonLd?: Record<string, unknown>;
}) {
  const canonical = `${SITE_URL}${props.path}`;

  // El <html lang> real debe fijarse en index.html o vía efecto (React 19 no iza el atributo lang de <html>).
  React.useEffect(() => {
    document.documentElement.lang = props.lang;
  }, [props.lang]);

  return (
    <>
      <title>{props.title}</title>
      <meta name="description" content={props.description} />
      <link rel="canonical" href={canonical} />
      {(props.alternates ?? []).map((a) => (
        <link key={a.hreflang} rel="alternate" hrefLang={a.hreflang} href={a.href} />
      ))}
      <meta property="og:title" content={props.title} />
      <meta property="og:description" content={props.description} />
      <meta property="og:url" content={canonical} />
      <meta name="twitter:card" content="summary_large_image" />
      {props.jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(props.jsonLd).replace(/</g, '\\u003c') }}
        />
      )}
    </>
  );
}
