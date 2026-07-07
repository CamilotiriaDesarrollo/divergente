"use client";
/**
 * AnalyticsProvider.tsx — montaje de analítica para Next.js 16 / App Router.
 *
 * Colócalo en app/layout.tsx dentro de <body>. Hace tres cosas:
 *   1. Monta el script del proveedor SOLO tras consentimiento.
 *   2. Rastrea cambios de ruta del App Router (usePathname + useSearchParams),
 *      porque la navegación cliente NO dispara page_view sola.
 *   3. Anonimiza la URL: NUNCA envía el querystring crudo (puede traer PII).
 *
 * VERIFICAR VERSIÓN (ene-2026): para GA4 en Next se recomienda
 * `@next/third-parties/google`. Confírmalo en la doc de Next vigente; si esa
 * API cambió, monta gtag con next/script en su lugar. Para Matomo self-hosted
 * no hay componente oficial: se inyecta el snippet _paq con next/script.
 */
import { useEffect, Suspense } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import Script from "next/script";
import { trackPageView, grantConsent } from "./analytics";

const PROVIDER = process.env.NEXT_PUBLIC_ANALYTICS_PROVIDER ?? "none";
const MATOMO_URL = process.env.NEXT_PUBLIC_MATOMO_URL;
const MATOMO_SITE = process.env.NEXT_PUBLIC_MATOMO_SITE_ID;

function RouteTracker() {
  const pathname = usePathname();
  const search = useSearchParams();
  useEffect(() => {
    // Se envía SOLO la ruta y las keys de filtro conocidas, nunca el query crudo.
    const filtro = search.get("q") ? "con_busqueda" : undefined;
    trackPageView(pathname ?? "/", filtro);
  }, [pathname, search]);
  return null;
}

export default function AnalyticsProvider({ consent }: { consent: boolean }) {
  useEffect(() => { if (consent) grantConsent(); }, [consent]);
  if (!consent || PROVIDER === "none") return null;

  return (
    <>
      {PROVIDER === "matomo" && MATOMO_URL && (
        <Script id="matomo" strategy="afterInteractive">{`
          var _paq = window._paq = window._paq || [];
          _paq.push(['setDoNotTrack', true]);
          _paq.push(['anonymizeIp']);            // IP es dato personal
          _paq.push(['trackPageView']);
          (function() {
            var u="${MATOMO_URL}/";
            _paq.push(['setTrackerUrl', u+'matomo.php']);
            _paq.push(['setSiteId', '${MATOMO_SITE}']);
            var g=document.createElement('script');
            g.async=true; g.src=u+'matomo.js';
            document.head.appendChild(g);
          })();
        `}</Script>
      )}
      {/* Para GA4: <GoogleAnalytics gaId={process.env.NEXT_PUBLIC_GA_ID!} />
          importado de "@next/third-parties/google" (verificar versión). */}
      <Suspense fallback={null}>
        <RouteTracker />
      </Suspense>
    </>
  );
}
