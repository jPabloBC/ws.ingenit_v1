-- Eliminar función existente para poder recrearla con nueva estructura
DROP FUNCTION IF EXISTS public.search_public_products(text, integer);

-- Actualizar la función search_public_products para incluir búsqueda por código de barras
CREATE OR REPLACE FUNCTION public.search_public_products(search_term text, limit_count integer)
RETURNS TABLE (
  id UUID,
  barcode TEXT,
  name TEXT,
  description TEXT,
  brand TEXT,
  category TEXT,
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
    id, barcode, name, description, brand, category, image_url,
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

-- Función para crear producto en ws_public_products SOLO si no existe
-- O actualizar SOLO campos vacíos si ya existe
CREATE OR REPLACE FUNCTION public.upsert_public_product_safe(
  product_barcode TEXT,
  product_name TEXT,
  product_description TEXT DEFAULT NULL,
  product_image_url TEXT DEFAULT NULL,
  product_brand TEXT DEFAULT NULL,
  product_category TEXT DEFAULT NULL,
  product_calories INTEGER DEFAULT NULL,
  product_protein DECIMAL(8,2) DEFAULT NULL,
  product_carbs DECIMAL(8,2) DEFAULT NULL,
  product_fat DECIMAL(8,2) DEFAULT NULL,
  product_quantity TEXT DEFAULT NULL,
  product_packaging TEXT DEFAULT NULL,
  product_country TEXT DEFAULT NULL,
  user_id UUID DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  existing_id UUID;
  new_product_id UUID;
  updated_fields TEXT[];
BEGIN
  -- Verificar si el producto ya existe por código de barras
  SELECT id INTO existing_id 
  FROM app_ws.ws_public_products 
  WHERE barcode = product_barcode;
  
  -- Si ya existe, actualizar SOLO campos vacíos
  IF existing_id IS NOT NULL THEN
    RAISE NOTICE 'Producto existe, actualizando solo campos vacíos: %', existing_id;
    
    UPDATE app_ws.ws_public_products 
    SET 
      -- Solo actualizar si el campo actual está vacío (NULL o cadena vacía)
      description = CASE 
        WHEN (description IS NULL OR description = '') AND product_description IS NOT NULL 
        THEN product_description 
        ELSE description 
      END,
      image_url = CASE 
        WHEN (image_url IS NULL OR image_url = '') AND product_image_url IS NOT NULL 
        THEN product_image_url 
        ELSE image_url 
      END,
      brand = CASE 
        WHEN (brand IS NULL OR brand = '') AND product_brand IS NOT NULL 
        THEN product_brand 
        ELSE brand 
      END,
      category = CASE 
        WHEN (category IS NULL OR category = '') AND product_category IS NOT NULL 
        THEN product_category 
        ELSE category 
      END,
      calories = CASE 
        WHEN calories IS NULL AND product_calories IS NOT NULL 
        THEN product_calories 
        ELSE calories 
      END,
      protein = CASE 
        WHEN protein IS NULL AND product_protein IS NOT NULL 
        THEN product_protein 
        ELSE protein 
      END,
      carbs = CASE 
        WHEN carbs IS NULL AND product_carbs IS NOT NULL 
        THEN product_carbs 
        ELSE carbs 
      END,
      fat = CASE 
        WHEN fat IS NULL AND product_fat IS NOT NULL 
        THEN product_fat 
        ELSE fat 
      END,
      quantity = CASE 
        WHEN (quantity IS NULL OR quantity = '') AND product_quantity IS NOT NULL 
        THEN product_quantity 
        ELSE quantity 
      END,
      packaging = CASE 
        WHEN (packaging IS NULL OR packaging = '') AND product_packaging IS NOT NULL 
        THEN product_packaging 
        ELSE packaging 
      END,
      country = CASE 
        WHEN (country IS NULL OR country = '') AND product_country IS NOT NULL 
        THEN product_country 
        ELSE country 
      END,
      updated_at = NOW()
    WHERE id = existing_id;
    
    RAISE NOTICE 'Campos vacíos actualizados en producto existente: %', existing_id;
    RETURN existing_id;
  END IF;
  
  -- Si no existe, crear nuevo producto con UUID generado
  new_product_id := gen_random_uuid();
  
  INSERT INTO app_ws.ws_public_products (
    id, barcode, name, description, image_url, brand, category,
    calories, protein, carbs, fat, quantity, packaging, country,
    source, verified, verification_count, created_by, created_at, updated_at
  ) VALUES (
    new_product_id, product_barcode, product_name, product_description, 
    product_image_url, product_brand, product_category, product_calories,
    product_protein, product_carbs, product_fat, product_quantity,
    product_packaging, product_country, 'api_enrichment', false, 1, 
    user_id, NOW(), NOW()
  );
  
  RAISE NOTICE 'Nuevo producto creado con ID: %', new_product_id;
  RETURN new_product_id;
  
EXCEPTION
  WHEN unique_violation THEN
    -- Si hay violación de unicidad (otro usuario creó el producto simultáneamente)
    -- Obtener el ID del producto existente y intentar actualizar campos vacíos
    SELECT id INTO existing_id 
    FROM app_ws.ws_public_products 
    WHERE barcode = product_barcode;
    
    -- Intentar actualizar campos vacíos del producto recién creado por otro usuario
    UPDATE app_ws.ws_public_products 
    SET 
      description = CASE 
        WHEN (description IS NULL OR description = '') AND product_description IS NOT NULL 
        THEN product_description 
        ELSE description 
      END,
      image_url = CASE 
        WHEN (image_url IS NULL OR image_url = '') AND product_image_url IS NOT NULL 
        THEN product_image_url 
        ELSE image_url 
      END,
      brand = CASE 
        WHEN (brand IS NULL OR brand = '') AND product_brand IS NOT NULL 
        THEN product_brand 
        ELSE brand 
      END,
      updated_at = NOW()
    WHERE id = existing_id;
    
    RAISE NOTICE 'Producto creado por otro usuario, campos vacíos actualizados: %', existing_id;
    RETURN existing_id;
    
  WHEN OTHERS THEN
    RAISE NOTICE 'Error procesando producto: %', SQLERRM;
    RETURN NULL;
END;
$$;

-- Eliminar la función de actualización ya que no la usaremos
DROP FUNCTION IF EXISTS public.update_ws_public_product(UUID, TEXT, TEXT, TEXT, TEXT, INTEGER, DECIMAL, DECIMAL, DECIMAL);