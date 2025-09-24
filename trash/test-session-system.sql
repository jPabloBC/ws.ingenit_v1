-- Script para probar el sistema de sesiones

-- 1. Verificar usuarios y sus límites
SELECT 
  user_id,
  email,
  plan_type,
  max_sessions,
  created_at
FROM app_ws.ws_users 
ORDER BY created_at DESC;

-- 2. Verificar sesiones activas actuales
SELECT 
  s.id,
  s.user_id,
  u.email,
  s.device_info,
  s.last_activity,
  s.created_at,
  s.expires_at,
  s.is_active
FROM app_ws.ws_active_sessions s
LEFT JOIN app_ws.ws_users u ON s.user_id = u.user_id
WHERE s.is_active = true
ORDER BY s.created_at DESC;

-- 3. Limpiar todas las sesiones activas (para testing)
UPDATE app_ws.ws_active_sessions 
SET is_active = false 
WHERE is_active = true;

-- 4. Verificar que se limpiaron
SELECT COUNT(*) as active_sessions_count
FROM app_ws.ws_active_sessions 
WHERE is_active = true;

-- 5. Actualizar límites de sesiones para todos los usuarios
UPDATE app_ws.ws_users 
SET max_sessions = 3 
WHERE max_sessions IS NULL OR max_sessions < 3;

-- 6. Verificar la actualización
SELECT 
  user_id,
  email,
  plan_type,
  max_sessions
FROM app_ws.ws_users 
ORDER BY created_at DESC;


