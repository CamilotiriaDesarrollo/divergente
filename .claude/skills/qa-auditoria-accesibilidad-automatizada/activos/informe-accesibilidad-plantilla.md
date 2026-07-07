# Informe de Accesibilidad — ${PROYECTO}

**Norma aplicada:** NTC 5854 (homóloga WCAG 2.1) grado **AA**
**Marco legal / lineamiento:** DI-GSI-010 (Min. de las Culturas), Resolución 1519/2020,
Ley 1712/2014, Ley 1618/2013, Ley 1346/2009.
**Fase / compuerta:** F5 Endurecimiento → insumo de G5 (NO-GO duro).
**Fecha:** ${FECHA} · **Elabora:** `qa-ingeniero` · **Revisa:** `cumplimiento-normativo`

## 1. Alcance
Rutas/vistas auditadas: `${LISTA_DE_RUTAS}`.
Entornos: `${URL_PREVIEW}` (Vercel) / `${URL_INSTITUCIONAL}`.

## 2. Herramientas y versiones
| Herramienta | Versión | Cobertura |
|---|---|---|
| axe-core (@axe-core/playwright) | ${VER} | Reglas WCAG 2.1 A/AA a nivel página |
| Lighthouse CI (@lhci/cli) | ${VER} | Score de la categoría accessibility |
| pa11y-ci | ${VER} | Barrido de URLs (línea .NET/estática) |
| NVDA + Chrome | ${VER} | Verificación con lector de pantalla y teclado |

## 3. Resultados automatizados
| Ruta | Violaciones críticas/serias | Moderadas/menores | Score Lighthouse |
|---|---|---|---|
| ${RUTA} | 0 | ${N} | ${SCORE} |

Evidencia bruta adjunta: `reportes-a11y/axe-*.json`, `reportes-a11y/lighthouse/`, `reportes-a11y/pa11y.html`.

## 4. Resultados semi-manuales (lector de pantalla + teclado)
Resumen por ruta según `checklist-lector-pantalla-nvda.md`. Ítems fallidos y su estado.

## 5. Hallazgos y remediación
| ID | Criterio WCAG | Severidad | Estado | Misión de corrección |
|---|---|---|---|---|
| A-01 | 1.4.3 Contraste | serio | corregido | ${MISION} |

## 6. Dictamen
- [ ] 0 violaciones critical/serious en las rutas del MVP.
- [ ] Score Lighthouse accessibility ≥ 0.95 en todas las rutas.
- [ ] Checklist NVDA/teclado sin ítems bloqueantes abiertos.
- [ ] Hallazgos remediados con re-prueba adjunta.

**Conclusión:** ${GO | NO-GO} para la compuerta G5.
