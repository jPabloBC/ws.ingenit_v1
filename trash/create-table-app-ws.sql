-- Crear tabla ws_email_verifications en app_ws schema
CREATE TABLE IF NOT EXISTS app_ws.ws_email_verifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  verified BOOLEAN DEFAULT FALSE,
  verification_token TEXT,
  verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Habilitar RLS
ALTER TABLE app_ws.ws_email_verifications ENABLE ROW LEVEL SECURITY;

-- Política para que los usuarios puedan ver solo sus propias verificaciones
CREATE POLICY "Users can view own email verifications" ON app_ws.ws_email_verifications
  FOR SELECT USING (auth.uid() = user_id);

-- Política para que el service_role pueda insertar/actualizar
CREATE POLICY "Service role can manage email verifications" ON app_ws.ws_email_verifications
  FOR ALL USING (auth.role() = 'service_role');

-- Índice para búsquedas por email
CREATE INDEX IF NOT EXISTS idx_ws_email_verifications_email ON app_ws.ws_email_verifications(email);

-- Índice para búsquedas por user_id
CREATE INDEX IF NOT EXISTS idx_ws_email_verifications_user_id ON app_ws.ws_email_verifications(user_id);

-- Crear VIEW en public que refleje la tabla de app_ws
CREATE OR REPLACE VIEW public.ws_email_verifications AS
SELECT 
  id,
  user_id,
  email,
  verified,
  verification_token,
  verified_at,
  created_at
FROM app_ws.ws_email_verifications;

-- Habilitar RLS en la VIEW
ALTER VIEW public.ws_email_verifications SET (security_barrier = true);

-- Política para que los usuarios puedan ver solo sus propias verificaciones en la VIEW
CREATE POLICY "Users can view own email verifications view" ON public.ws_email_verifications
  FOR SELECT USING (auth.uid() = user_id);

-- Política para que el service_role pueda insertar/actualizar en la VIEW
CREATE POLICY "Service role can manage email verifications view" ON public.ws_email_verifications
  FOR ALL USING (auth.role() = 'service_role');
