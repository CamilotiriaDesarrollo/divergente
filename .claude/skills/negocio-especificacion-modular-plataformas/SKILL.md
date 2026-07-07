---
name: negocio-especificacion-modular-plataformas
regimen: universal
description: Especifica plataformas públicas complejas por módulos funcionales numerados, con característica transversal declarada y recorte de fases explícito (convención **), antes de diseñar UX o arquitectura. Cárgala cuando el dueño pida "especificar/alcance de una plataforma o sistema de información", cuando llegue una idea grande sin desglosar en componentes, o cuando haya que separar el MVP (Fase 1) de lo diferible (Fase 2+).
---

> **Régimen: universal.** Las referencias a normativa estatal (M-GSI-002, DI-GSI-010, ITIL, GOV.CO, «entidad pública») aplican SOLO en proyectos `institucional`; en un proyecto `divergente` ignóralas y usa la variante de la línea privada (Vercel/Node/Postgres).

# Especificación funcional modular de plataformas

**Nivel actual:** N2 · **Dominio:** negocio (Análisis de Negocio) · **Agente(s):** `analista-negocio`
**Proyectos fuente:** Plataformas Ministerio (entregable CIRCULATURAS — Sistema Nacional de Circulación, Min. Culturas, abril 2026)

> Criterio de ascenso a N1: los 5 bloques completos, con activos copiables de ruta real y gotchas verificados (no genéricos). A N2: ≥1 uso real aceptado por el Dueño. A N3: ≥3 usos exitosos en ≥2 proyectos + checklist propio.

## 1. Propósito
Convertir una idea de plataforma grande y difusa ("un sistema nacional de X") en una **especificación funcional modular** que el dueño de negocio pueda aprobar en una sola lectura, ANTES de que diseño o arquitectura inviertan esfuerzo. El entregable es un guion ejecutivo (una pantalla por bloque), no un documento técnico exhaustivo.

Resuelve tres problemas concretos observados en Plataformas Ministerio:
- Evita que se salte de "la idea" directo a maquetar UI sin acordar el alcance.
- Hace **visible y negociable el recorte de fases**: qué entra en el MVP y qué se difiere, con una marca (`**`) que el dueño ve y aprueba.
- Separa la **característica transversal** (ej. "interoperable") de los módulos, para que no se confunda una propiedad del sistema con una funcionalidad.

Se carga cuando: el dueño describe una plataforma/sistema de información nuevo sin desglose; hay que preparar la diapositiva/DT de alcance para una entidad pública; o hay que decidir el corte Fase 1 vs Fase 2 de un producto.

## 2. Procedimiento
Estructura fija de 5 secciones (extraída de CIRCULATURAS.pdf; ver `activos/plantilla-especificacion-modular-plataforma.md`):

1. **Portada.** Nombre de marca de la plataforma + subtítulo funcional + mes/año. Ej.: "-CIRCULATURAS- · Plataforma Sistema Nacional de Circulación · Abril, 2026".

2. **Qué es + característica transversal.** Una sola frase de definición con la forma *"Dispositivo digital que articula y organiza flujos de \<dominio\>"*. Luego lista **qué INTEGRA** en tipos, no en funciones (en CIRCULATURAS: Información, Servicios, Redes, Instrumentos). Cierra con la **característica transversal** en una palabra (ej. "interoperable").
   - Criterio de decisión: si un atributo aplica a TODO el sistema, va aquí como característica transversal, NO como módulo. Es la prueba para no crear un "módulo de interoperabilidad" falso.

3. **Propósito.** Un párrafo de 3-4 líneas: *"Consolidar un entorno tecnológico que \<visualice\>, \<facilite la articulación de actores/procesos/contenidos\> y \<difunda oportunidades\> para el ecosistema de \<dominio\>."* Verbos de acción, sin tecnicismos.

4. **Arquitectura funcional — módulos numerados.** Un módulo por pantalla, **siempre numerado**, con 3-4 viñetas de funcionalidad cada uno. Reglas de decisión:
   - **Ordena por madurez de valor:** primero el módulo de *lectura/visualización* (mapa georreferenciado) que da entendimiento global; último el de *medición* (analítica y seguimiento). En medio, los módulos de operación (agenda, agentes/redes, banco de contenidos, oportunidades, internacionalización, gestión operativa).
   - **Marca el recorte de fases con `**`:** cada viñeta que se difiere a fase posterior termina en `**`. Lo que no lleva `**` es Fase 1 (MVP). Un módulo puede ir 100% en Fase 1 (sin ningún `**`).
   - **Criterio de qué difieres:** las funcionalidades que dependen de la *característica transversal* (interoperabilidad) o de *integración con terceros* son candidatas naturales a Fase 2. En CIRCULATURAS quedaron `**`: calendario interoperable, herramientas de conexión/colaboración, circulación digital de saberes, alertas y acceso diferencial, proyección internacional, herramientas de gestión operativa.
   - **Criterio de qué NO difieres:** el módulo que demuestra valor rápido y no depende de terceros va completo en Fase 1 (en CIRCULATURAS: mapa interactivo y analítica).

5. **Módulo de analítica — cadena de valor pública** *(solo si el proyecto es institucional)*. El último módulo mide con la terminología de la gestión pública colombiana: indicadores de **impacto, resultado y producto** (cadena de valor DNP), más monitoreo de flujos/participación/cobertura territorial y evaluación del sistema. No inventes otro vocabulario de métricas para entidades del Estado. En un proyecto `divergente` este módulo mide con KPIs de producto (activación, retención, North Star), no con la cadena de valor DNP — ver `negocio-analitica-producto`.

