---
name: front-nextjs-app-router-shell-compartido
regimen: universal
description: Estructura sitios multipágina en Next.js 16 App Router con un único shell cliente compartido (header/nav/fondo persistentes) y dos estrategias de routing — por ruta con usePathname() o interno por estado React con sidebar flotante. Cargar al crear o modificar layout.tsx/SiteShell, al añadir secciones a un dashboard tipo GEDII, o cuando una página con html/body overflow:hidden necesite scroll propio.
---

# Front · Next.js App Router con shell compartido

**Nivel actual:** N3 · **Dominio:** Frontend · **Agente(s):** front-lider
**Proyectos fuente:** DivergenteWEB, Plataforma GEDII

> Criterio de ascenso a N1: los 5 bloques completos, con activos copiables de ruta real y gotchas verificados (no genéricos). A N2: ≥1 uso real aceptado por el Dueño. A N3: ≥3 usos exitosos en ≥2 proyectos + checklist propio.

## 1. Propósito

Resolver el problema de "un solo cascarón, muchas vistas" en Next.js 16 App Router: header, navegación, fondo animado y contenedor de scroll viven UNA vez en un componente cliente (`SiteShell`) montado desde el `layout.tsx` servidor, y las páginas solo aportan contenido. Cubre dos variantes probadas:

- **Variante A — routing por ruta (DivergenteWEB)**: rutas reales de App Router (`/analitica`, `/metodologias`, …) y un `SiteShell` que decide con `usePathname()` entre DOS layouts: home inmersiva sin scroll de ventana vs subpáginas con header fijo y scroll propio. Las rutas anidadas heredan el esquema de color del padre por prefix-matching.
- **Variante B — routing interno por estado (Plataforma GEDII)**: una sola `app/page.js` con `const [activeSidebar, setActiveSidebar] = useState("home")` que alterna componentes de sección, más rutas reales solo para flujos aparte (`/investigar`). Sidebar flotante `position:fixed` cuyos límites top/bottom se recalculan con `getBoundingClientRect()` del header y el footer en cada scroll/resize.

Se carga cuando: se arranca un sitio Next.js multipágina con identidad visual persistente; se añade una sección/ruta a uno de estos shells; hay bugs de scroll u overlays entre navegaciones; o se duda entre crear rutas reales o secciones por estado.

## 2. Procedimiento

1. **ANTES de escribir código Next.js: leer la documentación embebida.** Ambos proyectos usan Next 16.2.4 + React 19.2.4 (post-cutoff, con breaking changes). La regla vive en `AGENTS.md` de ambos proyectos ("This is NOT the Next.js you know"): leer la guía relevante en `node_modules/next/dist/docs/` (subcarpetas verificadas: `01-app/`, `02-pages/`, `03-architecture/`) antes de tocar APIs, y obedecer avisos de deprecación. `CLAUDE.md` del proyecto debe contener `@AGENTS.md` para que la regla aplique a todos los agentes.

2. **Elegir la variante de routing** con estos criterios:
   - **Variante A (rutas reales + usePathname)** si: las secciones deben ser URLs compartibles/indexables, cada sección tiene identidad visual propia (esquema de color, logo), o hay páginas con layouts radicalmente distintos (home inmersiva vs subpáginas).
   - **Variante B (estado interno)** si: es un dashboard/plataforma donde las secciones son paneles del mismo marco (mismo header GOV.CO + sidebar), el cambio de sección debe ser instantáneo sin remontar el shell, y no importa que la URL no cambie. Las secciones que sí son flujos independientes (formulario wizard) se sacan a ruta real y se navegan con `router.push(item.route)` — GEDII mezcla ambas: `SIDEBAR_ITEMS` tiene entradas con y sin `route`.

3. **Montar el shell (ambas variantes).** `app/layout.tsx` queda como Server Component mínimo que solo exporta `metadata`, carga fuentes y envuelve: `<body><SiteShell>{children}</SiteShell></body>` (DivergenteWEB `app/layout.tsx`, 27 líneas). Todo lo interactivo va en `app/components/SiteShell.tsx` con `"use client"` en la primera línea. Regla GEDII (CLAUDE.md §11): todo componente con interactividad lleva `'use client'`.

