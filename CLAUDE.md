# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## IMPORTANT: Session Startup

**Before you do anything, read `architecture.md`, `security.md`, and `schema.md`.** These three files define how the app is built, how data is secured, and how the database is structured. Every decision you make should align with these docs.

## Project

Static marketing site for **Find My Mahj Game** (findmymahjgame.com) — a directory that connects mahjong players to local groups, venues, retreats, and tournaments. No backend, no build step, no package manager: each page is a single self-contained HTML file served directly.

## Business Context

### Sister business
Las Vegas Mahjong (lasvegasmahj.com) is a mahjong instruction business run by a certified Oh My Mahjong (OMM) instructor based in Las Vegas. Find My Mahj Game is being built alongside it as the broader platform play.

### Domains
- findmymahjgame.com — primary platform
- findmymahjgroup.com — owned as a redirect to findmymahjgame.com
- lasvegasmahj.com — sister business (separate project at `~/Projects/lasvegasmahj`)

### Market
Serving 600,000–750,000 American mahjong players with strong recent growth.

### Revenue model — four pricing tiers
Documented in `findmymahjgame_pricing.pdf`. Venue listings are the primary recurring revenue driver.

1. **Brand & Company Advertising** — partner cards sidebar, sponsored banners, map popup cards
2. **Where to Play venue listings** — includes an "Official Mahj Spot" tier; venues display an "Official Mahj Spot" badge on their own sites as a value-add
3. **Event/Retreat/Tournament listings** — local, national, and featured tiers
4. **Bundle packages** — combine advertising + listings

### Distribution
- Instagram + ManyChat auto-DM campaigns for lead capture (e.g., "Comment TRACKER" triggers DM of a downloadable PDF)
- GoDaddy for domain hosting

### Roadmap
- Expand state landing page templates beyond Nevada and Florida (California, Arizona, and other high-mahjong-population states next)
- Grow venue and event listings as the primary recurring revenue driver
- Scale toward Year 2–3 revenue targets

### Related assets
- Marketing: `findmymahjgame_mediakit.pdf` (+ variants), `findmymahjgame_pricing.pdf`
- Tracker PDFs (2026 NMJL Hand Tracker, etc.) are built by preserving original source photos and layering branded headers/footers via PIL/Pillow — more reliable than recreating from code

### Nav convention
"Traveling and Want to Play?" and "Retreats & Tournaments" are separate nav items (not combined) — this distinction improved clarity in user testing.

## Commands

There is no build, test, or lint pipeline. To preview:

```bash
open index.html                         # open in default browser
python3 -m http.server 8000             # serve with absolute-path links working (/index.html, etc.)
```

The pages use root-absolute hrefs like `/index.html#map`, so a static server is preferred over `file://` for cross-page navigation to resolve.

## Architecture

**Each HTML page is fully self-contained.** Styles live in an inline `<style>` block and behavior in an inline `<script>` block at the bottom of the same file — there are no shared CSS, JS, image, or template files. Changes to layout, nav, or theme must be applied to every page individually.

**Page inventory:**
- `index.html` — home. Contains hand-drawn inline SVG US map (`#us-map`) where each state is a `<path class="state" id="XX" data-name="…">`. Clicking a state opens a popup driven by the `stateData` JS object near the bottom of the file (players + events per state).
- `nevada.html`, `florida.html` — per-state landing pages, fully hand-coded (not generated from `stateData`). Adding a new state = new hand-authored HTML file plus linking it from the map popup / nav.
- `about.html`, `advertise.html`, `advertiser-terms.html`, `contact.html`, `how-it-works.html`, `terms.html` — standard marketing/legal pages.
- `feedback_qr_card.html` — standalone printable card, not linked from main nav.
- `*.pdf` at the root — media kit and pricing PDFs referenced externally, not served from this site's internal links.

**Shared design system (duplicated inline in every page):**
- CSS custom properties: `--navy:#1a1f5e`, `--pink:#e91e8c`, `--green:#2ec95c`, `--gold:#f5c842`, plus `--text`, `--muted`, `--border`, `--bg`.
- Fonts loaded from Google Fonts: Playfair Display (headings, serif italic emphasis), DM Sans (body).
- Top-level layout: white sticky `<nav>` with pink CTA, navy `.nav-bar` / `.sponsor-bar` secondary strip, then page content.

**Homepage map interaction model** (`index.html`, ~line 326 SVG, ~line 750 script): the SVG paths have `id` = USPS state code. On click, `openPopup(code)` looks up `stateData[code]` and renders players or events into `#popup-grid` via string-concatenated HTML. Cities, level filter (`b`/`i`/`a`), and tab state are tracked in module-level `var`s (`currentState`, `currentCity`, `currentTab`). Adding a state means adding both an SVG `<path>` and a `stateData` entry.

## Conventions

- Keep pages self-contained — do not introduce a bundler, shared stylesheet, or templating layer without discussing first; the current structure is intentional for easy static hosting.
- When adding a new page, copy nav/footer markup from an existing page and preserve the `--navy/--pink/--green/--gold` palette and the Playfair + DM Sans type pairing.
- Links between pages use root-absolute paths (`/index.html#map`), not relative (`./index.html`).
