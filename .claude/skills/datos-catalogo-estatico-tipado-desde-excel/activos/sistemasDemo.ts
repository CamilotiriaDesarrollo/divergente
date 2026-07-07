import sipaLogoRaw from '@/assets/logos/logo_sipa.svg?raw'
import sinicLogoRaw from '@/assets/logos/logo_sinic.svg?raw'
import soyCulturaLogoRaw from '@/assets/logos/logo_soycultura.svg?raw'
import siaLogoRaw from '@/assets/logos/logo_sia.svg?raw'
import estimulosLogoRaw from '@/assets/logos/logo_estimulos.svg?raw'
import bancoLogoRaw from '@/assets/logos/banco.svg?raw'

export interface SistemaDemo {
  id: string
  sigla: string        // texto fallback si no hay SVG
  descripcion: string  // texto bajo el logo
  svgRaw?: string      // SVG inline (heredado vía currentColor)
}

export const sistemasDemo: SistemaDemo[] = [
  // ── fijos (primeros FIXED_COUNT = 4) ──────────────────────
  { id: 'sinic',        sigla: 'SNIC', descripcion: 'Sistema nacional de información cultural',      svgRaw: sinicLogoRaw },
  { id: 'sipa',         sigla: 'SIPA', descripcion: 'Sistema de información de patrimonio y memoria', svgRaw: sipaLogoRaw },
  { id: 'si-artes',     sigla: 'SIA',  descripcion: 'Sistema de información para las artes',          svgRaw: siaLogoRaw },
  { id: 'cineproyecto', sigla: 'CIN',  descripcion: 'Cineproyecto' },
  // ── carrusel ──────────────────────────────────────────────
  { id: 'banco',        sigla: 'BC',   descripcion: 'Banco de Contenidos',                           svgRaw: bancoLogoRaw },
  { id: 'soy-cultura',  sigla: 'SC',   descripcion: 'Soy Cultura',                                   svgRaw: soyCulturaLogoRaw },
  { id: 'estimulos',    sigla: 'EST',  descripcion: 'Programa Nacional de Estímulos',                svgRaw: estimulosLogoRaw },
  { id: 'artes-paz',    sigla: 'APZ',  descripcion: 'Artes para la Paz' },
  { id: 'gastro',       sigla: 'GHC',  descripcion: 'Gastroherencia Colombia' },
  { id: 'maguare',      sigla: 'MAG',  descripcion: 'Maguaré' },
  { id: 'maguared',     sigla: 'MGD',  descripcion: 'Maguared' },
  { id: 'concertacion', sigla: 'PNCC', descripcion: 'Programa Nacional de Concertación Cultural' },
  { id: 'reading',      sigla: 'RC',   descripcion: 'Reading Colombia' },
  { id: 'celebra',      sigla: 'CLM',  descripcion: 'Celebra la música' },
]
