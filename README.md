# Divergente — Landing Page

Sitio web de **Divergente**, construido en Next.js 16 (App Router) + React 19 + Tailwind v4. El proyecto implementa una landing page con identidad visual fuerte (gran wordmark `DIVERGENTE`, paleta de colores que cambia por sección, animaciones sutiles), más 5 páginas internas (Analítica, Metodologías, Creatividad, Portafolio, Blog).

🔗 **Repo:** https://github.com/CamilotiriaDesarrollo/divergente
🌐 **Dev local:** `http://localhost:3000` (o 3001/3002 si el puerto está ocupado)

---

## Stack

| Capa | Versión | Notas |
|---|---|---|
| **Next.js** | 16.2.4 | App Router (no Pages Router) — convenciones modernas |
| **React** | 19.2.4 | Componentes Server por defecto, "use client" solo donde se necesita |
| **Tailwind CSS** | v4 | Tokens en `@theme inline` dentro de `globals.css` (no `tailwind.config.ts`) |
| **TypeScript** | ^5 | Strict mode |
| **Tipografía** | Eastman Alternate (local, OTF) + Montserrat (Google Fonts) | Cargadas vía `next/font` |
| **Imágenes** | `next/image` | `bg.png`, `logo.png` en `public/` |

> ⚠️ **Atención lectores que conozcan Next.js antiguo**: este proyecto usa Next.js 16 con Turbopack y React 19. Algunas APIs y convenciones difieren de versiones anteriores. Ver `AGENTS.md`. Antes de modificar comportamiento de Next, consultar `node_modules/next/dist/docs/`.

---

## Estructura del proyecto

```
divergente/
├── app/                              # Next.js App Router
│   ├── layout.tsx                    # Root layout (Server Component) — html/body + <SiteShell>
│   ├── page.tsx                      # Homepage (/)
│   ├── globals.css                   # Tokens, layout, animaciones (Tailwind v4)
│   ├── fonts.ts                      # Carga Eastman Alternate (local) + Montserrat (Google)
│   ├── favicon.ico
│   ├── components/
│   │   └── SiteShell.tsx             # Shell compartido (Client) — bg, wordmark, nav, iconos
│   ├── fonts/                        # OTF de Eastman Alternate (5 pesos)
│   ├── analitica/page.tsx            # /analitica
│   ├── metodologias/page.tsx         # /metodologias
│   ├── creatividad/page.tsx          # /creatividad
│   ├── portafolio/page.tsx           # /portafolio
│   └── blog/page.tsx                 # /blog
│
├── public/
│   ├── bg.png                        # Imagen de fondo (homepage), recoloreable vía mask-image
│   ├── logo.png                      # Logo de marca (header de subpáginas)
│   └── *.svg                         # Defaults de Next.js (sin uso)
│
├── .handoff/                         # Archivos originales del diseño (HTML mockups, fonts source)
├── .claude/                          # Configuración local de Claude Code
├── .gitignore
├── AGENTS.md                         # Guía para agentes de IA
├── CLAUDE.md                         # Apunta a AGENTS.md
├── next.config.ts
├── postcss.config.mjs
├── tsconfig.json
├── eslint.config.mjs
├── package.json
└── README.md                         # ← este archivo
```

**Nota**: `node_modules/`, `.next/`, `next-env.d.ts` y `tsconfig.tsbuildinfo` están en `.gitignore` — son auto-generados y se reconstruyen con `npm install` y `npm run dev`.

---

## Cómo correr el proyecto

### Primera vez (en cualquier PC)

```bash
git clone https://github.com/CamilotiriaDesarrollo/divergente.git
cd divergente
npm install            # instala dependencies (~457 MB, tarda 2-5 min)
npm run dev            # arranca dev server con Turbopack
```

Abrir `http://localhost:3000` en el navegador.

### Comandos disponibles

| Comando | Qué hace |
|---|---|
| `npm run dev` | Dev server con hot-reload (Turbopack) |
| `npm run build` | Build de producción |
| `npm run start` | Sirve el build de producción |
| `npm run lint` | ESLint |

---

## Arquitectura: cómo funciona el shell

El componente clave es `app/components/SiteShell.tsx`. Vive dentro de `app/layout.tsx` y envuelve a **todas** las páginas. Renderiza dos layouts diferentes según la ruta:

