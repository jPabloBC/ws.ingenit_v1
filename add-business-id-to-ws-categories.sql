-- Migration: add business_id to ws_categories
-- Safe, idempotent approach
-- 1. Add column if not exists (nullable first)
alter table if exists public.ws_categories
  add column if not exists business_id uuid null;

-- 2. Backfill strategy:
-- If categories already relate to products that have business_id, infer the most frequent business_id
-- Otherwise leave null so UI can still show them globally until manually assigned.
with cat_usage as (
  select c.id as category_id,
         mode() within group (order by p.business_id) as inferred_business_id
  from public.ws_categories c
  join public.ws_products p on p.category_id = c.id and p.business_id is not null
  group by c.id
)
update public.ws_categories c
set business_id = cu.inferred_business_id
from cat_usage cu
where c.id = cu.category_id
  and c.business_id is null
  and cu.inferred_business_id is not null;

-- 3. (Optional) Default assignment for any remaining null categories:
-- You may associate them to a fallback business or leave them null for manual curation.
-- Example (commented):
-- update public.ws_categories set business_id = (select id from public.ws_businesses order by created_at limit 1)
-- where business_id is null;

-- 4. Create index
create index if not exists idx_ws_categories_business_id on public.ws_categories(business_id);

-- 5. Add FK if table ws_businesses exists and FK not already enforced
DO $$
BEGIN
  IF EXISTS (select 1 from information_schema.tables where table_schema='public' and table_name='ws_businesses') THEN
    -- Check if constraint already exists
    IF NOT EXISTS (
      select 1 from information_schema.table_constraints 
      where table_name='ws_categories' and constraint_type='FOREIGN KEY' and constraint_name='ws_categories_business_id_fkey'
    ) THEN
      ALTER TABLE public.ws_categories
        ADD CONSTRAINT ws_categories_business_id_fkey
        FOREIGN KEY (business_id) REFERENCES public.ws_businesses(id) ON DELETE SET NULL;
    END IF;
  END IF;
END $$;

-- 6. Enable RLS (if not already)
alter table if exists public.ws_categories enable row level security;

-- 7. Policies (idempotent). We allow a category to be visible if:
--   a) category.business_id is null (global) OR
--   b) category.business_id belongs to one of the user's businesses.
-- Insert/Update/Delete restricted to categories whose business belongs to the user.

-- Policies need DROP + CREATE for idempotency (CREATE POLICY IF NOT EXISTS no soportado)
drop policy if exists "Select categories by business or global" on public.ws_categories;
create policy "Select categories by business or global" on public.ws_categories
for select using (
  business_id is null OR business_id in (
    select id from public.ws_businesses where user_id = auth.uid()
  )
);

drop policy if exists "Insert categories for own business" on public.ws_categories;
create policy "Insert categories for own business" on public.ws_categories
for insert with check (
  business_id in (select id from public.ws_businesses where user_id = auth.uid())
  OR business_id is null
);

drop policy if exists "Update categories for own business" on public.ws_categories;
create policy "Update categories for own business" on public.ws_categories
for update using (
  business_id in (select id from public.ws_businesses where user_id = auth.uid())
  OR business_id is null
) with check (
  business_id in (select id from public.ws_businesses where user_id = auth.uid())
  OR business_id is null
);

drop policy if exists "Delete categories for own business" on public.ws_categories;
create policy "Delete categories for own business" on public.ws_categories
for delete using (
  business_id in (select id from public.ws_businesses where user_id = auth.uid())
);

-- 8. (Later) Once all categories have business_id, you can enforce NOT NULL:
-- alter table public.ws_categories alter column business_id set not null;

-- 9. Verification queries (optional):
-- select business_id, count(*) from public.ws_categories group by 1;
-- select * from public.ws_categories where business_id is null limit 20;

-- 10. Rollback snippet (manual):
-- alter table public.ws_categories drop constraint if exists ws_categories_business_id_fkey;
-- drop index if exists idx_ws_categories_business_id;
-- alter table public.ws_categories drop column if exists business_id;
