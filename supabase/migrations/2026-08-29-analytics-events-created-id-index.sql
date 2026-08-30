-- The admin analytics rollup pages analytics_events newest-first on (created_at, id).
-- The only index was (name, created_at), which cannot serve that order, so each page
-- was a scan plus sort over the whole 30-day window. This lets each page start from
-- the index in the order the rollup reads. Safe to re-run.
create index if not exists analytics_events_created_id_idx
  on public.analytics_events (created_at desc, id desc);
