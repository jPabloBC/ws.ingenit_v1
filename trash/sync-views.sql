-- Script para sincronizar las vistas de public con las tablas de app_ws
-- Elimina vistas que no tienen tabla correspondiente en app_ws

-- 1. Eliminar vistas que no tienen tabla correspondiente en app_ws
DO $$
DECLARE
    view_name TEXT;
    table_exists BOOLEAN;
BEGIN
    -- Obtener todas las vistas en el schema public que empiecen con 'ws_'
    FOR view_name IN 
        SELECT schemaname||'.'||viewname as full_name
        FROM pg_views 
        WHERE schemaname = 'public' 
        AND viewname LIKE 'ws_%'
    LOOP
        -- Verificar si existe la tabla correspondiente en app_ws
        SELECT EXISTS (
            SELECT 1 
            FROM information_schema.tables 
            WHERE table_schema = 'app_ws' 
            AND table_name = split_part(view_name, '.', 2)
        ) INTO table_exists;
        
        -- Si no existe la tabla, eliminar la vista
        IF NOT table_exists THEN
            EXECUTE 'DROP VIEW IF EXISTS ' || view_name || ' CASCADE';
            RAISE NOTICE 'Vista eliminada: % (no existe tabla en app_ws)', view_name;
        ELSE
            RAISE NOTICE 'Vista mantenida: % (existe tabla en app_ws)', view_name;
        END IF;
    END LOOP;
END $$;

-- 2. Crear vistas faltantes para tablas que existen en app_ws pero no tienen vista en public
DO $$
DECLARE
    tbl_name TEXT;
    view_exists BOOLEAN;
    create_view_sql TEXT;
BEGIN
    -- Obtener todas las tablas en app_ws que empiecen con 'ws_'
    FOR tbl_name IN 
        SELECT t.table_name
        FROM information_schema.tables t
        WHERE t.table_schema = 'app_ws' 
        AND t.table_name LIKE 'ws_%'
    LOOP
        -- Verificar si existe la vista correspondiente en public
        SELECT EXISTS (
            SELECT 1 
            FROM information_schema.views v
            WHERE v.table_schema = 'public' 
            AND v.table_name = tbl_name
        ) INTO view_exists;
        
        -- Si no existe la vista, crearla
        IF NOT view_exists THEN
            create_view_sql := 'CREATE VIEW public.' || tbl_name || ' AS SELECT * FROM app_ws.' || tbl_name;
            EXECUTE create_view_sql;
            RAISE NOTICE 'Vista creada: public.% (tabla existe en app_ws)', tbl_name;
        ELSE
            RAISE NOTICE 'Vista ya existe: public.%', tbl_name;
        END IF;
    END LOOP;
END $$;

-- 3. Mostrar resumen final
SELECT 
    'VISTAS EN PUBLIC' as tipo,
    viewname as nombre,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.tables 
            WHERE table_schema = 'app_ws' AND table_name = viewname
        ) THEN 'SINCRONIZADA'
        ELSE 'SIN TABLA EN APP_WS'
    END as estado
FROM pg_views 
WHERE schemaname = 'public' AND viewname LIKE 'ws_%'

UNION ALL

SELECT 
    'TABLAS EN APP_WS' as tipo,
    t.table_name as nombre,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.views v
            WHERE v.table_schema = 'public' AND v.table_name = t.table_name
        ) THEN 'TIENE VISTA'
        ELSE 'SIN VISTA EN PUBLIC'
    END as estado
FROM information_schema.tables t
WHERE t.table_schema = 'app_ws' AND t.table_name LIKE 'ws_%'

ORDER BY tipo, nombre;
