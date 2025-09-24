-- Agrega columna business_id a ws_products de forma idempotente
-- Ejecutar en Supabase/psql

-- 1. Asegurar extensión uuid si se necesita (gen_random_uuid usado en otras tablas)
create extension if not exists pgcrypto;

-- 2. Agregar columna si no existe
do $$
begin
  if not exists (
    select 1 from information_schema.columns 
    where table_name='ws_products' and column_name='business_id'
  ) then
    alter table public.ws_products add column business_id uuid;
  end if;
end $$;

-- 3. (Opcional) Agregar índice para consultas por negocio
create index if not exists idx_ws_products_business_id on public.ws_products(business_id);

-- 4. (Opcional) Llave foránea (solo si ya existe ws_businesses y los datos se han limpiado)
do $$
begin
  if exists (select 1 from information_schema.tables where table_name='ws_businesses') then
    -- Evitar recrear constraint
    if not exists (
      select 1 from information_schema.table_constraints 
      where table_name='ws_products' and constraint_name='ws_products_business_id_fkey'
    ) then
      alter table public.ws_products
        add constraint ws_products_business_id_fkey
        foreign key (business_id) references public.ws_businesses(id) on delete set null;
    end if;
  end if;
end $$;

-- 5. (Opcional) Backfill simple: asignar primer negocio del usuario si hay exactamente uno y el campo está nulo
--    Revisa primero en modo SELECT antes de ejecutar update masivo.
-- update public.ws_products p
-- set business_id = b.id
-- from public.ws_businesses b
-- where p.user_id = b.user_id
--   and p.business_id is null
--   and b.is_active is true
--   and (
--     select count(*) from public.ws_businesses b2
--     where b2.user_id = p.user_id and b2.is_active is true
--   ) = 1;

-- 6. (Opcional) Establecer NOT NULL sólo cuando estés seguro (de momento lo dejamos nullable)
-- alter table public.ws_products alter column business_id set not null;

-- 7. Políticas RLS se pueden reforzar después:
-- using (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id)
-- and business_id in (select id from public.ws_businesses where user_id = auth.uid())

-- FIN
