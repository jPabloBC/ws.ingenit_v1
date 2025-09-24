-- Migración completa para ws_users
-- Ejecutar en Supabase SQL Editor

-- 1. Verificar esquema actual
SELECT 'Esquema actual de ws_users:' as info;
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_schema = 'app_ws' 
AND table_name = 'ws_users'
ORDER BY ordinal_position;

-- 2. Agregar columnas faltantes
ALTER TABLE app_ws.ws_users 
ADD COLUMN IF NOT EXISTS phone VARCHAR(20);

ALTER TABLE app_ws.ws_users 
ADD COLUMN IF NOT EXISTS country VARCHAR(100);

ALTER TABLE app_ws.ws_users 
ADD COLUMN IF NOT EXISTS country_code VARCHAR(10);

ALTER TABLE app_ws.ws_users 
ADD COLUMN IF NOT EXISTS currency_code VARCHAR(10);

ALTER TABLE app_ws.ws_users 
ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT FALSE;

ALTER TABLE app_ws.ws_users 
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

ALTER TABLE app_ws.ws_users 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- 3. Actualizar valores por defecto para registros existentes
UPDATE app_ws.ws_users 
SET 
    phone = '+56900000000',
    country = 'Chile',
    country_code = 'CL',
    currency_code = 'CLP',
    email_verified = FALSE,
    created_at = NOW(),
    updated_at = NOW()
WHERE phone IS NULL 
   OR country IS NULL 
   OR country_code IS NULL 
   OR currency_code IS NULL 
   OR email_verified IS NULL 
   OR created_at IS NULL 
   OR updated_at IS NULL;

-- 4. Recrear la vista en public
DROP VIEW IF EXISTS public.ws_users;
CREATE VIEW public.ws_users AS 
SELECT * FROM app_ws.ws_users;

-- 5. Otorgar permisos necesarios
GRANT SELECT, INSERT, UPDATE, DELETE ON app_ws.ws_users TO authenticated;
GRANT SELECT ON public.ws_users TO authenticated;

-- 6. Verificar esquema final
SELECT 'Esquema final de ws_users:' as info;
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_schema = 'app_ws' 
AND table_name = 'ws_users'
ORDER BY ordinal_position;

-- 7. Agregar comentarios para documentar las columnas
COMMENT ON COLUMN app_ws.ws_users.phone IS 'Número de teléfono completo con código de país (sin +)';
COMMENT ON COLUMN app_ws.ws_users.country IS 'Nombre del país del usuario';
COMMENT ON COLUMN app_ws.ws_users.country_code IS 'Código ISO del país (ej: CL, US, MX)';
COMMENT ON COLUMN app_ws.ws_users.currency_code IS 'Código de moneda (ej: CLP, USD, MXN)';
COMMENT ON COLUMN app_ws.ws_users.email_verified IS 'Indica si el email del usuario está verificado';

-- 8. Verificar que la vista funciona
SELECT 'Vista creada correctamente:' as info;
SELECT COUNT(*) as total_records FROM public.ws_users;
