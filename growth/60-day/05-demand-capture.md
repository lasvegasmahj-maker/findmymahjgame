I now have the complete picture of the codebase: the real schema, the inquiry/notify plumbing, the admin dashboard with its counts mechanism, and the state-page empty states. I have everything I need to write the demand-capture spec grounded in the actual ground truth. Let me produce the deliverable.

# Demand Capture System Spec — FindMyMahj 60-Day Sprint

Grounded in the actual codebase (not schema.md, which is aspirational; the real tables are in `supabase/migration.sql`). Every spec below names exact files, tables, columns, triggers, stored data, and follow-up. All copy is final, drop-in, and CLAUDE.md-compliant (no em/en dashes, ASCII hyphens, no fabricated counts, no "every spring" month names).

---

## 0. Foundation: one table powers all four systems

Everything (email collection, waitlists, empty-city, traveling-player) writes to ONE new table so the dashboard "captured contacts" metric is a single source of truth. Reuse the existing service-role insert pattern from `app/actions/submit-inquiry.ts`.

### New migration: append to `supabase/migration.sql`

```sql
-- CAPTURED CONTACTS (email + demand signal, account-less)
CREATE TABLE IF NOT EXISTS captured_contacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  name text,
  source text NOT NULL DEFAULT 'general',
    -- 'waitlist' | 'empty_city' | 'empty_state' | 'traveling_player'
    -- | 'card_alert' | 'footer' | 'state_alert' | 'start_a_table'
  city text,
  state text,                 -- 2-letter abbr, matches player_listings.state
  dest_city text,             -- traveling-player destination
  dest_state text,
  travel_start date,
  travel_end date,
  trip_type text,             -- 'snowbird' | 'cruise' | 'vacation' | 'relocating'
  notes text,
  welcome_sent boolean NOT NULL DEFAULT false,
  unsub boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_captured_state ON captured_contacts (state);
CREATE INDEX IF NOT EXISTS idx_captured_source ON captured_contacts (source);
CREATE INDEX IF NOT EXISTS idx_captured_created ON captured_contacts (created_at DESC);

-- De-dupe: one row per email+source+city so refreshes don't inflate the metric
CREATE UNIQUE INDEX IF NOT EXISTS uniq_captured
  ON captured_contacts (email, source, COALESCE(city,''), COALESCE(dest_city,''));

ALTER TABLE captured_contacts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can submit a captured contact"
  ON captured_contacts FOR INSERT WITH CHECK (true);
-- No public SELECT policy. PII is admin-only via service role, matching the
-- inquiries table pattern. RLS default-denies SELECT to anon.
```

### One server action: `app/actions/capture-contact.ts` (new)

Mirror `submit-inquiry.ts` exactly (same client, same fire-and-forget notify). Use `upsert` with `onConflict` so a double-submit is idempotent and never double-counts the metric.

```ts
"use server";

import { createClient } from "@supabase/supabase-js";
import { isValidEmail, clampText } from "@/lib/sanitize";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function captureContact(formData: FormData) {
  const email = formData.get("email");
  if (!isValidEmail(email)) return { success: false, error: "Enter a valid email." };

  const row = {
    email: (email as string).toLowerCase().trim(),
    name: clampText(formData.get("name"), 80) || null,
    source: clampText(formData.get("source"), 40) || "general",
    city: clampText(formData.get("city"), 80) || null,
    state: clampText(formData.get("state"), 2) || null,
    dest_city: clampText(formData.get("dest_city"), 80) || null,
    dest_state: clampText(formData.get("dest_state"), 2) || null,
    travel_start: (formData.get("travel_start") as string) || null,
    travel_end: (formData.get("travel_end") as string) || null,
    trip_type: clampText(formData.get("trip_type"), 20) || null,
    notes: clampText(formData.get("notes"), 500) || null,
  };

  const { error } = await supabase
    .from("captured_contacts")
    .upsert(row, { onConflict: "email,source,city,dest_city", ignoreDuplicates: false });

  if (error) return { success: false, error: "Something went wrong. Please try again." };

  const where = [row.city, row.dest_city, row.state, row.dest_state].filter(Boolean).join(" / ");
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  fetch(`${baseUrl}/api/notify`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      type: "inquiry",
      subject: `New captured contact (${row.source}): ${where || row.email}`,
      body: `${row.email}\nSource: ${row.source}\n${where}\n${row.notes || ""}`,
    }),
  }).catch(() => {});

  return { success: true };
}
```

