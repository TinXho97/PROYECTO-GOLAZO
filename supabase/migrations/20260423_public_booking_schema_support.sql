begin;

alter table if exists public.bookings
  add column if not exists notes text,
  add column if not exists payment_url text;

create index if not exists idx_clients_public_slug
  on public.clients (lower(public_slug))
  where public_slug is not null;

create index if not exists idx_bookings_pitch_time_active
  on public.bookings (client_id, pitch_id, start_time, end_time)
  where status in ('pending', 'confirmed', 'completed');

create index if not exists idx_pitches_client_public_active
  on public.pitches (client_id, is_public, active);

commit;
