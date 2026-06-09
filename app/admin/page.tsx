"use client";

import { useState, useEffect } from "react";

type Tab = "inquiries" | "players" | "venues" | "events" | "ads" | "ambassadors";

interface Inquiry {
  id: string;
  name: string;
  email: string;
  company: string | null;
  inquiry_type: string;
  interest: string | null;
  message: string | null;
  status: string;
  notes: string | null;
  created_at: string;
}

interface PlayerListing {
  id: string;
  name: string;
  city: string;
  state: string;
  skill_level: string;
  availability: string | null;
  status: string;
  created_at: string;
}

interface VenueListing {
  id: string;
  business_name: string;
  venue_type: string;
  city: string;
  state: string;
  tier: string;
  status: string;
  contact_email: string;
  created_at: string;
}

interface EventListing {
  id: string;
  event_name: string;
  event_type: string;
  city: string;
  state: string;
  event_date: string | null;
  tier: string;
  status: string;
  contact_email: string;
  created_at: string;
}

interface AdListing {
  id: string;
  company_name: string;
  placement: string;
  tier: string;
  status: string;
  contact_email: string;
  created_at: string;
}

interface Ambassador {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  city: string | null;
  state: string | null;
  role: string | null;
  reach: string | null;
  why: string | null;
  status: string;
  created_at: string;
}

