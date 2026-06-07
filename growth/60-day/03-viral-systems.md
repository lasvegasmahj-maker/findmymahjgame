I now have full ground truth: the real `player_listings` schema, the orphaned `share-preview` page with its exact existing copy and share buttons, and the list/connect flows. I have everything needed to specify each of the five systems concretely. Let me write the deliverable.

---

# VIRAL GROWTH SYSTEMS — FindMyMahj 60-Day Build Spec

Built on `growth/04-viral-loops.md` (Workstream 4) and verified against the live codebase. Where the doc gave strategy, this gives the buildable feature: data model, trigger, exact copy, and the one metric per system. Every schema column, route, and copy block below is written against the **real** tables (`player_listings` etc.) and the **real** orphaned `share-preview` page, not the aspirational `connectors/referrals` model in `schema.md` (which does not exist in `migration.sql`).

## Ground-truth constraints that shape all 5 systems
- **Account-less.** `player_listings` has no `user_id`/auth. Identity = the row + an emailed token. Every loop is link-and-email based, which is faster to ship and fits the non-technical, low-ops mandate.
- **The share page is already 80% built but orphaned.** `app/share-preview/page.tsx` is fully styled with copy-link, caption, Facebook/X/email buttons, using MOCK_PLAYER. `list-my-game-client.tsx` dead-ends on a "browse" success screen and never routes to it. Connecting these two files is the single highest-leverage action in the repo.
- **"Connect" today only emails the admin**, not the listed player (`status` inquiry row to `hello@findmymahjgame.com`). Loops 2 and 5 require relaying to the player server-side (look up `contact_email` server-only, relay via Resend, never expose PII — preserves the RLS guarantee).
- **No referral/attribution table exists.** Attribution lives in the URL (`?via=code`) + one column. No new table needed for v1.

---

## SPEED-TO-IMPACT RANKING (build in this order)

| Rank | System | Why this order | Effort | Time to first signal |
|------|--------|----------------|--------|---------------------|
| **1** | **Share Links** (per-listing, multi-channel) | The page already exists. Wire it to real data, fix the channels, ship the substrate every other loop reuses. | XS | 3-5 days |
| **2** | **Start a Table** (forming game, seats counter) | The mahjong-native unit. Turns one lister into a 4-person acquisition and populates cold cities. One new table + reuse of #1. | S-M | 2-3 weeks |
| **3** | **Need a 4th** (urgent seat-fill, time decay) | Highest emotional pull + deadline-driven sharing. One boolean + one alert path + the connect-relay fix. | S | 2-3 weeks |
| **4** | **Referral Loops** (referral → listing → referral) | Mostly the attribution plumbing from #1 plus a status incentive. Compounds #1 and #2. | S | 3-4 weeks |
| **5** | **Invite Friends** (invite your existing table/group) | Bulk-invite UX on top of #1's links + #2's table entity. Reward = "complete table" badge. | S | 4-5 weeks |

Rationale for the order vs. the doc's ranking: Share Links is split out as #1 because it is the literal asset already in the repo and is the dependency for 2, 4, and 5. "Start a Table" is promoted above "Need a 4th" because the seats-counter card is the reusable container that both the urgency badge (System 3) and the bulk invite (System 5) hang off of, so building the entity first avoids rework.

---

## SYSTEM 1 — SHARE LINKS (per-listing, multi-channel, attributed)

The reusable sharing substrate. Every other system emits a share link in this format.

### Data model
Add to `player_listings` (and later `table_listings`, System 2):
```sql
ALTER TABLE player_listings
  ADD COLUMN share_code text UNIQUE,          -- e.g. 'mahj-7gk2', generated on insert
  ADD COLUMN referred_by text,                 -- the share_code of the inviter, null = organic
  ADD COLUMN referral_count int DEFAULT 0;     -- denormalized count of listings carrying this row's code in referred_by
```
`share_code` is generated server-side on insert (8 chars, lowercase, `mahj-` prefix). No new table.

### Trigger
On successful submit in `list-my-game-client.tsx`, **stop dead-ending**. Route to `/listed/[share_code]` (the real, data-wired version of the orphaned `share-preview` page), passing the real `name`, `city`, `state`, `skill_level`, `availability`, `bio`, `avatar_color` instead of `MOCK_PLAYER`. The orphaned page becomes the live success page.

