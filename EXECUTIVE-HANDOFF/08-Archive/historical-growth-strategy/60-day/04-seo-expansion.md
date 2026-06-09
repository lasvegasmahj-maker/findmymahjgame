I have everything I need. Note `status` value for player listings is actually `pending_review` for the pending state, but the published value is `published` (per the state page query). The robots/noindex pattern is per-route metadata (`robots: { index: false, follow: false }`), which is exactly the mechanism the Tier gate will use. There is no city-page route yet, no teacher route, no event detail route, no indexability tier helper. The sitemap is static + 50 states only.

This is the complete picture. Here is the full SEO expansion plan.

---

# Find My Mahj Game — 60-Day SEO Expansion Plan

## Ground truth this plan is built on (verified in repo)

- **Routes that exist:** `/` , `/states` (index), `/states/[state]` (50 pages, statically generated, `revalidate=3600`), plus static pages (how-it-works, get-listed, list-my-game, advertise, faq, about, contact). No city, teacher, or event-detail routes exist yet.
- **Real Supabase tables the site reads:** `player_listings` (name, city, state[abbr], skill_level, availability, bio, avatar_color, status), `venue_listings` (business_name, venue_type, city, state, description, website, instagram, display_email, logo_url, tier, status), `event_listings` (event_name, event_type, city, state, venue, description, event_date, price, registration_url, tier, status), `ad_listings`, plus `listing_submissions`, `inquiries`, `logos`. State pages filter `.eq("state", abbr).eq("status","published")`.
- **Indexability mechanism that already works:** per-route Next.js `export const metadata = { robots: { index: false, follow: false } }` (used on /privacy, /not-found, /admin, etc.). The Tier gate uses this exact mechanism via `generateMetadata`.
- **Schema builders live in `lib/schema.ts`** and are injected via `<script {...schemaScriptProps(...)} />` in server components.
- **Sitemap (`app/sitemap.ts`)** is hand-built: static array + 50 states. It must become data-driven.
- **Hard constraint from CLAUDE.md:** seed data (`lib/states-data.ts`) is NOT real listings. City/state pages may use the city LIST for navigation/structure, but may never imply a count or a real player drawn from seed data. Real counts come only from the DB.

A note on the missing docs: the `growth/02-seo-domination.md` referenced in the brief does not exist on this `pricing-group-size` branch. This plan stands alone and is self-contained; where it says "build on prior strategy," it operationalizes the concluded strategy described in the brief (Tier gate, MVL = 5 listings/city, LibCal supply, city + viral flywheels).

---

## The thin-content guardrail (the single most important rule)

Programmatic pages are where SEO sprints die. Google's Helpful Content system and manual "doorway pages" actions both target mass-produced location pages with no unique value. We avoid this with one hard rule, enforced in code, not in spirit:

**A page is `isIndexable` only if it clears a content floor that is unique to that page and partly DB-backed. Until it clears, it renders fully for users but emits `robots: { index: false, follow: true }` and is excluded from the sitemap.**

`follow: true` (not `false`) so link equity still flows to the state/city hubs even from a non-indexed page.

Put this helper in `lib/indexable.ts` and call it from every programmatic page's `generateMetadata` AND from `sitemap.ts` (single source of truth, so the sitemap and the meta tag can never disagree):

```ts
// lib/indexable.ts
export interface IndexInputs {
  realListings: number;   // published players + venues + events for this geo
  uniqueWords: number;    // server-rendered words of page-specific copy
  hasLocalProof: boolean; // >=1 venue OR event OR library with a name+link
}

export function isIndexable({ realListings, uniqueWords, hasLocalProof }: IndexInputs): boolean {
  return realListings >= 3 && uniqueWords >= 250 && hasLocalProof;
}

export function robotsFor(indexable: boolean) {
  return indexable
    ? { index: true, follow: true }
    : { index: false, follow: true };
}
```

Three thresholds, all defensible:
- **`realListings >= 3`** is the indexability floor (below MVL=5, but 5 is the *liquidity* target; 3 is enough unique entities to not be empty). Counts come only from the DB, never seed data.
- **`uniqueWords >= 250`** of genuinely page-specific text (local landmarks, the named venues/libraries, the actual event list), not boilerplate. Boilerplate that repeats across pages does not count toward the floor and should be minimized.
- **`hasLocalProof`** means at least one real, named, linkable local entity (a venue, an event, or a LibCal library page). This is what makes the page not-a-doorway.

