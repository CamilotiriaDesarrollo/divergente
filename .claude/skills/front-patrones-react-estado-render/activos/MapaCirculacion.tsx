import { useState, useMemo, useEffect, useCallback, useRef } from 'react'
import {
  MapContainer,
  TileLayer,
  CircleMarker,
  Marker,
  Polyline,
  Tooltip,
  GeoJSON,
  useMap,
} from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import type { Feature, FeatureCollection } from 'geojson'
import {
  entidades,
  rutas,
  TIPO_CONFIG,
  TODOS_DEPARTAMENTOS,
  type TipoEntidad,
  type EntidadCultural,
} from '@/data/nodosCulturales'

// Bounds de Colombia para el centrado automático
const COLOMBIA_BOUNDS: [[number, number], [number, number]] = [
  [1.5, -79.0],
  [14.2, -66.8],
]

// Normaliza nombre de departamento para comparación
function normDept(s: string) {
  return s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/\./g, '').trim()
}

// Nombres del GeoJSON → nuestros nombres (casos especiales)
const DEPT_MAP: Record<string, string> = {
  bogota: 'Cundinamarca',
  'bogota dc': 'Cundinamarca',
  'distrito capital': 'Cundinamarca',
  'archipielago de san andres': 'San Andrés y Providencia',
  'san andres providencia y santa catalina': 'San Andrés y Providencia',
}

function resolverDept(rawName: string, deptsSinDatos: Set<string>): string | null {
  const norm = normDept(rawName)
  const mapped = DEPT_MAP[norm]
  if (mapped) return mapped
  return [...deptsSinDatos].find(d => normDept(d) === norm) ?? null
}

type CapaActiva = TipoEntidad | 'general'
type VistaActiva = 'mapa' | 'grafico' | 'tabla'

const CAPAS: { id: CapaActiva; label: string }[] = [
  { id: 'general', label: 'General' },
  { id: 'nodo', label: 'Nodos culturales' },
  { id: 'infraestructura', label: 'Infraestructura' },
  { id: 'evento', label: 'Eventos activos' },
  { id: 'espacio_comunitario', label: 'Espacios comunitarios' },
]

// ── Iconos SVG para los botones de vista ─────────────────────────
const IconMapa = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21" />
    <line x1="9" y1="3" x2="9" y2="18" />
    <line x1="15" y1="6" x2="15" y2="21" />
  </svg>
)
const IconGrafico = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <line x1="18" y1="20" x2="18" y2="10" />
    <line x1="12" y1="20" x2="12" y2="4" />
    <line x1="6" y1="20" x2="6" y2="14" />
    <line x1="2" y1="20" x2="22" y2="20" />
  </svg>
)
const IconTabla = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <rect x="3" y="3" width="18" height="18" rx="2" />
    <line x1="3" y1="9" x2="21" y2="9" />
    <line x1="3" y1="15" x2="21" y2="15" />
    <line x1="9" y1="9" x2="9" y2="21" />
    <line x1="15" y1="9" x2="15" y2="21" />
  </svg>
)

function MapController({ dept }: { dept: string }) {
  const map = useMap()

  useEffect(() => {
    if (dept === 'Todos') {
      map.fitBounds(COLOMBIA_BOUNDS, { padding: [10, 10], animate: true, duration: 0.8 })
      return
    }
    const pts = entidades.filter(e => e.departamento === dept)
    if (pts.length === 0) return
    if (pts.length === 1) {
      map.setView([pts[0].lat, pts[0].lng], 10, { animate: true })
      return
    }
    const lats = pts.map(e => e.lat)
    const lngs = pts.map(e => e.lng)
    const bounds = L.latLngBounds(
      [Math.min(...lats), Math.min(...lngs)],
      [Math.max(...lats), Math.max(...lngs)]
    )
    map.fitBounds(bounds, { padding: [55, 55], maxZoom: 10, animate: true, duration: 0.8 })
  }, [dept, map])

  return null
}

