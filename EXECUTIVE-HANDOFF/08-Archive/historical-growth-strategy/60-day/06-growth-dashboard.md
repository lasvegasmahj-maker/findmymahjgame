Definitive ground truth confirmed:
- All 10 player_listings were bulk-created on the same day (2026-05-22), all with `contact_email = None`. These are unmistakably seed rows, not real signups. They cluster in NV/FL/NY/TX.
- No analytics, events, shares, referrals, or waitlist tables exist. Zero instrumentation.
- The connect flow has produced 0 real `player_connect` inquiries.

The critical instrumentation problem: seed listings have `contact_email IS NULL` and a uniform `created_at`, while real submissions carry a `contact_email` and arrive after seeding. That gives me a clean, honest "real listing" filter without adding a column today: `contact_email IS NOT NULL AND created_at > '2026-05-22'`. But the right durable fix is an explicit `source` flag. I have everything I need to write the dashboard.

---

# FindMyMahj Growth Dashboard — The 60-Day Sprint

Scope note grounded in your code, not theory: I read the live schema and queried production. Reality as of today: 10 player_listings (all seeded 2026-05-22, all `contact_email = NULL`), 4 venues, 4 events, 3 inquiries (all advertising), zero real player connections, zero share mechanism, and zero analytics tables. Two facts drive every decision below:

1. **There is a status bug blocking your entire growth loop.** `app/list-my-game/list-my-game-client.tsx` writes `status: "pending_review"`, but every read path (`app/page.tsx`, `app/states/[state]/page.tsx`) filters `status = 'published'`. New player listings are invisible until someone manually flips them, and there is no admin queue surfacing `pending_review`. Right now a real player can sign up and never appear. **Fix this before measuring anything**, or your North Star reads zero forever.
2. **You cannot tell real listings from seed listings in SQL today.** No `source`/`is_seed` column exists. The honest interim filter is `contact_email IS NOT NULL AND created_at > '2026-05-22'` (seed rows are NULL-email, same-day). The durable fix is one column. Both are in the instrumentation plan.

---

## 1. The ONE North Star Metric

**North Star: Real Connections Made per Week (RCMW).**
Definition: the number of distinct, non-seed player-to-player or player-to-game connection requests successfully submitted in a rolling 7-day window. In today's schema that is rows in `inquiries` where `inquiry_type = 'player_connect'`, plus (once instrumented) confirmed "Start a Table" join requests.

**Why this and not the obvious alternatives, from first principles:**

The business is a two-sided local network. Its only durable moat is liquidity: enough players in a city that any player who shows up can actually find a fourth. The North Star must be the metric that, when it goes up, *means the network got more valuable to the next user.* Walk the candidates:

- **Listings created** (the default directory metric). Rejected. A directory of listings nobody contacts is a graveyard. You already have 10 listings and 0 connections. More listings without contact is vanity. Listings are *supply*, an input, not the value event.
- **Total registered users / pageviews / GSC traffic.** Rejected as North Star. These measure reach, not value delivered. A million people reading a Texas page where no game forms is a content site, not a network. Traffic is a *leading* indicator (section 3), not the star.
- **Revenue.** Explicitly deprioritized by you, and correctly: charging before liquidity kills the flywheel.
- **Real Connections Made.** Accepted. A connection is the moment the network did its one job: it put two real people on a path to a game. It is the only metric that is simultaneously (a) the user's "aha," (b) a proxy for liquidity (connections only happen where supply and demand overlap in one city), and (c) the trigger for the viral loop (a person who found a game tells friends and starts a table). It is the closest measurable event to the company's reason to exist.

RCMW is honest about your stage: it will be a *small integer* for weeks. That is the point. A North Star you can fake with a seed script is worthless. This one forces real human behavior, in a real city, right now.

Single sentence for the owner: **"How many real people did we actually help connect to a mahjong game this week?"**

---

## 2. Weekly KPIs (the Monday 7)

Reviewed every Monday for the week that just ended. Each has a definition, a data source against your real schema, and a 60-day target. "Real" everywhere means non-seed: `contact_email IS NOT NULL AND created_at > '2026-05-22'` until the `source` column ships, then `source <> 'seed'`.

