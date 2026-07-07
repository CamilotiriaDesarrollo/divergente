# Threat model lite — SDL de Microsoft condensado a equipo pequeño (PLANTILLA)

> Sin verificar en proyecto propio. Adapta la fase de **diseño/threat-modeling** del Security Development Lifecycle de Microsoft a un equipo de 2-5 personas de Divergente.
> No es el SDL completo de 7 fases con gates formales: es la versión mínima que cabe en un feature con datos o autenticación. Hazlo en 30-60 min al diseñar, no al final.

## Cuándo hacerlo
Feature nueva que toque: autenticación, roles, datos personales, pagos, uploads, integraciones externas o un endpoint público. Si no toca nada de eso, sáltalo.

## Las 4 preguntas (STRIDE-lite)
1. **¿Qué estamos construyendo?** Dibuja el flujo de datos: quién manda qué a quién, dónde cruza un límite de confianza (browser → API, API → Postgres, API → tercero).
2. **¿Qué puede salir mal?** Recorre cada límite de confianza con STRIDE:
   - **S**poofing → ¿cómo autenticamos al que llama?
   - **T**ampering → ¿validamos/firmamos lo que llega?
   - **R**epudiation → ¿queda registro de la acción sensible?
   - **I**nformation disclosure → ¿exponemos más datos de los necesarios? (OWASP API3)
   - **D**enial of service → ¿hay rate limit / límite de payload?
   - **E**levation of privilege → ¿la autorización se verifica en el backend?
3. **¿Qué vamos a hacer al respecto?** Por cada amenaza plausible: mitigación concreta (un control del `checklist-asvs-l2.md`) o aceptación explícita del riesgo con dueño y fecha.
4. **¿Lo verificamos?** Cada mitigación queda como criterio de done probable (test o revisión).

## Tabla de trabajo (copiar por feature)

| Límite de confianza | Amenaza (STRIDE) | Impacto | Mitigación (control ASVS) | ¿Verificado? |
|---|---|---|---|---|
| browser → /api/... | Elevation (saltar UI) | acceso no autorizado | authz en backend, 403 | test con rol bajo |
| ... | ... | ... | ... | ... |

## SDL en clave equipo-pequeño (el resto de las fases, condensadas)
- **Training** → una lectura compartida del OWASP Top 10 vigente por trimestre; no curso formal.
- **Requirements** → elegir nivel ASVS (L1/L2/L3) al arrancar el producto.
- **Design** → esta tabla.
- **Implementation** → defaults seguros (`security-express.ts`), lint/typecheck, revisión con lente de seguridad en el PR (revisor ≠ constructor: lo mira `seguridad-appsec`).
- **Verification** → `ci-dependency-scan.yml` + tests de los criterios de done + (para L3 o antes de lanzar público) revisión/pentest ligero.
- **Release** → compuerta de deploy autoimpuesta (ver skill `div-devops-release-liviano-rollback`), no comité ITIL.
- **Response** → un plan mínimo de incidentes: cómo revocar sesiones/claves, a quién se avisa, dónde se registra. Escríbelo ANTES de necesitarlo.
