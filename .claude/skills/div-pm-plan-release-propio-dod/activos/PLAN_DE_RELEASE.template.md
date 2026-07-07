# Plan de Release — <NOMBRE DEL PRODUCTO PROPIO>

> **Plantilla del régimen divergente** (producto propio de Divergente). No hay marco
> normativo estatal que citar: la fuente de verdad es este plan + el `blueprint` del
> producto. Reemplaza todos los `<placeholder>` y borra este blockquote.
> Stack de referencia: Node · Next.js · Vercel · Postgres gestionado.

## 0. Objetivo de negocio y criterio de éxito

- **Qué es y para quién:** <una frase — la propuesta de valor de marca propia>.
- **Métrica de éxito del release:** <p. ej. "100 signups en 2 semanas", "landing con CTA a WhatsApp en producción", "10 clientes usando el catálogo">.
- **Fecha objetivo (time-to-market):** <semana N> — *dura pero movible por el Dueño, no por un comité*.
- **Fuera de alcance de este release:** <lista explícita de lo que NO entra, para blindar el time-to-market>.

## 1. Definition of Done propio del release

Ver `DEFINITION_OF_DONE.template.md`. Resumen (marcar antes de cada GO):

- [ ] `lint` y `typecheck` en verde (build de Vercel no rompe).
- [ ] Tests de la ruta crítica pasan; `npm audit` sin vulnerabilidades altas sin mitigar.
- [ ] Preview deploy de Vercel aprobado visualmente por el Dueño.
- [ ] Presupuesto de performance/Lighthouse cumplido en móvil (LCP, CLS).
- [ ] Accesibilidad básica (foco visible, contraste, `lang`, imágenes con `alt`).
- [ ] Secretos SOLO en env vars de Vercel (Preview/Production); nada en el repo.
- [ ] Analítica de producto instrumentada (no lanzar a ciegas).

## 2. Hitos del release (ligero, no fases estatales)

Cada hito cierra con un **hito de salida verificable** = un preview deploy que cumple el
DoD, no una fecha. Ajusta el número de hitos al tamaño real del producto.

| Hito | Foco | Hito de salida (compuerta) |
|---|---|---|
| **H0** Fundamentos | Repo, CI mínimo (lint+build en cada PR), proyecto en Vercel, BD Postgres gestionada provisionada, `.env.example`, DoD acordado | *Un PR de prueba genera preview deploy verde automáticamente* |
| **H1** MVP navegable | Rutas/pantallas principales con datos estáticos tipados (patrón "backend durmiente"), identidad de marca aplicada | *El Dueño navega el preview end-to-end y aprueba el flujo* |
| **H2** Datos reales | Conexión a Postgres (pooler serverless), migraciones, seed, captura/lectura real | *El flujo crítico funciona contra la BD de Preview* |
| **H3** Pulido + lanzamiento | Performance, a11y, SEO/OG, analítica, dominio propio, promote to Production | *Producción en el dominio propio cumpliendo el DoD; GO del Dueño* |

Numerar cada paso `H.N` (0.1, 0.2, …). No hay pasos con "etiqueta normativa": el
producto propio se rige por su DoD, no por códigos citables de una entidad.

## 3. Dependencias externas y su lead-time REAL

El lead-time divergente NO es capacidad de cómputo de un datacenter estatal (meses); es
esto, y casi todo es de minutos a días — salvo el **contenido/assets del Dueño**:

| Dependencia | Lead-time real | Cuándo pedirla |
|---|---|---|
| Cuenta/proyecto en Vercel | minutos | H0 |
| BD Postgres gestionada (Neon/Supabase/Vercel Postgres) | minutos (provisioning) — pero migraciones + seed toman más | H0 |
| Dominio propio + DNS | horas–días (propagación) | inicio de H3 |
| Claves de API de terceros (WhatsApp, pagos, mapas…) | horas–días (verificación de cuenta) | cuando el hito las use |
| **Copys, imágenes y decisiones de marca del Dueño** | **el cuello de botella real** — días | pedir en H0, no en H3 |

## 4. Prácticas transversales con cadencia

| Práctica | Cadencia |
|---|---|
| Preview deploy por PR (revisión visual) | por PR |
| Demo corta al Dueño | por hito (o semanal) |
| Revisión de analítica de producto | semanal tras lanzar |
| `npm audit` / actualización de dependencias | semanal en CI |
| Actualización del `CLAUDE.md`/README del producto | por PR relevante |

## 5. Calendario y compuertas GO/NO-GO (las decide el Dueño)

```
Semana:      1    2    3    4    5    6
H0 Fund.   ████
H1 MVP          ████████
H2 Datos                  ██████
H3 Lanz.                        ████
```

**Puntos de decisión (compuertas ligeras — sin comité, sin acta formal):**

1. **GO/NO-GO #1 — fin de H1 (¿el MVP merece invertir en datos reales?).** El Dueño mira el preview del MVP y decide seguir, pivotar o cortar alcance.
2. **GO/NO-GO #2 — fin de H3 (promote to Production).** El Dueño verifica el DoD completo sobre el preview y da el GO para promover a producción en el dominio propio. Es el único "go-live" y lo aprieta el Dueño, no un CCC.

*Compuerta ligera ≠ compuerta ausente: sin un GO explícito del Dueño no se promueve a
producción.*

## 6. Riesgos con mitigación

Formato `enunciado → consecuencia → **Mitigación:**` con puntero al paso que lo cubre.

1. **Scope creep sin hito de corte** → el time-to-market se dilata indefinidamente. **Mitigación:** "Fuera de alcance" del §0 + GO/NO-GO #1 como punto de corte.
2. **Assets/copys del Dueño llegan tarde** → H3 se bloquea con el producto técnicamente listo. **Mitigación:** pedirlos en H0 (§3), usar placeholders marcados mientras tanto.
3. **Conexiones a Postgres agotadas en funciones serverless** → errores intermitentes en producción. **Mitigación:** usar el connection pooler (pooled connection string) desde H2.
4. **Preview verde confundido con producción lista** → se promueve algo que no corre con las env/BD reales. **Mitigación:** DoD exige verificar contra env de Production antes del GO #2.
5. **Lanzar sin analítica** → no se sabe si el producto se usa; se apaga solo. **Mitigación:** instrumentar analítica en el DoD (H3).

## 7. Revisión cruzada (regla inviolable #1 de la fábrica)

- **`qa-ingeniero`** revisa el release antes del GO #2 (revisor ≠ constructor, aplica a TODA entrega, también divergente).
- **`seguridad-appsec`** revisa además si el release toca autenticación, roles o datos personales (Habeas Data / Ley 1581 obliga también a privados).
- *No hay veto de `cumplimiento-normativo` ni acta de compuerta estatal en este régimen: el Dueño cierra la compuerta directamente.*
