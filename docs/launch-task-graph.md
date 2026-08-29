# Find My Mahj Game: Launch Readiness Task Graph (2026-08-23 snapshot; superseded by docs/launch-readiness-2026-08-29.md)

docs/owner-activation-checklist.md (Completed section) records every item below that
still reads as awaiting or remaining as done. Read this file as history only.

Lead: Fable 5. All four launch gates OFF and staying OFF. Recovery: this file + `git branch -a` + CEO OS matrix.

## Shipped to production (merged to main, deployed, verified)
- Contracts frozen (b3488e0); ownership migration (account_id) applied to prod.
- Duplicate "Las Vegas Mahjong Studio" listing unpublished (admin API, audited).
- Integration-1: indexation earned on value (no launch-metro bypass), sitemap/city/admin share one verdict, Search Console adapter (dark, NOT CONNECTED), Wave 2 data reconciliation, admin launch-gates panel, policy audit + drafts.
- Integration-2: provider claims + dashboard, Mahj Match (engine/request/respond/matcher), safety (18+ consent, block, report, triage), notifications ledger, first-party analytics (host-classified), dual-card homepage hero + nav + discovery strip. match/decide retired (410).
- Launch Simulator (/admin/control): full rehearsal, 14/14 PASS, self-healing, rate limited, gated.
- Admin control center: launch simulation + claims + moderation + notifications + analytics panels.
- notification-health cron scheduled.

## Merged after this snapshot
- Security red-team: merged 2026-08-23 (e24c0dd).
- Accessibility/mobile/performance: merged 2026-08-23 (05403fd).

## Data truth (verified)
0 real accounts, 0 real player signups, 0 real provider signups, 0 paying members, $0 revenue. 11 test profiles (QA), all classified. Contamination: 0.

## Awaiting owner only (never blocks engineering; see docs/owner-decisions-pending.md)
Stripe account + env vars; Search Console credential; policy draft approvals; 2 rules entries; 16 paid-tier-no-payment listings (reset to free?); billing migration application (W3, at owner's Stripe step).

## Remaining after QA lanes land
Integrate security + a11y/perf fixes, final full suite, final data-truth, CEO OS record, owner morning report.
