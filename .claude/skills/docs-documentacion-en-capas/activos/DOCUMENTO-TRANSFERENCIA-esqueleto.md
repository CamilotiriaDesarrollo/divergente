# <Proyecto> — Contexto Completo

> **Documento único de transferencia.** Todo lo que necesitas saber del proyecto en un solo lugar.
> Última actualización: AAAA-MM-DD · <autor> · <organización>

Si abres este documento en un computador nuevo, tenlo como referencia maestra junto con `PLAN.md`.
Para migración entre equipos ver `MIGRACION.md`.

<!--
Esqueleto derivado de Scraper-Empleos/CONTEXTO_COMPLETO.md (portafolio del Dueño).
Es la CUARTA capa de la documentación en capas: el documento de transferencia total,
pensado para que una persona o un agente IA retome el proyecto en frío, en otra máquina
o en una sesión nueva. Rellena cada sección; borra las que no apliquen.
NO incluir aquí secretos, .env ni credenciales reales: van en gestor de secretos.
-->

---

## Tabla de contenidos
1. Qué es este proyecto en una página
2. Estado actual (fecha)
3. Arquitectura técnica (con diagrama de flujo ASCII)
4. Decisiones de diseño y por qué (lista numerada de decisión → justificación)
5. Modelo de datos
6. Inventario de archivos (árbol anotado)
7. Comandos esenciales
8. Pendientes y roadmap (checkboxes por fase)
9. No tocar (zonas frágiles / sistemas en producción independientes)
10. Glosario
11. Para una nueva sesión

---

## 1. Qué es este proyecto en una página
<Descripción en un párrafo + tabla de perfiles/destinos/módulos. Filosofía operativa en bullets.>

## 2. Estado actual (AAAA-MM-DD)
<Completado / Pendiente del usuario / Próximos pasos, con evidencia verificable (no aspiracional).>

## 3. Arquitectura técnica
```
<diagrama de flujo ASCII de fuentes → procesamiento → salidas>
```
| Componente | Tecnología |
|---|---|
| ... | ... |

## 4. Decisiones de diseño y por qué
1. **<Decisión>** — <por qué se tomó, qué alternativa se descartó y a qué costo>.
2. ...

## 5. Modelo de datos
<Tablas/entidades con su origen y función. Puntero al detalle en PLAN.md o docs/tecnico/.>

## 6. Inventario de archivos
```
proyecto/
├── PLAN.md                 ← plan maestro consultable
├── CONTEXTO_COMPLETO.md    ← (este archivo)
├── CLAUDE.md               ← contexto conciso para el agente IA
└── ...
```

## 7. Comandos esenciales
```bash
# instalar, validar config, correr pipeline, tests...
```

## 8. Pendientes y roadmap
- [ ] Inmediatos (no requieren código)
- [ ] Fase N — <trabajo>

## 9. No tocar
<Sistemas en producción independientes, credenciales separadas, zonas frágiles. Explicar el porqué.>

## 10. Glosario
| Término | Significado |
|---|---|
| ... | ... |

## 11. Para una nueva sesión
Si abres este proyecto en otro computador o en una nueva sesión:
1. Abre el agente IA en la raíz del proyecto.
2. Leerá automáticamente `CLAUDE.md` y `PLAN.md`.
3. Para contexto profundo: pídele que lea este `CONTEXTO_COMPLETO.md`.
4. Sigue donde quedaste según "Pendientes y roadmap".

**Comando útil:**
> "Lee CONTEXTO_COMPLETO.md y dime en qué fase quedamos y cuál es el próximo paso recomendado."
