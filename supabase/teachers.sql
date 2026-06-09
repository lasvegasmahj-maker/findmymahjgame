-- ═══════════════════════════════════════════
-- FindMyMahj TEACHERS: real teacher directory
-- Prepared for review. DO NOT run until approved.
-- Public reads are limited to PUBLISHED rows through a server route; contact
-- details are public-business only (no home addresses, no personal numbers).
-- ═══════════════════════════════════════════

create table if not exists teachers (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  reviewed_at timestamptz,

  name text not null,
  city text,
  state text,
  website text,                 -- public business site only
  contact text,                 -- public contact channel only (no personal info)

  is_ambassador boolean default false,
  ambassador_id uuid references ambassadors(id) on delete set null,

  status text default 'pending_review',  -- pending_review | published | flagged | rejected
  slug text unique,             -- reserved for future teacher pages
  notes text                    -- internal admin notes, never shown publicly
);
alter table teachers enable row level security;

create index if not exists teachers_status_idx on teachers (status);
create index if not exists teachers_state_idx on teachers (state);

-- No anon policies. The public directory reads PUBLISHED rows via a server
-- route using the service-role key. Admin enters and curates rows.
