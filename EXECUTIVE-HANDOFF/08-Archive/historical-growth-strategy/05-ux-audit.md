I now have full ground truth on the real UI, styling, responsive rules, and data shape. Here is the audit.

---

# WORKSTREAM 5: UX/UI AUDIT — FindMyMahj

The core job is "help me find a game/club/teacher near me, fast." Today the product fails that job for nearly every visitor, because the database is essentially empty and every path leads to an empty state. The map, the search box, and the state pages all promise listings that do not exist. The real product right now is a listing-collection engine wearing the costume of a directory. The fix is to stop pretending to be a directory and lean fully into being the place where the community forms, with email capture and waitlists at every dead end.

I read all eight files plus globals.css and states-data.ts, and fetched the live homepage and the live California page. Findings below trace to specific lines.

---

## 1. TOP FRICTION POINTS (ranked by severity)

### P0 — Every search and click ends in a dead end, and we capture nothing
This is the whole ballgame. Trace the primary user flow:
- Homepage hero CTA "Find a Game" links to `/#map` (page.tsx:29). It scrolls down. It does not find a game.
- User clicks their state on the map. The popup shows `—` for Players, Events, Venues (us-map.tsx:212-214), then offers "View [State]" and "Create Listing."
- User lands on the state page. With zero published rows (the real state today), they see "No players listed in California yet" (client.tsx:284) and a "Create My Free Listing" button.
- The dead end asks the visitor (a player who wanted to FIND a game) to instead become the supply. There is no email capture, no "notify me when someone lists near me," no waitlist. **The single highest-leverage fix for the LISTINGS and USER KPIs: capture an email on every zero-result.** Right now a motivated searcher in Cleveland hits "No players in Ohio yet" and leaves, and we have no idea they exist. That is the most valuable person on the site and we let them walk.

### P0 — The map's "Active" states are a lie that erodes trust
us-map.tsx:70 hardcodes 13 states as `ACTIVE_STATES` (NV, FL, TX, NY, CA, IL, AZ, CO, GA, PA, OH, NJ, MA). These get a different fill color, an "Active" badge in the tooltip (line 195-197), and copy saying "Explore mahjong players, events, and venues in [State]" (line 218). But the data is seed data; those states have no real listings. A user lured into "Active" California by the badge lands on "No players listed in California yet." This violates the project's own Data Honesty rule (CLAUDE.md: never imply listings from seed data are real). It also trains users that the badge means nothing. **Remove the fake Active distinction until it reflects real published counts.**

### P0 — The state-page search controls are non-functional theater
On the state page (client.tsx:197-225) there is a polished search bar with Distance buttons (5/10/25/50 mi) and a Zip Code input with a Search button. None of it works:
- The Distance buttons have no `onClick` (line 209-211). They are decorative.
- The Zip input has no `onChange`, no state, no handler (line 217). The Search button does nothing (line 218).
- Only the City dropdown actually filters (line 202).
Showing a prominent, styled search UI that silently does nothing is worse than not having it. Users will type a zip, hit Search, and conclude the site is broken. **Either wire it up or remove it.** Given there's no listing data and no geocoding, remove it now; replace with the working city dropdown plus a "near me" approach (section 3).

### P1 — The homepage buries the one thing that works
The actual working search (the city text box, search-box.tsx) sits BELOW the map, below the fold (page.tsx:49). The hero CTA scrolls to the map, not the search. For the core job "find near me fast," the fastest path is type-your-city, and it's the least visible element. The map is pretty but it's a 60-state clicking exercise to do what one text field does instantly. The map also ships ~180KB of JS (us-map.tsx:10) for an interaction that mostly leads to dead ends.

### P1 — Search box matching is brittle and gives up too easily
search-box.tsx:16-30:
- It only matches against the seed `cities` arrays. Type "Cleveland Heights," "Brooklyn," "The Villages," or any suburb not in the curated list and you get "No match found" (line 68) even though there's a perfect state-level answer.
- Partial match uses `startsWith` only (line 22), and takes the FIRST hit in object order. Type "san" and you may land on San Antonio when you meant San Diego, with no disambiguation.
- A zip code entered here never matches anything (no zip support at all), yet the map subtitle explicitly invites "search by city or zip below" (page.tsx:40) and the placeholder is generic.
- The failure message just says "Browse all 50 states" (line 70). It throws the user back to a list of 50 dead ends instead of capturing intent.

