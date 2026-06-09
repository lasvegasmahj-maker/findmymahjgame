# FindMyMahj Ambassador KPI Dashboard (Specification)

This document defines how we measure Founding Ambassadors at FindMyMahj, both for each individual ambassador and for the program nationally. Every metric ties to one thing, our North Star, and nothing else.

> **North Star:** Tables Formed -> Tables Filled -> Games Played -> Recurring Tables.
>
> **The thesis we are measuring:** one ambassador creates multiple tables, those tables fill with real players, those players play, and some of those tables keep playing. We are not measuring revenue. We are measuring real games happening in real towns.

The whole system has to stay simple enough that a volunteer in any city can understand their numbers from a phone, and it has to scale to hundreds of ambassadors without new tooling. The good news is that most of this is buildable today from data we already collect.

---

## 1. The backbone: attribution through `referred_by`

We already have the hook we need. The `tables` table has a `referred_by` field, and the "Start a Table" flow accepts a `referredBy` value. That means every table started through an ambassador's link or code is stamped with that ambassador.

This single field is what lets every KPI below roll up per ambassador. Without it, we would only have national totals. With it, the same funnel we already track can be grouped by ambassador.

**The one small addition we need** (covered in detail in Section 8): a tiny mapping from a short, friendly referral code (for example `RUTH-NYC`) to an ambassador's name and city. The `referred_by` field stores the code; the mapping turns that code into a person on the dashboard. Everything else already exists.

---

## 2. KPI definitions

Each KPI has a name, a precise definition, a data source, and a target. Targets are starting points for the first 90 days of the program; we will revisit them once we have a few weeks of real data.

The first four KPIs are the North Star funnel itself. The rest support it.

### 2.1 Tables Formed (attributed)

- **Definition:** the count of tables created where `referred_by` matches this ambassador's referral code. A table is "formed" the moment the host completes "Start a Table" and takes seat 1.
- **Data source:** `tables` table, rows where `referred_by = {{ambassador_code}}`. Already captured at create time.
- **Why it matters:** this is the top of the funnel and the clearest sign an ambassador is doing the work. No formed tables, no anything else.
- **Target:** 3 tables formed in the first 30 days; 1 or more new table per month after that.

### 2.2 Tables Filled

- **Definition:** of this ambassador's formed tables, the count that reached all 4 seats claimed (the point where the site automatically sends the coordination email to all four players).
- **Data source:** `tables` joined to seat claims; a table is filled when its seat count reaches 4. This is the same "Filled" stage already shown on `/admin/metrics`.
- **Why it matters:** a formed table that never fills is a good intention. A filled table is four real people with a plan to meet.
- **Target:** 60 percent or more of an ambassador's formed tables reach 4 of 4.

### 2.3 Games Played

- **Definition:** of this ambassador's filled tables, the count confirmed as having actually played at least one game.
- **Data source:** the "Played" stage already tracked on `/admin/metrics`. (Note for the build: confirm how "Played" is currently set, whether by a host confirmation, a follow-up reply, or a manual mark. The KPI uses whatever signal the existing dashboard already uses, so we stay consistent with the national funnel.)
- **Why it matters:** this is the real-world outcome. A game got played because this ambassador existed.
- **Target:** 70 percent or more of an ambassador's filled tables play.

### 2.4 Recurring Tables

- **Definition:** of this ambassador's tables that played, the count that became recurring (the group is playing on an ongoing basis rather than one time).
- **Data source:** the "Recurring" stage already tracked on `/admin/metrics`.
- **Why it matters:** this is the deepest signal of success. Recurring tables are self-sustaining communities. One recurring table is worth more than five one-time fills.
- **Target:** 30 percent or more of an ambassador's played tables become recurring.

### 2.5 Players Reached

