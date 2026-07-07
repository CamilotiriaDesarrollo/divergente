/**
 * Almacén de "oportunidades sugeridas" en localStorage.
 *
 * La landing se despliega como HTML estático (next output: export), sin
 * servidor, así que la captura vive en el navegador — igual que las notas del
 * perfil. Para llevar estos datos al pipeline de scrapers (Python), el usuario
 * usa "Copiar para Claude" o "Descargar JSON" → data/oportunidades_sugeridas.json
 * → `python scripts/revisar_sugeridas.py`.
 */

export interface Sugerida {
  id: string;
  url: string;
  comentario: string;
  perfil: string;
  fuente_detectada: string;
  creado_en: string;
}

const CLAVE = 'sugeridas-v1';
export const EVENTO_SUGERIDAS = 'sugeridas-updated';

export function detectarFuente(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return '';
  }
}

export function leerSugeridas(): Sugerida[] {
  try {
    const raw = localStorage.getItem(CLAVE);
    if (!raw) return [];
    const arr = JSON.parse(raw) as Sugerida[];
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

function guardar(lista: Sugerida[]): void {
  try {
    localStorage.setItem(CLAVE, JSON.stringify(lista));
    window.dispatchEvent(new CustomEvent(EVENTO_SUGERIDAS));
  } catch {
    /* cuota llena o storage deshabilitado: se ignora */
  }
}

export function agregarSugerida(input: { url: string; comentario: string; perfil: string }): Sugerida {
  const sugerida: Sugerida = {
    id: `sug_${Date.now()}`,
    url: input.url.trim(),
    comentario: input.comentario.trim(),
    perfil: input.perfil,
    fuente_detectada: detectarFuente(input.url),
    creado_en: new Date().toISOString(),
  };
  guardar([sugerida, ...leerSugeridas()]);
  return sugerida;
}

export function eliminarSugerida(id: string): void {
  guardar(leerSugeridas().filter((s) => s.id !== id));
}

export function contarSugeridas(perfil: string): number {
  return leerSugeridas().filter((s) => s.perfil === perfil).length;
}

/** JSON con la misma forma que data/oportunidades_sugeridas.json (para el script). */
export function exportarJSON(lista: Sugerida[]): string {
  const doc = {
    sugeridas: lista.map((s) => ({ ...s, estado: 'nueva' as const, analisis: null })),
    updated_at: new Date().toISOString(),
  };
  return JSON.stringify(doc, null, 2);
}

/** Texto plano legible para pegarle a Claude en el chat. */
export function exportarTexto(lista: Sugerida[]): string {
  if (lista.length === 0) return '';
  const lineas = lista.map((s, i) => {
    const partes = [
      `${i + 1}. ${s.url}`,
      s.fuente_detectada ? `   fuente: ${s.fuente_detectada}` : '',
      s.comentario ? `   nota: ${s.comentario}` : '',
    ].filter(Boolean);
    return partes.join('\n');
  });
  return `Oportunidades sugeridas (perfil ${lista[0].perfil}):\n\n${lineas.join('\n\n')}`;
}
