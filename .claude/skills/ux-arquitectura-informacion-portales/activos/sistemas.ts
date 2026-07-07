// Fuente: Plataformas_MinCulturas_Verificado.xlsx — hoja "5. Operativas Confirmadas".
// 32 plataformas verificadas técnicamente Y reportadas operativas por el equipo.
// Nombres humanizados ("cero siglas en la fachada"); la sigla/marca queda como subtítulo.

export type Tema =
  | 'artes'
  | 'cine'
  | 'estimulos'
  | 'fomento'
  | 'museos'
  | 'patrimonio'
  | 'datos'
  | 'institucional'
  | 'gestion'

export type Acceso = 'abierto' | 'registro' | 'mixto'
export type Publico = 'ciudadania' | 'agentes' | 'gestores' | 'investigadores' | 'funcionarios'
export type Tipo = 'portal' | 'sistema'

export interface SistemaOperativo {
  id: string
  marca: string        // sigla o marca corta (subtítulo discreto)
  nombre: string       // nombre humanizado, sin sigla (titular de la tarjeta)
  descripcion: string  // una frase de qué encontrará el ciudadano
  url: string
  tema: Tema
  tipo: Tipo
  acceso: Acceso
  publico: Publico[]
}

export interface TemaMeta {
  id: Tema
  label: string
  color: string
  imagen: string // archivo en /fondos/{imagen}
}

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

export const temaMeta: Record<Tema, TemaMeta> = Object.fromEntries(
  temas.map(t => [t.id, t]),
) as Record<Tema, TemaMeta>

export const accesoLabel: Record<Acceso, string> = {
  abierto: 'Abierto',
  registro: 'Requiere registro',
  mixto: 'Acceso mixto',
}

export const publicoLabel: Record<Publico, string> = {
  ciudadania: 'Ciudadanía',
  agentes: 'Agentes culturales',
  gestores: 'Gestores territoriales',
  investigadores: 'Investigadores',
  funcionarios: 'Funcionarios',
}

