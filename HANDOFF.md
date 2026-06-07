# Find My Mahj Game, Project Handoff

Last updated: 2026-06-07. Audience: an engineer taking over or contributing to this codebase. This document is exhaustive and references exact file paths from the repo root `/Users/shaunabruckman/Projects/findmymahjgame`.

Style note: this repo bans em dashes and en dashes in all content and code. Use commas, periods, parentheses. See `CLAUDE.md`.

---

## 1. What this is

Find My Mahj Game (findmymahjgame.com) is a monetized directory of American Mahjong players, groups, venues, instructors, and events across all 50 US states. Revenue comes from paid advertiser listings (venues, instructors, events, brands) sold through a self-serve funnel with one-click email approval.

It has a sister business, Las Vegas Mahjong (lasvegasmahj.com), a separate repo at `/Users/shaunabruckman/Projects/lasvegasmahj`. The two cross-link. The owner is Shauna Bruckman, a certified instructor and non-technical operator.

---

## 2. Architecture

- Framework: Next.js 16 App Router (`next@16.2.4`), React 19, TypeScript, server components by default.
- Styling: Tailwind CSS v4 (`@tailwindcss/postcss`) plus a large hand-written design system in `app/globals.css`. No `tailwind.config.ts` (v4 needs none).
- Database and storage: Supabase (Postgres + Storage). Project ref `prvsqhtxubjhljrrbkcj`.
- Email: Resend (`resend@6.12.3`), all from `hello@findmymahjgame.com`.
- Hosting: Vercel, team `bbboldxtalent`, project `findmymahjgame`.
- Maps: `react-simple-maps@3.0.0` with TopoJSON loaded from a CDN.
- Icons: `lucide-react`.

Data flow: server components and API routes read and write Supabase. Public pages (state directories) are server-rendered with hourly revalidation. Forms POST to API routes that persist to Supabase and send Resend email. The advertiser approval loop is driven by HMAC-signed links in email.

Two kinds of "data" coexist and must not be confused:
- Real data in Supabase: `player_listings`, `venue_listings`, `event_listings`, `ad_listings`, plus the funnel tables `inquiries` and `listing_submissions`.
- Seed data in `lib/states-data.ts`: static geographic context (city lists, neighboring states, descriptions). This is NOT real listings. Never present it as real. State pages combine the seed geography with whatever real published listings exist for that state.

---

## 3. File structure (exact paths)

### App routes (pages)
- `app/layout.tsx` Root layout: fonts (Playfair Display, DM Sans), Supabase/CDN preconnect, homepage JSON-LD, renders `Header`, `NavBar`, page, `Footer`.
- `app/page.tsx` Homepage (`/`): hero, US map, search box, retreats, venues, traveling section, advertising CTA.
- `app/not-found.tsx` Custom 404.
- `app/opengraph-image.tsx` Dynamic OG image for the site.
- `app/about/page.tsx` `/about`.
- `app/faq/page.tsx` `/faq`, FAQPage schema.
- `app/contact/page.tsx` `/contact`, contact form posts to Formspree (`FORMSPREE_URL` in `lib/constants.ts`).
- `app/how-it-works/page.tsx` + `app/how-it-works/how-it-works-client.tsx` `/how-it-works`.
- `app/terms/page.tsx` `/terms` (noindex).
- `app/privacy/page.tsx` `/privacy` (noindex, nofollow).
- `app/advertiser-terms/page.tsx` `/advertiser-terms`.
- `app/states/page.tsx` `/states`, index of all 50 states.
- `app/states/[state]/page.tsx` `/states/{slug}`, dynamic state directory. Queries `player_listings`, `event_listings`, `venue_listings`. Generates static params from `ALL_STATE_SLUGS`. Hourly revalidate.
- `app/states/[state]/client.tsx` Interactivity for the state page (city filter dropdown).
- `app/states/[state]/opengraph-image.tsx` Per-state OG image.
- `app/list-my-game/page.tsx` + `app/list-my-game/list-my-game-client.tsx` `/list-my-game`, free player listing form.
- `app/get-listed/page.tsx` + `app/get-listed/get-listed-client.tsx` `/get-listed`, business listing intake (includes logo upload to Supabase Storage).
- `app/advertise/page.tsx` + `app/advertise/advertise-client.tsx` `/advertise`, Step 1 pricing inquiry (name, email, business, interest).
- `app/advertise/submit/page.tsx` + `app/advertise/submit/submit-client.tsx` `/advertise/submit` (noindex), Step 2 full listing form with type-specific fields and logo file upload.
- `app/advertise/approved/page.tsx` `/advertise/approved` (noindex), result page after Shauna clicks approve or reject in email. Reads `?result=` and `?name=` query params.
- `app/admin/layout.tsx` + `app/admin/page.tsx` `/admin` (noindex), client-side approval dashboard. See Security section, the gating is weak.
- `app/share-preview/layout.tsx` + `app/share-preview/page.tsx` `/share-preview`, social share preview.
- `app/sitemap.ts` Dynamic sitemap (homepage, static pages, all 50 states).

