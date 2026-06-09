# FindMyMahj: Senior-First Mobile Web App Design

**Design target:** a 75-year-old can open a link on her phone and find a mahjong game with no help, no download, no signup.

**Core principle:** BIG BUTTONS. SIMPLE WORDS. NO CONFUSION.

**The feeling:** "Open link → tap big button → find mahjong."

**Primary operating metric:** number of active tables formed. Every screen below is judged by one test: does it move someone closer to sitting at a real table with three other people?

This is a mobile-first web app (PWA later), not a native app. No App Store, no download. It works from a text-message link.

---

## Guiding rules (the non-negotiables)

1. **Three choices, never more, on the main screen.** Find a Game, Start a Table, I Need Help. Everything else is secondary and below.
2. **One decision per screen.** Never ask two questions at once. A screen asks one thing, with big tappable answers.
3. **Tap, don't type.** Default to buttons and lists. The only typing ever required is a first name and a phone number, and only at the moment a seat is claimed.
4. **No login to look.** Browsing and even claiming a seat never hit a signup wall. Identity is captured at the point of action, inline, as a name + phone.
5. **Plain words.** "Find a Game," not "Discover sessions." "You're in!", not "RSVP confirmed." No "filters," "listings," "directory," "profile."
6. **Big and high-contrast.** Body text 20px minimum, buttons 64px tall minimum, dark text on white or white text on dark. No gray-on-gray, no tiny icons carrying meaning alone.
7. **Always a way back and a way to get help.** A big Back control and the "I Need Help" door are reachable from everywhere.
8. **Forgiving.** Confirm before anything irreversible, allow undo, never punish a wrong tap.

---

## 1. Simplified app-like homepage

Above the fold on a phone: a short warm headline, then three stacked full-width buttons, then a secondary row. No map above the fold (the map is powerful but overwhelming as the first thing a senior sees; it lives one tap inside "Find a Game"). No top menu bar with hidden links.

```
┌───────────────────────────────┐
│                               │
│        🀄  FindMyMahj          │   <- logo, big, centered
│                               │
│   Find people to play         │   <- 22px, plain promise
│   mahjong with near you.      │
│                               │
│ ┌───────────────────────────┐ │
│ │                           │ │
│ │   🔍  FIND A GAME          │ │   <- 72px tall, navy bg,
│ │                           │ │      white text, 24px bold
│ └───────────────────────────┘ │
│ ┌───────────────────────────┐ │
│ │                           │ │
│ │   ➕  START A TABLE         │ │   <- 72px, pink bg, white
│ │                           │ │
│ └───────────────────────────┘ │
│ ┌───────────────────────────┐ │
│ │                           │ │
│ │   ❓  I NEED HELP           │ │   <- 72px, white bg, navy
│ │                           │ │      text, navy border
│ └───────────────────────────┘ │
│                               │
│   ───────  or  ───────        │
│                               │
│  Learn Mahjong   Find a Teacher│  <- secondary, 1 row, 18px
│        View My Tables          │     text links w/ underline
│                               │
└───────────────────────────────┘
```

Notes:
- The three primary buttons use three different solid colors (navy / pink / white-outline) so they are told apart by color AND label AND icon, never by icon alone.
- Secondary actions (Learn Mahjong, Find a Teacher, View My Tables) are real text links with underlines, large (18px), grouped below an "or" divider so they read as "less important," not hidden.
- No hamburger menu. The footer has only: About, Contact, Privacy, in plain large text.
- "View My Tables" remembers the person by phone number stored locally (no account), so a returning user taps it and sees the games she joined.

---

## 2. Mobile user flow (the whole map, one tap deep)

```
                       HOME (3 buttons)
        ┌───────────────────┼───────────────────┐
   FIND A GAME          START A TABLE        I NEED HELP
        │                    │                    │
  "Where are you?"     "When do you want      Big FAQ +
   [Use my location]    to play?"             "Text us" +
   [Type my town]       [day buttons]         "Call us"
        │               [time buttons]            │
   Games near you       [public / my home]     answers in
   (big cards,          [skill: any/beg/...]   plain words
    seats left)              │
        │               "Your table is up!"
   Tap a game           share buttons +
        │               "tell your friends"
   "Claim a seat"
   name + phone
        │
   "You're in!"  ──────────────────► text confirmation
   day, time, place,                  with the details +
   who else is coming                 a link to the game
```

