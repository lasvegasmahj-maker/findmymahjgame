"use client";

import { useEffect, useState, useCallback } from "react";

type Task = {
  id: string;
  task: string;
  notes: string | null;
  category: string;
  priority: string;
  due_date: string | null;
  status: string;
  waiting_on: string | null;
  related_name: string | null;
  snoozed_until: string | null;
  created_at: string;
};

const CATEGORIES = ["outreach", "follow-up", "approval", "decision", "relationship", "ops"];
const CAT_COLORS: Record<string, string> = {
  outreach: "var(--pink)", "follow-up": "#a07800", approval: "#1a9648",
  decision: "var(--navy)", relationship: "#7c3aed", ops: "#6b7280",
};

// Week-1 standing items from the launch command center, one tap to load.
const LAUNCH_TASKS = [
  { task: "Text Kristel Powell: is she Crystal of True Mahjong?", category: "decision", priority: "high", waiting_on: "", related_name: "Kristel Powell" },
  { task: "Set the Dallas Welcome Week date (recommended week of July 13)", category: "decision", priority: "high" },
  { task: "Mailchimp API key + Audience ID into Vercel, import the 195", category: "ops", priority: "high" },
  { task: "Call Lisa Rocchio (The Charleston Club) about a Welcome Week newcomer seat", category: "outreach", priority: "high", related_name: "Lisa Rocchio" },
  { task: "Call Linda Casey and Ashley Gomez (Dallas Mahj Club)", category: "outreach", priority: "high", related_name: "Dallas Mahj Club" },
  { task: "Call Amber and Eleanor (Peace Love Mahjong)", category: "outreach", priority: "normal", related_name: "Peace Love Mahjong" },
  { task: "Call Amanda and Bethany (The Mahj Clubhouse, Fort Worth)", category: "outreach", priority: "normal", related_name: "The Mahj Clubhouse" },
  { task: "Review the 12 flagged dead-link listings in admin", category: "approval", priority: "normal" },
  { task: "Send Newsletter Issue 1 after the smoke checks pass", category: "ops", priority: "normal" },
  { task: "Day-3 follow-ups for Wave 2 teacher invitations", category: "follow-up", priority: "normal" },
];

