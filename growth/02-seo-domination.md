I now have the full picture. The state pages are dynamic-rendered (`revalidate = 3600`), city is a client-side filter only (no city URLs exist), search routes city queries to the parent state page, and the "city/town" content is purely seed data. This is the critical constraint for the SEO design. Here is the strategy.

---

# FindMyMahj Nationwide Programmatic-SEO Strategy

## The blunt truth first (read this before anything else)

Right now you have 50 dynamic state pages whose only real differentiator is a hardcoded `desc` string and a city dropdown that filters client-side. The cities never get their own URLs. So you are competing for "mahjong near me" with zero pages that actually target a city, and the pages you do have are 90% template, 10% seed text. If you naively generate 3,000 city pages off `states-data.ts` tomorrow, Google will classify the whole pattern as a doorway/thin-content farm and can suppress the entire subfolder, including the 50 state pages that are working. This has happened to countless local directories.

**The core principle that protects you: never publish a page whose value is the same as a search results page.** A city page must answer the query better than a SERP. If a city has no listings and you cannot say anything specific or true about mahjong in that city, that page should not be indexable yet. We solve thin content with (a) a content floor every page must clear, (b) a noindex gate that auto-flips to index when a page earns real data, and (c) genuinely useful evergreen content (NMJL/how-to-play, beginner guidance, "how to start a group") that is locally framed and not faked.

Also note a current data-honesty problem you must fix as part of this: the state hero shows "Players Listed / Events / Venues" stat counters and the dropdown lists seed cities as if they're coverage. Per your own CLAUDE.md hard rules, seed cities must not imply real listings. The architecture below removes that risk.

---

## 1. Site architecture and URL taxonomy

Adopt a strict hierarchy. Every level is a real, crawlable URL with breadcrumbs.

```
/                                         Home (hub)
/states                                   National index (hub)
/states/[state]                           State hub (have this)
/states/[state]/[city]                    City page              ← NEW, the workhorse
/states/[state]/[city]/[venue-slug]       Venue entity page      ← NEW
/teachers                                 Teacher index (hub)
/teachers/[teacher-slug]                  Teacher entity page     ← NEW
/events                                   Event index (hub)
/events/[event-slug]                      Event entity page       ← NEW
/tournaments                              Tournament hub (filtered events)
/guides/...                               Evergreen content hub   ← NEW (the moat)
```

Key decisions and the reasoning:

- **City lives under state, not flat.** `/states/texas/houston` not `/houston-mahjong`. The path itself communicates hierarchy to Google, makes breadcrumbs trivial, and disambiguates the 30+ duplicate US city names (Springfield, Columbus, Charleston). It also concentrates link equity: state hub links down to cities, cities link up to state.

- **Slug discipline.** City slug = lowercase, hyphenated, accent-stripped (`st-paul`, `coeur-dalene`). Build a `CITY_TO_SLUG`/`SLUG_TO_CITY` map once (you already have half of this in `search-box.tsx`). Venue/teacher/event slugs = `business-name-city` to stay unique and keyword-rich.

- **Switch from a hardcoded city array to a real `cities` table in Supabase.** This is the single most important architectural change. `states-data.ts` is seed data and must stay seed data per your hard rules. Create a `cities` table: `slug, name, state_abbr, county, metro, population, lat, lng, status`. Pre-populate it from a free Census/SimpleMaps US cities dataset (top ~1,500 cities by population covers essentially all search demand). This gives you real population/metro/county facts to write non-thin pages, and a `status` column to gate indexing.

- **How you scale from 50 to thousands without penalties: tiered rollout gated on data, not a big-bang generate.** Three tiers:
  - **Tier A (index now):** city has >=1 real listing OR sits in a top-50 metro where you can write genuinely specific local content. These are `<meta robots> index`, in the sitemap, fully linked.
  - **Tier B (soft pages, noindex):** city exists, has the content floor (see section 2) but no listings yet. `noindex,follow`. NOT in the sitemap. Still reachable by users and crawlers (so it can collect a listing and graduate). Carries a prominent "Be the first to list in {city}" CTA — these pages are lead-gen for listings even while non-indexable.
  - **Tier C (do not build yet):** long-tail tiny towns. Don't create the route at all until a listing arrives, then auto-create at Tier B.
  - A page **auto-promotes** Tier B -> Tier A the moment it gets a listing or a hand-written local section. This is a single boolean derived at build/revalidate time: `isIndexable = listings.length > 0 || hasCuratedContent`. Wire it into `generateMetadata` (`robots: { index: isIndexable }`) and into `sitemap.ts` (only emit Tier A URLs). This is the mechanism that makes programmatic scale safe: Google only ever sees indexable pages that clear the value bar; the empty ones are invisible to the index but ready to flip.

