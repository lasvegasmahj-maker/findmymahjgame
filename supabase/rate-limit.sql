-- Rate limiting store for the public POST endpoints (Start a Table, Claim a
-- Seat, I Want to Play). Run once in the Supabase SQL Editor.
-- Service-role only (RLS on, no anon policies); the server routes read/write it.

create table if not exists rate_hits (
  id bigint generated always as identity primary key,
  k text not null,
  created_at timestamptz default now()
);
create index if not exists rate_hits_k_time on rate_hits (k, created_at);
alter table rate_hits enable row level security;

-- Optional housekeeping: delete rows older than a day (or schedule a cron).
-- delete from rate_hits where created_at < now() - interval '1 day';
