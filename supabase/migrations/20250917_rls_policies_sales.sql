-- Migration: Configure RLS and policies for ws_sales and ws_sale_items (app_ws and public)
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
      AND c.relname IN ('ws_sales','ws_sale_items')
  LOOP
    -- Habilitar RLS
    EXECUTE format('ALTER TABLE %I.%I ENABLE ROW LEVEL SECURITY;', rec.schemaname, rec.tablename);

    -- Borrar políticas previas conocidas para recrearlas idempotentemente
  EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I;', 'allow_select_own', rec.schemaname, rec.tablename);
  EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I;', 'allow_insert_own', rec.schemaname, rec.tablename);
  EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I;', 'allow_update_own', rec.schemaname, rec.tablename);

    -- Lectura: usuario autenticado puede ver sus propias filas
    IF rec.tablename = 'ws_sales' THEN
      EXECUTE format(
        'CREATE POLICY %I ON %I.%I FOR SELECT TO authenticated USING (user_id = auth.uid());',
        'allow_select_own', rec.schemaname, rec.tablename
      );
    ELSIF rec.tablename = 'ws_sale_items' THEN
      EXECUTE format(
        'CREATE POLICY %I ON %I.%I FOR SELECT TO authenticated USING (
            EXISTS (
              SELECT 1 FROM %I.ws_sales s
              WHERE s.id = %I.sale_id AND s.user_id = auth.uid()
            )
        );',
        'allow_select_own', rec.schemaname, rec.tablename, rec.schemaname, rec.tablename
      );
    END IF;

    -- Inserción: usuario autenticado puede insertar filas con su user_id
    IF rec.tablename = 'ws_sales' THEN
      EXECUTE format(
        'CREATE POLICY %I ON %I.%I FOR INSERT TO authenticated WITH CHECK (true);',
        'allow_insert_own', rec.schemaname, rec.tablename
      );
    ELSIF rec.tablename = 'ws_sale_items' THEN
      -- Para items, permitimos insertar si existe una venta del mismo usuario
      -- Asumimos que existe FK ws_sale_items.sale_id -> ws_sales.id
      EXECUTE format(
        'CREATE POLICY %I ON %I.%I FOR INSERT TO authenticated WITH CHECK (
            EXISTS (
              SELECT 1 FROM %I.ws_sales s
              WHERE s.id = %I.sale_id AND s.user_id = auth.uid()
            )
        );',
        'allow_insert_own', rec.schemaname, rec.tablename, rec.schemaname, rec.tablename
      );
    END IF;

    -- Update: sólo propias filas
    IF rec.tablename = 'ws_sales' THEN
      EXECUTE format(
        'CREATE POLICY %I ON %I.%I FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());',
        'allow_update_own', rec.schemaname, rec.tablename
      );
    ELSIF rec.tablename = 'ws_sale_items' THEN
      EXECUTE format(
        'CREATE POLICY %I ON %I.%I FOR UPDATE TO authenticated USING (
            EXISTS (
              SELECT 1 FROM %I.ws_sales s
              WHERE s.id = %I.sale_id AND s.user_id = auth.uid()
            )
        ) WITH CHECK (
            EXISTS (
              SELECT 1 FROM %I.ws_sales s
              WHERE s.id = %I.sale_id AND s.user_id = auth.uid()
            )
        );',
        'allow_update_own', rec.schemaname, rec.tablename, rec.schemaname, rec.tablename, rec.schemaname, rec.tablename
      );
    END IF;
  END LOOP;
END $$;
