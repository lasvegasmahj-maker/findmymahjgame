-- Find My Mahj Game, membership system, Phase 1, step 1 of 4.
-- Creates the canonical tier/role/status enums. Additive and inert: no table or
-- column is changed here, so this is the safest possible first step.
-- Idempotent: guarded creation, safe to rerun.
-- Spec: docs/membership-system-spec.md section H.2.

do $$ begin
  create type membership_tier as enum ('free', 'pro', 'ambassador', 'enterprise');
exception when duplicate_object then null; end $$;

do $$ begin
  create type event_tier as enum ('free', 'boosted', 'featured', 'spotlight', 'enterprise');
exception when duplicate_object then null; end $$;

do $$ begin
  create type ad_tier as enum ('basic', 'featured', 'national');
exception when duplicate_object then null; end $$;

do $$ begin
  create type account_role as enum ('player', 'teacher', 'organizer', 'ambassador', 'admin');
exception when duplicate_object then null; end $$;

do $$ begin
  create type listing_status as enum ('draft', 'pending_review', 'published', 'hidden', 'migrated', 'removed');
exception when duplicate_object then null; end $$;
