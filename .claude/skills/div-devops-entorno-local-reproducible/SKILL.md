---
name: div-devops-entorno-local-reproducible
regimen: divergente
description: Monta un entorno local reproducible para la LÍNEA PRIVADA de Divergente — Postgres en Docker (docker-compose, puerto no estándar), esquema y seeds idempotentes aplicados en orden con psql -v ON_ERROR_STOP=1, variables en .env y arranque multiproceso (Postgres + API Node + Vite/Next) con un Iniciar-*.ps1. Cárgala cuando haya que dejar a una persona nueva corriendo el producto propio en ~30 min, escribir un docker-compose de Postgres local, un runner de seeds/migraciones idempotentes, un Iniciar-*.ps1, o resolver fallos de psql / puerto 5432 ocupado / CORS al levantar el stack.
---

# DevOps: entorno local reproducible (línea privada Divergente)

**Nivel actual:** N0 · **Dominio:** devops · **Agente(s):** `devops-plataforma`, `datos-bd`
**Proyectos fuente:** ninguno — creada desde buenas prácticas (hermana divergente de `devops-entorno-local-sqlserver-reproducible`)

> Criterio de ascenso a N1: los 5 bloques completos, con activos copiables de ruta real y gotchas verificados (no genéricos). A N2: ≥1 uso real aceptado por el Dueño. A N3: ≥3 usos exitosos en ≥2 proyectos + checklist propio.

## 1. Propósito

Dejar un stack del **producto propio de Divergente** (frontend Vite/React o Next.js + API Node/Express + Postgres) **clonar-y-correr** en la máquina de cualquiera del equipo, con datos sembrados y sin pasos manuales frágiles. Meta explícita: **una persona nueva clona el repo y lo tiene corriendo en ~30 min** (más agresiva que la hermana institucional, porque el stack es más liviano y homogéneo). Se carga cuando hay que:

- Escribir el script de arranque (`Iniciar-*.ps1`) que levanta BD + API + frontend en ventanas separadas.
- Versionar el esquema y los datos como scripts SQL idempotentes ejecutados **en orden**.
- Montar Postgres local en Docker con `docker-compose` y un runner de seeds.
- Coordinar seeds que dependen de datos creados por la app (p. ej. usuarios de bootstrap) con el primer arranque de la API.
- Diagnosticar los fallos típicos del primer arranque (puerto 5432 ocupado, `psql` que sigue tras un error, CRLF en los `.sh`, CORS de Vite).

**Diferencia de régimen (esto NO es la hermana institucional).** Aquí **no** hay SQL Server, LocalDB, `sqlcmd`, Azure SQL Edge, `Integrated Security`, ni encuadre de entidad pública / estándar de codificación de gobierno. El motor es **Postgres** (misma imagen que producción, para paridad dev/prod) y la herramienta es **`psql`**; el respaldo/volcado es **`pg_dump`**. Regla de dominio: para **datos reales** siempre Postgres en Docker; para **tests**, una BD Postgres efímera (contenedor desechable o esquema temporal / Testcontainers) con el **mismo motor**, nunca un motor distinto "más fácil" que rompa la paridad.

Hermanas divergentes que suelen cargarse junto a esta: `back-api-express-typescript-minima` (la API), `devops-monorepo-client-server-vercel` (estructura del repo), `devops-docker-aplicaciones` (contenerizar la app, no solo la BD) y `div-devops-release-liviano-rollback` (cuando el mismo esquema pasa a producción). Para graduar los seeds/DDL a un historial de migraciones auditable, ver `datos-migraciones-gestionadas` (node-pg-migrate / Prisma Migrate / Drizzle / Flyway).

## 2. Procedimiento

**Decisión inicial — ¿cuántos procesos?**
- **Vite + React (SPA) + API Express aparte** → 3 procesos: Postgres, API (`:3000`), Vite (`:5173`). El frontend habla con la API por el proxy `/api`.
- **Next.js (App Router) con Route Handlers / Server Actions** → 2 procesos: Postgres + Next (`:3000`). No hay `server/` aparte ni CORS (mismo origen); Next lee `DATABASE_URL` directo. Si Next consume una API Express independiente, vuelve al caso de 3 procesos.

**Ruta Docker (por defecto — multiplataforma: Windows, macOS Intel/ARM, Linux):**