Note: `lib/sanitize.ts` already exports `isValidEmail` and `clampText`, and `app/api/notify/route.ts` already allows `type: "inquiry"`. No notify changes needed.

---

## 1. EMAIL COLLECTION

Capture intent at every high-exit moment. Six placements, each with its own `source` value so the dashboard can attribute which surface drives growth.

### 1A. Placements, triggers, data stored

| # | Placement | Trigger | `source` | Stored beyond email |
|---|-----------|---------|----------|---------------------|
| 1 | Global footer strip (every page) | User scrolls to footer | `footer` | none |
| 2 | Post-connect upsell (after a player clicks "Connect" on a state page and submits) | Connect form success state | `state_alert` | `state` |
| 3 | NMJL card alert bar (homepage + every state page, dismissible) | Page view | `card_alert` | `state` if on a state page |
| 4 | Empty player tab (state page) | `players.length === 0` | `empty_state` | `state` |
| 5 | Empty city (city selected, no listings in it) | `filteredPlayers.length === 0` and a specific city is selected | `empty_city` | `city`, `state` |
| 6 | "Start a Table" exit-intent (state pages, fires once) | mouseleave to top of viewport OR 25s dwell, sessionStorage-gated | `start_a_table` | `state` |

### 1B. The value exchange (what they get for the email)

Do NOT say "join our newsletter." Three concrete promises, used verbatim across placements:

1. "We will email you the moment a mahjong game opens up near you."
2. "Get the new NMJL card alert the day it drops, plus a printable cheat sheet."
3. "Weekly: one new place to play within driving distance."

### 1C. Footer email form (placement 1) — drop-in spec

Component: `components/CaptureBar.tsx` (new), rendered in the shared footer/layout.

Copy:
- Eyebrow: `STAY IN THE GAME`
- Headline: `Get a heads-up when a game opens near you`
- Subtext: `One email a week, max. New games, open play, and the NMJL card alert the day it drops. No spam, unsubscribe anytime.`
- Input placeholder: `you@email.com`
- Button: `Notify me`
- Hidden field: `<input type="hidden" name="source" value="footer" />`
- Success replace-in-place: `You're on the list. Watch your inbox for the next game near you.`
- Error inline: `Hmm, that email didn't look right. Try again?`

### 1D. NMJL card alert bar (placement 3) — drop-in spec

Top-of-page dismissible bar. The card is the single highest-intent hook in mahjong; capture it. Today is 2026-06-07, so the current-year card has already dropped; this bar collects for next year and for the printable cheat sheet now.

Copy (pre-drop, used most of the year):
- `The new NMJL card drops every spring. Want the alert the day it lands? [email] [Alert me]`

Copy (the week it drops, owner flips a flag):
- `The new NMJL card is here. Want our free printable cheat sheet? [email] [Send it to me]`

Success: `Done. We'll email you the second the new card is announced.`
Dismiss persists via `localStorage` key `fmg_card_bar_dismissed`.

### 1E. Lifecycle / welcome sequence

Account-less and low-ops: a 4-email sequence sent via the existing Resend integration (`app/api/notify/route.ts` already wires Resend). Cadence is tied to the weekly-game promise and the card. Trigger the sequence with a Vercel Cron hitting a new `app/api/lifecycle/route.ts` that selects `captured_contacts WHERE welcome_sent = false` and any contacts at day-N intervals, then flips `welcome_sent`.

Email 0 (immediate, on capture):
- Subject: `You're in. Here's how to find your next mahjong game.`
- Body:
  - `Welcome to Find My Mahj Game. You told us you want to play, so here's the fastest way to get to a table.`
  - `1. See who's playing in your area: [your state page link]`
  - `2. Not enough players near you yet? Start a table. Create a free listing in 60 seconds and let local players find you: [/list-my-game]`
  - `3. Reply to this email and tell us your city. We're adding new places to play every week and we'll prioritize yours.`
  - Sign-off: `See you at the table, The Find My Mahj Game team`

Email 1 (day 3):
- Subject: `The fastest way to find a 4th`
- Body: short. Pitch "Start a Table": `The players are out there, they just can't find each other yet. The one move that works: post a free listing so the other three find you.` CTA `/list-my-game`. Soft cross-link to lasvegasmahj.com for lessons if `state = NV`.

