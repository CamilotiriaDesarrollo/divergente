# Baseline de una BD existente y convención de versionado

Guía para **adoptar una herramienta de migraciones sobre una BD que ya existe** con scripts
T-SQL versionados a mano (el estado actual del portafolio: ver skill
`datos-sqlserver-convenciones-y-scripts-versionados`). El error clásico es apuntar la herramienta
a una BD poblada y que intente re-crear todo: hay que **baselinear** primero.

## 1. Puente desde la convención actual `VAAAAMMDD_NN__descripcion.sql`

La convención ya usada en el portafolio (p. ej. `V20260519_01__maestras_estaticas.sql`) es casi
Flyway-nativa. Flyway parsea la versión entre `V` y `__`, y trata el `_` interno como separador
decimal: `V20260519_01__x.sql` → versión `20260519.01`. En la práctica esto significa que los
scripts existentes pueden **moverse tal cual** a `db/migrations/` y Flyway los ordena bien.
> Verifícalo SIEMPRE con `flyway info` sobre tus scripts reales antes de confiar en el orden;
> el comportamiento del separador depende de la versión de Flyway instalada.

Diferencia clave de mentalidad al pasar a una herramienta gestionada:
- **Antes:** cada script era idempotente (`IF OBJECT_ID... IS NULL`) porque se re-ejecutaban todos.
- **Ahora:** la herramienta lleva un historial (`flyway_schema_history` / `__EFMigrationsHistory`)
  y aplica cada migración **una sola vez**. Las nuevas migraciones **forward-only** ya no necesitan
  guardas defensivas (aunque mantenerlas no estorba). Un script aplicado **nunca se edita**: se corrige
  con una migración nueva (editar uno ya aplicado rompe el checksum y `flyway validate` falla).

## 2. Baseline con Flyway (BD ya poblada)

```bash
# 1) La BD existe y tiene objetos, pero no hay historial de Flyway.
# 2) Marca el estado actual como baseline (no re-crea nada):
flyway -configFiles=db/flyway.conf -baselineVersion=20260519 -baselineDescription="estado_actual" baseline
# 3) A partir de aquí, SOLO las migraciones con versión > baseline se aplican:
flyway -configFiles=db/flyway.conf info      # revisa qué queda "Pending"
flyway -configFiles=db/flyway.conf migrate
```
Alternativa automática en CI/CD: `baselineOnMigrate=true` + `baselineVersion=<...>` (ya viene en
`flyway.conf` y en los workflows). Útil cuando staging/prod se crearon a mano y CI corre por primera vez.

## 3. Baseline con EF Core (BD ya poblada, modelo EF como fuente de verdad)

```powershell
# Genera la primera migración a partir del modelo actual...
dotnet ef migrations add Baseline --project <Data> --startup-project <Api> --context <Ctx>
# ...y márcala como YA aplicada sin ejecutar el DDL (la BD ya tiene esos objetos):
dotnet ef migrations script 0 Baseline --idempotent   # revisa el SQL
# EF Core no tiene un comando "marcar como aplicada": inserta la fila en __EFMigrationsHistory a mano
# (MigrationId + ProductVersion) SIN ejecutar el DDL, porque la BD ya tiene esos objetos.
# Lo más seguro: validar el idempotent script en un entorno limpio y en prod solo registrar el baseline.
```
> El baseline de EF sobre una BD existente es delicado (riesgo de drift modelo↔BD). Si la BD nació
> de scripts a mano, suele ser MÁS limpio adoptar **Flyway** (o **DbUp**) que forzar EF a "adoptar"
> un esquema que no generó.

## 4. Elección rápida de herramienta

| Contexto del proyecto | Herramienta sugerida | Por qué |
|---|---|---|
| .NET + SQL Server, ya con scripts T-SQL a mano | **Flyway** o **DbUp** | Reusan los `.sql` existentes; mínimo reescribir; respetan M-GSI-002 |
| .NET + SQL Server, modelo EF Core es la verdad | **EF Core Migrations** | Migración deriva del modelo; genera script idempotente + bundle |
| Node/Express + Postgres/MySQL (línea privada) | **node-pg-migrate / Knex / Prisma Migrate** | Nativas al runtime del backend |
| Python (datos) + SQLAlchemy | **Alembic** | Estándar del ecosistema Python |
| Necesitas una sola herramienta para varios motores | **Flyway** | CLI agnóstica, portable GitHub↔GitLab |

En todos los casos: forward-only, un script = una migración inmutable, historial en la BD,
rollback probado en staging antes de tocar producción.
