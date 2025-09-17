-- Fix default for ws_electronic_invoices.id to avoid NOT NULL violations on insert
-- Safe to run multiple times; sets default depending on id column type

DO $$
DECLARE
  col_type text;
  seq_name text := 'ws_electronic_invoices_id_seq';
  has_default boolean;
BEGIN
  SELECT data_type INTO col_type
  FROM information_schema.columns
  WHERE table_schema = 'public' AND table_name = 'ws_electronic_invoices' AND column_name = 'id';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Tabla public.ws_electronic_invoices o columna id no existe';
  END IF;

  SELECT pg_get_expr(adbin, adrelid) IS NOT NULL INTO has_default
  FROM pg_attrdef d
  JOIN pg_class c ON c.oid = d.adrelid
  JOIN pg_attribute a ON a.attrelid = c.oid AND a.attnum = d.adnum
  WHERE c.relname = 'ws_electronic_invoices' AND a.attname = 'id';

  IF has_default THEN
    RAISE NOTICE 'ws_electronic_invoices.id ya tiene default, no se cambia.';
    RETURN;
  END IF;

  IF col_type = 'uuid' THEN
    PERFORM 1 FROM pg_extension WHERE extname = 'pgcrypto';
    IF NOT FOUND THEN
      CREATE EXTENSION IF NOT EXISTS pgcrypto;
    END IF;
    EXECUTE 'ALTER TABLE public.ws_electronic_invoices ALTER COLUMN id SET DEFAULT gen_random_uuid()';
    RAISE NOTICE 'Default para ws_electronic_invoices.id (uuid) ajustado a gen_random_uuid().';
  ELSIF col_type IN ('integer','bigint') THEN
    PERFORM 1 FROM pg_class WHERE relkind = 'S' AND relname = seq_name;
    IF NOT FOUND THEN
      EXECUTE format('CREATE SEQUENCE %I', seq_name);
    END IF;
    EXECUTE format('ALTER TABLE public.ws_electronic_invoices ALTER COLUMN id SET DEFAULT nextval(%L)', seq_name);
    RAISE NOTICE 'Default para ws_electronic_invoices.id (entero) ajustado a nextval(seq).';
  ELSE
    RAISE WARNING 'Tipo de columna ws_electronic_invoices.id (%) no soportado automáticamente. Ajuste manual requerido.', col_type;
  END IF;
END$$;