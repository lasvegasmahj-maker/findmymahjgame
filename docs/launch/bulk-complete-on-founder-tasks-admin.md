# Bulk-complete on Founder Tasks (admin)

# Founder leverage: Bulk-complete on Founder Tasks

## What exists today (so we do not rebuild it)
- Quick-add: a single-task add form already sits at the top of /admin/tasks (app/admin/tasks/page.tsx, the `add()` form). Working, no change needed.
- Bulk quick-add: already exists as the pink "Load launch checklist" button, but it only renders when the list is completely empty (`!items.length`). After the first task is added it disappears forever. The backend already accepts a `bulk` array (POST, up to 50 rows) in app/api/admin/tasks/route.ts.
- Bulk-complete: DOES NOT EXIST. Every task is finished one at a time via its own "Done" button. There is no way to select several open tasks and clear them in one action.

## Why this helps launch in the next 10 days
Launch week is run as call-downs: a batch of outreach calls (Linda + Ashley, Amber + Eleanor, Amanda + Bethany), day-3 follow-ups for Wave 2 teacher invites, the flagged dead-link review. The founder does these in a burst, then has to click "Done" on each row separately. Bulk-complete lets her clear a whole call-down in one tap, which is the single most repeated action on this page during launch. Small, safe, and saves real clicks daily.

## Scope
Two edits. No new files. No schema change (the founder_tasks table and its completed_at column already exist in supabase/migrations/2026-06-11-founder-tasks.sql). "Done" is the only bulk status the UI needs, so the API stays minimal.

---

## EDIT 1 — app/api/admin/tasks/route.ts

Add a bulk-done branch at the very top of the PATCH handler, mirroring the existing bulk-insert pattern in POST. Reuses the same UUID validation and completed_at stamping already used in single PATCH.

Find this (the start of the PATCH handler):

```ts
export async function PATCH(req: NextRequest) {
  if (!authed(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const b = await req.json().catch(() => ({}));
  const id = String(b.id || "");
  if (!UUID.test(id)) return NextResponse.json({ error: "Invalid request" }, { status: 400 });
```

Replace it with this (inserts the bulk branch right after reading the body, before the single-id path):

```ts
export async function PATCH(req: NextRequest) {
  if (!authed(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const b = await req.json().catch(() => ({}));

  if (Array.isArray(b.ids)) {
    const ids = b.ids.map((x: unknown) => String(x)).filter((x: string) => UUID.test(x)).slice(0, 50);
    if (!ids.length) return NextResponse.json({ error: "Nothing to update." }, { status: 400 });
    const now = new Date().toISOString();
    const { error } = await supabase
      .from("founder_tasks")
      .update({ status: "done", completed_at: now, updated_at: now })
      .in("id", ids);
    if (error) {
      console.error("tasks bulk done failed:", error.message);
      return NextResponse.json({ error: "Could not update the tasks." }, { status: 500 });
    }
    return NextResponse.json({ success: true, updated: ids.length });
  }

  const id = String(b.id || "");
  if (!UUID.test(id)) return NextResponse.json({ error: "Invalid request" }, { status: 400 });
```

(Everything below that line in PATCH stays exactly as-is.)

---

## EDIT 2 — app/admin/tasks/page.tsx

Three small changes: (a) a selection state set, (b) a checkbox + bulk bar over the Open section, (c) keep the launch-checklist button always reachable once the list is non-empty is NOT required here, so it is left untouched.

### 2a. Add selection state

Find:

```tsx
  const [editing, setEditing] = useState<string | null>(null);
  const [editNotes, setEditNotes] = useState("");
  const [editWaiting, setEditWaiting] = useState("");
```

Replace with:

```tsx
  const [editing, setEditing] = useState<string | null>(null);
  const [editNotes, setEditNotes] = useState("");
  const [editWaiting, setEditWaiting] = useState("");
  const [picked, setPicked] = useState<Set<string>>(new Set());
```

### 2b. Add a bulk-done helper and a toggle, next to the existing `add` function

Find:

