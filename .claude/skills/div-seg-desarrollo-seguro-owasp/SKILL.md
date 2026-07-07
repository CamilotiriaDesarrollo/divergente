---
name: div-seg-desarrollo-seguro-owasp
regimen: divergente
description: Desarrollo seguro para el producto propio de Divergente en stack Node/Express/Next.js — OWASP Top 10 + OWASP ASVS (nivel L2 por defecto) como marco verificable, SDL de Microsoft condensado a un equipo pequeño, política de contraseñas/sesión alineada a NIST 800-63B, autorización en el backend y control de dependencias vulnerables. Cárgala al diseñar autenticación/autorización o sesión, endurecer una API Express o una app Next.js antes de un lanzamiento público, resolver dependencias vulnerables (npm audit), o revisar seguridad de una feature que toque login, roles o datos personales. El baseline lo fija Divergente, no una entidad pública.
---

# Desarrollo seguro OWASP + ASVS para producto propio (Divergente)

**Nivel actual:** N0 · **Dominio:** seg · **Agente(s):** `seguridad-appsec` (revisor) y `back-node-api` (constructor)
**Proyectos fuente:** ninguno — creada desde buenas prácticas (hermana divergente de `seg-desarrollo-seguro-sdl-owasp-gobierno`)

> Criterio de ascenso a N1: los 5 bloques completos, con activos copiables de ruta real y gotchas verificados (no genéricos). A N2: ≥1 uso real aceptado por el Dueño. A N3: ≥3 usos exitosos en ≥2 proyectos + checklist propio.

## 1. Propósito

Divergente construye **producto propio** (SaaS y web de marca propia) sobre Node/Express, Next.js, Vercel y Postgres. A diferencia de la línea gobierno, **ninguna entidad externa impone el baseline de seguridad ni existe una recepción formal que pueda rechazar la entrega**. Por eso el estándar de desarrollo seguro es **autoimpuesto**: higiene de ingeniería calibrada al riesgo de cada producto, anclada a dos referencias públicas —**OWASP Top 10** (conciencia de riesgos) y **OWASP ASVS** (requisitos verificables; Divergente apunta a **L2** por defecto)— más un **SDL de Microsoft condensado** a un equipo de 2-5 personas.

Es la **hermana divergente** de `seg-desarrollo-seguro-sdl-owasp-gobierno`: conserva el núcleo técnico reutilizable (OWASP, autorización en backend, hardening, dependencias vulnerables, separación de ambientes) y **quita el envoltorio estatal** (recepción por un Ministerio, valores de contraseña impuestos por el M-GSI-002, auditoría con IP+hash exigida por DI-GSI-010, ethical hacking obligatorio por DI-GSI-010 L7, checklists A1–A10 / L1–L14, acta de homologación ante la OTI).

Se carga cuando un agente: diseña login/roles/sesión de un producto propio; endurece una API Express o app Next.js antes de un lanzamiento público; encuentra una dependencia vulnerable (`npm audit`); o revisa seguridad de una feature que toque autenticación, roles o datos personales (regla inviolable 1 de la fábrica: `seguridad-appsec` revisa todo eso).

**Se coordina con** (no duplica): `div-seg-baseline-appsec-producto-propio` (política/gobernanza AppSec y evaluación de proveedores con ISO 27001/27002 como guía), `seg-habeas-data-implementacion` (tratamiento formal de datos personales bajo Ley 1581/2012), `seg-sast-dast-dependencias` y `seg-gestion-secretos-keyvault` (universales). Esta skill se ocupa del **código y el ciclo de desarrollo**.

## 2. Procedimiento

### Paso 1 — Fijar el baseline propio: elegir el nivel ASVS
No hay manual externo que dicte los controles; Divergente elige el nivel según el riesgo del producto y lo documenta:
- **L1** — bajo riesgo, sin cuentas ni datos personales (landing, catálogo público). Verificación mayormente automatizada.
- **L2 (default)** — hay login, roles o datos personales. El grueso del producto propio cae aquí.
- **L3** — crítico (pagos, salud, PII a escala). Añade revisión manual profunda + pentest externo.

Registra la elección en el CLAUDE.md del proyecto. Este nivel es el que reemplaza al "checklist normativo" de la línea gobierno como fuente de verdad de seguridad.