| # | KPI | Definition | Data source (your schema) | 60-day target |
|---|-----|-----------|---------------------------|---------------|
| 1 | **Real Connections Made (NSM)** | Distinct player_connect requests in the last 7 days | `inquiries` where `inquiry_type='player_connect'` AND `created_at >= now()-7d` | 25 / week by day 60 (from 0) |
| 2 | **Real Player Listings, net new** | New non-seed player listings that went live this week | `player_listings` where real-filter AND `status='published'` AND `created_at` in week | 15 / week; 120 cumulative |
| 3 | **Liquid Cities** | Cities with >= 5 real published player listings (your Minimum Viable Liquidity bar) | `player_listings` grouped by `(state, city)`, real-filter, having count >= 5 | 8 liquid cities |
| 4 | **Supply Listings (venues+events), net new** | New published venue + event listings this week (legally-clean LibCal/JCC supply counts here) | `venue_listings` + `event_listings`, `status='published'`, `created_at` in week | 40 cumulative supply rows |
| 5 | **"mahjong {city}" Impressions** | Weekly Google impressions for city/state mahjong queries | Google Search Console (Performance API), query contains "mahjong" + a city/state | 50,000 weekly impressions |
| 6 | **Indexable Pages Live** | State + city pages passing the isIndexable tier gate (have real content, not thin) | Count of pages where real listings on that page >= MVL threshold (computed from the three listing tables) | 30 indexable pages |
| 7 | **Activation Rate** | % of new real player listings that send or receive a connection within 14 days | join `player_listings` (real) to `inquiries.player_connect` on city/state within 14d | 30% |

Why exactly these seven: 1 is the star. 2 and 4 are the two sides of supply (player demand-side, venue/event supply-side) you must keep balanced. 3 is the liquidity gate that turns supply into value, your true scoreboard for whether the network is "on" in a market. 5 and 6 are the SEO flywheel made measurable and honest (no thin pages). 7 is the bridge: it tells you whether listings convert to the North Star, which catches the failure mode of "lots of listings, no connections" early. Drop any one and you lose a distinct failure signal. Add an eighth and the non-technical owner stops reading.

---

## 3. Leading Indicators (predict the lagging KPIs)

Leading indicators move days-to-weeks before the Monday 7 do. Watch these to steer mid-week instead of finding out next Monday that nothing worked.

| Leading indicator | Predicts | How it leads | Source after instrumentation |
|---|---|---|---|
| **Share-button click rate** (clicks ÷ state-page sessions) | Net-new listings (KPI 2) and Connections (NSM) | A share posted today is a listing/connection in 3-7 days; this is the viral loop's pulse | `events` table, `event_type='share_click'` (must be built; none exists) |
| **"Need a 4th" / Start-a-Table fill rate within 14 days** | Activation (KPI 7) and NSM | The core promise; if tables don't fill, connections never compound | `events`: table_created vs table_filled, joined on table_id |
| **Waitlist signups by city** | Liquid Cities (KPI 3) | Demand concentrating in a city predicts which market crosses MVL next; tells you where to seed supply | new `waitlist` table (does not exist) |
| **GSC impressions for "mahjong {city}"** | Page-level traffic, then listings | Impressions rise before clicks before signups; first sign a city page is ranking | GSC API (pre-instrumented by Google) |
| **List-my-game form: start → submit completion rate** | Net-new listings (KPI 2) | A drop here means the funnel is leaking before the DB ever sees a row | `events`: form_start vs form_submit on `/list-my-game` |
| **Connect-modal open → send rate** | NSM directly | Opens without sends = friction or trust gap in the modal | `events`: connect_open vs connect_submit |
| **State-page → city-filter usage** | Which cities to prioritize for seeding | Reveals real demand geography before listings exist | `events`: city_filter_select with city value |

The two that matter most this sprint: **share-click rate** (the only thing that makes growth compound instead of add) and **connect-modal open→send rate** (the last inch before the North Star). If you instrument only two events this week, instrument those.

---

## 4. Instrumentation Plan

You have **zero** analytics and **no** way to separate real from seed listings. Here is the honest, low-ops plan, ordered by leverage. All of it is Supabase + a tiny API route, no third-party analytics vendor (consistent with the account-less, low-ops constraint).

