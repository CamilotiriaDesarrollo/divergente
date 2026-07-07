/**
 * analytics.ts — capa fina de analítica agnóstica de proveedor.
 * Sirve a las dos líneas de front del portafolio:
 *   - Next.js 16 / React 19 (línea privada, Vercel)
 *   - React + Vite (línea client/server)
 *
 * Principios (N0, buenas prácticas):
 *   1. Un solo `track()` en toda la app; el proveedor real se decide por env.
 *   2. NADA sale del navegador sin consentimiento (habeas data / Ley 1581).
 *   3. CERO PII: las props se pasan por un allowlist y se hashea lo sensible.
 *
 * Config por variables de entorno (ver .env.analytics.example):
 *   NEXT_PUBLIC_ANALYTICS_PROVIDER = "matomo" | "ga4" | "none"
 *   NEXT_PUBLIC_GA_ID              = "G-XXXXXXXXXX"          (solo ga4)
 *   NEXT_PUBLIC_MATOMO_URL         = "https://analitica.${ENTIDAD}.gov.co"
 *   NEXT_PUBLIC_MATOMO_SITE_ID     = "1"
 *
 * VERIFICAR VERSIÓN: en Next.js el montaje de GA4 se hace con
 * `@next/third-parties/google` (<GoogleAnalytics gaId=... />). Esa librería
 * seguía marcada como reciente al cutoff (ene-2026); confirma su API en la
 * doc vigente de Next antes de usarla. Aquí solo enviamos eventos a `gtag`
 * asumiendo que el script ya fue montado por el proveedor.
 */

type Provider = "matomo" | "ga4" | "none";

const PROVIDER: Provider =
  (process.env.NEXT_PUBLIC_ANALYTICS_PROVIDER as Provider) ?? "none";

// Allowlist de propiedades permitidas por evento. Todo lo demás se descarta.
// Mantener sincronizado con tracking-plan.csv. Ninguna clave de PII aquí.
const PROP_ALLOWLIST = new Set<string>([
  "region", "dispositivo", "canal", "ruta", "titulo", "filtros",
  "n_resultados", "ficha_id", "categoria", "posicion", "recurso_id",
  "formato", "origen", "metodo", "codigo", "nivel", "termino_hash",
]);

let consentGranted = false;

/** Llamar cuando el usuario acepta el banner de cookies de analítica. */
export function grantConsent() {
  consentGranted = true;
  track("consent_otorgado", { nivel: "analitica" });
}
export function revokeConsent() { consentGranted = false; }

/** Hash no reversible para convertir texto sensible (p. ej. término de búsqueda)
 *  en un identificador estable sin guardar el original. NO es seguridad, es
 *  minimización de datos. */
export async function hashText(text: string): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return Array.from(new Uint8Array(buf)).slice(0, 8)
    .map((b) => b.toString(16).padStart(2, "0")).join("");
}

function sanitize(props: Record<string, unknown> = {}) {
  const clean: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(props)) {
    if (PROP_ALLOWLIST.has(k)) clean[k] = v;
  }
  return clean;
}

/** Único punto de entrada de eventos. Ver nombres en tracking-plan.csv. */
export function track(event: string, props: Record<string, unknown> = {}) {
  if (typeof window === "undefined") return;      // no en SSR
  if (!consentGranted && event !== "consent_otorgado") return;
  const payload = sanitize(props);

  if (PROVIDER === "ga4" && (window as any).gtag) {
    (window as any).gtag("event", event, payload);
  } else if (PROVIDER === "matomo" && (window as any)._paq) {
    // Matomo: eventos como categoria/accion + dimensiones personalizadas.
    (window as any)._paq.push(["trackEvent", "app", event, JSON.stringify(payload)]);
  }
  if (process.env.NODE_ENV !== "production") {
    // eslint-disable-next-line no-console
    console.debug("[analytics]", PROVIDER, event, payload);
  }
}

/** Vista de página. En App Router se llama desde un efecto con usePathname. */
export function trackPageView(ruta: string, titulo?: string) {
  track("page_view", { ruta, ...(titulo ? { titulo } : {}) });
}
