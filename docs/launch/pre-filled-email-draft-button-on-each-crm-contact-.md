# Pre-filled email-draft button on each CRM contact row (Relationships page)

# Founder leverage: one-click pre-filled outreach email from a CRM contact row

## What is missing today
The Relationships CRM at `/Users/shaunabruckman/Projects/findmymahjgame/app/admin/relationships/page.tsx` is the screen the founder works from for launch outreach (waves 1-3). Each contact row shows the email address as plain text inside a joined meta string (line 141), with NO email action. To send outreach, the founder copies the address by hand, opens her mail client, and types the whole message from scratch, once per contact, across dozens of contacts in the 10 days before launch.

This is the single repetitive founder task on this screen, and the fix is the exact `mailto:` pattern the project ALREADY uses elsewhere in admin (`app/admin/page.tsx` lines 538 and 767, and `app/admin/edits/page.tsx` line 70). The CRM page is simply the one outreach surface that never got the button.

It does NOT already exist on this page (verified: no `mailto` reference anywhere in `app/admin/relationships/page.tsx`).

## The build (well under 2 hours, low risk)
Add an "Email" button next to the existing "Notes" button on each contact row. It opens a pre-filled draft: recipient = the contact's email, subject + body seeded from the founder's real, documented outreach voice (from `growth/ambassadors/25-warm-relationship-activation-plan.md`: "Hi {first}, it is Shauna from Oh My Mahjong... a small group of Founding Ambassadors who help people in their city find a regular mahjong game... It is free and I will do the setup with you."). The greeting uses the contact's first name and the city when present. The founder edits and sends in two clicks instead of retyping.

Safety/quality:
- Reuses the existing `isValidEmail` guard from `lib/sanitize.ts` so a malformed or empty address renders no button (no broken `mailto:`), matching how the codebase already validates emails before mailto rendering (see the comment in `lib/sanitize.ts` lines 13-16).
- Client-only, read-only: no new API route, no schema change, no new dependency, no network call. It only constructs a `mailto:` href.
- Brand-compliant copy: no em/en dashes, no emoji, active voice, plain language. "Find My Mahj Game" is the from-identity already used in `lib/email.ts` line 43; the founder voice references "Oh My Mahjong" exactly as the activation plan does.

## Exact change: `app/admin/relationships/page.tsx`

### Edit 1 - add the import (currently only React is imported)
Replace line 3:
```
import { useEffect, useState, useCallback } from "react";
```
with:
```
import { useEffect, useState, useCallback } from "react";
import { isValidEmail } from "@/lib/sanitize";
```

### Edit 2 - add a small helper that builds the draft href, placed just above `export default function RelationshipsPage()` (after the `btn` helper on line 37)
Insert:
```
function draftHref(c: Contact): string | null {
  if (!c.email || !isValidEmail(c.email)) return null;
  const first = c.name.trim().split(/\s+/)[0] || "there";
  const where = c.city ? ` in ${c.city}` : "";
  const subject = "A free way to find your regular mahjong game";
  const body =
    `Hi ${first},\n\n` +
    `It is Shauna from Oh My Mahjong. I am building Find My Mahj Game, a free way to help mahjong players${where} find local people to play with. ` +
    `Money never crosses the table, and I will do the setup with you.\n\n` +
    `Could we talk for 15 minutes this week?\n\n` +
    `Warmly,\nShauna\nFind My Mahj Game`;
  return `mailto:${c.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}
```

### Edit 3 - render the button next to the existing "Notes" button
Replace the action block (lines 150-155):
```
              <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap", alignItems: "center" }}>
                <select value={c.status} onChange={(e) => patch(c.id, { status: e.target.value })} aria-label={`Status for ${c.name}`} style={{ ...field, fontWeight: 700, color: STATUS_COLOR[c.status] }}>
                  {STATUSES.map((s) => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}
                </select>
                <button type="button" onClick={() => { setEditing(editing === c.id ? null : c.id); setEditNotes(c.notes || ""); setEditNext(c.next_touch || ""); }} style={btn("var(--bg)", "var(--navy)", "1px solid var(--border)")}>Notes</button>
              </div>
```
with (adds one anchor; the rest is unchanged):
```
              <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap", alignItems: "center" }}>
                <select value={c.status} onChange={(e) => patch(c.id, { status: e.target.value })} aria-label={`Status for ${c.name}`} style={{ ...field, fontWeight: 700, color: STATUS_COLOR[c.status] }}>
                  {STATUSES.map((s) => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}
                </select>
                {draftHref(c) && (
                  <a href={draftHref(c)!} style={{ ...btn("var(--pink)", "white"), textDecoration: "none", display: "inline-flex", alignItems: "center" }}>Email</a>
                )}
                <button type="button" onClick={() => { setEditing(editing === c.id ? null : c.id); setEditNotes(c.notes || ""); setEditNext(c.next_touch || ""); }} style={btn("var(--bg)", "var(--navy)", "1px solid var(--border)")}>Notes</button>
              </div>
```

## Notes for shipping
- After editing, run the project gate per CLAUDE.md: `npx tsc --noEmit` clean, then push. No new env vars, routes, or migrations are involved, so the change cannot break existing flows.
- Optional polish (not required): after the founder clicks Email, the row status could auto-advance to "contacted" via the existing `patch(c.id, { status: "contacted" })` call, but a mailto open does not confirm the message was sent, so leaving the status to the existing dropdown is the honest choice. The founder already flips status manually one line above.
- The generic outreach copy above is deliberately neutral so it is safe for every contact_type. The wave-1 anchors (Kristel, Lisa, Linda, etc.) are flagged in their notes as "Founder calls personally," so the founder will skip Email for those and use the button for the wave 2-3 list, which is exactly where the time savings is.
