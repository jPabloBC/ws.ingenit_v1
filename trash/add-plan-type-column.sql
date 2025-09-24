-- Agregar columna plan_type a ws_users
ALTER TABLE app_ws.ws_users 
ADD COLUMN plan_type VARCHAR(50) DEFAULT 'free';

-- Actualizar valores por defecto
UPDATE app_ws.ws_users 
SET plan_type = 'free' 
WHERE plan_type IS NULL;

-- Crear índice para performance
CREATE INDEX idx_ws_users_plan_type ON app_ws.ws_users(plan_type);

-- Ejemplo de actualización de límites según plan (ejecutar después)
-- UPDATE app_ws.ws_users 
-- SET max_sessions = 1 
-- WHERE plan_type = 'free';

-- UPDATE app_ws.ws_users 
-- SET max_sessions = 3 
-- WHERE plan_type = 'monthly';

-- UPDATE app_ws.ws_users 
-- SET max_sessions = 5 
-- WHERE plan_type = 'annual';
