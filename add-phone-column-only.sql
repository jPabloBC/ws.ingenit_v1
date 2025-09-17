-- Script para agregar SOLO la columna 'phone' a app_ws.ws_users
-- Ejecutar en Supabase SQL Editor

-- 1. Agregar la columna 'phone' si no existe
ALTER TABLE app_ws.ws_users
ADD COLUMN IF NOT EXISTS phone VARCHAR(20);

-- 2. Actualizar valores por defecto para la columna 'phone' en registros existentes
UPDATE app_ws.ws_users
SET phone = '56900000000' -- Valor por defecto para registros existentes
WHERE phone IS NULL;

-- 3. Recrear la vista en public para reflejar los cambios
DROP VIEW IF EXISTS public.ws_users;
CREATE VIEW public.ws_users AS
SELECT * FROM app_ws.ws_users;

-- 4. Agregar comentario para documentar la columna 'phone'
COMMENT ON COLUMN app_ws.ws_users.phone IS 'Número de teléfono completo con código de país (sin +)';

-- 5. Verificar que la columna se agregó correctamente
SELECT 'Verificación: Columna phone agregada' as info;
SELECT column_name, data_type, character_maximum_length
FROM information_schema.columns 
WHERE table_schema = 'app_ws' 
AND table_name = 'ws_users' 
AND column_name = 'phone';

-- 6. Verificar que la vista funciona
SELECT 'Verificación: Vista recreada' as info;
SELECT COUNT(*) as total_records FROM public.ws_users;