This is the guardrail. Everything below references it.

---

## (1) State pages — already exist, how to strengthen

**URL:** `/states/[state]` (unchanged, 50 pages)
**Schema.org type:** `CollectionPage` + `ItemList` (venues) + `Event` nodes + `BreadcrumbList` (already in `buildStatePageSchema`). **Add:** an `ItemList` of child **city** pages, so the state becomes a true hub node.

**Why strengthen:** these are the strongest pages we own (priority 0.9, daily changefreq) and they are the parents of the new city pages. They currently lean on `STATE_META` for only 5 states; the other 45 use a generic template, and the body relies heavily on DB content that may be empty.

**Required on-page content (to clear thin-content + serve as a real hub):**
1. A unique **intro paragraph per state** (replace the identical `desc` in seed data). 60-90 words referencing real geography: major metros, the LibCal/JCC institutions known to host (libraries, JCCs, senior centers), and the seasonal NMJL card. Write 50 of these by hand or with a tight template that varies by region. Example for Florida:
   > "Mahjong runs deep in Florida, from the canasta-and-mahj clubhouses of Boca Raton and Naples to library open-play afternoons in Tampa and Sarasota. American Mahjong dominates here, played to the current NMJL card, with a long winter season as snowbird players arrive. Below you'll find published players, venues, and events across the state, plus a city-by-city breakdown so you can find a game within driving distance."
2. **City directory block** (this is the new internal-linking spine): a grid linking to every `/states/florida/[city]` page that is published. Cities not yet liquid link out but are visually flagged "coming soon" and are themselves non-indexed.
3. The existing Players / Events / Where-to-Play tabs (DB-backed).
4. A **"Mahjong at libraries in [State]"** callout linking to the new library page (section 5).
5. An FAQ block (3-4 Q/A) rendered server-side, wired to `FAQPage` schema: "Where can I play mahjong in [State]?", "Is it American or Chinese mahjong?", "Are there free open-play games?", "How do I find a 4th in [State]?"

**Internal links IN:** homepage map, `/states` index, every child city page (breadcrumb up), sister-site lasvegasmahj.com cross-link for NV.
**Internal links OUT:** every published child city page, the state library page, `/list-my-game` (Start a Table CTA), adjacent states via the existing `nearby` array (real internal-linking value — wire `nearby` into rendered footer links).

**Indexability rule:** state pages are **always indexable** (they are the hubs and must always be crawlable for the children). They are exempt from the `isIndexable` floor. The floor applies to children only.

---

## (2) City pages — the big opportunity, with the Tier gate

**URL:** `/states/[state]/[city]` — e.g. `/states/florida/boca-raton`. Nest under state (not a flat `/cities/[city]`) so breadcrumbs, link equity, and disambiguation (Springfield exists in ~30 states) all work for free.

**Scale:** the seed `cities` arrays contain ~270 cities across 50 states. That is the addressable programmatic surface. They ship in tiers, not all at once.

**Schema.org type:** `CollectionPage` + `BreadcrumbList` (Home → Browse States → [State] → [City]) + `ItemList` of venues + `Event` nodes + `FAQPage`. Add a new builder `buildCityPageSchema(...)` in `lib/schema.ts`, modeled on `buildStatePageSchema` but with a 4-level breadcrumb and an `about: { "@type": "Place", name: "[City], [State]" }`.

**Required on-page content (must clear the floor):**
1. Unique 80-120 word intro naming **real local anchors**: specific libraries (from LibCal data), JCCs, senior/community centers, the metro's mahjong character. This is page-specific and counts toward `uniqueWords`.
2. **Players in [City]** (DB, `player_listings` filtered to city) — but the page does not depend on these; PII is protected, so cards show first name + skill + availability only.
3. **Where to play in [City]** — venues + the **LibCal library open-play** entries (this is the supply that makes most city pages clear `hasLocalProof` before any paid venue exists).
4. **Upcoming events in [City]** (DB `event_listings`).
5. **Start a Table / Find a 4th** CTA block — the viral wedge, deep-linked to `/list-my-game?city=boca-raton&state=FL`.
6. FAQ (3 Q/A, city-specific) → `FAQPage` schema.

