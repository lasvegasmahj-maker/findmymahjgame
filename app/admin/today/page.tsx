"use client";

import { useEffect, useState, useCallback } from "react";

type Match = {
  id: string;
  city: string;
  day_pref: string | null;
  time_pref: string | null;
  players: string[];
  created_at: string;
  approveUrl: string;
  skipUrl: string;
};

type Today = {
  counts: {
    pendingPlayers: number;
    pendingVenues: number;
    pendingEvents: number;
    newInquiries: number;
    newAmbassadors: number;
    pendingEdits: number;
    matchDrafts: number;
  };
  matches: Match[];
};

const btn = (bg: string, color: string, border?: string): React.CSSProperties => ({
  background: bg, color, border: border || "none", borderRadius: 8, padding: "0.55rem 0.9rem",
  minHeight: 44, fontSize: "0.95rem", fontWeight: 700, cursor: "pointer", textDecoration: "none",
  display: "inline-flex", alignItems: "center", justifyContent: "center", fontFamily: "'DM Sans', sans-serif",
});

function Card({ label, count, href, cta }: { label: string; count: number; href: string; cta: string }) {
  return (
    <a
      href={href}
      style={{
        background: "white",
        border: count > 0 ? "1px solid rgba(233,30,140,0.35)" : "1px solid var(--border)",
        borderRadius: 12,
        padding: "1.1rem 1.3rem",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "1rem",
        textDecoration: "none",
        boxShadow: count > 0 ? "0 2px 14px rgba(233,30,140,0.08)" : "none",
      }}
    >
      <div>
        <div style={{ fontSize: "1.6rem", fontWeight: 800, color: count > 0 ? "var(--pink)" : "var(--muted)", lineHeight: 1 }}>{count}</div>
        <div style={{ fontSize: "0.9rem", fontWeight: 600, color: "var(--navy)", marginTop: "0.3rem" }}>{label}</div>
      </div>
      <span style={{ fontSize: "0.85rem", fontWeight: 700, color: count > 0 ? "var(--pink)" : "var(--muted)" }}>{cta} &rarr;</span>
    </a>
  );
}

export default function TodayPage() {
  const [data, setData] = useState<Today | null>(null);
  const [authed, setAuthed] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const res = await fetch("/api/admin/today", { cache: "no-store" });
    if (res.status === 401) { setAuthed(false); setLoading(false); return; }
    setAuthed(true);
    const json = (await res.json().catch(() => null)) as Today | null;
    setData(json);
    setLoading(false);
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
  }, [load]);

  if (authed === null) return null;
  if (!authed) {
    return (
      <div style={{ maxWidth: 600, margin: "4rem auto", textAlign: "center", fontFamily: "'DM Sans', sans-serif" }}>
        <p>Please <a href="/admin" style={{ color: "var(--pink)", fontWeight: 700 }}>sign in to admin</a> first.</p>
      </div>
    );
  }

  const c = data?.counts;
  const total = c
    ? c.pendingPlayers + c.pendingVenues + c.pendingEvents + c.newInquiries + c.newAmbassadors + c.pendingEdits + c.matchDrafts
    : 0;

  return (
    <div style={{ maxWidth: 900, margin: "0 auto", padding: "2rem 1.2rem 4rem", fontFamily: "'DM Sans', sans-serif" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "0.8rem", marginBottom: "1.4rem" }}>
        <h1 style={{ fontFamily: "var(--font-playfair), 'Playfair Display', serif", fontSize: "1.8rem", color: "var(--navy)", margin: 0 }}>Today</h1>
        <div style={{ display: "flex", gap: "0.6rem", flexWrap: "wrap" }}>
          <button type="button" onClick={() => { setLoading(true); void load(); }} style={btn("var(--bg)", "var(--navy)", "1px solid var(--border)")}>Refresh</button>
          <a href="/admin" style={btn("var(--bg)", "var(--navy)", "1px solid var(--border)")}>&larr; Admin</a>
        </div>
      </div>

      {loading ? (
        <p style={{ color: "var(--muted)" }}>Loading...</p>
      ) : !data ? (
        <p style={{ color: "var(--muted)" }}>Could not load. Try Refresh.</p>
      ) : (
        <>
          <p style={{ fontSize: "1rem", color: "var(--navy)", fontWeight: 600, marginBottom: "1.4rem" }}>
            {total === 0 ? "You are all caught up. Nothing is waiting on you." : `${total} item${total === 1 ? "" : "s"} waiting on you.`}
          </p>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(230px, 1fr))", gap: "0.9rem", marginBottom: "2.2rem" }}>
            <Card label="Player listings to approve" count={c!.pendingPlayers} href="/admin" cta="Review" />
            <Card label="Venue listings to approve" count={c!.pendingVenues} href="/admin" cta="Review" />
            <Card label="Event listings to approve" count={c!.pendingEvents} href="/admin" cta="Review" />
            <Card label="New inquiries" count={c!.newInquiries} href="/admin" cta="Open" />
            <Card label="New ambassador applications" count={c!.newAmbassadors} href="/admin" cta="Open" />
            <Card label="Listing edits to approve" count={c!.pendingEdits} href="/admin/edits" cta="Review" />
          </div>

          <h2 style={{ fontSize: "1rem", fontWeight: 800, color: "var(--navy)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "0.8rem" }}>
            Match drafts waiting ({data.matches.length})
          </h2>
          {data.matches.length === 0 ? (
            <p style={{ fontSize: "0.9rem", color: "var(--muted)" }}>
              No matches waiting. When the matcher pairs players, each draft shows up here for your one-click approval, even if the email gets buried.
            </p>
          ) : (
            data.matches.map((m) => (
              <div key={m.id} style={{ background: "white", border: "1px solid var(--border)", borderRadius: 10, padding: "1rem 1.2rem", marginBottom: "0.7rem" }}>
                <div style={{ fontSize: "0.95rem", color: "var(--navy)", fontWeight: 700, marginBottom: "0.3rem" }}>
                  A table wants to form in {m.city}
                </div>
                <div style={{ fontSize: "0.9rem", color: "var(--navy)", marginBottom: "0.2rem" }}>
                  Players: {m.players.join(", ")}
                </div>
                <div style={{ fontSize: "0.85rem", color: "var(--muted)", marginBottom: "0.7rem" }}>
                  Preference: {m.day_pref || "any day"}, {m.time_pref || "any time"} &middot; drafted {new Date(m.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                </div>
                <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                  <a href={m.approveUrl} style={btn("var(--green)", "white")}>Approve this match</a>
                  <a href={m.skipUrl} style={btn("#fee2e2", "#dc2626", "1px solid #fca5a5")}>Skip</a>
                </div>
                <p style={{ fontSize: "0.78rem", color: "var(--muted)", margin: "0.6rem 0 0" }}>
                  Approving creates the table and emails each player a claim link. Nothing sends until you confirm on the next screen.
                </p>
              </div>
            ))
          )}
        </>
      )}
    </div>
  );
}
