# code-proposal

FOUNDER LEVERAGE: One-click "copy all three links" button (claim + still-running + ended)

WHAT EXISTS TODAY
- The API already mints all three links. GET /api/admin/claim-link?table=...&id=... returns { claim, stillRunning, ended }. See /Users/shaunabruckman/Projects/findmymahjgame/app/api/admin/claim-link/route.ts (no change needed).
- The admin UI does NOT use them well. /Users/shaunabruckman/Projects/findmymahjgame/app/admin/page.tsx, function copyClaimLinks (lines ~294-304), copies ONLY the claim link into a window.prompt and dumps stillRunning + ended to console.log. To get the two freshness links the founder must open DevTools, find the console, and copy each by hand. During 10 days of outreach that is slow and error-prone.

WHY THIS HELPS LAUNCH
The freshness flow (claim link in the first outreach email, still-running / ended links to re-confirm a listing later) is the founder's main lever for keeping venue/event data honest at launch. A single button that puts all three labeled links on the clipboard removes the console step entirely. Small, isolated, and reversible.

SCOPE: one file, /Users/shaunabruckman/Projects/findmymahjgame/app/admin/page.tsx. No API, schema, or token change. Clipboard pattern already used in app/share-preview/page.tsx, so nothing new is introduced. Well under 2 hours.

-------------------------------------------------------------------
PATCH 1 of 3 — add a per-row "copied" state alongside the existing matchMsg state

FIND (line ~206):
  const [matchMsg, setMatchMsg] = useState<{ text: string; ok: boolean } | null>(null);

REPLACE WITH:
  const [matchMsg, setMatchMsg] = useState<{ text: string; ok: boolean } | null>(null);
  const [copiedLinkId, setCopiedLinkId] = useState<string | null>(null);

-------------------------------------------------------------------
PATCH 2 of 3 — replace the whole copyClaimLinks function

FIND (lines ~294-304):
  async function copyClaimLinks(table: string, id: string, label: string) {
    try {
      const res = await fetch(`/api/admin/claim-link?table=${table}&id=${id}`);
      const d = await res.json();
      if (!res.ok) { window.alert(d.error || "Could not create the link."); return; }
      window.prompt(`Claim link for ${label} (copy it into your outreach email). Still-running and ended links are in the console.`, d.claim);
      console.log("links for", label, d);
    } catch {
      window.alert("Network error. Please try again.");
    }
  }

REPLACE WITH:
  // Puts all three magic links on the clipboard at once, labeled, so the
  // founder pastes straight into outreach without digging links out of the
  // console one at a time. The claim link goes in the first email; the
  // still-running and ended links power the later freshness ask.
  async function copyClaimLinks(table: string, id: string, label: string) {
    try {
      const res = await fetch(`/api/admin/claim-link?table=${table}&id=${id}`);
      const d = await res.json();
      if (!res.ok) { window.alert(d.error || "Could not create the links."); return; }
      const block = `${label}\n\nClaim link: ${d.claim}\n\nStill running: ${d.stillRunning}\n\nEnded: ${d.ended}`;
      try {
        await navigator.clipboard.writeText(block);
        setCopiedLinkId(id);
        setTimeout(() => setCopiedLinkId((cur) => (cur === id ? null : cur)), 2000);
      } catch {
        window.prompt("Copy these three links into your outreach email.", block);
      }
    } catch {
      window.alert("Network error. Please try again.");
    }
  }

-------------------------------------------------------------------
PATCH 3 of 3 — update the two button labels so they confirm the copy and say "all 3 links"

(a) Venues button, line ~646.
FIND:
                      <button onClick={() => copyClaimLinks("venue_listings", v.id, v.business_name)} style={{ background: "var(--bg)", border: "1px solid var(--border)", borderRadius: 4, padding: "0.3rem 0.8rem", fontSize: "0.72rem", cursor: "pointer", fontWeight: 600, fontFamily: "'DM Sans', sans-serif" }}>Claim link</button>
REPLACE WITH:
                      <button onClick={() => copyClaimLinks("venue_listings", v.id, v.business_name)} style={{ background: "var(--bg)", border: "1px solid var(--border)", borderRadius: 4, padding: "0.3rem 0.8rem", fontSize: "0.72rem", cursor: "pointer", fontWeight: 600, fontFamily: "'DM Sans', sans-serif" }}>{copiedLinkId === v.id ? "Copied all 3" : "Copy links"}</button>

(b) Events button, line ~694.
FIND:
                      <button onClick={() => copyClaimLinks("event_listings", ev.id, ev.event_name)} style={{ background: "var(--bg)", border: "1px solid var(--border)", borderRadius: 4, padding: "0.3rem 0.8rem", fontSize: "0.72rem", cursor: "pointer", fontWeight: 600, fontFamily: "'DM Sans', sans-serif" }}>Claim link</button>
REPLACE WITH:
                      <button onClick={() => copyClaimLinks("event_listings", ev.id, ev.event_name)} style={{ background: "var(--bg)", border: "1px solid var(--border)", borderRadius: 4, padding: "0.3rem 0.8rem", fontSize: "0.72rem", cursor: "pointer", fontWeight: 600, fontFamily: "'DM Sans', sans-serif" }}>{copiedLinkId === ev.id ? "Copied all 3" : "Copy links"}</button>

-------------------------------------------------------------------
NOTES
- Brand rules respected: no em/en dashes, no emoji, plain text. Admin is internal, but the copy stays clean.
- window.prompt remains only as a fallback if the clipboard API is blocked (insecure context), so the founder never gets stuck.
- After applying, run the pre-push gate per CLAUDE.md: npx tsc --noEmit clean, then the Technical and Brand reviewer workflows, before pushing.
