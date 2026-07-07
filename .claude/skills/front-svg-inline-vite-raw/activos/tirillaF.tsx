import { useRef, useState, useCallback, useEffect } from 'react'
import type { SistemaDemo } from '@/data/sistemasDemo'

// ─── CONFIG — ajustar aquí ───────────────────────────────────
const FIXED_COUNT    = 4    // logos en la sección fija (izquierda)
const MAX_SCALE      = 1.9  // escala pico del dock magnético
const INFLUENCE      = 100  // radio de influencia en px
const CAROUSEL_SPEED = 0.3  // px por fotograma (~18 px/s a 60 fps)
// ─────────────────────────────────────────────────────────────

const stripXmlDecl = (svg: string) => svg.replace(/^<\?xml[^?]*\?>\s*/i, '')

export default function TirillaF({
  sistemas,
  dark = false,
  staticMode = false,
  labelFixed = 'Explora la cultura',
  labelCarousel,
}: {
  sistemas: SistemaDemo[]
  dark?: boolean
  staticMode?: boolean
  labelFixed?: string
  labelCarousel?: string
}) {
  const sistemasFixed    = sistemas.slice(0, FIXED_COUNT)
  const sistemasCarousel = sistemas.slice(FIXED_COUNT)

  const [scales, setScales] = useState<number[]>(sistemasFixed.map(() => 1))
  const [isInside, setIsInside] = useState(false)
  const fixedRef    = useRef<HTMLDivElement>(null)
  const carouselRef = useRef<HTMLDivElement>(null)
  const posRef      = useRef(0)

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!fixedRef.current) return
    const items = fixedRef.current.querySelectorAll<HTMLElement>('.tirilla-f__logo-wrap')
    const next = Array.from(items).map(el => {
      const r = el.getBoundingClientRect()
      const dist = Math.hypot(e.clientX - (r.left + r.width / 2), e.clientY - (r.top + r.height / 2))
      if (dist > INFLUENCE) return 1
      return 1 + (MAX_SCALE - 1) * Math.pow(1 - dist / INFLUENCE, 1.8)
    })
    setScales(next)
  }, [])

  const handleMouseEnter = useCallback(() => setIsInside(true), [])
  const handleMouseLeave = useCallback(() => {
    setIsInside(false)
    setScales(sistemasFixed.map(() => 1))
  }, [sistemasFixed.length])

  const maxScale  = Math.max(...scales)
  const activeIdx = isInside && maxScale > 1.05 ? scales.indexOf(maxScale) : -1

  // auto-scroll + pausa en hover y en touch
  useEffect(() => {
    if (staticMode) return
    const el = carouselRef.current
    if (!el) return
    let paused = false
    let raf: number
    let resumeTimer: ReturnType<typeof setTimeout>

    const tick = () => {
      if (!paused) {
        posRef.current += CAROUSEL_SPEED
        const third = el.scrollWidth / 3
        if (third > 0 && posRef.current >= third) posRef.current -= third
        el.scrollLeft = posRef.current
      }
      raf = requestAnimationFrame(tick)
    }

    const pause      = () => { paused = true }
    const resume     = () => { paused = false }
    const touchStart = () => { paused = true; clearTimeout(resumeTimer) }
    const touchEnd   = () => { resumeTimer = setTimeout(() => { paused = false }, 1500) }

    el.addEventListener('mouseenter',  pause)
    el.addEventListener('mouseleave',  resume)
    el.addEventListener('touchstart',  touchStart, { passive: true })
    el.addEventListener('touchend',    touchEnd)
    raf = requestAnimationFrame(tick)

    return () => {
      cancelAnimationFrame(raf)
      clearTimeout(resumeTimer)
      el.removeEventListener('mouseenter', pause)
      el.removeEventListener('mouseleave', resume)
      el.removeEventListener('touchstart', touchStart)
      el.removeEventListener('touchend',   touchEnd)
    }
  }, [staticMode])

  const scrollManual = (dir: 1 | -1) => {
    const el = carouselRef.current
    if (!el) return
    if (staticMode) {
      el.scrollLeft += dir * 200
    } else {
      const third = el.scrollWidth / 3
      posRef.current = ((posRef.current + dir * 200) % third + third) % third
      el.scrollLeft = posRef.current
    }
  }

  const carouselItems = staticMode
    ? sistemasCarousel
    : [...sistemasCarousel, ...sistemasCarousel, ...sistemasCarousel]

  return (
    <div className={`tirilla-f${dark ? ' tirilla-f--dark' : ''}${staticMode ? ' tirilla-f--static' : ''}`}>

      {/* ── títulos (desktop / tablet) — ocultos en mobile ── */}
      {(labelFixed || labelCarousel) && (
        <div className="tirilla-f__titles">
          <span className="tirilla-f__title-fixed">{labelFixed}</span>
          <span className="tirilla-f__title-carousel">{labelCarousel}</span>
        </div>
      )}

      <div className="tirilla-f__inner">

        {/* ── sección fija + dock magnético ───────────────── */}
        <div className="tirilla-f__fixed-wrap">
          {labelFixed && (
            <span className="tirilla-f__mobile-label">{labelFixed}</span>
          )}
          <div
            className="tirilla-f__fixed"
            ref={fixedRef}
            onMouseMove={handleMouseMove}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
          >
            {sistemasFixed.map((s, i) => {
              const isActive = activeIdx === i
              const ac = isActive ? '--active' : ''
              return (
                <a key={s.id} href="#" className="tirilla-f__item" title={s.descripcion}>
                  <div
                    className="tirilla-f__logo-wrap"
                    style={{ transform: `scale(${scales[i]})`, zIndex: Math.round(scales[i] * 10) }}
                  >
                    {s.svgRaw ? (
                      <span
                        className={`tirilla-f__svg-logo tirilla-f__svg-logo${ac}`}
                        dangerouslySetInnerHTML={{ __html: stripXmlDecl(s.svgRaw) }}
                      />
                    ) : (
                      <span className={`tirilla-f__sigla tirilla-f__sigla${ac}`}>{s.sigla}</span>
                    )}
                  </div>
                  <span className={`tirilla-f__nombre tirilla-f__nombre${ac}`}>{s.descripcion}</span>
                </a>
              )
            })}
          </div>
        </div>

        {/* ── divisor ─────────────────────────────────────── */}
        <div className="tirilla-f__divider" />

        {/* ── sección carrusel ────────────────────────────── */}
        <div className="tirilla-f__carousel-section">
          {labelCarousel && (
            <span className="tirilla-f__mobile-label">{labelCarousel}</span>
          )}
          <div className="tirilla-f__carousel-wrap">
            <button className="tirilla-f__arrow" onClick={() => scrollManual(-1)} aria-label="Anterior">‹</button>
            <div className="tirilla-f__carousel" ref={carouselRef}>
              {carouselItems.map((s, idx) => (
                <a
                  key={`${s.id}-${idx}`}
                  href="#"
                  className="tirilla-f__item tirilla-f__item--carousel"
                  title={s.descripcion}
                >
                  <div className="tirilla-f__logo-wrap tirilla-f__logo-wrap--carousel">
                    {s.svgRaw ? (
                      <span
                        className="tirilla-f__svg-logo tirilla-f__svg-logo--carousel"
                        dangerouslySetInnerHTML={{ __html: stripXmlDecl(s.svgRaw) }}
                      />
                    ) : (
                      <span className="tirilla-f__sigla tirilla-f__sigla--carousel">{s.sigla}</span>
                    )}
                  </div>
                  <span className="tirilla-f__nombre tirilla-f__nombre--carousel">{s.descripcion}</span>
                </a>
              ))}
            </div>
            <button className="tirilla-f__arrow" onClick={() => scrollManual(1)} aria-label="Siguiente">›</button>
          </div>
        </div>

      </div>
    </div>
  )
}