```tsx
  async function add(e: React.FormEvent) {
    e.preventDefault();
    if (!newTask.trim()) return;
    await api("POST", { task: newTask, category: newCategory, priority: newPriority, due_date: newDue || undefined });
    setNewTask(""); setNewDue("");
  }
```

Add directly after it:

```tsx
  function togglePick(id: string) {
    setPicked((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  async function bulkDone(ids: string[]) {
    if (!ids.length) return;
    if (!window.confirm(`Mark ${ids.length} task${ids.length === 1 ? "" : "s"} done?`)) return;
    await api("PATCH", { ids });
    setPicked(new Set());
  }
```

### 2c. Give each Open row a checkbox and add a bulk bar above the Open section

Add a checkbox to the row only when it is selectable (not already done). Find the row header line:

```tsx
        <div style={{ display: "flex", alignItems: "flex-start", gap: "0.7rem", flexWrap: "wrap" }}>
          <span style={{ fontSize: "0.85rem", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.06em", color: CAT_COLORS[t.category] || "var(--muted)", paddingTop: "0.25rem" }}>{t.category}</span>
```

Replace with:

```tsx
        <div style={{ display: "flex", alignItems: "flex-start", gap: "0.7rem", flexWrap: "wrap" }}>
          {t.status !== "done" && (
            <input
              type="checkbox"
              aria-label={`Select ${t.task}`}
              checked={picked.has(t.id)}
              onChange={() => togglePick(t.id)}
              style={{ width: 18, height: 18, marginTop: "0.3rem" }}
            />
          )}
          <span style={{ fontSize: "0.85rem", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.06em", color: CAT_COLORS[t.category] || "var(--muted)", paddingTop: "0.25rem" }}>{t.category}</span>
```

Then render a bulk bar above the Open list. Find:

```tsx
          {section("Open", open, "Nothing open. Add a task above.")}
```

Replace with:

```tsx
          {(() => {
            const openIds = open.map((t) => t.id);
            const chosen = openIds.filter((id) => picked.has(id));
            if (!open.length) return section("Open", open, "Nothing open. Add a task above.");
            return (
              <div style={{ marginBottom: "2rem" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.8rem", flexWrap: "wrap", marginBottom: "0.7rem" }}>
                  <h2 style={{ fontSize: "1rem", fontWeight: 800, color: "var(--navy)", textTransform: "uppercase", letterSpacing: "0.08em", margin: 0 }}>Open ({open.length})</h2>
                  <label style={{ display: "flex", alignItems: "center", gap: "0.4rem", fontSize: "0.82rem", fontWeight: 600, color: "var(--navy)", cursor: "pointer" }}>
                    <input
                      type="checkbox"
                      checked={chosen.length === openIds.length && openIds.length > 0}
                      onChange={() => setPicked(chosen.length === openIds.length ? new Set() : new Set(openIds))}
                      style={{ width: 18, height: 18 }}
                    />
                    Select all
                  </label>
                  <button type="button" onClick={() => bulkDone(chosen)} disabled={!chosen.length} style={{ ...btn("var(--green)", "white"), opacity: chosen.length ? 1 : 0.5 }}>
                    Mark {chosen.length} done
                  </button>
                </div>
                {open.map(row)}
              </div>
            );
          })()}
```

(The Waiting / Snoozed / Recently done sections stay on the existing `section()` helper, unchanged.)

---

## Safety notes
- Auth is unchanged: the bulk PATCH branch sits behind the same `authed(req)` gate as every other handler in the route.
- Validation is unchanged in character: each id is UUID-checked with the existing `UUID` regex; non-UUIDs are dropped, capped at 50 per call to match the bulk-insert cap.
- No schema migration. The `completed_at` and `updated_at` columns already exist and are stamped exactly as the single-id PATCH does.
- Style compliance: no em or en dashes, no emoji, active voice, plain language in all copy ("Mark N done", "Select all").
- After applying, run `npx tsc --noEmit` and the Technical + Brand reviewer workflows per the repo's pre-push gate before pushing.

## What I did NOT add (avoiding gold-plating)
- No bulk delete, bulk snooze, or bulk re-categorize. "Done" is the launch-week pain point; the rest is rare and individually fast already.
- No change to the existing single-task quick-add or the launch-checklist loader; both already work.
