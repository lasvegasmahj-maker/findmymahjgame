# Phase 1 Migration Runbook (account-ready schema, dark)

One page for whoever runs the migrations (Jason). Phase 1 makes the database account-ready, role-aware, and tier-ready WITHOUT any behavior change: nothing in the UI changes, anonymous creation and claim-by-token keep working, and no premium feature turns on. Everything is additive and each file is idempotent (safe to rerun).

Full design: `docs/membership-system-spec.md` (Section H = schema, Section J = build order).

## Files, in this exact order

Located in `supabase/migrations/`:

1. `2026-06-16-membership-01-enums.sql` — the tier/role/status enums. Inert.
2. `2026-06-16-membership-02-accounts.sql` — profiles, account_roles, listing_owners, memberships, badges, audit_log + RLS helper functions. New tables get RLS enabled with no policies, so only the service role can touch them (same posture as the ambassadors table).
3. `2026-06-16-membership-03-ownership.sql` — nullable `account_id` on the four listing tables, `profile_id` on ambassadors/listing_claims/pending_edits, all FKs to profiles.
5. `2026-06-16-membership-05-extend-listings.sql` — membership/verification/event feature columns, the `listing_kind` backfill, legacy event_type/frequency normalization, the CHECK constraints (added NOT VALID), and cross-table FKs.

Step 4 (the tier-column enum cast) is intentionally skipped in Phase 1: it is the one in-place data rewrite and runs separately later. `certifications`, the `reconcile_account` function, and the `event_listings.teacher_id` foreign key are deferred to Phase 2 (they depend on `teacher_profiles`, created then).

## Before you run file 05: pre-flight (required)

File 05 normalizes legacy `event_type`/`frequency` values and adds CHECK constraints. The CHECKs are `NOT VALID`, so a stray value cannot abort the migration, but you should still clean strays so the constraints can be validated later. Run this first and confirm it returns ZERO rows:

```sql
select 'event_type' as col, event_type as bad_value, count(*) n
from public.event_listings
where lower(coalesce(event_type,'')) not in
  ('open_play','class','league','tournament','retreat','cruise','social',
   'openplay','recurring','lesson','instructor','workshop',
   'conference','festival','fundraiser','special','event')
group by event_type
union all
select 'frequency', frequency, count(*)
from public.event_listings
where frequency is not null and frequency <> ''
  and lower(frequency) not in ('once','weekly','biweekly','monthly','multi_day','one-time','one time','single')
group by frequency;
```

If it returns rows, hand-correct them with a targeted `UPDATE` (or add a mapping line to file 05) before running file 05. Anything already canonical or in the mapped legacy set is safe.

## How to run

Either path works; the service role is required (it bypasses RLS).

- Supabase SQL editor: open each file, paste, Run, top to bottom (01, 02, 03, 05).
- Management API (project ref `prvsqhtxubjhljrrbkcj`):

```bash
curl -s -X POST "https://api.supabase.com/v1/projects/prvsqhtxubjhljrrbkcj/database/query" \
  -H "Authorization: Bearer $SUPABASE_MANAGEMENT_TOKEN" \
  -H "Content-Type: application/json" \
  --data "$(jq -Rs '{query: .}' supabase/migrations/2026-06-16-membership-01-enums.sql)"
```

Repeat for 02, 03, then the pre-flight, then 05.

## Verify after running

```sql
-- After 02: the six account tables exist (expect 6).
select count(*) from information_schema.tables
where table_schema='public'
  and table_name in ('profiles','account_roles','listing_owners','memberships','badges','audit_log');

-- After 03: account_id exists on the listing tables (expect 4).
select count(*) from information_schema.columns
where table_schema='public' and column_name='account_id'
  and table_name in ('player_listings','venue_listings','event_listings','ad_listings');

-- After 05: listing_kind is populated, no nulls.
select listing_kind, count(*) from public.venue_listings group by listing_kind;
```

## Safety notes

- Idempotent: rerunning any file is a no-op. Guarded type/constraint creation, `if not exists` columns/indexes, scoped data updates.
- Non-breaking: no grants change, no policies on existing tables, RLS only newly enabled on new (service-role-only) tables. The public site keeps rendering exactly as today.
- Rollback: steps 1, 2, 3, 5 are purely additive; no rollback needed. To validate the NOT VALID CHECKs later (after the pre-flight is clean): `alter table public.event_listings validate constraint event_type_allowed;` and the same for `event_frequency_allowed`.
- Next: Phase 2 (teacher_profiles) per Section J, then auth, then turn on the paid tier.
