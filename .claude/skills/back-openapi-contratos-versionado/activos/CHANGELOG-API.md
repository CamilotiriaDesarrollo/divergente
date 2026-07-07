# Changelog de la API — ${PROYECTO}

La API se versiona con **SemVer**. Un cambio **incompatible** (quitar/renombrar campo o
endpoint, endurecer validacion, cambiar tipo/semantica) obliga a subir la **MAYOR** y publicar
una nueva ruta `/api/v{n}`. Cambios retrocompatibles suben MENOR (nuevo endpoint/campo opcional)
o PATCH (correccion sin cambio de forma).

## Politica de deprecacion
- Un endpoint o version deprecada responde con la cabecera `Deprecation` (RFC 9745; su valor
  final es un structured-field de tipo fecha `@<epoch>`, no el booleano de los borradores) y
  `Sunset: <fecha-http>` (RFC 8594) en cada respuesta.
- Ventana minima de convivencia entre `v(n)` y `v(n+1)`: **90 dias** (o lo que fije el contrato
  con la entidad; nunca menor a lo pactado en el pliego).
- **Todo cambio de version es un CAMBIO ITIL** (M-GSI-003 / ver skill
  devops-gestion-cambios-itil-gobierno): SDC F-GSI-037, comite del jueves, plan de rollback,
  y jamas dentro del congelamiento 15dic-15ene.

## [1.1.0] - PENDIENTE
### Added
### Changed
### Deprecated

## [1.0.0] - ${FECHA}
### Added
- Contrato inicial firmado (compuerta G3): `GET /api/v1/sistemas`, `GET /api/v1/sistemas/{id}`.
