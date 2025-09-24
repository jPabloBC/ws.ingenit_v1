-- Crear función faltante get_user_current_plan
CREATE OR REPLACE FUNCTION public.get_user_current_plan(user_uuid UUID)
RETURNS TABLE(
  plan_id TEXT,
  plan_name TEXT,
  price DECIMAL,
  status TEXT,
  expires_at TIMESTAMP WITH TIME ZONE
) 
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    sp.id::TEXT as plan_id,
    sp.name as plan_name,
    sp.price,
    'active'::TEXT as status,
    (CURRENT_TIMESTAMP + INTERVAL '1 year') as expires_at
  FROM ws_users u
  LEFT JOIN ws_subscription_plans sp ON u.plan_id = sp.id
  WHERE u.user_id = user_uuid
  LIMIT 1;
END;
$$;
