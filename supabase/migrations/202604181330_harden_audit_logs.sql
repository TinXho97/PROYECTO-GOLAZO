begin;

alter table if exists public.audit_logs
  add column if not exists entity text,
  add column if not exists entity_id text,
  add column if not exists user_id uuid,
  add column if not exists description text,
  add column if not exists metadata jsonb not null default '{}'::jsonb,
  add column if not exists created_at timestamptz not null default now();

update public.audit_logs
set description = coalesce(description, details, action)
where description is null;

update public.audit_logs
set created_at = coalesce(created_at, "timestamp", now());

update public.audit_logs
set metadata = '{}'::jsonb
where metadata is null;

create index if not exists idx_audit_logs_client_created_at
  on public.audit_logs (client_id, created_at desc);

create index if not exists idx_audit_logs_entity_created_at
  on public.audit_logs (entity, entity_id, created_at desc);

alter table public.audit_logs enable row level security;

drop policy if exists "Allow all for anon" on public.audit_logs;
drop policy if exists "Allow all for authenticated" on public.audit_logs;
drop policy if exists "superadmin read audit logs" on public.audit_logs;
drop policy if exists "tenant read own audit logs" on public.audit_logs;
drop policy if exists "tenant insert own audit logs" on public.audit_logs;
drop policy if exists "superadmin insert audit logs" on public.audit_logs;

create policy "superadmin read audit logs"
on public.audit_logs
for select
to authenticated
using (
  coalesce(
    public.current_profile_role(),
    auth.jwt() -> 'user_metadata' ->> 'role',
    auth.jwt() -> 'app_metadata' ->> 'role'
  ) = 'superadmin'
);

create policy "tenant read own audit logs"
on public.audit_logs
for select
to authenticated
using (
  client_id = coalesce(
    public.current_profile_client_id(),
    nullif(auth.jwt() -> 'user_metadata' ->> 'client_id', '')::uuid,
    nullif(auth.jwt() -> 'app_metadata' ->> 'client_id', '')::uuid
  )
);

create policy "tenant insert own audit logs"
on public.audit_logs
for insert
to authenticated
with check (
  client_id = coalesce(
    public.current_profile_client_id(),
    nullif(auth.jwt() -> 'user_metadata' ->> 'client_id', '')::uuid,
    nullif(auth.jwt() -> 'app_metadata' ->> 'client_id', '')::uuid
  )
  and (
    user_id is null
    or user_id = auth.uid()
  )
);

create policy "superadmin insert audit logs"
on public.audit_logs
for insert
to authenticated
with check (
  coalesce(
    public.current_profile_role(),
    auth.jwt() -> 'user_metadata' ->> 'role',
    auth.jwt() -> 'app_metadata' ->> 'role'
  ) = 'superadmin'
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
    nullif(auth.jwt() -> 'user_metadata' ->> 'name', ''),
    nullif(auth.jwt() -> 'app_metadata' ->> 'name', ''),
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
