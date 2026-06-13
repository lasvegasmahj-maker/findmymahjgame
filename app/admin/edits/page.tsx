"use client";

import { useEffect, useState, useCallback } from "react";

type Edit = {
  id: string;
  listing_table: string;
  listing_id: string;
  claimer_email: string;
  changes: Record<string, string | null>;
  previous: Record<string, string | null> | null;
  status: string;
  created_at: string;
};

const btn = (bg: string, color: string, border?: string): React.CSSProperties => ({ background: bg, color, border: border || "none", borderRadius: 8, padding: "0.55rem 0.9rem", minHeight: 44, fontSize: "0.95rem", fontWeight: 700, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" });

export default function EditsQueuePage() {
  const [items, setItems] = useState<Edit[]>([]);
  const [loading, setLoading] = useState(true);
  const [needsMigration, setNeedsMigration] = useState(false);
  const [authed, setAuthed] = useState<boolean | null>(null);

  const load = useCallback(async () => {
    const res = await fetch("/api/admin/edits", { cache: "no-store" });
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

  async function decide(id: string, decision: "approve" | "reject") {
    try {
      const res = await fetch("/api/admin/edits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, decision }),
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
  if (!authed) return <div style={{ maxWidth: 600, margin: "4rem auto", textAlign: "center", fontFamily: "'DM Sans', sans-serif" }}><p>Please <a href="/admin" style={{ color: "var(--pink-text)", fontWeight: 700 }}>sign in to admin</a> first.</p></div>;

  const pending = items.filter((e) => e.status === "pending");
  const decided = items
    .filter((e) => e.status !== "pending")
    .sort((a, b) => b.created_at.localeCompare(a.created_at))
    .slice(0, 20);

  function card(e: Edit) {
    return (
      <div key={e.id} style={{ background: "white", border: "1px solid var(--border)", borderRadius: 10, padding: "1rem 1.2rem", marginBottom: "0.7rem" }}>
        <div style={{ fontSize: "0.82rem", color: "var(--muted)", marginBottom: "0.5rem" }}>
          {e.listing_table === "venue_listings" ? "Teacher/Venue" : "Event"} edit from <a href={`mailto:${e.claimer_email}`} style={{ color: "var(--pink-text)", fontWeight: 600 }}>{e.claimer_email}</a> · {new Date(e.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
        </div>
        {Object.entries(e.changes).map(([k, val]) => (
          <div key={k} style={{ fontSize: "0.92rem", marginBottom: "0.35rem" }}>
            <span style={{ fontWeight: 700, color: "var(--navy)" }}>{k.replace(/_/g, " ")}:</span>{" "}
            <span style={{ color: "#dc2626", textDecoration: "line-through" }}>{e.previous?.[k] || "(empty)"}</span>{" "}
            <span style={{ color: "var(--green-dark, #1a6e3a)", fontWeight: 600 }}>{val || "(cleared)"}</span>
          </div>
        ))}
        {e.status === "pending" ? (
          <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.7rem" }}>
            <button type="button" onClick={() => decide(e.id, "approve")} style={btn("var(--green)", "white")}>Approve and apply</button>
            <button type="button" onClick={() => decide(e.id, "reject")} style={btn("#fee2e2", "#dc2626", "1px solid #fca5a5")}>Reject</button>
          </div>
        ) : (
          <div style={{ fontSize: "0.82rem", fontWeight: 700, color: e.status === "approved" ? "var(--green-dark, #1a6e3a)" : "#dc2626", marginTop: "0.5rem", textTransform: "uppercase" }}>{e.status}</div>
        )}
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 860, margin: "0 auto", padding: "2rem 1.2rem 4rem", fontFamily: "'DM Sans', sans-serif" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "0.8rem", marginBottom: "1.4rem" }}>
        <h1 style={{ fontFamily: "var(--font-playfair), 'Playfair Display', serif", fontSize: "1.8rem", color: "var(--navy)", margin: 0 }}>Edit Requests</h1>
        <a href="/admin" style={btn("var(--bg)", "var(--navy)", "1px solid var(--border)")}>&larr; Admin</a>
      </div>

      {needsMigration && (
        <div style={{ background: "#fef3c7", border: "1px solid #f5c842", borderRadius: 10, padding: "1rem 1.2rem", marginBottom: "1.4rem", fontSize: "0.92rem", color: "#7a5d00", lineHeight: 1.6 }}>
          One-time setup: run <code>supabase/migrations/2026-06-12-claims-freshness.sql</code> in the Supabase SQL editor, then refresh.
        </div>
      )}

      {loading ? <p style={{ color: "var(--muted)" }}>Loading...</p> : (
        <>
          <h2 style={{ fontSize: "1rem", fontWeight: 800, color: "var(--navy)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "0.7rem" }}>Pending ({pending.length})</h2>
          {pending.length ? pending.map(card) : <p style={{ fontSize: "0.9rem", color: "var(--muted)" }}>No edits waiting. When a teacher claims her listing and proposes changes, they appear here.</p>}
          {decided.length > 0 && (
            <>
              <h2 style={{ fontSize: "1rem", fontWeight: 800, color: "var(--navy)", textTransform: "uppercase", letterSpacing: "0.08em", margin: "2rem 0 0.7rem" }}>Recently decided</h2>
              {decided.map(card)}
            </>
          )}
        </>
      )}
    </div>
  );
}
