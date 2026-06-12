"use client";

import { useEffect, useState, useCallback } from "react";

type Contact = {
  id: string;
  name: string;
  organization: string | null;
  email: string | null;
  phone: string | null;
  city: string | null;
  state: string | null;
  contact_type: string;
  wave: number | null;
  rank: number | null;
  status: string;
  best_channel: string | null;
  website: string | null;
  instagram: string | null;
  nv_guardrail: boolean;
  notes: string | null;
  last_touch: string | null;
  next_touch: string | null;
};

const STATUSES = ["not_contacted", "contacted", "replied", "claimed", "activated", "declined", "do_not_contact"];
const STATUS_LABEL: Record<string, string> = {
  not_contacted: "Not contacted", contacted: "Contacted", replied: "Replied",
  claimed: "Claimed", activated: "Activated", declined: "Declined", do_not_contact: "Do not contact",
};
const STATUS_COLOR: Record<string, string> = {
  not_contacted: "#6b7280", contacted: "var(--navy)", replied: "#a07800",
  claimed: "#1a9648", activated: "var(--pink)", declined: "#dc2626", do_not_contact: "#dc2626",
};

const field: React.CSSProperties = { padding: "0.6rem 0.8rem", minHeight: 44, border: "1px solid var(--border)", borderRadius: 8, fontSize: "1rem", fontFamily: "'DM Sans', sans-serif", color: "var(--navy)", background: "white" };
const btn = (bg: string, color: string, border?: string): React.CSSProperties => ({ background: bg, color, border: border || "none", borderRadius: 8, padding: "0.55rem 0.9rem", minHeight: 44, fontSize: "0.95rem", fontWeight: 700, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" });

export default function RelationshipsPage() {
  const [items, setItems] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [needsMigration, setNeedsMigration] = useState(false);
  const [authed, setAuthed] = useState<boolean | null>(null);
  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [waveFilter, setWaveFilter] = useState("");
  const [editing, setEditing] = useState<string | null>(null);
  const [editNotes, setEditNotes] = useState("");
  const [editNext, setEditNext] = useState("");

  const load = useCallback(async () => {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (statusFilter) params.set("status", statusFilter);
    if (waveFilter) params.set("wave", waveFilter);
    const res = await fetch(`/api/admin/crm?${params}`, { cache: "no-store" });
    if (res.status === 401) { setAuthed(false); setLoading(false); return; }
    setAuthed(true);
    const json = await res.json().catch(() => ({ items: [] }));
    setNeedsMigration(!!json.needsMigration);
    setItems(json.items || []);
    setLoading(false);
  }, [q, statusFilter, waveFilter]);

  useEffect(() => {
    // Debounced: one request 300ms after the last keystroke; setState after await.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    const t = setTimeout(() => { void load(); }, 300);
    return () => clearTimeout(t);
  }, [load]);

  async function patch(id: string, body: Record<string, unknown>) {
    try {
      const res = await fetch("/api/admin/crm", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, ...body }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        window.alert(d.error || "Something went wrong.");
      }
    } catch {
      window.alert("Network error. Please try again.");
    }
    load();
  }

  if (authed === null) return null;
  if (!authed) return <div style={{ maxWidth: 600, margin: "4rem auto", textAlign: "center", fontFamily: "'DM Sans', sans-serif" }}><p>Please <a href="/admin" style={{ color: "var(--pink)", fontWeight: 700 }}>sign in to admin</a> first.</p></div>;

  const counts: Record<string, number> = {};
  for (const c of items) counts[c.status] = (counts[c.status] || 0) + 1;

  return (
    <div style={{ maxWidth: 1000, margin: "0 auto", padding: "2rem 1.2rem 4rem", fontFamily: "'DM Sans', sans-serif" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "0.8rem", marginBottom: "1.2rem" }}>
        <h1 style={{ fontFamily: "var(--font-playfair), 'Playfair Display', serif", fontSize: "1.8rem", color: "var(--navy)", margin: 0 }}>Relationships</h1>
        <a href="/admin" style={btn("var(--bg)", "var(--navy)", "1px solid var(--border)")}>&larr; Admin</a>
      </div>

      {needsMigration && (
        <div style={{ background: "#fef3c7", border: "1px solid #f5c842", borderRadius: 10, padding: "1rem 1.2rem", marginBottom: "1.4rem", fontSize: "0.92rem", color: "#7a5d00", lineHeight: 1.6 }}>
          One-time setup: run <code>supabase/migrations/2026-06-11-crm-contacts.sql</code> in the Supabase SQL editor, then <code>node --env-file=.env.local scripts/import-crm.mjs</code> to load the researched contacts and the wave-1 anchors. Refresh after.
        </div>
      )}

      <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", marginBottom: "1.2rem" }}>
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search name, business, or city" aria-label="Search contacts" style={{ ...field, flex: "1 1 240px" }} />
        <select value={waveFilter} onChange={(e) => setWaveFilter(e.target.value)} aria-label="Wave" style={field}>
          <option value="">All waves</option>
          <option value="1">Wave 1 (anchors)</option>
          <option value="2">Wave 2 (top 30)</option>
          <option value="3">Wave 3</option>
        </select>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} aria-label="Status" style={field}>
          <option value="">All statuses</option>
          {STATUSES.map((s) => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}
        </select>
      </div>

      <div style={{ display: "flex", gap: "0.9rem", flexWrap: "wrap", marginBottom: "1.4rem", fontSize: "0.82rem", color: "var(--muted)" }}>
        {STATUSES.filter((s) => counts[s]).map((s) => (
          <span key={s}><strong style={{ color: STATUS_COLOR[s] }}>{counts[s]}</strong> {STATUS_LABEL[s].toLowerCase()}</span>
        ))}
      </div>

      {loading ? <p style={{ color: "var(--muted)" }}>Loading...</p> : !items.length ? <p style={{ color: "var(--muted)" }}>No contacts match.</p> : (
        items.map((c) => (
          <div key={c.id} style={{ background: "white", border: c.nv_guardrail ? "1px solid #fca5a5" : "1px solid var(--border)", borderRadius: 10, padding: "0.85rem 1rem", marginBottom: "0.6rem" }}>
            <div style={{ display: "flex", alignItems: "flex-start", gap: "0.8rem", flexWrap: "wrap" }}>
              <div style={{ flex: "1 1 300px" }}>
                <div style={{ fontSize: "0.98rem", fontWeight: 700, color: "var(--navy)" }}>
                  {c.wave === 1 && <span style={{ color: "var(--pink)", fontWeight: 800 }}>W1 </span>}
                  {c.rank ? <span style={{ color: "var(--muted)", fontWeight: 600 }}>#{c.rank} </span> : null}
                  {c.name}
                  {c.organization && <span style={{ color: "var(--muted)", fontWeight: 500 }}> &middot; {c.organization}</span>}
                  {c.nv_guardrail && <span style={{ color: "#dc2626", fontSize: "0.75rem", fontWeight: 800 }}> NV GUARDRAIL</span>}
                </div>
                <div style={{ fontSize: "0.82rem", color: "var(--muted)", marginTop: "0.2rem" }}>
                  {[c.city && `${c.city}, ${c.state}`, c.contact_type, c.email, c.phone, c.best_channel && `via ${c.best_channel}`].filter(Boolean).join(" · ")}
                </div>
                {c.notes && <div style={{ fontSize: "0.84rem", color: "var(--navy)", marginTop: "0.3rem", whiteSpace: "pre-wrap" }}>{c.notes}</div>}
                {(c.last_touch || c.next_touch) && (
                  <div style={{ fontSize: "0.78rem", color: "var(--muted)", marginTop: "0.25rem" }}>
                    {c.last_touch ? `Last touch ${c.last_touch}` : ""}{c.last_touch && c.next_touch ? " · " : ""}{c.next_touch ? `Next touch ${c.next_touch}` : ""}
                  </div>
                )}
              </div>
              <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap", alignItems: "center" }}>
                <select value={c.status} onChange={(e) => patch(c.id, { status: e.target.value })} aria-label={`Status for ${c.name}`} style={{ ...field, fontWeight: 700, color: STATUS_COLOR[c.status] }}>
                  {STATUSES.map((s) => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}
                </select>
                <button type="button" onClick={() => { setEditing(editing === c.id ? null : c.id); setEditNotes(c.notes || ""); setEditNext(c.next_touch || ""); }} style={btn("var(--bg)", "var(--navy)", "1px solid var(--border)")}>Notes</button>
              </div>
            </div>
            {editing === c.id && (
              <div style={{ marginTop: "0.6rem", display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                <textarea value={editNotes} onChange={(e) => setEditNotes(e.target.value)} placeholder="Notes" style={{ ...field, flex: "1 1 320px", minHeight: 60 }} />
                <input type="date" value={editNext} onChange={(e) => setEditNext(e.target.value)} aria-label="Next touch date" style={field} />
                <button type="button" onClick={() => { patch(c.id, { notes: editNotes, next_touch: editNext }); setEditing(null); }} style={btn("var(--navy)", "white")}>Save</button>
              </div>
            )}
          </div>
        ))
      )}
    </div>
  );
}
