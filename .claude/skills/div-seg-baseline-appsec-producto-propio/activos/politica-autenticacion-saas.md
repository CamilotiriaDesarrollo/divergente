# Política de autenticación — SaaS propio Divergente (plantilla N0)

> Enfoque **moderno**, alineado a **NIST SP 800-63B**. NO es la política del Estado
> (rotación 60 días + composición + SSO LDAP): esos valores heredados se desaconsejan aquí.
> Ajusta umbrales al riesgo real del producto. Placeholders `<...>`.

## 1. Contraseñas / passphrases
- Longitud mínima: **≥12 caracteres**. Sin reglas de composición forzadas (no exigir mayúscula+número+símbolo).
- Permitir toda longitud (≥64) y todos los caracteres imprimibles, incluido espacio y unicode.
- **Verificación contra brechas:** rechazar contraseñas presentes en corpus de filtradas.
  Usar la API *range* de Have I Been Pwned (k-anonymity: se envían solo los 5 primeros
  caracteres del hash SHA-1; el servidor nunca ve la contraseña completa).
- **Sin rotación periódica forzada.** Rotar **solo** ante evidencia de compromiso.
- Sin "pistas" de contraseña ni preguntas de seguridad basadas en datos conocibles.

## 2. Almacenamiento
- Hash con **argon2id** (parámetros: memoria `<64 MiB>`, iteraciones `<3>`, paralelismo `<1>`; ajustar a la máquina).
  Alternativas aceptables: **bcrypt** (cost `<12>`) o **scrypt**. **Nunca** SHA/MD5 crudos ni texto en claro.
- La contraseña nunca se registra en logs, ni se transmite ni se muestra en claro.

## 3. MFA (segundo factor)
- **TOTP** (RFC 6238) disponible para todo usuario; considerar WebAuthn/passkeys a futuro.
- **Obligatorio** para roles administrativos y para acciones sensibles (exportar datos, cambiar roles).
- Códigos de recuperación de un solo uso, mostrados una vez y guardados hasheados.

## 4. Sesión y tokens
- Access token corto (`<15 min>`) + **refresh token rotatorio** (rotación en cada uso, revocable).
- Cookies de sesión: `HttpOnly`, `Secure`, `SameSite=Lax` (o `Strict` donde aplique).
- Cierre de sesión invalida el refresh en servidor (no solo borra la cookie).
- Timeout por inactividad configurable; re-autenticación para acciones críticas.

## 5. Anti-fuerza-bruta
- **Rate-limiting** por IP y por cuenta en el endpoint de login (backoff exponencial),
  en vez de un contador rígido "bloqueo al 5º intento".
- CAPTCHA/desafío tras N fallos. Alertar sobre picos de fallos.
- Mensajes de error **genéricos** ("credenciales inválidas"): no revelar si el usuario existe.

## 6. Login federado (opcional)
- Si se ofrece OAuth/OIDC (Google/GitHub/etc.): validar `state`/PKCE, verificar el `iss`/`aud`,
  y mapear identidades a la cuenta interna. No confiar en el email sin verificar `email_verified`.

## 7. Secretos
- Claves de firma de JWT, `DATABASE_URL`, claves de proveedor → **`seg-gestion-secretos-keyvault`**.
  Nunca en el repo ni en `NEXT_PUBLIC_*`.

## Criterios de aceptación (pegar en el DoD del login)
- [ ] Passphrase ≥12, sin composición forzada, verificada contra brechas (HIBP range).
- [ ] Hash argon2id/bcrypt; nunca en claro; nunca en logs.
- [ ] MFA/TOTP disponible; obligatorio para admin.
- [ ] Cookies HttpOnly+Secure+SameSite; refresh rotatorio revocable.
- [ ] Rate-limit + mensajes de error genéricos.
- [ ] Sin rotación periódica forzada; rotación solo ante compromiso.