Email 2 (day 7, and the recurring weekly beat):
- Subject (template): `New near {city}: one place to play this week`
- Body: one venue/event/player listing pulled live from the contact's `state`. If zero in-state, fall back to "here's how to start your own." This is the weekly cadence the value exchange promised. Keep it to one item so it stays a habit, not a digest.

Email 3 (card-triggered, not day-based): fires only when the card-drop flag flips:
- Subject: `The new NMJL card is out. Here's your cheat sheet.`
- Body: link to the printable, link to lessons (lasvegasmahj.com), CTA to find a game to practice the new card.

Unsubscribe: every email footer links to `/api/unsub?token=...` using the existing HMAC helper (`lib/hmac.ts`) which the codebase already standardizes on for one-click email actions. Sets `unsub = true`. CLAUDE.md mandates HMAC-signed one-click email tokens, so reuse that, do not invent a new scheme.

---

## 2. WAITLISTS

Reuse `captured_contacts` with `source = 'waitlist'`. The "data model {email, city, state}" from the brief maps directly to columns already added. No separate table.

### 2A. Where shown

- Homepage map: clicking a state with zero real listings opens a waitlist instead of a dead state page tease. The homepage already shows real per-state counts (just shipped), so wire the click on a 0-count state to the waitlist modal.
- Every state page header, when `players.length === 0`: a "Join the {state} waitlist" inline form (this is the same surface as 1D/4, but framed as a waitlist when the whole state is empty).
- A standalone `/waitlist` page linked from the footer and the empty states, for direct sharing in Facebook mahjong groups.

### 2B. Trigger / data / follow-up

- Trigger: submit on any waitlist surface.
- Data stored: `{ email, city (optional, free-text), state (2-letter), source: 'waitlist' }`.
- Follow-up: enters the lifecycle sequence (Email 0 immediately). When that state crosses Minimum Viable Liquidity (5 published listings, per prior strategy), the owner runs a one-click "notify waitlist" action from the dashboard that sends: 
  - Subject: `{State} just hit 5 mahjong games. Come find yours.`
  - Body: `You asked to know when mahjong picked up in {state}. It's happening. There are now real players and games near you. Take a look: [state page]. And if your city still isn't covered, start a table and the rest will follow.`

### 2C. Waitlist form copy (standalone `/waitlist`)

- H1: `Be first to know when mahjong starts near you`
- Sub: `We're building the map of every mahjong game in America, city by city. Tell us where you want to play and we'll email you the moment there's a table near you.`
- Fields: Email (required), City (optional), State (dropdown, required).
- Button: `Add me to the waitlist`
- Success: `You're on the {state} waitlist. We'll email you the moment games open up near you. Want to make it happen faster? Start your own table: [Create my free listing]`

---

## 3. EMPTY-CITY / EMPTY-STATE CAPTURE

This is the highest-leverage capture: a would-be bounce becomes both an email AND a demand signal that drives the city-coverage roadmap. Integration point is `app/states/[state]/client.tsx` at the existing empty-state block (lines 265-278) and the city filter (`selectedCity`, lines 116-167).

### 3A. Two distinct empty states

The current code only handles "no players in the whole state" (line 269). Add a second case: a specific city is selected and `filteredPlayers.length === 0` while the state has players elsewhere. Different copy, different `source`, different demand signal.

### 3B. Empty STATE (replace existing block at lines 266-277)

Keep the structure and styling, add the capture form:

- Headline: `No mahjong games listed in {stateData.name} yet`
- Sub: `You found us early. Be the player who starts it. Drop your email and we'll tell you the second someone else in {stateData.name} is looking for a game, and we'll prioritize adding real games near you.`
- Primary CTA (unchanged): `Create My Free Listing` to `/list-my-game`
- Secondary, the capture: inline email field
  - Hidden: `source=empty_state`, `state={stateData.abbr}`
  - Button: `Tell me when it's live`
  - Success (replace block in place): `You're in. The moment mahjong gets going in {stateData.name}, you'll be the first to know. Want it to happen this week instead of someday? Start a table: [Create my free listing]`

### 3C. Empty CITY (new block, shows when a specific city is selected and that city has zero listings)

