-- Matching foundation (the Bench, MVP). Idempotent; safe to rerun.
-- The matcher ships DARK: app_settings.matcher_enabled stays 'false' until
-- the founder flips it, and every match requires her one-click approval.

alter table public.play_requests
  add column if not exists status text not null default 'new';

create table if not exists public.match_drafts (
  id uuid primary key default gen_random_uuid(),
  city text not null,
  day_pref text,
  time_pref text,
  request_ids uuid[] not null,
  status text not null default 'draft',
  table_id uuid,
  created_at timestamptz not null default now(),
  decided_at timestamptz
);
alter table public.match_drafts enable row level security;

create table if not exists public.app_settings (
  key text primary key,
  value text not null
);
alter table public.app_settings enable row level security;
insert into public.app_settings (key, value)
  values ('matcher_enabled', 'false')
  on conflict (key) do nothing;

create table if not exists public.email_suppressions (
  email text primary key,
  reason text,
  created_at timestamptz not null default now()
);
alter table public.email_suppressions enable row level security;

create table if not exists public.email_sends (
  id uuid primary key default gen_random_uuid(),
  kind text not null,
  recipients int not null default 1,
  subject text,
  ok boolean not null default true,
  created_at timestamptz not null default now()
);
alter table public.email_sends enable row level security;
