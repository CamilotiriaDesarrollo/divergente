<!-- ORIGEN: 002 Desarrollos/DivergenteWEB/CLAUDE.md y DivergenteWEB/AGENTS.md.
     Patrón para frameworks posteriores al corte de conocimiento del modelo (aquí Next.js 16). -->

=== Contenido de CLAUDE.md (una sola línea que importa AGENTS.md) ===

@AGENTS.md


=== Contenido de AGENTS.md (advertencia anti-alucinación) ===

<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all
differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/`
before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->


=== Refuerzo en README.md (misma advertencia, repetida donde el humano la ve) ===

> ⚠️ Atención lectores que conozcan Next.js antiguo: este proyecto usa Next.js 16 con
> Turbopack y React 19. Algunas APIs y convenciones difieren de versiones anteriores.
> Ver AGENTS.md. Antes de modificar comportamiento de Next, consultar
> `node_modules/next/dist/docs/01-app/`.


=== Cómo adaptarlo ===

- Sustituye "Next.js" por el framework/librería post-cutoff que uses (Tailwind v4, React 19,
  .NET 10, etc.) y la ruta por su documentación local versionada dentro de node_modules/.
- `CLAUDE.md = @AGENTS.md` permite que Claude Code (CLAUDE.md) y otros agentes (AGENTS.md)
  compartan UNA sola fuente sin duplicar. Edita AGENTS.md; CLAUDE.md solo importa.
- La regla clave: apuntar al agente a la doc REAL instalada en el repo, no a su memoria.
