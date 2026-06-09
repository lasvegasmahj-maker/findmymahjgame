# FindMyMahj Execution Stack

The single operating document. Everything else under `growth/` is a deep-dive this index points to.

**Mission:** be the easiest place in America to find people to play mahjong with.

**North Star Metric: ACTIVE TABLES FORMED.** A "table" = a real, scheduled game of 4 people that actually happens. Not pageviews. Not listings. Not emails. Those are leading indicators that only matter insofar as they produce a table where four people sit down and play.

**The one funnel everything serves:**
```
someone wants to play  →  finds or starts a table  →  the 4th seat fills  →  they play  →  they come back / invite others
        (demand)              (Start a Table / Find)        (Need a 4th)         (TABLE FORMED)        (loop)
```

**Not doing now:** monetization, native apps, complex features, in-app chat, reviews, profiles, anything that adds a second decision to a screen or a signup wall before browsing.

---

## The Top 5 Actions That Create Real Tables in 30 Days

Ranked by expected active-tables-formed per unit of effort. The first one is human; the next four make the human scalable.

### 1. Concierge-form the first 10 real tables in ONE metro (Las Vegas), by hand. — Owner: Shauna
The product-model review's core finding: cold-start is a **concierge problem, not a software problem.** Before any feature scales, a human proves the golden path. Shauna recruits from her own students and the Las Vegas mahjong Facebook groups and hand-assembles **10 standing tables at public venues that play 3 weeks in a row.** This creates real tables *this week*, proves the loop, and makes Las Vegas the reference city every other city copies. **This is the highest-leverage action, full stop.** If it cannot be done by hand, no software saves us.
- Success metric: 10 tables playing, 3 consecutive weeks. Effort: high (Shauna's time). Deadline: rolling, start today.

### 2. Ship the wedge: Start a Table + Need a 4th + Claim a Seat (senior-simple). — Owner: Claude/Eng
The minimum software that turns action #1 from a spreadsheet into a self-serving product. A forming-table object with a plain seats counter ("you need 3 more"), three one-question flows, name+phone capture at the moment of action, and an instant text/email confirmation. Built to the senior-first spec (big buttons, no signup to browse). **Without this, tables live in Shauna's head; with it, every table is shareable and self-fills.**
- Success metric: a player can start a table and a stranger can claim a seat, end to end, on a phone. Effort: medium. Deadline: 10-14 days.

### 3. Put share flows on every table (SMS, WhatsApp, Email, Facebook), prewritten. — Owner: Claude/Eng
A started table with 1 of 4 seats is worthless until 3 more arrive. The fastest fill is the host's own friends and her Facebook group. One-tap share with prewritten copy turns each host into a recruiter and broadcasts FindMyMahj into the private spaces where the audience already lives. **This is the loop that compounds: every table formed creates the invitations that form the next.**
- Success metric: share-button click rate per started table; seats filled via shares. Effort: low. Deadline: with #2.

### 4. Recruit the first 10 Founding Ambassadors, teacher-first. — Owner: Shauna-fronted
A teacher arrives with a roster of 8-40 students = instant tables in a new city. Teacher-to-teacher outreach from Shauna (a certified instructor) converts where a marketer's cold email dies. This is how tables form in cities beyond Las Vegas. Templates and the landing-page spec are written in [60-day/01-ambassador-program.md](60-day/01-ambassador-program.md).
- Success metric: ambassadors who each seed a real table in their city. Effort: medium (Shauna's outreach + a simple application form). Deadline: first 10 within 30 days.

### 5. "I Want to Play" demand capture, turned into formed tables. — Owner: Claude/Eng + Shauna
When someone wants to play but there's no table near them, capture name + phone + town (never a dead end) and then **use it**: when several people want to play in the same area, proactively form a table for them (concierge first, automated later). This converts latent demand into active tables and builds the heatmap that tells us where to form next.
- Success metric: tables formed from captured demand. Effort: low-medium. Deadline: capture with #2; matchmaking ongoing.

**Deliberately NOT in the top 5 (and why):** City SEO pages and library/JCC scraping. They grow pageviews and listings, which are not the North Star and pay off on a 60-90 day horizon. They matter, but in the 30-day window measured by *tables formed*, the concierge + wedge + ambassador path wins. SEO is queued for after the wedge ships (see 30-day plan, Week 4).

---

## The Operating Structure (where each strategy lives)

| Area | The decision, in brief | Deep-dive |
|---|---|---|
| **1. Product Strategy** | Not a directory. A community-spined product whose atomic unit is the standing 4-person Table: SEO directory front door, player-to-Table matching (dating insight, no dating skin), weekly-event retention. Concierge-first v0, public-venue-first launch. | [product-model/PRODUCT-MODEL-STRATEGY.md](product-model/PRODUCT-MODEL-STRATEGY.md) |
| **2. Senior-First Experience** | Mobile web app (PWA later, no native yet). 3-button home (Find a Game / Start a Table / I Need Help). Big buttons, plain words, no signup to browse, minimal typing, high contrast. | [senior-mobile-design.md](senior-mobile-design.md) |
| **3. Growth Strategy** | Two compounding loops: the viral table-forming loop (share → fill → invite) and the programmatic-SEO city loop. Demand capture everywhere; no dead ends. | [03-product-growth.md](03-product-growth.md), [04-viral-loops.md](04-viral-loops.md), [60-day/03-viral-systems.md](60-day/03-viral-systems.md), [60-day/05-demand-capture.md](60-day/05-demand-capture.md) |
| **4. SEO Strategy** | State → metro → city → entity pages with an `isIndexable` Tier gate so empty pages never publish (avoids thin-content penalty). Library pages as a novel angle. | [02-seo-domination.md](02-seo-domination.md), [60-day/04-seo-expansion.md](60-day/04-seo-expansion.md) |
| **5. Ambassador Strategy** | One founding ambassador per city, teacher-first (instant liquidity). Badge + status + co-marketing, not cash. Application form + roster sheet, no login system needed for 60 days. | [60-day/01-ambassador-program.md](60-day/01-ambassador-program.md) |
| **6. Supply Acquisition** | Teachers first (rosters), then clubs/organizers, then legally-clean LibCal/JCC public pages, then retirement communities. Sequenced fastest-real-tables-first. | [06-supply-acquisition.md](06-supply-acquisition.md), [60-day/02-supply-acquisition.md](60-day/02-supply-acquisition.md) |
| **7. Competitive Position** | Nobody owns "find a 4th / find a player near me." Bam Good Time has clubs but no player directory; NMJL ignores discovery; Facebook hosts the demand but hides it. That seam is the wedge. | [01-competitive-intelligence.md](01-competitive-intelligence.md) |
| **8. Data & Dashboard** | Collect what enables tables and SEO (geo, recurring schedule, seats). North Star = tables formed; track its leading indicators. | [07-data-strategy.md](07-data-strategy.md), [60-day/06-growth-dashboard.md](60-day/06-growth-dashboard.md) |
| **9. Full plans** | The exhaustive sprint and week-by-week plans. | [08-execution-roadmap.md](08-execution-roadmap.md), [60-day/00-EXECUTION-PLAN-by-week.md](60-day/00-EXECUTION-PLAN-by-week.md) |

---

## 30-Day Plan (compressed, table-focused)

Week 1 trust cleanup is already shipped and live. The 30 days now read:

| Week | Theme | Ships | Table-metric target |
|---|---|---|---|
| **Week 1 (done + start concierge)** | Trust live; begin hand-forming tables | Honesty cleanup (LIVE ✓); Shauna starts concierge-forming LV tables; homepage reframed to 3 big buttons | 3 LV tables forming |
| **Week 2** | Build the wedge | Start a Table + Need a 4th + Claim a Seat (senior-simple) + share flows + email/phone capture on every empty state | 10 LV tables; wedge live |
| **Week 3** | Supply via ambassadors | Ambassador application page + first 10 teacher ambassadors; each seeds a table in their city | 10 ambassadors; tables in 5+ cities |
| **Week 4** | Expand the surface | City pages behind the Tier gate (only where a real table/listing exists); growth dashboard live; "I Want to Play" matchmaking from captured demand | 25+ tables across 10+ cities |

**30-day targets (North-Star-aligned):** 25+ active tables formed, across 10+ cities, with 10+ founding ambassadors and 500+ captured contacts as the *fuel*, not the goal.

---

## Weekly Operating Cadence

- **Monday (15 min): Table Review.** Read the dashboard: tables formed this week, tables that filled to 4, tables that played, cities with ≥1 table, new ambassadors, contacts captured. Decide the week's one priority.
- **Tue-Thu: Build + Recruit in parallel.** Claude ships the wedge/SEO; Shauna runs ambassador + concierge table-forming.
- **Friday (10 min): Fill check.** Which forming tables still need a 4th? Push them (share nudge, waitlist text, ambassador ask).
- **Continuous:** every new "I want to play" contact is a table-formation lead, not a list entry.

Dashboard top line (the only numbers that matter):
```
        ACTIVE TABLES FORMED:  __    (▲ from last week)
   tables that filled to 4:    __
   tables that actually played: __
   cities with ≥1 live table:  __
   founding ambassadors:       __
   contacts captured (fuel):   __
```

---

## What we are NOT doing (guardrails)
No monetization. No native app. No in-app chat, reviews, or complex profiles. No signup wall before browsing. No filters beyond time-of-day. No vanity-metric optimization (pageviews, raw listing counts) at the expense of tables formed. No scraping Facebook. No publishing empty SEO pages.
