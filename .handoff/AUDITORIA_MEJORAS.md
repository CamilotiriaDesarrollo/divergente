# Auditoría DivergenteWEB — checklist de mejoras

> Consolidado de 4 auditorías de la Fábrica de Software Divergente (2026-07-06): 🎨 `disenador-uiux` · 💻 `front-visualizaciones` · ✅ `qa-ingeniero` · 🔐 `seguridad-appsec`. Régimen **divergente** (marca propia; sin patrones GOV.CO).
> Cuando un ítem lo marcan **varios** auditores, es más confiable. Rutas relativas a la raíz del repo. Solo lectura: **nadie editó nada**, esto es el mapa para que edites tú.
> Postura de seguridad: **superficie baja** (sitio estático, sin backend/auth/BD). ASVS sugerido: **L1** (sube a L2 al conectar captura de leads).

## Cómo usar
- El dev server corre en **http://localhost:3000** (hot-reload: verás los cambios al guardar).
- Tienes los **15 agentes + 67 skills** sincronizados en `.claude/`; puedes invocar a cualquiera desde Claude Code mientras editas.
- Patrón de oro a copiar: **`app/metodologias/page.tsx` ya resuelve bien reduced-motion + isMobile** — es el molde para arreglar analítica, creatividad y SiteShell.

---

## 🔴 ALTA — bugs reales o bloqueantes de lanzamiento

- [ ] **Navegación rota / contenido mal ubicado** 🎨
  - `app/components/SiteShell.tsx` (`NAV_ITEMS`, `ROUTE_TO_INDEX`, `resolveIndex`): *Servicios* y *Blog* apuntan a páginas placeholder; la entrada "Servicios" usa internamente el esquema `hover-portafolio` (renómbralo a `hover-servicios`).
  - El contenido REAL de servicios (Investigación aplicada, Desarrollos digitales, IA aplicada, con tarjetas 3D) vive dentro de `app/analitica/page.tsx` → moverlo a `app/servicios/page.tsx`.
  - `app/portafolio/page.tsx`: ruta **huérfana** (no está en el nav, `resolveIndex`→`null`, renderiza con el chrome del HOME). Decide: agrégala a `NAV_ITEMS`/`ROUTE_TO_INDEX` o bórrala (y su `public/logo-portafolio.png`).
  - `app/servicios/page.tsx` y `app/blog/page.tsx`: hoy `.page-centered` "en actualización". Oculta del nav lo que no esté listo.

- [ ] **Reduced-motion desigual** 💻🎨 *(WCAG 2.3.3)*
  - `app/components/SiteShell.tsx:64-105`: el drift del fondo (`AUTO_SPEED_PX_PER_SEC`) lo mueve JS sobre `--bg-offset`, así que el `@media (prefers-reduced-motion)` de CSS **no lo frena**. Leer `matchMedia("(prefers-reduced-motion: reduce)")` y no arrancar el auto-drift si está activo; tampoco arrancar el loop cuando `isSubpage` (no hay `bgRef`).
  - `app/analitica/page.tsx` (~460-510): **sin ninguna guarda JS** — el melt del título corre por estilos inline que el CSS global no neutraliza. Replicar `if (reduceMotion.current) return;` de metodologías.
  - `app/creatividad/page.tsx:18-89`: el rAF del manifiesto no retorna temprano (visualmente OK por `globals.css:927 !important`, pero el loop sigue). Añadir `if (reduce) return;`.

- [ ] **Bug de hidratación (`isMobile`)** 💻
  - `app/metodologias/page.tsx:36-38` y `app/analitica/page.tsx:19-22`: `useState(() => typeof window !== "undefined" ? window.innerWidth <= 768 : false)` → el server siempre renderiza desktop y el móvil hidrata `true` → mismatch + salto. **Fix:** `useState(false)` y fijar el valor real en el `useEffect` de `check()` que ya existe.

