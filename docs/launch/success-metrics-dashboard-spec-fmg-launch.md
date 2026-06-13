# Success metrics dashboard spec (FMG launch)

# FMG Success Metrics Dashboard Spec

Version 1.0. Built for launch (T minus ~10 days). Plain language, no jargon.

## The point of this page

Five numbers tell you whether Find My Mahj Game is working. Everything else is noise for launch. This spec names the five, defines each one so it cannot be argued two ways, and tells you exactly where to look at it today. Where a number is not yet on screen, it says what small build puts it there (the page already exists; this is a slice, not a new tool).

One rule above all: when a number could be counted two ways, write the smaller one. A scorecard you trust beats a scorecard that looks good.

---

## The five numbers

| # | Number | What it answers | Where it lives today | Refresh |
|---|--------|-----------------|----------------------|---------|
| 1 | WPGC (Weekly Player-Games Confirmed) | Did real games actually happen this week because of us? | /admin/metrics (Played count today; weekly slice is the one small build below) | Live on page load |
| 2 | Confirmation rate | Of the tables we asked, what share said "yes, we played"? The guardrail on WPGC. | Computable now from /admin/metrics data; surface as a tile (build below) | Live on page load |
| 3 | Signups | Are new people joining (newsletter and the Bench waitlist)? | Mailchimp audience (newsletter) + /admin/heatmap (Bench waitlist by city) | Mailchimp live; heatmap on page load |
| 4 | Listings | Are we becoming the source of truth (live teachers, venues, events, players)? | /admin per tab (Players, Venues, Events) + the live public pages | Live on page load |
| 5 | Claims | Are listing owners taking ownership of their listing? | listing_claims table (status = claimed); surface a count tile (build below) | Live once surfaced |

WPGC is the North Star. The other four are the supporting cast. If you only have 60 seconds, read WPGC and its confirmation rate.

---

## 1. WPGC (Weekly Player-Games Confirmed)

This is the North Star. It is the one number to protect.

- What counts: a table marked status = full that received the "did your game happen?" email and answered "Yes, we played" in the last 7 days. One table, one game, counts once per confirmation. A scheduled game does not count. A filled table that never confirmed does not count.
- Where the data is: the tables table. The flag is tables.played = true, stamped with tables.played_at when a player taps "Yes, we played" (app/api/tables/played/route.ts). The ask itself goes out daily by cron (app/api/cron/ask-played/route.ts) to full tables that have had at least 3 days to play, stamping tables.asked_played_at so no table is asked twice.
- Where you see it today: /admin/metrics shows a "Games Played" count in the North Star funnel (Created -> Filled -> Played -> Recurring). That count is all-time, not the weekly slice.
- The small build to get true WPGC: on /admin/metrics, add one tile that counts tables where played = true AND played_at is within the last 7 days. The page and the data already exist; this is a date filter on a number already on screen.
- Target shape, not a promise: in the first weeks the absolute number will be small and that is fine. Watch the trend (this week vs last week), not the size.

Honesty note: do not report "games played" from seed data in lib/states-data.ts. WPGC counts only real confirmed tables. If the number is zero, the number is zero. Zero is honest and tells you exactly what to fix (get filled tables to actually meet).

---

## 2. Confirmation rate (the guardrail welded to WPGC)

WPGC can be gamed by asking more tables. The confirmation rate keeps it honest. Per RULINGS.md, the guardrail is at or above 50 percent.

- What counts: of the tables we asked in the window (asked_played_at is set), the share that answered "yes" (played = true). A "no" or no answer counts against the rate.
- Formula: confirmation rate = (tables with played = true) / (tables with asked_played_at set), over the same 7-day window as WPGC.
- Where the data is: same three fields on the tables table: played, played_at, asked_played_at. No new data needed.
- Where you see it today: not yet on screen as a single tile. /admin/metrics has the raw Played count but not the asked denominator surfaced.
- The small build: add one tile next to WPGC that divides confirmed by asked for the last 7 days and shows it as a percent, colored red if it drops below 50 percent. Same query family already running on that page.
- How to read it: a high WPGC with a confirmation rate under 50 percent means we are filling tables that do not actually play. That is a coordination problem (the gap between a full table and a real game), and it is the most important thing to fix before scaling.

---

## 3. Signups

Two streams, kept separate because they mean different things.

### 3a. Newsletter signups
- What counts: distinct, still-subscribed email addresses on the Mailchimp audience. Not bounces, not duplicates, not yourself.
- Where the data is: every signup posts to /api/subscribe (app/api/subscribe/route.ts), which adds the address to Mailchimp when the keys are set and always emails hello@findmymahjgame.com so no signup is ever lost. "Member Exists" still counts as on the list.
- Where you see it: the Mailchimp audience dashboard (total subscribers). Until the Mailchimp key and Audience ID are in Vercel, signups arrive only as emails to hello@; count those by hand in the interim and reconcile once Mailchimp is live.

### 3b. Bench / waitlist signups (want to play)
- What counts: distinct people who asked to be placed at a table when one forms nearby. This is real demand by city, the leading indicator of where to start the next table.
- Where the data is: every "want to play" submission inserts a row into play_requests (app/api/want-to-play/route.ts).
- Where you see it today: /admin/heatmap. It shows each city with its count of people who want to play and how many tables have started there ("12 want to play, 2 tables started"). This is your build-the-next-table map.

