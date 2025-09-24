-- =====================================================
-- REINICIAR SOLO LOS IDs DE ws_categories DESDE 1
-- =====================================================

-- Paso 1: Verificar datos actuales
SELECT 
    'Antes de reiniciar' as estado,
    MIN(id) as id_minimo,
    MAX(id) as id_maximo,
    COUNT(*) as total_registros
FROM ws_categories;

-- Paso 2: Crear tabla temporal con solo los IDs cambiados
CREATE TABLE ws_categories_temp AS 
SELECT 
    ROW_NUMBER() OVER (ORDER BY id) as id,  -- Nuevos IDs desde 1
    name,
    description,
    color,
    store_type,
    created_at,
    updated_at
FROM ws_categories;

-- Paso 3: Crear tabla de mapeo para actualizar referencias
CREATE TABLE id_mapping AS
SELECT 
    c.id as old_id,
    t.id as new_id,
    c.name
FROM ws_categories c
JOIN ws_categories_temp t ON c.name = t.name;

-- Paso 4: Mostrar el mapeo de IDs
SELECT 
    old_id,
    new_id,
    name
FROM id_mapping
ORDER BY old_id;

-- Paso 5: Actualizar referencias en ws_products (si existe)
DO $$
DECLARE
    mapping_record RECORD;
BEGIN
    -- Verificar si la tabla ws_products existe
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'ws_products') THEN
        -- Actualizar referencias usando el mapeo
        FOR mapping_record IN 
            SELECT old_id, new_id FROM id_mapping
        LOOP
            -- Convertir category_id a integer para comparar, luego actualizar con nuevo ID como text
            UPDATE ws_products 
            SET category_id = mapping_record.new_id::text
            WHERE category_id::integer = mapping_record.old_id;
        END LOOP;
        
        RAISE NOTICE 'Referencias en ws_products actualizadas';
    ELSE
        RAISE NOTICE 'Tabla ws_products no existe, saltando actualización de referencias';
    END IF;
END $$;

-- Paso 6: Eliminar tabla original y renombrar la temporal
DROP TABLE ws_categories CASCADE;

-- Renombrar tabla temporal
ALTER TABLE ws_categories_temp RENAME TO ws_categories;

-- Paso 7: Recrear constraints e índices
ALTER TABLE ws_categories ADD PRIMARY KEY (id);
ALTER TABLE ws_categories ALTER COLUMN id SET NOT NULL;

-- Crear índices
CREATE INDEX IF NOT EXISTS idx_ws_categories_store_type ON ws_categories(store_type);
CREATE INDEX IF NOT EXISTS idx_ws_categories_name ON ws_categories(name);

-- Paso 8: Recrear trigger para updated_at
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

-- Paso 9: Reiniciar la secuencia
DO $$
BEGIN
    -- Crear o reiniciar secuencia
    IF EXISTS (SELECT 1 FROM pg_sequences WHERE sequencename LIKE '%ws_categories%') THEN
        -- Reiniciar secuencia existente
        EXECUTE 'SELECT setval(pg_get_serial_sequence(''ws_categories'', ''id''), (SELECT MAX(id) FROM ws_categories))';
        RAISE NOTICE 'Secuencia reiniciada';
    ELSE
        -- Crear nueva secuencia
        CREATE SEQUENCE ws_categories_id_seq;
        ALTER TABLE ws_categories ALTER COLUMN id SET DEFAULT nextval('ws_categories_id_seq');
        SELECT setval('ws_categories_id_seq', (SELECT MAX(id) FROM ws_categories));
        RAISE NOTICE 'Nueva secuencia creada';
    END IF;
END $$;

-- Paso 10: Limpiar tabla temporal de mapeo
DROP TABLE IF EXISTS id_mapping;

-- Paso 11: Verificar resultado final
SELECT 
    'Después de reiniciar' as estado,
    MIN(id) as id_minimo,
    MAX(id) as id_maximo,
    COUNT(*) as total_registros
FROM ws_categories;

-- Mostrar las primeras categorías con sus nuevos IDs
SELECT id, name, store_type 
FROM ws_categories 
ORDER BY id 
LIMIT 10;

-- Verificar que las referencias se actualizaron correctamente
SELECT 
    'Verificación de referencias' as estado,
    COUNT(*) as productos_con_categoria
FROM ws_products 
WHERE category_id IS NOT NULL;
