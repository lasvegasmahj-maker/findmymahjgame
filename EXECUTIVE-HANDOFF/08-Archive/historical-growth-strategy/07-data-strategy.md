I have enough ground truth. Confirmed: no city/geo table, no lat/long anywhere, no slugs on listings, no `display_email` column in the migration (schema.ts references it but it isn't in the table), `availability` is free text, no recurring-event model, state filtering is by abbreviation only. Here is the deliverable.

---

# Workstream 7: Data Strategy for FindMyMahj

Grounded in the real schema (`supabase/migration.sql`), the JSON-LD builders (`lib/schema.ts`), the flat seed data (`lib/states-data.ts`), and the state page query (`app/states/[state]/page.tsx`).

## Key gaps found in the current code (the "why" behind everything below)

1. **No geo data anywhere.** Zero lat/long columns. The how-it-works FAQ and `lib/schema.ts` already promise "enter your zip code and select 5, 10, 25, or 50 miles," but there is no data to power radius search. That feature is currently fiction.
2. **Cities are a flat string array** in `states-data.ts`, duplicated as free text in every listing's `city` column. No canonical city entity, no city pages, no per-city SEO surface. 50 state pages is the entire programmatic footprint. Cities are the biggest untapped SEO volume.
3. **`display_email` is referenced in `lib/schema.ts` and `client.tsx` but does not exist** in `venue_listings` (the column is `contact_email`). This is a latent bug: the venue ItemList JSON-LD emits `email: undefined` always.
4. **`availability` is free text** ("Weekday Mornings"). Not filterable, not machine-readable, cannot drive matching or `Event` schema.
5. **No recurring-event model.** `event_listings.event_date` is a single timestamp. Weekly open play, the single most common real-world mahjong activity, cannot be represented and cannot emit valid recurring `Event` schema.
6. **No teachers/leagues/groups as first-class entities.** They are crammed into `venue_listings` (instructors) or absent (leagues, groups). This blocks `Person`/`Organization` schema and dedicated SEO pages.
7. **No slugs on listings.** No listing has its own URL, so nothing below the state level is indexable. A venue or teacher cannot rank for "[name] mahjong [city]."

---

## (1) Data the product should collect for growth

Organized by entity, with the fields that enable **search**, **matching**, and **SEO**. Bold = not currently collected and high-leverage.

### Cities (new canonical entity — the SEO engine)
`id, name, **slug**, state_abbr (FK), county, **lat, lng**, population_band, **zip_codes text[]**, timezone, is_metro bool, parent_metro_id (self-FK, e.g. Summerlin -> Las Vegas), aliases text[] ("NYC"->"New York City"), **listing_count (denormalized)**, blurb.`
Powers: /states/[state]/[city] pages (programmatic SEO), near-me radius, canonical city joins, "X listings in [city]" social proof.

### Players (`player_listings` today)
Keep: name, city, state, skill_level, bio, game_types, contact_email, avatar_color, status.
Add: **city_id (FK), lat/lng (city centroid is enough), preferred_days text[], preferred_times text[] (morning/afternoon/evening), wants (find_group | sub | learn | host | tournament_partner), has_table bool, in_person | virtual, looking_for_skill text[], last_active_at, slug.**
Powers matching (day/time/skill/intent overlap) and near-me. `preferred_days`/`preferred_times` replace the unstructured `availability` string.

### Venues / Where-to-play (`venue_listings` today)
Keep: business_name, venue_type, city, state, address, description, website, phone, tier, status.
Add: **city_id (FK), lat/lng (geocoded from address), slug, hours (jsonb opening hours), price_range, amenities text[] (tables_provided, lessons, food, parking, wheelchair_accessible), allows_drop_in bool, photos text[], booking_url, display_email (rename/clarify vs contact_email — fixes the schema.ts bug).**
Powers `LocalBusiness` schema with real `openingHoursSpecification`, geo, and amenities.

### Teachers / Instructors (promote out of venue_listings -> new table)
`id, name, slug, city_id, lat/lng, bio, credentials (e.g. "OMM certified"), teaches text[] (american/chinese/intro), formats text[] (private/group/virtual/in_person), price_range, website, booking_url, photo, accepts_beginners bool, status.`
Powers `Person` + `Service` schema and per-teacher pages. This is Shauna's own category — high authority potential.

### Leagues & Groups (new table; "groups" is how this audience actually organizes — Facebook Groups, Meetups)
`id, name, slug, group_type (league | club | meetup | facebook_group | senior_center | jcc), city_id, lat/lng, meets_where, **recurring_schedule (see below)**, member_count_band, skill_focus, cost, external_url (FB/Meetup), open_to_new_members bool, contact_email, status.`
This is the single highest-volume real-world entity for this audience and is currently uncollected.

### Events / Tournaments / Open Play (`event_listings` today)
Keep: event_name, event_type, city, state, venue, address, description, price, registration_url, status.
Add: **city_id, lat/lng, slug, is_recurring bool, recurrence jsonb (rrule-style: freq, by_day, by_time, start_time, end_time), series_id (groups recurrences), skill_level, organizer_id (FK to teacher/group), capacity, virtual_url.**
Powers valid recurring `Event` schema and a real events calendar.

### Cross-cutting taxonomy (use enums/lookup tables, not free text)
- **game_type:** american (NMJL) | chinese | hong_kong | riichi | wright_patterson
- **skill_level:** beginner | advanced_beginner | intermediate | advanced
- **day/time:** structured arrays (above)
- **intent/wants:** structured (above)

This taxonomy is what turns the directory from a list into a **matching and faceted-search engine**, and every facet becomes an indexable URL parameter.

---

## (2) Structured data Google should see — exact schema.org types per page

| Page | Types to emit | Status |
|---|---|---|
| Homepage `/` | `Organization` + `WebSite` + `SearchAction` | Present, good |
| State `/states/[state]` | `CollectionPage` + `ItemList` (venues) + `Event[]` + `BreadcrumbList` | Present; fixes below |
| **City `/states/[state]/[city]` (new)** | `CollectionPage` + `ItemList` of `LocalBusiness`/`Person`/`Event` + `BreadcrumbList` + `FAQPage` ("Where can I play mahjong in [city]?") | **Missing — build** |
| **Venue `/venues/[slug]` (new)** | `LocalBusiness` (full: geo, `openingHoursSpecification`, `priceRange`, `amenityFeature`, photos) + `BreadcrumbList` + `aggregateRating` later | **Missing — build** |
| **Teacher `/teachers/[slug]` (new)** | `Person` + `Service` (`serviceType: "Mahjong Lessons"`, `areaServed`, `offers`) + `BreadcrumbList` | **Missing — build** |
| **Group/League `/groups/[slug]` (new)** | `Organization` (or `SportsClub`) + recurring `Event` + `BreadcrumbList` | **Missing — build** |
| **Event/Tournament `/events/[slug]` (new)** | `Event` (with `eventSchedule`/`Schedule` for recurrence) + `BreadcrumbList` + `Offer` | **Missing — build** |
| `/states` index | `CollectionPage` + `ItemList` of all states + `BreadcrumbList` | **Missing — add** |
| `/how-it-works` | `FAQPage` + `HowTo[]` | Present, good |
| `/faq` | `FAQPage` | **Verify present** |
| `/about` | `AboutPage` + `Organization` + `Person` | Present, good |

### What to add beyond the current `lib/schema.ts`

1. **Fix the `display_email` bug.** `venue_listings` has no `display_email` column, so `buildStatePageSchema` always emits `email: undefined`. Either add the column (recommended) or map from `contact_email` only when the advertiser opted in to public display.
2. **Geo-enrich the existing `LocalBusiness` and `Event` nodes.** Once lat/lng exists, add to venues:
   ```
   geo: { "@type": "GeoCoordinates", latitude, longitude },
   openingHoursSpecification: [...],   // from venues.hours jsonb
   priceRange, telephone, hasMap
   ```
   This is what makes Google show the map pack / rich result. The current `amenityFeature: { name: "Mahjong", value: true }` is thin; replace with real amenities array.
3. **Recurring events.** Add a `buildRecurringEventSchema()` that emits `eventSchedule` using `Schedule` (`repeatFrequency: "P1W"`, `byDay: ["Tuesday"]`, `startTime`, `endTime`). The current builder `continue`s and drops any event without a single `event_date`, so all weekly open play is silently invisible to Google today.
4. **New builders:** `buildCityPageSchema()`, `buildVenuePageSchema()`, `buildTeacherPageSchema()`, `buildGroupPageSchema()`, `buildStatesIndexSchema()`. Reuse `ORGANIZATION_NODE` and the existing breadcrumb pattern.
5. **Per-city `FAQPage`** ("How many mahjong players are near [city]?", "Is there NMJL open play in [city]?") — only with answers backed by real counts, per the data-honesty rule.

---

## (3) Concrete database changes — prioritized, with SQL for the top items

### P0 — Cities/geo table (unblocks near-me + city pages + clean joins)

```sql
CREATE TABLE IF NOT EXISTS cities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL,
  state_abbr text NOT NULL,
  county text,
  lat double precision,
  lng double precision,
  zip_codes text[] DEFAULT '{}',
  timezone text,
  is_metro boolean DEFAULT false,
  parent_metro_id uuid REFERENCES cities(id),
  aliases text[] DEFAULT '{}',
  listing_count integer DEFAULT 0,
  blurb text,
  created_at timestamptz DEFAULT now(),
  UNIQUE (state_abbr, slug)
);
CREATE INDEX idx_cities_state ON cities (state_abbr);
CREATE INDEX idx_cities_geo ON cities (lat, lng);
ALTER TABLE cities ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view cities" ON cities FOR SELECT USING (true);
```
Seed it once from `states-data.ts` (50 states x cities), then geocode. `states-data.ts` becomes a thin slug/region helper, not the source of truth.

### P0 — Geo + city_id + slug on the four listing tables

```sql
ALTER TABLE player_listings ADD COLUMN IF NOT EXISTS city_id uuid REFERENCES cities(id);
ALTER TABLE player_listings ADD COLUMN IF NOT EXISTS lat double precision;
ALTER TABLE player_listings ADD COLUMN IF NOT EXISTS lng double precision;

ALTER TABLE venue_listings  ADD COLUMN IF NOT EXISTS city_id uuid REFERENCES cities(id);
ALTER TABLE venue_listings  ADD COLUMN IF NOT EXISTS lat double precision;
ALTER TABLE venue_listings  ADD COLUMN IF NOT EXISTS lng double precision;
ALTER TABLE venue_listings  ADD COLUMN IF NOT EXISTS slug text;
ALTER TABLE venue_listings  ADD COLUMN IF NOT EXISTS display_email text;  -- fixes schema.ts bug
ALTER TABLE venue_listings  ADD COLUMN IF NOT EXISTS hours jsonb;
ALTER TABLE venue_listings  ADD COLUMN IF NOT EXISTS amenities text[] DEFAULT '{}';

ALTER TABLE event_listings  ADD COLUMN IF NOT EXISTS city_id uuid REFERENCES cities(id);
ALTER TABLE event_listings  ADD COLUMN IF NOT EXISTS lat double precision;
ALTER TABLE event_listings  ADD COLUMN IF NOT EXISTS lng double precision;
ALTER TABLE event_listings  ADD COLUMN IF NOT EXISTS slug text;

CREATE UNIQUE INDEX IF NOT EXISTS idx_venue_slug ON venue_listings (slug);
CREATE UNIQUE INDEX IF NOT EXISTS idx_event_slug ON event_listings (slug);
```
Cheap radius search without PostGIS: bounding-box prefilter on `lat/lng` indexes, then haversine sort in app code. Upgrade to PostGIS `geography` + `ST_DWithin` only if volume demands it.

### P1 — Structured player availability + intent (kills the free-text `availability`)

```sql
ALTER TABLE player_listings ADD COLUMN IF NOT EXISTS preferred_days text[] DEFAULT '{}';   -- mon..sun
ALTER TABLE player_listings ADD COLUMN IF NOT EXISTS preferred_times text[] DEFAULT '{}';  -- morning/afternoon/evening
ALTER TABLE player_listings ADD COLUMN IF NOT EXISTS wants text DEFAULT 'find_group';      -- find_group|sub|learn|host
ALTER TABLE player_listings ADD COLUMN IF NOT EXISTS slug text;
ALTER TABLE player_listings ADD COLUMN IF NOT EXISTS last_active_at timestamptz DEFAULT now();
CREATE INDEX idx_player_days ON player_listings USING GIN (preferred_days);
```
Keep `availability` text for one migration cycle to backfill, then drop it.

### P1 — Recurring events (the most common real activity)

```sql
ALTER TABLE event_listings ADD COLUMN IF NOT EXISTS is_recurring boolean DEFAULT false;
ALTER TABLE event_listings ADD COLUMN IF NOT EXISTS recurrence jsonb;
-- e.g. {"freq":"weekly","by_day":["tuesday"],"start_time":"10:00","end_time":"13:00"}
ALTER TABLE event_listings ADD COLUMN IF NOT EXISTS series_id uuid;
ALTER TABLE event_listings ADD COLUMN IF NOT EXISTS skill_level text;
```

### P2 — Promote teachers and add groups/leagues

```sql
CREATE TABLE IF NOT EXISTS teacher_listings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL, slug text UNIQUE,
  city_id uuid REFERENCES cities(id), lat double precision, lng double precision,
  bio text, credentials text, teaches text[] DEFAULT '{american}',
  formats text[] DEFAULT '{}', price_range text, website text, booking_url text,
  photo_url text, accepts_beginners boolean DEFAULT true,
  contact_email text NOT NULL, status text NOT NULL DEFAULT 'published',
  created_at timestamptz DEFAULT now()
);
CREATE TABLE IF NOT EXISTS group_listings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL, slug text UNIQUE,
  group_type text NOT NULL DEFAULT 'club',  -- league|club|meetup|facebook_group|jcc
  city_id uuid REFERENCES cities(id), lat double precision, lng double precision,
  meets_where text, recurrence jsonb, skill_focus text, cost text,
  external_url text, open_to_new_members boolean DEFAULT true,
  contact_email text, status text NOT NULL DEFAULT 'published',
  created_at timestamptz DEFAULT now()
);
ALTER TABLE teacher_listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_listings   ENABLE ROW LEVEL SECURITY;
CREATE POLICY "view published teachers" ON teacher_listings FOR SELECT USING (status='published');
CREATE POLICY "view published groups"   ON group_listings   FOR SELECT USING (status='published');
CREATE POLICY "anyone submit group"     ON group_listings   FOR INSERT WITH CHECK (true);
```
Groups should be free-to-submit like players (RLS insert open) — they are user-generated growth fuel, not paid inventory.

### P3 — Denormalized counts + slug backfill triggers
Trigger to keep `cities.listing_count` current on insert/publish; generate slugs from name + city on insert. Counts feed real "12 players in Scottsdale" social proof (honest, DB-sourced) and city-page sort order.

**Apply order:** P0 cities + geo/slug columns -> backfill geocode -> build city pages -> P1 structured availability + recurrence -> P2 teachers/groups -> P3 counts.

---

## (4) The data flywheel

```
More structured listings (players, groups, venues, teachers, events)
        │
        ▼
Each city crosses a content threshold (>= 1 real listing)
        │
        ▼
Programmatic /states/[state]/[city] pages go live with real ItemList +
LocalBusiness/Person/Event/FAQ schema (geo, recurring schedule, skill level)
        │
        ▼
Google indexes thousands of long-tail "mahjong in [city]" + "mahjong near me"
queries that 50 state pages could never rank for; rich results win clicks
        │
        ▼
More qualified visitors land on their exact city
        │
        ├─► Players: better day/time/skill MATCHING (structured fields) =>
        │   successful connections => they list, they invite friends, return each
        │   NMJL card season => MORE listings, fresh last_active_at signals
        │
        └─► Groups/venues/teachers: claim/submit free listings to capture the
            traffic already arriving => MORE listings, MORE city coverage
        │
        ▼
listing_count rises => more cities cross threshold => more indexable pages
=> loop tightens every cycle
```

**Why it compounds for this specific audience:** NMJL players already cluster in Facebook Groups and Meetups and re-engage hard every spring at card release. Capturing those groups as structured `group_listings` (free, open insert) seeds whole cities at once, which mints city pages, which rank, which pull in the players those groups want — and the seasonal cycle re-fires the whole loop annually. Geo + structured day/time/skill are the two inputs that turn passive directory traffic into matches, and matches are what make people list and refer, which is the only durable source of the three KPIs (users, listings, city coverage).

### The two fastest moves to start the flywheel
1. **Cities table + city pages + geocoding (P0).** Converts a 50-page site into a several-thousand-page programmatic SEO surface and finally makes the already-advertised "near me / zip radius" feature real instead of fictional.
2. **Free group/league submission (P2 RLS-open).** Lowest-friction, highest-volume real listings for this audience; seeds city coverage immediately and is the cheapest input to the loop.

**Files that change:** `supabase/migration.sql` (new tables/columns above), `lib/states-data.ts` (demote to slug/region helper after cities table seeds), `lib/schema.ts` (fix `display_email`, add geo/openingHours/recurrence + new builders), `app/states/[state]/page.tsx` and new `app/states/[state]/[city]/page.tsx` + `app/venues|teachers|groups|events/[slug]/page.tsx`, and `app/sitemap.ts` (emit city + listing URLs from the DB, not just the 50 static slugs).
