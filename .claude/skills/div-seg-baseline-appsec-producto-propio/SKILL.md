---
name: div-seg-baseline-appsec-producto-propio
regimen: divergente
description: Baseline de seguridad y políticas AppSec para el SaaS/producto propio de Divergente (stack Node/Next/Vercel/Postgres), usando ISO 27001/27002:2022 como guía —no como certificación— para una empresa privada pequeña. Cárgala al redactar el baseline/política de seguridad del producto propio, endurecer autenticación/sesión de un SaaS, evaluar un proveedor cloud (Vercel/Neon/Supabase) o subcontratista, o cerrar la revisión de seguridad de una entrega divergente. NO cubre Habeas Data: eso lo lleva `seg-habeas-data-implementacion`.
---

# Baseline de seguridad AppSec — producto propio Divergente

**Nivel actual:** N0 · **Dominio:** seg · **Agente(s):** `seguridad-appsec`
**Proyectos fuente:** ninguno — creada desde buenas prácticas (hermana divergente de `seg-politicas-iso27001-entidad-publica`)

> Criterio de ascenso a N1: los 5 bloques completos, con activos copiables de ruta real y gotchas verificados (no genéricos). A N2: ≥1 uso real aceptado por el Dueño. A N3: ≥3 usos exitosos en ≥2 proyectos + checklist propio.

## 1. Propósito

Dar a los agentes de la línea **divergente** un baseline de seguridad **del tamaño correcto** para el SaaS/producto propio de Divergente: una empresa privada pequeña sobre stack **Node / Next.js / Vercel / Postgres gestionado** (Neon, Supabase o Vercel Postgres). Toma el **núcleo técnico reutilizable** de la hermana institucional `seg-politicas-iso27001-entidad-publica` —estructurar la seguridad por los cuatro temas de **ISO/IEC 27002:2022**, proteger datos de prueba, endurecer autenticación/sesión, exigir auditoría, evaluar la nube y a los terceros— y le **quita el envoltorio estatal**.

Diferencia clave con la hermana: aquí ISO 27001/27002:2022 es una **guía de controles, no un objetivo de certificación**. No hay Resolución 2277/2025 de MinTIC ni "entidad pública", ni el "Manual" obligatorio de 4 bloques, ni vinculación de contratistas del Estado, ni nube conforme a la SIC / Ley 1712 / aval de una Oficina de TI. Se conserva lo que a una empresa privada le **sirve de verdad** para no tener incidentes, adaptado a su stack y a su escala.

Se carga cuando hay que:
- redactar o revisar el **baseline/política de seguridad interna** del producto propio (no un manual de certificación);
- **endurecer autenticación, sesión y control de acceso** de un SaaS (login propio u OAuth/OIDC + MFA);
- decidir **qué datos van a `Preview`/dev** de Vercel y cómo se aíslan de producción;
- definir los **eventos de auditoría** que sí valen la pena registrar en un producto multi-tenant;
- **evaluar un proveedor cloud o un subcontratista** (Vercel, Neon/Supabase, freelancer) antes de darle acceso;
- cerrar la **revisión de seguridad** de una compuerta en un proyecto divergente (`seguridad-appsec` revisa; regla 1 del CLAUDE.md).

**Honestidad N0:** ningún proyecto divergente ha ejercitado aún este baseline. Los activos son **plantillas/pautas**, no rutas de proyecto real, y los gotchas están marcados **"sin verificar en proyecto propio (N0)"**.

## 2. Procedimiento

1. **Encuadra: ISO 27002:2022 como guía, no como auditoría.** Usa `activos/baseline-seguridad-divergente.md`, que mapea los **4 temas** de ISO 27002:2022 —Organizacional, Personas, Físico, Tecnológico— a controles concretos para una empresa pequeña, con una columna **"aplica / no aplica / diferido"** (Statement of Applicability *lite*). No sobre-diseñes: para 1-5 personas, la mayoría del peso cae en **Tecnológico** y en un puñado de controles Organizacional/Personas. No prometas "cumplimos ISO 27001" — no estás certificado; di "alineado a los controles de ISO 27002:2022 como guía".

