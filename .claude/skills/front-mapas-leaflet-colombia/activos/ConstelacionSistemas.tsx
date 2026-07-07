import {
  useMemo,
  useState,
  useEffect,
  useRef,
  useCallback,
  type CSSProperties,
} from 'react'
import {
  forceSimulation,
  forceX,
  forceY,
  forceCollide,
  forceManyBody,
} from 'd3-force'
import {
  temas,
  temaMeta,
  accesoLabel,
  publicoLabel,
  type SistemaOperativo,
  type Tema,
} from '@/data/sistemas'

const VB_W = 1000
const VB_H = 640

// Anclas normalizadas (0..1) por tema: disposición tipo constelación
// con "Artes" (el racimo más grande) en el corazón y el resto orbitando.
const anclas: Record<Tema, [number, number]> = {
  museos: [0.16, 0.26],
  patrimonio: [0.43, 0.15],
  estimulos: [0.74, 0.18],
  cine: [0.89, 0.44],
  datos: [0.85, 0.78],
  institucional: [0.57, 0.88],
  gestion: [0.21, 0.83],
  fomento: [0.1, 0.56],
  artes: [0.49, 0.53],
}

interface Nodo extends SistemaOperativo {
  r: number
  ax: number
  ay: number
  x: number
  y: number
}

interface Props {
  sistemas: SistemaOperativo[]
}

export default function ConstelacionSistemas({ sistemas }: Props) {
  const firma = sistemas.map(s => s.id).join(',')
  const [seleccion, setSeleccion] = useState<SistemaOperativo | null>(null)
  const focoPrevio = useRef<HTMLButtonElement | null>(null)
  const cerrarRef = useRef<HTMLButtonElement | null>(null)

  const nodos = useMemo<Nodo[]>(() => {
    const ns: Nodo[] = sistemas.map((s, i) => {
      const [ax, ay] = anclas[s.tema]
      const ang = i * 137.5 * (Math.PI / 180) // ángulo áureo → dispersión inicial estable
      return {
        ...s,
        r: 22 + s.publico.length * 4,
        ax: ax * VB_W,
        ay: ay * VB_H,
        x: ax * VB_W + Math.cos(ang) * 28,
        y: ay * VB_H + Math.sin(ang) * 28,
      }
    })

    const sim = forceSimulation<Nodo>(ns)
      .force('x', forceX<Nodo>(d => d.ax).strength(0.2))
      .force('y', forceY<Nodo>(d => d.ay).strength(0.2))
      .force('charge', forceManyBody<Nodo>().strength(-24))
      .force('collide', forceCollide<Nodo>(d => d.r + 9).strength(0.95))
      .stop()
    for (let i = 0; i < 300; i++) sim.tick()

    ns.forEach(n => {
      n.x = Math.max(n.r + 8, Math.min(VB_W - n.r - 8, n.x))
      n.y = Math.max(n.r + 26, Math.min(VB_H - n.r - 30, n.y))
    })
    return ns
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [firma])

  const temasVisibles = useMemo(() => {
    const presentes = new Set(nodos.map(n => n.tema))
    return temas.filter(t => presentes.has(t.id))
  }, [nodos])

  const abrir = useCallback((s: SistemaOperativo, el: HTMLButtonElement) => {
    focoPrevio.current = el
    setSeleccion(s)
  }, [])

  const cerrar = useCallback(() => {
    setSeleccion(null)
    focoPrevio.current?.focus()
  }, [])

  useEffect(() => {
    if (!seleccion) return
    cerrarRef.current?.focus()
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') cerrar()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [seleccion, cerrar])

  const meta = seleccion ? temaMeta[seleccion.tema] : null

  return (
    <div className="constelacion">
      <p className="constelacion__ayuda">
        Cada punto es un sistema, agrupado por color según su tema. Recórrelos con{' '}
        <kbd>Tab</kbd> y abre el detalle con <kbd>Enter</kbd>.
      </p>

      <div className="constelacion__lienzo">
        <svg
          className="constelacion__lineas"
          viewBox={`0 0 ${VB_W} ${VB_H}`}
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          {nodos.map(n => (
            <line
              key={n.id}
              x1={n.ax}
              y1={n.ay}
              x2={n.x}
              y2={n.y}
              stroke={temaMeta[n.tema].color}
              strokeOpacity={0.16}
              strokeWidth={1.2}
              vectorEffect="non-scaling-stroke"
            />
          ))}
        </svg>

        {temasVisibles.map(t => {
          const [ax, ay] = anclas[t.id]
          return (
            <span
              key={t.id}
              className="constelacion__cluster"
              style={
                {
                  left: `${ax * 100}%`,
                  top: `${ay * 100}%`,
                  color: t.color,
                } as CSSProperties
              }
            >
              {t.label}
            </span>
          )
        })}

        {nodos.map(n => {
          const m = temaMeta[n.tema]
          const sel = seleccion?.id === n.id
          return (
            <button
              key={n.id}
              type="button"
              className={'cnode' + (sel ? ' cnode--sel' : '')}
              style={
                {
                  left: `${(n.x / VB_W) * 100}%`,
                  top: `${(n.y / VB_H) * 100}%`,
                  '--c': m.color,
                  '--d': `${n.r * 2}px`,
                  '--delay': `${Math.round(n.x + n.y) % 3500}ms`,
                } as CSSProperties
              }
              aria-label={`${n.nombre}. ${m.label}. ${accesoLabel[n.acceso]}.`}
              aria-pressed={sel}
              onClick={e => abrir(n, e.currentTarget)}
            >
              <span className="cnode__dot" aria-hidden="true" />
              <span className="cnode__label">{n.marca}</span>
            </button>
          )
        })}
      </div>

      {seleccion && meta && (
        <div
          className="constelacion__panel"
          role="dialog"
          aria-label={`Detalle de ${seleccion.nombre}`}
          style={
            {
              '--c': meta.color,
              '--foto': `url('/fondos/${meta.imagen}')`,
            } as CSSProperties
          }
        >
          <button
            type="button"
            className="constelacion__cerrar"
            onClick={cerrar}
            aria-label="Cerrar detalle"
            ref={cerrarRef}
          >
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
              <path d="M6 6l12 12M18 6 6 18" />
            </svg>
          </button>
          <div className="constelacion__panel-foto" aria-hidden="true" />
          <div className="constelacion__panel-cuerpo">
            <span className="constelacion__panel-tema">{meta.label}</span>
            <h3 className="constelacion__panel-nombre">{seleccion.nombre}</h3>
            <p className="constelacion__panel-marca">{seleccion.marca}</p>
            <p className="constelacion__panel-desc">{seleccion.descripcion}</p>
            <div className="constelacion__panel-tags">
              <span className="constelacion__tag" data-acceso={seleccion.acceso}>
                {accesoLabel[seleccion.acceso]}
              </span>
              {seleccion.publico.map(p => (
                <span key={p} className="constelacion__tag">
                  {publicoLabel[p]}
                </span>
              ))}
            </div>
            <a
              className="constelacion__cta"
              href={seleccion.url}
              target="_blank"
              rel="noopener noreferrer"
            >
              Ir al sistema
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                <path d="M7 17 17 7M9 7h8v8" />
              </svg>
            </a>
          </div>
        </div>
      )}
    </div>
  )
}
