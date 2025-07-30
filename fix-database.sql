-- Script de migración para agregar user_id a ws_profiles
-- Ejecutar en Supabase SQL Editor

-- 1. Agregar columna user_id a ws_profiles si no existe
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'ws_profiles' AND column_name = 'user_id'
    ) THEN
        ALTER TABLE ws_profiles ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
    END IF;
END $$;

-- 2. Crear tabla ws_subscriptions si no existe
CREATE TABLE IF NOT EXISTS ws_subscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  plan VARCHAR(50) NOT NULL DEFAULT 'free',
  status VARCHAR(50) NOT NULL DEFAULT 'active',
  max_stores INTEGER NOT NULL DEFAULT 1,
  max_products INTEGER NOT NULL DEFAULT 5,
  max_stock_per_product INTEGER NOT NULL DEFAULT 3,
  trial_days INTEGER NOT NULL DEFAULT 10,
  trial_end_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Crear tabla ws_payments si no existe
CREATE TABLE IF NOT EXISTS ws_payments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  subscription_id UUID REFERENCES ws_subscriptions(id) ON DELETE CASCADE,
  amount DECIMAL(10,2) NOT NULL,
  currency VARCHAR(3) NOT NULL DEFAULT 'CLP',
  payment_method VARCHAR(50) NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'pending',
  transaction_id VARCHAR(255),
  webpay_token VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Crear tabla ws_usage si no existe
CREATE TABLE IF NOT EXISTS ws_usage (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  current_stores INTEGER NOT NULL DEFAULT 0,
  current_products INTEGER NOT NULL DEFAULT 0,
  total_stock INTEGER NOT NULL DEFAULT 0,
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Configurar RLS para las nuevas tablas
ALTER TABLE ws_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE ws_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE ws_usage ENABLE ROW LEVEL SECURITY;

-- 6. Políticas RLS para las nuevas tablas
DROP POLICY IF EXISTS "Allow all operations on ws_subscriptions" ON ws_subscriptions;
CREATE POLICY "Allow all operations on ws_subscriptions" ON ws_subscriptions FOR ALL USING (true);

DROP POLICY IF EXISTS "Allow all operations on ws_payments" ON ws_payments;
CREATE POLICY "Allow all operations on ws_payments" ON ws_payments FOR ALL USING (true);

DROP POLICY IF EXISTS "Allow all operations on ws_usage" ON ws_usage;
CREATE POLICY "Allow all operations on ws_usage" ON ws_usage FOR ALL USING (true);

-- 7. Función para actualizar uso
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

-- 8. Crear triggers si no existen
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

-- 9. Índices para mejor rendimiento
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON ws_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON ws_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_usage_user_id ON ws_usage(user_id);

-- 10. Verificar que todo esté correcto
SELECT 'Migración completada exitosamente' as status; 