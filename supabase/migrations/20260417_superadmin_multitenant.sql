create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role text not null check (role in ('superadmin', 'admin', 'client')),
  client_id uuid references public.clients(id) on delete set null,
  full_name text,
  email text,
  phone text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.client_users (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('admin')),
  created_at timestamptz not null default now(),
  unique (client_id, user_id)
);

alter table public.clients add column if not exists complex_name text;
alter table public.clients add column if not exists phone text;
alter table public.clients add column if not exists address text;
alter table public.clients add column if not exists features jsonb not null default '{"reservas": true, "ventas": true, "ranking": true, "estadisticas": true}'::jsonb;
alter table public.clients add column if not exists enable_statistics boolean not null default true;

alter table public.pitches add column if not exists client_id uuid references public.clients(id) on delete cascade;
alter table public.bookings add column if not exists client_id uuid references public.clients(id) on delete cascade;
alter table public.products add column if not exists client_id uuid references public.clients(id) on delete cascade;
alter table public.sales add column if not exists client_id uuid references public.clients(id) on delete cascade;
alter table public.stock_movements add column if not exists client_id uuid references public.clients(id) on delete cascade;
alter table public.audit_logs add column if not exists client_id uuid references public.clients(id) on delete cascade;
alter table public.notifications add column if not exists client_id uuid references public.clients(id) on delete cascade;
alter table public.deactivated_slots add column if not exists client_id uuid references public.clients(id) on delete cascade;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.current_profile_role()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select role
  from public.profiles
  where id = auth.uid()
  limit 1;
$$;

create or replace function public.current_profile_client_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select client_id
  from public.profiles
  where id = auth.uid()
  limit 1;
$$;

grant execute on function public.current_profile_role() to authenticated;
grant execute on function public.current_profile_client_id() to authenticated;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
before update on public.profiles
for each row
execute function public.set_updated_at();

alter table public.profiles enable row level security;
alter table public.client_users enable row level security;

drop policy if exists "profiles self read" on public.profiles;
create policy "profiles self read"
on public.profiles
for select
to authenticated
using (id = auth.uid());

drop policy if exists "superadmin read profiles" on public.profiles;
create policy "superadmin read profiles"
on public.profiles
for select
to authenticated
using (
  coalesce(
    public.current_profile_role(),
    auth.jwt() -> 'user_metadata' ->> 'role',
    auth.jwt() -> 'app_metadata' ->> 'role'
  ) = 'superadmin'
);

drop policy if exists "superadmin manage clients" on public.clients;
create policy "superadmin manage clients"
on public.clients
for all
to authenticated
using (
  coalesce(
    public.current_profile_role(),
    auth.jwt() -> 'user_metadata' ->> 'role',
    auth.jwt() -> 'app_metadata' ->> 'role'
  ) = 'superadmin'
)
with check (
  coalesce(
    public.current_profile_role(),
    auth.jwt() -> 'user_metadata' ->> 'role',
    auth.jwt() -> 'app_metadata' ->> 'role'
  ) = 'superadmin'
);

drop policy if exists "tenant read own client config" on public.clients;
create policy "tenant read own client config"
on public.clients
for select
to authenticated
using (
  clients.id = coalesce(
    public.current_profile_client_id(),
    nullif(auth.jwt() -> 'user_metadata' ->> 'client_id', '')::uuid,
    nullif(auth.jwt() -> 'app_metadata' ->> 'client_id', '')::uuid
  )
);

drop policy if exists "superadmin read client_users" on public.client_users;
create policy "superadmin read client_users"
on public.client_users
for select
to authenticated
using (
  coalesce(
    public.current_profile_role(),
    auth.jwt() -> 'user_metadata' ->> 'role',
    auth.jwt() -> 'app_metadata' ->> 'role'
  ) = 'superadmin'
);

drop policy if exists "superadmin manage client_users" on public.client_users;
create policy "superadmin manage client_users"
on public.client_users
for all
to authenticated
using (
  coalesce(
    public.current_profile_role(),
    auth.jwt() -> 'user_metadata' ->> 'role',
    auth.jwt() -> 'app_metadata' ->> 'role'
  ) = 'superadmin'
)
with check (
  coalesce(
    public.current_profile_role(),
    auth.jwt() -> 'user_metadata' ->> 'role',
    auth.jwt() -> 'app_metadata' ->> 'role'
  ) = 'superadmin'
);