Everything a player needs is at most **three taps from the link**: Home → Find a Game → (auto-located list) → Claim a seat. Start a Table is **two taps to a live table**: Home → Start a Table → answer 3 tap-only questions → done.

---

## 3. Senior-friendly onboarding (there almost isn't one, on purpose)

The best onboarding for this audience is **no onboarding**. There is no signup, no tour, no account setup. The "onboarding" is just the first successful action, made foolproof.

- **First visit:** straight to the 3-button home. No modal, no cookie wall beyond a single small "OK" banner if legally required.
- **Location, asked gently and only when needed:** the first time she taps Find a Game, one screen: a giant "📍 Use My Location" button and, under it, "or type my town." If she declines location, she types a town with autocomplete (tap the matching town from a big list; never free-form guessing).
- **Identity, captured at the moment it matters:** only when she claims a seat or starts a table do we ask First name + Mobile number, two big fields, nothing else. We explain in one plain line: "We use your number to text you the game details. We never show it to anyone."
- **Returning:** her phone remembers her (localStorage). "View My Tables" just works. If she switches phones, she re-enters her number and we match her by it.
- **No passwords, ever.** If we later need to verify it is really her, we text a 6-digit code (a big-number entry screen), never a password.

---

## 4. Find a Game flow

One question per screen, biggest possible tap targets.

```
SCREEN 1                  SCREEN 2 (results)         SCREEN 3 (one game)
"Where are you?"          "Games near you"           "Tuesday Morning Mahjong"
┌──────────────────┐      ┌──────────────────┐       Summerlin Library
│ 📍 USE MY         │      │ Tuesday 10am     │       Tue, 10:00 AM
│    LOCATION       │      │ Summerlin Library│
└──────────────────┘      │ 🟢 1 seat left   │       Who's coming:
  or type my town         │ [  JOIN  ]       │        Linda (host), Sue, Ann
┌──────────────────┐      └──────────────────┘
│ Las Vegas    ▼   │      ┌──────────────────┐       ┌──────────────────┐
└──────────────────┘      │ Thursday 1pm     │       │   CLAIM A SEAT    │
                          │ Henderson JCC    │       └──────────────────┘
                          │ 🟢 2 seats left  │        Big, pink, 72px
                          │ [  JOIN  ]       │
                          └──────────────────┘        [ Back to games ]
                          ┌──────────────────┐
                          │ Don't see a game?│
                          │ [ START A TABLE ]│  <- never a dead end
                          │ [ TELL ME WHEN   │
                          │   ONE OPENS ]    │  <- email/text capture
                          └──────────────────┘
```

Rules:
- **Seats shown as plain language + color:** "🟢 1 seat left," "🟡 Almost full," "🔴 Full (join waitlist)." Never "3/4."
- **No filters by default.** Results are simply sorted nearest-and-soonest. If there are many, ONE optional simple control appears: three big buttons "Mornings / Afternoons / Evenings." No dropdown matrices.
- **A zero-result is impossible.** If nothing is near, the screen becomes "Be the first, Start a Table" plus "Tell me when a game opens near me" (captures name + phone/email + town = a real demand signal and a future text when a game appears).
- **Public venues vs homes:** at launch, results are public venues (libraries, JCCs, cafés). Home games appear only to people invited by the host, so a stranger never sees a private address.

---

## 5. Start a Table flow

The wedge. Two taps to a live, shareable table. Three tap-only questions, zero typing until the optional share step.

