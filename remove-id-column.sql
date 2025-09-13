-- Eliminar columna id de ws_users ya que user_id es único
-- Primero eliminar la vista que depende de la columna
DROP VIEW IF EXISTS public.ws_users CASCADE;

-- Ahora eliminar la columna id
ALTER TABLE app_ws.ws_users DROP COLUMN id;

-- Recrear la vista sin la columna id
CREATE VIEW public.ws_users AS SELECT * FROM app_ws.ws_users;
