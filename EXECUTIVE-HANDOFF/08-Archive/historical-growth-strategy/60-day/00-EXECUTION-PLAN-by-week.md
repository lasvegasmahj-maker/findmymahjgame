I have everything I need. All load-bearing facts are confirmed: the `pending_review` status bug is real (client line 67 vs state-page `.eq("status","published")`), the share-preview page is orphaned (no routing to it from the success state, which just shows a static "Listing submitted!" screen), there's no ambassadors route yet, MVL = 5 real listings/city with at least 1 club and 1 teacher is the established definition, and the existing 30/60/90 roadmap in `growth/08` confirms 8 Wave-1 anchor metros and the isIndexable Tier gate. Now I'll write the consolidated week-by-week plan.

# FindMyMahj — The 60-Day Market-Domination Sprint
### One consolidated, week-by-week execution plan (Weeks 1-9)

---

## (a) Sprint Thesis

There is exactly one square on the board nobody owns: *"find an individual player / find a 4th near me."* NMJL owns the card and ignores discovery; the strongest SEO incumbent (Bam Good Time, now 1,218 clubs) has no individual-player layer; Oh My Mahjong only cares about discovery to sell tiles; and the live demand sits trapped in ephemeral Facebook posts. We win this 60-day land grab by compounding speed through two flywheels at once: a **programmatic-SEO city flywheel** (every real listing mints an indexable city page) and a **viral table-forming flywheel** (every "looking for a 4th" group broadcasts off-platform to net-new players). The single governing reframe is product-wide: stop asking searchers to *"list your game"* (which makes a lonely person become supply, a cold-start dead end) and instead offer **"Start a Table / Find a 4th"** (an additive, goal-bearing group object with a progress counter and a built-in reason to invite and return). Supply is seeded legally and account-lessly via LibCal/JCC public civic pages and a teacher-first Founding Ambassador program, because one teacher arrives with a roster of 8-40 students, which is instant liquidity. Revenue is explicitly not a goal; the only scoreboards are network effects and user growth.

---

## (b) North Star, the 3 weekly KPIs, baselines, and 60-day targets

**North Star Metric: Real Connections Made per Week (RCMW)** — distinct, non-seed player-to-player or player-to-game connection requests successfully submitted in a rolling 7 days. In today's schema: `inquiries` rows where `inquiry_type='player_connect'`, plus (once built) confirmed "Join this Table" requests. It is the only metric that, when it rises, *means the network got more valuable to the next user.* "Real" everywhere excludes seed rows (interim filter `contact_email IS NOT NULL AND created_at > '2026-05-22'`; durable filter `source <> 'seed'` after the source column ships in Week 1).

| Metric | Week-0 baseline | 60-day target | Why it is the right number |
|---|---|---|---|
| **NORTH STAR — Real Connections Made / week** | **0** | **25 / week** | The value event: two real people put on a path to a game. |
| **KPI 1 — Real player listings, net new / week** | 0 real (10 seed) | **15/wk; ~120 cumulative** | Demand-side supply. The fuel for both flywheels. |
| **KPI 2 — Cities at MVL** (≥5 real listings, ≥1 club, ≥1 teacher) | **0** | **25 cities** (8 by day 30) | Honestly-defined liquidity. A populated page, not a token-swap. |
| **KPI 3 — Captured contacts** (waitlist + empty-city + traveling, non-unsub) | **0** | **1,500 captured** | Demand heatmap that tells supply exactly where to go next. |