function PanController({ enabled }: { enabled: boolean }) {
  const map = useMap()
  useEffect(() => {
    if (enabled) map.dragging.enable()
    else map.dragging.disable()
  }, [enabled, map])
  return null
}

const PAN_SVG = `<svg viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='1.8' stroke-linecap='round' stroke-linejoin='round'><path d='M7 11.5V7a2 2 0 0 1 4 0m0 0v4m0-4a2 2 0 0 1 4 0v1m0 0a2 2 0 0 1 4 0v5a7 7 0 0 1-7 7h-1a7 7 0 0 1-5.35-2.5L4 17.5a2 2 0 0 1 3-2.5'/></svg>`

function PanButton({ panMode, onToggle }: { panMode: boolean; onToggle: () => void }) {
  const map = useMap()
  const btnRef = useRef<HTMLButtonElement | null>(null)
  const onToggleRef = useRef(onToggle)
  useEffect(() => {
    onToggleRef.current = onToggle
  }, [onToggle])

  useEffect(() => {
    const control = (L as unknown as { control: (o: object) => L.Control }).control({
      position: 'topleft',
    })
    control.onAdd = (): HTMLElement => {
      const wrap = L.DomUtil.create('div')
      const btn = L.DomUtil.create('button', 'mcirc__pan-ctrl-btn', wrap) as HTMLButtonElement
      btn.type = 'button'
      btn.title = 'Activar movimiento libre'
      btn.innerHTML = PAN_SVG
      btnRef.current = btn
      L.DomEvent.on(btn, 'click', e => {
        L.DomEvent.stopPropagation(e)
        onToggleRef.current()
      })
      return wrap
    }
    control.addTo(map)
    return () => {
      control.remove()
    }
  }, [map])

  useEffect(() => {
    if (!btnRef.current) return
    btnRef.current.classList.toggle('mcirc__pan-ctrl-btn--active', panMode)
    btnRef.current.title = panMode ? 'Desactivar movimiento' : 'Activar movimiento libre'
  }, [panMode])

  return null
}

function seedFromId(id: string): number {
  let h = 0
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0
  return h
}

function radioForEntity(e: EntidadCultural): number {
  const seed = seedFromId(e.id)
  const ranges: Record<TipoEntidad, [number, number]> = {
    nodo: [10, 14],
    infraestructura: [2, 5],
    evento: [3, 6],
    espacio_comunitario: [2, 4],
  }
  const [min, max] = ranges[e.tipo]
  return min + (seed % (max - min + 1))
}

function createNodoIcon(e: EntidadCultural): L.DivIcon {
  const seed = seedFromId(e.id)
  const sz = 10 + (seed % 7)
  return L.divIcon({
    html: `<svg viewBox="0 0 16 16" width="${sz}" height="${sz}" xmlns="http://www.w3.org/2000/svg"><polygon points="8,0.5 15.5,8 8,15.5 0.5,8" fill="#7C3AED" stroke="white" stroke-width="1.5"/></svg>`,
    className: 'mcirc__nodo-icon',
    iconSize: [sz, sz],
    iconAnchor: [sz / 2, sz / 2],
    tooltipAnchor: [0, -sz / 2],
  })
}

