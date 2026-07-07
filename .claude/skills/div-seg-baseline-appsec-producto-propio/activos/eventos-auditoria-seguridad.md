# Eventos de auditoría de seguridad — SaaS multi-tenant (plantilla N0)

> Toma el núcleo reutilizable de la hermana ("registrar solo eventos relevantes, en esquema
> separado, con campos mínimos y hash") y lo moderniza para un SaaS: log estructurado JSON,
> multi-tenant, sin los "8 campos DI-GSI-010" del Estado. Adapta a tu servicio de logs.

## Principio
Registra **lo que importa para investigar un incidente**, no cada request. Un log inundado
degrada el rendimiento y esconde lo relevante. Y **nunca** metas PII completa, tokens ni
contraseñas: el log no es una segunda base de datos personales.

## Eventos que SÍ se registran
- `auth.login.success` / `auth.login.failure`
- `auth.mfa.challenge` / `auth.mfa.success` / `auth.mfa.failure`
- `auth.logout`, `auth.password.change`, `auth.password.reset`
- `authz.role.change`, `authz.permission.denied`
- `admin.data.access` (acceso administrativo a datos personales)
- `data.export`, `data.bulk_delete`
- `secret.rotated`, `apikey.created` / `apikey.revoked`
- `account.created`, `account.suspended`

## Campos mínimos por evento (JSON)
```json
{
  "ts": "2026-07-04T15:04:05.000Z",   // timestamp UTC ISO-8601
  "event": "auth.login.failure",       // tipo (enum de arriba)
  "actor_id": "usr_123",               // quién (id interno, NO el email)
  "tenant_id": "org_456",              // aislamiento multi-tenant
  "resource": "user:usr_789",          // sobre qué recurso
  "ip": "203.0.113.4",                 // IP origen
  "ua": "Mozilla/5.0 ...",             // user-agent (opcional)
  "result": "denied",                  // success | denied | error
  "meta": { "reason": "bad_password" },// contexto SIN PII ni secretos
  "prev_hash": "9f2b...",              // encadenamiento (evidencia de no-alteración)
  "hash": "a17c..."                    // sha256(canonical(evento sin hash) + prev_hash)
}
```

## Reglas
1. **Sin PII ni secretos en `meta`.** Referencia por id (`actor_id`, `resource`), no por email/teléfono/documento
   ni por el body del request. Nunca el password, el JWT ni la API key.
2. **Esquema/almacén separado** de los datos de negocio (tabla `security_audit_log` propia,
   o un servicio de logs). Solo-append; sin `UPDATE`/`DELETE` desde la app.
3. **Encadenamiento por hash** (`prev_hash` → `hash`) para evidencia de no-alteración; opcional pero barato.
4. **Retención** definida (`<180 días>` en caliente, luego archivar/anonimizar); documentar el plazo.
5. **Alertas** sobre patrones: picos de `auth.login.failure`, `authz.permission.denied` en ráfaga,
   `data.export` fuera de horario.
6. La correlación con **datos personales** de los titulares (derechos ARCO, evidencia de consentimiento)
   NO se hace aquí: eso vive en `seg-habeas-data-implementacion`.

## DoD
- [ ] Solo se registran los eventos de la lista (no todo el tráfico).
- [ ] Ningún registro contiene contraseña, token, API key ni PII completa.
- [ ] El log es solo-append, en almacén separado, con retención documentada.
- [ ] Existen alertas para al menos: fallos de login masivos y accesos denegados en ráfaga.
