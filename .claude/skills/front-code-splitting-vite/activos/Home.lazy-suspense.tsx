import { useState, lazy, Suspense } from 'react'
import HeaderMincultura from '@/components/headerMincultura'
import TirillaF from '@/components/tirillaF'
import FooterMincultura from '@/components/footerMincultura'
import AccesibilidadBar from '@/components/accesibilidadBar'
import HomeLanding from '@/pages/HomeLanding'
import { sistemasDemo } from '@/data/sistemasDemo'

// La ventana internacional solo se carga cuando el usuario la abre:
// difiere su código y el dataset de eventos del bundle inicial.
const InternacionalizacionPage = lazy(() => import('@/pages/InternacionalizacionPage'))

type Vista = 'landing' | 'internacional'

export default function Home() {
  const [vista, setVista] = useState<Vista>('landing')

  function openInternacional() {
    setVista('internacional')
    window.scrollTo({ top: 0, behavior: 'auto' })
  }

  function backToLanding() {
    setVista('landing')
    window.scrollTo({ top: 0, behavior: 'auto' })
  }

  return (
    <div className="page-layout">
      <AccesibilidadBar />
      <HeaderMincultura />

      <main className="page-main">
        {vista === 'landing' ? (
          <HomeLanding onOpenInternacional={openInternacional} />
        ) : (
          <div className="internacional-view">
            <div className="internacional-view__bar">
              <button className="internacional-view__back" onClick={backToLanding}>
                <svg
                  viewBox="0 0 24 24"
                  width="16"
                  height="16"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <line x1="19" y1="12" x2="5" y2="12" />
                  <polyline points="12 19 5 12 12 5" />
                </svg>
                Volver a la página principal
              </button>
              <span className="internacional-view__crumb">Ventana Internacional</span>
            </div>
            <Suspense
              fallback={
                <div style={{ padding: '80px 24px', textAlign: 'center', color: '#7a6faa' }}>
                  Cargando ventana internacional…
                </div>
              }
            >
              <InternacionalizacionPage />
            </Suspense>
          </div>
        )}
      </main>

      <TirillaF
        sistemas={sistemasDemo}
        labelFixed="Explora la cultura"
        labelCarousel="Aliados — Otras plataformas"
      />
      <FooterMincultura />
    </div>
  )
}