- **Definition:** the total count of distinct players (across all seats, all of this ambassador's tables) who claimed a seat, including the hosts. This is the human reach of an ambassador's work.
- **Data source:** count of distinct players across seat claims on tables where `referred_by = {{ambassador_code}}`. Counted by phone or email so the same person is not double counted across tables where possible.
- **Why it matters:** it translates table counts into people, which is the number ambassadors feel proud of and the number we report to partners.
- **Target:** soft target only. A filled table is 4 players; we expect Players Reached to roughly track 4 times Tables Filled, plus partial seats on tables still filling.

### 2.6 Time-to-First-Table (activation)

- **Definition:** the number of days between an ambassador being approved (status set to Approved in the admin dashboard) and their first attributed table being formed.
- **Data source:** ambassador approval date (admin dashboard) compared to the earliest `created_at` on a table where `referred_by = {{ambassador_code}}`.
- **Why it matters:** activation is the single best early predictor of whether an ambassador will ever produce. Someone who starts a table in week one almost always keeps going. Someone who has not started one in three weeks usually needs a nudge or a check-in.
- **Target:** first table within 14 days of approval.

### 2.7 Time-to-Fill (supporting quality metric)

- **Definition:** for an ambassador's filled tables, the average number of days from table formed to table filled.
- **Data source:** the existing "average time-to-fill" measure on `/admin/metrics`, filtered to this ambassador's tables.
- **Why it matters:** a fast fill usually means the ambassador has a real, ready community. A slow fill is a sign the table needs help (sharing the link more widely, a "Need a 4th" push).
- **Target:** average fill in 7-14 days. We report it for context; we do not penalize ambassadors for it.

---

## 3. Ambassador health status

Each ambassador gets one simple status, computed automatically, so the team can scan the whole roster in seconds. The status answers one question: is this person on track, and do they need anything from us?

Statuses are evaluated in order, top to bottom; the first matching rule wins.

| Status | Plain meaning | Thresholds (first match wins) |
|---|---|---|
| **Activated** | Off to a strong start. | First table formed within 14 days of approval, and at least 1 table filled. |
| **Growing** | Producing on an ongoing basis. | 2 or more tables formed in the last 60 days, with at least 1 filled in that window. |
| **At risk** | Started but stalling; reach out. | Has formed at least 1 table ever, but no new table formed in the last 30 days, OR approved more than 21 days ago with no table yet. |
| **Dormant** | No activity; decide whether to re-engage or retire the code. | No table formed in the last 90 days, OR approved more than 60 days ago with zero tables ever. |

Notes on intent:

- "Activated" and "Growing" can both be true for a strong ambassador; we show "Growing" once they are clearly producing on an ongoing basis, and "Activated" for newer ambassadors who have cleared the first hurdle.
- "At risk" is a prompt for a warm human check-in, not a punishment. Many of these are teachers and organizers with busy seasons.
- "Dormant" is a flag for the weekly review to decide: re-engage, or quietly retire the code so the leaderboard stays honest.

---

## 4. Per-ambassador scorecard (layout)

Every ambassador can see their own scorecard, and the team can see anyone's. It fits on a phone screen. The layout, top to bottom:

```
+--------------------------------------------------+
|  {{ambassador_first_name}}, {{city}}, {{state}}   |
|  Code: {{ambassador_code}}   Status: Growing      |
+--------------------------------------------------+
|  THE FUNNEL (your tables)                         |
|                                                   |
|  Formed   Filled   Played   Recurring             |
|    8        5        4         2                  |
|   ===========================>                    |
|                                                   |
|  Players reached: 23                              |
+--------------------------------------------------+
|  Activation:  first table 9 days after joining    |
|  Avg time-to-fill:  11 days                        |
+--------------------------------------------------+
|  Your tables                                       |
|  - Tue AM, 89104 area .... 4 of 4, played          |
|  - Sat PM, Henderson ..... 3 of 4, 1 seat to go    |
|  - Thu AM, 89052 area .... recurring               |
|  ...                                               |
+--------------------------------------------------+
```

Rules for the scorecard:

- The funnel reads left to right in the exact North Star order, so the story is obvious at a glance.
- The "Your tables" list mirrors the language players already see (for example "3 of 4 players, 1 seat to go" and the "Need a 4th" badge at 3 of 4). No new vocabulary to learn.
- It respects safety and privacy. The scorecard shows general area or ZIP and day or time only. It never shows player contact info, exact addresses, or player last names. Contact info is never shared between players, and the scorecard follows the same rule.
- One status chip up top, colored, so the ambassador instantly knows where they stand.

---

## 5. National leaderboard (layout)

The team view rolls every ambassador up into one ranked table. This is the program's pulse.

```
NATIONAL AMBASSADOR LEADERBOARD                  Updated weekly

Rank  Ambassador        City          Formed  Filled  Played  Recurring  Status
 1    {{name}}          Phoenix         12      9       8        4       Growing
 2    {{name}}          New York        10      7       6        3       Growing
 3    {{name}}          Dallas           8      5       4        2       Growing
 4    {{name}}          Chicago          6      4       3        1       Activated
 ...
 18   {{name}}          Austin           1      0       0        0       At risk
 19   {{name}}          Seattle          0      0       0        0       Dormant

NATIONAL TOTALS:  Formed 142  |  Filled 95  |  Played 78  |  Recurring 31
Players reached: 410   |   Active ambassadors: 17 of 24
```

Leaderboard rules:

- Default sort is by Recurring Tables, then Played, then Filled, then Formed. We rank by the deepest real outcome first, not by raw activity, so the leaderboard rewards the right thing.
- The national totals row is the same four-stage funnel as `/admin/metrics`, just summed across all ambassadors. It should reconcile to the all-tables funnel (attributed tables are a subset of all tables; the difference is tables created with no referral code).
- "Active ambassadors: X of Y" is a one-line program health read: how many of our approved ambassadors are actually producing.
- We celebrate this, we do not weaponize it. The leaderboard is a motivation and a planning tool, shared in the monthly report; it is never used to shame an At risk or Dormant ambassador.

---

## 6. Review cadence

Two rhythms, one for the team and one for the ambassadors.

### Weekly team review (internal, 30 minutes)

Run off the national leaderboard. The agenda:

1. **New activations.** Who formed their first table this week? Send a quick congratulations.
2. **At risk list.** Who slipped to At risk? Assign one person to send a warm, specific check-in ("How did the {{city}} table go? Anything I can help with?").
3. **Dormant list.** Decide re-engage or retire for each. Keep the leaderboard honest.
4. **Funnel leaks.** Where are tables dropping? If lots of tables form but few fill, that is a sharing problem; if they fill but do not play, that is a coordination problem. Fix the stage, not the symptom.
5. **National totals check.** Did Formed, Filled, Played, Recurring all move up?

### Monthly ambassador report (sent to each ambassador)

A short, warm email with their scorecard and a single suggested next step. Real copy below, ready to send.

> **Subject:** Your FindMyMahj month, {{ambassador_first_name}}
>
> Hi {{ambassador_first_name}},
>
> Here is your month in {{city}}. Thank you for the games you helped make happen.
>
> - Tables you started: {{formed_count}}
> - Tables that filled all 4 seats: {{filled_count}}
> - Games played: {{played_count}}
> - Tables now playing on an ongoing basis: {{recurring_count}}
> - Players you have reached so far: {{players_reached}}
>
> Your status this month: **{{status}}**.
>
> One idea for next month: {{single_next_step}}. (For example, share your link with one new teacher or one community center, or give your 3 of 4 table a nudge so it can fill that last seat.)
>
> Reply any time. We are glad you are part of this.
>
> Warmly,
> The FindMyMahj team
> hello@findmymahjgame.com

We send one clear next step, never a list of demands. For an At risk ambassador the next step is gentle and human; for a Growing ambassador it might be "would you mentor a new ambassador in a nearby city?"

---

## 7. What is buildable now vs. what needs a small addition

We can stand up most of this dashboard from existing data. Being honest about the gap keeps the build small.

### Buildable now, no schema changes

- Grouping the four-stage funnel by `referred_by` (Formed, Filled, Played, Recurring per code). The stages already exist on `/admin/metrics`; we are adding a `GROUP BY referred_by`.
- Players Reached per code (distinct players across that code's tables).
- Time-to-First-Table per code (table `created_at` is already stored; we just need the ambassador's approval date, which the admin dashboard already has).
- Average time-to-fill per code (the national time-to-fill measure already exists; filter it by code).
- National totals and the leaderboard ranking (all derived from the above).

### Needs one small addition

- **An ambassador referral code mapping.** Today `referred_by` holds a value but the dashboard has no clean way to turn that value into "this is {{name}} in {{city}}." We add a lightweight `ambassador_codes` mapping (code -> ambassador name, city, state, approval date, status). This is a small table plus a short admin form, not a rebuild. It is the only new data structure the whole spec requires.
- **A confirmed "Played" signal (verify, do not assume).** The Played stage exists on `/admin/metrics`; before we report it per ambassador, confirm how it is currently set so the per-ambassador number matches the national number exactly. If the signal is thin, that is a separate product question, not a dashboard one.

---

## 8. Implementation hook (concrete)

The core of the build is one change, stated plainly so an engineer can pick it up:

> **Extend the existing `/admin/metrics` dashboard to group tables by `referred_by`, so each ambassador's funnel rolls up automatically.**

Concretely:

1. **Add the mapping.** Create `ambassador_codes` with: `code` (the value stored in `tables.referred_by`), `ambassador_name`, `city`, `state`, `approved_at`, and a derived `status`. Populate it from approved applications in the admin dashboard. Generate a short, friendly code per ambassador (for example `{{first_name}}-{{city_or_state}}`, kept human-readable for senior-friendly sharing).

2. **Group the funnel.** In the metrics queries, add `GROUP BY referred_by` to the existing Formed -> Filled -> Played -> Recurring aggregations. Join to `ambassador_codes` to display the person, not the raw code. Tables with no `referred_by` simply fall into an "Unattributed" bucket and stay part of the national totals.

3. **Compute the derived fields per code.** Players Reached (distinct players), Time-to-First-Table (`approved_at` vs. earliest table `created_at`), average time-to-fill, and the health status from the Section 3 rules.

4. **Render two views.** The per-ambassador scorecard (Section 4) and the national leaderboard (Section 5). Both read from the same grouped query, so the totals always reconcile.

5. **Keep it phone-first and private.** The scorecard and leaderboard show area or ZIP, day or time, and counts only. No player contact info, no exact addresses, no last names. Same privacy rule as the rest of the product.

That is the entire build: one small mapping table, one `GROUP BY`, a few derived fields, and two views on top of a dashboard we already have. From there, every ambassador's contribution to Tables Formed -> Filled -> Played -> Recurring is visible automatically, and the program can scale to any number of cities without new tooling.

---

## 9. One-line summary for the team

We measure ambassadors by the only thing that matters: real mahjong games happening because of them. The `referred_by` field already attributes every table; we add a small code-to-person mapping and group the existing funnel by it, and the whole national program becomes visible, per ambassador and in total, on a phone.