Read these two together: newsletter signups measure reach (can we distribute), Bench signups measure concentrated demand (where do we light the next table).

---

## 4. Listings

Listings prove we are the source of truth for American Mahjong in our launch markets. Count live, public, real listings only.

- What counts: distinct listings with status = published that are live on the public site. Count a teacher, venue, or event once even if it appears in several places. A weekly recurring open play is one event, not four. Pending and rejected rows do not count.
- Where the data is: three Supabase tables, all gated to status = published with founder approval: player_listings, venue_listings, event_listings. Teachers currently derive from venue_listings (instructor type), with Nevada excluded on the public teachers page for the Las Vegas guardrail.
- Where you see it today:
  - Live public count: the public pages themselves (/events, /teachers, /states, and venue metadata).
  - Admin view: /admin, per tab (Players, Venues, Events). Each tab lists rows with their status badge, so you can see published versus pending at a glance.
  - Pending backlog: /admin shows a banner with the count of pending listings still to review (from /api/admin/data, which returns pending counts per table). Driving pending to zero before launch is the listings task.
- The honest definition for the weekly review: count what is published and live, not what is staged. The repo notes 552 records staged pending_review; those are not listings until approved and live.

Seed-data rule: lib/states-data.ts is seed data. Never report seed entries as real players, venues, or events, and never state a count drawn from seed data as if it were real inventory.

---

## 5. Claims

A claim is a listing owner (a teacher, venue, or event host) taking ownership of her listing through the emailed magic link. Claims are the early proof that the people behind the listings are engaged, not just scraped.

- What counts: distinct listings with a row in listing_claims at status = claimed. One listing, one claim. A second person trying to claim an already-claimed listing is blocked (it routes to a human), so the count does not double.
- Where the data is: the listing_claims table (supabase/migrations/2026-06-12-claims-freshness.sql), written by /api/claim (app/api/claim/route.ts) when an owner submits the claim form. A claim also stamps confirmed_active_at on the listing, so every claim doubles as a freshness signal.
- Where you see it today: claim events email hello@findmymahjgame.com in real time (subject line "Claim: [name]"), and proposed edits land in /admin/edits. There is no single claim count on screen yet.
- The small build: add a "Claims" tile (count of listing_claims rows where status = claimed) to /admin/metrics, optionally split by table. Trivial query on a table that already exists.
- How to read it: claims rising means the supply side is alive and owners are leaning in. Claims flat while listings climb means we are building a directory nobody has stepped forward to own; the fix is the claim-invite outreach, not more scraping.

---

## Where each number is visible, at a glance

| Number | Primary surface | Status of that surface |
|--------|-----------------|------------------------|
| WPGC (weekly) | /admin/metrics | Built (all-time Played count); needs a 7-day tile |
| Confirmation rate | /admin/metrics | Data present; needs a percent tile with the 50 percent guardrail |
| Newsletter signups | Mailchimp audience | Live once Mailchimp key + Audience ID are in Vercel |
| Bench signups by city | /admin/heatmap | Built and live |
| Listings (published) | Public pages + /admin tabs | Built and live |
| Pending listings backlog | /admin banner | Built and live |
| Claims | hello@ inbox + /admin/edits | Built; needs a count tile on /admin/metrics |

The build column is honest on purpose. Three of the five (weekly WPGC, confirmation rate, total claims) are computable from data we already capture and need only a tile added to a page that already exists. None requires a schema change or a new tool.

---

## The one build to do before launch

Add three tiles to the existing /admin/metrics page, at the top, above the current funnel:

1. WPGC, this week: count of tables where played = true and played_at within the last 7 days.
2. Confirmation rate, this week: (played = true) / (asked_played_at set) over the last 7 days, shown as a percent, red below 50 percent.
3. Claims: count of listing_claims rows where status = claimed.

That single change turns /admin/metrics into the launch dashboard: open one page, read the North Star and its guardrail at the top, the funnel below, attribution at the bottom. Signups (Mailchimp + /admin/heatmap) and listings (/admin tabs + public pages) are one click away and already live.

---

## The 5-minute launch-week ritual

Same time, three times a week, while the launch is hot:

1. Open /admin/metrics. Read WPGC (this week) and the confirmation rate. If the rate is under 50 percent, that is the week's problem: filled tables are not turning into real games. Call the hosts.
2. Open /admin/heatmap. Find the city with the most "want to play" and the fewest tables started. That is where to light the next table.
3. Open /admin. Clear the pending listings banner to zero. Note new claims from the hello@ inbox.
4. Write one line: the WPGC number, and the single thing you will do next to raise it.

One sentence to say out loud each time: "How many real mahjong games happened this week because of us, and did at least half the tables we asked confirm?"

---

## What this dashboard deliberately leaves out

For launch, ignore revenue, pageviews, and vanity totals. They do not tell you whether the community is real. Add the deeper measures (PTWM, the third-game conversion, the founder-assisted versus organic ratio, per-ambassador scorecards) only after WPGC is consistently above zero and climbing. Those are growth-phase numbers, defined in RULINGS.md and the growth/ambassadors scorecards, and they wait until there is a real signal to deepen.
