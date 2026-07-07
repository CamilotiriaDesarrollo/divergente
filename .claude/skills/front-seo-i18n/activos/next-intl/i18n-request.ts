// activos/next-intl/i18n-request.ts — carga de mensajes por request (next-intl, App Router).
// Colocar en i18n/request.ts y registrarlo con createNextIntlPlugin('./i18n/request.ts') en next.config.
// N0 (buenas prácticas, sin verificar en proyecto propio). Verificar API contra la versión instalada.

import { getRequestConfig } from 'next-intl/server';
import { LOCALES, DEFAULT_LOCALE, type Locale } from '../i18n-locales';

export default getRequestConfig(async ({ requestLocale }) => {
  // requestLocale puede venir indefinido; validar contra la lista blanca y caer al default.
  const requested = await requestLocale;
  const locale: Locale = (LOCALES as readonly string[]).includes(requested ?? '')
    ? (requested as Locale)
    : DEFAULT_LOCALE;

  return {
    locale,
    messages: (await import(`../messages/${locale}.json`)).default,
  };
});