Supporting drumbeats tracked but not headline: **supply listings (venue+event) net new** (target ~600+ published via LibCal/JCC toward overtaking Bam's 1,218), **ambassadors signed/activated** (target 30 activated founders), **"mahjong {city}" GSC impressions** (target 50k/wk), **indexable pages live** (target 30+).

---

## (c) The Critical Path (the few things that, if they slip, sink the sprint)

1. **The `pending_review` status bug (Week 1, Day 1).** `list-my-game-client.tsx:67` writes `status:"pending_review"`; every read path filters `.eq("status","published")`. Every real signup is invisible. Until fixed, the North Star and KPIs 1 and 2 are *structurally pinned at zero* and nothing downstream can be measured. This is the single highest-leverage one-line change in the repo. **Everything depends on this.**
2. **The LibCal/JCC supply scraper (Weeks 1-2).** The only channel that is GREEN on legality, fully mechanical (no human reply needed), and high-volume. It carries the early supply curve solo while every relational channel warms up. If it slips, city pages have no `hasLocalProof`, the Tier gate keeps them noindexed, and the SEO flywheel never starts.
3. **The share/listing wiring (Weeks 1-2).** The share-preview page is built but orphaned. Wiring submit → `/listed/[share_code]` with real data turns a finished asset into the viral loop's foundation. Without it, there is no K-factor and growth only adds, never compounds.
4. **Oh My Mahjong partnership conversation (open Week 1, slow-burn).** One yes delivers most of 1,000 instructors and the bulk of the ambassador sourcing list. Relational and slow, so it must start day one even though it closes late.
5. **The isIndexable Tier gate shipping *with* city pages, not after (Week 3).** If thousands of thin city pages ship un-gated, Google can suppress the entire `/states` subfolder including the 50 working state pages. Non-negotiable: the gate ships in the same PR as the city route.

---

# THE WEEKLY PLAN

Three tracks run in parallel every week: **ENG** (code/instrumentation), **CONTENT** (copy/pages/schema), **GROWTH/OUTREACH** (supply + ambassadors, much of it Shauna-fronted). Owner-role is tagged per item: **Eng**, **Content**, **Growth**, **Shauna-fronted**.

---

## WEEK 1 — "Stop the bleeding, instrument the truth"
*Theme: Fix the invisible-listing bug, make every number honest, open the slow relational channels.*

**Engineering**
- [ ] **[Eng] Fix the `pending_review` status bug.** Change `list-my-game-client.tsx:67` to write `status:"published"` (player listings are free, low-risk; liquidity beats moderation this sprint). *Critical path #1.*
- [ ] **[Eng] Add `source` column to all four listing tables** + backfill existing rows to `source='seed'` (`created_at <= '2026-05-23'`). Public read paths unchanged; only dashboard/KPI queries filter on it.
- [ ] **[Eng] Create `captured_contacts` table + `app/actions/capture-contact.ts`** (clone of `submit-inquiry.ts`, upsert/idempotent, RLS insert-only, no public SELECT). Foundation for all demand capture.
- [ ] **[Eng] Create lightweight `events` table + `POST /api/track` route** (mirror `/api/notify`). Wire the two highest-signal events first: connect-modal open→send, and list-form start→submit.
- [ ] **[Eng] Verify Google Search Console + Bing Webmaster**; baseline all 50 state pages. (Only KPI source we don't have to build.)
- [ ] **[Eng] Add `share_code` / `referred_by` / `referral_count` columns to `player_listings`** (generate `share_code` server-side on insert). Sets up Week 2 share wiring.

**Content**
- [ ] **[Content] Rewrite 50 unique state intros** to kill the duplicate seed `desc` (60-90 words each, real geography, library/JCC institutions, NMJL card seasonality). Add server-rendered state FAQ + `FAQPage` schema.
- [ ] **[Content] Add `lib/indexable.ts`** spec copy + the three schema builders (`buildCityPageSchema`, `buildTeacherPageSchema`, `buildLibraryPageSchema`) to `lib/schema.ts`.

**Growth / Outreach**
- [ ] **[Shauna-fronted] Open the Oh My Mahjong partnership conversation.** One deal = 1,000+ Mahji Mentors + the ambassador sourcing list. *Critical path #4 — start now, closes late.*
- [ ] **[Growth] Stand up the Google Sheet CRM** (pipeline: Sourced → Contacted → Replied → Call booked → Verbal yes → Application in → Activated → Founding) + the 30-city target list, ranked by lasvegasmahj overlap, public-class density, OMM presence.
- [ ] **[Growth] Begin the teacher sourcing list** toward 400 named teachers (8-15/city), OMM list first.

**Targets:** listings +0 real (instrumentation week) · cities at MVL: 0 · contacts captured: 0 (capture surfaces ship Week 2) · ambassadors: Las Vegas = ambassador zero (Shauna).
**Dependencies:** Status fix unblocks everything. Source column unblocks honest KPIs. GSC verify must happen now so impressions backfill by Week 3.

---

## WEEK 2 — "Light both flywheels"
*Theme: Ship Start-a-Table, wire the orphaned share page, fire up the LibCal scraper, send first outreach.*

**Engineering**
- [ ] **[Eng] Ship "Start a Table" listing type.** New `table_listings` table (host counts as seat 1, `seats_total`/`seats_filled`, `status='forming'`, `share_code`). "Start a Table" primary button on every state page + homepage, plus a checkbox on the existing list-my-game form. Seats counter card (dots + progress bar + "2 of 4 filled · 2 seats open"). *Critical path #3.*
- [ ] **[Eng] Wire the orphaned share page.** Route list-my-game success → `/listed/[share_code]` with real row data (replace MOCK_PLAYER). Swap X for **SMS + WhatsApp**; keep Facebook + Email. Drop in System 1 channel copy with `?via=` attribution. *Critical path #3.*
- [ ] **[Eng] Instant two-way connect relay.** Server route looks up `contact_email` server-only, relays intro via Resend (admin CC'd, not in critical path). PII stays RLS-protected. Unblocks the Join-this-Table and Need-a-4th loops.
- [ ] **[Eng] Ship the data-driven sitemap** (`app/sitemap.ts` queries DB, floor-gated via `isIndexable`, never emits a noindex URL).

**Content / Demand Capture surfaces**
- [ ] **[Eng+Content] Empty-state and empty-city capture** in `app/states/[state]/client.tsx` (the bounce-to-signal conversion, highest-leverage capture). Two distinct cases: whole-state-empty and specific-city-empty, each its own `source` and copy.
- [ ] **[Content] Footer `CaptureBar` + NMJL card-alert bar** (card bar flag-gated OFF until confirmed, per CLAUDE.md). Value-exchange copy verbatim ("We will email you the moment a mahjong game opens up near you").

**Growth / Outreach**
- [ ] **[Eng/Growth] Build + run the LibCal scraper.** Seed 300-500 `[host].libcal.com` from Google dorks; filter titles for mahjong; normalize into `event_listings` (`status='draft'` → verify 200 → `published`); dedupe recurring series; set weekly re-crawl cron. *Critical path #2.* Point first at the 8 Wave-1 anchors.
- [ ] **[Shauna-fronted] Send first 50 personalized ambassador touches** (templates 4A email / 4C DM), every link 200-verified first. Batch by city.

**Targets:** listings: +30-45 supply (LibCal) + first real player listings · cities at MVL: 1-2 (Las Vegas, +1) · contacts captured: 50-150 · ambassadors: 50 touches sent, 3-5 verbal yeses.
**Dependencies:** Share wiring needs Week 1's `share_code` columns. Capture surfaces need Week 1's `captured_contacts` table. LibCal output feeds Week 3 city-page `hasLocalProof`.

---

## WEEK 3 — "Make the SEO surface real, safely"
*Theme: Ship city pages WITH the Tier gate; ship library roll-ups; flip borderline pages to indexable.*

**Engineering / Content**
- [ ] **[Eng] Ship `/states/[state]/[city]` route WITH the isIndexable Tier gate** in the same PR. *Critical path #5.* `generateStaticParams` returns only the ~20-25 flagship-metro cohort (LA, SF, SD, Palm Springs, Miami, Boca Raton, Naples, NYC, Long Island, Westchester, Houston, Dallas, Austin, Las Vegas, Henderson, Summerlin, Chicago, Boston, Atlanta, Phoenix, Scottsdale, Seattle, Bethesda/DC, Philadelphia). Below-floor pages render fully for users but emit `robots:{index:false, follow:true}` and stay out of the sitemap.
- [ ] **[Content] City-page content floor:** unique 80-120 word intro naming real local anchors (libraries from LibCal, JCCs), DB player/venue/event blocks, "Start a Table / Find a 4th" CTA deep-linked to `/list-my-game?city=...`, 3 city-specific FAQs → `FAQPage` schema.
- [ ] **[Eng] Wire state-page city grids** to link the published city pages (the internal-linking spine).
- [ ] **[Eng] Ship `/states/[state]/libraries` roll-ups** for the ~15 densest LibCal states (FL, CA, NY, TX, NV, IL, MA, NJ, PA, AZ, WA, GA, NC, OH, MD). Each library link 200-verified. This simultaneously raises `hasLocalProof` + `realListings` on Week-2 city pages, auto-flipping borderline ones to indexable on next revalidation.

**Growth / Outreach**
- [ ] **[Shauna-fronted] First ambassador calls** (script 4D, 15 min). Goal: verbal yes + the micro-commitment to email students this week. Send the application link while on the call.
- [ ] **[Growth] Ship `/ambassadors` landing page** (static `page.tsx` + client form, posts to `inquiries` with `inquiry_type='ambassador'`, no new auth). Footer "Community" link only (keep out of primary nav until 10+ activated). Build the Welcome Kit email + student-forward note so verbal yeses activate same-day.
- [ ] **[Growth] Start retirement-community director outreach** (Channel 7): The Villages public club-contact PDF + Sun City rosters. Highest density per touch (5-15 listings per director email).
- [ ] **[Eng/Content] Search Console:** resubmit sitemap; URL-inspect → request indexing only on cohort pages that cleared the floor; watch "Crawled - currently not indexed."

**Targets:** listings: +45 LibCal + +15 player + first retirement-community listings · cities at MVL: 4-5 · contacts captured: 250-400 cumulative · ambassadors: 6-10 verbal yeses, first 1-2 activated.
**Dependencies:** City pages need Week 2 LibCal supply for `hasLocalProof`. Tier gate must ship with the route (critical). Ambassador page needs the application copy from Week 1 CRM setup.

---

## WEEK 4 — "Teachers, the recurring-supply engine"
*Theme: Activate ambassadors at scale; ship teacher pages; instrument the dashboard.*

**Engineering / Content**
- [ ] **[Eng] Ship `/teachers` index + `/teachers/[slug]`.** Launch with Shauna (flagship template, lasvegasmahj cross-link) + vetted OMM instructors who opt in. `ProfilePage`+`Person` schema, `hasCredential`, `areaServed` linking to the city pages they serve (the internal-linking payoff). Indexable only if bio ≥150 unique words + verified contact link.
- [ ] **[Eng] Stand up the `weekly_dashboard` view + Monday email** via `/api/notify`. North Star alone at top with progress bar; the 7 numbers; early-signal flags (`[LEAK]`, `[watch]`); "Closest to liquid" + "This week's one move"; seed line quarantined at bottom labeled "not real traction." Add `contacts` tab + "Cities to seed next" ranked block to the admin dashboard.

**Growth / Outreach (peak activation week)**
- [ ] **[Shauna-fronted] Drive ambassador activations.** Send Welcome Kits same-day on every verbal yes; ambassadors forward the student note; listings arrive via `/list-my-game`. Flip a city to "Founding" badge when it hits 5 real published listings.
- [ ] **[Growth] Instructor outreach at scale (Channel 3):** harvest names from the six competing directories as *lead lists only* (never bulk-import), pitch each to self-list via `/get-listed`. Target ~20/wk.
- [ ] **[Growth] JCC public-page scrape + confirm (Channel 2)** in parallel: ~170 domains, confirmation email to each program director.
- [ ] **[Eng/Content] Search Console:** request indexing on real teacher pages; read first Performance data on Week-2 city pages (impressions appearing = eligible).

**Targets:** listings: +20 teacher self-lists + +12 JCC + LibCal drumbeat → ~150/wk total supply pace begins · cities at MVL: 8 (the day-30 milestone) · contacts captured: 500-700 cumulative · ambassadors: 12-15 verbal yeses, 6-8 activated.
**Dependencies:** Teacher pages strengthen Week-3 city pages (cross-links). Dashboard needs Week-1 `source` column + `events` table. Ambassador activations need the Week-3 Welcome Kit.

*End of Day 30 definition of done: status bug fixed, no fake states, every dead end captures an email, Start-a-Table live and sharing to WhatsApp, LibCal/JCC scraper feeding 8 Wave-1 metros to MVL, city + library + teacher pages indexed behind the Tier gate, Monday dashboard emailing, 6-8 ambassadors activated, OMM conversation live.*

---

## WEEK 5 — "Urgency: Need a 4th + events"
*Theme: Ship the highest-energy viral loop and the time-sensitive event surface.*

**Engineering / Content**
- [ ] **[Eng] Ship "Need a 4th"** on `table_listings` (`needs_fourth_by` deadline flag + `looking_now` on players). Pulsing badge with time-decay states ("NEEDS A 4TH · THU" → "· 2 DAYS" → "· TONIGHT"), sort to top of state page, daily Vercel cron downgrades/archives. Reuses the Week-2 connect relay. *Recurring, deadline-driven sharing = the loop that compounds without re-acquisition.*
- [ ] **[Eng] Ship `seat_alerts` zero-friction capture:** browser with no open seat leaves only an email → cron fires when a Need-a-4th table appears in their city.
- [ ] **[Eng] Ship `/events/[slug]`** with full `Event` schema (rich-result eligible) + the **past-event auto-noindex flip** (no graveyards). Migrate DB events to detail pages; cross-link from state/city. Every registration link 200-verified.

**Growth / Outreach**
- [ ] **[Growth] Club/organizer discovery-to-outreach (Channel 5):** Meetup + Facebook admins (discovery only, never scrape FB — your audience lives there and bans are fatal). Target ~25/wk. Closing ask always "know another group? add it free."
- [ ] **[Growth] Tournament/retreat partnerships (Channel 6, rolling, low-effort):** Destination Mah Jongg, Mah Jongg Fever, Tile Travelers, etc. Each organizer = multiple dated `event_listings`.
- [ ] **[Eng/Content] Search Console:** submit; check the Events enhancement report for valid/invalid items; fix any `Event` schema errors before adding pages.

**Targets:** listings: ~150/wk supply pace, first Need-a-4th tables forming · cities at MVL: 11-13 · contacts captured: 750-900 cumulative · ambassadors: 10-12 activated.
**Dependencies:** Need-a-4th requires Week-2 connect relay (without it the loop dies). Event pages ride Week-3 city/state cross-links.

---

## WEEK 6 — "Expand the city surface, complete the referral loop"
*Theme: Tier-2 cities; referral attribution closes the loop; invite-your-table.*

**Engineering / Content**
- [ ] **[Eng] City pages Tier 2:** add the next ~40-60 cities that have reached ≥3 listings (driven by Week-3 library backfill + organic + ambassador listings). Add `/states/[state]/[city]/libraries` sections where volume justifies.
- [ ] **[Eng] Complete the referral loop (System 4):** state page reads `?via=` → 30-day cookie → copies to `referred_by` on next submit; increments `referral_count`. Show "You've brought N players to [City]" + "Founding Player of [City]" badge for first ~10 listers per city + "2 more players and [City] goes live" nudge.
- [ ] **[Eng] Ship "Add the rest of your table" (System 5):** bulk-prefill invite links carrying `?via=`, progress meter "2 of 4 of your group listed," "Complete Table ✓" badge. Four attributed users from one acquisition.

**Growth / Outreach**
- [ ] **[Growth] Per-metro community/senior-center fill (Channel 4)** as each Wave-1/2 metro lights up (platform-specific dorks: ActiveNet, RecTrac, MyRec). ~14/wk.
- [ ] **[Shauna-fronted] Ambassador amplification wave:** each activated founder shares their city page once (we supply graphic + caption). Drives the share→listing loop.
- [ ] **[Eng/Content] Search Console:** request indexing on the new cohort; start tracking average position on head terms ("mahjong [city]", "mahjong near me [state]").

**Targets:** listings: ~150/wk, referred listings begin appearing (K-factor signal) · cities at MVL: 15-18 · contacts captured: 1,000-1,150 cumulative · ambassadors: 15-18 activated.
**Dependencies:** Referral loop needs Week-2 `?via=` + `referred_by`. Tier-2 cities need accumulated supply to clear the floor.

---

## WEEK 7 — "Tighten the graph, capture travelers"
*Theme: Internal-linking + entity consolidation; the snowbird/cruise wedge.*

**Engineering / Content**
- [ ] **[Eng] Internal-linking + entity audit:** every indexable page ≤3 clicks from home; nearby-city + nearby-state link blocks fully wired; teacher↔city↔library cross-links complete. Unify schema `@id`s (one Person node for Shauna, one Organization node). Add `ItemList` of child cities to each state page's schema (hub signal).
- [ ] **[Eng] Ship `/traveling` page + destination cards** on snowbird/cruise states (FL, AZ, NV, SC). Captures `dest_city`/`dest_state`/`travel_start`/`trip_type` → the dated city-coverage calendar ("Naples FL has 18 inbound snowbirds arriving Nov-Dec, seed it by October"). Trip-approach email fires 14 days before arrival.
- [ ] **[Eng] Ship `/waitlist` standalone page** (shareable in Facebook mahjong groups) + one-click "notify this state's waitlist" admin action for when a state crosses MVL.

**Growth / Outreach**
- [ ] **[Growth] Lifecycle email sequence live** (Email 0 immediate → day 3 Start-a-Table → day 7 recurring weekly "New near {city}" → card-triggered cheat sheet). HMAC one-click unsubscribe (reuse `lib/hmac.ts`).
- [ ] **[Shauna-fronted] Ambassador leaderboard goes public** on `/ambassadors` (now 10+ activated): cities ranked by tier + listing count. Bronze/Silver/Gold/City Champion race mechanics announced in the monthly ambassador note ("3 cities are within 5 listings of Gold").
- [ ] **[Eng/Content] Search Console:** review Coverage for "Duplicate, Google chose different canonical" (fix canonicals); confirm internal-link distribution favors city/library hubs.

**Targets:** listings: ~150/wk · cities at MVL: 19-22 · contacts captured: 1,250-1,400 cumulative (traveling-player rows accelerate this) · ambassadors: 20-24 activated.
**Dependencies:** Leaderboard needs 10+ activated (gated since Week 3). Traveling capture feeds the same "Cities to seed next" dashboard as empty-city signals.

---

## WEEK 8 — "Harvest the winners, push the last cohort"
*Theme: Deepen proven pages, prune stragglers, scale what ranks.*

**Engineering / Content**
- [ ] **[Eng/Content] Expand the Week-2/3 pages now ranking** (Performance report): more local anchors, more FAQs, more listings. Google rewards depth on proven pages.
- [ ] **[Eng] Push remaining viable Tier-3 cities** that crossed the floor; keep-noindex any page still under the floor (never force-index thin pages).
- [ ] **[Eng] Auto-compute badge tiers** from published-listing counts per city (retire the manual admin field).

**Growth / Outreach**
- [ ] **[Shauna-fronted] Close the Oh My Mahjong deal** if not already closed; if yes, run the bulk instructor onboarding (potential +100-1,000 listings, the wildcard that overtakes Bam's 1,218).
- [ ] **[Growth] Final push to 25 cities at MVL** across Waves 1-3; backfill any city short of 5 with extra LibCal/community outreach.
- [ ] **[Eng/Content] Search Console:** final sitemap submit; request indexing on proven-winner expansions + last cohort; document baseline rankings for the post-sprint dashboard.

**Targets:** listings: ~150/wk → ~1,140+ cumulative supply (clears 1,000, margin to overtake Bam) · cities at MVL: 24-25 (target hit) · contacts captured: 1,500 (target hit) · ambassadors: 28-30 activated (target hit) · **North Star: 25 real connections/wk (target hit).**
**Dependencies:** OMM close is the wildcard multiplier. MVL final push needs all prior supply channels running.

---

## WEEK 9 — "Wrap, measure, set the next horizon"
*Theme: Verify the targets, harden what works, define the 90-day continuation.*

- [ ] **[Eng] Verify the pre-push gate held all sprint** (`npx tsc --noEmit` clean, Technical + Brand workflows, route smoke-checks). Run the 3-agent verification pass on the quarter's changes.
- [ ] **[Eng/Content] Final North Star + KPI readout** vs the 60-day targets; document which channels drove the most real connections (attribution from `source` + `referred_by`).
- [ ] **[Growth] Convert the slowest-but-highest-leverage continuations into the 90-day plan:** magic-link claim/edit substrate, `cities` table + geocoding for real radius search, structured availability + recurring events, and entity hubs (venues/leagues). These are the compounding moats that ride on the now-liquid base.
- [ ] **[Shauna-fronted] Ambassador retention beat:** first quarterly founding-cohort call; publish the "Meet the Ambassadors" feature; seed the next 30-city wave.

**Targets:** all four KPIs confirmed at target; sprint retro complete; 90-day backlog sequenced.

---

## Top 5 Risks + Kill Plans

1. **Thin-content SEO penalty (programmatic doorway pattern).** Mass token-swapped empty city pages could suppress the entire `/states` subfolder, including the 50 working state pages. **Kill plan:** the isIndexable Tier gate ships *with* city pages (Week 3), never after; Tier B stays `noindex,follow` until it earns ≥3 real DB listings + ≥250 unique words + 1 named local entity. Monitor GSC "Crawled - currently not indexed" on the city pattern as the early-warning siren; tighten Tier A criteria if it spikes.
2. **Supply never reaches liquidity (cities stall below MVL).** **Kill plan:** LibCal scraper (GREEN, mechanical) carries the early curve so no city depends on outreach replies; enforce MVL = 5 with ≥1 club + ≥1 teacher; the "Cities to seed next" dashboard routes every spare hour to the closest-to-liquid city; ambassadors backfill with their student rosters.
3. **The bug/instrumentation slips and we fly blind.** **Kill plan:** Week 1 Day 1 is the status fix + source column + GSC verify, in that order, before any growth spend. If the North Star reads zero after Week 2, freeze feature work and audit the read/write status paths first.
4. **A competitor (Bam Good Time) locks the teachers first.** Teachers are a finite, identifiable set; this is a land grab. **Kill plan:** Shauna's peer-to-peer certified-instructor credibility + first-come "one founder per city" scarcity + permanent "Founding Member of the first 50" mark; OMM deal opened Day 1 to lock the largest instructor network in one move.
5. **Legal/ToS blowback on scraping (Facebook account ban is fatal — the audience lives there).** **Kill plan:** scrape only GREEN civic sources (LibCal/JCC/library/gov PDFs) with robots.txt honored, ~1 req/2s, descriptive UA, source back-link on every listing; Facebook and Meetup are discovery-and-outreach only, never automated scrape; resident PII from community PDFs is never published without consent (publish the club/venue, email the contact).

---

## What we are explicitly NOT doing in these 60 days

- **No monetization.** No charging players, no paywalls, no ambassador commissions, no upsells. Revenue is not a KPI; charging before liquidity kills the flywheel.
- **No new login/auth system.** Everything is account-less: emailed tokens, `?via=` codes, a Google Sheet roster. No user accounts, no ambassador login.
- **No mobile app, no in-app chat, no reviews/ratings.** We compete only where incumbents are empty (individual-player + forming-table discovery), not on SaaS surfaces Bam already owns.
- **No club-management software.** Not scheduling, not dues, not roster tools.
- **No bulk-import of competitors' curated teacher/club databases.** Those are *lead lists only*; bulk-import draws complaints and produces un-consented PII that collides with our RLS posture.
- **No paid acquisition / ad spend.** Growth is organic SEO + viral loops + ambassador + legally-clean supply only.
- **No fabricated data.** No fake "Active" states, no seed rows counted as real traction, no invented counts/testimonials/links; every external link 200-verified before publish.
- **No premature programmatic scale.** City pages ship in weekly cohorts gated on real data, never all ~270 at once.
- **No deep infrastructure refactors** (magic-link claim/edit substrate, `cities` geocoding table, structured availability, entity hubs) — these are sequenced into the 90-day continuation, not this sprint, because they compound best on an already-liquid base.

---

**Ground-truth notes for the runner:** All load-bearing claims verified against the live `growth-strategy` branch. (1) The `pending_review` status bug is real and is the #1 critical-path item: `app/list-my-game/list-my-game-client.tsx:67` writes `status:"pending_review"` while `app/states/[state]/page.tsx:84/90/96` filter `.eq("status","published")` — a one-line fix. (2) The share-preview page (`app/share-preview/page.tsx`) exists but is orphaned; the list-my-game success state is a static "Listing submitted!" screen that never routes to it. (3) No `/ambassadors`, `/teachers`, city, or event-detail routes exist yet (all are net-new builds, correctly sequenced). (4) The 10 existing player listings are all seed rows (same-day, NULL email); MVL = 5 real listings/city with ≥1 club and ≥1 teacher is the established definition in `growth/06`. (5) The `growth/` reference docs DO exist on this branch (they were absent from the other branches the component agents inspected, which is why several flagged them missing); this consolidated plan is consistent with `growth/08-execution-roadmap.md`'s 8 Wave-1 anchors and isIndexable gate.
