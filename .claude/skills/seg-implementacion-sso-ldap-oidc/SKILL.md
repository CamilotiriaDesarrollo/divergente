---
name: seg-implementacion-sso-ldap-oidc
regimen: universal
description: Implementa inicio de sesión único (SSO) e identidad federada — OIDC/OAuth2 contra Microsoft Entra ID (Azure AD) y autenticación LDAP contra Active Directory —, con flujo Authorization Code + PKCE, validación de token en el backend, mapeo de App roles/grupos al RBAC, timeout de sesión ≤15 min y auditoría de login. Cárgala cuando una historia pida "login corporativo", "SSO", "iniciar sesión con Microsoft/Entra/Active Directory", integrar OAuth2/OIDC, cumplir DI-GSI-010 §6/L4 (SSO LDAP/Azure AD), o reemplazar cookie-auth por identidad federada. Aplica al stack .NET (línea gobierno) y al stack Next.js/React+Vite/Express (línea privada).
---

> **Régimen: universal.** Las referencias a normativa estatal (M-GSI-002, DI-GSI-010, ITIL, GOV.CO, «entidad pública») aplican SOLO en proyectos `institucional`; en un proyecto `divergente` ignóralas y usa la variante de la línea privada (Vercel/Node/Postgres). El SSO/OIDC federado en sí (Authorization Code + PKCE, validación de token en backend, timeout de sesión, auditoría de login) es buena práctica técnica en ambos regímenes; lo que se condiciona a `institucional` es la *obligación* normativa y las citas de artículos.

# Implementación de SSO: LDAP / Entra ID (Azure AD) / OAuth2-OIDC

**Nivel actual:** N0 · **Dominio:** seg · **Agente(s):** `seguridad-appsec` (dueño), en pareja con `back-dotnet-gobierno` (.NET) o `back-node-api` (Express/Next.js)
**Proyectos fuente:** ninguno — creada desde buenas prácticas (VACÍO del portafolio).

> Criterio de ascenso a N1: los 5 bloques completos, con activos copiables de ruta real y gotchas verificados (no genéricos). A N2: ≥1 uso real aceptado por el Dueño. A N3: ≥3 usos exitosos en ≥2 proyectos + checklist propio.

## 1. Propósito

SSO con LDAP/Azure AD y OAuth2/OIDC **aparece en todos los roadmaps del portafolio pero nunca se ha construido**: lo único implementado a la fecha es cookie-auth propia en el PNMC. No es un adorno: **DI-GSI-010 §6 lo hace contractualmente exigible** ("Inicio de sesión único con LDAP — Directorio Activo de Windows o Azure AD") y lo repite el checklist L4 ("Implementar SSO con Azure AD/Entra ID para los usuarios administrativos internos"). Sin SSO federado la entrega a un Ministerio puede rechazarse formalmente en recepción **(solo si el proyecto es institucional; en un proyecto divergente el SSO es una decisión de producto, no una exigencia contractual)**.

Esta skill traduce las buenas prácticas actuales de OIDC/LDAP a un procedimiento accionable para **los dos mundos del Dueño**: la línea de gobierno (.NET/SQL Server bajo M-GSI-002/DI-GSI-010) y la línea privada (Next.js 16/React 19, o client/server React+Vite/Express en Vercel). Se carga al diseñar o construir cualquier autenticación federada, y siempre en pareja con el backend del stack (regla de la fábrica: `seguridad-appsec` co-implementa todo lo que toque login/roles).

Es una skill **N0 honesta**: los pasos y activos son un punto de partida correcto y verificado contra la documentación vigente, pero **aún no se han ejercitado en un proyecto propio**. Asciende a N1/N2 con el primer uso real.

## 2. Procedimiento

### Paso 0 — Cerrar decisiones antes de codificar
SSO toca infraestructura ajena (el directorio de la OTI). Lleva a la tabla de decisiones abiertas del blueprint las decisiones D1–D6 de `activos/checklist_sso_oidc.md`: proveedor (Entra ID vs LDAP on-prem), tenant (single vs multi), modelo de permisos (App roles vs grupos), credencial de producción, usuario break-glass, y clasificación portal/sistema (DI-GSI-010 §15, evita colisión con Newtenberg). **No inventes el IdP**: lo confirma la OTI/el Dueño.

### Paso 1 — Elegir el sabor
- **OIDC contra Entra ID (Azure AD)** — preferido siempre que la OTI tenga Entra/Microsoft 365. Es el camino que pide DI-GSI-010 L4.
- **LDAP contra Active Directory on-prem** — solo si no hay Entra. DI-GSI-010 §6 lo acepta explícitamente ("LDAP o Azure AD").
- **OAuth2/OIDC genérico** (Google, Keycloak) — para la línea privada no estatal cuando el cliente lo pida.
Usa siempre **Authorization Code Flow + PKCE**. Nunca implicit flow ni ROPC/password grant.