- [ ] **Imágenes pesadas** ✅
  - `public/plataformas.gif` = **9.6 MB**, servido con `<img>` crudo en `app/analitica/page.tsx:553` → LCP catastrófico en móvil. Convertir a `<video>` MP4/WebM (o quitar).
  - Comprimir: `bg-card004.png` (2.2 MB), `bg-analitica.png` (1.6 MB), `insight.png` (1.05 MB), `logo.png` (1.2 MB). Migrar los `<img>` crudos a `next/image` con `sizes`.

- [ ] **Accesibilidad de teclado / foco / semántica** ✅🎨💻 *(WCAG 2.1.1 / 2.4.7 / AA)*
  - `app/analitica/page.tsx:628, 1066, 1105, 1136`: acordeones son `<div onClick>` sin `role="button"`, `tabIndex={0}` ni `onKeyDown` → no operables por teclado. Convertir a `<button>` o añadir role+tabIndex+handler Enter/Space.
  - `app/globals.css`: **0 reglas `:focus`/`:focus-visible`** en 2213 líneas; `app/metodologias/conferencias/page.tsx:398` fija `outline:none` sin reemplazo. Definir tokens `:focus-visible` por esquema de color.
  - `app/page.tsx` + `SiteShell.tsx:305-326`: home sin `<h1>` y sin landmark `<main>` (la rama `!isSubpage` no lo envuelve). Añadir `<main>` y un `<h1>` (puede ir visualmente oculto).
  - `SiteShell.tsx:280`: menú móvil no cierra con Escape ni atrapa foco.
  - **Contraste AA <4.5:1** (ya anotado en `METODOLOGIAS_SUPUESTOS.md:82`): salvia `#7cc9a7`/crema `#fff1b8` (~1.6:1), lavanda `#a99bcf`/`#9488b8` sobre `#f6f3ff` (~2–2.9:1), periwinkle `#6c7cff`/`#f2f4f8`. Crear una variante `--ink` por esquema, distinta del acento decorativo.
  - Activar el plugin `jsx-a11y` en el flat config (hoy no está).

- [ ] **Next.js con advisory HIGH** 🔐
  - `package.json` `next@16.2.4` → `npm i next@16.2.10`, regenerar lockfile, reconfirmar `npm audit --omit=dev` (0 high/critical).

---

## 🟡 MEDIA — calidad y endurecimiento

- [ ] **Lint en rojo + sin CI + sin Prettier** ✅💻 — `npm run lint` sale con código 1.
  - Errores app: `SiteShell.tsx:241` (`react-hooks/set-state-in-effect`), `app/analitica/page.tsx:440` (`<a href="/">` en vez de `<Link>`). Warnings: 3 `exhaustive-deps`, unused `ROUTE_LABELS`/`sectionPadTop`.
  - `eslint.config.mjs`: añadir `.claude/**` a `globalIgnores` (hoy el lint escanea el código de referencia de las skills → 136 problemas ajenos a la app).
  - Añadir Prettier + `format:check`; montar CI `lint + typecheck + build` (skills `qa-kit-eslint9-prettier-monorepo`, `devops-cicd-github-gitlab`).

- [ ] **SEO: `<title>Divergente</title>` para TODO el sitio** 💻 — las páginas animadas son client components; solo `layout.tsx:7` define metadata. Partir cada ruta en un Server Component que exporte `metadata` + un client con la animación.

- [ ] **Cabeceras de seguridad ausentes** 🔐💻 — `next.config.ts` vacío. Añadir `async headers()`: CSP explícita (probar en preview), `Strict-Transport-Security`, `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy`. Verificar la CSP en la respuesta real.

- [ ] **`AgentationDev` en riesgo de entrar al bundle de producción** 💻✅🔐 — `app/components/AgentationDev.tsx:3` importa `agentation` a nivel de módulo en un client component montado en `layout.tsx:23`. Cargar con import dinámico gateado por `NODE_ENV` (`dynamic(() => import("agentation")…, { ssr:false })`). Verificar con `grep` sobre `.next` tras `next build`.

