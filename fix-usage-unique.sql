-- Script específico para corregir la tabla ws_usage
-- Ejecutar en Supabase SQL Editor

-- 1. Verificar si la tabla ws_usage existe y tiene la restricción UNIQUE
DO $$ 
BEGIN
    -- Verificar si la tabla existe
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'ws_usage') THEN
        -- Verificar si tiene la restricción UNIQUE en user_id
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.table_constraints 
            WHERE table_name = 'ws_usage' 
            AND constraint_type = 'UNIQUE' 
            AND constraint_name LIKE '%user_id%'
        ) THEN
            -- Agregar la restricción UNIQUE si no existe
            ALTER TABLE ws_usage ADD CONSTRAINT ws_usage_user_id_unique UNIQUE (user_id);
            RAISE NOTICE 'Restricción UNIQUE agregada a ws_usage.user_id';
        ELSE
            RAISE NOTICE 'La restricción UNIQUE ya existe en ws_usage.user_id';
        END IF;
    ELSE
        -- Crear la tabla si no existe
        CREATE TABLE ws_usage (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
          current_stores INTEGER NOT NULL DEFAULT 0,
          current_products INTEGER NOT NULL DEFAULT 0,
          total_stock INTEGER NOT NULL DEFAULT 0,
          last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        RAISE NOTICE 'Tabla ws_usage creada con restricción UNIQUE';
    END IF;
END $$;

-- 2. Configurar RLS si no está habilitado
ALTER TABLE ws_usage ENABLE ROW LEVEL SECURITY;

-- 3. Crear política RLS si no existe
DROP POLICY IF EXISTS "Allow all operations on ws_usage" ON ws_usage;
CREATE POLICY "Allow all operations on ws_usage" ON ws_usage FOR ALL USING (true);

-- 4. Recrear la función update_user_usage con manejo correcto de conflictos
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

-- 5. Recrear triggers
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

-- 6. Crear índice si no existe
CREATE INDEX IF NOT EXISTS idx_usage_user_id ON ws_usage(user_id);

-- 7. Verificar la estructura de la tabla
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'ws_usage' 
ORDER BY ordinal_position;

-- 8. Verificar restricciones
SELECT 
  constraint_name,
  constraint_type
FROM information_schema.table_constraints 
WHERE table_name = 'ws_usage';

-- 9. Mensaje de confirmación
SELECT 'Tabla ws_usage corregida exitosamente' as status; 