**The Tier gate (city pages, this is where it lives):**

```ts
// in app/states/[state]/[city]/page.tsx generateMetadata
const realListings = players.length + venues.length + events.length + libraries.length;
const indexable = isIndexable({
  realListings,
  uniqueWords: cityIntroWordCount,        // computed from the rendered intro+anchors
  hasLocalProof: venues.length + events.length + libraries.length >= 1,
});
return {
  title: `Mahjong in ${cityName}, ${stateAbbr} — Players, Open Play & Where to Play`,
  description: `Find mahjong players, open play, and places to play in ${cityName}, ${stateName}. ${realListings} local listings. Free to join a table.`,
  alternates: { canonical: `https://findmymahjgame.com/states/${state}/${city}` },
  robots: robotsFor(indexable),
};
```

- **Below the floor:** page renders fully (good UX, lets users land and "Start a Table"), emits `index:false, follow:true`, and is **excluded from sitemap**. As real listings + library entries accumulate to ≥3 with proof, the *next ISR revalidation flips it to indexable automatically* and the data-driven sitemap picks it up. No redeploy needed.
- **At/above the floor:** fully indexable, in sitemap, priority 0.7.

**`generateStaticParams`:** return only the curated launch cohort per week (see build order), not all 270 at once. Cities outside the cohort render on-demand (ISR) and stay non-indexed until they clear the floor.

**Internal links IN:** parent state page city-grid, breadcrumb, library page, nearby cities (same state).
**Internal links OUT:** parent state, `/list-my-game` (deep-linked), each venue's website (external, `rel="nofollow"` for paid/unvetted), the state library page.

---

## (3) Teacher pages

**URL:** `/teachers/[slug]` (flat namespace; teachers serve regionally/virtually, not one city) with a parent index at `/teachers`.

**Why:** Shauna is a certified Oh My Mahjong instructor; the Oh My Mahjong partnership is a content + credibility moat. "mahjong lessons near me", "learn American mahjong", "[city] mahjong teacher" are high-intent queries with weak existing SERPs. Teacher pages also feed the E-E-A-T signal Google rewards for hobby/skills content.

**Schema.org type:** `ProfilePage` wrapping a `Person` node, with `knowsAbout: ["American Mahjong","NMJL"]`, `hasCredential` (OMM certification as `EducationalOccupationalCredential`), `worksFor`/`affiliation` to the Organization, and an `areaServed`. Add `buildTeacherPageSchema(...)`. Reuse the existing `#shauna-bruckman` Person `@id` for her own page so the entity is unified across the site.

**Required on-page content:**
1. 150+ word bio (real, sourced — no invented credentials per CLAUDE.md).
2. Credential line (certification, with the issuing body linked and verified-200 per the no-dead-links rule).
3. What they teach (American/NMJL, beginner→advanced), format (in-person city + virtual), languages.
4. Service area (cities/states) with **links to the matching city pages** — this is the internal-linking payoff: teacher pages strengthen city pages and vice-versa.
5. A real booking/contact path (form or external link, verified 200).
6. Verified testimonials only (no invented testimonials).

**Indexability rule:** indexable only if the bio is ≥150 unique words AND a real verified contact/booking link exists AND it's a real person (not a stub). Use `isIndexable` with `realListings:1` treated as "the teacher entity itself" plus the bio word floor. Stub/placeholder teacher pages: `index:false, follow:true`, excluded from sitemap. Launch with the real ones first (Shauna, then vetted OMM instructors who opt in).

**Internal links IN:** city pages (where they serve), state pages, `/teachers` index, about page (Shauna).
**Internal links OUT:** the city pages they serve, `/list-my-game`, booking link (external).

---

## (4) Tournament / event pages

**URL:** `/events/[slug]` (individual event detail) with the events still also surfaced on state/city pages. Slug = `mahjong-tournament-boca-raton-2026-03` style (type + city + month).

**Why:** events are time-sensitive, high-intent ("mahjong tournament near me", "[city] mahjong tournament 2026"), and `Event` schema is eligible for Google's rich event results / the events experience in Search. Right now events only live as nested nodes on state pages with no canonical detail URL to rank or link to.

