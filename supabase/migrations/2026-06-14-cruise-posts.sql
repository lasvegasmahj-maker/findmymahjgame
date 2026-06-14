-- Cruise companions board. Passengers post their sailing (line, ship, dates) to
-- find other American Mahjong players ON the same cruise. This is distinct from
-- an organized "mahjong cruise" event. Public cards show structured fields only
-- (no contact, no free text); connections relay through email server-side, so
-- the board is safe to auto-publish. Idempotent; safe to rerun.
create table if not exists public.cruise_posts (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  contact_email text not null,
  cruise_line text not null,
  ship text,
  depart_date date not null,
  return_date date,
  skill_level text not null default 'any',
  status text not null default 'published',
  created_at timestamptz not null default now()
);
alter table public.cruise_posts enable row level security;
create index if not exists cruise_posts_depart_idx on public.cruise_posts (depart_date);
