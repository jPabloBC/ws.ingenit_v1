-- migrate-legacy-business-id.sql
-- Asigna business_id a datos "legacy" (business_id IS NULL) en ws_products, ws_sales y ws_customers.
-- Uso rápido (elige UNA opción):
--   Opción A) Define business_name (exacto) y deja target_business_id = NULL
--   Opción B) Define target_business_id con el UUID de ws_businesses.id
--   Opción C) Si sólo existe 1 negocio en ws_businesses y use_first_if_single = true, se usará ese automáticamente
-- Luego:
--   • Ejecuta primero con dry_run=true (por defecto) para ver conteos y crear backups
--   • Cambia a dry_run=false para aplicar los cambios

DO $$
DECLARE
  -- Configuración: define UNA de estas opciones
  target_business_id uuid := NULL;             -- Opción B: UUID del negocio (ws_businesses.id)
  business_name text := NULL;                  -- Opción A: nombre exacto del negocio
  use_first_if_single boolean := true;         -- Opción C: si sólo hay 1 negocio, úsalo automáticamente

  -- Flags
  dry_run boolean := true; -- true = sólo muestra conteos; false = aplica cambios

  -- Vars internas
  ts_suffix text := to_char(now(), 'YYYYMMDD_HH24MISS');
  total_businesses int := 0;
  exists_business int := 0;
  before_products int;
  before_sales int;
  before_customers int;
  updated_products int := 0;
  updated_sales int := 0;
  updated_customers int := 0;
  backup_products_table text := 'backup_ws_products_' || ts_suffix;
  backup_sales_table text := 'backup_ws_sales_' || ts_suffix;
  backup_customers_table text := 'backup_ws_customers_' || ts_suffix;
BEGIN
  -- Resolver target_business_id según la opción elegida
  IF target_business_id IS NULL THEN
    IF business_name IS NOT NULL THEN
      SELECT id INTO target_business_id
        FROM ws_businesses
       WHERE name = business_name
       ORDER BY created_at DESC NULLS LAST
       LIMIT 1;
      IF target_business_id IS NULL THEN
        RAISE EXCEPTION 'No se encontró negocio con name=%', business_name;
      END IF;
    ELSIF use_first_if_single THEN
      SELECT COUNT(*) INTO total_businesses FROM ws_businesses;
      IF total_businesses = 1 THEN
        SELECT id INTO target_business_id FROM ws_businesses LIMIT 1;
      ELSE
        RAISE EXCEPTION 'Hay % negocios. Define target_business_id o business_name para continuar', total_businesses;
      END IF;
    ELSE
      RAISE EXCEPTION 'Debes definir target_business_id o business_name, o habilitar use_first_if_single';
    END IF;
  END IF;

  -- Validar existencia del negocio
  SELECT COUNT(*) INTO exists_business FROM ws_businesses WHERE id = target_business_id;
  IF exists_business = 0 THEN
    RAISE EXCEPTION 'No existe ws_businesses.id = %', target_business_id;
  END IF;

  -- Conteos previos
  SELECT COUNT(*) INTO before_products FROM ws_products WHERE business_id IS NULL;
  SELECT COUNT(*) INTO before_sales FROM ws_sales WHERE business_id IS NULL;
  SELECT COUNT(*) INTO before_customers FROM ws_customers WHERE business_id IS NULL;

  RAISE NOTICE 'Encontrados legacy: products=% sales=% customers=%', before_products, before_sales, before_customers;

  -- Crear respaldos con sufijo timestamp (sólo si hay legacy)
  IF before_products > 0 THEN
    EXECUTE format('CREATE TABLE %I AS TABLE ws_products', backup_products_table);
    RAISE NOTICE 'Backup creado: %', backup_products_table;
  END IF;
  IF before_sales > 0 THEN
    EXECUTE format('CREATE TABLE %I AS TABLE ws_sales', backup_sales_table);
    RAISE NOTICE 'Backup creado: %', backup_sales_table;
  END IF;
  IF before_customers > 0 THEN
    EXECUTE format('CREATE TABLE %I AS TABLE ws_customers', backup_customers_table);
    RAISE NOTICE 'Backup creado: %', backup_customers_table;
  END IF;

  IF dry_run THEN
    RAISE NOTICE 'Dry-run activo: no se aplicarán UPDATEs. Pon dry_run=false para ejecutar.';
    RETURN;
  END IF;

  -- Aplicar updates en una transacción
  BEGIN
    -- Products
    WITH params AS (SELECT target_business_id AS bid)
    UPDATE ws_products p
       SET business_id = (SELECT bid FROM params)
     WHERE p.business_id IS NULL;
    GET DIAGNOSTICS updated_products = ROW_COUNT;

    -- Sales
    WITH params AS (SELECT target_business_id AS bid)
    UPDATE ws_sales s
       SET business_id = (SELECT bid FROM params)
     WHERE s.business_id IS NULL;
    GET DIAGNOSTICS updated_sales = ROW_COUNT;

    -- Customers
    WITH params AS (SELECT target_business_id AS bid)
    UPDATE ws_customers c
       SET business_id = (SELECT bid FROM params)
     WHERE c.business_id IS NULL;
    GET DIAGNOSTICS updated_customers = ROW_COUNT;

    RAISE NOTICE 'Actualizados: products=% sales=% customers=%', updated_products, updated_sales, updated_customers;
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'Error en actualización: %', SQLERRM;
    RAISE NOTICE 'Puedes restaurar desde backups: %, %, %', backup_products_table, backup_sales_table, backup_customers_table;
    RAISE; -- re-lanzar para cortar
  END;
END$$;

-- Tips:
-- 1) Ejecuta primero con dry_run=true para ver conteos y que existan backups
-- 2) Luego cambia a dry_run=false para aplicar
-- 3) Si algo sale mal, puedes restaurar con, por ejemplo:
--    TRUNCATE ws_products; INSERT INTO ws_products SELECT * FROM backup_ws_products_YYYYMMDD_HH24MISS;
--    (ajusta al nombre real impreso en los NOTICE)