**Step 0 (blocker, do first): fix the status bug.** In `app/list-my-game/list-my-game-client.tsx`, the form writes `status: "pending_review"` but nothing reads that value and there is no review queue, so real listings are invisible. Either (a) flip new player listings to `status: 'published'` on submit (player listings are free and low-risk; the homepage already only counts published), or (b) build the admin queue that surfaces `pending_review`. Pick (a) for the sprint; liquidity beats moderation right now. Until this is fixed, KPIs 1, 2, 3, 7 are structurally pinned at zero.

**Step 1: add a `source` column to all four listing tables.** This is the single most important instrumentation change, because it makes every "real listing" number honest forever and lets you retire the brittle date/NULL heuristic.

```sql
ALTER TABLE player_listings ADD COLUMN IF NOT EXISTS source text NOT NULL DEFAULT 'organic';
ALTER TABLE venue_listings  ADD COLUMN IF NOT EXISTS source text NOT NULL DEFAULT 'organic';
ALTER TABLE event_listings  ADD COLUMN IF NOT EXISTS source text NOT NULL DEFAULT 'organic';
ALTER TABLE ad_listings     ADD COLUMN IF NOT EXISTS source text NOT NULL DEFAULT 'organic';

-- Backfill: every existing row is seed/admin, not organic.
UPDATE player_listings SET source='seed' WHERE created_at <= '2026-05-23';
UPDATE venue_listings  SET source='seed' WHERE created_at <= '2026-05-23';
UPDATE event_listings  SET source='seed' WHERE created_at <= '2026-05-23';
```
Allowed values: `organic` (real user), `seed` (hand-seeded), `libcal` / `jcc` (legally-clean public-page supply, so you can credit the supply flywheel separately), `partner` (Oh My Mahjong instructor network). The public read paths in `app/page.tsx` and `app/states/[state]/page.tsx` do **not** change (they still show all published rows to users); only the dashboard query filters on `source`.

**Step 2: one lightweight `events` table for behavioral instrumentation.** This captures the leading indicators. No PII, no cookies needed beyond an anonymous client id.

```sql
CREATE TABLE IF NOT EXISTS events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type text NOT NULL,          -- share_click, connect_open, connect_submit,
                                     -- form_start, form_submit, city_filter_select,
                                     -- table_created, table_filled, page_view
  page text,                         -- e.g. /states/texas
  state text,
  city text,
  anon_id text,                      -- random uuid in localStorage, not PII
  meta jsonb,                        -- {player_id, table_id, share_channel, ...}
  created_at timestamptz DEFAULT now()
);
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anyone can insert events" ON events FOR INSERT WITH CHECK (true);
-- No public SELECT policy: only service-role (dashboard) reads it.
```
Write path: a single `POST /api/track` route (mirror the existing `/api/notify` pattern) that inserts one row. Client calls it on: share-button click, connect-modal open, connect submit, list-my-game form focus and submit, and city-filter change. That is six `fetch('/api/track', ...)` calls total, all fire-and-forget like the existing notify calls. Rate-limit it to the 20 req/min/IP baseline from CLAUDE.md.

**Step 3: the share mechanism itself does not exist yet, so instrument it as you build it.** The viral flywheel ("Start a Table / find a 4th") has no button anywhere in `client.tsx`. When you add the share button to the state page and to the list-my-game success screen, wire its onClick to `/api/track` with `event_type='share_click'` and `meta.share_channel` (sms/whatsapp/copy). No share button means share-click rate is permanently null, which is why this is listed as instrumentation, not just feature work.

**Step 4: a `waitlist` table for cities below MVL.** When a player loads a city page with < 5 real listings, show "Be the first, get notified when your city is ready" and capture the email.

```sql
CREATE TABLE IF NOT EXISTS waitlist (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL, state text, city text,
  source text DEFAULT 'city_page', created_at timestamptz DEFAULT now()
);
```

**Step 5: GSC, free and already collecting.** Verify `findmymahjgame.com` in Google Search Console (DNS TXT record, one-time). After ~3 days it backfills impressions. Pull weekly via the Search Console API filtered to queries containing "mahjong". This is the only KPI source you do not have to build; Google is already logging it.

**Step 6: the weekly rollup query.** One SQL view, `weekly_dashboard`, computes the Monday 7 from the tables above so the owner never writes SQL. It excludes `source='seed'` everywhere. Run it via a Supabase scheduled function (or a Vercel cron hitting an admin route) every Monday 06:00 and email the result through the existing `/api/notify` pipeline.