- **Sitemap must become data-driven and split.** Your current `sitemap.ts` maps `ALL_STATE_SLUGS`. Replace with an index sitemap + child sitemaps (`sitemap-states.xml`, `sitemap-cities.xml`, `sitemap-venues.xml`, `sitemap-teachers.xml`, `sitemap-events.xml`), each querying Supabase for `status='published'`/Tier-A rows only. Never list a noindex URL in a sitemap. Next supports `generateSitemaps()` for this.

- **Rendering.** Keep ISR. State pages already use `revalidate=3600`. City/entity pages should be `generateStaticParams` over Tier-A slugs + `dynamicParams=true` so a brand-new listing's city renders on-demand and then caches. Don't pre-render all of Tier C.

---

## 2. City page strategy (the make-or-break)

A city page must be useful even with zero listings, without faking data. Content floor — every city page ships with these blocks, in this priority order:

1. **A specific, true H1 + intro.** "Mahjong in Houston, TX" + a 2-3 sentence intro that uses *real facts from the cities table*: county, metro, population context, and the honest current state ("We're building the Houston mahjong directory. Here's how to find or start a game."). No invented counts. No "47 players."

2. **Live listings if any** (players/venues/events/teachers filtered to this city). When present, this is the page's primary value and it flips to Tier A.

3. **"Where people actually play here" evergreen guidance, locally framed.** This is the anti-thin moat and it's 100% honest: how American Mahjong players in any city typically find games — local Facebook Groups (link to a search for "{city} mahjong" groups), Meetup, JCCs and community centers, libraries, senior/rec centers, country clubs, game cafes. This is genuinely the answer to "where to play mahjong in {city}" and it differs meaningfully by being actionable. Pull real local anchor institutions where you can verify them (a JCC, a major library system) — but only if fetched and confirmed (your no-dead-links rule).

4. **"Start your own game" CTA + the free player listing form** pre-filled with the city. Every city page is a listing-acquisition funnel. This directly serves your KPIs (USERS, LISTINGS).

5. **A localized NMJL/how-to-play primer teaser** linking to the evergreen `/guides/` hub. Seasonal hook in spring for the new NMJL card.

6. **Nearby cities + "back to {State}" internal links** (section 6).

7. **City-scoped FAQ with FAQPage schema**: "Where can I play mahjong in {city}?", "Are there mahjong lessons in {city}?", "How do I find a mahjong group in {city}?" — answered using the real guidance above. This wins featured snippets and is the cleanest match for the long-tail queries you're targeting.

Rules that keep it out of thin-content jail:
- **Minimum ~350-500 words of non-boilerplate, of which the boilerplate-to-unique ratio matters more than raw count.** Vary intros by metro tier and by what real data exists. Do not produce 1,500 pages that differ only by city name token-swap — that is the exact doorway pattern Google penalizes.
- **No fabricated stats, testimonials, or "popular venues."** If you don't have it, the block says "be the first."
- **noindex until the floor + (a listing or curated local content) exists.** A token-swapped page with no listings stays Tier B/noindex.

---

## 3. Venue page strategy

`/states/[state]/[city]/[venue-slug]`. Only created for real `venue_listings` rows (always Tier A — a real venue is never thin).

- Content: business name, type, full description, address/map, hours, photos, website/IG/email (all fetched-and-200-verified per your link rule), what mahjong happens there (open play schedule, lessons offered), and a "request info"/connect action.
- **Schema: `LocalBusiness`** (you already build a nested version in `schema.ts`; promote it to a standalone page node with `@id`, `address`, `geo`, `openingHoursSpecification`, `amenityFeature`). This is your shot at Google local pack / rich results.
- Cross-link: venue -> its city page -> its state page (breadcrumb), plus "other venues in {city}" and "events at this venue."
- Aggregate the most-linked, highest-quality venues into the city and state hubs to push equity down to them.

---

## 4. Tournament / event page strategy

`/events/[event-slug]`, with `/tournaments` as a filtered national hub (high-intent: tournament players travel and search nationally).

- Each event is its own indexable page with full `Event` schema (you have the builder — extend it to per-page with `offers`, `location` Place, `organizer`, `performer` where relevant, and `eventStatus`/`previousStartDate` for recurring).
- **Time decay is the risk here.** Past events become thin/stale. Handle it: keep past events indexable but transform them into "{Event} {year} — recap / happens annually, here's {next year}" and `redirect` or canonical to the next instance if recurring; otherwise set `eventStatus` and surface "upcoming events instead." Never leave a dead-dated page as your ranking asset.
- The `/tournaments` hub ranks for "mahjong tournaments near me" and "American mahjong tournaments 2026" and is a natural seasonal/national magnet — pursue it hard around the spring NMJL card cycle.
- Cross-link events to their city, venue, and any teacher running them.

