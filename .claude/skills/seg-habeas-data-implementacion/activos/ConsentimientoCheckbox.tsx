// ConsentimientoCheckbox.tsx — Casilla de consentimiento Habeas Data (Ley 1581/2012).
// Reglas SIC: NUNCA pre-marcada, texto claro, enlace a la política vigente, una casilla por finalidad,
// consentimiento separado del resto del formulario (no un "acepto términos" que lo mezcle todo).
// Accesibilidad NTC 5854 AA (ver ux-accesibilidad-ntc5854-aa): label asociado, foco visible, error con role=alert.
"use client"; // Next.js 16 App Router. En React+Vite eliminar esta directiva.
import { useId } from "react";

type Props = {
  finalidad: string;       // etiqueta legible: "recibir el boletín"
  descripcion: string;     // frase introductoria opcional
  urlPolitica: string;     // ${URL_POLITICA_PRIVACIDAD}
  checked: boolean;
  onChange: (v: boolean) => void;
  error?: string;
};

export function ConsentimientoCheckbox({ finalidad, descripcion, urlPolitica, checked, onChange, error }: Props) {
  const id = useId();
  const errId = `${id}-err`;
  return (
    <div className="consent">
      <input
        id={id}
        type="checkbox"
        checked={checked}                       // controlado; NUNCA defaultChecked
        aria-describedby={error ? errId : undefined}
        aria-invalid={error ? true : undefined}
        onChange={(e) => onChange(e.target.checked)}
      />
      <label htmlFor={id}>
        {descripcion} Autorizo el tratamiento de mis datos personales para <strong>{finalidad}</strong>,
        conforme a la{" "}
        <a href={urlPolitica} target="_blank" rel="noopener noreferrer">
          Política de Tratamiento de Datos Personales
        </a>
        .
      </label>
      {error && (
        <p id={errId} role="alert" className="consent__error">
          {error}
        </p>
      )}
    </div>
  );
}
