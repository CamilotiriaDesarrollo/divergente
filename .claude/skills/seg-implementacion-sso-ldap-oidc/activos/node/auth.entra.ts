// auth.entra.ts — SSO OIDC contra Microsoft Entra ID en Next.js (App Router) con Auth.js v5.
// Paquete: next-auth@5 (Auth.js v5).  npm i next-auth@beta
// Verificado contra Auth.js v5 (next-auth 5.x). El provider "microsoft-entra-id" reemplazó al
// antiguo "azure-ad" (renombre de marca Azure AD -> Entra ID). Auth.js v5 aún tuvo churn de API:
// fija la versión exacta en package.json y re-verifica al actualizar (regla de frescura).
//
// Colócalo en /auth.ts y expón los handlers en /app/api/auth/[...nextauth]/route.ts:
//   export { GET, POST } from "@/auth";

import NextAuth from "next-auth";
import MicrosoftEntraID from "next-auth/providers/microsoft-entra-id";

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    MicrosoftEntraID({
      clientId: process.env.ENTRA_CLIENT_ID!,
      clientSecret: process.env.ENTRA_CLIENT_SECRET!,
      // issuer single-tenant: SOLO usuarios del directorio del Ministerio.
      issuer: `https://login.microsoftonline.com/${process.env.ENTRA_TENANT_ID}/v2.0`,
      authorization: { params: { scope: "openid profile email" } },
    }),
  ],
  // Timeout de inactividad <= 15 min (M-GSI-002), independiente de la vida del token de Entra.
  session: { strategy: "jwt", maxAge: 15 * 60, updateAge: 5 * 60 },
  callbacks: {
    // Propaga los App roles de Entra (claim "roles") al token de sesión para el RBAC.
    async jwt({ token, profile }) {
      if (profile && Array.isArray((profile as any).roles)) {
        token.roles = (profile as any).roles as string[];
      }
      return token;
    },
    async session({ session, token }) {
      (session as any).roles = (token as any).roles ?? [];
      return session;
    },
    // Gate del middleware: bloquea rutas sin usuario autenticado.
    authorized({ auth }) {
      return !!auth?.user;
    },
  },
});

// RECUERDA: esto solo autentica y trae los roles. La AUTORIZACIÓN REAL (403) debe re-verificarse
// en el backend/route handler; el rol del cliente NUNCA es la fuente de verdad del permiso.
