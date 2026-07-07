# <Feature/Página> — supuestos, imágenes y placeholders

> Entregable de acompañamiento al build de `<ruta/s construida/s>`.
> Resume las decisiones que tomé, las imágenes que sugiero crear, y lo que falta de contenido real.
>
> ── Plantilla derivada de DivergenteWEB/METODOLOGIAS_SUPUESTOS.md (dato personal —teléfono— redactado).
>    Reemplaza cada `<...>` y cada ejemplo por lo real. Borra este bloque de guía al entregar.

---

## 1. Qué se construyó
<!-- Mapea 1:1 a las secciones NUMERADAS del roadmap/blueprint. El cliente debe reconocer su propio roadmap aquí. -->

- **`<ruta principal>`** — <qué es> con las N secciones del roadmap (X.1–X.N):
  <lista de las secciones tal como se nombran en el roadmap>.
- **`<ruta secundaria>`** — <sub-página / componente>: <secciones>.
- **<Sistema transversal>** (p. ej. movimiento, theming) en `<archivo>`: <qué hace en 1 línea>.
- **`<accesibilidad clave>`** respetado en todo el sitio: <qué pasa en el modo alterno>.

## 2. Cohesión con <lo ya existente> (decisiones replicadas)
<!-- Solo si el build se apoya en trabajo previo: qué patrones reusaste y por qué. Da confianza de que no rompiste la marca. -->

- **<decisión replicada 1>** — <por qué / de dónde viene>.
- Esquema de color **bloqueado** a la sección (`<clase/token>`: <valores hex reales>).

## 3. Supuestos tomados (confirmar con cliente)
<!-- REGLA DE ORO: cada supuesto abierto lleva su "cómo cambiarlo" con archivo Y sección exactos.
     Los ya resueltos llevan "—" para que el cliente no re-litigue lo ya decidido.
     Cruza con el número de decisión del roadmap cuando exista. -->

| # | Supuesto | Cómo cambiarlo |
|---|---|---|
| 1 | **<decisión textual>:** *"<valor elegido>"* | En `<archivo>`, sección `<SECCIÓN>`. |
| 2 | **<decisión ya resuelta>** (resuelto: <por qué>). | — |
| 3 | **<decisión con alternativas>** | Ver variantes en §5. |
| 4 | <supuesto que depende de una decisión del cliente> | Definir <qué> (decisión <N.N> del roadmap). |
| 5 | **<algo excluido a propósito>**: NO incluido (queda para v2). | — |

## 4. Imágenes sugeridas (crear / aportar)
<!-- Cada imagen pendiente: RUTA exacta en /public + CONCEPTO visual. Marca la pieza más importante. -->

Estilo coherente: <dirección de arte en 1 frase>.

| Ubicación | Archivo sugerido | Qué debería mostrar |
|---|---|---|
| <dónde va> (opcional) | `/public/<carpeta>/<archivo>.png` | <concepto>. Hoy se resuelve con <fallback>, una imagen real le daría <qué>. |
| <la más importante> | `/public/<carpeta>/<archivo>.jpg` | **<qué muestra>** (la pieza visual más importante). |

> Si me pasas las fotos reales (o me dices el concepto), genero el tratamiento y las integro.

## 5. Variantes de <momento/decisión de diseño> — para elegir
<!-- Marca cuál está IMPLEMENTADA. Da el COSTO DE CAMBIO (líneas/horas) para que el cliente pueda decidir. -->

1. **(Implementada) <variante A>** — <descripción corta>.
2. **<variante B>** — <descripción / cuándo elegirla>.
3. **<variante C>** — <descripción / cuándo elegirla>.

Las N comparten <el mismo motor/base>; cambiar entre ellas es ~<coste> líneas. Dime cuál prefieres.

## 6. Placeholders pendientes de contenido real
<!-- Usa checkboxes `- [ ]`: son rastreables por ambas partes. Un pendiente sin checkbox se pierde. -->

- [ ] **<contenido real 1>** (hoy hay <N de muestra> en `<ruta>`).
- [ ] **<contenido real 2>** definitivo (hoy <estado preliminar>).
- [ ] **<destino de datos>** (correo/CRM/API).
- [ ] **<activos del cliente>** (ver §4).
- [ ] *(Opcional)* <extra nice-to-have> (sección <N.N> del roadmap).

## 7. Checklist de accesibilidad / performance
<!-- [x] hecho, [ ] pendiente. Los pendientes DEBEN ser MEDIBLES: umbral + acción, no "revisar X". -->

- [x] `<a11y hecha>`: <qué garantiza>.
- [x] `<optimización hecha>` (p. ej. menos partículas en móvil, dpr cap 2).
- [x] `alt`/`aria-label` en <elementos>; headings semánticos (h1/h2/h3).
- [ ] **Pendiente medir <métrica> en <contexto>** (decisión <N> del roadmap) — si <umbral>, <acción correctiva>.
- [ ] Revisar contraste de `<color hex>` sobre `<color hex>` en <dónde> (verificar con herramienta).
