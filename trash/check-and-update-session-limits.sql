-- Verificar y actualizar límites de sesiones
-- Este script verifica si los usuarios tienen max_sessions configurado y lo establece

-- 1. Verificar usuarios sin max_sessions configurado
SELECT 
  user_id,
  email,
  plan_type,
  max_sessions,
  CASE 
    WHEN max_sessions IS NULL THEN 'SIN CONFIGURAR'
    ELSE 'CONFIGURADO'
  END as status
FROM app_ws.ws_users 
ORDER BY created_at DESC;

-- 2. Actualizar usuarios sin max_sessions (establecer límite por defecto)
UPDATE app_ws.ws_users 
SET max_sessions = 3 
WHERE max_sessions IS NULL 
  AND plan_type = 'free';

-- 3. Actualizar usuarios con plan free a 3 sesiones
UPDATE app_ws.ws_users 
SET max_sessions = 3 
WHERE plan_type = 'free';

-- 4. Verificar la actualización
SELECT 
  user_id,
  email,
  plan_type,
  max_sessions,
  'ACTUALIZADO' as status
FROM app_ws.ws_users 
WHERE plan_type = 'free'
ORDER BY created_at DESC;

-- 5. Verificar sesiones activas actuales
SELECT 
  u.email,
  u.max_sessions,
  COUNT(s.id) as active_sessions
FROM app_ws.ws_users u
LEFT JOIN app_ws.ws_active_sessions s ON u.user_id = s.user_id 
  AND s.is_active = true 
  AND s.expires_at > NOW()
GROUP BY u.user_id, u.email, u.max_sessions
ORDER BY u.created_at DESC;


