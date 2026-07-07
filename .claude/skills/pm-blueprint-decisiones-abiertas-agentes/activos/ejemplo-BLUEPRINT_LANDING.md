# BLUEPRINT — Radar de Oportunidades (Landing interactiva)

> **Qué es este archivo:** el núcleo de trabajo para optimizar la landing. Toda
> decisión de UI/UX/arquitectura se toma y se registra aquí. Antes de construir,
> se consulta. Si algo no está en el blueprint, no se construye "a ojo".
>
> **Estado:** v0.1 — borrador para validación con Camilo (2026-06-11)
> **Stack:** Next.js 15 (App Router, TS strict, `output: 'export'`) · CSS Modules
> **Filosofía:** Mobile-first · Data-driven · Perfiles editables · Plan antes que código

---

## 0. Cómo usar este blueprint

1. Cada **Fase** tiene: objetivo, entregable, criterio de "hecho" (DoD) y qué agentes la ejecutan.
2. Las **decisiones abiertas** (§9) se cierran con Camilo antes de tocar código de esa fase.
3. Los **agentes** trabajan contra este doc: un build-agent recibe "Fase X, componente Y, según blueprint §Z".
4. Ningún agente inventa arquitectura: si necesita una decisión, la sube a §9.

---

## 1. Visión

Una **página-repositorio interactiva** de oportunidades (empleos + convocatorias),
con **múltiples perfiles** intercambiables. Al elegir un perfil, **toda la página
cambia**: ofertas, indicadores, descripción del perfil y sus keywords de match.

No es un tablero estático: es una herramienta de trabajo donde Camilo (a) revisa
y cura oportunidades, (b) **ve y edita el perfil** con el que se scrapea, para
afinar el match desde la misma UI.

### Principios rectores
- **Mobile-first real:** se diseña y optimiza móvil primero; tablet y desktop son adaptaciones.
- **Data-driven:** agregar un perfil o una fuente = editar datos, no recablear UI.
- **Una fuente de verdad por perfil:** el `perfiles.json` alimenta tanto la landing como el matcher.
- **Sin secretos en el front:** la landing es estática y solo lee JSON público; nada sensible.
- **Contratos de componente:** cada componente tiene props tipadas y responsabilidad única (evita el "todo se rompe mañana").

---

## 2. Perfiles (arquitectura de información)

Cinco perfiles. Cada uno es una **entidad editable** con identidad, descripción y
criterios de match.

| ID | Nombre | Naturaleza | Estado |
|----|--------|-----------|--------|
| `CT` | Camilo Tiria | Persona — empleos/consultorías | Activo |
| `DIV` | Divergente AMC | Firma — convocatorias/contratos | Activo |
| `GIS` | Gisel Martín | *(por definir)* | **Nuevo** |
| `PAU` | Paula Martín | *(por definir)* | **Nuevo** |
| `POL` | Polisemia | *(por definir)* | **Nuevo** |

### 2.1 El modelo de "perfil editable" (clave)
Cada perfil se define en **`config/perfiles.json`** (fuente única). Estructura propuesta:

```jsonc
{
  "id": "CT",
  "nombre": "Camilo Tiria",
  "rol": "Data · IA · Producto · GovTech",
  "naturaleza": "persona",          // persona | firma
  "descripcion": "Perfil profesional completo, editable…",
  "match": {
    "keywords_positivas": ["automatización", "no-code", "dirección de datos", …],
    "keywords_negativas": ["fundraising", "ventas", …],
    "roles_excluidos": ["data scientist", "research scientist", …],
    "tipos_oferta": ["empleo", "contractor"]   // naturaleza → routing excluyente
  }
}
```

- **La landing** lee este JSON para: pintar el selector de perfiles, mostrar la
  descripción/keywords, y permitir **editarlas** desde la UI.
- **El matcher (Python)** lee el MISMO JSON en vez de tener las keywords hardcodeadas
  en `matcher.py` / `perfil_keywords.py`. Editar el perfil → cambia el match del próximo scrape.

