-- =====================================================
-- REINICIAR IDs DE ws_categories DESDE 1
-- =====================================================

-- Paso 1: Verificar datos actuales
SELECT 
    'Antes de reiniciar' as estado,
    MIN(id) as id_minimo,
    MAX(id) as id_maximo,
    COUNT(*) as total_registros
FROM ws_categories;

-- Paso 2: Crear tabla temporal con IDs reiniciados
CREATE TABLE ws_categories_temp AS 
SELECT 
    ROW_NUMBER() OVER (ORDER BY id) as new_id,
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
    old_id,
    new_id
FROM (
    SELECT 
        c.id as old_id,
        t.new_id
    FROM ws_categories c
    JOIN ws_categories_temp t ON c.name = t.name
) mapping;

-- Paso 4: Actualizar referencias en ws_products (si existe)
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
            UPDATE ws_products 
            SET category_id = mapping_record.new_id::text
            WHERE category_id::integer = mapping_record.old_id;
        END LOOP;
        
        RAISE NOTICE 'Referencias en ws_products actualizadas';
    ELSE
        RAISE NOTICE 'Tabla ws_products no existe, saltando actualización de referencias';
    END IF;
END $$;

-- Paso 5: Eliminar tabla original y renombrar la temporal
DROP TABLE ws_categories CASCADE;

-- Renombrar tabla temporal
ALTER TABLE ws_categories_temp RENAME TO ws_categories;

-- Paso 6: Recrear constraints e índices
ALTER TABLE ws_categories ADD PRIMARY KEY (id);
ALTER TABLE ws_categories ALTER COLUMN id SET NOT NULL;

-- Crear índices
CREATE INDEX IF NOT EXISTS idx_ws_categories_store_type ON ws_categories(store_type);
CREATE INDEX IF NOT EXISTS idx_ws_categories_name ON ws_categories(name);

-- Paso 7: Recrear trigger para updated_at
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

-- Paso 8: Reiniciar la secuencia (si existe)
DO $$
BEGIN
    -- Verificar si existe una secuencia para ws_categories
    IF EXISTS (SELECT 1 FROM pg_sequences WHERE sequencename LIKE '%ws_categories%') THEN
        -- Reiniciar la secuencia al siguiente ID disponible
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

-- Paso 9: Limpiar tabla temporal de mapeo
DROP TABLE IF EXISTS id_mapping;

-- Paso 10: Verificar resultado final
SELECT 
    'Después de reiniciar' as estado,
    MIN(id) as id_minimo,
    MAX(id) as id_maximo,
    COUNT(*) as total_registros
FROM ws_categories;

-- Mostrar las primeras categorías
SELECT id, name, store_type 
FROM ws_categories 
ORDER BY id 
LIMIT 10;
