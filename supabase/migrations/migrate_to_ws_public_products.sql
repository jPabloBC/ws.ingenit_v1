-- Migration: Move public_products to ws_public_products in app_ws schema and create VIEW
-- Step 1: Create the new table in app_ws schema
CREATE TABLE IF NOT EXISTS app_ws.ws_public_products (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  barcode TEXT,
  name TEXT NOT NULL,
  description TEXT,
  brand TEXT,
  category TEXT,
  price DECIMAL(10,2),
  image_url TEXT,
  quantity TEXT,
  packaging TEXT,
  country TEXT DEFAULT 'Chile',
  source TEXT DEFAULT 'user_contributed',
  verified BOOLEAN DEFAULT false,
  verification_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  created_by UUID REFERENCES auth.users(id),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  calories INTEGER,
  protein DECIMAL(8,2),
  carbs DECIMAL(8,2),
  fat DECIMAL(8,2)
);

-- Step 2: Create indexes on the new table
CREATE INDEX IF NOT EXISTS idx_ws_public_products_barcode ON app_ws.ws_public_products(barcode);
CREATE INDEX IF NOT EXISTS idx_ws_public_products_name ON app_ws.ws_public_products(name);
CREATE INDEX IF NOT EXISTS idx_ws_public_products_verified ON app_ws.ws_public_products(verified, verification_count DESC);
CREATE INDEX IF NOT EXISTS idx_ws_public_products_created_at ON app_ws.ws_public_products(created_at DESC);

-- Step 3: Enable RLS on the new table
ALTER TABLE app_ws.ws_public_products ENABLE ROW LEVEL SECURITY;

-- Step 4: Create RLS policies for the new table
DROP POLICY IF EXISTS "Allow read access" ON app_ws.ws_public_products;
DROP POLICY IF EXISTS "Allow insert for auth users" ON app_ws.ws_public_products;
DROP POLICY IF EXISTS "Allow update for auth users" ON app_ws.ws_public_products;

CREATE POLICY "Allow read access" ON app_ws.ws_public_products 
  FOR SELECT USING (true);

CREATE POLICY "Allow insert for auth users" ON app_ws.ws_public_products 
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Allow update for auth users" ON app_ws.ws_public_products 
  FOR UPDATE USING (auth.uid() IS NOT NULL);

-- Step 5: Copy data from public.public_products to app_ws.ws_public_products
INSERT INTO app_ws.ws_public_products (
  id, barcode, name, description, brand, category, price, image_url,
  quantity, packaging, country, source, verified, verification_count,
  created_at, created_by, updated_at, calories, protein, carbs, fat
)
SELECT 
  id, barcode, name, description, brand, category, price, image_url,
  quantity, packaging, country, source, verified, verification_count,
  created_at, created_by, updated_at, calories, protein, carbs, fat
FROM public.public_products
ON CONFLICT (id) DO NOTHING;

-- Step 6: Drop the old table (be careful!)
-- DROP TABLE IF EXISTS public.public_products;

-- Step 7: Create VIEW in public schema pointing to app_ws table
CREATE OR REPLACE VIEW public.public_products AS 
SELECT 
  id, barcode, name, description, brand, category, price, image_url,
  quantity, packaging, country, source, verified, verification_count,
  created_at, created_by, updated_at, calories, protein, carbs, fat
FROM app_ws.ws_public_products;

-- Step 8: Grant permissions on the VIEW
GRANT SELECT ON public.public_products TO authenticated;
GRANT SELECT ON public.public_products TO anon;

-- Step 9: Create search functions that work with the new table
CREATE OR REPLACE FUNCTION public.search_public_products(search_term text, limit_count integer)
RETURNS TABLE (
  id UUID,
  barcode TEXT,
  name TEXT,
  description TEXT,
  brand TEXT,
  category TEXT,
  price DECIMAL(10,2),
  image_url TEXT,
  quantity TEXT,
  packaging TEXT,
  country TEXT,
  source TEXT,
  verified BOOLEAN,
  verification_count INTEGER,
  created_at TIMESTAMP WITH TIME ZONE,
  created_by UUID,
  updated_at TIMESTAMP WITH TIME ZONE,
  calories INTEGER,
  protein DECIMAL(8,2),
  carbs DECIMAL(8,2),
  fat DECIMAL(8,2)
)
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT 
    id, barcode, name, description, brand, category, price, image_url,
    quantity, packaging, country, source, verified, verification_count,
    created_at, created_by, updated_at, calories, protein, carbs, fat
  FROM app_ws.ws_public_products
  WHERE 
    name ILIKE '%' || search_term || '%' OR
    description ILIKE '%' || search_term || '%' OR
    brand ILIKE '%' || search_term || '%' OR
    category ILIKE '%' || search_term || '%' OR
    barcode = search_term
  ORDER BY verified DESC, verification_count DESC, created_at DESC
  LIMIT limit_count;
$$;

CREATE OR REPLACE FUNCTION public.search_public_products_by_barcode(barcode_input text)
RETURNS TABLE (
  id UUID,
  barcode TEXT,
  name TEXT,
  description TEXT,
  brand TEXT,
  category TEXT,
  price DECIMAL(10,2),
  image_url TEXT,
  quantity TEXT,
  packaging TEXT,
  country TEXT,
  source TEXT,
  verified BOOLEAN,
  verification_count INTEGER,
  created_at TIMESTAMP WITH TIME ZONE,
  created_by UUID,
  updated_at TIMESTAMP WITH TIME ZONE,
  calories INTEGER,
  protein DECIMAL(8,2),
  carbs DECIMAL(8,2),
  fat DECIMAL(8,2)
)
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT 
    id, barcode, name, description, brand, category, price, image_url,
    quantity, packaging, country, source, verified, verification_count,
    created_at, created_by, updated_at, calories, protein, carbs, fat
  FROM app_ws.ws_public_products
  WHERE barcode = barcode_input
  ORDER BY verified DESC, verification_count DESC
  LIMIT 1;
$$;