## 5. Teacher page strategy

`/teachers/[teacher-slug]`, `/teachers` hub. High commercial-intent queries: "mahjong lessons {city}", "learn American mahjong {city}", "mahjong teacher near me."

- Content: name, certification (e.g., OMM-certified like Shauna), cities/format served (in-person + virtual — virtual lets one teacher legitimately rank in multiple metros without faking location), levels taught, format, link out, reviews if real.
- **Schema: `Person` + the lesson as a `Service`/`Course`**, `areaServed` per city. Virtual instruction is the honest way a teacher page can serve many cities.
- **Shauna is your flagship teacher entity.** Her `/teachers/shauna-bruckman` page is the strongest cross-link anchor to lasvegasmahj.com and a template/proof-of-concept for recruiting other instructors to list (LISTINGS KPI).

---

## 6. Internal linking structure

Hub-and-spoke, fully bidirectional, no orphans:

- **Home -> /states (hub) -> state hubs (50) -> city pages (Tier A) -> entity pages.** Every level links down to its children and up to its parent via breadcrumbs.
- **Breadcrumbs everywhere** with `BreadcrumbList` schema: `Home > {State} > {City} > {Venue}`. Fix the current breadcrumb — it points position 2 at `/#map` (a fragment), which is weak; point it at `/states`.
- **State hub becomes a real index**, not just a filter shell: list its Tier-A cities as links (this is how city pages get discovered and ranked), plus top venues/teachers/events in the state.
- **Related-cities block** on every city page: nearest cities by lat/lng (you'll have coords in the `cities` table) + cities in the same metro. This builds a dense local mesh and keeps Tier B pages crawl-reachable so they can graduate.
- **"Nearby states"** already exists on state pages — keep, but make sure it links state->state both ways.
- **Cross-link to lasvegasmahj.com** deliberately and sparingly: from Shauna's teacher page, the Nevada/Las Vegas city pages (the existing sponsored block is the right pattern), the About/Org schema `sameAs` (already done), and a guides byline. Keep it editorial and relevant; don't sitewide-footer-link it (sitewide cross-domain links look manipulative). Reciprocal link from lasvegasmahj.com back to FindMyMahj's Nevada/teacher pages.
- **Contextual links from `/guides` content** down into city/state pages ("find a group in your city") — this is how evergreen content passes equity to money pages.

---

## 7. Quick wins (next 2 weeks) vs long-term plays

**Quick wins (do now, high ROI, low risk):**
1. **Fix the data-honesty + thin signals on existing state pages.** Remove or relabel the seed-driven stat counters so they never imply real counts; ensure the city dropdown isn't read as coverage. (Compliance + quality.)
2. **Add `cities` table to Supabase** and import top ~1,500 US cities (Census/SimpleMaps). Foundation for everything.
3. **Ship `/states/[state]/[city]` for Tier A only** — start with cities that already have a listing, plus the top ~50 metros with hand-written local intros. Wire the `isIndexable` gate, `generateMetadata` robots, and data-driven sitemap. This is where "mahjong {city}" rankings come from.
4. **Pre-fill the player listing form by city** from the city page (`/list-my-game?city=...&state=...`). Turns SEO traffic into LISTINGS immediately.
5. **Split + automate the sitemap** (Tier-A only) and submit in Search Console. Add per-city `canonical`.
6. **Add city-scoped FAQ + FAQPage schema** to the launched city pages (snippet wins).
7. **Stand up Search Console + Bing Webmaster** properly and baseline current state-page performance so you can measure.

**Long-term plays (compounding):**
1. The `/guides` evergreen hub (how to play NMJL, how to start a group, buying a set, the spring card) — your durable, link-earning, non-local moat that feeds every city page.
2. Venue/teacher/event entity pages as inventory grows; recruit instructors and venues (LISTINGS KPI) so more cities graduate to Tier A.
3. Programmatic Tier B -> Tier A graduation flywheel running automatically.
4. `/tournaments` national hub + seasonal NMJL-card content engine each spring.
5. Local backlinks: Facebook Groups, Meetup organizers, JCC/library calendars, regional mahjong communities.

---

## 8. 90-day roadmap with milestones

**Weeks 1-2 — Foundation & honesty**
- Create `cities` table; import top 1,500 US cities with population/metro/county/coords.
- Remove seed-data-as-real-data signals on state pages.
- Build slug utilities (`SLUG_TO_CITY`, accent strip), `isIndexable` gate.
- Search Console + Bing baseline.
- *Milestone: clean data layer + measurement in place; zero seed-implied counts live.*

**Weeks 3-4 — City pages, Tier A launch**
- Ship `/states/[state]/[city]` route with full content floor, FAQPage schema, breadcrumbs, city-prefilled listing CTA.
- Launch Tier A: every city with an existing listing + top ~50 metros with hand-written local intros (~75-150 pages).
- Data-driven split sitemaps, Tier-A-only; submit.
- *Milestone: first city pages indexed; "mahjong {city}" impressions appear in GSC for launched metros.*

**Weeks 5-6 — Entity pages**
- Ship venue (`LocalBusiness`) and teacher (`Person`+`Service`) pages + their hubs.
- Build Shauna's flagship teacher page; wire deliberate lasvegasmahj cross-links + reciprocal link.
- Convert state hubs into real indexes linking down to Tier-A cities.
- *Milestone: every real listing has its own indexable entity page; internal mesh complete; no orphans.*

**Weeks 7-8 — Tier B engine + events**
- Generate Tier B city pages (noindex,follow) for the next ~500 cities with the content floor; auto-promote on first listing.
- Ship `/events/[event-slug]` + `/tournaments` hub with `Event` schema and stale-event handling.
- Related-cities mesh (by coords) on all city pages.
- *Milestone: Tier B graduation flywheel verified end-to-end (add a test listing, watch it flip to index + enter sitemap).*

**Weeks 9-10 — Evergreen moat**
- Launch `/guides` hub: 5-8 cornerstone articles (how to play NMJL, start a group, buy a set, beginner FAQ, the spring card). Internally link into city/state pages.
- *Milestone: guides indexed and passing links to local pages; first non-branded informational impressions.*

**Weeks 11-12 — Scale, links, measure**
- Expand Tier A as listings/curation arrive; expand Tier B coverage.
- Outreach: Facebook Group admins, Meetup organizers, JCC/library calendars for listings + backlinks.
- Review GSC: prune/upgrade any thin pages flagged; confirm no "Crawled - currently not indexed" cluster forming on the city pattern.
- *Milestone (90 days): hundreds of Tier-A city/entity pages indexed, measurable "mahjong near me / lessons {city} / club {city}" ranking entries, a working listing-acquisition loop tied to CITY COVERAGE + LISTINGS + USERS KPIs.*

---

## Anti-thin-content checklist (enforce in code)

- A page is in the sitemap **only if** Tier A (`listings>0 || curatedContent`).
- `generateMetadata` sets `robots.index = isIndexable`; default Tier B = `noindex,follow`.
- Every city page clears the content floor (section 2) before it can be Tier A.
- No fabricated counts, venues, testimonials, or links; external links fetched-and-verified (your existing rule).
- Boilerplate ratio monitored: vary copy by metro tier + real data; never ship pure token-swap.
- Stale events transformed or canonicalized, never left dead-dated.
- Monitor GSC "Crawled - currently not indexed" / "Discovered - not indexed" on the city pattern as the early-warning signal; if it spikes, tighten Tier A criteria.

---

## Files this touches (for implementation)

- `/Users/shaunabruckman/Projects/findmymahjgame/app/sitemap.ts` — replace static map with data-driven, Tier-A-only, split sitemaps.
- `/Users/shaunabruckman/Projects/findmymahjgame/lib/states-data.ts` — stays seed; cities migrate to a new Supabase `cities` table (do not promote this file to "real data").
- `/Users/shaunabruckman/Projects/findmymahjgame/lib/schema.ts` — add `buildCityPageSchema`, standalone `LocalBusiness` (venue), `Person`+`Service` (teacher), per-page `Event`, city `FAQPage`; fix breadcrumb position-2 target off `/#map`.
- `/Users/shaunabruckman/Projects/findmymahjgame/app/states/[state]/page.tsx` + `client.tsx` — state hub becomes a real city index; relabel seed-driven stat counters; city filter coexists with real city URLs.
- New routes: `app/states/[state]/[city]/page.tsx`, `app/states/[state]/[city]/[venue]/page.tsx`, `app/teachers/[teacher]/page.tsx`, `app/events/[event]/page.tsx`, plus `/tournaments`, `/teachers`, `/events`, `/guides` hubs.
- `/Users/shaunabruckman/Projects/findmymahjgame/components/home/search-box.tsx` — route city searches to real `/states/[state]/[city]` URLs instead of the parent state page (the `CITY_TO_SLUG` map already here is the seed for the slug utility).

**Single highest-leverage move:** the Supabase `cities` table + the `isIndexable` Tier gate. Everything else is safe to scale only because those two exist.
