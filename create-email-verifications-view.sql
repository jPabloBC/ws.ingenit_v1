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

-- Política para que los usuarios puedan ver solo sus propias verificaciones
CREATE POLICY "Users can view own email verifications" ON public.ws_email_verifications
  FOR SELECT USING (auth.uid() = user_id);

-- Política para que el service_role pueda insertar/actualizar
CREATE POLICY "Service role can manage email verifications" ON public.ws_email_verifications
  FOR ALL USING (auth.role() = 'service_role');
