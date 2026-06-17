# Find My Mahj Game: Membership and Listing System Specification

> Pricing and naming update (2026-06-16): the paid tier is now labeled "Verified Community Leader" at $12/month or $99/year. This document body has been swept to match (it originally proposed "Pro" at $39). The "Official Mahj Spot" add-on is not offered in the live model. The database enum value for the paid tier stays 'pro' (only the user-facing label changed), so all SQL in Section H is unchanged and correct.


## Executive Summary

Find My Mahj Game is building the national directory players use to find games, teachers, events, and communities. The strategy is growth first, revenue later. Basic participation is free forever, and no one is ever charged merely to be listed; paid tiers buy only visibility, credibility, and promotion. Players never pay, ever. The single most common real account is a teacher who is also an organizer who lists herself as a player, so the model is one account with additive roles, not five separate kinds of login. We start from the live reality: there is no Supabase Auth yet, everything is anonymous, and the only ownership mechanism is claim-by-token keyed on email. We add accounts as an additive layer with email as the join spine, so not a single live claim, listing, or form breaks. The membership ladder is four clean tiers (Free, Verified Community Leader, Ambassador, Enterprise) that replace today's loose tier strings, with Verified Community Leader at $12/month as the workhorse paid tier. Teachers become first-class with their own profiles, reviews, and a five-badge trust ladder. Rankings reward verified quality and recent activity, never popularity or payment. Ambassadors are a prestige status, earned and renewed, with no exclusive territory. Everything ships dark and additive, sequenced by total live listings, so the platform never needs a rebuild.

---

## A. User Types and Permission Model

### Core principle: roles are additive, not exclusive

Find My Mahj Game has five user types: **Player, Teacher, Organizer, Ambassador, Admin**. These are not five separate kinds of account. They are roles that one account holds in combination. The single most common real account is a teacher who is also an organizer who lists herself as a player so other locals can find her. Forcing her to pick one identity (or maintain three logins) is the fastest way to lose her. So the model is: one account, one login (email), a set of roles attached to it, and the union of every permission those roles grant.

This matches the founder goal directly. Growth and network effects come first, so the cost of getting in must be near zero, and the same person should be able to wear every hat without re-registering. Revenue comes from premium tiers on the Teacher and Organizer roles (visibility, credibility, promotion), never from the role itself. Holding the Teacher role is free forever. Being a Verified Community Leader teacher is what costs money.

### The five roles

**Player.** The default role every account starts with. A player creates and edits exactly one self-listing in `player_listings` (name, city, state, skill_level, availability, bio, game_types, contact_email, avatar_color). A player can claim open seats in `table_seats`, post and answer in `cruise_posts`, submit `play_requests` to the cron matcher, and see all published listings of every kind. Players never pay. This is permanent and non-negotiable per the pricing rule.

**Teacher.** A person who teaches. A teacher owns one or more instruction listings. Going forward these live in the first-class `teacher_profiles` table (Section C); today they are rows in `venue_listings` matched by the regex `/instructor|teacher|lesson|studio|school|class/`. A teacher can create a teacher listing, edit her own listing's allowlisted fields, upload a logo or headshot to the `logos` bucket, set her `tier`, and request a tier upgrade through Stripe (when checkout ships). A teacher sees the same public directory plus a private dashboard of her own listings, claim status, and pending edits.

**Organizer.** A person who runs games and events. An organizer owns one or more rows in `event_listings` (open_play, tournament, retreat, league, recurring series) and may also own a `venue_listings` row that represents a venue or club rather than instruction. An organizer can create events, edit her own events, set event `tier` (`free` baseline, paid upgrade for reach), manage recurring series, and confirm a listing is still active (the `confirmed_active_at` freshness stamp). Most teachers will also hold this role; the UI should offer "I also host games or events" as a checkbox on the teacher flow rather than a separate signup.

**Ambassador.** A prestige role, applied for, not self-assigned. Backed by the existing `ambassadors` table. An ambassador is a teacher or organizer who has been approved to help grow the directory. There is no exclusive territory. The role grants a small set of extra abilities on top of whatever Teacher/Organizer permissions the account already has: an Ambassador badge on her public listing, the ability to generate referral/claim invite links for teachers she recruits (the same `signActionToken("claim", ...)` path the founder uses, scoped and logged to her), a view of who she has referred and their status, and elevated placement weight in rankings (rankings reward quality and activity, so ambassador status raises eligibility, it does not buy the top spot). Ambassador status is granted by an Admin flipping `ambassadors.status` to `approved` and attaching the role to the account.

**Admin.** The founder and any teammate she designates. An admin can read everything including private contact fields, approve or reject `pending_edits`, approve or reject ambassador applications, issue claim and freshness magic links, override or set any listing's `tier` and `status`, moderate or remove any listing, manage `promo_codes`, and read CRM and metrics. Admin is the only role that can act on rows it does not own.

### How roles map onto accounts (the schema)

There is no users table today; everything is anonymous and the only ownership signal is `listing_claims.claimer_email`. The bridge to accounts reuses that email as the join key, so no existing data is orphaned.

Recommended: adopt **Supabase Auth with magic-link (passwordless email) as the only sign-in method.** For a 40s-70s audience this is the lowest-friction option that exists. No password to invent, forget, or reset. The user types her email, clicks the link in her inbox, and she is in. It also reuses the exact mental model this audience already learned from the claim flow ("we emailed you a link, click it"). Skip OAuth and social login: this audience does not reliably know which Google account they are signed into, and sensitive Google scopes drag the project into verification. Magic link only.

Add three new tables (the full DDL is canonical in Section H; the shape is):

```
profiles
  id            uuid primary key references auth.users(id)
  email         text not null unique          -- mirrors auth email, lowercased
  display_name  text
  city          text
  state         text
  created_at    timestamptz default now()

account_roles                                  -- additive roles, one row per role held
  id            uuid primary key default gen_random_uuid()
  profile_id    uuid not null references profiles(id) on delete cascade
  role          text not null                  -- player | teacher | organizer | ambassador | admin
  granted_by    text                           -- 'self' for player/teacher/organizer; admin email for ambassador/admin
  granted_at    timestamptz default now()
  unique (profile_id, role)

listing_owners                                 -- replaces email-only claim ownership with account ownership
  id            uuid primary key default gen_random_uuid()
  profile_id    uuid not null references profiles(id) on delete cascade
  listing_table text not null                  -- player_listings | venue_listings | teacher_profiles | event_listings | ad_listings
  listing_id    uuid not null
  created_at    timestamptz default now()
  unique (listing_table, listing_id)
```

`player`, `teacher`, and `organizer` are self-grantable: the moment an account creates the matching listing type, the app inserts the role into `account_roles` with `granted_by = 'self'`. `ambassador` and `admin` are admin-grantable only. This makes `admin` a row in `account_roles` rather than the current shared `ADMIN_PASSWORD`, which closes the gap between the spec ("email allowlist in an admins table") and the code (one shared password). We keep the existing `admins` allowlist concept by treating `account_roles.role = 'admin'` as that allowlist; seed it with the founder's email on migration.

Also add an explicit listing-kind flag so teacher vs venue/organizer stops depending on a regex over `business_name`:

```
alter table venue_listings add column if not exists listing_kind text;  -- 'teacher' | 'venue'
```

Backfill `listing_kind` from the existing regex once, then have the `/get-listed` flow set it directly. The regex stays only as a fallback for un-backfilled rows.

### The bridge: anonymous claim-by-token to owned account

This is the critical migration path and it must not break a single existing claim. The rule: **the email is the spine.** Everything anonymous today is keyed on `listing_claims.claimer_email`; everything tomorrow is keyed on `profiles.id`; the two are joined by lowercased email. The claim flow uses `verifyActionToken("claim", ...)` with a `<table>|<id>` subject, claims stored in `listing_claims` keyed by `(listing_table, listing_id)` with `claimer_email`, and edits buffered in `pending_edits`.

Step by step, what happens the first time a claimer signs in:

1. **Today (already live):** founder or ambassador emails a claim link. The teacher clicks `/claim?token=...`, the token's subject is `<table>|<id>`, she enters her email, and a row lands in `listing_claims` with her `claimer_email` and `status = 'claimed'`. Edits go to `pending_edits`. Nothing changes a listing directly. This keeps working unchanged.

2. **Account upgrade (new):** add a "Sign in to manage your listing" button on `/claim` success and in the freshness emails. It triggers Supabase magic-link to the same email. When she clicks the link and a session is created, an `on_auth_user_created` handler (or a first-login server route) runs the reconciliation function `reconcile_account(profile_id, email)` (full definition in Section H.4b), which:
   - upserts a `profiles` row from `auth.users` (email lowercased),
   - finds every `listing_claims` row where `lower(claimer_email) = profiles.email` and writes a `listing_owners` row for each,
   - infers and grants roles from those listings: a claimed teacher listing grants `teacher`; `event_listings` or a `venue` row grants `organizer`; a `player_listings` row grants `player`,
   - if her email matches an `ambassadors` row with `status = 'approved'` or `'active'`, grants `ambassador`,
   - if her email is in the `admins` allowlist, grants `admin`.

   After this, she owns her listings as an account, not as a floating email, and she sees them all in one dashboard. No data migration is needed up front; reconciliation happens lazily, per person, the first time each one signs in.

3. **Edit behavior after upgrade:** keep `pending_edits` as the default review queue for safety and trust (the brand promise is "a real person confirms changes"). But once an account is verified-owner of a listing, low-risk fields (phone, instagram, day_time, description) can write through immediately and `pending_edits` is reserved for high-trust fields (business_name, website, city/state, tier). Decide field-by-field; the `EDITABLE` allowlist already in `/api/claim` is the right place to split into `EDIT_DIRECT` and `EDIT_REVIEW` (encoded as `pending_edits.risk` in Section H).

4. **Net-new accounts (no prior claim):** a teacher who shows up cold on `/get-listed` signs in by magic link first, then creates her listing. `listing_owners` and `account_roles` are written at creation time. Same dashboard, no claim token needed. This is the path most of the ~2,000+ Oh My Mahjong teachers will take once outreach scales past hand-sent links.

### Permission matrix

Rows are actions, columns are roles. Values: **allow** = may do it for any qualifying row, **own** = may do it only for rows the account owns via `listing_owners`, **admin** = admin only, **no** = not permitted. An account's effective permission for an action is the most permissive cell across the roles it holds.

| Action | Player | Teacher | Organizer | Ambassador | Admin |
|---|---|---|---|---|---|
| View published listings (all kinds) | allow | allow | allow | allow | allow |
| View private contact fields (contact_email, phone) | no | no | no | no | admin |
| Create player_listings (self) | allow | allow | allow | allow | allow |
| Edit player_listings | own | own | own | own | admin |
| Create teacher listing (teacher_profiles / venue_listings, listing_kind = teacher) | no | allow | no | allow | allow |
| Edit teacher listing (own) | no | own | own* | own | admin |
| Create venue_listings, listing_kind = venue | no | no | allow | allow | allow |
| Create event_listings (event/series) | no | no | allow | allow | allow |
| Edit event listing (own) | no | no | own | own | admin |
| Confirm listing still active (confirmed_active_at) | no | own | own | own | admin |
| Set or change own listing tier | no | own | own | own | admin |
| Complete Stripe checkout for a tier upgrade | no | own | own | own | admin |
| Submit edit to a listing (pending_edits) | no | own | own | own | admin |
| Approve / reject pending_edits | no | no | no | no | admin |
| Override any listing tier or status | no | no | no | no | admin |
| Moderate / unpublish / delete any listing | no | no | no | no | admin |
| Claim an open table seat (table_seats) | allow | allow | allow | allow | allow |
| Post / reply on cruise board (cruise_posts) | allow | allow | allow | allow | allow |
| Submit play_request to matcher | allow | allow | allow | allow | allow |
| Apply to be an ambassador | allow | allow | allow | n/a | allow |
| Approve / reject ambassador applications | no | no | no | no | admin |
| Generate scoped claim/referral invite links | no | no | no | allow | admin |
| View own referral dashboard | no | no | no | own | admin |
| Earn elevated ranking eligibility | no | no | no | allow | admin |
| Manage promo_codes | no | no | no | no | admin |
| Read CRM / metrics / admin dashboards | no | no | no | no | admin |
| Grant / revoke roles on accounts | no | no | no | no | admin |

\* An organizer who is not also a teacher cannot create a teacher listing, but if she owns a teacher listing through a prior claim she can edit it; in practice the same account holds both roles, so this rarely matters.

### Why this is the right shape for the goals