> **Decisión arquitectónica (§9-A):** como la landing es export estático, la edición
> en UI no escribe a disco. Flujo: editar en UI → **exportar `perfiles.json`** (botón
> "Guardar perfil" que descarga/copia el JSON) → reemplazar en el repo → re-scrapear.
> Alternativa futura: micro-API local en dev. Se decide en §9-A.

---

## 3. Mapa de la página (arquitectura UX)

Una sola app, con **selector de perfil** siempre visible. Secciones:

1. **Selector de perfil** (CT · DIV · Gisel · Paula · Polisemia) — cambia todo el contexto.
2. **Tablero de cabecera (home dashboard):** indicadores potentes e **interactivos**
   del perfil activo: aprobadas, nuevas por revisar, pendientes, fuentes, match
   promedio. (Hoy esto vive separado en `/reporte` — se **integra** al home.)
3. **Filtros** (mejorados) — ver §6.
4. **Destacados** — oportunidades top del perfil (hoy **roto**, ver §7).
5. **Lista de oportunidades** — navegación por **3 cartas** por fila (desktop), 1 (móvil).
6. **Vista de perfil** — descripción completa + keywords editables (§2.1).
7. **Pestaña "Reporte personalizado"** — se conserva como vista aparte para análisis
   profundo, pero **los indicadores potentes NO se esconden ahí**: viven en el home.

### El problema del "título" actual
La franja de título/cabecera actual no aporta. Se **reemplaza** por el tablero de
indicadores interactivo (punto 2). El nombre/rol del perfil va integrado al selector.

---

## 4. Estrategia mobile-first (cascada de breakpoints)

**Orden obligatorio de optimización:** Móvil → Tablet → Desktop. Cada breakpoint se
deja "en su mejor forma" antes de pasar al siguiente, y un **agente revisor** valida.

| Fase | Breakpoints objetivo | Foco |
|------|----------------------|------|
| **M** Móvil | 360, 390, 414, 430px | Núcleo: navegación, dashboard, 1 carta, filtros colapsables, menú hamburguesa |
| **T** Tablet | 768, 834, 1024px | 2 cartas, filtros en panel lateral o drawer, dashboard en grid |
| **D** Desktop | 1280, 1440, 1920px | 3 cartas, filtros persistentes, dashboard ancho |

### Navegación
- **Móvil:** menú **hamburguesa** (perfiles + secciones) — bien trabajado, accesible, con foco-trap y cierre por gesto/escape.
- **Desktop:** selector de perfil horizontal + secciones visibles.
- Decisión de patrón exacto del menú: §9-B.

---

## 5. Tablero de cabecera (data-viz interactivo)

Reemplaza el título. Indicadores del **perfil activo**, clicables (cada uno filtra la lista):

- **Aprobadas** (lo que Camilo persigue) → clic filtra estado=aprobado
- **Nuevas por revisar** (desde el último scrape / no vistas) → clic filtra nuevas
- **Pendientes** → clic filtra pendientes
- **Match promedio** y **distribución de score** (mini-gráfico)
- **Cobertura de fuentes** (cuántas activas aportan a este perfil)

> "Nuevas por revisar" requiere marcar qué es nuevo: por `fecha_extraccion` > último
> visto (localStorage) o diff contra snapshot previo. Decisión en §9-C.

---

## 6. Filtros (rediseño)

Hoy filtran poco y la interacción no es la mejor. Objetivo: **filtrar más, mejor**.

Dimensiones de filtro propuestas:
- **Estado:** aprobada / pendiente / (rechazadas ocultas por defecto)
- **Tipo:** empleo · contractor · convocatoria · STTA · cultural
- **Modalidad:** remoto · híbrido · presencial
- **Ubicación / país**
- **Rango de score** (slider)
- **Fuente** (multi-select)
- **Con deadline / sin deadline** y orden por fecha de cierre
- **Búsqueda de texto** (título + empresa)
- **Salario** (si disponible)

