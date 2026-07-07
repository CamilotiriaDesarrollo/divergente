"use client";

import Link from "next/link";
import React, { useEffect, useRef, useState } from "react";

/* ════════════════════════════════════════════════════════════════════
   METODOLOGÍAS · Conferencias
   Audiencia prioritaria: compradores de conferencias, instituciones,
   organizadores de eventos. Tono un poco más enérgico, sin perder la
   calma de marca. Reutiliza el sistema "Respiración".
   ════════════════════════════════════════════════════════════════════ */

export default function Conferencias() {
  const reduceMotion = useRef(false);
  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== "undefined" ? window.innerWidth <= 768 : false
  );

  useEffect(() => {
    reduceMotion.current =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const check = () => setIsMobile(window.innerWidth <= 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  useEffect(() => {
    const els = document.querySelectorAll<HTMLElement>(".mt-reveal, .mt-rule");
    if (reduceMotion.current) {
      els.forEach((el) => el.classList.add("is-in"));
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
      { threshold: 0.18, rootMargin: "0px 0px -8% 0px" }
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  return (
    <div className="w-full" style={{ overflowX: "clip" }}>
      {/* ── Migaja de vuelta a Metodologías ── */}
      <div className="section-wrap" style={{ maxWidth: "76rem", margin: "0 auto", paddingTop: "2.5rem" }}>
        <Link
          href="/metodologias"
          style={{
            fontFamily: "var(--font-montserrat), sans-serif",
            fontSize: "0.8rem",
            fontWeight: 600,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            color: "var(--mt-sage)",
            textDecoration: "none",
          }}
        >
          ← Metodologías
        </Link>
      </div>

      {/* ═══════════════ 1 · HERO DE ORADOR ═══════════════ */}
      <section
        className="section-wrap"
        style={{
          minHeight: "82vh",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          maxWidth: "76rem",
          margin: "0 auto",
          position: "relative",
          padding: "6vh 2rem",
        }}
      >
        <div
          aria-hidden
          className="mt-breathe"
          style={{
            position: "absolute",
            right: "-6%",
            top: "30%",
            width: "min(55vw, 520px)",
            height: "min(55vw, 520px)",
            borderRadius: "50%",
            background:
              "radial-gradient(circle, rgba(124,201,167,0.32) 0%, transparent 68%)",
            zIndex: 0,
          }}
        />
        <span className="mt-reveal mt-eyebrow" style={{ position: "relative", zIndex: 1, display: "block", marginBottom: "1.4rem" }}>
          Conferencias · Camilo Tiria
        </span>
        <h1
          className="mt-reveal mt-heading"
          style={{ position: "relative", zIndex: 1, maxWidth: "16ch", transitionDelay: "0.12s" }}
        >
          Conferencias que unen datos, consciencia y creatividad.
        </h1>
        <p
          className="mt-reveal"
          style={{
            position: "relative",
            zIndex: 1,
            maxWidth: "40rem",
            margin: "1.8rem 0 2.4rem",
            fontFamily: "var(--font-montserrat), sans-serif",
            fontSize: "clamp(1rem, 1.3vw, 1.35rem)",
            lineHeight: 1.75,
            color: "#3d574a",
            transitionDelay: "0.28s",
          }}
        >
          Para equipos, instituciones, cámaras de comercio y eventos que quieren
          algo más que una charla.
        </p>
        <div className="mt-reveal" style={{ position: "relative", zIndex: 1, transitionDelay: "0.4s" }}>
          <a
            href="https://wa.me/573144869162?text=Hola%2C%20quiero%20solicitar%20una%20conferencia"
            target="_blank"
            rel="noopener noreferrer"
            className="mt-btn"
          >
            Solicita una conferencia
          </a>
        </div>
      </section>

      {/* ═══════════════ 2 · DE QUÉ HABLO (ejes temáticos) ═══════════════ */}
      <section className="section-wrap" style={{ maxWidth: "76rem", margin: "0 auto", padding: "10vh 2rem" }}>
        <div className="mt-rule" style={{ marginBottom: "2.6rem" }} />
        <h2 className="mt-reveal mt-heading" style={{ marginBottom: "2.6rem" }}>
          De qué hablo.
        </h2>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr",
            gap: isMobile ? "1.1rem" : "1.6rem",
          }}
        >
          {[
            { t: "Decisión consciente", d: "Cómo decidir bajo presión sin dejarse arrastrar por el ruido." },
            { t: "Dato + propósito", d: "Por qué más información no es más claridad — y qué hacer al respecto." },
            { t: "Creatividad desde la consciencia", d: "Procesos creativos que revelan el propósito detrás del trabajo." },
            { t: "Silencio y liderazgo", d: "El silencio y la observación como herramientas de quien dirige." },
          ].map((eje, i) => (
            <div
              key={eje.t}
              className="mt-card mt-reveal"
              style={{ transitionDelay: `${0.1 + i * 0.12}s` }}
            >
              <span className="mt-card-eyebrow">{`Eje 0${i + 1}`}</span>
              <span className="mt-card-title">{eje.t}</span>
              <span className="mt-card-text">{eje.d}</span>
            </div>
          ))}
        </div>
        <p
          className="mt-reveal"
          style={{
            marginTop: "1.5rem",
            fontFamily: "var(--font-montserrat), sans-serif",
            fontSize: "0.82rem",
            fontStyle: "italic",
            color: "var(--mt-sage)",
          }}
        >
          {/* PLACEHOLDER: confirmar ejes y matices con Camilo. */}
          * Ejes temáticos preliminares — a confirmar con Camilo.
        </p>
      </section>

      {/* ═══════════════ 3 · FORMATOS ═══════════════ */}
      <section className="section-wrap" style={{ maxWidth: "76rem", margin: "0 auto", padding: "10vh 2rem" }}>
        <div className="mt-rule" style={{ marginBottom: "2.6rem" }} />
        <h2 className="mt-reveal mt-heading" style={{ marginBottom: "2.6rem" }}>
          Formatos.
        </h2>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: isMobile ? "1fr" : "repeat(3, 1fr)",
            gap: isMobile ? "1.1rem" : "1.6rem",
          }}
        >
          {[
            { t: "Keynote", d: "Conferencia magistral para inspirar y mover a una sala entera.", dur: "45–60 min" },
            { t: "Conferencia-taller", d: "Charla + práctica guiada. Las ideas se instalan, no solo se escuchan.", dur: "90–120 min" },
            { t: "Experiencia para evento", d: "Un momento contemplativo diseñado a la medida de tu evento.", dur: "a la medida" },
          ].map((f, i) => (
            <div
              key={f.t}
              className="mt-card mt-reveal"
              style={{ transitionDelay: `${0.1 + i * 0.12}s` }}
            >
              <span className="mt-card-eyebrow">{f.dur}{/* PLACEHOLDER: confirmar duraciones */}</span>
              <span className="mt-card-title">{f.t}</span>
              <span className="mt-card-text">{f.d}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ═══════════════ 4 · PARA TU EVENTO / INSTITUCIÓN ═══════════════ */}
      <section
        style={{
          background: "color-mix(in srgb, var(--mt-green) 9%, transparent)",
          padding: isMobile ? "10vh 1.5rem" : "12vh 2rem",
        }}
      >
        <div className="section-wrap" style={{ maxWidth: "62rem", margin: "0 auto" }}>
          <span className="mt-reveal mt-eyebrow" style={{ display: "block", marginBottom: "1.2rem" }}>
            Para tu evento o institución
          </span>
          <h2 className="mt-reveal mt-heading" style={{ marginBottom: "2rem", transitionDelay: "0.1s" }}>
            Qué recibe tu público.
          </h2>
          <div
            className="mt-reveal"
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "1.3rem",
              maxWidth: "44rem",
              fontFamily: "var(--font-montserrat), sans-serif",
              fontSize: "clamp(1rem, 1.2vw, 1.2rem)",
              lineHeight: 1.75,
              color: "#3d574a",
              transitionDelay: "0.2s",
            }}
          >
            <p style={{ margin: 0 }}>
              Una experiencia que combina rigor — años de trabajo con datos,
              observatorios y sistemas de información — con la práctica
              contemplativa. No es motivación vacía: es una mirada nueva sobre
              cómo decidir y crear.
            </p>
            <p style={{ margin: 0, color: "var(--mt-green)" }}>
              Ideal para congresos, cámaras de comercio, encuentros de liderazgo,
              programas de bienestar corporativo y comunidades que buscan
              propósito.
            </p>
          </div>
        </div>
      </section>

      {/* ═══════════════ 5 · TEMAS / TÍTULOS DE CONFERENCIAS ═══════════════ */}
      <section className="section-wrap" style={{ maxWidth: "76rem", margin: "0 auto", padding: "10vh 2rem" }}>
        <div className="mt-rule" style={{ marginBottom: "2.6rem" }} />
        <h2 className="mt-reveal mt-heading" style={{ marginBottom: "1rem" }}>
          Temas.
        </h2>
        <p
          className="mt-reveal"
          style={{
            margin: "0 0 2.6rem",
            fontFamily: "var(--font-montserrat), sans-serif",
            fontSize: "0.82rem",
            fontStyle: "italic",
            color: "var(--mt-sage)",
            transitionDelay: "0.1s",
          }}
        >
          {/* PLACEHOLDER: pedir a Camilo los títulos reales de sus conferencias. */}
          * Títulos de muestra — reemplazar con los títulos reales de Camilo.
        </p>
        <div style={{ display: "flex", flexDirection: "column" }}>
          {[
            "Más información no es más claridad",
            "Decidir desde la quietud",
            "El dato y el sentido: una sola mirada",
            "Liderar en silencio",
          ].map((title, i) => (
            <div
              key={title}
              className="mt-reveal"
              style={{
                display: "flex",
                alignItems: "baseline",
                gap: "1.2rem",
                padding: "1.4rem 0",
                borderBottom: "1px solid color-mix(in srgb, var(--mt-green) 16%, transparent)",
                transitionDelay: `${i * 0.1}s`,
              }}
            >
              <span
                style={{
                  fontFamily: "var(--font-montserrat), sans-serif",
                  fontSize: "0.8rem",
                  fontWeight: 700,
                  color: "var(--mt-sage)",
                  flexShrink: 0,
                }}
              >
                {`0${i + 1}`}
              </span>
              <span
                style={{
                  fontFamily: "var(--font-eastman), sans-serif",
                  fontSize: "clamp(1.3rem, 2.6vw, 2.2rem)",
                  color: "var(--mt-green)",
                  lineHeight: 1.15,
                }}
              >
                {title}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* ═══════════════ 6 · ESCENARIOS ANTERIORES / PRUEBA SOCIAL ═══════════════ */}
      <section className="section-wrap" style={{ maxWidth: "76rem", margin: "0 auto", padding: "8vh 2rem" }}>
        <span className="mt-reveal mt-eyebrow" style={{ display: "block", marginBottom: "1.6rem" }}>
          Escenarios anteriores
        </span>
        <div
          className="mt-reveal"
          style={{
            display: "grid",
            gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(4, 1fr)",
            gap: "1rem",
            transitionDelay: "0.12s",
          }}
        >
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              style={{
                aspectRatio: "3 / 2",
                borderRadius: "12px",
                border: "1px dashed color-mix(in srgb, var(--mt-green) 28%, transparent)",
                background: "color-mix(in srgb, var(--mt-green) 4%, transparent)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontFamily: "var(--font-montserrat), sans-serif",
                fontSize: "0.7rem",
                color: "var(--mt-sage)",
                textAlign: "center",
                padding: "0.5rem",
              }}
            >
              {/* PLACEHOLDER: logo o foto de evento/institución */}
              logo / evento {i + 1}
            </div>
          ))}
        </div>
        <p
          className="mt-reveal"
          style={{
            marginTop: "1.5rem",
            fontFamily: "var(--font-montserrat), sans-serif",
            fontSize: "0.82rem",
            fontStyle: "italic",
            color: "var(--mt-sage)",
          }}
        >
          * Prueba social pendiente — pedir logos o menciones de instituciones/eventos.
        </p>
      </section>

      {/* ═══════════════ 7 · CTA DE CONTRATACIÓN ═══════════════ */}
      <ContratacionForm isMobile={isMobile} />
    </div>
  );
}