### The share URL format (one format, used everywhere)
```
https://findmymahjgame.com/states/florida?via=mahj-7gk2&utm_source=sms&utm_medium=share&utm_campaign=player_share
```
- `?via=` is the attribution key. The state page reads it, writes it to a 30-day cookie, and on the next listing submit copies it into `referred_by`. This is full referral attribution with zero auth (powers System 4).
- `utm_*` for analytics only. The `via` code is the source of truth for attribution because UTMs get stripped by some apps.

### Channels (FIX the existing buttons)
The current page has Facebook, X, Email. This audience (NMJL skews older, female, coordinates over group texts and Facebook Groups) does not use X. **Replace X with SMS and WhatsApp; keep Facebook and Email.** Final channel set: **SMS, WhatsApp, Facebook, Email.**

### ACTUAL share copy, per channel
Variables are filled server-side from the real row. Example shown for Sandra in Henderson, NV.

**SMS** (`sms:?&body=`):
> Found a spot for us to find a mahj game. I just listed myself in Henderson on Find My Mahj Game (free). If you play near here, look for me: https://findmymahjgame.com/states/nevada?via=mahj-7gk2&utm_source=sms&utm_medium=share&utm_campaign=player_share

**WhatsApp** (`https://wa.me/?text=`):
> I just put myself on Find My Mahj Game so players near Henderson, NV can find me. It is a free directory for finding a mahjong game in your area. Find me here: https://findmymahjgame.com/states/nevada?via=mahj-7gk2&utm_source=whatsapp&utm_medium=share&utm_campaign=player_share

**Facebook** (`https://www.facebook.com/sharer/sharer.php?u=`, paste-caption for Groups since FB strips `quote`):
> Calling all mahjong players near Henderson, NV. I just listed myself on Find My Mahj Game, a free directory to find a game in your area. If you are looking for a table, find me here.

**Email** (`mailto:?subject=...&body=`):
> Subject: Found a way for us to find a mahjong game
>
> I just listed myself on Find My Mahj Game, a free directory that connects mahjong players across all 50 states. If you play near Henderson, NV, you can find me here: https://findmymahjgame.com/states/nevada?via=mahj-7gk2&utm_source=email&utm_medium=share&utm_campaign=player_share
>
> It is free, and the more of us who list, the easier it is for everyone to find a game.

**Copy caption + link** (clipboard, replacing the current SHARE_TEXT):
> I just put myself on Find My Mahj Game so players near Henderson, NV can find me. It is a free directory for finding a mahjong game in your area. 🀄
> https://findmymahjgame.com/states/nevada?via=mahj-7gk2

### THE METRIC
**Share-click rate = % of listers who reach `/listed/[code]` and click at least one share channel.** This is the leading indicator of the entire viral engine; if it is low, nothing downstream compounds. Target: 40%+.

---

## SYSTEM 2 — START A TABLE (a forming game with a seats counter)

The mahjong-native unit. People do not look for "a player," they look for **a table**. A forming table is a public, joinable object with visible scarcity.

### Data model — new table
```sql
CREATE TABLE table_listings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  share_code text UNIQUE,
  host_name text NOT NULL,              -- "Sandra M."
  city text NOT NULL,
  state text NOT NULL,
  game_type text DEFAULT 'american',   -- american | riichi | hong_kong
  skill_level text DEFAULT 'all',
  cadence text,                         -- "Thursday mornings", "Weekly", "One-time"
  seats_total int NOT NULL DEFAULT 4,
  seats_filled int NOT NULL DEFAULT 1,  -- host counts as 1
  note text,                            -- "Beginner-friendly, we provide the set"
  contact_email text,                   -- host, server-only, never exposed
  referred_by text,
  status text NOT NULL DEFAULT 'forming', -- forming | full | archived
  expires_at timestamptz,              -- forming tables auto-archive (see System 3 decay)
  created_at timestamptz DEFAULT now()
);
-- derived in the UI: seats_open = seats_total - seats_filled

CREATE TABLE table_seat_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  table_id uuid REFERENCES table_listings(id),
  requester_name text NOT NULL,
  requester_email text NOT NULL,        -- server-only
  message text,
  status text DEFAULT 'requested',      -- requested | accepted | declined
  created_at timestamptz DEFAULT now()
);
```
RLS mirrors `player_listings`: `SELECT` allowed only on rows where `status IN ('forming','full')`; `contact_email`/`requester_email` never selectable by anon (relayed server-side only).

