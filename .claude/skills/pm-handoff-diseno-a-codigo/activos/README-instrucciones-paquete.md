# 📦 Paquete para Claude Design — GEDII

## Qué contiene

```
gedii-handoff/
├── README.md                      ← Estás aquí
├── BRIEF_PARA_CLAUDE_DESIGN.md    ← Pégalo en el chat al empezar
├── gedii-prototipo.html           ← Prototipo funcional completo (codebase)
└── screenshots/                   ← 9 capturas de estados clave
    ├── 01_desktop_identificacion.png
    ├── 02_desktop_identificacion_lleno.png
    ├── 03_desktop_paso3_innovador.png       ← ★ Muestra badge + TRIAGE
    ├── 03b_desktop_paso3_full.png           ← Full scroll del paso 3
    ├── 04_desktop_paso2_formulacion.png     ← Chips de palabras clave
    ├── 05_desktop_paso9_evaluacion.png      ← ★ Ratings 1-5
    ├── 06_desktop_sidebar_avanzado.png      ← Estado multi-paso
    ├── 07_mobile_identificacion.png         ← ★ Responsive mobile
    └── 08_mobile_paso3.png
```

## Cómo usarlo en Claude Design

### Flujo recomendado (3 pasos):

**1. Abre un chat nuevo en Claude Design**

**2. Ve a "Start with context" y:**
   - Click en **"Attach codebase"** → sube `gedii-prototipo.html`
   - Click en **"Add screenshot"** → sube los screenshots de `/screenshots/`
     - Mínimo sube: `03_desktop_paso3_innovador.png`, `05_desktop_paso9_evaluacion.png`, `07_mobile_identificacion.png`
     - Si puedes subir todos, mejor

**3. En el chat, pega el contenido de `BRIEF_PARA_CLAUDE_DESIGN.md`**
   - Eso le da a Claude Design toda la información de contexto, decisiones estéticas y qué iterar

---

## 🎯 Primera iteración sugerida

Una vez tenga todo el contexto, dile algo como:

> "Genial, tienes todo. Quiero arrancar con la **prioridad #1 del brief**: el Paso 9 de evaluación. Muéstrame 2-3 propuestas alternativas para el componente de rating de las 6 dimensiones, manteniendo la paleta y tipografía actuales."

O si prefieres empezar por la infografía PDF:

> "Quiero saltar al entregable #1 de la sección 'Entregables adicionales': diseña la infografía PDF resumen. Usa los datos de ejemplo de la 'Cartografía de prácticas artísticas' que aparece en los screenshots. Trabájalo como un A4 vertical listo para exportar."

---

## 🔄 Después de Claude Design

Una vez tengas los diseños iterados, el siguiente paso es **Claude Code** con:
- Los diseños finales como referencia
- Este mismo codebase como base funcional
- Stack propuesto: Next.js + Tailwind + shadcn/ui + Supabase + Vercel

---

## 🧠 Decisiones clave ya tomadas

Para que Claude Design no las cuestione:

- ✅ **12 pasos** (normativos, vienen de GEDII-002)
- ✅ **Mobile-first** (varios diligenciarán desde celular)
- ✅ **Autoguardado** (no botón "guardar")
- ✅ **Colaboración por dependencia** (no es personal)
- ✅ **Export como infografía**, no como espejo de la ficha Excel
- ✅ **Paleta cálida institucional** (no corporate blue)

---

*Generado en el Taller de Desarrollo Claude · Proyecto GEDII · v1.0*