1. **Crear el `.env`** desde `.env.example` (activo). Define `POSTGRES_USER/PASSWORD/DB`, `POSTGRES_PORT=5433` y la `DATABASE_URL` única que consumen API, runner y herramientas de migración.
2. **Levantar Postgres**: `docker compose -f docker-compose.local.yml up -d`. Postgres 16 queda en `127.0.0.1:5433` (puerto **no estándar** en el host para no chocar con un Postgres del sistema en 5432), con volumen persistente y `healthcheck` vía `pg_isready`.
3. **Esperar a que acepte conexiones DESDE EL HOST** (no basta el healthcheck del contenedor): `pg_isready -h 127.0.0.1 -p 5433` o un wait-loop (el `Iniciar-*.ps1` usa `Test-NetConnection`).
4. **Aplicar esquema + seeds EN ORDEN** con el runner (`seed-local-db.sh` en bash, `seed-local-db.ps1` en Windows). Cada archivo se aplica con **`psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -1 -f archivo.sql`** — `ON_ERROR_STOP=1` es el equivalente Postgres del `sqlcmd -b`: corta al primer error en vez de seguir a ciegas; `-1` envuelve cada archivo en una transacción.
5. **Arrancar la plataforma** con `Iniciar-Divergente.ps1` (activo): hace 0-4 (up + espera + seeds) y luego abre API y front en ventanas nuevas con `Start-Process`. La primera vez, si hay un seed que depende de usuarios que crea la app, ese seed se corre **después** del primer arranque (ver gotcha 3).

**Ruta Postgres nativo (opcional, sin Docker):** si el equipo ya tiene Postgres instalado, se omite el paso 2 y se apunta `DATABASE_URL` a esa instancia (`createdb divergente_local`). Docker sigue siendo la ruta recomendada porque garantiza **la misma versión de motor que producción**.

**Convención de scripts SQL (obligatoria).** Nombre `NN__descripcion.sql` (o `VAAAAMMDD_NN__descripcion.sql` si el proyecto quiere fecha), ejecución en **orden lexicográfico**, separados en `db/schema/` (DDL), `db/seed/` (datos base) y `db/migrations/` (cambios evolutivos). **Todos idempotentes** — patrones Postgres (ver activo `00__ejemplo_idempotente.sql`):
- Tablas → `CREATE TABLE IF NOT EXISTS`; columnas → `ALTER TABLE ... ADD COLUMN IF NOT EXISTS`; índices → `CREATE INDEX IF NOT EXISTS`.
- Tipos `ENUM` y constraints con nombre (no tienen `IF NOT EXISTS`) → bloque `DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_type / pg_constraint WHERE ...) THEN ... END IF; END $$;`.
- Datos maestros → `INSERT ... ON CONFLICT (clave) DO NOTHING/UPDATE` (el UPSERT reemplaza al `MERGE` de T-SQL).
- Objetivo: re-ejecutar el runner completo cuantas veces haga falta sin romper nada ni duplicar filas.

**Frontend sin CORS.** En la ruta Vite, dejar `VITE_API_BASE_URL` vacío para que las llamadas pasen por el proxy de Vite (`/api → :3000`); así funciona en cualquier puerto que Vite anuncie (5173/5175) sin hardcodear el puerto en el cliente. En la ruta Next, no hay CORS porque las Route Handlers viven en el mismo origen.

## 3. Activos copiables

Todos en `.claude/skills/div-devops-entorno-local-reproducible/activos/`. Son **plantillas N0**, no copias de un proyecto real (ningún proyecto divergente las ha ejercitado aún). La contraseña de ejemplo es `CAMBIA_ESTA_CLAVE_Local1!`: define `POSTGRES_PASSWORD` en tu `.env` antes de usarlos.

- **`docker-compose.local.yml`** — Postgres 16 (`postgres:16-alpine`, corre nativo en x86_64 y ARM) en puerto no estándar `127.0.0.1:5433`, volumen persistente `divergente_pgdata` y `healthcheck` con `pg_isready`. **Adaptar:** nombre del contenedor/volumen, versión de Postgres, y las variables si no usas `.env`.
- **`.env.example`** — plantilla de variables (`POSTGRES_*`, `DATABASE_URL`, `PORT`, `CLIENT_URL`, `NODE_ENV`). **Adaptar:** renombrar a `.env`, cambiar credenciales, y en Next.js quitar `CLIENT_URL`/`PORT` de API si no hay server aparte.
- **`seed-local-db.sh`** — runner bash que carga `.env`, aplica `db/schema/*.sql` y `db/seed/*.sql` en orden con `psql -v ON_ERROR_STOP=1 -1`. **Adaptar:** la variable `DB_DIR` si tu carpeta base no es `db/`.
- **`seed-local-db.ps1`** — mismo runner para Windows sin bash (carga `.env`, ordena por nombre, corta si `psql` devuelve error). **Adaptar:** igual que el `.sh`.
- **`Iniciar-Divergente.ps1`** — arranque multiproceso en Windows: `docker compose up` → espera a Postgres en el host (`Test-NetConnection`) → corre el runner → abre API y front en ventanas nuevas con `Start-Process`. **Adaptar:** rutas de `server/` y `client/`, y si usas Next con Route Handlers, borrar el paso de la API.
- **`00__ejemplo_idempotente.sql`** — plantilla con los 6 patrones idempotentes de Postgres (tabla, columna, índice, `ENUM` vía `DO`, constraint vía `pg_constraint`, `UPSERT` con `ON CONFLICT`). Úsalo como referencia al escribir cualquier `schema/` o `seed/`.

