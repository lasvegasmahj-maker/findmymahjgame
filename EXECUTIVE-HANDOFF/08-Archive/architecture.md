# Architecture — Find My Mahj Game

## Core Principle

**No hard-coded data.** Every piece of dynamic content — players, groups, venues, events, state data — comes from Supabase. The Next.js pages are the shell; Supabase is the brain.

## Stack

- **Framework:** Next.js 16 (React, TypeScript)
- **Styling:** Tailwind CSS 4 + shadcn/ui components
- **Database:** Supabase (PostgreSQL)
- **Auth:** Supabase Auth (email/password + Google sign-in)
- **Hosting:** Vercel (auto-deploys from GitHub)
- **Domain:** GoDaddy (findmymahjgame.com → points to Vercel)
- **Storage:** Supabase Storage (images, PDFs, media assets)
- **Icons:** lucide-react

## Data Flow

```
User visits findmymahjgame.com
  → Vercel serves Next.js pages (server-side rendered)
  → Pages query Supabase for connectors, events, venues, etc.
  → Dynamic content renders on the page
  → User interactions (filters, search, map clicks) query Supabase
  → Contact/listing forms write to Supabase
```

## Deployment Flow

```
You tell Claude → Claude edits code → You say "commit and push"
  → GitHub receives the push
  → Vercel auto-deploys (30–90 seconds)
  → Live at findmymahjgame.com
```

## Project Structure

```
findmymahjgame/
├── app/
│   ├── layout.tsx              # Site metadata, head tags, fonts
│   ├── page.tsx                # Homepage with interactive US map
│   ├── about/page.tsx          # About page
│   ├── contact/page.tsx        # Contact form
│   ├── how-it-works/page.tsx   # How it works
│   ├── advertise/page.tsx      # Advertising info & pricing
│   ├── terms/page.tsx          # Terms of use
│   ├── advertiser-terms/page.tsx # Advertiser terms
│   └── states/
│       ├── [state]/page.tsx    # Dynamic state landing pages
│       ├── nevada/page.tsx     # Nevada (custom)
│       └── florida/page.tsx    # Florida (custom)
├── components/
│   ├── layout/
│   │   ├── header.tsx          # Site navigation
│   │   ├── nav-bar.tsx         # Navy secondary nav
│   │   └── footer.tsx          # Site footer
│   ├── home/
│   │   ├── hero.tsx            # Hero section
│   │   ├── us-map.tsx          # Interactive SVG US map
│   │   ├── stats.tsx           # National stats
│   │   └── sponsor-bar.tsx     # Sponsor strip
│   └── states/
│       ├── player-card.tsx     # Player/group listing card
│       ├── event-card.tsx      # Event card
│       └── state-filters.tsx   # Level/city filters
├── lib/
│   ├── supabase.ts             # Supabase client
│   ├── constants.ts            # Site name, URL, socials
│   └── logos.ts                # Logo mappings
├── data/                       # JSON content (seed data)
├── public/
│   └── logos/                  # Local logo files (512px PNGs)
├── next.config.ts              # Image domains, security headers
├── tailwind.config.ts          # Tailwind configuration
└── .env.local                  # Supabase keys (never commit)
```

## Supabase Tables

| Table | Purpose |
|-------|---------|
| `connectors` | People/groups who host games |
| `connections` | Player-to-connector relationships |
| `referrals` | Referral tracking |
| `events` | Events, retreats, tournaments |
| `venues` | Venue listings ("Official Mahj Spots") |
| `states` | State-level data for the map |
| `sponsors` | Advertising partners |
| `pricing_tiers` | Advertising pricing |
| `inquiries` | Contact form submissions |
| `stats` | Aggregate stats (player counts, etc.) |

## Rules for Development

1. **Never hard-code data** — if it could change, it belongs in Supabase
2. **Always query Supabase** for player counts, event listings, venue info, etc.
3. **Keep pages as shells** — Next.js provides structure, Supabase provides content
4. **All secrets in .env.local** — never commit API keys to GitHub
5. **Fail gracefully** — show loading states, not broken pages, if Supabase is unreachable
6. **State pages are dynamic** — use `[state]` route for new states, custom pages for Nevada/Florida
