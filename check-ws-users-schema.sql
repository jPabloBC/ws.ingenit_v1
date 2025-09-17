-- Script para verificar el esquema actual de la tabla ws_users
-- Ejecutar en Supabase SQL Editor

-- Verificar columnas existentes en ws_users
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default,
    character_maximum_length
FROM information_schema.columns 
WHERE table_schema = 'app_ws' 
AND table_name = 'ws_users'
ORDER BY ordinal_position;

-- Verificar si la tabla existe
SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'app_ws' 
    AND table_name = 'ws_users'
) as table_exists;

-- Verificar permisos en la tabla
SELECT 
    grantee, 
    privilege_type, 
    is_grantable
FROM information_schema.table_privileges 
WHERE table_schema = 'app_ws' 
AND table_name = 'ws_users';
