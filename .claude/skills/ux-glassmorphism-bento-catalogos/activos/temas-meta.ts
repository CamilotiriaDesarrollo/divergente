// Contrato de METADATOS POR TEMA que alimenta la dirección "Bento + Vidrio".
// Extraído de Portal ISI: client/src/data/sistemas.ts (parte de temas/temaMeta).
// Cada tema aporta: color de acento (--c-tema) e imagen de fondo (/fondos/{imagen} -> --c-foto).
// Desacoplado de las 32 filas del catálogo: reusa esto y añade tus propios temas + fondos.

export type Tema =
  | 'artes' | 'cine' | 'estimulos' | 'fomento' | 'museos'
  | 'patrimonio' | 'datos' | 'institucional' | 'gestion'

export type Acceso = 'abierto' | 'registro' | 'mixto'

export interface TemaMeta {
  id: Tema
  label: string   // nombre humanizado del sector (nunca la sigla)
  color: string   // acento -> se inyecta como --c-tema y es el FALLBACK del fondo
  imagen: string  // archivo en client/public/fondos/{imagen}
}

// UNA imagen temática por SECTOR (no por sistema). Los 9 jpg viven en client/public/fondos/.
// OJO: la dirección visual (docs/direccion-visual.md, regla 4) fija datos = #00A9A5,
// pero el código quedó en #0E7C79. Reconciliar doc<->código antes de reutilizar.
export const temas: TemaMeta[] = [
  { id: 'museos',        label: 'Museos',             color: '#1D4ED8', imagen: 'museos.jpg' },
  { id: 'patrimonio',    label: 'Patrimonio',         color: '#0E7490', imagen: 'patrimonio.jpg' },
  { id: 'artes',         label: 'Artes y escena',     color: '#C2410C', imagen: 'artes.jpg' },
  { id: 'cine',          label: 'Cine y audiovisual', color: '#B11226', imagen: 'cine.jpg' },
  { id: 'estimulos',     label: 'Estímulos y apoyos', color: '#7C3AED', imagen: 'estimulos.jpg' },
  { id: 'fomento',       label: 'Fomento regional',   color: '#0F766E', imagen: 'fomento.jpg' },
  { id: 'datos',         label: 'Datos y registros',  color: '#0E7C79', imagen: 'datos.jpg' },
  { id: 'institucional', label: 'Institucional',      color: '#512DA8', imagen: 'institucional.jpg' },
  { id: 'gestion',       label: 'Gestión interna',    color: '#475569', imagen: 'gestion.jpg' },
]

// Acceso indexado por Record -> se pinta como pill data-acceso en la tarjeta.
export const temaMeta: Record<Tema, TemaMeta> = Object.fromEntries(
  temas.map(t => [t.id, t]),
) as Record<Tema, TemaMeta>

export const accesoLabel: Record<Acceso, string> = {
  abierto: 'Abierto',
  registro: 'Requiere registro',
  mixto: 'Acceso mixto',
}
