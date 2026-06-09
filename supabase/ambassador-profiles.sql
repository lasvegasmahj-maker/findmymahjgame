-- ═══════════════════════════════════════════
-- FindMyMahj AMBASSADOR PROFILES: profile fields for public ambassador pages
-- Prepared for review. DO NOT run until approved.
-- Adds public profile fields to the existing ambassadors table. Public pages
-- show only rows where profile_status = 'published'. First names only in public.
-- ═══════════════════════════════════════════

alter table ambassadors
  add column if not exists slug text unique,            -- /ambassadors/{slug}
  add column if not exists bio text,                    -- short public bio
  add column if not exists photo_url text,              -- public photo (storage URL)
  add column if not exists referral_code text unique,   -- e.g. FMM-LV-RUTH
  add column if not exists profile_status text default 'draft';  -- draft | published

create index if not exists ambassadors_profile_status_idx on ambassadors (profile_status);

-- referral_code ties an ambassador to the tables they drive (tables.referred_by),
-- which is what the attribution rollup in /admin/metrics already groups on.
-- profile_status gates whether the public /ambassadors/{slug} page shows.
