'use client';
import { useState } from "react";
import Link from "next/link";

const SUB_NAV = ["Inicio", "Mis investigaciones", "Catálogo", "Ayuda"];

const STEPS = [
  { label: "Identificación", done: true },
  { label: "Necesidades" },
  { label: "Horizonte PNC" },
  { label: "Formulación" },
  { label: "Posicionamiento" },
  { label: "Campo" },
  { label: "Metodología" },
  { label: "Planeación" },
  { label: "Producto" },
  { label: "Cronograma" },
  { label: "Presupuesto" },
  { label: "Validación" },
];

const URGENCIES = [
  { key: "baja",  label: "Baja",  sub: "Puede esperar al próximo plan anual" },
  { key: "media", label: "Media", sub: "Requiere atención este semestre" },
  { key: "alta",  label: "Alta",  sub: "Alerta o decisión institucional activa" },
];

const SOURCES = [
  { key: "inv",   label: "Investigaciones pasadas",            sub: "Un estudio anterior dejó preguntas abiertas." },
  { key: "terr",  label: "Información territorial / participativa", sub: "Diagnósticos, mesas de trabajo o consultas." },
  { key: "norm",  label: "Alerta institucional · PNC · normativa",  sub: "Lineamiento del PNC o norma vigente." },
  { key: "tend",  label: "Tendencia mundial",                  sub: "Debate académico o marco internacional." },
];

const SECTIONS = [
  { num:"01", title:"LA NECESIDAD",          required:true,  hint:"¿Qué vacío de información o tensión institucional motiva este proceso?" },
  { num:"02", title:"FUENTE DE LA NECESIDAD", required:true,  hint:"Puede seleccionar más de una fuente." },
  { num:"03", title:"EVIDENCIA Y ANTECEDENTES", required:false, hint:"Contexto de lo que ya existe sobre este tema." },
];

const PURPLE      = "#2D1658";
const PURPLE_DEEP = "#1A0A3D";
const PURPLE_SOFT = "#F5F2FF";
const ACCENT      = "#E8A020";
const BORDER      = "#E4DFF4";

