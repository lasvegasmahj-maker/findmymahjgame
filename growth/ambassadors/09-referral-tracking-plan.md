# Ambassador Referral Tracking Plan

If we cannot tell which ambassador drove which table, we cannot reward the right people or repeat what works. This plan makes attribution simple, honest, and able to scale, and it starts with zero new code.

## What we are tracking

For every ambassador, we want to roll up the North Star funnel:

Tables Formed, then Tables Filled, then Games Played, then Recurring Tables.

Attribution answers one question for each table: which ambassador made this happen?

## What already exists

The database is ready for this today. The `tables` table has a `referred_by` field, and the table-creation flow accepts a `referredBy` value. That means every table can carry the code of the ambassador who started it or inspired it. No schema change is needed to begin.

## Referral code format

Keep codes short, human-readable, and unique. Format:

`FMM-{CITY}-{FIRSTNAME}`

Examples: `FMM-LV-SHAUNA`, `FMM-BOCA-RUTH`, `FMM-NAPLES-LINDA`. If two ambassadors share a city and first name, add a number: `FMM-BOCA-RUTH2`. Assign the code the moment you approve an ambassador, and record it in the master sheet.

## How attribution works, in two phases

### Phase 1: Launch now, zero new code

Run the whole 25-city blitz on this. It is manual but completely workable at 25 ambassadors.

- Give each ambassador their code and tell them: "When you or your players start a table, this is your code. Tell your players to mention it, or just tell me which tables are yours each week."
- Each week, the founder reconciles. For tables the ambassador reports (or that match their city and host first name), record the ambassador in the tracking sheet.
- Optional and still zero code: when the founder or the ambassador starts a table on behalf of the group, the team can write the code into the `referred_by` field through the existing admin or database tools, so the data lives with the table, not only in the sheet.

This is good enough to measure all 25 cities and decide who is working. Do not block the launch waiting for automation.

### Phase 2: Small build for automatic attribution (recommended, optional)

When you are ready to greenlight a small, well-scoped change (this is the main remaining build referenced in the KPI Dashboard), automate capture so you stop reconciling by hand. Scope for Jason:

1. Referral link. Ambassadors share `findmymahjgame.com/start?ref=FMM-BOCA-RUTH`.
2. Capture. The Start a Table page reads the `ref` value from the URL (and stores it briefly, for example in the browser, so it survives the few clicks to submit) and includes it as `referredBy` when the table is created. The create API already accepts and stores this.
3. Validate. Accept only codes that match an approved ambassador, so typos and junk do not pollute the data.
4. Roll up. Extend the existing `/admin/metrics` dashboard to group tables by `referred_by`, producing a per-ambassador funnel automatically.
5. Optional. Add a `referral_code` column to the `ambassadors` table to store each ambassador's code in one place and to drive validation and the rollup.

This is a small change, not a redesign. It is the one piece of engineering that pays for itself quickly because it removes weekly manual reconciliation and makes the leaderboard self-updating.

## The master tracking sheet

One row per ambassador. This is the source of truth during Phase 1 and a useful overview even after Phase 2.

| Column | Example | Notes |
|--------|---------|-------|
| City | Boca Raton, FL | One of the 25 target cities |
| Ambassador first name | Ruth | First name only in shared views |
| Role | Teacher | Teacher, Studio owner, Organizer, Event host |
| Referral code | FMM-BOCA-RUTH | Assigned at approval |
| Status | Activated | New, Onboarded, Activated, Growing, At risk, Dormant |
| Date approved | 2026-06-10 | |
| Date of first table | 2026-06-14 | Activation milestone |
| Tables formed | 4 | North Star step 1 |
| Tables filled | 2 | North Star step 2 |
| Games played | 1 | North Star step 3 |
| Recurring games | 1 | North Star step 4 |
| Players reached | 11 | Distinct players across their tables |
| Last contact | 2026-06-18 | Keep this fresh |
| Notes | Lining up library venue | Anything useful |

Keep contact details (email, phone) in a separate, access-controlled tab, not in any view you screen-share or send to the ambassador group.

## Privacy and honesty rules

- Use first names only in any shared or public view. Never publish or circulate player phone numbers, emails, or home addresses.
- The tracking sheet is internal. Do not turn its estimates into public claims.
- Count a table as "real" only when it actually exists in the product, not when an ambassador says they plan to make one. Plans are not tables.
- Reconcile against the live metrics dashboard, not memory. If the sheet and the dashboard disagree, the product data wins.

## Weekly reconciliation routine (15 minutes)

1. Open `/admin/metrics` and the tracking sheet side by side.
2. For each ambassador, update tables formed, filled, played, and recurring.
3. Update each ambassador's status (Activated, Growing, At risk, Dormant) using the thresholds in the KPI Dashboard.
4. Flag anyone At risk or Dormant for a check-in this week.
5. Note the week's leaderboard top 3 to celebrate with the group.

## Definition of an "activated" ambassador

Signed is not the goal. An ambassador is activated when they have formed at least one real table. That is the number to protect. A smaller group of activated ambassadors beats a large group of dormant ones every time.
