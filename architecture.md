# Architecture — Find My Mahj Game

## Core Principle

**No hard-coded data.** Every piece of dynamic content — players, groups, venues, events, state data — comes from Firebase. The HTML pages are the shell; Firebase is the brain.

## Stack

- **Frontend:** Static HTML/CSS/JavaScript (self-contained pages)
- **Backend/Database:** Firebase (Firestore)
- **Auth:** Firebase Authentication
- **Hosting:** GoDaddy (domain) — consider migrating to Firebase Hosting
- **Storage:** Firebase Storage (images, PDFs, media assets)

## Data Flow

```
User visits page
  → Page loads shell HTML (nav, layout, footer)
  → JavaScript calls Firebase on page load
  → Firestore returns data (players, events, venues, etc.)
  → JS renders data into the page dynamically
  → User interactions (filters, search, clicks) query Firestore in real-time
```

## Page Architecture

Each page follows this pattern:

1. **Static shell** — nav, layout containers, footer (HTML/CSS)
2. **Firebase init** — config and SDK loaded in `<script>`
3. **Data fetch** — Firestore queries populate the page content
4. **Event listeners** — user interactions trigger new Firestore queries

### Key pages and their data sources

| Page | Firestore Collection(s) | Purpose |
|------|------------------------|---------|
| `index.html` | `states`, `stats` | Homepage map, national stats |
| `nevada.html` | `connectors`, `connections`, `events` | State landing page — players, groups, events |
| `florida.html` | `connectors`, `connections`, `events` | State landing page — players, groups, events |
| `advertise.html` | `sponsors`, `pricing_tiers` | Dynamic pricing and sponsor display |
| `about.html` | (mostly static) | About page |
| `contact.html` | (form writes to `inquiries`) | Contact form submissions |

## Firebase Project Structure

```
findmymahjgame (Firebase project)
├── Firestore Database
│   ├── connectors          # People/groups who host games
│   ├── connections          # Player-to-connector relationships
│   ├── referrals            # Referral tracking
│   ├── events               # Events, retreats, tournaments
│   ├── venues               # Venue listings ("Official Mahj Spots")
│   ├── states               # State-level data for the map
│   ├── sponsors             # Advertising partners
│   ├── pricing_tiers        # Advertising pricing
│   ├── inquiries            # Contact form submissions
│   └── stats                # Aggregate stats (player counts, etc.)
├── Authentication
│   └── Email/password + Google sign-in
├── Storage
│   └── Media assets, uploaded images
└── Hosting (optional migration target)
```

## Rules for Development

1. **Never hard-code data** into HTML — if it could change, it belongs in Firestore
2. **Always query Firestore** for player counts, event listings, venue info, etc.
3. **Keep pages as shells** — HTML provides structure, Firebase provides content
4. **Use Firebase SDK** directly in `<script>` tags (no build step)
5. **Cache-friendly** — use Firestore's real-time listeners where appropriate for live updates
6. **Fail gracefully** — if Firebase is unreachable, show a friendly "loading" or "try again" message, not a broken page