export default function InvestigarPage() {
  const [activeNav,  setActiveNav]  = useState("Mis investigaciones");
  const [menuOpen,   setMenuOpen]   = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeStep, setActiveStep] = useState(1);
  const [openSecs,   setOpenSecs]   = useState({ "01":true, "02":true, "03":false });
  const [desc,       setDesc]       = useState("");
  const [urgency,    setUrgency]    = useState("");
  const [sources,    setSources]    = useState({});

  const toggleSec  = (n) => setOpenSecs(s => ({ ...s, [n]: !s[n] }));
  const toggleSrc  = (k) => setSources(s => ({ ...s, [k]: !s[k] }));
  const progress   = ((activeStep + 1) / STEPS.length) * 100;

  return (
    <div style={{ fontFamily:"'Barlow','Segoe UI',system-ui,sans-serif", background:"#FAF8F4", minHeight:"100vh", color:PURPLE }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@800;900&family=Barlow:wght@400;500;600;700&display=swap');
        @keyframes fadeIn { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:translateY(0)} }
        .iv-link    { transition:color .15s; cursor:pointer; text-decoration:none; }
        .iv-link:hover { color:${ACCENT} !important; }
        .iv-card    { background:#FFF; border:1px solid ${BORDER}; border-radius:18px; transition:border-color .15s, box-shadow .15s; }
        .iv-card.open { border-color:${PURPLE}; box-shadow:0 1px 3px rgba(45,22,88,0.05); }
        .iv-acc-head{ display:flex; align-items:flex-start; gap:18px; padding:22px 26px; cursor:pointer; background:${PURPLE_SOFT}; border-radius:18px 18px 0 0; }
        .iv-card:not(.open) .iv-acc-head{ border-radius:18px; background:#FFF; }
        .iv-pill    { display:inline-block; background:#FCE6EC; color:#B5305B; font-size:11px; font-weight:700; padding:3px 10px; border-radius:999px; letter-spacing:.4px; margin-left:10px; vertical-align:middle; }
        .iv-num     { width:38px; height:38px; border-radius:50%; background:${PURPLE_DEEP}; color:#FFF; font-weight:800; font-size:13px; display:flex; align-items:center; justify-content:center; flex-shrink:0; font-family:'Barlow',system-ui,sans-serif; }
        .iv-card:not(.open) .iv-num{ background:#E9E2F5; color:${PURPLE}; }
        .iv-input   { width:100%; padding:14px 16px; border:1px solid ${BORDER}; border-radius:12px; font-family:inherit; font-size:14px; color:${PURPLE}; resize:vertical; min-height:130px; transition:border-color .15s, box-shadow .15s; outline:none; box-sizing:border-box; }
        .iv-input:focus { border-color:${PURPLE}; box-shadow:0 0 0 3px rgba(45,22,88,0.08); }
        .iv-opt     { display:flex; align-items:flex-start; gap:14px; padding:18px 18px; border:1px solid ${BORDER}; border-radius:14px; cursor:pointer; transition:border-color .15s, background .15s; background:#FFF; }
        .iv-opt:hover { border-color:#C9BCEC; }
        .iv-opt.sel { border-color:${PURPLE}; background:${PURPLE_SOFT}; }
        .iv-radio   { width:20px; height:20px; border-radius:50%; border:1.8px solid #C7BEE0; flex-shrink:0; margin-top:2px; display:flex; align-items:center; justify-content:center; transition:border-color .15s; }
        .iv-opt.sel .iv-radio{ border-color:${PURPLE}; }
        .iv-opt.sel .iv-radio::after{ content:""; width:10px; height:10px; border-radius:50%; background:${PURPLE}; }
        .iv-check   { width:20px; height:20px; border-radius:5px; border:1.8px solid #C7BEE0; flex-shrink:0; margin-top:2px; display:flex; align-items:center; justify-content:center; transition:all .15s; }
        .iv-opt.sel .iv-check{ border-color:${PURPLE}; background:${PURPLE}; }
        .iv-step    { display:flex; align-items:center; gap:14px; padding:12px 16px; border-radius:12px; cursor:pointer; transition:background .15s; font-family:'Barlow',system-ui,sans-serif; font-size:14px; color:${PURPLE}; }
        .iv-step:hover { background:#F1ECFA; }
        .iv-step.active { background:#EDE6FA; font-weight:700; }
        .iv-step .iv-step-num { width:28px; height:28px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:11px; font-weight:700; flex-shrink:0; background:#E9E2F5; color:${PURPLE}; }
        .iv-step.active .iv-step-num { background:${PURPLE}; color:#FFF; }
        .iv-step.done   .iv-step-num { background:${PURPLE}; color:#FFF; }
        .iv-step.pending { color:#9C92B3; }
        .iv-btn-prim { background:${PURPLE_DEEP}; color:#FFF; border:none; border-radius:999px; padding:13px 28px; font-weight:600; font-size:14px; cursor:pointer; font-family:inherit; display:inline-flex; align-items:center; gap:8px; transition:opacity .15s; }
        .iv-btn-prim:hover { opacity:.9; }
        .iv-btn-prim:disabled { opacity:.4; cursor:not-allowed; }
        .iv-btn-ghost { background:transparent; border:1px solid ${BORDER}; color:${PURPLE}; border-radius:999px; padding:12px 24px; font-weight:600; font-size:14px; cursor:pointer; font-family:inherit; display:inline-flex; align-items:center; gap:8px; }
        .iv-btn-ghost:hover { background:#FFF; }

        /* ── Responsive ───────────────────────────── */
        .iv-shell { display:grid; grid-template-columns:280px 1fr; gap:32px; max-width:1280px; margin:0 auto; padding:24px 40px 60px; }
        .iv-side  { position:sticky; top:20px; align-self:start; background:#FFF; border:1px solid ${BORDER}; border-radius:18px; padding:20px; }
        .iv-side-mobile-toggle { display:none; }
        .iv-nav-toggle { display:none; }

        @media (max-width: 1024px) {
          .iv-shell { grid-template-columns:1fr; padding:16px 22px 40px; gap:18px; }
          .iv-side  { position:static; }
          .iv-side-mobile-toggle { display:flex !important; }
          .iv-side-content { display:none; }
          .iv-side.open .iv-side-content { display:block; margin-top:14px; }
          .iv-hero-title { font-size:54px !important; }
          .iv-nav        { flex-direction:column !important; padding:0 !important; align-items:stretch !important; }
          .iv-nav-toggle { display:flex !important; }
          .iv-nav-items  { display:none !important; flex-direction:column; width:100%; border-top:1px solid #EDE7F8; }
          .iv-nav-items.open { display:flex !important; }
          .iv-nav-items button { width:100% !important; text-align:left !important; padding:14px 22px !important; border-bottom:1px solid #F2EEF9 !important; border-left:3px solid transparent !important; }
          .iv-nav-items button.on { border-left-color:${ACCENT} !important; background:${PURPLE_SOFT} !important; }
          .iv-hdr        { flex-wrap:wrap !important; gap:12px !important; }
          .iv-hdr-user   { margin-left:auto; }
          .iv-bar-actions{ flex-wrap:wrap; gap:8px !important; }
          .iv-2col       { grid-template-columns:1fr !important; }
          .iv-actbar > div { flex-wrap:wrap; gap:12px; }
        }
        @media (max-width: 700px) {
          .iv-gov        { padding:7px 14px !important; }
          .iv-gov-text   { display:none !important; }
          .iv-hdr        { padding:12px 16px !important; }
          .iv-hdr-title  { font-size:18px !important; }
          .iv-hdr-sub    { display:none !important; }
          .iv-bread      { padding:12px 22px !important; flex-wrap:wrap; gap:6px 10px; font-size:12px !important; }
          .iv-hero-title { font-size:42px !important; letter-spacing:-1px !important; }
          .iv-hero       { padding:32px 22px !important; }
          .iv-acc-head   { padding:18px 18px !important; gap:12px !important; }
          .iv-acc-body   { padding:20px 18px !important; }
          .iv-actbar     { padding:14px 22px !important; }
          .iv-actbar .iv-dots { display:none; }
          .iv-actbar > div { justify-content:space-between !important; }
          .iv-side-foot  { display:none !important; }
        }
      `}</style>

      {/* GOV.CO */}
      <div className="iv-gov" style={{ background:"#000", padding:"7px 32px", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
        <div style={{ display:"flex", alignItems:"center", gap:"10px" }}>
          <span style={{ color:"#FFF", fontWeight:700, fontSize:11 }}>GOV.CO</span>
          <span className="iv-gov-text" style={{ color:"rgba(255,255,255,.3)", fontSize:13 }}>|</span>
          <span className="iv-gov-text" style={{ color:"rgba(255,255,255,.55)", fontSize:11 }}>El portal único del Estado colombiano</span>
        </div>
        <div style={{ display:"flex", gap:20 }}>
          {["Accesibilidad","Ayuda","ES · EN"].map(t=>(
            <span key={t} style={{ color:"rgba(255,255,255,.55)", fontSize:11, cursor:"pointer" }}>{t}</span>
          ))}
        </div>
      </div>

      {/* Header */}
      <header className="iv-hdr" style={{ background:"#FFF", padding:"14px 40px", display:"flex", alignItems:"center", gap:24, borderBottom:`1px solid ${BORDER}` }}>
        <Link href="/" style={{ display:"flex", alignItems:"center", gap:14, textDecoration:"none", color:"inherit" }}>
          <div style={{ width:46, height:46, borderRadius:8, background:`linear-gradient(135deg, ${PURPLE} 0%, #4A2E8A 100%)`, display:"flex", alignItems:"center", justifyContent:"center", color:"#FFF", fontSize:10, fontWeight:700, letterSpacing:.5 }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2 L4 6 v6 c0 5 3.5 8.5 8 10 c4.5-1.5 8-5 8-10 V6 z"/>
            </svg>
          </div>
          <div>
            <div className="iv-hdr-title" style={{ fontFamily:"'Barlow Condensed',Impact,sans-serif", fontWeight:900, fontSize:26, color:PURPLE_DEEP, lineHeight:1, letterSpacing:.5 }}>GEDII</div>
            <div className="iv-hdr-sub" style={{ fontSize:11, color:"rgba(45,22,88,.65)", marginTop:2 }}>Gestión Estratégica de Datos, Información e Investigaciones</div>
          </div>
        </Link>

        <div style={{ flex:1 }}/>

        <div className="iv-hdr-user" style={{ display:"flex", alignItems:"center", gap:12 }}>
          <div style={{ width:42, height:42, borderRadius:"50%", background:PURPLE_DEEP, color:"#FFF", display:"flex", alignItems:"center", justifyContent:"center", fontWeight:700, fontSize:13 }}>LP</div>
          <div style={{ display:"flex", flexDirection:"column", lineHeight:1.2 }}>
            <span style={{ fontWeight:700, fontSize:14 }}>Liliana Pérez</span>
            <span style={{ fontSize:12, color:"rgba(45,22,88,.65)" }}>Dirección de Artes</span>
          </div>
        </div>
      </header>

      {/* Sub-nav */}
      <nav className="iv-nav" style={{ background:"#FFF", display:"flex", justifyContent:"center", padding:"0 40px", borderBottom:`1px solid ${BORDER}` }}>
        <button className="iv-nav-toggle" data-open={menuOpen} onClick={()=>setMenuOpen(o=>!o)} aria-expanded={menuOpen} style={{ display:"none", alignItems:"center", justifyContent:"space-between", width:"100%", padding:"14px 22px", background:"none", border:"none", color:PURPLE, cursor:"pointer", fontFamily:"inherit", fontSize:14, fontWeight:600 }}>
          <span>{activeNav}</span>
          <svg style={{ transform:menuOpen?"rotate(180deg)":"none", transition:"transform .2s" }} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
        </button>
        <div className={`iv-nav-items${menuOpen?" open":""}`} style={{ display:"flex" }}>
          {SUB_NAV.map(item => {
            const on = item === activeNav;
            return (
              <button key={item} onClick={()=>{ setActiveNav(item); setMenuOpen(false); }} className={`iv-link${on?" on":""}`}
                style={{ background:"none", border:"none", borderBottom:on?`2.5px solid ${ACCENT}`:"2.5px solid transparent", color:on?PURPLE_DEEP:"rgba(45,22,88,.7)", padding:"15px 22px", fontSize:14, fontWeight:on?700:500, cursor:"pointer", fontFamily:"inherit", whiteSpace:"nowrap" }}>
                {item}
              </button>
            );
          })}
        </div>
      </nav>

      {/* Breadcrumb + status */}
      <div className="iv-bread" style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"14px 40px", background:"#FFF", borderBottom:`1px solid ${BORDER}`, fontSize:13 }}>
        <div style={{ display:"flex", alignItems:"center", gap:8, color:"rgba(45,22,88,.65)" }}>
          <Link href="/investigar" className="iv-link" style={{ color:"rgba(45,22,88,.65)" }}>Mis investigaciones</Link>
          <span>›</span>
          <span>DA-INV-001-26 · Memorias del Pacífico</span>
          <span>›</span>
          <span style={{ color:PURPLE_DEEP, fontWeight:700 }}>Paso 0{activeStep} · {STEPS[activeStep].label}</span>
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:14, color:"rgba(45,22,88,.7)" }}>
          <span style={{ display:"inline-flex", alignItems:"center", gap:6 }}>
            <span style={{ width:8, height:8, borderRadius:"50%", background:"#3DB066" }}/>
            Guardado · 14:26
          </span>
          <span style={{ width:1, height:14, background:BORDER }}/>
          <span>Borrador v3</span>
        </div>
      </div>

      {/* Shell: sidebar + main */}
      <div className="iv-shell">

        {/* Sidebar */}
        <aside className={`iv-side${sidebarOpen?" open":""}`}>
          <div style={{ fontSize:11, fontWeight:700, color:"rgba(45,22,88,.55)", letterSpacing:.6 }}>FORMULARIO GEDII-002</div>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"baseline", marginTop:6 }}>
            <span style={{ fontWeight:700, fontSize:18, color:PURPLE_DEEP }}>Avance</span>
            <span style={{ fontSize:13 }}><b>{activeStep + 1}</b><span style={{ color:"rgba(45,22,88,.55)" }}>/{STEPS.length}</span></span>
          </div>
          <div style={{ height:6, background:"#EDE7F8", borderRadius:4, marginTop:10, overflow:"hidden" }}>
            <div style={{ height:"100%", width:`${progress}%`, background:`linear-gradient(90deg, ${PURPLE} 0%, ${ACCENT} 100%)`, borderRadius:4, transition:"width .3s" }}/>
          </div>

          <button
            className="iv-side-mobile-toggle"
            onClick={()=>setSidebarOpen(o=>!o)}
            style={{ display:"none", alignItems:"center", justifyContent:"space-between", width:"100%", marginTop:14, padding:"10px 0", background:"none", border:"none", borderTop:`1px solid ${BORDER}`, color:PURPLE, fontWeight:600, fontSize:13, cursor:"pointer", fontFamily:"inherit" }}
          >
            <span>{sidebarOpen ? "Ocultar pasos" : "Ver todos los pasos"}</span>
            <svg style={{ transform:sidebarOpen?"rotate(180deg)":"none", transition:"transform .2s" }} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"><polyline points="6 9 12 15 18 9"/></svg>
          </button>

          <div className="iv-side-content" style={{ marginTop:18, display:"flex", flexDirection:"column", gap:4 }}>
            {STEPS.map((s, i) => {
              const active = i === activeStep;
              const done   = s.done;
              const pending = i > activeStep && !done;
              return (
                <div key={i} onClick={()=>{ setActiveStep(i); setSidebarOpen(false); }} className={`iv-step${active?" active":""}${done?" done":""}${pending?" pending":""}`}>
                  <span className="iv-step-num">
                    {done ? "✓" : String(i + 1).padStart(2, "0")}
                  </span>
                  <span style={{ flex:1 }}>{s.label}</span>
                  {active && <span style={{ color:PURPLE }}>›</span>}
                </div>
              );
            })}
          </div>

          <div className="iv-side-foot" style={{ marginTop:22, paddingTop:16, borderTop:`1px solid ${BORDER}`, fontSize:12, color:"rgba(45,22,88,.6)", lineHeight:1.5 }}>
            Los borradores se guardan automáticamente cada 30s.
          </div>
        </aside>

        {/* Main */}
        <main style={{ animation:"fadeIn .35s ease both" }}>

          {/* Hero */}
          <div className="iv-hero" style={{ background:`linear-gradient(135deg, #EDE7F8 0%, #F5F2FF 60%, #FAF8F4 100%)`, borderRadius:20, padding:"40px 40px 36px", marginBottom:28, position:"relative", overflow:"hidden", border:`1px solid ${BORDER}` }}>
            <div style={{ display:"inline-flex", alignItems:"center", gap:8, background:ACCENT, color:"#FFF", padding:"6px 14px", borderRadius:999, fontSize:11, fontWeight:700, letterSpacing:.6 }}>
              PASO 0{activeStep} · PUNTO DE PARTIDA
            </div>
            <h1 className="iv-hero-title" style={{ fontFamily:"'Barlow Condensed',Impact,sans-serif", fontWeight:900, fontSize:78, letterSpacing:-2, lineHeight:.95, margin:"18px 0 12px", color:PURPLE_DEEP, textTransform:"uppercase" }}>
              {STEPS[activeStep].label}
            </h1>
            <p style={{ margin:0, color:"rgba(45,22,88,.75)", fontSize:15, maxWidth:620, lineHeight:1.55 }}>
              Identifique la tensión o vacío que motiva esta investigación y documente su origen.
            </p>
            <div style={{ marginTop:18, display:"flex", gap:6, color:"#C9BCEC", fontSize:11, letterSpacing:4 }}>
              · · · · · · · · · · · · · · ·
            </div>
          </div>

          {/* Sección 01 — La necesidad */}
          <Section
            cfg={SECTIONS[0]}
            open={openSecs["01"]}
            onToggle={()=>toggleSec("01")}
          >
            <div style={{ display:"flex", justifyContent:"flex-end", marginBottom:14 }}>
              <button className="iv-btn-ghost" type="button" style={{ fontSize:13, padding:"10px 16px" }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                Guía para identificar la necesidad
                <span>→</span>
              </button>
            </div>

            <label style={{ display:"block", fontWeight:700, fontSize:14, color:PURPLE_DEEP, marginBottom:6 }}>
              Descripción <span style={{ color:"#D4366A" }}>*</span>
            </label>
            <div style={{ fontSize:12, color:"rgba(45,22,88,.6)", marginBottom:10 }}>
              Mínimo 40 caracteres. Sea específico y evite tecnicismos.
            </div>
            <textarea
              className="iv-input"
              value={desc}
              onChange={e=>setDesc(e.target.value.slice(0, 500))}
              placeholder="Describa el vacío de información, la tensión social o la pregunta institucional que motiva esta investigación…"
            />
            <div style={{ marginTop:8, fontSize:12, color:"rgba(45,22,88,.6)" }}>
              {desc.length} / 500{desc.length < 40 && desc.length > 0 ? " · faltan caracteres" : ""}
            </div>

            <div style={{ marginTop:24 }}>
              <div style={{ fontWeight:700, fontSize:14, color:PURPLE_DEEP, marginBottom:14 }}>Nivel de urgencia</div>
              <div className="iv-2col" style={{ display:"grid", gridTemplateColumns:"repeat(3, 1fr)", gap:14 }}>
                {URGENCIES.map(u => (
                  <div
                    key={u.key}
                    className={`iv-opt${urgency===u.key?" sel":""}`}
                    onClick={()=>setUrgency(u.key)}
                    role="radio"
                    aria-checked={urgency===u.key}
                    tabIndex={0}
                  >
                    <span className="iv-radio"/>
                    <span>
                      <div style={{ fontWeight:700, color:PURPLE_DEEP, fontSize:14 }}>{u.label}</div>
                      <div style={{ fontSize:12, color:"rgba(45,22,88,.65)", marginTop:2 }}>{u.sub}</div>
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </Section>

          <Dots/>

          {/* Sección 02 — Fuente */}
          <Section
            cfg={SECTIONS[1]}
            open={openSecs["02"]}
            onToggle={()=>toggleSec("02")}
          >
            <div style={{ display:"flex", justifyContent:"flex-end", marginBottom:14 }}>
              <button className="iv-btn-ghost" type="button" style={{ fontSize:13, padding:"10px 16px" }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                Tipos de fuente reconocidos
                <span>→</span>
              </button>
            </div>
            <div className="iv-2col" style={{ display:"grid", gridTemplateColumns:"repeat(2,1fr)", gap:14 }}>
              {SOURCES.map(s => (
                <div
                  key={s.key}
                  className={`iv-opt${sources[s.key]?" sel":""}`}
                  onClick={()=>toggleSrc(s.key)}
                  role="checkbox"
                  aria-checked={!!sources[s.key]}
                  tabIndex={0}
                >
                  <span className="iv-check">
                    {sources[s.key] && (
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#FFF" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                    )}
                  </span>
                  <span>
                    <div style={{ fontWeight:700, color:PURPLE_DEEP, fontSize:14 }}>{s.label}</div>
                    <div style={{ fontSize:12, color:"rgba(45,22,88,.65)", marginTop:2 }}>{s.sub}</div>
                  </span>
                </div>
              ))}
            </div>
          </Section>

          <Dots/>

          {/* Sección 03 — Evidencia */}
          <Section
            cfg={SECTIONS[2]}
            open={openSecs["03"]}
            onToggle={()=>toggleSec("03")}
          >
            <div style={{ color:"rgba(45,22,88,.7)", fontSize:14, lineHeight:1.6 }}>
              Adjunte estudios previos, documentos institucionales o referencias que ya existan sobre este tema. Esta sección es opcional pero ayuda a contextualizar la propuesta.
            </div>
            <button className="iv-btn-ghost" style={{ marginTop:18, fontSize:13 }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              Añadir referencia
            </button>
          </Section>
        </main>
      </div>

      {/* Action bar */}
      <div className="iv-actbar" style={{ background:"#FFF", borderTop:`1px solid ${BORDER}`, padding:"16px 40px", position:"sticky", bottom:0 }}>
        <div style={{ maxWidth:1280, margin:"0 auto", display:"flex", alignItems:"center", justifyContent:"space-between", gap:14 }}>
          <button
            className="iv-btn-ghost"
            disabled={activeStep===0}
            onClick={()=>setActiveStep(s=>Math.max(0,s-1))}
            style={{ opacity: activeStep===0 ? .4 : 1, cursor: activeStep===0 ? "not-allowed" : "pointer" }}
          >
            <span>‹</span> Anterior
          </button>

          <div className="iv-dots" style={{ display:"flex", gap:6 }}>
            {STEPS.map((_, i)=>(
              <span key={i} onClick={()=>setActiveStep(i)} style={{ width:i===activeStep?22:8, height:8, borderRadius:8, background:i===activeStep?ACCENT:i<activeStep?PURPLE:"#D7CDF0", cursor:"pointer", transition:"width .2s, background .2s" }}/>
            ))}
          </div>

          <div style={{ display:"flex", gap:10 }}>
            <button className="iv-btn-ghost">Guardar borrador</button>
            <button
              className="iv-btn-prim"
              disabled={!desc || desc.length < 40 || !urgency}
              onClick={()=>setActiveStep(s=>Math.min(STEPS.length-1, s+1))}
            >
              Continuar al siguiente paso <span>›</span>
            </button>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer style={{ background:"#4D3398", color:"#FFF", padding:"32px 40px 18px", marginTop:0 }}>
        <div style={{ maxWidth:1280, margin:"0 auto", display:"flex", flexWrap:"wrap", justifyContent:"space-between", gap:20, fontSize:13 }}>
          <span>Sistema GEDII · Versión 1.0 · 2025–2026</span>
          <span style={{ opacity:.78 }}>Copyright © 2026 · Ministerio de las Culturas, las Artes y los Saberes</span>
        </div>
      </footer>
    </div>
  );
}

function Section({ cfg, open, onToggle, children }) {
  return (
    <div className={`iv-card${open?" open":""}`} style={{ marginBottom:18 }}>
      <div className="iv-acc-head" onClick={onToggle} role="button" aria-expanded={open}>
        <span className="iv-num">{cfg.num}</span>
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ display:"flex", alignItems:"center", flexWrap:"wrap" }}>
            <span style={{ fontFamily:"'Barlow Condensed',Impact,sans-serif", fontWeight:900, fontSize:22, letterSpacing:.5, color:PURPLE_DEEP, textTransform:"uppercase" }}>{cfg.title}</span>
            {cfg.required && <span className="iv-pill">REQUERIDO</span>}
          </div>
          <div style={{ marginTop:4, fontSize:13, color:"rgba(45,22,88,.7)" }}>{cfg.hint}</div>
        </div>
        <span style={{ width:34, height:34, borderRadius:"50%", background:"#FFF", border:`1px solid ${BORDER}`, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, transition:"transform .2s", transform:open?"rotate(180deg)":"none" }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={PURPLE} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
        </span>
      </div>
      {open && (
        <div className="iv-acc-body" style={{ padding:"28px 32px 32px" }}>
          {children}
        </div>
      )}
    </div>
  );
}

function Dots() {
  return (
    <div style={{ textAlign:"center", padding:"6px 0 14px", color:"#C9BCEC", fontSize:13, letterSpacing:4 }}>
      · · · · · · · · · · · · · · · · · · · ·
    </div>
  );
}