- **Lowest possible friction to join.** Magic link plus self-granted player/teacher/organizer roles means a teacher goes from cold to listed and account-owning in two clicks (email, link), and basic participation is free forever. That is what gets the directory to national scale.
- **Revenue lives on the right axis.** Paying never unlocks a role or a listing. It unlocks `tier` upgrades (featured placement, badges, promotion) on listings the account already owns for free. The matrix encodes this: "Create" is free across the board; "Set tier" and "Stripe checkout" are the only money rows, and they are still `own`, not gated behind paying to exist.
- **The bridge preserves everything already live.** No existing claim, edit, or listing is invalidated. Email is the join key, reconciliation is lazy, and the trusted `pending_edits` review flow stays intact until you choose, field by field, to let verified owners write through.
- **Admin becomes a real allowlist.** Moving admin from a shared `ADMIN_PASSWORD` to `account_roles.role = 'admin'` (seeded with the founder's email) matches the intended "admins table" model and lets the founder add a teammate without sharing one password.
- **Ambassador stays prestige, not territory.** It is admin-granted, additive, and grants influence (referral links, ranking eligibility, a badge) rather than ownership of an area.

---

## B. Membership Tiers

This section defines the four membership levels for teachers and organizers: **Free, Verified Community Leader, Ambassador, Enterprise**. The audience is roughly 2,000+ working mahjong teachers, the large majority of whom are solo or two-person small businesses, plus a smaller set of studios, multi-teacher brands, and ecosystem players like Oh My Mahjong. Pricing is anchored to that reality and to the historical site hints ($19 base / $12 Featured / $79 "Official Mahj Spot"). The structure deliberately collapses those three loose price points into one clean paid tier (Verified Community Leader) so the offer is easy to understand and easy to say yes to.

### Core rule (non-negotiable)

Being listed is always free. A teacher or organizer can create a full, real profile, appear in search, and get found by players without paying a cent, forever. Money only buys **visibility, credibility, and promotion**: featured placement, a verified badge, more photos and links, event boosts, profile analytics, priority support, and newsletter inclusion. We never charge merely to exist in the directory. This is what makes the network grow first and monetize second.

### Schema approach

We extend the existing tables rather than build parallel ones. The `tier` column already exists on `venue_listings` (teachers and venues live here today), `event_listings`, and `ad_listings`. We standardize the allowed values (formalized as Postgres enums in Section H) and add a small number of supporting columns.

**Standardized `tier` values** (replacing the loose `'starter' / 'local' / 'basic' / 'featured' / 'free'` strings):

- Teacher/venue membership tier (`membership_tier`): `'free'` (default), `'pro'`, `'ambassador'`, `'enterprise'`
- Event tier (`event_tier`): `'free'` (default), `'boosted'` (a single-event paid upsell, or included in the host's Verified Community Leader/Ambassador/Enterprise allowance), `'featured'`, `'spotlight'`, `'enterprise'`. The `featured`/`spotlight` values are the per-organizer placement tiers detailed in Section D; `boosted` is the per-event upsell described here. Application code chooses which subset a given surface offers.
- `ad_listings.tier` (`ad_tier`): `'basic'`, `'featured'`, `'national'` (brand/sponsorship inventory, covered by the Enterprise/sponsor side, not the membership ladder)

**New columns to add** on `venue_listings` (one migration, `ALTER TABLE`, all nullable so nothing breaks; precise DDL in Section H.6b):
- `verified boolean default false` (drives the Verified badge; set by admin after identity/credential check)
- `verified_at timestamptz`
- `tier_renews_at timestamptz` (paid-through date; when null or past, the profile silently falls back to free presentation, never hidden)
- `pro_expires_at timestamptz` (graceful downgrade; lapsed Verified Community Leader auto-reverts to free, listing never disappears)
- `billing_interval text` (`'monthly' | 'annual'`)
- `featured_until timestamptz` (homepage/state featured slot expiry)
- `photo_count int default 0`, `link_count int default 0` (enforced against tier hard limits)
- `events_boosted_this_period int default 0` (counts boosts used in the current billing period against the Verified Community Leader/Ambassador allowance)
- `seat_count int default 1` and `parent_org_id uuid` (Enterprise multi-teacher; `parent_org_id` references the owning Enterprise `venue_listings` row)
- `priority_support boolean default false`

On `event_listings`:
- `boosted_until timestamptz` (paid or allowance-granted boost expiry; drives event search ranking)

The `memberships` table (Section H.3d) holds clean Stripe billing state, keyed to the listing, so the listing tables stay presentation-focused:

```
memberships (
  id uuid primary key default gen_random_uuid(),
  listing_table text not null default 'venue_listings',
  listing_id uuid not null,
  tier text not null,                  -- pro | ambassador | enterprise
  billing_interval text not null,      -- monthly | annual
  stripe_customer_id text,
  stripe_subscription_id text,
  status text not null default 'active', -- active | past_due | canceled | comped
  current_period_end timestamptz,
  comped_reason text,                  -- e.g. 'ambassador' | 'founding_partner'
  created_at timestamptz default now()
)
```

Comped Ambassadors and founding partners get `memberships.status = 'comped'` with `tier = 'pro'` (or `'ambassador'`), so the same code path lights up their visibility benefits without a charge.

---

### Tier 1: Free (default for everyone)

**Price:** $0/month, forever. `tier = 'free'`.

This is the front door. Every one of the ~2,000+ teachers should land here automatically the moment they make a profile. No card, no friction.

**Features:**
- Full public profile (business_name/display_name, city, state, description/bio, website, phone, instagram, display_email, contact_name)
- Appears in directory search, on the `/teachers` page, and on their state page (`/states/[state]`)
- 1 logo/photo (`logo_url`), `photo_count` capped at 1
- 1 outbound link (website OR one social), `link_count` capped at 1
- Can post events to `event_listings` (open plays, leagues, tournaments)
- Claim-by-token ownership and the suggested-edit flow (`listing_claims` / `pending_edits`)
- Eligible to apply for Ambassador

**Hard limits:** Photos 1; Links 1; Events up to 2 active per month (enough for a normal recurring host; heavy organizers will want Verified Community Leader); no event boosts; no analytics, no newsletter inclusion, no badge.

**Visibility:** Standard placement (sorted by relevance/recency/freshness, never artificially buried); no badge, no featured slots, no search boost.

---

### Tier 2: Verified Community Leader (the workhorse paid tier)

**Price:** **$12/month**, or **$99/year (save ~17%, two months free)**. `tier = 'pro'`.

This is the single, clear paid tier that replaces the old $19/$12/$79 jumble. $12 matches the Featured price the FAQ has always quoted, is an easy monthly call for a solo small-business teacher, and at $99/year it locks in revenue and reduces churn. Everything Verified Community Leader buys is visibility, credibility, and promotion. It never gates the basic listing.

**Features (everything in Free, plus):**
- **Verified badge** on the profile and in search (after admin sets `verified = true`); signals trust to players
- **Featured placement**: rotation into featured slots on `/teachers`, the relevant `/states/[state]` page, and the events/teachers discovery pages (`featured_until` driven)
- **Search boost**: ranks above Free listings within the same city/state
- Up to **8 photos** (`photo_count` cap 8); gallery on the profile
- Up to **5 links** (`link_count` cap 5): website plus multiple socials, booking link, class-signup link
- **Event boosts**: up to **4 boosted events per month** included (`event_listings.tier = 'boosted'`, `boosted_until` set; counted via `events_boosted_this_period`). Boosted events rank above free events on `/events`, state pages, and the homepage featured rail
- **Higher monthly event cap: 15 active events/month**
- **Profile analytics**: profile views, search impressions, link clicks, "email host" clicks (a simple monthly dashboard)
- **Newsletter inclusion**: eligible for the per-state weekly Mailchimp send, with priority over Free
- **Priority support** (`priority_support = true`): faster review of edits, faster claim approval
- **Official Mahj Spot badge** available as the top Verified Community Leader credibility add-on for venues/studios that want the strongest trust signal (toggles `is_official_mahj_spot`; historically positioned at the $79/mo level)
- Founding-partner promo applies here (`FINDMYMAHJ` / Verified Community Leader comped for 12 months via `memberships.status = 'comped'`)

**Hard limits:** Photos 8; Links 5; Events 15 active/month; Event boosts 4/month (extra single boosts can be sold a la carte at ~$5 each later via `event_listings.tier = 'boosted'`).

---

### Tier 3: Ambassador (mostly earned, comped by default)

**Price:** **$0/month (comped) by default**; optional paid component below. `tier = 'ambassador'`. Full earn/apply mechanics live in Section E; this section covers only the membership benefits.

Ambassador is a prestige tier, not a territory. There is no exclusive geography. It is earned by application and by quality + activity (see Section E), and it is awarded, not bought. The default and intended model is **comp**: an approved Ambassador receives all Verified Community Leader visibility benefits at no charge, recorded as `memberships.tier = 'ambassador'`, `status = 'comped'`, `comped_reason = 'ambassador'`. Approval flows from the existing `ambassadors` table (`status` moves `new -> approved -> active`), which then provisions the comped membership on their `venue_listings` row.

**Features (everything in Verified Community Leader, plus):**
- **Ambassador badge** (distinct from the standard Verified badge; higher prestige, visible in search and on the profile)
- **Top-of-state placement**: Ambassadors sort above Verified Community Leader within their home state (a stronger search boost than Verified Community Leader)
- **Higher allowances**: up to **12 photos**, up to **8 links**, **8 boosted events/month**, **unlimited active events**
- **Editorial/newsletter priority**: first pick for newsletter spotlights, "teacher of the month," and homepage features
- **Referral/credit tooling** tie-in (mechanics and any payouts defined in Section E)

**Optional paid component:** Ambassadors who want to keep premium benefits after their active-contribution window lapses, or who want benefits beyond the comped baseline, can convert to paid Verified Community Leader at the standard $12/$99 rather than losing their listing. The listing itself never disappears; only the comp does.

**Hard limits:** Photos 12; Links 8; Events unlimited active/month; Event boosts 8/month.

---

### Tier 4: Enterprise (future; studios, multi-teacher brands, sponsors)

**Price:** **Custom, starting at $199/month** (or **$1,990/year, save ~17%**), quoted per account. `tier = 'enterprise'`. Sold direct, not self-serve, via the existing inquiry path (`/advertise` + `/api/advertise-inquiry`, extended with an Enterprise option). The brief named a typical range of $199-$499/mo by listing volume and reach.

Enterprise is for studios, schools, multi-teacher brands, and ecosystem-scale players (Oh My Mahjong and similar) that need to manage many teacher profiles and want co-marketing and data. This is where the higher-end revenue and the brand-sponsorship money connect to the membership ladder.

**Features (everything in Verified Community Leader/Ambassador-level visibility, plus):**
- **Seats / multiple teacher profiles**: one parent account (`venue_listings` row with `tier = 'enterprise'`, `seat_count = N`) owning many child teacher profiles linked by `parent_org_id` (the `org_id` grouping column in Section G is the alias at the brand level). Each child gets Verified Community Leader-level visibility. Pricing scales by `seat_count` (e.g., $199 base includes 5 seats, then ~$15/seat/month beyond).
- **Brand/studio page** with full gallery, all links, and a roster of their teachers
- **Co-marketing**: featured brand placement on discovery pages and state/metro sponsorship slots (ties into `ad_listings` inventory and the `/advertise` media kit), newsletter sponsorship, dedicated launch/seasonal promotion (card-release-season campaigns)
- **API / data access**: read access to their own listings, events, and aggregate engagement analytics; bulk import/export of their teacher roster and event calendar
- **Unlimited events and boosts** across all owned profiles
- **Dedicated account contact** and priority support across all seats
- **Highest search placement** for the brand page and its featured teachers, plus eligibility for homepage brand features

**Hard limits:** Photos unlimited (reasonable fair-use); Links unlimited; Events unlimited across all seats; Seats per contract (`seat_count`).

---

### Tier comparison at a glance

| | Free | Verified Community Leader | Ambassador | Enterprise |
|---|---|---|---|---|
| Monthly | $0 | $12 | $0 (comped) | from $199 |
| Annual | $0 | $99 (~17% off) | $0 (comped) | from $1,990 (~17% off) |
| `tier` value | `free` | `pro` | `ambassador` | `enterprise` |
| Listed in directory | Yes | Yes | Yes | Yes |
| Photos | 1 | 8 | 12 | Unlimited |
| Links | 1 | 5 | 8 | Unlimited |
| Active events/month | 2 | 15 | Unlimited | Unlimited |
| Event boosts/month | 0 | 4 | 8 | Unlimited |
| Verified badge | No | Yes | Yes (Ambassador badge) | Yes |
| Featured placement | No | Yes | Top-of-state | Brand-level |
| Search boost | No | Yes | Highest (above Verified Community Leader) | Highest |
| Profile analytics | No | Yes | Yes | Yes + API/data |
| Newsletter inclusion | No | Eligible | Priority | Sponsored |
| Priority support | No | Yes | Yes | Dedicated |
| Multi-teacher seats | No | No | No | Yes |

---

### Annual revenue projection

Assumptions: total addressable teachers/organizers conservatively **2,500**. Verified Community Leader at **$99/year effective** (note: at $12/mo, annual buyers pay $99 and monthly-only buyers pay $468/year; $99 is the conservative figure used here). Ambassadors are comped (revenue-neutral on subscription, value-positive on growth and content). Enterprise modeled separately at a conservative **$2,400/year effective** per account.

**Verified Community Leader adoption (the core line):**

| Verified Community Leader adoption | # paying teachers | Annual Verified Community Leader revenue |
|---|---|---|
| 2% | 50 | $19,500 |
| 5% | 125 | $48,750 |
| 10% | 250 | $97,500 |
| 15% | 375 | $146,250 |
| 25% | 625 | $243,750 |

**Enterprise (layered on top):**

| Enterprise accounts | Annual Enterprise revenue |
|---|---|
| 3 | $7,200 |
| 8 | $19,200 |
| 20 | $48,000 |

**Blended example (realistic year-2 target):** 10% Verified Community Leader adoption (250 teachers, $97,500) + 8 Enterprise accounts ($19,200) = **~$116,700/year in membership revenue**, before brand sponsorship (`ad_listings`) and affiliate, which are expected to be the larger money-makers. At 15% Verified Community Leader + 20 Enterprise the membership line alone reaches **~$194,250/year**. These numbers intentionally exclude a la carte single-event boosts (~$5 each).

**Strategic note:** the projection is deliberately patient. Free is the growth engine and should be pushed to near-total teacher coverage first (network effects, the goal of becoming THE national directory). Verified Community Leader conversion and Enterprise sales follow once players are reliably using the site to find games and teachers. Do not optimize early-stage decisions for the revenue table above; optimize for free-tier teacher density, then let visibility, credibility, and promotion sell Verified Community Leader on its own merits.

---

## C. Teacher Profile System

### C.1 Why teachers become first-class

Teachers are the single highest-leverage node in the network. They have the rosters, the recurring classes, the events, and the followings (the Oh My Mahjong ecosystem alone is 2,000+ teachers). Right now a teacher is just a row in `venue_listings` that happens to match the regex `/instructor|teacher|lesson|studio|school|class/`. That is fragile (a "Studio City" restaurant matches; a teacher named "Pat Lessing" matches), it cannot hold teacher-specific data (teaching style, certifications, travel radius, reviews), and it shares a tier vocabulary with restaurants and brands.

Decision: promote teachers to a first-class `teacher_profiles` table, linked to an account, and migrate every regex-matched teacher row out of `venue_listings`. This is the foundation the whole growth flywheel sits on, so it gets real columns, not a `metadata jsonb` junk drawer.

### C.2 The `teacher_profiles` table

There is no Supabase Auth yet, so ownership stays on the existing claim-by-token rail (`listing_claims` + `pending_edits`). We add a nullable `account_id` now so the table is ready the day accounts ship, and we keep `claim_status` so a teacher can own her profile today with only an email.

```sql
create table if not exists public.teacher_profiles (
  id uuid primary key default gen_random_uuid(),

  -- ownership (account-ready, claim-native today)
  account_id uuid,                              -- FK to profiles(id); null until auth ships
  claim_status text not null default 'unclaimed', -- unclaimed | claimed | account_linked
  contact_email text not null,                  -- private, server-only; never returned to anon
  display_email text,                           -- optional public "contact me" address

  -- identity (FREE)
  display_name text not null,
  slug text unique,                             -- /teachers/jane-smith-austin-tx
  headshot_url text,                            -- Storage bucket: logos (reuse existing)
  city text not null,
  state text not null,
  bio text,                                     -- FREE up to 600 chars; Pro unlocks 2000
  teaching_style text,                          -- FREE up to 280 chars; Pro unlocks long-form
  game_types text[] default '{american}',       -- american | mahjong_88 | hong_kong | riichi | other

  -- reach / format (FREE)
  teaches_in_person boolean not null default true,
  teaches_online boolean not null default false,
  travel_radius_miles int,                      -- null = does not travel; FREE

  -- links (FREE: website + ONE social; Pro: all socials)
  website text,
  instagram text,
  facebook text,
  youtube text,
  tiktok text,

  -- certifications (self-described FREE; verified is admin-set, see C.5)
  certifications text[] default '{}',           -- 'nmjl' | 'self_described' | 'oh_my_mahjong' | 'wright_patterson' | 'other'
  cert_detail text,                             -- free text the teacher writes; never shown as "verified"

  -- tier + verification
  tier text not null default 'free',            -- free | pro  (see C.6 / Section B pricing)
  verified_at timestamptz,                      -- admin set; powers the Verified badge
  certified_at timestamptz,                     -- admin set after credential check; powers Certified badge
  is_ambassador boolean not null default false, -- mirror of ambassadors.status in (approved, active)

  -- ranking inputs (computed by cron, see Section F)
  rating_avg numeric(2,1) default 0,            -- 0.0 - 5.0, denormalized from teacher_reviews
  rating_count int not null default 0,
  events_active int not null default 0,         -- live linked events
  responsiveness_score int not null default 0,  -- 0-100, from claim + edit + confirm activity
  quality_score int not null default 0,         -- 0-100 composite the directory sorts on

  -- lifecycle (mirrors existing listing conventions)
  status text not null default 'published',     -- published | pending | hidden | removed
  confirmed_active_at timestamptz,              -- "still teaching?" freshness, same pattern as venue/event
  reviewed_at timestamptz,
  reviewer_notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.teacher_profiles enable row level security;
create policy "anyone reads published teachers"
  on public.teacher_profiles for select using (status = 'published');
-- inserts/updates flow through service-role server routes only (same posture as venues/ambassadors).
```

RLS note: SELECT for anon must use a column allowlist in the query (as `/teachers` already does) so `contact_email`, `reviewer_notes`, and `account_id` never reach the public anon key. Treat `contact_email` as private and `display_email` as the only publishable address, matching the existing `venue_listings` split.

### C.3 Migration from `venue_listings`

One-time, idempotent, reversible. We keep `source_venue_id` so claims and links survive.

```sql
alter table public.teacher_profiles add column if not exists source_venue_id uuid;

insert into public.teacher_profiles
  (display_name, contact_email, display_email, city, state, bio, teaching_style,
   website, instagram, headshot_url, tier, status, created_at, source_venue_id)
select
  v.business_name, v.contact_email, v.display_email, v.city, v.state,
  v.description, null, v.website, v.instagram, v.logo_url,
  case when v.tier in ('featured','pro','official') then 'pro' else 'free' end,
  v.status, v.created_at, v.id
from public.venue_listings v
where (v.venue_type || ' ' || coalesce(v.description,'')) ~* 'instructor|teacher|lesson|studio|school|class'
  and not exists (select 1 from public.teacher_profiles t where t.source_venue_id = v.id);
```

Then:
1. Repoint `listing_claims` and `pending_edits`: rows where `listing_table='venue_listings'` and `listing_id` matches a migrated venue get rewritten to `listing_table='teacher_profiles'`, `listing_id = new teacher id`. The claim-by-token flow keeps working with zero teacher action.
2. Repoint `/teachers` and `/teachers/[id]` to read `teacher_profiles` and drop the regex entirely. The regex was a heuristic; it dies with the migration.
3. Mark migrated venue rows `status='migrated'` (do not hard-delete) for a one-release rollback window, then delete.
4. Keep the Nevada guardrail (`state.is.null OR state.neq.'NV'`) in the public `/teachers` query so Las Vegas Mahjong stays the home market.

Backfill `slug` as `slugify(display_name)-city-state`, deduped with a numeric suffix.

### C.4 Linked event listings

No new join table. Add to `event_listings`:

```sql
alter table public.event_listings
  add column if not exists teacher_id uuid references public.teacher_profiles(id);
```

- When a claimed teacher creates an event through `/get-listed`, stamp `teacher_id` automatically.
- For pre-existing events, match on `host`/`contact` email to the teacher's `contact_email` and let the teacher confirm the link during claim.
- The profile page lists upcoming events where `teacher_id = profile.id AND event_date >= now() AND status='published'`, ordered by date.
- `teacher_profiles.events_active` is recomputed nightly from this count and feeds `quality_score`. Active teachers (real classes on the calendar) outrank dormant ones. That is the network-effect engine: listing events lifts your profile, a strong profile sells your events.

This is FREE. Linking and showing events is core participation, never paywalled. Verified Community Leader affects how prominently those events surface (see C.6), not whether they appear.

### C.5 Reviews and ratings

A new `teacher_reviews` table. Reviews are the trust layer, so anti-abuse is designed in from row one.

```sql
create table if not exists public.teacher_reviews (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid not null references public.teacher_profiles(id),
  rating int not null check (rating between 1 and 5),
  body text,                                    -- optional; 0-1500 chars
  reviewer_name text not null,                  -- public display, "Jane S."
  reviewer_email text not null,                 -- private, server-only, dedupe + abuse key
  reviewer_account_id uuid,                     -- null until accounts ship
  verification_method text not null default 'email', -- email | account | event_attendee | roster
  status text not null default 'pending',       -- pending | published | rejected | spam
  teacher_response text,                        -- one public reply per review (FREE)
  helpful_count int not null default 0,
  ip_hash text,                                 -- rate-limit / brigade detection, never raw IP
  created_at timestamptz default now(),
  moderated_at timestamptz,
  moderator_notes text,
  unique (teacher_id, reviewer_email)           -- one review per person per teacher
);
alter table public.teacher_reviews enable row level security;
create policy "anyone reads published reviews"
  on public.teacher_reviews for select using (status = 'published');
```

Who can leave a review:
- Today (pre-auth): any player who submits name + email through a server route. The route sends a one-click HMAC-signed confirmation link (same token pattern the project already uses for approvals/unsubscribe, 7-day TTL, timing-safe). The review stays `pending` until the link is clicked. No click, no publish. This kills drive-by spam and bots without requiring accounts.
- After accounts ship: signed-in players post with `verification_method='account'`, no email round-trip.
- Higher-trust tag: if `reviewer_email` matches a registration on a `teacher_id`-linked event, or the teacher imports a class roster (post-MVP), the review is tagged `event_attendee` / `roster` and shown with a "Took a class with this teacher" marker. These weigh more in `rating_avg`.

Moderation and anti-abuse:
- Default state is `pending`. Reviews go live on confirmation, but the founder/admin sees all reviews in the existing admin surface (same place as `pending_edits`) and can flip any to `rejected`/`spam`.
- One review per `reviewer_email` per teacher, enforced by the unique constraint. Edits replace, not stack.
- Teachers cannot delete reviews. They get exactly one public `teacher_response` per review, which is the fair pressure-release valve. Removal is admin-only and logged in `moderator_notes`.
- A teacher cannot review herself: reject if `reviewer_email = contact_email`.
- Rate limit the review route at the project baseline (20 req/min per IP) plus `ip_hash` brigade detection: 3+ reviews for one teacher from one `ip_hash` in 24h auto-holds the batch for manual review.
- Auto-hold any 1-star review whose body matches a profanity/threat list for human eyes before publish; auto-hold 5-star bodyless reviews arriving in bursts (review-stuffing signal).
- `rating_avg` uses a Bayesian/weighted average, not a raw mean: a teacher with two 5-star reviews does not outrank a teacher with forty 4.8 reviews. Reviews older than 24 months decay in weight. This keeps ranking about quality + sustained activity, not a popularity spike, consistent with the founder ranking rule.

Reviews and ratings are FREE on both sides. We never charge a teacher to receive, display, or respond to reviews. Hiding bad reviews is not a purchasable feature, ever; that would destroy the trust the directory is built on.

### C.6 Free vs Verified Community Leader field gating

Anchored to the founder rule: basic participation is FREE FOREVER, and we never charge merely to be listed. Verified Community Leader buys visibility, credibility, and promotion, not existence.

| Capability | Free Forever | Verified Community Leader |
|---|---|---|
| Profile published + indexed in `/teachers` | Yes | Yes |
| Name, city/state, headshot, slug page | Yes | Yes |
| Bio | Up to 600 chars | Up to 2000 chars |
| Teaching style | Up to 280 chars | Long-form + curriculum/format blurb |
| In-person / online / travel radius | Yes | Yes |
| Website link | Yes | Yes |
| Social links | ONE (teacher picks) | All (IG, FB, YouTube, TikTok) |
| Self-described certifications | Yes | Yes |
| Linked events shown on profile | Yes (all of them) | Yes, with priority placement |
| Receive + respond to reviews | Yes | Yes |
| Photo / gallery | 1 image (headshot) | Gallery up to 8 |
| Directory sort position | Standard (by `quality_score`) | Boosted within tier band, never above a higher-quality free teacher by trickery |
| Verified Community Leader badge | No | Yes |
| Featured rotation (state/city spotlight, newsletter) | No | Yes |
| Lead/insight stats (profile views, click-throughs) | Basic count | Full dashboard |
| Multi-location / "teaches in N cities" | Single city | Multiple cities |

Gating is enforced server-side off `tier`, not by hiding inputs in the UI. The public profile renderer reads `tier` and truncates/limits accordingly, so a free teacher cannot smuggle five socials in via the API. Verified Community Leader pricing is set in Section B ($12/mo, matching the FAQ-quoted "Featured" price); this section only defines what each tier unlocks.

### C.7 Verification badge ladder

Five badges, additive, stored as discrete rows in the `badges` table (Section H.3f) so a profile can show several at once (a teacher can be Claimed + Verified + Certified + Verified Community Leader + Ambassador). Each is decisive about who can grant it.

1. **Claimed** (`claim_status='claimed'` or `'account_linked'`; `badges.badge='claimed'`). The teacher proved control of the listing email via the existing claim-by-token link. Gray check. Says "this is really me." Free, self-serve, automatic.
2. **Verified** (`verified_at` set by admin; `badges.badge='verified'`). Identity and that she actually teaches is confirmed (a quick human check: real website, real social presence, replies to the verification email, or a short call). Blue check. Free; cannot be bought. This is the integrity floor: Verified Community Leader does NOT auto-grant Verified, because a purchasable trust badge is worthless.
3. **Certified** (`certified_at` set by admin after credential review; `badges.badge='certified'`). She submitted proof of a recognized credential, recorded in the `certifications` table (Section H.3e). The `certifications[]` array records which (`nmjl`, `oh_my_mahjong`, `wright_patterson`, etc.). Gold/teal check with the credential named on hover. Free; admin-gated; the only badge that maps to documents, not just identity. Self-described certs never show this badge; they render as plain text labeled "self-reported."
4. **Verified Community Leader** (`tier='pro'`; `badges.badge='pro'`). Paying member. Pink/brand badge. Signals investment and unlocks the C.6 promotion features. Stacks with the others; never substitutes for Verified or Certified.
5. **Ambassador** (`is_ambassador=true`, mirrored from `ambassadors.status in (approved, active)`; `badges.badge='ambassador'`). Founding/active ambassador, prestige-earned, no exclusive territory. Top-tier badge with a distinct mark. Granted through the existing `ambassadors` flow, never purchased. The Ambassador level (Bronze/Silver/Gold) and the Founding honorific are detailed in Section E.

The **Official Mahj Spot** badge (`badges.badge='official_mahj_spot'`, toggled by `is_official_mahj_spot`) is a separate, optional top-tier credibility mark for venues/studios, available as a Verified Community Leader add-on (Section B, Section G). It is admin-granted after review, never auto-granted by payment.

Display order on the profile and in cards: Ambassador, then Certified, then Verified, then Verified Community Leader, then Claimed. Badge state also feeds `quality_score`: Verified and Certified profiles rank above unverified ones at equal activity, which rewards trust and gives every teacher a concrete, free reason to claim and verify.

### C.8 Build order (teacher subsystem)

1. Create `teacher_profiles` + `teacher_reviews`; add `event_listings.teacher_id`. (Schema only, no UI change.)
2. Run the `venue_listings` migration; repoint `listing_claims`/`pending_edits`; rewrite `/teachers` and `/teachers/[id]` to read `teacher_profiles`; delete the regex.
3. Ship the claim-aware profile editor (free fields) on the existing claim rail, so any teacher can own and fill out her page today, no account required.
4. Ship reviews with the HMAC email-confirmation gate + admin moderation queue alongside `pending_edits`.
5. Wire the nightly `quality_score` cron (reuses the existing matcher cron infra) over rating, events, responsiveness, and badges.
6. Light up Verified Community Leader gating + badges. Stripe checkout for Verified Community Leader is the Section B/G billing dependency (not built yet).

Steps 1-3 are pure growth (every teacher gets a real, claimable, free profile). Revenue (Verified Community Leader, step 6) lands only after the directory is full, exactly as the founder goals order it.

---

## D. Event System

### D.1 Goal and what we are reconciling

Today "events" are spread across four places that overlap and contradict each other:

- `event_listings` (one row per posted event: open plays, tournaments, retreats, leagues, with `event_type`, `event_date`, plus loose recurrence fields `frequency`, `day_time` bolted on by the recurring-open-play migration).
- `tables` + `table_seats` (the live "open game forming" feature: a host opens a 4-seat table, players claim seats, `is_recurring` + `parent_table_id` clone it next week). This is a single specific game instance, not a listing.
- `cruise_posts` (a passenger looking for tablemates on a specific sailing). This is a want-ad, not a hosted event.
- A teacher's classes, which currently have no home at all.

The decision: `event_listings` becomes the single canonical home for everything an organizer or teacher publishes (one-time events, recurring games, tournaments, retreats, cruises run as organized events, and classes). We extend it, we do not fork it. `tables`/`table_seats` stays separate because it is a different primitive: a peer-to-peer single game with seat claiming, not a published organizer event. `cruise_posts` stays separate because it is player demand, not an event. We add clean bridges between all three so they roll up into one activity picture.

### D.2 event_type taxonomy (canonical, lowercase snake_case)

Right now `event_type` is a free string and the UI normalizes with `replace(/[^a-z]/g, "")`, which is why `open_play`, `openplay`, and `recurring` all coexist. We fix the values and keep the normalizer as a safety net for old rows.

Canonical `event_type` values (the full allowed set, enforced by a CHECK constraint going forward):

| `event_type` | Meaning | Default cadence | Default `attend` lean |
|---|---|---|---|
| `open_play` | Casual drop-in games, usually recurring | recurring | all players welcome |
| `class` | A lesson, course, or workshop (the teacher's own offering) | recurring or one-time | beginners welcome |
| `league` | Standing competitive/social season | recurring | all players welcome |
| `tournament` | Competitive bracket, usually one date | one-time | all players welcome |
| `retreat` | Multi-day destination getaway | one-time, dated range | all players welcome |
| `cruise` | Organized mahjong sailing (NOT the `cruise_posts` want-ad board) | one-time, dated range | all players welcome |
| `social` | Mixer, fundraiser, festival, conference, special one-off | one-time | all players welcome |

Notes on reconciliation with existing UI:

- `class` is new and replaces the awkward situation where lessons could only live as a teacher row. A teacher keeps her profile in `teacher_profiles` (Section C) and now also publishes `class` events that hang off that profile (see D.6).
- The events page `TYPE_GROUPS` already folds `recurring` into `open_play` and lumps `retreat`, `cruise`, `social`, `conference`, `festival`, `fundraiser` under the "Events & retreats" chip. We collapse all of those long-tail one-offs into a single canonical `social` value (the chip label stays "Events & retreats"). `conference`/`festival`/`fundraiser`/`special` become a `subtype` tag, not their own `event_type`.
- Legacy value mapping to run once: `openplay`/`recurring` -> `open_play`; `lesson`/`instructor`/`workshop` -> `class`; `conference`/`festival`/`fundraiser`/`special`/`event` -> `social`. The `lib/event-level.ts` `attendInfo()` regex already handles `class`/`lesson`/`workshop`, so beginner-friendly labeling keeps working.

A `subtype` text column captures the long tail without exploding the enum: e.g. `event_type='social'` with `subtype='fundraiser'`, or `event_type='tournament'` with `subtype='charity'`. `subtype` is free-form and display-only (shown as a small tag), never used for gating.

### D.3 Recurrence model

We deliberately do NOT adopt full RRULE. The audience is non-technical organizers and the existing data is already human-readable strings (`frequency='Weekly'`, `day_time='Tuesdays 10am'`). A full iCal RRULE engine is overkill, hard to author in a form, and we have zero need to materialize individual occurrences for a directory. We use a **simple structured cadence** that is easy to fill in, easy to render, and good enough for "where can I play this week."

Recurrence fields on `event_listings` (extends the existing `frequency`/`day_time`):

| Column | Type | Values / format | Notes |
|---|---|---|---|
| `frequency` | text | `once`, `weekly`, `biweekly`, `monthly`, `multi_day` | EXISTS (was free text). Add CHECK with these values. `multi_day` is for retreats/cruises that run a contiguous date range. |
| `day_of_week` | text[] | `{Tuesday,Thursday}` | New, structured. Replaces parsing `day_time`. Reuses the same Monday-Sunday vocabulary as `tables.day_of_week`. |
| `time_of_day` | text | `Morning`/`Afternoon`/`Evening` OR a clock string like `10:00 AM` | New. Same vocabulary as `tables.time_of_day` for consistency; a free clock time is allowed for precise events. |
| `week_of_month` | smallint | 1-5, null | New. Only meaningful when `frequency='monthly'` (e.g. "2nd Tuesday" = `week_of_month=2`, `day_of_week={Tuesday}`). |
| `day_time` | text | human label, e.g. "Tuesdays 10am" | EXISTS. Keep as the rendered display string. We auto-compose it from the structured fields on save, and the events page already prefers it for display. |
| `event_date` | timestamptz | start | EXISTS. For `frequency='once'`/`multi_day` this is the real date. For recurring rows it is the series start (nullable, as today). |
| `end_date` | timestamptz | end | EXISTS. For `multi_day` this is the last day; for a recurring series it is an optional season end. |
| `series_status` | text | `active`, `paused`, `ended` | New. Lets a host pause a summer-off league without deleting it. Default `active`. |

Why this shape: the events page (`app/events/page.tsx`) already treats a row with no future `event_date` but `event_type in (open_play, recurring)` as a standing game, and `whenLabel()` already falls back to `day_time`. Structured `day_of_week`/`time_of_day`/`week_of_month` simply make that reliable and filterable ("Tuesday games near me") instead of regex-guessing a free string. No occurrence table is generated; a recurring event is one durable row, which is exactly what a directory wants for SEO and freshness.

`tables` recurrence stays as-is: `is_recurring` + `parent_table_id` is the right model there because each week is a distinct seat-claimable instance. We do not merge the two recurrence systems; they answer different questions (a directory listing vs. a specific fillable game).

### D.4 Who can post each type, by role and tier

Identity is the email on the listing plus claim-by-token (pre-auth) or the account (post-auth). Anyone can submit anything; the founder approves; tiers buy visibility, never the right to exist. We standardize `event_listings.tier` toward the `event_tier` enum (Section H); the per-organizer placement values are `free`, `featured`, `spotlight` (with `boosted` as the per-event upsell and `enterprise` for the multi-listing parent).

| `event_type` | Who posts it | Entry flow | Free tier? |
|---|---|---|---|
| `open_play` | Any host, teacher, or venue | `/get-listed?type=Open Play` | Yes, always free to list |
| `class` | Teachers (the profile owner) | `/get-listed?type=Mahjong Instructor` then add classes | Yes, always free |
| `league` | Organizers, teachers, venues | `/get-listed?type=League` | Yes, always free |
| `tournament` | Organizers, teachers, venues | `/get-listed?type=Tournament` | Yes, always free |
| `retreat` | Organizers, brands, larger businesses | `/get-listed?type=Retreat` | Yes, always free |
| `cruise` | Organizers, travel hosts | `/get-listed?type=Retreat` (cruise option) | Yes, always free |
| `social` | Anyone | `/get-listed` | Yes, always free |

This aligns with the founder rule: free for players always, and never charge merely to be listed. Every teacher and organizer can post unlimited free events. Tiers (`featured`, `spotlight`, per-event `boosted`) buy placement, badges, and promotion, covered next.

### D.5 Free vs. paid event limits

Core principle restated: listing any number of events is FREE FOREVER. We never cap how many real events an organizer can publish, because event volume is exactly the network-effect content we want. The paid product is visibility and promotion, not access. (The per-tier event allowances in Section B's comparison table govern the included Verified Community Leader/Ambassador *boost* counts and the recommended active-event display ceilings, not a hard cap on listing real events.)

Concrete model:

- `tier='free'` (default): unlimited events. Standard placement (sorted by the existing `TYPE_RANK` then freshness via `confirmed_active_at`). Appears on the events page, state page, and city page. Eligible for the "Confirmed active" freshness badge. This is the forever-free baseline.
- `tier='featured'` ($12/mo, matching the FAQ's historical Featured price, billed per organizer not per event): the organizer's events sort to the top of their type group and state, get a colored "Featured" ribbon, and are eligible for the weekly state newsletter slot. A teacher who runs a weekly open play plus monthly tournaments pays once and all her events lift together. This is the same $12 spend as teacher/venue Verified Community Leader (Section B); a Verified Community Leader organizer's events surface at the featured level.
- `tier='spotlight'` ($79/mo, matching the historical "Official Mahj Spot" price): everything in Featured, plus homepage rotation eligibility (`app/page.tsx` already surfaces `tournament`/`retreat` on the homepage; spotlight events get first call there), the Official Mahj Spot badge on the teacher/organizer profile, and inclusion in the cross-state national roundup. Aimed at the larger businesses and high-volume hosts.
- `tier='boosted'` (per-event upsell, ~$5 each, or drawn from the Verified Community Leader/Ambassador monthly boost allowance): a single event lifted above free events via `boosted_until`, without a full subscription.

Anti-spam guardrail that is NOT a paywall: free submissions land as `status='pending_review'` (consistent with the player-listings launch-gate pattern already in production) and the founder approves. A soft rate signal of more than 10 pending free events from one `contact_email` in 24 hours flags for manual review using the existing `rate_hits` infrastructure. This stops junk without ever charging a real organizer to list.

Stripe is not built yet (growth first, revenue later). Until it is, `tier` defaults to `free` and `featured`/`spotlight`/`boosted` are granted manually by the founder (or comped via `promo_codes`, e.g. `FINDMYMAHJ` founding-partner). The existing `stripe_payment_id` column is the hook for later; no schema change needed when checkout ships.

### D.6 Linking events to a teacher/organizer profile

Today an event only carries a free-text `host` name. That is fine for display but cannot roll up into stats or a profile. We add real foreign-key links while keeping `host` for the cases where the organizer has no profile.

New columns on `event_listings`:

| Column | Type | Purpose |
|---|---|---|
| `host` | text | EXISTS. Display name of organizer. Keep. |
| `teacher_id` | uuid, FK -> `teacher_profiles(id)`, on delete set null | New (Section C). Points at the teacher profile when the event is a teacher's class or game. Drives the "Upcoming events" section on the teacher profile page. |
| `organizer_listing_id` | uuid, FK -> `venue_listings(id)`, on delete set null | New. When the event is run by a non-teacher organizer who has a venue/club profile, this points at it. Feeds `organizer_stats`. |
| `contact_email` | text | EXISTS. Remains the ownership/claim key when there is no profile link. |

Resolution of the two profile links: `teacher_id` resolves to `teacher_profiles` (first-class teachers); `organizer_listing_id` resolves to `venue_listings` (venues/clubs and the migration source). Both can be set; they do not collide. The teacher profile page reads upcoming events on `teacher_id`; the organizer rollup reads on `organizer_listing_id`.

Linking rules:

- When a teacher publishes a `class` (or any event) from her `/get-listed?type=Mahjong Instructor` flow, we set `teacher_id` to her `teacher_profiles` row automatically.
- When an event is claimed via the existing `listing_claims` flow and the claimer's email matches a profile's `contact_email`, we backfill `teacher_id` (or `organizer_listing_id`) to bind orphan events to the now-claimed profile. This reuses the claim plumbing already in production; no new claim mechanism.
- The teacher profile page (`app/teachers/[id]/page.tsx`) gains an "Upcoming events and games" section: a query for `event_listings` where `teacher_id = teacher.id AND status='published'`, ordered by the same date/recurrence logic the events page uses. This turns a static teacher card into a live activity feed and is a direct credibility/visibility win that helps justify the paid tiers.
- `cruise_posts` is unchanged and stays player-side demand. An organized mahjong cruise is a real `event_listings` row with `event_type='cruise'`; the `cruise_posts` board is where individual passengers find tablemates. We keep them visually adjacent on `/travel` (which already pulls `cruise` and `retreat` events) but do not merge them, because one is supply and one is demand.
- `tables` link: when a host's open table is part of a published recurring open play, we add an optional `event_listing_id` (uuid, FK -> `event_listings(id)`, nullable) on `tables`, so a claimable weekly table can point at the directory listing it belongs to. This lets the "Confirmed active" freshness signal flow from a real played game (`tables.played_at`) up to its `event_listings` row, and lets a listing show "next game forming, 2 seats open." Most ad-hoc tables leave it null.

### D.7 Activity stats roll-up (feeds rankings in F)

Rankings (Section F) reward quality and activity, not popularity alone. The event system is the richest activity signal, so we define exactly what it contributes, computed per organizer profile. These are derived, not authored, and recomputed by a cron rollup into stable columns so ranking reads are cheap. We add an `organizer_stats` table keyed by `venue_listings.id` rather than stuffing counters onto `venue_listings`, so the ranking job can rewrite it freely without touching the listing.

New table `organizer_stats`:

| Column | Type | Source / definition |
|---|---|---|
| `organizer_listing_id` | uuid PK, FK -> `venue_listings(id)` | One row per organizer/teacher profile |
| `events_total` | int | Count of `event_listings` where `organizer_listing_id = this` |
| `events_upcoming` | int | Same, with a future `event_date` OR an active recurring series (`series_status='active'`) |
| `recurring_active` | int | Count of their `series_status='active'` recurring events |
| `events_confirmed_90d` | int | Their events with `confirmed_active_at` within 90 days |
| `games_played` | int | Count of `tables` linked via `event_listing_id` with `played_at` set |
| `event_types_distinct` | int | Distinct `event_type` they run |
| `last_activity_at` | timestamptz | Max of their events' `confirmed_active_at`, `created_at`, and linked `tables.played_at` |
| `computed_at` | timestamptz | When the rollup last ran |

How this feeds F: Section F consumes `organizer_stats` as the activity inputs. The contract is that these columns are honest and freshness-weighted:

- Activity favors **recurring, confirmed, recently-active** events over a pile of stale one-offs. A row with `recurring_active > 0` and `events_confirmed_90d > 0` is a live community node; a profile with 30 events but `last_activity_at` six months ago decays.
- Volume is rewarded but capped in F's favor: `events_total` is available, but the headline activity signals are `recurring_active`, `events_confirmed_90d`, and `games_played`, which a spammer cannot fake without actually running and confirming games.
- The rollup runs daily via the existing cron pattern (same approach as the dark matcher and freshness jobs). It is additive and read-only against `event_listings`/`tables`, so it cannot corrupt listings.

### D.8 Migration summary (one idempotent file, additive, non-breaking)

```sql
-- event_type taxonomy + cadence
alter table public.event_listings
  add column if not exists subtype text,
  add column if not exists day_of_week text[],
  add column if not exists time_of_day text,
  add column if not exists week_of_month smallint,
  add column if not exists series_status text not null default 'active',
  add column if not exists organizer_listing_id uuid references public.venue_listings(id) on delete set null;
create index if not exists idx_event_listings_organizer on public.event_listings(organizer_listing_id);

-- table -> directory listing bridge
alter table public.tables
  add column if not exists event_listing_id uuid references public.event_listings(id) on delete set null;
create index if not exists idx_tables_event_listing on public.tables(event_listing_id);

-- organizer activity rollup (feeds F)
create table if not exists public.organizer_stats (
  organizer_listing_id uuid primary key references public.venue_listings(id) on delete cascade,
  events_total int not null default 0,
  events_upcoming int not null default 0,
  recurring_active int not null default 0,
  events_confirmed_90d int not null default 0,
  games_played int not null default 0,
  event_types_distinct int not null default 0,
  last_activity_at timestamptz,
  computed_at timestamptz not null default now()
);
alter table public.organizer_stats enable row level security;
```

Then a one-time data backfill normalizes legacy `event_type` and `frequency` values (D.2 mapping), composes `day_time` from any structured fields, and CHECK constraints are added after the backfill so existing rows do not fail. RLS follows the established pattern: anon has no SELECT (all public pages render server-side with the service role), and the service role does every read and write.

---

## E. Ambassador Program

Find My Mahj Game Ambassadors are the people who actually make tables happen: the teachers, hosts, and club leaders who pull new players into the directory and keep games on the calendar. The program is a status, not a payout scheme and not a coupon. You cannot buy it, and a Verified Community Leader subscription does not get you in. You earn it by doing the work that grows the network, and you keep it by staying active. That is what makes the badge worth wearing.

This builds directly on the existing `ambassadors` table. We extend that table rather than create a parallel one, and we link an ambassador to the listings they already own through the existing claim-by-token system. There are no exclusive territories. Any number of ambassadors can operate in the same city, and quality plus activity, not seniority, decides level.

### E.1 How someone becomes an ambassador

Two paths, same bar:

1. **Apply.** The existing `/api/ambassadors/apply` route and form stay as the front door. We keep the current fields (name, email, phone, city, state, role, reach, why).
2. **Invite.** Admins can flag a strong teacher or organizer who already meets the bar and invite them directly. An invited person still gets a row in `ambassadors`; we just set `source = 'invited'` so we can see how someone entered.

Applying does not make you an ambassador. It opens a review. The bar below is objective so the decision is defensible and so applicants know exactly what to build toward.

### E.2 Objective qualifying requirements

An applicant must clear a **base gate** plus a **points threshold**. Points come from verified activity, so the program rewards people who are actually building the community, not people with the biggest follower count.

**Base gate (all required):**

- **Verified email** on file (already captured).
- **At least one claimed listing** that is `status = 'published'` and **100% profile-complete**. The claim is verified through the existing `listing_claims` token flow, so we know the person actually controls the listing.
- **Tenure of 60+ days** since their first claimed listing was published. This filters out people who spin up a profile only to apply. Stored as `first_listing_at`.
- **Clean standing:** no unresolved abuse or accuracy flags, no listings forced down by admin in the last 90 days.

**Activity points (need 100 to qualify for Bronze):**

| Action | Points | How it is verified |
|---|---|---|
| Verified event hosted (past `event_date`, not flagged) | 15 each | Row in `event_listings` they host, claimed via token, date in the past |
| Recurring series kept current | 20 per active series | Series exists and next instance is in the future |
| New player listing referred (used their referral code) | 5 each | `player_listings` carrying their `referral_code` |
| New paid teacher/organizer referred | 25 each | `venue_listings`/`event_listings` with their `referral_code` and a `stripe_payment_id` |
| Profile completeness at 100% (their own listing) | 10 | Completeness check |
| Tenure, per full month active | 2 per month | `first_listing_at` vs now |
| Verified community contribution (admin-logged: ran a class, hosted a meetup, wrote a guide we published) | 10-30, admin sets | `ambassador_contributions` rows |

These map to concrete, already-trackable signals. We are not inventing a social graph. Everything keys off listings, the recurring-series migration, `stripe_payment_id`, and a small contributions log. Points are recomputed nightly by a cron job (the project already runs cron for the matcher) and cached on the ambassador row.

### E.3 Levels (earned, not bought)

Four levels. Level is a function of current points and standing, recomputed monthly so it reflects real activity, not a one-time spike.

| Level | Threshold (rolling 12-month points) | What it signals |
|---|---|---|
| **Bronze: Ambassador** | 100 | Active community builder. Real profile, real activity. |
| **Silver: Senior Ambassador** | 300 | Consistently hosts and refers. A go-to in their area. |
| **Gold: Lead Ambassador** | 700 | Drives meaningful directory growth. Multiple active series or strong referral track record. |
| **Founding Ambassador** | Capped cohort, invite/honored | The first wave who helped launch the directory. Permanent honorific shown alongside their current earned level. |

"Founding Ambassador" is the only non-points label, and it is deliberately scarce: it is a one-time launch cohort badge, capped (target 50). It is honorary on the timeline but does **not** exempt anyone from staying active to keep the live earned level and its perks. We store it as a boolean (`is_founding`) separate from `level`, so a Founding Ambassador who goes quiet still loses Verified Community Leader and placement perks while keeping the founding honorific.

Rolling 12-month windows on points mean an ambassador who stops hosting will drift down a level over a year. The program stays a living signal, not a participation trophy.

### E.4 Benefits by level

Benefits scale up with level. Every benefit is tied to visibility, credibility, promotion, or access, never cash for being listed.

**Bronze (and up):**
- **Ambassador badge** on every listing they own (see E.7).
- **Profile boost:** their listings rank above non-ambassador listings of the same tier within the same city/state filter. Activity still breaks ties, so an inactive ambassador does not outrank an active teacher.
- **Newsletter eligibility:** entered into the rotation for the state weekly (the FMG Mailchimp per-state send), featured when there is space.
- **Ambassador-only digest:** monthly email with roadmap previews.
- **Referral code** (`referral_code`) and a shareable referral link, plus a simple stats view.

**Silver adds:**
- **Comped Verified Community Leader** on one of their listings while they hold the level (set the listing `tier='pro'` and record `comp_reason='ambassador'`, or `memberships.status='comped'`, so billing knows it is a grant, not a Stripe charge). The instant they drop below Silver for a full month, the comp lapses back to free.
- **Guaranteed newsletter feature** at least once per quarter in their state send.
- **Early access** to new features before general release.

**Gold adds:**
- **Top placement:** first eligible slot in their city directory and in the "Ambassadors near you" module on the homepage and state pages.
- **Roadmap input:** standing invite to a quarterly ambassador roundtable.
- **Ambassador-only events:** invitations to virtual and in-person gatherings, training, and the annual card-release briefing.
- **Co-promotion:** featured in a short spotlight post and tagged on social.

**Founding (honorific, layered on earned level):**
- Permanent **Founding Ambassador ribbon** on the badge.
- Listed on a public **Founding Ambassadors** wall page, in cohort order.

No level, at any point, lets someone pay to skip the requirements. Comped Verified Community Leader is a benefit of the level, not a path to it.

### E.5 Application and review process

The flow reuses the existing admin pattern (service-role server routes, email-allowlist admin gating, the `/admin` dashboard).

1. **Apply or get invited.** Application lands in `ambassadors` with `status = 'new'`.
2. **Auto-prescreen (nightly cron).** The points/gate job stamps each `new` applicant with computed `points`, `gate_passed` (bool), and `level_candidate`.
3. **Admin review.** From `/admin`, the reviewer sees the prescreen plus the applicant's claimed listings and contribution log. They set `status` and `reviewed_at`. The full status set is `new | reviewing | approved | active | renewal_due | lapsed | declined`. On approve, set `status = 'active'`, `approved_at`, `level`, and issue the `referral_code`.
4. **Welcome.** Reuse the existing `sendEmail` path to send an approval email with the badge, the referral link, and the renewal date.
5. **Decline.** Set `status = 'declined'` with `reviewer_notes`. Decline is not permanent; the email invites them to build the missing requirements and reapply.

All of this stays server-side. No anon read/write to `ambassadors`, consistent with the existing RLS posture (service-role only).

### E.6 Renewal and expiry (keeps it active, not honorary)

- **Term:** ambassador status runs in **180-day terms** (`term_ends_at`). The nightly cron recomputes points and standing.
- **30 days out**, if rolling points are still above the held level's threshold and standing is clean, the term **auto-renews** and `term_ends_at` advances 180 days.
- **If points have fallen below threshold**, status flips to `renewal_due` and the ambassador gets a heads-up email naming exactly what to do (host an event, complete a profile, refer a player) to requalify.
- **At term end without requalifying**, status flips to `lapsed`. The badge is removed, profile boost ends, and any comped Verified Community Leader reverts to free the next cron run. Lapsing is reversible: the moment they cross the threshold again, the next cron promotes them back to `active`. No reapplication needed.
- **Standing override:** an unresolved abuse or accuracy flag immediately moves an ambassador to `reviewing` and suspends placement and comp until an admin clears it, regardless of points.

### E.7 Badge design and visibility

The badge is the public, earned mark of trust. It renders anywhere a listing card shows (player searches, city pages, teacher and event listings the ambassador owns). It is the **Ambassador** badge from the Section C ladder, with a level mark.

- **Shape and color by level:** a small ribbon-and-tile mark. **Bronze** = warm bronze, **Silver** = cool silver, **Gold** = gold. **Founding** adds a thin laurel ribbon around the level color.
- **Label:** "FMG Ambassador" with the level word ("Senior", "Lead") and, where space allows, the home city (for example, "Lead Ambassador, Austin TX"). Mobile cards show the mark plus tooltip only.
- **Tooltip / badge page:** tapping the badge opens a short explainer ("Ambassadors are verified community builders who host games and welcome new players. This status is earned and renewed every 180 days.") with a link to the public program page.
- **Directory placement:** ambassadors sort above non-ambassadors of the same listing tier within the same filter, with activity as the tiebreaker. Gold takes the first eligible slot.
- **Homepage and state pages:** an **"Ambassadors near you"** module surfaces nearby active ambassadors, Gold first, seeded by the visitor's state.
- **Newsletter:** ambassadors carry a small badge glyph in their per-state feature.
- **Founding wall:** a public `/ambassadors/founding` page lists the founding cohort.

### E.8 Schema changes (extend the existing `ambassadors` table)

```sql
alter table ambassadors
  add column if not exists source           text default 'applied',   -- applied | invited
  add column if not exists referral_code    text unique,              -- issued on approval
  add column if not exists points           integer default 0,        -- cached, recomputed nightly
  add column if not exists level            text,                     -- bronze | silver | gold | null
  add column if not exists level_candidate  text,                     -- prescreen result for new applicants
  add column if not exists gate_passed      boolean default false,    -- base gate met
  add column if not exists is_founding      boolean default false,    -- founding cohort honorific
  add column if not exists first_listing_at timestamptz,              -- tenure anchor
  add column if not exists approved_at      timestamptz,
  add column if not exists term_ends_at     timestamptz,              -- 180-day renewal window
  add column if not exists last_scored_at   timestamptz,              -- last cron recompute
  add column if not exists reviewer_notes   text,
  add column if not exists comp_listing_id  uuid,                     -- which listing holds comped Pro
  add column if not exists profile_id       uuid;                     -- links to an account once they sign in

-- existing status default 'new' stays; widen the allowed set in app logic to:
-- new | reviewing | approved | active | renewal_due | lapsed | declined

create table if not exists ambassador_contributions (
  id uuid primary key default gen_random_uuid(),
  created_at   timestamptz default now(),
  ambassador_id uuid references ambassadors(id) on delete cascade,
  kind         text,        -- event_hosted | series_active | player_referred | paid_referred | profile_complete | community
  points       integer default 0,
  ref_table    text,        -- e.g. 'event_listings'
  ref_id       uuid,        -- the row that earned the points
  note         text,
  logged_by    text         -- admin email, for community contributions
);

alter table ambassador_contributions enable row level security;
-- service_role only, same posture as ambassadors.
```

The nightly cron writes/refreshes `ambassador_contributions`, sums them into `ambassadors.points`, sets `level`/`gate_passed`/`level_candidate`, advances or lapses `term_ends_at`, and grants or reverts the comped-Verified Community Leader listing tier. `referral_code` ties new listings back to the ambassador who brought them in (the same code surfaced in the referral stats view and stored on `listing_claims.referred_by`). This keeps the entire program inside the existing schema, the existing service-role/admin-allowlist security model, and the existing cron infrastructure, with no new auth system required.

---

## F. Rankings and Reputation System

### F.0 Design principles

Rankings exist to make Find My Mahj Game the place players trust to pick a teacher, a game, or a community. They must reward people who actually teach, host, and show up, not people who pad a profile or buy a tier. Five rules govern every formula below.

1. **Paying never buys rank.** `tier` (free/pro/ambassador/enterprise on the membership ladder; the event tiers; basic/featured/national on `ad_listings`) is invisible to scoring. Premium buys visibility, credibility badges, and promotion, never a higher ranking number. A free teacher who teaches weekly outranks a paid teacher who does nothing.
2. **Verified activity only.** Raw self-reported claims score zero. An event counts when it is published AND has a `confirmed_active_at` stamp or a host claim (`listing_claims`). A review counts when it passes anti-gaming checks. Profile fields count only when filled with real values.
3. **Recency decays.** A tournament hosted last month is worth more than one hosted two years ago. Every time-sensitive input runs through an exponential half-life.
4. **Newcomers get a fair lane.** Rising Teachers is scored on momentum (rate of growth), not totals, so a teacher who joined six weeks ago can lead it. This is the on-ramp that drives the network effect.
5. **Everything is capped, deduped, and auditable.** No single source can dominate a score. Every score row stores its component breakdown so the founder can see exactly why someone ranks where they do.

### F.1 The six leaderboards

| # | Leaderboard | Entity ranked | What it rewards | Primary surface |
|---|-------------|---------------|-----------------|-----------------|
| 1 | Most Active Teachers | a teacher (`teacher_profiles`; pre-migration, a `venue_listings` teacher row) | sustained teaching + hosting + responsiveness + quality | national + per-state |
| 2 | Most Active Communities | a metro, then a state (aggregate) | density and liveliness of real activity in a place | national + per-state |
| 3 | Top Event Hosts | a host (teacher or organizer) keyed by host identity across `event_listings` | volume, recency, and variety of well-run events | national + per-state |
| 4 | Rising Teachers | a teacher row newer than 120 days, or with a steep recent slope | momentum for newcomers | national + per-state |
| 5 | Verified Teachers | a teacher row | trust: identity + credential + freshness | filter/badge, not a race |
| 6 | Ambassador Leaders | an `ambassadors` row with `status in (approved, active)` | prestige contribution: invites that convert + activity they seed | national |

Each leaderboard is published as a top 25 nationally and a top 10 per state on each state page. State pages already render Teachers and Events, so the leaderboard slots in as an ordered band above the existing lists.

### F.2 Storage model

Scores are not computed at request time. They are precomputed by a nightly job and read straight from physical tables, so the directory stays fast at 5,000+ profiles. Three pieces:

1. **`teacher_reviews`** (Section C, the canonical teacher quality signal) plus the optional generic **`reviews`** table for event reviews if needed. The reputation cron reads from `teacher_reviews` for teacher boards (a one-line config, not a schema conflict). The generic `reviews` table is defined below for event-side quality.
2. **`reputation_scores`** (new): one row per ranked entity per leaderboard, the precomputed result the UI reads. A regular table written by the nightly job, not a Postgres materialized view, because we need writable columns (`flagged`, `components` jsonb, `rank`, `verification_level`) and idempotent UPSERTs.
3. **`reputation_events`** (new, append-only ledger): every scoreable action with its source, weight, and timestamp. The nightly job reads this ledger plus the listing tables and applies caps and decay. This ledger is what makes scoring auditable and dedupe-able.

```sql
-- F.2 Reputation system. Idempotent; safe to rerun. Service-role only (RLS on, no anon policies).

-- Generic quality signal (event reviews). Teacher reviews use teacher_reviews (Section C).
create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  listing_table text not null,            -- 'venue_listings' | 'event_listings'
  listing_id uuid not null,
  rating int not null check (rating between 1 and 5),
  body text,
  reviewer_email text not null,           -- never shown publicly; used for dedupe + abuse checks
  reviewer_ip_hash text,                  -- sha256(ip + salt); dedupe + abuse, never raw IP
  verified_play boolean not null default false,
  status text not null default 'pending', -- pending | published | rejected | flagged
  created_at timestamptz not null default now(),
  reviewed_at timestamptz
);
alter table public.reviews enable row level security;
create index if not exists idx_reviews_listing on public.reviews(listing_table, listing_id, status);

-- Append-only scoring ledger. One row per scoreable event.
create table if not exists public.reputation_events (
  id uuid primary key default gen_random_uuid(),
  entity_kind text not null,              -- 'teacher' | 'host' | 'community' | 'ambassador'
  entity_key text not null,              -- teacher/venue id, host key, metro slug, or ambassadors.id
  source text not null,                  -- 'event_confirmed' | 'review' | 'profile' | 'response' | 'invite_converted' | 'claim' | ...
  source_ref uuid,                       -- the row that produced it, for dedupe
  weight numeric not null default 0,     -- pre-decay points this action is worth
  occurred_at timestamptz not null,      -- the real-world time the action happened (drives decay)
  created_at timestamptz not null default now(),
  unique (source, source_ref, entity_key)  -- hard dedupe
);
alter table public.reputation_events enable row level security;
create index if not exists idx_repevents_entity on public.reputation_events(entity_kind, entity_key, occurred_at);

-- Precomputed leaderboard output the UI reads. One row per entity per board.
create table if not exists public.reputation_scores (
  id uuid primary key default gen_random_uuid(),
  board text not null,                   -- 'active_teachers' | 'communities' | 'event_hosts' | 'rising_teachers' | 'verified_teachers' | 'ambassador_leaders'
  entity_kind text not null,
  entity_key text not null,
  scope text not null default 'national',-- 'national' or a two-letter state code for per-state boards
  score numeric not null default 0,
  rank int,                              -- 1-based rank within (board, scope); null until ranked
  components jsonb not null default '{}', -- {activity: 31.2, reviews: 18.0, response: 9.0, ...} for audit
  verification_level int not null default 0, -- 0 unverified .. 3 fully verified (see F.7)
  flagged boolean not null default false,    -- pulled from public ranking pending manual review
  computed_at timestamptz not null default now(),
  unique (board, scope, entity_key)
);
alter table public.reputation_scores enable row level security;
create index if not exists idx_repscores_board_scope_rank on public.reputation_scores(board, scope, rank);

-- Kill switch + tuning, reuses the existing app_settings pattern (matcher ships dark the same way).
insert into public.app_settings (key, value) values
  ('rankings_enabled', 'false'),         -- ships DARK; founder flips to 'true' to publish boards
  ('rankings_min_score', '5')            -- entities below this never appear publicly
  on conflict (key) do nothing;
```

### F.3 Time windows and the decay function

One decay function is used everywhere, so the system is predictable.

```
weight_now = base_weight * 0.5 ^ (age_days / HALF_LIFE_DAYS)
```

Half-lives by signal:

- Events and hosting activity: **HALF_LIFE = 90 days**.
- Reviews: **HALF_LIFE = 180 days** (quality ages slower than activity).
- Response behavior: a rolling **60-day** window, no decay inside it.
- Profile completeness: no decay, but it is gated on freshness (see F.4).

Hard cutoff for all ledger reads: **730 days**. Anything older than 2 years contributes 0 and is excluded from the nightly recompute for speed. Communities use the same 90-day half-life on their underlying activity.

### F.4 The scored inputs (shared building blocks)

Every leaderboard is assembled from these six normalized components. Each is scaled 0-100 before weighting.

1. **Activity (A)**, confirmed, recent doing. Sources: published events with a future or recent `event_date`/`end_date`; `is_recurring = true` series (scored once per active series, not once per occurrence); `confirmed_active_at` stamps; approved `listing_claims`; tables formed and played (`tables`/`table_seats`) where the entity is the host. Each source emits a `reputation_events` row. Decay 90d. Capped (F.6).

2. **Event recency and frequency (E)**, for hosts. `recency`: days since the most recent confirmed event, mapped so 0-14 days = full, 90+ days = near zero. `frequency`: count of distinct confirmed events in the trailing 365 days, log-scaled (`min(100, 40 * ln(1 + n))`). Variety bonus: +5 for hosting 2+ distinct `event_type` values in the window, capped at +10.

3. **Profile completeness (P)**, credibility floor. +12 each for `description` (40+ chars), `logo_url`, `website` (must return 200, per the no-dead-links rule), `city`+`state`, `instagram`, plus `contact_name`. Max 72, normalized to 100. Gated on freshness: if the listing has no `confirmed_active_at` in 365 days, P is multiplied by 0.5.

4. **Reviews (R)**, quality with recency decay. Only published reviews. Bayesian-smoothed average: `R_avg = (C * m + sum(rating_i * decay_i)) / (C + sum(decay_i))`, with prior mean `m = 4.0` and prior weight `C = 5`. `decay_i` uses the 180d half-life. `verified_play = true` reviews carry 1.5x weight. Volume bonus: `min(15, 3 * ln(1 + published_review_count_2y))` added after smoothing.

5. **Response rate (Q)**, do they answer players? Inputs: `inquiries` and Connect requests routed to this entity in the trailing 60 days, matched by `contact_email`/host identity, against `email_sends` and any reply stamp. `Q = responded_within_72h / total_routed`, scaled 0-100. Cold start: fewer than 3 routed inquiries gets a neutral `Q = 60`.

6. **Verification (V)**, trust multiplier, see F.7. Expressed as a level 0-3 and applied as a multiplier on the final score (0.85 / 1.0 / 1.10 / 1.20), not as additive points.

### F.5 The six formulas

All weights sum to 100 before the verification multiplier. Final published score = weighted sum * V_multiplier, rounded to 1 decimal.

**1. Most Active Teachers**
```
score = (0.40*A + 0.20*E + 0.15*R + 0.15*Q + 0.10*P) * V_mult
```
Activity-led on purpose. Eligibility: a teacher profile, `status = 'published'`, V level >= 1 (claimed or verified), and at least one confirmed activity in 365 days.

**2. Most Active Communities** (metro first, then state aggregate)
```
metro_score = 0.45*A_density + 0.25*event_volume + 0.15*active_teacher_count + 0.15*new_listings_30d
```
- `A_density`: sum of decayed activity from all teachers, hosts, events, and tables in the metro, divided by `ln(1 + population_bucket)`.
- `event_volume`: decayed confirmed events in the metro.
- `active_teacher_count`: teachers in the metro with V >= 1 and activity in 365 days.
- `new_listings_30d`: any listing type created in the trailing 30 days (rewards growth).
- State score = sum of its metro scores, same decay. No verification multiplier (communities are aggregates).

**3. Top Event Hosts**
```
score = (0.45*E + 0.25*A + 0.15*R + 0.15*Q) * V_mult
```
Host identity is keyed by `host` + `contact` on `event_listings`, collapsed to a single entity. Eligibility: 2+ confirmed distinct events in 730 days.

**4. Rising Teachers** (momentum, not totals)
```
rise = 0.50*slope_90d + 0.30*first_90d_activity + 0.20*early_completeness
```
- `slope_90d`: change in raw Activity between the trailing 0-45 day window and the 46-90 day window, normalized.
- `first_90d_activity`: total confirmed activity since the listing's `created_at`, only if `created_at` is within 120 days.
- `early_completeness`: profile P captured in the first 30 days.
- Eligibility: listing `created_at` within 120 days, V >= 1, at least one confirmed activity. Graduation: once a teacher has 365 days of tenure they leave Rising and compete in Most Active.

**5. Verified Teachers**
Not a points race; it is a trust tier with a stable sort. Listed if V >= 2. Sort within the badge by `(V_level desc, freshness desc, R desc)`. Also exposed as a filter ("Verified only") on every state page, which is the strongest credibility driver for the paid tiers.

**6. Ambassador Leaders**
```
score = 0.50*invites_converted + 0.25*activity_seeded + 0.15*tenure + 0.10*review_quality_of_referrals
```
- `invites_converted`: distinct new listings or approved claims attributable to this ambassador's referral code/link, decayed 180d.
- `activity_seeded`: decayed activity from the listings they referred.
- `tenure`: time since `ambassadors.created_at` with an approved/active status, log-scaled and capped.
- No exclusive territory and no popularity input. Eligibility: `ambassadors.status in (approved, active)`.

### F.6 Anti-gaming safeguards

- **Verification gating.** Boards 1, 3, 4 require V >= 1 (the entity has at least claimed its listing via `listing_claims`). Self-listed-but-unclaimed profiles can exist and be found, but cannot rank until a human proves control of the listing email.
- **Recency decay.** Built into every time-sensitive component (F.3).
- **Caps per source.** Max 3 confirmed events per host per 30-day window toward A; max 1 recurring series counted per active series; profile completeness hard-capped at its component ceilings; response-rate cold-start neutralized at 60; ambassador `tenure` capped; any single review capped at its decayed weight. Activity from `tables`/`table_seats` capped at 2 formed tables per week per host.
- **Review dedupe and abuse.** `reviews`/`teacher_reviews` enforce dedupe on `(listing_id, reviewer_email)` and a soft check on `reviewer_ip_hash`: 3+ reviews from one IP hash to listings sharing a `contact_email` flips them to `flagged`. Reviews land `pending` and must reach `published` (auto-publish only when `verified_play = true` AND no IP/email collision). A reviewer cannot review a listing whose `contact_email` matches their own.
- **Ledger dedupe.** The `unique (source, source_ref, entity_key)` constraint means one event, review, or converted invite can score a given entity exactly once, ever, even if the nightly job runs twice.
- **Velocity / outlier flags.** The nightly job sets `reputation_scores.flagged = true` (and drops the row from public output) on: a score jumping more than 60 percent night over night, more than 8 new confirmed events for one host in 7 days, more than 10 new published reviews for one listing in 7 days, or a referral burst where one ambassador's converted invites all share an IP hash. Flagged rows surface in the founder admin queue.
- **No paid override.** The job never reads `tier` or `stripe_payment_id` into any score. A unit test asserts that removing all `tier` values leaves every rank unchanged.
- **State-claim guard.** `scope` per-state ranking uses the listing's stored `state`; an entity cannot appear in a state it has no listing in.

### F.7 Verification levels (V)

Stored as `reputation_scores.verification_level`, derived nightly from existing signals. No new auth system needed; it builds on the claim flow and maps onto the Section C badge ladder.

| Level | Name | Requirement | Maps to badge | V_mult |
|------|------|-------------|---------------|--------|
| 0 | Unlisted/unclaimed | self-listed only, no claim | (none) | 0.85 |
| 1 | Claimed | approved `listing_claims` row (email control proven) | Claimed | 1.00 |
| 2 | Verified | claimed + `website` returns 200 + at least one `confirmed_active_at` in 365 days + a real `logo_url` | Verified | 1.10 |
| 3 | Credentialed | level 2 + founder-confirmed teaching credential (recorded in `certifications` / `reviewer_notes`), or 5+ published verified-play reviews averaging 4.5+ | Certified | 1.20 |

Level 3 is the prestige top. It is the badge the directory leans on for trust and the strongest reason a teacher upgrades and engages.

### F.8 How scores are computed and stored (the nightly job)

A single Vercel cron route, `app/api/cron/rankings/route.ts`, following the exact pattern in `app/api/cron/matcher/route.ts`: `CRON_SECRET` bearer check with `crypto.timingSafeEqual`, service-role Supabase client, and a dark-launch gate (`app_settings.rankings_enabled` must be `'true'`, otherwise return `{ skipped: true }`). Daily cadence.

Nightly sequence:

1. **Ingest deltas into the ledger.** Scan `event_listings`, teacher tables, `teacher_reviews`/`reviews`, `listing_claims`, `tables`, `inquiries`, and ambassador referrals for rows changed since the last run (`rankings_last_run_at` watermark in `app_settings`). Insert `reputation_events` rows. The unique constraint makes this safe to rerun.
2. **Aggregate per entity.** For each entity, pull its ledger rows inside the 730-day cutoff, apply decay (F.3) and per-source caps (F.6), and compute the six components.
3. **Compute and rank.** Apply each board's formula (F.5), set `score`, `components`, and `verification_level`. Drop anything below `rankings_min_score`. Run velocity/outlier checks and set `flagged`. Assign `rank` per `(board, scope)` with ties broken by V then freshness.
4. **UPSERT into `reputation_scores`** on `(board, scope, entity_key)`, set `computed_at = now()`. The UI reads only this table, ordered by `rank`.
5. **Communities** are aggregated last, after teacher/host scores exist.

Scale: at 5,000 profiles the active-window ledger is tens of thousands of rows; the whole job is well under a minute. Reads stay O(1) because the leaderboard is a single indexed select. The model scales to 50,000+ profiles by adding a per-state partition to the ingest loop, no architecture change.

### F.9 What the founder controls

- `rankings_enabled` flips the whole system live (ships dark, same as the matcher).
- `rankings_min_score` raises or lowers the floor for public appearance.
- The flagged queue in admin (one-click clear, ban, or re-rank), consistent with `/api/admin/edits`.
- Per-board weights live in `app_settings` keys (e.g. `weights_active_teachers = '40,20,15,15,10'`) so the formulas can be retuned without a deploy.
- `verification_level` 3 (credentialed) is granted by the founder, keeping the prestige top human-curated.

Net effect: a teacher can join free, claim her listing in one click, host one confirmed event, fill her profile, and show up on Rising Teachers within a day, with a clear, honest path to Most Active and to a Verified badge.

---

## G. Monetization Roadmap

The roadmap is sequenced by **total live listings** (count of rows across `player_listings`, `venue_listings`/`teacher_profiles`, and `event_listings` where `status='published'`), not by calendar time. The founding rule holds at every phase: **players never pay, and no one is ever charged merely to be listed.** Paid tiers buy visibility, credibility, and promotion only. The single hardest job early is seeding supply (teachers and organizers) before demand (players) shows up, so Phase 1 is deliberately almost entirely free.

We standardize on the four living tiers from Section B (`free`, `pro`, `ambassador`, `enterprise`) that map cleanly onto the existing `tier` columns so we never fork the schema. Sponsorship stays in `ad_listings`. This section turns the paid tiers on in order.

---

### Phase 1, Seed Supply (0-1,000 live listings)

**What is free.** Everything that creates inventory.
- All `player_listings` (free forever, never revisited).
- All teacher and organizer listings at `tier='free'`: business name, city/state, bio, website, one social link, logo/headshot, and a public profile at `/teachers/[id]`.
- All `event_listings` at `tier='free'` including the recurring-series feature.
- Claim-by-token (`listing_claims`) and suggested edits (`pending_edits`) free.
- The `ambassadors` program runs live to recruit supply by hand.

**What is paid.** Effectively nothing is *sold* yet, but the rails are laid:
- Keep `stripe_payment_id` columns present and nullable. Do not build checkout yet.
- Offer a **Founding Partner** lock-in using the existing `promo_codes` row `FINDMYMAHJ`: any teacher who claims and completes a profile during Phase 1 is flagged (`is_founding_partner boolean default false` on `venue_listings`; `Founding Partner` badge) and guaranteed Verified Community Leader-tier visibility free for 12 months once Verified Community Leader launches. This is a *future* benefit, not a charge, and it is the carrot that makes claiming worth doing now.

**Revenue opportunities.** Near zero by design. The only real money in Phase 1 is **opportunistic sponsorship** in `ad_listings`: one or two `tier='basic'` newsletter or homepage sponsors sold by hand, hard-capped so the site never looks ad-heavy while thin. Affiliate links already in play count as soft revenue.

**Key risk: empty-directory cold start.** Mitigation: pre-seed `venue_listings`/`teacher_profiles` with the ~2,000 known teachers (status `published`, owner-unclaimed) so search results look national from day one, then drive claims via the ambassador program and the Founding Partner offer. Never gate any of this behind payment. Measure progress by **claimed listings** and **player searches per listing**, not by revenue.

---

### Phase 2, Turn On Verified Community Leader (1,000-5,000 live listings)

Demand now exists: players are searching and contacting listings. That is the only honest moment to charge, because Verified Community Leader buys *attention that is now scarce*.

**What is free.** The entire Phase 1 free tier stays exactly as is, permanently. A `tier='free'` teacher or organizer is fully searchable, fully contactable, and never degraded. Free listings get a basic Verified badge once claimed and reviewed (`reviewed_at` set), so trust does not become a paywall.

**What is paid, `tier='pro'` ($12/mo or $99/yr, the Verified Community Leader price set in Section B).**
- Priority sort above free listings in city/state results (a `tier`-weighted order, never hidden free results).
- Photo gallery, multiple events linked to one profile, full social set, and a "Featured" ribbon.
- Inclusion in the weekly newsletter teacher/event spotlights.
- The **Official Mahj Spot** credibility badge as the top Verified Community Leader add-on (toggle `is_official_mahj_spot`), positioned at the historical $79/mo level for venues/studios that want the strongest trust signal. Reuses an existing column, no new schema.
- Rankings (Section F: quality + activity) give Verified Community Leader no head start at all in scoring; Verified Community Leader buys placement and badges, never rank.

**Build now:** Stripe Checkout writing back to `stripe_payment_id` and `memberships`, plus `pro_expires_at timestamptz` on the listing tables so lapsed Verified Community Leader auto-reverts to `free` (graceful downgrade, listing never disappears).

**Revenue opportunities.** Recurring Verified Community Leader subscriptions become the core line. At 5,000 listings, even 8-12% Verified Community Leader conversion at $12/mo is roughly $19k-$28k/mo recurring. Per-event "boost" one-offs (`tier='boosted'`, ~$5) for organizers who want a single tournament promoted. Sponsorship in `ad_listings` scales to `tier='featured'` state/category sponsorships.

**Key risks: charging too early, and churn.** Do not enable Verified Community Leader until median **inbound contacts per claimed listing** clears a real threshold, show each teacher their own profile-view and contact stats in-dashboard (the "why this is worth $12" proof), honor every Founding Partner free year, and make downgrade painless so canceling never means delisting. Watch churn monthly; if it exceeds ~6% the value story, not the price, is broken.

---

### Phase 3, THE Directory: Enterprise, Sponsorship, Data (5,000+ live listings)

Find My Mahj Game is now the default place players look. Pricing power and large multi-listing accounts emerge.

**What is free.** Unchanged and protected. Free remains genuinely useful (searchable, contactable, claimable) precisely so the directory stays comprehensive and players keep coming, which is what makes the paid tiers valuable.

**What is paid, `tier='enterprise'`.** For large operators (organizers running dozens of events/year, multi-location studios, big-following brands).
- One account managing many listings via an `org_id` grouping column (aliased to `parent_org_id` at the brand level, Section H), bulk event upload tied to the recurring-series migration, and a real organizer dashboard.
- Top-priority placement, multi-state featured presence, and an account-manager touch.
- Pricing $199-$499/mo by listing volume and reach, billed via the same Stripe + `stripe_payment_id` + `memberships` rails.
- Verified Community Leader and the Official Mahj Spot badge continue underneath, unchanged.

**Revenue opportunities.** Enterprise recurring contracts (the largest deals). Sponsorship at scale in `ad_listings`: national newsletter, owned categories ("Tiles brought to you by…"), and `target_states[]`-targeted state/metro sponsorships sold off a published rate card. Data and lead products: aggregate, anonymized demand reporting ("which metros have the most unmet player searches") sold to brands and large studios, plus opt-in qualified lead routing from `inquiries` to Verified Community Leader/Enterprise teachers. Sell only aggregates or explicitly opted-in leads.

**Key risks: gaming and trust.** Mitigations: keep rankings quality + activity weighted (Section F) so money buys a boost but never buys the top spot; require admin review (the `account_roles.role='admin'` allowlist + `pending_edits`) before the Official Mahj Spot badge or Enterprise priority goes live; rate-limit and de-dupe new listings via the existing `rate_hits`; and publicly label sponsored placements as sponsored. Protecting player trust is the asset that lets every paid tier exist, so it outranks any single quarter's revenue.

---

### Roadmap at a glance

| Phase (live listings) | Free | Paid | Revenue focus | Key risk -> mitigation |
|---|---|---|---|---|
| **1 (0-1,000)** | All players, teachers, organizers, events (`tier='free'`); claim + edit; pre-seeded teacher profiles | Nothing sold; lay Stripe rails; `is_founding_partner` lock-in via `FINDMYMAHJ` | ~$0 by design; 1-2 hand-sold `ad_listings` sponsors | Cold start -> pre-seed ~2,000 teachers + ambassador-driven claims |
| **2 (1,000-5,000)** | Full free tier stays, plus Verified badge | `tier='pro'` $12/mo; Official Mahj Spot $79/mo; build Stripe + `pro_expires_at` | Recurring Verified Community Leader subs; per-event boosts; `tier='featured'` sponsorships | Charging too early / churn -> gate Verified Community Leader on real inbound demand; show per-listing stats; honor founder free year; painless downgrade |
| **3 (5,000+)** | Free stays fully useful and protected | `tier='enterprise'` $199-$499/mo (multi-listing via `org_id`, account mgmt) | Enterprise contracts; national/category/state sponsorship; aggregate data + opt-in leads | Gaming / trust -> quality+activity rankings; admin-reviewed badges; `rate_hits` de-dupe; label sponsored |

---

## H. Database Schema and Permissions

This section is the single physical-schema source of truth for the whole system. It freezes a clean target schema (new tables plus precise `ALTER` statements on the live tables) that supports every feature in Sections A through G without a rebuild, and it lays out an additive, non-breaking migration order so production can move from "anonymous, claim-by-token, shared admin password" to "account-ready, role-aware, RLS-enforced" one file at a time, with nothing breaking in between.

Three live realities drive every decision below:

1. There is no Supabase Auth yet. Ownership today is `listing_claims.claimer_email` keyed on `(listing_table, listing_id)`. We add accounts as an additive layer and keep the email as the join spine (Section A).
2. The four listing tables (`player_listings`, `venue_listings`, `event_listings`, `ad_listings`) have had `SELECT` revoked from `anon` (the launch gate). All public pages render server-side with the service role. The RLS policies below are the correct future state for when accounts and the anon/authenticated split go live; until then the service role bypasses RLS and is the only reader and writer.
3. Migrations are idempotent (`add column if not exists`, `create table if not exists`, `create policy` guarded by `drop policy if exists`).

### H.1 Naming and conventions (one set of names for all of A-G)

- Accounts live in `public.profiles` (id mirrors `auth.users.id`). Section C's `account_id` foreign key points here.
- Roles live in `public.account_roles` (one row per role held: `player | teacher | organizer | ambassador | admin`). This replaces the shared `ADMIN_PASSWORD` and subsumes the existing `admins` allowlist table (we keep `admins` as a seed source, then treat `account_roles.role = 'admin'` as the live allowlist).
- Listing ownership lives in `public.listing_owners` (account ownership), with the email-keyed `listing_claims` staying as the pre-account ownership rail. Bridged by lowercased email.
- Billing/subscription state lives in `public.memberships` (Section B), keyed to a listing.
- Tier and role vocabularies are real Postgres enums (H.2), replacing the loose `'starter'`/`'local'`/`'basic'`/`'featured'`/`'free'` strings.
- Teacher-specific data is promoted to `public.teacher_profiles` (Section C). `teacher_profiles` is the forward home for instruction listings; `venue_listings` is the parent for venues/clubs and the migration source. `event_listings.teacher_id` (Section C) and `event_listings.organizer_listing_id` (Section D) both resolve correctly (see H.5).
- **Membership tiers:** Free, Verified Community Leader, Ambassador, Enterprise. **Roles:** Player, Teacher, Organizer, Ambassador, Admin. **Badges:** Claimed, Verified, Certified, Verified Community Leader, Ambassador, Official Mahj Spot, Founding Partner. **Ambassador levels:** Bronze, Silver, Gold, Founding (honorific). These names are used identically across Sections A, B, C, E, F, and H.

### H.2 Enums: one clean vocabulary for tiers and roles

Create the enums, then migrate existing rows, then (after backfill) point the columns at the enums. That order means no existing row can fail a cast.

```sql
-- H.2 Enums. Idempotent: guarded creation so a rerun does not error.
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
```

Reconciliation note on event tiers: Section B uses `free | boosted | enterprise`, Section D uses `free | featured | spotlight`, and the FAQ history is `$12 Featured` / `$79 Official Mahj Spot`. The `event_tier` enum is the superset of all four so neither section breaks: `boosted` is the per-event upsell (Section B/D), `featured`/`spotlight` are the per-organizer placement tiers (Section D, mapped to $12/$79), `free` is the default, `enterprise` is the multi-listing parent. `membership_tier` (`free | pro | ambassador | enterprise`) is the clean teacher/venue ladder. Application code chooses which subset a given surface offers; the database accepts all of them.

Migrating the existing loose strings to enum values, before the column type change:

```sql
-- venue_listings.tier: 'starter' (default) and any 'featured'/'free'/'official' UI values -> membership_tier
update public.venue_listings set tier = 'free'  where tier in ('starter', 'free') or tier is null;
update public.venue_listings set tier = 'pro'   where tier in ('featured', 'pro', 'official');

-- event_listings.tier: 'local' (default), plus 'featured'/'free'/'official' -> event_tier
update public.event_listings set tier = 'free'      where tier in ('local', 'free') or tier is null;
update public.event_listings set tier = 'featured'  where tier = 'featured';
update public.event_listings set tier = 'spotlight' where tier in ('spotlight', 'official');

-- ad_listings.tier: 'basic' (default) stays; widen as sponsorship grows
update public.ad_listings set tier = 'basic' where tier is null;
```

Then change the column types (run only after the updates above succeed and after confirming no stray values remain):

```sql
alter table public.venue_listings
  alter column tier drop default,
  alter column tier type membership_tier using tier::membership_tier,
  alter column tier set default 'free';

alter table public.event_listings
  alter column tier drop default,
  alter column tier type event_tier using tier::event_tier,
  alter column tier set default 'free';

alter table public.ad_listings
  alter column tier drop default,
  alter column tier type ad_tier using tier::ad_tier,
  alter column tier set default 'basic';
```

If you prefer zero risk of a hard cast failure in production, keep `tier` as `text` and add a `CHECK (tier in (...))` constraint instead of the enum cast. We recommend the enum and the pre-cast `UPDATE` sweep above, which makes the cast safe.

### H.3 New tables: accounts, roles, ownership, memberships, audit

```sql
-- H.3a Accounts. id mirrors auth.users(id). The FK is added in H.10 step 8, AFTER auth is enabled.
create table if not exists public.profiles (
  id            uuid primary key,                 -- = auth.users.id once auth is on
  email         text not null unique,             -- lowercased mirror of the auth email
  display_name  text,
  city          text,
  state         text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
alter table public.profiles enable row level security;
create index if not exists idx_profiles_email on public.profiles (lower(email));

-- H.3b Roles. Additive: one row per role an account holds. Replaces ADMIN_PASSWORD.
create table if not exists public.account_roles (
  id          uuid primary key default gen_random_uuid(),
  profile_id  uuid not null references public.profiles(id) on delete cascade,
  role        account_role not null,
  granted_by  text,                               -- 'self' | admin email | 'system'
  granted_at  timestamptz not null default now(),
  unique (profile_id, role)
);
alter table public.account_roles enable row level security;
create index if not exists idx_account_roles_profile on public.account_roles (profile_id);

-- H.3c Account ownership of listings. Forward replacement for email-only claims.
create table if not exists public.listing_owners (
  id            uuid primary key default gen_random_uuid(),
  profile_id    uuid not null references public.profiles(id) on delete cascade,
  listing_table text not null,                     -- player_listings | venue_listings | teacher_profiles | event_listings | ad_listings
  listing_id    uuid not null,
  created_at    timestamptz not null default now(),
  unique (listing_table, listing_id)
);
alter table public.listing_owners enable row level security;
create index if not exists idx_listing_owners_profile on public.listing_owners (profile_id);
create index if not exists idx_listing_owners_lookup on public.listing_owners (listing_table, listing_id);

-- H.3d Billing/subscription record (Section B), keyed to a listing.
create table if not exists public.memberships (
  id                     uuid primary key default gen_random_uuid(),
  listing_table          text not null default 'venue_listings',
  listing_id             uuid not null,
  tier                   membership_tier not null,        -- pro | ambassador | enterprise
  billing_interval       text not null default 'monthly', -- monthly | annual
  stripe_customer_id     text,
  stripe_subscription_id text,
  status                 text not null default 'active',  -- active | past_due | canceled | comped
  comped_reason          text,                            -- 'ambassador' | 'founding_partner'
  current_period_end     timestamptz,
  created_at             timestamptz not null default now(),
  updated_at             timestamptz not null default now(),
  unique (listing_table, listing_id, tier)
);
alter table public.memberships enable row level security;
create index if not exists idx_memberships_listing on public.memberships (listing_table, listing_id);
create index if not exists idx_memberships_sub on public.memberships (stripe_subscription_id);

-- H.3e Certifications (Section C), normalized out of the text[] for admin review.
create table if not exists public.certifications (
  id           uuid primary key default gen_random_uuid(),
  teacher_id   uuid not null references public.teacher_profiles(id) on delete cascade,
  kind         text not null,            -- nmjl | oh_my_mahjong | wright_patterson | other
  detail       text,
  proof_url    text,
  verified_at  timestamptz,             -- admin set; null = submitted, not yet verified
  verified_by  text,                     -- admin email
  created_at   timestamptz not null default now()
);
alter table public.certifications enable row level security;
create index if not exists idx_certifications_teacher on public.certifications (teacher_id);

-- H.3f Badges (Section C/E). Discrete, additive, one row per badge a listing holds.
create table if not exists public.badges (
  id            uuid primary key default gen_random_uuid(),
  listing_table text not null,           -- teacher_profiles | venue_listings | event_listings
  listing_id    uuid not null,
  badge         text not null,           -- claimed | verified | certified | pro | ambassador | official_mahj_spot | founding_partner
  granted_by    text,                    -- 'system' | admin email
  granted_at    timestamptz not null default now(),
  revoked_at    timestamptz,
  unique (listing_table, listing_id, badge)
);
alter table public.badges enable row level security;
create index if not exists idx_badges_listing on public.badges (listing_table, listing_id) where revoked_at is null;

-- H.3g Audit log. Every privileged write appends one row. Service-role only.
create table if not exists public.audit_log (
  id          uuid primary key default gen_random_uuid(),
  actor_email text not null,             -- admin/ambassador email, or 'system' for cron
  action      text not null,             -- 'role.grant' | 'listing.tier_override' | 'edit.approve' | 'ambassador.approve' | ...
  target_table text,
  target_id   uuid,
  before      jsonb,
  after       jsonb,
  created_at  timestamptz not null default now()
);
alter table public.audit_log enable row level security;
create index if not exists idx_audit_target on public.audit_log (target_table, target_id, created_at);
create index if not exists idx_audit_actor on public.audit_log (actor_email, created_at);
```

The feature-owned tables from Sections C, D, and F (`teacher_profiles`, `teacher_reviews`, `organizer_stats`, plus `reviews` / `reputation_events` / `reputation_scores`) are defined in their own sections; H references them, adds their cross-table foreign keys (H.5), includes them in the RLS pass (H.7), and sequences them in the migration order (H.10). To prevent the two review tables from diverging: standardize on Section C's `teacher_reviews` for teacher quality and use Section F's generic `reviews` only for event reviews; F's nightly job reads `teacher_reviews` for teacher boards. This is a one-line cron config, not a schema conflict.

### H.4 The ownership bridge: account_id, listing_owners, and claim backfill

This must not break a single live claim. The rule from Section A holds: the email is the spine. Add a nullable `account_id` to every listing table now, keep `listing_claims` working unchanged, and reconcile lazily per person at first sign-in.

```sql
-- H.4a Nullable owner pointer on every listing table. Null until the owner signs in.
alter table public.player_listings add column if not exists account_id uuid;
alter table public.venue_listings  add column if not exists account_id uuid;
alter table public.event_listings  add column if not exists account_id uuid;
alter table public.ad_listings     add column if not exists account_id uuid;
-- teacher_profiles.account_id already exists per Section C.

-- Add the FK only after profiles exists (H.10 step 2 creates profiles first).
do $$ begin
  alter table public.player_listings add constraint player_listings_account_fk
    foreign key (account_id) references public.profiles(id) on delete set null;
exception when duplicate_object then null; end $$;
do $$ begin
  alter table public.venue_listings add constraint venue_listings_account_fk
    foreign key (account_id) references public.profiles(id) on delete set null;
exception when duplicate_object then null; end $$;
do $$ begin
  alter table public.event_listings add constraint event_listings_account_fk
    foreign key (account_id) references public.profiles(id) on delete set null;
exception when duplicate_object then null; end $$;
do $$ begin
  alter table public.ad_listings add constraint ad_listings_account_fk
    foreign key (account_id) references public.profiles(id) on delete set null;
exception when duplicate_object then null; end $$;

create index if not exists idx_player_listings_account on public.player_listings (account_id);
create index if not exists idx_venue_listings_account  on public.venue_listings (account_id);
create index if not exists idx_event_listings_account  on public.event_listings (account_id);
create index if not exists idx_ad_listings_account     on public.ad_listings (account_id);
```

The reconciliation function, run once per person the first time their email gets a session. It reads existing `listing_claims` rows, writes account ownership, stamps `account_id`, and infers roles. Idempotent: rerunning for the same email is a no-op.

```sql
-- H.4b Lazy reconciliation. Called from the first-login server route (or on_auth_user_created).
create or replace function public.reconcile_account(p_profile_id uuid, p_email text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_email text := lower(p_email);
  r record;
begin
  -- 1. Bridge every email-keyed claim to account ownership.
  for r in
    select listing_table, listing_id
    from public.listing_claims
    where lower(claimer_email) = v_email
      and status in ('claimed', 'account_linked')
  loop
    insert into public.listing_owners (profile_id, listing_table, listing_id)
    values (p_profile_id, r.listing_table, r.listing_id)
    on conflict (listing_table, listing_id) do nothing;
  end loop;

  -- 2. Stamp account_id on each owned listing.
  update public.player_listings  l set account_id = p_profile_id
    from public.listing_owners o
    where o.profile_id = p_profile_id and o.listing_table = 'player_listings'  and o.listing_id = l.id;
  update public.venue_listings   l set account_id = p_profile_id
    from public.listing_owners o
    where o.profile_id = p_profile_id and o.listing_table = 'venue_listings'   and o.listing_id = l.id;
  update public.event_listings   l set account_id = p_profile_id
    from public.listing_owners o
    where o.profile_id = p_profile_id and o.listing_table = 'event_listings'   and o.listing_id = l.id;
  update public.ad_listings      l set account_id = p_profile_id
    from public.listing_owners o
    where o.profile_id = p_profile_id and o.listing_table = 'ad_listings'      and o.listing_id = l.id;
  update public.teacher_profiles l set account_id = p_profile_id, claim_status = 'account_linked'
    from public.listing_owners o
    where o.profile_id = p_profile_id and o.listing_table = 'teacher_profiles' and o.listing_id = l.id;

  -- 3. Infer roles from owned listings (self-granted).
  insert into public.account_roles (profile_id, role, granted_by)
  select p_profile_id, 'player', 'self'
  where exists (select 1 from public.listing_owners o
                where o.profile_id = p_profile_id and o.listing_table = 'player_listings')
  on conflict (profile_id, role) do nothing;

  insert into public.account_roles (profile_id, role, granted_by)
  select p_profile_id, 'teacher', 'self'
  where exists (select 1 from public.listing_owners o
                where o.profile_id = p_profile_id and o.listing_table = 'teacher_profiles')
     or exists (select 1 from public.listing_owners o
                join public.venue_listings v on v.id = o.listing_id
                where o.profile_id = p_profile_id and o.listing_table = 'venue_listings'
                  and v.listing_kind = 'teacher')
  on conflict (profile_id, role) do nothing;

  insert into public.account_roles (profile_id, role, granted_by)
  select p_profile_id, 'organizer', 'self'
  where exists (select 1 from public.listing_owners o
                where o.profile_id = p_profile_id and o.listing_table = 'event_listings')
     or exists (select 1 from public.listing_owners o
                join public.venue_listings v on v.id = o.listing_id
                where o.profile_id = p_profile_id and o.listing_table = 'venue_listings'
                  and coalesce(v.listing_kind, 'venue') = 'venue')
  on conflict (profile_id, role) do nothing;

  -- 4. Grant ambassador if an approved/active application matches this email.
  insert into public.account_roles (profile_id, role, granted_by)
  select p_profile_id, 'ambassador', 'system'
  from public.ambassadors a
  where lower(a.email) = v_email and a.status in ('approved', 'active')
  on conflict (profile_id, role) do nothing;

  -- 5. Grant admin if the email is in the existing admins allowlist.
  insert into public.account_roles (profile_id, role, granted_by)
  select p_profile_id, 'admin', 'system'
  from public.admins ad
  where lower(ad.email) = v_email
  on conflict (profile_id, role) do nothing;
end;
$$;
```

Why this is safe and non-breaking:

- Anonymous creation still works. New listings still insert with `account_id = null`; the claim-by-token flow still writes `listing_claims`. Nothing requires an account.
- No upfront data migration. `listing_owners` fills in lazily, one person at a time, the first time each signs in. The schema is account-ready on day one; the data converges over weeks.
- The function is `security definer` so the first-login route can call it under a restricted role; the service-role route can also call it directly.
- Re-runnable. Every insert is `on conflict do nothing`, so a double-fire (trigger plus route) cannot duplicate.

### H.5 Cross-table foreign keys (so A-G stitch together)

Additive and `on delete set null` so deleting a parent never cascades a listing away.

```sql
-- Section C: teacher -> events
alter table public.event_listings add column if not exists teacher_id uuid;
do $$ begin
  alter table public.event_listings add constraint event_listings_teacher_fk
    foreign key (teacher_id) references public.teacher_profiles(id) on delete set null;
exception when duplicate_object then null; end $$;
create index if not exists idx_event_listings_teacher on public.event_listings (teacher_id);

-- Section D: events -> organizer (a venue_listings row), tables -> events
alter table public.event_listings add column if not exists organizer_listing_id uuid;
do $$ begin
  alter table public.event_listings add constraint event_listings_organizer_fk
    foreign key (organizer_listing_id) references public.venue_listings(id) on delete set null;
exception when duplicate_object then null; end $$;
create index if not exists idx_event_listings_organizer on public.event_listings (organizer_listing_id);

alter table public.tables add column if not exists event_listing_id uuid;
do $$ begin
  alter table public.tables add constraint tables_event_listing_fk
    foreign key (event_listing_id) references public.event_listings(id) on delete set null;
exception when duplicate_object then null; end $$;
create index if not exists idx_tables_event_listing on public.tables (event_listing_id);

-- Section B: Enterprise parent-child for multi-teacher brands
alter table public.venue_listings add column if not exists parent_org_id uuid;
do $$ begin
  alter table public.venue_listings add constraint venue_listings_parent_fk
    foreign key (parent_org_id) references public.venue_listings(id) on delete set null;
exception when duplicate_object then null; end $$;
create index if not exists idx_venue_listings_parent on public.venue_listings (parent_org_id);
```

Resolution of the two event-to-profile links: `teacher_id` points at `teacher_profiles` (Section C); `organizer_listing_id` points at `venue_listings` (Section D). Both can be set. During the Section C migration, the backfill sets `event_listings.teacher_id` from the migrated teacher and leaves `organizer_listing_id` for non-teacher organizers. The teacher profile page reads upcoming events on `teacher_id`; the organizer rollup (`organizer_stats`) reads on `organizer_listing_id`. No collision.

### H.6 Extending the existing tables (precise ALTERs)

All additive, all `if not exists`, none breaking. The tier-column type changes are in H.2; the `account_id` adds are in H.4; the cross-table FKs are in H.5. What remains here are the feature columns each section needs.

```sql
-- H.6a player_listings: only ownership (H.4) + optional status enum alignment.
-- alter table public.player_listings alter column status type listing_status using status::listing_status;

-- H.6b venue_listings (Section B membership + Section A listing_kind + verification)
alter table public.venue_listings
  add column if not exists display_email             text,   -- live in prod; declared for completeness
  add column if not exists instagram                 text,   -- live in prod
  add column if not exists logo_url                  text,   -- live in prod
  add column if not exists listing_kind              text,   -- 'teacher' | 'venue' (kills the regex)
  add column if not exists verified                  boolean not null default false,
  add column if not exists verified_at               timestamptz,
  add column if not exists is_official_mahj_spot      boolean not null default false,
  add column if not exists is_founding_partner       boolean not null default false,
  add column if not exists tier_renews_at            timestamptz,
  add column if not exists pro_expires_at            timestamptz,
  add column if not exists billing_interval          text,
  add column if not exists featured_until            timestamptz,
  add column if not exists photo_count               int not null default 0,
  add column if not exists link_count                int not null default 0,
  add column if not exists events_boosted_this_period int not null default 0,
  add column if not exists seat_count                int not null default 1,
  add column if not exists priority_support          boolean not null default false,
  add column if not exists org_id                    uuid;   -- Section G Enterprise grouping (brand-level alias of parent_org_id)
create index if not exists idx_venue_listings_kind on public.venue_listings (listing_kind);
create index if not exists idx_venue_listings_tier on public.venue_listings (tier);

-- Backfill listing_kind ONCE from the legacy regex, then /get-listed sets it directly.
update public.venue_listings
  set listing_kind = case
    when (venue_type || ' ' || coalesce(description,'')) ~* 'instructor|teacher|lesson|studio|school|class'
      then 'teacher' else 'venue' end
  where listing_kind is null;

-- H.6c event_listings (Section D recurrence/taxonomy + Section B boost + tier/lifecycle)
alter table public.event_listings
  add column if not exists subtype          text,        -- fundraiser | charity | festival | conference (display only)
  add column if not exists day_of_week      text[],      -- {Tuesday,Thursday}
  add column if not exists time_of_day      text,        -- Morning | Afternoon | Evening | clock string
  add column if not exists week_of_month    smallint,    -- 1-5, only for frequency='monthly'
  add column if not exists series_status    text not null default 'active', -- active | paused | ended
  add column if not exists boosted_until    timestamptz, -- Section B per-event boost expiry
  add column if not exists pro_expires_at   timestamptz; -- graceful downgrade to free
-- frequency, day_time, beginner_friendly, source_url, host, confirmed_active_at,
-- ended_reports already exist from prior migrations.
create index if not exists idx_event_listings_series on public.event_listings (series_status);
create index if not exists idx_event_listings_date on public.event_listings (event_date);

-- Normalize legacy event_type and frequency (Section D mapping) BEFORE adding CHECKs.
update public.event_listings set event_type = 'open_play'
  where event_type in ('openplay', 'recurring');
update public.event_listings set event_type = 'class'
  where event_type in ('lesson', 'instructor', 'workshop');
update public.event_listings set event_type = 'social'
  where event_type in ('conference', 'festival', 'fundraiser', 'special', 'event');
update public.event_listings set frequency = 'once'
  where frequency is null or frequency = '' or lower(frequency) in ('one-time','one time','single');
update public.event_listings set frequency = lower(frequency)
  where frequency is not null;

do $$ begin
  alter table public.event_listings add constraint event_type_allowed
    check (event_type in ('open_play','class','league','tournament','retreat','cruise','social'));
exception when duplicate_object then null; end $$;
do $$ begin
  alter table public.event_listings add constraint event_frequency_allowed
    check (frequency in ('once','weekly','biweekly','monthly','multi_day'));
exception when duplicate_object then null; end $$;

-- H.6d ad_listings (Section G sponsorship; tier already widened in H.2)
alter table public.ad_listings
  add column if not exists pro_expires_at timestamptz;
-- target_states[], start_date, end_date, placement already exist.

-- H.6e ambassadors (Section E program)
alter table public.ambassadors
  add column if not exists source           text default 'applied', -- applied | invited
  add column if not exists referral_code    text unique,
  add column if not exists points           integer not null default 0,
  add column if not exists level            text,                   -- bronze | silver | gold
  add column if not exists level_candidate  text,
  add column if not exists gate_passed      boolean not null default false,
  add column if not exists is_founding      boolean not null default false,
  add column if not exists first_listing_at timestamptz,
  add column if not exists approved_at      timestamptz,
  add column if not exists term_ends_at     timestamptz,
  add column if not exists last_scored_at   timestamptz,
  add column if not exists reviewer_notes   text,
  add column if not exists comp_listing_id  uuid,
  add column if not exists profile_id       uuid;
do $$ begin
  alter table public.ambassadors add constraint ambassadors_profile_fk
    foreign key (profile_id) references public.profiles(id) on delete set null;
exception when duplicate_object then null; end $$;
-- existing status default 'new' stays; app widens the set to
-- new | reviewing | approved | active | renewal_due | lapsed | declined.

-- H.6f listing_claims: add the account link so a claim can carry forward to an account
alter table public.listing_claims
  add column if not exists profile_id    uuid,
  add column if not exists referred_by   text,  -- ambassador referral_code that produced this claim
  add column if not exists approved_at   timestamptz;
do $$ begin
  alter table public.listing_claims add constraint listing_claims_profile_fk
    foreign key (profile_id) references public.profiles(id) on delete set null;
exception when duplicate_object then null; end $$;
-- widen status set in app logic: claimed | account_linked | revoked.

-- H.6g pending_edits: split the edit-risk lane (Section A step 3)
alter table public.pending_edits
  add column if not exists profile_id  uuid,
  add column if not exists risk        text not null default 'review', -- 'direct' (auto-applied) | 'review'
  add column if not exists decided_by  text;
do $$ begin
  alter table public.pending_edits add constraint pending_edits_profile_fk
    foreign key (profile_id) references public.profiles(id) on delete set null;
exception when duplicate_object then null; end $$;

-- H.6h promo_codes: formalize the founding-partner promo (FINDMYMAHJ) with real limits.
alter table public.promo_codes
  add column if not exists kind          text,          -- 'founding_partner' | 'discount'
  add column if not exists comp_tier     membership_tier,-- tier this code grants when comped
  add column if not exists comp_months   int,           -- length of the comp (e.g. 12)
  add column if not exists max_redemptions int,
  add column if not exists redeemed_count int not null default 0,
  add column if not exists expires_at    timestamptz;
update public.promo_codes
  set kind = 'founding_partner', comp_tier = 'pro', comp_months = 12
  where code = 'FINDMYMAHJ' and kind is null;
```

### H.7 Row Level Security policies, per table, per role

Posture: today `anon` has no `SELECT` on the four listing tables and there are no anon write policies anywhere except the one restrictive `player_listings` insert. The service role bypasses RLS and does every read and write. The policies below are the future state for when Supabase Auth is enabled and the app starts using the `authenticated` role for owner self-service. They are safe to create now and encode the Section A permission matrix.

Two helper functions keep the policies short.

```sql
-- H.7a Helpers. auth.uid() is the signed-in account id (null when anon/service).
create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.account_roles
    where profile_id = auth.uid() and role = 'admin'
  );
$$;

create or replace function public.owns_listing(p_table text, p_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.listing_owners
    where profile_id = auth.uid()
      and listing_table = p_table
      and listing_id = p_id
  );
$$;

create or replace function public.has_role(p_role account_role)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.account_roles
    where profile_id = auth.uid() and role = p_role
  );
$$;
```

Listing tables. Public reads only published rows (when anon read is re-granted post-auth); owners edit their own row; admins do anything. The service role still bypasses all of this for server-rendered pages and admin tools.

```sql
-- H.7b player_listings
drop policy if exists "players read published"   on public.player_listings;
drop policy if exists "players owner update"     on public.player_listings;
drop policy if exists "players admin all"        on public.player_listings;
create policy "players read published" on public.player_listings
  for select using (status = 'published');
create policy "players owner update" on public.player_listings
  for update to authenticated
  using (owns_listing('player_listings', id))
  with check (owns_listing('player_listings', id));
create policy "players admin all" on public.player_listings
  for all to authenticated
  using (is_admin()) with check (is_admin());
-- existing restrictive anon-insert-pending-only policy stays as is.

-- H.7c venue_listings (teachers/venues)
drop policy if exists "venues read published" on public.venue_listings;
drop policy if exists "venues owner update"   on public.venue_listings;
drop policy if exists "venues owner insert"   on public.venue_listings;
drop policy if exists "venues admin all"      on public.venue_listings;
create policy "venues read published" on public.venue_listings
  for select using (status = 'published');
create policy "venues owner insert" on public.venue_listings
  for insert to authenticated
  with check (has_role('teacher') or has_role('organizer'));
create policy "venues owner update" on public.venue_listings
  for update to authenticated
  using (owns_listing('venue_listings', id))
  with check (owns_listing('venue_listings', id));
create policy "venues admin all" on public.venue_listings
  for all to authenticated
  using (is_admin()) with check (is_admin());

-- H.7d event_listings
drop policy if exists "events read published" on public.event_listings;
drop policy if exists "events owner insert"   on public.event_listings;
drop policy if exists "events owner update"   on public.event_listings;
drop policy if exists "events admin all"      on public.event_listings;
create policy "events read published" on public.event_listings
  for select using (status = 'published');
create policy "events owner insert" on public.event_listings
  for insert to authenticated
  with check (has_role('organizer') or has_role('teacher'));
create policy "events owner update" on public.event_listings
  for update to authenticated
  using (owns_listing('event_listings', id))
  with check (owns_listing('event_listings', id));
create policy "events admin all" on public.event_listings
  for all to authenticated
  using (is_admin()) with check (is_admin());

-- H.7e ad_listings (brand/sponsorship: read published, admin manages, no self-serve)
drop policy if exists "ads read published" on public.ad_listings;
drop policy if exists "ads admin all"      on public.ad_listings;
create policy "ads read published" on public.ad_listings
  for select using (status = 'published');
create policy "ads admin all" on public.ad_listings
  for all to authenticated
  using (is_admin()) with check (is_admin());

-- H.7f teacher_profiles (Section C). Public reads published via a column-allowlisted
-- server query; owner edits own; admin all. contact_email never reaches anon.
drop policy if exists "teachers read published" on public.teacher_profiles;
drop policy if exists "teachers owner update"   on public.teacher_profiles;
drop policy if exists "teachers owner insert"   on public.teacher_profiles;
drop policy if exists "teachers admin all"      on public.teacher_profiles;
create policy "teachers read published" on public.teacher_profiles
  for select using (status = 'published');
create policy "teachers owner insert" on public.teacher_profiles
  for insert to authenticated with check (has_role('teacher'));
create policy "teachers owner update" on public.teacher_profiles
  for update to authenticated
  using (owns_listing('teacher_profiles', id))
  with check (owns_listing('teacher_profiles', id));
create policy "teachers admin all" on public.teacher_profiles
  for all to authenticated using (is_admin()) with check (is_admin());
```

Account, ownership, and program tables. Mostly self-or-admin, otherwise service-role only.

```sql
-- H.7g profiles
drop policy if exists "profiles self read"   on public.profiles;
drop policy if exists "profiles self update" on public.profiles;
drop policy if exists "profiles admin read"  on public.profiles;
create policy "profiles self read" on public.profiles
  for select to authenticated using (id = auth.uid());
create policy "profiles self update" on public.profiles
  for update to authenticated using (id = auth.uid()) with check (id = auth.uid());
create policy "profiles admin read" on public.profiles
  for select to authenticated using (is_admin());

-- H.7h account_roles
drop policy if exists "roles self read" on public.account_roles;
drop policy if exists "roles admin all" on public.account_roles;
create policy "roles self read" on public.account_roles
  for select to authenticated using (profile_id = auth.uid());
create policy "roles admin all" on public.account_roles
  for all to authenticated using (is_admin()) with check (is_admin());

-- H.7i listing_owners
drop policy if exists "owners self read" on public.listing_owners;
drop policy if exists "owners admin all" on public.listing_owners;
create policy "owners self read" on public.listing_owners
  for select to authenticated using (profile_id = auth.uid());
create policy "owners admin all" on public.listing_owners
  for all to authenticated using (is_admin()) with check (is_admin());

-- H.7j memberships
drop policy if exists "memberships owner read" on public.memberships;
drop policy if exists "memberships admin all"  on public.memberships;
create policy "memberships owner read" on public.memberships
  for select to authenticated using (owns_listing(listing_table, listing_id));
create policy "memberships admin all" on public.memberships
  for all to authenticated using (is_admin()) with check (is_admin());

-- H.7k Ambassador self-service
drop policy if exists "ambassador self read" on public.ambassadors;
drop policy if exists "ambassador admin all" on public.ambassadors;
create policy "ambassador self read" on public.ambassadors
  for select to authenticated using (profile_id = auth.uid());
create policy "ambassador admin all" on public.ambassadors
  for all to authenticated using (is_admin()) with check (is_admin());
drop policy if exists "ambassador reads own referrals" on public.listing_claims;
create policy "ambassador reads own referrals" on public.listing_claims
  for select to authenticated using (
    has_role('ambassador')
    and referred_by in (select referral_code from public.ambassadors where profile_id = auth.uid())
  );

-- H.7l Admin-only data (no self-service, no anon). RLS stays ON with an admin-all
-- policy and no anon policy, matching today's "service-role only" posture.
do $$
declare t text;
begin
  foreach t in array array[
    'listing_claims','pending_edits','certifications','badges','audit_log',
    'ambassador_contributions','crm_contacts','founder_tasks','promo_codes',
    'reviews','teacher_reviews','reputation_events','reputation_scores',
    'organizer_stats','listing_submissions','inquiries'
  ] loop
    execute format('drop policy if exists %I on public.%I', t || ' admin all', t);
    execute format(
      'create policy %I on public.%I for all to authenticated using (public.is_admin()) with check (public.is_admin())',
      t || ' admin all', t);
  end loop;
end $$;
```

Two reads that stay public because they show structured, no-contact data: published `teacher_reviews` / `reviews` and the `reputation_scores` leaderboard. Add narrow read policies only if these are ever exposed to the anon key directly (today they render server-side):

```sql
drop policy if exists "reviews read published" on public.teacher_reviews;
create policy "reviews read published" on public.teacher_reviews
  for select using (status = 'published');
drop policy if exists "scores read public" on public.reputation_scores;
create policy "scores read public" on public.reputation_scores
  for select using (flagged = false);
```

### H.8 Rankings storage and refresh at 5,000+ profiles

Section F's storage model is kept exactly: three physical tables (`teacher_reviews`/`reviews`, `reputation_events` append-only ledger, `reputation_scores` precomputed output), refreshed by a nightly Vercel cron (`app/api/cron/rankings/route.ts`) gated dark by `app_settings.rankings_enabled`.

- Why a plain table, not a materialized view. Supabase has no built-in scheduled `REFRESH MATERIALIZED VIEW`, the output needs writable columns the view cannot hold (`flagged`, `components`, `rank`, `verification_level`), and the nightly job needs to UPSERT idempotently.
- Why it scales. The UI never computes anything: every leaderboard read is a single indexed `select ... from reputation_scores where board = $1 and scope = $2 order by rank limit 25`, served by `idx_repscores_board_scope_rank`. The nightly job's cost is bounded by the 730-day cutoff and `idx_repevents_entity`; at 5,000 profiles the active ledger is tens of thousands of rows and the job runs under a minute. At 50,000 profiles you partition the ingest loop by state, no schema change.
- Idempotency and anti-gaming live in the database. The ledger's `unique (source, source_ref, entity_key)` means one event scores an entity once, ever. `reputation_scores` UPSERTs on `(board, scope, entity_key)`.

Operability addition: a refresh watermark and freshness stamp.

```sql
insert into public.app_settings (key, value) values
  ('rankings_enabled', 'false'),
  ('rankings_min_score', '5'),
  ('rankings_last_run_at', '1970-01-01T00:00:00Z')
  on conflict (key) do nothing;
```

If a true materialized view is ever preferred for a simple per-state "active teacher count" tile, add it as a separate read-only object and refresh it inside the same cron with `refresh materialized view concurrently`. It is a supplement, never the leaderboard backbone.

### H.9 Storage and grants summary

- Bucket `logos` (existing) holds `logo_url` / `headshot_url` / gallery images. Keep uploads server-side through the service role (signed upload URL minted by the owner's server route after an `owns_listing` check). Do not grant the anon key write access to the bucket.
- Keep the launch-gate `revoke select ... from anon` on the four listing tables until Supabase Auth is live and the public pages are switched to the anon/authenticated split. The RLS read policies in H.7 only take effect after that grant is restored, so re-grant `select` to `anon` in the same release that enables auth, never before.
- Every privileged server route (admin override, role grant, tier change, claim approval, ambassador approval) writes one `audit_log` row.

### H.10 Migration checklist (ordered, additive, non-breaking)

Run top to bottom. Each step is its own idempotent file in `supabase/migrations/`. Nothing in steps 1-7 requires Supabase Auth, so the whole account-ready schema can land before a single login exists. Steps 8-9 flip auth on. Each step is safe to rerun.

1. `2026-06-16-enums.sql`, create the five enums (H.2). No column changes yet. Safe, inert.
2. `2026-06-16-accounts.sql`, create `profiles`, `account_roles`, `listing_owners`, `memberships`, `certifications`, `badges`, `audit_log` (H.3). Add the `reconcile_account`, `is_admin`, `owns_listing`, `has_role` functions (H.4b, H.7a). Admin-row seeding deferred to step 8 (needs `auth.users`); for now the existing `admins` table remains the allowlist the code reads.
3. `2026-06-16-ownership.sql`, add nullable `account_id` to the four listing tables and the FKs to `profiles` (H.4a). Add `profile_id` to `ambassadors`, `listing_claims`, `pending_edits` (H.6e-g). Backfill nothing; ownership fills in lazily. Claim-by-token untouched.
4. `2026-06-16-tiers.sql`, run the tier-string `UPDATE` sweep, then cast the three `tier` columns to the enums (H.2). The only step that rewrites existing data in place; the pre-cast sweep makes it safe. Verify counts before and after.
5. `2026-06-16-extend-listings.sql`, the feature-column ALTERs (H.6b-d), the `listing_kind` backfill, the legacy `event_type`/`frequency` normalization, the CHECK constraints (after normalization), and the cross-table FKs (H.5).
6. `2026-06-16-teacher-profiles.sql`, create `teacher_profiles`, `teacher_reviews`, `organizer_stats` (Sections C/D), migrate teacher rows out of `venue_listings`, repoint `listing_claims`/`pending_edits`, set `event_listings.teacher_id`. Keep migrated venue rows at `status = 'migrated'` for one release.
7. `2026-06-16-reputation.sql` and `2026-06-16-ambassador-program.sql`, Section F tables plus the `app_settings` ranking keys (H.8), and Section E's `ambassador_contributions` table. Wire the nightly crons. Both ship dark.
8. `2026-06-16-enable-auth.sql`, enable Supabase Auth (magic link only). Add the `profiles.id -> auth.users(id)` FK. Backfill `account_roles` admin rows from the `admins` table for any admin who has signed in. Hook `reconcile_account` to first login. At this point `account_roles.role = 'admin'` becomes the live allowlist and the shared `ADMIN_PASSWORD` is retired.
9. `2026-06-16-rls-and-grants.sql`, create all the RLS policies (H.7), then, in the same release, re-grant `select` on the four listing tables to `anon` and switch the public pages to the anon/authenticated split. This is the only step that changes who can read what, so it ships last and is verified route-by-route with a post-deploy smoke check.

Roll-forward, not roll-back, is the default. If step 4 (tier cast) or step 6 (teacher migration) needs to be undone, the migrated venue rows kept at `status = 'migrated'` and the pre-cast `text` values (captured in a temp table before the cast) are the recovery path. Steps 1-3, 5, 7 are purely additive and need no rollback.

Net effect: the database becomes account-ready, role-aware, tier-clean, and RLS-enforced without a rebuild and without breaking a single live claim, listing, or form. Anonymous creation keeps working through every step, ownership converges lazily as people sign in, premium tiers and rankings ship dark until the founder flips them on, and admin moves from one shared password to a real, audited allowlist.

---

## I. Fit With What Is Already Built, and Cleanup

This section maps the design onto the current production tables and flows, then gives a concrete cleanup checklist. Each item is marked **[do now]** (low-risk copy/config that can ship today without schema or auth work) or **[needs Jason]** (schema, migration, or auth build).

### I.1 How the design lands on what exists

- **Anonymous + claim-by-token stays the spine.** Every new capability is additive on top of `listing_claims` (keyed on `(listing_table, listing_id)` with `claimer_email`) and `pending_edits`. Accounts (`profiles`/`account_roles`/`listing_owners`) layer on later via `reconcile_account` keyed on lowercased email. Nothing in the current flow has to be rewritten to ship the membership tiers, the teacher profile content, or the ambassador program.
- **Teachers live in `venue_listings` today** (matched by the `/instructor|teacher|lesson|studio|school|class/` regex). The design promotes them to `teacher_profiles` and replaces the regex with an explicit `listing_kind`. Until that migration runs, the regex stays as a fallback and the new `listing_kind` column is backfilled from it once.
- **`event_listings` is already the events home**, including the recurring-series and listing-host migrations. The design extends it (taxonomy, structured cadence, `teacher_id`/`organizer_listing_id`, `boosted_until`) rather than forking it. `tables`/`table_seats` and `cruise_posts` stay separate primitives, bridged by optional FKs.
- **The `ambassadors` table already exists** and the apply route is live. The program extends that table (points, level, term, referral_code) and adds `ambassador_contributions`. No parallel table.
- **`promo_codes` already holds `FINDMYMAHJ`.** The design formalizes it as a `founding_partner` comp granting Verified Community Leader for 12 months, reusing the existing row.
- **`ad_listings` stays the brand/sponsorship lane**, outside the membership ladder, with its own `ad_tier` (basic/featured/national).
- **Admin gating is a shared `ADMIN_PASSWORD` today**, not yet the email allowlist the spec describes. The design closes that gap by treating `account_roles.role='admin'` (seeded from the existing `admins` table) as the live allowlist once auth ships.
- **The matcher cron pattern** (`CRON_SECRET` bearer, service-role client, dark-launch via `app_settings`, daily cadence) is reused verbatim for the rankings cron, the organizer-stats rollup, and the ambassador-scoring cron.

### I.2 Cleanup checklist (current inconsistencies to fix)

**Loose tier strings**
- **[do now]** Decide and document the canonical tier vocabulary in one place (`lib/schema.ts` or a new `lib/tiers.ts`): membership `free/pro/ambassador/enterprise`, event `free/boosted/featured/spotlight/enterprise`, ad `basic/featured/national`. Update any UI strings that render `starter`/`local`/`basic`/`featured`/`free` to read from this single source.
- **[do now]** In all rendering and sort code, treat the legacy values as aliases: `starter`->`free`, `local`->`free`, `official`->`pro`+Official Mahj Spot. This makes the UI correct before the data is migrated.
- **[needs Jason]** Run the H.2 `UPDATE` sweep and the enum cast (migration step 4) to make the database itself clean.

**The venue -> teacher split (regex fragility)**
- **[do now]** Add the `listing_kind` read-path: where the UI currently runs the regex to decide "is this a teacher," prefer `listing_kind` when present and fall back to the regex only when null. This is a small code change with no schema dependency once the column exists.
- **[needs Jason]** Add the `listing_kind` column and backfill it from the regex once (H.6b). Then promote teachers to `teacher_profiles` and repoint `/teachers` (migration step 6). Retire the regex after the migration.

**FAQ / pricing copy**
- **[do now]** Update the FAQ and any pricing copy to the canonical tiers and prices: Verified Community Leader $12/mo ($99/yr), Official Mahj Spot $79/mo add-on, Enterprise from $199/mo, and the explicit promise "free for players always; basic listing free forever; you are never charged merely to be listed." Replace the historical $19/$12/$79 three-tier jumble with the single Verified Community Leader tier plus the Official Mahj Spot add-on. Strip the word "free" from listing CTAs that target organizers/teachers (per the pricing-model memory), while keeping "free" prominent for players.
- **[do now]** Add a short "How rankings work" and "What Ambassador status means" explainer page stub so the badges have somewhere to link.

**`list-my-game` vs `get-listed`**
- **[do now]** Confirm and document the split in copy: `/list-my-game` is the FREE player self-listing (never mentions payment); `/get-listed` is the business/organizer flow (Mahjong Instructor, Open Play, Tournament, Retreat, League, Brand). Ensure the `/get-listed` type picker writes the right `listing_kind` (`teacher` for Mahjong Instructor, `venue` otherwise) and the right `event_type` for event types.
- **[do now]** Make sure neither flow charges anything today (Stripe is not built); both should submit to the existing pending-review pipeline.

**Promo codes**
- **[do now]** Document `FINDMYMAHJ` as the founding-partner code in the pricing copy and the get-listed flow, framed as a future benefit (12 months Verified Community Leader free once Verified Community Leader launches), not a present charge.
- **[needs Jason]** Add the `kind`/`comp_tier`/`comp_months`/`max_redemptions`/`redeemed_count`/`expires_at` columns to `promo_codes` (H.6h) so redemption is enforceable when checkout ships.

**`ad_listings`**
- **[do now]** Confirm the `/advertise` flow and `ad_listings` stay outside the membership ladder; add an Enterprise option to the advertise inquiry form copy so large studios route to a quote rather than self-serve.
- **[needs Jason]** Widen `ad_listings.tier` to the `ad_tier` enum and add `pro_expires_at` (H.6d) when sponsorship inventory is formalized.

**The no-auth gap**
- **[do now]** Nothing breaks without auth; document that accounts are a later additive layer and that ownership today is claim-by-token only. Make sure new copy ("sign in to manage your listing") is not shown until auth ships.
- **[needs Jason]** The entire accounts layer (Supabase Auth magic link, `profiles`/`account_roles`/`listing_owners`, `reconcile_account`, moving admin off the shared password to `account_roles.role='admin'`) is the Jason build, sequenced as migration steps 2, 3, 8, 9.

**Admin password -> allowlist**
- **[do now]** Inventory every route that checks `ADMIN_PASSWORD` so the swap to the allowlist is a known, contained change later.
- **[needs Jason]** Move admin gating to the `admins` allowlist now (even before full auth) by checking the requester's verified email against the `admins` table, then to `account_roles.role='admin'` once auth ships.

### I.3 Stale artifacts to ignore

- **[do now]** Treat `/Users/shaunabruckman/Projects/findmymahjgame/schema.md` as stale/aspirational. It references Supabase Auth and `events`/`venues`/`connectors` tables that do not match production. Either delete it or replace it with this document as the schema source of truth so no one builds against the wrong shape.

---

## J. Build Order

A phased, additive implementation sequence. No step requires a rebuild; each is safe to ship on its own, and the phases align to the monetization roadmap (Section G). Phases 1-3 are pure growth and ship before any paywall. Premium and rankings ship dark and are flipped on by the founder.

### Phase 0, Copy and config cleanup (ship today, no schema)

All Section I **[do now]** items. Canonical tier vocabulary in one file; legacy tier strings aliased in the UI; FAQ/pricing copy rewritten to Verified Community Leader $12 / Official Mahj Spot $79 / Enterprise from $199, with the "free for players always" promise; `list-my-game` vs `get-listed` copy confirmed; `FINDMYMAHJ` documented as a future benefit; stale `schema.md` retired. Inventory `ADMIN_PASSWORD` usage. This makes the live site internally consistent before any database change.

### Phase 1, Account-ready schema, dark (additive, no behavior change)

Migration steps 1-3 and 5 from H.10 (enums, accounts/roles/ownership/memberships/certs/badges/audit tables, the `account_id` and `profile_id` adds, the listing feature-column ALTERs, `listing_kind` backfill, cross-table FKs, the helper and `reconcile_account` functions). Nothing in the UI changes; the schema is now account-ready and tier-ready. Claim-by-token keeps working untouched. This is the foundation for everything that follows and aligns with Phase 1 of the monetization roadmap (seed supply, nothing sold).

### Phase 2, Teachers become first-class (growth content)

Migration step 6: create `teacher_profiles`, `teacher_reviews`, `organizer_stats`; migrate teacher rows out of `venue_listings`; repoint `listing_claims`/`pending_edits`; rewrite `/teachers` and `/teachers/[id]`; set `event_listings.teacher_id`; delete the regex. Ship the claim-aware free profile editor and the events taxonomy/recurrence extensions (Section D). Ship reviews with the HMAC email-confirmation gate and the admin moderation queue alongside `pending_edits`. Every teacher now has a real, claimable, free, content-rich profile. Still no paywall.

### Phase 3, Rankings and ambassadors, dark (network effects)

Migration step 7: Section F tables plus the rankings cron (`app/api/cron/rankings/route.ts`, gated by `rankings_enabled='false'`), the organizer-stats rollup cron, and Section E's `ambassador_contributions` plus the ambassador-scoring cron. Wire the nightly `quality_score`/`organizer_stats`/reputation jobs. Build the ambassador admin review surface (prescreen, approve/active/decline) on the existing `/admin` pattern. Flip `rankings_enabled` to `true` when there is enough activity to make boards meaningful. This is the directory-density and prestige engine; it sells nothing but makes Verified Community Leader worth buying later.

### Phase 4, Accounts and admin allowlist (auth layer)

Migration steps 8-9: enable Supabase Auth (magic link only), add the `profiles.id -> auth.users(id)` FK, hook `reconcile_account` to first login, move admin from the shared `ADMIN_PASSWORD` to `account_roles.role='admin'` (seeded from `admins`), create the RLS policies, and in the same release re-grant `anon` SELECT and switch public pages to the anon/authenticated split. Verify route-by-route with a post-deploy smoke check. Now owners have a real dashboard and can self-serve edits (direct vs review lanes); admin is a real audited allowlist.

### Phase 5, Turn on Verified Community Leader (first revenue)

Build Stripe Checkout writing back to `stripe_payment_id` and `memberships`, the `pro_expires_at` graceful-downgrade logic, the per-tier field gating (Section C.6) and badge rendering (Section C.7), the Verified/Official Mahj Spot admin toggles, and the profile analytics dashboard (the "why this is worth $12" proof). Honor `FINDMYMAHJ` founding-partner comps via `memberships.status='comped'`. Flip Verified Community Leader on only when median inbound contacts per claimed listing clears a real threshold (monetization Phase 2 gate). Watch churn monthly.

### Phase 6, Enterprise, sponsorship, data (scale revenue)

Enable `tier='enterprise'` with the `org_id`/`parent_org_id` multi-listing grouping, bulk event upload, the organizer/brand dashboard, and the account-managed sales path via the extended `/advertise` inquiry flow. Widen `ad_listings` to the full `ad_tier` enum, publish the sponsorship rate card, and build the aggregate/opt-in data and lead products. This is monetization Phase 3, and it ships last, only once Find My Mahj Game is the default directory players use.

Throughout: every privileged write logs to `audit_log`; every paid feature buys visibility/credibility/promotion and never rank or the right to exist; players never pay; and no step ever requires tearing down what came before.