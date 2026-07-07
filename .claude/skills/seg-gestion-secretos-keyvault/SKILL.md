---
name: seg-gestion-secretos-keyvault
regimen: universal
description: Gestiona secretos y credenciales sin sembrarlas ('admin') ni versionarlas en .env — higiene .env/.gitignore + gitleaks, user-secrets locales, variables de Vercel/GitHub en la línea privada, y Azure Key Vault con Managed Identity (sin secretos en código) en la línea gobierno. Cárgala en F3 al montar la gestión de secretos desde el día 1, cuando aparezca una credencial sembrada o un .env por commitear, al migrar secretos a Key Vault, al rotar credenciales, o cuando una compuerta que toque login/BD/datos personales exija que ningún secreto viva en el repo ni en config en claro (DI-GSI-010, M-GSI-002).
---

> **Régimen: universal.** Las referencias a normativa estatal (M-GSI-002, DI-GSI-010, ITIL/M-GSI-003, «entidad pública») aplican SOLO en proyectos `institucional`; en un proyecto `divergente` ignóralas y usa la variante de la línea privada (Vercel/GitHub secrets, y para el vault gestionado, la alternativa que aplique a tu nube — no necesariamente Azure Key Vault). La higiene de secretos (nada de secretos en el repo, gitleaks, rotación, mínimo privilegio) es buena práctica universal; Azure Key Vault + Managed Identity y la rotación como RFC son la *variante gobierno*, no la única vía.

# Gestión de secretos y credenciales con Key Vault

**Nivel actual:** N0 · **Dominio:** seg · **Agente(s):** `seguridad-appsec` (dueño), `devops-plataforma` (provisiona Key Vault / CI), `back-dotnet-gobierno` (lo consume en .NET)
**Proyectos fuente:** ninguno — creada desde buenas prácticas (VACÍO del portafolio)

> Criterio de ascenso a N1: los 5 bloques completos, con activos copiables de ruta real y gotchas verificados (no genéricos). A N2: ≥1 uso real aceptado por el Dueño. A N3: ≥3 usos exitosos en ≥2 proyectos + checklist propio.

## 1. Propósito

Hoy en el portafolio del dueño **la gestión de secretos no existe como práctica**: todo vive en archivos `.env` y hay **credenciales sembradas** de desarrollo (`admin`) que llegaron a quedar activas y desfasadas (evidencia en la skill hermana `seg-desarrollo-seguro-sdl-owasp-gobierno`, gotcha "credenciales sembradas"). "Key Vault" solo aparece como **destino futuro**, nunca implementado. Esto choca de frente con la exigencia normativa: M-GSI-002 §3 obliga a **contraseñas cifradas en BD y en archivos de configuración** y a **no conectar la app a la BD como administrador**; DI-GSI-010 exige SSO contra Azure AD/LDAP y TLS extremo a extremo **(estas citas normativas aplican solo si el proyecto es institucional; la higiene técnica que describen —secretos cifrados fuera del repo, sin usuario admin, TLS— es buena práctica universal también en divergente)**. Esta skill cierra el hueco con una estrategia por línea: **higiene universal** (nada de secretos en el repo) + **user-secrets/.env local** + **Vercel/GitHub** en la línea privada + **Azure Key Vault con Managed Identity** en la línea gobierno.

Se carga cuando un agente: monta la **gestión de secretos de F3 (Fundaciones)** "desde el inicio, nunca credenciales sembradas"; encuentra un `.env` a punto de commitearse o una credencial sembrada; migra secretos a Key Vault; **rota** una credencial; o necesita evidenciar ante G3/G4/G5 que ningún secreto vive en el repo ni en config en claro.

## 2. Procedimiento

### Paso 1 — Inventariar y clasificar los secretos
Antes de tocar código, llena `activos/inventario-secretos.md`: qué secreto, tipo, dónde vive en local y en prod, dueño y cadencia de rotación. Sin inventario no hay rotación ni evidencia de auditoría. Marca cuáles son de **gobierno** (aplican M-GSI-002/DI-GSI-010).

### Paso 2 — Higiene universal (las dos líneas, siempre)
1. `.gitignore` con `activos/gitignore-secretos.txt` **antes** del primer commit; versiona solo `.env.example` (`activos/.env.example`), nunca `.env`.
2. **gitleaks** en CI con historia completa (`fetch-depth: 0`) — esto lo aporta la skill hermana `seg-sast-dast-dependencias`; aquí es el candado que evita que un secreto se cuele.
3. Retira o **rota** toda credencial sembrada (`admin`) antes de cualquier ambiente compartido; la app **no** se conecta a la BD con usuario administrador (M-GSI-002 §3.5).
4. En Next.js: `NEXT_PUBLIC_*` **solo** para valores públicos — ese prefijo incrusta el valor en el bundle del navegador de forma permanente.

