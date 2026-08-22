# SEO and Measurement Audit: Find My Mahj Game

Date: 2026-08-22. Branch: lane-d-seo-measurement. Author: Lane D.
Every claim below cites the file in this repo or the live URL that proves it. Live fetches were made on 2026-08-22.

## 1. Technical SEO state

### 1.1 Metadata coverage per route

Checked every `page.tsx` under `app/` outside `app/admin/`. 42 public page files; 41 export `metadata` or `generateMetadata`.

- The only page file with no metadata export is `app/share-preview/page.tsx`. Its parent `app/share-preview/layout.tsx` sets `robots: { index: false, follow: false }`, and `public/robots.txt` disallows `/share-preview`, so this is an internal tool and safe. It inherits the root default title from `app/layout.tsx`.
- Root defaults live in `app/layout.tsx`: default title, title template `%s | Find My Mahj Game`, description, `metadataBase: new URL("https://findmymahjgame.com")`, openGraph siteName/type/locale, twitter `summary_large_card`.
- All indexable public routes carry their own title and description: hub pages (`app/events/page.tsx`, `app/teachers/page.tsx`, `app/tournaments/page.tsx`, `app/leagues/page.tsx`, `app/travel/page.tsx`, `app/cruise/page.tsx`, `app/states/page.tsx`), intent pages (`app/play/page.tsx`, `app/start/page.tsx`, `app/ask/page.tsx`, `app/help/page.tsx`), conversion pages (`app/join/page.tsx`, `app/get-listed/page.tsx`, `app/list-my-game/page.tsx`, `app/newsletter/page.tsx`), brochure pages (`app/about/page.tsx`, `app/faq/page.tsx`, `app/how-it-works/page.tsx`, `app/contact/page.tsx`, `app/founding-advisors/page.tsx`).
- Dynamic routes generate metadata correctly: `app/states/[state]/page.tsx` (5 hand-written state metas plus a template for the other 46), `app/states/[state]/[city]/page.tsx`, `app/teachers/[id]/page.tsx` (title clamped to 70 chars at line 61).

### 1.2 Canonicals

27 page files set `alternates.canonical` (grep for `canonical` under `app/`, excluding admin). The 15 without a canonical are all noindex utility pages (`app/claim/page.tsx`, `app/unsubscribe/page.tsx`, `app/played/page.tsx`, the confirm pages, `app/t/[code]/page.tsx`, `app/home-v2/page.tsx`, `app/venues/page.tsx`, `app/advertise/submit`, `approved`, `approve-confirm`, `app/advertiser-terms/page.tsx`, `app/terms/page.tsx`, `app/share-preview/page.tsx`), where a canonical is unnecessary.

One real defect found and fixed in this branch: `app/states/[state]/[city]/page.tsx` built the canonical from the raw `city` URL param. Because `dynamicParams = true` renders any slug casing, `/states/texas/Dallas` served an indexable page whose canonical pointed at itself, a duplicate of `/states/texas/dallas`. Fixed by lowercasing the city segment in the canonical only (single page, unambiguous). The state segment was already safe: it uses `st.slug` from `lib/states-data.ts`.

### 1.3 Robots

- `public/robots.txt`: allows all, disallows `/admin`, `/share-preview`, `/api/`, declares the sitemap. Confirmed identical live at https://findmymahjgame.com/robots.txt (fetched 2026-08-22).
- Per-page `robots` meta is used consistently for utility and paused surfaces: `/advertise` and `/venues` are `index: false, follow: true` (matches the "advertising deferred" and "venues paused" decisions), `/terms` and `/advertiser-terms` are `index: false, follow: true`, `/privacy` is `index: false, follow: false` (`app/privacy/page.tsx:8`). Noindexing legal pages is a deliberate-looking choice; the `nofollow` on privacy is stricter than needed but harmless.
- Inventory-gated noindex already exists on city pages: `app/states/[state]/[city]/page.tsx` lines 62 to 79 mark any non-launch-metro city page `noindex, follow` when no published listing matches the city aliases. This is the seed of the indexability rule formalized in `lib/seo/indexability.ts`.

