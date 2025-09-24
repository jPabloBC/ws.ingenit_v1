-- SOLUCIÓN CORRECTA - REINICIAR IDs EN app_ws.ws_categories

-- 1. Verificar datos actuales en app_ws
SELECT 
    'Antes' as estado,
    MIN(id) as id_minimo,
    MAX(id) as id_maximo,
    COUNT(*) as total
FROM app_ws.ws_categories;

-- 2. Crear tabla temporal con IDs reiniciados
CREATE TABLE app_ws.ws_categories_temp AS 
SELECT 
    ROW_NUMBER() OVER (ORDER BY id) as id,
    name,
    description,
    color,
    store_type,
    created_at,
    updated_at
FROM app_ws.ws_categories;

-- 3. Mostrar mapeo de IDs
SELECT 
    c.id as id_viejo,
    t.id as id_nuevo,
    c.name
FROM app_ws.ws_categories c
JOIN app_ws.ws_categories_temp t ON c.name = t.name
ORDER BY c.id;

-- 4. Actualizar referencias en ws_products
UPDATE app_ws.ws_products 
SET category_id = t.id
FROM app_ws.ws_categories c
JOIN app_ws.ws_categories_temp t ON c.name = t.name
WHERE app_ws.ws_products.category_id = c.id;

-- 5. Reemplazar tabla original
DROP TABLE app_ws.ws_categories CASCADE;
ALTER TABLE app_ws.ws_categories_temp RENAME TO ws_categories;

-- 6. Recrear constraints
ALTER TABLE app_ws.ws_categories ADD PRIMARY KEY (id);
ALTER TABLE app_ws.ws_categories ALTER COLUMN id SET NOT NULL;

-- 7. Crear índices
CREATE INDEX idx_ws_categories_store_type ON app_ws.ws_categories(store_type);
CREATE INDEX idx_ws_categories_name ON app_ws.ws_categories(name);

-- 8. Crear trigger
CREATE OR REPLACE FUNCTION app_ws.update_ws_categories_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_ws_categories_updated_at 
    BEFORE UPDATE ON app_ws.ws_categories 
    FOR EACH ROW 
    EXECUTE FUNCTION app_ws.update_ws_categories_updated_at();

-- 9. Verificar resultado
SELECT 
    'Después' as estado,
    MIN(id) as id_minimo,
    MAX(id) as id_maximo,
    COUNT(*) as total
FROM app_ws.ws_categories;