- Headline: `No games in {selectedCity} yet, but you're not alone`
- Sub: `Other players are searching {selectedCity} too. They just can't find each other. Leave your email and the moment a game opens in {selectedCity}, we'll connect you. Or be the spark: start a table and let them find you.`
- Hidden: `source=empty_city`, `city={selectedCity}`, `state={stateData.abbr}`
- Button: `Notify me about {selectedCity}`
- Success: `Got it. {selectedCity} is on our radar now. We'll email you the moment a game opens there.`

### 3D. Demand signal -> coverage roadmap

This is the payoff. Every `empty_city` and `empty_state` row IS a vote. The dashboard surfaces a ranked "Cities to seed next" list: `SELECT city, state, count(*) FROM captured_contacts WHERE source IN ('empty_city','empty_state','waitlist','traveling_player') GROUP BY city, state ORDER BY count(*) DESC`. The top cities are exactly where the owner should apply the legally-clean supply playbook (LibCal/JCC public pages) to hit Minimum Viable Liquidity = 5. Demand literally tells supply where to go.

---

## 4. TRAVELING-PLAYER CAPTURE

The snowbird/cruise angle is a unique wedge: a player in Minnesota wanting a game in Naples FL this winter is BOTH a captured contact and a demand signal for a city they don't live in. This is how FindMyMahj covers destination cities before locals even arrive.

### 4A. Where shown

- A dedicated `/traveling` page ("Playing mahjong while you travel?"), linked from the footer and from every state page's events tab.
- A compact "Traveling here?" card injected into destination state pages (FL, AZ, NV, SC, the snowbird and cruise-departure states).

### 4B. Form: destination + dates

Fields and the `captured_contacts` columns they map to:
- Email (required) -> `email`
- Destination city (required, free-text) -> `dest_city`
- Destination state (required, dropdown) -> `dest_state`
- Arriving (date) -> `travel_start`
- Leaving (date) -> `travel_end`
- Trip type (radio): Snowbird (whole season) / Cruise / Vacation / Relocating -> `trip_type`
- Hidden: `source=traveling_player`

### 4C. Copy

- H1: `Don't leave your mahjong game at home`
- Sub: `Heading somewhere warm for the winter, or off on a cruise? Tell us where and when. We'll connect you with open play and players at your destination, so you never miss a week at the table.`
- Snowbird microcopy under "Trip type": `Snowbirds: tell us your whole season. We'll line up games near your winter place before you arrive.`
- Cruise microcopy: `Cruisers: a surprising number of sailings have mahjong groups. We'll tell you which ports and ships have players.`
- Button: `Find me a game there`
- Success: `You're set. We'll email you mahjong games in {dest_city} before {travel_start}. Traveling somewhere else too? Add another trip: [link back]`

### 4D. Trigger / data / follow-up -> coverage roadmap

- Trigger: form submit on `/traveling` or the destination card.
- Data: full row above. The pair `{dest_city, dest_state, travel_start}` is the key signal.
- Follow-up: 
  1. Immediate: Email 0 variant confirming the destination.
  2. Time-based: a "trip-approach" email fired by the same lifecycle cron 14 days before `travel_start`, with live listings in `dest_state`/`dest_city`, or the start-a-table fallback.
- Roadmap impact: aggregate `dest_city` counts reveal which destination cities have inbound seasonal demand. Combined with `travel_start` dates, the owner gets a calendar: "Naples FL has 18 inbound snowbirds arriving Nov-Dec, seed it by October." This turns scattered travel intent into a dated city-coverage plan and feeds the same "Cities to seed next" dashboard list as section 3D.

---

## 5. DASHBOARD: "Captured Contacts" metric

Wire all of the above into the existing admin dashboard (`app/admin/page.tsx`, data route `app/api/admin/data/route.ts`).

### 5A. New tab + metric

Add a `contacts` tab to the `Tab` type (line 5) and the tab array (lines 301-307): `{ id: "contacts", label: "Captured", icon: "✉️" }`. Add `contacts: "captured_contacts"` to `TAB_TABLE` in the data route (line 10-16).

### 5B. Headline counter (top of dashboard)

Add to the data route's counts block (lines 38-41), running in the same `Promise.all`:

