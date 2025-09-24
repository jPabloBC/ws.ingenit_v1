-- Script simple para agregar solo la columna phone
-- Ejecutar en Supabase SQL Editor

-- Agregar columna phone
ALTER TABLE app_ws.ws_users 
ADD COLUMN IF NOT EXISTS phone VARCHAR(20);

-- Actualizar la vista en public
DROP VIEW IF EXISTS public.ws_users;
CREATE VIEW public.ws_users AS 
SELECT * FROM app_ws.ws_users;

-- Verificar que se agregó correctamente
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_schema = 'app_ws' 
AND table_name = 'ws_users'
AND column_name = 'phone';
