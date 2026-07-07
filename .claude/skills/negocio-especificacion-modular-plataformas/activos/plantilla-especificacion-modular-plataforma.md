# <NOMBRE-PLATAFORMA> — Especificación funcional modular

> Plantilla extraída de CIRCULATURAS.pdf (Plataforma Sistema Nacional de Circulación, Min. Culturas, abril 2026).
> Es un guion de presentación/DT ejecutiva, NO un documento técnico exhaustivo. Objetivo: acordar ALCANCE con el
> dueño de negocio ANTES de diseñar UX o arquitectura. Cada "diapositiva" cabe en una pantalla.

## 0. Portada
- Nombre de marca de la plataforma (ej. "-CIRCULATURAS-").
- Subtítulo funcional (ej. "Plataforma Sistema Nacional de Circulación").
- Mes y año de la versión.

## 1. Qué es (definición + característica transversal)
Una frase que diga qué es el sistema:
> "Dispositivo digital que articula y organiza flujos de <dominio>."

Qué INTEGRA (los tipos de cosa que orquesta, no funcionalidades todavía):
- Información
- Servicios
- Redes
- Instrumentos

**Característica transversal:** <una palabra/atributo que aplica a TODO el sistema, ej. "interoperable">.
> Regla: la característica transversal NO es un módulo; es una propiedad que condiciona a todos. Se declara aquí una vez.

## 2. Propósito
Un solo párrafo (3-4 líneas) con la forma:
> "Consolidar un entorno tecnológico que <verbo1>, <verbo2> y <verbo3> para el ecosistema de <dominio>."
Verbos observados: visualizar, facilitar la articulación de (actores, procesos, contenidos), difundir (oportunidades).

## 3. Arquitectura funcional y componentes
Divisor de sección. A partir de aquí, un módulo por pantalla.

### Módulos (numerar SIEMPRE; 3-4 viñetas por módulo)
Convención de fases: marca con `**` al final de la viñeta las funcionalidades que se difieren a FASES POSTERIORES.
Lo que NO lleva `**` es alcance de Fase 1 (MVP). Un módulo puede ser 100% Fase 1 (sin ningún `**`).

1) **<Módulo de entrada/visualización>** — el que da lectura global del sistema; suele ir 100% en Fase 1.
   - <funcionalidad Fase 1>
   - <funcionalidad Fase 1>
   - <funcionalidad Fase 1>

2) **<Módulo>**
   - <funcionalidad Fase 1>
   - <funcionalidad Fase 1>
   - <funcionalidad avanzada / que depende de la característica transversal>**

… (repetir por cada módulo; observados 8 en CIRCULATURAS) …

N) **Analítica y seguimiento** — casi siempre el último módulo.
   - Indicadores de <dominio> con la cadena de valor pública: **impacto, resultado, producto**.
   - Monitoreo de flujos, participación y cobertura territorial.
   - Evaluación del sistema.

## 4. Cierre
Diapositiva de cierre (GRACIAS + nombre del sistema).

---
### Reglas de la convención `**` (verificadas en CIRCULATURAS)
- `**` = funcionalidad de fase posterior (recorte de alcance explícito, negociado con el dueño).
- Los módulos cuya viñeta avanzada suele quedar `**` son los que dependen de interoperabilidad o de terceros
  (calendario interoperable, conexión/colaboración entre agentes, alertas, internacionalización, gestión operativa).
- Los módulos de LECTURA (mapa) y de MEDICIÓN (analítica) suelen ir completos en Fase 1: son los que demuestran valor rápido.
