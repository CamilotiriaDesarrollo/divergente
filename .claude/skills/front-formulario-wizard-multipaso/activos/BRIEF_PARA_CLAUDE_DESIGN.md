# GEDII · Brief para Claude Design

> Proyecto: Digitalización de la **Ficha de Registro de Investigación Cultural** del Ministerio de las Culturas, las Artes y los Saberes (Colombia) — documento institucional **GEDII-002 v1.0**.

---

## 🎯 Contexto del proyecto

Estoy convirtiendo una ficha de Excel de 75 filas en un **aplicativo web colaborativo** para que varias dependencias del Ministerio diligencien investigaciones culturales de forma estructurada.

**Quién la usa:** Varios miembros de una misma dependencia colaborando (líder + equipo). En el futuro distintas dependencias con sus propios espacios.

**Qué hace:**
1. Wizard de 12 pasos (identificación + 10 pasos metodológicos + DCA/transferencia)
2. Guarda progreso, calcula % de avance
3. Lógica condicional: marcar dimensión Transversal/D3/D4 → clasifica como "Proyecto Innovador"
4. **Exporta una infografía PDF** resumen (no una copia de la ficha, sino un producto visual para Mesa Técnica)

**Dónde estoy en el proceso:** Ya tengo un prototipo HTML funcional (adjunto como codebase). Vengo a Claude Design a **iterar UX/diseño** antes de pasar a implementación real en Next.js + Supabase.

---

## 🎨 Dirección de diseño actual (punto de partida)

### Decisión estética tomada
**Editorial-institucional cálido.** No el típico formulario gubernamental gris. Se buscó transmitir seriedad y autoridad, pero con calidez y oficio editorial (como una publicación bien diseñada de un ministerio de cultura europeo, no un formulario burocrático).

### Paleta
- Papel / crema: `#F5F1E8` (fondo), `#FBF8F0` (tarjetas)
- Tinta: `#0B1220` (texto principal, sidebar)
- **Rojo tierra institucional**: `#C73E1D` (acento principal)
- **Ocre**: `#D4A017` (badges, ratings, progreso intermedio)
- **Verde selva**: `#2D5F3F` (estado completo)
- TRIAGE: rojo `#C73E1D`, naranja `#E67E22`, ocre `#D4A017`, verde `#2D5F3F`, azul `#2C5F8D`

### Tipografía
- **Fraunces** (serif contemporánea) para títulos y display
- **Inter Tight** para cuerpo
- **JetBrains Mono** para códigos, labels y metadata

### Elementos distintivos
- Título principal con mezcla de regular + itálica del acento
- Badge "◆ Proyecto Innovador" animado que aparece al cumplir condiciones
- Sidebar oscuro con navegación por paso + estado (vacío/en progreso/completo)
- Puntos de color al lado de cada paso indicando estado
- Barra de progreso global con gradiente rojo→ocre

---

## 🔄 Qué quiero iterar en Claude Design

Por orden de prioridad:

### 1. UX de los campos largos (PRIORITARIO)
El Paso 9 tiene 6 dimensiones de evaluación con rating 1-5. En pasos como el 2 y el 3 hay mucho texto. **¿Cómo hago que no se sienta abrumador?** Explorar:
- Acordeones por sub-sección
- División de pasos largos en sub-pasos
- "Modo enfoque" que oculte el resto

### 2. El componente de opciones (checkboxes/radios)
Ahora son tarjetas con borde. En algunos pasos (Paso 5 ética con 12 opciones, Paso 7 producto con 14) se siente denso. Probar:
- Variantes más compactas tipo "chip" para listas largas
- Agrupación visual cuando hay muchas opciones
- Diferenciación visual clara entre "selección única" y "múltiple"

### 3. Sidebar en desktop vs mobile
En mobile colapsa a barra horizontal scrolleable, pero creo que puede mejorar. Probar:
- Bottom sheet / drawer para nav en mobile
- Indicador de paso actual tipo "03 de 12" más prominente
- Versión tablet intermedia

### 4. Estado vacío vs lleno de la sidebar
Cuando está vacío se ve un poco frío. Podría tener un estado de "bienvenida" en el header cuando no hay nada diligenciado.

