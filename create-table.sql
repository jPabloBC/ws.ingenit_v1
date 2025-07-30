-- Script para crear la tabla ws_profiles
-- Copia y pega esto en el SQL Editor de Supabase

-- Eliminar la tabla si existe (¡CUIDADO! Esto borrará datos existentes)
DROP TABLE IF EXISTS ws_profiles CASCADE;

-- Crear la tabla ws_profiles
CREATE TABLE ws_profiles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  store_types TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar RLS
ALTER TABLE ws_profiles ENABLE ROW LEVEL SECURITY;

-- Crear política para permitir todas las operaciones
CREATE POLICY "Allow all operations on ws_profiles" ON ws_profiles FOR ALL USING (true);

-- Insertar un registro de prueba
INSERT INTO ws_profiles (name, email, store_types) 
VALUES ('Test User', 'test@example.com', ARRAY['almacen']);

-- Verificar que se creó correctamente
SELECT * FROM ws_profiles;

-- Limpiar el registro de prueba
DELETE FROM ws_profiles WHERE email = 'test@example.com'; 