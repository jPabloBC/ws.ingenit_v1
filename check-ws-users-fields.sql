-- Script para verificar campos existentes en ws_users
-- Ejecutar en Supabase SQL Editor

-- 1. Verificar si la tabla existe en app_ws
SELECT 'Verificando tabla ws_users en app_ws:' as info;
SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'app_ws' 
    AND table_name = 'ws_users'
) as table_exists_in_app_ws;

-- 2. Verificar si la tabla existe en public
SELECT 'Verificando tabla ws_users en public:' as info;
SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'ws_users'
) as table_exists_in_public;

-- 3. Verificar si es una vista en public
SELECT 'Verificando si ws_users es una vista en public:' as info;
SELECT table_type 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name = 'ws_users';

-- 4. Mostrar todas las columnas de ws_users en app_ws
SELECT 'Columnas en app_ws.ws_users:' as info;
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default,
    character_maximum_length,
    ordinal_position
FROM information_schema.columns 
WHERE table_schema = 'app_ws' 
AND table_name = 'ws_users'
ORDER BY ordinal_position;

-- 5. Mostrar todas las columnas de ws_users en public (si existe)
SELECT 'Columnas en public.ws_users:' as info;
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default,
    character_maximum_length,
    ordinal_position
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'ws_users'
ORDER BY ordinal_position;

-- 6. Mostrar la definición de la vista (si existe)
SELECT 'Definición de la vista public.ws_users:' as info;
SELECT definition 
FROM information_schema.views 
WHERE table_schema = 'public' 
AND table_name = 'ws_users';

-- 7. Verificar permisos en app_ws.ws_users
SELECT 'Permisos en app_ws.ws_users:' as info;
SELECT 
    grantee, 
    privilege_type, 
    is_grantable
FROM information_schema.table_privileges 
WHERE table_schema = 'app_ws' 
AND table_name = 'ws_users';

-- 8. Verificar permisos en public.ws_users
SELECT 'Permisos en public.ws_users:' as info;
SELECT 
    grantee, 
    privilege_type, 
    is_grantable
FROM information_schema.table_privileges 
WHERE table_schema = 'public' 
AND table_name = 'ws_users';