### API routes
- `app/api/advertise-inquiry/route.ts` POST. Step 1 funnel. Validates and clamps input, inserts `inquiries`, emails the inquirer the pricing options and Shauna a notification. Uses service-role Supabase + Resend.
- `app/api/advertise-submit/route.ts` POST. Step 2 funnel. Validates email and listing type, clamps all fields, validates URL schemes, inserts `listing_submissions` (status `pending`), emails Shauna an approval preview with HMAC approve/reject links, emails the advertiser a confirmation.
- `app/api/advertise-approve/route.ts` GET. Verifies the HMAC token (timing-safe, 7-day expiry), atomically transitions the row only if still `pending` (replay-safe), emails the advertiser on approval, redirects to `/advertise/approved`.
- `app/api/notify/route.ts` POST. Generic notifier used by site forms. Enforces an allowed `type` set, clamps and escapes subject and body, emails Shauna.

### Server actions
- `app/actions/submit-inquiry.ts` `"use server"` action, service-role Supabase, used for inquiry submission.

### Components
- `components/layout/header.tsx` Top nav and logo.
- `components/layout/nav-bar.tsx` Secondary nav (Find Local Game, Browse All 50 States, Retreats, Traveling, Advertise).
- `components/layout/footer.tsx` Footer with four nav columns.
- `components/home/us-map.tsx` Clickable US map (`react-simple-maps`, dynamic import, client-only). FIPS to abbreviation mapping, navigates to `/states/{slug}`.
- `components/home/search-box.tsx` City or state search, matches `CITY_TO_SLUG` built from `lib/states-data.ts`, routes to the state page.

### Lib
- `lib/supabase.ts` Browser Supabase client using `NEXT_PUBLIC_SUPABASE_ANON_KEY`. Exports `supabase`.
- `lib/supabase-server.ts` Server Supabase factory `createServerClient()` using `SUPABASE_SERVICE_ROLE_KEY`. Server-only.
- `lib/sanitize.ts` `escapeHtml`, `isValidEmail`, `clampText`, `safeHttpUrl`. Used by all email-sending API routes.
- `lib/schema.ts` JSON-LD builders: `buildHomepageSchema`, `buildStatePageSchema`, `buildAboutPageSchema`, `buildHowItWorksSchema`, `buildContactPageSchema`, `buildListMyGamePageSchema`, `buildGetListedPageSchema`, `buildAdvertisePageSchema`, plus `schemaScriptProps`. Emits Organization, WebSite, CollectionPage, ItemList, LocalBusiness, Event, BreadcrumbList, FAQPage, HowTo, Service, OfferCatalog.
- `lib/constants.ts` `SITE_NAME`, `SITE_URL`, `CONTACT_EMAIL`, `AD_EMAIL`, `SISTER_SITE`, `FORMSPREE_URL`.
- `lib/states-data.ts` `STATES` (Record of 50 `StateData`: name, abbr, slug, cities[], nearby[], desc) and `ALL_STATE_SLUGS`. Static seed.

