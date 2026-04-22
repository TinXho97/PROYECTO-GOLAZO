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
using (public.current_profile_role() = 'superadmin');

drop policy if exists "superadmin manage clients" on public.clients;
create policy "superadmin manage clients"
on public.clients
for all
to authenticated
using (public.current_profile_role() = 'superadmin')
with check (public.current_profile_role() = 'superadmin');

drop policy if exists "tenant read own client config" on public.clients;
create policy "tenant read own client config"
on public.clients
for select
to authenticated
using (clients.id = public.current_profile_client_id());

drop policy if exists "superadmin read client_users" on public.client_users;
create policy "superadmin read client_users"
on public.client_users
for select
to authenticated
using (public.current_profile_role() = 'superadmin');

drop policy if exists "superadmin manage client_users" on public.client_users;
create policy "superadmin manage client_users"
on public.client_users
for all
to authenticated
using (public.current_profile_role() = 'superadmin')
with check (public.current_profile_role() = 'superadmin');

drop policy if exists "superadmin read audit logs" on public.audit_logs;
create policy "superadmin read audit logs"
on public.audit_logs
for select
to authenticated
using (public.current_profile_role() = 'superadmin');

drop policy if exists "tenant read own audit logs" on public.audit_logs;
create policy "tenant read own audit logs"
on public.audit_logs
for select
to authenticated
using (client_id = public.current_profile_client_id());

drop policy if exists "tenant insert own audit logs" on public.audit_logs;
create policy "tenant insert own audit logs"
on public.audit_logs
for insert
to authenticated
with check (
  client_id = public.current_profile_client_id()
  and (user_id is null or user_id = auth.uid())
);

drop policy if exists "superadmin insert audit logs" on public.audit_logs;
create policy "superadmin insert audit logs"
on public.audit_logs
for insert
to authenticated
with check (public.current_profile_role() = 'superadmin');

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
        public.current_profile_role() = 'superadmin'
        or s.client_id = public.current_profile_client_id()
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
        public.current_profile_role() = 'superadmin'
        or s.client_id = public.current_profile_client_id()
      )
  )
);

create or replace function public.audit_sales_insert_safe()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  actor_name text;
begin
  actor_name := coalesce(
    (
      select p.full_name
      from public.profiles p
      where p.id = auth.uid()
      limit 1
    ),
    (
      select u.email
      from auth.users u
      where u.id = auth.uid()
      limit 1
    ),
    'Sistema'
  );

  begin
    insert into public.audit_logs (
      action,
      entity,
      entity_id,
      user_id,
      user_name,
      client_id,
      description,
      details,
      metadata,
      created_at
    ) values (
      'Venta realizada',
      'sale',
      new.id::text,
      auth.uid(),
      actor_name,
      new.client_id,
      'Se registro una venta',
      'Se registro una venta',
      jsonb_build_object(
        'sale_id', new.id,
        'product_id', new.product_id,
        'quantity', new.quantity,
        'total_price', new.total_price,
        'payment_method', new.payment_method
      ),
      coalesce(new.created_at, now())
    );
  exception
    when others then
      raise notice '[audit_sales_insert_safe] audit log skipped: %', sqlerrm;
  end;

  return new;
end;
$$;

commit;