export default function MapaCirculacion() {
  const [capa, setCapa] = useState<CapaActiva>('general')
  const [vista, setVista] = useState<VistaActiva>('mapa')
  const [dept, setDept] = useState('Todos')
  const [rutasOn, setRutasOn] = useState(true)
  const [sel, setSel] = useState<EntidadCultural | null>(null)
  const [geoData, setGeoData] = useState<FeatureCollection | null>(null)
  const [panMode, setPanMode] = useState(false)
  const [sidebarTab, setSidebarTab] = useState<'capas' | 'territorio'>('capas')

  const deptsSinDatos = useMemo(() => new Set(entidades.map(e => e.departamento)), [])

  useEffect(() => {
    fetch(
      'https://gist.githubusercontent.com/john-guerra/43c7656821069d00dcbc/raw/' +
        'be6a6e239cd5b5b803c6e7c2ec405b793a9064dd/colombia.geo.json'
    )
      .then(r => r.json())
      .then(data => setGeoData(data))
      .catch(() => {})
  }, [])

  const deptGeoStyle = useCallback(
    (feature?: Feature): L.PathOptions => {
      const rawName: string = feature?.properties?.NOMBRE_DPT || feature?.properties?.name || ''
      const match = resolverDept(rawName, deptsSinDatos)
      const isActive = dept !== 'Todos' && !!match && normDept(match) === normDept(dept)
      return {
        color: isActive ? '#512DA8' : '#c8bee8',
        weight: isActive ? 2.5 : 0.7,
        fillColor: isActive ? '#512DA8' : 'transparent',
        fillOpacity: isActive ? 0.07 : 0,
        opacity: isActive ? 1 : 0.55,
      }
    },
    [dept, deptsSinDatos]
  )

  const onEachFeature = useCallback(
    (feature: Feature, layer: L.Layer) => {
      const rawName: string = feature?.properties?.NOMBRE_DPT || feature?.properties?.name || ''
      const labelName = rawName.charAt(0).toUpperCase() + rawName.slice(1).toLowerCase()
      const match = resolverDept(rawName, deptsSinDatos)

      layer.bindTooltip(labelName, { sticky: true, className: 'mcirc-dept-tip' })
      ;(layer as L.Path).on({
        click: () => {
          if (match) {
            setDept(prev => (normDept(prev) === normDept(match) ? 'Todos' : match))
            setSel(null)
          }
        },
        mouseover: () => (layer as L.Path).setStyle({ weight: 2, opacity: 1 }),
        mouseout: () => (layer as L.Path).setStyle(deptGeoStyle(feature)),
      })
    },
    [deptsSinDatos, deptGeoStyle]
  )

  // ── Conteos por categoría ──────────────────────────────────────
  const conteos = useMemo(() => {
    const acc: Record<TipoEntidad, number> = {
      nodo: 0,
      infraestructura: 0,
      evento: 0,
      espacio_comunitario: 0,
    }
    entidades.forEach(e => acc[e.tipo]++)
    return acc
  }, [])

  // ── Entidades filtradas por capa + departamento ────────────────
  const entidadesFiltradas = useMemo(
    () =>
      entidades.filter(
        e =>
          (capa === 'general' || e.tipo === capa) && (dept === 'Todos' || e.departamento === dept)
      ),
    [capa, dept]
  )

  const rutasFiltradas = useMemo(
    () => (rutasOn ? rutas.filter(r => dept === 'Todos' || r.departamentos.includes(dept)) : []),
    [rutasOn, dept]
  )

  // ── Ranking por departamento ───────────────────────────────────
  const rankingDepts = useMemo(() => {
    const counts: Record<string, number> = {}
    entidades.forEach(e => {
      if (capa === 'general' || e.tipo === capa)
        counts[e.departamento] = (counts[e.departamento] || 0) + 1
    })
    return Object.entries(counts)
      .map(([d, n]) => ({ dept: d, count: n }))
      .sort((a, b) => b.count - a.count)
  }, [capa])

  const maxCount = rankingDepts[0]?.count ?? 1

  // ── Departamentos sin cobertura ────────────────────────────────
  const deptsCon = new Set(rankingDepts.map(r => r.dept))
  const vaciosDepts = TODOS_DEPARTAMENTOS.filter(d => !deptsCon.has(d))

  // ── Tabla: conteos por dept × tipo ────────────────────────────
  const tablaDatos = useMemo(() => {
    const rows: Record<string, Record<TipoEntidad, number>> = {}
    entidades.forEach(e => {
      if (!rows[e.departamento])
        rows[e.departamento] = { nodo: 0, infraestructura: 0, evento: 0, espacio_comunitario: 0 }
      rows[e.departamento][e.tipo]++
    })
    return Object.entries(rows)
      .map(([d, tipos]) => ({
        dept: d,
        ...tipos,
        total: Object.values(tipos).reduce((a, b) => a + b, 0),
      }))
      .sort((a, b) => b.total - a.total)
  }, [])

  const cobertura = Math.round((deptsCon.size / TODOS_DEPARTAMENTOS.length) * 100)
  const totalVisible = entidadesFiltradas.length

  return (
    <div className="mcirc">
      {/* ══ TÍTULO + INDICADORES ═══════════════════════════════════ */}
      <div className="mcirc__header-top">
        <h2 className="mcirc__main-title">Mapa de circulación cultural</h2>
      </div>
      <div className="mcirc__tabs">
        {CAPAS.map(c => {
          const cnt = c.id === 'general' ? entidades.length : conteos[c.id as TipoEntidad]
          return (
            <button
              key={c.id}
              className={`mcirc__tab${capa === c.id ? ' mcirc__tab--active' : ''}`}
              onClick={() => {
                setCapa(c.id)
                setSel(null)
              }}
            >
              <span className="mcirc__tab-count">{cnt}</span>
              <span className="mcirc__tab-label">{c.label.toUpperCase()}</span>
            </button>
          )
        })}
      </div>

      {/* ══ CUERPO PRINCIPAL ═══════════════════════════════════════ */}
      <div className="mcirc__body">
        {/* ── SIDEBAR ──────────────────────────────────────────── */}
        <aside className="mcirc__sidebar">
          {/* Card 1: Morada — Mapa ecosistémico */}
          <div className="mcirc__card mcirc__card--purple">
            <span className="mcirc__mod-tag">MAPA ECOSISTÉMICO</span>
            <h2 className="mcirc__sidebar-title">Circulación Cultural</h2>
            <p className="mcirc__sidebar-desc">
              Lectura territorial de la circulación cultural en Colombia: rutas, nodos,
              infraestructuras y eventos activos.
            </p>
          </div>

          {/* Pestañas de filtros */}
          <div className="mcirc__sidebar-tabs" role="tablist" aria-label="Filtros del mapa">
            <button
              role="tab"
              aria-selected={sidebarTab === 'capas'}
              className={`mcirc__sidebar-tab${sidebarTab === 'capas' ? ' mcirc__sidebar-tab--active' : ''}`}
              onClick={() => setSidebarTab('capas')}
            >
              Capas
            </button>
            <button
              role="tab"
              aria-selected={sidebarTab === 'territorio'}
              className={`mcirc__sidebar-tab${sidebarTab === 'territorio' ? ' mcirc__sidebar-tab--active' : ''}`}
              onClick={() => setSidebarTab('territorio')}
            >
              Territorio
            </button>
          </div>

          {/* Tab Capas */}
          {sidebarTab === 'capas' && (
            <div className="mcirc__card mcirc__card--white">
              <div className="mcirc__lectura-activa">
                <span className="mcirc__sec-label">LECTURA ACTIVA</span>
                <span className="mcirc__lectura-nombre">
                  {dept === 'Todos' ? 'TERRITORIO Y FILTRO' : dept.toUpperCase()}
                </span>
              </div>
              <div className="mcirc__vista-bloque">
                <span className="mcirc__vista-right">Vista</span>
                <span className="mcirc__vista-nombre">
                  {capa === 'general'
                    ? 'GENERAL'
                    : CAPAS.find(c => c.id === capa)?.label.toUpperCase()}
                </span>
              </div>
              <span className="mcirc__sec-label" style={{ marginTop: '6px' }}>
                CAPA ACTIVA
              </span>
              <div className="mcirc__capa-pills">
                {CAPAS.map(c => (
                  <button
                    key={c.id}
                    className={`mcirc__capa-pill${capa === c.id ? ' mcirc__capa-pill--active' : ''}`}
                    onClick={() => setCapa(c.id)}
                  >
                    {c.id === 'general' ? 'GENERAL' : c.label.split(' ')[0].toUpperCase()}
                  </button>
                ))}
              </div>
              <label className="mcirc__filtro mcirc__filtro--rutas">
                <input
                  type="checkbox"
                  className="mcirc__filtro-check"
                  checked={rutasOn}
                  onChange={() => setRutasOn(v => !v)}
                />
                <span className="mcirc__filtro-dot mcirc__filtro-dot--line">
                  <span />
                </span>
                <span className="mcirc__filtro-txt">Rutas de circulación</span>
                <span className="mcirc__filtro-cnt">{rutas.length}</span>
              </label>
            </div>
          )}

          {/* Tab Territorio */}
          {sidebarTab === 'territorio' && (
            <div className="mcirc__card mcirc__card--purple">
              <span className="mcirc__sec-label">TERRITORIO</span>
              <select
                className="mcirc__dept-select"
                value={dept}
                onChange={e => {
                  setDept(e.target.value)
                  setSel(null)
                }}
              >
                <option value="Todos">NACIONAL</option>
                {[...new Set(entidades.map(e => e.departamento))].sort().map(d => (
                  <option key={d} value={d}>
                    {d.toUpperCase()}
                  </option>
                ))}
              </select>
              <span className="mcirc__sec-label" style={{ marginTop: '8px' }}>
                VACÍOS DE COBERTURA
              </span>
              <div className="mcirc__vacios-tags">
                {vaciosDepts.slice(0, 8).map(d => (
                  <span key={d} className="mcirc__vacio-tag">
                    {d}
                  </span>
                ))}
                {vaciosDepts.length > 8 && (
                  <span className="mcirc__vacio-tag mcirc__vacio-tag--more">
                    +{vaciosDepts.length - 8} más
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Card: Blanca — Detalle punto seleccionado */}
          {sel && (
            <div className="mcirc__card mcirc__card--white mcirc__detalle">
              <button className="mcirc__detalle-close" onClick={() => setSel(null)}>
                ✕
              </button>
              <span
                className="mcirc__detalle-tipo"
                style={{ background: TIPO_CONFIG[sel.tipo].color }}
              >
                {TIPO_CONFIG[sel.tipo].label}
              </span>
              <p className="mcirc__detalle-nombre">{sel.nombre}</p>
              <p className="mcirc__detalle-lugar">
                {sel.municipio} · {sel.departamento}
              </p>
              <p className="mcirc__detalle-desc">{sel.descripcion}</p>
            </div>
          )}
        </aside>

        {/* ── CONTENIDO PRINCIPAL ──────────────────────────────── */}
        <div className="mcirc__main">
          <div className="mcirc__main-header">
            <div>
              <h2 className="mcirc__main-title">
                {dept === 'Todos' ? 'Circulación cultural en Colombia' : `Departamento: ${dept}`}
              </h2>
              <p className="mcirc__main-desc">
                {capa === 'general'
                  ? 'Lectura territorial integrada — nodos, infraestructura, eventos y espacios comunitarios.'
                  : `Vista filtrada: ${CAPAS.find(c => c.id === capa)?.label} · ${totalVisible} registros visibles`}
              </p>
            </div>
            <div className="mcirc__view-btns">
              <button
                className={`mcirc__view-btn${vista === 'mapa' ? ' mcirc__view-btn--active' : ''}`}
                onClick={() => setVista('mapa')}
                title="Vista mapa"
              >
                <IconMapa />
              </button>
              <button
                className={`mcirc__view-btn${vista === 'grafico' ? ' mcirc__view-btn--active' : ''}`}
                onClick={() => setVista('grafico')}
                title="Vista gráfico"
              >
                <IconGrafico />
              </button>
              <button
                className={`mcirc__view-btn${vista === 'tabla' ? ' mcirc__view-btn--active' : ''}`}
                onClick={() => setVista('tabla')}
                title="Vista tabla"
              >
                <IconTabla />
              </button>
            </div>
          </div>

          {/* Vista mapa */}
          {vista === 'mapa' && (
            <div className="mcirc__map-card">
              <MapContainer
                bounds={COLOMBIA_BOUNDS}
                boundsOptions={{ padding: [10, 10] }}
                className={`mcirc__leaflet${panMode ? ' mcirc__leaflet--pan' : ''}`}
                scrollWheelZoom={false}
                dragging={false}
                doubleClickZoom={false}
                zoomControl
              >
                <MapController dept={dept} />
                <PanController enabled={panMode} />
                <PanButton panMode={panMode} onToggle={() => setPanMode(v => !v)} />
                <TileLayer
                  url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
                />

                {/* Contornos de departamentos */}
                {geoData && (
                  <GeoJSON
                    key={dept}
                    data={geoData}
                    style={deptGeoStyle}
                    onEachFeature={onEachFeature}
                  />
                )}

                {rutasFiltradas.map(r => (
                  <Polyline
                    key={r.id}
                    positions={r.puntos}
                    pathOptions={{ color: r.color, weight: 1.5, opacity: 0.55, dashArray: '8 5' }}
                  >
                    <Tooltip sticky>
                      <strong>{r.nombre}</strong>
                    </Tooltip>
                  </Polyline>
                ))}

                {entidadesFiltradas
                  .filter(e => e.tipo !== 'nodo')
                  .map(e => (
                    <CircleMarker
                      key={e.id}
                      center={[e.lat, e.lng]}
                      radius={radioForEntity(e)}
                      pathOptions={{
                        fillColor: TIPO_CONFIG[e.tipo].color,
                        color: '#fff',
                        weight: 0.6,
                        fillOpacity: 0.82,
                      }}
                      eventHandlers={{ click: () => setSel(e) }}
                    >
                      <Tooltip direction="top" offset={[0, -4]}>
                        <strong>{e.nombre}</strong>
                        <br />
                        {e.municipio} · {e.departamento}
                      </Tooltip>
                    </CircleMarker>
                  ))}

                {entidadesFiltradas
                  .filter(e => e.tipo === 'nodo')
                  .map(e => (
                    <Marker
                      key={e.id}
                      position={[e.lat, e.lng]}
                      icon={createNodoIcon(e)}
                      eventHandlers={{ click: () => setSel(e) }}
                    >
                      <Tooltip direction="top" offset={[0, -4]}>
                        <strong>{e.nombre}</strong>
                        <br />
                        {e.municipio} · {e.departamento}
                      </Tooltip>
                    </Marker>
                  ))}
              </MapContainer>

              <div className="mcirc__leyenda">
                <span className="mcirc__leyenda-title">LEYENDA</span>
                {(Object.keys(TIPO_CONFIG) as TipoEntidad[]).map(t => (
                  <span key={t} className="mcirc__leyenda-item">
                    {t === 'nodo' ? (
                      <svg
                        viewBox="0 0 12 12"
                        width="10"
                        height="10"
                        className="mcirc__leyenda-diamond"
                      >
                        <polygon points="6,0.5 11.5,6 6,11.5 0.5,6" fill={TIPO_CONFIG[t].color} />
                      </svg>
                    ) : (
                      <span
                        className="mcirc__leyenda-dot"
                        style={{ background: TIPO_CONFIG[t].color }}
                      />
                    )}
                    {TIPO_CONFIG[t].label}
                  </span>
                ))}
                {rutasOn && (
                  <span className="mcirc__leyenda-item">
                    <span className="mcirc__leyenda-dash" />
                    Rutas de circulación
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Vista gráfico */}
          {vista === 'grafico' && (
            <div className="mcirc__chart-wrap">
              <div className="mcirc__chart-title">
                <span className="mcirc__sec-label-dark">RANKING TERRITORIAL</span>
                <h3>Departamentos con mayor circulación</h3>
              </div>
              <div className="mcirc__chart-list">
                {rankingDepts.map((item, idx) => (
                  <div key={item.dept} className="mcirc__chart-row">
                    <span className="mcirc__chart-rank">{idx + 1}</span>
                    <div className="mcirc__chart-info">
                      <div className="mcirc__chart-top">
                        <span className="mcirc__chart-dept">{item.dept}</span>
                        <span className="mcirc__chart-cnt">
                          {item.count} <small>registros</small>
                        </span>
                      </div>
                      <div className="mcirc__chart-bar">
                        <div
                          className="mcirc__chart-fill"
                          style={{ width: `${(item.count / maxCount) * 100}%` }}
                        />
                      </div>
                      <span className="mcirc__chart-pct">
                        {Math.round((item.count / entidades.length) * 100)}% del total
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Vista tabla */}
          {vista === 'tabla' && (
            <div className="mcirc__tabla-wrap">
              <div className="mcirc__chart-title">
                <span className="mcirc__sec-label-dark">CONSULTA ESPECIALIZADA</span>
                <h3>Lectura por departamento</h3>
              </div>
              <div className="mcirc__tabla-scroll">
                <table className="mcirc__tabla">
                  <thead>
                    <tr>
                      <th>Departamento</th>
                      <th>Nodos</th>
                      <th>Infraestr.</th>
                      <th>Eventos</th>
                      <th>Espacios</th>
                      <th>Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tablaDatos.map(row => (
                      <tr
                        key={row.dept}
                        className={dept === row.dept ? 'mcirc__tabla-row--active' : ''}
                        onClick={() => setDept(d => (d === row.dept ? 'Todos' : row.dept))}
                        style={{ cursor: 'pointer' }}
                      >
                        <td className="mcirc__tabla-dept">{row.dept}</td>
                        <td>{row.nodo || '—'}</td>
                        <td>{row.infraestructura || '—'}</td>
                        <td>{row.evento || '—'}</td>
                        <td>{row.espacio_comunitario || '—'}</td>
                        <td className="mcirc__tabla-total">{row.total}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* ── PANEL LECTURA RÁPIDA ──────────────────────────────── */}
        <aside className="mcirc__stats">
          <div className="mcirc__lectura-rapida">
            <span className="mcirc__sec-label">LECTURA RÁPIDA</span>
            <strong className="mcirc__lr-titulo">
              {dept === 'Todos' ? 'Estado nacional' : dept}
            </strong>

            <div className="mcirc__lr-cobertura">
              <span className="mcirc__lr-pct">{cobertura}%</span>
              <span className="mcirc__lr-lbl">cobertura</span>
              <div className="mcirc__lr-bar">
                <div className="mcirc__lr-bar-fill" style={{ width: `${cobertura}%` }} />
              </div>
              <span className="mcirc__lr-sub">
                {deptsCon.size} de {TODOS_DEPARTAMENTOS.length} departamentos
              </span>
            </div>
          </div>

          {(Object.keys(TIPO_CONFIG) as TipoEntidad[]).map(t => {
            const cnt =
              dept === 'Todos'
                ? conteos[t]
                : entidades.filter(e => e.tipo === t && e.departamento === dept).length
            return (
              <div key={t} className="mcirc__stat-card">
                <span className="mcirc__stat-num">{cnt}</span>
                <div className="mcirc__stat-meta">
                  <span className="mcirc__stat-dot" style={{ background: TIPO_CONFIG[t].color }} />
                  <span className="mcirc__stat-label">{TIPO_CONFIG[t].label}</span>
                </div>
              </div>
            )
          })}

          <div className="mcirc__stat-card mcirc__stat-card--rutas">
            <span className="mcirc__stat-num">{rutasFiltradas.length}</span>
            <div className="mcirc__stat-meta">
              <span className="mcirc__stat-dot" style={{ background: '#94a3b8' }} />
              <span className="mcirc__stat-label">Rutas activas</span>
            </div>
          </div>

          <div className="mcirc__stat-total">
            <span className="mcirc__stat-total-num">{totalVisible}</span>
            <span className="mcirc__stat-total-lbl">registros visibles</span>
          </div>

          <div className="mcirc__stat-footer">
            Territorio: <strong>{dept === 'Todos' ? 'Nacional' : dept}</strong>
            <br />
            Capa: <strong>{CAPAS.find(c => c.id === capa)?.label}</strong>
          </div>
        </aside>
      </div>
    </div>
  )
}
