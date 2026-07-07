-- Patrones idempotentes en Postgres (línea privada Divergente).
-- Hermana divergente del ejemplo T-SQL (IF OBJECT_ID / MERGE / sp_rename + COL_LENGTH).
-- Regla dura: re-ejecutar el runner completo N veces NO debe romper ni duplicar nada.

-- 1) Tabla: crear solo si no existe.
CREATE TABLE IF NOT EXISTS usuarios (
  id         bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  email      text        NOT NULL UNIQUE,
  nombre     text        NOT NULL,
  creado_en  timestamptz NOT NULL DEFAULT now()
);

-- 2) Columna nueva: idempotente con IF NOT EXISTS (Postgres 9.6+).
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS rol text NOT NULL DEFAULT 'lector';

-- 3) Índice: idempotente nativo.
CREATE INDEX IF NOT EXISTS ix_usuarios_rol ON usuarios (rol);

-- 4) Tipo enumerado: Postgres NO tiene "CREATE TYPE IF NOT EXISTS"; se envuelve
--    en un bloque DO que consulta el catálogo antes de crearlo.
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'estado_publicacion') THEN
    CREATE TYPE estado_publicacion AS ENUM ('borrador', 'en_revision', 'publicado');
  END IF;
END $$;

-- 5) Constraint con nombre: tampoco hay IF NOT EXISTS; chequear pg_constraint.
--    (Este es el reemplazo del truco T-SQL de soltar el CHECK antes de sp_rename.)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ck_usuarios_rol') THEN
    ALTER TABLE usuarios
      ADD CONSTRAINT ck_usuarios_rol CHECK (rol IN ('lector', 'editor', 'admin'));
  END IF;
END $$;

-- 6) Datos maestros: UPSERT idempotente. ON CONFLICT reemplaza al MERGE de T-SQL.
--    Requiere el UNIQUE de la columna de conflicto (email).
INSERT INTO usuarios (email, nombre, rol) VALUES
  ('admin@divergente.local',  'Admin Local',  'admin'),
  ('editor@divergente.local', 'Editor Local', 'editor')
ON CONFLICT (email) DO UPDATE
  SET nombre = EXCLUDED.nombre,
      rol    = EXCLUDED.rol;
