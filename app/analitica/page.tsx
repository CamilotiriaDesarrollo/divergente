"use client";

import Image from "next/image";
import React, { useEffect, useRef, useState } from "react";

export default function Analitica() {
  const titleRef        = useRef<HTMLHeadingElement>(null);
  const line2Ref        = useRef<HTMLSpanElement>(null);
  const fixedLogoRef    = useRef<HTMLDivElement>(null);
  const heroRef         = useRef<HTMLElement>(null);
  const noUnderlineRef     = useRef<HTMLSpanElement>(null);
  const siUnderlineRef     = useRef<HTMLSpanElement>(null);
  const accordionSectionRef = useRef<HTMLDivElement>(null);
  const accordionInnerRef   = useRef<HTMLElement>(null);
  const [openCard, setOpenCard] = useState<number | null>(null);
  const [openService, setOpenService] = useState<number | null>(null);
  const [openItem, setOpenItem] = useState<[number, number] | null>(null);
  const [peekCard, setPeekCard] = useState<number | null>(null);
  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== "undefined" ? window.innerWidth <= 768 : false
  );
  const isMobileRef = useRef(typeof window !== "undefined" ? window.innerWidth <= 768 : false);
  const svcCardRefs = useRef<(HTMLDivElement | null)[]>([]);
  const svcPeekedCards = useRef<boolean[]>([false, false, false]);

  useEffect(() => {
    const check = () => {
      const m = window.innerWidth <= 768;
      isMobileRef.current = m;
      setIsMobile(m);
    };
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  useEffect(() => {
    if (isMobile) return;
    const timers = [0, 1, 2].map((i) => setTimeout(() => {
      setPeekCard(i);
    }, 900 + i * 350));
    return () => timers.forEach(clearTimeout);
  }, [isMobile]);


  const CARD_IMAGES = ["/plataformas.gif"];
  const [cardImg, setCardImg] = useState(CARD_IMAGES[0]);
  useEffect(() => {
    if (CARD_IMAGES.length < 2) return;
    const cycle = () => {
      const others = CARD_IMAGES.filter(x => x !== cardImg);
      setCardImg(others[Math.floor(Math.random() * others.length)]);
    };
    const t = setTimeout(cycle, 4000 + Math.random() * 5000);
    return () => clearTimeout(t);
  }, [cardImg]);

  const TW_PHRASES = [
    'input.stream({ source: "realidad", noise: 0.4 })',
    'humans.interpret(data, { empathy })',
    'ai.ask(human, { q: "¿qué necesitas, más allá del dato?" })',
  ];
  const [twLines, setTwLines]   = useState(["", "", ""]);
  const [twIdx, setTwIdx]       = useState(0);
  const [twPhase, setTwPhase]   = useState<"typing" | "waiting" | "clearing">("typing");
  const [twMistake, setTwMistake] = useState<number | null>(null);
  const r = (n: number) => Math.random() * n;

  useEffect(() => {
    let t: ReturnType<typeof setTimeout>;
    const cur = twLines[twIdx] ?? "";

    if (twPhase === "typing") {
      const full = TW_PHRASES[twIdx];
      if (twMistake !== null) {
        if (cur.length > twMistake) {
          t = setTimeout(() => setTwLines(ls => ls.map((l, i) => i === twIdx ? l.slice(0, -1) : l)), 48 + r(32));
        } else {
          setTwMistake(null);
        }
      } else if (cur === full) {
        if (twIdx < 2) {
          t = setTimeout(() => setTwIdx(i => i + 1), 160 + r(120));
        } else {
          t = setTimeout(() => setTwPhase("waiting"), 2200 + r(900));
        }
      } else {
        if (cur.length > 5 && Math.random() < 0.065) {
          t = setTimeout(() => setTwMistake(Math.max(1, cur.length - Math.floor(r(3) + 2))), 120);
        } else {
          t = setTimeout(() => setTwLines(ls => ls.map((l, i) => i === twIdx ? full.slice(0, l.length + 1) : l)), 44 + r(52));
        }
      }
    } else if (twPhase === "waiting") {
      t = setTimeout(() => { setTwPhase("clearing"); setTwIdx(2); }, 350);
    } else {
      if (cur.length > 0) {
        t = setTimeout(() => setTwLines(ls => ls.map((l, i) => i === twIdx ? l.slice(0, -1) : l)), 16 + r(16));
      } else if (twIdx > 0) {
        t = setTimeout(() => setTwIdx(i => i - 1), 70);
      } else {
        t = setTimeout(() => { setTwLines(["", "", ""]); setTwIdx(0); setTwPhase("typing"); }, 380 + r(280));
      }
    }

    return () => clearTimeout(t);
  }, [twLines, twIdx, twPhase, twMistake]);

  useEffect(() => {
    const container  = document.querySelector("[data-scroll-container]") as HTMLElement | null;
    const headerLogo = document.querySelector("[data-header-logo]")      as HTMLElement | null;
    const headerText = document.querySelector("[data-header-text]")      as HTMLElement | null;
    const fixedLogo  = fixedLogoRef.current;

    if (!container || !fixedLogo) return;

    const setStyle = (el: HTMLElement, props: Partial<CSSStyleDeclaration>) =>
      Object.assign(el.style, props);

    // ── Measure header logo destination ──
    const hRect   = headerLogo?.getBoundingClientRect();
    const endLeft = hRect?.left  ?? 32;
    const endTop  = hRect?.top   ?? 22;
    const endSize = hRect?.width ?? 40;

    // ── Start: bottom-left, flush with bottom edge of viewport ──
    const startLeft = endLeft;
    const startTop  = window.innerHeight - endSize - 8;

    // ── Hero height: make section label appear at logo's Y position ──
    const siteHeader = document.querySelector(".site-header") as HTMLElement | null;
    const headerHeight = siteHeader?.offsetHeight ?? 80;
    // py-28 = 7rem; measure actual computed value in case base font size differs
    const rootFontSize = parseFloat(getComputedStyle(document.documentElement).fontSize);
    const sectionPadTop = rootFontSize * 7;
    if (heroRef.current) {
      // Mobile: needs enough scroll space for the line1→line2 crossfade + line2 fade-out
      // to complete BEFORE the accordion enters the viewport.
      // accordion_enters_at = header + heroHeight - viewport > 480 (our fade-out end)
      // → heroHeight > 480 + viewport - header ≈ viewport + 400
      // Using viewport + 560 gives a ~45px safety buffer on all mobile sizes.
      heroRef.current.style.minHeight = isMobileRef.current
        ? `${window.innerHeight + 560}px`
        : `${window.innerHeight - headerHeight + 1300}px`;
    }
    if (accordionInnerRef.current && !isMobileRef.current) {
      accordionInnerRef.current.style.top = `${headerHeight}px`;
    }
    const accordionOffset = (window.innerHeight - headerHeight + 1300) - 450 - headerHeight;
    const PER_CARD   = 600;
    const NUM_CARDS  = 5;
    let lastCardIdx: number | null = -1;

    // Place clone at start, hide real header elements
    setStyle(fixedLogo, {
      position:      "fixed",
      left:          `${startLeft}px`,
      top:           `${startTop}px`,
      width:         `${endSize}px`,
      height:        `${endSize}px`,
      opacity:       "0.25",
      transition:    "none",
      zIndex:        "50",
      pointerEvents: "auto",
    });

    if (headerLogo) setStyle(headerLogo, { opacity: "0", transition: "none" });
    if (headerText) setStyle(headerText, { opacity: "0", transform: "translateY(18px)", transition: "none" });

    const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

    // ── Scroll breakpoints ──
    const LOGO_START  = 20;
    const LOGO_END    = 280;
    const OUT_END      = 200;
    const IN_END       = 460;
    const SLIDE_START  = 700;
    const SLIDE_FACTOR = 2.2;
    const MELT_START   = SLIDE_START + 140;
    const MELT_DUR     = 360;
    const FADE_START   = MELT_START + 60;
    const FADE_DUR     = 260;

    // ── Fijar línea 2 en viewport para que no se corte al scrollear ──
    const line2El = line2Ref.current;
    const h1InitialTop = headerHeight + 20;
    // On mobile, h1 is pushed down by section paddingTop (14vh), so measure it directly
    // so that line2's fixed position matches line1's visual position.
    const titleRect = titleRef.current?.getBoundingClientRect();
    const line2FixedTop = isMobileRef.current && titleRect
      ? Math.round(titleRect.top)
      : h1InitialTop;
    if (line2El) {
      line2El.style.position     = "fixed";
      line2El.style.top          = `${line2FixedTop}px`;
      line2El.style.left         = "0";
      line2El.style.width        = "100%";
      line2El.style.zIndex       = "9";
      line2El.style.opacity      = "1";
      line2El.style.paddingTop   = "0";
      line2El.style.pointerEvents = "none";
    }

    // ── Letras por línea ──
    const allLetters = titleRef.current
      ? Array.from(titleRef.current.querySelectorAll<HTMLElement>(".title-letter"))
      : [];
    const line2Letters = line2El
      ? Array.from(line2El.querySelectorAll<HTMLElement>(".title-letter"))
      : [];
    const line1Letters = allLetters.filter(el => !line2El?.contains(el));

    // Delays ALEATORIOS — letras desaparecen/aparecen dispersas
    const line1Delays = line1Letters.map((_, i) => ((i * 7919 + 2053) % 97) / 97 * 28);
    const line2Delays = line2Letters.map((_, i) => ((i * 6271 + 1049) % 83) / 83 * 110);
    // Últimas 2 letras = "s" + "í" → reciben trato especial en el melt
    const siStart     = line2Letters.length - 2;
    const meltDelays  = line2Letters.map((_, i) => ((i * 3571 + 1337) % 61) / 61 * 90);
    const meltRotate  = line2Letters.map((_, i) => {
      const r = ((i * 5381 + 7013) % 127) / 127;
      return (r - 0.5) * (i >= siStart ? 100 : 300);
    });
    const meltDriftX  = line2Letters.map((_, i) => {
      const r = ((i * 2741 + 4099) % 89) / 89;
      return (r - 0.5) * (i >= siStart ? 40 : 210);
    });
    const meltFallY   = line2Letters.map((_, i) => {
      const r = ((i * 4813 + 997) % 73) / 73;
      return i >= siStart ? -(60 + r * 120) : -40 + r * 180;
    });
    const meltScale   = line2Letters.map((_, i) => {
      const r = ((i * 6143 + 3019) % 101) / 101;
      return i >= siStart ? 4.0 + r * 2.5 : (r < 0.3 ? r * 0.15 : 0.6 + r * 2.4);
    });
    const meltBlur    = line2Letters.map((_, i) => {
      const r = ((i * 1873 + 6271) % 53) / 53;
      return i >= siStart ? 3 + r * 10 : 14 + r * 22;
    });
    const meltFade    = line2Letters.map((_, i) => {
      const r = ((i * 2311 + 5501) % 79) / 79;
      return i >= siStart ? 0.15 + r * 0.35 : 0.6 + r * 1.4;
    });

    // Inicializar letras Line 2 invisibles
    line2Letters.forEach(el => {
      el.style.opacity   = "0";
      el.style.filter    = "blur(14px)";
      el.style.transform = "translateY(18px)";
    });

    const clamp = (v: number) => Math.max(0, Math.min(1, v));

    // ── Underlines ──
    const noLine = noUnderlineRef.current;
    const siLine = siUnderlineRef.current;

    // Una vez que se oculta completamente, no vuelve a aparecer al regresar con scroll
    let noLineGone = false;

    // NO underline: entra desde la izquierda al cargar
    if (noLine) {
      noLine.style.transition = "transform 0.9s cubic-bezier(0.22, 1, 0.36, 1) 0.35s";
      requestAnimationFrame(() => requestAnimationFrame(() => {
        noLine.style.transform = "scaleX(1)";
        setTimeout(() => { if (noLine) noLine.style.transition = "none"; }, 1300);
      }));
    }

    const onScroll = () => {
      const y = container.scrollTop;

      // ── DISSOLVE OUT: Line 1 se difumina hacia abajo ──
      line1Letters.forEach((el, i) => {
        const d = line1Delays[i];
        const p = clamp((y - d) / OUT_END);
        el.style.opacity   = String(1 - p);
        el.style.filter    = `blur(${p * 12}px)`;
        el.style.transform = `translateY(${p * 28}px)`;
      });

      if (isMobileRef.current) {
        // ── MOBILE: Line 2 aparece rápido solapando con Line 1, luego desvanece en su lugar ──
        line2Letters.forEach((el, i) => {
          // 4× faster delays + shorter IN_END so both lines overlap during line1's fade-out
          const d = Math.round(line2Delays[i] * 0.25);
          const p = clamp((y - d) / 120);
          el.style.opacity   = String(p);
          el.style.filter    = `blur(${(1 - p) * 14}px)`;
          el.style.transform = `translateY(${(1 - p) * 18}px)`;
          el.style.color     = "";
        });
        if (line2El) {
          line2El.style.transform = ""; // sin slide en mobile
          // Stay at full opacity until y=500, then fade out over 90px → gone at y=590.
          // Accordion enters viewport at y≈635 (viewport+560 formula), so 45px buffer.
          const mobFadeP = clamp((y - 500) / 90);
          line2El.style.opacity = String(1 - mobFadeP);
        }
      } else if (y < SLIDE_START) {
        // ── DISSOLVE IN: Line 2 emerge letra a letra ──
        line2Letters.forEach((el, i) => {
          const d = line2Delays[i];
          const p = clamp((y - d) / IN_END);
          el.style.opacity   = String(p);
          el.style.filter    = `blur(${(1 - p) * 14}px)`;
          el.style.transform = `translateY(${(1 - p) * 18}px)`;
          el.style.color     = "";
        });
        if (line2El) {
          line2El.style.transform = "";
          line2El.style.opacity   = "1";
        }
      } else {
        // ── SLIDE + MELT + FADE: Line 2 baja, se derrite y se desvanece en sección 2 ──
        line2Letters.forEach((el, i) => {
          const d     = meltDelays[i];
          const meltP = clamp((y - MELT_START - d) / MELT_DUR);
          if (meltP > 0) {
            const sc = 1 + (meltScale[i] - 1) * meltP;
            el.style.transformOrigin = i >= siStart ? "center bottom" : "center center";
            el.style.transform = `translate(${meltDriftX[i] * meltP}px, ${meltFallY[i] * meltP}px) rotate(${meltRotate[i] * meltP}deg) scale(${sc})`;
            el.style.filter    = `blur(${meltBlur[i] * meltP}px)`;
            el.style.opacity   = String(Math.max(0, 1 - meltP * meltFade[i]));
          } else {
            el.style.transformOrigin = "";
            el.style.transform       = "";
            el.style.filter          = "";
            el.style.opacity         = "1";
          }
          el.style.color = "";
        });
        const offset = (y - SLIDE_START) * (SLIDE_FACTOR - 1);
        const fadeP  = clamp((y - FADE_START) / FADE_DUR);
        if (line2El) {
          line2El.style.transform = `translateY(${offset}px)`;
          line2El.style.opacity   = String(1 - fadeP);
        }
      }

      // ── Underline NO: desaparece con Line 1 — una vez oculto, no vuelve ──
      if (noLine && !noLineGone) {
        noLine.style.transition = "none";
        const noPL = clamp(y / (OUT_END + 60));
        noLine.style.opacity   = String(1 - noPL);
        noLine.style.transform = `scaleX(${1 - noPL * 0.4})`;
        if (noPL >= 1) noLineGone = true;
      }

      // ── Underline SÍ: entra mientras "sí" termina de aparecer, persiste hasta el melt ──
      if (siLine) {
        siLine.style.transition = "none";
        if (y < 680) {
          // Entra cuando "sí" termina de aparecer (~y=510–680)
          const siP = clamp((y - 510) / 170);
          siLine.style.transform = `scaleX(${siP})`;
          siLine.style.opacity   = String(siP);
        } else if (y < MELT_START) {
          // Completamente visible durante toda la fase de lectura
          siLine.style.transform = "scaleX(1)";
          siLine.style.opacity   = "1";
        } else {
          // Se desvanece y encoge junto con el melt
          const fadeP = clamp((y - MELT_START) / 220);
          siLine.style.transform = `scaleX(${1 - fadeP * 0.5})`;
          siLine.style.opacity   = String(1 - fadeP);
        }
      }

      // — Logo clone rises from bottom —
      const logoP = Math.max(0, Math.min(1, (y - LOGO_START) / (LOGO_END - LOGO_START)));

      setStyle(fixedLogo, {
        top:  `${lerp(startTop, endTop, logoP)}px`,
        left: `${lerp(startLeft, endLeft, logoP)}px`,
      });

      // — At arrival: real header logo + DIVERGENTE snap in (letters are converging here) —
      const arrivalP = Math.max(0, Math.min(1, (logoP - 0.82) / 0.18));
      if (headerLogo) headerLogo.style.opacity = String(arrivalP);
      if (headerText) {
        headerText.style.opacity   = String(arrivalP);
        headerText.style.transform = `translateY(${(1 - arrivalP) * 18}px)`;
      }

      // — Opacity: 25% at bottom → 75% mid-travel → 0 as header logo takes over —
      fixedLogo.style.opacity = String(logoP < 0.82
        ? lerp(0.25, 0.75, logoP / 0.82)
        : lerp(0.75, 0, arrivalP));

      // ── Accordion: scroll-driven card opening (desktop only) ──
      if (!isMobileRef.current) {
        const rel = y - accordionOffset;
        let nextCard: number | null = null;
        if (rel >= 0 && rel < NUM_CARDS * PER_CARD) {
          nextCard = Math.min(NUM_CARDS - 1, Math.floor(rel / PER_CARD));
        }
        if (nextCard !== lastCardIdx) {
          lastCardIdx = nextCard;
          setOpenCard(nextCard);
        }
      }

    };

    container.addEventListener("scroll", onScroll, { passive: true });

    return () => {
      container.removeEventListener("scroll", onScroll);
      setStyle(fixedLogo, { opacity: "0" });
      if (headerLogo) setStyle(headerLogo, { opacity: "1", transition: "" });
      if (headerText) setStyle(headerText, { opacity: "1", transform: "", transition: "" });
      if (line2El) {
        line2El.style.position      = "";
        line2El.style.top           = "";
        line2El.style.left          = "";
        line2El.style.width         = "";
        line2El.style.zIndex        = "";
        line2El.style.paddingTop    = "";
        line2El.style.pointerEvents = "";
        line2El.style.transform     = "";
        line2El.style.opacity       = "1";
      }
      if (noLine) { noLine.style.transform = "scaleX(1)"; noLine.style.opacity = "1"; noLine.style.transition = ""; }
      if (siLine) { siLine.style.transform = "scaleX(0)"; }
      allLetters.forEach((el) => {
        el.style.opacity         = "1";
        el.style.transform       = "";
        el.style.transformOrigin = "";
        el.style.filter          = "";
        el.style.color           = "";
      });
    };
  }, []);

  return (
    <div className="w-full">

      {/* ── Clon fijo del logo — viaja desde el bottom hasta el header ── */}
      <div ref={fixedLogoRef} style={{ opacity: 0 }}>
        <a href="/" aria-label="Ir al inicio" style={{ display: "block", width: "100%", height: "100%" }}>
          <Image
            src="/logo-analitica.png"
            alt="Divergente — inicio"
            width={96}
            height={96}
            style={{ width: "100%", height: "100%", objectFit: "contain" }}
            priority
          />
        </a>
      </div>

      {/* ── Hero ── */}
      <section
        ref={heroRef}
        className="section-wrap hero-section"
        style={{ display: "flex", alignItems: "flex-start", paddingTop: "18vh" }}
      >
        <h1
          ref={titleRef}
          className="page-title"
          style={{ margin: 0, textTransform: "uppercase", textAlign: "center", width: "100%", fontFamily: "var(--font-montserrat), sans-serif", fontWeight: 400, letterSpacing: "0.04em", position: "relative" }}
        >
          {/* Línea 1 — en flujo, define la altura del h1 */}
          <span className="hero-line hero-line-g1" style={{ display: "block", fontSize: "clamp(2.2rem, 10vw, 15rem)", lineHeight: 1.05, color: "#9488b8" }}>
            {["Los", "datos", "no", "deciden"].map((word, wi, arr) => (
              <span key={wi} className="hero-word" style={{ whiteSpace: "nowrap", display: "inline" }}>
                {wi === 2 ? (
                  <span style={{ display: "inline-block", position: "relative" }}>
                    {word.split("").map((char, ci) => (
                      <span key={ci} className="title-letter" style={{ display: "inline-block", willChange: "opacity, transform, filter" }}>{char}</span>
                    ))}
                    <span ref={noUnderlineRef} style={{
                      position: "absolute", bottom: "-4px", left: 0, width: "100%",
                      height: "3px", background: "#e6a7ff", borderRadius: "2px",
                      transform: "scaleX(0)", transformOrigin: "left center",
                    }} />
                  </span>
                ) : (
                  word.split("").map((char, ci) => (
                    <span key={ci} className="title-letter" style={{ display: "inline-block", willChange: "opacity, transform, filter" }}>{char}</span>
                  ))
                )}
                {wi < arr.length - 1 && <span style={{ display: "inline-block" }}>&nbsp;</span>}
              </span>
            ))}
          </span>
          {/* Línea 2 — superpuesta. "Las PERSONAS" baja un enter, "sí" debajo */}
          <span ref={line2Ref} className="hero-line" style={{ position: "absolute", top: 0, left: 0, width: "100%", textAlign: "center", color: "#e6a7ff", paddingTop: "1.05em", fontSize: "clamp(2.2rem, 10vw, 15rem)" }}>
            {/* "Las PERSONAS" — una línea abajo de Line 1 */}
            <span className="hero-line" style={{ display: "block", fontSize: "clamp(2.2rem, 10vw, 15rem)", lineHeight: 1.05 }}>
              {["Las", "PERSONAS"].map((word, wi, arr) => (
                <span key={wi} className="hero-word" style={{ whiteSpace: "nowrap", display: "inline" }}>
                  {word.split("").map((char, ci) => (
                    <span key={ci} className="title-letter" style={{ display: "inline-block", willChange: "opacity, transform, filter" }}>{char}</span>
                  ))}
                  {wi < arr.length - 1 && <span style={{ display: "inline-block" }}>&nbsp;</span>}
                </span>
              ))}
            </span>
            {/* "sí" — en su propia línea debajo, negrita */}
            <span className="hero-line hero-si" style={{ display: "block", fontSize: "clamp(2.2rem, 10vw, 15rem)", lineHeight: 1.05, fontWeight: 700 }}>
              <span style={{ display: "inline-block", position: "relative" }}>
                {"sí".split("").map((char, ci) => (
                  <span key={ci} className="title-letter" style={{ display: "inline-block", willChange: "opacity, transform, filter" }}>{char}</span>
                ))}
                <span ref={siUnderlineRef} style={{
                  position: "absolute", bottom: "-4px", left: 0, width: "100%",
                  height: "3px", background: "#9488b8", borderRadius: "2px",
                  transform: "scaleX(0)", transformOrigin: "right center",
                }} />
              </span>
            </span>
          </span>
        </h1>
      </section>


      {/* ── Una Mirada Divergente — desktop: scroll-driven sticky; mobile: click-driven vertical ── */}
      <div ref={accordionSectionRef} style={{ marginTop: isMobile ? 0 : "-450px", height: isMobile ? "auto" : "4300px", marginBottom: isMobile ? "3.5rem" : 0 }}>
      <section ref={accordionInnerRef} style={{ height: isMobile ? "auto" : "520px", backgroundColor: "rgba(148, 136, 184, 0.04)", position: isMobile ? "relative" : "sticky", top: isMobile ? "auto" : "80px", overflow: isMobile ? "visible" : "hidden" }}>
        <div style={{ display: "flex", flexDirection: isMobile ? "column" : "row", alignItems: isMobile ? "stretch" : "flex-start", padding: isMobile ? "1.5rem 1.25rem" : "1.5rem 4vw", gap: isMobile ? "0.75rem" : "2rem", height: isMobile ? "auto" : "100%" }}>

          {/* Sidebar — vertical on desktop, compact header on mobile */}
          <div style={{ display: "flex", flexDirection: isMobile ? "column" : "row", gap: isMobile ? "0.1rem" : "1.25rem", flexShrink: 0, alignSelf: isMobile ? "auto" : "stretch", paddingTop: "0.25rem", paddingBottom: isMobile ? "0.5rem" : 0 }}>
            <span className="section-label" style={{ writingMode: isMobile ? "horizontal-tb" : "vertical-rl", transform: isMobile ? "none" : "rotate(180deg)", letterSpacing: "0.18em", alignSelf: isMobile ? "auto" : "flex-end" }}>
              una mirada divergente
            </span>
            <h2 className="section-heading" style={{ writingMode: isMobile ? "horizontal-tb" : "vertical-rl", transform: isMobile ? "none" : "rotate(180deg)", margin: 0, lineHeight: 1.05, alignSelf: isMobile ? "auto" : "flex-end" }}>
              Cómo lo hacemos.
            </h2>
          </div>

          {/* Acordeón */}
          <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", flexDirection: isMobile ? "column" : "row", gap: "0", alignItems: "stretch", height: isMobile ? "auto" : "488px", borderBottom: "1px solid rgba(148,136,184,0.22)" }}>
            {([
              {
                num: "001",
                code: "signals.filter(noise < θ)",
                lines: [
                  <><span style={{ fontWeight: 700 }}>Información</span> por todos lados</>,
                  <><span style={{ fontWeight: 700 }}>Métricas</span> para todo</>,
                  <>Una nueva <span style={{ fontWeight: 700 }}>aplicación</span> cada día</>,
                  <><span style={{ fontWeight: 700 }}>Inteligencia artificial</span> que procesa en segundos</>,
                ],
              },
              {
                num: "002",
                code: "deploy({ ai, platforms })",
                content: (
                  <div style={{ display: "flex", flexDirection: "column", height: isMobile ? "auto" : "100%", gap: "0.75rem" }}>
                    <div style={{ flex: isMobile ? "none" : "0 0 38%", height: isMobile ? "180px" : undefined, borderRadius: "6px", overflow: "hidden" }}>
                      <img src={cardImg} alt="plataformas" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block", opacity: 0.90, transition: "opacity 0.5s ease" }} />
                    </div>
                    <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                      <div style={{ display: "flex", flexDirection: "column", gap: "0.3rem" }}>
                        <p style={{ margin: "0 0 0.75rem", fontFamily: "monospace", fontSize: "18px", color: "var(--copy)", lineHeight: 1.6, textAlign: "center" }}>
                          En Divergente construimos esos sistemas.
                        </p>
                        <div style={{ display: "flex", flexDirection: "column", gap: "0.3rem", textAlign: "center" }}>
                          <p style={{ margin: 0, fontFamily: "monospace", fontSize: "15px", color: "var(--copy)" }}><strong>Desarrollamos</strong> plataformas</p>
                          <p style={{ margin: 0, fontFamily: "monospace", fontSize: "15px", color: "var(--copy)" }}><strong>Investigaciones</strong> y desarrollo</p>
                          <p style={{ margin: 0, fontFamily: "monospace", fontSize: "15px", color: "var(--copy)" }}><strong>Integramos IA</strong> en tu día a día</p>
                        </div>
                      </div>
                      <p style={{ margin: isMobile ? "1rem 0 0" : "0 0 4.5rem", fontFamily: "monospace", fontSize: "18px", fontWeight: 700, color: "var(--mint)", lineHeight: 1.2, textAlign: "center" }}>
                        Sabemos hacerlo y lo hacemos bien.
                      </p>
                    </div>
                  </div>
                ),
              },
              {
                num: "003",
                code: "// insight ≠ raw data",
                content: (
                  <div style={{ display: "flex", flexDirection: "column", height: isMobile ? "auto" : "100%", alignItems: "center", justifyContent: isMobile ? "flex-start" : "flex-end", paddingBottom: isMobile ? 0 : "calc(1.25rem + 50px)", gap: "0.5rem" }}>
                    <div style={{ width: isMobile ? "70%" : "85%", aspectRatio: "1 / 1", overflow: "hidden", flexShrink: 0 }}>
                      <img src="/insight.png" alt="insight" style={{ width: "100%", height: "100%", objectFit: "cover", transform: "scale(1.2)", opacity: 0.65, filter: "invert(0.75) sepia(0.4) hue-rotate(210deg) saturate(0.7) brightness(1.1)" }} />
                    </div>
                    <p style={{ margin: 0, fontFamily: "monospace", fontSize: "20px", fontWeight: 700, color: "var(--copy)", lineHeight: 1.2, textAlign: "center" }}>
                      Pero ahí no está lo esencial.
                    </p>
                  </div>
                ),
              },
              {
                num: "004",
                code: "humans.interpret(data, { empathy })",
                content: (
                  <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", height: isMobile ? "auto" : "100%", gap: "2rem" }}>
                    <p style={{ margin: "20px 0 0", fontFamily: "monospace", fontSize: "18px", color: "#9333EA", lineHeight: 1.5, textAlign: "center" }}>
                      Las decisiones que de verdad mueven una organización no las reemplaza ningún sistema
                    </p>
                    <p style={{ margin: 0, fontFamily: "monospace", fontSize: "18px", color: "#9333EA", lineHeight: 1.5, textAlign: "center" }}>
                      La capacidad humana de <strong>empatizar, de dar sentido y conectar, SÍ.</strong>
                    </p>
                  </div>
                ),
              },
              {
                num: "005",
                code: "observe({ deep: true, present: true })",
                content: (
                  <div style={{ display: "flex", flexDirection: "column", justifyContent: isMobile ? "flex-start" : "space-between", height: isMobile ? "auto" : "100%", padding: "0.5rem 0", gap: isMobile ? "1rem" : 0 }}>
                    <p style={{ margin: 0, fontFamily: "monospace", fontSize: "18px", color: "var(--copy)", textAlign: "center", lineHeight: 1.5 }}>
                      Desde ahí trabajamos.
                    </p>
                    <p style={{ margin: 0, fontFamily: "monospace", fontSize: "18px", color: "var(--copy)", textAlign: "center", lineHeight: 1.6 }}>
                      No desde el <strong>dato crudo,</strong> sino desde la <strong>observación profunda.</strong><br/><br/><strong>Conectando lo racional con lo creativo, lo medible con lo humano.</strong>
                    </p>
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                      <p style={{ margin: 0, fontFamily: "monospace", fontSize: "18px", color: "var(--copy)", textAlign: "center", lineHeight: 1.5 }}>
                        Leyendo lo que ningún dashboard muestra.
                      </p>
                      <p style={{ margin: 0, fontFamily: "monospace", fontSize: "18px", color: "var(--copy)", textAlign: "center", lineHeight: 1.6 }}>
                        Las emociones, la intuición, los patrones que aparecen cuando uno aprende a estar presente, aquí y ahora.
                      </p>
                    </div>
                  </div>
                ),
              },
            ] as { num: string; code: string; content?: React.ReactNode; lines?: React.ReactNode[]; hasImage?: boolean }[]).map((card, i) => {
              const isOpen = openCard === i;
              return (
                <div
                  key={card.num}
                  onClick={() => setOpenCard(isOpen ? null : i)}
                  style={{
                    flex: isMobile
                      ? (isOpen ? "0 0 460px" : "0 0 52px")
                      : (isOpen ? "0 0 400px" : "0 0 56px"),
                    width: isMobile ? "100%" : undefined,
                    transition: "flex 0.45s cubic-bezier(0.4, 0, 0.2, 1)",
                    borderRadius: 0,
                    backgroundColor: isOpen ? "rgba(148,136,184,0.05)" : "transparent",
                    borderRight: isMobile ? "none" : (i < 4 ? "1px solid rgba(148,136,184,0.15)" : "none"),
                    borderBottom: isMobile && i < 4 ? "1px solid rgba(148,136,184,0.15)" : "none",
                    borderLeft: isOpen ? "2px solid rgba(230,167,255,0.35)" : "none",
                    overflow: "hidden",
                    cursor: "pointer",
                    position: "relative",
                    backdropFilter: isOpen ? "blur(8px)" : "none",
                  }}
                >
                  {/* Fondo imagen card 004 */}
                  {i === 3 && (<>
                    <div style={{
                      position: "absolute",
                      inset: 0,
                      backgroundImage: "url('/bg-card004.png')",
                      backgroundSize: "cover",
                      backgroundPosition: "center",
                      opacity: 0.18,
                      filter: "hue-rotate(220deg) saturate(0.6) brightness(1.05)",
                      pointerEvents: "none",
                    }} />
                    <div style={{
                      position: "absolute",
                      inset: 0,
                      background: "linear-gradient(135deg, rgba(230,167,255,0.18) 0%, rgba(148,136,184,0.22) 50%, rgba(246,243,255,0.3) 100%)",
                      pointerEvents: "none",
                    }} />
                  </>)}
                  {/* Etiqueta colapsada */}
                  <div style={{
                    position: "absolute",
                    inset: 0,
                    display: "flex",
                    flexDirection: isMobile ? "row" : "column",
                    alignItems: "center",
                    padding: isMobile ? "0 1rem" : "1.25rem 0",
                    gap: "0.75rem",
                    opacity: isOpen ? 0 : 1,
                    transition: "opacity 0.15s",
                    pointerEvents: isOpen ? "none" : "auto",
                    overflow: "hidden",
                  }}>
                    {isMobile ? (
                      <>
                        <span style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "13px", fontWeight: 700, color: "#9333EA", opacity: 0.55, flexShrink: 0 }}>
                          {card.num}
                        </span>
                        <code style={{ fontFamily: "monospace", fontSize: "0.7rem", color: "#9488b8", opacity: 0.7, flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", padding: "0 0.5rem" }}>
                          {card.code}
                        </code>
                        <span style={{ color: "#9333EA", opacity: isOpen ? 0 : 0.72, fontSize: "22px", flexShrink: 0, lineHeight: 1, transition: "transform 0.3s, opacity 0.3s", transform: isOpen ? "rotate(90deg)" : "none", fontWeight: 300 }}>›</span>
                      </>
                    ) : (
                      <>
                        <code style={{
                          writingMode: "vertical-rl",
                          transform: "rotate(180deg)",
                          fontFamily: "monospace",
                          fontSize: "0.65rem",
                          color: "#9488b8",
                          opacity: 0.65,
                          flex: 1,
                          overflow: "hidden",
                          whiteSpace: "nowrap",
                          display: "block",
                        }}>
                          {card.code}
                        </code>
                        <span style={{
                          fontFamily: "var(--font-montserrat), sans-serif",
                          fontSize: "26px",
                          fontWeight: 700,
                          color: "#9333EA",
                          opacity: 0.30,
                          marginBottom: "0.5rem",
                          writingMode: "vertical-rl",
                          transform: "rotate(180deg)",
                          letterSpacing: "-0.02em",
                          lineHeight: 1,
                        }}>
                          {card.num}
                        </span>
                      </>
                    )}
                  </div>

                  {/* Contenido expandido */}
                  <div style={{
                    position: "relative",
                    zIndex: 1,
                    padding: "1.4rem",
                    height: "100%",
                    display: "flex",
                    flexDirection: "column",
                    gap: "0.9rem",
                    opacity: isOpen ? 1 : 0,
                    transition: "opacity 0.25s ease 0.1s",
                    pointerEvents: isOpen ? "auto" : "none",
                    minWidth: 0,
                    overflow: "hidden",
                    boxSizing: "border-box",
                  }}>
                    {/* Mobile: cabecera con número, código y flecha para cerrar */}
                    {isMobile && (
                      <div style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "0.5rem",
                        flexShrink: 0,
                        paddingBottom: "0.5rem",
                        borderBottom: "1px solid rgba(148,136,184,0.18)",
                      }}>
                        <span style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "13px", fontWeight: 700, color: "#9333EA", opacity: 0.55, flexShrink: 0 }}>
                          {card.num}
                        </span>
                        <code style={{ fontFamily: "monospace", fontSize: "0.68rem", color: "#9488b8", opacity: 0.6, flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {card.code}
                        </code>
                        <span style={{ color: "#9333EA", opacity: 0.7, fontSize: "20px", fontWeight: 300, flexShrink: 0, lineHeight: 1 }}>∧</span>
                      </div>
                    )}
                    {/* Número fantasma de fondo */}
                    <span style={{
                      position: "absolute",
                      right: "0.5rem",
                      bottom: "0.5rem",
                      fontFamily: "var(--font-montserrat), sans-serif",
                      fontSize: "4.5rem",
                      fontWeight: 700,
                      color: "#9488b8",
                      opacity: 0.05,
                      lineHeight: 1,
                      userSelect: "none",
                      pointerEvents: "none",
                    }}>
                      {card.num}
                    </span>
                    {card.hasImage && (
                      <div style={{ width: "100%", aspectRatio: "16/9", borderRadius: "8px", border: "1px dashed rgba(148,136,184,0.3)", backgroundColor: "rgba(148,136,184,0.06)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        {/* GIF: pon el archivo en /public y reemplaza con:
                            <img src="/tu-archivo.gif" alt="..." style={{ width:"100%", borderRadius:"8px", objectFit:"cover" }} /> */}
                        <span style={{ fontSize: "0.6rem", color: "#9488b8", opacity: 0.45, textAlign: "center", padding: "0.5rem" }}>
                          gif → /public/archivo.gif
                        </span>
                      </div>
                    )}
                    {card.lines ? (
                      <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-evenly", flex: 1 }}>
                        {card.lines.map((line, li) => (
                          <p key={li} style={{
                            margin: 0,
                            fontFamily: "monospace",
                            fontSize: "18px",
                            lineHeight: 1.45,
                            color: "var(--copy)",
                            textAlign: "center",
                          }}>
                            {line}
                          </p>
                        ))}
                      </div>
                    ) : (
                      <div style={{ margin: 0, fontFamily: "monospace", fontSize: "0.8rem", lineHeight: 1.7, color: "var(--copy)", flex: 1, minHeight: 0 }}>
                        {card.content}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
            {/* Espacio derecho con imagen de fondo — solo en desktop */}
            {!isMobile && (
            <div style={{
              flex: 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              minWidth: "80px",
              position: "relative",
              overflow: "hidden",
              paddingBottom: "30%",
            }}>
              <div style={{
                position: "absolute",
                top: 0, left: 0, right: 0, bottom: "-40%",
                backgroundImage: "url('/bg-analitica.png')",
                backgroundSize: "auto 88%",
                backgroundPosition: "50% 100%",
                backgroundRepeat: "no-repeat",
                opacity: 0.55,
                filter: "grayscale(0.2) hue-rotate(220deg) saturate(1.2) brightness(0.85)",
                WebkitMaskImage: "linear-gradient(to bottom, transparent 0%, black 25%)",
                maskImage: "linear-gradient(to bottom, transparent 0%, black 25%)",
              }} />
              <div style={{ position: "relative", zIndex: 1, display: "flex", flexDirection: "column", gap: "0.6rem" }}>
                <style>{`@keyframes blink { 0%,100%{opacity:1} 50%{opacity:0} }`}</style>
                {twLines.map((line, i) => {
                  const showCursor = i === twIdx && twPhase !== "waiting";
                  const lineActive = i === twIdx;
                  return (
                    <div key={i} style={{ display: "flex", alignItems: "baseline" }}>
                      <span style={{
                        fontFamily: "monospace",
                        fontSize: "clamp(1rem, 1.4vw, 1.5rem)",
                        color: lineActive ? "#9333EA" : "rgba(147,51,234,0.55)",
                        letterSpacing: "0.02em",
                        whiteSpace: "nowrap",
                        transition: "color 0.2s",
                      }}>
                        {line}
                        {showCursor && (
                          <span style={{ borderRight: "2px solid #9333EA", marginLeft: "1px", animation: "blink 0.75s step-end infinite" }}>&nbsp;</span>
                        )}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
            )}
          </div>
          {/* Bloque de código + imagen — mobile: debajo de los paneles */}
          {isMobile && (
            <div style={{
              position: "relative",
              minHeight: "280px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              borderTop: "1px solid rgba(148,136,184,0.12)",
              marginTop: "0.25rem",
              overflow: "hidden",
            }}>
              {/* Imagen yoga de fondo */}
              <div style={{
                position: "absolute",
                inset: 0,
                bottom: "-30%",
                backgroundImage: "url('/bg-analitica.png')",
                backgroundSize: "auto 90%",
                backgroundPosition: "50% 100%",
                backgroundRepeat: "no-repeat",
                opacity: 0.50,
                filter: "grayscale(0.2) hue-rotate(220deg) saturate(1.2) brightness(0.85)",
                WebkitMaskImage: "linear-gradient(to bottom, transparent 0%, black 30%)",
                maskImage: "linear-gradient(to bottom, transparent 0%, black 30%)",
              }} />
              {/* Typewriter code */}
              <div style={{ position: "relative", zIndex: 1, display: "flex", flexDirection: "column", gap: "0.55rem", padding: "2rem 1.25rem 1.5rem" }}>
                {twLines.map((line, i) => {
                  const showCursor = i === twIdx && twPhase !== "waiting";
                  const lineActive = i === twIdx;
                  return (
                    <div key={i} style={{ display: "flex", alignItems: "baseline" }}>
                      <span style={{
                        fontFamily: "monospace",
                        fontSize: "clamp(0.68rem, 3.2vw, 0.95rem)",
                        color: lineActive ? "#9333EA" : "rgba(147,51,234,0.55)",
                        letterSpacing: "0.02em",
                        whiteSpace: "nowrap",
                        transition: "color 0.2s",
                      }}>
                        {line}
                        {showCursor && (
                          <span style={{ borderRight: "2px solid #9333EA", marginLeft: "1px", animation: "blink 0.75s step-end infinite" }}>&nbsp;</span>
                        )}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
          </div>

        </div>
      </section>
      </div>


      {/* ── Servicios ── */}
      <section className="py-28" style={{ background: "linear-gradient(135deg, #0d0d1a 0%, #1a0a2e 40%, #0a1a1a 100%)", position: "relative", overflow: "hidden" }}>
        <style>{`
          .svc-card { height: 480px; perspective: 1200px; cursor: pointer; }
          .svc-card-inner {
            position: relative; width: 100%; height: 100%;
            transform-style: preserve-3d;
            transition: transform 0.65s cubic-bezier(0.4, 0, 0.2, 1);
          }
          .svc-card.is-flipped .svc-card-inner { transform: rotateY(180deg); }
          .svc-card-front, .svc-card-back {
            position: absolute; inset: 0;
            backface-visibility: hidden; -webkit-backface-visibility: hidden;
            border-radius: 16px; overflow: hidden;
          }
          .svc-card-front { border: 1px solid rgba(148,136,184,0.16); transition: border-color 0.4s ease; }
          .svc-card-back { pointer-events: none; }
          .svc-card.is-flipped .svc-card-front { pointer-events: none; }
          .svc-card.is-flipped .svc-card-back { pointer-events: auto; }
          .svc-card-back {
            border: 1px solid rgba(150,110,220,0.3);
            background: #d8c8f4;
            box-shadow: 0 0 40px rgba(100,60,200,0.12);
            transform: rotateY(180deg);
            padding: 1.5rem;
            display: flex; flex-direction: column;
            overflow-y: auto;
          }
          .svc-item-row {
            padding: 0.55rem 0.5rem;
            border-bottom: 1px solid rgba(100,70,180,0.15);
            cursor: pointer;
            text-align: center;
            transition: background 0.2s ease, padding-left 0.25s ease;
            border-radius: 6px;
          }
          .svc-item-row:last-child { border-bottom: none; }
          @media (hover: hover) {
            .svc-item-row:hover { background: rgba(120,80,200,0.1); padding-left: 1rem; }
          }
          .svc-para { opacity: 0.45; }
          .svc-action { opacity: 1; transition: opacity 0.4s ease; }
          .svc-flip-arrow { animation: svc-arrow-glow 2.2s ease-in-out infinite alternate; }
          .svc-vuelve { order: -1; padding-top: 0; padding-bottom: 0.75rem; border-bottom: 1px solid rgba(100,70,180,0.2); }
          .svc-vuelve-arrow { animation: svc-vuelve-glow 2.2s ease-in-out infinite alternate; }
          @media (hover: hover) {
            .svc-card:hover .svc-card-front { border-color: rgba(147,51,234,0.3); }
          }
          @keyframes card-peek {
            0%   { transform: rotateY(0deg); }
            35%  { transform: rotateY(42deg); }
            70%  { transform: rotateY(40deg); }
            100% { transform: rotateY(0deg); }
          }
          @keyframes svc-arrow-glow {
            from { text-shadow: 0 0 6px rgba(145,254,230,0.6); filter: brightness(1); }
            to   { text-shadow: 0 0 20px rgba(145,254,230,1), 0 0 40px rgba(147,51,234,0.55); filter: brightness(1.35); }
          }
          @keyframes svc-vuelve-glow {
            from { text-shadow: 0 0 6px rgba(147,51,234,0.6); filter: brightness(1); }
            to   { text-shadow: 0 0 20px rgba(147,51,234,1), 0 0 40px rgba(100,40,200,0.55); filter: brightness(1.35); }
          }
          .svc-card-inner.is-peeking {
            animation: card-peek 0.9s cubic-bezier(0.4, 0, 0.2, 1) forwards;
            transition: none !important;
          }
          .svc-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1.25rem; }
          @media (max-width: 1023px) {
            .svc-grid { grid-template-columns: 1fr; gap: 1rem; }
            .svc-card { height: 500px !important; }
            .svc-card.is-flipped { height: 640px !important; }
            .svc-card.is-flipped.has-item { height: 1100px !important; }
          }
          @media (max-width: 768px) {
            /* Fixed card — same visual size on every mobile screen */
            .svc-card,
            .svc-card.is-flipped,
            .svc-card.is-flipped.has-item { height: 460px !important; transition: none !important; }

            /* GPU hints */
            .svc-card-front { -webkit-transform: translateZ(0.01px); }
            .svc-card-back {
              background-color: #d8c8f4 !important;
              -webkit-transform: rotateY(180deg) translateZ(0.01px) !important;
              overflow-y: auto; -webkit-overflow-scrolling: touch;
              padding: 1rem !important;
            }

            /* Typography scales with viewport so all text fits the fixed card */
            .svc-para { overflow: hidden; align-items: flex-start !important; }
            .svc-para-inner {
              font-size: clamp(0.58rem, 2.9vw, 0.78rem) !important;
              line-height: 1.6 !important;
              gap: 0.45rem !important;
            }

            /* Interactive affordances — mobile overrides only */
            .svc-vuelve-arrow { font-size: 1.6rem !important; }
            .svc-item-name { font-size: 18px !important; text-align: left !important; }
            .svc-item-row { border-bottom: 1.5px solid rgba(147,51,234,0.28) !important; padding: 0.75rem 0.5rem !important; }
            .svc-item-row:last-child { border-bottom: none !important; }
            .svc-item-row:active { background: rgba(147,51,234,0.1); transition: none; }
            .svc-item-chevron { font-size: 1.3rem !important; color: #9333EA !important; opacity: 0.8 !important; }
          }
        `}</style>
        <div style={{ position: "absolute", inset: 0, backgroundImage: "radial-gradient(ellipse at 20% 50%, rgba(147,51,234,0.12) 0%, transparent 60%), radial-gradient(ellipse at 80% 20%, rgba(145,254,230,0.07) 0%, transparent 50%)", pointerEvents: "none" }} />
        <div className="section-wrap" style={{ position: "relative", zIndex: 1 }}>
          <h2 style={{ fontFamily: "var(--font-eastman)", fontSize: "clamp(2rem, 3.5vw, 3.5rem)", fontWeight: 400, textTransform: "uppercase", color: "var(--mint)", textAlign: "center", letterSpacing: "0.03em", lineHeight: 1, marginBottom: "3rem" }}>
            Cómo nos gusta servir
          </h2>
          <div className="svc-grid">
            {([
              {
                num: "01",
                label: "Investigación aplicada",
                paragraph: "Hacemos investigación de otra forma. Combinamos métodos rigurosos de las ciencias sociales con herramientas que la academia tradicional rara vez integra: prácticas contemplativas, dibujo, pintura, sonido, danza, escucha profunda y cocreación.\n\nNo son adornos, son dispositivos metodológicos que nos permiten leer realidades que las encuestas no capturan y procesar la información desde lugares más vivos.\n\nTenemos metodologías propias de interpretación, construidas durante años de práctica, y son lo que diferencia el resultado de un estudio en Divergente de cualquier informe estándar.",
                items: [
                  { name: "Estudios de mercado y cualitativos", image: "/svc/estudios de mercado.png", paragraph: "Investigamos lo que pasa en tu sector más allá de las cifras.\n\nCombinamos métodos cuantitativos, cualitativos y herramientas divergentes. Desde la **Co Creación** hasta la **observación contemplativa**, en espacios que buscan apertura, para entender más allá de los datos crudos." },
                  { name: "Entrevistas y grupos focales", image: "/svc/Entrevistas y grupos.png", paragraph: "**Conversamos. Escuchamos.**\n\nFacilitamos espacios donde las personas se sientan en la libertad de decir lo que las encuestas no capturan, incorporando prácticas **Divergentes** para ello, **escucha profunda** y **espacios creativos.**" },
                  { name: "Encuestas", desc: "presenciales y virtuales", image: "/svc/Encuestas.png", paragraph: "**Diseñamos instrumentos a la medida** y los interpretamos con metodologías **Divergentes** que cruzan el dato cuantitativo con lecturas contemplativas.\n\nNo entregamos planillas con porcentajes, entregamos lectura humana de lo que tus públicos están **diciendo, sintiendo y esperando de ti.**" },
                  { name: "Estudios de Impacto", image: "/svc/Estudios de impacto.png", paragraph: "Medimos lo que un asistente se lleva después de vivir una **experiencia o evento contigo**.\n\nPara llegar a esa profundidad usamos herramientas que vienen del arte, la observación consciente y la cocreación.\n\nPorque el **impacto real ocurre en las personas**, y solo se **lee con sensibilidad humana.**" },
                  { name: "Gestión de Conocimiento", image: "/svc/Gestion conocimiento.png", paragraph: "**No replicamos modelos estándar.**\n\nConstruimos sistemas a la medida para gestionar el conocimiento que emerge, sistematizar ideas y estructurar saberes que **muchas veces se pierden en el día a día**.\n\nIntegramos lo cuantitativo, lo cualitativo y lo contemplativo para que tu organización comprenda, comunique y actúe desde un lugar más profundo." },
                ],
              },
              {
                num: "02",
                label: "Desarrollos digitales",
                paragraph: "Desarrollamos tecnología pensando primero en las personas.\n\nAntes de escribir una línea de código, observamos. Conversamos con quienes van a usar la solución, mapeamos sus formas de trabajar, decidir y sentir frente a la tecnología.\n\nCombinamos prácticas de cocreación, dibujo y prototipado vivo con metodologías propias de diseño centrado en lo humano. Por eso lo que construimos no se siente como otra herramienta más: se siente como algo que pertenece a quien lo usa.",
                items: [
                  { name: "Desarrollo de apps", image: "/svc/APP.png", paragraph: "Construimos aplicaciones móviles pensadas desde quien las va a usar.\n\nAntes de programar, prototipamos con dinámicas de cocreación y observación profunda para entender cómo viven, deciden y se mueven las personas.\n\nLa mejor app es la que se siente **natural**, la que desaparece y deja solo la **experiencia**." },
                  { name: "Desarrollo de plataformas web", image: "/svc/WEB.png", paragraph: "Diseñamos y desarrollamos plataformas web a la medida, desde sitios institucionales hasta sistemas complejos de gestión.\n\nCada proyecto parte de una **pregunta humana** antes que técnica: qué necesita resolver, sentir o lograr la persona que entra acá." },
                  { name: "Plataformas interactivas", paragraph: "Creamos experiencias digitales que cruzan formatos: web, audio, video, narrativa transmedia, interacción.\n\nIntegramos lenguajes del arte, el sonido y el diseño contemplativo para construir plataformas que no solo informan, sino que **emocionan, educan y transforman** a quien las habita." },
                  { name: "Soluciones digitales a la medida", paragraph: "Construimos software, sistemas de información y arquitecturas tecnológicas para necesidades específicas que ninguna herramienta del mercado resuelve.\n\nCada solución parte de una **observación cuidadosa** de cómo trabaja tu equipo y aplica metodologías propias de gestión del conocimiento.\n\nPara que la tecnología se adapte a las personas, **no al revés.**" },
                ],
              },
              {
                num: "03",
                label: "Inteligencia artificial aplicada",
                paragraph: "La IA es una herramienta, no un fin.\n\nEn Divergente la usamos para liberar la capacidad humana en lo importante: pensar, decidir, crear, sentir.\n\nNo vendemos IA por moda ni por reemplazar personas. La integramos con criterio, con propósito y con una mirada **Divergente** que combina lo técnico con lo humano, lo automatizado con lo consciente. Porque incluso la tecnología más avanzada necesita una pregunta humana detrás para tener sentido.",
                items: [
                  { name: "Soluciones basadas en IA", paragraph: "Diseñamos e implementamos soluciones de inteligencia artificial específicas para tu organización. Desde automatización de procesos hasta agentes y asistentes.\n\nCada solución parte de una **pregunta concreta de tu negocio** y se construye para que la tecnología sea un apoyo real, no una capa adicional de complejidad." },
                  { name: "Analítica de datos con IA", paragraph: "Usamos IA para procesar volúmenes de datos que ningún equipo humano podría abordar solo, pero la interpretación final **siempre es humana**.\n\nLa IA encuentra los patrones; nosotros, con metodologías propias de lecturas **Divergentes**, les damos sentido.\n\nPorque los datos no deciden. **Las personas sí.**" },
                  { name: "Adopción de IA", paragraph: "Acompañamos a organizaciones a entender qué IA necesitan, cuál no, y cómo adoptarla sin perder la **esencia humana** de su trabajo.\n\nDiagnosticamos procesos, formamos equipos y diseñamos rutas de implementación realistas.\n\nLa IA bien adoptada **potencia a las personas**; mal adoptada, las desplaza. Nosotros trabajamos para lo primero." },
                ],
              },
            ] as { num: string; label: string; bgImage?: string; paragraph?: string; items: { name: string; desc?: string; paragraph?: string; image?: string }[] }[]).map((card, i) => (
              <div key={card.num} ref={el => { svcCardRefs.current[i] = el; }}
                className={`svc-card${openService === i ? " is-flipped" : ""}${openItem?.[0] === i ? " has-item" : ""}`}
                style={{ height: openService === i ? (openItem?.[0] === i ? "960px" : "560px") : "480px", transition: "height 0.45s cubic-bezier(0.4,0,0.2,1)" }}
                onClick={() => {
                  if (openService !== i) {
                    setOpenService(i);
                  } else if (isMobile) {
                    setOpenService(null);
                    setOpenItem(null);
                  }
                }}
                onMouseEnter={() => { if (!isMobile && openService !== i && peekCard === null) { setPeekCard(i); } }}>
                <div className={`svc-card-inner${peekCard === i && openService !== i ? " is-peeking" : ""}`}
                  onAnimationEnd={() => setPeekCard(null)}>
                  {/* FRENTE */}
                  <div className="svc-card-front">
                    {card.bgImage && <div style={{ position: "absolute", inset: 0, backgroundImage: `url('${card.bgImage}')`, backgroundSize: "cover", backgroundPosition: "center", opacity: 0.28, filter: "grayscale(0.2) hue-rotate(220deg) saturate(1.1)" }} />}
                    <div style={{ position: "absolute", inset: 0, background: "linear-gradient(135deg, rgba(10,4,22,0.92) 0%, rgba(26,10,48,0.6) 100%)" }} />
                    <div style={{ position: "relative", zIndex: 1, display: "flex", gap: isMobile ? "0.6rem" : "1.5rem", height: "100%", padding: isMobile ? "1.1rem" : "2rem" }}>
                      <div style={{ display: "flex", alignItems: "center" }}>
                        <h3 style={{ fontFamily: "var(--font-eastman)", fontSize: isMobile ? "1rem" : "clamp(1.4rem, 2vw, 2rem)", fontWeight: 400, textTransform: "uppercase", color: "var(--mint)", margin: 0, lineHeight: 1.05, letterSpacing: "0.03em", writingMode: "vertical-rl", transform: "rotate(180deg)" }}>{card.label}</h3>
                      </div>
                      <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
                        <div style={{ display: "flex", justifyContent: "flex-end", paddingBottom: "0.6rem" }}>
                          <span className="svc-action" style={{ fontFamily: "var(--font-montserrat)", letterSpacing: "0.04em", color: "var(--mint)", display: "flex", alignItems: "center", gap: "0.3rem" }}><span className="svc-flip-arrow" style={{ fontSize: "1.6rem" }}>↺</span><span style={{ fontSize: "0.82rem" }}>dale la vuelta</span></span>
                        </div>
                        <div className="svc-para" style={{ flex: 1, display: "flex", alignItems: "center" }}>
                          {card.paragraph && <div className="svc-para-inner" style={{ fontFamily: "var(--font-montserrat)", fontSize: "0.85rem", color: "rgba(245,245,240,0.85)", lineHeight: 1.8, display: "flex", flexDirection: "column", gap: "0.75rem" }}>{card.paragraph.split("\n\n").map((p, k) => <p key={k} style={{ margin: 0 }}>{p.split("**").map((part, pi) => pi % 2 === 1 ? <strong key={pi}>{part}</strong> : part)}</p>)}</div>}
                        </div>
                      </div>
                    </div>
                  </div>
                  {/* REVERSO */}
                  <div className="svc-card-back">
                    <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
                      {card.items.map((item, j) => {
                        const isItemOpen = openItem?.[0] === i && openItem?.[1] === j;
                        return (
                          <div
                            key={j}
                            className={`svc-item-row`}
                            style={{ position: "relative", overflow: "hidden" }}
                            onClick={(e) => { e.stopPropagation(); setOpenItem(isItemOpen ? null : [i, j]); }}
                          >
                            {/* Título */}
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0 0.25rem" }}>
                              <p className="svc-item-name" style={{ margin: 0, fontFamily: "var(--font-eastman)", fontSize: "18px", fontWeight: 400, color: isItemOpen ? "#9333EA" : "#7040a8", lineHeight: 1.3, transition: "color 0.25s ease", textAlign: "center", letterSpacing: "0.02em" }}>{item.name}</p>
                              <span className="svc-item-chevron" style={{ color: "#8b78b8", fontSize: "1rem", flexShrink: 0, marginLeft: "0.5rem", transition: "transform 0.3s ease", display: "inline-block", transform: isItemOpen ? "rotate(180deg)" : "rotate(0deg)" }}>▾</span>
                            </div>
                            {/* Panel expandido */}
                            <div style={{ overflow: "hidden", maxHeight: isItemOpen ? "1200px" : "0", opacity: isItemOpen ? 1 : 0, transition: "max-height 0.65s cubic-bezier(0.4,0,0.2,1), opacity 0.3s ease" }}>
                              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.75rem", padding: "0.6rem 0.5rem 0.85rem" }}>
                                {item.image && (
                                  <img src={item.image} alt={item.name} style={{ width: "100%", height: "auto", display: "block", borderRadius: "8px", filter: "grayscale(1) sepia(1) hue-rotate(230deg) saturate(2) brightness(1.05)", opacity: 0.50 }} />
                                )}
                                {item.paragraph ? (
                                  <div style={{ display: "flex", flexDirection: "column", gap: "0.55rem" }}>
                                    {item.paragraph.split("\n\n").map((p, k) => (
                                      <p key={k} style={{ margin: 0, fontFamily: "var(--font-montserrat)", fontSize: "0.78rem", color: "#6a50a0", lineHeight: 1.75, textAlign: k === 0 ? "center" : "left" }}>
                                        {p.split("**").map((part, pi) => pi % 2 === 1 ? <strong key={pi}>{part}</strong> : part)}
                                      </p>
                                    ))}
                                  </div>
                                ) : (
                                  <p style={{ margin: 0, fontFamily: "var(--font-montserrat)", fontSize: "0.78rem", color: "#a49abd", fontStyle: "italic", textAlign: "center" }}>Contenido próximamente.</p>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    <div className="svc-vuelve" style={{ display: "flex", justifyContent: "flex-end", paddingTop: 0, cursor: "pointer" }}
                      onClick={(e) => { e.stopPropagation(); setOpenService(null); setOpenItem(null); }}>
                      <span className="svc-vuelve-arrow" style={{ fontFamily: "var(--font-montserrat)", fontSize: "1.1rem", color: "#8b7ab8", fontWeight: 700 }}>↻</span>
                      <span style={{ fontFamily: "var(--font-montserrat)", fontSize: "0.8rem", fontWeight: 700, color: "#8b7ab8", letterSpacing: "0.04em", marginLeft: "0.3rem", alignSelf: "center" }}>Vuelve</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Por Qué Divergente ── */}
      <section className="py-28" style={{ background: "#f0ecff", position: "relative", overflow: "hidden" }}>
        {/* imagen con colores naturales — anclada al fondo para mostrar la mujer con el canasto */}
        <div style={{ position: "absolute", inset: 0, backgroundImage: "url('/svc/tecnologia%20con%20proposito.png')", backgroundSize: "cover", backgroundPosition: "68% bottom", opacity: 0.58, filter: "brightness(1.06) saturate(1.15)", zIndex: 0, pointerEvents: "none" }} />
        {/* velo en el lado del texto */}
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(95deg, rgba(240,236,255,0.9) 0%, rgba(240,236,255,0.6) 45%, rgba(240,236,255,0.08) 100%)", zIndex: 0, pointerEvents: "none" }} />
        <div className="section-wrap" style={{ position: "relative", zIndex: 1 }}>
          <span className="section-label" style={{ color: "#9333ea" }}>Por qué Divergente</span>
          <h2 className="section-heading">Tecnología con propósito humano.</h2>
          <div className="body-copy" style={{ display: "flex", flexDirection: "column", gap: "1.25rem", maxWidth: "44rem", color: "#2a1250" }}>
            <p>Construimos apps, plataformas web, soluciones digitales e inteligencia artificial para que las personas hagan lo que solo las personas pueden hacer:</p>
            <p><strong>Pensar, Decidir, Crear, Sentir.</strong></p>
            <p>Automatizamos lo repetitivo, integramos lo complejo y diseñamos arquitecturas que liberan tiempo, energía y atención para que tu equipo se dedique a lo importante.</p>
            <p className="italic" style={{ color: "#4a2d72" }}>La tecnología no está aquí para reemplazarnos. Está aquí para devolvernos a lo humano.</p>
          </div>
        </div>
      </section>

      {/* ── CTA / Footer ── */}
      <section style={{ background: "#f0ecff", position: "relative", overflow: "hidden", minHeight: "62vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "flex-start", paddingTop: "5rem", paddingBottom: "2em" }}>

        {/* Trabajemos juntos */}
        <a href="https://wa.me/573144869162" target="_blank" rel="noopener noreferrer" aria-label="Trabajemos juntos por WhatsApp"
          style={{ fontFamily: "var(--font-montserrat)", fontSize: "clamp(0.95rem, 1.4vw, 1.3rem)", color: "#b09fd8", letterSpacing: "0.08em", textDecoration: "none", textTransform: "uppercase", fontWeight: 600, display: "flex", alignItems: "center", gap: "0.45rem", position: "relative", zIndex: 1 }}>
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
            <svg className="icon-hover" viewBox="0 0 24 24" aria-hidden="true"><defs><radialGradient id="ig-grad2" cx="0.3" cy="1" r="1.2"><stop offset="0%" stopColor="#FED576" /><stop offset="25%" stopColor="#F47133" /><stop offset="55%" stopColor="#BC3081" /><stop offset="85%" stopColor="#4C63D2" /></radialGradient></defs><rect x="2" y="2" width="20" height="20" rx="5" fill="url(#ig-grad2)" /><rect x="6" y="6" width="12" height="12" rx="3.5" fill="none" stroke="#fff" strokeWidth="1.6" /><circle cx="12" cy="12" r="3" fill="none" stroke="#fff" strokeWidth="1.6" /><circle cx="17" cy="7" r="0.9" fill="#fff" /></svg>
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

        {/* DIVERGENTE gigante — mitad recortada al fondo */}
        <div style={{ position: "absolute", bottom: "-0.12em", left: 0, right: 0, textAlign: "center", lineHeight: 0.82, userSelect: "none", pointerEvents: "none", zIndex: 0, overflow: "visible" }}>
          <span style={{ fontFamily: "var(--font-eastman)", fontSize: "clamp(3rem, 15vw, 19rem)", fontWeight: 400, textTransform: "uppercase", color: "rgba(147,51,234,0.14)", letterSpacing: "-0.01em", display: "block", whiteSpace: "nowrap" }}>DIVERGENTE</span>
        </div>

      </section>

    </div>
  );
}