### P1 — Mobile: the map and the state-page search bar break down
- The `.us-map-container` has no mobile treatment in the 768px media query (globals.css:710-720). On a phone, 50 tap targets in an Albers projection means tiny states (RI, DE, NJ, CT) are nearly untappable. The `.state-popup` is `width: 460px` (globals.css:256); on a 390px phone it's clamped by `max-width: 95%` but the two action buttons (us-map.tsx:221-234) sit side by side and will cramp.
- The map tooltip is driven by `onMouseMove` / `onMouseEnter` (us-map.tsx:97, 139). Touch devices have no hover, so the tooltip and the hover-fill affordance simply don't exist on mobile. The only signal a state is tappable is gone.
- The state-page search bar uses `flex-wrap` with fixed-width children (client.tsx:199); on mobile the Distance button row and zip field wrap awkwardly, and again, none of it works.
- The player grid and venue grid are hardcoded `gridTemplateColumns: "1fr 1fr"` (client.tsx:253, 387) with no mobile override. Two columns of player cards on a 390px screen will be painfully narrow once real data exists.

### P2 — Two empty homepage sections that scream "dead site"
The Retreats & Tournaments section (page.tsx:55-66) and the Venues section (page.tsx:69-80) are hardcoded to "No retreats or tournaments listed yet" / "No venues listed yet." A first-time visitor scrolls past two explicit "nothing here" panels. This signals abandonment. Either hide empty sections entirely or replace them with community/value content (see redesign).

### P2 — The "Connect" flow is a black box
On a player card, "Connect" opens a modal (client.tsx:269) that sends the message to an admin inbox via `/api/notify` and tells the user "We'll pass your request along" (line 527). The player never connects directly; everything is human-relayed. That's fine for a v1 trust model, but the copy should set expectations on timing, and we should capture the searcher's email into our list here too (we already collect it at line 503, but it goes to `inquiries`, not a growth list).

### P2 — Security/quality note (out of UX scope but worth flagging)
Both forms POST directly to Supabase REST from the client using the anon key (list-my-game-client.tsx:50-57, get-listed-client.tsx:107-114; the connect modal does the same at client.tsx:125-130). This is the documented pattern here and RLS is the guard, but it means form payload shape and rate-limiting live entirely on the client. Confirm RLS insert policies and the 20 req/min rate limit (CLAUDE.md) actually cover these public inserts.

---

## 2. HOMEPAGE REDESIGN (wireframe)

Principles: lead with the working search, make "near me" one tap, never show a dead end without capturing an email, and stop displaying empty sections as if the site is abandoned. Demote the map to a secondary browse affordance.

### Above the fold (desktop)

```
┌───────────────────────────────────────────────────────────────┐
│  Find My Mahj Game            List My Game · Advertise · States │  sticky nav
├───────────────────────────────────────────────────────────────┤
│                                                                 │
│           Find Your Mahjong Game.  Anywhere.                    │  H1 (keep serif)
│   Players, groups, open plays and teachers near you. Free.      │  subhead
│                                                                 │
│   ┌─────────────────────────────────────────────────────────┐  │
│   │ 🔍  Enter your city or zip…            [ Find Games ]    │  │  PRIMARY search
│   └─────────────────────────────────────────────────────────┘  │  (autocomplete)
│        ⌖ Use my location        Popular: NYC · LA · Boca · Chi  │  near-me + chips
│                                                                 │
│   Looking to start or grow a group?  → List your game (free)    │  secondary CTA
└───────────────────────────────────────────────────────────────┘
        ↑ everything above is visible without scrolling
```

The search box is THE hero. No "Find a Game" button that scrolls to a map; the search IS finding a game. "Use my location" and popular-city chips give one-tap entry. The map moves down to "Browse by state."

### Below the fold