### Public
- `public/robots.txt` Allows `/` and `/states/*`. Disallows `/admin/*`, `/share-preview/*`, `/api/*`. Links the sitemap.
- `public/*.svg` Next.js starter SVGs (`file`, `globe`, `next`, `vercel`, `window`), largely unused.

### Config
- `next.config.ts` Image optimization allowlist (`prvsqhtxubjhljrrbkcj.supabase.co`, lasvegasmahj.com), formats avif and webp.
- `tsconfig.json` Strict, path alias `@/*` to repo root.
- `package.json` Scripts `dev`, `build`, `start`, `lint`. Deps listed in section 2.
- `postcss.config.mjs`, `eslint.config.mjs` Tailwind v4 and Next core-web-vitals lint.
- `app/globals.css` Full design system (colors, nav, buttons, `.form-*` inputs, dropdown branding, cards, responsive).

### Agent operating files
- `CLAUDE.md` Hard rules (style, mahjong facts, pricing, data honesty, link verification), posture, security, process. Read this first.
- `.claude/workflows/pre-push-gate.js` Workflow: `npx tsc --noEmit` plus Technical and Brand reviewer subagents on the diff, returns PASS or FAIL.
- `.claude/workflows/weekly-checkin.js` Workflow: read-only weekly health checks, emails a digest, opens a draft PR of safe fixes only.
- `.claude/settings.json` Permissions (currently `bypassPermissions`). Note: `.claude/` IS committed to git (see Tech debt).

---

## 4. Database schema (inferred from queries)

Supabase Postgres. Column names below are taken from `.insert`, `.select`, and `.update` calls. Verify exact types and constraints in the Supabase dashboard, the repo does not contain SQL migrations.

### inquiries (Step 1 advertising inquiries)
`id` uuid pk, `name`, `email`, `company` nullable, `inquiry_type`, `interest` nullable, `message` nullable, `status` (`new`, `read`, `replied`), `notes` nullable, `created_at`, `reviewed_at` nullable. Written by `app/api/advertise-inquiry/route.ts` and `app/actions/submit-inquiry.ts`. Read by `app/admin/page.tsx`.

### listing_submissions (Step 2 full advertiser listings)
`id` uuid pk, `listing_type` (`venue`, `instructor`, `event`, `brand`), `contact_name`, `contact_email`, `display_name`, `city`, `state_name`, `description`, `website`, `instagram`, `facebook`, `logo_url`, `address`, `hours`, `phone`, `event_date`, `event_type`, `event_location`, `registration_url`, `price`, `bio`, `what_offered`, `photo_url`, `target_states`, `notes`, `status` (`pending`, `approved`, `rejected`), `created_at`. Written by `app/api/advertise-submit/route.ts`. Transitioned by `app/api/advertise-approve/route.ts`.

### player_listings (free player directory entries)
`id` uuid pk, `name`, `city`, `state`, `skill_level`, `availability` nullable, `status` (`pending_review`, `flagged`, `published`, `rejected`), `created_at`, `reviewed_at` nullable. Written by the list-my-game flow, read by `app/states/[state]/page.tsx` and admin.

### venue_listings (paid venue directory entries)
`id` uuid pk, `business_name`, `venue_type`, `city`, `state`, `tier`, `status` (`published`, `flagged`, `rejected`), `contact_email`, `created_at`, `reviewed_at` nullable. Read by `app/states/[state]/page.tsx`.

### event_listings (paid event directory entries)
`id` uuid pk, `event_name`, `event_type`, `city`, `state`, `event_date` nullable, `tier`, `status`, `contact_email`, `created_at`, `reviewed_at` nullable. Read by `app/states/[state]/page.tsx`.

