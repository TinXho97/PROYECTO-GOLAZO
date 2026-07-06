begin;

alter table public.products enable row level security;

-- Products are an internal tenant resource. Remove any legacy permissive
-- policies before installing the same tenant boundary used by the admin app.
do $$
declare
  policy_row record;
begin
  for policy_row in
    select schemaname, tablename, policyname
    from pg_policies
    where schemaname = 'public'
      and tablename = 'products'
  loop
    execute format(
      'drop policy if exists %I on %I.%I',
      policy_row.policyname,
      policy_row.schemaname,
      policy_row.tablename
    );
  end loop;
end $$;

revoke all on public.products from anon;

create policy "products tenant read own"
on public.products
for select
to authenticated
using (client_id = public.current_profile_client_id());

create policy "products tenant admin insert own"
on public.products
for insert
to authenticated
with check (
  public.current_profile_role() = 'admin'
  and client_id = public.current_profile_client_id()
);

create policy "products tenant admin update own"
on public.products
for update
to authenticated
using (
  public.current_profile_role() = 'admin'
  and client_id = public.current_profile_client_id()
)
with check (
  public.current_profile_role() = 'admin'
  and client_id = public.current_profile_client_id()
);

create policy "products tenant admin delete own"
on public.products
for delete
to authenticated
using (
  public.current_profile_role() = 'admin'
  and client_id = public.current_profile_client_id()
);

create policy "products superadmin manage all"
on public.products
for all
to authenticated
using (public.current_profile_role() = 'superadmin')
with check (public.current_profile_role() = 'superadmin');

commit;