2. **Autenticación y sesión: valores modernos, NO los del Estado.** Aplica `activos/politica-autenticacion-saas.md`. La hermana institucional impone valores heredados (8+ con composición, rotación 60 días, historial 10, SSO LDAP). En un SaaS propio eso es **contraproducente**: sigue el enfoque **largo-primero + verificación contra brechas + MFA** (alineado a NIST SP 800-63B):
   - Passphrase **≥12 caracteres**, sin reglas de composición forzadas, comparada contra un corpus de contraseñas filtradas (p. ej. la API *range* de Have I Been Pwned, que envía solo 5 caracteres del hash).
   - **Sin rotación periódica forzada**; se rota **solo** ante evidencia de compromiso.
   - Hash con **argon2id** (o bcrypt/scrypt) — nunca SHA/MD5 crudos, nunca en claro.
   - **MFA/TOTP** disponible para todo usuario y **obligatorio** para roles administrativos.
   - Sesión: token corto + *refresh* rotatorio, cookie `HttpOnly` `Secure` `SameSite`, y **rate-limit / bloqueo temporal** ante fuerza bruta en vez de un contador rígido de 5 intentos.
   - Los **secretos** (JWT, claves de proveedor, `DATABASE_URL`) NO viven en esta skill: van por `seg-gestion-secretos-keyvault` (línea privada = Vercel/GitHub env, `NEXT_PUBLIC_` solo para valores públicos).
   - Esta skill fija la **política** (los valores exigibles); el **código seguro** que la implementa (OWASP Top 10 / ASVS, autorización en el backend, validación de entrada) lo lleva la hermana `div-seg-desarrollo-seguro-owasp`. No dupliques su contenido: remite.

3. **Datos de prueba y entornos `Preview`.** Aplica `activos/checklist-datos-prueba-preview.md`. Criterio de decisión: **¿va un dump de producción a `Preview`/dev?** → **No**. Usa dataset sintético (`datos-dataset-sintetico-ponderado`) o un extracto anonimizado. Aísla: `Preview` de Vercel usa **otra base de datos / otro branch de datos** (branching de Neon/Supabase o una BD de staging), **nunca** las env vars de producción, y las URLs de `Preview` se protegen (deployment protection) para que no queden indexables y públicas.

4. **Auditoría: registra lo que importa, no todo.** Aplica `activos/eventos-auditoria-seguridad.md`. Registra en **log estructurado (JSON)** eventos de seguridad relevantes —login ok/fallido, MFA, cambios de rol, accesos administrativos a datos personales, exportaciones— con campos mínimos (timestamp, actor, tenant, acción, recurso, IP, resultado y un `hash`/encadenamiento para evidencia de no-alteración). **No** inundes el log con cada request. **Nunca** escribas en el log contraseñas, tokens, ni datos personales completos. Guárdalo separado de los datos de negocio y fija una retención.

5. **Proveedores cloud y subprocesadores.** Antes de mandar datos a un tercero (Vercel, Neon, Supabase, un proveedor de email/analytics), pasa `activos/checklist-proveedor-nube.md`: **DPA firmado**, región/residencia de datos declarada, **backups + PITR** habilitados y probados, SLA/uptime publicado, notificación de brechas contractual, **MFA activo en la cuenta del proveedor** y principio de mínimo privilegio en las claves. Esto reemplaza el bloque estatal de nube (SIC, Ley 1712, aval de la Oficina de TI): la privada evalúa por **contrato + higiene técnica**, no por norma pública.

6. **Subcontratistas / freelancers.** Usa `activos/nda-subcontratista.md`: un **NDA mutuo ligero** de derecho privado (no el acuerdo de 11 cláusulas transcrito de un procedimiento estatal). Si el tercero va a **tratar datos personales**, un NDA **no basta**: exige además un **acuerdo de tratamiento (DPA)** y remite a `seg-habeas-data-implementacion` para las obligaciones de la Ley 1581/2012 (que aplica a privados).

7. **Datos personales: aquí NO.** Enmascaramiento, consentimiento, derechos ARCO y retención de datos personales **no se cubren en esta skill**. Los lleva la skill universal `seg-habeas-data-implementacion` (Ley 1581/2012 aplica también a empresas privadas). Desde este baseline solo se **remite** a ella y se verifica que la compuerta la haya invocado cuando hay datos personales.

