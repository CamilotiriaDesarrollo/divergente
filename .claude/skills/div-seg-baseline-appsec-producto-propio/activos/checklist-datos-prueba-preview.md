# Datos de prueba y aislamiento de entornos — Vercel + Postgres (plantilla N0)

> Reemplaza el bloque estatal de "protección de datos de prueba por terceros" (DI-GSI-010)
> por su equivalente para el stack privado: `Production` / `Preview` / `Development` de Vercel
> sobre Postgres gestionado (Neon / Supabase / Vercel Postgres).

## Regla de oro
**Ningún dump de producción va a `Preview` ni a `Development`.** Punto.

## Decisión rápida
¿Necesitas datos realistas para probar un dashboard/flujo?
- **Sí** → usa `datos-dataset-sintetico-ponderado` (dataset sintético) o un extracto **anonimizado**
  (correo/teléfono/documento enmascarados según `seg-habeas-data-implementacion`).
- **Solo estructura** → migra el esquema vacío y siembra con un seed script versionado.

## Checklist (pegar como DoD de tareas que muevan datos entre entornos)
- [ ] `Preview` y `Development` apuntan a **otra base de datos** (branch de datos de Neon/Supabase,
      o una BD de staging), **nunca** a la de producción.
- [ ] Las **environment variables de producción** (`DATABASE_URL`, claves de proveedor, secretos de firma)
      **no** están asignadas al scope `Preview`/`Development` en Vercel. Cada scope tiene sus propias credenciales.
- [ ] Los datos en `Preview`/dev son **sintéticos o anonimizados**; cero PII real.
- [ ] **Deployment Protection** activa: las URLs de `Preview` requieren autenticación (no son públicas ni indexables).
      Si un `Preview` debe compartirse, usar enlaces protegidos con expiración, no una URL abierta.
- [ ] Si hubo que anonimizar un extracto: proceso repetible y documentado; el dato sensible se ofusca
      **antes** de salir de producción, no en el cliente.
- [ ] El seed de datos de prueba está **versionado** en el repo y es idempotente (se puede recrear el entorno).
- [ ] Al cerrar una rama/PR: el branch de datos de `Preview` se destruye (no queda una copia colgando con datos).

## Notas por proveedor
- **Neon / Supabase branching:** cada branch es una BD lógica aislada; ideal para un `Preview` por PR sin tocar prod.
- **Vercel Postgres:** crea una instancia separada para staging; no compartas la connection string de prod.
- **RLS (Supabase):** viene apagado por defecto — si el `Preview` usa la clave anónima, habilita RLS igual que en prod
  para que la prueba sea representativa.
