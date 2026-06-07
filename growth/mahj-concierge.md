# Mahj Concierge

The easiest way for a beginner, traveler, teacher, organizer, or player (age 60-85, not tech-savvy) to find mahjong. Easier than Facebook groups, Meetup, or a Google search.

**The goal is not conversation. The goal is a formed table.** Every path ends in one of: Find a Game, Start a Table, Need a 4th, or I Want to Play.

**Not a chatbot.** Concierge is **guided choices**, big buttons, almost no typing. (A chatbot comes much later, in Phase 3, and only as a layer on top of the same guided actions.)

This builds directly on the senior-first spec ([senior-mobile-design.md](senior-mobile-design.md)) and the already-built wedge (`/start`, `/t/[code]`, `/play`, `/help`).

---

## PHASE 1 — The guided Concierge and its flows

### The opening screen
```
┌───────────────────────────────┐
│        🀄  Mahj Concierge       │
│                               │
│   Hi! I'm here to help you     │
│   find mahjong. What do you    │
│   want to do?                  │
│                               │
│ ┌───────────────────────────┐ │
│ │ 🔍  Find a Game            │ │
│ ├───────────────────────────┤ │
│ │ ➕  Start a Table          │ │
│ ├───────────────────────────┤ │
│ │ 👋  Find Players           │ │
│ ├───────────────────────────┤ │
│ │ 📖  Learn Mahjong          │ │
│ ├───────────────────────────┤ │
│ │ 🎓  Find a Teacher         │ │
│ ├───────────────────────────┤ │
│ │ ✈️  I'm Traveling          │ │
│ ├───────────────────────────┤ │
│ │ 📞  Talk to a Person       │ │
│ └───────────────────────────┘ │
└───────────────────────────────┘
```
Each row is a full-width 64px+ button, large text, one clear icon + plain words. No menu, no filters, no login. One screen, seven doors. Every door is at most a few taps from a table.

### Flow 1 — Find a Game  (→ claim a seat = table filled)
```
Find a Game
 → "Where are you?"  [📍 Use my location] or [pick my town ▼]
 → Games near you (big cards: day, time, place, 🟢 seats left, [JOIN])
 → tap a game → Claim a Seat (first name + mobile, 2 fields) → "You're in!"
 → If none nearby → [Start a Table] or [Tell me when one opens] (capture)
```
Typing: at most a town (tap from list) + name + phone. Zero dead ends. Built today via `/t/[code]` claim; needs the games-near-me list screen.

### Flow 2 — Start a Table  (→ a new forming table)
```
Start a Table
 → "What day?"  [Mon][Tue]...   → "What time?" [Morning][Afternoon][Evening]
 → "Where?" [A public place] [My home, invite only] (+ optional place + town)
 → "Who can join?" [Anyone][Beginners welcome][Experienced]
 → name + mobile → "Your table is up! You need 3 more." → big Share buttons
```
Already built (`/start`). Typing: name, phone, optional place. Under 60 seconds.

### Flow 3 — Find Players  (→ I Want to Play capture, then concierge forms a table)
```
Find Players
 → "Want us to find you a game?"  [Yes, find me players]
 → name + mobile + town + best time (taps) → "You're on the list. We'll text
    you the moment there's a game near you." → [or Start a Table now]
```
Built (`/play`). This is the demand signal that the concierge (human now, AI later) turns into a formed table when enough nearby people want one.

### Flow 4 — Learn Mahjong  (→ then nudge to a game)
```
Learn Mahjong
 → [What is mahjong? (60-sec plain page)]
 → [Take a beginner lesson] (Find a Teacher)
 → [I know the basics → Find a Game]
```
Goal: a learner becomes a player. Ends by routing to Find a Teacher or Find a Game, never a dead end.

### Flow 5 — Find a Teacher  (→ lesson, which creates future players/tables)
```
Find a Teacher
 → "Where are you?" [town]
 → Teachers near you (card: name, where, levels, [Contact])
 → none nearby → [Tell me when a teacher is near] (capture) + [Learn online]
```
Phase 1: route to Shauna in Las Vegas and capture elsewhere. Phase 2: real teacher pages (the ambassador teachers populate this).

### Flow 6 — I'm Traveling  (→ a game at the destination, or capture)
```
I'm Traveling
 → "Where are you going?" [town]   "When?" [dates, optional]
 → Games there (cards + JOIN)  OR  [Tell the local players I'm visiting]
    (capture: name, phone, destination, dates) → "We'll connect you."
```
Captures travel demand (snowbirds, cruises) and doubles as a city-coverage roadmap. Routes to Find a Game scoped to the destination.

### Flow 7 — Talk to a Person  (trust anchor)
```
Talk to a Person
 → [📞 Call us] [📧 Email us] [💬 Text us]
```
Built (`/help`). First-line human help for the least tech-savvy. In month 1 this routes to Shauna/an ambassador and doubles as customer development.

**Every flow obeys:** one question per screen, big buttons, tap over type, no signup to browse, a way back, and a non-dead-end fallback that captures the person and points at a table.

---

## PHASE 2 — UI

