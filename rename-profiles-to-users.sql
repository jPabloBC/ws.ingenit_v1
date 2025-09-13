-- Renombrar ws_profiles a ws_users

-- 1. Renombrar la tabla
ALTER TABLE ws_profiles RENAME TO ws_users;

-- 2. Verificar que se renombró correctamente
SELECT table_name 
FROM information_schema.tables 
WHERE table_name = 'ws_users';