## 4. Gotchas verificados

> **Honestidad N0:** ningún proyecto divergente ha ejercitado esta skill todavía. Los ítems siguientes son **riesgos documentados de la práctica (Postgres/Docker), sin verificar en proyecto propio** — hay que confirmarlos y datar la evidencia en el primer uso real.

1. **Puerto 5432 ocupado por un Postgres del sistema.** Si el desarrollador ya tiene Postgres instalado, el contenedor no podrá mapear 5432 o las conexiones irán a la instancia equivocada. Solución de la plantilla: publicar el contenedor en `127.0.0.1:5433` y usar ese puerto en `DATABASE_URL`. *(sin verificar en proyecto propio)*
2. **`psql` sin `ON_ERROR_STOP` sigue tras un error.** Por defecto `psql` reporta el error pero continúa con las siguientes sentencias, dejando la BD a medio sembrar sin fallar el script. Solución: **`-v ON_ERROR_STOP=1`** en cada invocación (equivalente al `-b` de `sqlcmd`); `-1` para transacción por archivo. *(sin verificar en proyecto propio)*
3. **Seeds que dependen de datos creados por la app.** Igual que en la hermana institucional (donde el seed `07` referenciaba usuarios del bootstrap), un seed que referencia usuarios/roles que crea la API al arrancar debe correr **después** del primer arranque, no antes. Documentar el orden en el README/arranque y no meter ese seed en la corrida inicial del runner. *(sin verificar en proyecto propio)*
4. **CRLF en los scripts `.sh` al editarlos en Windows.** Un `seed-local-db.sh` guardado con finales de línea CRLF falla en bash con errores crípticos (`$'\r': command not found`). Solución: `.gitattributes` con `*.sh text eol=lf`, o usar el runner `.ps1` en Windows. *(sin verificar en proyecto propio)*
5. **El volumen persistente conserva datos viejos.** `docker compose up` reutiliza `divergente_pgdata`, así que un cambio de esquema mal hecho o un "quiero empezar limpio" NO se resuelven reiniciando el contenedor. Hay que `docker compose down -v` — que **borra los datos**. Por eso los scripts deben ser idempotentes: no depender de una BD virgen. *(sin verificar en proyecto propio)*
6. **El healthcheck del contenedor ≠ conexión lista desde el host.** En Docker Desktop (Windows/WSL2, macOS) el `pg_isready` interno puede pasar antes de que el puerto mapeado conteste en `127.0.0.1`. Esperar con `pg_isready -h 127.0.0.1 -p 5433` o `Test-NetConnection` desde el host antes de correr el runner (el `Iniciar-*.ps1` ya lo hace). *(sin verificar en proyecto propio)*
7. **Secretos en `.env`.** No commitear `.env`; versionar solo `.env.example`. El `POSTGRES_PASSWORD` de la plantilla es de **desarrollo local**: rotarlo antes de cualquier ambiente compartido, y nunca reusar esa cadena en Vercel/producción. *(riesgo estándar; aplicar siempre)*
8. **`psql -f` no lleva historial de migraciones.** El runner aplica archivos idempotentes, pero no registra "qué migración ya corrió" como una herramienta gestionada. Sirve para el entorno local; para el ciclo de vida del producto (varios entornos, rollback), graduar a node-pg-migrate / Prisma Migrate / Drizzle / Flyway (skill `datos-migraciones-gestionadas`). *(sin verificar en proyecto propio)*

## 5. Criterios de done

- [ ] Un clon limpio corre con **un** script de arranque (`Iniciar-*.ps1`) y el front muestra datos (no vacío) tras sembrar, en **≤ ~30 min** para alguien nuevo.
- [ ] Todos los scripts SQL son **idempotentes**: re-ejecutar el runner completo dos veces seguidas no produce errores ni duplicados (probado, no asumido).
- [ ] El esquema y los seeds se ejecutan **en orden** con `psql -v ON_ERROR_STOP=1`; el orden y las dependencias (seed que necesita el bootstrap de la app) están documentados en el README/arranque.
- [ ] Postgres corre en la **misma versión mayor que producción** (paridad dev/prod); publicado en `127.0.0.1:5433` para no chocar con un Postgres del sistema.
- [ ] Ningún `.env`, secreto o contraseña real está commiteado; solo `.env.example`. La `DATABASE_URL` sale de variables de entorno.
- [ ] Existe el path de **reset limpio** documentado (`docker compose down -v`) y el equipo entiende que borra datos.
- [ ] Las notas de troubleshooting resueltas (puerto 5432, `ON_ERROR_STOP`, CRLF, espera de host) quedan escritas para quien monte el entorno en otra máquina.
- [ ] (Cuando aplique) el salto a herramienta de migraciones gestionada está anotado como próximo paso, no improvisado.

## Registro de uso
| Fecha | Proyecto | Tarea | Resultado | Lección |
|---|---|---|---|---|
