-- ═══════════════════════════════════════════
-- FindMyMahj WEDGE: tables, seats, play requests
-- Run once in the Supabase SQL Editor.
-- RLS is enabled with NO anon policies on purpose: all reads and writes
-- go through server routes using the service-role key (which bypasses RLS),
-- so contact info (phones/emails) is never exposed to the public anon key.
-- ═══════════════════════════════════════════

create table if not exists tables (
  id uuid primary key default gen_random_uuid(),
  share_code text unique not null,
  created_at timestamptz default now(),
  host_name text not null,
  host_phone text,
  host_email text,
  city text,
  state text,
  day_of_week text,
  time_of_day text,           -- Morning | Afternoon | Evening
  venue_type text default 'public',  -- public | home
  venue_name text,
  skill text default 'anyone',       -- anyone | beginner | experienced
  seats_total int default 4,
  status text default 'forming',     -- forming | full | cancelled
  referred_by text
);
alter table tables enable row level security;

create table if not exists table_seats (
  id uuid primary key default gen_random_uuid(),
  table_id uuid references tables(id) on delete cascade,
  created_at timestamptz default now(),
  name text not null,
  phone text,
  email text,
  is_host boolean default false
);
alter table table_seats enable row level security;

create table if not exists play_requests (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  name text not null,
  phone text,
  email text,
  city text,
  state text,
  day_pref text,
  time_pref text,
  status text default 'new'
);
alter table play_requests enable row level security;

-- No anon policies. service_role (server routes) bypasses RLS and is the only writer/reader.