```
┌───────────────────────────────────────────────────────────────┐
│   BROWSE BY STATE                                               │
│   ┌─────────────────────────────────────────────────────────┐  │
│   │                                                         │  │
│   │              [ Interactive US Map ]                     │  │  demoted, lazy
│   │   (states with real listings get a dot/count badge;     │  │  honest signal
│   │    no fake "Active" coloring)                            │  │
│   │                                                         │  │
│   └─────────────────────────────────────────────────────────┘  │
│   Mobile fallback: searchable A–Z state list, not the map      │
├───────────────────────────────────────────────────────────────┤
│   HOW IT WORKS  (3 steps, builds trust, no empty data)          │
│   1  Search your city   2  See players & groups   3  Connect    │
├───────────────────────────────────────────────────────────────┤
│   THE MAHJ COMMUNITY IS GROWING  (only render sections that     │
│   have real data; otherwise show this value/community band)     │
│   • New this week: [N] players listed   ← only if N>0           │
│   • [ Get the spring NMJL card reminder ] email capture         │  seasonal hook
├───────────────────────────────────────────────────────────────┤
│   TRAVELING OR CRUISING?  (keep — it's a genuine differentiator)│
│   ✈ Find a game where you land   🚢 Find players on your sailing │
├───────────────────────────────────────────────────────────────┤
│   FOR HOSTS & TEACHERS                                          │
│   Run a class, club, or event? Reach players searching now.     │
│   [ Get Listed ]                                                │
├───────────────────────────────────────────────────────────────┤
│   FOOTER                                                        │
└───────────────────────────────────────────────────────────────┘
```

Key changes vs. current:
- Kill the two hardcoded "No X listed yet" sections (page.tsx:55-80). Replace with How It Works + a community/email-capture band. Render data sections only when real rows exist.
- The map stays but as "Browse by state," lazy and secondary, with honest per-state signal (dot only where real published count > 0).
- Add a seasonal email capture: "Get notified when the new NMJL card drops + new games near you." This is the single best list-builder for this audience (predictable spring cycle, high intent). Feeds the USER KPI directly.

---

## 3. SEARCH IMPROVEMENTS

### 3a. Autocomplete
Replace the blind submit in search-box.tsx with a live dropdown as the user types. Show matches grouped: cities first, then states. This kills the "startsWith picks the wrong San" problem (search-box.tsx:22) by letting the user choose.

```
┌─────────────────────────────────────────────┐
│ 🔍  san|                                     │
├─────────────────────────────────────────────┤
│ CITIES                                       │
│   San Diego, CA                              │
│   San Francisco, CA                          │
│   San Antonio, TX                            │
│   San Jose, CA                               │
│ STATES                                       │
│   (none)                                     │
│ ─────────────────────────────────────────── │
│   Don't see your city?  Search "san" anyway →│   ← always offer a path
└─────────────────────────────────────────────┘
```

Implementation note: the lookup data already exists (`CITY_TO_SLUG` built at search-box.tsx:9-14). Use `includes` not just `startsWith` so "heights" or "beach" suburbs surface their state, and de-dupe to the city-state pairs. No backend needed.

### 3b. Near-me geolocation
Add a "Use my location" affordance under the search box. On click, `navigator.geolocation.getCurrentPosition`, reverse-geocode to a state (a static lat/long → state bounding-box table is enough; you do not need a paid geocoder for state-level resolution, and `STATE_CENTERS` already exists in us-map.tsx:54-68 as a starting point). Route to that state page. Per CLAUDE.md, ship this flag-gated OFF and behind an explicit user tap (no auto-prompt on load).

### 3c. Zero-result handling that converts (the most important change)
Today: "No match found. Browse all 50 states" (search-box.tsx:68-70). That's a bounce. Replace with intent capture:

```
┌─────────────────────────────────────────────────────────┐
│  We don't have games listed in {place} yet.              │
│  Be the first to know when one appears nearby.           │
│                                                           │
│  ┌───────────────────────────┐                           │
│  │ your@email.com            │  [ Notify Me ]            │   ← WAITLIST capture
│  └───────────────────────────┘                           │
│                                                           │
│  Or kick-start your local scene:                         │
│  [ List my game (free) ]   [ Browse nearby states ]      │
└─────────────────────────────────────────────────────────┘
```

This same pattern replaces every "No X listed yet" empty state on the state page (client.tsx:280-293, 363-372, 428-437). Store these as a `waitlist` table keyed by city/state/email. Two compounding wins: (1) you build the USER list from people who would otherwise bounce, (2) the waitlist tells you exactly which cities have demand, so you know where to seed supply. This directly serves all three KPIs (USERS, LISTINGS, CITY COVERAGE).

