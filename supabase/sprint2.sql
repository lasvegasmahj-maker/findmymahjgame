-- Sprint 2: "We Played" confirmation + recurring flag. Run once in Supabase SQL.
alter table tables add column if not exists played boolean;            -- null=unknown, true=played, false=did not
alter table tables add column if not exists asked_played_at timestamptz;
alter table tables add column if not exists is_recurring boolean default false;
