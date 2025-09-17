-- Migration: Ensure user_id is set from auth.uid() on insert into ws_customers
-- Date: 2025-09-17

DO $$
DECLARE
  rec RECORD;
  trig_name text;
BEGIN
  FOR rec IN
    SELECT n.nspname AS schemaname, c.relname AS tablename
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE c.relkind = 'r'
      AND n.nspname IN ('public','app_ws')
      AND c.relname = 'ws_customers'
  LOOP
    trig_name := 'trg_ensure_ws_customers_user_id';

    EXECUTE 'CREATE OR REPLACE FUNCTION '
      || quote_ident(rec.schemaname) || '.ensure_ws_customers_user_id() '
      || 'RETURNS trigger LANGUAGE plpgsql AS '
      || quote_literal('BEGIN
  NEW.user_id := auth.uid();
  RETURN NEW;
END;')
      || ';';

    -- Drop existing trigger if any
    EXECUTE format('DROP TRIGGER IF EXISTS %I ON %I.%I;', trig_name, rec.schemaname, rec.tablename);

    -- Create BEFORE INSERT trigger to set user_id
    EXECUTE 'CREATE TRIGGER '
      || quote_ident(trig_name)
      || ' BEFORE INSERT ON '
      || quote_ident(rec.schemaname) || '.' || quote_ident(rec.tablename)
      || ' FOR EACH ROW EXECUTE FUNCTION '
      || quote_ident(rec.schemaname) || '.ensure_ws_customers_user_id();';
  END LOOP;
END $$ LANGUAGE plpgsql;
