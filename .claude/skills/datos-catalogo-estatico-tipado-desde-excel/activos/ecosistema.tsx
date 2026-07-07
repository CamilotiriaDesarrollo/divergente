import { useMemo, useState } from 'react'
import { iniciativas, CATEGORIAS, DIRECCIONES, type CategoriaId } from '@/data/iniciativas'

type Filtro = CategoriaId | 'todos'

const catById = Object.fromEntries(CATEGORIAS.map(c => [c.id, c]))
const PAGE_SIZE = 8

export default function Ecosistema() {
  const [categoria, setCategoria] = useState<Filtro>('todos')
  const [query, setQuery] = useState('')
  const [direccion, setDireccion] = useState('todas')
  const [pagina, setPagina] = useState(0)

  // Direcciones que efectivamente aparecen en el dataset
  const direccionesPresentes = useMemo(() => {
    const set = new Set(iniciativas.map(i => i.direccion))
    return Object.keys(DIRECCIONES).filter(d => set.has(d))
  }, [])

  const conteos = useMemo(() => {
    const acc: Record<string, number> = { todos: iniciativas.length }
    CATEGORIAS.forEach(c => {
      acc[c.id] = iniciativas.filter(i => i.categorias.includes(c.id)).length
    })
    return acc
  }, [])

  const filtradas = useMemo(() => {
    const q = query.trim().toLowerCase()
    return iniciativas.filter(i => {
      if (categoria !== 'todos' && !i.categorias.includes(categoria)) return false
      if (direccion !== 'todas' && i.direccion !== direccion) return false
      if (q) {
        const hay =
          `${i.nombre} ${i.descripcion} ${i.tipo} ${DIRECCIONES[i.direccion]}`.toLowerCase()
        if (!hay.includes(q)) return false
      }
      return true
    })
  }, [categoria, direccion, query])

  // Cualquier cambio de filtro vuelve a la primera página.
  // Ajuste de estado durante el render (patrón recomendado por React): evita
  // el re-render adicional que provocaría hacerlo dentro de un useEffect.
  const filtroKey = `${categoria}|${direccion}|${query}`
  const [filtroPrev, setFiltroPrev] = useState(filtroKey)
  if (filtroKey !== filtroPrev) {
    setFiltroPrev(filtroKey)
    setPagina(0)
  }

  // Carrusel: 8 fuentes por página (2 filas × 4)
  const totalPaginas = Math.max(1, Math.ceil(filtradas.length / PAGE_SIZE))
  const paginaActual = Math.min(pagina, totalPaginas - 1)
  const visibles = filtradas.slice(paginaActual * PAGE_SIZE, paginaActual * PAGE_SIZE + PAGE_SIZE)

  const hayFiltros = categoria !== 'todos' || direccion !== 'todas' || query.trim() !== ''

  function limpiar() {
    setCategoria('todos')
    setDireccion('todas')
    setQuery('')
  }

  return (
    <section className="eco" id="ecosistema" aria-labelledby="eco-title">
      <span className="eco__watermark" aria-hidden="true">
        ECOSISTEMA
      </span>

      {/* ── Encabezado ─────────────────────────────────────────── */}
      <div className="eco__head">
        <h2 id="eco-title" className="eco__titulo-central">
          Circulación
        </h2>
      </div>

      {/* ── Buscador centrado bajo el título ───────────────────── */}
      <div className="eco__search-row">
        <div className="eco__search">
          <svg
            viewBox="0 0 24 24"
            width="18"
            height="18"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            aria-hidden="true"
          >
            <circle cx="11" cy="11" r="7" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="search"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Buscar fuente, plataforma o dirección…"
            aria-label="Buscar en el ecosistema de circulación"
          />
        </div>
      </div>

      {/* ── Layout: panel de filtros + cards ───────────────────── */}
      <div className="eco__layout">
        <aside className="eco__panel" aria-label="Filtros del ecosistema">
          <span className="eco__panel-label">Temáticas</span>
          <div
            className="eco__panel-chips"
            role="group"
            aria-label="Filtrar por temática de circulación"
          >
            <button
              type="button"
              aria-pressed={categoria === 'todos'}
              className={`eco__chip${categoria === 'todos' ? ' eco__chip--active' : ''}`}
              onClick={() => setCategoria('todos')}
            >
              <span className="eco__chip-label">Todas</span>
              <span className="eco__chip-count">{conteos.todos}</span>
            </button>
            {CATEGORIAS.map(c => {
              const active = categoria === c.id
              return (
                <button
                  key={c.id}
                  type="button"
                  aria-pressed={active}
                  className={`eco__chip${active ? ' eco__chip--active' : ''}`}
                  style={{ '--chip-color': c.color } as React.CSSProperties}
                  onClick={() => setCategoria(c.id)}
                >
                  <svg
                    viewBox="0 0 24 24"
                    width="15"
                    height="15"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.9"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <path d={c.icono} />
                  </svg>
                  <span className="eco__chip-label">{c.labelNav}</span>
                  <span className="eco__chip-count">{conteos[c.id]}</span>
                </button>
              )
            })}
          </div>

          <span className="eco__panel-label">Dirección</span>
          <div className="eco__dirwrap">
            <select
              className="eco__dir"
              value={direccion}
              onChange={e => setDireccion(e.target.value)}
              aria-label="Filtrar por dirección o unidad"
            >
              <option value="todas">Todas las direcciones</option>
              {direccionesPresentes.map(d => (
                <option key={d} value={d}>
                  {DIRECCIONES[d]}
                </option>
              ))}
            </select>
            <svg
              viewBox="0 0 12 12"
              width="11"
              height="11"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <polyline points="2 4 6 8 10 4" />
            </svg>
          </div>

          <div className="eco__panel-foot">
            <span className="eco__count">
              <strong>{filtradas.length}</strong> {filtradas.length === 1 ? 'fuente' : 'fuentes'}
            </span>
            {hayFiltros && (
              <button className="eco__clear" onClick={limpiar}>
                ✕ Limpiar
              </button>
            )}
          </div>
        </aside>

        <div className="eco__main">
          {/* ── Grid de tarjetas ───────────────────────────────────── */}
          {filtradas.length === 0 ? (
            <div className="eco__empty">
              <p>No hay fuentes con estos filtros.</p>
              <button className="eco__clear" onClick={limpiar}>
                Ver todas
              </button>
            </div>
          ) : (
            <>
              <div className="eco__carousel">
                <button
                  type="button"
                  className="eco__nav eco__nav--prev"
                  onClick={() => setPagina(p => Math.max(0, p - 1))}
                  disabled={paginaActual === 0}
                  aria-label="Página anterior"
                >
                  <svg
                    viewBox="0 0 24 24"
                    width="24"
                    height="24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <polyline points="15 18 9 12 15 6" />
                  </svg>
                </button>

                <div
                  className="eco__grid"
                  key={`${categoria}-${direccion}-${query}-${paginaActual}`}
                >
                  {visibles.map((ini, idx) => {
                    const principal = catById[ini.categorias[0]]
                    return (
                      <article
                        className="eco-card"
                        style={
                          {
                            '--card-color': principal?.color ?? '#7C3AED',
                            animationDelay: `${Math.min(idx * 45, 600)}ms`,
                          } as React.CSSProperties
                        }
                        key={ini.id}
                      >
                        <h3 className="eco-card__title">{ini.nombre}</h3>
                        <span className="eco-card__tipo">{ini.tipo}</span>
                        <p className="eco-card__desc">{ini.descripcion}</p>

                        {ini.nota && <p className="eco-card__nota">{ini.nota}</p>}

                        <div className="eco-card__foot">
                          {ini.publico && ini.url ? (
                            <a
                              className="eco-card__link"
                              href={ini.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              aria-label={`Visitar ${ini.nombre} (se abre en una pestaña nueva)`}
                            >
                              Visitar fuente
                              <svg
                                viewBox="0 0 24 24"
                                width="15"
                                height="15"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2.2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                aria-hidden="true"
                              >
                                <path d="M7 17L17 7M9 7h8v8" />
                              </svg>
                            </a>
                          ) : (
                            <span className="eco-card__soon">Fuente en integración</span>
                          )}

                          {ini.enlacesExtra && ini.enlacesExtra.length > 0 && (
                            <div className="eco-card__extra">
                              {ini.enlacesExtra.map(e => (
                                <a
                                  key={e.url}
                                  href={e.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="eco-card__extra-link"
                                  aria-label={`${e.label} — ${ini.nombre} (se abre en una pestaña nueva)`}
                                >
                                  {e.label}
                                </a>
                              ))}
                            </div>
                          )}
                        </div>
                      </article>
                    )
                  })}
                </div>

                <button
                  type="button"
                  className="eco__nav eco__nav--next"
                  onClick={() => setPagina(p => Math.min(totalPaginas - 1, p + 1))}
                  disabled={paginaActual >= totalPaginas - 1}
                  aria-label="Página siguiente"
                >
                  <svg
                    viewBox="0 0 24 24"
                    width="24"
                    height="24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <polyline points="9 18 15 12 9 6" />
                  </svg>
                </button>
              </div>

              {totalPaginas > 1 && (
                <div className="eco__dots" role="tablist" aria-label="Páginas de fuentes">
                  {Array.from({ length: totalPaginas }).map((_, i) => (
                    <button
                      key={i}
                      type="button"
                      className={`eco__dot${i === paginaActual ? ' eco__dot--active' : ''}`}
                      onClick={() => setPagina(i)}
                      aria-current={i === paginaActual}
                      aria-label={`Página ${i + 1} de ${totalPaginas}`}
                    />
                  ))}
                  <span className="eco__dots-count">
                    {paginaActual + 1}/{totalPaginas}
                  </span>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </section>
  )
}
