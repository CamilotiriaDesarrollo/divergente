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

  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== "undefined" ? window.innerWidth <= 768 : false
  );
  const isMobileRef = useRef(
    typeof window !== "undefined" ? window.innerWidth <= 768 : false
  );
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
  //  - Anillo asentado (p=1): (52,55,82) — NO es --cr-night puro (30,32,48):
  //    es una versión ~1.7x más clara para que el anillo no se vuelva
  //    invisible al fundirse con el fondo del mismo tono; queda como un halo
  //    apagado, casi silencioso ("quietud" = el ruido se disuelve, no
  //    desaparece de golpe).
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
      const ringR = Math.min(w, h) * 0.22;
      const breath = reduce ? 0 : Math.sin(time / 1600) * (4 + 6 * p); // inhala/exhala

      ctx.clearRect(0, 0, w, h);

      for (let i = 0; i < parts.length; i++) {
        const pt = parts[i];
        const tx = cx + Math.cos(pt.ang) * (ringR + breath) * pt.rJit;
        const ty = cy + Math.sin(pt.ang) * (ringR + breath) * pt.rJit;
        const x = pt.sx + cx + (tx - (pt.sx + cx)) * p;
        const y = pt.sy + cy + (ty - (pt.sy + cy)) * p;
        // ruido: cálido y disperso (peach) → quietud: se apaga a "noche elevada"
        const alpha = 0.16 + 0.55 * p;
        const rC = Math.round(lerpN(255, 52, p));
        const gC = Math.round(lerpN(178, 55, p));
        const bC = Math.round(lerpN(107, 82, p));
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
        ctx.arc(cx, cy, 4 + breath * 0.3, 0, Math.PI * 2);
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

      {/* ═══ El Giro (momento signature) — sube antes de Criterio.
          Texto PENDIENTE: se mantiene literal "Del dato al sentido. Del
          ruido a la quietud." (portado de /metodologias) a petición del
          Dueño para traer primero la animación; el copy definitivo de
          Escuela se decide después. Ver .cr-giro en globals.css. ═══ */}
      <div
        ref={giroSectionRef}
        className="cr-giro"
        style={{ height: isMobile ? "200vh" : "240vh" }}
      >
        <div className="cr-giro-stage">
          <canvas ref={canvasRef} className="cr-giro-canvas" />
          <div className="cr-giro-text">
            <p>
              Del dato al sentido.
              <br />
              Del ruido a la quietud.
            </p>
          </div>
        </div>
      </div>

      <div className="cr-criterion cr-reveal">
        <span className="cr-criterion-word" aria-hidden="true">
          Criterio
        </span>
        <p>
          Y el criterio — saber cuándo la IA acierta, cuándo falla y cuándo
          la decisión es humana — se entrena con prácticas de observación
          que vienen de las artes.
        </p>
        <p className="cr-criterion-closing">
          Porque la tecnología se aprende rápido;
          <strong> el discernimiento se cultiva.</strong>
        </p>
      </div>
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
    d: "Enseñamos a cuestionar antes de aceptar, a distinguir lo que sirve de lo que solo suena bien.\nEse criterio es el que convierte una herramienta en algo con sentido, y es, al final, el punto donde la tecnología deja de ser una copia y empieza a nacer un proceso creativo.",
    icon: "lens",
    titleColor: "#163b8f",
  },
  {
    t: "Pensamiento creativo",
    k: "Conectar ideas distintas",
    d: "Encontrar una salida donde antes parecía haber una sola.",
    icon: "spark",
    titleColor: "#0071bc",
  },
  {
    t: "Pensamiento analítico",
    k: "Descomponer para entender",
    d: "Separar el problema en partes que sí se pueden resolver.",
    icon: "axes",
    titleColor: "#3949d4",
  },
  {
    t: "Herramientas Técnicas",
    k: "Construir con las manos",
    d: "Convertir una idea en algo que funciona y se puede usar.",
    icon: "code",
    titleColor: "#004f8f",
  },
] as const;

const MODALIDADES = [
  { title: "Cursos en nuestra comunidad" },
  { title: "Sesiones en grupo" },
  { title: "Charlas y conferencias" },
  { title: "Formaciones para emprendimiento y empresas" },
  {
    title: "Metodologías a la medida",
    description:
      "Diseñadas para tu organización. Integramos datos y práctica contemplativa en tu contexto.",
    featured: true,
  },
] as const;

function ModalidadesBoard({ className = "cr-formats-board" }: { className?: string }) {
  return (
    <section className={className} aria-labelledby="cr-formats-title">
      <div className="cr-formats-heading">
        <h2 id="cr-formats-title">Formatos de Escuela</h2>
      </div>
      <div className="cr-formats-grid" aria-label="Modalidades de formación">
        {MODALIDADES.map((modalidad, i) => (
          <article
            className={`cr-format-card${modalidad.featured ? " cr-format-card-featured" : ""}`}
            key={modalidad.title}
          >
            <span>{String(i + 1).padStart(2, "0")}</span>
            <h3>{modalidad.title}</h3>
            {"description" in modalidad ? <p>{modalidad.description}</p> : null}
          </article>
        ))}
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
