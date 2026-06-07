All load-bearing claims verified against the live code: orphaned `share-preview` page exists, no `cities` table, no `display_email` column (but referenced twice in `schema.ts` = live bug), hardcoded fake `ACTIVE_STATES` of 13 states, no city route, listing flow has no share wiring. The reports are accurate. Here is the consolidated execution roadmap.

---

# FindMyMahj — Workstream 8: Founder Execution Roadmap

## (1) Strategy Thesis & The Wedge

**Thesis:** There is one square on the board nobody owns — *"find an individual player / find a 4th near me."* The governing body (NMJL) owns the card and ignores discovery; the strongest SEO incumbent (Bam Good Time, 1,218 clubs) explicitly has no individual-player directory; the lifestyle giant (Oh My Mahjong) only finds discovery useful for selling tiles; and the demand that proves this intent exists today is trapped in ephemeral Facebook posts and a 1990s Sloperama bulletin board. We win by becoming the **structured, SEO-indexed, claimable directory of forming games** — not a list of lonely individuals (cold-start death) and not a fight over club-management SaaS (Bam's moat). We are in a land grab against one team that already aggregated ~1,000 clubs, so the only viable strategy is **speed compounded by two flywheels: a programmatic-SEO city flywheel (every real listing mints an indexable city page) and a viral table-forming flywheel (every "looking for a 4th" group broadcasts off-platform).**

**The single wedge to win first:** Reframe the product from *"list your game"* (asks a searcher to become supply, the current dead end) to **"Find a 4th / Start a Table near you."** The unit of value flips from a *person* (subtractive, needs 3 more, feels hopeless) to a *forming group* (additive, has a goal, a progress counter, and a built-in reason to return and to invite). This one reframe simultaneously fixes cold-start, network effects, and retention — and it maps directly onto the existing `player_listings` table with one schema field. Everything in the 30/60/90 sequences from it.

**What this explicitly is NOT this sprint:** not club-management SaaS, not revenue, not a mobile app, not in-app chat, not reviews. We compete only where the incumbents are empty.

---

## (2) 30-Day Plan — "Stop the bleeding, light the flywheel"

The governing constraint: today every search and click ends in a dead end that captures nothing, and the map actively lies (13 hardcoded fake "Active" states violating our own data-honesty rule). We cannot acquire users into a leaky, dishonest funnel. **Week 1 is honesty + capture; Weeks 2-4 are the table flywheel + supply ignition.** All four reports (Product, UX, Viral, SEO) independently converge on this exact bundle, which is why it's first.

| # | Shippable item (time-boxed) | Owner-role | KPI moved |
|---|---|---|---|
| 1 | **Kill the lies (Days 1-3).** Remove hardcoded `ACTIVE_STATES` (us-map.tsx:70); show real per-state count or nothing. Delete dead Distance/Zip controls on state pages (client.tsx:206-220). Drop `—` stat placeholders. Fix `display_email` bug in schema.ts (live `email: undefined` in venue JSON-LD). | Eng | Trust (enables all) |
| 2 | **Waitlist email capture on EVERY zero-result & empty state (Days 2-7).** New `waitlist` table keyed by `{email, city, state}`. Replaces all "Be the first / nothing here" dead ends in search-box + state client. | Eng | USERS + (demand heatmap for CITY COVERAGE) |
| 3 | **"Start a Table" listing type (Days 5-12).** One field on `player_listings` (`seats_total`/`seats_filled` + `looking_for_4th bool`); card renders a "2 of 4 — Join this Table" counter; "Join" reuses the existing inquiry pipeline. | Eng | LISTINGS + USERS |
| 4 | **Wire the orphaned share page into the listing success path (Days 8-12).** Route submit → `/listed/[share_code]` with real data (not MOCK). Add `share_code`/`referred_by` columns. Swap to group-oriented copy; **add WhatsApp + SMS buttons, drop X.** | Eng + Content | USERS (viral K-factor) |
| 5 | **Instant two-way connect (Days 10-14).** Server route relays intros via Resend (looks up `contact_email` server-side, PII stays protected); admin CC'd, not in critical path. Kills the inbox bottleneck. | Eng | USERS (connection throughput) |
| 6 | **Promote city search to the hero + autocomplete (Days 12-18).** Search box becomes the hero (not a button that scrolls to the map); `includes` matching + grouped city/state results; "use my location" (flag-gated OFF, tap-only). | Eng | USERS |
| 7 | **Supply ignition Wave 1 — mechanical (Days 1-30, parallel).** Build LibCal + JCC public-page scraper (GREEN legality: ~3,600 libraries, 170+ JCCs, public civic data, attributed + back-linked). Target: real `event_listings`/`venue_listings` in the 8 Wave-1 anchor metros. | Growth/Eng | LISTINGS + CITY COVERAGE |
| 8 | **Supply ignition Wave 1 — relational (Days 1-30, parallel).** Open the Oh My Mahjong partnership conversation (1,000+ Mahji Mentors in one deal). Begin instructor + FB-admin + Meetup-organizer outreach using persona templates → `/get-listed`. | Growth (Shauna-fronted) | LISTINGS + CITY COVERAGE |
| 9 | **Measurement (Days 1-3).** Stand up Search Console + Bing Webmaster; baseline the 50 state pages. Instrument the 3 dashboard metrics (section 7). | Eng | (instrumentation) |

**30-day definition of done:** No dead-end captures nothing. No fake "Active" states. A searcher in an empty city leaves an email. A player can start a table and share it to WhatsApp. The LibCal/JCC scraper is feeding real listings into Wave-1 metros. Oh My Mahjong conversation is open.

---

## (3) 60-Day Plan — "Make the SEO surface real, safely"

Now that listings are arriving and the flywheel turns, we expand the indexable surface — but **safely**, gated on data, not big-bang. The SEO report's single highest-leverage move (Supabase `cities` table + `isIndexable` Tier gate) lands here because it's the prerequisite that makes programmatic scale non-suicidal.

| # | Shippable item | Owner-role | KPI moved |
|---|---|---|---|
| 1 | **`cities` table + geocoding (P0 data).** Import top ~1,500 US cities (Census/SimpleMaps) with population/metro/county/lat-lng. Demote `states-data.ts` to a slug helper. This unblocks city pages AND finally makes the already-advertised "near me / zip radius" real instead of fiction. | Eng | CITY COVERAGE (foundation) |
| 2 | **Ship `/states/[state]/[city]` with the Tier gate.** `isIndexable = listings>0 \|\| curatedContent`; Tier A (has listing OR top-50 metro hand-written intro) is indexed + in sitemap; Tier B is `noindex,follow` lead-gen. Content floor + city-scoped `FAQPage` schema. City-prefilled listing CTA. | Eng | CITY COVERAGE + LISTINGS |
| 3 | **Data-driven split sitemaps (Tier-A only).** Replace static `sitemap.ts`; never emit a noindex URL. Submit in GSC. Fix breadcrumb position-2 off `/#map` → `/states`. | Eng | CITY COVERAGE |
| 4 | **Weekly "Mahj in [City]" digest.** Cron-driven; "2 new players, 1 table forming this week." The retention engine that rides the weekly game-night cadence. Built on the waitlist + listing emails captured in Days 1-30. | Eng + Content | USERS (retention) |
| 5 | **Magic-link claim/edit (the substrate).** HMAC token on submit (reuse `lib/hmac.ts` + the advertise-approve pattern). Lets players edit, "bump," flip "looking for a 4th," and be re-engaged — makes every loop repeatable, not one-shot. | Eng | USERS + LISTINGS (freshness) |
| 6 | **Structured availability + recurring events (data).** Replace free-text `availability` with `preferred_days[]`/`preferred_times[]`; add `recurrence jsonb` so weekly open play (the most common real activity) is representable and emits valid recurring `Event` schema. | Eng | LISTINGS quality + SEO |
| 7 | **City Expansion Waves 1-2 to MVL.** Run the per-city playbook (scrape → discover → outreach → enrich → verify) to hit **MVL = 5 real listings/city (≥1 club, ≥1 teacher)** across the 17 Wave-1+2 metros. | Growth | CITY COVERAGE + LISTINGS |

**60-day definition of done:** Hundreds of Tier-A city pages indexed; "mahjong {city}" impressions appearing in GSC; a working weekly digest; players can claim/edit listings; Wave-1+2 metros at MVL.

---

## (4) 90-Day Plan — "Compounding moats + the entity layer"

| # | Shippable item | Owner-role | KPI moved |
|---|---|---|---|
| 1 | **Entity pages + their hubs.** Venue (`LocalBusiness` w/ geo, hours, amenities), Teacher (`Person`+`Service`, virtual = honest multi-city), Group/League (free-to-submit, RLS-open — the highest-volume real-world entity for this audience). **Shauna's flagship `/teachers/shauna-bruckman`** = template + deliberate lasvegasmahj cross-link. | Eng + Growth | CITY COVERAGE + LISTINGS |
| 2 | **Tier B → Tier A graduation flywheel, verified end-to-end.** Add a test listing, watch it flip to index + enter sitemap. Related-cities mesh (by coords) keeps Tier B crawl-reachable so it graduates. | Eng | CITY COVERAGE |
| 3 | **`/guides` evergreen hub (5-8 cornerstone articles).** How to play NMJL, start a group, buy a set, the spring card. The durable, link-earning, non-local moat that passes equity into every city/money page. | Content | USERS (organic) |
| 4 | **`/tournaments` national hub + stale-event handling.** High-intent, travelers search nationally; canonicalize recurring events, never leave dead-dated pages. | Eng | USERS |
| 5 | **"Looking for a 4th" loop fully armed + traveling-player/snowbird capture.** Urgent badge, dedicated tab, alert email capture; `/travel` destination+dates demand capture that doubles as a city-coverage roadmap. | Eng | USERS (viral) + CITY COVERAGE |
| 6 | **City Expansion Wave 3 (retiree/Sun Belt).** Naples, The Villages, Scottsdale belt — disproportionate mahjong density. | Growth | CITY COVERAGE |
| 7 | **Pre-season NMJL card list-building everywhere.** Build the capture all year so the spring blast compounds annually. | Content | USERS (seasonal) |

**90-day definition of done:** Every real listing has its own indexable entity page; graduation flywheel proven; `/guides` passing equity to local pages; 25 metros seeded; the annual card-season list is growing.

---

## (5) 12-Month Vision

By month 12, FindMyMahj is **the default answer to "find a mahjong game near me" in the US** — the structured, fresh, claimable layer none of the incumbents built. Concretely:
- **Thousands of indexed city + entity pages**, ranking for "mahjong {city}", "mahjong near me", "mahjong lessons {city}", "mahjong tournaments 2026/2027" — a programmatic surface Bam's static club list and NMJL's dated site can't match on freshness or structure.
- **A self-sustaining two-sided flywheel:** players form tables → tables broadcast off-platform (FB/WhatsApp) → off-platform demand mints listings → listings mint city pages → pages rank → searchers arrive → more tables. Growth no longer depends on the founder's inbox or manual seeding.
- **A defensible data moat:** the only structured graph of *forming games and individual players* in American Mahjong — the one thing a tile-seller and a SaaS won't build because it doesn't sell tiles or club seats.
- **An annual card-season engine** that turns the immovable spring NMJL cycle into the year's largest synchronized growth event, each spring's list larger than the last.
- **Cross-business halo with lasvegasmahj.com**: Shauna's instructor credibility anchors partnerships and the teacher vertical.
- **Only then** consider monetization (claimed-listing upsells, featured placement, retreat/cruise affiliate inventory) — built on top of an audience and a moat, not before them.

---

## (6) Top 5 Risks & How to Kill Them

1. **Thin-content SEO penalty (programmatic doorway pattern).** Generating thousands of token-swapped empty city pages could suppress the *entire* subfolder, including the 50 working state pages. **Kill it:** never publish a page whose value equals a SERP. The `isIndexable` Tier gate is non-negotiable and ships *with* city pages, not after — Tier B stays `noindex` until it earns a real listing or curated content. Monitor GSC "Crawled - currently not indexed" on the city pattern as the early-warning siren; tighten Tier A criteria if it spikes.

2. **Cold-start / empty-page death spiral.** A searcher who lands on "0 players in Ohio" leaves and never returns, and we never learn they existed. **Kill it:** (a) the table reframe gives momentum where a lone listing gives despair; (b) honest community seeding from real, link-verified FB/Meetup groups so no page is barren; (c) waitlist capture on every empty state converts 100% of would-be bounces into leads + a demand heatmap that tells us exactly where to seed next.

3. **Losing the land grab to Bam Good Time.** They already published 1,026 clubs and are the strongest SEO competitor. **Kill it:** don't race to copy a list — win on *structure, freshness, and claimability* they don't have. Move mechanically (LibCal/JCC scraper, GREEN legality, this week) and relationally (Oh My Mahjong's 1,000+ instructors in one deal) in parallel. Compete on the individual-player white space they've confirmed they don't serve, not on clubs where they're entrenched.

4. **Data-honesty / legal & reputational blast radius.** Faking counts violates our own hard rule and erodes trust; scraping Facebook (Groups API dead, login-walled) risks bans and damages a women-led brand whose audience *lives* on Facebook. **Kill it:** zero fabricated stats/venues/testimonials anywhere; all external links fetched-and-verified. Scrape only GREEN sources (LibCal, JCC public pages); treat Meetup as discovery-to-outreach, never bulk import; never scrape Facebook — recruit its admins instead. Keep public inserts behind the 20 req/min rate limit and `pending_review` status.

5. **Founder bottleneck (non-technical owner, manual relay).** Every connection currently routes through Shauna's inbox; the network can't grow faster than her free time. **Kill it:** instant two-way connect (Day 10-14) removes the inbox from the critical path; magic-link self-service (60-day) removes the moderation/edit load; the weekly digest automates retention. Engineering is via Claude Code, so favor account-less, low-friction flows that don't require ongoing human ops.

---

## (7) Dashboard — The 3 Metrics That Matter (Week-1 baseline → target)

Revenue is deliberately absent; these map 1:1 to the sprint KPIs (USERS, LISTINGS, CITY COVERAGE).

| Metric | What it measures | Week-1 baseline | 30-day target | 90-day target |
|---|---|---|---|---|
| **1. Real published listings** (players + tables + venues + teachers + groups + events; *real only, seed excluded*) | LISTINGS KPI + the fuel for everything | **~0** (DB essentially empty; seed data is not counted) | **250+** (LibCal/JCC scrape + outreach + first organic) | **1,000+** (Oh My Mahjong deal + 25-metro playbook) |
| **2. Cities at Minimum Viable Liquidity** (≥5 real listings, ≥1 club, ≥1 teacher) | CITY COVERAGE KPI, honestly defined (a populated page, not a token-swap) | **0** | **8** (Wave-1 anchor metros) | **25** (Waves 1-3) |
| **3. Captured contacts** (listings + waitlist emails + claimed accounts) — and its leading indicator, **viral K-factor** (invites sent/lister × invite→listing rate) | USERS KPI + whether growth compounds | **~0** (no email list exists today; only transactional admin notifies) | **500+ contacts; K measured** | **3,000+ contacts; K trending toward 1.0** |

Leading indicators to watch under the hood: % of listers who reach the share page and click ≥1 share button (K-factor driver); "looking for a 4th" **fill rate within 14 days** (the best testimonial engine and proof the core value prop works); GSC impressions for "mahjong {city}" (SEO surface coming alive); and waitlist signups by city (the demand-driven seeding roadmap).

---

## What to CUT or DEPRIORITIZE now

- **CUT immediately (actively harmful / dishonest):** the hardcoded 13 fake "Active" states on the map; the non-functional Distance/Zip search controls (dead theater that makes the site look broken); the two hardcoded "No X listed yet" homepage sections (abandoned-site signal); the `—` stat placeholders. Fix the `display_email` bug while you're in there.
- **DEPRIORITIZE / DON'T BUILD this sprint:** in-app chat/messaging (huge moderation+safety surface; email already does the one job); native mobile app (zero ROI, fragments a tiny audience); ratings/reviews of players or venues (toxic for a small, real-name, predominantly-women community inviting strangers into homes); the heavy host/group dashboard (revisit only once organizing active groups is the *measured* bottleneck); all paid-tier/monetization work (explicitly out of scope per KPIs — free supply is the growth fuel). De-emphasize the promo-code-first framing on `/get-listed`; lead with "free / founding member."
- **DON'T scrape:** Facebook (API dead, login-walled, ban + reputational risk) and competitor DBs (Sloperama, Bam, MahjongCompare) — use the latter only as research leads for first-party outreach.
- **DON'T gate listing creation behind accounts.** Accounts are an upgrade (magic-link, 60-day), never a toll booth on the top KPI.

**The one move that unlocks the rest:** ship the Week-1 honesty-plus-capture bundle and the "Start a Table" reframe together, while the LibCal/JCC scraper and the Oh My Mahjong conversation run in parallel. That single coherent release converts a dishonest, leaky, empty directory into a functioning two-sided flywheel — and the `cities` table + Tier gate (Day 31) is what lets it scale to thousands of pages without burning the SEO house down.
