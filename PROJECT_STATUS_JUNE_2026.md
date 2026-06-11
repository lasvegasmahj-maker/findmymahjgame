# PROJECT STATUS, June 2026 (FMG Handoff)

Single handoff so a new Claude Code session can resume with minimal context loss. Persistent memory at ~/.claude (user, feedback, project memories) also carries forward. The business operating system lives in Google Drive: CEO Operating Systems > FMG - FindMyMahjGame (open "START HERE").

## 1. Current branch
- `product-readiness-previews` (ACTIVE): all preview build work. Latest commit: nav wiring.
- `design-bible-v2`: the Design Bible (all 12 pages reviewed) at `design-bible/README.md`.
- `main`: production. UNTOUCHED by this work.
- Dev server and the CRM background job run on `product-readiness-previews`; both die when VS Code closes (see section 12 to restart).

## 2. Deployment status
- NOTHING deployed. Production (`main` auto-deploys to Vercel) is the current live site, unchanged.
- All preview work is local only (the `product-readiness-previews` branch), served to phone via the dev server.
- Go-live = ONE coordinated deploy after approval (no incremental deploys, per CEO rule).

## 3. Completed work (all on product-readiness-previews, tsc clean, all routes 200)
- Homepage V2 preview at `/home-v2`: 6 sections (Hero + 3 actions, How It Works, honest Community Proof that hides at zero, Newsletter card, Footer). Explicit positioning kept.
- Newsletter: `/newsletter` page + reusable `components/newsletter-signup.tsx` + `app/api/subscribe/route.ts` (adds to Mailchimp when keys present; always emails hello@ so no signup is lost). Homepage V2 card wired.
- New destination pages: `/events` (open-plays-first), `/teachers` (city-first, Nevada excluded for the LV guardrail), `/venues` (BUILT but UNLINKED, revivable).
- Browse States: removed duplicate A-Z block, raised senior fonts, relocated the US map here (`/states`). State-detail (`/states/[state]`): cards go 1-column on phones, tab overflow fixed, Connect modal has role=dialog + Escape + associated labels.
- Mobile: header/footer overrides (header was cramming, footer text too small).
- Navigation wired (preview): header = Events, Teachers, Browse States, Newsletter (List Your Game + Advertise moved to footer). Footer adds a "Find Games" column: Events, Teachers, Browse States, Newsletter, Help. `/venues` NOT linked anywhere.
- Accessibility: global `:focus-visible` ring; aria-labels on Play, Start, Ambassador, and the Connect modal forms; h1 on the table page; map marked aria-hidden (state links are the keyboard/screen-reader path).
- Admin: header links to Metrics and Heat Map.
- 5 audits run (mobile, accessibility, senior, admin, Mailchimp readiness) plus a Dallas pilot acquisition (verified inventory on Desktop).
- Design Bible (on `design-bible-v2`): all 12 pages reviewed with the methodology, plus Events/Teachers/Venues/Newsletter designs and the brand + remove/simplify/reorganize rules.

## 4. Approved decisions
- Positioning: keep the explicit "Find people to play mahjong with" (NOT "Find Your Game. Find Your People.").
- Homepage is a front door: 6 sections, not a directory/dashboard/content hub.
- Venues is NOT a public destination. Venue = supporting metadata inside events, teachers, and state pages. `/venues` stays built but unlinked.
- Primary public destinations: Homepage, Events, Teachers, Browse States, Newsletter.
- Refinement, not rebrand. Preserve navy #1a1f5e, pink #e91e8c, Playfair Display + DM Sans, soft cards.
- Every design change is REMOVE, SIMPLIFY, or REORGANIZE before additions.
- Preview-only; one coordinated production deploy after approval.
- Help: add a Google Voice number, "Call or text us." Ambassador: add a "What Ambassadors Receive" block (designed, not yet built).
- Proof markets: keep Las Vegas, add Dallas. Tier 1 expansion: Dallas (proven), New Jersey, Orange County. Tier 2: Boca, Naples, Phoenix.
- Drive CEO OS is the source of truth; recreate-then-delete workflow (the connector cannot edit/move/delete).

## 5. Open decisions (need Shauna)
- Approve the full preview package, then authorize the coordinated go-live.
- Mailchimp: provide API key + Audience ID (to Vercel, never chat); confirm the audience.
- Recurring games as a core success metric (currently "Under Review" in CEO Dashboard V3).
- New Jersey and Orange County warm contacts (only Shauna knows them).
- Las Vegas host seeds (3-5 Returning Players) and one LV ambassador.
- CRM delivery format (Desktop CSVs and/or Drive).
- "Claude Fable 5" model: Shauna to check `/model` in Claude Code; this session ran on Opus 4.8.
- Two parallel CEO OS roots in Drive (unify or keep separate).

## 6. Product Readiness status
- Built and verified: all preview pages compile (tsc clean) and return 200; mobile + accessibility passes done.
- Awaiting: Shauna's phone review of the preview package, then approval.
- Remaining build for go-live (held for the coordinated deploy, NOT done yet): the homepage SWAP (make `/` serve the V2 content). Small extras to fold in at go-live: Help Google Voice config, Ambassador "What You Receive" block.

