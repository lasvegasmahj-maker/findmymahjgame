# Issue escalation ladder: Sev1/2/3 definitions for FMG launch (site down, data leak, broken signup) with the exact response for each

# Find My Mahj Game: Issue Escalation Ladder

Owner: Shauna (founder, final call on anything user-facing or trust-related)
Technical responder: Jason (deploys, database, Vercel, Supabase)
Public contact: hello@findmymahjgame.com
Stack reality this ladder assumes: Next.js on Vercel (push to main auto-deploys, no review gate between push and live), Supabase (database + Row Level Security), Resend (transactional email), Mailchimp (newsletter). Launch is in about 10 days.

This is the launch-window version. It is deliberately short so it works at 11pm on a phone. Keep it open in a tab or pinned during launch week.

---

## How to use this in 30 seconds

1. Read the one-line test for each severity below, top to bottom.
2. Stop at the FIRST one that matches. That is your severity. When unsure between two, pick the more severe one.
3. Do the "First 3 moves" for that severity. Do not skip to debugging.
4. Start the clock and write down the time you noticed the problem.

The three launch nightmares, mapped:
- Site down (nobody can reach the site or sign up) = Sev1.
- Data leak (private info exposed, or the database is open) = Sev1.
- Broken signup or matcher (forms fail, confirmations stop, but the site loads) = Sev2.

---

## Sev1: Stop everything (emergency)

One-line test: The site is down for everyone, OR private data is exposed, OR money/trust is actively at risk right now.

Examples:
- findmymahjgame.com returns an error, a blank page, or will not load for anyone.
- A private field is visible in the public site or in the API: an email, phone number, home address, a stripe_payment_id, reviewer notes, or attendee full names on a public table page. (These exact fields were the launch-gate criticals, so they are the first thing to check.)
- Anyone can publish a listing without review, or anyone can confirm a "played" game from a public link. (The self-publish hole and the public confirmation link were both closed before launch; if either reappears, it is Sev1.)
- The Supabase anon key can read or write data it should not (RLS is off or bypassed).
- A secret key (Supabase service role, Resend, Mailchimp, Vercel token) was pasted into chat, committed to the repo, or otherwise exposed.

Target response time: act within 15 minutes of noticing. Aim to contain within 1 hour.

First 3 moves:
1. Text Jason immediately. Say "Sev1" and one sentence on what you see. If you cannot reach him in 10 minutes, you still start move 2 yourself.
2. Contain before you diagnose.
   - If it is a bad deploy (site broke right after a push): roll back in the Vercel dashboard to the last known-good deployment. (Habit: write down the current production deployment ID before any deploy, so rollback is one click. This is already the LAUNCH_GATE rule.)
   - If it is a data leak: the priority is to stop the exposure, not to find who caused it. Take the affected page or feature offline, or revert the change that exposed it. For a database-level leak (RLS / anon access), Jason re-applies the column revoke or the restrictive policy in the Supabase SQL editor.
   - If it is a leaked secret: rotate that key immediately (generate a new one in the provider, update it in Vercel env, remove the old one). A pasted secret is a compromised secret. Do not wait.
3. Verify the fix the same way it was found: reload the public site in a private/incognito window; for a data leak, view the page source and search for the leaked field (contact_email, phone, stripe_payment_id) and confirm zero matches. Do not declare it fixed until you have re-checked with your own eyes.

