# Checklist operativo OWASP ASVS L2 — producto Divergente (PLANTILLA)

> Sin verificar en proyecto propio. Subconjunto accionable de **OWASP ASVS v4** apuntando a **Nivel L2** (default de Divergente para productos con cuentas de usuario y/o datos personales).
> Reemplaza el checklist estatal A1–A10 (M-GSI-002) / L1–L14 (DI-GSI-010): aquí **no hay recepción por una entidad** — este checklist ES el Definition-of-Done de seguridad que Divergente se autoimpone.

## Elección de nivel (hazlo primero)
- [ ] **L1** — app de bajo riesgo, sin cuentas ni datos personales (landing, catálogo público). Verificación mayormente automatizada.
- [ ] **L2 (default)** — hay login, roles o datos personales. Este checklist.
- [ ] **L3** — app crítica (pagos, salud, PII a escala). Añade revisión manual profunda + pentest externo.

## V2 Autenticación
- [ ] Política de contraseñas según `politica-password-sesion.md` (longitud ≥12, sin composición forzada, sin rotación forzada, bloqueo de contraseñas filtradas).
- [ ] Hash con argon2id o bcrypt cost ≥12; jamás en claro ni reversible.
- [ ] Sin credenciales sembradas/por defecto activas en ningún ambiente compartido.
- [ ] Mensajes de login que no permiten enumerar usuarios (mismo mensaje/tiempo).
- [ ] MFA disponible para roles admin / datos sensibles.

## V3 Sesión
- [ ] Cookies `HttpOnly` + `Secure` + `SameSite`; ID de sesión rotado tras login.
- [ ] Logout invalida la sesión en el servidor (no solo borra cookie).
- [ ] Idle + absolute timeout definidos y probados.

## V4 Control de acceso (autorización)
- [ ] Deny-by-default: todo endpoint exige autorización explícita.
- [ ] La autorización se verifica **en el backend** (403 aunque la UI lo permita).
- [ ] Confinamiento multi-tenant: un usuario no puede leer/escribir datos de otro tenant (probado con 2 cuentas).
- [ ] No se confía en identificadores (userId, tenantId, role) enviados por el cliente.

## V5 Validación, sanitización y codificación
- [ ] Validación de entrada por esquema (p.ej. zod) en cada endpoint que recibe body/params.
- [ ] Queries parametrizadas / ORM — cero SQL por concatenación (anti-inyección).
- [ ] Salida codificada según contexto (React escapa por defecto; cuidado con `dangerouslySetInnerHTML`).

## V7 Manejo de errores y logging
- [ ] Errores de producción sin stack trace ni detalle técnico (NODE_ENV gate).
- [ ] Logs de eventos de seguridad (login ok/fallido, cambios de rol) sin datos sensibles (nada de contraseñas/tokens en claro).

## V8 Protección de datos (minimización)
- [ ] Respuestas de API con proyección explícita: no devolver la fila completa del usuario (OWASP API3 "excessive data exposure").
- [ ] DTO público vs. DTO administrativo cuando haya PII (correo/teléfono/documento) — el público no la incluye.
- [ ] Nota: como empresa colombiana, Divergente sigue sujeta a la Ley 1581/2012 (habeas data); ver skill `seg-habeas-data-implementacion` para el tratamiento formal.

## V9 Comunicaciones
- [ ] HTTPS extremo a extremo (Vercel lo da; verificar el tramo app↔Postgres con TLS).
- [ ] HSTS activo.

## V12 Archivos y recursos
- [ ] Upload valida MIME real por magic numbers (no solo la extensión), nombre aleatorio, storage aislado, tamaño limitado.

## V14 Configuración
- [ ] Dependencias sin vulnerabilidades críticas/altas sin plan (ver `ci-dependency-scan.yml`).
- [ ] Secretos fuera del repo (variables de Vercel / gestor de secretos); nada de `NEXT_PUBLIC_` para secretos.
- [ ] La app se conecta a Postgres con rol de mínimo privilegio, nunca el owner/superusuario.
- [ ] Ambientes dev/preview/prod separados, con bases de datos separadas.
