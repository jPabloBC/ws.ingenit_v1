-- SOLUCIÓN FINAL - REINICIAR IDs DE ws_categories

-- 1. Verificar estructura actual
SELECT table_type FROM information_schema.tables WHERE table_name = 'ws_categories';

-- 2. Si es vista, eliminarla
DROP VIEW IF EXISTS ws_categories CASCADE;

-- 3. Crear tabla real
CREATE TABLE ws_categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    color VARCHAR(7),
    store_type VARCHAR(50),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- 4. Insertar datos con IDs del 1 al 43
INSERT INTO ws_categories (id, name, description, color, store_type, created_at, updated_at) VALUES
(1, 'Electrónicos', 'Dispositivos electrónicos y accesorios', '#FF6B6B', 'retail', NOW(), NOW()),
(2, 'Ropa', 'Ropa y accesorios de moda', '#4ECDC4', 'retail', NOW(), NOW()),
(3, 'Hogar', 'Artículos para el hogar', '#45B7D1', 'retail', NOW(), NOW()),
(4, 'Deportes', 'Equipos y accesorios deportivos', '#96CEB4', 'retail', NOW(), NOW()),
(5, 'Libros', 'Libros y material educativo', '#FFEAA7', 'retail', NOW(), NOW()),
(6, 'Juguetes', 'Juguetes y juegos', '#DDA0DD', 'retail', NOW(), NOW()),
(7, 'Belleza', 'Productos de belleza y cuidado personal', '#FFB6C1', 'retail', NOW(), NOW()),
(8, 'Automóviles', 'Repuestos y accesorios para autos', '#98D8C8', 'retail', NOW(), NOW()),
(9, 'Música', 'Instrumentos y accesorios musicales', '#F7DC6F', 'retail', NOW(), NOW()),
(10, 'Jardín', 'Herramientas y plantas para jardín', '#82E0AA', 'retail', NOW(), NOW()),
(11, 'Oficina', 'Suministros y equipos de oficina', '#85C1E9', 'retail', NOW(), NOW()),
(12, 'Salud', 'Productos de salud y bienestar', '#F8C471', 'retail', NOW(), NOW()),
(13, 'Mascotas', 'Productos para mascotas', '#BB8FCE', 'retail', NOW(), NOW()),
(14, 'Viajes', 'Accesorios y equipos de viaje', '#85C1E9', 'retail', NOW(), NOW()),
(15, 'Fotografía', 'Cámaras y accesorios fotográficos', '#F7DC6F', 'retail', NOW(), NOW()),
(16, 'Cocina', 'Utensilios y electrodomésticos de cocina', '#82E0AA', 'retail', NOW(), NOW()),
(17, 'Bebé', 'Productos para bebés y niños pequeños', '#F8C471', 'retail', NOW(), NOW()),
(18, 'Fitness', 'Equipos y accesorios de fitness', '#BB8FCE', 'retail', NOW(), NOW()),
(19, 'Tecnología', 'Gadgets y tecnología', '#85C1E9', 'retail', NOW(), NOW()),
(20, 'Arte', 'Materiales y herramientas de arte', '#F7DC6F', 'retail', NOW(), NOW()),
(21, 'Construcción', 'Herramientas y materiales de construcción', '#82E0AA', 'retail', NOW(), NOW()),
(22, 'Camping', 'Equipos y accesorios de camping', '#F8C471', 'retail', NOW(), NOW()),
(23, 'Navidad', 'Decoraciones y artículos navideños', '#BB8FCE', 'retail', NOW(), NOW()),
(24, 'Halloween', 'Disfraces y decoraciones de Halloween', '#85C1E9', 'retail', NOW(), NOW()),
(25, 'Graduación', 'Artículos para ceremonias de graduación', '#F7DC6F', 'retail', NOW(), NOW()),
(26, 'Boda', 'Artículos y decoraciones para bodas', '#82E0AA', 'retail', NOW(), NOW()),
(27, 'Cumpleaños', 'Decoraciones y artículos para cumpleaños', '#F8C471', 'retail', NOW(), NOW()),
(28, 'Aniversario', 'Regalos y artículos para aniversarios', '#BB8FCE', 'retail', NOW(), NOW()),
(29, 'Día de la Madre', 'Regalos y artículos para el Día de la Madre', '#85C1E9', 'retail', NOW(), NOW()),
(30, 'Día del Padre', 'Regalos y artículos para el Día del Padre', '#F7DC6F', 'retail', NOW(), NOW()),
(31, 'San Valentín', 'Regalos y artículos para San Valentín', '#82E0AA', 'retail', NOW(), NOW()),
(32, 'Pascua', 'Decoraciones y artículos de Pascua', '#F8C471', 'retail', NOW(), NOW()),
(33, 'Día de Acción de Gracias', 'Decoraciones y artículos de Acción de Gracias', '#BB8FCE', 'retail', NOW(), NOW()),
(34, 'Año Nuevo', 'Decoraciones y artículos de Año Nuevo', '#85C1E9', 'retail', NOW(), NOW()),
(35, 'Verano', 'Productos y accesorios de verano', '#F7DC6F', 'retail', NOW(), NOW()),
(36, 'Invierno', 'Productos y accesorios de invierno', '#82E0AA', 'retail', NOW(), NOW()),
(37, 'Primavera', 'Productos y accesorios de primavera', '#F8C471', 'retail', NOW(), NOW()),
(38, 'Otoño', 'Productos y accesorios de otoño', '#BB8FCE', 'retail', NOW(), NOW()),
(39, 'Vintage', 'Productos y artículos vintage', '#85C1E9', 'retail', NOW(), NOW()),
(40, 'Moda', 'Ropa y accesorios de moda', '#F7DC6F', 'retail', NOW(), NOW()),
(41, 'Lujo', 'Productos de lujo y alta gama', '#82E0AA', 'retail', NOW(), NOW()),
(42, 'Económico', 'Productos económicos y de bajo costo', '#F8C471', 'retail', NOW(), NOW()),
(43, 'Premium', 'Productos premium y de alta calidad', '#BB8FCE', 'retail', NOW(), NOW());

-- 5. Crear índices
CREATE INDEX idx_ws_categories_store_type ON ws_categories(store_type);
CREATE INDEX idx_ws_categories_name ON ws_categories(name);

-- 6. Crear trigger para updated_at
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

-- 7. Verificar resultado
SELECT MIN(id), MAX(id), COUNT(*) FROM ws_categories;