**Schema.org type:** standalone `Event` (we already build the node in `lib/schema.ts`; promote it to a page with its own canonical). Required `Event` fields for rich-result eligibility: `name`, `startDate` (and `endDate` if multi-day), `eventStatus`, `eventAttendanceMode`, `location` (`Place` with `PostalAddress`), `organizer`, `offers` (with `price`/`priceCurrency` or `price:0` for free), `image` if available, `url`. Add `BreadcrumbList` (Home → [State] → [City] → Event).

**Required on-page content:**
1. What/when/where/price/registration (DB-backed, real).
2. 100+ word description (host-supplied or written from real details).
3. Venue block linking to the venue and the city page.
4. "Other mahjong in [City]" cross-links (city + nearby events).
5. Registration CTA (external link, verified 200 before publish per no-dead-links rule).

**Indexability rule:**
- Indexable only if `startDate` is present AND in the future AND description ≥100 words AND a valid (200) registration/location link exists.
- **Past events: auto-flip to `index:false, follow:true`** after `endDate`/`startDate` passes, and drop from sitemap (prevents a graveyard of stale event pages, which is a classic thin-content + bad-UX penalty). Keep the URL alive (301 to the city page is cleaner long-term, but for the sprint, non-index + a "this event has passed, see upcoming in [City]" block is fine and lower-ops).

**Internal links IN:** state page event tab, city page events, `/events` index (optional), homepage "upcoming" if added.
**Internal links OUT:** venue, city page, registration link (external).

---

## (5) Library pages — the novel angle, capturing LibCal supply

**URL:** `/states/[state]/libraries` (state-level roll-up) and, where volume justifies, `/states/[state]/[city]/libraries` or a `#libraries` section on the city page. Start with the **state-level roll-up** page; it's the highest-leverage, lowest-count surface and clears the floor fastest.

**Why this is the wedge:** libraries (and JCCs/senior centers) run free, public, recurring mahjong open-play, published on LibCal calendars. This is legally-clean, account-less supply that we can cite and link. Nobody has aggregated "where to play mahjong at libraries in [State]" — it's a genuine zero-competition query cluster ("free mahjong near me", "[city] library mahjong", "mahjong open play [state]") and it's the cleanest way to get `hasLocalProof` on city/state pages before any paid venue exists.

**Schema.org type:** `CollectionPage` + `ItemList` of `Library` nodes (`@type: "Library"`, a `LocalBusiness` subtype) each with `name`, `address`, `url` (the LibCal/library page, verified 200), and where known an `event`/`openingHours`. Add `buildLibraryPageSchema(...)`. Each recurring open-play can also emit an `Event` node with `isAccessibleForFree: true`, `eventAttendanceMode: Offline`, `offers.price: 0`.

**Required on-page content:**
1. Intro: "Free mahjong open play at libraries across [State]" + 60-80 words on how library mahjong works (drop-in, free, all levels, bring or borrow a set, played to the NMJL card for American).
2. **List of real libraries** with the recurring schedule pulled from LibCal, each linking to its source page (every link verified 200 before publish — hard rule).
3. City grouping (links to city pages).
4. "Don't see your library? Start a Table" CTA → `/list-my-game`.
5. A short "How to start a mahjong group at your local library" how-to (links the program-coordinator angle for supply growth) → optional `HowTo` schema.

**Data source / ops:** maintain a `libraries` table (or a `venue_listings` row with `venue_type='library'`, `status='published'`) seeded from LibCal scrapes. Reuse the existing venue pipeline so no new admin surface is needed. Source URL is mandatory and must be live (200).

**Indexability rule:** indexable only if ≥3 real libraries with verified (200) source links are listed for that state. Every external library link must pass the 200 check (CLAUDE.md no-dead-links rule) — bake this into the publish step, not post-hoc.

**Internal links IN:** parent state page (library callout), city pages, `/states` index.
**Internal links OUT:** state page, city pages, each library's real page (external), `/list-my-game`.

---

## Make the sitemap data-driven (prerequisite, Week 1)