### Mobile wireframe (the kit)
- **ConciergeHome:** the 7-door screen above. 64px+ buttons, 20px+ text, navy/pink/white high-contrast, one icon each.
- **OneQuestionScreen:** a big heading + a grid of large choice chips (used for day/time/where/who/town/time-of-day).
- **GameCard / PlayerCard / TeacherCard:** day/time largest, place, plain seat status (🟢 "1 seat left"), one big action.
- **InlineCapture:** first name + mobile, two big fields, the reassurance line "We never show your number."
- **ConfirmScreen:** big ✅, the details, next-step buttons.
- **ShareSheet:** Text / WhatsApp / Email / Facebook, prewritten (built).

### Homepage integration
The current homepage already leads with three big buttons (Find a Game / Start a Table / I Need Help). Concierge is the **fuller front door**: either (a) the homepage hero becomes the 7-door Concierge, or (b) a persistent "🀄 How can I help?" button opens Concierge from anywhere. Recommendation: make the **homepage = Concierge** for first-time mobile visitors (simplest mental model), keeping the map one tap inside "Find a Game."

### Navigation flow
```
Concierge Home ─┬─ Find a Game ── town ── games ── claim ✅
                ├─ Start a Table ── 3 taps ── share ✅
                ├─ Find Players ── capture ✅
                ├─ Learn ── (→ Teacher / Find a Game)
                ├─ Find a Teacher ── town ── teachers / capture
                ├─ Traveling ── destination ── games / capture
                └─ Talk to a Person ── call / email / text
```
A single persistent "Back" and a persistent "Talk to a Person." No hamburger, no hidden menus.

### Accessibility recommendations
Body ≥ 20px, buttons ≥ 64px with ≥16px spacing, contrast ≥ 7:1 (navy/white), color never the only signal (seat dots paired with words), labels always visible, numeric keypad for phone, town autocomplete, real semantic buttons/links, visible focus, works at 200% zoom and with VoiceOver, no motion required, no signup wall. (Full checklist in [senior-mobile-design.md](senior-mobile-design.md).)

---

## PHASE 3 — Future AI (a layer on guided actions, never a replacement)

Once the structured data exists (tables, players-wanting-to-play, teachers, events, travel requests), AI can quietly make the guided choices smarter. It never becomes a chat maze; it pre-fills and recommends.

- **Match players → tables:** when 4 "I want to play" signups cluster by town + time, auto-suggest forming a table and pre-fill Start a Table for the best-positioned host. (Turns demand into tables automatically.)
- **Recommend tables:** "Find a Game" surfaces the best-fit table first (proximity, time, skill, beginner-friendliness) instead of a raw list.
- **Recommend teachers:** route a beginner to the nearest, best-reviewed teacher whose next class matches.
- **Recommend events:** surface the open play / tournament most likely to fit, tied to the spring NMJL card season.
- **Help travelers:** match a visitor's destination + dates to local tables and connect them before they land.
- **Only then, a chat front end:** a plain-language box that maps an utterance ("I want a beginner game in Henderson on Tuesdays") to the same guided actions and pre-fills them. The action is still Start/Find/Claim; chat is just an on-ramp.

Guardrail: every AI recommendation must end at Find a Game / Start a Table / Need a 4th / I Want to Play. If a feature does not move someone toward a formed table, we do not build it.

---

## Database requirements

Built today (`supabase/wedge.sql`):
- **tables** (forming games: day, time, venue_type, venue_name, city, state, skill, seats_total, status, share_code, host contact).
- **table_seats** (who is in each table; powers the seats counter and "Need a 4th").
- **play_requests** (I Want to Play / Find Players demand signals).

Needed for the fuller Concierge:
- **teachers** (name, city/state, levels, contact, virtual?, slug) — powers Find a Teacher.
- **cities / geo** (city, state, lat/long, metro) — powers "near me," travel, and clustering for AI matching. Replaces flat seed data.
- **travel_requests** (name, contact, destination city, dates) — powers I'm Traveling and the city-coverage roadmap.
- Later: lightweight identity by **phone number** (no passwords) for "View My Tables" and to dedupe.

All reads/writes for contact-bearing tables stay behind server routes using the service-role key (RLS enabled, no anon policies), as the wedge already does.

---

## Implementation roadmap

- **Now (built, pending review + the wedge SQL):** Start a Table, Claim a Seat, Share, I Want to Play, Help, 3-button home. Ship the `tables`/`table_seats`/`play_requests` SQL.
- **Phase 1 (1-2 weeks):** wrap these in the 7-door Concierge home; add the "Find a Game → town → games list" screen; add Find a Teacher (route to Shauna + capture) and I'm Traveling (capture + destination games).
- **Phase 2 (1-2 weeks):** PWA (Add to Home Screen), "View My Tables" by phone, accessibility polish, teacher pages from ambassador data, a `cities/geo` table for real near-me.
- **Phase 3 (later, only after real weekly usage):** AI matching/recommendations on the structured data; a plain-language on-ramp that pre-fills the same guided actions.

**Principle throughout: simplicity over sophistication. The win is a formed table, not a clever conversation.**