### Paso 2 — Registrar la app (una vez, con la OTI para gobierno)
En https://entra.microsoft.com → App registrations: crea la app **single-tenant**, registra los **Redirect URIs EXACTOS** (`…/signin-oidc`) y el post-logout (`…/signout-callback-oidc`), define **App roles** (`Administrador`, `Editor`…) y añade el claim `roles` en Token configuration. Credencial de producción: **certificado o Managed Identity**, no client secret (ver gotchas). Checklist B de `activos/checklist_sso_oidc.md`.

### Paso 3 — Stack .NET (línea gobierno)
Paquete `Microsoft.Identity.Web` (verificado contra 3.x; .NET 8/9/10). Copia `activos/dotnet/appsettings.EntraID.json` y `activos/dotnet/Program.EntraID.cs`:
- App **web** que loguea al usuario → `AddMicrosoftIdentityWebApp`. API que solo **valida** tokens de un SPA → `AddMicrosoftIdentityWebApi` (valida firma JWKS + `iss` + `aud`).
- **La autorización vive en el backend**: `RequireRole`/policies; el 403 lo decide el servidor aunque la UI muestre el botón.
- **Sesión ≤15 min de inactividad** vía cookie (`ExpireTimeSpan` + `SlidingExpiration`), **independiente** de la vida del token de Entra (que puede durar 1 h). Cookie `HttpOnly`+`Secure`+`SameSite`.
- Si es LDAP: copia `activos/dotnet/LdapAuthenticationService.cs` (`System.DirectoryServices.Protocols`, patrón search+bind sobre **LDAPS**, con filtro escapado).

### Paso 4 — Stack Next.js / Express (línea privada)
- **Next.js 16/React 19**: `next-auth@5` (Auth.js v5), provider `microsoft-entra-id` (reemplazó a `azure-ad`). Copia `activos/node/auth.entra.ts`; expón los handlers en `app/api/auth/[...nextauth]/route.ts`. Sesión `maxAge: 15*60`.
- **Express + React/Vite**: `openid-client` **v6** (API funcional, distinta de v5). Copia `activos/node/oidc-express.ts` (code+PKCE, verifier/state en sesión de servidor, no en la cookie del cliente).
- En ambos, el mapeo de roles del cliente es solo para UI: **el permiso real se re-verifica en el route handler/backend** (403).

### Paso 5 — Endurecer y auditar (ata a normativa)
TLS/HTTPS en todo (DI-GSI-010 §6). **Audita cada evento de login (éxito y fallo)** con fecha/hora, **IP origen**, usuario y **hash** del evento en esquema separado (DI-GSI-010 §7 / L5 — **la cita normativa aplica solo si el proyecto es institucional; la auditoría de login sigue siendo buena práctica en divergente, sin el amarre a DI-GSI-010**) — reutiliza el `RequestContextMiddleware`/patrón de la skill `seg-desarrollo-seguro-sdl-owasp-gobierno`. Mensaje de error de login **único** (no revela si el usuario existe). Logout que limpia sesión local **y** hace RP-initiated logout al IdP. Secretos vía Key Vault (skill `seg-gestion-secretos-keyvault`). Revisor: `qa-ingeniero` + tú mismo como `seguridad-appsec` (veto en compuerta).

### Paso 6 — Verificar frescura antes de usar (regla 8 de la fábrica)
Antes de copiar los activos, confirma las versiones vigentes de `Microsoft.Identity.Web`, `next-auth` y `openid-client`: las tres han tenido cambios de API de versión mayor y esta skill es post-cutoff de referencia. Fija la versión exacta en el manifiesto del proyecto y anota cualquier desviación.

## 3. Activos copiables

Todos en `activos/` de esta skill. **Sin secretos**, con placeholders `${VAR}`. Índice completo en `activos/README.md`.

- **`activos/.env.example`** — variables OIDC (Entra) + LDAP con placeholders. Copia a `.env` local (valores reales en Key Vault). Adapta host, tenant y DN del directorio.
- **`activos/checklist_sso_oidc.md`** — decisiones abiertas D1–D6 + registro de app (B) + DoD normativo (C) + trazabilidad (D). Cópialo como sección de identidad del blueprint y como Definition-of-Done de la funcionalidad de login.
- **`activos/dotnet/appsettings.EntraID.json`** + **`activos/dotnet/Program.EntraID.cs`** — arranque OIDC .NET con RBAC por App roles y sesión de 15 min. Adapta nombres de roles/policies y rutas.
- **`activos/dotnet/LdapAuthenticationService.cs`** — autenticación LDAPS contra AD (search+bind, escape RFC 4515, sin bind anónimo). Adapta BaseDN, filtro y atributos.
- **`activos/node/auth.entra.ts`** — Auth.js v5 para Next.js con provider Entra ID y mapeo de roles.
- **`activos/node/oidc-express.ts`** — openid-client v6 en Express: code+PKCE, sesión segura, middleware `requireRole` que devuelve 403 real.

