import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
// BASE de la pirámide: muchos, rápidos, aislados. Prueban lógica pura o un componente
// en aislamiento — sin red, sin BD, sin navegador real.

// (a) Test de lógica pura: lo más barato y estable. Prioriza esto.
import { calcularPuntaje } from '../src/dominio/puntaje'
describe('calcularPuntaje', () => {
  it('acota el resultado a 0..100', () => {
    expect(calcularPuntaje({ base: 200 })).toBe(100)
    expect(calcularPuntaje({ base: -5 })).toBe(0)
  })
})

// (b) Test de componente cliente con React Testing Library.
// AVISO React 19 / Next 16: RTL prueba componentes de CLIENTE. Los React Server
// Components (async, sin estado de cliente) NO se montan bien con RTL -> cúbrelos
// con tests de integración de la ruta o con E2E, no forzando RTL sobre un RSC.
import { Contador } from '../src/components/Contador'
describe('<Contador>', () => {
  it('incrementa al hacer clic', async () => {
    const user = userEvent.setup()
    render(<Contador inicial={0} />)
    await user.click(screen.getByRole('button', { name: /sumar/i }))
    expect(screen.getByText('1')).toBeInTheDocument()
  })
})