### ad_listings (brand placements)
`id` uuid pk, `company_name`, `placement`, `tier`, `status`, `contact_email`, `created_at`, `reviewed_at` nullable.

### Storage
- Bucket `logos`. Public read path `/storage/v1/object/public/logos/{filename}`. Client uploads go to `/storage/v1/object/logos/{filename}` using the anon key from `app/advertise/submit/submit-client.tsx` and `app/get-listed/get-listed-client.tsx`. Confirm the bucket insert policy, an open anon insert is an abuse vector (see Tech debt).

---

## 5. APIs in detail

### Advertiser funnel, end to end
1. `/advertise` (`app/advertise/advertise-client.tsx`) collects name, email, business, interest, POSTs to `app/api/advertise-inquiry/route.ts`. That route inserts `inquiries` and sends the pricing email, which links to `/advertise/submit`.
2. `/advertise/submit` (`app/advertise/submit/submit-client.tsx`) collects full, type-specific details and an optional uploaded logo, POSTs to `app/api/advertise-submit/route.ts`.
3. The submit route inserts `listing_submissions` with `status='pending'`, then emails Shauna an approval preview built by `buildApprovalEmail(...)`. That email contains two HMAC-signed links (approve and reject) generated by `signToken(submissionId, action)`.
4. Shauna clicks a link, which hits `app/api/advertise-approve/route.ts` (GET). `verifyToken` checks signature (timing-safe), 4-part structure, and 7-day expiry. The status update is atomic (`.eq('id', id).eq('status','pending')`) so a replayed or prefetched link cannot double-process. On approval the advertiser gets a confirmation email. The route redirects to `/advertise/approved`.

### Security helpers
All three email-sending routes use `lib/sanitize.ts`: every user value is HTML-escaped before interpolation into email bodies, emails are format-validated, fields are length-clamped, and URLs are scheme-validated (http and https only) before they become `href` or `src` or are stored.

### HMAC
`signToken` payload is `submissionId:action:expires`, HMAC-SHA256 with `HMAC_SECRET`, base64url-encoded with the signature appended. `verifyToken` recomputes and compares with `crypto.timingSafeEqual`. Tokens are not single-use by nonce, replay is blocked only by the atomic pending check, which is sufficient for this flow.

---

## 6. Environment variables

Names only, never commit values. All live in `.env.local` locally and must also be set in Vercel project settings, and in the cloud routine environment for the weekly check-in.

Server-only (secret):
- `SUPABASE_SERVICE_ROLE_KEY` full DB access, server routes and actions only.
- `HMAC_SECRET` signs approve and reject email links.
- `RESEND_API_KEY` Resend email.

Public (`NEXT_PUBLIC_`, shipped to the browser):
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_SITE_URL` (used by server code to build absolute links, set to the production URL in Vercel)
- `NEXT_PUBLIC_ADMIN_PASSWORD` see Security, this is a problem because it ships to the client.

`.gitignore` ignores `.env*`. It does NOT ignore `.claude/`.

---

## 7. Deployment

- Auto-deploy from GitHub to Vercel is currently BROKEN. As of the last work session the live site had been stuck on an older commit because pushes were not triggering Vercel builds. Deploys have been done manually.
- Manual production deploy: `source ~/.claude/tokens.env && npx vercel --prod --yes --token="$VERCEL_TOKEN"` from the repo root. This deploys local working files, so make sure the working tree is the intended state and `npx tsc --noEmit` passes first.
- GitHub repo: `https://github.com/lasvegasmahj-maker/findmymahjgame`.
- The custom domain `findmymahjgame.com` is aliased to the Vercel production deployment.
- API tokens (`VERCEL_TOKEN`, Supabase management) are in `~/.claude/tokens.env`.

Reconnecting auto-deploy is a top priority (see Next steps). Until then, every change needs a manual `vercel --prod`.

---

