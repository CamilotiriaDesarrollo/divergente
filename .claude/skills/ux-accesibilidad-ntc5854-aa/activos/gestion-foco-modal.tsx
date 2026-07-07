/* Patrón de gestión de foco en panel/modal accesible — NTC 5854 AA
 * Origen VERIFICADO: Portal ISI / client/src/components/ConstelacionSistemas.tsx
 *                    (líneas 57-113 y 193-215).
 *
 * Resuelve los 4 requisitos de foco de un diálogo:
 *   1. Guardar el elemento que tenía el foco al abrir (focoPrevio).
 *   2. Mover el foco al botón "Cerrar" cuando el panel aparece.
 *   3. Cerrar con Escape.
 *   4. Devolver el foco al origen al cerrar (evita que el usuario de teclado
 *      quede "perdido" al final del DOM).
 *
 * Adaptar: cambia SistemaOperativo por tu tipo de dato y el marcado del panel.
 * El role="dialog" + aria-label es obligatorio; el botón de cierre lleva
 * aria-label textual porque su contenido es un SVG decorativo (aria-hidden).
 */
import { useState, useRef, useEffect, useCallback } from 'react'

export function usePanelFoco<T>() {
  const [seleccion, setSeleccion] = useState<T | null>(null)
  const focoPrevio = useRef<HTMLButtonElement | null>(null)
  const cerrarRef = useRef<HTMLButtonElement | null>(null)

  // Al abrir: recordamos qué botón lanzó el panel.
  const abrir = useCallback((s: T, el: HTMLButtonElement) => {
    focoPrevio.current = el
    setSeleccion(s)
  }, [])

  // Al cerrar: devolvemos el foco a ese botón.
  const cerrar = useCallback(() => {
    setSeleccion(null)
    focoPrevio.current?.focus()
  }, [])

  // Con el panel abierto: foco al botón cerrar + Escape para salir.
  useEffect(() => {
    if (!seleccion) return
    cerrarRef.current?.focus()
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') cerrar()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [seleccion, cerrar])

  return { seleccion, abrir, cerrar, cerrarRef }
}

/* Marcado del panel (extracto real):
 *
 * {seleccion && (
 *   <div className="panel" role="dialog" aria-label={`Detalle de ${seleccion.nombre}`}>
 *     <button
 *       type="button"
 *       className="panel__cerrar"
 *       onClick={cerrar}
 *       aria-label="Cerrar detalle"
 *       ref={cerrarRef}
 *     >
 *       <svg aria-hidden="true"><path d="M6 6l12 12M18 6 6 18" /></svg>
 *     </button>
 *     ...
 *   </div>
 * )}
 *
 * Y el disparador (cada nodo es un <button>, NO un <div> con onClick):
 *   <button aria-label={`${n.nombre}. ${label}.`} aria-pressed={sel}
 *           onClick={e => abrir(n, e.currentTarget)}>
 */
