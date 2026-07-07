// ─────────────────────────────────────────────────────────────
// MAPA CATEGORÍA → COLOR/FOTO — fuente de verdad del acento
// Extracto REAL de Interfase Pagina Inicial/client/src/data/sistemas.ts
// El componente lee temaMeta[sistema.tema].color y lo inyecta como
// custom property:  style={{ '--c-tema': meta.color }}.
// ─────────────────────────────────────────────────────────────

export type Tema =
  | 'museos' | 'patrimonio' | 'artes' | 'cine' | 'estimulos'
  | 'fomento' | 'datos' | 'institucional' | 'gestion'

export interface TemaMeta {
  id: Tema
  label: string
  color: string
  imagen: string // archivo en /fondos/{imagen}
}

// Lista editable — cada categoría con su acento y su foto temática.
export const temas: TemaMeta[] = [
  { id: 'museos',        label: 'Museos',              color: '#1D4ED8', imagen: 'museos.jpg' },
  { id: 'patrimonio',    label: 'Patrimonio',          color: '#0E7490', imagen: 'patrimonio.jpg' },
  { id: 'artes',         label: 'Artes y escena',      color: '#C2410C', imagen: 'artes.jpg' },
  { id: 'cine',          label: 'Cine y audiovisual',  color: '#B11226', imagen: 'cine.jpg' },
  { id: 'estimulos',     label: 'Estímulos y apoyos',  color: '#7C3AED', imagen: 'estimulos.jpg' },
  { id: 'fomento',       label: 'Fomento regional',    color: '#0F766E', imagen: 'fomento.jpg' },
  { id: 'datos',         label: 'Datos y registros',   color: '#0E7C79', imagen: 'datos.jpg' },
  { id: 'institucional', label: 'Institucional',       color: '#512DA8', imagen: 'institucional.jpg' },
  { id: 'gestion',       label: 'Gestión interna',     color: '#475569', imagen: 'gestion.jpg' },
]

// Record para O(1) por id: temaMeta[tema].color
export const temaMeta: Record<Tema, TemaMeta> = Object.fromEntries(
  temas.map(t => [t.id, t]),
) as Record<Tema, TemaMeta>
