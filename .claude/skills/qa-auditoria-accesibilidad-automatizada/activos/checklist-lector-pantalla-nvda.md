# Checklist de verificación con lector de pantalla y teclado (semi-manual)

> Lo automatizado (axe/Lighthouse/pa11y) detecta solo entre ~30% y ~57% de los
> criterios WCAG (estudios Deque/WebAIM). El resto — orden de lectura, foco,
> anuncios en vivo, sentido del contenido — se verifica a mano. Esta lista produce
> la evidencia de "pruebas con lectores de pantalla" que exige DI-GSI-010.

**Herramienta recomendada (Windows, SO del Dueño):** NVDA (gratuito, NV Access).
Alternativas: VoiceOver (macOS/iOS), TalkBack (Android), Narrador (Windows).
Navegador de prueba: Chrome o Firefox. Registra versión de NVDA y navegador.

## Ruta probada: `${RUTA}` — Fecha: `${FECHA}` — Responsable: `qa-ingeniero`

### Teclado (sin ratón)
- [ ] Todo elemento interactivo es alcanzable con Tab en orden lógico.
- [ ] El foco es siempre visible (no hay `outline:none` sin sustituto).
- [ ] No hay trampas de foco: se entra y se sale de menús/modales con Tab/Esc.
- [ ] Enter/Espacio activan botones; las flechas mueven dentro de radios/tabs.
- [ ] Existe "saltar al contenido" (skip link) al primer Tab.

### Lector de pantalla (NVDA activo)
- [ ] El título de la página se anuncia y describe el contenido.
- [ ] Encabezados H1–H6 forman un esquema navegable (tecla H / lista de elementos).
- [ ] Imágenes con `alt` con sentido; las decorativas quedan en silencio (`alt=""`).
- [ ] Cada campo de formulario anuncia su etiqueta, tipo y estado (requerido/error).
- [ ] Los errores de validación se anuncian (región `aria-live` o foco al error).
- [ ] Cambios dinámicos (contadores, filtros) se anuncian con `aria-live="polite"`.
- [ ] Botones icónicos tienen nombre accesible (no "botón" a secas).
- [ ] Tablas de datos tienen encabezados asociados y se leen por fila/columna.

### Visual / zoom
- [ ] Zoom del navegador al 200% sin pérdida de contenido ni scroll horizontal.
- [ ] Contraste texto ≥ 4.5:1 (normal) y ≥ 3:1 (grande) — verifica el peor caso.
- [ ] `prefers-reduced-motion` respetado (animaciones de adorno se detienen).

**Resultado:** `${PASA | FALLA}` — Hallazgos → se abren como misiones de corrección
a su constructor y se listan en el informe de accesibilidad (activo adjunto).
