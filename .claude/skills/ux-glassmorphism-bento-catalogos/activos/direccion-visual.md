# Dirección visual — Vitrina de Sistemas (cierre Fase 1)

Documento fuente de verdad para la Fase 2. Decidido con el usuario el 2026-06-11.

## Dirección elegida: **Bento + Vidrio**

Rejilla **bento uniforme** (celdas de tamaño similar, sin jerarquía fija) de tarjetas en **vidrio esmerilado** (glassmorphism) sobre **fotografía cultural difuminada**. Encima, un **buscador transversal** + **chips de filtro** (tema · acceso · público). Sensación buscada: cada sistema es "una puerta a un mundo de posibilidades para explorar la cultura".

### Referencias guía
- Glass / profundidad: Tomorrow.io, Apple Apple Intelligence, Vercel.
- Microinteracciones: family.co.
- Estructura accesible de tarjeta: Card de USWDS (`ul/li`, jerarquía de headings).
- Lenguaje humanizado (cero siglas): España es Cultura, GOV.UK.

## Reglas de la dirección

1. **Vidrio**: fondo translúcido con `backdrop-filter: blur()` (blur moderado 8–14px), borde fino translúcido (1px `rgba(255,255,255,.25)`), sombra suave. Sobre cada celda, una **capa de oscurecimiento** (gradiente) para garantizar contraste de texto.
2. **Fotografía**: una imagen temática por sector cultural (no por sistema), difuminada y oscurecida bajo el vidrio. Va en `client/public/fondos/{tema}.jpg`. Fallback: gradiente cromático del tema si la imagen no carga.
3. **Bento uniforme**: celdas de igual peso, rejilla responsive (auto-fit). Sin destacados fijos. La jerarquía la dan los filtros y el orden temático.
4. **Color por tema** (acento de cada celda y gradiente de respaldo):
   - artes `#C2410C` · cine `#B11226` · estímulos `#7C3AED` · fomento `#0F766E` · museos `#1D4ED8` · patrimonio `#0E7490` · datos `#00A9A5` · institucional `#512DA8` · gestión `#475569`
5. **Cero siglas en la fachada**: cada tarjeta muestra el **nombre humanizado** (SIARTES → "Catálogo de las Artes"). La marca/sigla queda como subtítulo discreto.
6. **Tag de acceso** por tarjeta: Abierto · Requiere registro · Mixto.
7. **Accesibilidad AA (NTC 5854)**: contraste ≥ 4.5:1 del texto contra el peor caso del fondo, foco visible, navegación por teclado, semántica `ul/li` + headings, `prefers-reduced-motion` respetado, `alt` en imágenes decorativas vacío y rol adecuado.

## Alcance de datos
Las **32 plataformas "Confirmadas Operativas"** (hoja 5 del Excel). Se incluyen las de uso interno (gestión documental, evaluaciones), marcadas con público `funcionarios` para que el **filtro de público** las separe de la experiencia ciudadana sin ocultarlas.

## Ubicación
Nueva **landing principal**: reemplaza `PortalSectionV1` en `client/src/pages/Home.tsx`.
