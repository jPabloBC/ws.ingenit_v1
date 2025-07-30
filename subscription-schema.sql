-- Script para crear las tablas de suscripciones y pagos
-- Copia y pega esto en el SQL Editor de Supabase

-- Tabla de suscripciones
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

-- Tabla de pagos
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

-- Tabla de uso actual
CREATE TABLE IF NOT EXISTS ws_usage (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  current_stores INTEGER NOT NULL DEFAULT 0,
  current_products INTEGER NOT NULL DEFAULT 0,
  total_stock INTEGER NOT NULL DEFAULT 0,
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Configurar RLS
ALTER TABLE ws_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE ws_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE ws_usage ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
CREATE POLICY "Users can view own subscription" ON ws_subscriptions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own subscription" ON ws_subscriptions
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own payments" ON ws_payments
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own payments" ON ws_payments
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own usage" ON ws_usage
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own usage" ON ws_usage
  FOR UPDATE USING (auth.uid() = user_id);

-- Función para actualizar uso
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

-- Triggers para actualizar uso automáticamente
CREATE TRIGGER trigger_update_usage_profiles
  AFTER INSERT OR UPDATE ON ws_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_user_usage();

CREATE TRIGGER trigger_update_usage_products
  AFTER INSERT OR UPDATE ON ws_products
  FOR EACH ROW
  EXECUTE FUNCTION update_user_usage();

-- Índices para mejor rendimiento
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON ws_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_plan ON ws_subscriptions(plan);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON ws_subscriptions(status);

CREATE INDEX IF NOT EXISTS idx_payments_user_id ON ws_payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_subscription_id ON ws_payments(subscription_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON ws_payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_transaction_id ON ws_payments(transaction_id);

-- Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers para actualizar updated_at
CREATE TRIGGER update_subscriptions_updated_at 
  BEFORE UPDATE ON ws_subscriptions 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payments_updated_at 
  BEFORE UPDATE ON ws_payments 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insertar datos de prueba (opcional)
-- INSERT INTO ws_subscriptions (user_id, plan, max_stores, max_products, trial_days, trial_end_date)
-- VALUES (
--   '00000000-0000-0000-0000-000000000000', -- Reemplazar con un user_id real
--   'free',
--   1,
--   5,
--   10,
--   NOW() + INTERVAL '10 days'
-- ); 