# Source of Truth Scorecard
### Find My Mahj Game ,  Friday 15-Minute Review

This is your weekly dashboard. Count real things only. When a number could be argued either way, write the smaller number. A scorecard you can trust is worth more than a scorecard that looks good. The whole point is to see, honestly, whether you are becoming the source of truth for American Mahjong in Las Vegas and whether real people are sitting down to play.

---

## The 10 Metrics

Four groups. Coverage proves you are the source of truth. Depth proves people come back. Reach proves you can distribute. Supply proves the network is feeding itself.

### COVERAGE ,  Are we the source of truth?

| # | Metric | Precise definition (what counts) | Where the number comes from | 30-day target |
|---|--------|----------------------------------|------------------------------|---------------|
| 1 | **Events listed** | Distinct upcoming or recurring mahjong events that are live and public on the site right now, with a real day, time, and public venue. A weekly recurring game counts as 1 event, not 4. Do not count past events or anything still in draft. | Count the live event pages on findmymahjgame.com. Cross-check against Sessions in Airtable filtered to status = Published. | 20 live events |
| 2 | **Teachers listed** | Distinct instructors with a live public listing (first name, neighborhood, how to reach them through you). Count a teacher once, even if they teach in three places. They must have said yes to being listed. | Count live teacher listings on the site. Cross-check against Instructors in Airtable where Listed = Yes. | 8 teachers |
| 3 | **Venues listed** | Distinct public places confirmed as mahjong-friendly and live on the site (a library, senior center, community center, or cafe with table space). One physical location = 1 venue, even if it hosts several games. Public venues only, never a home. | Count live venue listings on the site. Cross-check against Organizations in Airtable where Type = Venue and Status = Confirmed. | 15 venues |

### DEPTH ,  Do people come back?

| # | Metric | Precise definition (what counts) | Where the number comes from | 30-day target |
|---|--------|----------------------------------|------------------------------|---------------|
| 4 | **Active players** | Distinct people who did a real thing in the last 30 days: attended a game, claimed a seat, started a table, or replied to take an action. A signup with zero activity does not count. One person counts once. | People in Airtable with at least one linked Attendance, claimed seat, or started table dated in the last 30 days. De-duplicate by person. | 75 active players |
| 5 | **Games played** | Real sessions that actually happened with players in seats, in the last 30 days. A four-person Tuesday game that met three times this month = 3 games. Count it only after it happened, never because it was scheduled. | Attendance records in Airtable, grouped by session and date, where the session is marked as occurred. Count one per session-date. | 40 games played |

### REACH ,  Can we distribute?

| # | Metric | Precise definition (what counts) | Where the number comes from | 30-day target |
|---|--------|----------------------------------|------------------------------|---------------|
| 6 | **Newsletter subscribers** | Distinct people on the email list who have not unsubscribed. Real inboxes only. Do not count bounces, duplicates, or yourself. | Total list size from your email tool, minus unsubscribes and hard bounces. Cross-check against People in Airtable where Newsletter = Yes. | 350 subscribers |
| 7 | **Returning visitors** | Distinct people who came back to the site in a later session than their first, within the last 30 days (they visited, left, and came back another day). Not raw pageviews. | Returning visitors over the last 30 days from your site analytics. Use the same tool and the same window every week. | 200 returning visitors |

### SUPPLY ,  Is the network feeding itself?

| # | Metric | Precise definition (what counts) | Where the number comes from | 30-day target |
|---|--------|----------------------------------|------------------------------|---------------|
| 8 | **Tables created** | Distinct tables started through /start that are live with a claim code (/t/CODE), all time to date. A table is one specific recurring or one-time game someone is hosting. Count it once when it goes live. | Tables in Airtable (or the table records behind /t/CODE), status = Live. Count distinct codes. | 30 tables created |
| 9 | **Tables filled** | Of the live tables, the ones that have reached a full, playable group (4 seats claimed, or marked full by the host). Count a table as filled once it first fills. | Tables in Airtable where Seats Claimed = 4 or Status = Full. | 18 tables filled |
| 10 | **Ambassadors activated** | Founding Ambassadors who said yes AND have done one real thing: hosted a table, listed a venue, brought in a teacher, or recruited 3+ players. Saying yes alone does not count. Activity is what counts. | People in Airtable where Ambassador = Yes AND Activated = Yes (a linked hosted table, venue, teacher, or 3+ recruits). | 10 activated |

