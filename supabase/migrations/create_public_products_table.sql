-- Tabla pública de productos para compartir entre todos los usuarios
CREATE TABLE public_products (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  barcode TEXT UNIQUE, -- Código de barras (opcional, puede ser NULL)
  name TEXT NOT NULL,
  description TEXT,
  brand TEXT,
  category TEXT,
  price DECIMAL(10,2),
  image_url TEXT,
  quantity TEXT, -- ej: "1L", "500g"
  packaging TEXT,
  country TEXT DEFAULT 'Chile',
  source TEXT DEFAULT 'user_contributed', -- 'user_contributed', 'api_imported', etc.
  
  -- Información nutricional (opcional)
  calories INTEGER,
  protein DECIMAL(8,2),
  carbs DECIMAL(8,2),
  fat DECIMAL(8,2),
  
  -- Metadatos
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id), -- Usuario que lo agregó
  verified BOOLEAN DEFAULT FALSE, -- Si ha sido verificado por moderadores
  verification_count INTEGER DEFAULT 0, -- Cuántos usuarios lo han verificado
  
  -- Índices para búsqueda rápida
  search_vector tsvector GENERATED ALWAYS AS (
    to_tsvector('spanish', 
      COALESCE(name, '') || ' ' || 
      COALESCE(description, '') || ' ' || 
      COALESCE(brand, '') || ' ' || 
      COALESCE(category, '')
    )
  ) STORED
);

-- Índices para optimizar búsquedas
CREATE INDEX idx_public_products_barcode ON public_products(barcode);
CREATE INDEX idx_public_products_name ON public_products USING gin(to_tsvector('spanish', name));
CREATE INDEX idx_public_products_search ON public_products USING gin(search_vector);
CREATE INDEX idx_public_products_category ON public_products(category);
CREATE INDEX idx_public_products_verified ON public_products(verified);

-- Trigger para actualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_public_products_updated_at 
    BEFORE UPDATE ON public_products 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- RLS (Row Level Security) - Lectura pública, escritura autenticada
ALTER TABLE public_products ENABLE ROW LEVEL SECURITY;

-- Política: Todos pueden leer
CREATE POLICY "Todos pueden leer productos públicos" 
ON public_products FOR SELECT 
USING (true);

-- Política: Solo usuarios autenticados pueden insertar
CREATE POLICY "Usuarios autenticados pueden agregar productos" 
ON public_products FOR INSERT 
WITH CHECK (auth.role() = 'authenticated');

-- Política: Solo el creador puede actualizar (o moderadores en el futuro)
CREATE POLICY "Creador puede actualizar su producto" 
ON public_products FOR UPDATE 
USING (auth.uid() = created_by);

-- Función para buscar productos públicos por texto
CREATE OR REPLACE FUNCTION search_public_products(
  search_term TEXT,
  limit_count INTEGER DEFAULT 20
)
RETURNS TABLE (
  id UUID,
  barcode TEXT,
  name TEXT,
  description TEXT,
  brand TEXT,
  category TEXT,
  price DECIMAL,
  image_url TEXT,
  quantity TEXT,
  packaging TEXT,
  country TEXT,
  source TEXT,
  verified BOOLEAN,
  verification_count INTEGER,
  created_at TIMESTAMPTZ
) 
LANGUAGE sql
AS $$
  SELECT 
    p.id, p.barcode, p.name, p.description, p.brand, p.category,
    p.price, p.image_url, p.quantity, p.packaging, p.country, p.source,
    p.verified, p.verification_count, p.created_at
  FROM public_products p
  WHERE 
    p.search_vector @@ plainto_tsquery('spanish', search_term)
    OR p.name ILIKE '%' || search_term || '%'
    OR p.brand ILIKE '%' || search_term || '%'
    OR p.barcode = search_term
  ORDER BY 
    p.verified DESC,
    p.verification_count DESC,
    ts_rank(p.search_vector, plainto_tsquery('spanish', search_term)) DESC,
    p.created_at DESC
  LIMIT limit_count;
$$;

-- Función para buscar por código de barras específicamente
CREATE OR REPLACE FUNCTION search_public_products_by_barcode(barcode_input TEXT)
RETURNS TABLE (
  id UUID,
  barcode TEXT,
  name TEXT,
  description TEXT,
  brand TEXT,
  category TEXT,
  price DECIMAL,
  image_url TEXT,
  quantity TEXT,
  packaging TEXT,
  country TEXT,
  source TEXT,
  verified BOOLEAN,
  verification_count INTEGER
) 
LANGUAGE sql
AS $$
  SELECT 
    p.id, p.barcode, p.name, p.description, p.brand, p.category,
    p.price, p.image_url, p.quantity, p.packaging, p.country, p.source,
    p.verified, p.verification_count
  FROM public_products p
  WHERE p.barcode = barcode_input
  ORDER BY p.verified DESC, p.verification_count DESC
  LIMIT 1;
$$;