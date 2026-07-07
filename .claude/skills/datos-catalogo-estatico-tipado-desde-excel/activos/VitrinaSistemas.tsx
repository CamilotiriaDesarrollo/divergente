import { useMemo, useState, type CSSProperties } from 'react'
import {
  sistemas,
  temas,
  filtrarSistemas,
  publicoLabel,
  type Tema,
  type Publico,
} from '@/data/sistemas'
import ConstelacionSistemas from './ConstelacionSistemas'

const publicos: Publico[] = ['ciudadania', 'agentes', 'gestores', 'investigadores', 'funcionarios']

const chipClass = (activo: boolean) =>
  'vitrina__chip' + (activo ? ' vitrina__chip--activo' : '')

export default function VitrinaSistemas() {
  const [texto, setTexto] = useState('')
  const [tema, setTema] = useState<Tema | null>(null)
  const [publico, setPublico] = useState<Publico | null>(null)

  const lista = useMemo(
    () => filtrarSistemas(sistemas, { texto, tema, publico }),
    [texto, tema, publico],
  )

  const limpiar = () => {
    setTexto('')
    setTema(null)
    setPublico(null)
  }

  return (
    <section className="vitrina" aria-labelledby="vitrina-title">
      <div className="vitrina__inner">
        <header className="vitrina__head">
          <h1 className="vitrina__title" id="vitrina-title">Explora la cultura</h1>
        </header>

        <div className="vitrina__tools">
          <div className="vitrina__search">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <circle cx="11" cy="11" r="7" />
              <path d="m21 21-4.3-4.3" strokeLinecap="round" />
            </svg>
            <input
              type="search"
              value={texto}
              onChange={e => setTexto(e.target.value)}
              placeholder="Buscar un sistema…"
              aria-label="Buscar un sistema por nombre o descripción"
            />
          </div>

          <div className="vitrina__filtros" role="group" aria-label="Filtrar por tema">
            <button
              type="button"
              className={chipClass(!tema)}
              aria-pressed={!tema}
              onClick={() => setTema(null)}
            >
              Todos
            </button>
            {temas.map(t => (
              <button
                key={t.id}
                type="button"
                className={chipClass(tema === t.id)}
                aria-pressed={tema === t.id}
                onClick={() => setTema(p => (p === t.id ? null : t.id))}
                style={{ '--chip-c': t.color } as CSSProperties}
              >
                <span className="vitrina__chip-dot" aria-hidden="true" />
                {t.label}
              </button>
            ))}
          </div>

<div className="vitrina__filtros" role="group" aria-label="Filtrar por público">
            <button
              type="button"
              className={chipClass(!publico)}
              aria-pressed={!publico}
              onClick={() => setPublico(null)}
            >
              Todo público
            </button>
            {publicos.map(p => (
              <button
                key={p}
                type="button"
                className={chipClass(publico === p)}
                aria-pressed={publico === p}
                onClick={() => setPublico(prev => (prev === p ? null : p))}
              >
                {publicoLabel[p]}
              </button>
            ))}
          </div>
        </div>

        <p className="vitrina__meta" aria-live="polite">
          {lista.length === sistemas.length
            ? `Mostrando los ${sistemas.length} sistemas`
            : `${lista.length} de ${sistemas.length} sistemas`}
        </p>

        {lista.length > 0 ? (
          <ConstelacionSistemas sistemas={lista} />
        ) : (
          <p className="vitrina__empty">
            No encontramos sistemas con esos filtros.{' '}
            <button type="button" className="vitrina__chip" onClick={limpiar}>
              Limpiar filtros
            </button>
          </p>
        )}
      </div>
    </section>
  )
}
