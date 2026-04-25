begin;

-- Source of truth for tenant and role resolution.
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

-- Explicitly separate public presentation fields from internal fields.
alter table public.clients
  add column if not exists public_slug text,
  add column if not exists public_display_name text,
  add column if not exists public_description text,
  add column if not exists public_address text,
  add column if not exists public_phone text,
  add column if not exists public_catalog_enabled boolean not null default true,
  add column if not exists public_booking_enabled boolean not null default true;

alter table public.pitches
  add column if not exists is_public boolean not null default true;

create unique index if not exists idx_clients_public_slug_unique
  on public.clients (lower(public_slug))
  where public_slug is not null;

alter table public.profiles enable row level security;
alter table public.clients enable row level security;
alter table public.client_users enable row level security;
alter table public.audit_logs enable row level security;
alter table public.bookings enable row level security;
alter table public.sales enable row level security;
alter table public.pitches enable row level security;

-- Remove all existing policies from the private base tables to avoid overlaps.
do $$
declare
  policy_row record;
begin
  for policy_row in
    select schemaname, tablename, policyname
    from pg_policies
    where schemaname = 'public'
      and tablename in (
        'profiles',
        'clients',
        'client_users',
        'audit_logs',
        'bookings',
        'sales',
        'pitches'
      )
  loop
    execute format(
      'drop policy if exists %I on %I.%I',
      policy_row.policyname,
      policy_row.schemaname,
      policy_row.tablename
    );
  end loop;
end $$;

-- Keep anon completely away from the base tables.
revoke all on public.profiles from anon;
revoke all on public.clients from anon;
revoke all on public.client_users from anon;
revoke all on public.audit_logs from anon;
revoke all on public.bookings from anon;
revoke all on public.sales from anon;
revoke all on public.pitches from anon;

-- profiles: self-service for non-admin changes, full access for superadmin.
create policy "profiles self read"
on public.profiles
for select
to authenticated
using (id = auth.uid());

create policy "profiles self update non-sensitive"
on public.profiles
for update
to authenticated
using (id = auth.uid())
with check (
  id = auth.uid()
  and role = public.current_profile_role()
  and client_id is not distinct from public.current_profile_client_id()
);

create policy "profiles superadmin manage all"
on public.profiles
for all
to authenticated
using (public.current_profile_role() = 'superadmin')
with check (public.current_profile_role() = 'superadmin');

-- clients: tenant users can read their own client config; only admin and superadmin can mutate.
create policy "clients tenant read own"
on public.clients
for select
to authenticated
using (id = public.current_profile_client_id());

create policy "clients tenant admin update own"
on public.clients
for update
to authenticated
using (
  public.current_profile_role() = 'admin'
  and id = public.current_profile_client_id()
)
with check (
  public.current_profile_role() = 'admin'
  and id = public.current_profile_client_id()
);

create policy "clients superadmin manage all"
on public.clients
for all
to authenticated
using (public.current_profile_role() = 'superadmin')
with check (public.current_profile_role() = 'superadmin');

-- client_users: admin manages memberships only inside its tenant.
create policy "client_users tenant read own"
on public.client_users
for select
to authenticated
using (client_id = public.current_profile_client_id());

create policy "client_users tenant admin insert own"
on public.client_users
for insert
to authenticated
with check (
  public.current_profile_role() = 'admin'
  and client_id = public.current_profile_client_id()
  and role = 'admin'
);

create policy "client_users tenant admin update own"
on public.client_users
for update
to authenticated
using (
  public.current_profile_role() = 'admin'
  and client_id = public.current_profile_client_id()
)
with check (
  public.current_profile_role() = 'admin'
  and client_id = public.current_profile_client_id()
  and role = 'admin'
);

create policy "client_users tenant admin delete own"
on public.client_users
for delete
to authenticated
using (
  public.current_profile_role() = 'admin'
  and client_id = public.current_profile_client_id()
);

create policy "client_users superadmin manage all"
on public.client_users
for all
to authenticated
using (public.current_profile_role() = 'superadmin')
with check (public.current_profile_role() = 'superadmin');

