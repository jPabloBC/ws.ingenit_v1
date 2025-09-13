-- =====================================================
-- MIGRACIÓN DE ws_categories DE SERIAL A UUID
-- =====================================================

-- Paso 1: Crear tabla temporal con estructura UUID
CREATE TABLE IF NOT EXISTS ws_categories_new (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    description TEXT,
    color VARCHAR(7) DEFAULT '#3B82F6',
    store_type VARCHAR(50),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Paso 2: Migrar datos existentes (si los hay)
-- Esto solo se ejecutará si la tabla original existe
DO $$
BEGIN
    -- Verificar si la tabla original existe
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'ws_categories') THEN
        -- Migrar datos existentes
        INSERT INTO ws_categories_new (name, description, color, store_type, created_at, updated_at)
        SELECT 
            name,
            description,
            COALESCE(color, '#3B82F6'),
            store_type,
            created_at,
            updated_at
        FROM ws_categories;
        
        RAISE NOTICE 'Datos migrados de ws_categories a ws_categories_new';
    ELSE
        RAISE NOTICE 'Tabla ws_categories no existe, creando tabla nueva';
    END IF;
END $$;

-- Paso 3: Crear tabla de productos temporal para actualizar referencias
CREATE TABLE IF NOT EXISTS ws_products_temp AS 
SELECT * FROM ws_products;

-- Paso 4: Actualizar referencias en ws_products (si la tabla existe)
DO $$
DECLARE
    category_record RECORD;
    new_category_id UUID;
BEGIN
    -- Verificar si la tabla ws_products existe
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'ws_products') THEN
        -- Crear mapeo de IDs viejos a nuevos
        FOR category_record IN 
            SELECT old_id, new_id FROM (
                SELECT 
                    old_cat.id as old_id,
                    new_cat.id as new_id
                FROM ws_categories old_cat
                JOIN ws_categories_new new_cat ON old_cat.name = new_cat.name
            ) mapping
        LOOP
            -- Actualizar referencias en ws_products
            UPDATE ws_products 
            SET category_id = category_record.new_id::text
            WHERE category_id = category_record.old_id::text;
        END LOOP;
        
        RAISE NOTICE 'Referencias en ws_products actualizadas';
    END IF;
END $$;

-- Paso 5: Eliminar tabla original y renombrar la nueva
DO $$
BEGIN
    -- Eliminar tabla original si existe
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'ws_categories') THEN
        DROP TABLE ws_categories CASCADE;
        RAISE NOTICE 'Tabla ws_categories original eliminada';
    END IF;
    
    -- Renombrar tabla nueva
    ALTER TABLE ws_categories_new RENAME TO ws_categories;
    RAISE NOTICE 'Tabla ws_categories_new renombrada a ws_categories';
END $$;

-- Paso 6: Recrear índices y constraints
CREATE INDEX IF NOT EXISTS idx_ws_categories_store_type ON ws_categories(store_type);
CREATE INDEX IF NOT EXISTS idx_ws_categories_name ON ws_categories(name);

-- Paso 7: Crear trigger para updated_at
CREATE OR REPLACE FUNCTION update_ws_categories_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_ws_categories_updated_at 
    BEFORE UPDATE ON ws_categories 
    FOR EACH ROW 
    EXECUTE FUNCTION update_ws_categories_updated_at();

-- Paso 8: Insertar categorías por defecto si no existen
INSERT INTO ws_categories (name, description, color, store_type) VALUES
    ('General', 'Categoría general para productos', '#3B82F6', 'retail'),
    ('Bebidas', 'Bebidas y líquidos', '#10B981', 'retail'),
    ('Snacks', 'Snacks y aperitivos', '#F59E0B', 'retail'),
    ('Limpieza', 'Productos de limpieza', '#8B5CF6', 'retail'),
    ('Electrónicos', 'Dispositivos electrónicos', '#EF4444', 'retail'),
    ('Ropa', 'Prendas de vestir', '#06B6D4', 'retail'),
    ('Hogar', 'Artículos para el hogar', '#84CC16', 'retail'),
    ('Deportes', 'Artículos deportivos', '#F97316', 'retail'),
    ('Libros', 'Libros y material educativo', '#6366F1', 'retail'),
    ('Juguetes', 'Juguetes y entretenimiento', '#EC4899', 'retail')
ON CONFLICT (name, store_type) DO NOTHING;

-- Verificar la migración
SELECT 
    'ws_categories' as tabla,
    COUNT(*) as total_registros,
    'UUID' as tipo_id
FROM ws_categories
UNION ALL
SELECT 
    'ws_products' as tabla,
    COUNT(*) as total_registros,
    'category_id references' as tipo_id
FROM ws_products
WHERE category_id IS NOT NULL;

-- Mostrar estructura final
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'ws_categories' 
AND table_schema = 'public'
ORDER BY ordinal_position;
