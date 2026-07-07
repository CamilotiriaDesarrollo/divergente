"use client";

import { useEffect, useRef } from "react";

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

          <div className="cr-hero-meta">Academia Divergente</div>

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
        aria-labelledby="cr-academy-title"
      >
        <div className="cr-academy-grid" aria-hidden="true" />

        <div className="cr-academy-inner">
          <header className="cr-academy-header">
            <div className="cr-academy-heading-wrap">
              <h2
                id="cr-academy-title"
                className="cr-academy-title cr-reveal"
              >
                <span>Academia</span>
                <span>Divergente</span>
              </h2>
              <p className="cr-academy-subtitle cr-reveal">
                Formación en Tecnología para personas no son técnicas.
              </p>

              <div
                className="cr-academy-pillars cr-reveal"
                aria-label="Pilares de Academia Divergente"
              >
                <article className="cr-academy-pillar">
                  <span aria-hidden="true" />
                  <h3>Pensamiento crítico</h3>
                </article>
                <article className="cr-academy-pillar">
                  <span aria-hidden="true" />
                  <h3>Pensamiento creativo</h3>
                </article>
                <article className="cr-academy-pillar">
                  <span aria-hidden="true" />
                  <h3>Pensamiento analítico</h3>
                </article>
                <article className="cr-academy-pillar">
                  <span aria-hidden="true" />
                  <h3>Desarrollo de herramientas técnicas</h3>
                </article>
              </div>
            </div>
          </header>

          <div className="cr-academy-content">
            <div className="cr-academy-method cr-reveal">
              <p>
                Aquí no se acumulan cursos:
                <strong> se construyen sistemas.</strong>
              </p>
              <p>
                Cada formación es en vivo, en grupos pequeños y con un resultado
                concreto — se entra con un problema real y se sale con una
                herramienta propia funcionando. Todo se explica en cristiano,
                sin jerga técnica.
              </p>
            </div>

            <div className="cr-academy-path cr-reveal">
              <div className="cr-academy-path-step">
                <span>Entrada</span>
                <strong>Un problema real</strong>
              </div>
              <span className="cr-academy-path-arrow" aria-hidden="true">
                →
              </span>
              <div className="cr-academy-path-step">
                <span>Salida</span>
                <strong>Una herramienta propia funcionando</strong>
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
      </section>
    </div>
  );
}
