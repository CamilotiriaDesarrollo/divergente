import type { CSSProperties } from 'react'
import type { SistemaOperativo } from '@/data/sistemas'
import { temaMeta, accesoLabel } from '@/data/sistemas'

interface Props {
  sistema: SistemaOperativo
}

export default function TarjetaSistema({ sistema }: Props) {
  const meta = temaMeta[sistema.tema]
  const style = {
    '--c-tema': meta.color,
    '--c-foto': `url('/fondos/${meta.imagen}')`,
  } as CSSProperties

  return (
    <li className="sistema-card">
      <a
        className="sistema-card__link"
        href={sistema.url}
        target="_blank"
        rel="noopener noreferrer"
        style={style}
        aria-label={`${sistema.nombre}. ${meta.label}. ${accesoLabel[sistema.acceso]}. Abre en una pestaña nueva.`}
      >
        <span className="sistema-card__bg" aria-hidden="true" />
        <span className="sistema-card__veil" aria-hidden="true" />
        <span className="sistema-card__go" aria-hidden="true">
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
            <path d="M7 17 17 7M9 7h8v8" />
          </svg>
        </span>
        <span className="sistema-card__glass">
          <span className="sistema-card__tema">{meta.label}</span>
          <h3 className="sistema-card__nombre">{sistema.nombre}</h3>
          <p className="sistema-card__desc">{sistema.descripcion}</p>
          <span className="sistema-card__foot">
            <span className="sistema-card__marca">{sistema.marca}</span>
            <span className="sistema-card__acceso" data-acceso={sistema.acceso}>
              {accesoLabel[sistema.acceso]}
            </span>
          </span>
        </span>
      </a>
    </li>
  )
}