## 8. Agent operating structure

This project is maintained largely through Claude Code. The operating rules are encoded so any session behaves consistently.

- `CLAUDE.md` Hard Rules at the top are non-negotiable: no em or en dashes, mahjong fact accuracy (152-tile set, dragons Red=Crak/Green=Bam/White=Soap, flowers interchangeable, card releases every spring, 13 tiles except East=14, set sizes as numbers not letter codes), data honesty (states-data is seed), link verification, verify before publish.
- Pre-push gate: `.claude/workflows/pre-push-gate.js` runs typecheck plus a Technical reviewer and a Brand reviewer over the diff and returns PASS or FAIL. Intended to run before every push since there is no staging review.
- Weekly check-in: `.claude/workflows/weekly-checkin.js` plus a scheduled cloud routine (Vercel/Resend/Supabase/GSC health, sitemap, links, schema, funnel, pending listings, per-state gaps). It emails a digest to `hello@findmymahjgame.com` every Monday around 8am Pacific and opens a draft PR of safe fixes only. Routine id `trig_01FAPmiR5sWYymfdFoKBGvFQ`. It needs `RESEND_API_KEY`, `VERCEL_TOKEN`, `SUPABASE_SERVICE_ROLE_KEY`, `NEXT_PUBLIC_SUPABASE_URL` added to the cloud environment to function fully. Google Search Console is not connected yet.

---

## 9. Completed work

- Full public site: homepage with interactive map and search, all 50 state pages, about, FAQ, contact, how-it-works, terms, privacy, advertiser-terms.
- SEO pass: dynamic sitemap, JSON-LD across pages, per-page metadata, OG images.
- Free player listing flow (`/list-my-game`) and business intake (`/get-listed`) with logo upload to Supabase Storage.
- Two-step advertiser funnel: pricing inquiry, full listing submission, HMAC one-click approve and reject by email, advertiser confirmations, result page.
- Security hardening of all email and API routes (`lib/sanitize.ts`, escaping, email and URL validation, field length caps, atomic approval to prevent replay).
- Sitewide branded dropdowns (white background, navy text, pink chevron, on-brand option list).
- Logo upload by file (replacing paste-a-URL) with type and size validation, and a business-name monogram fallback when no logo is provided.
- Admin dashboard at `/admin` for reviewing inquiries and listings.
- Agent operating structure: CLAUDE.md hard rules, pre-push reviewer gate, weekly check-in workflow and scheduled routine.

---

## 10. Remaining work

- Reconnect GitHub to Vercel auto-deploy so pushes deploy without manual intervention.
- Enable and verify Supabase RLS on every table, especially `inquiries` and `listing_submissions` (PII). See Security.
- Replace client-side admin auth with real server-side auth and remove `NEXT_PUBLIC_ADMIN_PASSWORD`.
- Add rate limiting to public POST endpoints (`advertise-inquiry`, `advertise-submit`, `notify`). CLAUDE.md mandates a 20 req/min per IP baseline that is not implemented.
- Connect Google Search Console for the weekly digest.
- Confirm the `logos` Storage bucket policy is not an open anon write surface, or move uploads server-side.
- Populate real listings per state, many states are thin. The weekly digest reports the thinnest states.
- Optional: bring the sister site (lasvegasmahj) dropdowns to the same branded style.

---

## 11. Technical debt

- Branch hygiene: work has repeatedly landed on side branches instead of `main` (for example `agent-ops-setup`, and the current branch is `fmg-build-safe`). This previously caused pushes to a stale `main` and a confusing deploy gap. Standardize on PRs into `main` and verify `git ls-remote origin main` matches what is deployed.
- `.claude/` is committed to git, including `.claude/settings.json` (which currently sets `bypassPermissions`) and the workflow scripts. Decide intentionally what should be tracked. Do not commit machine-specific permission modes if other contributors clone this.
- No SQL migrations in the repo. The schema lives only in Supabase. Consider adding a `supabase/migrations` directory so schema and RLS are versioned.
- No automated tests are present despite CLAUDE.md describing a Playwright matrix. The test suite is aspirational, not implemented.
- Six tables but only some are surfaced. `ad_listings` is referenced once and may be incomplete. Confirm whether brand placements render anywhere.
- Starter SVGs in `public/` are unused and can be removed.
- `lib/states-data.ts` seed and real Supabase listings coexist on state pages, easy to conflate. Keep the boundary explicit.

