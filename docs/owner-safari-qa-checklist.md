# Real iPhone / Safari QA (do this once before launch)

Automated testing covered every flow at phone width, but the local test engine could not run a true Safari engine, so please run this short pass on a real iPhone in Safari. It should take about ten minutes. Note anything that looks broken; do not worry about small style preferences.

Gates are still closed, so account, matching, and provider steps will show a friendly "not open yet" message. That is correct. You are checking that pages load, look right, and forms respond, not that you can complete a real signup.

1. Homepage: open findmymahjgame.com. Do you see two cards, "Find a Game" and "Ask Find My Mahj," and the line "Find where to play. Ask how to play."? Does nothing run off the side of the screen?

2. Find a Game: type a city (say Dallas) in the Find card and tap the button. Does it take you to that area's page?

3. Ask Find My Mahj: tap "Can I use a joker in a pair?" (or type it). Do you get a clear answer, not an error?

4. Account / sign in: open /account. Does it clearly say accounts are not open yet, with readable text and no broken layout?

5. Provider: open /provider. Does it load cleanly and prompt you to sign in?

6. Mahj Match: open /mahj-match. Does it explain the feature and load without errors?

7. Teachers and Events: open /teachers and /events. Do listings show, and are the tap targets (buttons, links) big enough to tap easily?

8. Navigation: tap through the top menu links. Do they all open the right pages? Is the "Ask Find My Mahj" link easy to read?

9. Any form: on a teacher page tap to request a lesson, or open the newsletter signup. Does the form open, and does it show a clear message when you submit?

Reply with anything that looked wrong (a screenshot helps). If everything looked fine, tell me "Safari QA passed" and I will mark that item complete.
