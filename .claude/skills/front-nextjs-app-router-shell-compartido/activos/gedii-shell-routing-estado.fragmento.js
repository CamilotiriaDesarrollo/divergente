// FRAGMENTO EXTRAÍDO de: Plataforma GEDII/app/page.js (líneas 38-70 y 170-242)
// El archivo original pesa ~130KB (contiene un logo base64 inline) y supera el
// límite de copia de activos; este fragmento contiene el patrón completo de
// "shell con routing interno por estado + sidebar flotante de límites dinámicos".
// Requiere: 'use client'; useState/useEffect/useRef de react; useRouter de next/navigation.

  const router = useRouter();
  const [activeNav,    setActiveNav]    = useState("Inicio");
  const [menuOpen,     setMenuOpen]     = useState(false);
  const [activeSidebar, setActiveSidebar] = useState("home");
  const [navCollapsed, setNavCollapsed] = useState(false);
  const [loaded,       setLoaded]       = useState(false);
  const [sbTop,        setSbTop]        = useState(0);
  const [sbBottom,     setSbBottom]     = useState(0);
  const headerRef = useRef(null);
  const footerRef = useRef(null);

  useEffect(() => { setTimeout(() => setLoaded(true), 60); }, []);

  useEffect(() => {
    function calcBounds() {
      const hdr = headerRef.current;
      const ftr = footerRef.current;
      if (!hdr || !ftr) return;
      const hdrBottom = Math.max(0, hdr.getBoundingClientRect().bottom);
      const ftrTop    = ftr.getBoundingClientRect().top;
      setSbTop(hdrBottom);
      setSbBottom(Math.max(0, window.innerHeight - ftrTop));
    }
    calcBounds();
    window.addEventListener('scroll', calcBounds, { passive: true });
    window.addEventListener('resize', calcBounds);
    return () => {
      window.removeEventListener('scroll', calcBounds);
      window.removeEventListener('resize', calcBounds);
    };
  }, []);

  const sidebarW = navCollapsed ? 62 : 252;

  // ... (GOV.CO bar, header con headerRef y hero omitidos) ...


      {/* ── Dashboard shell ──────────────────────────────────────────── */}
      <div style={{ display:"flex", position:"relative", background:"#F4F2FC" }}>

        {/* Sidebar — fixed, siempre visible en pantalla, flota sobre contenido */}
        <aside className="g-sidebar" style={{ width:sidebarW, background:"rgba(255,255,255,0.55)", backdropFilter:"blur(14px)", WebkitBackdropFilter:"blur(14px)", borderRight:"1px solid rgba(228,223,244,0.5)", display:"flex", flexDirection:"column", position:"fixed", top:sbTop, bottom:sbBottom, left:0, zIndex:20, transition:"width 0.25s ease, top 0.08s linear, bottom 0.08s linear", overflow:"hidden" }}>

          {/* Botón colapsar */}
          <div style={{ padding:"12px 14px 10px", borderBottom:"1px solid #F0ECF8", display:"flex", justifyContent: navCollapsed ? "center" : "flex-end" }}>
            <button onClick={()=>setNavCollapsed(c=>!c)} title={navCollapsed?"Expandir menú":"Colapsar menú"} style={{ background:"none", border:"none", cursor:"pointer", color:"#9080B8", display:"flex", alignItems:"center", gap:4, padding:"4px 6px", borderRadius:6 }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ transform:navCollapsed?"rotate(180deg)":"none", transition:"transform 0.25s" }}><polyline points="15 18 9 12 15 6"/></svg>
              {!navCollapsed && <span style={{ fontSize:10, color:"#9080B8" }}>colapsar</span>}
            </button>
          </div>

          {/* Nav items */}
          <nav style={{ padding:"10px 0", flex:1 }}>
            {SIDEBAR_ITEMS.map(item => {
              const on = activeSidebar === item.key;
              const iconColor = on ? "#1A0A3D" : "#7B68AE";
              const icons = {
                home:         <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={iconColor} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>,
                investigar:   <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={iconColor} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>,
                arquitectura: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={iconColor} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="5" r="2"/><circle cx="16" cy="19" r="2"/><circle cx="3" cy="19" r="2"/><path d="M9 7v8M9 15l-4-2M9 15l5-2"/></svg>,
                datos:        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={iconColor} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/></svg>,
                divulgacion:  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={iconColor} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.38 2 2 0 0 1 3.56 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>,
                herramientas: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={iconColor} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>,
                etica:        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={iconColor} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>,
                actores:      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={iconColor} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
              };
              return (
                <button
                  key={item.key}
                  className={`g-sidebar-btn${on?" on":""}`}
                  onClick={()=>{ setActiveSidebar(item.key); if (item.route) router.push(item.route); }}
                >
                  <span style={{ flexShrink:0 }}>{icons[item.key]}</span>
                  <span className="g-sb-label" style={{ display:sidebarW===62?"none":"inline", whiteSpace:"nowrap", overflow:"hidden" }}>{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* User */}
          <div style={{ padding:"16px 18px", borderTop:"1px solid #F0ECF8" }}>
            <div style={{ display:"flex", alignItems:"center", gap:10 }}>
              <div style={{ width:34, height:34, borderRadius:"50%", background:"#2D1658", color:"#FFF", display:"flex", alignItems:"center", justifyContent:"center", fontWeight:700, fontSize:12, flexShrink:0 }}>NU</div>
              <div className="g-sb-label" style={{ lineHeight:1.25, display:sidebarW===62?"none":"block" }}>
                <div style={{ fontWeight:700, fontSize:13, color:"#1A0A3D" }}>Nombre Usuario</div>
                <div style={{ fontSize:11, color:"rgba(45,22,88,.6)" }}>Área / dependencia</div>
              </div>
            </div>
          </div>
        </aside>

        {/* Main content */}
        <div style={{ flex:1, minWidth:0, overflowX:"hidden", marginLeft: navCollapsed ? sidebarW : 0, transition:"margin-left 0.25s ease" }}>

      {activeSidebar === "arquitectura" ? (
        <ArquitecturaMetodologica />
      ) : (
        <>
          {/* Dashboard investigaciones */}
          <div style={{ background:"transparent", padding:"32px 36px 28px" }}>
            <DashboardInvestigaciones />
          </div>
          {/* Principios */}
          <PrincipiosInvestigacion />
        </>
      )}

        </div>{/* end main content */}
      </div>{/* end dashboard shell */}

// ... (tira-footer y <footer ref={footerRef}> van FUERA del flex del shell) ...