### Paso 3 — Secretos locales del dev (Windows)
Corre `activos/bootstrap-secretos-local.ps1`: copia `.env.example`→`.env` e inicializa **dotnet user-secrets** (se guardan en el perfil del usuario, fuera del repo). Meta de onboarding: config lista en minutos (alineado con el entorno reproducible <30 min de F3). Para .NET local **no** uses `appsettings.json` con secretos: usa `user-secrets`.

### Paso 4 — Línea privada (GitHub + Vercel)
- **Vercel Environment Variables** con alcance por entorno (Production / Preview / Development); márcalas como *Sensitive*. Trae el `.env` local con `vercel env pull .env.local`.
- **GitHub Actions**: secretos de repositorio/entorno. Preferir **OIDC federado** (`azure/login` con *federated credentials*, `permissions: id-token: write`) para no guardar tokens de larga vida. Los secretos del pipeline no se imprimen en logs.

### Paso 5 — Línea gobierno (.NET/SQL Server + Azure Key Vault)
1. Provisiona el vault con `activos/provisionar-keyvault.ps1` (Azure CLI): RBAC en vez de access policies, **purge protection**, y rol **"Key Vault Secrets User"** (solo lectura, mínimo privilegio) para la **Managed Identity** de la app.
2. En la API, `activos/KeyVault.Program.cs.snippet`: `AddAzureKeyVault(uri, new DefaultAzureCredential())` solo fuera de Development. En prod manda la **identidad administrada** — cero client secret en código o config, lo que satisface "contraseñas cifradas en archivos de configuración" (M-GSI-002) sacándolas del archivo por completo.
3. El separador `--` en el nombre del secreto de Key Vault mapea a `:` en configuración (`ConnectionStrings--Default` → `Configuration["ConnectionStrings:Default"]`).
4. Si el hosting estatal es **on-premise sin Azure**, Key Vault puede no ser alcanzable: confírmalo con la OTI y usa la alternativa (HashiCorp Vault o config cifrada) — decisión GO/NO-GO de F0/F3, no un supuesto (ver gotcha).

### Paso 6 — Python (datos/scraping)
`activos/secretos.py`: `get_secret()` lee variable de entorno en local y **Azure Key Vault** (`azure-identity` + `azure-keyvault-secrets`) en prod. Nunca imprimas el valor; solo confirma que resuelve.

### Paso 7 — Rotación y atado a compuertas/normativa
- **Rotación 60 días** para credenciales de gobierno (M-GSI-002); fija la expiración al cargar el secreto en Key Vault. Rota de inmediato ante fuga o salida de personal.
- **F3/G3:** gestión de secretos operativa desde el día 1 (inventario + `.env.example` + gitignore + user-secrets/Key Vault). Es requisito explícito de F3.
- **Línea gobierno + ITIL (M-GSI-003):** crear/rotar secretos en **producción es un cambio (RFC, SDC F-GSI-037, comité del jueves)**; nunca ad-hoc ni dentro del congelamiento 15dic-15ene.
- **G4/G5:** ningún secreto en repo ni en claro (veto de `seguridad-appsec`).

## 3. Activos copiables

Todos en `activos/` de esta skill. Son **plantillas base (N0)**: sin secretos, con placeholders `${VAR}`; las versiones de paquetes/imágenes y los nombres de roles deben confirmarse antes de fijarlas.

- **`.env.example`** — plantilla de variables de entorno para las dos líneas (BD sin usuario admin, OIDC Azure AD, `KEY_VAULT_URI`, aviso `NEXT_PUBLIC_`). Copiar a la raíz; versionar solo esta, nunca `.env`.
- **`gitignore-secretos.txt`** — bloque de `.gitignore` que ignora `.env`, llaves, tfstate y `.vercel`, pero **conserva** `.env.example`. Pegar en el `.gitignore` del proyecto.
- **`KeyVault.Program.cs.snippet`** — arranque ASP.NET Core que carga Key Vault con `DefaultAzureCredential` solo fuera de Development. Adaptar el nombre de la variable `KEY_VAULT_URI` y los paquetes NuGet.
- **`secretos.py`** — módulo Python `get_secret()`: entorno/.env en local, Key Vault en prod. Copiar a la capa de config de scraping/datos.
- **`provisionar-keyvault.ps1`** — script Azure CLI (Windows) que crea el vault endurecido (RBAC, purge protection), asigna rol de solo-lectura a la Managed Identity y carga un secreto con expiración a 60 días. Adaptar RG/location/nombres; ejecución en prod = RFC ITIL.
- **`bootstrap-secretos-local.ps1`** — runner local Windows: `.env` desde plantilla + `dotnet user-secrets init`. Idempotente.
- **`inventario-secretos.md`** — inventario + política de rotación citable en G3 y ante auditoría. Copiar a `docs/seguridad/` y mantener al día.