Honesty guardrails baked in, per your data-honesty rules:
- Every count filters `source <> 'seed'`. Seed rows never inflate a "real" number.
- The dashboard labels seed-inclusive numbers separately (a "Seeded supply" line) so you can see total coverage without ever conflating it with organic traction.
- No metric is computed from `lib/states-data.ts`; that file is cities/copy only and contributes zero listing counts.

---

## 5. The Monday Dashboard (60-second read for a non-technical owner)

One email every Monday morning. Plain numbers, last week vs the week before, and a target column so progress is obvious. Arrows are computed, not decorative.

```
====================================================================
  FIND MY MAHJ GAME  —  WEEKLY GROWTH  —  Week of Mon Jun 1
====================================================================

  >>> NORTH STAR <<<
  Real connections made this week ........  6   (last wk 4)  +50%
  --> Target by Aug 6:  25 / week                 [#######...] 24%

--------------------------------------------------------------------
  THE 7 NUMBERS                  THIS WK   LAST WK   60-DAY GOAL
--------------------------------------------------------------------
  1. Real connections / wk          6         4          25
  2. New real player listings      11         7         15/wk
  3. Liquid cities (5+ players)      2         1           8
  4. New venues + events             5         3        40 total
  5. "mahjong {city}" impressions  9,200     6,100     50,000/wk
  6. Indexable pages live           7         5          30
  7. Activation (listing->connect) 22%       18%         30%
--------------------------------------------------------------------

  EARLY SIGNALS (predict next week)
  - Share-button clicks ............... 41   (rate 3.2% of visits)
  - Connect modal: opened 28, sent 6 .. 21% send rate  [watch]
  - List form: started 33, finished 11  33% finish rate [LEAK]
  - Top waitlist cities: Austin 9, Scottsdale 6, Boca 5

  WHERE WE'RE LIQUID:   Las Vegas (8), Boca Raton (5)
  CLOSEST TO LIQUID:    Austin (4), Scottsdale (4), Naples (3)

  THIS WEEK'S ONE MOVE:
  Austin is 1 listing from going liquid + has 9 on the waitlist.
  Email the Austin waitlist + seed 1 LibCal open-play to tip it.

  (Seeded supply for reference, NOT counted above: 10 players,
   4 venues, 4 events. These are placeholders, not real traction.)
====================================================================
```

Design choices, deliberate: the North Star sits alone at the top with its own progress bar because it is the one number that decides if the sprint is working. The early-signals block carries plain-English flags (`[LEAK]`, `[watch]`) so a non-technical reader knows where to look without interpreting rates. "Closest to liquid" plus the single "This week's one move" turns the dashboard into a decision, not a report, which is what a 60-day sprint needs. The seed line is quarantined at the bottom and explicitly labeled "not real traction" so the honesty rule is visible in the artifact itself.

---

## What to build this week, in order
1. **Fix the `pending_review` status bug** (`app/list-my-game/list-my-game-client.tsx`) or no real listing ever appears. Highest leverage, smallest change.
2. Run the **`source` column** migration + backfill (Step 1). Makes every "real" number honest.
3. Create the **`events` table + `/api/track` route** (Step 2), then wire **connect-modal open/send** and **list-form start/submit** first (the two highest-signal events).
4. Ship the **share button** on the state page and list-my-game success screen, instrumented on click (Step 3). This is the only thing that makes growth compound.
5. Verify **GSC** (Step 5) so KPI 5 starts collecting immediately.
6. Stand up the **`weekly_dashboard` view + Monday email** via the existing `/api/notify` path (Step 6).

Files that need changes (all absolute): `/Users/shaunabruckman/Projects/findmymahjgame/app/list-my-game/list-my-game-client.tsx` (status fix + share + form tracking), `/Users/shaunabruckman/Projects/findmymahjgame/app/states/[state]/client.tsx` (connect tracking, share button, city-filter tracking, waitlist prompt), `/Users/shaunabruckman/Projects/findmymahjgame/supabase/migration.sql` (source column, events, waitlist tables), and a new `/Users/shaunabruckman/Projects/findmymahjgame/app/api/track/route.ts` (mirror `/Users/shaunabruckman/Projects/findmymahjgame/app/api/notify/route.ts`).
