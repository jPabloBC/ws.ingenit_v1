-- Script para agregar columnas faltantes a la tabla ws_users
-- Ejecutar en Supabase SQL Editor

-- Agregar columna country
ALTER TABLE app_ws.ws_users 
ADD COLUMN IF NOT EXISTS country VARCHAR(100);

-- Agregar columna country_code si no existe
ALTER TABLE app_ws.ws_users 
ADD COLUMN IF NOT EXISTS country_code VARCHAR(10);

-- Agregar columna currency_code si no existe
ALTER TABLE app_ws.ws_users 
ADD COLUMN IF NOT EXISTS currency_code VARCHAR(10);

-- Agregar columna email_verified si no existe
ALTER TABLE app_ws.ws_users 
ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT FALSE;

-- Agregar columna created_at si no existe
ALTER TABLE app_ws.ws_users 
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Agregar columna updated_at si no existe
ALTER TABLE app_ws.ws_users 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Actualizar la vista en el esquema public
DROP VIEW IF EXISTS public.ws_users;
CREATE VIEW public.ws_users AS 
SELECT * FROM app_ws.ws_users;

-- Comentarios para documentar las columnas
COMMENT ON COLUMN app_ws.ws_users.country IS 'Nombre del país del usuario';
COMMENT ON COLUMN app_ws.ws_users.country_code IS 'Código ISO del país (ej: CL, US, MX)';
COMMENT ON COLUMN app_ws.ws_users.currency_code IS 'Código de moneda (ej: CLP, USD, MXN)';
COMMENT ON COLUMN app_ws.ws_users.email_verified IS 'Indica si el email del usuario está verificado';
COMMENT ON COLUMN app_ws.ws_users.phone IS 'Número de teléfono completo con código de país (sin +)';

-- Verificar que las columnas se agregaron correctamente
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_schema = 'app_ws' 
AND table_name = 'ws_users'
ORDER BY ordinal_position;
