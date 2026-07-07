// oidc-express.ts — Authorization Code Flow + PKCE contra Entra ID en Express (backend .NET-libre).
// Paquete: openid-client v6.  npm i openid-client
// OJO: openid-client v6 tiene una API FUNCIONAL nueva, distinta de la de v5 (Issuer/Client). Este
// código es v6. Si el proyecto trae v5, la API cambia por completo: fija "openid-client": "^6" en
// package.json y re-verifica al actualizar (regla de frescura de la fábrica).

import * as client from "openid-client";
import express from "express";
import session from "express-session";

const app = express();
app.set("trust proxy", 1); // detrás de reverse proxy/HTTPS del Ministerio
app.use(session({
  secret: process.env.SESSION_SECRET!,
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: true,                 // solo HTTPS (TLS extremo a extremo, DI-GSI-010 §6)
    sameSite: "lax",
    maxAge: 15 * 60 * 1000,       // inactividad <= 15 min (M-GSI-002)
  },
}));

// Descubrimiento OIDC (lee /.well-known/openid-configuration del tenant single-tenant).
const config = await client.discovery(
  new URL(`https://login.microsoftonline.com/${process.env.ENTRA_TENANT_ID}/v2.0`),
  process.env.ENTRA_CLIENT_ID!,
  process.env.ENTRA_CLIENT_SECRET!,
);
const REDIRECT_URI = process.env.OIDC_REDIRECT_URI!;

app.get("/login", async (req, res) => {
  const codeVerifier = client.randomPKCECodeVerifier();
  const codeChallenge = await client.calculatePKCECodeChallenge(codeVerifier);
  const state = client.randomState();
  // Guarda verifier + state en la sesión del servidor (NO en la cookie del cliente).
  (req.session as any).pkce = { codeVerifier, state };

  const url = client.buildAuthorizationUrl(config, {
    redirect_uri: REDIRECT_URI,
    scope: "openid profile email",
    code_challenge: codeChallenge,
    code_challenge_method: "S256",
    state,
  });
  res.redirect(url.href);
});

app.get("/signin-oidc", async (req, res) => {
  const pkce = (req.session as any).pkce;
  if (!pkce) return res.status(400).send("Sesión de login expirada");

  const tokens = await client.authorizationCodeGrant(
    config,
    new URL(req.originalUrl, `https://${req.headers.host}`),
    { pkceCodeVerifier: pkce.codeVerifier, expectedState: pkce.state },
  );
  const claims = tokens.claims()!; // openid-client valida firma (JWKS), issuer, audience y expiración

  (req.session as any).user = {
    sub: claims.sub,
    name: claims.name,
    email: (claims as any).email ?? (claims as any).preferred_username,
    roles: (claims as any).roles ?? [], // App roles de Entra -> RBAC del backend
  };
  delete (req.session as any).pkce;
  res.redirect("/");
});

// La AUTORIZACIÓN vive en el backend: middleware que exige rol y responde 403 real.
export const requireRole = (role: string) =>
  (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const user = (req.session as any).user;
    if (!user) return res.status(401).send("No autenticado");
    if (!user.roles?.includes(role)) return res.status(403).send("Sin permiso");
    next();
  };
