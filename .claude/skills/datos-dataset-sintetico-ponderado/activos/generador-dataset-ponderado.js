// ═══════════════════════════════════════════════════════════════════════════
// GENERADOR DE DATASET SINTÉTICO PONDERADO — extracto fiel de:
// Plataforma GEDII · app/components/dashboard.js (líneas 34-145)
// Origen: C:/Users/camil/Desktop/IA Raiz Proyectos/002 Desarrollos/Plataforma GEDII
// Genera 100 investigaciones deterministas (sin Math.random) para validar
// dashboards, filtros multinivel y mapa coroplético antes de la fuente real.
// Regla de oro: los pesos de cada distribución suman EXACTAMENTE N (=100),
// lo que permite indexar DIST[i] directo sin módulo.
// ═══════════════════════════════════════════════════════════════════════════

// ─── Distribuciones helper ─────────────────────────────────────────────────
const mkDist = (pairs) => pairs.flatMap(([v, n]) => Array(n).fill(v));

const DEPS_DIST = mkDist([
  ["Dirección de Artes", 32], ["Patrimonio y Memoria", 24], ["Planeación", 18],
  ["Biblioteca Nacional", 12], ["Música y Danzas", 8], ["Comunicaciones", 4],
  ["Investigación Cultural", 2],
]); // suma = 100
const EST_DIST  = mkDist([["Finalizada", 50], ["En curso", 25], ["Planeada", 25]]);
const AÑO_DIST  = mkDist([[2018,8],[2019,12],[2020,11],[2021,14],[2022,20],[2023,18],[2024,17]]);

const TEMAS_POOL = [
  "Patrimonio cultural","Música","Artes visuales","Danza","Memoria e historia",
  "Identidades culturales","Arte escénico","Audiovisual y medios","Economía creativa",
];
const TIPO_DIST = mkDist([
  ["Diagnóstico",28],["Caracterización",22],["Mapeo",18],
  ["Evaluación de política",14],["Inventario",12],["Monitoreo",6],
]);
const METOD_DIST = mkDist([
  ["Mixta",30],["Cualitativa",28],["Cuantitativa",22],["Documental",12],["Etnográfica",8],
]);
const ALCANCE_DIST = mkDist([
  ["Departamental",30],["Nacional",25],["Regional",20],["Municipal",15],["Local",10],
]);
// Dimensión multivalor: los "valores" son arrays (incluye combinaciones)
const COMUNIDAD_SETS = mkDist([
  [["General"],45],[["Indígena"],12],[["Afrocolombiana"],12],
  [["Jóvenes"],8],[["Adulto mayor"],7],[["Raizal/Palenquero"],6],
  [["General","Indígena"],5],[["General","Afrocolombiana"],5],
]);

// Concentración territorial realista: Bogotá ~10%, Antioquia ~8%, Valle ~5%…
// + combinaciones de 2 y 3 departamentos (proyectos multi-territorio).
// OJO: 98 entradas ≠ N=100 → se indexa con i % DEPTS_SETS.length
const DEPTS_SETS = [
  ["Bogotá D.C."],["Bogotá D.C."],["Bogotá D.C."],["Bogotá D.C."],["Bogotá D.C."],
  ["Bogotá D.C."],["Bogotá D.C."],["Bogotá D.C."],["Bogotá D.C."],["Bogotá D.C."],
  ["Antioquia"],["Antioquia"],["Antioquia"],["Antioquia"],["Antioquia"],
  ["Antioquia"],["Antioquia"],["Antioquia"],
  ["Valle del Cauca"],["Valle del Cauca"],["Valle del Cauca"],["Valle del Cauca"],["Valle del Cauca"],
  ["Atlántico"],["Atlántico"],["Atlántico"],["Atlántico"],
  ["Santander"],["Santander"],["Santander"],
  ["Bolívar"],["Bolívar"],["Bolívar"],
  ["Cundinamarca"],["Cundinamarca"],
  ["Nariño"],["Nariño"],
  ["Chocó"],["Chocó"],
  ["Cauca"],["Cauca"],
  ["Magdalena"],["Magdalena"],
  ["Tolima"],["Tolima"],
  ["Meta"],["Huila"],["Boyacá"],["Risaralda"],["Caldas"],
  ["Norte de Santander"],["Norte de Santander"],
  ["Sucre"],["Córdoba"],["Quindío"],
  ["Bogotá D.C.","Cundinamarca"],["Antioquia","Chocó"],["Valle del Cauca","Cauca"],
  ["Bogotá D.C.","Boyacá"],["Santander","Norte de Santander"],["Bolívar","Atlántico"],
  ["Nariño","Putumayo"],["Meta","Casanare"],["Antioquia","Córdoba"],["Magdalena","Cesar"],
  ["Tolima","Huila"],["Risaralda","Caldas"],["Bogotá D.C.","Meta"],["Cauca","Nariño"],
  ["Atlántico","Magdalena"],["Valle del Cauca","Risaralda"],["Boyacá","Casanare"],
  ["Santander","Boyacá"],["Caquetá","Putumayo"],["Antioquia","Risaralda"],
  ["Cundinamarca","Tolima"],["Chocó","Valle del Cauca"],["Huila","Caquetá"],
  ["Arauca","Casanare"],["Guaviare","Meta"],["Córdoba","Sucre"],
  ["La Guajira","Cesar"],["Vichada","Meta"],["Amazonas","Caquetá"],["Vaupés","Guainía"],
  ["Bogotá D.C.","Cundinamarca","Boyacá"],["Antioquia","Chocó","Córdoba"],
  ["Valle del Cauca","Cauca","Nariño"],["Bolívar","Atlántico","Magdalena"],
  ["Santander","Norte de Santander","Boyacá"],["Meta","Casanare","Arauca"],
  ["Caquetá","Putumayo","Amazonas"],["Antioquia","Risaralda","Caldas"],
  ["Bogotá D.C.","Meta","Cundinamarca"],["Huila","Tolima","Cauca"],
  ["La Guajira","Cesar","Magdalena"],["Guaviare","Vaupés","Vichada"],
  ["Nariño","Putumayo","Cauca"],["Chocó","Valle del Cauca","Risaralda"],
  ["Norte de Santander","Arauca","Casanare"],
];