---

## The Headline Number

**Rally on Games Played.**

Everything else is a means to this end. Events, venues, teachers, tables, and ambassadors all exist so that real people sit in real seats and play. Games Played is the hardest number to fake and the easiest to feel. If it goes up, the community is real and habit is forming. If it stalls while other numbers climb, you are building a directory nobody is using, and you fix that before anything else.

One sentence to say out loud every Friday: **"How many times did mahjong actually get played because of us this week?"**

---

## Weekly Fill-In Table

Copy this block each Friday. Fill the four right columns. "Last week" is what you wrote 7 days ago. "Change" is this week minus last week (use + or -). Leave a number blank only if you truly could not count it, and write why in Notes.

```
SOURCE OF TRUTH SCORECARD ,  Week of {{date}}

GROUP        METRIC                    THIS WK   LAST WK   CHANGE   30-DAY TARGET
-----------  ------------------------  -------   -------   ------   -------------
COVERAGE     Events listed             ______    ______    ______   20
COVERAGE     Teachers listed           ______    ______    ______   8
COVERAGE     Venues listed             ______    ______    ______   15
DEPTH        Active players            ______    ______    ______   75
DEPTH        Games played   *HEADLINE  ______    ______    ______   40
REACH        Newsletter subscribers    ______    ______    ______   350
REACH        Returning visitors        ______    ______    ______   200
SUPPLY       Tables created            ______    ______    ______   30
SUPPLY       Tables filled             ______    ______    ______   18
SUPPLY       Ambassadors activated     ______    ______    ______   10

Headline this week (Games played): ______
Biggest win: ____________________________________________
Biggest worry: __________________________________________
One thing I will do Monday: _____________________________
```

| Group | Metric | This wk | Last wk | Change | 30-day target |
|-------|--------|:-------:|:-------:|:------:|:-------------:|
| Coverage | Events listed | | | | 20 |
| Coverage | Teachers listed | | | | 8 |
| Coverage | Venues listed | | | | 15 |
| Depth | Active players | | | | 75 |
| Depth | **Games played** (headline) | | | | 40 |
| Reach | Newsletter subscribers | | | | 350 |
| Reach | Returning visitors | | | | 200 |
| Supply | Tables created | | | | 30 |
| Supply | Tables filled | | | | 18 |
| Supply | Ambassadors activated | | | | 10 |

---

## The 15-Minute Friday Review Ritual

Same time every Friday. Timer on. The goal is not a perfect report, it is one honest decision.

**Minutes 0-3 ,  Pull the numbers.**
Open Airtable and your two dashboards (email tool, site analytics). Fill the THIS WK column top to bottom. Do not analyze yet, just count. If a number is hard to get, write your best honest count and move on.

**Minutes 3-6 ,  Fill in Change and read the board.**
Subtract last week from this week for each row. Look down the Change column. Green in your head = went up. Red = flat or down. You are looking for the story, not the detail.

**Minutes 6-10 ,  Find the one thing.**
Ask three questions in order:
1. Did **Games played** go up? If no, that is your problem this week, full stop.
2. Is any Coverage number flat (Events, Teachers, Venues)? Flat coverage means you stopped adding to the source of truth.
3. Is Supply feeding Depth? Tables created should be turning into Tables filled, and Tables filled into Games played. If tables get created but never fill, your follow-up is broken.

**Minutes 10-13 ,  Write the four lines.**
Headline number, biggest win, biggest worry, and the one thing you will do Monday. Make the Monday action small and specific (for example: "Call the three hosts whose tables have not filled" or "List two Henderson venues I already confirmed"). One action, not five.

**Minutes 13-15 ,  Bank it.**
Save this week's table so it becomes next week's "Last wk." Send yourself or your CEO-meeting thread the four lines. Close the laptop. Done.

---

### Two honesty rules, every week

1. **When in doubt, undercount.** If you are not sure a game happened, a table is full, or a player is active, do not count it. A real 28 beats an imaginary 45.
2. **Count outcomes, not effort.** A scheduled event is not a game played. A "yes" is not an activated ambassador. A signup is not an active player. The right edge of every definition is something that actually happened.
