# FMG Launch Week 1 Plan: daily priorities for WPGC and confirmation rate

# Find My Mahj Game: Launch Week 1 Plan

Daily priorities for the first 7 days after go-live. Everything here drives two numbers and nothing else:

- **WPGC (Weekly Player-Games Confirmed):** the count of real mahjong games that four real people confirmed they played this week. This is the North Star.
- **Confirmation rate:** of the tables that filled and got asked "did your game happen?", the share that replied Yes. The guardrail is 50 percent or higher. A pile of filled tables that nobody confirms is not proof; it is hope.

If a task does not move WPGC or protect the confirmation rate, it waits until Week 2.

---

## How the confirmation loop actually works (read this once)

You are not guessing whether games happen. The product asks for you, automatically:

1. A host starts a table on /start and takes seat 1. Players claim the other seats on the /t/CODE page.
2. When the 4th seat fills, the site emails all four players the coordination note. That table is now "filled."
3. Three days after a table fills, the daily cron emails everyone on that table one question: "Did your game happen?" with two buttons, "Yes, we played" and "No, not this time." One tap. The reply is private; it never touches a public page. A copy lands in hello@findmymahjgame.com so you see every answer.
4. A Yes stamps the game as played and counts toward WPGC. A No tells you that table needs a nudge or a reschedule.

Two things follow from the 3-day delay, and the plan is built around them:

- A table that fills Monday or Tuesday gets its "did you play?" email Thursday or Friday. So **confirmations for early-week fills naturally land late in the week.** Do not panic on Wednesday that WPGC is still low. Wednesday is a fill day; Thursday and Friday are confirm days.
- The single biggest lever on confirmation rate is **a warm human nudge from you in the hours before the automated email goes out.** A text that says "How did Tuesday's game go?" gets a Yes that a cold button alone might miss.

Where you read the numbers: open /admin/metrics each morning. It shows the funnel (Created, Filled, Played, Recurring). WPGC is the Played count for games confirmed this week; confirmation rate is Played divided by the tables that were asked. The dedicated /admin/today hero tile is still being built, so until it ships, /admin/metrics plus the hello@ inbox is your daily read.

---

## Week 1 targets (be honest, not heroic)

Week 1 is a proof week, not a volume week. The win is a small number of games you can absolutely confirm, not a big number you cannot.

| Number | Week 1 target | Why |
|---|---|---|
| Tables created | 6-8 | Your seeded warm tables plus the first organic ones |
| Tables filled (4 of 4) | 4-6 | A filled table is four people with a plan |
| WPGC (games confirmed played) | 3-5 | The only number that proves the model |
| Confirmation rate | 50 percent or higher | The guardrail. Protect it over raw volume |

The single most important outcome of Week 1: **at least 3 confirmed games, with a confirmation rate at or above 50 percent.** Three real, confirmed games in Dallas in week one is a launch. Thirty unconfirmed filled tables is a spreadsheet.

A note on geography. Texas-first stands, and DFW is your liquidity proof market. Seed your Week 1 tables in Dallas-Fort Worth first. In Las Vegas, FMG is the community and games layer only (players who want lessons go to Las Vegas Mahjong), so seed LV tables for play, not teaching.

---

## Before Day 1: the two gates that must clear

Neither of these is optional, and both are already in motion. Confirm them before you start the daily plan.

1. **The deploy go.** The coordinated production deploy carries the Las Vegas disclosure and the Teacher Promise. Week 1 cannot start until the site is live. (See LAUNCH_GATE.md.)
2. **Mailchimp is wired.** The API key and Audience ID are in Vercel (never in chat), and the 195 subscribers are imported. Newsletter Issue 1 is ready to send. Without this, you cannot turn the email list into seats.

Also have ready, on your phone: your /start link, 3-5 warm host candidates per seed table (your students, open-play regulars, an existing host group, the active-adult communities), and the hello@ inbox open in a tab.

---

## Day 1, Monday: seed the tables that will confirm by Friday

The math of the week: tables that fill today get their confirmation email Thursday. So Monday is your highest-leverage day for hitting WPGC by Friday. Fill tables today.

Morning
- Smoke-check that the site is live: open /, /events, /teachers, /states, /newsletter, /start, /play. Each should load. Glance that the Teacher Promise and the LV disclosure are showing.
- Start your own first table on /start so you have a live example to point to. Pick a real Dallas day and time you can personally make.
- Light your warmest, fastest table first: the existing host group that already plays. Put their standing game on the tool and fill any open seat. This is the table most likely to confirm a Yes this week because the people already play together.

Afternoon
- Send Newsletter Issue 1 to the imported list. Include the /start and /play links and one clear ask: "Want a game this week? Grab a seat."
- Text your 5-8 warmest Dallas players the share link to a specific table with a specific day and time. A named day beats "join sometime." Use the warm message: "I have a table open for [day] at [time]. Want a seat? You just add your first name and a phone or email, and the site handles the rest."

End of day
- Open /admin/metrics. Note tables created and seats claimed. Nothing to confirm yet; that is correct for Day 1.

Day 1 priority: **2-3 tables seeded and filling, newsletter sent.**

---

## Day 2, Tuesday: fill to four and stack the back half of the week

Every seat you fill today gets its confirmation email Friday. Keep filling.

Morning
- Check /admin/metrics for any table sitting at 3 of 4. A table at 3 of 4 is the highest-value thing on your screen. Send one nudge to one person to close it. The /t/CODE page shows a "Need a 4th" badge at 3 of 4; that is your cue.
- Reply to every newsletter and text response from yesterday within the day. Anyone who says "I want to play" goes onto a specific table or, if there is no fit, into /play so the matcher can place them.

