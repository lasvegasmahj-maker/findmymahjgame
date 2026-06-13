# One-click copy of personalized outreach templates from the admin Relationships (CRM) view

# Founder leverage: one-click copy of outreach templates from the admin contact view

## Why this saves real time before launch
The founder has dozens of Wave 1-3 contacts to reach in the next 10 days (teachers, organizers, partners). The outreach copy already exists in `growth/ambassadors/02-recruiting-email-sequence.md` with `{{first_name}}`, `{{city}}`, `{{your_name}}` tokens. Today she would have to open that markdown, copy an email, hand-replace the tokens for each person, and paste into her email client, per contact. That is exactly the repetitive, error-prone work a one-click copy button removes.

The admin Relationships page (`/admin/relationships`) already lists every contact with name, organization, city, and contact_type, and already supports per-row Notes editing. It just has no way to grab a ready-to-send message. This adds a "Copy outreach" button to each contact row that opens a small template picker and copies a personalized, token-filled message (subject + body) to the clipboard.

## Why it is low risk
- One file changed: `app/admin/relationships/page.tsx`. No API route, no DB/schema, no migration.
- Reuses the proven `navigator.clipboard.writeText` pattern already shipping in `app/share-preview/page.tsx`.
- Client-only, behind the existing admin auth gate (page already returns the sign-in prompt when not authed).
- Style matches the file's existing `field`/`btn` helpers and CSS tokens (`--green` = #2ec95c, `--navy`, `--pink`, `--border`, `--bg`). No new dependencies.
- Tokens fill from data already on each row; `{{first_name}}` takes the first word of the contact name, `{{city}}` falls back to "your area" when blank, `{{your_name}}` is set to "Shauna". No emoji, no em dashes, active voice.

Build time well under 2 hours. Run `npx tsc --noEmit` before pushing per the repo gate.

## Exact edits to app/admin/relationships/page.tsx

### Edit 1 - add templates + fill helper (insert immediately AFTER the `btn` const on line 37, before `export default function RelationshipsPage()`)

```tsx
// Token-filled outreach copy lifted from growth/ambassadors/02-recruiting-email-sequence.md.
// {{first_name}}, {{city}}, {{your_name}} are filled from the contact row before copy.
const SENDER = "Shauna";
const SIGNOFF = "Warmly,\n{{your_name}}\nFindMyMahj";

const TEMPLATES: { id: string; label: string; subject: string; body: string }[] = [
  {
    id: "opener",
    label: "Warm opener (Day 0)",
    subject: "Great connecting, {{first_name}}",
    body:
      "Hi {{first_name}},\n\n" +
      "It was so good to connect. The energy around this game is exactly why I wanted to write.\n\n" +
      "I help run FindMyMahj (findmymahjgame.com). It is a free national service with one job: help people find mahjong players and form real games. Someone starts a table for a day and time, neighbors claim the open seats, and when four players are in, the site emails everyone to set up the first game in a public place like a library or community center.\n\n" +
      "You already do the hard part. You know players, you bring people together, and folks in {{city}} trust you. Our Founding Ambassadors are people like you who help a few players start tables and fill seats. It takes a few minutes, it runs from your phone, and you get your own link so every table you help start is credited to you.\n\n" +
      "If that sounds like your kind of thing, here is the one step:\n\n" +
      "Apply to be a Founding Ambassador: findmymahjgame.com/ambassadors\n\n" +
      SIGNOFF +
      "\n\nP.S. The application is short and there is no cost and no catch. The service is free for every player, always.",
  },
  {
    id: "howitworks",
    label: "How it works (Day 3)",
    subject: "How a table fills up on FindMyMahj",
    body:
      "Hi {{first_name}},\n\n" +
      "I wanted to show you how simple this is, since \"ambassador\" can sound like a big commitment. It is not.\n\n" +
      "1. You share your link with a few players in {{city}}.\n" +
      "2. Someone starts a table at findmymahjgame.com/start. They pick a day, a time, and their general area. No home address, ever.\n" +
      "3. The table page shows a simple seat counter, like \"3 of 4 players, 1 seat to go.\"\n" +
      "4. When the fourth seat fills, the site emails all four players to set up the first game in a public place. Contact info is never shared between players.\n\n" +
      "That is it. The site does the coordinating. You just help good games get started, and every table from your link is credited to you.\n\n" +
      "When you are ready, the next step is the same short form:\n\n" +
      "Apply here: findmymahjgame.com/ambassadors\n\n" +
      SIGNOFF,
  },
  {
    id: "honest",
    label: "Honest answers (Day 12)",
    subject: "The questions people usually ask me first",
    body:
      "Hi {{first_name}},\n\n" +
      "When I talk to people about this, the same few questions come up, so let me answer them plainly.\n\n" +
      "\"Will this take a lot of time?\" No. Most ambassadors spend a few minutes sharing a link and a warm word of encouragement. The site does the scheduling.\n\n" +
      "\"Is it really free?\" Yes. It is free for every player and there is no cost to you.\n\n" +
      "\"Is it safe for the players I send?\" Yes. Players give only a first name and a phone or email. Home addresses are never published or shared. New groups meet in a public place for the first game.\n\n" +
      "\"What if I am not very technical?\" That is fine. Everything runs from a phone in a few taps, and we are here to help you.\n\n" +
      "If those answers land the way I hope, here is the one step:\n\n" +
      "Apply here: findmymahjgame.com/ambassadors\n\n" +
      "Happy to answer anything else first. Just reply to this email.\n\n" +
      SIGNOFF,
  },
  {
    id: "reply",
    label: "Reply: they said yes",
    subject: "Wonderful, {{first_name}}, here is the one step",
    body:
      "Hi {{first_name}},\n\n" +
      "This made my day. Welcome aboard.\n\n" +
      "The only thing to do now is fill out the short application so we can set up your ambassador link: findmymahjgame.com/ambassadors. It takes a couple of minutes and asks for your name, email, city, and a little about the players you can reach.\n\n" +
      "Right after you submit, you will get a confirmation email from us, and our team will follow up to get your link and first tables going. If anything is unclear, just reply here and I will walk you through it.\n\n" +
      "So glad to have you, {{first_name}}.\n\n" +
      SIGNOFF,
  },
];

function fillTemplate(t: { subject: string; body: string }, c: Contact) {
  const first = (c.name || "").trim().split(/\s+/)[0] || "there";
  const city = (c.city || "").trim() || "your area";
  const sub = (s: string) =>
    s.replace(/\{\{first_name\}\}/g, first).replace(/\{\{city\}\}/g, city).replace(/\{\{your_name\}\}/g, SENDER);
  return `Subject: ${sub(t.subject)}\n\n${sub(t.body)}`;
}
```

