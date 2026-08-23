# Find My Mahj: Launch Readiness Task Graph

Overnight autonomous build, 2026-08-24. Lead: Fable 5. All four launch gates OFF and staying OFF.
Recovery note: if a session dies, resume from this file plus `git branch -a` (worker branches) and the Launch Readiness Matrix in CEO OS Drive.

## Frozen contracts (b3488e0, do not redefine anywhere)
identity (lib/user-auth, profiles), record_class, ownership = account_id on listings,
claim states (lib/claims/contract), matching consent (lib/match/consent), matching states
(lib/match/states), notification taxonomy (lib/notifications/notify), analytics taxonomy
(lib/analytics/events), launch gates (lib/launch-gates), billing truth = Stripe only.

## Active worker lanes (worktree branches; exclusive file ownership stated in each prompt)
| Lane | Branch | Scope | Status |
|---|---|---|---|
| A | wa-claims-provider | claims + provider dashboard + admin claims API | RUNNING |
| B | wb-matching | engine, request/respond routes, matcher cron rewrite, mahj-match page | RUNNING |
| C | wc-safety | consent routes+UI, block/report, triage, admin reports API | RUNNING |
| D | wd-notifications | templates, prefs seam, admin notifications API, health cron | RUNNING |
| E | we-analytics | /api/events, ask+teacher instrumentation, admin analytics API, Vercel analytics | RUNNING |
| F | wf-policy | policy audit + drafts + policy launch-gate checklist | RUNNING |
| H | wh-hero-ask | homepage two-card hero, rotating placeholder, chips, nav, discovery strip | RUNNING |

## Lead-owned in flight
- lead-seo-health branch: GSC adapter (dark, NOT CONNECTED state), sitemap/noindex consistency,
  wave2 data reconciliation checks, admin launch-gates panel.
- Integration of each green lane: review, merge, reviewer gate, deploy, production verify.

## Queued (assign as workers free up; dependencies noted)
| Task | Depends on | Notes |
|---|---|---|
| Launch Simulator (/admin/simulator) | A+B+C+D+E merged | lead architecture; runs the full QA rehearsal, PASS/FAIL panel |
| Admin completion (claims/matching/moderation/notifications/analytics/revenue/health sections on /admin) | worker APIs merged | lead owns app/admin/page.tsx |
| Security red-team | first integration deploy | independent attacker agent; fixes land same night |
| Accessibility + mobile QA sweep | hero merged | worker |
| Performance audit (payloads, queries, CWV) | first integration deploy | worker |
| UX consistency + empty/error states sweep | hero merged | worker |
| SEO intelligence (indexability wiring, internal links, orphans, structured data QA) | lead SEO branch | worker after lead adapter lands |
| Billing E2E in Stripe test mode | Stripe TEST keys creatable? No: needs owner account. Adapter+tests only | READY - AWAITING CREDENTIAL path |
| Launch runbook + morning report + CEO OS record | everything | lead |

## Owner-only (never blocks engineering; recorded in docs/owner-decisions-pending.md)
Stripe account + env vars; Search Console credential; policy draft approvals; two rules entries pending instructor review.