4. **Variante A — resolver la ruta a un índice de esquema.** Copiar el patrón de `SiteShell.tsx` líneas 18-49: un mapa `ROUTE_TO_INDEX` de rutas base a índice, y `resolveIndex(pathname)` que primero busca match exacto y si no, hereda por prefijo:
   ```ts
   function resolveIndex(pathname: string): number | null {
     if (pathname in ROUTE_TO_INDEX) return ROUTE_TO_INDEX[pathname];
     // Nested routes (e.g. /metodologias/conferencias) inherit the parent scheme.
     const match = Object.keys(ROUTE_TO_INDEX).find((base) => pathname.startsWith(`${base}/`));
     return match ? ROUTE_TO_INDEX[match] : null;
   }
   ```
   `null` = home (layout inmersivo); número = subpágina (layout con header). El esquema se aplica como clase en `document.body` y el efecto lo limpia SIEMPRE en el cleanup (`document.body.classList.remove(...SCHEMES)`).

5. **Variante A — doble layout dentro del mismo shell.** Un solo render con ternario sobre `isSubpage = lockedIndex !== null`:
   - Subpágina: `<div ref={containerRef} data-scroll-container className="h-screen overflow-y-auto">` que contiene `<header className="site-header">` + `<main className="site-main">{children}</main>`.
   - Home: `<div style={{ height: "100dvh" }}>` con `{children}` + wordmark + nav abajo, más `bg-layer` animada y círculos sociales que solo se montan con `!isSubpage`.
   En home el body no scrollea (html/body con `overflow:hidden` en `globals.css` líneas 17-24) y el "scroll" solo alimenta la animación del fondo vía listeners `wheel`/`touchmove` pasivos.

6. **Variante A — contrato de scroll para las páginas.** Como `window` nunca scrollea, toda página que anime con scroll busca el contenedor del shell: `document.querySelector<HTMLElement>("[data-scroll-container]")` y lee `container.scrollTop` (evidencia: `app/creatividad/page.tsx` línea 20, `app/analitica/page.tsx` línea 110, `app/metodologias/page.tsx` líneas 93/183/377). El selector `[data-scroll-container]` lleva en CSS `height:100vh; height:100dvh;` (globals.css 648-651).

7. **Variante B — estado y estructura del shell GEDII.** En `app/page.js`: estados `activeSidebar`, `navCollapsed`, `sbTop`, `sbBottom` + refs `headerRef`/`footerRef`. Estructura fija (GEDII CLAUDE.md §3): barra GOV.CO → header blanco → `<div display:flex>` con `<aside position:fixed>` + `<div flex:1>` contenido → tira de logos y `<footer>` FUERA del flex. El contenido alterna por condición: `{activeSidebar === "arquitectura" ? <ArquitecturaMetodologica/> : <>...</>}`. Para añadir sección: entrada en `SIDEBAR_ITEMS`, componente en `app/components/`, import y condición en el render — nada más.

8. **Variante B — sidebar flotante con límites dinámicos.** El sidebar es `position:fixed; top:sbTop; bottom:sbBottom` y los límites se recalculan para que nunca tape header ni footer (page.js líneas 51-68):
   ```js
   function calcBounds() {
     const hdr = headerRef.current, ftr = footerRef.current;
     if (!hdr || !ftr) return;
     setSbTop(Math.max(0, hdr.getBoundingClientRect().bottom));
     setSbBottom(Math.max(0, window.innerHeight - ftr.getBoundingClientRect().top));
   }
   // listeners: scroll (passive:true) + resize, con cleanup
   ```
   Ancho por estado: `const sidebarW = navCollapsed ? 62 : 252;`. Expandido flota sobre el contenido (`marginLeft:0` + glass `rgba(255,255,255,0.55)` + `backdropFilter:blur(14px)`); colapsado empuja (`marginLeft: sidebarW` en el main, transición `margin-left 0.25s ease`) — page.js línea 226.

9. **Ajustes de precisión del shell (variante A).** Si la nav debe alinearse con un wordmark tipográfico, medir DESPUÉS de cargar fuentes: `document.fonts.ready.then(alignNav)` + listener de `resize` (SiteShell.tsx líneas 107-124, usa `Range.getBoundingClientRect()` para medir el texto real, no la caja).

10. **Higiene entre navegaciones (variante A).** Al cambiar `pathname`: cerrar menú móvil (`useEffect(() => { setMenuOpen(false); }, [pathname])`, línea 241) y resetear scroll del contenedor (`container.scrollTop = 0` al inicio del efecto dependiente de `lockedIndex`, línea 205) — el contenedor persiste entre páginas y conserva el scroll anterior si no se resetea.

