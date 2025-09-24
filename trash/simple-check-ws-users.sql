-- Script simple para ver campos de ws_users
-- Ejecutar en Supabase SQL Editor

-- Mostrar columnas de app_ws.ws_users
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    character_maximum_length
FROM information_schema.columns 
WHERE table_schema = 'app_ws' 
AND table_name = 'ws_users'
ORDER BY ordinal_position;
