# Metodologías + Conferencias — supuestos, imágenes y placeholders

> EJEMPLO REAL entregado en DivergenteWEB (Next.js 16). Copia literal de
> `DivergenteWEB/METODOLOGIAS_SUPUESTOS.md` con el número de WhatsApp redactado (dato personal).
> Sirve como referencia de "cómo se ve uno bien hecho". NO lo entregues tal cual: es de otro proyecto.

> Entregable de acompañamiento al build de `/metodologias` y `/metodologias/conferencias`.
> Resume las decisiones que tomé, las imágenes que sugiero crear, y lo que falta de contenido real.

---

## 1. Qué se construyó

- **`/metodologias`** — landing completa con las 8 secciones del roadmap (5.1–5.8):
  Hero · El Problema · El Giro (momento signature) · El Método (4 pilares) ·
  Las 4 Modalidades · Para quién · Destacado Conferencias · Cierre/CTA.
- **`/metodologias/conferencias`** — sub-página con: hero de orador · de qué hablo (4 ejes) ·
  formatos · para tu evento/institución · temas · prueba social · formulario de contratación.
- **Sistema de movimiento "Respiración"** en `globals.css` (clases `.mt-*`): reveals lentos
  (1.2 s), líneas que se dibujan solas, halos que respiran (ciclo 8 s = inhala 4 / exhala 4),
  hover calmado, y un único momento fuerte (El Giro).
- **`prefers-reduced-motion`** respetado en todo el sitio: sin partículas, sin desplazamientos,
  solo aparición instantánea. El canvas dibuja un estado quieto fijo.

## 2. Cohesión con Analítica (decisiones replicadas)

- **Sin librerías de animación** — todo a mano con `requestAnimationFrame` + scroll en
  `[data-scroll-container]`, igual que Analítica.
- **Logo que viaja del bottom al header** al hacer scroll (mismo gesto de marca).
- **DIVERGENTE gigante recortado** al pie de página + barra de íconos sociales compartida.
- Esquema de color **bloqueado** a la sección (`body.hover-metodologias`: crema `#fff1b8`,
  verde profundo `#005f46`, salvia `#7cc9a7`). Acento cálido terracota `#c9764a` con moderación.
- `SiteShell` ahora resuelve **rutas anidadas** (`/metodologias/conferencias` hereda el esquema).

## 3. Supuestos tomados (confirmar con cliente)

| # | Supuesto | Cómo cambiarlo |
|---|---|---|
| 1 | **H1 elegido:** *"Más información no es más claridad."* | En `page.tsx`, sección HERO. |
| 2 | **Stack = código custom Next.js** (resuelto: el sitio ya es Next 16). | — |
| 3 | **El Giro = campo de puntos (ruido) que se aquieta en un anillo que respira**, en `<canvas>` con fallback estático. | Ver variantes en §5. |
| 4 | Leads del formulario **salen por WhatsApp** (`wa.me/<numero-redactado>`) por ahora. | Definir correo/CRM (decisión 11.6 del roadmap). |
| 5 | **Toggle de "silencio"**: NO incluido (queda para v2, como sugiere el roadmap). | — |
| 6 | CTAs "Hablemos"/"Escríbenos" → WhatsApp. | Cambiar `href` si hay otro canal. |

## 4. Imágenes sugeridas (crear / aportar)

Estilo coherente: orgánico, sobrio, nada de "stock de velas". Tratamiento minimalista en verde/crema.

| Ubicación | Archivo sugerido | Qué debería mostrar |
|---|---|---|
| Hero metodologías (opcional, refuerzo del halo) | `/public/mt/hero-blob.png` | Forma orgánica abstracta verde salvia translúcida. Hoy se resuelve con CSS, una imagen real le daría textura. |
| El Método — fondo sutil (opcional) | `/public/mt/observar.jpg` | Foto real de taller, tratada en duotono verde, muy tenue. |
| Destacado Conferencias | `/public/mt/camilo-tarima.jpg` | **Foto en tarima** (la pieza visual más importante). Tratamiento sobrio. |
| Conferencias — hero | `/public/mt/camilo-retrato.jpg` | Retrato de orador, recortado, duotono. |
| Conferencias — prueba social | `/public/mt/logos/*.png` | Logos de instituciones/eventos donde ha estado. |

> Si me pasas las fotos reales (o me dices el concepto), genero el tratamiento/duotono y las integro.

## 5. Variantes del momento signature (El Giro) — para elegir

1. **(Implementada) Anillo que respira** — los puntos del ruido convergen en un círculo que
   inhala/exhala. Limpio y muy "metodologías".
2. **Punto único en calma** — el ruido se disuelve hasta quedar un solo punto centrado (más radical/minimalista).
3. **Espacio que se abre** — los puntos se apartan dejando un vacío central luminoso (la quietud como espacio, no como objeto).

Las tres comparten el mismo motor de canvas; cambiar entre ellas es ~10 líneas. Dime cuál prefieres.

## 6. Placeholders pendientes de contenido real

- [ ] **Títulos reales de conferencias** (hoy hay 4 de muestra en `/conferencias`).
- [ ] **Ejes temáticos** definitivos (hoy 4 preliminares).
- [ ] **Duraciones** reales de cada formato (Keynote / Conferencia-taller / Experiencia).
- [ ] **Prueba social**: logos o menciones (hoy 4 marcos punteados).
- [ ] **Destino de leads** del formulario (correo/CRM).
- [ ] **Fotos** en tarima / talleres (ver §4).
- [ ] *(Opcional)* One-sheet / rider del conferencista en PDF (sección 6.8 del roadmap).

## 7. Checklist de accesibilidad / performance

- [x] `prefers-reduced-motion`: desactiva canvas animado, parallax y reveals → aparición simple.
- [x] Animaciones por `IntersectionObserver`, no por scroll continuo costoso (salvo hero/giro, que son ligeros).
- [x] Canvas con menos partículas en móvil (130 vs 320) y `devicePixelRatio` cap a 2.
- [x] `alt`/`aria-label` en logo e íconos; headings semánticos (h1/h2/h3).
- [ ] **Pendiente medir fps en móvil gama media** (decisión del roadmap 7) — si baja de 50fps, reducir partículas.
- [ ] Revisar contraste de salvia `#7cc9a7` sobre crema en textos pequeños (usado solo en textos grandes/eyebrows; OK, pero verificar con herramienta).