## 3. Activos copiables

| Activo (en `activos/` de esta skill) | Origen verificado | Cuándo copiarlo / qué adaptar |
|---|---|---|
| `activos/SiteShell.tsx` (16.8KB) | `C:\Users\camil\Desktop\IA Raiz Proyectos\002 Desarrollos\DivergenteWEB\app\components\SiteShell.tsx` | Base de la variante A. Adaptar: `NAV_ITEMS`/`ROUTE_TO_INDEX`/`LOGO_SRCS` a las secciones del proyecto; quitar `bg-layer` animada y círculos sociales si no aplican; conservar `resolveIndex`, el doble layout y los cleanups de clases del body. |
| `activos/layout.tsx` (845B) | `C:\Users\camil\Desktop\IA Raiz Proyectos\002 Desarrollos\DivergenteWEB\app\layout.tsx` | Plantilla del RootLayout servidor mínimo. Adaptar metadata, fuentes (`./fonts`) y quitar `AgentationDev` (herramienta dev propia de Divergente). |
| `activos/gedii-shell-routing-estado.fragmento.js` (8.4KB) | Extraído de `C:\Users\camil\Desktop\IA Raiz Proyectos\002 Desarrollos\Plataforma GEDII\app\page.js` líneas 38-70 y 170-242 (el original pesa 130KB por un logo base64 — no copiable entero) | Base de la variante B: estados, `calcBounds`, sidebar flotante colapsable con iconos SVG y alternancia de contenido. Adaptar `SIDEBAR_ITEMS`, paleta y componentes de sección. |
| `activos/scroll-container.fragmento.css` | Extraído de `C:\Users\camil\Desktop\IA Raiz Proyectos\002 Desarrollos\DivergenteWEB\app\globals.css` líneas 17-24 y 647-651 | Contrato CSS del scroll propio: `html/body overflow:hidden` + `[data-scroll-container]` con `100vh`→`100dvh`. Copiar tal cual cuando la home sea inmersiva sin scroll de ventana. |
| `activos/AGENTS.md` (332B) | `C:\Users\camil\Desktop\IA Raiz Proyectos\002 Desarrollos\DivergenteWEB\AGENTS.md` (idéntico en Plataforma GEDII) | Copiar a la raíz de TODO proyecto Next 16+ y referenciarlo con `@AGENTS.md` en su CLAUDE.md. Obliga a leer `node_modules/next/dist/docs/` antes de codificar. |

Referencia adicional (no copiada, consultar en origen): `Plataforma GEDII\CLAUDE.md` — design system completo del shell GEDII (paleta `P`, tipografías Barlow, patrones de tabs internos, grid `.portal-v1__grid`, tarjetas flip) y reglas de código §11.

## 4. Gotchas verificados