/* ── Formulario corto de contratación (mailto + WhatsApp como salida de leads) ── */
function ContratacionForm({ isMobile }: { isMobile: boolean }) {
  const [nombre, setNombre] = useState("");
  const [org, setOrg] = useState("");
  const [fecha, setFecha] = useState("");
  const [tipo, setTipo] = useState("");

  const waText = encodeURIComponent(
    `Hola, quiero solicitar una conferencia.\n\nNombre: ${nombre}\nOrganización: ${org}\nFecha tentativa: ${fecha}\nTipo de evento: ${tipo}`
  );

  const field: React.CSSProperties = {
    fontFamily: "var(--font-montserrat), sans-serif",
    fontSize: "0.95rem",
    padding: "0.9rem 1.1rem",
    borderRadius: "12px",
    border: "1px solid color-mix(in srgb, var(--mt-green) 28%, transparent)",
    background: "color-mix(in srgb, #ffffff 40%, transparent)",
    color: "var(--mt-green)",
    width: "100%",
    outline: "none",
  };

  return (
    <section
      style={{
        background: "color-mix(in srgb, var(--mt-green) 10%, transparent)",
        padding: isMobile ? "10vh 1.5rem" : "13vh 2rem",
      }}
    >
      <div className="section-wrap" style={{ maxWidth: "44rem", margin: "0 auto", textAlign: "center" }}>
        <h2 className="mt-reveal mt-heading">Hablemos de tu evento.</h2>
        <p
          className="mt-reveal"
          style={{
            margin: "1.2rem auto 2.6rem",
            maxWidth: "34rem",
            fontFamily: "var(--font-montserrat), sans-serif",
            fontSize: "clamp(0.95rem, 1.1vw, 1.15rem)",
            lineHeight: 1.7,
            color: "#3d574a",
            transitionDelay: "0.15s",
          }}
        >
          Cuéntanos lo esencial y te respondemos con una propuesta.
        </p>

        <form
          className="mt-reveal"
          onSubmit={(e) => {
            e.preventDefault();
            window.open(`https://wa.me/573144869162?text=${waText}`, "_blank", "noopener");
          }}
          style={{
            display: "grid",
            gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr",
            gap: "1rem",
            textAlign: "left",
            transitionDelay: "0.25s",
          }}
        >
          <input style={field} placeholder="Nombre" value={nombre} onChange={(e) => setNombre(e.target.value)} required aria-label="Nombre" />
          <input style={field} placeholder="Organización" value={org} onChange={(e) => setOrg(e.target.value)} aria-label="Organización" />
          <input style={field} placeholder="Fecha tentativa" value={fecha} onChange={(e) => setFecha(e.target.value)} aria-label="Fecha tentativa" />
          <input style={field} placeholder="Tipo de evento" value={tipo} onChange={(e) => setTipo(e.target.value)} aria-label="Tipo de evento" />
          <div style={{ gridColumn: isMobile ? "auto" : "span 2", display: "flex", justifyContent: "center", marginTop: "0.8rem" }}>
            <button type="submit" className="mt-btn">
              Enviar solicitud
            </button>
          </div>
        </form>
        <p
          style={{
            marginTop: "1.4rem",
            fontFamily: "var(--font-montserrat), sans-serif",
            fontSize: "0.78rem",
            color: "var(--mt-sage)",
          }}
        >
          {/* PLACEHOLDER: definir destino de leads (correo / CRM). Hoy abre WhatsApp. */}
          * Por ahora la solicitud se envía por WhatsApp — definir destino final (correo/CRM).
        </p>
      </div>
    </section>
  );
}
