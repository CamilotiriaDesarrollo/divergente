// activos/next-intl/LocaleSwitcher.tsx — selector de idioma (Next.js App Router + next-intl).
// N0 (buenas prácticas, sin verificar en proyecto propio).
//
// Cambia el prefijo de locale de la ruta actual preservando el resto del path (mejor UX y SEO que
// mandar siempre al home). Usa <a> reales (no botones) para que sean rastreables/compartibles.

'use client';

import { usePathname } from 'next/navigation';
import { LOCALES, LOCALE_LABEL, type Locale } from '../i18n-locales';

export function LocaleSwitcher({ current }: { current: Locale }) {
  const pathname = usePathname(); // ej '/es/catalogo/obras'
  const rest = pathname.replace(/^\/[^/]+/, ''); // quita el primer segmento (el locale)

  return (
    <nav aria-label="Cambiar idioma">
      <ul>
        {LOCALES.map((l) => (
          <li key={l}>
            <a
              href={`/${l}${rest || ''}`}
              hrefLang={l}
              aria-current={l === current ? 'true' : undefined}
              lang={l}
            >
              {LOCALE_LABEL[l]}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