1. **Next 16 NO es el Next.js del entrenamiento.** APIs, convenciones y estructura de archivos cambiaron post-cutoff. Ambos proyectos lo blindan con `AGENTS.md` ("This is NOT the Next.js you know... Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices."). Verificado que `node_modules/next/dist/docs/` existe con guías `01-app/`, `02-pages/`, `03-architecture/`. No escribir código App Router de memoria.
2. **`window.scrollY` devuelve siempre 0 con html/body en `overflow:hidden`.** En Divergente el scroll vive en el div `[data-scroll-container]` del shell; los efectos de scroll de las páginas que usaran `window` no dispararían nunca. Solución aplicada: cada página consulta `document.querySelector("[data-scroll-container]")` y lee `container.scrollTop`/`container.clientHeight` (creatividad/page.tsx:20-40, analitica/page.tsx:110). Evidencia: `DivergenteWEB\app\globals.css:17-24` + usos citados.
3. **`100vh` miente en móvil (barras de Chrome/Safari).** El contenedor de scroll usa doble declaración `height:100vh; height:100dvh;` con el comentario original "Dynamic viewport height — Chrome/Safari mobile bars excluded". Evidencia: `DivergenteWEB\app\globals.css:647-651`; la home usa `style={{ height: "100dvh" }}` (SiteShell.tsx:306).
4. **El contenedor de scroll persiste entre navegaciones y conserva el scroll de la página anterior.** Al navegar de una subpágina scrolleada a otra, el usuario aterrizaría a mitad de página. Solución: `container.scrollTop = 0` dentro del efecto que depende de `lockedIndex` (SiteShell.tsx:205). Igual con el menú móvil abierto: `useEffect(() => { setMenuOpen(false); }, [pathname])` (SiteShell.tsx:241).
5. **Clases de esquema aplicadas a `document.body` se fugan entre rutas si el efecto no limpia.** El shell aplica `hover-analitica`, etc. al body; tanto el efecto de subpágina como el de home retornan cleanup que hace `document.body.classList.remove(...SCHEMES)` y desactiva `is-active` de los links (SiteShell.tsx:140-148 y 189-196). Sin ese cleanup, el color de una sección contamina la siguiente.
6. **Medir el layout antes de que carguen las fuentes da paddings incorrectos.** La alineación de la nav con el wordmark se calcula con `document.fonts.ready.then(alignNav)` — con la fuente fallback las medidas de `Range.getBoundingClientRect()` salen distintas y la nav queda desalineada (SiteShell.tsx:107-124).
7. **Sidebar `position:fixed` tapa header y footer al hacer scroll.** En GEDII el sidebar no puede usar top/bottom estáticos porque el header scrollea fuera de vista y el footer entra. Solución: `calcBounds()` con `getBoundingClientRect()` de ambos, recalculado en `scroll` (passive) y `resize`, con transición corta `top 0.08s linear, bottom 0.08s linear` para que siga el scroll sin saltos (Plataforma GEDII `app\page.js:51-68` y `:175`).
8. **Rutas anidadas perdían el esquema del padre.** `/metodologias/conferencias` no está en `ROUTE_TO_INDEX`; con match exacto la página caería al layout de home. Solución: prefix-matching en `resolveIndex` con el comentario original "Nested routes (e.g. /metodologias/conferencias) inherit the parent scheme." (SiteShell.tsx:42-49).
9. **Editar `app/page.js` de GEDII con el Edit tool falla o corrompe: pesa 130KB con un base64 inline.** Regla documentada del proyecto: archivos >50KB se editan con Python `open(..., encoding='utf-8')` (GEDII `CLAUDE.md` §11; los scripts `_patch_actores*.py` en la raíz del proyecto son la práctica real). Verificado en esta investigación: la línea del `LOGO_IMG` revienta lectores de archivo.
10. **Caché de Turbopack corrupta tras cambios de estructura.** Remedio documentado del proyecto en PowerShell: `Remove-Item -Recurse -Force .next` (GEDII `CLAUDE.md`, cabecera y §11).

## 5. Criterios de done

- [ ] Se leyó la guía correspondiente en `node_modules/next/dist/docs/01-app/` antes de escribir/modificar código del shell, y no se usó ninguna API marcada como deprecada.
- [ ] `app/layout.tsx` sigue siendo Server Component (exporta `metadata`, sin `"use client"`, sin hooks) y delega TODO lo interactivo al SiteShell cliente.
- [ ] La variante elegida (ruta vs estado) está justificada con los criterios del paso 2 y las secciones-flujo independientes (wizards) usan ruta real.
- [ ] Variante A: navegar a una ruta anidada nueva conserva el esquema del padre (probar `/seccion/subpagina`); volver a `/` restaura el layout inmersivo sin clases residuales en `<body>` (inspeccionar en DevTools).
- [ ] Variante A: las animaciones de scroll de páginas leen `[data-scroll-container]`, no `window`; al navegar entre subpáginas el scroll arranca en 0 y el menú móvil se cierra.
- [ ] Variante B: el sidebar nunca solapa header ni footer en ningún punto del scroll (probar en tope, medio y fondo de página) y el colapso alterna correctamente flotar/empujar el contenido.
- [ ] `npm run build` pasa sin errores ni warnings de deprecación en Next 16.
- [ ] Probado en móvil (o emulación) que la altura usa `100dvh` y no deja franja muerta bajo las barras del navegador.
- [ ] Añadir una sección nueva requirió solo: (A) entrada en `NAV_ITEMS`+`ROUTE_TO_INDEX`+carpeta de ruta, o (B) entrada en `SIDEBAR_ITEMS`+componente+condición — sin tocar el resto del shell.

## Registro de uso
| Fecha | Proyecto | Tarea | Resultado | Lección |
|---|---|---|---|---|
| histórico | DivergenteWEB | uso original (fuente de esta skill) | ok | - |
| histórico | Plataforma GEDII | uso original (fuente de esta skill) | ok | - |
