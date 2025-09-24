-- =====================================================
-- ARREGLAR ws_categories SI ES UNA VISTA
-- =====================================================

-- Paso 1: Verificar si es vista o tabla
SELECT 
    table_type,
    table_name
FROM information_schema.tables 
WHERE table_name = 'ws_categories';

-- Paso 2: Si es vista, eliminarla
DROP VIEW IF EXISTS ws_categories CASCADE;

-- Paso 3: Crear tabla real con datos
CREATE TABLE ws_categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    color VARCHAR(7),
    store_type VARCHAR(50),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Paso 4: Insertar datos desde la vista original (si existe)
-- NOTA: Necesitarás insertar los datos manualmente ya que no sabemos la estructura de la vista

-- Paso 5: Crear índices
CREATE INDEX IF NOT EXISTS idx_ws_categories_store_type ON ws_categories(store_type);
CREATE INDEX IF NOT EXISTS idx_ws_categories_name ON ws_categories(name);

-- Paso 6: Crear trigger para updated_at
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