function LoginGate({ onAuth }: { onAuth: () => void }) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState(false);

  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    const res = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    setSubmitting(false);
    if (res.ok) {
      onAuth();
    } else {
      setError(true);
      setPassword("");
    }
  }

  return (
    <div style={{
      minHeight: "100vh",
      background: "var(--bg)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontFamily: "'DM Sans', sans-serif",
    }}>
      <div style={{
        background: "white",
        border: "1px solid var(--border)",
        borderRadius: 20,
        padding: "3rem 2.5rem",
        width: "100%",
        maxWidth: 380,
        boxShadow: "0 8px 40px rgba(26,31,94,0.10)",
        textAlign: "center",
      }}>
        <div style={{
          fontFamily: "var(--font-playfair), 'Playfair Display', serif",
          fontSize: "1.5rem",
          fontWeight: 700,
          color: "var(--navy)",
          marginBottom: "0.3rem",
          letterSpacing: "-0.01em",
        }}>
          Find My Mahj Game
        </div>
        <div style={{ fontSize: "0.82rem", color: "var(--muted)", marginBottom: "2rem", textTransform: "uppercase", letterSpacing: "0.1em" }}>
          Admin
        </div>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <input
            type="password"
            value={password}
            onChange={(e) => { setPassword(e.target.value); setError(false); }}
            placeholder="Password"
            autoFocus
            style={{
              padding: "0.85rem 1.1rem",
              borderRadius: 10,
              border: error ? "1.5px solid #dc2626" : "1.5px solid var(--border)",
              fontSize: "0.95rem",
              fontFamily: "'DM Sans', sans-serif",
              color: "var(--navy)",
              outline: "none",
              background: "var(--bg)",
              transition: "border-color 0.15s",
            }}
          />
          {error && (
            <p style={{ fontSize: "0.82rem", color: "#dc2626", margin: "-0.4rem 0 0", textAlign: "left" }}>
              Incorrect password
            </p>
          )}
          <button
            type="submit"
            style={{
              background: "var(--pink)",
              color: "white",
              border: "none",
              borderRadius: 10,
              padding: "0.9rem 1.5rem",
              fontSize: "0.95rem",
              fontWeight: 700,
              cursor: "pointer",
              fontFamily: "'DM Sans', sans-serif",
              letterSpacing: "0.02em",
              transition: "opacity 0.15s",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.88")}
            onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
          >
            Sign In
          </button>
        </form>
      </div>
    </div>
  );
}

export default function AdminPage() {
  const [authed, setAuthed] = useState<boolean | null>(null);
  const [tab, setTab] = useState<Tab>("inquiries");
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [players, setPlayers] = useState<PlayerListing[]>([]);
  const [venues, setVenues] = useState<VenueListing[]>([]);
  const [events, setEvents] = useState<EventListing[]>([]);
  const [ads, setAds] = useState<AdListing[]>([]);
  const [ambassadors, setAmbassadors] = useState<Ambassador[]>([]);
  const [loading, setLoading] = useState(true);
  const [pendingCount, setPendingCount] = useState(0);
  const [newInquiryCount, setNewInquiryCount] = useState(0);
  const [newAmbassadorCount, setNewAmbassadorCount] = useState(0);

  // Probe the session once on mount. The data route returns 401 without a valid cookie.
  useEffect(() => {
    fetch("/api/admin/data?tab=inquiries", { cache: "no-store" }).then((res) => setAuthed(res.ok));
  }, []);

  useEffect(() => {
    if (authed) loadData();
  }, [tab, authed]);

  async function loadData() {
    setLoading(true);
    const res = await fetch(`/api/admin/data?tab=${tab}`, { cache: "no-store" });
    if (res.status === 401) {
      setAuthed(false);
      setLoading(false);
      return;
    }
    const json = await res.json().catch(() => null);
    const items = (json?.items ?? []) as unknown[];
    if (tab === "inquiries") {
      setInquiries(items as Inquiry[]);
    } else if (tab === "players") {
      const order: Record<string, number> = { pending_review: 0, flagged: 1, published: 2 };
      setPlayers((items as PlayerListing[]).slice().sort((a, b) => (order[a.status] ?? 3) - (order[b.status] ?? 3)));
    } else if (tab === "venues") {
      setVenues(items as VenueListing[]);
    } else if (tab === "events") {
      setEvents(items as EventListing[]);
    } else if (tab === "ads") {
      setAds(items as AdListing[]);
    } else if (tab === "ambassadors") {
      const order: Record<string, number> = { new: 0, contacted: 1, approved: 2, declined: 3 };
      setAmbassadors((items as Ambassador[]).slice().sort((a, b) => (order[a.status] ?? 4) - (order[b.status] ?? 4)));
    }
    if (json?.counts) {
      setPendingCount(json.counts.pending ?? 0);
      setNewInquiryCount(json.counts.newInquiries ?? 0);
      setNewAmbassadorCount(json.counts.newAmbassadors ?? 0);
    }
    setLoading(false);
  }

  async function updateStatus(table: string, id: string, status: string) {
    await fetch("/api/admin/update", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ table, id, status }),
    });
    loadData();
  }

  async function updateInquiryStatus(id: string, status: string) {
    await updateStatus("inquiries", id, status);
  }

  function formatDate(d: string) {
    return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  }

  function StatusBadge({ status }: { status: string }) {
    const colors: Record<string, { bg: string; color: string }> = {
      published: { bg: "rgba(46,201,92,0.1)", color: "#1a9648" },
      new: { bg: "rgba(233,30,140,0.1)", color: "var(--pink)" },
      read: { bg: "rgba(26,31,94,0.08)", color: "var(--navy)" },
      replied: { bg: "rgba(46,201,92,0.1)", color: "#1a9648" },
      flagged: { bg: "rgba(245,200,66,0.15)", color: "#a07800" },
      rejected: { bg: "rgba(220,38,38,0.1)", color: "#dc2626" },
      pending_review: { bg: "rgba(245,200,66,0.15)", color: "#a07800" },
      approved: { bg: "rgba(46,201,92,0.1)", color: "#1a9648" },
      contacted: { bg: "rgba(26,31,94,0.08)", color: "var(--navy)" },
      declined: { bg: "rgba(220,38,38,0.1)", color: "#dc2626" },
    };
    const c = colors[status] || colors.new;
    return (
      <span style={{ display: "inline-block", fontSize: "0.7rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", padding: "0.2rem 0.7rem", borderRadius: 50, background: c.bg, color: c.color }}>
        {status}
      </span>
    );
  }

  if (authed === null) return null;
  if (!authed) return <LoginGate onAuth={() => setAuthed(true)} />;

  const bannerParts: string[] = [];
  if (pendingCount > 0) bannerParts.push(`${pendingCount} pending listing${pendingCount !== 1 ? "s" : ""}`);
  if (newInquiryCount > 0) bannerParts.push(`${newInquiryCount} new ${newInquiryCount !== 1 ? "inquiries" : "inquiry"}`);
  if (newAmbassadorCount > 0) bannerParts.push(`${newAmbassadorCount} new ambassador application${newAmbassadorCount !== 1 ? "s" : ""}`);
  const showBanner = bannerParts.length > 0;

  return (
    <div style={{ maxWidth: 1200, margin: "0 auto", padding: "2rem" }}>
      {showBanner && (
        <div style={{
          background: "linear-gradient(135deg, rgba(233,30,140,0.08), rgba(245,200,66,0.12))",
          border: "1px solid rgba(233,30,140,0.25)",
          borderRadius: 12,
          padding: "1rem 1.5rem",
          marginBottom: "1.5rem",
          display: "flex",
          alignItems: "center",
          gap: "0.6rem",
          fontSize: "0.9rem",
          fontWeight: 600,
          color: "var(--navy)",
        }}>
          <span style={{ fontSize: "1.1rem" }}>⚡</span>
          You have {bannerParts.join(", ")} to review.
        </div>
      )}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "2rem" }}>
        <h1 style={{ fontFamily: "var(--font-playfair), 'Playfair Display', serif", fontSize: "1.8rem", color: "var(--navy)" }}>Admin Dashboard</h1>
        <div style={{ display: "flex", gap: "0.75rem" }}>
          <button onClick={loadData} style={{ background: "var(--bg)", border: "1px solid var(--border)", borderRadius: 6, padding: "0.5rem 1rem", fontSize: "0.82rem", fontWeight: 600, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>
            Refresh
          </button>
          <button
            onClick={async () => { await fetch("/api/admin/logout", { method: "POST" }); setAuthed(false); }}
            style={{ background: "transparent", border: "1px solid var(--border)", borderRadius: 6, padding: "0.5rem 1rem", fontSize: "0.82rem", fontWeight: 600, cursor: "pointer", fontFamily: "'DM Sans', sans-serif", color: "var(--muted)" }}
          >
            Sign Out
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 0, borderBottom: "2px solid var(--border)", marginBottom: "2rem" }}>
        {([
          { id: "inquiries" as Tab, label: "Inquiries", icon: "📩" },
          { id: "players" as Tab, label: "Players", icon: "👥" },
          { id: "venues" as Tab, label: "Venues", icon: "🏛" },
          { id: "events" as Tab, label: "Events", icon: "🎫" },
          { id: "ads" as Tab, label: "Ads", icon: "📢" },
          { id: "ambassadors" as Tab, label: "Ambassadors", icon: "🤝" },
        ]).map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            style={{ padding: "0.8rem 1.5rem", fontSize: "0.9rem", fontWeight: 600, cursor: "pointer", background: "transparent", border: "none", borderBottom: "2px solid", borderBottomColor: tab === t.id ? "var(--pink)" : "transparent", marginBottom: -2, color: tab === t.id ? "var(--navy)" : "var(--muted)", fontFamily: "'DM Sans', sans-serif" }}
          >
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {loading && <p style={{ color: "var(--muted)", textAlign: "center", padding: "3rem" }}>Loading...</p>}

      {/* INQUIRIES TAB */}
      {!loading && tab === "inquiries" && (
        <div>
          {inquiries.length === 0 ? (
            <div style={{ background: "var(--bg)", border: "1px solid var(--border)", borderRadius: 16, padding: "3rem", textAlign: "center" }}>
              <p style={{ fontSize: "1.5rem", marginBottom: "0.5rem" }}>📩</p>
              <p style={{ color: "var(--muted)" }}>No inquiries yet. They&rsquo;ll show up here when someone submits the contact or advertise form.</p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              {inquiries.map((inq) => (
                <div key={inq.id} style={{ background: "white", border: "1px solid var(--border)", borderRadius: 12, padding: "1.5rem" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.8rem" }}>
                    <div>
                      <strong style={{ color: "var(--navy)", fontSize: "1rem" }}>{inq.name}</strong>
                      <span style={{ color: "var(--muted)", fontSize: "0.82rem", marginLeft: "0.8rem" }}>{inq.email}</span>
                      {inq.company && <span style={{ color: "var(--muted)", fontSize: "0.82rem", marginLeft: "0.8rem" }}>({inq.company})</span>}
                      {(inq.inquiry_type === "advertising" || inq.inquiry_type === "get_listed") && (
                        <span style={{ marginLeft: "0.8rem", fontSize: "0.78rem", fontWeight: 700, color: "#a07800", background: "rgba(245,200,66,0.15)", borderRadius: 4, padding: "0.15rem 0.6rem" }}>
                          Action needed: review and create listing
                        </span>
                      )}
                    </div>
                    <StatusBadge status={inq.status} />
                  </div>
                  {inq.interest && <p style={{ fontSize: "0.85rem", color: "var(--navy)", fontWeight: 600, marginBottom: "0.4rem" }}>Interest: {inq.interest}</p>}
                  {inq.message && <p style={{ fontSize: "0.88rem", color: "var(--muted)", lineHeight: 1.6, marginBottom: "0.8rem" }}>{inq.message}</p>}
                  <div style={{ display: "flex", alignItems: "center", gap: "0.8rem", fontSize: "0.78rem" }}>
                    <span style={{ color: "var(--muted)" }}>{formatDate(inq.created_at)}</span>
                    <button onClick={() => updateInquiryStatus(inq.id, "read")} style={{ background: "var(--bg)", border: "1px solid var(--border)", borderRadius: 4, padding: "0.3rem 0.8rem", fontSize: "0.75rem", cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>Mark Read</button>
                    <button onClick={() => updateInquiryStatus(inq.id, "replied")} style={{ background: "var(--green)", color: "white", border: "none", borderRadius: 4, padding: "0.3rem 0.8rem", fontSize: "0.75rem", cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>Replied</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* PLAYERS TAB */}
      {!loading && tab === "players" && (
        <div>
          {players.length === 0 ? (
            <div style={{ background: "var(--bg)", border: "1px solid var(--border)", borderRadius: 16, padding: "3rem", textAlign: "center" }}>
              <p style={{ fontSize: "1.5rem", marginBottom: "0.5rem" }}>👥</p>
              <p style={{ color: "var(--muted)" }}>No player listings yet. They&rsquo;ll appear here when players create free listings.</p>
            </div>
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  <th style={{ textAlign: "left", padding: "0.8rem 1rem", background: "var(--bg)", fontSize: "0.78rem", fontWeight: 700, color: "var(--navy)", textTransform: "uppercase", letterSpacing: "0.1em" }}>Player</th>
                  <th style={{ textAlign: "left", padding: "0.8rem 1rem", background: "var(--bg)", fontSize: "0.78rem", fontWeight: 700, color: "var(--navy)", textTransform: "uppercase", letterSpacing: "0.1em" }}>Location</th>
                  <th style={{ textAlign: "left", padding: "0.8rem 1rem", background: "var(--bg)", fontSize: "0.78rem", fontWeight: 700, color: "var(--navy)", textTransform: "uppercase", letterSpacing: "0.1em" }}>Level</th>
                  <th style={{ textAlign: "left", padding: "0.8rem 1rem", background: "var(--bg)", fontSize: "0.78rem", fontWeight: 700, color: "var(--navy)", textTransform: "uppercase", letterSpacing: "0.1em" }}>Status</th>
                  <th style={{ textAlign: "left", padding: "0.8rem 1rem", background: "var(--bg)", fontSize: "0.78rem", fontWeight: 700, color: "var(--navy)", textTransform: "uppercase", letterSpacing: "0.1em" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {players.map((p) => (
                  <tr key={p.id} style={{ borderBottom: "1px solid var(--border)" }}>
                    <td style={{ padding: "0.8rem 1rem", fontSize: "0.9rem", fontWeight: 600, color: "var(--navy)" }}>{p.name}</td>
                    <td style={{ padding: "0.8rem 1rem", fontSize: "0.85rem", color: "var(--muted)" }}>{p.city}, {p.state}</td>
                    <td style={{ padding: "0.8rem 1rem", fontSize: "0.85rem", color: "var(--muted)" }}>{p.skill_level}</td>
                    <td style={{ padding: "0.8rem 1rem" }}><StatusBadge status={p.status} /></td>
                    <td style={{ padding: "0.8rem 1rem", display: "flex", gap: "0.4rem" }}>
                      {p.status === "published" && (
                        <button onClick={() => updateStatus("player_listings", p.id, "flagged")} style={{ background: "#fef3c7", border: "1px solid #f5c842", borderRadius: 4, padding: "0.3rem 0.8rem", fontSize: "0.72rem", cursor: "pointer", fontWeight: 600, fontFamily: "'DM Sans', sans-serif" }}>Flag</button>
                      )}
                      {(p.status === "pending_review" || p.status === "flagged") && (
                        <>
                          <button onClick={() => updateStatus("player_listings", p.id, "published")} style={{ background: "var(--green)", color: "white", border: "none", borderRadius: 4, padding: "0.3rem 0.8rem", fontSize: "0.72rem", cursor: "pointer", fontWeight: 600, fontFamily: "'DM Sans', sans-serif" }}>Approve</button>
                          <button onClick={() => updateStatus("player_listings", p.id, "rejected")} style={{ background: "#fee2e2", border: "1px solid #fca5a5", borderRadius: 4, padding: "0.3rem 0.8rem", fontSize: "0.72rem", cursor: "pointer", fontWeight: 600, fontFamily: "'DM Sans', sans-serif", color: "#dc2626" }}>Reject</button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* VENUES TAB */}
      {!loading && tab === "venues" && (
        <div>
          {venues.length === 0 ? (
            <div style={{ background: "var(--bg)", border: "1px solid var(--border)", borderRadius: 16, padding: "3rem", textAlign: "center" }}>
              <p style={{ fontSize: "1.5rem", marginBottom: "0.5rem" }}>🏛</p>
              <p style={{ color: "var(--muted)" }}>No venue listings yet. They&rsquo;ll appear here after payment is received.</p>
            </div>
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  <th style={{ textAlign: "left", padding: "0.8rem 1rem", background: "var(--bg)", fontSize: "0.78rem", fontWeight: 700, color: "var(--navy)", textTransform: "uppercase", letterSpacing: "0.1em" }}>Venue</th>
                  <th style={{ textAlign: "left", padding: "0.8rem 1rem", background: "var(--bg)", fontSize: "0.78rem", fontWeight: 700, color: "var(--navy)", textTransform: "uppercase", letterSpacing: "0.1em" }}>Location</th>
                  <th style={{ textAlign: "left", padding: "0.8rem 1rem", background: "var(--bg)", fontSize: "0.78rem", fontWeight: 700, color: "var(--navy)", textTransform: "uppercase", letterSpacing: "0.1em" }}>Tier</th>
                  <th style={{ textAlign: "left", padding: "0.8rem 1rem", background: "var(--bg)", fontSize: "0.78rem", fontWeight: 700, color: "var(--navy)", textTransform: "uppercase", letterSpacing: "0.1em" }}>Status</th>
                  <th style={{ textAlign: "left", padding: "0.8rem 1rem", background: "var(--bg)", fontSize: "0.78rem", fontWeight: 700, color: "var(--navy)", textTransform: "uppercase", letterSpacing: "0.1em" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {venues.map((v) => (
                  <tr key={v.id} style={{ borderBottom: "1px solid var(--border)" }}>
                    <td style={{ padding: "0.8rem 1rem", fontSize: "0.9rem", fontWeight: 600, color: "var(--navy)" }}>{v.business_name}</td>
                    <td style={{ padding: "0.8rem 1rem", fontSize: "0.85rem", color: "var(--muted)" }}>{v.city}, {v.state}</td>
                    <td style={{ padding: "0.8rem 1rem", fontSize: "0.85rem", color: "var(--muted)" }}>{v.tier}</td>
                    <td style={{ padding: "0.8rem 1rem" }}><StatusBadge status={v.status} /></td>
                    <td style={{ padding: "0.8rem 1rem", display: "flex", gap: "0.4rem" }}>
                      {v.status === "published" && <button onClick={() => updateStatus("venue_listings", v.id, "flagged")} style={{ background: "#fef3c7", border: "1px solid #f5c842", borderRadius: 4, padding: "0.3rem 0.8rem", fontSize: "0.72rem", cursor: "pointer", fontWeight: 600, fontFamily: "'DM Sans', sans-serif" }}>Flag</button>}
                      {v.status === "flagged" && <button onClick={() => updateStatus("venue_listings", v.id, "published")} style={{ background: "var(--green)", color: "white", border: "none", borderRadius: 4, padding: "0.3rem 0.8rem", fontSize: "0.72rem", cursor: "pointer", fontWeight: 600, fontFamily: "'DM Sans', sans-serif" }}>Publish</button>}
                      <button onClick={() => updateStatus("venue_listings", v.id, "rejected")} style={{ background: "#fee2e2", border: "1px solid #fca5a5", borderRadius: 4, padding: "0.3rem 0.8rem", fontSize: "0.72rem", cursor: "pointer", fontWeight: 600, fontFamily: "'DM Sans', sans-serif", color: "#dc2626" }}>Reject</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* EVENTS TAB */}
      {!loading && tab === "events" && (
        <div>
          {events.length === 0 ? (
            <div style={{ background: "var(--bg)", border: "1px solid var(--border)", borderRadius: 16, padding: "3rem", textAlign: "center" }}>
              <p style={{ fontSize: "1.5rem", marginBottom: "0.5rem" }}>🎫</p>
              <p style={{ color: "var(--muted)" }}>No event listings yet. They&rsquo;ll appear here after payment is received.</p>
            </div>
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  <th style={{ textAlign: "left", padding: "0.8rem 1rem", background: "var(--bg)", fontSize: "0.78rem", fontWeight: 700, color: "var(--navy)", textTransform: "uppercase", letterSpacing: "0.1em" }}>Event</th>
                  <th style={{ textAlign: "left", padding: "0.8rem 1rem", background: "var(--bg)", fontSize: "0.78rem", fontWeight: 700, color: "var(--navy)", textTransform: "uppercase", letterSpacing: "0.1em" }}>Location</th>
                  <th style={{ textAlign: "left", padding: "0.8rem 1rem", background: "var(--bg)", fontSize: "0.78rem", fontWeight: 700, color: "var(--navy)", textTransform: "uppercase", letterSpacing: "0.1em" }}>Date</th>
                  <th style={{ textAlign: "left", padding: "0.8rem 1rem", background: "var(--bg)", fontSize: "0.78rem", fontWeight: 700, color: "var(--navy)", textTransform: "uppercase", letterSpacing: "0.1em" }}>Status</th>
                  <th style={{ textAlign: "left", padding: "0.8rem 1rem", background: "var(--bg)", fontSize: "0.78rem", fontWeight: 700, color: "var(--navy)", textTransform: "uppercase", letterSpacing: "0.1em" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {events.map((ev) => (
                  <tr key={ev.id} style={{ borderBottom: "1px solid var(--border)" }}>
                    <td style={{ padding: "0.8rem 1rem", fontSize: "0.9rem", fontWeight: 600, color: "var(--navy)" }}>{ev.event_name}</td>
                    <td style={{ padding: "0.8rem 1rem", fontSize: "0.85rem", color: "var(--muted)" }}>{ev.city}, {ev.state}</td>
                    <td style={{ padding: "0.8rem 1rem", fontSize: "0.85rem", color: "var(--muted)" }}>{ev.event_date ? formatDate(ev.event_date) : "-"}</td>
                    <td style={{ padding: "0.8rem 1rem" }}><StatusBadge status={ev.status} /></td>
                    <td style={{ padding: "0.8rem 1rem", display: "flex", gap: "0.4rem" }}>
                      {ev.status === "published" && <button onClick={() => updateStatus("event_listings", ev.id, "flagged")} style={{ background: "#fef3c7", border: "1px solid #f5c842", borderRadius: 4, padding: "0.3rem 0.8rem", fontSize: "0.72rem", cursor: "pointer", fontWeight: 600, fontFamily: "'DM Sans', sans-serif" }}>Flag</button>}
                      {ev.status === "flagged" && <button onClick={() => updateStatus("event_listings", ev.id, "published")} style={{ background: "var(--green)", color: "white", border: "none", borderRadius: 4, padding: "0.3rem 0.8rem", fontSize: "0.72rem", cursor: "pointer", fontWeight: 600, fontFamily: "'DM Sans', sans-serif" }}>Publish</button>}
                      <button onClick={() => updateStatus("event_listings", ev.id, "rejected")} style={{ background: "#fee2e2", border: "1px solid #fca5a5", borderRadius: 4, padding: "0.3rem 0.8rem", fontSize: "0.72rem", cursor: "pointer", fontWeight: 600, fontFamily: "'DM Sans', sans-serif", color: "#dc2626" }}>Reject</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* ADS TAB */}
      {!loading && tab === "ads" && (
        <div>
          {ads.length === 0 ? (
            <div style={{ background: "var(--bg)", border: "1px solid var(--border)", borderRadius: 16, padding: "3rem", textAlign: "center" }}>
              <p style={{ fontSize: "1.5rem", marginBottom: "0.5rem" }}>📢</p>
              <p style={{ color: "var(--muted)" }}>No ad listings yet. They&rsquo;ll appear here after payment is received.</p>
            </div>
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  <th style={{ textAlign: "left", padding: "0.8rem 1rem", background: "var(--bg)", fontSize: "0.78rem", fontWeight: 700, color: "var(--navy)", textTransform: "uppercase", letterSpacing: "0.1em" }}>Company</th>
                  <th style={{ textAlign: "left", padding: "0.8rem 1rem", background: "var(--bg)", fontSize: "0.78rem", fontWeight: 700, color: "var(--navy)", textTransform: "uppercase", letterSpacing: "0.1em" }}>Placement</th>
                  <th style={{ textAlign: "left", padding: "0.8rem 1rem", background: "var(--bg)", fontSize: "0.78rem", fontWeight: 700, color: "var(--navy)", textTransform: "uppercase", letterSpacing: "0.1em" }}>Tier</th>
                  <th style={{ textAlign: "left", padding: "0.8rem 1rem", background: "var(--bg)", fontSize: "0.78rem", fontWeight: 700, color: "var(--navy)", textTransform: "uppercase", letterSpacing: "0.1em" }}>Status</th>
                  <th style={{ textAlign: "left", padding: "0.8rem 1rem", background: "var(--bg)", fontSize: "0.78rem", fontWeight: 700, color: "var(--navy)", textTransform: "uppercase", letterSpacing: "0.1em" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {ads.map((ad) => (
                  <tr key={ad.id} style={{ borderBottom: "1px solid var(--border)" }}>
                    <td style={{ padding: "0.8rem 1rem", fontSize: "0.9rem", fontWeight: 600, color: "var(--navy)" }}>{ad.company_name}</td>
                    <td style={{ padding: "0.8rem 1rem", fontSize: "0.85rem", color: "var(--muted)" }}>{ad.placement}</td>
                    <td style={{ padding: "0.8rem 1rem", fontSize: "0.85rem", color: "var(--muted)" }}>{ad.tier}</td>
                    <td style={{ padding: "0.8rem 1rem" }}><StatusBadge status={ad.status} /></td>
                    <td style={{ padding: "0.8rem 1rem", display: "flex", gap: "0.4rem" }}>
                      {ad.status === "published" && <button onClick={() => updateStatus("ad_listings", ad.id, "flagged")} style={{ background: "#fef3c7", border: "1px solid #f5c842", borderRadius: 4, padding: "0.3rem 0.8rem", fontSize: "0.72rem", cursor: "pointer", fontWeight: 600, fontFamily: "'DM Sans', sans-serif" }}>Flag</button>}
                      {ad.status === "flagged" && <button onClick={() => updateStatus("ad_listings", ad.id, "published")} style={{ background: "var(--green)", color: "white", border: "none", borderRadius: 4, padding: "0.3rem 0.8rem", fontSize: "0.72rem", cursor: "pointer", fontWeight: 600, fontFamily: "'DM Sans', sans-serif" }}>Publish</button>}
                      <button onClick={() => updateStatus("ad_listings", ad.id, "rejected")} style={{ background: "#fee2e2", border: "1px solid #fca5a5", borderRadius: 4, padding: "0.3rem 0.8rem", fontSize: "0.72rem", cursor: "pointer", fontWeight: 600, fontFamily: "'DM Sans', sans-serif", color: "#dc2626" }}>Reject</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* AMBASSADORS TAB */}
      {!loading && tab === "ambassadors" && (
        <div>
          {ambassadors.length === 0 ? (
            <div style={{ background: "var(--bg)", border: "1px solid var(--border)", borderRadius: 16, padding: "3rem", textAlign: "center" }}>
              <p style={{ fontSize: "1.5rem", marginBottom: "0.5rem" }}>🤝</p>
              <p style={{ color: "var(--muted)" }}>No ambassador applications yet. They&rsquo;ll show up here when someone applies at /ambassadors.</p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              {ambassadors.map((a) => (
                <div key={a.id} style={{ background: "white", border: "1px solid var(--border)", borderRadius: 12, padding: "1.5rem" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.6rem" }}>
                    <div>
                      <strong style={{ color: "var(--navy)", fontSize: "1rem" }}>{a.name}</strong>
                      {a.role && <span style={{ marginLeft: "0.8rem", fontSize: "0.78rem", fontWeight: 700, color: "var(--navy)", background: "var(--bg)", borderRadius: 4, padding: "0.15rem 0.6rem" }}>{a.role}</span>}
                    </div>
                    <StatusBadge status={a.status} />
                  </div>
                  <p style={{ fontSize: "0.85rem", color: "var(--muted)", margin: "0 0 0.5rem" }}>
                    {a.email}{a.phone ? ` · ${a.phone}` : ""}{(a.city || a.state) ? ` · ${[a.city, a.state].filter(Boolean).join(", ")}` : ""}{a.reach ? ` · reaches ${a.reach}` : ""}
                  </p>
                  {a.why && <p style={{ fontSize: "0.9rem", color: "var(--navy)", lineHeight: 1.6, marginBottom: "0.8rem", whiteSpace: "pre-wrap" }}>{a.why}</p>}
                  <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", fontSize: "0.78rem", flexWrap: "wrap" }}>
                    <span style={{ color: "var(--muted)" }}>{formatDate(a.created_at)}</span>
                    <a href={`mailto:${a.email}`} style={{ background: "var(--bg)", border: "1px solid var(--border)", borderRadius: 4, padding: "0.3rem 0.8rem", fontSize: "0.75rem", cursor: "pointer", fontFamily: "'DM Sans', sans-serif", color: "var(--navy)", textDecoration: "none" }}>Email</a>
                    <button onClick={() => updateStatus("ambassadors", a.id, "approved")} style={{ background: "var(--green)", color: "white", border: "none", borderRadius: 4, padding: "0.3rem 0.8rem", fontSize: "0.75rem", cursor: "pointer", fontWeight: 600, fontFamily: "'DM Sans', sans-serif" }}>Approve</button>
                    <button onClick={() => updateStatus("ambassadors", a.id, "contacted")} style={{ background: "var(--bg)", border: "1px solid var(--border)", borderRadius: 4, padding: "0.3rem 0.8rem", fontSize: "0.75rem", cursor: "pointer", fontWeight: 600, fontFamily: "'DM Sans', sans-serif" }}>Contacted</button>
                    <button onClick={() => updateStatus("ambassadors", a.id, "declined")} style={{ background: "#fee2e2", border: "1px solid #fca5a5", borderRadius: 4, padding: "0.3rem 0.8rem", fontSize: "0.75rem", cursor: "pointer", fontWeight: 600, fontFamily: "'DM Sans', sans-serif", color: "#dc2626" }}>Decline</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