---

## 4. ONBOARDING IMPROVEMENTS

### Players (list-my-game-client.tsx)
Current form asks for 7 fields up front: Name, City, State, Skill Level, Availability, Bio, Email (lines 30-38), all on one screen, with email LAST (line 254). For a non-technical, predominantly-older audience, a long form is friction, and email-last means a drop-off loses the most valuable field.

Recommendations:
- **Capture email first.** Make step 1 just email + city. That alone creates a lead even if they abandon. Then progressively reveal name/skill/availability/bio as "complete your profile."
- **Reduce required fields to 4:** Name, City, State, Email. Skill level and availability become optional quick-pick chips, not required selects (currently skill_level is `required`, line 211). Asking a nervous beginner to self-rank as "Beginner/Intermediate/Advanced" before they've played anyone is a barrier.
- **Make City a typeahead tied to the same autocomplete** so the city string matches what state pages filter on (client.tsx:159 filters by exact lowercased city match; free-text city entry today means "Boca" vs "Boca Raton" silently won't match the filter). This is a real data-quality bug waiting to happen.
- **Reassure on privacy inline at the email field**, not just in the intro (the "never shown publicly" note at line 256 is good; keep it adjacent to the field).

Streamlined flow:
```
Step 1 (creates the lead immediately on submit):
  [ Email ]  [ City + State typeahead ]   → [ Continue ]
Step 2 (optional, "make your listing shine"):
  Name (first + last initial) · Skill (chips) · Availability (chips) · Bio
  [ Publish my listing ]   [ Skip for now ]
```

### Listing-creators / hosts (get-listed-client.tsx)
This form is heavier: business name, logo upload, type, city, state, email, website, instagram, description, promo code (lines 32-43). For the growth KPIs, the priority is getting the listing INTENT captured, not a complete profile.

Recommendations:
- **Email + business name + type first**, then everything else. Same lead-capture-first logic.
- **Move the promo-code field to the end and de-emphasize it.** Right now the page's intro paragraph leads with "Have a promo code?" (line 216) which is confusing for the 95% who don't have one, and it foregrounds payment in a sprint where revenue is explicitly NOT the priority. Lead with "It's free to get started" / founding-member framing instead.
- **Logo upload should be optional and last** (it already is optional, line 235, but it sits at position 2, line 234, which adds early friction). Defer it.
- The instructor-must-have-contact validation (lines 92-96) is good; keep it.

Both forms: success screens (list-my-game-client.tsx:88-128, get-listed-client.tsx:149-191) are solid, but add one thing: a share prompt ("Invite your mahjong friends to list too") with a prefilled link. The audience has strong Facebook Group behavior; a share CTA at the moment of success is free viral distribution into exactly the right groups.

---

## 5. STATE / CITY PAGE LAYOUT (wireframe)

Goals: when the page has real data, surface it fast and filtered; when it's empty (the common case today), convert to waitlist + listing creation instead of dead-ending; remove the fake search controls.

```
┌───────────────────────────────────────────────────────────────┐
│  Home › Find Players › California                              │  breadcrumb (keep)
│                                                                 │
│        Mahjong in California                                    │  H1
│        {desc}                                                   │
│                                                                 │
│   Players: 12   Events: 3   Where to Play: 5                    │  REAL counts only
│   (omit the stat row entirely when all are 0 — don't show "—")  │
├───────────────────────────────────────────────────────────────┤
│  FILTER (only render controls that actually work)               │
│  City: [ All of California ▾ ]   ⌖ Use my location              │  working dropdown
│  ─ remove the dead Distance buttons and Zip box until wired ─   │
├───────────────────────────────────────────────────────────────┤
│  [ Players ]  [ Events ]  [ Where to Play ]                     │  tabs (keep)
├───────────────────────────────────────────────────────────────┤
│  WHEN DATA EXISTS:                                              │
│   ┌───────────────┐ ┌───────────────┐                          │
│   │ Avatar  Name  │ │ Avatar  Name  │   (1 col on mobile,      │
│   │ City · level  │ │ City · level  │    2 col desktop)        │
│   │ 📅 availability│ │ 📅 availability│                          │
│   │ [ Connect ]   │ │ [ Connect ]   │                          │
│   └───────────────┘ └───────────────┘                          │
│   + sticky "List my game (free)" CTA card at the end           │
├───────────────────────────────────────────────────────────────┤
│  WHEN EMPTY (today's reality):                                  │
│   ┌─────────────────────────────────────────────────────────┐  │
│   │  🀄  No players listed in California yet                  │  │
│   │                                                         │  │
│   │  Be the first, OR get notified when players join:        │  │
│   │  [ email ________ ]  [ Notify me ]      ← WAITLIST       │  │  NEW
│   │  [ Create my free listing → ]                            │  │
│   └─────────────────────────────────────────────────────────┘  │
│   ↓ then show real local hooks so the page isn't barren:        │
│   • Nearby states with listings: Nevada (4) · Arizona (2)       │  honest cross-link
│   • Cities in California: LA · SF · San Diego · Palm Springs …  │  internal links/SEO
├───────────────────────────────────────────────────────────────┤
│  EXPLORE NEARBY STATES  (keep — good for SEO + discovery)       │
└───────────────────────────────────────────────────────────────┘
```

Specific edits to the existing state page:
- **Delete the non-functional Distance buttons and Zip box** (client.tsx:206-220). Keep the working City dropdown (line 202). Add "Use my location."
- **Drop the `—` stat placeholders** (client.tsx:185-187). Either show a real number or omit the stat. "—" reads as broken.
- **Add waitlist email capture inside every empty state** (the three blocks at client.tsx:280-293, 363-372, 428-437). The players empty-state currently jumps straight to "$10/event" and "$19/mo" pricing for events/venues (lines 368, 433); in a non-revenue sprint, lead those empty states with the free waitlist/community ask first, pricing second.
- **Make the city list (`stateData.cities`) clickable links** that pre-filter the page (or anchor to city sub-views). Right now those cities only appear in a dropdown; surfacing them as crawlable links improves CITY COVERAGE in search and gives the page real content when listings are empty.
- **Fix the grids for mobile**: change the hardcoded `"1fr 1fr"` (client.tsx:253, 387) to a responsive `repeat(auto-fill, minmax(260px, 1fr))` so cards stack to one column on phones.

---

## Top 5 changes, in priority order (each compounds the KPIs)
1. **Waitlist email capture on every zero-result and empty state** (search-box.tsx, state client.tsx). Turns 100% of today's dead-end traffic into leads + a demand heatmap. Biggest USER + CITY-COVERAGE lever.
2. **Promote the city search to the hero; add autocomplete + "use my location"** (page.tsx, search-box.tsx). Makes the core job one action instead of a map safari.
3. **Remove the fake "Active" states and the dead Distance/Zip controls** (us-map.tsx:70, client.tsx:206-220). Stops eroding trust and violating the data-honesty rule.
4. **Email-first, fewer-field onboarding for both forms** (list-my-game-client.tsx, get-listed-client.tsx). Captures the lead before drop-off; lowers the bar for nervous beginners.
5. **Stop rendering empty sections as "nothing here"; add a spring-NMJL email-capture band** (page.tsx:55-80). Replaces an abandoned-site signal with a seasonal list-builder tuned to this exact audience.

Files referenced (all absolute):
- /Users/shaunabruckman/Projects/findmymahjgame/app/page.tsx
- /Users/shaunabruckman/Projects/findmymahjgame/components/home/us-map.tsx
- /Users/shaunabruckman/Projects/findmymahjgame/components/home/search-box.tsx
- /Users/shaunabruckman/Projects/findmymahjgame/app/states/[state]/page.tsx
- /Users/shaunabruckman/Projects/findmymahjgame/app/states/[state]/client.tsx
- /Users/shaunabruckman/Projects/findmymahjgame/app/list-my-game/list-my-game-client.tsx
- /Users/shaunabruckman/Projects/findmymahjgame/app/get-listed/get-listed-client.tsx
- /Users/shaunabruckman/Projects/findmymahjgame/app/globals.css
- /Users/shaunabruckman/Projects/findmymahjgame/lib/states-data.ts
