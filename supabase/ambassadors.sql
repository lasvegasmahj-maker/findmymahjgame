-- ═══════════════════════════════════════════
-- FindMyMahj AMBASSADORS: Founding Ambassador applications
-- Run once in the Supabase SQL Editor.
-- RLS is enabled with NO anon policies on purpose: all reads and writes go
-- through server routes using the service-role key (which bypasses RLS), so
-- applicant contact info (phones/emails) is never exposed to the public anon key.
-- ═══════════════════════════════════════════

create table if not exists ambassadors (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  name text not null,
  email text not null,
  phone text,
  city text,
  state text,
  role text,                  -- Teacher | Host | Organizer | Club leader | Other
  reach text,                 -- how many players they can reach (bucket label)
  why text,                   -- why they want to help
  status text default 'new',  -- new | approved | contacted | declined
  reviewed_at timestamptz
);
alter table ambassadors enable row level security;

-- No anon policies. service_role (server routes) bypasses RLS and is the only writer/reader.
