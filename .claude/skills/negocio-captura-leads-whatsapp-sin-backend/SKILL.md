---
name: negocio-captura-leads-whatsapp-sin-backend
regimen: divergente
description: Captura de leads para MVPs de servicios (LATAM) sin backend — un formulario React que en submit serializa sus campos a un enlace wa.me y abre WhatsApp con el mensaje pre-rellenado. Cárgala cuando el proyecto sea una landing estática (Next.js export / SPA sin servidor) que necesite un formulario de contacto/contratación o CTAs "Hablemos"/"Solicita" y aún no haya correo transaccional ni CRM.
---

# Captura de leads a WhatsApp sin backend

**Nivel actual:** N2 · **Dominio:** negocio · **Agente(s):** front-formularios-a11y
**Proyectos fuente:** DivergenteWEB

> Criterio de ascenso a N1: los 5 bloques completos, con activos copiables de ruta real y gotchas verificados (no genéricos). A N2: ≥1 uso real aceptado por el Dueño. A N3: ≥3 usos exitosos en ≥2 proyectos + checklist propio.

## 1. Propósito

Resuelve la captura de leads en una landing **sin servidor** (Next.js `output: 'export'`, SPA estática, o cualquier front sin backend transaccional): en vez de un `POST` a una API o un servicio de formularios, el submit **serializa los campos a un enlace `wa.me` y abre WhatsApp** con el mensaje ya escrito. Es el patrón de MVP para servicios en LATAM, donde WhatsApp es el canal comercial de facto.

Se carga cuando: (a) hay que poner un formulario de contacto/contratación en una web estática sin infraestructura de correo/CRM; (b) hay CTAs de contacto ("Hablemos", "Solicita una conferencia", "Escríbenos") que deben ir todos al mismo canal; (c) el cliente aún no decidió el destino final de los leads y se necesita algo funcional **hoy**.

Es explícitamente una **solución temporal**: no persiste nada, no hay analítica de conversión, y el lead se pierde si el usuario no pulsa enviar dentro de WhatsApp. Por eso la skill obliga a documentar la decisión y dejar el destino final (correo/CRM) como pendiente del roadmap.

## 2. Procedimiento

1. **Confirmar el número en formato internacional.** `wa.me/<numero>` exige el número **sin `+`, sin espacios, sin guiones y sin 0 inicial**: código de país pegado al número. Ej. Colombia +57 314 486 9162 → `573144869162`. Un número mal formateado abre WhatsApp con "número inválido".

2. **Definir los campos del lead** (mínimo viable). En el proyecto fuente son 4: Nombre, Organización, Fecha tentativa, Tipo de evento. Solo el primero lleva `required`; el resto son opcionales pero siempre aparecen etiquetados en el mensaje.

3. **Construir el texto con `encodeURIComponent` sobre TODO el mensaje**, incluidos los `\n`:
   ```tsx
   const waText = encodeURIComponent(
     `Hola, quiero solicitar una conferencia.\n\nNombre: ${nombre}\nOrganización: ${org}\n...`
   );
   ```
   Criterio: nunca concatenes texto crudo en el `?text=` — las comas, espacios y saltos de línea rompen o truncan la URL.

