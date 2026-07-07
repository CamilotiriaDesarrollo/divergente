# Definition of Done — Release de producto propio (Divergente)

> **Plantilla del régimen divergente.** Este DoD REEMPLAZA los checklists normativos
> codificados (C1–C18, L1–L14, A1–A10…) del plan institucional: aquí no hay entidad que
> exija códigos citables, hay un estándar de calidad propio de la marca. Adáptalo por
> producto y bórralo del release cuando cada casilla esté marcada.

Un incremento (un PR, un hito o el release completo) está **Done** cuando:

## Código y build
- [ ] `lint` (ESLint 9) sin errores y `typecheck`/`tsc` en verde — el build de Vercel no rompe.
- [ ] El build de producción (`next build` / `vite build`) pasa localmente antes del push.
- [ ] Sin `console.log` de depuración ni código muerto en la ruta tocada.

## Pruebas y seguridad
- [ ] Tests de la ruta crítica pasan (unit/integración según la pirámide de testing).
- [ ] `npm audit` sin vulnerabilidades **altas/críticas** sin mitigar (o mitigación documentada).
- [ ] Secretos SOLO en env vars de Vercel (Preview y Production separadas); `.env` local en `.gitignore`; solo `.env.example` versionado.
- [ ] Si toca auth/roles/datos personales: revisado por `seguridad-appsec` (Habeas Data).

## Producto y UX
- [ ] Preview deploy de Vercel generado por el PR y **aprobado visualmente por el Dueño**.
- [ ] Performance en móvil dentro del presupuesto (Lighthouse: LCP, CLS, TBT aceptables).
- [ ] Accesibilidad básica: foco visible, contraste AA, `lang` correcto, `alt` en imágenes, navegación por teclado.
- [ ] SEO técnico donde aplique: `<title>`/meta, Open Graph, `sitemap`/`robots` para páginas públicas.
- [ ] Estados de carga, vacío y error contemplados (no solo el "happy path").

## Datos (si el hito toca Postgres)
- [ ] Migraciones versionadas aplicadas; connection pooler (pooled connection) en funciones serverless.
- [ ] Seed/datos de ejemplo reproducibles; nada de datos personales reales en Preview.

## Lanzamiento
- [ ] Analítica de producto instrumentada (eventos clave del funnel).
- [ ] Dominio propio + DNS configurados (para el GO a Production).
- [ ] `qa-ingeniero` revisó el incremento (revisor ≠ constructor).
- [ ] GO explícito del Dueño registrado antes de promover a Production.
