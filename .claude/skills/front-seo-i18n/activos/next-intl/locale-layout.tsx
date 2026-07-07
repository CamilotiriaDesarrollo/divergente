// activos/next-intl/locale-layout.tsx — app/[locale]/layout.tsx (Next.js 16 App Router + next-intl).
// N0 (buenas prácticas, sin verificar en proyecto propio).
//
// Claves:
//   - <html lang={locale}> se fija AQUÍ, no en el root layout (requisito de a11y NTC 5854 3.1.1).
//   - generateStaticParams pre-renderiza cada locale => necesario para output:'export' y bueno para SSG.
//   - `params` es asíncrono en Next 15/16 => await.
//   - setRequestLocale habilita el render estático con next-intl (nombre según versión: verificar).

import { NextIntlClientProvider } from 'next-intl';
import { getMessages, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { LOCALES, LOCALE_HREFLANG, type Locale } from '../i18n-locales';
import { baseMetadata } from '../metadata';

export const metadata = baseMetadata;

export function generateStaticParams() {
  return LOCALES.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!(LOCALES as readonly string[]).includes(locale)) notFound();

  setRequestLocale(locale); // habilita render estático de los mensajes
  const messages = await getMessages();

  return (
    <html lang={LOCALE_HREFLANG[locale as Locale]}>
      <body>
        <NextIntlClientProvider messages={messages}>{children}</NextIntlClientProvider>
      </body>
    </html>
  );
}