### Trigger
1. **New entry point** on every state page and the homepage: a primary button **"Start a Table"** next to "List My Game." Also offered as a checkbox on the existing list-my-game form: "☐ I want to start a new table, not just list myself."
2. On submit, `seats_filled = 1`, `status = 'forming'`, generates `share_code`, routes to `/listed/[share_code]` (System 1 page, table variant) → host immediately shares.
3. A browsing player clicks **"Join this table"** on the card → writes a `table_seat_requests` row → server relays to host via Resend → host accepts → `seats_filled++`. When `seats_filled = seats_total`, `status` flips to `full`, the card shows **"Table complete ✓"**, and all joiners + host get a "Your table is set" email (re-injects System 1 share + the complete-table badge of System 5).

### The card UI (state-page card, exact structure)
```
┌─────────────────────────────────────────────┐
│  🀄 FORMING TABLE          Thursday mornings  │
│  Henderson, NV · American · Beginner-friendly │
│                                               │
│  Seats:  ●  ●  ○  ○      2 of 4 filled        │   ← filled = pink dot, open = outline
│  ▓▓▓▓▓▓▓▓▓▓░░░░░░░░░░  "2 seats open"          │   ← progress bar
│                                               │
│  "Beginner-friendly, we provide the set."     │
│                                               │
│  [   Join this table   ]   [ Share ↗ ]        │
└─────────────────────────────────────────────┘
```
The seats counter (dots + bar + "N seats open") is the scarcity engine: visible progress makes joining feel timely and makes the page look alive even with one table.

### ACTUAL copy
- **Start button:** "Start a Table" / subtext: "Forming a new game? List the open seats and let players near you fill them."
- **Forming-table card header badge:** "FORMING TABLE"
- **Seats line:** "2 of 4 filled · 2 seats open"
- **Join button:** "Join this table"
- **Join form heading:** "Ask to join Sandra's Thursday table in Henderson"
- **Join confirmation:** "Sent. Sandra will get your request by email and can confirm your seat. We never share your email publicly."
- **Host relay email (to host on a join request):**
  > Subject: Someone wants to join your Henderson table
  >
  > Good news. A player asked to join your forming table (Thursday mornings, Henderson, NV).
  >
  > "Hi, I'm intermediate and free Thursday mornings, would love a seat."
  >
  > Reply to this email to connect with them directly. When your table is full, mark it complete here: https://findmymahjgame.com/table/mahj-7gk2/manage?t=[hmac-token]
- **Table-complete email (to all 4):**
  > Subject: Your Henderson table is set 🀄
  >
  > Your table is complete with 4 players. Want a backup list for when someone travels or is sick? Invite your group to list too, so you can always find a sub: [share link]

### THE METRIC
**Table fill rate = % of `forming` tables that reach `full` within 21 days.** This proves the core promise ("start a table and it fills"). High fill rate is your best testimonial engine and the clearest signal supply liquidity has been reached in a city.

---

## SYSTEM 3 — NEED A 4TH (urgent short-term seat-fill, badge, alert, time decay)

The highest-energy loop. A group short a 4th has a **deadline** (this Thursday). Deadlines create sharing urgency evergreen directories never get, and the recruits are net-new players pulled from off-platform (texts, local Facebook groups, their teacher).

### Data model
Reuse `table_listings` with one flag and lean on `expires_at` for decay. Also addable to `player_listings` for solo "available now" players.
```sql
ALTER TABLE table_listings  ADD COLUMN needs_fourth_by timestamptz; -- the deadline; presence = "Need a 4th" mode
ALTER TABLE player_listings ADD COLUMN looking_now boolean DEFAULT false;

-- Zero-friction demand capture for browsers not ready to list:
CREATE TABLE seat_alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  city text NOT NULL,
  state text NOT NULL,
  created_at timestamptz DEFAULT now(),
  notified_at timestamptz
);
```