6. **Cierre.** Diapositiva final (GRACIAS + nombre del sistema).

Al terminar: entrega la especificación al dueño para aprobar el **corte de fases** (las viñetas `**`) como compuerta. Sólo tras ese GO pasa a `disenador-uiux` / arquitectura. Toda funcionalidad que dependa de una decisión no cerrada (p. ej. con qué plataforma externa se integra la agenda) se anota como decisión abierta del blueprint; no se resuelve aquí.

## 3. Activos copiables
- **`activos/plantilla-especificacion-modular-plataforma.md`** — Esqueleto reutilizable de las 5 secciones con la convención `**` documentada. Cópialo como punto de partida para especificar cualquier plataforma nueva; reemplaza `<dominio>`, el nombre y los módulos. Extraído de la estructura de CIRCULATURAS.pdf.
- **`activos/ejemplo-circulaturas.md`** — El caso CIRCULATURAS transcrito completo (8 módulos, con el recorte de fases resuelto). Úsalo como referencia de "cómo se ve uno bien hecho" y para calibrar el nivel de detalle de las viñetas. Transcripción fiel del entregable original.
- **Fuente original (evidencia, NO copiada por tamaño 2.3 MB):** `002 Desarrollos/Plataformas Ministerio/003 PLATAFORMA CONECTA/CIRCULATURAS.pdf`. Ábrela con Read (soporta PDF) si necesitas ver el diseño visual de las diapositivas.
- **Documento técnico de respaldo (protegido, no extraíble):** `…/003 PLATAFORMA CONECTA/20. Sistema Circulación DT abril 21 de 2026_protected (1) (4).pdf`. Existe pero está protegido; no se pudo extraer su texto. Si el dueño lo desprotege, contiene el detalle técnico que respalda esta especificación de negocio.

## 4. Gotchas verificados
- **La marca `**` significa "fase posterior", no "opcional" ni "importante".** En CIRCULATURAS (diapositivas 6-11) el `**` aparece exactamente en una viñeta por módulo y siempre es la funcionalidad diferida. Si copias el patrón sin explicar la convención, un lector la confunde con una nota al pie o un énfasis. **Solución:** declara la convención al pie del documento (como en `plantilla-…md`) y verifica que cada `**` corresponda a una funcionalidad realmente sacada del MVP. Evidencia: `ejemplo-circulaturas.md`, módulos 2-7.
- **No confundir la característica transversal con un módulo.** "Interoperable" es propiedad de todo el sistema (diapositiva 2), pero *también* aparece como funcionalidad concreta diferida ("Sistema de calendarización interoperable**", módulo 2). Son dos cosas: la propiedad se declara una vez arriba; la funcionalidad interoperable específica va como viñeta `**` en su módulo. **Solución:** declara la característica transversal en la sección "Qué es" y nunca crees un módulo llamado "Interoperabilidad".
- **Errores de dedo del original que NO debes replicar.** El PDF fuente trae typos: "mnisterio" (dip. 9), "reultado" (dip. 12), un paréntesis sin cerrar "Registro (información de agentes culturales" (dip. 7). Al reutilizar el patrón, corrige a "ministerio", "resultado", y cierra el paréntesis. No es contenido, es descuido de transcripción. Evidencia: `CIRCULATURAS.pdf` diapositivas 7, 9, 12.
- **Vocabulario de métricas para entidad pública es fijo.** El módulo de analítica usa "impacto, resultado, producto" (cadena de valor DNP), no KPIs genéricos de producto digital (DAU, retención, etc.). Usar otro vocabulario con una entidad del Estado desalinea con su marco de seguimiento. Evidencia: `CIRCULATURAS.pdf` diapositiva 12 ("Indicadores de circulación cultural… impacto, resultado, producto") y módulo 7 ("Seguimiento orientado a indicadores de resultado").
- **Este entregable es de negocio/alcance, no técnico.** CIRCULATURAS es un guion de presentación de ~13 diapositivas; el detalle técnico vive en un DT aparte (el PDF "Sistema Circulación DT", que además venía protegido). No mezcles arquitectura, stack ni modelo de datos en esta especificación: su función es cerrar alcance con el dueño, no diseñar la solución. Confundir ambos hace la especificación inaprobable de una lectura.

## 5. Criterios de done
- [ ] Existen las 5 secciones en orden: portada → qué es + característica transversal → propósito → módulos numerados → analítica → cierre.
- [ ] La **característica transversal** está declarada una sola vez, arriba, y NO existe como módulo.
- [ ] Todos los módulos están **numerados** y tienen 3-4 viñetas de funcionalidad (no párrafos).
- [ ] El **recorte de fases es explícito**: cada funcionalidad diferida termina en `**` y la convención está declarada al pie. Hay al menos un módulo 100% Fase 1 que demuestra valor rápido.
- [ ] El módulo de analítica usa el vocabulario de gestión pública (**impacto, resultado, producto**), no KPIs genéricos *(solo si el proyecto es institucional; en `divergente`, KPIs de producto)*.
- [ ] Cero funcionalidades que dependan de decisiones abiertas sin marcar: lo no decidido va como decisión abierta del blueprint, no se inventa.
- [ ] Sin typos heredados del original ("mnisterio", "reultado", paréntesis sin cerrar).
- [ ] El documento se lee de corrido en una sesión y el dueño puede aprobar el corte Fase 1/Fase 2 sin pedir aclaraciones.

## Registro de uso
| Fecha | Proyecto | Tarea | Resultado | Lección |
|---|---|---|---|---|
| histórico | Plataformas Ministerio | uso original (fuente de esta skill) — especificación modular CIRCULATURAS (Sistema Nacional de Circulación) | ok | - |
