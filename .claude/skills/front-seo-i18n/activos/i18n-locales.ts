// activos/i18n-locales.ts — Configuración central de idiomas (incl. lenguas nativas de Colombia).
// N0 (buenas prácticas, sin verificar en proyecto propio).
//
// CRÍTICO — validar cada código antes de publicar:
//   Los segmentos de URL son cortos y estables; los `hreflang` DEBEN ser etiquetas BCP 47 válidas
//   (subtag primario ISO 639-1/639-3). Un hreflang inválido hace que Google IGNORE la anotación.
//   Las lenguas indígenas rara vez tienen ISO 639-1 (2 letras): se usa el código ISO 639-3 (3 letras).
//   Los códigos de abajo son un PUNTO DE PARTIDA y deben confirmarse contra:
//     - Registro ISO 639-3 (SIL): https://iso639-3.sil.org
//     - Listado oficial de lenguas nativas del Ministerio de Cultura (Ley 1381 de 2010).
//   Si una lengua no tiene código ISO, usar extensión privada BCP 47 `es-x-<slug>` y documentarlo.
//   Relación normativa: WCAG/NTC 5854 exige `lang` correcto (criterios 3.1.1 y 3.1.2) —
//   ver skill ux-accesibilidad-ntc5854-aa.

export const LOCALES = ['es', 'en'] as const; // segmentos de ruta reales del proyecto
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = 'es';

// Mapa segmento-de-ruta -> etiqueta BCP 47 para <html lang> y hreflang.
export const LOCALE_HREFLANG: Record<Locale, string> = {
  es: 'es-CO',
  en: 'en',
};

// Etiqueta legible para el selector de idioma.
export const LOCALE_LABEL: Record<Locale, string> = {
  es: 'Español',
  en: 'English',
};

// Catálogo de lenguas nativas candidatas (activar añadiéndolas a LOCALES cuando haya traducción).
// segmento -> { bcp47 (a validar), etiqueta autoglotónimo }.
export const LENGUAS_NATIVAS_REFERENCIA: Record<string, { bcp47: string; label: string; nota: string }> = {
  guc: { bcp47: 'guc', label: 'Wayuunaiki', nota: 'ISO 639-3 guc (pueblo Wayuu) — confirmar' },
  pbb: { bcp47: 'pbb', label: 'Nasa Yuwe', nota: 'ISO 639-3 pbb (Páez) — confirmar' },
  cbc: { bcp47: 'es-x-embera', label: 'Emberá', nota: 'varias variantes; validar código por variante' },
  kog: { bcp47: 'kog', label: 'Kággaba', nota: 'ISO 639-3 kog (Kogui) — confirmar' },
};