### Edit 2 - add picker + copied state (the component currently declares state on lines 47-49). Add two lines right after `const [editNext, setEditNext] = useState("");`)

```tsx
  const [picking, setPicking] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
```

### Edit 3 - add the copy handler (insert right after the existing `patch` function closes, before the `if (authed === null)` guard near line 89)

```tsx
  function copyOutreach(c: Contact, t: { id: string; subject: string; body: string }) {
    navigator.clipboard.writeText(fillTemplate(t, c));
    setCopiedId(`${c.id}:${t.id}`);
    setTimeout(() => setCopiedId(null), 2000);
  }
```

### Edit 4 - add the "Copy outreach" button to the row action group. The row's action `<div>` currently holds the status `<select>` and the Notes button (lines 150-155). Add this button after the Notes button, inside that same flex `<div>`:

```tsx
                <button type="button" onClick={() => setPicking(picking === c.id ? null : c.id)} style={btn("var(--pink)", "white")}>Copy outreach</button>
```

### Edit 5 - render the template picker. The row currently renders the Notes editor with `{editing === c.id && ( ... )}` (lines 157-163). Add this picker block right after that Notes editor block, still inside the per-contact card `<div>`:

```tsx
            {picking === c.id && (
              <div style={{ marginTop: "0.6rem", display: "flex", gap: "0.4rem", flexWrap: "wrap", background: "var(--bg)", border: "1px solid var(--border)", borderRadius: 8, padding: "0.7rem" }}>
                <span style={{ fontSize: "0.8rem", color: "var(--muted)", alignSelf: "center", marginRight: "0.2rem" }}>Copy a ready message for {(c.name || "").trim().split(/\s+/)[0] || "this contact"}:</span>
                {TEMPLATES.map((t) => (
                  <button key={t.id} type="button" onClick={() => copyOutreach(c, t)} style={btn(copiedId === `${c.id}:${t.id}` ? "var(--green)" : "white", copiedId === `${c.id}:${t.id}` ? "white" : "var(--navy)", "1px solid var(--border)")}>
                    {copiedId === `${c.id}:${t.id}` ? "Copied!" : t.label}
                  </button>
                ))}
              </div>
            )}
```

## How the founder uses it
1. Open `/admin/relationships`, filter to Wave 1 or a status like "Not contacted".
2. On any contact row, click "Copy outreach", pick the template (opener, how it works, honest answers, or the yes reply).
3. The personalized message (subject line plus body, with the contact's first name and city already filled) lands on the clipboard. Paste into Gmail and send.

No more opening the markdown doc and hand-editing tokens per person. That removes the single most repetitive step in the pre-launch outreach push.

## After applying
- Run `npx tsc --noEmit` (the file stays fully typed; `Contact` already covers `name`/`city`).
- Smoke check: sign in to admin, load `/admin/relationships`, click "Copy outreach" on one row, confirm the button flips to "Copied!" and the clipboard holds the filled message.