const field: React.CSSProperties = { padding: "0.6rem 0.8rem", minHeight: 44, border: "1px solid var(--border)", borderRadius: 8, fontSize: "1rem", fontFamily: "'DM Sans', sans-serif", color: "var(--navy)", background: "white" };
const btn = (bg: string, color: string, border?: string): React.CSSProperties => ({ background: bg, color, border: border || "none", borderRadius: 8, padding: "0.55rem 0.9rem", minHeight: 44, fontSize: "0.95rem", fontWeight: 700, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" });

function plusDays(n: number) {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
}

export default function FounderTasksPage() {
  const [items, setItems] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [needsMigration, setNeedsMigration] = useState(false);
  const [authed, setAuthed] = useState<boolean | null>(null);
  const [newTask, setNewTask] = useState("");
  const [newCategory, setNewCategory] = useState("ops");
  const [newPriority, setNewPriority] = useState("normal");
  const [newDue, setNewDue] = useState("");
  const [editing, setEditing] = useState<string | null>(null);
  const [editNotes, setEditNotes] = useState("");
  const [editWaiting, setEditWaiting] = useState("");

  const load = useCallback(async () => {
    const res = await fetch("/api/admin/tasks", { cache: "no-store" });
    if (res.status === 401) { setAuthed(false); setLoading(false); return; }
    setAuthed(true);
    const json = await res.json().catch(() => ({ items: [] }));
    setNeedsMigration(!!json.needsMigration);
    setItems(json.items || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    // Initial data fetch; every setState happens after the await.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
  }, [load]);

  async function api(method: string, body?: unknown, query?: string) {
    try {
      const res = await fetch(`/api/admin/tasks${query || ""}`, {
        method,
        headers: body ? { "Content-Type": "application/json" } : undefined,
        body: body ? JSON.stringify(body) : undefined,
      });
      const json = await res.json().catch(() => ({}));
      if (json.needsMigration) setNeedsMigration(true);
      else if (!res.ok) window.alert(json.error || "Something went wrong.");
    } catch {
      window.alert("Network error. Please try again.");
    }
    load();
  }

  async function add(e: React.FormEvent) {
    e.preventDefault();
    if (!newTask.trim()) return;
    await api("POST", { task: newTask, category: newCategory, priority: newPriority, due_date: newDue || undefined });
    setNewTask(""); setNewDue("");
  }

  const today = new Date().toISOString().slice(0, 10);
  const snoozeExpired = (t: Task) => t.status === "snoozed" && (!t.snoozed_until || t.snoozed_until <= today);
  const snoozed = items.filter((t) => t.status === "snoozed" && !snoozeExpired(t));
  const open = items.filter((t) => ["open", "in_progress"].includes(t.status) || snoozeExpired(t));
  const visible = items;
  const waiting = visible.filter((t) => t.status === "waiting");
  const done = items.filter((t) => t.status === "done").slice(0, 15);
  const focus = open
    .filter((t) => t.priority === "high" || (t.due_date && t.due_date <= today) || snoozeExpired(t))
    .slice(0, 5);

  function row(t: Task) {
    const overdue = t.due_date && t.due_date < today && t.status !== "done";
    return (
      <div key={t.id} style={{ background: "white", border: "1px solid var(--border)", borderRadius: 10, padding: "0.8rem 1rem", marginBottom: "0.6rem" }}>
        <div style={{ display: "flex", alignItems: "flex-start", gap: "0.7rem", flexWrap: "wrap" }}>
          <span style={{ fontSize: "0.85rem", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.06em", color: CAT_COLORS[t.category] || "var(--muted)", paddingTop: "0.25rem" }}>{t.category}</span>
          <div style={{ flex: "1 1 280px" }}>
            <div style={{ fontSize: "0.95rem", fontWeight: t.priority === "high" ? 800 : 600, color: "var(--navy)", textDecoration: t.status === "done" ? "line-through" : "none" }}>
              {t.task}
              {t.related_name && <span style={{ color: "var(--muted)", fontWeight: 500 }}> &middot; {t.related_name}</span>}
            </div>
            {t.notes && <div style={{ fontSize: "0.85rem", color: "var(--muted)", marginTop: "0.2rem", whiteSpace: "pre-wrap" }}>{t.notes}</div>}
            <div style={{ fontSize: "0.88rem", color: overdue ? "#dc2626" : "var(--muted)", marginTop: "0.25rem", fontWeight: overdue ? 700 : 400 }}>
              {t.due_date ? `Due ${t.due_date}${overdue ? " (overdue)" : ""}` : ""}
              {t.status === "waiting" && t.waiting_on ? `Waiting on ${t.waiting_on}` : ""}
              {t.status === "snoozed" && t.snoozed_until ? `Snoozed to ${t.snoozed_until}` : ""}
            </div>
          </div>
          <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap" }}>
            {t.status !== "done" && <button type="button" onClick={() => api("PATCH", { id: t.id, status: "done" })} style={btn("var(--green)", "white")}>Done</button>}
            {t.status === "open" && <button type="button" onClick={() => { const who = window.prompt("Waiting on whom?"); if (who !== null) api("PATCH", { id: t.id, status: "waiting", waiting_on: who }); }} style={btn("var(--bg)", "var(--navy)", "1px solid var(--border)")}>Waiting</button>}
            {t.status !== "done" && <button type="button" onClick={() => api("PATCH", { id: t.id, status: "snoozed", snoozed_until: plusDays(7) })} style={btn("var(--bg)", "var(--navy)", "1px solid var(--border)")}>Snooze 7d</button>}
            {t.status === "done" && <button type="button" onClick={() => api("PATCH", { id: t.id, status: "open" })} style={btn("var(--bg)", "var(--navy)", "1px solid var(--border)")}>Reopen</button>}
            <button type="button" onClick={() => { setEditing(editing === t.id ? null : t.id); setEditNotes(t.notes || ""); setEditWaiting(t.waiting_on || ""); }} style={btn("var(--bg)", "var(--navy)", "1px solid var(--border)")}>Notes</button>
            <button type="button" onClick={() => { if (window.confirm("Delete this task?")) api("DELETE", undefined, `?id=${t.id}`); }} style={btn("#fee2e2", "#dc2626", "1px solid #fca5a5")}>Delete</button>
          </div>
        </div>
        {editing === t.id && (
          <div style={{ marginTop: "0.6rem", display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
            <textarea value={editNotes} onChange={(e) => setEditNotes(e.target.value)} placeholder="Notes" style={{ ...field, flex: "1 1 320px", minHeight: 60 }} />
            <input value={editWaiting} onChange={(e) => setEditWaiting(e.target.value)} placeholder="Waiting on" style={{ ...field, flex: "0 1 180px" }} />
            <button type="button" onClick={() => { api("PATCH", { id: t.id, notes: editNotes, waiting_on: editWaiting }); setEditing(null); }} style={btn("var(--navy)", "white")}>Save</button>
          </div>
        )}
      </div>
    );
  }

  function section(title: string, list: Task[], empty: string) {
    return (
      <div style={{ marginBottom: "2rem" }}>
        <h2 style={{ fontSize: "1rem", fontWeight: 800, color: "var(--navy)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "0.7rem" }}>{title} ({list.length})</h2>
        {list.length ? list.map(row) : <p style={{ fontSize: "0.88rem", color: "var(--muted)" }}>{empty}</p>}
      </div>
    );
  }

  if (authed === null) return null;
  if (!authed) return <div style={{ maxWidth: 600, margin: "4rem auto", textAlign: "center", fontFamily: "'DM Sans', sans-serif" }}><p>Please <a href="/admin" style={{ color: "var(--pink-text)", fontWeight: 700 }}>sign in to admin</a> first.</p></div>;

  return (
    <div style={{ maxWidth: 900, margin: "0 auto", padding: "2rem 1.2rem 4rem", fontFamily: "'DM Sans', sans-serif" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "0.8rem", marginBottom: "1.4rem" }}>
        <h1 style={{ fontFamily: "var(--font-playfair), 'Playfair Display', serif", fontSize: "1.8rem", color: "var(--navy)", margin: 0 }}>Founder Tasks</h1>
        <div style={{ display: "flex", gap: "0.6rem" }}>
          <a href="/admin" style={btn("var(--bg)", "var(--navy)", "1px solid var(--border)")}>&larr; Admin</a>
          {!items.length && !loading && !needsMigration && (
            <button type="button" onClick={() => api("POST", { bulk: LAUNCH_TASKS })} style={btn("var(--pink)", "white")}>Load launch checklist</button>
          )}
        </div>
      </div>

      {needsMigration && (
        <div style={{ background: "#fef3c7", border: "1px solid #f5c842", borderRadius: 10, padding: "1rem 1.2rem", marginBottom: "1.4rem", fontSize: "0.92rem", color: "#7a5d00", lineHeight: 1.6 }}>
          One-time setup: run <code>supabase/migrations/2026-06-11-founder-tasks.sql</code> in the Supabase SQL editor, then refresh this page.
        </div>
      )}

      <form onSubmit={add} style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", background: "var(--bg)", border: "1px solid var(--border)", borderRadius: 12, padding: "0.9rem", marginBottom: "2rem" }}>
        <input value={newTask} onChange={(e) => setNewTask(e.target.value)} placeholder="Add a task" aria-label="New task" style={{ ...field, flex: "1 1 260px" }} />
        <select value={newCategory} onChange={(e) => setNewCategory(e.target.value)} aria-label="Category" style={field}>
          {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        <select value={newPriority} onChange={(e) => setNewPriority(e.target.value)} aria-label="Priority" style={field}>
          <option value="high">high</option><option value="normal">normal</option><option value="low">low</option>
        </select>
        <input type="date" value={newDue} onChange={(e) => setNewDue(e.target.value)} aria-label="Due date" style={field} />
        <button type="submit" style={btn("var(--navy)", "white")}>Add</button>
      </form>

      {loading ? <p style={{ color: "var(--muted)" }}>Loading...</p> : (
        <>
          {focus.length > 0 && (
            <div style={{ background: "#fff5fa", border: "1px solid rgba(233,30,140,0.25)", borderRadius: 12, padding: "1rem 1.2rem", marginBottom: "2rem" }}>
              <h2 style={{ fontSize: "1rem", fontWeight: 800, color: "var(--pink-text)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "0.7rem" }}>Today&rsquo;s focus</h2>
              {focus.map(row)}
            </div>
          )}
          {section("Open", open, "Nothing open. Add a task above.")}
          {section("Waiting on", waiting, "Not waiting on anyone.")}
          {section("Snoozed", snoozed, "Nothing snoozed.")}
          {section("Recently done", done, "Nothing finished yet.")}
        </>
      )}
    </div>
  );
}
