'use client';
import { useState, useMemo, useEffect, useRef } from 'react';
import MapaColombia from './MapaColombia';

// ─── Paleta ────────────────────────────────────────────────────────────────
const P = "#2D1658", PD = "#1A0A3D", PS = "#F5F2FF", ACC = "#E8A020";
const C_FIN = "#4E9D6B", C_CUR = "#5B8DB8", C_PLA = "#E8A020";
const BORDER = "#E4DFF4";
const ECOLS = { Finalizada: C_FIN, "En curso": C_CUR, Planeada: C_PLA };

// ─── Colores por dimensión ─────────────────────────────────────────────────
const TEMA_COLORS = {
  "Patrimonio cultural":"#7055AA","Música":"#5B8DB8","Artes visuales":"#E8A020",
  "Danza":"#4E9D6B","Memoria e historia":"#2D1658","Identidades culturales":"#B5305B",
  "Arte escénico":"#6B4BB0","Audiovisual y medios":"#3D8888","Economía creativa":"#C86820",
};
const TIPO_COLORS = {
  "Diagnóstico":"#5B8DB8","Caracterización":"#7055AA","Mapeo":"#4E9D6B",
  "Evaluación de política":"#E8A020","Inventario":"#6B4BB0","Monitoreo":"#B5305B",
};
const METOD_COLORS = {
  "Cuantitativa":"#5B8DB8","Cualitativa":"#7055AA","Mixta":"#2D1658",
  "Etnográfica":"#4E9D6B","Documental":"#E8A020",
};
const ALCANCE_COLORS = {
  "Local":"#C8B8E8","Municipal":"#A08CC8","Departamental":"#7055AA",
  "Regional":"#4A2E8A","Nacional":"#2D1658",
};
const COMUNIDAD_COLORS = {
  "General":"#9080B8","Indígena":"#4E9D6B","Afrocolombiana":"#2D1658",
  "Raizal/Palenquero":"#5B8DB8","Jóvenes":"#E8A020","Adulto mayor":"#B5305B",
};

// ─── Distribuciones helper ─────────────────────────────────────────────────
const mkDist = (pairs) => pairs.flatMap(([v, n]) => Array(n).fill(v));

const DEPS_DIST = mkDist([
  ["Dirección de Artes", 32], ["Patrimonio y Memoria", 24], ["Planeación", 18],
  ["Biblioteca Nacional", 12], ["Música y Danzas", 8], ["Comunicaciones", 4],
  ["Investigación Cultural", 2],
]);
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
const COMUNIDAD_SETS = mkDist([
  [["General"],45],[["Indígena"],12],[["Afrocolombiana"],12],
  [["Jóvenes"],8],[["Adulto mayor"],7],[["Raizal/Palenquero"],6],
  [["General","Indígena"],5],[["General","Afrocolombiana"],5],
]);

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
  id: `DA-INV-${String(i+1).padStart(3,'0')}-${String(AÑO_DIST[i]).slice(2)}`,
  titulo: TITULOS[i%TITULOS.length] + (i>=20 ? ` · Vol. ${Math.floor(i/20)+1}` : ''),
  año:         AÑO_DIST[i],
  dependencia: DEPS_DIST[i],
  departamentos: DEPTS_SETS[i%DEPTS_SETS.length],
  estado:      EST_DIST[i],
  temas: [TEMAS_POOL[i%TEMAS_POOL.length], TEMAS_POOL[(i+3)%TEMAS_POOL.length]]
    .filter((v,idx,a) => a.indexOf(v)===idx),
  tipo:        TIPO_DIST[i],
  metodologia: METOD_DIST[i],
  alcance:     ALCANCE_DIST[i],
  comunidad:   COMUNIDAD_SETS[i],
}));

// ─── Frecuencia ────────────────────────────────────────────────────────────
function freq(arr, key) {
  const m = {};
  arr.forEach(d => { const v = d[key]; m[v] = (m[v]||0)+1; });
  return Object.entries(m).map(([k,v])=>({label:k,count:v})).sort((a,b)=>b.count-a.count);
}