### En `/` (homepage)
- Imagen de fondo `bg.png` con `mask-image` recoloreado dinámicamente
- Wordmark `DIVERGENTE` gigante en el centro/abajo (font-size `14.5vw`)
- Nav horizontal abajo (debajo del wordmark)
- Iconos sociales fijos (YouTube, Instagram, LinkedIn, WhatsApp) arriba a la derecha
- **Auto-cycle**: cada 4-7 segundos cambia aleatoriamente entre los 5 esquemas + el default
- Hover sobre nav: pausa el ciclo y aplica el esquema de ese item

### En `/analitica`, `/metodologias`, `/creatividad`, `/portafolio`, `/blog`
- Header arriba con: logo PNG + texto `DIVERGENTE` + nav horizontal a la derecha
- Fondo sólido (sin imagen) — color de la sección
- Cuerpo centrado con `<h1 class="page-title">` + `<p class="page-subtitle">`
- **Esquema bloqueado** a la sección (no auto-cycle, no cambios en hover)

### Subpáginas (estructura del `page.tsx`)

```tsx
// app/analitica/page.tsx
export default function Analitica() {
  return (
    <div className="flex flex-col items-center gap-3 text-center">
      <h1 className="page-title">Analítica</h1>
      <p className="page-subtitle">Servicios de datos y analítica</p>
    </div>
  );
}
```

Tan simples como eso — todo el shell (header, nav, fondo) lo pone `SiteShell`.

---

## Sistema de diseño

### Tokens (en `app/globals.css`)

```css
@theme inline {
  --color-bg: #1a1b2e;
  --color-fg: #f5f5f0;
  --color-mint: #91fee6;
  --font-sans: var(--font-montserrat), …;
  --font-display: var(--font-eastman), …;
}

body {
  --bg: #1a1b2e;       /* fondo */
  --fg: #f5f5f0;       /* foreground (nav default) */
  --mint: #91fee6;     /* color de marca / acento */
  --nav-hover: #91fee6;
  --copy: #9ca3af;     /* hero copy / page subtitle */
}
```

### Esquemas por sección

Cada sección redefine las variables. El switch lo hace JS añadiendo una clase al `<body>`:

| Sección | Clase | `--bg` | `--mint` | Texto del nav (`--fg`) |
|---|---|---|---|---|
| Analítica | `hover-analitica` | `#f6f3ff` (lavender) | `#e6a7ff` (purple) | `#a99bcf` |
| Metodologías | `hover-metodologias` | `#fff1b8` (yellow) | `#005f46` (dark green) | `#7cc9a7` |
| Creatividad | `hover-creatividad` | `#1e2030` (navy oscuro) | `#ff6a00` (orange) | `#ffb26b` |
| Portafolio | `hover-portafolio` | `#f2f4f8` (light gray) | `#1f3bff` (blue) | `#6c7cff` |
| Blog | `hover-blog` | `#f2f4f8` (light gray) | `#b91d2c` (red) | `#e63946` |

Las transiciones entre esquemas son `0.35s ease` en bg, color y border.

### Tipografía

| Token | Valor |
|---|---|
| `--font-eastman` | Eastman Alternate (Thin/Extralight/Light/Regular/Bold) — local OTF |
| `--font-montserrat` | Montserrat (400/500/700) — Google Fonts vía `next/font/google` |

### Tamaños fluidos (clamp)

Todo escala con el viewport:

| Elemento | Min | Fluid | Max |
|---|---|---|---|
| Nav link | 1rem | 2.2vw | 56px |
| Hero copy (homepage) | 14px | 1vw | 32px |
| Page title (subpáginas) | 2.5rem | 6vw | 6rem |
| Page subtitle | 0.95rem | 1.1vw | 1.4rem |
| Wordmark vertical (mobile) | 2rem | min(18vw, 11vh) | 6.5rem |
| Logo (header subpáginas) | 64px | 4.5vw | 96px |
| DIVERGENTE en header | 1.875rem | 2.2vw | 3rem |
| Iconos sociales (desktop) | 24px | 1.5vw | 48px |

### Breakpoints

```css
/* Mobile / phone landscape (extiende a teléfonos en horizontal) */
@media (max-width: 700px),
       (orientation: landscape) and (max-height: 500px) {
  /* layout vertical wordmark + stacked nav */
}

/* Phone landscape específico */
@media (orientation: landscape) and (max-height: 500px) {
  /* tweaks puntuales para alturas pequeñas */
}

/* Touch devices (no hover) */
@media (hover: none) {
  .circle-link .icon-hover { display: none; }
}
```