// Pool de 20 títulos plausibles del dominio (sector cultural colombiano)
const TITULOS = [
  "Caracterización del sector musical colombiano",
  "Inventario del patrimonio inmaterial",
  "Diagnóstico de artes visuales en territorios",
  "Mapeo de agentes culturales y creativos",
  "Estudio de prácticas danzarias afrocolombianas",
  "Análisis del sistema de bibliotecas públicas",
  "Investigación sobre memoria histórica y territorio",
  "Estudio de consumo cultural regional",
  "Caracterización de la economía creativa",
  "Diagnóstico de industrias culturales y creativas",
  "Investigación de artes escénicas contemporáneas",
  "Análisis de identidad cultural regional",
  "Estudio de políticas culturales municipales",
  "Mapeo de festivales y eventos culturales",
  "Investigación sobre diversidad cultural étnica",
  "Diagnóstico de formación artística profesional",
  "Estudio de circulación de contenidos culturales digitales",
  "Análisis de participación ciudadana en la cultura",
  "Investigación de patrimonio arquitectónico vernáculo",
  "Caracterización de la producción audiovisual colombiana",
];

export const INVESTIGATIONS = Array.from({ length: 100 }, (_, i) => ({
  // ID con nomenclatura institucional: DA-INV-001-18
  // El año embebido sale del MISMO AÑO_DIST[i] que el campo `año` → consistencia interna
  id: `DA-INV-${String(i+1).padStart(3,'0')}-${String(AÑO_DIST[i]).slice(2)}`,
  // Sufijo "· Vol. N" evita títulos duplicados exactos al ciclar el pool
  titulo: TITULOS[i%TITULOS.length] + (i>=20 ? ` · Vol. ${Math.floor(i/20)+1}` : ''),
  año:         AÑO_DIST[i],
  dependencia: DEPS_DIST[i],
  departamentos: DEPTS_SETS[i%DEPTS_SETS.length],
  estado:      EST_DIST[i],
  // Par de temas con offset +3 y dedup defensivo
  temas: [TEMAS_POOL[i%TEMAS_POOL.length], TEMAS_POOL[(i+3)%TEMAS_POOL.length]]
    .filter((v,idx,a) => a.indexOf(v)===idx),
  tipo:        TIPO_DIST[i],
  metodologia: METOD_DIST[i],
  alcance:     ALCANCE_DIST[i],
  comunidad:   COMUNIDAD_SETS[i],
}));

// ─── Frecuencia (para barras/nubes del dashboard) ─────────────────────────
export function freq(arr, key) {
  const m = {};
  arr.forEach(d => { const v = d[key]; m[v] = (m[v]||0)+1; });
  return Object.entries(m).map(([k,v])=>({label:k,count:v})).sort((a,b)=>b.count-a.count);
}
