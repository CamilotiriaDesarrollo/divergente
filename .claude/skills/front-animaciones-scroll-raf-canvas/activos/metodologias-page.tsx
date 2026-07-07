"use client";

import Image from "next/image";
import Link from "next/link";
import React, { useEffect, useMemo, useRef, useState } from "react";

/* ════════════════════════════════════════════════════════════════════
   METODOLOGÍAS · "Herramientas para decidir y actuar con propósito."
   Mundo contemplativo: profundidad, silencio, respiración, presencia.
   Sistema de movimiento "Respiración" (ver globals.css .mt-*).
   ════════════════════════════════════════════════════════════════════ */

export default function Metodologias() {
  const fixedLogoRef = useRef<HTMLDivElement>(null);
  const heroRef = useRef<HTMLElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);

  // ── El Giro (momento signature) ──
  const giroSectionRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const giroProgressRef = useRef(0);

  // ── Demos de texto (3 opciones de interacción) ──
  const demoAWrapRef = useRef<HTMLDivElement>(null);
  const demoBWrapRef = useRef<HTMLDivElement>(null);
  const demoCWrapRef = useRef<HTMLDivElement>(null);

  // ── Herramientas (secuencia anclada estilo Moon Safari) ──
  const toolsWrapRef = useRef<HTMLElement>(null);
  const toolsNodeRef = useRef<HTMLSpanElement>(null);
  const toolsTrailRef = useRef<HTMLSpanElement>(null);
  const toolsCounterRef = useRef<HTMLSpanElement>(null);
  const toolsStationRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [reduced, setReduced] = useState(false);

  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== "undefined" ? window.innerWidth <= 768 : false
  );
  const isMobileRef = useRef(
    typeof window !== "undefined" ? window.innerWidth <= 768 : false
  );
  const reduceMotion = useRef(false);

  useEffect(() => {
    reduceMotion.current =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    setReduced(reduceMotion.current);

    const check = () => {
      const m = window.innerWidth <= 768;
      isMobileRef.current = m;
      setIsMobile(m);
    };
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  // ── IntersectionObserver: revela elementos .mt-reveal / .mt-rule ──
  useEffect(() => {
    const observe = () => {
      const els = document.querySelectorAll<HTMLElement>(".mt-reveal:not(.is-in), .mt-rule:not(.is-in)");
      if (reduceMotion.current) {
        document.querySelectorAll<HTMLElement>(".mt-reveal, .mt-rule")
          .forEach((el) => el.classList.add("is-in"));
        return;
      }
      const io = new IntersectionObserver(
        (entries) => {
          entries.forEach((e) => {
            if (e.isIntersecting) {
              e.target.classList.add("is-in");
              io.unobserve(e.target);
            }
          });
        },
        { threshold: 0.08, rootMargin: "0px 0px -4% 0px" }
      );
      els.forEach((el) => io.observe(el));
      return io;
    };

    const io = observe();
    // Re-check después de que el layout se estabiliza
    const t = setTimeout(() => observe(), 400);
    return () => { io?.disconnect(); clearTimeout(t); };
  }, []);

  // ── Logo clone que viaja desde el bottom hasta el header (cohesión de marca) ──
  useEffect(() => {
    const container = document.querySelector(
      "[data-scroll-container]"
    ) as HTMLElement | null;
    const headerLogo = document.querySelector(
      "[data-header-logo]"
    ) as HTMLElement | null;
    const headerText = document.querySelector(
      "[data-header-text]"
    ) as HTMLElement | null;
    const fixedLogo = fixedLogoRef.current;
    if (!container || !fixedLogo) return;

    const setStyle = (el: HTMLElement, props: Partial<CSSStyleDeclaration>) =>
      Object.assign(el.style, props);
    const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
    const clamp = (v: number) => Math.max(0, Math.min(1, v));

    const hRect = headerLogo?.getBoundingClientRect();
    const endLeft = hRect?.left ?? 32;
    const endTop = hRect?.top ?? 22;
    const endSize = hRect?.width ?? 44;
    const startLeft = endLeft;
    const startTop = window.innerHeight - endSize - 8;

    setStyle(fixedLogo, {
      position: "fixed",
      left: `${startLeft}px`,
      top: `${startTop}px`,
      width: `${endSize}px`,
      height: `${endSize}px`,
      opacity: "0.22",
      transition: "none",
      zIndex: "50",
      pointerEvents: "auto",
    });
    if (headerLogo)
      setStyle(headerLogo, { opacity: "0", transition: "none" });
    if (headerText)
      setStyle(headerText, {
        opacity: "0",
        transform: "translateY(16px)",
        transition: "none",
      });

    const LOGO_START = 20;
    const LOGO_END = 320;

    const onScroll = () => {
      const y = container.scrollTop;

      // Logo clone sube y se acomoda en el header (curva larga)
      const logoP = clamp((y - LOGO_START) / (LOGO_END - LOGO_START));
      setStyle(fixedLogo, {
        top: `${lerp(startTop, endTop, logoP)}px`,
        left: `${lerp(startLeft, endLeft, logoP)}px`,
      });
      const arrivalP = clamp((logoP - 0.8) / 0.2);
      if (headerLogo) headerLogo.style.opacity = String(arrivalP);
      if (headerText) {
        headerText.style.opacity = String(arrivalP);
        headerText.style.transform = `translateY(${(1 - arrivalP) * 16}px)`;
      }
      fixedLogo.style.opacity = String(
        logoP < 0.8 ? lerp(0.22, 0.7, logoP / 0.8) : lerp(0.7, 0, arrivalP)
      );

      // Progreso del momento signature (El Giro)
      const giro = giroSectionRef.current;
      if (giro) {
        const rect = giro.getBoundingClientRect();
        const span = rect.height - window.innerHeight;
        giroProgressRef.current =
          span > 0 ? clamp(-rect.top / span) : rect.top < 0 ? 1 : 0;
      }
    };

    container.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => {
      container.removeEventListener("scroll", onScroll);
      setStyle(fixedLogo, { opacity: "0" });
      if (headerLogo) setStyle(headerLogo, { opacity: "1", transition: "" });
      if (headerText)
        setStyle(headerText, { opacity: "1", transform: "", transition: "" });
    };
  }, []);

  // ── Título: "Miles de datos" late como ruido (estática), y al hacer scroll
  //    TODAS las letras se derriten y se desvanecen (melt en cascada). ──
  useEffect(() => {
    const container = document.querySelector(
      "[data-scroll-container]"
    ) as HTMLElement | null;
    const title = titleRef.current;
    if (!container || !title || reduceMotion.current) return;

    const letters = Array.from(
      title.querySelectorAll<HTMLElement>(".title-letter")
    );
    const isNoise = letters.map((el) => el.classList.contains("mt-noise"));
    const N = letters.length;
    const clamp = (v: number) => Math.max(0, Math.min(1, v));
    const hash = (i: number, a: number, b: number, c: number) =>
      ((i * a + b) % c) / c;

    // Parámetros de melt deterministas por letra (orden DOM = cascada).
    const delay = letters.map((_, i) => hash(i, 7919, 2053, 97) * 240);
    const driftX = letters.map((_, i) => (hash(i, 2741, 4099, 89) - 0.5) * 130);
    const driftY = letters.map((_, i) => 34 + hash(i, 4813, 997, 73) * 170); // caída
    const rot = letters.map((_, i) => (hash(i, 5381, 7013, 127) - 0.5) * 80);
    const scaleT = letters.map((_, i) => 0.6 + hash(i, 6143, 3019, 101) * 1.1);
    const blurMax = letters.map((_, i) => 8 + hash(i, 1873, 6271, 53) * 18);
    const fade = letters.map((_, i) => 1.15 + hash(i, 2311, 5501, 79) * 0.85);

    const MELT_START = 24;
    const MELT_DUR = 440;

    let raf = 0;
    let lastNoise = 0;

    const loop = (t: number) => {
      const y = container.scrollTop;

      for (let i = 0; i < N; i++) {
        const el = letters[i];
        const p = clamp((y - MELT_START - delay[i]) / MELT_DUR);
        if (p > 0) {
          const sc = 1 + (scaleT[i] - 1) * p;
          el.style.transform = `translate(${driftX[i] * p}px, ${driftY[i] * p}px) rotate(${rot[i] * p}deg) scale(${sc})`;
          el.style.filter = `blur(${blurMax[i] * p}px)`;
          el.style.opacity = String(Math.max(0, 1 - p * fade[i]));
        } else if (!isNoise[i]) {
          // letra en reposo (no-ruido): limpia
          el.style.transform = "";
          el.style.filter = "";
          el.style.opacity = "1";
        }
      }

      // Interferencia: cada letra de "Miles de datos" tiene su propio
      // intervalo de corte aleatorio (18–55 ms) — aparece/desaparece de
      // forma independiente, como señal de TV dañada o glitch digital.
      if (t - lastNoise > 18) {
        lastNoise = t;
        for (let i = 0; i < N; i++) {
          if (!isNoise[i]) continue;
          const p = clamp((y - MELT_START - delay[i]) / MELT_DUR);
          if (p > 0) continue; // ya derritiéndose
          const el = letters[i];
          const r = Math.random();
          // 30 % de probabilidad de que cada letra "se corte" en este tick
          if (r < 0.30) {
            el.style.opacity = String(Math.random() < 0.55 ? 0 : 0.12 + Math.random() * 0.4);
            const jx = (Math.random() - 0.5) * 8;
            const jy = (Math.random() - 0.5) * 5;
            const sk = (Math.random() - 0.5) * 6;
            el.style.transform = `translate(${jx}px,${jy}px) skewX(${sk}deg)`;
            el.style.filter = Math.random() < 0.4 ? `blur(${Math.random() * 3}px)` : "";
          } else {
            // vuelve al estado visible normal
            el.style.opacity = "1";
            el.style.transform = "";
            el.style.filter = "";
          }
        }
      }

      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(raf);
      letters.forEach((el) => {
        el.style.transform = "";
        el.style.filter = "";
        el.style.opacity = "";
      });
    };
  }, []);

  // ── Canvas del momento signature: ruido (puntos dispersos) → quietud (anillo que respira) ──
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reduce = reduceMotion.current;
    let raf = 0;
    let w = 0;
    let h = 0;
    let dpr = 1;

    type P = { sx: number; sy: number; ang: number; rJit: number; size: number; ph: number };
    let parts: P[] = [];

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
        // el ruido es tenue y verde-salvia; al calmarse se vuelve verde profundo y nítido
        const alpha = 0.18 + 0.55 * p;
        const g = Math.round(lerpN(124, 0, p));
        const gg = Math.round(lerpN(201, 95, p));
        const b = Math.round(lerpN(167, 70, p));
        ctx.beginPath();
        ctx.fillStyle = `rgba(${g},${gg},${b},${alpha})`;
        ctx.arc(x, y, pt.size * (1 - 0.25 * p), 0, Math.PI * 2);
        ctx.fill();
      }

      // punto central en calma que aparece al final
      if (p > 0.55) {
        const a = (p - 0.55) / 0.45;
        ctx.beginPath();
        ctx.fillStyle = `rgba(0,95,70,${0.9 * a})`;
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

  // ── Herramientas: secuencia anclada. El scroll abre una herramienta a la vez
  //    (máscara circular + texto), baja el nodo por el sendero y avanza el
  //    contador. Mutación directa de estilos en rAF (sin re-render). ──
  useEffect(() => {
    if (reduced || isMobile) return;
    const container = document.querySelector(
      "[data-scroll-container]"
    ) as HTMLElement | null;
    const wrap = toolsWrapRef.current;
    if (!container || !wrap) return;

    const N = toolsStationRefs.current.length || 4;
    const clamp = (v: number) => Math.max(0, Math.min(1, v));
    let raf = 0;

    const loop = () => {
      const rect = wrap.getBoundingClientRect();
      const span = rect.height - window.innerHeight;
      const p = span > 0 ? clamp(-rect.top / span) : rect.top < 0 ? 1 : 0;

      // nodo + estela del sendero (0–100% de la altura del riel)
      if (toolsNodeRef.current) toolsNodeRef.current.style.top = `${(p * 100).toFixed(2)}%`;
      if (toolsTrailRef.current) toolsTrailRef.current.style.height = `${(p * 100).toFixed(2)}%`;

      // contador (01..0N)
      const active = Math.min(N - 1, Math.max(0, Math.floor(p * N + 1e-4)));
      if (toolsCounterRef.current)
        toolsCounterRef.current.textContent = `0${active + 1}`;

      // estaciones: ventana de entrada/permanencia/salida → una visible a la vez
      for (let i = 0; i < N; i++) {
        const el = toolsStationRefs.current[i];
        if (!el) continue;
        const prog = p * N - i;
        let vis: number;
        if (prog <= -0.18 || prog >= 1.18) vis = 0;
        else if (prog < 0.18) vis = (prog + 0.18) / 0.36;
        else if (prog <= 0.82) vis = 1;
        else vis = (1.18 - prog) / 0.36;
        vis = clamp(vis);
        el.style.opacity = String(vis);
        el.style.setProperty("--vis", vis.toFixed(3));
        el.style.pointerEvents = vis > 0.5 ? "auto" : "none";
      }

      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [reduced, isMobile]);

  // ── Demo A: Scroll-typewriter (palabra por palabra) ──
  useEffect(() => {
    if (reduced || isMobile) return;
    const wrap = demoAWrapRef.current;
    if (!wrap) return;
    const words = Array.from(wrap.querySelectorAll<HTMLElement>(".da-word"));
    const N = words.length;
    const clamp = (v: number) => Math.max(0, Math.min(1, v));
    let raf = 0;
    const loop = () => {
      const rect = wrap.getBoundingClientRect();
      const span = rect.height - window.innerHeight;
      const p = span > 0 ? clamp(-rect.top / span) : rect.top < 0 ? 1 : 0;
      words.forEach((el, i) => {
        // +3 de offset: las primeras palabras ya están sólidas al entrar la
        // sección; el resto se mantiene como texto fantasma (0.13) visible.
        const vis = clamp((p * (N + 6) + 3 - i) / 3);
        el.style.opacity = (0.13 + 0.87 * vis).toFixed(3);
        el.style.transform = `translateY(${((1 - vis) * 14).toFixed(1)}px)`;
      });
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [reduced, isMobile]);

  // ── Demo B: Entropía → claridad ──
  useEffect(() => {
    if (reduced || isMobile) return;
    const wrap = demoBWrapRef.current;
    if (!wrap) return;
    const p1words = Array.from(wrap.querySelectorAll<HTMLElement>(".db-p1w"));
    const p2 = wrap.querySelector<HTMLElement>(".db-p2");
    const p3 = wrap.querySelector<HTMLElement>(".db-p3");
    const clamp = (v: number) => Math.max(0, Math.min(1, v));
    let raf = 0;
    let lastJitter = 0;
    const loop = (t: number) => {
      const rect = wrap.getBoundingClientRect();
      const span = rect.height - window.innerHeight;
      const p = span > 0 ? clamp(-rect.top / span) : rect.top < 0 ? 1 : 0;
      // Para 1 starts jittering, settles as p→0.55
      const jStr = Math.max(0, 1 - p / 0.55);
      if (t - lastJitter > 28) {
        lastJitter = t;
        p1words.forEach((el) => {
          if (Math.random() < 0.38 * jStr) {
            const jx = (Math.random() - 0.5) * 14 * jStr;
            const jy = (Math.random() - 0.5) * 7 * jStr;
            const sk = (Math.random() - 0.5) * 10 * jStr;
            el.style.transform = `translate(${jx.toFixed(1)}px,${jy.toFixed(1)}px) skewX(${sk.toFixed(1)}deg)`;
            el.style.opacity = String(Math.max(0.25, 1 - jStr * 0.35).toFixed(2));
          } else {
            el.style.transform = "";
            el.style.opacity = "";
          }
        });
      }
      if (jStr < 0.02) p1words.forEach((el) => { el.style.transform = ""; el.style.opacity = ""; });
      if (p2) {
        const v2 = clamp((p - 0.38) / 0.22);
        p2.style.opacity = (0.22 + 0.78 * v2).toFixed(3);
        p2.style.transform = `translateY(${((1 - v2) * 18).toFixed(1)}px)`;
      }
      if (p3) {
        const v3 = clamp((p - 0.66) / 0.22);
        p3.style.opacity = (0.22 + 0.78 * v3).toFixed(3);
        p3.style.transform = `translateY(${((1 - v3) * 18).toFixed(1)}px)`;
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [reduced, isMobile]);

  // ── Demo C: Slides horizontales ──
  useEffect(() => {
    if (reduced || isMobile) return;
    const wrap = demoCWrapRef.current;
    if (!wrap) return;
    const track = wrap.querySelector<HTMLElement>(".dc-track");
    const nums = Array.from(wrap.querySelectorAll<HTMLElement>(".dc-num"));
    const clamp = (v: number) => Math.max(0, Math.min(1, v));
    let raf = 0;
    const loop = () => {
      const rect = wrap.getBoundingClientRect();
      const span = rect.height - window.innerHeight;
      const p = span > 0 ? clamp(-rect.top / span) : rect.top < 0 ? 1 : 0;
      if (track) track.style.transform = `translateX(${(-(p * 200) / 3).toFixed(2)}%)`;
      const active = Math.min(2, Math.floor(p * 3 + 0.02));
      nums.forEach((el, i) => {
        el.style.opacity = i === active ? "1" : "0.2";
        el.style.transform = i === active ? "scale(1.1)" : "scale(0.85)";
      });
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [reduced, isMobile]);

  return (
    <div className="w-full" style={{ overflowX: "clip" }}>
      {/* ── Clon fijo del logo — viaja del bottom al header ── */}
      <div ref={fixedLogoRef} style={{ opacity: 0 }}>
        <Link href="/" aria-label="Ir al inicio" style={{ display: "block", width: "100%", height: "100%" }}>
          <Image
            src="/logo-metodologias.png"
            alt="Divergente — inicio"
            width={96}
            height={96}
            style={{ width: "100%", height: "100%", objectFit: "contain" }}
            priority
          />
        </Link>
      </div>

      {/* ═══════════════════ 5.1 · HERO ═══════════════════ */}
      <section
        ref={heroRef}
        className="section-wrap"
        style={{
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "flex-start",
          textAlign: "center",
          position: "relative",
          paddingTop: "12vh",
          paddingBottom: "0",
        }}
      >
        {/* Campo "miles de datos" — números que titilan detrás del hero */}
        <HeroDataField />

        <h1
          ref={titleRef}
          style={{
            position: "relative",
            zIndex: 1,
            margin: 0,
            fontFamily: "var(--font-montserrat), sans-serif",
            fontWeight: 300,
            color: "#7cc9a7",
            lineHeight: 1.08,
            letterSpacing: "0.06em",
            textTransform: "uppercase",
          }}
        >
          <span
            className="mt-reveal"
            style={{
              display: "block",
              fontSize: "clamp(1.8rem, 5.6vw, 5rem)",
              transitionDelay: "0.15s",
            }}
          >
            {renderMeltText("Miles de datos", true)}
          </span>
          <span
            className="mt-reveal"
            style={{
              display: "block",
              fontSize: "clamp(1.3rem, 3vw, 2.6rem)",
              margin: "0.12em 0 0.06em",
              transitionDelay: "0.3s",
            }}
          >
            {renderMeltText("no son más", true)}
          </span>
          <span
            className="mt-reveal"
            style={{
              display: "block",
              fontSize: "clamp(2.6rem, 9.5vw, 9.5rem)",
              transitionDelay: "0.55s",
            }}
          >
            {renderMeltText("Claridad", false)}
          </span>
        </h1>

        {/* Buda — en flujo normal, empuja hacia abajo; texto empieza al terminar la imagen */}
        <div
          aria-hidden
          style={{
            marginTop: "auto",
            width: "min(51.8vw, 490px)",
            pointerEvents: "none",
            flexShrink: 0,
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/buda.svg"
            alt=""
            style={{
              width: "100%",
              display: "block",
              opacity: 0.2,
              filter: "invert(1) invert(73%) sepia(20%) saturate(750%) hue-rotate(108deg) brightness(95%) contrast(88%)",
            }}
          />
        </div>

      </section>

      {/* ═══════════════════ 5.2 · DEMOS DE INTERACCIÓN DE TEXTO ═══════════════════ */}
      <section
        className="section-wrap"
        style={{ maxWidth: "62rem", margin: "0 auto", padding: isMobile ? "10vh 1.5rem 2rem" : "14vh 2rem 2rem" }}
      >
        <span className="mt-reveal mt-eyebrow" style={{ display: "block", marginBottom: "1.6rem" }}>
          Herramientas para eliminar el ruido
        </span>
        {/* Intro visible siempre — los 3 demos abajo la amplían */}
        <p className="mt-reveal" style={{ margin: 0, fontFamily: "var(--font-eastman), sans-serif", fontSize: "clamp(0.95rem, 1.2vw, 1.15rem)", color: "#4f6b5d", lineHeight: 1.6 }}>
          Tres formas de contar la misma historia. Elige la que resuene.
        </p>
      </section>

      {isMobile || reduced ? (
        /* ── Fallback estático (mobile / prefers-reduced-motion) ── */
        <section className="section-wrap" style={{ maxWidth: "62rem", margin: "0 auto", padding: "0 1.5rem 8vh" }}>
          {[
            { label: "A · Typewriter" },
            { label: "B · Entropía → claridad" },
            { label: "C · Slides" },
          ].map(({ label }, di) => (
            <div key={di} className="demo-static-block mt-reveal" style={{ transitionDelay: `${di * 0.1}s` }}>
              <span className="demo-label-static">{label}</span>
              {DEMO_PARAS.map((txt, pi) => (
                <p key={pi} style={{
                  margin: pi === 0 ? "0.8rem 0 0" : "1.4rem 0 0",
                  fontFamily: "var(--font-eastman), sans-serif",
                  fontSize: "clamp(1.2rem, 3vw, 1.9rem)",
                  lineHeight: 1.25,
                  color: pi === 2 ? "var(--mt-green)" : pi === 1 ? "rgba(0,95,70,0.55)" : "#3d574a",
                }}>{txt}</p>
              ))}
            </div>
          ))}
        </section>
      ) : (
        <>
          {/* ══ DEMO A — Typewriter por palabras ══ */}
          <div ref={demoAWrapRef} className="demo-wrap" style={{ height: "220vh" }}>
            <div className="demo-stage">
              <span className="demo-label">A · Typewriter por palabras</span>
              <div className="da-container">
                {DEMO_PARAS.flatMap((para, pi) =>
                  para.split(" ").map((word, wi, arr) => {
                    const bare = word.replace(/[.,;:]/g, "");
                    const accent = DEMO_ACCENT.has(bare);
                    const isLast = pi < DEMO_PARAS.length - 1 && wi === arr.length - 1;
                    return (
                      <React.Fragment key={`${pi}-${wi}`}>
                        <span
                          className={`da-word${accent ? " da-accent" : ""}`}
                          style={{ opacity: 0.13 }}
                        >
                          {word}
                        </span>
                        {wi < arr.length - 1 && (
                          <span className="da-space" aria-hidden> </span>
                        )}
                        {isLast && <span className="da-br" aria-hidden />}
                      </React.Fragment>
                    );
                  })
                )}
              </div>
            </div>
          </div>

          {/* ══ DEMO B — Entropía → claridad ══ */}
          <div ref={demoBWrapRef} className="demo-wrap" style={{ height: "200vh" }}>
            <div className="demo-stage">
              <span className="demo-label">B · Entropía → claridad</span>
              <div className="db-container">
                <p style={{ margin: 0 }}>
                  {DEMO_PARAS[0].split(" ").map((w, i, arr) => (
                    <React.Fragment key={i}>
                      <span className="db-p1w" style={{ display: "inline-block" }}>{w}</span>
                      {i < arr.length - 1 && " "}
                    </React.Fragment>
                  ))}
                </p>
                <p className="db-p2" style={{ margin: "2.4rem 0 0", opacity: 0.22 }}>
                  {DEMO_PARAS[1]}
                </p>
                <p className="db-p3" style={{ margin: "2.4rem 0 0", opacity: 0.22 }}>
                  Lo que falta no es información. Es la capacidad de{" "}
                  <em style={{ fontStyle: "normal", color: "#7cc9a7" }}>observar con profundidad</em>{" "}
                  hacia afuera y hacia adentro.
                </p>
              </div>
            </div>
          </div>

          {/* ══ DEMO C — Slides horizontales ══ */}
          <div ref={demoCWrapRef} className="demo-wrap" style={{ height: "220vh" }}>
            <div className="demo-stage" style={{ overflow: "hidden" }}>
              <span className="demo-label">C · Slides horizontales</span>
              <div className="dc-nums" aria-hidden>
                {["01", "02", "03"].map((n, i) => (
                  <span key={n} className="dc-num" style={{ opacity: i === 0 ? 1 : 0.2, transform: i === 0 ? "scale(1.1)" : "scale(0.85)" }}>{n}</span>
                ))}
              </div>
              <div className="dc-track">
                {[
                  { title: "Nunca tuvimos tanta información.", body: "Más datos, más métricas, más dashboards." },
                  { title: "Y aun así, los equipos siguen decidiendo", body: "desde la urgencia, la reacción y el ruido." },
                  { title: "Lo que falta no es información.", body: <React.Fragment>Es la capacidad de{" "}<em style={{ fontStyle: "normal", color: "#7cc9a7" }}>observar con profundidad</em>{" "}hacia afuera y hacia adentro.</React.Fragment> },
                ].map((slide, i) => (
                  <div key={i} className="dc-slide">
                    <p className="dc-slide-title">{slide.title}</p>
                    <p className="dc-slide-body">{slide.body}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}

      {/* ═══ 5.2b · LAS 4 HERRAMIENTAS — secuencia anclada (Moon Safari) ═══ */}
      {isMobile || reduced ? (
        // Fallback ligero: apiladas, reveal por IntersectionObserver
        <section
          className="section-wrap"
          style={{ maxWidth: "70rem", margin: "0 auto", padding: "8vh 1.5rem 2vh" }}
        >
          <div className="mt-tools-stack">
            {HERRAMIENTAS.map((h, i) => (
              <div
                key={h.t}
                className="mt-tools-stack-item mt-reveal"
                style={{ transitionDelay: `${0.08 * i}s` }}
              >
                <div className="mt-tools-stack-circle">
                  <PillarIcon kind={h.icon} />
                </div>
                <div>
                  <span className="mt-tools-kicker">{`0${i + 1} · 0${HERRAMIENTAS.length}`}</span>
                  <h3 className="mt-tools-stack-title">{h.t}</h3>
                  <p className="mt-tools-stack-desc">{h.d}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      ) : (
        <section ref={toolsWrapRef} className="mt-tools-wrap" aria-label="Herramientas">
          <div className="mt-tools-stage">
            {/* línea-sendero + nodo viajero */}
            <div className="mt-tools-rail" aria-hidden>
              <span ref={toolsTrailRef} className="mt-tools-rail-trail" />
              <span ref={toolsNodeRef} className="mt-tools-node" />
            </div>

            {/* estaciones (una visible a la vez, cross-fade por --vis) */}
            {HERRAMIENTAS.map((h, i) => (
              <div
                key={h.t}
                ref={(el) => {
                  toolsStationRefs.current[i] = el;
                }}
                className="mt-tools-station"
              >
                <div className="mt-tools-circle">
                  <span className="mt-tools-halo" aria-hidden />
                  <PillarIcon kind={h.icon} />
                </div>
                <div className="mt-tools-text">
                  <span className="mt-tools-kicker">{h.k}</span>
                  <h3 className="mt-tools-title">{h.t}</h3>
                  <p className="mt-tools-desc">{h.d}</p>
                </div>
              </div>
            ))}

            {/* contador 01 · 04 */}
            <div className="mt-tools-counter" aria-hidden>
              <span ref={toolsCounterRef}>01</span>
              <span className="mt-tools-counter-total">{` · 0${HERRAMIENTAS.length}`}</span>
            </div>
          </div>
        </section>
      )}

      {/* ═══════════════════ 5.3 · EL GIRO (signature) ═══════════════════ */}
      <div ref={giroSectionRef} style={{ height: isMobile ? "200vh" : "240vh", position: "relative" }}>
        <div
          style={{
            position: "sticky",
            top: 0,
            height: "100vh",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            overflow: "hidden",
          }}
        >
          <canvas
            ref={canvasRef}
            style={{
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
            }}
          />
          <div
            style={{
              position: "relative",
              zIndex: 1,
              textAlign: "center",
              padding: "0 1.5rem",
              pointerEvents: "none",
            }}
          >
            <p
              style={{
                margin: 0,
                fontFamily: "var(--font-eastman), sans-serif",
                fontSize: "clamp(1.5rem, 3.4vw, 3rem)",
                lineHeight: 1.2,
                color: "var(--mt-green)",
              }}
            >
              Del dato al sentido.
              <br />
              Del ruido a la quietud.
            </p>
          </div>
        </div>
      </div>

      {/* ═══════════════════ 5.4 · EL MÉTODO ═══════════════════ */}
      <section
        className="section-wrap"
        style={{ maxWidth: "70rem", margin: "0 auto", padding: "12vh 2rem" }}
      >
        <span className="mt-reveal mt-eyebrow" style={{ display: "block", marginBottom: "1.2rem" }}>
          El método
        </span>
        <div
          className="mt-reveal"
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "1.6rem",
            maxWidth: "48rem",
            fontFamily: "var(--font-montserrat), sans-serif",
            fontSize: "clamp(1.05rem, 1.5vw, 1.5rem)",
            lineHeight: 1.7,
            color: "#3d574a",
            transitionDelay: "0.15s",
          }}
        >
          <p style={{ margin: 0 }}>
            En Divergente desarrollamos metodologías que integran lo que los
            sistemas racionales no enseñan: la{" "}
            <strong>observación consciente</strong>, el{" "}
            <strong>silencio como herramienta</strong>, la{" "}
            <strong>meditación aplicada</strong> a la toma de decisiones y{" "}
            <strong>procesos creativos</strong> que revelan el propósito detrás
            de cada proyecto.
          </p>
          <p style={{ margin: 0, color: "var(--mt-green)" }}>
            No son charlas motivacionales. Son experiencias construidas desde
            años de trabajo con datos, observatorios y sistemas de información —
            unidos a la práctica contemplativa.{" "}
            <strong style={{ fontWeight: 700 }}>Una sola mirada.</strong>
          </p>
        </div>

        {/* Los 4 pilares ahora viven en la sección Herramientas (secuencia anclada). */}
      </section>

      {/* ═══════════════════ 5.5 · LAS 4 MODALIDADES ═══════════════════ */}
      <section
        id="modalidades"
        className="section-wrap"
        style={{ maxWidth: "76rem", margin: "0 auto", padding: "10vh 2rem", scrollMarginTop: "90px" }}
      >
        <div className="mt-rule" style={{ marginBottom: "2.6rem" }} />
        <h2 className="mt-reveal mt-heading" style={{ marginBottom: "0.8rem" }}>
          Cómo trabajamos.
        </h2>
        <p
          className="mt-reveal"
          style={{
            margin: "0 0 3rem",
            maxWidth: "34rem",
            fontFamily: "var(--font-montserrat), sans-serif",
            fontSize: "clamp(0.95rem, 1.1vw, 1.15rem)",
            lineHeight: 1.7,
            color: "#4f6b5d",
            transitionDelay: "0.15s",
          }}
        >
          Cuatro formas de instalar una mirada más profunda en tu organización,
          tu comunidad o tu vida.
        </p>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr",
            gap: isMobile ? "1.1rem" : "1.6rem",
          }}
        >
          {[
            {
              eyebrow: "Modalidad 01",
              title: "Conferencias",
              text: "Para mover a una sala entera. Para equipos, comunidades, instituciones y eventos.",
              link: "/metodologias/conferencias",
              cta: "Ver conferencias →",
              featured: true,
            },
            {
              eyebrow: "Modalidad 02",
              title: "Talleres",
              text: "Práctica, no teoría. Espacios para instalar nuevas formas de observar y decidir.",
            },
            {
              eyebrow: "Modalidad 03",
              title: "Experiencias contemplativas",
              text: "Silencio, meditación y observación consciente. Espacios para parar y volver a ver.",
            },
            {
              eyebrow: "Modalidad 04",
              title: "Metodologías a la medida",
              text: "Diseñadas para tu organización. Integramos datos y práctica contemplativa en tu contexto.",
            },
          ].map((m, i) => {
            const inner = (
              <>
                <span className="mt-card-eyebrow">{m.eyebrow}</span>
                <span className="mt-card-title">{m.title}</span>
                <span className="mt-card-text">{m.text}</span>
                {m.cta && <span className="mt-card-link">{m.cta}</span>}
              </>
            );
            const cls = `mt-card mt-reveal${m.featured ? " mt-card--featured" : ""}`;
            const style: React.CSSProperties = {
              transitionDelay: `${0.1 + i * 0.12}s`,
              gridColumn: m.featured && !isMobile ? "span 2" : "auto",
            };
            return m.link ? (
              <Link key={m.title} href={m.link} className={cls} style={style}>
                {inner}
              </Link>
            ) : (
              <div key={m.title} className={cls} style={style}>
                {inner}
              </div>
            );
          })}
        </div>
      </section>

      {/* ═══════════════════ 5.6 · PARA QUIÉN ═══════════════════ */}
      <section
        className="section-wrap"
        style={{ maxWidth: "62rem", margin: "0 auto", padding: "12vh 2rem" }}
      >
        <span className="mt-reveal mt-eyebrow" style={{ display: "block", marginBottom: "2rem" }}>
          Para quién
        </span>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "1.4rem",
            fontFamily: "var(--font-eastman), sans-serif",
            fontSize: "clamp(1.4rem, 3vw, 2.7rem)",
            lineHeight: 1.25,
            color: "var(--mt-sage)",
          }}
        >
          {[
            ["Para ", "líderes", " que deciden bajo presión."],
            ["Para ", "instituciones y cámaras de comercio", "."],
            ["Para ", "comunidades", " que buscan encuentro y propósito."],
            ["Y para ", "personas", " que quieren reconectar con lo esencial."],
          ].map((line, i) => (
            <p
              key={i}
              className="mt-reveal"
              style={{ margin: 0, transitionDelay: `${i * 0.16}s` }}
            >
              {line[0]}
              <strong style={{ color: "var(--mt-green)", fontWeight: 400 }}>
                {line[1]}
              </strong>
              {line[2]}
            </p>
          ))}
        </div>
      </section>

      {/* ═══════════════════ 5.8 · CIERRE ═══════════════════ */}
      <section
        style={{
          position: "relative",
          overflow: "hidden",
          minHeight: isMobile ? "auto" : "50vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "flex-start",
          textAlign: "center",
          paddingTop: isMobile ? "10vh" : "12vh",
          paddingBottom: isMobile ? "1rem" : "2rem",
          paddingLeft: "1.5rem",
          paddingRight: "1.5rem",
        }}
      >
        {/* Barra social horizontal — mismos íconos del home/analítica */}
        <div
          style={{
            display: "flex",
            flexDirection: "row",
            gap: "clamp(22px, 1.4vw, 36px)",
            zIndex: 2,
            position: "relative",
          }}
        >
          <a className="circle-link" data-brand="youtube" href="https://youtube.com/@divergenteamc?si=NVXi67gk721DWYF9" target="_blank" rel="noopener noreferrer" aria-label="YouTube">
            <svg className="icon-default" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M23.5 6.2a3 3 0 0 0-2.1-2.1C19.6 3.6 12 3.6 12 3.6s-7.6 0-9.4.5A3 3 0 0 0 .5 6.2C0 8 0 12 0 12s0 4 .5 5.8a3 3 0 0 0 2.1 2.1c1.8.5 9.4.5 9.4.5s7.6 0 9.4-.5a3 3 0 0 0 2.1-2.1C24 16 24 12 24 12s0-4-.5-5.8zM9.6 15.6V8.4l6.3 3.6-6.3 3.6z" /></svg>
            <svg className="icon-hover" viewBox="0 0 24 24" aria-hidden="true"><path d="M23.5 6.2a3 3 0 0 0-2.1-2.1C19.6 3.6 12 3.6 12 3.6s-7.6 0-9.4.5A3 3 0 0 0 .5 6.2C0 8 0 12 0 12s0 4 .5 5.8a3 3 0 0 0 2.1 2.1c1.8.5 9.4.5 9.4.5s7.6 0 9.4-.5a3 3 0 0 0 2.1-2.1C24 16 24 12 24 12s0-4-.5-5.8z" fill="#FF0000" /><polygon points="9.6,15.6 15.9,12 9.6,8.4" fill="#FFFFFF" /></svg>
          </a>
          <a className="circle-link" data-brand="instagram" href="https://www.instagram.com/divergente.amc/" target="_blank" rel="noopener noreferrer" aria-label="Instagram">
            <svg className="icon-default" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2.2c3.2 0 3.6 0 4.9.1 3.3.1 4.8 1.7 4.9 4.9.1 1.3.1 1.6.1 4.8s0 3.6-.1 4.8c-.1 3.2-1.7 4.8-4.9 4.9-1.3.1-1.6.1-4.9.1s-3.6 0-4.8-.1c-3.3-.1-4.8-1.7-4.9-4.9C2.2 15.6 2.2 15.3 2.2 12s0-3.6.1-4.8C2.4 3.9 4 2.3 7.2 2.3c1.2-.1 1.6-.1 4.8-.1zm0-2.2C8.7 0 8.3 0 7.1.1 2.7.3.3 2.7.1 7.1.1 8.3 0 8.7 0 12c0 3.3 0 3.7.1 4.9.2 4.4 2.6 6.8 7 7C8.3 24 8.7 24 12 24s3.7 0 4.9-.1c4.4-.2 6.8-2.6 7-7 .1-1.2.1-1.6.1-4.9s0-3.7-.1-4.9C23.7 2.7 21.3.3 16.9.1 15.7 0 15.3 0 12 0zm0 5.8a6.2 6.2 0 1 0 0 12.4A6.2 6.2 0 0 0 12 5.8zm0 10.2a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.4-11.8a1.4 1.4 0 1 0 0 2.8 1.4 1.4 0 0 0 0-2.8z" /></svg>
            <svg className="icon-hover" viewBox="0 0 24 24" aria-hidden="true"><defs><radialGradient id="ig-grad-mt" cx="0.3" cy="1" r="1.2"><stop offset="0%" stopColor="#FED576" /><stop offset="25%" stopColor="#F47133" /><stop offset="55%" stopColor="#BC3081" /><stop offset="85%" stopColor="#4C63D2" /></radialGradient></defs><rect x="2" y="2" width="20" height="20" rx="5" fill="url(#ig-grad-mt)" /><rect x="6" y="6" width="12" height="12" rx="3.5" fill="none" stroke="#fff" strokeWidth="1.6" /><circle cx="12" cy="12" r="3" fill="none" stroke="#fff" strokeWidth="1.6" /><circle cx="17" cy="7" r="0.9" fill="#fff" /></svg>
          </a>
          <a className="circle-link" data-brand="linkedin" href="https://www.linkedin.com/in/camilo-tiria/" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn">
            <svg className="icon-default" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M20.4 20.4h-3.4v-5.3c0-1.3 0-2.9-1.8-2.9s-2 1.4-2 2.8v5.4H9.8V9h3.3v1.6h.1c.5-.9 1.6-1.8 3.3-1.8 3.5 0 4.1 2.3 4.1 5.3v6.3zM5.3 7.4a2 2 0 1 1 0-4 2 2 0 0 1 0 4zm1.7 13H3.6V9h3.4v11.4zM22.2 0H1.8C.8 0 0 .8 0 1.7v20.6C0 23.2.8 24 1.8 24h20.4c1 0 1.8-.8 1.8-1.7V1.7C24 .8 23.2 0 22.2 0z" /></svg>
            <svg className="icon-hover" viewBox="0 0 24 24" aria-hidden="true"><rect x="0" y="0" width="24" height="24" rx="4" fill="#0A66C2" /><path d="M20.4 20.4h-3.4v-5.3c0-1.3 0-2.9-1.8-2.9s-2 1.4-2 2.8v5.4H9.8V9h3.3v1.6h.1c.5-.9 1.6-1.8 3.3-1.8 3.5 0 4.1 2.3 4.1 5.3v6.3zM5.3 7.4a2 2 0 1 1 0-4 2 2 0 0 1 0 4zm1.7 13H3.6V9h3.4v11.4z" fill="#FFFFFF" /></svg>
          </a>
          <a className="circle-link" data-brand="whatsapp" href="https://wa.me/573144869162" target="_blank" rel="noopener noreferrer" aria-label="WhatsApp">
            <svg className="icon-default" viewBox="0 0 24 24" aria-hidden="true"><path d="M19.05 4.91A9.82 9.82 0 0 0 12 2C6.48 2 2 6.48 2 12c0 1.65.41 3.27 1.18 4.71L2.05 22l5.43-1.43A9.95 9.95 0 0 0 12 22c5.52 0 10-4.48 10-10 0-2.66-1.05-5.18-2.95-7.09z" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" /><path d="M16.83 14.42c-.27-.13-1.6-.79-1.85-.88-.25-.09-.43-.13-.61.13-.18.27-.7.88-.86 1.06-.16.18-.31.2-.58.07-.27-.13-1.14-.42-2.18-1.34-.81-.72-1.35-1.6-1.51-1.87-.16-.27-.02-.42.12-.55.12-.12.27-.31.4-.47.13-.16.18-.27.27-.45.09-.18.04-.34-.02-.47-.07-.13-.61-1.46-.83-2-.22-.53-.45-.45-.61-.46-.16-.01-.34-.01-.52-.01-.18 0-.47.07-.72.34-.25.27-.95.93-.95 2.27 0 1.34.97 2.63 1.11 2.81.13.18 1.91 2.92 4.63 4.09.65.28 1.15.45 1.55.58.65.21 1.24.18 1.7.11.52-.08 1.6-.65 1.83-1.28.22-.63.22-1.17.16-1.28-.07-.11-.25-.18-.52-.31z" fill="currentColor" /></svg>
            <svg className="icon-hover" viewBox="0 0 24 24" aria-hidden="true"><path d="M19.05 4.91A9.82 9.82 0 0 0 12 2C6.48 2 2 6.48 2 12c0 1.65.41 3.27 1.18 4.71L2.05 22l5.43-1.43A9.95 9.95 0 0 0 12 22c5.52 0 10-4.48 10-10 0-2.66-1.05-5.18-2.95-7.09z" fill="none" stroke="#25D366" strokeWidth="1.4" strokeLinejoin="round" /><path d="M16.83 14.42c-.27-.13-1.6-.79-1.85-.88-.25-.09-.43-.13-.61.13-.18.27-.7.88-.86 1.06-.16.18-.31.2-.58.07-.27-.13-1.14-.42-2.18-1.34-.81-.72-1.35-1.6-1.51-1.87-.16-.27-.02-.42.12-.55.12-.12.27-.31.4-.47.13-.16.18-.27.27-.45.09-.18.04-.34-.02-.47-.07-.13-.61-1.46-.83-2-.22-.53-.45-.45-.61-.46-.16-.01-.34-.01-.52-.01-.18 0-.47.07-.72.34-.25.27-.95.93-.95 2.27 0 1.34.97 2.63 1.11 2.81.13.18 1.91 2.92 4.63 4.09.65.28 1.15.45 1.55.58.65.21 1.24.18 1.7.11.52-.08 1.6-.65 1.83-1.28.22-.63.22-1.17.16-1.28-.07-.11-.25-.18-.52-.31z" fill="#25D366" /></svg>
          </a>
        </div>

        {/* DIVERGENTE gigante — mitad recortada al fondo (exhalación final) */}
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
              color: "rgba(0,95,70,0.10)",
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

/* Campo de "miles de datos": números pequeños en rejilla que cubren TODO el
   hero como fondo. Posiciones/valores deterministas (mismo render en servidor
   y cliente → sin mismatch de hidratación). Cada número parpadea intermitente
   de forma independiente (duración/desfase aleatorios). El titileo vive en CSS
   (.mt-data-field / .mt-data-num). */
const HERO_DATA_COLS = 14;
const HERO_DATA_ROWS = 20;

function HeroDataField() {
  const nums = useMemo(() => {
    const rnd = (i: number, a: number, b: number, c: number) =>
      ((i * a + b) % c) / c;
    const cellW = 100 / HERO_DATA_COLS;
    const cellH = 100 / HERO_DATA_ROWS;
    const out: {
      val: string;
      left: string;
      top: string;
      size: string;
      on: string;
      dur: string;
      delay: string;
    }[] = [];
    let i = 0;
    for (let row = 0; row < HERO_DATA_ROWS; row++) {
      for (let col = 0; col < HERO_DATA_COLS; col++) {
        // jitter dentro de la celda → orgánico pero ordenado (cubre todo)
        const jx = (rnd(i, 6151, 1013, 9991) - 0.5) * cellW * 0.8;
        const jy = (rnd(i, 9973, 3119, 9989) - 0.5) * cellH * 0.8;
        const rs = rnd(i, 3457, 7177, 9967);
        const rd = rnd(i, 8009, 2477, 9973);
        const rl = rnd(i, 4259, 911, 9941);
        const ro = rnd(i, 2851, 5023, 9929);
        const digits = 2 + Math.floor(rnd(i, 7717, 401, 7) * 4); // 2–5 dígitos
        let val = "";
        for (let d = 0; d < digits; d++) {
          val += Math.floor(rnd(i * 31 + d, 5237, 17 + d * 13, 9973) * 10);
        }
        out.push({
          val,
          left: ((col + 0.5) * cellW + jx).toFixed(2),
          top: ((row + 0.5) * cellH + jy).toFixed(2),
          size: (15 + rs * 8).toFixed(1), // 15–23px
          on: (0.42 + ro * 0.16).toFixed(3), // opacidad máx ≈0.42–0.58 (~50%)
          dur: (0.6 + rd * 2.2).toFixed(2), // 0.6–2.8s (parpadeo independiente)
          delay: (-rl * 4).toFixed(2), // desfase negativo aleatorio
        });
        i++;
      }
    }
    return out;
  }, []);

  return (
    <div aria-hidden className="mt-data-field">
      {nums.map((n, i) => (
        <span
          key={i}
          className="mt-data-num"
          style={{
            left: `${n.left}%`,
            top: `${n.top}%`,
            fontSize: `${n.size}px`,
            animationDuration: `${n.dur}s`,
            animationDelay: `${n.delay}s`,
            ["--on" as string]: n.on,
          } as React.CSSProperties}
        >
          {n.val}
        </span>
      ))}
    </div>
  );
}

/* Divide el texto en palabras y letras (.title-letter) para el melt/ruido.
   noise=true marca las letras que laten como estática (.mt-noise). */
function renderMeltText(text: string, noise: boolean) {
  return text.split(" ").map((word, wi, arr) => (
    <span key={wi} style={{ whiteSpace: "nowrap", display: "inline-block" }}>
      {word.split("").map((ch, ci) => (
        <span
          key={ci}
          className={`title-letter${noise ? " mt-noise" : ""}`}
          style={{ display: "inline-block", willChange: "transform, opacity, filter" }}
        >
          {ch}
        </span>
      ))}
      {wi < arr.length - 1 && (
        <span aria-hidden style={{ display: "inline-block", width: "0.3em" }}>
          &nbsp;
        </span>
      )}
    </span>
  ));
}

/* Los 3 párrafos del bloque "El Problema" — usados en los 3 demos de interacción */
const DEMO_PARAS = [
  "Nunca tuvimos tanta información. Más datos, más métricas, más dashboards.",
  "Y aun así, los equipos siguen decidiendo desde la urgencia, la reacción y el ruido.",
  "Lo que falta no es información. Es la capacidad de observar con profundidad hacia afuera y hacia adentro.",
] as const;
const DEMO_ACCENT = new Set(["datos", "métricas", "ruido", "observar", "profundidad"]);

/* Las 4 herramientas/pilares — datos compartidos por la secuencia anclada y el
   fallback apilado. `k` es el kicker contemplativo que acompaña al título. */
const HERRAMIENTAS = [
  { t: "Observación", d: "Ver lo que ningún dashboard muestra.", icon: "eye", k: "Mirar afuera y adentro" },
  { t: "Silencio", d: "Bajar el ruido para que aparezca la señal.", icon: "wave", k: "Quitar el ruido" },
  { t: "Meditación", d: "Presencia aplicada a decidir.", icon: "circle", k: "Estar presente" },
  { t: "Creatividad", d: "Revelar el propósito detrás de cada proyecto.", icon: "spark", k: "Crear con sentido" },
] as const;

/* Íconos lineales finos para los 4 pilares */
function PillarIcon({ kind }: { kind: string }) {
  const common = {
    width: 40,
    height: 40,
    viewBox: "0 0 40 40",
    fill: "none",
    stroke: "var(--mt-green)",
    strokeWidth: 1,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };
  if (kind === "eye")
    return (
      <svg {...common} aria-hidden>
        <path d="M4 20s6-9 16-9 16 9 16 9-6 9-16 9S4 20 4 20Z" />
        <circle cx="20" cy="20" r="4.5" />
      </svg>
    );
  if (kind === "wave")
    return (
      <svg {...common} aria-hidden>
        <path d="M4 20c3 0 3-8 6-8s3 16 6 16 3-16 6-16 3 8 6 8 3-4 6-4" />
      </svg>
    );
  if (kind === "circle")
    return (
      <svg {...common} aria-hidden>
        <circle cx="20" cy="20" r="14" />
        <circle cx="20" cy="20" r="3" />
      </svg>
    );
  // spark
  return (
    <svg {...common} aria-hidden>
      <path d="M20 5v9M20 26v9M5 20h9M26 20h9" />
      <circle cx="20" cy="20" r="5" />
    </svg>
  );
}
