I have everything I need. The codebase confirms: a half-built share page exists but is disconnected, the listing flow ends in a dead-end success screen, there's no referral attribution, no "looking for a 4th" status field, no traveling-player feature, and no email lifecycle beyond a single admin-notify webhook. This grounds the entire design. Here is the workstream deliverable.

---

# WORKSTREAM 4: VIRAL LOOPS — FindMyMahj

## Ground truth from the codebase (what exists vs. what the loops assume)

I read the live code, not the docs. Key facts that shape every recommendation below:

- **Listings are anonymous and account-less.** `player_listings` has `name` ("Sandra M."), `city`, `state`, `skill_level`, `availability`, `bio`, `contact_email` (hidden), `status`. There is no `user_id`, no auth, no claim token. A player cannot log back in to edit their listing. This is the biggest constraint on every loop.
- **The success screen is a dead end.** `list-my-game-client.tsx` ends on "Listing submitted!" with links to browse. It does NOT route to the share page.
- **A share page already exists but is orphaned.** `app/share-preview/page.tsx` has copy-link, pre-written caption, Facebook/X/email buttons, fully styled. It uses MOCK data and is not wired to a real submission. This is the single highest-leverage thing in the repo: the loop is 80% built and just needs connecting + personalizing.
- **"Connect" is a one-way admin email, not a relationship.** `handleConnectSubmit` writes an `inquiry` row and emails `hello@findmymahjgame.com`. The target player is NOT emailed automatically (no `contact_email` exposed client-side, correctly). So today a "connect" does not even reach the player without manual forwarding. This breaks the most basic loop.
- **No "looking for a 4th" concept** exists. No status field, no urgency, no group entity.
- **No referral attribution.** `schema.md` describes a `referrals` table, but it is NOT in `migration.sql` and NOT referenced anywhere in code. It is aspirational. Treating it as nonexistent.
- **Email is one transactional path** (Resend, admin-only notify). No list, no lifecycle, no capture beyond form submits. The NMJL card cycle (every spring) is a massive untapped seasonal trigger.
- **Geographic data is seed only.** State pages can show "0 players" honestly. Empty states are the enemy of every loop; cold-start handling matters.

So the loops below are sequenced by **speed-to-impact given this exact codebase**. The first one ships this week because the asset already exists.

---

## Priority ranking (speed-to-impact, do in this order)

| # | Loop | Why this order | Build effort | Time to first signal |
|---|------|----------------|--------------|---------------------|
| 1 | **Post-listing share loop** ("Invite your table") | The share page already exists; just wire + personalize. The act of listing already implies wanting to be found. | XS (connect existing page) | 1-2 weeks |
| 2 | **"Looking for a 4th" status + alert** | Highest emotional pull in mahjong; creates urgency and a reason to invite. Needs one new field + one email path. | S | 2-4 weeks |
| 3 | **Claim + edit via magic link** (foundation) | Unlocks lifecycle email, re-engagement, and makes #1/#2 repeatable. Not viral alone, but the substrate. | M | 3-5 weeks |
| 4 | **NMJL card-season email loop** | Seasonal, enormous, but only fires in spring. Build the capture now, fire the campaign at card launch. | S (capture) + campaign | Capture now, payoff next spring |
| 5 | **Traveling-player / snowbird loop** | Strong differentiator, lower frequency. Reuses state-page infra. | M | 4-8 weeks |

---

## 1. REFERRAL SYSTEM: "Invite your table" / "Invite your group"

### The core insight specific to mahjong
American Mahjong is played in fixed groups of 4. People do not search for "a player," they search for **a table**. A group that loses one member (moves away, gets sick, snowbirds south) is not down one player, it is **dead until they find a replacement**. That is the wedge: every incomplete table is a high-intent, emotionally-motivated inviter.

### Two referral primitives (build #1 first)

**A) Invite-your-table (group invite).** When someone lists themselves, the immediate ask is not "share on Facebook" (low intent), it is: *"Get your whole table listed so you never lose your game."* A group of 4 listing together is 4 users from one acquisition, and they cross-validate each other (a listed group looks real, which fixes the empty-state problem).

**B) Invite-a-friend (1:1).** The lighter ask, for the share buttons.

### Concrete mechanics (mapped to the real codebase)

