-- Fix default for ws_sale_items.id to avoid NOT NULL violations on insert
-- This script is safe to run multiple times.
-- It detects the column type of ws_sale_items.id and sets a suitable default:
-- - If type is uuid: sets default gen_random_uuid() (requires pgcrypto or pg 13+)
-- - If type is integer/bigint: creates/uses a sequence and sets nextval(...) as default
--
-- Note: Requires superuser or appropriate privileges.

DO $$
DECLARE
  col_type text;
  seq_name text := 'ws_sale_items_id_seq';
  has_default boolean;
BEGIN
  SELECT data_type INTO col_type
  FROM information_schema.columns
  WHERE table_schema = 'public' AND table_name = 'ws_sale_items' AND column_name = 'id';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Tabla public.ws_sale_items o columna id no existe';
  END IF;

  SELECT pg_get_expr(adbin, adrelid) IS NOT NULL INTO has_default
  FROM pg_attrdef d
  JOIN pg_class c ON c.oid = d.adrelid
  JOIN pg_attribute a ON a.attrelid = c.oid AND a.attnum = d.adnum
  WHERE c.relname = 'ws_sale_items' AND a.attname = 'id';

  IF has_default THEN
    RAISE NOTICE 'ws_sale_items.id ya tiene default, no se cambia.';
    RETURN;
  END IF;

  IF col_type = 'uuid' THEN
    -- Ensure pgcrypto available for gen_random_uuid
    PERFORM 1 FROM pg_extension WHERE extname = 'pgcrypto';
    IF NOT FOUND THEN
      CREATE EXTENSION IF NOT EXISTS pgcrypto;
    END IF;
    EXECUTE 'ALTER TABLE public.ws_sale_items ALTER COLUMN id SET DEFAULT gen_random_uuid()';
    RAISE NOTICE 'Default para ws_sale_items.id (uuid) ajustado a gen_random_uuid().';
  ELSIF col_type IN ('integer','bigint') THEN
    -- Create sequence if missing
    PERFORM 1 FROM pg_class WHERE relkind = 'S' AND relname = seq_name;
    IF NOT FOUND THEN
      EXECUTE format('CREATE SEQUENCE %I', seq_name);
    END IF;
    EXECUTE format('ALTER TABLE public.ws_sale_items ALTER COLUMN id SET DEFAULT nextval(%L)', seq_name);
    RAISE NOTICE 'Default para ws_sale_items.id (entero) ajustado a nextval(seq).';
  ELSE
    RAISE WARNING 'Tipo de columna ws_sale_items.id (%) no soportado automáticamente. Ajuste manual requerido.', col_type;
  END IF;
END$$;