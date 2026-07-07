// activos/next-intl/middleware.ts — enrutado por locale con next-intl (Next.js 16 App Router).
// N0 (buenas prácticas, sin verificar en proyecto propio).
//
// OJO CON LA VERSIÓN: la API de next-intl cambió entre v3 y v4 (nombres como `requestLocale`,
// `setRequestLocale`, ruta del plugin). Verificar contra la doc de la versión instalada:
//   npm ls next-intl   y   node_modules/next-intl/README.md
//
// LIMITACIÓN CON output:'export': el middleware NO se ejecuta en export estático. Para sitios
// estáticos NO usar este middleware; en su lugar pre-renderizar cada locale con
// generateStaticParams (ver locale-layout.tsx) y ofrecer la raíz "/" como redirección de cliente
// o página selectora. Este middleware es para el modo servidor (Vercel línea privada, SSR/ISR).

import createMiddleware from 'next-intl/middleware';
import { LOCALES, DEFAULT_LOCALE } from '../i18n-locales';

export default createMiddleware({
  locales: [...LOCALES],
  defaultLocale: DEFAULT_LOCALE,
  localePrefix: 'always', // '/es/...' siempre visible => mejor para SEO/hreflang que 'as-needed'
  localeDetection: true, // negocia con Accept-Language en el primer acceso a '/'
});

export const config = {
  // No interceptar API, assets de Next, ni archivos con extensión.
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)'],
};
