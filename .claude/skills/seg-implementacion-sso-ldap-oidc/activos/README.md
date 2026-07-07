# Activos — seg-implementacion-sso-ldap-oidc

Plantillas base reutilizables para implementar SSO/OIDC/LDAP. **Sin secretos**; todo con placeholders
`${VAR}`. Origen: buenas prácticas actuales (skill N0, aún no ejercitada en un proyecto propio).

| Activo | Qué es | Cuándo copiarlo | Qué adaptar |
|---|---|---|---|
| `.env.example` | Variables OIDC (Entra ID) + LDAP | Al arrancar cualquier integración SSO | Rellenar en `.env` local / Key Vault; nunca commitear valores |
| `checklist_sso_oidc.md` | Decisiones abiertas + DoD normativo | Fase 1 (blueprint) y Fase 3/4 (build) | Cerrar D1–D6 con la OTI/Dueño |
| `dotnet/appsettings.EntraID.json` | Config Microsoft.Identity.Web | API/web .NET de gobierno | TenantId/ClientId; credencial vía Key Vault |
| `dotnet/Program.EntraID.cs` | Arranque OIDC + RBAC + sesión 15 min | Stack .NET (línea gobierno) | Nombres de roles/policies y rutas |
| `dotnet/LdapAuthenticationService.cs` | Auth LDAPS contra AD (search+bind) | Solo si la OTI no tiene Entra ID | BaseDN/filtro/atributos del directorio |
| `node/auth.entra.ts` | Auth.js v5 (Next.js) provider Entra | Stack Next.js 16/React 19 | scopes, mapeo de roles |
| `node/oidc-express.ts` | openid-client v6 (Express) code+PKCE | Stack client/server React+Vite/Express | rutas, store de sesión |

> Versiones sensibles a frescura: `Microsoft.Identity.Web` (3.x), `next-auth` (v5), `openid-client`
> (v6, API distinta de v5). Fija la versión exacta y re-verifica al actualizar.
