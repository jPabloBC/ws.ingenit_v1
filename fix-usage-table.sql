-- Script para corregir la tabla ws_usage
-- Ejecutar en Supabase SQL Editor

-- 1. Eliminar la tabla ws_usage si existe
DROP TABLE IF EXISTS ws_usage CASCADE;

-- 2. Recrear la tabla ws_usage con la restricción UNIQUE correcta
CREATE TABLE ws_usage (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  current_stores INTEGER NOT NULL DEFAULT 0,
  current_products INTEGER NOT NULL DEFAULT 0,
  total_stock INTEGER NOT NULL DEFAULT 0,
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Configurar RLS
ALTER TABLE ws_usage ENABLE ROW LEVEL SECURITY;

-- 4. Política RLS
CREATE POLICY "Allow all operations on ws_usage" ON ws_usage FOR ALL USING (true);

-- 5. Función para actualizar uso (corregida)
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

-- 6. Crear triggers
DROP TRIGGER IF EXISTS trigger_update_usage_profiles ON ws_profiles;
CREATE TRIGGER trigger_update_usage_profiles
  AFTER INSERT OR UPDATE ON ws_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_user_usage();

DROP TRIGGER IF EXISTS trigger_update_usage_products ON ws_products;
CREATE TRIGGER trigger_update_usage_products
  AFTER INSERT OR UPDATE ON ws_products
  FOR EACH ROW
  EXECUTE FUNCTION update_user_usage();

-- 7. Índice
CREATE INDEX IF NOT EXISTS idx_usage_user_id ON ws_usage(user_id);

-- 8. Verificar
SELECT 'Tabla ws_usage corregida exitosamente' as status; 