### Paso 2 — SDL de Microsoft condensado a equipo pequeño
No se ejecuta el SDL completo de 7 fases con gates formales; se ejecuta la versión mínima (ver `activos/threat-model-lite.md`):
- **Diseño** → un threat model lite (STRIDE-lite, 30-60 min) por feature que toque auth/roles/PII/pagos/uploads/integraciones. Feature sin nada de eso → se salta.
- **Implementación** → defaults seguros del arranque (`activos/security-express.ts`), lint/typecheck, y **revisión de PR con lente de seguridad por `seguridad-appsec`** (revisor ≠ constructor).
- **Verificación** → escaneo de dependencias en CI + tests de los criterios de done.
- **Release** → compuerta de deploy autoimpuesta (ver `div-devops-release-liviano-rollback`), no comité ITIL.
- **Respuesta** → un plan mínimo de incidentes escrito ANTES de necesitarlo (cómo revocar sesiones/claves, a quién se avisa, dónde se registra).

### Paso 3 — Autenticación: política moderna (NIST 800-63B), no la del manual estatal
Aquí está la divergencia más importante frente a la hermana institucional. La línea gobierno **fuerza** rotación cada 60 días + composición obligatoria (mayúscula/número/especial) porque el M-GSI-002 lo hace contractual. Divergente sigue **NIST 800-63B**, que **desaconseja** ambas reglas. Valores fijados por Divergente (detalle en `activos/politica-password-sesion.md`):
- Longitud **≥12** (permitir hasta ≥64); **sin** reglas de composición forzada; **sin** rotación periódica obligatoria (rotar solo ante evidencia de compromiso).
- **Bloquear contraseñas filtradas** contra un corpus de brechas (Have I Been Pwned por k-anonymity: se envía solo el prefijo del SHA-1, nunca la contraseña).
- Hash con **argon2id** (preferido) o **bcrypt cost ≥12** — el equivalente Node del `PasswordHasher<T>` de ASP.NET Core que usa la línea gobierno.
- Rate limit + bloqueo temporal tras N fallos (número decidido por Divergente, no impuesto); errores de login que **no permiten enumerar usuarios** (mismo mensaje y tiempo para usuario inexistente vs. contraseña mala).
- **MFA** (TOTP/WebAuthn) recomendado para roles admin o datos sensibles; obligatorio si hay pagos/PII a escala.

### Paso 4 — Autorización: la regla de oro (núcleo reutilizable, stack-neutral)
Idéntica en ambos regímenes porque es principio, no normativa: **la autorización vive SIEMPRE en el backend**. El endpoint responde **403 aunque la UI lo permita**; nunca se delega el permiso al frontend. En Node/Express: middleware `requireRole(...)` que resuelve rol/tenant desde la sesión en cada request y deniega por defecto (`activos/security-express.ts`). En Next.js: verificar en el **route handler / server action**, no en el componente cliente ni confiando solo en el middleware (ver gotcha de bypass). Confinamiento multi-tenant: nunca confíes en el `tenantId` que venga del cliente; tómalo de la sesión y fíltralo en la query. Segrega superficies de administración de las de usuario final.

### Paso 5 — Dependencias vulnerables (OWASP A06:2021)
Es el punto que más reaparece. Corre `npm audit` (y OSV/Dependabot/Renovate) **en cada PR**, no solo al final (`activos/ci-dependency-scan.yml`). Lockfile siempre commiteado. Criterio de decisión (heredado del caso real `xlsx` de la línea gobierno, aplicable igual aquí): si una librería de **frontend** no tiene parche, **mueve la lógica al backend o reemplázala**, y fuerza la subdependencia con `overrides` (npm) / `resolutions` (yarn/pnpm) — documentando el override y probando que no rompe (los overrides fallan en silencio).

### Paso 6 — Hardening de la API/app
Copia y adapta `activos/security-express.ts`. Cubre, en orden de pipeline: **helmet** (cabeceras de seguridad) **con CSP definida explícitamente** (los defaults de helmet no traen una CSP que encaje con tu app); **CORS restringido a un solo origin por env** (nunca `cors()` abierto); **cookies** `HttpOnly`+`Secure`+`SameSite`; **rate limiting** en endpoints públicos (`express-rate-limit`, o middleware/edge en Vercel); **CAPTCHA server-side real** (Cloudflare Turnstile), **no** deshabilitar el botón en React; **validación de entrada por esquema** (zod); **minimización de datos de salida** con DTO público vs. administrativo (no devolver la fila completa del usuario — OWASP API3); **upload seguro** (MIME real por magic numbers, nombre aleatorio, storage aislado, tamaño limitado); y **mensajes de error con mínima información** (stack trace solo fuera de producción vía `NODE_ENV` — el equivalente Node del `GlobalExceptionMiddleware.cs` de gobierno).

