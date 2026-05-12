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
      heroRef.current.style.minHeight = `${window.innerHeight - headerHeight + 1300}px`;
    }
    if (accordionInnerRef.current) {
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
    if (line2El) {
      line2El.style.position     = "fixed";
      line2El.style.top          = `${h1InitialTop}px`;
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

      if (y < SLIDE_START) {
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

      // ── Accordion: scroll-driven card opening ──
      const rel = y - accordionOffset;
      let nextCard: number | null = null;
      if (rel >= 0 && rel < NUM_CARDS * PER_CARD) {
        nextCard = Math.min(NUM_CARDS - 1, Math.floor(rel / PER_CARD));
      }
      if (nextCard !== lastCardIdx) {
        lastCardIdx = nextCard;
        setOpenCard(nextCard);
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
        className="section-wrap"
        style={{ display: "flex", alignItems: "flex-start", paddingTop: "18vh" }}
      >
        <h1
          ref={titleRef}
          className="page-title"
          style={{ margin: 0, textTransform: "uppercase", textAlign: "center", width: "100%", fontFamily: "var(--font-montserrat), sans-serif", fontWeight: 400, letterSpacing: "0.04em", position: "relative" }}
        >
          {/* Línea 1 — en flujo, define la altura del h1 */}
          <span style={{ display: "block", fontSize: "clamp(5rem, 10vw, 15rem)", lineHeight: 1.05, color: "#9488b8" }}>
            {["Los", "datos", "no", "deciden"].map((word, wi, arr) => (
              <span key={wi} style={{ whiteSpace: "nowrap", display: "inline" }}>
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
          <span ref={line2Ref} style={{ position: "absolute", top: 0, left: 0, width: "100%", textAlign: "center", color: "#e6a7ff", paddingTop: "1.05em", fontSize: "clamp(5rem, 10vw, 15rem)" }}>
            {/* "Las PERSONAS" — una línea abajo de Line 1 */}
            <span style={{ display: "block", fontSize: "clamp(5rem, 10vw, 15rem)", lineHeight: 1.05 }}>
              {["Las", "PERSONAS"].map((word, wi, arr) => (
                <span key={wi} style={{ whiteSpace: "nowrap", display: "inline" }}>
                  {word.split("").map((char, ci) => (
                    <span key={ci} className="title-letter" style={{ display: "inline-block", willChange: "opacity, transform, filter" }}>{char}</span>
                  ))}
                  {wi < arr.length - 1 && <span style={{ display: "inline-block" }}>&nbsp;</span>}
                </span>
              ))}
            </span>
            {/* "sí" — en su propia línea debajo, negrita */}
            <span style={{ display: "block", fontSize: "clamp(5rem, 10vw, 15rem)", lineHeight: 1.05, fontWeight: 700 }}>
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


      {/* ── Una Mirada Divergente — wrapper crea el espacio de scroll; sección sticky adentro ── */}
      <div ref={accordionSectionRef} style={{ marginTop: "-450px", height: "4300px" }}>
      <section ref={accordionInnerRef} style={{ height: "520px", backgroundColor: "rgba(148, 136, 184, 0.04)", position: "sticky", top: "80px", overflow: "hidden" }}>
        <div style={{ display: "flex", alignItems: "flex-start", padding: "1.5rem 4vw", gap: "2rem", height: "100%" }}>

          {/* Sidebar vertical */}
          <div style={{ display: "flex", flexDirection: "row", gap: "1.25rem", flexShrink: 0, alignSelf: "stretch", paddingTop: "0.25rem" }}>
            <span className="section-label" style={{ writingMode: "vertical-rl", transform: "rotate(180deg)", letterSpacing: "0.18em", alignSelf: "flex-end" }}>
              una mirada divergente
            </span>
            <h2 className="section-heading" style={{ writingMode: "vertical-rl", transform: "rotate(180deg)", margin: 0, lineHeight: 1.05, alignSelf: "flex-end" }}>
              Cómo lo hacemos.
            </h2>
          </div>

          {/* Acordeón horizontal */}
          <div style={{ flex: 1 }}>
          <div style={{ display: "flex", gap: "0", alignItems: "stretch", height: "488px", borderBottom: "1px solid rgba(148,136,184,0.22)" }}>
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
                  <div style={{ display: "flex", flexDirection: "column", height: "100%", gap: "0.75rem" }}>
                    <div style={{ flex: "0 0 38%", borderRadius: "6px", overflow: "hidden" }}>
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
                      <p style={{ margin: "0 0 4.5rem", fontFamily: "monospace", fontSize: "18px", fontWeight: 700, color: "var(--mint)", lineHeight: 1.2, textAlign: "center" }}>
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
                  <div style={{ display: "flex", flexDirection: "column", height: "100%", alignItems: "center", justifyContent: "flex-end", paddingBottom: "calc(1.25rem + 50px)", gap: "0.5rem" }}>
                    <div style={{ width: "85%", aspectRatio: "1 / 1", overflow: "hidden", flexShrink: 0 }}>
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
                  <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", height: "100%", gap: "2rem" }}>
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
                  <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", height: "100%", padding: "0.5rem 0" }}>
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
                    flex: isOpen ? "0 0 400px" : "0 0 56px",
                    transition: "flex 0.45s cubic-bezier(0.4, 0, 0.2, 1)",
                    borderRadius: 0,
                    backgroundColor: isOpen ? "rgba(148,136,184,0.05)" : "transparent",
                    borderRight: i < 4 ? "1px solid rgba(148,136,184,0.15)" : "none",
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
                  {/* Etiqueta colapsada: código rotado + número transparente abajo */}
                  <div style={{
                    position: "absolute",
                    inset: 0,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    padding: "1.25rem 0",
                    gap: "0.75rem",
                    opacity: isOpen ? 0 : 1,
                    transition: "opacity 0.15s",
                    pointerEvents: isOpen ? "none" : "auto",
                    overflow: "hidden",
                  }}>
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
            {/* Espacio derecho con imagen de fondo y línea de código centrada */}
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
              {/* Imagen con filtro de paleta */}
              <div style={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                bottom: "-40%",
                backgroundImage: "url('/bg-analitica.png')",
                backgroundSize: "auto 88%",
                backgroundPosition: "50% 100%",
                backgroundRepeat: "no-repeat",
                opacity: 0.55,
                filter: "grayscale(0.2) hue-rotate(220deg) saturate(1.2) brightness(0.85)",
                WebkitMaskImage: "linear-gradient(to bottom, transparent 0%, black 25%)",
                maskImage: "linear-gradient(to bottom, transparent 0%, black 25%)",
              }} />
              {/* Bloque VS Code */}
              <div style={{
                position: "relative",
                zIndex: 1,
                display: "flex",
                flexDirection: "column",
                gap: "0.6rem",
              }}>
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
          </div>
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
          .svc-para { opacity: 0.07; filter: blur(2px); transition: opacity 0.7s ease, filter 0.7s ease; }
          .svc-action { opacity: 0.3; transition: opacity 0.4s ease; }
          @media (hover: hover) {
            .svc-card:hover .svc-para { opacity: 1; filter: blur(0); }
            .svc-card:hover .svc-card-front { border-color: rgba(147,51,234,0.3); }
            .svc-card:hover .svc-action { opacity: 0.8; }
          }
        `}</style>
        <div style={{ position: "absolute", inset: 0, backgroundImage: "radial-gradient(ellipse at 20% 50%, rgba(147,51,234,0.12) 0%, transparent 60%), radial-gradient(ellipse at 80% 20%, rgba(145,254,230,0.07) 0%, transparent 50%)", pointerEvents: "none" }} />
        <div className="section-wrap" style={{ position: "relative", zIndex: 1 }}>
          <h2 style={{ fontFamily: "var(--font-eastman)", fontSize: "clamp(2rem, 3.5vw, 3.5rem)", fontWeight: 400, textTransform: "uppercase", color: "var(--mint)", textAlign: "center", letterSpacing: "0.03em", lineHeight: 1, marginBottom: "3rem" }}>
            Cómo nos gusta servir
          </h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "1.25rem" }}>
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
                  { name: "Desarrollo de plataformas web", paragraph: "Diseñamos y desarrollamos plataformas web a la medida, desde sitios institucionales hasta sistemas complejos de gestión.\n\nCada proyecto parte de una **pregunta humana** antes que técnica: qué necesita resolver, sentir o lograr la persona que entra acá." },
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
              <div key={card.num} className={`svc-card${openService === i ? " is-flipped" : ""}`}
                style={{ height: openService === i ? (openItem?.[0] === i ? "960px" : "560px") : "480px", transition: "height 0.45s cubic-bezier(0.4,0,0.2,1)" }}
                onClick={() => { if (openService !== i) setOpenService(i); }}>
                <div className="svc-card-inner">
                  {/* FRENTE */}
                  <div className="svc-card-front">
                    {card.bgImage && <div style={{ position: "absolute", inset: 0, backgroundImage: `url('${card.bgImage}')`, backgroundSize: "cover", backgroundPosition: "center", opacity: 0.28, filter: "grayscale(0.2) hue-rotate(220deg) saturate(1.1)" }} />}
                    <div style={{ position: "absolute", inset: 0, background: "linear-gradient(135deg, rgba(10,4,22,0.92) 0%, rgba(26,10,48,0.6) 100%)" }} />
                    <div style={{ position: "relative", zIndex: 1, display: "flex", gap: "1.5rem", height: "100%", padding: "2rem" }}>
                      <div style={{ display: "flex", alignItems: "center" }}>
                        <h3 style={{ fontFamily: "var(--font-eastman)", fontSize: "clamp(1.4rem, 2vw, 2rem)", fontWeight: 400, textTransform: "uppercase", color: "var(--mint)", margin: 0, lineHeight: 1.05, letterSpacing: "0.03em", writingMode: "vertical-rl", transform: "rotate(180deg)" }}>{card.label}</h3>
                      </div>
                      <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                        <div className="svc-para" style={{ flex: 1, display: "flex", alignItems: "center" }}>
                          {card.paragraph && <div style={{ fontFamily: "var(--font-montserrat)", fontSize: "0.85rem", color: "rgba(245,245,240,0.85)", lineHeight: 1.8, display: "flex", flexDirection: "column", gap: "0.75rem" }}>{card.paragraph.split("\n\n").map((p, k) => <p key={k} style={{ margin: 0 }}>{p.split("**").map((part, pi) => pi % 2 === 1 ? <strong key={pi}>{part}</strong> : part)}</p>)}</div>}
                        </div>
                        <div style={{ display: "flex", justifyContent: "flex-end", paddingTop: "0.75rem" }}>
                          <span className="svc-action" style={{ fontFamily: "var(--font-montserrat)", letterSpacing: "0.04em", color: "var(--mint)" }}><span style={{ fontSize: "1.4rem" }}>↺</span><span style={{ fontSize: "0.68rem", marginLeft: "0.35rem" }}>dale la vuelta</span></span>
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
                              <p style={{ margin: 0, fontFamily: "var(--font-eastman)", fontSize: "18px", fontWeight: 400, color: isItemOpen ? "#9333EA" : "#7040a8", lineHeight: 1.3, transition: "color 0.25s ease", textAlign: "center", letterSpacing: "0.02em" }}>{item.name}</p>
                              <span style={{ color: "#8b78b8", fontSize: "1rem", flexShrink: 0, marginLeft: "0.5rem", transition: "transform 0.3s ease", display: "inline-block", transform: isItemOpen ? "rotate(180deg)" : "rotate(0deg)" }}>▾</span>
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
                    <div style={{ display: "flex", justifyContent: "flex-end", paddingTop: "0.75rem", cursor: "pointer" }}
                      onClick={(e) => { e.stopPropagation(); setOpenService(null); setOpenItem(null); }}>
                      <span style={{ fontFamily: "var(--font-montserrat)", fontSize: "1.1rem", color: "#8b7ab8", fontWeight: 700 }}>↻</span>
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
      <section className="py-28" style={{}}>
        <div className="section-wrap flex gap-20 items-center">
          <div className="flex-[3]">
            <span className="section-label">Por qué Divergente</span>
            <h2 className="section-heading">Tecnología con propósito humano.</h2>
            <div className="body-copy" style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
              <p>Construimos apps, plataformas web y soluciones en software pensadas desde las personas que las van a usar. Diseñamos arquitectura de soluciones digitales y tecnológicas. La tecnología al servicio del propósito, no al revés.</p>
              <p className="italic">Para organizaciones y emprendedores que quieren entender su realidad — no solo medirla.</p>
            </div>
          </div>
          <div className="flex-[2] placeholder-illo rounded-full" style={{ aspectRatio: "1" }} />
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-28" style={{}}>
        <div className="section-wrap" style={{ maxWidth: "52rem", textAlign: "center", margin: "0 auto" }}>
          <h2 className="section-heading">
            Si tienes datos, pero no sabes qué decisión tomar,<br />empecemos a mirar mejor.
          </h2>
          <button className="cta-btn" style={{ marginTop: "2rem" }}>
            Diseñar una ruta de analítica →
          </button>
        </div>
      </section>

    </div>
  );
}