Afternoon
- Seed your second cluster of tables: open-play regulars and an active-adult community group (the highest-density source, fills fastest).
- Keep a 1-2 deep waitlist per table from the /play pool so one dropout does not kill a game.

End of day
- /admin/metrics: confirm at least 2 tables are now filled (4 of 4). Filled tables are your future WPGC.

Day 2 priority: **at least 2 tables filled, every 3-of-4 table nudged.**

---

## Day 3, Wednesday: protect the games before they happen

Mid-week is when filled tables actually meet. Your job today is to make sure the games happen, because a game that happens is a game that confirms.

Morning
- For every filled table whose game day is today or tomorrow, send a warm, light reminder to the host: "Your table is set for [day] at [time]. Anything I can help with? Remember to meet somewhere public for the first game."
- Keep seeding. Wednesday fills confirm next Monday, which front-loads Week 2.

Afternoon
- If Mailchimp shows newsletter opens but few seat claims, the invite needs rewording, not more sends. Tighten one table's invite to a single named day and time and re-share it.
- Check the hello@ inbox. No confirmations should arrive yet (the 3-day window has not opened for Monday fills until Thursday), but watch for player questions and answer them same-day.

End of day
- /admin/metrics. You should see Created climbing and Filled holding. Played is likely still zero. That is on schedule.

Day 3 priority: **every filled table reminded, the games protected.**

---

## Day 4, Thursday: confirmations start landing, work them hard

This is the day the loop pays off. Monday's filled tables get their "did your game happen?" email today. The confirmation rate is now live and you can move it.

Morning
- Open hello@. The first Yes/No replies are arriving. Log each Yes; that is WPGC moving for the first time this week.
- For any table that already played but has not tapped Yes yet, send the human nudge: "How did [day]'s game go? If you played, one tap on the email confirms it for us." A warm nudge converts a silent table into a Yes. This is the single highest-leverage action on the confirmation rate all week.

Afternoon
- For any No, do not treat it as a loss. Reply: "No problem. Want me to help you pick a new day?" A No that turns into a rescheduled, confirmed game next week is a win deferred, not a win lost.
- Keep filling new tables. Thursday fills confirm Sunday.

End of day
- /admin/metrics: WPGC should be above zero. Compute the confirmation rate: Yes replies divided by tables asked. If it is under 50 percent, your Friday job is clear.

Day 4 priority: **first confirmations logged, every played-but-silent table nudged toward a Yes.**

---

## Day 5, Friday: close the week on the two numbers

Friday is the scorecard, and it is also your last chance to convert this week's games into confirmations.

Morning
- Open hello@. Tuesday's fills are getting their confirmation email today. Work them exactly like Thursday: log every Yes, nudge every played-but-silent table, offer a reschedule for every No.
- Make the final push on any 3-of-4 table so it fills before the weekend.

Afternoon, the 15-minute Friday review
- Open /admin/metrics and write down four numbers for the week: tables created, tables filled, WPGC (games confirmed), confirmation rate.
- Mark each against the Week 1 target. If WPGC is at 3-5 and confirmation rate is at or above 50 percent, you launched. Say so out loud.
- Pick the one fix for next week. The usual two: if tables fill but do not confirm, that is a confirmation problem (more warm nudges before the automated email). If tables do not fill, that is a sharing problem (tighter invites, named day and time).
- Note the 2-3 hosts and players to thank personally. A thank-you is what turns a one-time game into a recurring one.

Day 5 priority: **week closed on WPGC and confirmation rate, one fix named for Week 2.**

---

## Day 6-7, Weekend: light touch, protect momentum

Weekends are for replies and confirmations, not new pushes. About an hour each day.

- Work hello@: Wednesday and Thursday fills are confirming now. Log Yes replies, they still count toward this week's WPGC.
- Reply to any player question within the day.
- For every confirmed Yes from a table that wants to keep playing, plant the recurring seed: "That was a great game. Want to make it a standing thing? I will set up the next table." Booking the next date while the glow is fresh is how a confirmed game becomes a recurring one.
- Rest. You earned it.

Weekend priority: **catch the late confirmations, plant the recurring seed on every Yes.**

---

## The one-screen Week 1 scorecard

Fill this in Friday afternoon. It is the whole week in four numbers.

| Number | Target | Actual | On track? |
|---|---|---|---|
| Tables created | 6-8 | | |
| Tables filled (4 of 4) | 4-6 | | |
| WPGC (games confirmed) | 3-5 | | |
| Confirmation rate | 50 percent or higher | | |

On-track rule: write On track if actual is at or above target. The two numbers that decide the week are WPGC and confirmation rate. The other two are how you got there.

One fix for next week: ______________________

People to thank: ______________________

---

## What to ignore in Week 1

So you do not chase the wrong things:

- Do not chase raw table count. Eight filled tables you cannot confirm lose to four you can.
- Do not expand cities yet. DFW first, with Las Vegas as the community layer. Proof before spread.
- Do not build new features. The product is live and the loop works. Week 1 is human work: seed, fill, remind, confirm.
- Do not let a No discourage you. A No with a reschedule is next week's Yes.
- Do not skip the warm nudge before the automated email. That nudge is the difference between a 40 percent and a 60 percent confirmation rate, and the confirmation rate is half the whole game.

