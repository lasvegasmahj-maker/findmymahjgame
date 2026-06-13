# FMG Launch-Day Runbook + Hour-by-Hour Timeline (Pre-Launch Checklist, Deploy Gate, Smoke Routes, Env Vars, Mailchimp, Monitoring, Go/No-Go)

# Find My Mahj Game: Launch-Day Runbook

Single source of truth for go-live day. Ready to use. Owners are named. Every gate is go or no-go. If a no-go check fails, you stop, you do not push forward to look polished.

Status going in: the launch gate is PASS (verified 2026-06-11). The launch code lives on the branch product-readiness-previews. The live site (main) is still the old build. Going live means merging that branch and deploying once.

Owners (fill in real names and phone numbers before the day):
- Founder: Shauna. Owns the go decision, the SQL paste, admin approvals, outreach, the newsletter send.
- Build/Deploy: Jason (technical). Owns the merge, the deploy, env vars, smoke tests, rollback.
- On-call window: both reachable by text for the full launch morning.

Times below are relative (T-minus / T-plus). Pick a real start time when both owners are free for 3 hours with no interruptions. Recommended: a weekday morning so any issue has the full day to fix.

----------------------------------------------------------------

## Part 1: Pre-Launch Checklist (do the day before, T-1)

Work top to bottom. Do not start launch day until every box here is checked. This is the deploy gate.

### A. Code is ready

- [ ] On branch product-readiness-previews, run npx tsc --noEmit. It must come back clean (zero errors). No-go if not.
- [ ] Run the pre-push gate (.claude/workflows/pre-push-gate.js): typecheck plus the Technical and Brand reviewer workflows. Both must return PASS.
- [ ] The homepage swap is done: / serves the V2 content (the 6-section front door), not the old directory homepage. Confirm by loading / locally. (This is the one build step still pending per the status doc. It must be finished before launch, not on launch morning.)
- [ ] Grep the built public HTML for leaked private fields. Zero matches required for all of: contact_email, phone, stripe_payment_id, reviewer_notes. No-go if any appear.
- [ ] /teachers excludes Nevada (the Las Vegas guardrail). Confirm NV teachers do not show.
- [ ] Record the current production deployment ID from the Vercel dashboard and write it here: ____________. This is your rollback target.

### B. Environment variables in Vercel (not in chat, not in email)

Confirm every one of these is set in the Vercel project (Settings, Environment Variables, Production). Secrets never go in chat. If a secret is ever pasted into a chat or email, treat it as compromised and rotate it.

Server-only (must never be NEXT_PUBLIC):
- [ ] SUPABASE_SERVICE_ROLE_KEY
- [ ] HMAC_SECRET (signs the one-click email approve/reject links)
- [ ] RESEND_API_KEY (transactional email)
- [ ] ADMIN_PASSWORD (server-side admin login)
- [ ] CRON_SECRET (protects the daily cron routes; without it the ask-played cron returns 401)