### Trigger
1. On the Start-a-Table form and on any table's manage page: **"☐ We need a 4th by a specific date"** + a date picker → sets `needs_fourth_by`.
2. Tables with `needs_fourth_by` in the future render a **pulsing pink badge** and sort to the very top of the state page, above forming tables.
3. **Time decay:** a daily Vercel cron downgrades urgency as the deadline nears and archives after. T-minus copy escalates (below). After `needs_fourth_by` passes with the seat unfilled, `status → 'archived'` and the host gets a "re-post?" email.
4. **Alert capture (the loop engine):** any browser who finds no open seat enters only an email → `seat_alerts` row. When a new `Need a 4th` table appears in that city, the cron emails them → a future activation event from a zero-friction capture.

### The badge + time decay (exact states and copy)
- **>3 days out:** pink badge **"NEEDS A 4TH · THU"**
- **1-3 days out:** brighter pulse **"NEEDS A 4TH · 2 DAYS"**
- **<24h:** red urgent **"NEEDS A 4TH · TONIGHT"**
- **Passed, unfilled:** archived; host email subject "Your Thursday seat is still open, re-post it?"

### ACTUAL copy
- **Form checkbox:** "We need a 4th by a specific date" + "Players will see an urgent badge and your table jumps to the top."
- **Badge:** "Needs a 4th · [day]"
- **Top-of-page urgency strip (when ≥1 such table exists):** "🀄 Groups near you need a 4th this week. Can you fill a seat?"
- **Alert capture (empty result / no open seats):** "No open seats near you yet. Want an email the moment a group in [City] needs a 4th? [email field] [Notify me]"
- **Alert capture confirmation:** "Done. We'll email you the moment a group near [City] is short a player."
- **Seat-alert fire email:**
  > Subject: A group in Naples needs a 4th this Thursday 🀄
  >
  > You asked to hear when a game opened up near Naples. A group needs a 4th for Thursday morning. Seats go fast, ask to join now: [join link]
  >
  > P.S. Want your own game listed too? It takes 60 seconds: [list link]
- **Share copy when host shares a Need-a-4th table (SMS):**
  > We need a 4th for mahjong this Thursday in Naples. Know anyone? Ask them to grab the seat here: [share link with ?via]

### Critical dependency
This requires the **connect/join-relay fix**: today "Connect" only emails the admin. Build a server route that looks up the host's `contact_email` server-only and relays via Resend. Without this, "Need a 4th" requests never reach the group and the loop dies.

### THE METRIC
**Seat fill time = median hours from a `Need a 4th` table going live to the seat being filled.** Falling fill time means the network is dense enough that urgency converts. Secondary: **invites sent per Need-a-4th table** (off-platform broadcast volume).

---

## SYSTEM 4 — REFERRAL LOOPS (referral → new listing → new referral)

How an outbound share becomes an attributed new listing that itself starts sharing. This is the plumbing that makes Systems 1, 2, 3 compound rather than fire once.

### Data model
Already covered by System 1's `referred_by` + `referral_count`. The full chain:
1. Lister A gets `share_code = mahj-A`.
2. A shares `...?via=mahj-A`. The state page (`app/states/[state]/client.tsx`) reads `via`, writes a 30-day cookie `fmg_ref`.
3. Player B lands, eventually submits a listing. The submit action reads `fmg_ref` and sets B's `referred_by = mahj-A`. A trigger (or the action) does `UPDATE player_listings SET referral_count = referral_count + 1 WHERE share_code = 'mahj-A'`.
4. B gets `share_code = mahj-B` and her own `/listed/` page → B shares → C lands → repeat.