```ts
supabase.from("captured_contacts").select("id", { count: "exact", head: true }).eq("unsub", false),
supabase.from("captured_contacts").select("id", { count: "exact", head: true })
  .eq("unsub", false).gte("created_at", new Date(Date.now() - 7*864e5).toISOString()),
```

Return `counts.capturedTotal` and `counts.capturedThisWeek`. Render a stat card at the top of `app/admin/page.tsx`: `{capturedTotal} captured contacts  (+{capturedThisWeek} this week)`. This is the single KPI tile that proves demand-capture is working, aligned with the network-effects/user-growth priority over revenue.

### 5C. Captured tab contents

Two views in the tab:
1. A "Cities to seed next" ranked block (the section 3D / 4D query) at the top: city, state, signal count, soonest travel date. This is the owner's weekly action list.
2. The raw contacts table below: email, source (badge), city/state or destination, date. Reuse the existing `StatusBadge` styling and `formatDate`. Add a one-click "Notify this state's waitlist" button per state group that calls a new `/api/admin/notify-waitlist` endpoint (gated by `verifyAdminSessionToken`, same as the data route at line 19).

### 5D. Empty state for the tab (matches existing pattern)

`No captured contacts yet. They'll show up here when someone joins a waitlist, asks about an empty city, or signs up to find a game while traveling.`

---

## 6. Build order (fits the 60-day sprint, low-ops first)

1. Migration + `capture-contact.ts` action + dashboard tab/metric (foundation, half a day).
2. Empty-state and empty-city capture in `client.tsx` (highest leverage, the bounce-to-signal conversion).
3. Footer `CaptureBar` + NMJL card bar (sitewide reach).
4. `/waitlist` and `/traveling` standalone pages + destination cards.
5. Lifecycle cron (`/api/lifecycle`) + Resend templates + HMAC unsubscribe.

Flag-gate the card bar and exit-intent OFF by default per CLAUDE.md ("new user-facing surfaces ship flag-gated OFF until confirmed").

---

## Key files (all absolute)

- Schema to extend: `/Users/shaunabruckman/Projects/findmymahjgame/supabase/migration.sql`
- New action: `/Users/shaunabruckman/Projects/findmymahjgame/app/actions/capture-contact.ts` (clone of `/Users/shaunabruckman/Projects/findmymahjgame/app/actions/submit-inquiry.ts`)
- Notify (no change needed, already allows `type: "inquiry"`): `/Users/shaunabruckman/Projects/findmymahjgame/app/api/notify/route.ts`
- Empty-state / empty-city integration point: `/Users/shaunabruckman/Projects/findmymahjgame/app/states/[state]/client.tsx` (empty block lines 266-277; city filter lines 116-167)
- Dashboard: `/Users/shaunabruckman/Projects/findmymahjgame/app/admin/page.tsx` (Tab type line 5, tab array lines 301-307, counts banner lines 260-282)
- Dashboard data + counts: `/Users/shaunabruckman/Projects/findmymahjgame/app/api/admin/data/route.ts` (TAB_TABLE line 10, counts Promise.all lines 38-41)
- Sanitize helpers reused: `/Users/shaunabruckman/Projects/findmymahjgame/lib/sanitize.ts` (`isValidEmail`, `clampText`)
- HMAC for unsubscribe: `/Users/shaunabruckman/Projects/findmymahjgame/lib/hmac.ts`
- New pages: `/Users/shaunabruckman/Projects/findmymahjgame/app/waitlist/page.tsx`, `/Users/shaunabruckman/Projects/findmymahjgame/app/traveling/page.tsx`
- New components: `/Users/shaunabruckman/Projects/findmymahjgame/components/CaptureBar.tsx`, `/Users/shaunabruckman/Projects/findmymahjgame/components/CardAlertBar.tsx`
- New cron route: `/Users/shaunabruckman/Projects/findmymahjgame/app/api/lifecycle/route.ts`

Two important ground-truth notes: (1) `schema.md` describes a `connectors/connections/referrals` model that does NOT exist; the live tables are `player_listings`, `venue_listings`, `event_listings`, `ad_listings`, `inquiries`, `admins` per `supabase/migration.sql`. All specs above use the real tables. (2) The `growth/` reference docs cited in the task do not exist on disk on this branch (`pricing-group-size`/`honesty-cleanup`), so this spec is self-contained rather than cross-referencing them.