### Optimización para touch

- Hover effects de iconos sociales y nav gateados con `@media (hover: hover)`
- En touch, cero animaciones de hover, tap → navega directo
- Handlers JS (`onPointerEnter/Leave`) chequean `e.pointerType === "mouse"` antes de actuar

---

## Rutas

| URL | Componente | Esquema fijo |
|---|---|---|
| `/` | `app/page.tsx` | ninguno (auto-cycle) |
| `/analitica` | `app/analitica/page.tsx` | hover-analitica |
| `/metodologias` | `app/metodologias/page.tsx` | hover-metodologias |
| `/creatividad` | `app/creatividad/page.tsx` | hover-creatividad |
| `/portafolio` | `app/portafolio/page.tsx` | hover-portafolio |
| `/blog` | `app/blog/page.tsx` | hover-blog |

Navegación entre rutas vía `<Link>` de `next/link` — client-side, sin recargar (el shell se mantiene montado).

---

## Workflow de Git

### Después de hacer cambios

```bash
git add .
git commit -m "descripción concisa"
git push
```

### Antes de empezar a trabajar (sobre todo si trabajas en otro PC)

```bash
git pull            # baja últimos cambios remotos
npm install         # solo si cambió package.json
npm run dev
```

### Marcar una versión / hito

```bash
git tag v1.0 -m "Primera versión estable"
git push --tags
```

### Crear rama para cambios arriesgados

```bash
git checkout -b experimento-x
# ... trabajas, commiteas ...
git push -u origin experimento-x
# si te gusta:
git checkout master
git merge experimento-x
```

---

## Notas sobre Next.js 16 + Tailwind v4

Diferencias importantes con setups anteriores:

- **Tailwind v4 no usa `tailwind.config.ts`**. Los tokens se definen directamente en CSS con `@theme inline`. Ya migrado.
- **Layouts**: `app/layout.tsx` es Server Component por defecto. Si necesitas hooks (useState, useEffect, refs), declara `"use client"` en el archivo donde los uses (ej. `SiteShell.tsx`).
- **Fuentes**: usar `next/font/local` y `next/font/google`. Los archivos de fuente están en `app/fonts/`.
- **Imágenes**: usar `<Image>` de `next/image` (optimización automática). `priority` para imágenes above-the-fold.
- **CSS**: import absoluto en `app/layout.tsx` con `import "./globals.css"`.

Si vas a tocar comportamiento de Next, lee primero la doc relevante en `node_modules/next/dist/docs/01-app/`.

---

## Decisiones de diseño documentadas

1. **El homepage tiene una identidad distinta a las subpáginas**: wordmark gigante + bg con imagen + auto-cycle. Las subpáginas son más "informativas": header arriba, contenido centrado, esquema de color fijo.
2. **Las subpáginas no tienen hover-cycle de esquemas**: solo en homepage. En subpáginas el esquema queda fijo, los hovers no cambian la página entera.
3. **El logo PNG (header de subpáginas) NO está dentro de una caja oscura**: se muestra solo, con su propio diseño circular.
4. **`DIVERGENTE` (texto del header) usa `var(--mint)`**: cambia de color con cada esquema (purple en analítica, naranja en creatividad, etc.).
5. **Iconos sociales solo visibles en homepage** (por ahora). Pendiente: footer compartido para subpáginas.
6. **`.handoff/` está en el repo**: contiene los archivos originales del diseño (HTML mockups, fonts originales). Se incluyó para que clonar el repo dé acceso completo al contexto.

---

## Roadmap (lo que falta)

- [ ] Footer compartido con redes + copyright
- [ ] Componentes reutilizables (Button, Card, Container, SectionHeader)
- [ ] Llenar el contenido real de cada subpágina (actualmente solo título + subtítulo)
- [ ] Grid de casos de estudio en `/portafolio`
- [ ] Listado de artículos en `/blog`
- [ ] Hamburger menu mobile (opcional — actualmente nav stacked aprobado)
- [ ] QA en dispositivo físico (celular real)
- [ ] Deploy a Vercel u otra plataforma

---

## Contacto

Maintained by [@CamilotiriaDesarrollo](https://github.com/CamilotiriaDesarrollo).