---

## 12. Known bugs and risks

- HIGH, deploy: auto-deploy from GitHub is not firing. Manual `vercel --prod` is required for anything to go live.
- HIGH, security: admin gating is client-side only. `app/admin/page.tsx` compares the typed password to `NEXT_PUBLIC_ADMIN_PASSWORD`, which is bundled into client JavaScript and therefore public. The dashboard reads tables with the anon key, so if RLS is not locking those tables, anyone can read inquiry and submission PII (names, emails) directly through the public Supabase anon key.
- HIGH, security: verify RLS. If RLS is disabled, the anon key can read all rows in all tables. This must be confirmed and locked before treating any PII as protected.
- MEDIUM, abuse: no rate limiting on the public POST endpoints, so they can be used to flood inserts and to send Resend emails to attacker-supplied addresses.
- MEDIUM, abuse: client-side logo upload uses the anon key directly against Storage. If the bucket allows anon insert, it can be abused to upload arbitrary files.
- LOW: `advertise-approve` is a state-changing GET. Replay and prefetch are mitigated by the atomic pending check and HMAC, but a POST with confirmation would be cleaner.

---

## 13. Recent changes (git history, newest first)

- `e8ef8b9` supabase: safe fallback so build never fails on missing env vars
- `2455785` Listings with no logo show a business-name monogram, offer email-later
- `f894107` Advertiser logo: upload a file instead of pasting a URL
- `7662181` Brand all dropdowns: white background, navy text, pink chevron
- `dfc2fae` Harden advertiser email and API routes, add agent operating rules
- `01baf65` Add two-step advertiser flow with one-click approval
- `28ed190` SEO overhaul: search, sitemap, states index, nav, FAQ, privacy
- `30bbdb5` SEO overhaul: schema, metadata, performance, on-page fixes
- `bf6b670` Add logo and photo upload to listings and sponsored cards
- `a122298` Instructor listings: show email, Instagram, smart Visit button

Current branch at handoff time: `fmg-build-safe` (confirm it is merged to `main` and deployed).

---

## 14. Next steps, prioritized

1. Confirm `fmg-build-safe` is merged into `main`, then deploy and verify the live site matches `main`.
2. Reconnect GitHub to Vercel auto-deploy (Vercel project Settings, Git). Test with a trivial commit.
3. Audit and enable Supabase RLS on all tables. Lock `inquiries` and `listing_submissions` to service-role reads only. Re-test the admin dashboard, which will then need server-side reads.
4. Move admin auth server-side. Remove `NEXT_PUBLIC_ADMIN_PASSWORD`. Gate `/admin` and any data reads behind a server check.
5. Add rate limiting to `advertise-inquiry`, `advertise-submit`, `notify` (per CLAUDE.md, 20 req/min per IP).
6. Lock the `logos` Storage bucket policy or move uploads behind a server route.
7. Connect Google Search Console for the weekly digest.
8. Run the pre-push gate before pushes, and let the Monday routine surface regressions.

---

## 15. Local setup quickstart

```
cd /Users/shaunabruckman/Projects/findmymahjgame
npm install            # or pnpm install
# create .env.local with the variables in section 6
npm run dev            # http://localhost:3000
npx tsc --noEmit       # typecheck, must pass before any push
```

Deploy (until auto-deploy is fixed): `source ~/.claude/tokens.env && npx vercel --prod --yes --token="$VERCEL_TOKEN"`.