## 4. Gotchas verificados

> **Todos marcados "sin verificar aún en proyecto propio (N0)"** — son riesgos documentados de la práctica, no cicatrices de una entrega del Dueño. Se confirmarán o corregirán con el primer uso real.

- **Client secret que expira y tumba producción (N0).** Los secrets de Entra caducan (máx. ~24 meses) y su vencimiento produce una caída súbita de login sin cambio de código. Mitigación: usar **certificado o Managed Identity / federated credential** en producción; el secret queda solo para dev local. (Sin verificar en proyecto propio.)
- **"Groups overage": el claim `groups` desaparece con muchos grupos (N0).** Si el usuario pertenece a más de ~200 grupos, Entra NO incluye el claim `groups` en el token; envía `_claim_names`/`hasgroups` y obliga a consultar Microsoft Graph. Mitigación: basar el RBAC en **App roles**, no en grupos de seguridad. (Sin verificar en proyecto propio.)
- **Redirect URI que no cuadra (N0).** El redirect debe ser **coincidencia literal exacta** con lo registrado (esquema, host, puerto, path; `https` salvo `localhost`). Un `/` de más o `http` en prod produce `AADSTS50011`. (Sin verificar en proyecto propio.)
- **Usar el ID token como access token entre SPA y API (N0).** El ID token es para el cliente; para llamar a una API se necesita un **access token con el `aud`/scope correcto**. Confundirlos causa 401 intermitentes. Mitigación: SPA pide un scope de la API; la API valida `aud`. (Sin verificar en proyecto propio.)
- **El token dura más que la sesión permitida (N0).** M-GSI-002 exige **≤15 min de inactividad**, pero el token de Entra suele durar 1 h. Si te apoyas solo en la expiración del token, incumples. Mitigación: **sesión deslizante a nivel de app** independiente del token (ya en los activos). (Sin verificar en proyecto propio.)
- **LDAP en claro o con clave vacía (N0).** Un bind simple por el puerto 389 transmite la contraseña sin cifrar (incumple DI-GSI-010 §6); y un bind con **password vacío** devuelve "éxito" en muchos AD (falso positivo de login). Mitigación: **LDAPS/StartTLS obligatorio** + rechazar credencial vacía + **escapar el filtro** (RFC 4515) contra LDAP injection. (Sin verificar en proyecto propio.)
- **Churn de versiones de las librerías (N0).** `next-auth` v5 (Auth.js) y `openid-client` v6 cambiaron API respecto de v4/v5; el provider se renombró `azure-ad`→`microsoft-entra-id`. Copiar un snippet de una versión distinta rompe el build. Mitigación: fijar versión exacta y re-verificar (paso 6). (Sin verificar en proyecto propio.)
- **Sin plan de caída del IdP (N0).** Si Entra/AD no responde, nadie entra. Mitigación: **usuario break-glass local** con MFA y fuertemente auditado (decisión D5). (Sin verificar en proyecto propio.)

## 5. Criterios de done

- [ ] Decisiones D1–D6 cerradas por el Dueño/OTI y registradas en el blueprint (no asumidas).
- [ ] App registrada single-tenant; redirect URIs exactas + post-logout registrados; App roles definidos y asignados.
- [ ] Login funciona con **Authorization Code + PKCE** (no implicit, no ROPC).
- [ ] El backend **valida el token** (firma JWKS, `iss`, `aud`, `exp`/`nbf` con clock skew ≤5 min) — probado con un token manipulado que es rechazado.
- [ ] Un endpoint protegido responde **403 desde el backend** aunque se invoque saltándose la UI; usuario sin rol no entra (probado con dos cuentas).
- [ ] **Timeout de inactividad ≤15 min** a nivel de app, con logoff efectivo (probado), independiente de la vida del token.
- [ ] **HTTPS/TLS** forzado; cookies `HttpOnly`+`Secure`+`SameSite`. Si es LDAP: **LDAPS/StartTLS**, filtro escapado, sin bind con clave vacía (probado).
- [ ] **Sin secretos en el repo**; credencial de prod = certificado/Managed Identity; secret (si dev) fuera del control de versiones.
- [ ] **Logout** limpia sesión local y hace RP-initiated logout al IdP.
- [ ] Cada login (éxito y fallo) queda **auditado** con fecha/hora, **IP origen**, usuario y **hash**, en esquema separado; mensaje de error único.
- [ ] Usuario **break-glass** definido y probado para caída del IdP.
- [ ] Versiones de `Microsoft.Identity.Web` / `next-auth` / `openid-client` fijadas y verificadas contra documentación vigente.

## Registro de uso
| Fecha | Proyecto | Tarea | Resultado | Lección |
|---|---|---|---|---|
