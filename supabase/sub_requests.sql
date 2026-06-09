-- ═══════════════════════════════════════════
-- FindMyMahj SUB REQUESTS: "Need a Sub" requests + analytics fields
-- Prepared for review. DO NOT run until approved.
-- RLS enabled with NO anon policies: server routes (service role) only,
-- so host contact info is never exposed to the public anon key.
-- ═══════════════════════════════════════════

create table if not exists sub_requests (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),

  -- where and when a substitute is needed
  city text not null,
  state text,
  day_of_week text,
  time_of_day text,            -- Morning | Afternoon | Evening

  -- the host asking for a sub (private, server-only)
  host_name text not null,
  host_phone text,
  host_email text,
  note text,

  -- analytics fields for reporting
  status text default 'open',  -- open | filled | expired | cancelled
  players_notified int default 0,   -- opted-in players emailed at request time
  responses int default 0,          -- players who replied willing to sub
  filled_at timestamptz,            -- when it was marked filled (for time-to-fill)
  source text default 'web',        -- entry point (web, sms later, etc.)
  referred_by text                  -- ambassador code if it came via a referral link
);
alter table sub_requests enable row level security;

create index if not exists sub_requests_city_idx on sub_requests (lower(city));
create index if not exists sub_requests_status_idx on sub_requests (status);

-- No anon policies. service_role (server routes) is the only reader/writer.
-- Reporting this supports: total requests, fill rate (filled / total),
-- median time-to-fill (filled_at - created_at), demand by city, and
-- requests/fills attributed to an ambassador (referred_by).
