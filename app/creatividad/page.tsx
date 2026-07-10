"use client";

import { useEffect, useRef, useState } from "react";

const clamp = (value: number) => Math.max(0, Math.min(1, value));

function smoothstep(start: number, end: number, value: number) {
  const progress = clamp((value - start) / (end - start));
  return progress * progress * (3 - 2 * progress);
}

export default function Creatividad() {
  const heroRef = useRef<HTMLElement>(null);
  const firstLineRef = useRef<HTMLSpanElement>(null);
  const secondLineRef = useRef<HTMLSpanElement>(null);
  const thirdLineRef = useRef<HTMLSpanElement>(null);

  // ── El Giro (momento signature, portado de /metodologias) ──
  const giroSectionRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const giroProgressRef = useRef(0);

  // Inicializa en false (layout desktop) para que el HTML del servidor y el
  // primer render del cliente coincidan y no haya hydration mismatch; el
  // valor real (móvil/desktop) se fija en el useEffect de abajo tras montar.
  const [isMobile, setIsMobile] = useState(false);
  const isMobileRef = useRef(false);
  const reduceMotionRef = useRef(false);
  // Espejo en state de reduceMotionRef: el canvas de El Giro solo lee la ref
  // (dentro de un rAF), pero el fallback apilado de "Los 4 pilares" decide
  // qué JSX renderizar y sí necesita disparar un re-render al cambiar.
  const [reduced, setReduced] = useState(false);

  // ── Secuencia anclada "Los 4 pilares" (portada de /metodologias ·
  //    Herramientas) ──
  const toolsWrapRef = useRef<HTMLElement>(null);
  const toolsNodeRef = useRef<HTMLSpanElement>(null);
  const toolsTrailRef = useRef<HTMLSpanElement>(null);
  const toolsStationRefs = useRef<(HTMLDivElement | null)[]>([]);

  // Guard de accesibilidad de movimiento + breakpoint móvil (El Giro + Los 4
  // pilares). Ref en paralelo a cada useState: los loops rAF leen la ref (el
  // state quedaría congelado en el closure del efecto que solo corre una
  // vez); el JSX condicional lee el state porque necesita re-render.
  useEffect(() => {
    // Ambos setState (reduced/isMobile) se llaman desde dentro de check(),
    // nunca sincrónicamente en el cuerpo del efecto (evita el lint
    // react-hooks/set-state-in-effect por "cascading renders").
    const check = () => {
      const reduce = window.matchMedia(
        "(prefers-reduced-motion: reduce)"
      ).matches;
      reduceMotionRef.current = reduce;
      setReduced(reduce);

      const m = window.innerWidth <= 768;
      isMobileRef.current = m;
      setIsMobile(m);
    };
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  // Progreso de scroll de El Giro (0..1), mismo cálculo por bounding-rect
  // que /metodologias — independiente del efecto del manifiesto de arriba,
  // ambos solo leen scroll/rects, no hay estado compartido que pisar.
  useEffect(() => {
    const container = document.querySelector<HTMLElement>(
      "[data-scroll-container]"
    );
    const giro = giroSectionRef.current;
    if (!container || !giro) return;

    const onGiroScroll = () => {
      const rect = giro.getBoundingClientRect();
      const span = rect.height - window.innerHeight;
      giroProgressRef.current =
        span > 0 ? clamp(-rect.top / span) : rect.top < 0 ? 1 : 0;
    };

    container.addEventListener("scroll", onGiroScroll, { passive: true });
    window.addEventListener("resize", onGiroScroll);
    onGiroScroll();
    return () => {
      container.removeEventListener("scroll", onGiroScroll);
      window.removeEventListener("resize", onGiroScroll);
    };
  }, []);

  // Canvas de El Giro: ruido (puntos dispersos) → quietud (anillo que se
  // disuelve en la penumbra + un punto de sentido que emerge en naranja).
  //
  // Paleta (justificación de los tripletes RGB exactos):
  //  - Ruido en reposo (p=0): --cr-peach (255,178,107) a alpha bajo (0.16) —
  //    chispas cálidas dispersas en la oscuridad, "datos sueltos".
  //  - Anillo asentado (p=1): (78,82,120) — NO es --cr-night puro (30,32,48):
  //    es una versión más clara y con más alpha (0.86) para que el anillo se
  //    note con claridad sin saltar a un color de alto contraste; sigue
  //    siendo un halo, pero uno que se ve ("quietud" = el ruido se disuelve,
  //    no desaparece de golpe).
  //  - Punto central (p>0.55): --cr-orange (255,106,0) puro — el único
  //    elemento que permanece nítido, eco del .cr-signal del hero. Lee
  //    "del dato [muchas motas] al sentido [un solo punto]".
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reduce = reduceMotionRef.current;
    let raf = 0;
    let w = 0;
    let h = 0;
    let dpr = 1;

    type Part = {
      sx: number;
      sy: number;
      ang: number;
      rJit: number;
      size: number;
      ph: number;
    };
    let parts: Part[] = [];

    const build = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = canvas.clientWidth;
      h = canvas.clientHeight;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const count = isMobileRef.current ? 130 : 320;
      parts = Array.from({ length: count }, (_, i) => {
        const seed = (i * 9301 + 49297) % 233280;
        const r1 = seed / 233280;
        const r2 = ((i * 4099 + 7919) % 104729) / 104729;
        return {
          // posición "ruido": dispersa por todo el lienzo
          sx: (r1 - 0.5) * w * 0.92,
          sy: (r2 - 0.5) * h * 0.82,
          // posición "quietud": sobre un anillo
          ang: (i / count) * Math.PI * 2,
          rJit: 0.9 + r2 * 0.18,
          size: 1.1 + r1 * 1.6,
          ph: r1 * Math.PI * 2,
        };
      });
    };

    const easeInOut = (t: number) =>
      t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
    const lerpN = (a: number, b: number, t: number) => a + (b - a) * t;

    const draw = (time: number) => {
      const cx = w / 2;
      const cy = h / 2;
      const p = reduce ? 1 : easeInOut(giroProgressRef.current);
      const ringR = Math.min(w, h) * 0.28;
      const breath = reduce ? 0 : Math.sin(time / 1600) * (8 + 14 * p); // inhala/exhala

      ctx.clearRect(0, 0, w, h);

      for (let i = 0; i < parts.length; i++) {
        const pt = parts[i];
        const tx = cx + Math.cos(pt.ang) * (ringR + breath) * pt.rJit;
        const ty = cy + Math.sin(pt.ang) * (ringR + breath) * pt.rJit;
        const x = pt.sx + cx + (tx - (pt.sx + cx)) * p;
        const y = pt.sy + cy + (ty - (pt.sy + cy)) * p;
        // ruido: cálido y disperso (peach) → quietud: "noche elevada" más visible
        const alpha = 0.16 + 0.7 * p;
        const rC = Math.round(lerpN(255, 78, p));
        const gC = Math.round(lerpN(178, 82, p));
        const bC = Math.round(lerpN(107, 120, p));
        ctx.beginPath();
        ctx.fillStyle = `rgba(${rC},${gC},${bC},${alpha})`;
        ctx.arc(x, y, pt.size * (1 - 0.25 * p), 0, Math.PI * 2);
        ctx.fill();
      }

      // punto de sentido en calma que aparece al final (eco de .cr-signal)
      if (p > 0.55) {
        const a = (p - 0.55) / 0.45;
        ctx.beginPath();
        ctx.fillStyle = `rgba(255,106,0,${0.9 * a})`;
        ctx.arc(cx, cy, Math.max(0.5, 4 + breath * 0.3), 0, Math.PI * 2);
        ctx.fill();
      }

      if (!reduce) raf = requestAnimationFrame(draw);
    };

    build();
    if (reduce) {
      draw(0);
    } else {
      raf = requestAnimationFrame(draw);
    }
    const onResize = () => build();
    window.addEventListener("resize", onResize);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
    };
  }, []);

  // Secuencia anclada "Los 4 pilares" (portada de /metodologias ·
  // Herramientas): el scroll abre un pilar a la vez (iris + texto), baja el
  // nodo por el riel y avanza el contador. Mutación directa de estilos en
  // rAF (sin re-render) — mismo cálculo de progreso por bounding-rect que
  // El Giro arriba; cada efecto lee su propio wrapper, sin estado
  // compartido entre ambos.
  useEffect(() => {
    if (reduced || isMobile) return;
    const container = document.querySelector<HTMLElement>(
      "[data-scroll-container]"
    );
    const wrap = toolsWrapRef.current;
    if (!container || !wrap) return;

    const N = toolsStationRefs.current.length || 4;
    let raf = 0;

    const loop = () => {
      const rect = wrap.getBoundingClientRect();
      const span = rect.height - window.innerHeight;
      const p = span > 0 ? clamp(-rect.top / span) : rect.top < 0 ? 1 : 0;

      // nodo + estela del sendero (0–100% de la altura del riel)
      if (toolsNodeRef.current) {
        const wave = 1 - Math.abs(((p * N) % 1) * 2 - 1);
        toolsNodeRef.current.style.top = `${(p * 100).toFixed(2)}%`;
        toolsNodeRef.current.style.setProperty("--wave", wave.toFixed(3));
      }
      if (toolsTrailRef.current)
        toolsTrailRef.current.style.height = `${(p * 100).toFixed(2)}%`;

      // estaciones: ventana de entrada/permanencia/salida → una visible a la vez
      for (let i = 0; i < N; i++) {
        const el = toolsStationRefs.current[i];
        if (!el) continue;
        const prog = p * N - i;
        let vis: number;
        if (prog <= -0.28 || prog >= 1.28) vis = 0;
        else if (prog < 0.28) vis = (prog + 0.28) / 0.56;
        else if (prog <= 0.62) vis = 1;
        else if (prog >= 1) vis = 0;
        else vis = (1 - prog) / 0.38;
        vis = clamp(vis);
        const activeIndex = Math.min(N - 1, Math.max(0, Math.floor(p * N)));
        const isLastExiting = i === N - 1 && prog > 0.62;
        if (i === activeIndex && !isLastExiting) vis = Math.max(vis, 0.18);
        el.style.opacity = "1";
        el.style.setProperty("--vis", vis.toFixed(3));
        el.style.setProperty("--trace", (0.15 + vis * 0.85).toFixed(3));
        el.style.setProperty("--step", clamp(prog).toFixed(3));
        el.style.pointerEvents = vis > 0.5 ? "auto" : "none";
      }

      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [reduced, isMobile]);

  useEffect(() => {
    const hero = heroRef.current;
    const container = document.querySelector<HTMLElement>("[data-scroll-container]");
    const lines = [
      firstLineRef.current,
      secondLineRef.current,
      thirdLineRef.current,
    ];

    if (!hero || !container || lines.some((line) => !line)) return;

    let frame = 0;

    const update = () => {
      frame = 0;

      const scrollableDistance = Math.max(
        1,
        hero.offsetHeight - container.clientHeight
      );
      const progress = clamp(
        (container.scrollTop - hero.offsetTop) / scrollableDistance
      );
      const restingOpacity = 0.2;
      const first =
        restingOpacity +
        (1 - restingOpacity) * (1 - smoothstep(0.08, 0.46, progress));
      const second =
        restingOpacity +
        (1 - restingOpacity) *
          (progress <= 0.5
            ? smoothstep(0.1, 0.48, progress)
            : 1 - smoothstep(0.52, 0.9, progress));
      const third =
        restingOpacity +
        (1 - restingOpacity) * smoothstep(0.54, 0.92, progress);

      const applyFocus = (
        line: HTMLSpanElement | null,
        visibility: number
      ) => {
        if (!line) return;
        const copy = line.querySelector<HTMLElement>(".cr-manifesto-copy");

        if (copy) {
          copy.style.opacity = visibility.toFixed(4);
          copy.style.filter = `blur(${((1 - visibility) * 10).toFixed(2)}px)`;
          copy.style.transform = `translateX(${((1 - visibility) * 24).toFixed(2)}px) scale(${(0.96 + visibility * 0.04).toFixed(4)})`;
        }

      };

      hero.style.setProperty("--cr-progress", progress.toFixed(4));
      applyFocus(firstLineRef.current, first);
      applyFocus(secondLineRef.current, second);
      applyFocus(thirdLineRef.current, third);
    };

    const requestUpdate = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };

    update();
    container.addEventListener("scroll", requestUpdate, { passive: true });
    window.addEventListener("resize", requestUpdate);

    return () => {
      if (frame) cancelAnimationFrame(frame);
      container.removeEventListener("scroll", requestUpdate);
      window.removeEventListener("resize", requestUpdate);
    };
  }, []);

  useEffect(() => {
    const reveals = Array.from(
      document.querySelectorAll<HTMLElement>(".cr-reveal")
    );

    if (!reveals.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          (entry.target as HTMLElement).classList.add("is-visible");
          observer.unobserve(entry.target);
        });
      },
      { threshold: 0.18 }
    );

    reveals.forEach((element) => observer.observe(element));
    return () => observer.disconnect();
  }, []);

  return (
    <div className="cr-page">
      <section ref={heroRef} className="cr-hero" aria-labelledby="cr-hero-title">
        <div className="cr-hero-stage">
          <div className="cr-atmosphere" aria-hidden="true">
            <div className="cr-orbit cr-orbit-one" />
            <div className="cr-orbit cr-orbit-two" />
            <div className="cr-signal" />
          </div>

          <div className="cr-hero-meta">
            <span className="cr-hero-meta-label">Escuela</span>
            <p className="cr-hero-meta-def">
              Etimológicamente, el término proviene del latín <em>schola</em>, y este a su vez del griego <em>skholē</em> (σχολή). Curiosamente, su significado original era &ldquo;ocio&rdquo; o &ldquo;tiempo libre&rdquo;. En la antigua Grecia, este tiempo libre se dedicaba al estudio, la reflexión y la conversación guiada.
            </p>
          </div>

          <h1 id="cr-hero-title" className="cr-manifesto">
            <span
              ref={firstLineRef}
              className="cr-manifesto-line cr-manifesto-line-one"
            >
              <span className="cr-manifesto-copy">Otra herramienta nueva</span>
            </span>
            <span
              ref={secondLineRef}
              className="cr-manifesto-line cr-manifesto-line-two"
            >
              <span className="cr-manifesto-copy">Otro curso pendiente</span>
            </span>
            <span
              ref={thirdLineRef}
              className="cr-manifesto-line cr-manifesto-line-three"
            >
              <span className="cr-manifesto-copy">Otra habilidad abandonada</span>
            </span>
          </h1>

          <div className="cr-scroll-cue" aria-hidden="true">
            <span className="cr-scroll-label">Desliza para discernir</span>
            <span className="cr-scroll-track">
              <span className="cr-scroll-progress" />
            </span>
          </div>
        </div>
      </section>

      <section
        id="academia-divergente"
        className="cr-academy"
        aria-label="Academia Divergente"
      >
        <div className="cr-academy-grid" aria-hidden="true" />

        <div className="cr-academy-inner">
          <h2 className="cr-academy-title cr-reveal">
            <span>Enseñamos</span>
          </h2>

          {/* ═══ Los 4 pilares — secuencia anclada (portada de /metodologias
              · Herramientas, con paleta propia .cr-tools-*). Reemplaza el
              reveal con clip-path que vivía en .cr-academy-pillars /
              .cr-academy-pillar. Texto EXACTO de los 4 pilares sin cambios;
              kicker (k) y descripción (d) son copy nuevo — ver reporte de
              la misión para que el Dueño lo revise. ═══ */}
          {isMobile || reduced ? (
            // Fallback ligero: apiladas, reveal por IntersectionObserver
            // (el mismo observer .cr-reveal ya montado más abajo en esta
            // página, sin un segundo sistema de detección mobile/reduced).
            <section aria-label="Pilares de Academia Divergente">
              <div className="cr-tools-stack">
                {PILARES.map((p, i) => (
                  <div
                    key={p.t}
                    className="cr-tools-stack-item cr-reveal"
                    data-pillar={i}
                    style={{ transitionDelay: `${0.08 * i}s` }}
                  >
                    <div className="cr-tools-stack-circle">
                      <AbstractToolMark kind={p.icon} />
                    </div>
                    <div>
                      <span className="cr-tools-kicker">{p.k}</span>
                      <h3
                        className="cr-tools-stack-title"
                        style={{ color: p.titleColor }}
                      >
                        {p.t}
                      </h3>
                      <p className="cr-tools-stack-desc">{p.d}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ) : (
            <section
              ref={toolsWrapRef}
              className="cr-tools-wrap"
              aria-label="Pilares de Academia Divergente"
            >
              <div className="cr-tools-stage">
                {/* línea-sendero + nodo viajero */}
                <div className="cr-tools-rail" aria-hidden>
                  <span ref={toolsTrailRef} className="cr-tools-rail-trail" />
                  <span ref={toolsNodeRef} className="cr-tools-node" />
                </div>

                {/* estaciones (una visible a la vez, cross-fade por --vis) */}
                {PILARES.map((p, i) => (
                  <div
                    key={p.t}
                    ref={(el) => {
                      toolsStationRefs.current[i] = el;
                    }}
                    className="cr-tools-station"
                    data-pillar={i}
                  >
                    <span className="cr-tools-halo" aria-hidden />
                    <div className="cr-tools-circle">
                      <AbstractToolMark kind={p.icon} />
                    </div>
                    <div className="cr-tools-text">
                      <span className="cr-tools-kicker">{p.k}</span>
                      <h3
                        className="cr-tools-title"
                        style={{ color: p.titleColor }}
                      >
                        {p.t}
                      </h3>
                      <p className="cr-tools-desc">{p.d}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          <ModalidadesBoard className="cr-formats-board cr-formats-board-section cr-reveal" />
        </div>
      </section>

      {/* ═══ El Giro (momento signature). Ver .cr-giro en globals.css. ═══ */}
      <div
        ref={giroSectionRef}
        className="cr-giro"
        style={{ height: isMobile ? "150vh" : "240vh" }}
      >
        <div className="cr-giro-stage">
          <canvas ref={canvasRef} className="cr-giro-canvas" />
          <div className="cr-giro-text">
            <p>
              Inhala ° Exhala
              <br />
              El error es necesario
            </p>
          </div>
        </div>
      </div>

      {/* ── CTA / Footer — mismo patrón de /analitica (WhatsApp + barra
          social + wordmark gigante), reskineado a la paleta de Escuela:
          fondo --cr-night (continúa el de El Giro justo arriba, misma
          noche) en vez del lila de Analítica; texto/ícono principal en
          --cr-peach (igual que el copy de El Giro) y el wordmark en
          naranja translúcido, mismo patrón que usaba .cr-criterion-word
          sobre --cr-night. ── */}
      <section
        style={{
          background: "var(--cr-night)",
          position: "relative",
          overflow: "hidden",
          minHeight: isMobile ? "auto" : "62vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "flex-start",
          paddingTop: isMobile ? "2.5rem" : "5rem",
          paddingBottom: isMobile ? "1rem" : "2em",
        }}
      >
        {/* Trabajemos juntos */}
        <a
          href="https://wa.me/573144869162"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Trabajemos juntos por WhatsApp"
          style={{
            fontFamily: "var(--font-montserrat)",
            fontSize: "clamp(0.95rem, 1.4vw, 1.3rem)",
            color: "var(--cr-peach)",
            letterSpacing: "0.08em",
            textDecoration: "none",
            textTransform: "uppercase",
            fontWeight: 600,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "0.6rem",
            position: "relative",
            zIndex: 1,
          }}
        >
          <span
            className="circle-link"
            data-brand="whatsapp"
            aria-hidden="true"
            style={{ width: "clamp(32px, 2.8vw, 58px)", height: "clamp(32px, 2.8vw, 58px)" }}
          >
            <svg className="icon-default" viewBox="0 0 24 24" aria-hidden="true" style={{ width: "clamp(28px, 2.4vw, 50px)", height: "clamp(28px, 2.4vw, 50px)" }}><path d="M19.05 4.91A9.82 9.82 0 0 0 12 2C6.48 2 2 6.48 2 12c0 1.65.41 3.27 1.18 4.71L2.05 22l5.43-1.43A9.95 9.95 0 0 0 12 22c5.52 0 10-4.48 10-10 0-2.66-1.05-5.18-2.95-7.09z" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" /><path d="M16.83 14.42c-.27-.13-1.6-.79-1.85-.88-.25-.09-.43-.13-.61.13-.18.27-.7.88-.86 1.06-.16.18-.31.2-.58.07-.27-.13-1.14-.42-2.18-1.34-.81-.72-1.35-1.6-1.51-1.87-.16-.27-.02-.42.12-.55.12-.12.27-.31.4-.47.13-.16.18-.27.27-.45.09-.18.04-.34-.02-.47-.07-.13-.61-1.46-.83-2-.22-.53-.45-.45-.61-.46-.16-.01-.34-.01-.52-.01-.18 0-.47.07-.72.34-.25.27-.95.93-.95 2.27 0 1.34.97 2.63 1.11 2.81.13.18 1.91 2.92 4.63 4.09.65.28 1.15.45 1.55.58.65.21 1.24.18 1.7.11.52-.08 1.6-.65 1.83-1.28.22-.63.22-1.17.16-1.28-.07-.11-.25-.18-.52-.31z" fill="currentColor" /></svg>
            <svg className="icon-hover" viewBox="0 0 24 24" aria-hidden="true" style={{ width: "clamp(28px, 2.4vw, 50px)", height: "clamp(28px, 2.4vw, 50px)" }}><path d="M19.05 4.91A9.82 9.82 0 0 0 12 2C6.48 2 2 6.48 2 12c0 1.65.41 3.27 1.18 4.71L2.05 22l5.43-1.43A9.95 9.95 0 0 0 12 22c5.52 0 10-4.48 10-10 0-2.66-1.05-5.18-2.95-7.09z" fill="none" stroke="#25D366" strokeWidth="1.4" strokeLinejoin="round" /><path d="M16.83 14.42c-.27-.13-1.6-.79-1.85-.88-.25-.09-.43-.13-.61.13-.18.27-.7.88-.86 1.06-.16.18-.31.2-.58.07-.27-.13-1.14-.42-2.18-1.34-.81-.72-1.35-1.6-1.51-1.87-.16-.27-.02-.42.12-.55.12-.12.27-.31.4-.47.13-.16.18-.27.27-.45.09-.18.04-.34-.02-.47-.07-.13-.61-1.46-.83-2-.22-.53-.45-.45-.61-.46-.16-.01-.34-.01-.52-.01-.18 0-.47.07-.72.34-.25.27-.95.93-.95 2.27 0 1.34.97 2.63 1.11 2.81.13.18 1.91 2.92 4.63 4.09.65.28 1.15.45 1.55.58.65.21 1.24.18 1.7.11.52-.08 1.6-.65 1.83-1.28.22-.63.22-1.17.16-1.28-.07-.11-.25-.18-.52-.31z" fill="#25D366" /></svg>
          </span>
          Trabajemos juntos
        </a>

        {/* Barra social horizontal — mismos íconos y transiciones del home */}
        <div style={{ display: "flex", flexDirection: "row", gap: "clamp(22px, 1.4vw, 36px)", zIndex: 2, marginTop: "1.5rem", position: "relative" }}>
          <a className="circle-link" data-brand="youtube" href="https://youtube.com/@divergenteamc?si=NVXi67gk721DWYF9" target="_blank" rel="noopener noreferrer" aria-label="YouTube">
            <svg className="icon-default" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M23.5 6.2a3 3 0 0 0-2.1-2.1C19.6 3.6 12 3.6 12 3.6s-7.6 0-9.4.5A3 3 0 0 0 .5 6.2C0 8 0 12 0 12s0 4 .5 5.8a3 3 0 0 0 2.1 2.1c1.8.5 9.4.5 9.4.5s7.6 0 9.4-.5a3 3 0 0 0 2.1-2.1C24 16 24 12 24 12s0-4-.5-5.8zM9.6 15.6V8.4l6.3 3.6-6.3 3.6z" /></svg>
            <svg className="icon-hover" viewBox="0 0 24 24" aria-hidden="true"><path d="M23.5 6.2a3 3 0 0 0-2.1-2.1C19.6 3.6 12 3.6 12 3.6s-7.6 0-9.4.5A3 3 0 0 0 .5 6.2C0 8 0 12 0 12s0 4 .5 5.8a3 3 0 0 0 2.1 2.1c1.8.5 9.4.5 9.4.5s7.6 0 9.4-.5a3 3 0 0 0 2.1-2.1C24 16 24 12 24 12s0-4-.5-5.8z" fill="#FF0000" /><polygon points="9.6,15.6 15.9,12 9.6,8.4" fill="#FFFFFF" /></svg>
          </a>
          <a className="circle-link" data-brand="instagram" href="https://www.instagram.com/divergente.amc/" target="_blank" rel="noopener noreferrer" aria-label="Instagram">
            <svg className="icon-default" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2.2c3.2 0 3.6 0 4.9.1 3.3.1 4.8 1.7 4.9 4.9.1 1.3.1 1.6.1 4.8s0 3.6-.1 4.8c-.1 3.2-1.7 4.8-4.9 4.9-1.3.1-1.6.1-4.9.1s-3.6 0-4.8-.1c-3.3-.1-4.8-1.7-4.9-4.9C2.2 15.6 2.2 15.3 2.2 12s0-3.6.1-4.8C2.4 3.9 4 2.3 7.2 2.3c1.2-.1 1.6-.1 4.8-.1zm0-2.2C8.7 0 8.3 0 7.1.1 2.7.3.3 2.7.1 7.1.1 8.3 0 8.7 0 12c0 3.3 0 3.7.1 4.9.2 4.4 2.6 6.8 7 7C8.3 24 8.7 24 12 24s3.7 0 4.9-.1c4.4-.2 6.8-2.6 7-7 .1-1.2.1-1.6.1-4.9s0-3.7-.1-4.9C23.7 2.7 21.3.3 16.9.1 15.7 0 15.3 0 12 0zm0 5.8a6.2 6.2 0 1 0 0 12.4A6.2 6.2 0 0 0 12 5.8zm0 10.2a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.4-11.8a1.4 1.4 0 1 0 0 2.8 1.4 1.4 0 0 0 0-2.8z" /></svg>
            <svg className="icon-hover" viewBox="0 0 24 24" aria-hidden="true"><defs><radialGradient id="ig-grad-cr" cx="0.3" cy="1" r="1.2"><stop offset="0%" stopColor="#FED576" /><stop offset="25%" stopColor="#F47133" /><stop offset="55%" stopColor="#BC3081" /><stop offset="85%" stopColor="#4C63D2" /></radialGradient></defs><rect x="2" y="2" width="20" height="20" rx="5" fill="url(#ig-grad-cr)" /><rect x="6" y="6" width="12" height="12" rx="3.5" fill="none" stroke="#fff" strokeWidth="1.6" /><circle cx="12" cy="12" r="3" fill="none" stroke="#fff" strokeWidth="1.6" /><circle cx="17" cy="7" r="0.9" fill="#fff" /></svg>
          </a>
          <a className="circle-link" data-brand="linkedin" href="https://www.linkedin.com/in/camilo-tiria/" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn">
            <svg className="icon-default" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M20.4 20.4h-3.4v-5.3c0-1.3 0-2.9-1.8-2.9s-2 1.4-2 2.8v5.4H9.8V9h3.3v1.6h.1c.5-.9 1.6-1.8 3.3-1.8 3.5 0 4.1 2.3 4.1 5.3v6.3zM5.3 7.4a2 2 0 1 1 0-4 2 2 0 0 1 0 4zm1.7 13H3.6V9h3.4v11.4zM22.2 0H1.8C.8 0 0 .8 0 1.7v20.6C0 23.2.8 24 1.8 24h20.4c1 0 1.8-.8 1.8-1.7V1.7C24 .8 23.2 0 22.2 0z" /></svg>
            <svg className="icon-hover" viewBox="0 0 24 24" aria-hidden="true"><rect x="0" y="0" width="24" height="24" rx="4" fill="#0A66C2" /><path d="M20.4 20.4h-3.4v-5.3c0-1.3 0-2.9-1.8-2.9s-2 1.4-2 2.8v5.4H9.8V9h3.3v1.6h.1c.5-.9 1.6-1.8 3.3-1.8 3.5 0 4.1 2.3 4.1 5.3v6.3zM5.3 7.4a2 2 0 1 1 0-4 2 2 0 0 1 0 4zm1.7 13H3.6V9h3.4v11.4z" fill="#FFFFFF" /></svg>
          </a>
        </div>

        {/* DIVERGENTE gigante — mitad recortada al fondo */}
        <div
          style={{
            position: "absolute",
            bottom: "-0.12em",
            left: 0,
            right: 0,
            textAlign: "center",
            lineHeight: 0.82,
            userSelect: "none",
            pointerEvents: "none",
            zIndex: 0,
            overflow: "visible",
          }}
        >
          <span
            style={{
              fontFamily: "var(--font-eastman)",
              fontSize: "clamp(3rem, 15vw, 19rem)",
              fontWeight: 400,
              textTransform: "uppercase",
              color: "rgba(255, 106, 0, 0.14)",
              letterSpacing: "-0.01em",
              display: "block",
              whiteSpace: "nowrap",
            }}
          >
            DIVERGENTE
          </span>
        </div>
      </section>
    </div>
  );
}

// Los 4 pilares de Academia Divergente. Título (t) EXACTO, sin cambios.
// Kicker (k) y descripción (d) son copy NUEVO agregado en esta misión —
// pendiente de revisión del Dueño (antes los pilares solo tenían título).
const PILARES = [
  {
    t: "Pensamiento crítico",
    k: "Cuestionar siempre antes de ejecutar",
    d: (
      <>
        {
          "Entrenamos el criterio y la capacidad de elegir para que la tecnología amplifique nuestras capacidades en lugar de nublarlas.\nPor eso enseñamos a cuestionar antes de aceptar: mientras exploramos herramientas técnicas, aplicamos metodologías "
        }
        <strong>Divergentes</strong>
        {
          " que fortalecen el discernimiento, la autonomía y la toma de decisiones frente a los sistemas digitales."
        }
      </>
    ),
    icon: "lens",
    titleColor: "#163b8f",
  },
  {
    t: "Pensamiento creativo",
    k: "Conectar ideas distintas",
    d: (
      <>
        {
          "Las posibilidades que tienen los procesos creativos son infinitas: para desarrollar proyectos "
        }
        <strong>sólidos, escalables y con propósito,</strong>
        {" se necesita desarrollar herramientas divergentes, "}
        <strong>
          no solo aprender a apretar botones y manipular herramientas
          técnicas
        </strong>
        {".\nIntegramos "}
        <strong>las artes, el bienestar</strong>
        {
          " para aprender a potenciar las herramientas tecnológicas."
        }
      </>
    ),
    icon: "spark",
    titleColor: "#0071bc",
  },
  {
    t: "Pensamiento analítico",
    k: "Descomponer para entender",
    d: "Descomponer un problema no es solo dividirlo en partes, es aprender a mirarlo sin que la ansiedad de resolverlo nuble todo.\n\nEn Divergente entendemos el pensamiento analítico como una habilidad que se entrena, no como un talento que se tiene o no se tiene. Por eso cruzamos metodologías de observación consciente estructurada, para que la mente aprenda a separar, ordenar y volver a armar.",
    icon: "axes",
    titleColor: "#3949d4",
  },
  {
    t: "Herramientas Técnicas",
    k: "Construir con las manos",
    d: "Aprendemos cometiendo errores, y perdiendo el miedo a lo técnico.\nEn Divergente enseñamos inteligencia artificial aplicada al día a día, para que cualquier persona, sin importar su oficio, pueda automatizar tareas y construir sus propias soluciones tecnológicas.\nEnseñamos a construir con las manos lo que antes parecía territorio exclusivo de expertos.",
    icon: "code",
    titleColor: "#004f8f",
  },
];

const MODALIDADES = [
  {
    title: "Comunidad en Skool",
    subtitle: "Ideal para empezar de CERO. Habilidades individuales.",
    image: "/formatos/comunidad-skool.png",
  },
  {
    title: "Sesiones en grupo",
    subtitle:
      "Talleres vivos para compartir dudas, ideas y avances. Aprendizaje colectivo con casos reales.",
    image: "/formatos/sesiones-grupo.jpg",
    whatsapp: true,
  },
  {
    title: "Charlas y conferencias",
    image: "/formatos/charlas-conferencias.jpg",
    whatsapp: true,
  },
  {
    title: "Formación empresas",
    subtitle: "Programas para fortalecer proyectos, equipos y decisiones.",
    image: "/formatos/formaciones-empresas.png",
    whatsapp: true,
  },
  {
    title: "Canal Gratuito YOUTUBE",
    subtitle: "Ideas claras para usar mejor la tecnología y crear con propósito.",
    image: "/formatos/canal-youtube.jpg",
    link: "https://www.youtube.com/@divergenteamc",
  },
] as const;

function ModalidadesBoard({ className = "cr-formats-board" }: { className?: string }) {
  return (
    <section className={className} aria-labelledby="cr-formats-title">
      <div className="cr-formats-heading">
        <h2 id="cr-formats-title">Formatos de Escuela</h2>
      </div>
      <div className="cr-formats-grid" aria-label="Modalidades de formación">
        {MODALIDADES.map((modalidad) => {
          const href =
            "link" in modalidad
              ? modalidad.link
              : "whatsapp" in modalidad && modalidad.whatsapp
                ? `https://wa.me/573144869162?text=${encodeURIComponent(
                    `Hola Divergente, estoy interesado/a en ${modalidad.title}`
                  )}`
                : undefined;
          const Tag = href ? "a" : "article";
          return (
            <Tag
              className={`cr-format-card${href ? " cr-format-card-link" : ""}`}
              key={modalidad.title}
              style={{ backgroundImage: `url(${modalidad.image})` }}
              {...(href
                ? {
                    href,
                    target: "_blank",
                    rel: "noopener noreferrer",
                  }
                : {})}
            >
              <div className="cr-format-card-overlay" aria-hidden />
              <h3>{modalidad.title}</h3>
              {"subtitle" in modalidad ? (
                <p className="cr-format-card-subtitle">{modalidad.subtitle}</p>
              ) : null}
            </Tag>
          );
        })}
      </div>
    </section>
  );
}

function AbstractToolMark({ kind }: { kind: string }) {
  return (
    <span className={`cr-abstract-mark cr-abstract-${kind}`} aria-hidden>
      <span />
      <span />
      <span />
      <span />
      <span />
      <span />
      <span />
      <span />
      <span />
    </span>
  );
}

/* Íconos lineales finos para Los 4 pilares (mismo lenguaje visual que
   PillarIcon en /metodologias: 40x40, solo stroke, sin relleno, 1px) pero
   con 4 trazos propios para los conceptos de Escuela:
   - lens (crítico): lupa — examinar/cuestionar antes de aceptar.
   - spark (creativo): reutilizado tal cual de /metodologias — ya encaja
     como "idea que aparece" sin necesitar un trazo nuevo.
   - axes (analítico): eje + barras ascendentes — descomponer en partes.
   - code (herramientas técnicas): "</>" — en el contexto de Escuela
     (IA/tecnología) construir una "herramienta propia funcionando" es
     software/prompts/flujos, no una herramienta mecánica; el ícono de
     código lee mejor esa idea que una llave inglesa. */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function LegacyToolIcon({ kind }: { kind: string }) {
  const common = {
    width: 40,
    height: 40,
    viewBox: "0 0 40 40",
    fill: "none",
    stroke: "var(--cr-night)",
    strokeWidth: 1,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };
  if (kind === "lens")
    return (
      <svg {...common} aria-hidden>
        <circle cx="17" cy="17" r="10" />
        <path d="M24 24 34 34" />
      </svg>
    );
  if (kind === "axes")
    return (
      <svg {...common} aria-hidden>
        <path d="M9 7v26h24M16 27v6M22 19v14M28 11v22" />
      </svg>
    );
  if (kind === "code")
    return (
      <svg {...common} aria-hidden>
        <path d="M16 12 7 20l9 8M24 12l9 8-9 8M21 9l-3 22" />
      </svg>
    );
  // spark — reutilizado tal cual de PillarIcon en /metodologias
  return (
    <svg {...common} aria-hidden>
      <path d="M20 5v9M20 26v9M5 20h9M26 20h9" />
      <circle cx="20" cy="20" r="5" />
    </svg>
  );
}