Because there are no accounts, the referral code lives in the **URL and the listing row**, not a user record.

1. Add three nullable columns to `player_listings`:
   - `share_code text` (8-char, generated on insert, e.g. `mahj-7gk2`)
   - `referred_by text` (the `share_code` of the inviter, null if organic)
   - `looking_for_4th boolean default false` (used by Loop 2)
2. On successful submit in `list-my-game-client.tsx`, **stop dead-ending**. Route to `/listed/[share_code]` (the real version of the orphaned `share-preview` page), passing the actual name/city/state instead of MOCK_PLAYER.
3. Share links carry the code: `findmymahjgame.com/states/florida?via=mahj-7gk2`. The state page reads `?via=`, drops it in a cookie, and on the next listing submit writes it to `referred_by`. That is your attribution with zero auth.
4. **Group invite** (the high-value one): on the share page add a primary button **"Add the rest of my table"** that opens `/list-my-game?city=Boca+Raton&state=FL&via=mahj-7gk2` with city/state pre-filled. The lister forwards that link to their 3 tablemates. Each tablemate's listing inherits `referred_by`.

### Referral copy (specific, not generic)

The existing caption is too "directory-marketing." Mahjong players talk to each other like friends, not like they are promoting a startup. Rewrite to first-person, benefit-led, and group-oriented:

- **Group invite button:** "Add the rest of my table" / subtext: "Get all 4 of you listed so if someone moves or travels, you can always find a sub."
- **Pre-written caption (replace SHARE_TEXT):**
  > "I just put our mahjong group on Find My Mahj Game so we can find a sub when we're short a 4th. If you play near Boca Raton, FL, find us here 🀄"
- **WhatsApp/text button (ADD THIS — it is missing and it is where this audience actually shares):**
  `https://wa.me/?text=...` and an SMS `sms:?&body=...` button. These women coordinate games over group texts and WhatsApp, not Twitter/X. **Remove the X button; add WhatsApp + "Text it to your group."**
