"use client";
/* ────────────────────────────────────────────────────────────
   Activador del sistema "Respiración": revela .mt-reveal / .mt-rule
   con IntersectionObserver, y lo neutraliza bajo prefers-reduced-motion.
   Origen: DivergenteWEB/app/metodologias/page.tsx (líneas ~34-88).
   Pegar estos dos useEffect dentro del componente de página cliente.
   ──────────────────────────────────────────────────────────── */
import { useEffect, useRef, useState } from "react";

export function useRespiracion() {
  // reduceMotion vive en un ref porque lo leen otros effects (parallax, canvas)
  // sin re-suscribirse; `reduced` en estado sirve para elegir el fallback JSX.
  const reduceMotion = useRef(false);
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    reduceMotion.current =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    setReduced(reduceMotion.current);
  }, []);

  // ── Revela elementos .mt-reveal / .mt-rule al entrar al viewport ──
  useEffect(() => {
    const observe = () => {
      const els = document.querySelectorAll<HTMLElement>(
        ".mt-reveal:not(.is-in), .mt-rule:not(.is-in)"
      );
      // Con reduced motion: mostrar TODO de una, sin observar.
      if (reduceMotion.current) {
        document
          .querySelectorAll<HTMLElement>(".mt-reveal, .mt-rule")
          .forEach((el) => el.classList.add("is-in"));
        return;
      }
      const io = new IntersectionObserver(
        (entries) => {
          entries.forEach((e) => {
            if (e.isIntersecting) {
              e.target.classList.add("is-in");
              io.unobserve(e.target); // reveal es de un solo sentido
            }
          });
        },
        // threshold bajo + rootMargin negativo: dispara un pelín ANTES de
        // que el elemento esté centrado, para que el reveal de 1.2s ya
        // esté avanzado cuando el usuario lo ve de lleno.
        { threshold: 0.08, rootMargin: "0px 0px -4% 0px" }
      );
      els.forEach((el) => io.observe(el));
      return io;
    };

    const io = observe();
    // Re-observa a 400ms: en el primer paint algunos .mt-reveal aún no
    // existen o el layout no se ha estabilizado (fuentes, imágenes) y se
    // perdían sin dispararse. Segunda pasada los rescata.
    const t = setTimeout(() => observe(), 400);
    return () => {
      io?.disconnect();
      clearTimeout(t);
    };
  }, []);

  return { reduced };
}

/* Uso en la página:
     const { reduced } = useRespiracion();
     ...
     <h2 className="mt-reveal mt-heading">Título</h2>
     <p className="mt-reveal" style={{ transitionDelay: "0.15s" }}>...</p>
     <span className="mt-rule" />
     {reduced ? <FallbackEstatico/> : <VersionAnimada/>}
*/
