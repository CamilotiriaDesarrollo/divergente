/*
 * CTAs al MISMO canal de leads (WhatsApp) — dos variantes reales.
 * Origen: DivergenteWEB conferencias/page.tsx L127, analitica/page.tsx L1170,
 *         components/SiteShell.tsx L370 (icono social).
 * Regla del proyecto: TODO CTA de contacto apunta al mismo número que el formulario,
 * para no fragmentar el canal. Al cambiar el número hay que tocarlo en TODOS estos sitios
 * (por eso conviene centralizarlo en una constante/env — ver gotcha en SKILL.md).
 */

const WHATSAPP_NUMERO = "57XXXXXXXXXX"; // internacional sin +, sin espacios, sin 0

// (A) CTA con mensaje pre-rellenado — el texto va PRE-ENCODEADO a mano:
//     "," -> %2C   " " -> %20 . Si lo dejas en claro, wa.me trunca el ?text=.
export function CtaSolicitar() {
  return (
    <a
      href={`https://wa.me/${WHATSAPP_NUMERO}?text=Hola%2C%20quiero%20solicitar%20una%20conferencia`}
      target="_blank"
      rel="noopener noreferrer" // en <a target=_blank> el noopener va en rel, no en window.open
    >
      Solicita una conferencia
    </a>
  );
}

// (B) CTA simple, sin mensaje (abre el chat en frío):
export function CtaTrabajemos() {
  return (
    <a
      href={`https://wa.me/${WHATSAPP_NUMERO}`}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Trabajemos juntos por WhatsApp"
    >
      Trabajemos juntos
    </a>
  );
}
