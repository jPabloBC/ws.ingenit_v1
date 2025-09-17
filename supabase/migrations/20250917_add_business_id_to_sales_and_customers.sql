-- Migration: Add business_id to ws_sales and ws_customers (supporting public and app_ws schemas)
-- Date: 2025-09-17
-- Notes:
-- - Idempotente: usa IF EXISTS/IF NOT EXISTS para evitar fallos si no existen tablas/columnas.
-- - No realiza backfill. Los valores existentes quedarán NULL hasta que la app los actualice.
-- - Intenta crear FK a ws_businesses(id) si la tabla existe en el mismo esquema.
-- - Crea índices para acelerar consultas por business_id.

-- Helper: agrega columna business_id (uuid) si la tabla existe y no tiene la columna
DO $$
DECLARE
  rec RECORD;
BEGIN
  FOR rec IN
    SELECT n.nspname AS schemaname, c.relname AS tablename
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE c.relkind = 'r'
      AND n.nspname IN ('public','app_ws')
      AND c.relname IN ('ws_sales','ws_customers')
  LOOP
    -- Agregar columna si no existe
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = rec.schemaname
        AND table_name = rec.tablename
        AND column_name = 'business_id'
    ) THEN
      EXECUTE format('ALTER TABLE %I.%I ADD COLUMN business_id uuid;', rec.schemaname, rec.tablename);
    END IF;

    -- Crear índice si no existe
    EXECUTE format('CREATE INDEX IF NOT EXISTS %I ON %I.%I (business_id);',
                   'idx_' || rec.tablename || '_business_id', rec.schemaname, rec.tablename);

    -- Intentar crear FK si existe ws_businesses en el mismo esquema con columna id
    IF EXISTS (
      SELECT 1 FROM information_schema.tables
      WHERE table_schema = rec.schemaname AND table_name = 'ws_businesses'
    ) AND EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = rec.schemaname AND table_name = 'ws_businesses' AND column_name = 'id'
    ) THEN
      -- Crear la restricción si no existe
      BEGIN
        EXECUTE format(
          'ALTER TABLE %I.%I
             ADD CONSTRAINT %I FOREIGN KEY (business_id)
             REFERENCES %I.%I(id) ON UPDATE CASCADE ON DELETE SET NULL;',
          rec.schemaname, rec.tablename,
          rec.tablename || '_business_id_fkey',
          rec.schemaname, 'ws_businesses'
        );
      EXCEPTION WHEN duplicate_object THEN
        -- Ya existe la FK, ignorar
        NULL;
      END;
    END IF;
  END LOOP;
END $$;

-- Si existen VIEWS públicas que exponen estas tablas, no las recreamos automáticamente
-- para no romper dependencias. Si necesitas exponer business_id en las views públicas,
-- crea una migración específica con CREATE OR REPLACE VIEW incluyendo business_id.
