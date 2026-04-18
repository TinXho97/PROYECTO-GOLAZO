begin;

alter table public.sale_items enable row level security;

drop policy if exists "tenant read own sale_items" on public.sale_items;
create policy "tenant read own sale_items"
on public.sale_items
for select
to authenticated
using (
  exists (
    select 1
    from public.sales s
    where s.id = sale_items.sale_id
      and (
        coalesce(
          public.current_profile_role(),
          auth.jwt() -> 'user_metadata' ->> 'role',
          auth.jwt() -> 'app_metadata' ->> 'role'
        ) = 'superadmin'
        or s.client_id = coalesce(
          public.current_profile_client_id(),
          nullif(auth.jwt() -> 'user_metadata' ->> 'client_id', '')::uuid,
          nullif(auth.jwt() -> 'app_metadata' ->> 'client_id', '')::uuid
        )
      )
  )
);

drop policy if exists "tenant insert own sale_items" on public.sale_items;
create policy "tenant insert own sale_items"
on public.sale_items
for insert
to authenticated
with check (
  exists (
    select 1
    from public.sales s
    where s.id = sale_items.sale_id
      and (
        coalesce(
          public.current_profile_role(),
          auth.jwt() -> 'user_metadata' ->> 'role',
          auth.jwt() -> 'app_metadata' ->> 'role'
        ) = 'superadmin'
        or s.client_id = coalesce(
          public.current_profile_client_id(),
          nullif(auth.jwt() -> 'user_metadata' ->> 'client_id', '')::uuid,
          nullif(auth.jwt() -> 'app_metadata' ->> 'client_id', '')::uuid
        )
      )
  )
);

commit;
