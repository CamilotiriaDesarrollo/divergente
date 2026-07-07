import { useState } from 'react'

export default function AccesibilidadBar() {
  const [highContrast, setHighContrast] = useState(false)
  const [fontSize, setFontSize] = useState(0)

  const toggleContrast = () => {
    const next = !highContrast
    setHighContrast(next)
    document.documentElement.classList.toggle('high-contrast', next)
  }

  const changeFont = (delta: number) => {
    const next = Math.min(2, Math.max(-1, fontSize + delta))
    setFontSize(next)
    const sizes = ['14px', '16px', '18px', '20px']
    document.documentElement.style.fontSize = sizes[next + 1]
  }

  return (
    <div className="acc-bar" role="complementary" aria-label="Herramientas de accesibilidad">
      <button
        className={`acc-bar__btn ${highContrast ? 'acc-bar__btn--active' : ''}`}
        onClick={toggleContrast}
        title="Alto contraste"
        aria-pressed={highContrast}
      >
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M12 3a9 9 0 1 0 0 18A9 9 0 0 0 12 3zm0 16V5a7 7 0 0 1 0 14z" />
        </svg>
      </button>

      <button
        className="acc-bar__btn acc-bar__btn--text"
        onClick={() => changeFont(1)}
        title="Aumentar texto"
        aria-label="Aumentar tamaño de texto"
      >
        A<sup>+</sup>
      </button>

      <button
        className="acc-bar__btn acc-bar__btn--text acc-bar__btn--sm"
        onClick={() => changeFont(-1)}
        title="Reducir texto"
        aria-label="Reducir tamaño de texto"
      >
        A<sup>−</sup>
      </button>

      <button
        className="acc-bar__btn"
        onClick={() => changeFont(0)}
        title="Restablecer texto"
        aria-label="Restablecer tamaño de texto"
      >
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M12 3C7 3 3 7 3 12s4 9 9 9 9-4 9-9-4-9-9-9zm1 14h-2v-2h2v2zm0-4h-2V7h2v6z" />
        </svg>
      </button>

      <button
        className="acc-bar__btn"
        title="Versión para discapacidad visual"
        aria-label="Modo accesible para discapacidad visual"
      >
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M12 4.5C7 4.5 2.7 7.6 1 12c1.7 4.4 6 7.5 11 7.5s9.3-3.1 11-7.5C21.3 7.6 17 4.5 12 4.5zm0 12.5a5 5 0 1 1 0-10 5 5 0 0 1 0 10zm0-8a3 3 0 1 0 0 6 3 3 0 0 0 0-6z" />
        </svg>
      </button>
    </div>
  )
}
