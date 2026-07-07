# Checklist e insumos de decisión — SSO / OIDC / LDAP

> Insumo de la skill `seg-implementacion-sso-ldap-oidc` (N0). Úsalo como plantilla de la sección
> de identidad del blueprint y como Definition-of-Done de seguridad de la funcionalidad de login.
> Ata cada ítem al requisito normativo: **DI-GSI-010 §6 / L4 / L6** y **M-GSI-002** (sesión/cifrado).

## A. Decisiones abiertas a cerrar con la OTI / el Dueño (Fase 1, blueprint)
Ninguna se decide por defecto — van a la tabla de decisiones abiertas.

| # | Decisión | Opciones | Recomendación por defecto |
|---|---|---|---|
| D1 | Proveedor de identidad | Entra ID (Azure AD) · Active Directory on-prem (LDAP) · ambos | **OIDC/Entra ID** si la OTI lo tiene; LDAP solo si no hay Entra |
| D2 | Tenant | single-tenant · multi-tenant | **single-tenant** (solo el directorio del Ministerio) |
| D3 | Modelo de permisos | App roles · grupos de seguridad · claims a medida | **App roles** (evita el problema de "groups overage", ver gotchas) |
| D4 | Credencial de la app en prod | client secret · certificado · Managed Identity / federated credential | **Managed Identity o certificado** (nunca secret en prod) |
| D5 | Break-glass / usuario local | sí · no | **sí**: 1 admin local de emergencia si el IdP cae (con MFA y auditado) |
| D6 | ¿Portal público o sistema interno? | portal (Newtenberg, DI-GSI-010 §15) · sistema de información | Confirmar clasificación con la OTI; SSO aplica a usuarios internos |

## B. Registro de la aplicación en Entra ID (una vez, con la OTI)
- [ ] App registration creada en el tenant del Ministerio (single-tenant).
- [ ] **Redirect URIs** registradas EXACTAS (coincidencia literal, https salvo `localhost`): `…/signin-oidc`.
- [ ] **Front-channel logout / post-logout redirect URI**: `…/signout-callback-oidc`.
- [ ] ID tokens habilitados (implicit solo si aplica; preferir Authorization Code + PKCE).
- [ ] **App roles** definidos (p.ej. `Administrador`, `Editor`) y asignados a usuarios/grupos.
- [ ] Credencial de prod = **certificado o Managed Identity**; recordatorio de expiración si es secret.
- [ ] "Token configuration": incluir el claim `roles` (y `email`/`preferred_username`).

## C. Implementación (Fase 3/4) — DoD verificable
- [ ] Flujo **Authorization Code + PKCE** (no implicit, no ROPC/password grant).
- [ ] Token **validado en el backend**: firma vía JWKS, `iss`, `aud`, `exp`, `nbf` (con clock skew ≤ 5 min).
- [ ] La **autorización vive en el backend**: un endpoint protegido responde **403** aunque la UI muestre el botón (probado saltándose el frontend).
- [ ] App roles de Entra (o grupos AD) **mapeados al RBAC** de la app; usuario sin rol → 403.
- [ ] **Timeout de inactividad ≤ 15 min** a nivel de app (M-GSI-002), independiente de la vida del token.
- [ ] **HTTPS/TLS** forzado en toda la app; cookies `HttpOnly`+`Secure`+`SameSite`.
- [ ] Si es LDAP: **LDAPS (636) o StartTLS** obligatorio; filtro de usuario **escapado** (RFC 4515); sin bind anónimo/clave vacía.
- [ ] **Sin secretos en el repo**: client secret/cert en Key Vault (skill `seg-gestion-secretos-keyvault`).
- [ ] **Logout** limpia sesión local y hace RP-initiated logout al IdP.
- [ ] **Auditoría de login** (éxito y fallo) con fecha/hora, **IP origen**, usuario y **hash** del evento (DI-GSI-010 §7), en esquema separado.
- [ ] Mensaje de error de login **único** (no revela si el usuario existe ni qué campo falló).

## D. Trazabilidad normativa
- **DI-GSI-010 §6 / L4** — "Inicio de sesión único con LDAP (Directorio Activo de Windows o Azure AD)".
- **DI-GSI-010 §6 / L6** — TLS/SSL en todo intercambio; contraseñas cifradas en BD y config.
- **DI-GSI-010 §7 / L5** — auditoría con IP origen + hash por evento (incluye eventos de login).
- **M-GSI-002 §3** — timeout de sesión ≤ 15 min, bloqueo al 5º intento (si hay fallback local), no reutilización de credenciales.