`app/sitemap.ts` must stop being a hand-list. Rewrite it to query the DB and include only pages that pass `isIndexable`, so the sitemap and the per-page `robots` tag share one source of truth:

```ts
// app/sitemap.ts (shape)
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = createServerClient();
  // static + 50 states (always indexable)
  // + city pages where isIndexable(...) === true
  // + teacher pages where indexable
  // + future-dated event pages
  // + state library pages with >=3 verified libraries
}
```

Excluding non-indexable pages from the sitemap (while keeping them crawlable via internal links with `follow:true`) is exactly the doorway-page guardrail Google asks for.

---

## 60-Day SEO build order (what ships which week)

**Week 1 — Foundations (no new public pages yet).**
- Ship `lib/indexable.ts` (`isIndexable`, `robotsFor`).
- Convert `app/sitemap.ts` to data-driven (DB-backed, floor-gated).
- Rewrite 50 unique state intros (kill the duplicate seed `desc`); wire `nearby` into rendered internal links; add server-rendered state FAQ + `FAQPage` schema.
- Add `buildCityPageSchema`, `buildTeacherPageSchema`, `buildLibraryPageSchema` to `lib/schema.ts`.
- **Search Console this week:** verify property if not already; submit the updated `sitemap.xml`; confirm all 50 state pages indexed; request indexing on the 5 rewritten flagship state pages (CA, FL, NY, TX, NV). Set up the Pages and Performance reports as the weekly dashboard.

**Week 2 — City pages, Tier 1 (the flagship metros).**
- Ship `/states/[state]/[city]` route with the Tier gate.
- Launch cohort: the top ~20-25 metros that already have or can fastest get ≥3 real listings (LA, SF, SD, Palm Springs, Miami, Boca Raton, Naples, NYC, Long Island, Westchester, Houston, Dallas, Austin, Las Vegas, Henderson, Summerlin, Chicago, Boston, Atlanta, Phoenix, Scottsdale, Seattle, Bethesda/DC metro, Philadelphia).
- Seed each with LibCal libraries (so `hasLocalProof` passes) + any real DB listings.
- Wire state-page city grids to link them.
- **Search Console:** submit updated sitemap; use URL Inspection → Request Indexing on the cohort that cleared the floor; watch Coverage for "Crawled - currently not indexed" (the thin-content warning signal).

**Week 3 — Library pages (state roll-ups) + LibCal supply push.**
- Ship `/states/[state]/libraries` for the ~15 states with the densest LibCal coverage (FL, CA, NY, TX, NV, IL, MA, NJ, PA, AZ, WA, GA, NC, OH, MD).
- Backfill libraries into the venue pipeline (every source link 200-verified).
- This simultaneously raises `hasLocalProof` + `realListings` on many Week-2 city pages, flipping borderline ones to indexable.
- **Search Console:** submit; request indexing on the new library pages and on city pages that just crossed the floor.

**Week 4 — Teacher pages + Oh My Mahjong partnership content.**
- Ship `/teachers` index + `/teachers/[slug]`. Launch with Shauna + any vetted OMM instructors who opt in.
- Cross-link teachers ↔ the city pages they serve.
- **Search Console:** submit; request indexing on real teacher pages; review the first Performance data on Week-2 city pages (impressions appearing = pages are eligible; clicks lagging is normal this early).

**Week 5 — Event detail pages.**
- Ship `/events/[slug]` with full `Event` schema + the past-event auto-noindex flip.
- Migrate existing DB events to detail pages; cross-link from state/city.
- **Search Console:** submit; check the **Events** enhancement report for valid/invalid items; fix any `Event` schema errors flagged.

**Week 6 — City pages, Tier 2 (expansion).**
- Add the next ~40-60 cities that have reached ≥3 listings (driven by Week 3 library backfill + organic listings).
- Add `/states/[state]/[city]/libraries` sections where city library volume justifies.
- **Search Console:** submit; request indexing on the new cohort; start tracking average position on the head terms ("mahjong [city]", "mahjong near me [state]").

