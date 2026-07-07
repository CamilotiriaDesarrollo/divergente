# CHANGELOG — Plataforma GEDII

> Gestión Estratégica de Datos, Información e Investigaciones  
> Ministerio de las Culturas, las Artes y los Saberes — Colombia  
> Stack: Next.js 16.2.4 · React 19.2.4 · Leaflet 1.9.4 · Turbopack

---

## [0.2.0] — 2026-05-21 · Principios, limpieza de página y sidebar flotante

### Nuevas funcionalidades
- **Sección `PrincipiosInvestigacion`** (`app/components/PrincipiosInvestigacion.js`)
  - 10 tarjetas de flip con los principios del Marco de Valores GEDII
  - Frente: solo el título del principio, tipografía Barlow Condensed
  - Reverso: texto descriptivo completo, fondo oscuro por principio, con scroll si desborda
  - Interacción flip por CSS hover (`v1-flip`, `v1-flip__inner`, etc. de `globals.css`)
  - Grid 5 × 2 con aspect-ratio 4:5 para pantallas de 1440 px
  - Sin iconos, sin numeración, sin separadores — solo contenido textual

- **Tira de plataformas** antes del footer
  - 5 logos: SoyCultura, Estímulos, SIPA, SIA, SINIC
  - Usando CSS `.tira-footer`, `.tira-plataformas`, `.tira-item` de `globals.css`
  - Datos de URLs en `app/components/portalSectionV1.js` (archivado)

- **Sidebar flotante con auto-colapso**
  - Se colapsa automáticamente al hacer scroll (`window.scrollY > 60`)
  - Se expande temporalmente al hacer hover sobre la barra colapsada
  - Siempre visible mientras se navega (sticky top:0, height:100vh)
  - Botón de colapso manual eliminado; comportamiento ahora automático

### Cambios en `app/page.js`
- **Eliminadas** las secciones: Hero (imagen base64 ~800 KB), Stats, Explorar el Sistema
- **Eliminados** componentes: `ModuleCard`, `Counter`, `DecorIcon`, `Arrows`, `GradPlaceholder`
- **Eliminadas** las constantes: `HERO_IMG`, `IMGS` (imágenes base64 para módulos), `STATS`, `MODULES`
- **Eliminada** la importación de `PortalSectionV1`
- Reducción del archivo: ~875 KB → ~50 KB (quita 10 imágenes base64)
- Sidebar: estados `sidebarHovered` + scroll listener + cómputo `sidebarW`

### Cambios en `app/components/MapaColombiaInner.js`
- `scrollWheelZoom: false` — se desactiva zoom con rueda del mouse

---

## [0.1.0] — 2026-05-20 · Dashboard GEDII con mapa coroplético y filtros reactivos

### Arquitectura general
- Layout de dos columnas: sidebar colapsable (252 px / 62 px) + área principal
- Barra GOV.CO, header con logo y título GEDII, footer institucional
- Tipografías: Barlow Condensed (títulos), Barlow (cuerpo) — Google Fonts
- Paleta: morados `#1A0A3D`, `#2D1658`, `#4A2E8A`, `#9080B8`; acento `#E8A020`

### Dashboard `DashboardInvestigaciones` (`app/components/dashboard.js`)

**Dataset (`data/plataformas.js`)**
- 40 investigaciones ficticias con campos: `id`, `titulo`, `año`, `estado`, `temas[]`, `tipo`,
  `metodologia`, `alcance`, `comunidad[]`, `departamentos[]`, `dependencia`, `descripcion`
- 9 temas culturales, 8 metodologías, 6 estados, 32 departamentos

**Cadena de filtros en tres niveles**
```
filteredNoTerr  →  todos los filtros excepto departamentos
filteredBase    →  filteredNoTerr + departamentos (para barras de dependencia)
filtered        →  filteredBase + dependencia (para KPIs, gráficos y conteos)
```
- Evita que la UI colapse al seleccionar un filtro dimensional

**Panel izquierdo — Filtros (tabs A / B / Últimas)**
- **Tab A – Temporal**: chips de año (con conteo reactivo), estado (con conteo), búsqueda libre
- **Tab B – Temático**: nube de palabras por temas, chips de tipo, metodología, alcance, comunidad
- **Tab Últimas**: tabla scrollable con las investigaciones más recientes (orden año desc)
  - Columnas: título + metadatos, año, chip de estado

