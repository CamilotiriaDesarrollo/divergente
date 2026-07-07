// EXTRACTO VERBATIM — origen: Plataforma GEDII, app/components/dashboard.js (líneas 986-1057)
// Núcleo de la skill front-dashboard-filtros-multinivel: cadena de 3 niveles memoizados.
// Regla: cada sección de UI consume el nivel que EXCLUYE su propia dimensión,
// para que sus conteos no colapsen a 0 al seleccionar un valor de esa dimensión.

// ─── Dashboard principal ───────────────────────────────────────────────────
export default function DashboardInvestigaciones() {
  const [fAño,      setFAño]      = useState("");
  const [fDepts,    setFDepts]    = useState([]);   // multi-select (array)
  const [fDep,      setFDep]      = useState("");   // single-select (string)
  const [fEst,      setFEst]      = useState("");
  const [fTemas,    setFTemas]    = useState([]);
  const [fTipo,     setFTipo]     = useState("");
  const [fMetod,    setFMetod]    = useState("");
  const [fAlcance,  setFAlcance]  = useState("");
  const [fComunidad,setFComunidad]= useState([]);
  const [search,    setSearch]    = useState("");
  const [fMode,     setFMode]     = useState("A");  // tab activa del panel de filtros
  const [rMode,     setRMode]     = useState("I");  // tab activa del panel de análisis

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
  const byDep    = useMemo(()=>freq(filteredBase,"dependencia").slice(0,7),[filteredBase]);   // <- nivel 2, NO filtered
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
  // ... render: <TerritorySection allData={filteredNoTerr}/> (nivel 1),
  //             <InstitucionPanel allData={filteredBase}/>   (nivel 2),
  //             <MapaColombia data={filtered}/> y KPIs        (nivel 3)
}