- [ ] **Form de conferencias sin base de Habeas Data** 🔐 — `app/metodologias/conferencias/page.tsx:425-459`: capta Nombre/Organización sin aviso de privacidad ni consentimiento (Ley 1581 aplica a privados). Hoy solo va por el WhatsApp del propio usuario (mitiga), pero el placeholder de L457-458 anuncia "correo/CRM": antes de conectarlo, añadir política + finalidad + consentimiento (skill `seg-habeas-data-implementacion`).

- [ ] **Marca diluida** 🎨 — el índigo `#1a1b2e` + menta `#91fee6` solo vive en el home; cada sección es un color-world (`globals.css:532-580`) → se lee como "5 micrositios". Introducir un hilo de marca constante (header/wordmark siempre en menta/índigo) y armonizar los 5 acentos a una misma familia de saturación/luminosidad.

- [ ] **rAF que nunca pausan + `willChange` permanente** 💻 — `metodologias/page.tsx:181-271` (melt+ruido) y `:319-355` (canvas 320 partículas) corren siempre; el melt no verifica `isMobile`. `willChange` permanente en cada letra (`metodologias:1192`, `analitica:470,480,494,504`). Envolver con `IntersectionObserver`; `willChange` solo transitorio.

- [ ] **Footer / CTA inconsistente** 🎨 — `creatividad/page.tsx` termina sin CTA de cierre; footer distinto por página. Estandarizar un componente de cierre (social + wordmark + contacto) y reutilizarlo.

- [ ] **Bloque de iconos sociales duplicado** 💻 — `SiteShell.tsx:328-398`, `metodologias:1055-1070`, analítica (ya renombraron `ig-grad`→`ig-grad-mt` por IDs colisionantes). Extraer `<SocialLinks />`.

---

## 🟢 BAJA — pulido y deuda

- [ ] `Playfair` cargada en `app/layout.tsx` pero **sin uso** en ningún lado → quitar (peso muerto). 🎨💻
- [ ] `app/components/LogoIcon.tsx`: SVG inline de una línea (~41k tokens) que **nadie importa** → borrar o mover a `/public` como `.svg`. 💻
- [ ] `.hero-copy` usa `text-align: justify` (ríos en español) → `left`. 🎨
- [ ] Creatividad fija su fondo en `#1e2030`, un índigo distinto al de marca `#1a1b2e` sin razón → unificar. 🎨
- [ ] `app/analitica/page.tsx:918, 1149, 1167`: fondos hardcodeados (`#0d0d1a`, `#1a0a2e`, `#f0ecff`) fuera del sistema de tokens → promover a variables de esquema. 🎨
- [ ] `.gitignore` no cubre `.next-dev.*.log` ni `.mcp.json` (riesgo de commit accidental; los logs exponen ruta/usuario/IP LAN). 🔐
- [ ] `app/globals.css:23` `html,body{overflow:hidden}` oculta reflow horizontal en 320px → verificar con `qa-visual-puppeteer-scroll-shots` a 320/768/1440/4K. ✅
- [ ] `app/metodologias/conferencias/page.tsx`: 5 placeholders visibles al usuario (ejes "preliminares", 4 marcos punteados de logos) → cerrar contenido con el Dueño antes de publicar. 🎨🔐

---

## ⭐ Quick-wins recomendados (deja una base limpia, bajo riesgo)
Bloque de mayor relación impacto/esfuerzo, con patrón ya resuelto en el repo:
1. Lint en verde (los 2 errores + ignorar `.claude/**`).
2. Reduced-motion en SiteShell + analítica + creatividad (copiar de metodologías).
3. Fix de hidratación `isMobile` (init `false`).
4. `next@16.2.10`.
5. Foco visible (`:focus-visible`) + `<h1>`/`<main>` en el home.
6. Quitar Playfair y `LogoIcon.tsx` muertos.