### 1.4 Sitemap correctness

`app/sitemap.ts` builds: 21 static URLs (19 before this branch added `/ask` and `/help`), 51 state URLs (all of `ALL_STATE_SLUGS`), city URLs (8 launch metros always, plus any city with published inventory whose raw city value round-trips to a clean slug), and teacher profile URLs mirroring the gating in `app/teachers/[id]/page.tsx`.

Live check (https://findmymahjgame.com/sitemap.xml fetched 2026-08-22): 162 URLs total: 19 static, 51 states, 56 city pages, 36 teacher profiles. Spot checks, all returned 200: `/`, `/events`, `/teachers`, `/states/nevada`, `/states/texas/dallas`, `/states/new-york/new-york-city`, `/states/missouri/des-peres`, `/teachers/cfa46716-d5b7-45c1-a3cf-2b8d494e82a9`, `/founding-advisors`, `/cruise`.

Defects found:

1. FIXED: `/ask` was missing from the sitemap even though it is linked in the site header (`components/layout/header.tsx:10`), indexable, and carries a canonical (`app/ask/page.tsx`). Added.
2. FIXED: `/help` was missing from the sitemap AND has zero internal links anywhere in `app/` or `components/` (grep for `href="/help"` returns nothing). It was a fully orphaned indexable page. Added to the sitemap, which mitigates but does not cure the orphan risk; an internal link is a content decision for the lead (see section 6).
3. NOT FIXED, needs a decision: the live sitemap contains `https://findmymahjgame.com/states/new-york/new-york-city`, but that URL serves `<meta name="robots" content="noindex, follow"/>` (fetched 2026-08-22). The sitemap includes any city whose raw listing city value slugifies cleanly ("New York City" and "New York" both appear in the DB, producing two sitemap entries for one real place), while the page-level gate evaluates aliases independently. A sitemap should never list a noindex URL. The durable fix is to make both the sitemap and the page metadata call the same `lib/seo/indexability.ts` rule and to fold "new york city" into the "new york" hub in the METROS map. That is a URL-set change, so it is documented here for approval rather than done.

### 1.5 Structured data emitted per page type

All JSON-LD goes through `schemaScriptProps()` in `lib/schema.ts`, which escapes `<` (XSS-safe serialization). Emission sites (grep for `schemaScriptProps|application/ld+json`):

| Surface | File | Types emitted |
| --- | --- | --- |
| Every page (root layout head) | `app/layout.tsx:68` | Organization, WebSite with SearchAction |
| State pages | `app/states/[state]/page.tsx` via `buildStatePageSchema` | BreadcrumbList, CollectionPage, ItemList of LocalBusiness (teachers), Event per future-dated event |
| City pages | `app/states/[state]/[city]/page.tsx` | page-level schema |
| Events hub | `app/events/page.tsx:221` | Event array (future-dated only, capped at 50) |
| Tournaments, leagues, travel | `app/tournaments/page.tsx`, `app/leagues/page.tsx`, `app/travel/page.tsx` | Event arrays; travel adds BreadcrumbList + CollectionPage |
| Cruise | `app/cruise/page.tsx:60` | BreadcrumbList, CollectionPage |
| Teacher profile | `app/teachers/[id]/page.tsx:100` | BreadcrumbList, LocalBusiness or Person |
| FAQ | `app/faq/page.tsx:108` | FAQPage (the only page emitting it; `lib/schema.ts` deliberately voids the duplicate FAQPage in `buildHowItWorksSchema`, see comment at the `void faqPage` line) |
| How it works | `app/how-it-works/page.tsx` | 3 HowTo |
| About | `app/about/page.tsx` | AboutPage, Organization, Person |
| Contact, get-listed, list-my-game | respective pages | ContactPage / WebPage + BreadcrumbList |

Structural validation: the Event objects on `/events` (`app/events/page.tsx:128-137`) carry name, startDate, eventStatus, eventAttendanceMode, location, and url only when `safeHttpUrl` passes; every one of those fields is rendered on the visible card (same file, `renderCard`). Past-dated events are excluded from markup on both `/events` (`_today` filter) and state pages (`lib/schema.ts`, `_todayMid` check), which avoids the Google "past event" quality error. The Organization logo `https://findmymahjgame.com/icons/icon-512.png` exists (200 live). Live verification: `/states/nevada` emits Organization, WebSite, BreadcrumbList, CollectionPage, ItemList with 3 LocalBusiness entries (fetched 2026-08-22), matching the teachers the page displays (including the featured Las Vegas Mahjong listing added at `app/states/[state]/page.tsx:109`).

One structural observation, no fix needed: because the Organization + WebSite block lives in the root layout, every page (including noindex utility pages) carries it. That is accepted practice and not a misdescription.

### 1.6 Indexability per route class

| Route class | Indexable? | Mechanism |
| --- | --- | --- |
| `/`, hub pages, brochure pages | yes | metadata, sitemap |
| `/states/[state]` x51 | yes, all of them | static params from `ALL_STATE_SLUGS`; unknown slug 404s |
| `/states/[state]/[city]` | launch metros always; others only with published inventory | `generateMetadata` gate, `app/states/[state]/[city]/page.tsx:62-79`; junk slugs render but noindex |
| `/teachers/[id]` | published, non-NV, instruction-typed rows only | `getTeacher` gate; otherwise noindex + 404 body |
| `/advertise`, `/venues`, `/home-v2` | no (deliberate) | `robots: index false` |
| `/terms`, `/advertiser-terms`, `/privacy` | no (deliberate) | `robots: index false` |
| confirm/claim/unsubscribe/played/t/[code]/favorites/share-preview | no | `robots: index false` |
| `/admin/**`, `/api/**` | no | robots.txt + admin layout |

### 1.7 Redirects, host, trailing slash

- `next.config.ts redirects()`: `/venues -> /` (venues paused), `/ambassadors -> /join`, `/retreats -> /travel`, all permanent (308). No other redirect layer found (no `vercel.json`, no middleware redirects).
- Host consistency: `https://www.findmymahjgame.com/` returns 308 to `https://findmymahjgame.com/` (checked live 2026-08-22). Apex is canonical everywhere in code (`lib/schema.ts` SITE_URL, `app/sitemap.ts` BASE).
- Trailing slash: `https://findmymahjgame.com/events/` returns 308 to `/events` (checked live 2026-08-22). Next.js default, consistent with all canonicals.
- HSTS with preload, X-Content-Type-Options, Referrer-Policy set in `next.config.ts headers()`.

### 1.8 Orphan risk

- `/help`: zero internal links (grep across `app/` and `components/`). Now in the sitemap (this branch) but still needs a visible link, likely from `/play`, `/faq`, or the footer. Content edit, out of lane scope.
- `/cruise`: linked from `/travel` page content, in sitemap. OK.
- `/founding-advisors`: linked from footer and `/join`. OK.
- `/advertise` and `/advertiser-terms`: intentionally unlinked and noindexed until Year 2 (matches the advertising-deferred decision). Not a defect.
- Production drift note: the live homepage title is "Find My Mahj Game | Mahjong Players & Groups Nationwide" which matches `app/page.tsx:11` on main; the sitemap and pages fetched live all match current main behavior.

## 2. Analytics state

- The only analytics present is Vercel Analytics: `@vercel/analytics` in `package.json`, mounted as `<Analytics />` in `app/layout.tsx:78`. That gives anonymous page views and Web Vitals. No custom events: grep for `track(`, `gtag`, `GA4`, `googletagmanager`, `plausible`, `umami`, `posthog`, `mixpanel` across `app/`, `components/`, `lib/` finds nothing.
- No GA4. No measurement ID anywhere in the repo or `.env.local` key names.
- No server-side event logging either: `app/api/ask/route.ts` answers questions but persists nothing (no `insert` in the file), so zero-result searches and ask questions are invisible today. Same for `/events` searches (`lib/search.ts` reads only).
- Search Console: the site IS verified by HTML file: `public/google31790a5f1e6d1354.html` exists, serves 200 live, committed in `b93d5d6 "Add Google Search Console HTML verification file"`. There is no GSC API integration in code. `HANDOFF.md:185` states "Google Search Console is not connected yet" in the context of the weekly digest workflow, and sitemap submission appears as a launch-day manual step in `docs/launch/fmg-launch-day-runbook-hour-by-hour-timeline-pre-l.md:174`. Whether the sitemap was actually submitted cannot be verified from the repo; treat as unconfirmed.
- The privacy policy already constrains the choice: `app/privacy/page.tsx:48` promises "cookies only as required for the site to function... privacy-respecting analytics... no advertising cookies or cross-site trackers."

## 3. Measurement plan (proposal, nothing implemented)

### 3.1 Tool recommendation

Recommendation: stay on Vercel Analytics and add its custom events (`track()` from `@vercel/analytics`), rather than adding GA4.

- Fits the existing privacy promise. Vercel Analytics is cookieless; GA4 sets cookies and would put `app/privacy/page.tsx:48` in breach or force a consent banner, which this audience (45 to 70, per `docs/launch/chief-of-staff-lists.csv:83`) will find hostile.
- Zero new vendors, zero new script weight beyond what already ships, no CSP change (`next.config.ts` CSP would need `googletagmanager.com` added for GA4).
- Tradeoffs stated plainly: Vercel Analytics custom events give counts and simple properties, not user-level funnels, cohorts, or ad attribution. No free API for pulling data into the future admin SEO area on the current plan; the admin contract in `lib/seo/contracts.ts` therefore sources behavioral funnel metrics from our own database events where durability matters (see 3.3). If the business later needs cohort analysis or ads, revisit GA4 with a consent layer; that decision is flagged for the owner.

### 3.2 Minimal event taxonomy

Names are snake_case, one object payload each, no PII ever (no emails, no names, no free-text question bodies in analytics; free text stays in our own DB where we control it).

| Event | Fired where | Payload | Why |
| --- | --- | --- | --- |
| `search_performed` | server component render of `/events` when `near` param present (`app/events/page.tsx`), and `/teachers` with `near` | `{ surface, state, radius, result_count }` | demand mapping per metro |
| `zero_result_search` | same call sites when `result_count === 0`; also `/api/ask` when the relaxation ladder exhausts (`searchEventsWithRelaxation` in `lib/search.ts:547`) | `{ surface, state, query_kind }` | the single best signal for where to recruit inventory next |
| `listing_viewed` | `app/teachers/[id]/page.tsx` render | `{ listing_kind: "teacher", listing_id, state }` | supply-side value proof for the $89 membership |
| `listing_contact_action` | outbound clicks: website/email/instagram on teacher profile, `registration_url` on event cards, Connect submits (`app/api/connect`) | `{ listing_kind, listing_id, channel }` | THE value metric sold to members; must be durable, so also write a row to a `listing_contact_events` table (Jason, see 6) |
| `ask_question_submitted` | `app/api/ask/route.ts` after rate limit passes | `{ intent, had_results }` | measures the Ask funnel without storing question text in analytics |
| `signup_started` / `signup_submitted` | `/list-my-game`, `/get-listed`, `/join` form submit routes (`app/api/list-my-game`, `app/api/get-listed`) | `{ funnel, tier }` | conversion baseline for the pricing model |
| `newsletter_subscribed` | `app/api/subscribe` | `{ state }` | per-state weekly list growth (Mailchimp STATE field already exists) |

Client-side events use `track()` from `@vercel/analytics`; server routes use `track()` from `@vercel/analytics/server`. Contact actions and zero-result searches should ALSO be inserted into Supabase tables (`listing_contact_events`, `search_gap_events`) because analytics vendors age out raw data and these two feed member reporting and the coverage roadmap. Table design belongs to Jason's backend lane; the typed shapes are sketched in `lib/seo/contracts.ts`.

### 3.3 Where the admin SEO area gets each metric

Defined as types in `lib/seo/contracts.ts` (this branch, types only):

- Search Console API: impressions, clicks, position by page and query, index coverage state per URL. Needs OAuth or a service account added to the GSC property; not buildable from the repo alone.
- GA4: nothing, unless the owner overrides the tool recommendation. The contract keeps an optional slot so the interface does not churn if that decision flips.
- Vercel Analytics: page views and custom event counts, read manually from the dashboard until an API path exists.
- Our database (authoritative): listing counts by status/state/city/variant (via `lib/fetch-all.ts` + tables), metro readiness (`summarizeMetro` in `lib/market-coverage.ts`), indexability verdicts (`lib/seo/indexability.ts`), contact and gap events once Jason lands the two tables.

## 4. Programmatic SEO architecture

### 4.1 Actual inventory (queried from Supabase on 2026-08-22, service role, published rows only)

- 90 published `event_listings`, 42 published `venue_listings`, 0 published `player_listings`.
- 15 states have any published listing: TX 24, CA 14, GA 13, AZ 13, FL 11, MA 9, IL 9, NY 7, MO 7, DC 6, TN 5, NV 5, NJ 4, VA 3, MD 2.
- 67 distinct city+state values. Distribution of listings per city: 44 cities have exactly 1, 7 have 2, 4 have 3, 6 have 4, 1 has 5, 4 have 6, 1 has 9 (Dallas). So only 16 of 67 cities have 3 or more listings.
- Variant: 80 AMERICAN, 52 UNKNOWN or null, 0 other. Current evidence (confirmed_active_at within 180 days, the `isCurrent` rule in `lib/market-coverage.ts:52`): 28 of 132.

### 4.2 Page hierarchy

Four levels, three of which already exist:

1. National hubs (exist): `/events`, `/teachers`, `/tournaments`, `/leagues`, `/travel`. Always indexable.
2. State (exists): `/states/[state]`, all 51 indexable. Correct today: even empty states serve navigation plus nearby-state links, and 51 pages cannot trigger a doorway-pattern penalty. Keep all 51 indexable and in the sitemap (empty ones already carry lower priority and no lastmod, `app/sitemap.ts` statePages).
3. City (exists): `/states/[state]/[city]`. Suburb listings fold into metro hubs via the METROS map (`app/sitemap.ts`, mirrored in the city page). This is the right shape; the gap is that indexability is decided in two places with two different rules.
4. City + category (DOES NOT exist yet, e.g. `/states/texas/dallas/tournaments`): do not build until the data supports it. With the current distribution, exactly one city (Dallas, 9) could plausibly clear a per-category threshold. Building the route class now would create 200+ thin URLs to noindex. Revisit when 10 or more metros reach USEFUL readiness in `lib/market-coverage.ts`.

### 4.3 Deterministic indexability rules

Implemented dark in `lib/seo/indexability.ts` (pure function, not wired to any page). Thresholds chosen from the real distribution above and aligned with the existing readiness gates in `lib/market-coverage.ts:139-146`:

- Rule CITY-1: a launch metro (the 8 in `generateStaticParams`, `app/states/[state]/[city]/page.tsx:33`) is always indexable. Business commitment; matches shipped behavior.
- Rule CITY-2: any other city page is indexable only when, counting the metro's published listings (hub plus folded suburbs): `published >= 3` AND `variantConfirmed >= 2` (mahjong_variant = AMERICAN) AND `currentEvidence >= 1` (confirmed_active_at within 180 days). Otherwise `noindex, follow` (never 404: the page still serves real listings and its state-page links).
- Rule CITYCAT-1 (future route class, ships with the route or not at all): a city+category page is indexable only when the city passes CITY-2 AND the category count is `>= 2` with `>= 1` current-evidence listing in that category. Below that the route should 404 rather than noindex, because unlike city pages there is no navigation value in an empty category shell.
- Rule SITEMAP-1: the sitemap must include exactly the URLs the rule marks indexable. A noindex URL in the sitemap is a contract violation (the live `/states/new-york/new-york-city` entry violates this today, see 1.4).

Why these numbers, from the data: 1 listing (the current de facto gate) would index 67 city pages of which 44 are single-listing pages, mostly with unconfirmed variant and stale evidence; that is the thin-programmatic pattern `EXECUTIVE-HANDOFF/08-Archive/historical-growth-strategy/08-execution-roadmap.md:85` explicitly warns kills whole subfolders. 3 published listings admits 16 cities; layering variant (61 percent AMERICAN overall) and evidence (21 percent current overall) lands the initial indexable non-launch set at roughly 8 to 12 city pages, each of which actually answers the query "mahjong in {city}". The thresholds are inputs to one pure function, so tightening them later is a one-line change with tests.

## 5. What this branch changed versus documented

Changed (low risk, in-lane):

1. `app/sitemap.ts`: added `/ask` and `/help` to staticPages.
2. `app/states/[state]/[city]/page.tsx`: canonical now lowercases the city segment so case-variant URLs cannot claim themselves canonical (single-page, unambiguous fix).
2b. Brand-doubled titles: `app/about/page.tsx`, `app/how-it-works/page.tsx`, `app/contact/page.tsx`, `app/advertise/page.tsx`, and `app/founding-advisors/page.tsx` wrote titles that already contain "Find My Mahj Game", and the root template in `app/layout.tsx` appended the brand again, rendering titles of 77 to 85 characters (about 79 and how-it-works 77 measured in the local build by tests/seo.spec.ts; contact 84 and advertise 85 computed from the title string plus the 20-character template suffix). Fixed by switching those five to `title: { absolute: ... }`, the pattern `app/page.tsx` and the city pages already use. Rendered titles are now 37 to 66 characters with the brand once. `/join` also doubles the brand ("Join the Find My Mahj Game Directory | Find My Mahj Game", 57 chars) but stays inside length bounds, so it was left alone.
3. `lib/seo/indexability.ts` (new): the CITY/CITYCAT rules above as a pure function, plus tests. Ships dark; nothing imports it in app code yet.
4. `lib/seo/contracts.ts` (new): typed interfaces for the future admin SEO data area (types only, no implementation).
5. `tests/seo.spec.ts`: extended per-route metadata and h1 coverage, sitemap local sample check, structured data JSON validity and field-honesty checks on events and teachers, and unit-style tests for the indexability rule.

Documented for approval, NOT changed (high blast radius):

- Unify sitemap city inclusion and page-level noindex behind `lib/seo/indexability.ts` (changes the published URL set; also fixes the new-york-city noindex-in-sitemap violation and folds "new york city" into the "new york" hub in the METROS maps, which exist in duplicate in `app/sitemap.ts` and `app/states/[state]/[city]/page.tsx` and can drift).
- Add an internal link to `/help` (content decision).
- Decide the analytics tool (recommendation: Vercel Analytics custom events, no GA4) and approve the event taxonomy in 3.2; then wiring is a small follow-up lane.
- Jason: `listing_contact_events` and `search_gap_events` tables per `lib/seo/contracts.ts` sketches (belongs in the FMG Backend Handoff doc).
- Confirm in Search Console that the sitemap was actually submitted (repo proves verification, not submission).
- Optional: reconsider `noindex, nofollow` on `/privacy` (`follow: false` is stricter than needed; near-zero impact either way).

## 6. Decisions needed from the lead or owner

1. Approve the indexability thresholds (CITY-2: 3 published, 2 variant-confirmed, 1 current) so the dark-shipped rule can be wired into the city page metadata and sitemap in one follow-up change.
2. Approve "no GA4, Vercel custom events + first-party tables" as the measurement stance, because it is the last cheap moment to choose; the taxonomy in 3.2 is ready either way.
3. Approve folding "new york city" into the "new york" metro hub (one-line METROS addition in two files) so one real place stops producing two sitemap URLs, one of them noindex.
4. Route the two event tables to Jason with the pricing-model reporting requirement attached (contact actions are the metric that justifies $89 a year).
