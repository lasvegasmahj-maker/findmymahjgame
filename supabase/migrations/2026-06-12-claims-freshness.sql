-- Claims MVP + Freshness MVP. Idempotent; safe to rerun.

-- CLAIMS: a teacher/host claims her listing via emailed magic link; edits land
-- as pending rows the founder approves; nothing changes a listing directly.
create table if not exists public.listing_claims (
  id uuid primary key default gen_random_uuid(),
  listing_table text not null,
  listing_id uuid not null,
  claimer_email text not null,
  status text not null default 'claimed',
  created_at timestamptz not null default now(),
  unique (listing_table, listing_id)
);
alter table public.listing_claims enable row level security;

create table if not exists public.pending_edits (
  id uuid primary key default gen_random_uuid(),
  listing_table text not null,
  listing_id uuid not null,
  claimer_email text not null,
  changes jsonb not null,
  status text not null default 'pending',
  created_at timestamptz not null default now(),
  decided_at timestamptz,
  previous jsonb
);
alter table public.pending_edits enable row level security;

-- FRESHNESS: any confirmation stamps the clock; ordering favors confirmed.
alter table public.event_listings
  add column if not exists confirmed_active_at timestamptz,
  add column if not exists ended_reports int not null default 0;
alter table public.venue_listings
  add column if not exists confirmed_active_at timestamptz,
  add column if not exists ended_reports int not null default 0;
