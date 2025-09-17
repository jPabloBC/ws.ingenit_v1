-- Migration: Grant privileges for ws_sales and ws_sale_items to authenticated role
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

  -- Grant DML privileges on tables/views involved in sales
  FOR rec IN
    SELECT n.nspname AS schemaname, c.relname AS tablename, c.relkind
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE c.relkind IN ('r','v')
      AND n.nspname IN ('public','app_ws')
      AND c.relname IN ('ws_sales','ws_sale_items')
  LOOP
    EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON %I.%I TO authenticated;', rec.schemaname, rec.tablename);
  END LOOP;
END $$;
