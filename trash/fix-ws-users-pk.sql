-- Agregar clave primaria a ws_users
ALTER TABLE app_ws.ws_users ADD PRIMARY KEY (user_id);

-- Actualizar la vista
DROP VIEW IF EXISTS public.ws_users CASCADE;
CREATE VIEW public.ws_users AS SELECT * FROM app_ws.ws_users;

-- Ahora eliminar el usuario existente
DELETE FROM app_ws.ws_users WHERE email = 'jpalebe@hotmail.com';
