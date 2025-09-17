-- Migration: Grant privileges for ws_customers (table + public view) to authenticated role
-- Date: 2025-09-17

DO $$
DECLARE
  rec RECORD;
BEGIN
  -- Ensure the 'authenticated' role has USAGE on schemas
  IF EXISTS (SELECT 1 FROM pg_namespace WHERE nspname = 'public') THEN
    EXECUTE 'GRANT USAGE ON SCHEMA public TO authenticated';
  END IF;
  IF EXISTS (SELECT 1 FROM pg_namespace WHERE nspname = 'app_ws') THEN
    EXECUTE 'GRANT USAGE ON SCHEMA app_ws TO authenticated';
  END IF;

  -- Grant on the underlying table if present
  FOR rec IN
    SELECT n.nspname AS schemaname, c.relname AS relname, c.relkind
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname IN ('public','app_ws')
      AND c.relname = 'ws_customers'
      AND c.relkind IN ('r','v')
  LOOP
    EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON %I.%I TO authenticated;', rec.schemaname, rec.relname);
  END LOOP;
END $$;
