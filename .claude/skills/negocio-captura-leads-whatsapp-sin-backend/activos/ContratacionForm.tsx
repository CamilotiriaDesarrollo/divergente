/*
 * ContratacionForm — captura de leads a WhatsApp sin backend.
 * Origen real: DivergenteWEB/app/metodologias/conferencias/page.tsx (líneas 378-463).
 * Adaptaciones para reuso: número parametrizado como constante; sin secretos.
 *
 * Patrón: onSubmit -> preventDefault -> window.open(wa.me/<num>?text=<URL-encoded>).
 * Los datos NO se persisten en servidor: el "envío" es abrir el chat de WhatsApp
 * con el mensaje pre-rellenado. Es una decisión TEMPORAL de MVP; el destino
 * definitivo (correo/CRM) debe quedar registrado como pendiente del roadmap.
 */
"use client";

import { useState } from "react";

// Formato internacional: sin "+", sin espacios, sin guiones, sin 0 inicial.
// Ej. Colombia +57 314 486 9162  ->  "573144869162"
const WHATSAPP_NUMERO = "57XXXXXXXXXX";

export function ContratacionForm({ isMobile }: { isMobile: boolean }) {
  const [nombre, setNombre] = useState("");
  const [org, setOrg] = useState("");
  const [fecha, setFecha] = useState("");
  const [tipo, setTipo] = useState("");

  // encodeURIComponent sobre TODO el texto (incluidos \n y comas) — obligatorio.
  const waText = encodeURIComponent(
    `Hola, quiero solicitar una conferencia.\n\nNombre: ${nombre}\nOrganización: ${org}\nFecha tentativa: ${fecha}\nTipo de evento: ${tipo}`
  );

  const field: React.CSSProperties = {
    fontSize: "0.95rem",
    padding: "0.9rem 1.1rem",
    borderRadius: "12px",
    border: "1px solid #ccc",
    width: "100%",
    outline: "none",
  };

  return (
    <section style={{ padding: isMobile ? "10vh 1.5rem" : "13vh 2rem" }}>
      <div style={{ maxWidth: "44rem", margin: "0 auto", textAlign: "center" }}>
        <h2>Hablemos de tu evento.</h2>
        <p>Cuéntanos lo esencial y te respondemos con una propuesta.</p>

        <form
          onSubmit={(e) => {
            e.preventDefault(); // sin esto, el form navega (GET) y compite con window.open
            window.open(
              `https://wa.me/${WHATSAPP_NUMERO}?text=${waText}`,
              "_blank",
              "noopener" // evita reverse-tabnabbing: la pestaña de WA no recibe window.opener
            );
          }}
          style={{
            display: "grid",
            gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr",
            gap: "1rem",
            textAlign: "left",
          }}
        >
          <input style={field} placeholder="Nombre" value={nombre} onChange={(e) => setNombre(e.target.value)} required aria-label="Nombre" />
          <input style={field} placeholder="Organización" value={org} onChange={(e) => setOrg(e.target.value)} aria-label="Organización" />
          <input style={field} placeholder="Fecha tentativa" value={fecha} onChange={(e) => setFecha(e.target.value)} aria-label="Fecha tentativa" />
          <input style={field} placeholder="Tipo de evento" value={tipo} onChange={(e) => setTipo(e.target.value)} aria-label="Tipo de evento" />
          <div style={{ gridColumn: isMobile ? "auto" : "span 2", display: "flex", justifyContent: "center", marginTop: "0.8rem" }}>
            <button type="submit">Enviar solicitud</button>
          </div>
        </form>

        {/* PLACEHOLDER: definir destino de leads (correo / CRM). Hoy abre WhatsApp. */}
        <p style={{ marginTop: "1.4rem", fontSize: "0.78rem" }}>
          * Por ahora la solicitud se envía por WhatsApp — definir destino final (correo/CRM).
        </p>
      </div>
    </section>
  );
}