8. **Cierra contra el bloque 5 y deja evidencia.** La revisión de seguridad la valida `seguridad-appsec` / `qa-ingeniero`, nunca el constructor (reglas 1 y 5 del CLAUDE.md). Toda decisión no resuelta por estas pautas (p. ej. qué controles ISO se difieren, qué proveedor cloud se elige) se anota en la **tabla de decisiones abiertas del blueprint** y la cierra el Dueño — no la inventes.

## 3. Activos copiables

Todos en `activos/` de esta skill. Son **plantillas/pautas base (N0), sin verificar aún en proyecto propio**; llevan placeholders `<...>` / `${VAR}`, sin secretos ni rutas de proyecto real.

| Activo | Qué es | Cuándo copiarlo / qué adaptar |
|---|---|---|
| `activos/baseline-seguridad-divergente.md` | Baseline de seguridad por los 4 temas de ISO 27002:2022 con columna aplica/no aplica/diferido (SoA *lite*), pensado para empresa privada pequeña | Al redactar/revisar la política de seguridad interna del producto. Marcar qué controles aplican a la escala real; no prometer certificación. |
| `activos/politica-autenticacion-saas.md` | Política de autenticación moderna (largo-primero, breach-check, argon2id, MFA, sesión) alineada a NIST 800-63B | Como criterios de aceptación de login/sesión de un SaaS propio. Ajustar umbrales al riesgo del producto. |
| `activos/checklist-datos-prueba-preview.md` | Reglas para datos de prueba y aislamiento de `Preview`/dev de producción en Vercel + Postgres gestionado | Como DoD de cualquier tarea que toque datos entre entornos. Sustituir por el proveedor de BD real. |
| `activos/eventos-auditoria-seguridad.md` | Esquema base de eventos de auditoría de seguridad (JSON estructurado) para un SaaS multi-tenant, con campos y retención | Al definir el logging de seguridad. Adaptar a la BD/servicio de logs elegido; no meter PII ni secretos. |
| `activos/checklist-proveedor-nube.md` | Checklist de evaluación de proveedor cloud / subprocesador (DPA, región, backups+PITR, SLA, MFA, mínimo privilegio) | Antes de contratar/dar acceso a un proveedor (Vercel, Neon, Supabase, email/analytics). |
| `activos/nda-subcontratista.md` | NDA mutuo ligero de derecho privado para freelancers/subcontratistas + puntero a DPA cuando hay datos personales | Al vincular un tercero. Cambiar solo campos `<...>`; si trata datos personales, añadir DPA y remitir a `seg-habeas-data-implementacion`. |

Skills hermanas a las que esta remite (no dupliques su contenido aquí):
- `div-seg-desarrollo-seguro-owasp` (divergente) — el **código seguro** (OWASP Top 10/ASVS) que implementa esta política; esta skill fija el *qué* exigible, aquella el *cómo* en Node/Express/Next.
- `seg-gestion-secretos-keyvault` (universal) — dónde viven los secretos (Vercel/GitHub env; sin `.env` versionado).
- `seg-habeas-data-implementacion` (universal) — datos personales bajo Ley 1581/2012.
- `seg-sast-dast-dependencias` — gitleaks / escaneo de dependencias en CI.
- `datos-dataset-sintetico-ponderado` — datos sintéticos para `Preview`/dev.

## 4. Gotchas verificados

Riesgos **documentados de la práctica**, marcados honestamente como **"sin verificar en proyecto propio (N0)"**. Ascenderán a verificados al usarse en un proyecto divergente.

1. **Copiar la política de contraseñas del Estado a un SaaS (sin verificar en proyecto propio — N0).** Rotación forzada cada 60 días + reglas de composición + historial 10 es exactamente lo que **NIST 800-63B desaconseja**: empuja a los usuarios a contraseñas débiles y predecibles (`Empresa2026!`). En el producto propio: **largo-primero + verificación contra brechas + MFA**, rotación **solo** ante compromiso. No arrastres el valor institucional por inercia.

2. **Decir "cumplimos ISO 27001" sin estar certificado (sin verificar en proyecto propio — N0).** Usar los controles como guía **no** es certificación. Afirmarlo en un pitch o contrato es una representación falsa. Redacta siempre "alineado a los controles de ISO 27002:2022 como guía"; la certificación es un proceso auditado aparte.