- **Facebook button keeps existing sharer URL** (Facebook Groups are this audience's home turf, this is correct).

### Incentive design
Do NOT use cash or discounts (revenue is not a KPI and it cheapens a friendly community). Use **status and utility** incentives:
- "Founding Player of [City]" badge on the listing for the first ~10 listers in a city (drives cold-start cities).
- "Your group is complete ✓" badge when all 4 tablemates are listed and cross-linked. Social proof + a tiny dopamine hit + makes the city page look populated.

---

## 2. INVITATION SYSTEM MECHANICS

Without accounts, invitations are **link-based and email-light**, which is actually faster to ship.

**Trigger points (where the invite ask appears):**
1. **Immediately post-listing** (primary, highest intent) — the connected share page.
2. **After a successful "Connect" request** — "Know someone else looking for a game? Send them here."
3. **On any state page with < 8 players** — a soft banner: "Help [State] grow. Invite a friend who plays."
4. **In every lifecycle email** (once Loop 3 ships) — footer invite link with the lister's `share_code`.

**Invitation state (lightweight, no new table needed for v1):**
- Attribution is the `referred_by` column. Count referrals with `SELECT count(*) FROM player_listings WHERE referred_by = $code`.
- A "you invited 3 players" counter can show on the share page by reading that count. Visible progress is itself an invitation driver.

**De-risking spam / RLS:** the `player_listings` INSERT policy is currently `WITH CHECK (true)` (fully open). Adding shareable invite links increases insert volume, so add the rate limit CLAUDE.md already mandates (20 req/min/IP) at the API boundary and keep submissions `pending_review` (the form already sets `status: "pending_review"`, though the migration default is `published`; reconcile that, pending_review is correct for spam control).

---

## 3. "LOOKING FOR PLAYERS / LOOKING FOR A 4TH" — the strongest pull in this niche

This is the loop with the most emotional energy and it barely exists in the product today. Build it as Loop 2.

### Why it pulls in NEW users (not just activates existing ones)
The person who is "looking for a 4th" has a **deadline** (this Thursday's game). Deadlines create sharing urgency that evergreen directories never get. And the people they recruit are net-new: a half-formed group searching for a 4th will text everyone they know, post in their local Facebook group, and ask their teacher. Each of those is an off-platform broadcast that points back to FindMyMahj.

### Concrete build
1. New field `looking_for_4th boolean` on `player_listings` (and a parallel concept for groups). Add a checkbox to `list-my-game`: **"☐ My group is looking for a 4th right now."**
2. On state pages, listings with `looking_for_4th = true` get a **pulsing pink "Looking for a 4th 🀄" badge** and sort to the top. Scarcity + urgency = clicks.
3. Add a dedicated **"Looking for a 4th near you"** filter/tab on each state page (reuse the existing tab component pattern in `client.tsx`).
4. **Alert capture (this is the loop engine):** anyone browsing who is NOT ready to list can enter just an email: **"No open seats near you yet? Get an email the moment a [City] group needs a 4th."** That is a zero-friction email capture that creates a future activation event.

### The loop, step by step
1. **Action:** Group of 3 in Naples lists, checks "looking for a 4th."
2. **Value:** They appear top-of-page with an urgent badge; they get a shareable link.
3. **Invitation:** They text the link to their friends and post in the SW Florida Mahjong Facebook group: "We need a 4th for Thursdays, see our listing."
4. **New user:** A lapsed player sees it, clicks, fills the 30-second "Connect" form (now also prompted to make her own listing).
5. **Repeat:** She is now a listed player; next time HER group is short, she uses the same feature. And the original group, now complete, earns the "complete table" badge, which is itself shareable proof.

**Key metric to watch:** **fill rate** = % of "looking for a 4th" listings that flip to "complete" within 14 days, and **invites-sent-per-LF4th-listing**. If fill rate is high, the feature is the best word-of-mouth proof you have ("I found my 4th in 3 days"). Surface those as testimonials.

**Critical fix this depends on:** today "Connect" only emails the admin, not the player. For this loop to work, connect requests must reach the listed player. Implement via a server route that looks up `contact_email` server-side (never exposed to client, preserving the RLS/PII guarantee) and relays the message through Resend. This is a small, high-priority backend change.

---

## 4. TRAVELING-PLAYER / SNOWBIRD / CRUISE LOOP

### Why it fits this audience exactly
The NMJL audience skews toward retirees and snowbirds: people who winter in Florida/Arizona, take mahjong cruises, and visit family for weeks. They WANT to play while traveling but do not know the local scene. And the destinations (Florida, Arizona, Palm Springs, cruise ports) are exactly where supply is densest. This is a two-sided loop: travelers create demand signal in destination cities, which pulls local hosts to list.

### Concrete build (reuses state-page infra)
1. **"Find a game while you travel"** entry on the homepage and a `/travel` page. Input: destination + dates.
2. It surfaces that destination's state page players, "looking for a 4th" groups, open-play events, and venues.
3. **Demand capture:** "No games found in Sarasota for your dates? Tell us when you'll be there and we'll email you if a game opens up." Writes an inquiry tagged `traveling`, captures email + destination + dates.
4. **Supply pull:** when traveler demand for a city crosses a threshold, that becomes a prioritized cold-start city. Also a recruiting line for local hosts: "12 visiting players looked for a game in Sarasota this month. List your open play."
5. **Snowbird seasonality:** in fall, email captured snowbirds: "Heading to Florida for the winter? Here's your Naples mahjong game." (Ties to Loop 4 lifecycle.)

### The loop, step by step
1. **Action:** Snowbird in Chicago searches "mahjong in Naples, FL, January."
2. **Value:** Finds a local open-play / a group looking for a winter sub.
3. **Invitation:** She tells her Chicago group "I found a game down south on this site," and tells the Naples host "found you on FindMyMahj." Two off-platform mentions.
4. **New user:** Naples host, hearing demand, lists their open play; the Chicago friends list to find their own winter games.
5. **Repeat:** Every snowbird season re-fires; cruise/retreat organizers list to capture this exact searcher.

**Key metric:** **destination demand captured per city** (emails by city/dates) and **demand-to-supply conversion** (did a captured-demand city gain a host listing within 30 days). This metric also directly drives your CITY COVERAGE KPI by telling you which cities to seed first.

---

## 5. EMAIL CAPTURE FLOWS (and the NMJL card-season engine)

Today there is effectively zero email capture for growth (only transactional admin notifies). This is the biggest gap relative to the KPI of user growth. Every form already collects an email; that asset is being thrown away.

### Where to capture (ranked by intent)
1. **Listing submit** — already collected. Add one checkbox, default ON, clearly labeled: "☐ Email me when a player or group near me is looking for a game." (Consent-based, not pre-checked sneakily; "email me when relevant" is genuinely wanted here.)
2. **"Looking for a 4th" alert** (Loop 3) — pure email capture, highest future-activation value.
3. **Traveling-player demand** (Loop 5) — email + destination + dates.
4. **Empty state pages** — "Be the first to know when [State] gets players. Drop your email." Turns a dead page into a capture.
5. **NMJL card interest** — a homepage/state-page module: "New NMJL card drops every spring. Get the alert + find a group to learn the new hands with."

### Incentive (what they get for the email)
Not a discount. The incentives are **information and connection**:
- "We'll email you the moment a group near you needs a player."
- "Get notified when the new NMJL card releases."
- A genuinely useful lead magnet: a free one-page **"New Card Night" hosting checklist** or **beginner quick-start**, gated behind email. (Shauna is a certified instructor; her credibility makes this content authentic and high-converting, and it cross-promotes lasvegasmahj.com.)

### Lifecycle emails (requires Loop 3 magic-link/claim for personalization, but list-building starts now)
- **Welcome (immediate):** "You're listed in [City]. Here's your share link to invite your table." (Re-injects the referral loop into email.)
- **Day 3:** "3 players viewed your area this week. Looking for a 4th? Flip the switch." (Drives the LF4th feature.)
- **Day 14 re-engagement:** "New players joined near [City]: [names]. Want to connect?" (Only fires when there's real new supply — honors the data-honesty rule, never fabricate counts.)
- **Seasonal NMJL card email (every spring):** the big one. See below.

### The NMJL card-season loop (build capture now, fire next spring)
The card releases every spring and the **entire** American Mahjong world re-engages simultaneously: everyone wants to learn the new hands, groups reschedule, beginners join because friends are learning together. This is a once-a-year synchronized demand spike. CLAUDE.md is explicit: never name a month, just say "every spring."

Loop:
1. **Pre-season capture (now through winter):** "Get notified when the new card drops" email module everywhere.
2. **Card-release trigger (spring):** blast the list: "The new card is here. Find a group near you to learn the new hands together." Drives a wave of listings and connects.
3. **Invitation built into the email:** "Learning the new card is more fun with friends. Invite your table." -> share links.
4. **New users:** beginners recruited by friends learning the new card list themselves.
5. **Repeat annually**, compounding because each spring's list is larger than the last.

**Key metric:** **email-captured-before-season** and **season-spike listing lift** (listings in the 4 weeks post-card vs. baseline). This is your single largest annual growth event; protect and grow the pre-season list all year.

---

## The 2-3 loops most likely to COMPOUND (drawn as loops)

### LOOP A — Post-listing share loop ("Invite your table") — SHIP FIRST
This compounds because the act that creates value (listing yourself) directly produces the invitation, and each invitee can re-trigger it. The asset is 80% built (`share-preview` page).

```
  Player lists herself (free, 60 sec)
        │
        ▼
  Gets a personalized "You're listed!" page + her own share link (?via=code)
        │   value: "players near you can now find you; protect your game"
        ▼
  Prompted: "Add the rest of my table" + Text/WhatsApp/Facebook buttons
        │   invitation: forwards group-invite link to her 3 tablemates + posts in FB group
        ▼
  New users list (referred_by = her code), inheriting city/state
        │   value: "your table is complete ✓" badge, city page now looks alive
        ▼
  Each new user hits her OWN "You're listed!" page  ──┐
        └──────────────── repeat ────────────────────┘
```
**Metric to watch:** **K-factor** = (invites sent per lister) × (invite-to-listing conversion). Target K toward 1+. Leading indicator: **% of listers who reach the share page and click at least one share button.** Secondary: referred listings as % of total (the `referred_by` fill rate).

### LOOP B — "Looking for a 4th" urgency loop — SHIP SECOND
This compounds because it manufactures recurring, deadline-driven sharing. Unlike a one-time list-and-share, a group needs a 4th repeatedly (people travel, get sick, move), so the same users re-enter the loop on their own schedule, and each search broadcasts off-platform.

```
  Group of 3 lists + checks "looking for a 4th"
        │
        ▼
  Top-of-page urgent badge + dedicated "Looking for a 4th" tab + share link
        │   value: visible, urgent, time-bound demand
        ▼
  Group broadcasts: texts friends, posts in local FB group, asks their teacher
        │   invitation: off-platform reach to net-new players (deadline = this week)
        ▼
  Lapsed/new player clicks "Connect" (now relayed to the group via Resend)
        │   value: she found a game in days; prompted to make her own listing
        ▼
  Group flips to "complete ✓" (shareable proof) AND she's now a listed player ──┐
        └────────── she re-enters when HER group is next short a 4th ───────────┘
```
**Metric to watch:** **fill rate** (% of LF4th listings completed within 14 days) and **invites-per-LF4th-listing**. High fill rate = your best testimonial engine and the clearest signal the core value prop works.

### LOOP C — NMJL card-season loop — COMPOUNDS YEAR-OVER-YEAR
This compounds on a 12-month cycle: each spring's synchronized demand spike grows a list that makes the next spring bigger. Slower clock, but the largest amplitude and the one most defensible (tied to an immovable industry calendar).

```
  All year: "Get notified when the new card drops" capture everywhere
        │
        ▼
  Spring: card releases → blast list: "Find a group to learn the new hands"
        │   value: synchronized, universal, time-bound demand
        ▼
  Email CTA: "Learning the new card is more fun together — invite your table"
        │   invitation: share links + beginners recruited by friends
        ▼
  Wave of new listings + connects; new emails captured
        │   value: bigger list than last year
        ▼
  List grows → next spring's blast is larger ──┐
        └──────────── repeat annually ─────────┘
```
**Metric to watch:** **pre-season list size** (grow it monthly) and **season listing lift** (post-card listings vs. baseline). Year-over-year list growth is the compounding signal.

---

## The unlock everything depends on, and the one thing to fix first

**Fix first (this is blocking Loops A and B and costs almost nothing):** Wire the existing `share-preview` page into the real listing-submit success path with real data instead of MOCK_PLAYER. Right now `list-my-game-client.tsx` dead-ends on a "browse" screen and the fully-built share UI is unreachable. Connecting these two files turns a finished asset into a live viral loop. Add WhatsApp + SMS buttons, drop X, and swap the caption to the group-oriented copy above.

**Foundational unlock (Loop 3, enables lifecycle + repeatability):** the account-less model caps every loop, because a player can never come back to edit, mark "looking for a 4th," or be re-engaged. Add a **magic-link claim/edit** flow (HMAC token emailed on submit — the repo already has `lib/hmac.ts` and a working email-token pattern in `advertise-approve`). This is the substrate that makes the share, LF4th, and lifecycle-email loops repeatable rather than one-shot.

---

### Files referenced (all absolute)
- `/Users/shaunabruckman/Projects/findmymahjgame/app/share-preview/page.tsx` — orphaned share UI; the asset to connect first.
- `/Users/shaunabruckman/Projects/findmymahjgame/app/list-my-game/list-my-game-client.tsx` — dead-end success screen to reroute (lines 88-130) + add table/LF4th fields.
- `/Users/shaunabruckman/Projects/findmymahjgame/app/states/[state]/client.tsx` — "Connect" only emails admin (lines 120-154); add LF4th badge/tab/sort; relay connects to the player.
- `/Users/shaunabruckman/Projects/findmymahjgame/app/api/notify/route.ts` — Resend path to extend for player-relay + lifecycle.
- `/Users/shaunabruckman/Projects/findmymahjgame/supabase/migration.sql` — add `share_code`, `referred_by`, `looking_for_4th` to `player_listings`; reconcile status default (`pending_review` vs `published`); the `referrals` table in `schema.md` does NOT exist here.
- `/Users/shaunabruckman/Projects/findmymahjgame/lib/hmac.ts` — reuse for magic-link claim/edit (Loop 3).
- `/Users/shaunabruckman/Projects/findmymahjgame/app/api/advertise-approve/route.ts` — existing HMAC-email-action pattern to clone for player claim links.
