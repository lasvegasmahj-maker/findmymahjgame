"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

type Tab = "inquiries" | "players" | "venues" | "events" | "ads";

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

export default function AdminPage() {
  const [tab, setTab] = useState<Tab>("inquiries");
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [players, setPlayers] = useState<PlayerListing[]>([]);
  const [venues, setVenues] = useState<VenueListing[]>([]);
  const [events, setEvents] = useState<EventListing[]>([]);
  const [ads, setAds] = useState<AdListing[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [tab]);

  async function loadData() {
    setLoading(true);
    if (tab === "inquiries") {
      const { data } = await supabase.from("inquiries").select("*").order("created_at", { ascending: false });
      setInquiries((data as Inquiry[]) || []);
    } else if (tab === "players") {
      const { data } = await supabase.from("player_listings").select("*").order("created_at", { ascending: false });
      setPlayers((data as PlayerListing[]) || []);
    } else if (tab === "venues") {
      const { data } = await supabase.from("venue_listings").select("*").order("created_at", { ascending: false });
      setVenues((data as VenueListing[]) || []);
    } else if (tab === "events") {
      const { data } = await supabase.from("event_listings").select("*").order("created_at", { ascending: false });
      setEvents((data as EventListing[]) || []);
    } else if (tab === "ads") {
      const { data } = await supabase.from("ad_listings").select("*").order("created_at", { ascending: false });
      setAds((data as AdListing[]) || []);
    }
    setLoading(false);
  }

  async function updateStatus(table: string, id: string, status: string) {
    await supabase.from(table).update({ status, reviewed_at: new Date().toISOString() }).eq("id", id);
    loadData();
  }

  async function updateInquiryStatus(id: string, status: string) {
    await supabase.from("inquiries").update({ status }).eq("id", id);
    loadData();
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
    };
    const c = colors[status] || colors.new;
    return (
      <span style={{ display: "inline-block", fontSize: "0.7rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", padding: "0.2rem 0.7rem", borderRadius: 50, background: c.bg, color: c.color }}>
        {status}
      </span>
    );
  }

  return (
    <div style={{ maxWidth: 1200, margin: "0 auto", padding: "2rem" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "2rem" }}>
        <h1 style={{ fontFamily: "var(--font-playfair), 'Playfair Display', serif", fontSize: "1.8rem", color: "var(--navy)" }}>Admin Dashboard</h1>
        <button onClick={loadData} style={{ background: "var(--bg)", border: "1px solid var(--border)", borderRadius: 6, padding: "0.5rem 1rem", fontSize: "0.82rem", fontWeight: 600, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>
          Refresh
        </button>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 0, borderBottom: "2px solid var(--border)", marginBottom: "2rem" }}>
        {([
          { id: "inquiries" as Tab, label: "Inquiries", icon: "📩" },
          { id: "players" as Tab, label: "Players", icon: "👥" },
          { id: "venues" as Tab, label: "Venues", icon: "🏛" },
          { id: "events" as Tab, label: "Events", icon: "🎫" },
          { id: "ads" as Tab, label: "Ads", icon: "📢" },
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
                    <td style={{ padding: "0.8rem 1rem" }}>
                      {p.status === "published" ? (
                        <button onClick={() => updateStatus("player_listings", p.id, "flagged")} style={{ background: "#fef3c7", border: "1px solid #f5c842", borderRadius: 4, padding: "0.3rem 0.8rem", fontSize: "0.72rem", cursor: "pointer", fontWeight: 600, fontFamily: "'DM Sans', sans-serif" }}>Flag</button>
                      ) : (
                        <button onClick={() => updateStatus("player_listings", p.id, "published")} style={{ background: "var(--green)", color: "white", border: "none", borderRadius: 4, padding: "0.3rem 0.8rem", fontSize: "0.72rem", cursor: "pointer", fontWeight: 600, fontFamily: "'DM Sans', sans-serif" }}>Publish</button>
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
                    <td style={{ padding: "0.8rem 1rem", fontSize: "0.85rem", color: "var(--muted)" }}>{ev.event_date ? formatDate(ev.event_date) : "—"}</td>
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
    </div>
  );
}