### 5. Micro-interacciones
- Transición entre pasos
- Feedback al completar un paso (un pequeño celebration?)
- Hover states más ricos

---

## 📐 Sistema de Design Tokens (para replicar)

```css
/* Colors */
--ink: #0B1220;
--ink-2: #1a2332;
--paper: #F5F1E8;
--paper-warm: #EDE6D3;
--cream: #FBF8F0;
--accent: #C73E1D;
--accent-deep: #8B2A14;
--ochre: #D4A017;
--jade: #2D5F3F;
--muted: #6b6558;
--line: #D4CCB8;
--line-strong: #9a907a;

/* TRIAGE */
--t1: #C73E1D;  /* Nivel 1 - Estratégica */
--t2: #E67E22;  /* Nivel 2 - Prioritaria */
--t3: #D4A017;  /* Nivel 3 - Operativa */
--t4: #2D5F3F;  /* Nivel 4 - Administrativa */
--t5: #2C5F8D;  /* Nivel 5 - Temporal */

/* Type */
font-display: 'Fraunces', serif;
font-body: 'Inter Tight', sans-serif;
font-mono: 'JetBrains Mono', monospace;

/* Spacing */
radius-sm: 6px; radius-md: 8px; radius-lg: 12px;
shadow-soft: 0 1px 2px rgba(11,18,32,.04), 0 8px 24px rgba(11,18,32,.06);
```

---

## 📋 Estructura de los 12 pasos

| # | Paso | Tipo de campos |
|---|------|---------------|
| 00 | Identificación | Inputs de texto + 1 radio (tipo estructura) |
| 01 | Paso 0 · Necesidades | Textarea + checkbox múltiple (4 opciones) |
| 02 | Paso 1 · Horizonte PNC | Checkbox múltiple (6 opciones) + textarea condicional |
| 03 | Paso 2 · Formulación | 4 textareas + 4 inputs + chips (palabras clave) |
| 04 | Paso 3 · Posicionamiento | 5 grupos: dimensión (multi), TRIAGE (single), actores (multi), vinculación (single) + textarea |
| 05 | Paso 4 · Campo | Radio con 6 opciones |
| 06 | Paso 5 · Metodología | Radio enfoque + select sombrilla (dinámico) + textarea + checkbox múltiple ética (12 opciones) |
| 07 | Paso 6 · Planeación | 4 textareas + 2 fechas |
| 08 | Paso 7 · Producto | Checkbox múltiple (14 opciones) + textarea |
| 09 | Paso 8 · Ejecución | Radio estado + 2 textareas |
| 10 | Paso 9 · Evaluación | **6 ratings 1-5** + textarea + radio continuidad (5 opciones) + textarea |
| 11 | Paso 10 · Proyección | 2 textareas + radio DCA + 2 textareas + **checklist 14 entregables** + textarea |

---

## 🎨 Entregables adicionales que necesito

Después de iterar el wizard, necesito diseñar:

1. **La infografía PDF resumen** (producto final para Mesa Técnica)
   - Portada con título + dependencia + código + badge Innovador
   - Visualización del TRIAGE por color
   - Timeline (fecha inicio → cierre)
   - Radar chart o similar de la evaluación 1-5
   - Tags de campo, sombrilla, ética
   - Resumen de pregunta + objetivos
   - QR de verificación

2. **Dashboard de la dependencia** (vista de "mis investigaciones")
   - Lista de investigaciones con estado y % avance
   - Filtros por año, estado, campo
   - Vista de equipo (quién diligencia qué)

3. **Vista colaborativa** (avatares de quién está editando qué sección)

---

## 🚦 Lo que NO cambiar

- La estructura de 12 pasos (vienen del manual GEDII-002, son normativos)
- Los campos obligatorios (marcados con ★)
- La lógica del Proyecto Innovador (Transversal/D3/D4)
- La escala TRIAGE de 5 niveles con sus colores

---

## 💡 Prompt sugerido para iniciar

> "Adjunto el codebase de un prototipo HTML de una ficha gubernamental de registro de investigación cultural, y screenshots de los estados clave. También un brief con la dirección estética y lo que quiero iterar. Antes de generar nada, léete el brief y hazme preguntas si tienes dudas sobre el contexto o prioridades."
