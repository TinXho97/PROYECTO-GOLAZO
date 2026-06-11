begin;

-- Keep a stable, URL-safe public identifier for every sports complex.
-- Existing slugs are preserved. Missing or invalid values are generated from
-- the public display name, complex name or internal client name.
create or replace function public.normalize_public_slug(raw_value text)
returns text
language sql
immutable
set search_path = public
as $$
  select trim(both '-' from regexp_replace(
    regexp_replace(
      translate(
        lower(coalesce(raw_value, '')),
        'áàäâãéèëêíìïîóòöôõúùüûñç',
        'aaaaaeeeeiiiiooooouuuunc'
      ),
      '[^a-z0-9]+',
      '-',
      'g'
    ),
    '-+',
    '-',
    'g'
  ));
$$;

create or replace function public.ensure_client_public_share_fields()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  base_slug text;
  candidate_slug text;
  suffix_number integer := 1;
begin
  base_slug := public.normalize_public_slug(
    coalesce(
      nullif(btrim(new.public_slug), ''),
      nullif(btrim(new.public_display_name), ''),
      nullif(btrim(new.complex_name), ''),
      nullif(btrim(new.name), ''),
      'complejo'
    )
  );

  if base_slug = '' then
    base_slug := 'complejo';
  end if;

  candidate_slug := base_slug;
  while exists (
    select 1
    from public.clients existing_client
    where lower(existing_client.public_slug) = lower(candidate_slug)
      and existing_client.id is distinct from new.id
  ) loop
    suffix_number := suffix_number + 1;
    candidate_slug := base_slug || '-' || suffix_number::text;
  end loop;

  new.public_slug := candidate_slug;
  new.public_display_name := coalesce(
    nullif(btrim(new.public_display_name), ''),
    nullif(btrim(new.complex_name), ''),
    nullif(btrim(new.name), ''),
    'Complejo'
  );
  new.public_address := coalesce(nullif(btrim(new.public_address), ''), new.address);
  new.public_phone := coalesce(nullif(btrim(new.public_phone), ''), new.phone);

  return new;
end;
$$;

drop trigger if exists clients_ensure_public_share_fields on public.clients;
create trigger clients_ensure_public_share_fields
before insert or update of public_slug, public_display_name, public_address, public_phone, complex_name, name, address, phone
on public.clients
for each row
execute function public.ensure_client_public_share_fields();

-- Backfill existing clients and initialize public presentation fields.
update public.clients
set
  public_slug = public_slug,
  public_display_name = public_display_name,
  public_address = public_address,
  public_phone = public_phone;

create unique index if not exists idx_clients_public_slug_unique
  on public.clients (lower(public_slug))
  where public_slug is not null;

commit;