```
Q1: "When do you want to play?"
   [ Monday ] [ Tuesday ] [ Wednesday ] ...   (big day chips)
   then  [ Morning ] [ Afternoon ] [ Evening ]

Q2: "Where?"
   [ A public place near me ]   (we suggest local libraries/cafés)
   [ My home (invite only) ]

Q3: "Who can join?"
   [ Anyone ]  [ Beginners welcome ]  [ Experienced ]

→  "Your table is up! 🎉
    Tuesday morning, Summerlin.
    You need 3 more players."

    ┌──────────────────────────┐
    │   📲 TEXT MY FRIENDS      │   <- opens SMS prefilled
    ├──────────────────────────┤
    │   💬 SHARE ON WHATSAPP    │
    ├──────────────────────────┤
    │   📧 SHARE BY EMAIL       │
    ├──────────────────────────┤
    │   📘 SHARE ON FACEBOOK    │
    └──────────────────────────┘
    "We'll also help fill your table
     with nearby players."
```

Rules:
- The host gives name + phone at the end (same two-field inline capture), framed as "so we can text you when someone joins."
- The table is **instantly real and shareable** even with 1 of 4 seats. The share is the growth loop: every started table broadcasts FindMyMahj into a private friend group or Facebook page.
- We tell her plainly "you need 3 more players" (a goal + progress), and we promise to help fill it (we surface it in Find a Game and to "tell me when" waitlisters in her town).

---

## 6. Claim a Seat flow

The single most important conversion. Must be effortless and reassuring.

```
"Claim your seat"
Tuesday 10am · Summerlin Library

First name   [ ____________ ]   (big, 20px, autofocus)
Mobile       [ ____________ ]   (numeric keypad opens)

"We'll text you the details.
 Your number is never shown to anyone."

┌──────────────────────────────┐
│        YES, I'M IN!           │   <- 72px pink
└──────────────────────────────┘

          [ Cancel ]
```

→ Success screen, large and warm:

```
        ✅  You're in!

   Tuesday, 10:00 AM
   Summerlin Library
   You and 3 others

   We just texted you the details.

   [ Add to my calendar ]
   [ See who's coming ]
   [ Back home ]
```

Rules:
- Two fields, both optional-keyboard-optimized (name field text, phone field numeric). No email required (email optional, second choice).
- Immediate SMS confirmation with the details + a link back to the game page (so the link, not memory, carries the info).
- The host gets a text "Sue claimed a seat, 2 to go." This is the loop that turns a forming table into a full one.
- If full: "This game is full. Want the next open seat? [Yes, text me]" (waitlist capture, never a dead end).

---

## 7. Help flow ("I Need Help")

A senior must never feel stuck. This door is always one tap from home.

```
"How can we help?"

┌──────────────────────────────┐
│  📲 TEXT US A QUESTION         │  <- opens SMS to a help number
├──────────────────────────────┤
│  📞 CALL US                    │  <- tap-to-call
├──────────────────────────────┤
│  ▶  HOW TO FIND A GAME         │  <- 30-sec plain steps + short video
├──────────────────────────────┤
│  ▶  HOW TO START A TABLE       │
├──────────────────────────────┤
│  ❓  COMMON QUESTIONS          │  <- big-text FAQ, no jargon
└──────────────────────────────┘
```

Rules:
- **Text and call are first**, because this audience trusts a human and a phone. (In the first 30 days this can route to Shauna or an ambassador; it doubles as customer development.)
- The how-to entries are short: 3-5 plain steps with one screenshot each, optionally a 30-second captioned video. No walls of text.
- Written at a 6th-grade reading level. "A game is when 4 people meet to play. A table is a game you start yourself."

---

## 8. Accessibility checklist (senior + WCAG)

Type & layout
- Body text ≥ 20px; primary buttons label ≥ 22px bold; never below 16px anywhere.
- Buttons ≥ 64px tall, full-width on mobile, ≥ 16px spacing between tap targets (prevents mis-taps).
- Single column always. No horizontal scrolling. No two-column forms on mobile.
- Generous line height (1.6+) and short line length.

