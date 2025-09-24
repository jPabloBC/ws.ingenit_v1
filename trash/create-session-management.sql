-- Crear tabla para gestión de sesiones activas
CREATE TABLE app_ws.ws_active_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  session_token TEXT NOT NULL,
  device_info JSONB DEFAULT '{}',
  ip_address INET,
  user_agent TEXT,
  last_activity TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP DEFAULT (NOW() + INTERVAL '30 days'),
  is_active BOOLEAN DEFAULT true
);

-- Habilitar RLS
ALTER TABLE app_ws.ws_active_sessions ENABLE ROW LEVEL SECURITY;

-- Crear política RLS
CREATE POLICY "Users can manage own sessions" ON app_ws.ws_active_sessions
  FOR ALL USING (auth.uid() = user_id);

-- Crear VIEW en public
CREATE VIEW public.ws_active_sessions AS
SELECT * FROM app_ws.ws_active_sessions;

-- Habilitar RLS en la VIEW
ALTER VIEW public.ws_active_sessions SET (security_barrier = true);

-- Crear política para la VIEW
CREATE POLICY "Users can manage own sessions view" ON public.ws_active_sessions
  FOR ALL USING (auth.uid() = user_id);

-- Crear índices para performance
CREATE INDEX idx_ws_active_sessions_user_id ON app_ws.ws_active_sessions(user_id);
CREATE INDEX idx_ws_active_sessions_token ON app_ws.ws_active_sessions(session_token);
CREATE INDEX idx_ws_active_sessions_expires ON app_ws.ws_active_sessions(expires_at);
CREATE INDEX idx_ws_active_sessions_active ON app_ws.ws_active_sessions(is_active);

-- Agregar columna max_sessions a ws_users
ALTER TABLE app_ws.ws_users 
ADD COLUMN max_sessions INTEGER DEFAULT 1;

-- Crear función para limpiar sesiones expiradas
CREATE OR REPLACE FUNCTION app_ws.cleanup_expired_sessions()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  UPDATE app_ws.ws_active_sessions 
  SET is_active = false 
  WHERE expires_at < NOW() OR last_activity < (NOW() - INTERVAL '7 days');
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Crear función para obtener sesiones activas de un usuario
CREATE OR REPLACE FUNCTION app_ws.get_user_active_sessions(p_user_id UUID)
RETURNS TABLE (
  id UUID,
  device_info JSONB,
  ip_address INET,
  last_activity TIMESTAMP,
  created_at TIMESTAMP
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    s.id,
    s.device_info,
    s.ip_address,
    s.last_activity,
    s.created_at
  FROM app_ws.ws_active_sessions s
  WHERE s.user_id = p_user_id 
    AND s.is_active = true 
    AND s.expires_at > NOW();
END;
$$ LANGUAGE plpgsql;

-- Crear función para verificar límite de sesiones
CREATE OR REPLACE FUNCTION app_ws.check_session_limit(p_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  active_count INTEGER;
  max_allowed INTEGER;
BEGIN
  -- Obtener número de sesiones activas
  SELECT COUNT(*) INTO active_count
  FROM app_ws.ws_active_sessions
  WHERE user_id = p_user_id 
    AND is_active = true 
    AND expires_at > NOW();
  
  -- Obtener límite máximo del usuario
  SELECT COALESCE(max_sessions, 1) INTO max_allowed
  FROM app_ws.ws_users
  WHERE user_id = p_user_id;
  
  -- Retornar true si puede crear nueva sesión
  RETURN active_count < max_allowed;
END;
$$ LANGUAGE plpgsql;

-- Crear función para crear nueva sesión
CREATE OR REPLACE FUNCTION app_ws.create_user_session(
  p_user_id UUID,
  p_session_token TEXT,
  p_device_info JSONB DEFAULT '{}',
  p_ip_address INET DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  session_id UUID;
  can_create BOOLEAN;
  active_count INTEGER;
  max_allowed INTEGER;
BEGIN
  -- Verificar si puede crear nueva sesión
  SELECT app_ws.check_session_limit(p_user_id) INTO can_create;
  
  IF NOT can_create THEN
    -- Obtener información para el error
    SELECT COUNT(*) INTO active_count
    FROM app_ws.ws_active_sessions
    WHERE user_id = p_user_id 
      AND is_active = true 
      AND expires_at > NOW();
    
    SELECT COALESCE(max_sessions, 1) INTO max_allowed
    FROM app_ws.ws_users
    WHERE user_id = p_user_id;
    
    -- Cerrar sesión más antigua si hay muchas activas
    IF active_count >= max_allowed THEN
      UPDATE app_ws.ws_active_sessions 
      SET is_active = false 
      WHERE user_id = p_user_id 
        AND id = (
          SELECT id 
          FROM app_ws.ws_active_sessions 
          WHERE user_id = p_user_id 
            AND is_active = true 
          ORDER BY last_activity ASC 
          LIMIT 1
        );
    END IF;
  END IF;
  
  -- Crear nueva sesión
  INSERT INTO app_ws.ws_active_sessions (
    user_id, 
    session_token, 
    device_info, 
    ip_address, 
    user_agent
  ) VALUES (
    p_user_id, 
    p_session_token, 
    p_device_info, 
    p_ip_address, 
    p_user_agent
  ) RETURNING id INTO session_id;
  
  RETURN session_id;
END;
$$ LANGUAGE plpgsql;