If real personal data was exposed (not seed data, actual people's emails/phones/addresses):
- Write down what was exposed, roughly how many people, and the window of time it was live. You need this for the next step.
- Notify affected people honestly and quickly. The privacy policy commits to handling removal requests within 7 days; an active leak deserves faster. Plain, no spin: what happened, what you did, what they should do (usually nothing).
- Do not post a public statement until Jason and Shauna agree on the wording. One honest message beats five panicked ones.

Do NOT, during a Sev1:
- Push a second "polish" change in the same hour. Fix the one thing, verify, stop. (LAUNCH_GATE: no second same-day deploy for polish.)
- Try to debug the root cause before the bleeding stops. Contain first.

---

## Sev2: Urgent, fix today (the site works, a core path is broken)

One-line test: The site loads, but a core user action fails: signing up, asking to play, getting matched, or receiving a confirmation email.

Examples:
- Newsletter signup, "I want to play," ambassador apply, or the contact form returns an error or silently does nothing.
- Confirmation or matcher emails are not sending (Resend failing, or the daily cron at /api/cron/matcher and /api/cron/ask-played did not run).
- The matcher ran but produced obviously wrong matches, or the "ask played" email went to the wrong people.
- A whole section is broken but not the whole site (for example /teachers errors, or a state page will not load).
- A public form is being flooded with spam inserts or used to send email to attacker-supplied addresses (abuse, but not a data leak).

Target response time: act within 1 hour. Resolve same day.

First 3 moves:
1. Confirm it is real and reproduce it. Try the action yourself as a normal user (click, do not just check for a 200). Note the exact page, the exact step, and any error text.
2. Tell Jason with the reproduction steps. Sev2 does not need a phone call at 2am; a clear message he sees in the morning is fine unless it is launch day, in which case treat it like Sev1 for urgency of contact.
3. Reduce the bleeding while it is fixed.
   - If a form is broken, the goal is "no signup is lost." The subscribe path already emails hello@ on every signup even when Mailchimp keys are missing, so check that fallback is working and capture leads from the inbox manually if needed.
   - If email/cron is the problem, you can trigger the cron path manually or re-run it once Jason confirms it is safe.
   - For form abuse: rate limits are already in place (tables/find 20/min, admin login 5 per 5 min). If a different endpoint is being flooded, Jason adds a limit to it.

Verify the fix by completing the full user action end to end yourself, then watch it once more an hour later to be sure it is stable.

---

## Sev3: Track and fix on schedule (annoying, not blocking)

One-line test: Something is wrong, but no user is blocked from finding people to play and no data is at risk.

Examples:
- A typo, a wrong link, a slightly-off date, or a layout glitch on one device.
- A page looks off on mobile but still works.
- A non-critical link 404s.
- A wishlist improvement someone reported as a "bug."
- A seed-data item that reads awkwardly (remember: lib/states-data.ts is seed data, never present it as real players or counts).

Target response time: log it the same day, fix within the week, batch it with the next normal push.

First 3 moves:
1. Write it down in one place (a running "Launch issues" list or note). Do not fix it live on the spot during launch week unless it is trivial and you can verify it.
2. Decide: does it touch trust, mahjong facts, or the brand voice? If yes, it quietly bumps up in priority even though it is Sev3 (a mahjong-fact error or an em dash on a public page is embarrassing, fix those promptly).
3. Roll the fix into the next normal deploy, with the usual pre-push gate (typecheck clean, reviewer workflows pass, smoke-check key routes after deploy).

Do not page Jason at night for a Sev3. Batch them.

---

## The 4 deploy/recovery moves you will reuse (keep these handy)

1. Roll back a bad deploy: Vercel dashboard, find the last known-good production deployment, promote it. Record the current deployment ID BEFORE every deploy so this is one click.
2. Re-secure the database: Jason opens the Supabase SQL editor and re-applies the relevant revoke or restrictive RLS policy. The migration file already contains the column revokes and the player_listings self-publish fix as a reference.
3. Rotate a secret: create a new key in the provider (Supabase, Resend, Mailchimp, Vercel), update it in Vercel environment variables (never in chat), confirm the site still works, then delete the old key.
4. Smoke test after any fix: load the key routes in a private window and confirm 200s; for a data fix, grep the public HTML for contact_email / phone / stripe_payment_id and confirm zero matches; confirm /teachers excludes NV.

---

## Who to call (fill in the blanks before launch day)

- Jason (technical, deploys, database): phone __________, best backup channel __________
- Shauna (founder, trust and messaging decisions): you
- Vercel status (is it us or them): vercel-status.com
- Supabase status: status.supabase.com
- Where users reach us: hello@findmymahjgame.com (someone should watch this inbox during launch week)

Action item before launch: fill in Jason's phone and backup channel above, and agree which of you watches the hello@ inbox each day of launch week. An escalation ladder with no phone number is just a poster.

---

## One rule above all the others

When private data might be exposed or the site might be down, contain first, diagnose second, and tell the truth fast. Money never crosses the table, and neither does anyone's private information. That promise is the brand. Protecting it beats shipping anything.
