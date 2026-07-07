# Baseline de seguridad — producto propio Divergente (plantilla N0)

> **Guía, no certificación.** Este documento usa los controles de **ISO/IEC 27002:2022** como
> lista de verificación para una empresa privada pequeña. No implica estar certificado en
> ISO/IEC 27001. Redacta hacia afuera como *"alineado a los controles de ISO 27002:2022"*.
>
> Escala objetivo: 1–10 personas, SaaS sobre Node/Next.js/Vercel/Postgres gestionado.
> Rellena la columna **Estado** con: `aplica` · `no aplica` · `diferido` (con fecha objetivo).
> Esto es tu *Statement of Applicability* ligero: la mayoría del peso está en el tema Tecnológico.

Empresa: `<Divergente / razón social>` · Responsable de seguridad: `<nombre>` · Versión: `<v0.1>` · Fecha: `<AAAA-MM-DD>`

---

## Tema A — Organizacional (ISO 27002:2022 cap. 5)

| # | Control | Qué significa en Divergente | Estado |
|---|---|---|---|
| A1 | Roles y responsabilidades de seguridad | Una persona nombrada como responsable (aunque sea a tiempo parcial). | |
| A2 | Política de seguridad de alto nivel | Este documento + política de autenticación. Revisión ≥ anual. | |
| A3 | Inventario de activos | Repos, dominios, cuentas de proveedor, bases de datos, datasets. Ver también inventario de secretos. | |
| A4 | Gestión de proveedores/subprocesadores | `checklist-proveedor-nube.md` firmado antes de dar acceso. | |
| A5 | Gestión de incidentes | Runbook mínimo: quién decide, cómo se comunica, cómo se rota un secreto comprometido. | |
| A6 | Clasificación de la información | Marcar qué datos son personales (→ `seg-habeas-data-implementacion`) y qué es secreto de negocio. | |
| A7 | Continuidad / respaldo | Backups + PITR del Postgres gestionado, probados. Ver `devops-backup-dr`. | |

## Tema B — Personas (ISO 27002:2022 cap. 6)

| # | Control | Qué significa en Divergente | Estado |
|---|---|---|---|
| B1 | Acuerdos de confidencialidad | NDA con todo freelancer/subcontratista (`nda-subcontratista.md`). | |
| B2 | Concienciación mínima | Phishing, MFA, gestión de contraseñas del equipo (gestor de contraseñas). | |
| B3 | Alta/baja de accesos | Al entrar/salir alguien: otorgar/revocar accesos y **rotar** secretos compartidos. | |

## Tema C — Físico (ISO 27002:2022 cap. 7)

| # | Control | Qué significa en Divergente | Estado |
|---|---|---|---|
| C1 | Equipos del equipo | Disco cifrado (BitLocker/FileVault), bloqueo automático, antivirus/actualizaciones. | |
| C2 | Trabajo remoto | Red doméstica/pública: nada de exponer BD local; VPN si aplica. | |
| C3 | Centro de datos | **Delegado en el proveedor cloud** (Vercel/Neon/Supabase). No gestionamos hardware → mayormente `no aplica`, se cubre por el DPA del proveedor. | |

## Tema D — Tecnológico (ISO 27002:2022 cap. 8) — aquí está el grueso

| # | Control | Qué significa en Divergente | Estado |
|---|---|---|---|
| D1 | Gestión de accesos y autenticación | `politica-autenticacion-saas.md` (largo-primero, argon2id, MFA). | |
| D2 | Gestión de secretos | Sin secretos en repo ni en `NEXT_PUBLIC_*`. Ver `seg-gestion-secretos-keyvault`. | |
| D3 | Cifrado en tránsito y reposo | TLS en todo endpoint; cifrado en reposo del proveedor de BD activo. | |
| D4 | Protección de datos de prueba | `checklist-datos-prueba-preview.md`: sin dump de producción en `Preview`/dev. | |
| D5 | Registro y monitoreo (auditoría) | `eventos-auditoria-seguridad.md`. Sin PII/secretos en logs. | |
| D6 | Desarrollo seguro | Validación de entrada, control de acceso por objeto, OWASP Top 10 al codificar. | |
| D7 | Gestión de vulnerabilidades | gitleaks + escaneo de dependencias en CI. Ver `seg-sast-dast-dependencias`. | |
| D8 | Separación de entornos | `Production` / `Preview` / `Development` con datos y credenciales distintos. | |
| D9 | Copias de seguridad | Backups + PITR probados con restauración. Ver `devops-backup-dr`. | |
| D10 | Aislamiento multi-tenant | RLS por tabla (Postgres/Supabase) o filtro por `tenant_id` verificado en el servidor. | |

---

## Cómo usar esta plantilla
1. Rellena **Estado** por fila; lo que marques `diferido` va con fecha objetivo a la tabla de decisiones abiertas del blueprint.
2. Lo `no aplica` se justifica en una línea (ej.: C3 delegado en el proveedor).
3. Revisión al menos anual y al cambiar de stack o de proveedor.
4. **No** cubras datos personales aquí: remite a `seg-habeas-data-implementacion`.
