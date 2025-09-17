-- Create a privileged function to fetch dashboard metrics by business, with owner check
-- This helps when some historical rows lack user_id but do have business_id.

create or replace function public.get_dashboard_metrics(business_uuid uuid)
returns table (
  products_count integer,
  customers_count integer,
  sales_today numeric,
  orders_today integer,
  recent_sales jsonb,
  low_stock jsonb
)
language plpgsql
security definer
set search_path = public
as $$
declare
  today_start timestamptz := date_trunc('day', timezone('utc', now()));
begin
  -- Authorization: ensure the caller owns the business
  if not exists (
    select 1 from ws_businesses b
    where b.id = business_uuid and b.user_id = auth.uid()
  ) then
    raise exception 'not authorized';
  end if;

  -- Products count
  select count(*) into products_count
  from ws_products
  where business_id = business_uuid;

  -- Customers count
  select count(*) into customers_count
  from ws_customers
  where business_id = business_uuid;

  -- Sales summary for today
  select coalesce(sum(total_amount), 0), count(*)
  into sales_today, orders_today
  from ws_sales
  where business_id = business_uuid
    and created_at >= today_start;

  -- Recent sales (last 3)
  select coalesce(
    jsonb_agg(jsonb_build_object(
      'id', id,
      'total_amount', total_amount,
      'created_at', created_at
    ) order by created_at desc),
    '[]'::jsonb
  ) into recent_sales
  from (
    select id, total_amount, created_at
    from ws_sales
    where business_id = business_uuid
    order by created_at desc
    limit 3
  ) s;

  -- Low stock alerts (<= min_stock)
  select coalesce(
    jsonb_agg(jsonb_build_object(
      'id', id,
      'name', name,
      'stock', stock,
      'min_stock', min_stock
    )),
    '[]'::jsonb
  ) into low_stock
  from (
    select id, name, stock, min_stock
    from ws_products
    where business_id = business_uuid
      and stock <= min_stock
    limit 5
  ) p;

  return next;
end;
$$;

grant execute on function public.get_dashboard_metrics(uuid) to authenticated;