### Paso 7 — Separación de ambientes y secretos
Ambientes **dev / preview / prod** separados (entornos de Vercel) con **bases de datos Postgres separadas**. Secretos en variables de Vercel / gestor de secretos, **nunca commiteados**; jamás un secreto bajo prefijo `NEXT_PUBLIC_` (se envía al navegador). Sin cuentas sembradas/por defecto activas en ambientes compartidos. La app se conecta a Postgres con un **rol de mínimo privilegio, nunca el owner/superusuario**. Datos de producción en dev solo anonimizados. (Detalle de secretos: `seg-gestion-secretos-keyvault`.)

### Paso 8 — Verificación antes de lanzar (compuerta autoimpuesta, no ethical hacking contractual)
La línea gobierno exige ethical hacking obligatorio por DI-GSI-010 L7 como requisito de recepción. Divergente **no** tiene esa obligación externa; en su lugar define una **compuerta de release propia** escalada al riesgo: SAST/DAST + escaneo de dependencias en CI (verde antes de mergear) + tests de los criterios de done. Para productos **L3 o antes de un lanzamiento público con datos sensibles**, se **recomienda** (no se obliga) una revisión/pentest ligero; para pagos/PII a escala, considerar un pentest externo. La decisión de cuánto invertir la toma el Dueño en la compuerta GO/NO-GO del release.

## 3. Activos copiables

Todos en `activos/` de esta skill. **Son plantillas/pautas, no rutas de proyecto real**: la skill es N0 y ningún proyecto divergente la ha ejercido aún. Cada uno lleva el encabezado "PLANTILLA (sin verificar en proyecto propio)".

- **`security-express.ts`** — arranque endurecido de una API Express/Node: helmet + CSP explícita, CORS por env, `express-rate-limit`, cookies seguras, middleware `requireRole()` (autorización 403 en backend, deny-by-default, nota multi-tenant) y manejador de errores con `NODE_ENV` gate. Hermana divergente de `SecurityHeadersMiddleware.cs` + `GlobalExceptionMiddleware.cs`. Cópialo al `src/` del server y ajusta la CSP y los orígenes reales.
- **`politica-password-sesion.md`** — baseline de contraseñas/sesión **fijado por Divergente** sobre NIST 800-63B + ASVS §2/§3, con la tabla que explica por qué **difiere** de los valores del M-GSI-002. Cópiala como política de auth del producto y ajusta timeouts al riesgo.
- **`checklist-asvs-l2.md`** — checklist operativo ASVS **L2** que reemplaza el A1–A10 / L1–L14 estatal; funciona como **Definition-of-Done de seguridad autoimpuesto**. Cópialo al proyecto y márcalo en la compuerta de release.
- **`ci-dependency-scan.yml`** — workflow de GitHub Actions que corre `npm audit` (prod, umbral high) en cada PR + cron semanal, con notas de Dependabot/Renovate y del patrón de `overrides`. Cópialo a `.github/workflows/` y ajusta el umbral.
- **`threat-model-lite.md`** — plantilla del SDL condensado: las 4 preguntas STRIDE-lite, tabla de trabajo por feature, y el mapeo de las 7 fases del SDL de Microsoft a lo que un equipo de 2-5 personas realmente hace. Úsala al diseñar una feature con auth/PII.

Referencia técnica externa (para consultar, no copiar): OWASP Top 10, OWASP ASVS v4, OWASP Cheat Sheet Series, NIST SP 800-63B, Microsoft SDL.

## 4. Gotchas verificados

Skill N0: estos son **riesgos documentados de la práctica, sin verificar en proyecto propio** de Divergente todavía. No hay evidencia de proyecto inventada.