3. **`NEXT_PUBLIC_` / clave `service_role` en el cliente (sin verificar en proyecto propio — N0).** Cualquier variable `NEXT_PUBLIC_*` queda **incrustada en el bundle del navegador** para siempre; publicar la `service_role` de Supabase (que **salta Row Level Security**) o una `DATABASE_URL` así es fuga total. En el front va **solo** la clave anónima/pública; las claves con privilegios viven en el servidor y por `seg-gestion-secretos-keyvault`.

4. **`Preview` de Vercel con datos o env de producción (sin verificar en proyecto propio — N0).** Es cómodo apuntar `Preview` a la BD real, pero cada PR abre una URL desplegada; si además la protección de despliegue está apagada, esa URL es pública e indexable y expone producción. `Preview` va contra **branch de datos / staging** y **sin** las env vars de producción.

5. **RLS apagado y backups/PITR sin habilitar en el Postgres gestionado (sin verificar en proyecto propio — N0).** En Supabase el Row Level Security viene **desactivado por defecto** en tablas nuevas: sin políticas, la clave anónima puede leer/escribir todo. Y en planes free el **PITR/backup** puede no estar activo. Verifica RLS por tabla y backups probados **antes** de tener datos reales, no después del incidente.

6. **Loggear PII, tokens o contraseñas "para depurar" (sin verificar en proyecto propio — N0).** Un log de auditoría que incluye el correo/teléfono completo, el JWT o el body del login convierte al sistema de logs en una segunda base de datos personales sin protección — y una fuga por logs es un incidente reportable (Ley 1581). Registra actor + acción + resultado; **enmascara o excluye** el dato personal y el secreto.

7. **Sin MFA en las cuentas del fundador (Vercel/GitHub/registrador de dominio) (sin verificar en proyecto propio — N0).** En un equipo de 1-3 personas, esas cuentas **son** la infraestructura: comprometer el GitHub o el registrador del dominio es *game over*, más grave que un bug en la app. MFA obligatorio en todas las cuentas de proveedor es el control de mayor retorno y suele quedar olvidado.

8. **Confundir un NDA con cobertura de datos personales (sin verificar en proyecto propio — N0).** Un NDA protege *secretos de negocio*, no habilita a un subcontratista a **tratar datos personales**. Si el freelancer toca datos de usuarios, hace falta un **DPA** (acuerdo de tratamiento) y las obligaciones de la Ley 1581 — remite a `seg-habeas-data-implementacion`. El NDA solo no cubre esa responsabilidad.

## 5. Criterios de done

- [ ] Existe un **baseline de seguridad** mapeado a los 4 temas de ISO 27002:2022 con marca aplica/no-aplica/diferido; en ningún lado se afirma certificación ISO 27001 no obtenida.
- [ ] Autenticación cumple la política moderna: passphrase ≥12 sin composición forzada, verificación contra brechas, **argon2id** (no SHA/MD5), **sin rotación periódica**, **MFA obligatorio para admin**, sesión con cookie `HttpOnly`/`Secure`/`SameSite` y rate-limit.
- [ ] Ningún secreto ni clave con privilegios vive en el cliente ni en `NEXT_PUBLIC_*`; los secretos se gestionan por `seg-gestion-secretos-keyvault`.
- [ ] `Preview`/dev no usa dump ni env de producción; corre con datos sintéticos/anonimizados y BD aislada; las URLs de `Preview` están protegidas.
- [ ] La auditoría registra solo eventos de seguridad relevantes, en log estructurado, **sin PII ni secretos**, separada de los datos de negocio y con retención definida.
- [ ] En el Postgres gestionado: **RLS verificado por tabla** (si aplica) y **backups + PITR** habilitados y con al menos una restauración probada.
- [ ] Todo proveedor cloud/subprocesador pasó `checklist-proveedor-nube.md` (DPA, región, backups, SLA, MFA, mínimo privilegio); toda cuenta de proveedor del equipo tiene MFA.
- [ ] Todo subcontratista tiene **NDA**; si trata datos personales, además **DPA** y se remitió a `seg-habeas-data-implementacion`.
- [ ] Los datos personales se cubren en `seg-habeas-data-implementacion` (esta skill solo remite); la compuerta la valida `seguridad-appsec`/`qa-ingeniero`, nunca el constructor.

## Registro de uso
| Fecha | Proyecto | Tarea | Resultado | Lección |
|---|---|---|---|---|
