-- Script de configuración para Ingenit Store Manager
-- Ejecutar en Supabase SQL Editor

-- 1. Crear tabla ws_profiles
CREATE TABLE IF NOT EXISTS ws_profiles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  store_types TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Crear tabla ws_categories
CREATE TABLE IF NOT EXISTS ws_categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  color VARCHAR(7) DEFAULT '#3B82F6',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Crear tabla ws_suppliers
CREATE TABLE IF NOT EXISTS ws_suppliers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  phone VARCHAR(50),
  address TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Crear tabla ws_products
CREATE TABLE IF NOT EXISTS ws_products (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  sku VARCHAR(100) UNIQUE,
  price DECIMAL(10,2) NOT NULL,
  cost DECIMAL(10,2) NOT NULL,
  stock INTEGER DEFAULT 0,
  min_stock INTEGER DEFAULT 0,
  category_id UUID REFERENCES ws_categories(id),
  supplier_id UUID REFERENCES ws_suppliers(id),
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Crear tabla ws_customers
CREATE TABLE IF NOT EXISTS ws_customers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  phone VARCHAR(50),
  address TEXT,
  total_purchases INTEGER DEFAULT 0,
  last_purchase_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Crear tabla ws_sales
CREATE TABLE IF NOT EXISTS ws_sales (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  sale_number VARCHAR(50) UNIQUE NOT NULL,
  customer_id UUID REFERENCES ws_customers(id),
  total_amount DECIMAL(10,2) NOT NULL,
  payment_method VARCHAR(50) NOT NULL,
  status VARCHAR(50) DEFAULT 'completed',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. Crear tabla ws_sale_items
CREATE TABLE IF NOT EXISTS ws_sale_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  sale_id UUID REFERENCES ws_sales(id) ON DELETE CASCADE,
  product_id UUID REFERENCES ws_products(id),
  quantity INTEGER NOT NULL,
  unit_price DECIMAL(10,2) NOT NULL,
  total_price DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8. Crear tabla ws_subscriptions
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

-- 9. Crear tabla ws_payments
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

-- 10. Crear tabla ws_usage
CREATE TABLE IF NOT EXISTS ws_usage (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  current_stores INTEGER NOT NULL DEFAULT 0,
  current_products INTEGER NOT NULL DEFAULT 0,
  total_stock INTEGER NOT NULL DEFAULT 0,
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 11. Función para generar número de venta
CREATE OR REPLACE FUNCTION generate_sale_number()
RETURNS VARCHAR AS $$
DECLARE
  next_number INTEGER;
  sale_number VARCHAR;
BEGIN
  -- Obtener el siguiente número
  SELECT COALESCE(MAX(CAST(SUBSTRING(sale_number FROM 4) AS INTEGER)), 0) + 1
  INTO next_number
  FROM ws_sales
  WHERE sale_number LIKE 'SAL%';
  
  -- Formatear el número
  sale_number := 'SAL' || LPAD(next_number::TEXT, 6, '0');
  
  RETURN sale_number;
END;
$$ LANGUAGE plpgsql;

-- 12. Trigger para generar SKU automáticamente
CREATE OR REPLACE FUNCTION generate_sku()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.sku IS NULL OR NEW.sku = '' THEN
    NEW.sku := 'SKU' || SUBSTRING(NEW.id::TEXT FROM 1 FOR 8);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Eliminar trigger existente si existe
DROP TRIGGER IF EXISTS trigger_generate_sku ON ws_products;

-- Crear trigger para generar SKU
CREATE TRIGGER trigger_generate_sku
  BEFORE INSERT ON ws_products
  FOR EACH ROW
  EXECUTE FUNCTION generate_sku();

-- 13. Función para actualizar uso
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

-- 14. Eliminar triggers existentes si existen
DROP TRIGGER IF EXISTS trigger_update_usage_profiles ON ws_profiles;
DROP TRIGGER IF EXISTS trigger_update_usage_products ON ws_products;

-- Crear triggers para actualizar uso automáticamente
CREATE TRIGGER trigger_update_usage_profiles
  AFTER INSERT OR UPDATE ON ws_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_user_usage();

CREATE TRIGGER trigger_update_usage_products
  AFTER INSERT OR UPDATE ON ws_products
  FOR EACH ROW
  EXECUTE FUNCTION update_user_usage();

-- 15. Configurar RLS
ALTER TABLE ws_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE ws_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE ws_suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE ws_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE ws_customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE ws_sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE ws_sale_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE ws_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE ws_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE ws_usage ENABLE ROW LEVEL SECURITY;

-- 16. Eliminar políticas existentes si existen
DROP POLICY IF EXISTS "Allow all operations on ws_profiles" ON ws_profiles;
DROP POLICY IF EXISTS "Allow all operations on ws_categories" ON ws_categories;
DROP POLICY IF EXISTS "Allow all operations on ws_suppliers" ON ws_suppliers;
DROP POLICY IF EXISTS "Allow all operations on ws_products" ON ws_products;
DROP POLICY IF EXISTS "Allow all operations on ws_customers" ON ws_customers;
DROP POLICY IF EXISTS "Allow all operations on ws_sales" ON ws_sales;
DROP POLICY IF EXISTS "Allow all operations on ws_sale_items" ON ws_sale_items;
DROP POLICY IF EXISTS "Allow all operations on ws_subscriptions" ON ws_subscriptions;
DROP POLICY IF EXISTS "Allow all operations on ws_payments" ON ws_payments;
DROP POLICY IF EXISTS "Allow all operations on ws_usage" ON ws_usage;

-- Crear políticas RLS (permitir todo en desarrollo)
CREATE POLICY "Allow all operations on ws_profiles" ON ws_profiles FOR ALL USING (true);
CREATE POLICY "Allow all operations on ws_categories" ON ws_categories FOR ALL USING (true);
CREATE POLICY "Allow all operations on ws_suppliers" ON ws_suppliers FOR ALL USING (true);
CREATE POLICY "Allow all operations on ws_products" ON ws_products FOR ALL USING (true);
CREATE POLICY "Allow all operations on ws_customers" ON ws_customers FOR ALL USING (true);
CREATE POLICY "Allow all operations on ws_sales" ON ws_sales FOR ALL USING (true);
CREATE POLICY "Allow all operations on ws_sale_items" ON ws_sale_items FOR ALL USING (true);
CREATE POLICY "Allow all operations on ws_subscriptions" ON ws_subscriptions FOR ALL USING (true);
CREATE POLICY "Allow all operations on ws_payments" ON ws_payments FOR ALL USING (true);
CREATE POLICY "Allow all operations on ws_usage" ON ws_usage FOR ALL USING (true);

-- 17. Índices para mejor rendimiento
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON ws_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_products_category_id ON ws_products(category_id);
CREATE INDEX IF NOT EXISTS idx_sales_customer_id ON ws_sales(customer_id);
CREATE INDEX IF NOT EXISTS idx_sale_items_sale_id ON ws_sale_items(sale_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON ws_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_usage_user_id ON ws_usage(user_id);

-- 18. Insertar categorías por defecto
INSERT INTO ws_categories (name, description, color) VALUES
('Electrónicos', 'Productos electrónicos y tecnología', '#3B82F6'),
('Ropa', 'Vestimenta y accesorios', '#EF4444'),
('Hogar', 'Artículos para el hogar', '#10B981'),
('Deportes', 'Equipamiento deportivo', '#F59E0B'),
('Libros', 'Libros y material educativo', '#8B5CF6')
ON CONFLICT DO NOTHING;

-- Mensaje de confirmación
SELECT 'Base de datos configurada exitosamente' as status; 