// ─── Counter animado ───────────────────────────────────────────────────────
function Counter({ target, duration = 900 }) {
  const [val, setVal] = useState(0);
  const rafRef = useRef(null);
  useEffect(() => {
    const num = parseInt(String(target).replace(/[^0-9]/g,""))||0;
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    const s = Date.now();
    const tick = () => {
      const p = Math.min((Date.now()-s)/duration,1);
      setVal(Math.round(num*(1-Math.pow(1-p,3))));
      if (p<1) rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [target, duration]);
  return <span>{val>=1000 ? val.toLocaleString("es-CO") : val}</span>;
}

// ─── KPI (número estilo hero, sin tarjeta) ─────────────────────────────────
function KPICard({ label, value, strokeColor = "#9880C8" }) {
  const isNum = typeof value === 'number';
  return (
    <div style={{ flex:1, minWidth:0, textAlign:'center', padding:'4px 12px' }}>
      <div style={{
        fontSize:'clamp(34px,3.5vw,52px)',
        fontFamily:"'Barlow Condensed',Impact,sans-serif",
        fontWeight:900,
        WebkitTextStroke:`2.5px ${strokeColor}`,
        color:'transparent',
        letterSpacing:'-2px',
        lineHeight:1,
        display:'block',
      }}>
        {isNum ? <Counter target={value} /> : value}
      </div>
      <div style={{ fontSize:10, color:'#888', marginTop:5, fontFamily:"'Barlow',sans-serif", lineHeight:1.3, maxWidth:88, margin:'5px auto 0' }}>
        {label}
      </div>
    </div>
  );
}

// ─── KPI compacto (header) ────────────────────────────────────────────────
function KPICardSm({ label, value, strokeColor = "#9880C8" }) {
  const isNum = typeof value === 'number';
  return (
    <div style={{ textAlign:'center', padding:'2px 10px' }}>
      <div style={{
        fontSize:'clamp(20px,1.8vw,28px)',
        fontFamily:"'Barlow Condensed',Impact,sans-serif",
        fontWeight:900,
        WebkitTextStroke:`2px ${strokeColor}`,
        color:'transparent',
        letterSpacing:'-1px',
        lineHeight:1,
      }}>
        {isNum ? <Counter target={value} /> : value}
      </div>
      <div style={{ fontSize:9, color:'#999', marginTop:3, lineHeight:1.2, maxWidth:80, margin:'3px auto 0' }}>
        {label}
      </div>
    </div>
  );
}

// ─── Nube de palabras ─────────────────────────────────────────────────────
// Colores variados del sistema GEDII para dar vida a la nube
// Paleta morada de oscuro a claro — el más frecuente obtiene el tono más oscuro
const CLOUD_PURPLES = ["#1A0A3D","#2D1658","#4A2E8A","#6B4BB0","#7055AA","#9080B8","#A898CC","#C0B0E0","#D4C8F0"];
// Orden visual mezclado para aspecto orgánico
const CLOUD_ORDER   = [2, 5, 0, 7, 3, 1, 6, 4, 8];

function WordCloud({ temas, fTemas = [], onToggle }) {
  const sorted = useMemo(() => {
    const m = {};
    temas.forEach(t => { m[t]=(m[t]||0)+1; });
    return Object.entries(m).sort((a,b)=>b[1]-a[1]);
  }, [temas]);

  const max = sorted[0]?.[1] || 1;
  const min = sorted[sorted.length-1]?.[1] || 1;
  const span = max - min || 1;

  // Orden visual mezclado; color asignado por rango de frecuencia (no por posición visual)
  const display = CLOUD_ORDER
    .filter(i => i < sorted.length)
    .map(i => ({ word: sorted[i][0], count: sorted[i][1], rank: i }));

  return (
    <div>
      <div style={{
        display:"flex", flexWrap:"wrap",
        justifyContent:"center", alignItems:"baseline",
        gap:"1px 6px", padding:"8px 2px 6px",
        lineHeight: 1.25,
      }}>
        {display.map(({ word, count, rank }) => {
          const ratio  = (count - min) / span;
          const size   = Math.round(9 + ratio * 24);   // 9–33 px
          const col    = CLOUD_PURPLES[Math.round((1 - ratio) * (CLOUD_PURPLES.length - 1))];
          const act    = fTemas.includes(word);
          return (
            <button key={word} onClick={() => onToggle && onToggle(word)}
              title={`${count} investigaciones`}
              style={{
                fontSize: size,
                fontWeight: 400,
                fontFamily:"'Barlow Condensed','Arial Narrow',sans-serif",
                letterSpacing: "0.2px",
                color: act ? "#FFF" : col,
                background: act ? col : "transparent",
                border: `1px solid ${act ? col : "transparent"}`,
                borderRadius: 3,
                padding:"0 2px",
                cursor:"pointer",
                lineHeight: 1.25,
                transition:"all .15s",
                opacity: act ? 1 : 0.4 + ratio * 0.6,
              }}>
              {word}
            </button>
          );
        })}
      </div>
      {fTemas.length > 0 && (
        <div style={{ textAlign:"center", marginTop:4 }}>
          <button onClick={() => fTemas.forEach(t => onToggle && onToggle(t))}
            style={{ fontSize:9, color:"#B5305B", background:"#FCE6EC", border:"1px solid #D4366A", borderRadius:999, padding:"3px 10px", cursor:"pointer", fontFamily:"inherit" }}>
            ✕ Quitar selección de temas
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Donut chart ───────────────────────────────────────────────────────────
function DonutChart({ data, total }) {
  const R=50, W=22, CX=64, CY=64, CIRC=2*Math.PI*R;
  let off=0;
  const [hov, setHov] = useState(null);
  return (
    <div style={{ display:"flex", gap:14, alignItems:"center", flexWrap:"wrap" }}>
      <svg width={128} height={128} viewBox="0 0 128 128">
        {data.map(({label,count}) => {
          const pct=count/total, dash=pct*CIRC, gap=CIRC-dash, o=-(off*CIRC)+CIRC*0.25;
          off+=pct;
          return (
            <circle key={label} cx={CX} cy={CY} r={R} fill="none"
              stroke={ECOLS[label]||"#CCC"} strokeWidth={hov===label?W+4:W}
              strokeDasharray={`${dash} ${gap}`} strokeDashoffset={o}
              style={{ cursor:"pointer", transition:"stroke-width .15s" }}
              onMouseEnter={()=>setHov(label)} onMouseLeave={()=>setHov(null)} />
          );
        })}
        <text x={CX} y={CY-5} textAnchor="middle" fontSize="17" fontWeight="800" fill={PD} fontFamily="'Barlow Condensed',sans-serif">{total}</text>
        <text x={CX} y={CY+11} textAnchor="middle" fontSize="8.5" fill="#888" fontFamily="'Barlow',sans-serif">Total</text>
      </svg>
      <div style={{ display:"flex", flexDirection:"column", gap:7 }}>
        {data.map(({label,count}) => (
          <div key={label} style={{ display:"flex", alignItems:"center", gap:7, fontSize:12 }}>
            <span style={{ width:10, height:10, borderRadius:"50%", background:ECOLS[label], flexShrink:0 }} />
            <span style={{ color:"#444", flex:1 }}>{label}</span>
            <span style={{ fontWeight:700, color:PD, minWidth:20, textAlign:"right" }}>{count}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Barras de navegación ──────────────────────────────────────────────────
const BAR_COLS = ["#2D1658","#4A2E8A","#6B4BB0","#9070CC","#B090E0","#C8B0F0","#DDD0F8"];

function NavBars({ data, activeLabel, onSelect }) {
  const max = data[0]?.count||1;
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:6, width:"100%" }}>
      {data.map(({label,count},i) => {
        const active = activeLabel===label;
        return (
          <div key={label} onClick={()=>onSelect(active?"":label)}
            style={{ cursor:"pointer", borderRadius:8, padding:"6px 8px", background:active?PS:"transparent", border:`1px solid ${active?P:'transparent'}`, transition:"background .15s, border .15s" }}>
            <div style={{ display:"flex", justifyContent:"space-between", fontSize:11, color:active?PD:"#555", marginBottom:4, fontWeight:active?700:400 }}>
              <span style={{ overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", maxWidth:"80%" }}>{label}</span>
              <span style={{ fontWeight:700, color:active?P:PD, flexShrink:0 }}>{count}</span>
            </div>
            <div style={{ height:8, background:active?"#D8CDEE":"#EDE7F8", borderRadius:4, overflow:"hidden" }}>
              <div style={{ height:"100%", width:`${(count/max)*100}%`, background:active?ACC:(BAR_COLS[i]||BAR_COLS[6]), borderRadius:4, transition:"width .4s, background .2s" }} />
            </div>
          </div>
        );
      })}
      {activeLabel && (
        <button onClick={()=>onSelect("")} style={{ marginTop:2, fontSize:10, color:"#B5305B", background:"#FCE6EC", border:"1px solid #D4366A", borderRadius:999, padding:"3px 10px", cursor:"pointer", fontFamily:"inherit", alignSelf:"flex-start" }}>
          ✕ Quitar filtro
        </button>
      )}
    </div>
  );
}

// ─── Línea por año ─────────────────────────────────────────────────────────
function LineChart({ data }) {
  const W=260, H=90, PAD=20;
  const years=data.map(d=>d.label), counts=data.map(d=>d.count);
  const maxV=Math.max(...counts);
  const xS = i => PAD+(i/(years.length-1))*(W-PAD*2);
  const yS = v => H-PAD-((v)/(maxV||1))*(H-PAD*2);
  const pts=counts.map((v,i)=>`${xS(i)},${yS(v)}`).join(' ');
  const area=[`${xS(0)},${H-PAD}`,...counts.map((v,i)=>`${xS(i)},${yS(v)}`),`${xS(counts.length-1)},${H-PAD}`].join(' ');
  const [hov,setHov]=useState(null);
  return (
    <svg width="100%" viewBox={`0 0 ${W} ${H+20}`} style={{ overflow:"visible" }}>
      {[0,0.25,0.5,0.75,1].map(t=>{const y=H-PAD-t*(H-PAD*2); return <line key={t} x1={PAD} y1={y} x2={W-PAD} y2={y} stroke="#EDE7F8" strokeWidth="1"/>; })}
      <polygon points={area} fill={`${P}18`} />
      <polyline points={pts} fill="none" stroke={P} strokeWidth="2.2" strokeLinejoin="round" />
      {counts.map((v,i)=>(
        <g key={i} onMouseEnter={()=>setHov(i)} onMouseLeave={()=>setHov(null)} style={{ cursor:"pointer" }}>
          <circle cx={xS(i)} cy={yS(v)} r={hov===i?6:4} fill={P} stroke="#FFF" strokeWidth="2" />
          {hov===i && <text x={xS(i)} y={yS(v)-10} textAnchor="middle" fontSize="10" fontWeight="700" fill={PD}>{v}</text>}
        </g>
      ))}
      {years.map((y,i)=><text key={y} x={xS(i)} y={H+14} textAnchor="middle" fontSize="9.5" fill="#888">{y}</text>)}
    </svg>
  );
}

// ─── Panel header ──────────────────────────────────────────────────────────
function PanelHeader({ title, info }) {
  return (
    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:12 }}>
      <div style={{ fontSize:12, fontWeight:700, color:PD, textTransform:"uppercase", letterSpacing:"0.5px" }}>{title}</div>
      {info && (
        <div title={info} style={{ width:16, height:16, borderRadius:"50%", border:`1.5px solid #C9BCEC`, display:"flex", alignItems:"center", justifyContent:"center", cursor:"help", flexShrink:0 }}>
          <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="#9080B8" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
        </div>
      )}
    </div>
  );
}

// ─── Estilos comunes de filtros ────────────────────────────────────────────
const LST = { fontSize:10, color:"#AAA", textTransform:"uppercase", letterSpacing:"0.7px", fontWeight:700 };

function SearchInput({ value, onChange }) {
  return (
    <div style={{ display:"flex", alignItems:"center", gap:6, border:`1px solid ${value?P:BORDER}`, background:"#FAFAFA", borderRadius:8, padding:"7px 10px" }}>
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#9080B8" strokeWidth="2.2" strokeLinecap="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
      <input value={value} onChange={e=>onChange(e.target.value)} placeholder="Buscar investigación..."
        style={{ border:"none", outline:"none", fontSize:11, color:"#444", background:"transparent", width:"100%", fontFamily:"inherit" }} />
      {value && (
        <button onClick={()=>onChange("")} style={{ background:"none", border:"none", cursor:"pointer", color:"#AAA", fontSize:14, lineHeight:1, padding:0 }}>×</button>
      )}
    </div>
  );
}

function ClearBtn({ onClick }) {
  return (
    <button onClick={onClick} style={{ border:`1px solid #D4366A`, background:"#FCE6EC", color:"#B5305B", padding:"7px 12px", borderRadius:8, fontSize:11, fontWeight:700, cursor:"pointer", fontFamily:"inherit", width:"100%" }}>
      Limpiar todos los filtros
    </button>
  );
}

function FilterSelect({ label, options, value, onChange }) {
  const [open,setOpen]=useState(false);
  return (
    <div style={{ position:"relative", width:"100%" }}>
      <button onClick={()=>setOpen(o=>!o)} style={{ width:"100%", border:`1px solid ${value?P:BORDER}`, background:value?PS:"#FAFAFA", color:value?PD:"#666", padding:"8px 11px", borderRadius:8, fontSize:11, fontWeight:value?700:400, cursor:"pointer", fontFamily:"inherit", display:"flex", alignItems:"center", justifyContent:"space-between", gap:6 }}>
        <span style={{ overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{value||label}</span>
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" style={{ flexShrink:0 }}><polyline points="6 9 12 15 18 9"/></svg>
      </button>
      {open && (
        <div style={{ position:"absolute", top:"calc(100% + 4px)", left:0, right:0, background:"#FFF", border:`1px solid ${BORDER}`, borderRadius:10, padding:"5px 0", zIndex:200, boxShadow:"0 8px 24px rgba(45,22,88,.12)", maxHeight:200, overflowY:"auto" }}>
          <div onClick={()=>{onChange("");setOpen(false);}} style={{ padding:"7px 12px", fontSize:11, cursor:"pointer", color:"#999", fontStyle:"italic" }}>Todos</div>
          {options.map(opt=>(
            <div key={opt} onClick={()=>{onChange(opt);setOpen(false);}} style={{ padding:"7px 12px", fontSize:11, cursor:"pointer", background:value===opt?PS:"none", color:value===opt?PD:"#444", fontWeight:value===opt?700:400 }}>{opt}</div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Chips genérico multi-select ───────────────────────────────────────────
function ChipGroup({ items, active, onToggle, colorMap, color = "#7055AA", allData, countKey, countFn }) {
  return (
    <div style={{ display:"flex", flexWrap:"wrap", gap:5, marginTop:7 }}>
      {items.map(item => {
        const act = Array.isArray(active) ? active.includes(item) : active === item;
        const col = (colorMap && colorMap[item]) || color;
        const n   = countFn ? countFn(item) : (allData ? allData.filter(d => {
          const v = d[countKey];
          return Array.isArray(v) ? v.includes(item) : v === item;
        }).length : 0);
        return (
          <button key={item} onClick={() => onToggle(item)}
            style={{ display:"inline-flex", alignItems:"center", gap:4, padding:"4px 9px", borderRadius:999, border:`1.5px solid ${act?col:BORDER}`, background:act?col:col+"15", color:act?"#FFF":col, fontSize:10, fontWeight:act?700:500, cursor:"pointer", fontFamily:"inherit", transition:"all .15s", whiteSpace:"nowrap" }}>
            {item}
            {n > 0 && <span style={{ fontSize:8, opacity:act?0.85:0.6 }}>{n}</span>}
          </button>
        );
      })}
    </div>
  );
}

// ─── Agrupación por región ─────────────────────────────────────────────────
const REGIONES = {
  "Caribe":    ["Atlántico","Bolívar","Cesar","Córdoba","La Guajira","Magdalena","Sucre"],
  "Andina":    ["Antioquia","Bogotá D.C.","Boyacá","Caldas","Cundinamarca","Huila","Norte de Santander","Quindío","Risaralda","Santander","Tolima"],
  "Pacífico":  ["Cauca","Chocó","Nariño","Valle del Cauca"],
  "Orinoquía": ["Arauca","Casanare","Meta","Vichada"],
  "Amazonia":  ["Amazonas","Caquetá","Guainía","Guaviare","Putumayo","Vaupés"],
};
const REG_COLORS = { Caribe:"#5B8DB8", Andina:"#2D1658", Pacífico:"#4E9D6B", Orinoquía:"#E8A020", Amazonia:"#6B4BB0" };

function TerritorySection({ allData, fDepts, setFDepts }) {
  const [openReg, setOpenReg] = useState(null);

  const deptCount = useMemo(() => {
    const m = {};
    allData.forEach(d => d.departamentos.forEach(dep => { m[dep]=(m[dep]||0)+1; }));
    return m;
  }, [allData]);

  const regCount = reg => REGIONES[reg].reduce((s,d)=>s+(deptCount[d]||0),0);

  function toggleDept(d) {
    setFDepts(prev => prev.includes(d) ? prev.filter(x=>x!==d) : [...prev, d]);
  }

  function toggleRegion(reg) {
    const regDepts = REGIONES[reg];
    const allSel = regDepts.every(d => fDepts.includes(d));
    if (allSel) {
      setFDepts(prev => prev.filter(d => !regDepts.includes(d)));
    } else {
      setFDepts(prev => [...new Set([...prev, ...regDepts])]);
    }
  }

  return (
    <div>
      <div style={LST}>Territorio · por región</div>
      <div style={{ display:"flex", flexDirection:"column", gap:5, marginTop:8 }}>
        {Object.entries(REGIONES).map(([reg, regDepts]) => {
          const col     = REG_COLORS[reg] || P;
          const selIn   = regDepts.filter(d => fDepts.includes(d));
          const allSel  = selIn.length === regDepts.length;
          const someSel = selIn.length > 0;
          const isOpen  = openReg === reg;
          const total   = regCount(reg);

          return (
            <div key={reg} style={{ borderRadius:10, border:`1.5px solid ${someSel?col:isOpen?"#C9BCEC":BORDER}`, overflow:"hidden", transition:"border-color .15s" }}>
              <div style={{ display:"flex", alignItems:"center", background:someSel?col+"14":isOpen?"#F0EDF8":"#F6F4FC", transition:"background .12s" }}>
                <button
                  onClick={() => toggleRegion(reg)}
                  title={allSel ? "Deseleccionar región" : "Seleccionar toda la región"}
                  style={{ flex:1, display:"flex", alignItems:"center", gap:7, padding:"7px 10px", border:"none", background:"transparent", color:someSel?col:isOpen?PD:"#555", fontSize:11, fontWeight:someSel||isOpen?700:500, cursor:"pointer", fontFamily:"inherit", textAlign:"left" }}
                >
                  <span style={{ width:9, height:9, borderRadius:"50%", flexShrink:0, background:allSel?col:someSel?"transparent":col+"55", border:someSel?`2px solid ${col}`:"none", transition:"all .15s" }} />
                  <span>{reg}</span>
                  {someSel && <span style={{ fontSize:9, background:col, color:"#FFF", borderRadius:999, padding:"1px 6px", fontWeight:700, flexShrink:0 }}>{selIn.length}</span>}
                  <span style={{ fontSize:9, color:someSel?col:"#AAA", fontWeight:600, marginLeft:"auto", marginRight:4 }}>{total}</span>
                </button>
                <button
                  onClick={() => setOpenReg(isOpen ? null : reg)}
                  title={isOpen ? "Cerrar" : "Ver departamentos"}
                  style={{ padding:"7px 10px", border:"none", background:"transparent", cursor:"pointer", color:"#9080B8", display:"flex", alignItems:"center", flexShrink:0 }}
                >
                  <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"
                    style={{ transform:isOpen?"rotate(180deg)":"none", transition:"transform .2s", opacity:0.55 }}>
                    <polyline points="6 9 12 15 18 9"/>
                  </svg>
                </button>
              </div>
              {isOpen && (
                <div style={{ padding:"8px 10px 10px", borderTop:`1px solid ${someSel?col+"33":BORDER}`, background:"#FAFAFA" }}>
                  <div style={{ display:"flex", flexWrap:"wrap", gap:4 }}>
                    {regDepts.map(d => {
                      const act = fDepts.includes(d);
                      const n   = deptCount[d] || 0;
                      return (
                        <button key={d} onClick={() => toggleDept(d)}
                          style={{ display:"inline-flex", alignItems:"center", gap:3, padding:"3px 8px", borderRadius:999, border:`1.5px solid ${act?col:BORDER}`, background:act?col:"#FFF", color:act?"#FFF":"#555", fontSize:10, fontWeight:act?700:400, cursor:"pointer", fontFamily:"inherit", transition:"all .12s", whiteSpace:"nowrap" }}>
                          {d}
                          {n > 0 && <span style={{ fontSize:8, opacity:act?0.85:0.5 }}>{n}</span>}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
      {fDepts.length > 0 && (
        <button onClick={() => setFDepts([])} style={{ marginTop:7, fontSize:10, color:"#B5305B", background:"#FCE6EC", border:"1px solid #D4366A", borderRadius:999, padding:"3px 10px", cursor:"pointer", fontFamily:"inherit" }}>
          ✕ Quitar filtro de territorio ({fDepts.length})
        </button>
      )}
    </div>
  );
}

// ─── Indicador de filtros activos de otros paneles ─────────────────────────
function ActiveFiltersBadge({ filters, onClear }) {
  if (!filters.length) return null;
  return (
    <div style={{ display:"flex", flexWrap:"wrap", gap:4, padding:"8px 10px", background:"#F0EDF8", borderRadius:8, marginBottom:4 }}>
      <span style={{ fontSize:9, color:"#9080B8", fontWeight:700, textTransform:"uppercase", letterSpacing:"0.5px", alignSelf:"center", marginRight:2 }}>Activos:</span>
      {filters.map(f => (
        <span key={f.label} onClick={f.clear} style={{ fontSize:9, background:PS, color:P, border:`1px solid #C9BCEC`, borderRadius:999, padding:"2px 7px", cursor:"pointer", fontWeight:600 }}>
          {f.label} ×
        </span>
      ))}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════
// PANEL A — "Temporal"
// Navegación por tiempo, estado y territorio
// ══════════════════════════════════════════════════════════════════
function FilterPanelA({ años, allData, filteredData, filteredNoTerr, fAño, setFAño, fDepts, setFDepts, fEst, setFEst,
  fTemas, fTipo, fMetod, fAlcance, fComunidad,
  setFTemas, setFTipo, setFMetod, setFAlcance, setFComunidad,
  search, setSearch, onClear, hasFilters }) {
  const fd = filteredData || allData;
  const añoCounts = años.map(y=>({ y, n:fd.filter(d=>String(d.año)===y).length }));
  const total = fd.length || 1;

  const otrosActivos = [
    ...fTemas.map(t => ({ label:`Tema: ${t}`, clear: () => setFTemas(p=>p.filter(x=>x!==t)) })),
    fTipo   ? [{ label:`Tipo: ${fTipo}`,  clear: () => setFTipo("") }] : [],
    fMetod  ? [{ label:`Metod.: ${fMetod}`, clear: () => setFMetod("") }] : [],
    fAlcance? [{ label:`Alcance: ${fAlcance}`, clear: () => setFAlcance("") }] : [],
    ...fComunidad.map(c => ({ label:`Comunidad: ${c}`, clear: () => setFComunidad(p=>p.filter(x=>x!==c)) })),
  ].flat();

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
      <ActiveFiltersBadge filters={otrosActivos} />

      {/* Timeline de años */}
      <div>
        <div style={LST}>Año de inicio</div>
        <div style={{ position:"relative", marginTop:20, marginBottom:2 }}>
          <div style={{ position:"absolute", top:5, left:9, right:9, height:1.5, background:BORDER, zIndex:0 }} />
          <div style={{ display:"flex", justifyContent:"space-between", position:"relative", zIndex:1 }}>
            {añoCounts.map(({y,n}) => {
              const act = fAño===y;
              return (
                <div key={y} onClick={()=>setFAño(act?"":y)} title={`${y}: ${n} inv.`}
                  style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:4, cursor:"pointer" }}>
                  <div style={{ width:10, height:10, borderRadius:"50%", border:`2px solid ${act?P:BORDER}`, background:act?P:"#FFF", boxShadow:act?`0 0 0 3px ${PS}`:"none", flexShrink:0, transition:"all .18s" }} />
                  <span style={{ fontSize:8, color:act?P:"#AAA", fontWeight:act?700:400, lineHeight:1 }}>{y}</span>
                </div>
              );
            })}
          </div>
        </div>
        {fAño && (
          <div style={{ fontSize:10, color:P, fontWeight:700, textAlign:"center", marginTop:4 }}>
            {fAño} · {añoCounts.find(a=>a.y===fAño)?.n} investigaciones
          </div>
        )}
      </div>

      {/* Estado */}
      <div>
        <div style={LST}>Estado</div>
        <div style={{ display:"flex", flexDirection:"column", gap:7, marginTop:7 }}>
          {["Finalizada","En curso","Planeada"].map(e => {
            const act=fEst===e, col=ECOLS[e];
            const n=fd.filter(d=>d.estado===e).length;
            const pct=Math.round(n/total*100);
            return (
              <div key={e} onClick={()=>setFEst(act?"":e)} style={{ cursor:"pointer", borderRadius:8, padding:"7px 9px", border:`1.5px solid ${act?col:BORDER}`, background:act?col+"12":"#F6F4FC", transition:"all .15s" }}>
                <div style={{ display:"flex", justifyContent:"space-between", fontSize:11, color:act?col:"#555", marginBottom:5, fontWeight:act?700:400 }}>
                  <span>{e}</span><span style={{ fontSize:10, opacity:0.7 }}>{n} · {pct}%</span>
                </div>
                <div style={{ height:4, background:"#E4DFF4", borderRadius:3, overflow:"hidden" }}>
                  <div style={{ height:"100%", width:`${pct}%`, background:act?col:col+"99", borderRadius:3, transition:"width .4s" }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Territorio */}
      <TerritorySection allData={filteredNoTerr || allData} fDepts={fDepts} setFDepts={setFDepts} />

      {/* Búsqueda */}
      <div>
        <div style={LST}>Búsqueda libre</div>
        <div style={{ marginTop:6 }}><SearchInput value={search} onChange={setSearch} /></div>
      </div>

      {hasFilters && <ClearBtn onClick={onClear} />}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════
// PANEL B — "Temático"
// Navegación por contenido: temas, tipo y metodología
// ══════════════════════════════════════════════════════════════════
function FilterPanelB({ allData, filteredData, fAño, setFAño, fDepts, fEst, setFEst,
  fTemas, setFTemas, fTipo, setFTipo, fMetod, setFMetod,
  search, setSearch, onClear, hasFilters }) {
  const fd = filteredData || allData;

  function toggleTema(t) { setFTemas(prev => prev.includes(t) ? prev.filter(x=>x!==t) : [...prev, t]); }

  const otrosActivos = [
    fAño    ? [{ label:`Año: ${fAño}`,  clear: () => setFAño("") }] : [],
    fEst    ? [{ label:`Estado: ${fEst}`, clear: () => setFEst("") }] : [],
    fDepts.length ? [{ label:`${fDepts.length} territorio(s)`, clear: () => {} }] : [],
  ].flat();

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
      <ActiveFiltersBadge filters={otrosActivos} />

      {/* Temas — primario */}
      <div>
        <div style={LST}>Temas de investigación</div>
        <ChipGroup
          items={TEMAS_POOL}
          active={fTemas}
          onToggle={toggleTema}
          allData={fd}
          countKey="temas"
        />
      </div>

      {/* Tipo de investigación */}
      <div>
        <div style={LST}>Tipo de investigación</div>
        <ChipGroup
          items={Object.keys(TIPO_COLORS)}
          active={fTipo}
          onToggle={t => setFTipo(fTipo===t?"":t)}
          allData={fd}
          countKey="tipo"
        />
      </div>

      {/* Metodología */}
      <div>
        <div style={LST}>Metodología</div>
        <ChipGroup
          items={Object.keys(METOD_COLORS)}
          active={fMetod}
          onToggle={m => setFMetod(fMetod===m?"":m)}
          allData={fd}
          countKey="metodologia"
        />
      </div>

      {/* Estado (compacto) */}
      <div>
        <div style={LST}>Estado</div>
        <div style={{ display:"flex", gap:5, marginTop:7, flexWrap:"wrap" }}>
          {["Finalizada","En curso","Planeada"].map(e => {
            const act = fEst===e, col=ECOLS[e];
            const n = fd.filter(d=>d.estado===e).length;
            return (
              <button key={e} onClick={()=>setFEst(act?"":e)}
                style={{ padding:"4px 9px", borderRadius:999, border:`1.5px solid ${act?col:BORDER}`, background:act?col:"transparent", color:act?"#FFF":col, fontSize:10, fontWeight:act?700:500, cursor:"pointer", fontFamily:"inherit", transition:"all .15s", display:"inline-flex", alignItems:"center", gap:4 }}>
                {e} <span style={{ fontSize:8, opacity:0.7 }}>{n}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Búsqueda */}
      <div>
        <div style={LST}>Búsqueda libre</div>
        <div style={{ marginTop:6 }}><SearchInput value={search} onChange={setSearch} /></div>
      </div>

      {hasFilters && <ClearBtn onClick={onClear} />}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════
// PANEL C — "Institucional"
// Navegación por quién produce y a quién: dependencia, alcance, comunidad
// ══════════════════════════════════════════════════════════════════
function FilterPanelC({ allData, años, fAño, setFAño, fDep, setFDep,
  fAlcance, setFAlcance, fComunidad, setFComunidad,
  fTemas, fTipo, fMetod, fDepts, setFTemas, setFTipo, setFMetod,
  search, setSearch, onClear, hasFilters }) {

  const byDep  = freq(allData, "dependencia");
  const depMax = byDep[0]?.count || 1;

  function toggleCom(c) { setFComunidad(prev => prev.includes(c) ? prev.filter(x=>x!==c) : [...prev, c]); }

  const otrosActivos = [
    fAño ? [{ label:`Año: ${fAño}`, clear: () => setFAño("") }] : [],
    ...fTemas.map(t => ({ label:`Tema: ${t}`, clear: () => setFTemas(p=>p.filter(x=>x!==t)) })),
    fTipo  ? [{ label:`Tipo: ${fTipo}`,   clear: () => setFTipo("") }] : [],
    fMetod ? [{ label:`Metod.: ${fMetod}`, clear: () => setFMetod("") }] : [],
    fDepts.length ? [{ label:`${fDepts.length} territorio(s)`, clear: () => {} }] : [],
  ].flat();

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
      <ActiveFiltersBadge filters={otrosActivos} />

      {/* Dependencia — primaria */}
      <div>
        <div style={LST}>Dependencia productora</div>
        <div style={{ display:"flex", flexDirection:"column", gap:4, marginTop:7 }}>
          {byDep.map(({label,count},i) => {
            const act = fDep===label;
            return (
              <div key={label} onClick={()=>setFDep(act?"":label)}
                style={{ cursor:"pointer", borderRadius:8, padding:"5px 8px", background:act?PS:"transparent", border:`1px solid ${act?P:"transparent"}`, transition:"all .15s" }}>
                <div style={{ display:"flex", justifyContent:"space-between", fontSize:11, color:act?PD:"#555", marginBottom:3, fontWeight:act?700:400 }}>
                  <span style={{ overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", maxWidth:"80%" }}>{label}</span>
                  <span style={{ fontWeight:700, color:act?P:PD, flexShrink:0 }}>{count}</span>
                </div>
                <div style={{ height:5, background:"#EDE7F8", borderRadius:3, overflow:"hidden" }}>
                  <div style={{ height:"100%", width:`${(count/depMax)*100}%`, background:act?ACC:(BAR_COLS[i]||BAR_COLS[6]), borderRadius:3, transition:"width .4s" }} />
                </div>
              </div>
            );
          })}
          {fDep && (
            <button onClick={()=>setFDep("")} style={{ marginTop:2, fontSize:10, color:"#B5305B", background:"#FCE6EC", border:"1px solid #D4366A", borderRadius:999, padding:"3px 10px", cursor:"pointer", fontFamily:"inherit", alignSelf:"flex-start" }}>
              ✕ Quitar filtro
            </button>
          )}
        </div>
      </div>

      {/* Alcance territorial */}
      <div>
        <div style={LST}>Alcance territorial</div>
        <ChipGroup
          items={Object.keys(ALCANCE_COLORS)}
          active={fAlcance}
          onToggle={a => setFAlcance(fAlcance===a?"":a)}
          colorMap={ALCANCE_COLORS}
          allData={allData}
          countKey="alcance"
        />
      </div>

      {/* Comunidad objetivo */}
      <div>
        <div style={LST}>Comunidad objetivo</div>
        <ChipGroup
          items={Object.keys(COMUNIDAD_COLORS)}
          active={fComunidad}
          onToggle={toggleCom}
          colorMap={COMUNIDAD_COLORS}
          allData={allData}
          countKey="comunidad"
        />
      </div>

      {/* Año (compacto) */}
      <div>
        <div style={LST}>Año de inicio</div>
        <div style={{ position:"relative", marginTop:18, marginBottom:2 }}>
          <div style={{ position:"absolute", top:5, left:9, right:9, height:1.5, background:BORDER, zIndex:0 }} />
          <div style={{ display:"flex", justifyContent:"space-between", position:"relative", zIndex:1 }}>
            {años.map(y => {
              const act = fAño===y;
              return (
                <div key={y} onClick={()=>setFAño(act?"":y)} title={y}
                  style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:4, cursor:"pointer" }}>
                  <div style={{ width:10, height:10, borderRadius:"50%", border:`2px solid ${act?P:BORDER}`, background:act?P:"#FFF", boxShadow:act?`0 0 0 3px ${PS}`:"none", flexShrink:0, transition:"all .18s" }} />
                  <span style={{ fontSize:8, color:act?P:"#AAA", fontWeight:act?700:400, lineHeight:1 }}>{y}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Búsqueda */}
      <div>
        <div style={LST}>Búsqueda libre</div>
        <div style={{ marginTop:6 }}><SearchInput value={search} onChange={setSearch} /></div>
      </div>

      {hasFilters && <ClearBtn onClick={onClear} />}
    </div>
  );
}

// ─── Panel institucional (columna derecha fija) ────────────────────────────
function InstitucionPanel({ allData, filteredData, fDep, setFDep, fAlcance, setFAlcance, fComunidad, setFComunidad }) {
  const fd = filteredData || allData;
  const byDep  = useMemo(() => freq(allData, "dependencia"), [allData]);
  const depMax = byDep[0]?.count || 1;
  function toggleCom(c) { setFComunidad(prev => prev.includes(c) ? prev.filter(x=>x!==c) : [...prev, c]); }

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:16 }}>

      <div>
        <div style={LST}>Dependencia productora</div>
        <div style={{ display:"flex", flexDirection:"column", gap:4, marginTop:7 }}>
          {byDep.map(({label,count},i) => {
            const act = fDep===label;
            return (
              <div key={label} onClick={()=>setFDep(act?"":label)}
                style={{ cursor:"pointer", borderRadius:8, padding:"5px 8px", background:act?PS:"transparent", border:`1px solid ${act?P:"transparent"}`, transition:"all .15s" }}>
                <div style={{ display:"flex", justifyContent:"space-between", fontSize:11, color:act?PD:"#555", marginBottom:3, fontWeight:act?700:400 }}>
                  <span style={{ overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", maxWidth:"80%" }}>{label}</span>
                  <span style={{ fontWeight:700, color:act?P:PD, flexShrink:0 }}>{count}</span>
                </div>
                <div style={{ height:5, background:"#EDE7F8", borderRadius:3, overflow:"hidden" }}>
                  <div style={{ height:"100%", width:`${(count/depMax)*100}%`, background:act?ACC:(BAR_COLS[i]||BAR_COLS[6]), borderRadius:3, transition:"width .4s" }} />
                </div>
              </div>
            );
          })}
          {fDep && (
            <button onClick={()=>setFDep("")} style={{ marginTop:2, fontSize:10, color:"#B5305B", background:"#FCE6EC", border:"1px solid #D4366A", borderRadius:999, padding:"3px 10px", cursor:"pointer", fontFamily:"inherit", alignSelf:"flex-start" }}>
              ✕ Quitar filtro
            </button>
          )}
        </div>
      </div>

      <div>
        <div style={LST}>Alcance territorial</div>
        <ChipGroup items={Object.keys(ALCANCE_COLORS)} active={fAlcance}
          onToggle={a => setFAlcance(fAlcance===a?"":a)}
          colorMap={ALCANCE_COLORS} allData={fd} countKey="alcance" />
      </div>

      <div>
        <div style={LST}>Actores territoriales</div>
        <ChipGroup items={Object.keys(COMUNIDAD_COLORS)} active={fComunidad}
          onToggle={toggleCom}
          allData={fd} countKey="comunidad" />
      </div>

    </div>
  );
}

// ─── Panel: Últimas investigaciones ───────────────────────────────────────
function PanelUltimas({ data }) {
  const sorted = useMemo(() =>
    [...data].sort((a, b) => b.año - a.año || a.titulo.localeCompare(b.titulo))
  , [data]);

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:0 }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:10 }}>
        <div style={LST}>Investigaciones registradas</div>
        <span style={{ fontSize:10, color:P, fontWeight:700 }}>{sorted.length} total</span>
      </div>

      {/* Encabezado de tabla */}
      <div style={{ display:"grid", gridTemplateColumns:"1fr 36px 70px", gap:"0 8px", padding:"5px 8px", background:"#F0EDF8", borderRadius:"8px 8px 0 0", borderBottom:`1px solid ${BORDER}` }}>
        <span style={{ fontSize:9, fontWeight:700, color:"#9080B8", textTransform:"uppercase", letterSpacing:"0.5px" }}>Título</span>
        <span style={{ fontSize:9, fontWeight:700, color:"#9080B8", textTransform:"uppercase", letterSpacing:"0.5px", textAlign:"center" }}>Año</span>
        <span style={{ fontSize:9, fontWeight:700, color:"#9080B8", textTransform:"uppercase", letterSpacing:"0.5px", textAlign:"center" }}>Estado</span>
      </div>

      {/* Filas scrollables */}
      <div style={{ overflowY:"auto", maxHeight:420, borderRadius:"0 0 8px 8px", border:`1px solid ${BORDER}`, borderTop:"none" }}>
        {sorted.map((inv, i) => (
          <div key={inv.id} style={{
            display:"grid", gridTemplateColumns:"1fr 36px 70px", gap:"0 8px",
            padding:"7px 8px", borderBottom: i < sorted.length-1 ? `1px solid #F0EDF8` : "none",
            background: i%2===0 ? "#FFF" : "#FAFAFA",
            alignItems:"center",
          }}>
            <div>
              <div style={{ fontSize:10, color:PD, fontWeight:500, lineHeight:1.3, overflow:"hidden", display:"-webkit-box", WebkitLineClamp:2, WebkitBoxOrient:"vertical" }}>
                {inv.titulo}
              </div>
              <div style={{ fontSize:9, color:"#AAA", marginTop:2, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                {inv.departamentos[0]}{inv.departamentos.length > 1 ? ` +${inv.departamentos.length-1}` : ""}
                {" · "}{inv.dependencia}
              </div>
            </div>
            <span style={{ fontSize:10, color:"#888", textAlign:"center", fontWeight:600 }}>{inv.año}</span>
            <span style={{
              fontSize:9, fontWeight:700, textAlign:"center", padding:"3px 6px", borderRadius:999,
              background: ECOLS[inv.estado]+"22", color: ECOLS[inv.estado],
              border:`1px solid ${ECOLS[inv.estado]}55`, whiteSpace:"nowrap",
            }}>{inv.estado}</span>
          </div>
        ))}
      </div>

      <div style={{ textAlign:"center", fontSize:9, color:"#CCC", marginTop:8 }}>
        Fuente: Sistema de Información de Investigaciones
      </div>
    </div>
  );
}

// ─── Selector de panel ─────────────────────────────────────────────────────
const MODES = [
  { id:"A", name:"Temporal",  desc:"Tiempo, estado y territorio" },
  { id:"B", name:"Temático",  desc:"Temas, tipo y metodología" },
  { id:"U", name:"Últimas",   desc:"Últimas investigaciones registradas" },
];
const RIGHT_MODES = [
  { id:"I", name:"Instituc.",  desc:"Dependencia, alcance y actores" },
  { id:"T", name:"Temas",      desc:"Temas principales de investigación" },
  { id:"E", name:"Evolución",  desc:"Investigaciones por año" },
];

function ModeTab({ modes, active, onChange }) {
  return (
    <div style={{ display:"flex", gap:3, background:"#EDE7F8", borderRadius:10, padding:3 }}>
      {modes.map(m => (
        <button key={m.id} onClick={()=>onChange(m.id)} title={m.desc} style={{ flex:1, padding:"5px 4px", borderRadius:7, border:"none", background:active===m.id?"#FFF":"transparent", color:active===m.id?PD:"#9080B8", fontSize:10, fontWeight:active===m.id?700:400, cursor:"pointer", fontFamily:"inherit", boxShadow:active===m.id?"0 1px 4px rgba(45,22,88,.15)":"none", transition:"all .15s", whiteSpace:"nowrap" }}>
          {m.name}
        </button>
      ))}
    </div>
  );
}

// ─── Dashboard principal ───────────────────────────────────────────────────
export default function DashboardInvestigaciones() {
  const [fAño,      setFAño]      = useState("");
  const [fDepts,    setFDepts]    = useState([]);
  const [fDep,      setFDep]      = useState("");
  const [fEst,      setFEst]      = useState("");
  const [fTemas,    setFTemas]    = useState([]);
  const [fTipo,     setFTipo]     = useState("");
  const [fMetod,    setFMetod]    = useState("");
  const [fAlcance,  setFAlcance]  = useState("");
  const [fComunidad,setFComunidad]= useState([]);
  const [search,    setSearch]    = useState("");
  const [fMode,     setFMode]     = useState("A");
  const [rMode,     setRMode]     = useState("I");

  const años       = useMemo(()=>[...new Set(INVESTIGATIONS.map(d=>String(d.año)))].sort(),[]);
  const depts      = useMemo(()=>[...new Set(INVESTIGATIONS.flatMap(d=>d.departamentos))].sort(),[]);
  const estadoOpts = ["Finalizada","En curso","Planeada"];

  // filteredNoTerr: all filters except territory — for territory section dept counts
  const filteredNoTerr = useMemo(()=>INVESTIGATIONS.filter(d=>
    (!fAño    || String(d.año)===fAño) &&
    (!fEst    || d.estado===fEst) &&
    (!fTemas.length  || d.temas.some(t => fTemas.includes(t))) &&
    (!fTipo   || d.tipo===fTipo) &&
    (!fMetod  || d.metodologia===fMetod) &&
    (!fAlcance|| d.alcance===fAlcance) &&
    (!fComunidad.length || d.comunidad.some(c => fComunidad.includes(c))) &&
    (!search  || d.titulo.toLowerCase().includes(search.toLowerCase()) || d.id.toLowerCase().includes(search.toLowerCase()))
  ),[fAño,fEst,fTemas,fTipo,fMetod,fAlcance,fComunidad,search]);

  // filteredBase: all filters except fDep — dep bars use this so they don't collapse on dep select
  const filteredBase = useMemo(()=>filteredNoTerr.filter(d=>
    !fDepts.length || d.departamentos.some(dep => fDepts.includes(dep))
  ),[filteredNoTerr,fDepts]);

  const filtered = useMemo(()=>filteredBase.filter(d=>!fDep||d.dependencia===fDep),[filteredBase,fDep]);

  const totalInv = filtered.length;
  const añoLabel = useMemo(()=>{
    if (fAño) return parseInt(fAño);
    const ys = INVESTIGATIONS.map(d=>d.año);
    return `${String(Math.min(...ys)).slice(2)}–${String(Math.max(...ys)).slice(2)}`;
  },[fAño]);
  const nDeps    = useMemo(()=>new Set(filtered.map(d=>d.dependencia)).size,[filtered]);
  const nDepts   = useMemo(()=>new Set(filtered.flatMap(d=>d.departamentos)).size,[filtered]);
  const enCurso    = filtered.filter(d=>d.estado==="En curso").length;
  const finalizadas= filtered.filter(d=>d.estado==="Finalizada").length;
  const nTemas     = useMemo(()=>new Set(filtered.flatMap(d=>d.temas)).size,[filtered]);

  const byEstado = useMemo(()=>estadoOpts.map(e=>({label:e,count:filtered.filter(d=>d.estado===e).length})),[filtered]);
  const byDep    = useMemo(()=>freq(filteredBase,"dependencia").slice(0,7),[filteredBase]);
  const byAño    = useMemo(()=>años.map(y=>({label:y,count:filtered.filter(d=>String(d.año)===y).length})),[filtered,años]);
  const allTemas = useMemo(()=>filtered.flatMap(d=>d.temas),[filtered]);

  const hasFilters = !!(fAño||fDepts.length||fDep||fEst||fTemas.length||fTipo||fMetod||fAlcance||fComunidad.length||search);
  function clearAll() {
    setFAño(""); setFDepts([]); setFDep(""); setFEst("");
    setFTemas([]); setFTipo(""); setFMetod(""); setFAlcance(""); setFComunidad([]);
    setSearch("");
  }

  const PANEL = { background:"#FFF", border:`1px solid ${BORDER}`, borderRadius:16, padding:"16px 18px" };

  const commonProps = {
    años, depts, allData:INVESTIGATIONS,
    filteredData: filtered, filteredNoTerr,
    fAño, setFAño, fDepts, setFDepts, fDep, setFDep, fEst, setFEst,
    fTemas, setFTemas, fTipo, setFTipo, fMetod, setFMetod,
    fAlcance, setFAlcance, fComunidad, setFComunidad,
    search, setSearch, onClear:clearAll, hasFilters,
  };

  return (
    <div style={{ fontFamily:"'Barlow','Segoe UI',system-ui,sans-serif", color:PD }}>

      {/* ── Header: título izquierda · KPIs derecha ── */}
      <div style={{ display:"flex", alignItems:"center", gap:0, marginBottom:12, paddingBottom:12, borderBottom:`1px solid ${BORDER}` }}>

        {/* Izquierda ~50%: título */}
        <div style={{ flex:"0 0 50%", paddingRight:28 }}>
          <div style={{
            fontFamily:"'Barlow Condensed',Impact,Arial Narrow,sans-serif",
            fontWeight:900, fontSize:30,
            letterSpacing:"-0.5px", textTransform:"uppercase", lineHeight:1.05,
            marginBottom:0, display:"flex", flexWrap:"nowrap", alignItems:"baseline", gap:"0 7px", whiteSpace:"nowrap",
          }}>
            <span style={{ color:P }}>Saberes que</span>
            <span style={{ color:ACC }}>iluminan</span>
            <span style={{ color:P }}>políticas culturales</span>
          </div>
        </div>

        {/* Derecha ~50%: 4 KPIs grandes */}
        <div style={{ flex:1, display:"flex", gap:0, borderLeft:`1.5px solid ${BORDER}`, paddingLeft:8 }}>
          <KPICard label="Total investigaciones" value={totalInv} strokeColor="#9880C8" />
          <KPICard label="Período"               value={añoLabel} strokeColor="#6B4BB0" />
          <KPICard label="Dependencias activas"  value={nDeps}    strokeColor="#7055AA" />
          <KPICard label="Departamentos"         value={nDepts}   strokeColor="#E8A020" />
        </div>
      </div>

      {/* ── 3 columnas: Filtros | Mapa | Institucional ── */}
      <div style={{ display:"grid", gridTemplateColumns:"4fr 5fr 4fr", gap:14, marginBottom:14, alignItems:"start" }}>

        {/* ── Filtros (Temporal + Temático) ── */}
        <div style={{ ...PANEL, display:"flex", flexDirection:"column", gap:12 }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
            <div style={{ fontSize:12, fontWeight:700, color:PD, textTransform:"uppercase", letterSpacing:"0.5px" }}>Filtros</div>
            {hasFilters && <span style={{ fontSize:10, color:P, fontWeight:700 }}>{totalInv} resultados</span>}
          </div>
          <ModeTab modes={MODES} active={fMode} onChange={setFMode} />
          {fMode==="A" && <FilterPanelA {...commonProps} />}
          {fMode==="B" && <FilterPanelB {...commonProps} />}
          {fMode==="U" && <PanelUltimas data={filtered} />}
        </div>

        {/* ── Mapa ── */}
        <div style={PANEL}>
          <PanelHeader title="Investigaciones por territorio" info="Clic en región para filtrar" />
          <MapaColombia
            data={filtered}
            fDepts={fDepts}
            onDeptClick={dept => setFDepts(prev => prev.includes(dept) ? prev.filter(x=>x!==dept) : [...prev, dept])}
          />
        </div>

        {/* ── Panel derecho con tabs ── */}
        <div style={{ ...PANEL, display:"flex", flexDirection:"column", gap:12 }}>

          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
            <div style={{ fontSize:12, fontWeight:700, color:PD, textTransform:"uppercase", letterSpacing:"0.5px" }}>Análisis</div>
          </div>

          <ModeTab modes={RIGHT_MODES} active={rMode} onChange={setRMode} />

          {rMode === "I" && (
            <InstitucionPanel
              allData={filteredBase}
              filteredData={filtered}
              fDep={fDep} setFDep={setFDep}
              fAlcance={fAlcance} setFAlcance={setFAlcance}
              fComunidad={fComunidad} setFComunidad={setFComunidad}
            />
          )}

          {rMode === "T" && (
            <div style={{ paddingTop:4 }}>
              {allTemas.length === 0
                ? <div style={{ textAlign:"center", color:"#BBB", fontSize:12, padding:"40px 0" }}>Sin datos</div>
                : <WordCloud
                    temas={allTemas}
                    fTemas={fTemas}
                    onToggle={t => setFTemas(prev => prev.includes(t) ? prev.filter(x=>x!==t) : [...prev, t])}
                  />
              }
            </div>
          )}

          {rMode === "E" && (
            <div style={{ paddingTop:4 }}>
              {byAño.every(d => d.count === 0)
                ? <div style={{ textAlign:"center", color:"#BBB", fontSize:12, padding:"40px 0" }}>Sin datos</div>
                : <LineChart data={byAño} />
              }
            </div>
          )}

        </div>

      </div>

    </div>
  );
}