## 7. Current FMG architecture
- Public destinations: Homepage, Events (`/events`), Teachers (`/teachers`), Browse States (`/states`), Newsletter (`/newsletter`). Venue = metadata (`/venues` unlinked).
- Core flows: `/play`, `/start`, `/t/[code]` (table), `/help`, `/ambassadors`.
- Supply/admin: `/get-listed`, `/list-my-game`, `/advertise`, `/admin` (+ `/admin/metrics`, `/admin/heatmap`).
- Data (Supabase, service-role, status=published, admin approval): `player_listings`, `event_listings`, `venue_listings`. NO teacher table (teachers currently derive from venue_listings instructor-type; future: a real teacher source).
- APIs: `/api/subscribe` (new, Mailchimp + Resend), `/api/want-to-play`, `/api/tables/*`, `/api/ambassadors/apply`, `/api/notify`.
- Stack: Next.js 16 (Turbopack), Supabase, Resend (transactional email), Vercel (auto-deploy on push to `main`), Mailchimp (newsletter, to be wired). Design tokens in `app/globals.css`.

## 8. Las Vegas guardrails
- FMG does NOT recruit or promote competing Las Vegas teachers. In Las Vegas, FMG is the community and games layer that FEEDS Las Vegas Mahjong (Shauna's teaching business); players who want lessons go to LVM.
- Teachers page excludes Nevada (`.neq("state","NV")`).
- State pages keep the existing "Las Vegas Mahjong" sponsored block on the Nevada page.
- CRM: Nevada teachers are flagged "do not publish as competing teacher" (kept as data, excluded from public teacher listing).
- Las Vegas focus = players, hosts, tables, open plays, venues, newsletter, community. Teacher inventory comes from Dallas and national.

## 9. Admin / dashboard status
- `/admin` works; the approve/review flow is solid (keep). Added header links to North Star Metrics and Heat Map.
- North Star metrics (Created, Filled, Played, Recurring) at `/admin/metrics`; heat map at `/admin/heatmap`.
- Optional lightweight tidy (not a launch blocker): a North Star strip on the admin landing and counting flagged venues/events in the banner.

## 10. Mailchimp status
- Signup UI built (`/newsletter`, homepage V2 card, shared component). `/api/subscribe` wired: adds to Mailchimp when `MAILCHIMP_API_KEY` + `MAILCHIMP_AUDIENCE_ID` are set; always emails hello@ so signups are never lost before keys exist.
- Ready: `~/Desktop/FMG-newsletter-import-CLEAN.csv` (195 deduped contacts). Issue 1 drafted (honest, no fake tables).
- TODO for live: get the key + Audience ID from the LVM Mailchimp account, add them to VERCEL env vars (not chat), import the 195, send Issue 1. NOT live until the code is deployed AND keys are in Vercel.

## 11. Monday launch checklist (one coordinated deploy)
1. Shauna reviews the preview package on phone, approves.
2. Homepage swap: make `/` serve the V2 content (nav is already wired).
3. Merge `product-readiness-previews` into `main` (auto-deploys to Vercel) = the single deploy. Run the CLAUDE.md pre-push gate first (tsc clean + reviewer workflows).
4. Add `MAILCHIMP_API_KEY` + `MAILCHIMP_AUDIENCE_ID` in Vercel; import the 195 into Mailchimp.
5. About 90 seconds post-deploy, smoke-check key routes for 200: `/`, `/events`, `/teachers`, `/states`, `/newsletter`, plus the funnel pages.
6. Send Newsletter Issue 1.
7. Begin Monday outreach: send the 6 Tier 1 teachers (Tier 1 Outreach doc), contact the 5 LV partners, name LV host seeds.

## 12. Immediate next actions (for the new session)
- Restart the dev server: `cd ~/Projects/findmymahjgame && npm run dev` (stay on `product-readiness-previews`). Phone base was `http://192.168.0.8:3000` (the IP can change; re-check with `ipconfig getifaddr en0`).
- FINISH THE CRM BUILD: a 22-agent ecosystem CRM was ~20/22 done but did not complete (background job killed on VS Code close). Re-run it from the saved script, then assemble 5 CSVs to Desktop. Script: `~/.claude/projects/-Users-shaunabruckman/ade57cda-b6fa-455c-8635-65a5435ebf38/workflows/scripts/mahjong-ecosystem-crm-wf_9abb67e7-726.js`. Re-invoke with `Workflow({ scriptPath })`. On completion build: Teachers, Events/Open Plays, Organizations, Influencers, Potential Ambassadors. Add columns: Player-Help Rank, Priority Metro, Claim-invitable, Best Channel. Prioritize metros: Dallas, New Jersey, Orange County, Scottsdale, Boca, Houston, Austin, Atlanta, Nashville. Public info only, verify sources, flag uncertain, never fabricate, honor the LV guardrail.
- Collect from Shauna: NJ + Orange County warm contacts; LV host seeds + an ambassador; Mailchimp key + Audience ID.
- On approval: do the homepage swap, then run the Monday launch checklist (section 11).

## Key references
- Drive CEO OS (FMG): START HERE, CEO Dashboard V3, This Week's Execution Plan, Teacher Tracker - LIVE, Ambassador Tracker, Event Tracker, Warm Relationship Activation Log, Warm Market Map, Relationship Activation Map, Tier 1 Outreach, Teacher Activation Plan, Design V2 Review.
- Desktop files: `FMG-newsletter-import-CLEAN.csv` (195 subscribers); `FMG-dallas-teachers-APPEND.csv`, `FMG-dallas-events.csv`, `FMG-dallas-venues.csv` (verified Dallas pilot, ready to append to trackers).
- Design Bible: `design-bible/README.md` on the `design-bible-v2` branch.