Public (shipped to the browser, safe to be public):
- [ ] NEXT_PUBLIC_SUPABASE_URL
- [ ] NEXT_PUBLIC_SUPABASE_ANON_KEY
- [ ] NEXT_PUBLIC_SITE_URL set to the production URL (https://findmymahjgame.com)

To add for the newsletter (see Part 4):
- [ ] MAILCHIMP_API_KEY
- [ ] MAILCHIMP_AUDIENCE_ID

If a variable is missing, the build still succeeds (there is a safe fallback), but the feature that needs it silently does nothing. Mailchimp is the one to double-check, because a missing key means signups quietly fall back to email-only.

### C. Database is gated (the launch gate, already PASS)

- [ ] Anon SELECT is revoked on the four listing tables; pending rows are invisible to the public; self-publish is closed (new player listings default to pending_review). This was verified live on 2026-06-11. Re-confirm nothing regressed.
- [ ] One small non-blocking SQL delta remains: the ambassadors.referral_code block at the bottom of supabase/migrations/2026-06-10-recurring-open-play.sql. It is not a launch blocker. Paste it when convenient. Note here whether it is done: ____________.

### D. Integrations and monitoring are wired

- [ ] Resend: send yourself one test email through the contact form (/contact). It should land in the hello@ inbox. If Resend is down, every form notification and the played-confirmation emails are dead, so this is a real go/no-go.
- [ ] Cron schedule confirmed in vercel.json: /api/cron/ask-played runs daily at 17:00 UTC, /api/cron/matcher runs daily at 15:00 UTC. The matcher ships DARK: it does nothing until app_settings.matcher_enabled is 'true' AND each match gets a founder one-click approval. Leave it dark for launch. Do not enable matching on day one.
- [ ] Security headers are live (already in next.config.ts): Content-Security-Policy, X-Frame-Options DENY, X-Content-Type-Options nosniff, Referrer-Policy, Permissions-Policy. No action, just confirm they did not get stripped.
- [ ] The Vercel dashboard (Deployments and Logs) is open in a tab and you know where to look for a failed build or a spike in function errors.

### E. Content is staged and ready to fire

- [ ] 552 records are staged pending_review (open plays plus teachers/orgs). Do NOT bulk-approve yet. Approval happens AFTER deploy (Part 5). Approving before deploy can expose contact data on the old build.
- [ ] Newsletter Issue 1 is drafted, proofread, on-brand (no em dashes, no emoji), and honest (no fake table counts). Ready to send.
- [ ] The hold list is written down: no Nevada teachers, no schedule-less open plays, no rows missing provenance. These get rejected, not approved.
- [ ] Outreach lists are open and ready: the 6 Tier 1 teachers, the 5 Las Vegas partners, the Las Vegas host seeds.
- [ ] One founder fact to resolve hour one: Kristel vs Crystal (the San Antonio name). One text. No San Antonio outreach before the answer.

Pre-launch gate result: ALL boxes checked = GO for launch day. Any unchecked = fix first.

----------------------------------------------------------------

## Part 2: The Deploy Gate (the single go/no-go before you ship)

This is the one decision that puts the site live. Both owners present.

GO requires all of these true at once:
1. tsc clean and pre-push gate PASS (Part 1A).
2. Homepage swap done (/ serves V2).
3. PII grep is zero on the built HTML.
4. All Production env vars present in Vercel, including the two Mailchimp keys.
5. Resend test email landed.
6. The rollback deployment ID is written down.
7. Founder says go.

If all seven are true, proceed to the hour-by-hour. If any one is false, NO-GO. Fix it, recheck, then decide again. There is no partial launch.

----------------------------------------------------------------

## Part 3: Hour-by-Hour Launch-Day Timeline

One coordinated deploy. No incremental deploys, no second same-day deploy for polish. If something is wrong, you roll back, you do not patch live.

### T-30 min: final readiness huddle
Owner: Founder + Build
- Both owners on a call or in the same room.
- Walk the Part 2 deploy gate out loud. Confirm all seven.
- Confirm the rollback deployment ID is written down.
- Founder gives the verbal go.
- GO/NO-GO: seven gate items true and founder says go. If no, stop here.

### T-0:00: merge and deploy
Owner: Build (Jason)
- Merge product-readiness-previews into main as one pull request.
- Deploy. Primary path: the push to main triggers the Vercel production build. Fallback if the auto-deploy does not fire within a couple minutes (it has been unreliable in the past): from the repo root run, source ~/.claude/tokens.env && npx vercel --prod --yes --token="$VERCEL_TOKEN"
- Watch the Vercel build to completion. A red build means the deploy did not happen; the old site is still live and safe. Fix the build, do not force anything.
- GO/NO-GO: build is green and the new deployment is promoted to production. If the build fails, you have not gone live; debug calmly, the public still sees the old site.

### T+0:02 to T+0:10: smoke test the routes (the critical gate)
Owner: Build, Founder watches on her phone
Wait about 90 seconds after the deploy promotes, then load each route. Every one must return 200 and render correctly on phone and desktop.

Core public routes (must all be 200):
- / (the new V2 homepage)
- /events
- /teachers (and confirm no Nevada teachers)
- /states and one state page, for example /states/texas
- /newsletter

Funnel and flow routes (must all be 200):
- /play
- /start
- /list-my-game
- /get-listed
- /advertise
- /ambassadors
- /help
- /faq
- /about

Confirm also:
- robots and sitemap load (/sitemap.xml).
- The homepage shows the honest community proof (it hides at zero, it does not invent counts).
- No em dashes or emoji slipped onto any user-facing page.
- Re-run the PII grep against the LIVE HTML now (not just the local build): zero contact_email, phone, stripe_payment_id, reviewer_notes.

GO/NO-GO: every route 200, no NV teachers, PII grep zero on live HTML.
If any core route is not 200, or PII appears: ROLL BACK NOW. In the Vercel dashboard, promote the prior deployment ID you recorded. The site returns to the known-good old build in under a minute. Then debug off-line. Do not leave a broken or leaky page live to save face.

### T+0:10 to T+0:20: turn on the newsletter
Owner: Founder + Build
- Confirm MAILCHIMP_API_KEY and MAILCHIMP_AUDIENCE_ID are live in Vercel (they were added in Part 1B; if they were not, a redeploy is needed for them to take effect).
- Submit a real test signup on /newsletter. Confirm it lands in Mailchimp AND that the hello@ notification email arrives. (The code records the signup in Mailchimp and always emails hello@ as a backstop, so a signup is never lost.)
- Import the 195 deduped subscribers into the Mailchimp audience (the clean import file is ready).
- GO/NO-GO: test signup appears in Mailchimp and the 195 imported cleanly. If Mailchimp errors, signups still fall back to the hello@ email, so this is not a roll-back item; note it and fix Mailchimp after.

### T+0:20 to T+0:45: approve the inventory (order matters)
Owner: Founder, in /admin
Only now, after the site is live and gated, approve content. Approving earlier can expose contact data.
- Log in to /admin (the brute-force lock allows 5 attempts per 5 minutes, so type carefully).
- Bulk-approve the staged inventory, applying the hold list: reject anything that is a Nevada teacher, a schedule-less open play, or a row missing provenance.
- Spot-check 3 to 5 approved listings on the live site. Glance at any outbound links before approving in bulk.
- GO/NO-GO: approved listings render on their state and events pages, no held categories slipped through.

### T+0:45 to T+1:00: confirm the daily jobs are safe
Owner: Build
- Confirm the matcher cron is still DARK (app_settings.matcher_enabled is not 'true'). Do not enable stranger matching on launch day.
- Confirm the ask-played cron is protected by CRON_SECRET (it returns 401 without the bearer, which is correct).
- GO/NO-GO: matcher dark, ask-played protected. Both should already be true; this is a confirmation, not a change.

### T+1:00 to T+1:30: send the newsletter and start outreach
Owner: Founder
- Send Newsletter Issue 1 to the imported audience.
- Send the Kristel vs Crystal text (hour-one founder fact). No San Antonio outreach until she replies.
- Begin Monday outreach: the 6 Tier 1 teachers, then the 5 Las Vegas partners, then name the Las Vegas host seeds.
- Do NOT send claim invites yet. Hold all claim links until the /claim flow is verified end to end (see T+2:00).

### T+1:30 to T+2:00: search and indexing
Owner: Build
- Submit the sitemap to Google Search Console.
- Confirm noindex is intact where it should be: the table pages (/t/[code]), /privacy, /terms, /advertise/submit, and admin.
- GO/NO-GO: sitemap accepted, sensitive pages still noindex.

### T+2:00: claim flow verification (gates claim outreach)
Owner: Build + Founder
- Walk one claim end to end on the live site (request a claim link, follow it, confirm it cannot erase existing links and behaves as expected).
- GO/NO-GO: claim works cleanly start to finish. Only after this passes may the founder send any claim invites.

### T+2:00 onward: monitoring window (first 24 to 48 hours)
Owner: Build primary, Founder watches the inbox
- Watch the Vercel function logs for error spikes, especially on the form POST routes and the cron runs.
- Watch the hello@ inbox: every newsletter signup and every form submission emails it, so a sudden silence or a flood both tell you something.
- The first ask-played cron fires at 17:00 UTC and the first matcher at 15:00 UTC (matcher stays dark). Confirm the ask-played run looks sane in the logs.
- The Monday weekly check-in routine emails a health digest; read the first one.

----------------------------------------------------------------

## Part 4: Mailchimp Setup (reference)

- The signup code (app/api/subscribe/route.ts) adds the email to your Mailchimp audience when both MAILCHIMP_API_KEY and MAILCHIMP_AUDIENCE_ID are set in Vercel. It derives the data center from the key automatically.
- It always also emails hello@findmymahjgame.com, so even if Mailchimp is misconfigured, no signup is lost. This is why a Mailchimp problem is never a roll-back item.
- Single opt-in by design: status is set to subscribed directly, no confirmation email. That is intentional, not a bug.
- An existing member ("Member Exists") is treated as success, so re-imports and duplicate signups are safe.
- Get the key and Audience ID from the Las Vegas Mahjong Mailchimp account. Put them in Vercel, never in chat. Confirm you imported into the correct audience.

----------------------------------------------------------------

## Part 5: Rollback Procedure (one page, know it cold before you start)

When to roll back: any core public route is not 200 after deploy, OR the live-HTML PII grep finds contact_email / phone / stripe_payment_id / reviewer_notes, OR a state or events page renders broken for real users. A Mailchimp or sitemap hiccup is NOT a rollback; those fail safe.

How:
1. Open the Vercel dashboard, Deployments.
2. Find the prior production deployment ID you recorded at T-1 (Part 1A).
3. Promote it to production ("Promote to Production" / instant rollback).
4. Within about a minute the public is back on the known-good old build.
5. Tell the founder, then debug the failed deploy off-line on the branch.
6. Do not attempt a second same-day deploy for polish. Fix it properly, re-run the full Part 1 and Part 2 gates, and pick a fresh launch window.

----------------------------------------------------------------

## Part 6: Owner Checklist (one-glance summary)

Founder (Shauna):
- T-1: drafts and proofs Newsletter Issue 1, confirms the hold list, opens outreach lists.
- T-30: gives the verbal go.
- T+0:20: bulk-approve inventory with the hold list.
- T+1:00: send the newsletter, send the Kristel vs Crystal text, start the 6 + 5 outreach.
- T+2:00: send claim invites only after the claim flow passes.

Build (Jason):
- T-1: tsc clean, pre-push gate PASS, homepage swap done, PII grep zero, all env vars in Vercel, record the rollback ID, Resend test email.
- T-0:00: merge product-readiness-previews into main, deploy, watch the build.
- T+0:02: smoke-test every route, re-grep live HTML for PII.
- T+0:10: confirm Mailchimp keys live, import the 195.
- T+0:45: confirm matcher dark and ask-played protected.
- T+1:30: submit sitemap, confirm noindex.
- T+2:00: verify the claim flow end to end.
- T+2:00 on: watch logs and the hello@ inbox for 24 to 48 hours.

----------------------------------------------------------------

## Sign-off

Launch is complete when: the site is live on the new build, all core routes are 200, the PII grep on live HTML is zero, no Nevada teachers appear, inventory is approved with the hold list applied, the newsletter has gone out, the matcher is dark, and the claim flow is verified.

Founder go (name, time): ____________
Build deployed (deployment ID, time): ____________
Rollback target (prior deployment ID): ____________
Launch confirmed (time): ____________

Sources this runbook consolidates: LAUNCH_GATE.md (the security gate, PASS 2026-06-11), PROJECT_STATUS_JUNE_2026.md section 11 (the Monday checklist this replaces), RULINGS.md (binding decisions: matcher dark, Nevada guardrail, no claim links until /claim is verified), HANDOFF.md (env vars, deploy commands, the manual Vercel fallback), and the live repo (branch product-readiness-previews, vercel.json crons, app/api/subscribe/route.ts, next.config.ts security headers).
