import { describe, it, expect } from 'vitest'
import request from 'supertest'
import { app } from '../src/app' // tu app Express EXPORTADA sin llamar a listen()
import OpenApiResponseValidator from 'openapi-response-validator'
import openapi from '../openapi/contrato.json' // el contrato de la skill back-openapi-contratos-versionado

// MEDIO de la pirámide: prueba la API real (ruta, status, forma del payload) y valida
// la respuesta CONTRA el contrato OpenAPI. Así el contrato deja de ser documentación
// muerta y se vuelve una prueba ejecutable: si el backend se desvía del contrato, falla.
//
// AVISO (N0): el validador de contrato es intercambiable. Alternativas: 'jest-openapi'
// (matcher toSatisfyApiSpec), Dredd, o Schemathesis (property-based, Python) para
// fuzzear el contrato. Elige uno por proyecto; la técnica es la misma.

const validator = new OpenApiResponseValidator({
  responses: (openapi as any).paths['/api/v1/ofertas'].get.responses,
  components: (openapi as any).components,
})

describe('GET /api/v1/ofertas', () => {
  it('responde 200 con la forma exacta del contrato', async () => {
    const res = await request(app).get('/api/v1/ofertas?departamento=${DEPARTAMENTO}')

    expect(res.status).toBe(200)
    // validateResponse devuelve `undefined` si cumple, o un objeto de errores si NO cumple.
    const error = validator.validateResponse(200, res.body)
    expect(error).toBeUndefined()
  })

  it('responde 400 ante parámetro inválido', async () => {
    const res = await request(app).get('/api/v1/ofertas?departamento=')
    expect(res.status).toBe(400)
  })
})