**Nube de palabras (`WordCloud`)**
- Flex-wrap, tipografía Barlow Condensed
- 9 temas en paleta de morados `#1A0A3D` → `#C0B0E0` (proporcional a frecuencia)
- Tamaños: `clamp` 9 px – 33 px según `(count - min) / span`
- Sin negrita, sin opacidad especial — color transmite jerarquía
- Filtrable: clic en una palabra activa/desactiva ese tema

**Panel derecho — Mapa y sección territorial**
- Mapa coroplético de Colombia con Leaflet + GeoJSON departamental
- Colores por cantidad de investigaciones: 5 tonos de morado
- Clic en departamento → filtra por ese departamento
- Tooltips con nombre + conteo
- Tiles OSM en escala de grises (opacidad 50%)
- Leyenda de colores debajo del mapa
- Barras de dependencia institucional (InstitucionPanel)

**KPIs y gráficos**
- 4 tarjetas KPI: total, estados activos, comunidades cubiertas, años con datos
- Histograma de años (barras SVG inline)
- Gráfico de anillos de estado

**Sidebar de navegación**
- 8 ítems con íconos SVG: HOME, Registra tu investigación, Arquitectura metodológica,
  Modelo de gestión de datos, Divulgación, Caja de herramientas, Marco ético,
  Caracterización de actores
- Perfil de usuario (Liliana Pérez — Dirección de Artes)
- Logo GEDII con ícono de escudo

### Mapa Colombia (`app/components/MapaColombiaInner.js`)
- Carga Leaflet dinámicamente (evita errores SSR)
- Usa `useRef` para preservar instancia del mapa entre renders
- `applyColors()` reactivo a `data` y `fDepts` sin recrear la capa
- Fondo gris-azulado `#CDD1DA`

### Archivos de datos y estáticos
- `data/plataformas.js` — dataset + exports (`cards`, `perfilCards`, `perfiles`)
- `public/logos/` — 5 logos SVG de sistemas de información del Ministerio:
  `logo_soycultura.svg`, `logo_estimulos.svg`, `logo_sipa.svg`, `logo_sia.svg`, `logo_sinic.svg`
- `public/colombia-depts.json` — GeoJSON con polígonos de 32 departamentos + Bogotá D.C.

### CSS (`app/globals.css`)
- Clases `.v1-flip*` — sistema de tarjetas flip 3D (perspectiva, backface-visibility)
- Clases `.portal-v1__grid` — grid responsivo (5 col → 3 col → 1 col)
- Clases `.tira-footer`, `.tira-plataformas`, `.tira-item*` — tira de logos institucionales
- Clases `.boceto-header*`, `.eres-un*` — sección de portada (archivada)

---

## Notas técnicas

### Problemas resueltos
| Problema | Solución |
|---|---|
| Turbopack cache corrupta | `Remove-Item -Recurse -Force .next` en PowerShell |
| `CLOUD_COLORS is not defined` en WordCloud | Renombrado a `CLOUD_PURPLES` consistente |
| Mapa desaparece con 0 resultados | Eliminada condición `filtered.length === 0` que ocultaba el mapa |
| Conteos de filtros no reactivos | Cadena de tres niveles `filteredNoTerr → filteredBase → filtered` |
| page.js demasiado grande para edición (875 KB) | Uso de Python/PowerShell para transformaciones por rangos de líneas |
| SSR error con Leaflet | `import('leaflet')` dinámico dentro de `useEffect` |

### Estimación de esfuerzo
| Área | Horas estimadas |
|---|---|
| Dashboard + mapa + dataset | ~6 h |
| Cadena de filtros reactivos | ~2 h |
| Tab "Últimas investigaciones" | ~1 h |
| Nube de palabras (múltiples iteraciones) | ~2 h |
| Sección Principios (diseño + iteraciones) | ~3 h |
| Sidebar flotante + auto-colapso | ~1 h |
| Limpieza de page.js (Hero, Stats, Explorar) | ~2 h |
| Ajustes de grid y tamaño de tarjetas | ~1 h |
| **Total estimado** | **~18 h** |

---

## Próximas automatizaciones planificadas
- Conexión a fuente de datos real (API o Google Sheets)
- Publicación automática en Vercel/Netlify con GitHub Actions
- Autenticación para área de registro de investigaciones
- Exportación de resultados filtrados (CSV / PDF)
