-- Script para limpiar y recrear todos los triggers
-- Ejecutar en Supabase SQL Editor

-- 1. Eliminar todos los triggers existentes
DROP TRIGGER IF EXISTS trigger_generate_sku ON ws_products;
DROP TRIGGER IF EXISTS trigger_update_usage_profiles ON ws_profiles;
DROP TRIGGER IF EXISTS trigger_update_usage_products ON ws_products;

-- 2. Recrear función para generar SKU
CREATE OR REPLACE FUNCTION generate_sku()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.sku IS NULL OR NEW.sku = '' THEN
    NEW.sku := 'SKU' || SUBSTRING(NEW.id::TEXT FROM 1 FOR 8);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3. Recrear trigger para generar SKU
CREATE TRIGGER trigger_generate_sku
  BEFORE INSERT ON ws_products
  FOR EACH ROW
  EXECUTE FUNCTION generate_sku();

-- 4. Recrear función para actualizar uso
CREATE OR REPLACE FUNCTION update_user_usage()
RETURNS TRIGGER AS $$
BEGIN
  -- Actualizar uso cuando se modifica un perfil
  IF TG_TABLE_NAME = 'ws_profiles' THEN
    INSERT INTO ws_usage (user_id, current_stores, current_products, total_stock)
    VALUES (NEW.user_id, array_length(NEW.store_types, 1), 0, 0)
    ON CONFLICT (user_id) 
    DO UPDATE SET 
      current_stores = array_length(NEW.store_types, 1),
      last_updated = NOW();
  END IF;
  
  -- Actualizar uso cuando se modifica un producto
  IF TG_TABLE_NAME = 'ws_products' THEN
    INSERT INTO ws_usage (user_id, current_stores, current_products, total_stock)
    VALUES (NEW.user_id, 0, 1, NEW.stock)
    ON CONFLICT (user_id) 
    DO UPDATE SET 
      current_products = ws_usage.current_products + 1,
      total_stock = ws_usage.total_stock + NEW.stock,
      last_updated = NOW();
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 5. Recrear triggers para actualizar uso
CREATE TRIGGER trigger_update_usage_profiles
  AFTER INSERT OR UPDATE ON ws_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_user_usage();

CREATE TRIGGER trigger_update_usage_products
  AFTER INSERT OR UPDATE ON ws_products
  FOR EACH ROW
  EXECUTE FUNCTION update_user_usage();

-- 6. Verificar que los triggers se crearon correctamente
SELECT 
  trigger_name,
  event_manipulation,
  action_timing,
  event_object_table
FROM information_schema.triggers 
WHERE trigger_name IN ('trigger_generate_sku', 'trigger_update_usage_profiles', 'trigger_update_usage_products')
ORDER BY trigger_name;

-- 7. Mensaje de confirmación
SELECT 'Triggers limpiados y recreados exitosamente' as status; 