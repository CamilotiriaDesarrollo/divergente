# Inventario y política de secretos — <proyecto>

Plantilla base (N0). Cópiala a `docs/seguridad/inventario-secretos.md` del proyecto y
manténla al día. Es insumo de la compuerta G3 y evidencia ante auditoría estatal (DI-GSI-010).

## 1. Inventario

| Secreto | Tipo | Dónde vive (local / prod) | Dueño | Rotación | Última rotación |
|---|---|---|---|---|---|
| `DATABASE_URL` (usuario app) | Cadena BD | user-secrets / Key Vault | back-dotnet | 60 días | ${FECHA} |
| `OIDC_CLIENT_SECRET` | SSO Azure AD | .env / Key Vault | seguridad | 90 días | ${FECHA} |
| `WHATSAPP_TOKEN` | API tercero | .env / Vercel Env | front-formularios | según proveedor | ${FECHA} |
| `OPENAI_API_KEY` | API tercero | .env / Key Vault | datos | según proveedor | ${FECHA} |

## 2. Reglas fijas

- Ningún secreto en el repo ni en config en claro (verificado con gitleaks, historia completa).
- Credenciales sembradas ('admin' y similares) retiradas o rotadas antes de cualquier
  ambiente compartido; la app NUNCA se conecta a la BD como administrador (M-GSI-002 §3.5).
- Prod (gobierno): Managed Identity + Azure Key Vault, sin client secret en código.
- `NEXT_PUBLIC_*` solo para valores públicos.

## 3. Política de rotación

- Contraseñas/credenciales de gobierno: **60 días** (M-GSI-002); expiración fijada en Key Vault.
- Rotar de inmediato ante: fuga confirmada, salida de una persona con acceso, o secreto
  detectado en la historia de git (rotar aunque se borre el archivo).
- En producción de gobierno, la rotación es un **cambio ITIL (RFC)**: planificar, no ad-hoc,
  y nunca dentro del congelamiento 15dic-15ene.