export const sistemas: SistemaOperativo[] = [
  // ── Museos ────────────────────────────────────────────────
  {
    id: 'museo-nacional',
    marca: 'Museo Nacional',
    nombre: 'Museo Nacional',
    descripcion: 'Exposiciones, colecciones y visitas al museo más antiguo del país.',
    url: 'http://www.museonacional.gov.co/Paginas/default.aspx',
    tema: 'museos', tipo: 'portal', acceso: 'abierto',
    publico: ['ciudadania', 'investigadores'],
  },
  {
    id: 'fragmentos',
    marca: 'Fragmentos',
    nombre: 'Museo Fragmentos',
    descripcion: 'Espacio de arte y memoria construido con el metal de las armas de la guerra.',
    url: 'https://fragmentos.gov.co',
    tema: 'museos', tipo: 'portal', acceso: 'abierto',
    publico: ['ciudadania', 'investigadores'],
  },
  {
    id: 'simco',
    marca: 'SIMCO',
    nombre: 'Directorio de Museos de Colombia',
    descripcion: 'Mapa y datos de los museos del país para visitar e investigar.',
    url: 'http://simco.museoscolombianos.gov.co',
    tema: 'museos', tipo: 'sistema', acceso: 'abierto',
    publico: ['ciudadania', 'gestores', 'investigadores'],
  },

  // ── Patrimonio ────────────────────────────────────────────
  {
    id: 'sipa-publico',
    marca: 'SIPA Público',
    nombre: 'Mapa del Patrimonio Cultural',
    descripcion: 'Visor geográfico para explorar los bienes patrimoniales de Colombia.',
    url: 'https://sipapublico.mincultura.gov.co/',
    tema: 'patrimonio', tipo: 'sistema', acceso: 'abierto',
    publico: ['ciudadania', 'investigadores'],
  },
  {
    id: 'patrimonio-inmaterial',
    marca: 'Patrimonio Inmaterial',
    nombre: 'Patrimonio Cultural Inmaterial',
    descripcion: 'Tradiciones, saberes y manifestaciones culturales vivas del país.',
    url: 'http://patrimonio.mincultura.gov.co/Paginas/default.aspx',
    tema: 'patrimonio', tipo: 'portal', acceso: 'abierto',
    publico: ['ciudadania', 'investigadores'],
  },
  {
    id: 'sipa-inventario',
    marca: 'SIPA Inventario',
    nombre: 'Inventario del Patrimonio',
    descripcion: 'Inscripción y consulta del inventario de bienes de interés cultural.',
    url: 'https://sipa.mincultura.gov.co/inventario',
    tema: 'patrimonio', tipo: 'sistema', acceso: 'registro',
    publico: ['gestores', 'investigadores'],
  },
  {
    id: 'autorizacion-bic',
    marca: 'Autorización BIC',
    nombre: 'Autorización de Bienes de Interés Cultural',
    descripcion: 'Solicita permiso para intervenir bienes de interés cultural.',
    url: 'https://autorizacionbic.mincultura.gov.co',
    tema: 'patrimonio', tipo: 'sistema', acceso: 'registro',
    publico: ['agentes', 'investigadores'],
  },
  {
    id: 'login-patrimonio',
    marca: 'App Patrimonio',
    nombre: 'Aplicaciones de Patrimonio',
    descripcion: 'Acceso a las aplicaciones de gestión del patrimonio cultural.',
    url: 'http://sipa.mincultura.gov.co',
    tema: 'patrimonio', tipo: 'sistema', acceso: 'registro',
    publico: ['gestores', 'investigadores'],
  },

  // ── Artes y escena ────────────────────────────────────────
  {
    id: 'maguare',
    marca: 'Maguaré',
    nombre: 'Maguaré',
    descripcion: 'Juegos, cuentos y música para la primera infancia.',
    url: 'https://maguare.gov.co',
    tema: 'artes', tipo: 'portal', acceso: 'abierto',
    publico: ['ciudadania'],
  },
  {
    id: 'maguared',
    marca: 'MaguaRED',
    nombre: 'MaguaRED',
    descripcion: 'Recursos para educadores y familias sobre cultura en la primera infancia.',
    url: 'https://maguared.gov.co',
    tema: 'artes', tipo: 'portal', acceso: 'abierto',
    publico: ['ciudadania', 'agentes'],
  },
  {
    id: 'celebra-musica',
    marca: 'Celebra la Música',
    nombre: 'Celebra la Música',
    descripcion: 'Red nacional de escuelas y eventos de formación musical.',
    url: 'http://celebralamusica.mincultura.gov.co/Paginas/inicio.aspx',
    tema: 'artes', tipo: 'portal', acceso: 'abierto',
    publico: ['ciudadania', 'agentes'],
  },
  {
    id: 'celebra-danza',
    marca: 'Celebra la Danza',
    nombre: 'Celebra la Danza',
    descripcion: 'Programas y encuentros de formación en danza.',
    url: 'http://celebraladanza.mincultura.gov.co/Paginas/default.aspx',
    tema: 'artes', tipo: 'portal', acceso: 'abierto',
    publico: ['ciudadania', 'agentes'],
  },
  {
    id: 'siartes',
    marca: 'SIARTES',
    nombre: 'Catálogo de las Artes',
    descripcion: 'Catálogo documental que articula las plataformas de las artes por disciplina.',
    url: 'https://siartes.mincultura.gov.co',
    tema: 'artes', tipo: 'sistema', acceso: 'mixto',
    publico: ['agentes', 'investigadores'],
  },
  {
    id: 'teatro-circo',
    marca: 'Teatro y Circo',
    nombre: 'Teatro y Circo',
    descripcion: 'Programas y convocatorias de las artes escénicas.',
    url: 'http://teatroycirco.mincultura.gov.co/Paginas/default.aspx',
    tema: 'artes', tipo: 'portal', acceso: 'mixto',
    publico: ['ciudadania', 'agentes'],
  },
  {
    id: 'portal-sidanza',
    marca: 'Portal SiDanza',
    nombre: 'Portal de Danza',
    descripcion: 'Noticias, eventos y oportunidades del sector de la danza.',
    url: 'http://sidanza.mincultura.gov.co/',
    tema: 'artes', tipo: 'portal', acceso: 'registro',
    publico: ['agentes'],
  },
  {
    id: 'sidanza',
    marca: 'SiDanza',
    nombre: 'Registro de Danza',
    descripcion: 'Registro para los agentes del sector de la danza.',
    url: 'https://appsidanza.mincultura.gov.co/',
    tema: 'artes', tipo: 'sistema', acceso: 'registro',
    publico: ['agentes'],
  },
  {
    id: 'pulep-portal',
    marca: 'PULEP',
    nombre: 'Espectáculos Públicos',
    descripcion: 'Información y estadísticas de los espectáculos públicos de las artes escénicas.',
    url: 'http://pulep.mincultura.gov.co/Paginas/default.aspx',
    tema: 'artes', tipo: 'portal', acceso: 'mixto',
    publico: ['ciudadania', 'agentes'],
  },
  {
    id: 'pulepapp',
    marca: 'PULEP App',
    nombre: 'Trámites de Espectáculos Públicos',
    descripcion: 'Registro y autorización de espectáculos públicos de las artes escénicas.',
    url: 'https://pulepapp.mincultura.gov.co',
    tema: 'artes', tipo: 'sistema', acceso: 'registro',
    publico: ['agentes'],
  },

  // ── Cine y audiovisual ────────────────────────────────────
  {
    id: 'cine-proyecto',
    marca: 'Cine Proyecto',
    nombre: 'Proyectos de Cine',
    descripcion: 'Certificación de proyectos cinematográficos nacionales.',
    url: 'https://cineproyecto.mincultura.gov.co',
    tema: 'cine', tipo: 'sistema', acceso: 'registro',
    publico: ['agentes'],
  },
  {
    id: 'cine-producto',
    marca: 'Cine Producto',
    nombre: 'Obras de Cine Terminadas',
    descripcion: 'Certificación de obras cinematográficas ya producidas.',
    url: 'https://cineproducto.mincultura.gov.co',
    tema: 'cine', tipo: 'sistema', acceso: 'registro',
    publico: ['agentes'],
  },
  {
    id: 'sirec',
    marca: 'SIREC',
    nombre: 'Salas de Cine y Taquilla',
    descripcion: 'Registro de salas de cine y estadísticas de taquilla del país.',
    url: 'https://sirec.gov.co',
    tema: 'cine', tipo: 'sistema', acceso: 'registro',
    publico: ['agentes', 'investigadores'],
  },

  // ── Estímulos y apoyos ────────────────────────────────────
  {
    id: 'concertacion',
    marca: 'Concertación',
    nombre: 'Concertación Cultural',
    descripcion: 'Cofinanciación del Estado para proyectos culturales de todo el país.',
    url: 'https://concertacion.mincultura.gov.co/#/home',
    tema: 'estimulos', tipo: 'sistema', acceso: 'mixto',
    publico: ['agentes', 'gestores'],
  },
  {
    id: 'trayectorias',
    marca: 'Trayectorias',
    nombre: 'Reconocimiento a Trayectorias',
    descripcion: 'Reconocimientos a creadores con trayectoria. Resultados públicos sin registro.',
    url: 'https://trayectorias2.mincultura.gov.co/#/home',
    tema: 'estimulos', tipo: 'sistema', acceso: 'abierto',
    publico: ['ciudadania', 'agentes'],
  },
  {
    id: 'jovenes',
    marca: 'Jóvenes',
    nombre: 'Jóvenes Creadores',
    descripcion: 'Convocatorias y estímulos dirigidos a los jóvenes creadores.',
    url: 'https://jovenes.mincultura.gov.co/',
    tema: 'estimulos', tipo: 'sistema', acceso: 'mixto',
    publico: ['agentes'],
  },
  {
    id: 'evaluacion-concertacion',
    marca: 'Evaluación Concertación',
    nombre: 'Evaluación de Concertación',
    descripcion: 'Plataforma de evaluación de los proyectos de Concertación.',
    url: 'https://evaluacionconcertacion.mincultura.gov.co/',
    tema: 'estimulos', tipo: 'sistema', acceso: 'registro',
    publico: ['funcionarios'],
  },
  {
    id: 'evaluacion-estimulos',
    marca: 'Evaluación Estímulos',
    nombre: 'Evaluación de Estímulos',
    descripcion: 'Plataforma de evaluación de las convocatorias de Estímulos.',
    url: 'https://evaluacionestimulos.mincultura.gov.co/#/login',
    tema: 'estimulos', tipo: 'sistema', acceso: 'registro',
    publico: ['funcionarios'],
  },

  // ── Fomento regional ──────────────────────────────────────
  {
    id: 'sifo',
    marca: 'SIFO',
    nombre: 'Casas de Cultura e Instancias Culturales',
    descripcion: 'Mapas y datos de 818 casas de cultura y miles de instancias del país.',
    url: 'https://sifo.mincultura.gov.co',
    tema: 'fomento', tipo: 'sistema', acceso: 'mixto',
    publico: ['gestores', 'investigadores'],
  },

  // ── Datos y registros ─────────────────────────────────────
  {
    id: 'soycultura',
    marca: 'SoyCultura',
    nombre: 'Registro Nacional de Agentes Culturales',
    descripcion: 'El registro de quienes hacen cultura en Colombia: más de 244.000 agentes.',
    url: 'https://soycultura.mincultura.gov.co',
    tema: 'datos', tipo: 'sistema', acceso: 'mixto',
    publico: ['ciudadania', 'agentes', 'investigadores'],
  },

  // ── Institucional ─────────────────────────────────────────
  {
    id: 'mincultura',
    marca: 'MinCulturas',
    nombre: 'Portal del Ministerio',
    descripcion: 'Noticias, normas y actualidad del Ministerio de las Culturas.',
    url: 'http://www.mincultura.gov.co',
    tema: 'institucional', tipo: 'portal', acceso: 'abierto',
    publico: ['ciudadania'],
  },

  // ── Gestión interna ───────────────────────────────────────
  {
    id: 'az-digital',
    marca: 'AZ Digital',
    nombre: 'Gestión Documental',
    descripcion: 'Gestión documental electrónica del Ministerio.',
    url: 'https://gestiondoc.etb.net.co/Instancias/MinculturaProduccion/AZDigitalV5.0/Login/Login.php',
    tema: 'gestion', tipo: 'sistema', acceso: 'registro',
    publico: ['funcionarios'],
  },
  {
    id: 'pqrs',
    marca: 'PQRSD',
    nombre: 'Peticiones, Quejas y Reclamos',
    descripcion: 'Gestión de peticiones, quejas, reclamos y sugerencias.',
    url: 'https://gestiondoc.etb.net.co/Instancias/MinculturaProduccion/PQRSD/Login/Login.php',
    tema: 'gestion', tipo: 'sistema', acceso: 'registro',
    publico: ['funcionarios'],
  },
  {
    id: 'siempre',
    marca: 'SIEMPRE',
    nombre: 'Sistema Interno de Sistemas',
    descripcion: 'Herramienta interna del Grupo de Sistemas del Ministerio.',
    url: 'https://siempre.mincultura.gov.co',
    tema: 'gestion', tipo: 'sistema', acceso: 'registro',
    publico: ['funcionarios'],
  },
]

// ── Utilidades de búsqueda y filtro ──────────────────────────
export interface FiltroSistemas {
  texto?: string
  tema?: Tema | null
  acceso?: Acceso | null
  publico?: Publico | null
}

const RANGO_DIACRITICOS = new RegExp('[\\u0300-\\u036f]', 'g')
const normaliza = (s: string) =>
  s.normalize('NFD').replace(RANGO_DIACRITICOS, '').toLowerCase()

export function filtrarSistemas(
  lista: SistemaOperativo[],
  filtro: FiltroSistemas,
): SistemaOperativo[] {
  const q = filtro.texto ? normaliza(filtro.texto.trim()) : ''
  return lista.filter(s => {
    if (filtro.tema && s.tema !== filtro.tema) return false
    if (filtro.acceso && s.acceso !== filtro.acceso) return false
    if (filtro.publico && !s.publico.includes(filtro.publico)) return false
    if (q) {
      const heno = normaliza(`${s.nombre} ${s.marca} ${s.descripcion} ${temaMeta[s.tema].label}`)
      if (!heno.includes(q)) return false
    }
    return true
  })
}
