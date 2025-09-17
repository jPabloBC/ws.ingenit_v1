-- Migration: Configure RLS and policies for ws_customers (app_ws and public)
-- Date: 2025-09-17

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
      AND c.relname = 'ws_customers'
  LOOP
    -- Enable RLS
    EXECUTE format('ALTER TABLE %I.%I ENABLE ROW LEVEL SECURITY;', rec.schemaname, rec.tablename);

    -- Drop old policies idempotently
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I;', 'allow_select_own', rec.schemaname, rec.tablename);
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I;', 'allow_insert_own', rec.schemaname, rec.tablename);
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I;', 'allow_update_own', rec.schemaname, rec.tablename);

    -- SELECT own
    EXECUTE format(
      'CREATE POLICY %I ON %I.%I FOR SELECT TO authenticated USING (user_id = auth.uid());',
      'allow_select_own', rec.schemaname, rec.tablename
    );

    -- INSERT own (trigger will set user_id)
    EXECUTE format(
      'CREATE POLICY %I ON %I.%I FOR INSERT TO authenticated WITH CHECK (true);',
      'allow_insert_own', rec.schemaname, rec.tablename
    );

    -- UPDATE own
    EXECUTE format(
      'CREATE POLICY %I ON %I.%I FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());',
      'allow_update_own', rec.schemaname, rec.tablename
    );
  END LOOP;
END $$;
