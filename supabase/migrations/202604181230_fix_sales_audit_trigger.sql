begin;

do $$
declare
  trigger_row record;
begin
  for trigger_row in
    select t.tgname
    from pg_trigger t
    join pg_class c on c.oid = t.tgrelid
    join pg_namespace n on n.oid = c.relnamespace
    join pg_proc p on p.oid = t.tgfoid
    where n.nspname = 'public'
      and c.relname = 'sales'
      and not t.tgisinternal
      and (
        t.tgname ilike '%audit%'
        or pg_get_functiondef(p.oid) ilike '%audit_logs%'
      )
  loop
    execute format('drop trigger if exists %I on public.sales', trigger_row.tgname);
  end loop;
end $$;

create or replace function public.audit_sales_insert_safe()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  resolved_user_name text;
begin
  select p.full_name
  into resolved_user_name
  from public.profiles p
  where p.id = auth.uid()
  limit 1;

  if resolved_user_name is null or resolved_user_name = '' then
    resolved_user_name := nullif(auth.jwt() -> 'user_metadata' ->> 'name', '');
  end if;

  if resolved_user_name is null or resolved_user_name = '' then
    resolved_user_name := nullif(auth.jwt() ->> 'email', '');
  end if;

  insert into public.audit_logs (
    action,
    table_name,
    record_id,
    details,
    user_name,
    client_id
  )
  values (
    'INSERT',
    'sales',
    new.id,
    jsonb_build_object('total', new.total_price),
    resolved_user_name,
    new.client_id
  );

  return new;
exception
  when others then
    raise notice '[audit_sales_insert_safe] audit log skipped: %', sqlerrm;
    return new;
end;
$$;

drop trigger if exists sales_audit_after_insert on public.sales;
create trigger sales_audit_after_insert
after insert on public.sales
for each row
execute function public.audit_sales_insert_safe();

commit;
