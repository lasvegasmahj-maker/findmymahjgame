-- "Run it back" recurring series. A next-week clone links to the table it
-- continues via parent_table_id, and is_recurring marks any table in a standing
-- series so the North Star (Created, Filled, Played, Recurring) can count it.
-- Idempotent: safe to run more than once.

alter table public.tables add column if not exists parent_table_id uuid references public.tables(id) on delete set null;
create index if not exists idx_tables_parent_table_id on public.tables(parent_table_id);

-- is_recurring already shipped in sprint2.sql; re-declare for idempotency on
-- environments where that file has not been applied.
alter table public.tables add column if not exists is_recurring boolean default false;