Requisitos UX:
- Estado de filtros en **URL** (compartible, sobrevive refresh).
- Chips de filtros activos con "quitar".
- En móvil: filtros en **drawer** con contador de resultados en vivo.

---

## 7. Destacados (arreglar)

Hoy **no funcionan**. Definir qué es "destacado" y arreglar el render/lógica:
- Top N por score del perfil activo, o marcados manualmente (estrella), o "nuevas + alto score".
- Decisión de criterio: §9-D.
- Carrusel/sección dedicada arriba de la lista, navegable en móvil.

---

## 8. Vista de perfil + loop de afinamiento del match

La función diferencial. Por cada perfil:
- **Descripción completa** (editable).
- **Keywords de match** (positivas, negativas, roles excluidos) — visibles y **editables**.
- Indicador de "cómo me estoy scrapeando": qué fuentes aplican, cuántas ofertas trae, match promedio.
- Botón **"Guardar perfil"** → exporta `perfiles.json` (§2.1, §9-A).
- Efecto: el próximo `python main.py` usa esas keywords → match más ajustado.

Esto cierra el loop: **Camilo ve cómo se scrapea cada perfil y lo ajusta sin tocar Python.**

---

## 9. Decisiones abiertas (cerrar antes de construir)

| # | Decisión | Resuelto | Estado |
|---|----------|----------|--------|
| A | Persistencia de edición de perfil (export estático) | **Exportar JSON → reemplazar en repo → re-scrapear** (cero infra, Camilo controla) | ✅ |
| B | Patrón de menú móvil | **Hamburguesa drawer** (perfiles + secciones, foco-trap, cierre gesto/escape) | ✅ |
| C | Definición de "nueva por revisar" | **`fecha_extraccion` > último visto** (timestamp en localStorage por perfil) — default | ✅ |
| D | Criterio de "destacado" | **Nuevas + alto score** (novedad × calidad) | ✅ |
| E | Perfiles nuevos (Gisel, Paula, Polisemia): ¿quiénes son, qué scrapean? | (requiere input de Camilo — bloquea Fase 6, no Fase 0–5) | ⬜ |
| F | ¿Migrar keywords de matcher.py → perfiles.json ahora o por fases? | **Gradual:** esquema en Fase 0, migración real en Fase 5 (no romper el matcher actual) — default | ✅ |

---

## 10. Plan de ejecución por fases

> Cada fase la ejecutan **subagentes de build**; al cerrar, **subagentes revisores**
> independientes validan responsive + interacción + a11y antes de avanzar.

### Fase 0 — Fundaciones (antes de cualquier pixel)
- **Design tokens** (`globals.css` / archivo de tokens): color, tipografía, espaciado, radios, sombras, breakpoints. Una sola fuente.
- **`config/perfiles.json`** como fuente única (§2.1); refactor de `lib/perfiles.ts` para leerlo.
- **Inventario de componentes** + contratos de props.
- **DoD:** tokens definidos, perfiles.json esquematizado, build verde, TS sin errores.

### Fase 1 — Móvil (núcleo)
- Selector de perfil + menú hamburguesa.
- Home dashboard interactivo (§5).
- Lista 1-carta + filtros en drawer (§6).
- Destacados (§7). Vista de perfil (§8).
- **DoD:** todo navegable y usable en 360–430px; Lighthouse móvil > 90; revisor aprueba.

### Fase 2 — Tablet
- Adaptaciones a 768–1024px (2 cartas, filtros lateral).
- **DoD:** sin overflow, toques cómodos, revisor aprueba.

### Fase 3 — Desktop
- 3 cartas, filtros persistentes, dashboard ancho (1280–1920px).
- **DoD:** uso del ancho sin "estirar" feo; revisor aprueba.

### Fase 4 — QA agents (revisión cruzada)
- Agente(s) revisor de **responsive** (todos los breakpoints), **interacción** (filtros, selector, destacados, edición de perfil), **a11y** (teclado, contraste, foco) y **performance** (bundle, export estático).
- **DoD:** checklist de QA pasado en M/T/D.