### Trigger / where the loop re-enters
- The `/listed/[code]` page (System 1) is the re-entry point: every newly attributed listing immediately gets its own share surface. The loop closes itself with no extra UI.
- Reinforced in the welcome email footer (System carries the lister's `share_code`).

### Incentive (status + utility, never cash — revenue is not a KPI, and cash cheapens a friendly community)
- **"Founding Player of [City]"** badge on the listing for the first ~10 listers in a city (drives cold-start cities directly toward Minimum Viable Liquidity of 5).
- **Referral counter** shown on the `/listed/` page: "You've brought 3 players to [City]." Visible progress is itself an invitation driver.
- **City milestone unlock:** at 5 listings a city flips from "forming" to a live, indexable directory (ties to the isIndexable Tier gate). Tell referrers: "2 more players and [City] goes live."

### ACTUAL copy
- **Referral counter:** "You've brought 3 players to Henderson. The more who list, the easier it is for everyone to find a game."
- **Founding badge:** "Founding Player · Henderson"
- **City progress nudge (on `/listed/` and state page):** "Henderson has 3 of 5 players needed to go live. Share your link to get it there: [share]"
- **Welcome email footer (every lifecycle email):** "Know someone who plays near Henderson? Send them your link and help your city's directory grow: [share link with ?via]"

### THE METRIC
**K-factor = (invites sent per lister) × (invite-to-listing conversion).** Drive toward 1.0+. Operationally tracked as **referred listings as % of total new listings** (the `referred_by` fill rate). This is the single number that says whether growth is self-sustaining.

---

## SYSTEM 5 — INVITE FRIENDS (invite your existing table/group)

The bulk, high-value invite: a complete or near-complete group lists together. Four users from one acquisition, and a listed group looks real, which cross-validates and fixes empty-state pages.

### Data model
Reuse `table_listings` + a lightweight pending-invite record so progress is visible.
```sql
CREATE TABLE table_invites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  table_id uuid REFERENCES table_listings(id),
  inviter_share_code text,            -- the inviter's code, becomes referred_by on accept
  invitee_label text,                 -- "my Thursday tablemate" or first name
  channel text,                       -- sms | whatsapp | email | copy
  status text DEFAULT 'sent',         -- sent | listed
  created_at timestamptz DEFAULT now()
);
```
When an invitee lists via the invite link, their listing's `referred_by` = `inviter_share_code` and the matching `table_invites.status → 'listed'`, feeding the "complete table" progress.

### Trigger
On the `/listed/` page and any table card the host manages, a primary block: **"Add the rest of your table."** Pre-fills `city`/`state` and carries `?via=` so each tablemate's listing inherits attribution. One tap each opens SMS/WhatsApp/Email with the invite link. A progress meter shows "2 of 4 of your group listed."

### Mechanic + reward
- **Mechanic:** bulk-prefill. The inviter does not re-enter city/state for each friend; the link does it. Lowest-friction path to 4 listings from one person.
- **Reward (status + utility, no cash):** **"Complete Table ✓"** badge on all four linked listings once the group is fully listed; plus the practical benefit pitched up front: a listed group can always find a sub when someone travels or is sick. That utility is the real reward.

### ACTUAL copy
- **Block heading:** "Add the rest of your table"
- **Subtext:** "Get all 4 of you listed so when someone travels or is out sick, you can always find a sub. No more cancelled games."
- **Progress meter:** "2 of 4 of your group listed"
- **Per-friend invite (SMS):**
  > I listed our Thursday mahj group on Find My Mahj Game so we can find a sub when we're short. Add yourself here (I pre-filled our city): [invite link with ?via]
- **Per-friend invite (WhatsApp):**
  > I just listed our table on Find My Mahj Game (free) so we never have to cancel for lack of a 4th. Add yourself, I pre-filled Henderson, NV for you: [invite link]
- **Per-friend invite (Email):**
  > Subject: Add yourself to our mahj group's listing
  >
  > I put our Thursday group on Find My Mahj Game so we can always find a sub when one of us is out. Add yourself here, I already filled in our city: [invite link]. Takes a minute and it's free.
- **Complete-table reward banner:** "Your table is complete ✓ All 4 of you are listed. You'll never have to cancel for lack of a 4th again."

### THE METRIC
**Group completion rate = % of tables that reach 4 linked, listed members.** A completed table is 4 attributed users + durable proof + a populated city page, so this is the highest-yield single conversion in the system.

---

## THE 2 LOOPS MOST LIKELY TO COMPOUND (step-by-step cycles)

### LOOP A — Post-listing share → referral cycle (Systems 1 + 4). SHIP FIRST.
Compounds because the act that creates value (listing) directly produces the invitation, and every attributed new listing re-enters with its own share surface. The asset is already built; this is a wiring job.

```
   ┌──────────────────────────────────────────────────────────────┐
   │                                                                │
   ▼                                                                │
 (1) Player lists herself (free, 60 sec)                           │
        │                                                           │
        ▼                                                           │
 (2) Routes to /listed/[code] — real data, her own ?via= link      │
        │   VALUE: players near her can now find her                │
        ▼                                                           │
 (3) Picks a channel: SMS · WhatsApp · Facebook · Email            │
        │   INVITE: forwards her ?via link / posts in FB group      │
        ▼                                                           │
 (4) Friend lands on state page → ?via cookie set (30 days)        │
        │                                                           │
        ▼                                                           │
 (5) Friend lists → referred_by = her code; referral_count++       │
        │   VALUE: "Founding Player" / "brought N players" badge    │
        ▼                                                           │
 (6) Friend hits HER OWN /listed/[code] page ──────────────────────┘
        repeat
```
**Compounding signal:** K-factor → referred listings as % of total. When >1, each cohort seeds a larger next cohort with no new spend.

### LOOP B — Need-a-4th urgency cycle (Systems 2 + 3 + 5). SHIP SECOND.
Compounds because it manufactures **recurring, deadline-driven** sharing. A group needs a 4th repeatedly (travel, illness, moves), so the same users re-enter on their own schedule, and each search broadcasts to net-new players off-platform.

```
   ┌────────────────────────────────────────────────────────────────┐
   │                                                                  │
   ▼                                                                  │
 (1) Group of 3 starts a table, sets "needs a 4th by Thursday"       │
        │                                                             │
        ▼                                                             │
 (2) Urgent pink badge + top-of-page sort + share link               │
        │   VALUE: visible, time-bound, scarce (1 seat, 2 days)       │
        ▼                                                             │
 (3) Group broadcasts off-platform: group text, local FB             │
        group, their teacher                                         │
        │   INVITE: deadline pulls in net-new / lapsed players        │
        ▼                                                             │
 (4) Lapsed player clicks "Join this table" → relayed to host        │
        via Resend (server-only email lookup)                        │
        │   VALUE: she found a game in days                           │
        ▼                                                             │
 (5) Seat fills → table "complete ✓"; she's prompted to list/        │
        start her own table; seat_alerts subscribers notified        │
        │   VALUE: shareable proof + a new listed player              │
        ▼                                                             │
 (6) She re-enters when HER group is next short a 4th ───────────────┘
        repeat (recurring by nature)
```
**Compounding signal:** falling median seat-fill time + rising invites-per-Need-a-4th table. Recurrence is structural, so retention compounds without re-acquisition.

---

## The one thing to fix first
Wire the existing `app/share-preview/page.tsx` into the real submit path in `app/list-my-game/list-my-game-client.tsx` (it currently dead-ends on a browse screen) using real row data, add `share_code`/`referred_by` to `player_listings`, swap X for SMS + WhatsApp, and drop in the System 1 copy. That single change converts a finished-but-unreachable asset into Loop A, the foundation everything else builds on. The connect/join-relay-to-player fix (server-only `contact_email` lookup via Resend) is the second prerequisite, unblocking Loops B's join flow.

### Files to touch (absolute paths)
- `/Users/shaunabruckman/Projects/findmymahjgame/app/share-preview/page.tsx` — promote to `/listed/[share_code]`, replace MOCK_PLAYER with real data, swap channels/copy (System 1).
- `/Users/shaunabruckman/Projects/findmymahjgame/app/list-my-game/list-my-game-client.tsx` — reroute success to `/listed/[code]`; add "Start a Table" + "Need a 4th" + "Add the rest of my table" controls.
- `/Users/shaunabruckman/Projects/findmymahjgame/app/states/[state]/client.tsx` — read `?via=` cookie; render forming-table seats card, Need-a-4th badge/sort, seat-alert capture; relay Connect/Join to the player.
- `/Users/shaunabruckman/Projects/findmymahjgame/app/api/notify/route.ts` — extend Resend for host/player relay + lifecycle emails.
- `/Users/shaunabruckman/Projects/findmymahjgame/supabase/migration.sql` — add `share_code`/`referred_by`/`referral_count`/`looking_now` to `player_listings`; create `table_listings`, `table_seat_requests`, `table_invites`, `seat_alerts`; matching RLS (anon SELECT only on public statuses, emails never selectable).
- `/Users/shaunabruckman/Projects/findmymahjgame/lib/hmac.ts` + `/Users/shaunabruckman/Projects/findmymahjgame/app/api/advertise-approve/route.ts` — reuse the existing HMAC email-action pattern for the host "mark table complete / manage" magic links.

Note: `schema.md` describes a `connectors/connections/referrals` model that does NOT exist in `migration.sql`; all specs above target the real `*_listings` tables.
