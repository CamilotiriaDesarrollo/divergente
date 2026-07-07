<!--
  Copiar a: .github/pull_request_template.md (GitHub)
  o        .gitlab/merge_request_templates/mision.md (GitLab institucional)
  Un PR = una misión cerrable. No abrir PR sin misión asociada.
-->

## Misión
- **Fase · componente:** F#·C# — según blueprint §___
- **Ejecutor (constructor):** @${USUARIO_CONSTRUCTOR}
- **Revisor asignado (≠ constructor):** @${USUARIO_REVISOR}
  <!-- qa-ingeniero revisa toda entrega. + seguridad-appsec si toca auth, roles o datos personales (Regla 1) -->

## Qué entrega
<resumen de 2-3 líneas>

## DoD (copiado de la MISION.md)
- [ ] Criterio 1
- [ ] Criterio 2
- [ ] ...

## Checklist normativo (marcar lo que aplique)
- [ ] Sin ítems vinculantes pendientes de `cumplimiento-normativo` (veto de compuerta — Regla 4)
- [ ] Toca auth/roles/datos personales → co-revisado por `seguridad-appsec` (OWASP / Habeas Data)
- [ ] Línea gobierno: cumple estándar de codificación **M-GSI-002** y lineamientos **DI-GSI-010**
- [ ] Merge a producción (si aplica): coordinado por ITIL **M-GSI-003** (SDC F-GSI-037), fuera del congelamiento 15dic–15ene

## CI
- [ ] Pipeline en verde: lint + test + build (bloqueante por protección de rama)

## Scoreboard (Regla 5 — inviolable)
- [ ] El **REVISOR** agregó la fila en `metricas/scoreboard.csv` dentro de este mismo PR.
      Misión sin fila = misión NO cerrada.