**Week 7 — Internal-linking + entity consolidation.**
- Audit and tighten the link graph: every indexable page should be ≤3 clicks from home; nearby-city and nearby-state link blocks fully wired; teacher↔city↔library cross-links complete.
- Unify schema `@id`s (one Person node for Shauna, one Organization node) so Google resolves the entity graph.
- Add `ItemList` of child cities to each state page's schema (hub signal).
- **Search Console:** submit; review Coverage for any "Duplicate, Google chose different canonical" (fix canonicals); review Links report to confirm internal-link distribution favors city/library hubs.

**Week 8 — Harvest, prune, and scale the winners.**
- Identify the Week-2/3 pages now ranking (Performance report) and **expand their content** (more local anchors, more FAQs, more listings) — Google rewards depth on proven pages.
- Prune/keep-noindex any page still stuck under the floor (don't force-index thin pages).
- Push remaining viable Tier-3 cities that crossed the floor.
- **Search Console:** final sitemap submit; request indexing on the proven-winner expansions and the last cohort; document baseline rankings for the post-sprint dashboard.

---

## What to submit to Search Console each week (summary)

Every week, in this order:
1. **Submit `sitemap.xml`** (it's now data-driven, so resubmitting surfaces newly-indexable pages automatically).
2. **URL Inspection → Request Indexing** on that week's net-new pages that *cleared the floor* (don't waste the daily quota on non-indexable pages).
3. **Read three reports:** Pages/Coverage (watch "Crawled - currently not indexed" = thin-content signal, and "Duplicate, chose different canonical" = canonical bug), Performance (impressions first, then clicks/position), and the relevant Enhancement report (FAQ in Weeks 1-2, Events from Week 5).
4. **Act on errors before adding pages.** A schema error or a soft-404 on existing pages outranks shipping new ones in priority.

---

## Thin-content guardrail recap (the rule that protects the whole sprint)

1. No page enters the sitemap or gets `index:true` unless it passes `isIndexable` (≥3 real DB-backed listings, ≥250 unique words, ≥1 named+linkable local entity).
2. Counts and proof come **only from the database**, never from `lib/states-data.ts` seed data (CLAUDE.md hard rule).
3. Non-indexable pages still render and still pass link equity (`follow:true`) — they are growth surfaces, just not crawl-index surfaces, until they earn it.
4. Every external link (library source, registration URL, venue site) is 200-verified before publish (CLAUDE.md no-dead-links rule).
5. Past events and stub teacher/city pages auto-demote to noindex — no graveyards.
6. The state pages are the only always-indexable programmatic tier; they are the hubs the floor-gated children hang off of.

---

## Relevant files (absolute paths)

- `/Users/shaunabruckman/Projects/findmymahjgame/app/sitemap.ts` — rewrite to data-driven, floor-gated (Week 1).
- `/Users/shaunabruckman/Projects/findmymahjgame/lib/schema.ts` — add `buildCityPageSchema`, `buildTeacherPageSchema`, `buildLibraryPageSchema`, and `Event`-page builder; unify Person/Org `@id`s.
- `/Users/shaunabruckman/Projects/findmymahjgame/lib/states-data.ts` — replace duplicate `desc` strings with 50 unique state intros; `cities`/`nearby` arrays feed the city routes and internal links.
- `/Users/shaunabruckman/Projects/findmymahjgame/app/states/[state]/page.tsx` — add city-grid, FAQ schema, nearby-state links; keep always-indexable.
- New routes to create: `/Users/shaunabruckman/Projects/findmymahjgame/app/states/[state]/[city]/page.tsx`, `/Users/shaunabruckman/Projects/findmymahjgame/app/states/[state]/libraries/page.tsx`, `/Users/shaunabruckman/Projects/findmymahjgame/app/teachers/[slug]/page.tsx` (+ `/teachers/page.tsx`), `/Users/shaunabruckman/Projects/findmymahjgame/app/events/[slug]/page.tsx`.
- New file to create: `/Users/shaunabruckman/Projects/findmymahjgame/lib/indexable.ts` — the `isIndexable` / `robotsFor` guardrail.

Note: the brief referenced `/Users/shaunabruckman/Projects/findmymahjgame/growth/02-seo-domination.md`, but neither `growth/` nor that file exists on the current `pricing-group-size` branch. This plan is grounded in the real `app/sitemap.ts`, `lib/schema.ts`, the live `/states/[state]` route, and the actual `player_listings`/`venue_listings`/`event_listings` tables instead.
