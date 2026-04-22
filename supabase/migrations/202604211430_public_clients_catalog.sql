begin;

drop policy if exists "public read active clients catalog" on public.clients;

create policy "public read active clients catalog"
on public.clients
for select
to anon
using (
  status = 'active'
  and (expires_at is null or expires_at >= now())
);

commit;
