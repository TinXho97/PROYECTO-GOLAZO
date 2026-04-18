begin;

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

commit;