4. **Submit del formulario:** `onSubmit` con `preventDefault()` (obligatorio, evita la navegación GET nativa) y `window.open(url, "_blank", "noopener")`:
   ```tsx
   onSubmit={(e) => {
     e.preventDefault();
     window.open(`https://wa.me/${WHATSAPP_NUMERO}?text=${waText}`, "_blank", "noopener");
   }}
   ```
   Criterio de decisión — cómo abrir según sea `<form>` o `<a>`:
   - **Formulario (window.open):** el `"noopener"` va en el tercer argumento (windowFeatures).
   - **CTA con enlace (`<a target="_blank">`):** el `noopener` va en `rel="noopener noreferrer"`.
   Ambos evitan reverse-tabnabbing (que la pestaña de WhatsApp reciba `window.opener`).

5. **Apuntar TODOS los CTAs de contacto al mismo número.** Los botones "Solicita"/"Hablemos"/"Trabajemos" usan enlaces `wa.me` directos; los que llevan mensaje lo pre-encodean a mano (`,`→`%2C`, ` `→`%20`). No fragmentar el canal: si el form va a WhatsApp, los CTAs también. Ver `activos/wa-cta-snippets.tsx`.

6. **Accesibilidad mínima:** cada `input` con `aria-label`; `button type="submit"`. La skill vive en el agente `front-formularios-a11y`, así que respeta también la a11y del wizard/form del proyecto.

7. **Documentar la decisión como temporal (obligatorio).** Triple anotación: (a) comentario `{/* PLACEHOLDER: definir destino de leads (correo / CRM). Hoy abre WhatsApp. */}` junto al form; (b) fila en el entregable de supuestos; (c) pendiente numerado en el roadmap. Sin esto, "sin backend" se lee como olvido. Plantilla en `activos/documentar-decision-temporal.md`.

## 3. Activos copiables

Copiados a `activos/` de esta skill (parametrizados, sin el número real):

- **`activos/ContratacionForm.tsx`** — el componente completo de formulario→WhatsApp. Origen: `DivergenteWEB/app/metodologias/conferencias/page.tsx` (líneas 378-463, función `ContratacionForm`). Copiar tal cual; adaptar los campos del `useState`, el texto base del mensaje y `WHATSAPP_NUMERO`. Los estilos inline son sustituibles por el sistema del proyecto.
- **`activos/wa-cta-snippets.tsx`** — las dos variantes de CTA-enlace al mismo canal (con mensaje pre-encodeado y sin mensaje). Origen: `conferencias/page.tsx` L127, `analitica/page.tsx` L1170, `components/SiteShell.tsx` L370.
- **`activos/documentar-decision-temporal.md`** — plantilla de las filas de supuestos + placeholder + comentario de código para declarar la salida-a-WhatsApp como temporal. Origen: `DivergenteWEB/METODOLOGIAS_SUPUESTOS.md` §3 (filas 4 y 6) y §6.

Rutas reales de referencia en el proyecto fuente (verificadas):
- Formulario: `C:\Users\camil\Desktop\IA Raiz Proyectos\002 Desarrollos\DivergenteWEB\app\metodologias\conferencias\page.tsx` (L378-463).
- CTA con mensaje: mismo archivo, L127. CTA simple + barra social: `app\analitica\page.tsx` L1170 y L1189; `app\components\SiteShell.tsx` L370; `app\metodologias\page.tsx` L1067.
- Documentación de la decisión: `DivergenteWEB\METODOLOGIAS_SUPUESTOS.md`.

## 4. Gotchas verificados

- **Formato del número (wa.me):** debe ir sin `+`, espacios, guiones ni 0 inicial. El proyecto usa `573144869162` (57 = Colombia). Evidencia: `conferencias/page.tsx` L429. Con `+`, espacios o `0` local, WhatsApp abre con "número no válido".
- **`?text=` sin `encodeURIComponent` se rompe:** el proyecto encodea el mensaje entero (L385-387) e incluso **pre-encodea a mano** los CTAs estáticos (`Hola%2C%20quiero...`, L127). La coma cruda (`,`) y los saltos de línea (`\n`) truncan la query si no se encodean. Evidencia: `conferencias/page.tsx` L127 y L385.
- **Falta `e.preventDefault()` → doble acción:** sin él, el `<form>` hace su navegación GET nativa y compite con `window.open`, recargando la página. El proyecto lo pone como primera línea del `onSubmit`. Evidencia: `conferencias/page.tsx` L428.
- **`noopener` va en sitio distinto según el elemento:** en `window.open(...)` es el 3.er argumento (`"noopener"`, L429); en `<a target="_blank">` es `rel="noopener noreferrer"` (L127-129, `SiteShell.tsx` L370). Confundirlos deja el hueco de reverse-tabnabbing. Ambos patrones conviven en el mismo proyecto.
- **El número está hardcodeado en ≥6 sitios (violación DRY):** `conferencias/page.tsx` (L127 y L429), `analitica/page.tsx` (L1170 y L1189), `metodologias/page.tsx` (L1067), `components/SiteShell.tsx` (L370). Cambiar de número obliga a tocarlos todos. Solución al replicar: centralizar en una constante/`env` única (los activos ya usan `WHATSAPP_NUMERO`). Verificable con `grep 573144869162`.
- **El lead no se persiste — se pierde si el usuario no pulsa enviar en WhatsApp:** no hay servidor, ni base, ni analítica de conversión. Es aceptable solo como MVP y SOLO si se documenta. El proyecto lo declara en 3 lugares: comentario de código (L457-458), `METODOLOGIAS_SUPUESTOS.md` §3 fila 4 y §6 ("Destino de leads del formulario (correo/CRM)"), remitiendo a la "decisión 11.6 del roadmap". No entregar sin esta declaración.
- **Comentario engañoso en la fuente:** el encabezado de la función dice `mailto + WhatsApp como salida de leads` (L378) pero la implementación **solo** hace WhatsApp; no hay `mailto`. Al copiar, no asumas que existe una ruta de correo — no la hay.

## 5. Criterios de done

- [ ] El número está en **formato internacional** (sin `+`/espacios/guiones/0) y probado: el enlace abre el chat correcto con el texto visible.
- [ ] Todo el `?text=` pasa por `encodeURIComponent` (o pre-encodeado a mano en CTAs estáticos); un mensaje con comas y saltos de línea llega íntegro.
- [ ] El `onSubmit` empieza por `e.preventDefault()` y usa `window.open(..., "_blank", "noopener")`; los CTAs-enlace usan `rel="noopener noreferrer"`.
- [ ] **Todos** los CTAs de contacto del sitio apuntan al mismo número (verificado por `grep`); idealmente centralizado en una constante única.
- [ ] Cada `input` tiene `aria-label` y el botón es `type="submit"`.
- [ ] La decisión temporal está documentada en los **tres** lugares: comentario junto al form, fila en el entregable de supuestos, y pendiente numerado en el roadmap con el destino final (correo/CRM).

## Registro de uso
| Fecha | Proyecto | Tarea | Resultado | Lección |
|---|---|---|---|---|
| histórico | DivergenteWEB | uso original (fuente de esta skill) | ok | - |
