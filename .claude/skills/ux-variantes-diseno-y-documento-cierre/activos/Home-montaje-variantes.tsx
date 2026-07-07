/*
 * PATRÓN DE MONTAJE SIMULTÁNEO DE VARIANTES EN LA PÁGINA REAL
 * Extraído de dos casos reales del portafolio (Ministerio de las Culturas).
 * El objetivo: evaluar las propuestas LADO A LADO en la Home real, con datos
 * reales y en el navegador, no en mockups. Se elige la ganadora y se limpia.
 *
 * Cómo usarlo: pega solo el bloque que apliques dentro de tu Home.tsx durante
 * la fase de exploración. Cada variante es un archivo hermano (mismo prefijo,
 * sufijo A-G o V1-V3). Los separadores <section> rotulan cada zona para que el
 * equipo sepa qué está viendo.
 */

// ─────────────────────────────────────────────────────────────
// CASO A — Variantes de un COMPONENTE (portalSectionV1/V2/V3)
// Fuente real: Interfase Pagina Inicial, Home.tsx en commit c2f8a36
// Tres bocetos del mismo bloque, uno debajo del otro, más el de producción.
// ─────────────────────────────────────────────────────────────
import PortalSection   from '@/components/portalSection'    // versión en producción
import PortalSectionV1 from '@/components/portalSectionV1'  // tarjetas con flip 3D
import PortalSectionV2 from '@/components/portalSectionV2'  // positivo / negativo
import PortalSectionV3 from '@/components/portalSectionV3'  // acordeón horizontal

function HomeExploracionComponente() {
  return (
    <div className="page-layout">
      {/* ── Portal misional (versión candidata a producción) ── */}
      <PortalSection />

      {/* ── Versión 1 — tarjetas con flip ───────────────── */}
      <PortalSectionV1 />

      {/* ── Versión 2 — positivo / negativo ─────────────── */}
      <PortalSectionV2 />

      {/* ── Versión 3 — acordeón horizontal ─────────────── */}
      <PortalSectionV3 />
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// CASO B — Misma variante ganadora en sus 4 ESTADOS (claro/oscuro
// x animado/estático) para decidir el modo por defecto.
// Fuente real: Interfase Sistemas, Home.tsx (post-limpieza 1a8bd99).
// Una sola variante (TirillaF) parametrizada por props: dark, staticMode.
// ─────────────────────────────────────────────────────────────
import TirillaF from '@/components/tirillaF'
import { sistemasDemo } from '@/data/sistemasDemo'

function HomeExploracionEstados() {
  return (
    <div className="page-layout">
      {/* Animada — clara y oscura */}
      <TirillaF sistemas={sistemasDemo} labelFixed="Explora la cultura"
                labelCarousel="Aliados — Otras plataformas" />
      <TirillaF dark sistemas={sistemasDemo} labelFixed="Explora la cultura"
                labelCarousel="Aliados — Otras plataformas" />

      {/* Separador rotulado: el equipo sabe que abajo está la variante estática */}
      <section className="page-version-sep">
        <span className="page-version-sep__label">Versión estática</span>
      </section>

      {/* Estática — clara y oscura */}
      <TirillaF staticMode sistemas={sistemasDemo} labelFixed="Explora la cultura"
                labelCarousel="Aliados — Otras plataformas" />
      <TirillaF staticMode dark sistemas={sistemasDemo} labelFixed="Explora la cultura"
                labelCarousel="Aliados — Otras plataformas" />
    </div>
  )
}

export { HomeExploracionComponente, HomeExploracionEstados }