- **Importar por inercia la política de contraseñas estatal a un producto propio.** El reflejo de copiar "rotación 60 días + mayúscula/número/especial" del M-GSI-002 produce, según NIST 800-63B, **peor** seguridad (empuja a `Password1!`, `Password2!`…). En Divergente esa regla solo tendría sentido si un cliente la exige por contrato; para producto propio, sigue `politica-password-sesion.md` (longitud + corpus de brechas, sin rotación forzada). *(Sin verificar en proyecto propio.)*
- **Autorización confiada al cliente en Next.js.** Ocultar un botón o comprobar el rol en un componente cliente no es control de acceso; se evade con una llamada directa al route handler / server action. Y **no basta con el `middleware.ts` de Next.js**: existió un bypass de autorización vía middleware (CVE-2025-29927) — verifica la autorización **también** en el handler/server action, no solo en el middleware. *(Sin verificar en proyecto propio.)*
- **Secreto expuesto por el prefijo `NEXT_PUBLIC_`.** Cualquier variable con ese prefijo se **empaqueta en el bundle del navegador**. Poner ahí una API key o un secreto de Postgres lo publica a todo visitante. Footgun clásico de Next.js: los secretos van en variables **sin** ese prefijo y se leen solo del lado servidor. *(Sin verificar en proyecto propio.)*
- **Los preview deployments de Vercel son públicos por defecto.** La URL ofuscada **no es** privacidad: un preview con datos reales y sin auth queda accesible a quien tenga el enlace. Protege previews con Vercel Authentication / password, o no siembres datos reales en ellos. *(Sin verificar en proyecto propio.)*
- **CSP de helmet asumida como suficiente.** Los defaults de helmet endurecen varias cabeceras pero **su CSP hay que definirla**; una CSP ausente da falsa seguridad y una demasiado estricta rompe la app en silencio (scripts/estilos bloqueados). Configúrala explícita y pruébala en preview antes de prod. *(Sin verificar en proyecto propio.)*
- **`overrides`/`resolutions` que fallan callados.** Forzar una subdependencia para tapar una CVE puede romper en runtime sin error de build, o no aplicarse si el rango no coincide. Documenta cada override y cúbrelo con un test; no lo des por hecho tras `npm install`. *(Sin verificar en proyecto propio.)*
- **Sobre-exposición de PII en respuestas JSON (OWASP API3).** Devolver `SELECT *` / la entidad completa del usuario filtra correo, teléfono o documento aunque la UI no los pinte. Usa proyección explícita / DTO público. Como empresa colombiana, Divergente sigue sujeta a Ley 1581/2012 aunque no sea una entidad pública — el tratamiento formal lo cubre `seg-habeas-data-implementacion`. *(Sin verificar en proyecto propio.)*
- **CAPTCHA "de mentira" en el cliente.** Deshabilitar el botón de envío en React no protege: se evade con una llamada directa al endpoint. Usa validación server-side real (Turnstile/reCAPTCHA v3) + rate limiting. *(Verdad universal heredada de la hermana institucional; sin verificar en proyecto propio divergente.)*

## 5. Criterios de done

- [ ] Nivel ASVS del producto elegido y documentado (L1/L2/L3); `checklist-asvs-l2.md` (o el que aplique) marcado en la compuerta de release.
- [ ] Política de contraseñas según `politica-password-sesion.md` (longitud ≥12, sin composición ni rotación forzadas, corpus de brechas), con test que rechace una contraseña filtrada/corta; hash argon2id o bcrypt cost ≥12.
- [ ] Sesión con `HttpOnly`+`Secure`+`SameSite`, rotación de ID tras login, idle + absolute timeout, y logout que invalida la sesión en el servidor (probado).
- [ ] Un endpoint protegido devuelve **403 desde el backend** aunque se invoque saltándose la UI; en Next.js la autorización se verifica en el handler/server action (no solo en middleware); un usuario no lee datos de otro tenant (probado con 2 cuentas).
- [ ] `npm audit` (prod) sin vulnerabilidades high/critical sin plan, corriendo en cada PR; overrides documentados y probados; lockfile commiteado.
- [ ] helmet con **CSP explícita** verificada en la respuesta HTTP; CORS restringido por env; rate limiting activo en endpoints públicos (429 al superar el límite); CAPTCHA server-side donde aplique.
- [ ] DTO público sin PII; validación de entrada por esquema (zod) en endpoints con body; errores de producción sin stack trace (NODE_ENV gate).
- [ ] Sin secretos en el repo ni bajo `NEXT_PUBLIC_`; ambientes dev/preview/prod y bases de datos separados; la app se conecta a Postgres con rol de mínimo privilegio; previews sin datos reales o protegidos.
- [ ] Threat model lite hecho para toda feature que toque auth/roles/PII/pagos/uploads; plan mínimo de respuesta a incidentes escrito.
- [ ] Revisión de seguridad por `seguridad-appsec` (revisor ≠ constructor) superada; para L3/lanzamiento con datos sensibles, revisión o pentest ligero considerado por el Dueño en la compuerta GO/NO-GO.

**Límites de la evidencia:** skill N0 creada desde buenas prácticas; ningún proyecto divergente la ha ejercido. Los activos son plantillas (no rutas de proyecto real) y los gotchas están marcados "sin verificar en proyecto propio". Al primer uso real, calibrar valores (timeouts, umbral de audit, número de intentos) contra el proyecto y ascender a N1/N2.

## Registro de uso
| Fecha | Proyecto | Tarea | Resultado | Lección |
|---|---|---|---|---|
