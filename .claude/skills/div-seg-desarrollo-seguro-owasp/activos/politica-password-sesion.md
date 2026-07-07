# Política de contraseñas y sesión — baseline Divergente (PLANTILLA)

> Sin verificar en proyecto propio. Baseline **fijado por Divergente**, anclado a **NIST SP 800-63B** y **OWASP ASVS v4 §2 (Authentication)**.
> Es la hermana divergente de la política institucional del M-GSI-002 §3, pero **NO copia sus valores** (rotación 60 días + composición obligatoria). NIST desaconseja expresamente esas dos reglas; solo se mantienen en la línea gobierno porque el manual las hace contractualmente exigibles.

## Contraseñas (NIST 800-63B / ASVS 2.1)

| Regla | Valor Divergente | Por qué difiere de la institucional |
|---|---|---|
| Longitud mínima | **≥ 12 caracteres** (permitir hasta ≥64) | La longitud es la defensa real; la línea gobierno pide ≥8 + composición. |
| Reglas de composición (mayúscula/número/especial) | **NO exigir** | NIST 800-63B las desaconseja: empujan a patrones predecibles (`Password1!`). |
| Rotación periódica obligatoria | **NO** (solo rotar ante evidencia de compromiso) | La institucional fuerza 60 días; NIST recomienda no forzar rotación sin causa. |
| Bloqueo de contraseñas filtradas | **Sí** — validar contra un corpus de brechas (Have I Been Pwned, k-anonymity: se envía solo el prefijo del SHA-1) y contra palabras de diccionario/contexto | Sustituye la lista negra manual ("ministerio/cultura") por una fuente viva. |
| Almacenamiento | **argon2id** (preferido) o **bcrypt cost ≥ 12** | Reemplaza `PasswordHasher<T>` de ASP.NET Core por el equivalente Node. |
| Contra fuerza bruta | Rate limit + backoff progresivo; bloqueo temporal tras N fallos (p.ej. 5-10) con desbloqueo por tiempo o verificación | Se conserva el control; el número es decisión de Divergente, no del manual. |
| Errores de login | No revelar qué campo falló; mismo mensaje y tiempo de respuesta para usuario inexistente vs. contraseña incorrecta (evita enumeración de usuarios) | Igual espíritu que la institucional. |
| MFA | **Recomendado** (TOTP/WebAuthn) para cuentas con datos sensibles o rol admin; obligatorio si el producto maneja pagos/PII a escala | La institucional lo ata a SSO LDAP/Azure AD; aquí es decisión de producto. |

## Sesión (ASVS 2.8 / 3.x)

- **Idle timeout** (inactividad) y **absolute timeout** (duración máxima) explícitos; valor según riesgo del producto (p.ej. 30 min idle / 12 h absoluto para una app con cuentas; más corto si hay datos sensibles). No hay un "≤15 min" impuesto por contrato como en la línea gobierno.
- **Invalidar la sesión en el servidor al hacer logout** (destruir el registro/rotar el token), no solo borrar la cookie en el cliente.
- **Rotar el identificador de sesión** tras autenticarse (anti session-fixation).
- Cookies de sesión: `HttpOnly` + `Secure` + `SameSite=Lax` (o `Strict` si no hay flujo cross-site); `__Host-` prefix si aplica.
- Si usas **JWT**: expiración corta + refresh rotatorio; mantén una lista de revocación o usa tokens de sesión server-side para poder cerrar sesiones comprometidas.

## Notas de implementación (Node)

- Hash: `argon2` (`npm i argon2`) → `await argon2.hash(pwd)` / `argon2.verify(hash, pwd)`.
- Corpus de brechas: API de Pwned Passwords por rango (k-anonymity) — nunca envíes la contraseña ni su hash completo.
- Nunca loguees contraseñas ni tokens; enmascara en logs y en mensajes de error.