Color & contrast
- Text contrast ≥ 7:1 (WCAG AAA) for body where possible; never below 4.5:1.
- Navy (#1a1f5e) on white and white on navy are the safe high-contrast pairs (≈12:1). For pink primary buttons use white text, bold, ≥22px (large-text AA); prefer navy for the most critical text-heavy buttons.
- Never use color as the only signal: pair the seat dots (🟢🟡🔴) with words ("1 seat left," "Full").
- Visible focus outlines for keyboard users; respects prefers-reduced-motion.

Input & interaction
- Minimal typing; numeric keypad for phone; autocomplete for towns.
- Labels always visible above fields (never placeholder-only labels that vanish).
- Errors in plain language, in red AND with an icon AND text ("Please add your phone number so we can text you").
- Tap targets never rely on hover; everything works on touch.

Structure & assistive tech
- Semantic HTML, real <button>/<a>, proper headings, alt text on images, ARIA labels on the few icons.
- Screen-reader tested (VoiceOver). Pinch-zoom never disabled. Works at 200% browser zoom.
- Reachable, large "Back" on every screen; the browser back button never traps the user.

---

## 9. Recommended UI components (the kit)

A tiny, consistent set. Reused everywhere so the app feels predictable.

1. **BigButton** — full-width, 64-72px, three variants (primary-navy, primary-pink, outline). Icon + large label. The only call-to-action component.
2. **ChoiceChip / ChoiceGrid** — large tappable options for one-question screens (days, times, skill). Selected state is obvious (filled + checkmark).
3. **GameCard** — one game: day/time (largest), place, plain seat status with color+word, one big JOIN button. Used in Find a Game and View My Tables.
4. **SeatStatus** — 🟢/🟡/🔴 + word, never bare numbers.
5. **InlineCapture** — the two-field name + phone block with the reassurance line. The ONLY data-entry component, reused in Claim and Start.
6. **TownPicker** — "Use my location" button + autocomplete town list (tap to select).
7. **ConfirmScreen** — big checkm, the details, next-step buttons. Reused for "You're in" and "Table is up."
8. **ShareSheet** — stacked Text / WhatsApp / Email / Facebook big buttons with prewritten messages.
9. **HelpDoor** — the persistent help affordance.
10. **TopBar** — just a centered logo + a big Back control. No menu.

Implementation note: these map cleanly onto the existing design tokens in `app/globals.css` (navy, pink, the `.btn-*` and `.form-*` families); the work is mostly creating larger senior-sized variants and the one-question screen layouts, not a new design system.

---

## 10. Implementation plan (mobile web first, PWA next, native never-yet)

**Phase 0 (this week): senior-ize what exists.**
- Reframe the homepage to the 3 big buttons + secondary row (replaces the current hero/CTA). The map moves one tap inside "Find a Game."
- Bump global type and button sizes to the senior minimums; audit contrast.
- Add the persistent "I Need Help" door (text/call first).
- No new backend needed.

**Phase 1 (the wedge, ~2 weeks): Start a Table + Need a 4th + Claim a Seat.**
- Add a `tables` concept (a forming game: when, where, public/home, skill, seats_total, seats_filled, host name+phone). Smallest possible schema; reuse the existing inquiry/notify plumbing for the join relay and SMS-style confirmations (SMS via a provider like Twilio, or email-first if SMS is not ready day one).
- Build the three one-question flows (Start, Find, Claim) with the component kit.
- Wire the ShareSheet with prewritten messages and referral attribution.
- Empty-state capture everywhere ("tell me when a game opens near me").

**Phase 2 (~1 week): make it feel like an app (PWA).**
- Add a web app manifest + icons + "Add to Home Screen" prompt (a gentle, optional big card: "Put FindMyMahj on your phone, tap here"). Offline shell for the home screen. Still no download from any store.
- "View My Tables" backed by phone-number recall.

**Phase 3 (later, only if usage demands): native wrapper.**
- Only after the web app has real weekly use do we consider wrapping it (e.g. with a webview shell) for the App Store. Not now. The web app must prove itself first.

**What we deliberately do NOT build:** native iOS/Android apps now, in-app chat, complex profiles, ratings/reviews, filters beyond time-of-day, any signup wall, any feature that adds a second decision to a screen.
