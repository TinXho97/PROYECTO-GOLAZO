begin;

alter table if exists public.profiles add column if not exists email text;
alter table if exists public.profiles add column if not exists created_at timestamptz not null default now();
alter table if exists public.profiles add column if not exists updated_at timestamptz not null default now();

do $$
declare
  constraint_name text;
begin
  select conname
  into constraint_name
  from pg_constraint
  where conrelid = 'public.profiles'::regclass
    and contype = 'c'
    and pg_get_constraintdef(oid) ilike '%role%';

  if constraint_name is not null and constraint_name <> 'profiles_role_check' then
    execute format('alter table public.profiles drop constraint %I', constraint_name);
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conrelid = 'public.profiles'::regclass
      and conname = 'profiles_role_check'
  ) then
    alter table public.profiles
      add constraint profiles_role_check
      check (role in ('superadmin', 'admin', 'client'));
  end if;
end $$;

insert into public.profiles (id, role, client_id, full_name, email, phone)
select
  u.id,
  case
    when coalesce(u.raw_user_meta_data ->> 'role', '') = 'superadmin' then 'superadmin'
    when cu.user_id is not null then 'admin'
    else 'client'
  end as role,
  case
    when coalesce(u.raw_user_meta_data ->> 'role', '') = 'superadmin' then null
    else coalesce(
      nullif(u.raw_user_meta_data ->> 'client_id', '')::uuid,
      cu.client_id
    )
  end as client_id,
  coalesce(
    nullif(u.raw_user_meta_data ->> 'name', ''),
    nullif(u.email, ''),
    'Usuario'
  ) as full_name,
  u.email,
  nullif(u.phone, '') as phone
from auth.users u
left join lateral (
  select client_id, user_id
  from public.client_users
  where user_id = u.id
  order by created_at asc
  limit 1
) cu on true
where not exists (
  select 1
  from public.profiles p
  where p.id = u.id
);

delete from public.client_users cu
using public.profiles p
where p.id = cu.user_id
  and p.role = 'superadmin';

update public.profiles p
set client_id = sync.client_id,
    updated_at = now()
from (
  select user_id, min(client_id::text)::uuid as client_id
  from public.client_users
  group by user_id
  having count(*) = 1
) sync
where p.id = sync.user_id
  and p.role = 'admin'
  and p.client_id is distinct from sync.client_id;

update public.clients
set features = jsonb_build_object(
  'reservas', coalesce(enable_reservations, true),
  'ventas', coalesce(enable_sales, true),
  'ranking', coalesce(enable_ranking, true),
  'estadisticas', coalesce(enable_statistics, true)
)
where features is null
   or features = '{}'::jsonb;

update public.bookings
set status = 'completed'
where status = 'finished';

alter table if exists public.clients
  add column if not exists admin_settings jsonb not null default '{}'::jsonb;

create index if not exists idx_bookings_client_start_time on public.bookings (client_id, start_time desc);
create index if not exists idx_sales_client_created_at on public.sales (client_id, created_at desc);
create index if not exists idx_pitches_client_active on public.pitches (client_id, active);
create index if not exists idx_client_users_client_user on public.client_users (client_id, user_id);

commit;
