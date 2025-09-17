-- Actualizar límites de sesiones para usuarios existentes
UPDATE app_ws.ws_users 
SET max_sessions = 3 
WHERE plan_type = 'free';

-- Verificar la actualización
SELECT email, plan_type, max_sessions 
FROM app_ws.ws_users 
WHERE email = 'jpalebe@hotmail.com';
