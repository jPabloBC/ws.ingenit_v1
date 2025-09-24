-- Schema creation for ws_businesses (versioned locally)
-- Run this in Supabase SQL editor or psql

create table if not exists public.ws_businesses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  store_type text not null,
  description text,
  address text,
  phone text,
  email text,
  configuration jsonb not null default '{}'::jsonb,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Updated_at trigger
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_ws_businesses_updated_at on public.ws_businesses;
create trigger trg_ws_businesses_updated_at
before update on public.ws_businesses
for each row execute function public.set_updated_at();

-- RLS Policies
alter table public.ws_businesses enable row level security;

-- Select own businesses
create policy if not exists "Select own businesses" on public.ws_businesses
for select using (auth.uid() = user_id);

-- Insert own business
create policy if not exists "Insert own business" on public.ws_businesses
for insert with check (auth.uid() = user_id);

-- Update own business
create policy if not exists "Update own business" on public.ws_businesses
for update using (auth.uid() = user_id);

-- Soft delete (deactivate) own business
create policy if not exists "Deactivate own business" on public.ws_businesses
for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Optional: index for user businesses queries
create index if not exists idx_ws_businesses_user_id on public.ws_businesses(user_id);
create index if not exists idx_ws_businesses_user_active on public.ws_businesses(user_id, is_active);

-- NOTE: Ensure gen_random_uuid() extension is available
-- enable with: create extension if not exists pgcrypto;