## 4. Gotchas verificados

Riesgos **documentados de la práctica**, marcados honestamente como **sin verificar aún en proyecto propio (N0)**. Ascenderán a evidencia real al usarse.

- **El hosting estatal puede no tener Azure (N0, sin verificar).** "Key Vault" se asume Azure, pero muchas entidades corren on-premise o en otra nube; el vault podría ser inalcanzable desde el servidor de producción. Mitigación: confirmar con la OTI que existe suscripción/tenant Azure alcanzable **antes** de comprometer la arquitectura; si no, HashiCorp Vault o config cifrada como alternativa, cerrada como decisión GO/NO-GO. No lo asumas.
- **`DefaultAzureCredential` falla distinto en local que en prod (N0, sin verificar).** En local necesita `az login` (o cuenta de Visual Studio); si el dev no está autenticado, da un 401/timeout críptico. En prod necesita la Managed Identity asignada. Mitigación: `bootstrap` recuerda `az login`; cargar Key Vault solo fuera de Development.
- **La asignación de rol RBAC tarda en propagar (N0, sin verificar).** Tras `role assignment create`, el primer arranque puede dar **403** unos minutos. Mitigación: reintentar/esperar; no interpretarlo como error de código.
- **`NEXT_PUBLIC_` filtra el secreto para siempre (N0, sin verificar).** Cualquier variable con ese prefijo se compila dentro del JS del navegador; publicar una vez = fuga permanente que exige rotar. Mitigación: revisar que ningún secreto lleve ese prefijo antes de desplegar en Vercel.
- **Borrar el `.env` del repo NO borra el secreto (N0, sin verificar).** Queda en la historia de git; un `git rm` no lo elimina. Mitigación: gitleaks sobre historia completa + **rotar** el secreto expuesto (asumirlo comprometido), no solo quitar el archivo.
- **user-secrets no es un vault (N0, sin verificar).** Guarda los valores en **texto plano** en el perfil del usuario; solo los saca del repo. Sirve para desarrollo, **jamás** para producción. Mitigación: en prod siempre Key Vault/Managed Identity.
- **`AddAzureKeyVault` añade latencia y dependencia dura al arranque (N0, sin verificar).** Carga secretos al iniciar y factura por transacción; martillar el vault por request encarece y puede *throttlear*. Mitigación: cargar al arranque (no por request), filtrar por prefijo si el vault es grande, y manejar fallos transitorios.
- **Rotar en gobierno sin RFC rompe ITIL (N0, sin verificar).** Una rotación ad-hoc en producción viola M-GSI-003. Mitigación: planificarla como cambio (comité del jueves), fuera del congelamiento 15dic-15ene.

## 5. Criterios de done

- [ ] `gitleaks` en verde sobre la **historia completa**; `.env` en `.gitignore`; solo `.env.example` (con placeholders) versionado.
- [ ] Credenciales sembradas (`admin`) retiradas/rotadas antes de cualquier ambiente compartido; la app no se conecta a la BD como administrador.
- [ ] Dev local funciona con `user-secrets`/`.env` reproducido por `bootstrap-secretos-local.ps1`; ningún secreto en `appsettings.json`.
- [ ] Línea privada: variables en Vercel por alcance (Prod/Preview/Dev) marcadas *Sensitive*; ningún secreto con prefijo `NEXT_PUBLIC_`; GitHub Actions con OIDC o secretos de entorno (no tokens en el repo).
- [ ] Línea gobierno: Key Vault con **RBAC + purge protection**; la app lee vía **Managed Identity** sin client secret en código/config; verificado que arranca leyendo un secreto real; alternativa on-prem documentada si no hay Azure.
- [ ] Inventario `inventario-secretos.md` completo (secreto, ubicación, dueño, rotación) y actualizado.
- [ ] Rotación documentada (60 días, M-GSI-002) con expiración fijada en Key Vault; procedimiento de rotación por fuga definido.
- [ ] En gobierno: crear/rotar secretos en producción queda como **RFC ITIL** (M-GSI-003), nunca ad-hoc ni en el congelamiento.
- [ ] Sin secretos en repo ni en config en claro (evidencia adjunta a la compuerta; veto de `seguridad-appsec`).

## Registro de uso
| Fecha | Proyecto | Tarea | Resultado | Lección |
|---|---|---|---|---|
