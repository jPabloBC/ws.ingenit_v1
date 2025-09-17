-- Migration: Ensure public views expose business_id by selecting all columns from app_ws tables
-- Date: 2025-09-17

-- Ventas: la vista pública debe reflejar todos los campos, incluido business_id
CREATE OR REPLACE VIEW public.ws_sales AS
SELECT *
FROM app_ws.ws_sales;

-- Opcional: usar SECURITY INVOKER para que se apliquen los permisos del invocador
ALTER VIEW public.ws_sales SET (security_invoker = on);

-- Clientes: misma estrategia
CREATE OR REPLACE VIEW public.ws_customers AS
SELECT *
FROM app_ws.ws_customers;

ALTER VIEW public.ws_customers SET (security_invoker = on);

-- Nota: si existen dependencias que requieran columnas específicas, asegúrate de que consuman columnas por nombre.
-- Esta vista simple mantiene la actualizabilidad (INSERT/UPDATE/DELETE) al ser un SELECT directo de una sola tabla.