### Fase 5 — Loop perfil↔matcher
- Wiring de edición de keywords → `perfiles.json` → `matcher.py`/`perfil_keywords.py` leen de ahí.
- **DoD:** editar un perfil y re-scrapear refleja el cambio en el match.

### Fase 6 — Perfiles nuevos
- Definir Gisel / Paula / Polisemia (§9-E), crear sus entradas en `perfiles.json`, conectar fuentes/criterios de scrape.
- **DoD:** los 5 perfiles cambian la página y traen sus ofertas.

---

## 11. Definición de "hecho" global (quality gates)
Inspirado en los problemas del vibe-coding sin plan:
- ✅ **Plan antes que código** — este blueprint, consultado en cada fase.
- ✅ **Arquitectura primero** — tokens + contratos de componente + perfiles.json (Fase 0).
- ✅ **TypeScript strict, sin `any`** — el build no pasa con errores de tipo.
- ✅ **Sin secretos** — la landing solo lee JSON público; nada de `.env` en el front.
- ✅ **No se rompe mañana** — componentes con props tipadas y responsabilidad única; revisor valida regresiones.
- ✅ **Responsive verificado por un agente distinto** al que construyó.

---

## 12. Sugerencias adicionales (de Claude — para validar)
- **S1. Estado de filtros y perfil en la URL** → links compartibles y "volver donde estaba".
- **S2. Marcador "visto/nuevo"** por oferta (localStorage) → potencia "nuevas por revisar".
- **S3. Acción rápida en cada carta:** aprobar/rechazar/guardar desde la UI (la curaduría hoy es por script; podríamos exportar decisiones desde la landing).
- **S4. Vista comparativa de perfiles** (opcional): ver dónde una misma oferta caería — útil ahora que son excluyentes.
- **S5. Presupuesto de performance** explícito (export estático ya es rápido; mantenerlo: imágenes/lazy, sin libs pesadas).
- **S6. Accesibilidad** como criterio, no adorno (teclado + contraste) — barato si se hace desde Fase 0.
- **S7. Modo oscuro** opcional (tokens lo hacen trivial si se diseña desde el inicio).

---

## 13. Bitácora de decisiones
> Se registran aquí las decisiones cerradas, con fecha, para volver a ellas.

- **2026-06-11** — A: edición de perfil se persiste por **export de `perfiles.json`** y reemplazo en repo (la landing es estática; sin micro-API).
- **2026-06-11** — B: navegación móvil con **menú hamburguesa (drawer)**.
- **2026-06-11** — C: "nueva por revisar" = `fecha_extraccion` posterior al último visto (localStorage por perfil).
- **2026-06-11** — D: "destacado" = **nuevas + alto score**.
- **2026-06-11** — F: keywords migran de `matcher.py` a `perfiles.json` de forma **gradual** (esquema en Fase 0, switch en Fase 5).
- **2026-06-11** — Enfoque: **no** se construye un meta-framework (tipo Forge); se usa este blueprint + subagentes de Claude Code (build por breakpoint + revisores aparte).
- **2026-06-11** — **EJECUTADAS Fases 0–5** en una pasada: tokens + `config/perfiles.json` (fuente única, 5 perfiles, 3 inactivos); Python (`perfil_keywords` extiende su gate con el JSON, conservador); UI mobile-first reconstruida (AppShell+drawer, SelectorPerfil, Dashboard interactivo, Filtros colapsables, Destacados nuevas+score, PerfilVista editable con export JSON, OfertaCard con acento por perfil, grilla 1/2/3, cascada 640/1024). Build estático verde. Revisión por subagente → fixes a11y (focus-visible global, focus-trap+inert del drawer, aria-labels, role=group), táctil (≥40px), lógica (validar perfil de URL, reset de filtros al cambiar perfil, colorSuave sólido sin depender de color-mix, KPI nuevas deshabilitado en 0).
- **Pendiente** — Fase 6 (§9-E): definición de los perfiles Gisel Martín, Paula Martín, Polisemia (ya están como inactivos en `perfiles.json`, listos para activar).
