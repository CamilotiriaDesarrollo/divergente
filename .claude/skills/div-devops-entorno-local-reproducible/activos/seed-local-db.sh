#!/usr/bin/env bash
# Runner idempotente de esquema + seeds para Postgres local (línea privada Divergente).
# Plantilla N0 — hermana divergente del runner de SQL Server (sqlcmd -b).
# Aplica db/schema/*.sql y db/seed/*.sql en orden lexicográfico.
#
# Uso:      ./seed-local-db.sh
# Requiere: psql en el PATH y DATABASE_URL en el entorno (o POSTGRES_* en .env).
set -euo pipefail

# Carga .env si existe (para tener DATABASE_URL sin exportarla a mano).
if [ -f ".env" ]; then
  set -a; . ./.env; set +a
fi

: "${DATABASE_URL:?Define DATABASE_URL (o POSTGRES_* en .env) antes de correr el runner}"

DB_DIR="${DB_DIR:-db}"          # carpeta base con schema/ seed/ migrations/
SCHEMA_DIR="$DB_DIR/schema"
SEED_DIR="$DB_DIR/seed"

# ON_ERROR_STOP=1 es el equivalente Postgres del `sqlcmd -b`: corta al primer
# error en vez de seguir a ciegas. -1 envuelve cada archivo en UNA transacción.
run_sql() {
  echo ">> aplicando $1"
  psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -1 -q -f "$1"
}

apply_dir() {
  local dir="$1"
  [ -d "$dir" ] || { echo ">> (sin carpeta $dir, se omite)"; return 0; }
  # Los nombres NN__descripcion.sql garantizan el orden por sort lexicográfico.
  for f in "$dir"/*.sql; do
    [ -e "$f" ] || continue
    run_sql "$f"
  done
}

echo "== Esquema =="
apply_dir "$SCHEMA_DIR"
echo "== Seeds =="
apply_dir "$SEED_DIR"
echo "OK — esquema y seeds aplicados. Re-ejecutable: los scripts son idempotentes."