-- audit_logs: append-only for tenant actors; full visibility for superadmin.
create policy "audit_logs tenant read own"
on public.audit_logs
for select
to authenticated
using (client_id = public.current_profile_client_id());

create policy "audit_logs tenant insert own"
on public.audit_logs
for insert
to authenticated
with check (
  client_id = public.current_profile_client_id()
  and (user_id is null or user_id = auth.uid())
);

create policy "audit_logs superadmin read all"
on public.audit_logs
for select
to authenticated
using (public.current_profile_role() = 'superadmin');

create policy "audit_logs superadmin insert all"
on public.audit_logs
for insert
to authenticated
with check (public.current_profile_role() = 'superadmin');

-- bookings: internal reads/writes stay private; public booking creation must go through an Edge Function.
create policy "bookings tenant read own"
on public.bookings
for select
to authenticated
using (client_id = public.current_profile_client_id());

create policy "bookings tenant admin manage own"
on public.bookings
for all
to authenticated
using (
  public.current_profile_role() = 'admin'
  and client_id = public.current_profile_client_id()
)
with check (
  public.current_profile_role() = 'admin'
  and client_id = public.current_profile_client_id()
);

create policy "bookings superadmin manage all"
on public.bookings
for all
to authenticated
using (public.current_profile_role() = 'superadmin')
with check (public.current_profile_role() = 'superadmin');

-- sales: internal only.
create policy "sales tenant read own"
on public.sales
for select
to authenticated
using (client_id = public.current_profile_client_id());

create policy "sales tenant admin manage own"
on public.sales
for all
to authenticated
using (
  public.current_profile_role() = 'admin'
  and client_id = public.current_profile_client_id()
)
with check (
  public.current_profile_role() = 'admin'
  and client_id = public.current_profile_client_id()
);

create policy "sales superadmin manage all"
on public.sales
for all
to authenticated
using (public.current_profile_role() = 'superadmin')
with check (public.current_profile_role() = 'superadmin');

-- pitches: internal CRUD private; public discovery happens through the public view only.
create policy "pitches tenant read own"
on public.pitches
for select
to authenticated
using (client_id = public.current_profile_client_id());

create policy "pitches tenant admin manage own"
on public.pitches
for all
to authenticated
using (
  public.current_profile_role() = 'admin'
  and client_id = public.current_profile_client_id()
)
with check (
  public.current_profile_role() = 'admin'
  and client_id = public.current_profile_client_id()
);

create policy "pitches superadmin manage all"
on public.pitches
for all
to authenticated
using (public.current_profile_role() = 'superadmin')
with check (public.current_profile_role() = 'superadmin');

-- Public read surface: safe columns only, no direct base-table exposure.
drop view if exists public.public_clients_catalog_v1;
create view public.public_clients_catalog_v1 as
select
  c.id,
  c.public_slug as slug,
  coalesce(nullif(c.public_display_name, ''), c.complex_name, c.name) as display_name,
  c.public_description as description,
  c.public_address as address,
  c.public_phone as phone,
  c.enable_reservations,
  c.enable_sales,
  c.enable_ranking,
  c.enable_statistics
from public.clients c
where c.public_catalog_enabled = true
  and c.status = 'active'
  and (c.expires_at is null or c.expires_at >= now());

drop view if exists public.public_pitches_catalog_v1;
create view public.public_pitches_catalog_v1 as
select
  p.id,
  p.client_id,
  c.public_slug as client_slug,
  coalesce(nullif(c.public_display_name, ''), c.complex_name, c.name) as client_display_name,
  p.name,
  p.type,
  p.price
from public.pitches p
join public.clients c on c.id = p.client_id
where c.public_catalog_enabled = true
  and c.public_booking_enabled = true
  and c.status = 'active'
  and (c.expires_at is null or c.expires_at >= now())
  and p.active = true
  and p.is_public = true;

revoke all on public.public_clients_catalog_v1 from public;
revoke all on public.public_pitches_catalog_v1 from public;

grant select on public.public_clients_catalog_v1 to anon, authenticated;
grant select on public.public_pitches_catalog_v1 to anon, authenticated;

commit;
