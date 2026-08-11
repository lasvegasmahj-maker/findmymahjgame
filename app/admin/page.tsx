"use client";

import { useState, useEffect } from "react";
import { safeHttpUrl } from "@/lib/sanitize";
import { parseSchedule } from "@/lib/schedule";
import { sourceHost, byReviewOrder } from "@/lib/review-queue";

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
  website: string | null;
  description: string | null;
  source_url: string | null;
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
  registration_url: string | null;
  description: string | null;
  source_url: string | null;
  day_time: string | null;
  frequency: string | null;
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

function ParsedScheduleHint({ ev }: { ev: EventListing }) {
  const p = parseSchedule({
    dayTime: ev.day_time,
    frequency: ev.frequency,
    description: ev.description,
    eventName: ev.event_name,
    eventDate: ev.event_date,
  });
  if (p.confidence === "low" && p.days.length === 0 && !p.startTime) return null;
  const tone =
    p.confidence === "high" ? { bg: "rgba(45,160,90,0.13)", fg: "#1d6b3d" }
    : p.confidence === "medium" ? { bg: "rgba(245,200,66,0.18)", fg: "#a07800" }
    : { bg: "rgba(220,38,38,0.10)", fg: "#b3261e" };
  const days = p.days.length ? p.days.map((d) => d.slice(0, 3)).join(", ") : "no day";
  const time = p.startTime ? (p.endTime ? `${p.startTime}-${p.endTime}` : p.startTime) : "no time";
  return (
    <div style={{ fontSize: "0.72rem", marginTop: "0.25rem", display: "flex", gap: "0.4rem", alignItems: "center", flexWrap: "wrap" }}>
      <span style={{ background: tone.bg, color: tone.fg, borderRadius: 4, padding: "0.1rem 0.4rem", fontWeight: 700 }}>
        {p.confidence}
      </span>
      <span style={{ color: "var(--muted)" }}>
        {days} · {time}{p.frequency ? ` · ${p.frequency}` : ""}
      </span>
      {p.ambiguities.length > 0 && (
        <span style={{ color: "#b3261e" }}>{p.ambiguities[0]}</span>
      )}
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
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [sourceFilter, setSourceFilter] = useState("all");
  const [pendingCount, setPendingCount] = useState(0);
  const [newInquiryCount, setNewInquiryCount] = useState(0);
  const [newAmbassadorCount, setNewAmbassadorCount] = useState(0);
  const [pendingEditCount, setPendingEditCount] = useState(0);
  const [focusTasks, setFocusTasks] = useState<{ id: string; task: string; priority: string; due_date: string | null; status: string; waiting_on: string | null }[]>([]);

  useEffect(() => {
    if (!authed) return;
    fetch("/api/admin/edits", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : { items: [] }))
      .then((j) => setPendingEditCount(((j.items || []) as { status: string }[]).filter((e) => e.status === "pending").length))
      .catch(() => {});
  }, [authed]);
  const [matchMsg, setMatchMsg] = useState<{ text: string; ok: boolean } | null>(null);

  // Probe the session once on mount. The data route returns 401 without a valid cookie.
  useEffect(() => {
    fetch("/api/admin/data?tab=inquiries", { cache: "no-store" }).then((res) => setAuthed(res.ok));
  }, []);

  // The match approve/skip confirm flow redirects back here with ?match=...;
  // surface the outcome so the founder sees their one-click decision landed.
  useEffect(() => {
    const m = new URLSearchParams(window.location.search).get("match");
    if (!m) return;
    const map: Record<string, { text: string; ok: boolean }> = {
      approved: { text: "Match approved. Each player was emailed a claim link.", ok: true },
      skipped: { text: "Match skipped. Those players are back in the pool.", ok: true },
      "already-decided": { text: "That match was already decided. No change made.", ok: true },
      "approved-but-emails-failed": { text: "Match approved, but the invite emails did not send. Players were put back in the pool. Try again.", ok: false },
      error: { text: "Something went wrong creating the table. Nothing was sent. Please try again.", ok: false },
    };
    setMatchMsg(map[m] || null);
    window.history.replaceState(null, "", window.location.pathname);
  }, []);

  useEffect(() => {
    if (authed) loadData();
  }, [tab, authed]);

  useEffect(() => {
    if (!authed) return;
    fetch("/api/admin/tasks", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : { items: [] }))
      .then((j) => {
        const today = new Date().toISOString().slice(0, 10);
        const items = (j.items || []) as { id: string; task: string; priority: string; due_date: string | null; status: string; waiting_on: string | null; snoozed_until: string | null }[];
        const snoozeExpired = (t: { status: string; snoozed_until: string | null }) => t.status === "snoozed" && (!t.snoozed_until || t.snoozed_until <= today);
        const open = items.filter((t) => ["open", "in_progress"].includes(t.status) || snoozeExpired(t));
        const ranked = [
          ...open.filter((t) => t.due_date && t.due_date <= today),
          ...open.filter((t) => (!t.due_date || t.due_date > today) && t.priority === "high"),
          ...open.filter((t) => (!t.due_date || t.due_date > today) && t.priority !== "high"),
        ];
        setFocusTasks(ranked.slice(0, 5));
      })
      .catch(() => {});
  }, [authed]);

  async function loadData() {
    // The spinner shows only on first load; refreshes keep the table rendered.
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
      setVenues(byReviewOrder(items as VenueListing[]));
    } else if (tab === "events") {
      setEvents(byReviewOrder(items as EventListing[]));
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
    setSelected(new Set());
    setLoading(false);
  }

  function toggleSelect(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }


  async function copyClaimLinks(table: string, id: string, label: string) {
    try {
      const res = await fetch(`/api/admin/claim-link?table=${table}&id=${id}`);
      const d = await res.json();
      if (!res.ok) { window.alert(d.error || "Could not create the link."); return; }
      window.prompt(`Claim link for ${label} (copy it into your outreach email).`, d.claim);
      window.prompt(`"Still running?" link for ${label} (for freshness check-in emails).`, d.stillRunning);
      window.prompt(`"Has ended" link for ${label} (for freshness check-in emails).`, d.ended);
    } catch {
      window.alert("Network error. Please try again.");
    }
  }

  async function bulkUpdate(table: string, ids: string[], status: string) {
    if (!ids.length) return;
    const verb = status === "published" ? "Approve" : "Reject";
    const note = status === "published" && ids.length > 10
      ? "\n\nBefore bulk publishing: run scripts/check-links.mjs so dead links are flagged out. Flagged rows are already excluded here."
      : "";
    if (!window.confirm(`${verb} ${ids.length} listing${ids.length === 1 ? "" : "s"}?${note}`)) return;
    for (let i = 0; i < ids.length; i += 500) {
      try {
        const res = await fetch("/api/admin/update", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ table, ids: ids.slice(i, i + 500), status }),
        });
        if (!res.ok) {
          const d = await res.json().catch(() => ({}));
          window.alert(`Bulk ${verb.toLowerCase()} failed after ${i} rows: ${d.error || res.status}. The rest were not changed.`);
          break;
        }
      } catch {
        window.alert(`Network error after ${i} rows. The rest were not changed; refresh and try again.`);
        break;
      }
    }
    loadData();
  }

  function sourceCounts(rows: { source_url: string | null; status: string }[]) {
    const m = new Map<string, number>();
    for (const r of rows) {
      if (r.status !== "pending_review") continue;
      const h = sourceHost(r.source_url) || "(no source)";
      m.set(h, (m.get(h) || 0) + 1);
    }
    return [...m.entries()].sort((a, b) => b[1] - a[1]);
  }

  function applySourceFilter<T extends { source_url: string | null }>(rows: T[]): T[] {
    if (sourceFilter === "all") return rows;
    return rows.filter((r) => (sourceHost(r.source_url) || "(no source)") === sourceFilter);
  }

  function renderSourcePicker(rows: { source_url: string | null; status: string }[]) {
    const counts = sourceCounts(rows);
    if (counts.length === 0) return null;
    return (
      <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", flexWrap: "wrap", marginBottom: "0.8rem" }}>
        <label htmlFor="source-filter" style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--navy)" }}>
          Review by source
        </label>
        <select
          id="source-filter"
          value={sourceFilter}
          onChange={(e) => { setSourceFilter(e.target.value); setSelected(new Set()); }}
          className="form-select"
          style={{ maxWidth: 420 }}
        >
          <option value="all">All sources ({counts.reduce((a, [, n]) => a + n, 0)} pending)</option>
          {counts.map(([h, n]) => (
            <option key={h} value={h}>{h} ({n} pending)</option>
          ))}
        </select>
        {sourceFilter !== "all" && (
          <>
            <a href={`https://${sourceFilter}`} target="_blank" rel="noopener noreferrer" style={{ fontSize: "0.8rem", fontWeight: 700, color: "var(--pink-text)" }}>
              Open source to verify
            </a>
            <span style={{ fontSize: "0.78rem", color: "var(--muted)" }}>
              Select the rows you trust, then approve. Blanket approval is off while a source is selected.
            </span>
          </>
        )}
      </div>
    );
  }

  function renderBulkBar(table: string, rows: { id: string; status: string }[]) {
    // Flagged rows are quarantined (dead links, link-check holds): they stay
    // individually approvable but never ride select-all or Approve All.
    const pending = rows.filter((r) => r.status === "pending_review");
    if (!pending.length) return null;
    const chosen = pending.filter((r) => selected.has(r.id)).map((r) => r.id);
    const allChosen = chosen.length === pending.length;
    const btn = (bg: string, color: string, border?: string): React.CSSProperties => ({
      background: bg, color, border: border || "none", borderRadius: 6, padding: "0.45rem 1rem",
      fontSize: "0.8rem", fontWeight: 700, cursor: "pointer", fontFamily: "'DM Sans', sans-serif",
    });
    return (
      <div style={{ display: "flex", alignItems: "center", gap: "0.8rem", flexWrap: "wrap", background: "var(--bg)", border: "1px solid var(--border)", borderRadius: 10, padding: "0.7rem 1rem", marginBottom: "1rem" }}>
        <label style={{ display: "flex", alignItems: "center", gap: "0.45rem", fontSize: "0.85rem", fontWeight: 600, color: "var(--navy)", cursor: "pointer" }}>
          <input
            type="checkbox"
            checked={allChosen}
            onChange={() => setSelected(allChosen ? new Set() : new Set(pending.map((r) => r.id)))}
            style={{ width: 18, height: 18 }}
          />
          Select all pending ({pending.length})
        </label>
        <button onClick={() => bulkUpdate(table, chosen, "published")} disabled={!chosen.length} style={{ ...btn("var(--green)", "white"), opacity: chosen.length ? 1 : 0.5 }}>
          Approve Selected ({chosen.length})
        </button>
        <button onClick={() => bulkUpdate(table, chosen, "rejected")} disabled={!chosen.length} style={{ ...btn("#fee2e2", "#dc2626", "1px solid #fca5a5"), opacity: chosen.length ? 1 : 0.5 }}>
          Reject Selected ({chosen.length})
        </button>
        {sourceFilter === "all" && (
          <button onClick={() => bulkUpdate(table, pending.map((r) => r.id), "published")} style={btn("var(--navy)", "white")}>
            Approve All Pending ({pending.length})
          </button>
        )}
      </div>
    );
  }

  function rowCheckbox(r: { id: string; status: string }, label: string) {
    if (r.status !== "pending_review") return <td style={{ padding: "0.8rem 0.6rem" }} />;
    return (
      <td style={{ padding: "0.8rem 0.6rem" }}>
        <input type="checkbox" aria-label={`Select ${label}`} checked={selected.has(r.id)} onChange={() => toggleSelect(r.id)} style={{ width: 18, height: 18 }} />
      </td>
    );
  }

  async function updateStatus(table: string, id: string, status: string) {
    try {
      const res = await fetch("/api/admin/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ table, id, status }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        window.alert(d.error || "Update failed. Please try again.");
      }
    } catch {
      window.alert("Network error. The change was not saved.");
    }
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
      new: { bg: "rgba(233,30,140,0.1)", color: "var(--pink-text)" },
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
    <div className="admin-shell" style={{ maxWidth: 1200, margin: "0 auto", padding: "2rem" }}>
      {matchMsg && (
        <div style={{
          background: matchMsg.ok ? "rgba(46,201,92,0.1)" : "#fee2e2",
          border: matchMsg.ok ? "1px solid rgba(46,201,92,0.4)" : "1px solid #fca5a5",
          borderRadius: 12,
          padding: "1rem 1.5rem",
          marginBottom: "1.5rem",
          fontSize: "0.92rem",
          fontWeight: 600,
          color: matchMsg.ok ? "#1a9648" : "#dc2626",
        }}>
          {matchMsg.text}
        </div>
      )}
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
      {focusTasks.length > 0 && (
        <div style={{ background: "#fff5fa", border: "1px solid rgba(233,30,140,0.25)", borderRadius: 12, padding: "0.9rem 1.2rem", marginBottom: "1.5rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
            <span style={{ fontSize: "0.8rem", fontWeight: 800, color: "var(--pink-text)", textTransform: "uppercase", letterSpacing: "0.08em" }}>Today&rsquo;s focus</span>
            <a href="/admin/tasks" style={{ fontSize: "0.8rem", fontWeight: 700, color: "var(--pink-text)" }}>All tasks &rarr;</a>
          </div>
          {focusTasks.map((t) => (
            <div key={t.id} style={{ fontSize: "0.9rem", color: "var(--navy)", padding: "0.25rem 0", fontWeight: t.priority === "high" ? 700 : 500 }}>
              {t.task}
              {t.status === "waiting" && t.waiting_on ? <span style={{ color: "var(--muted)", fontWeight: 400 }}> (waiting on {t.waiting_on})</span> : null}
              {t.due_date ? <span style={{ color: "var(--muted)", fontWeight: 400 }}> &middot; due {t.due_date}</span> : null}
            </div>
          ))}
        </div>
      )}

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "2rem" }}>
        <h1 style={{ fontFamily: "var(--font-playfair), 'Playfair Display', serif", fontSize: "1.8rem", color: "var(--navy)" }}>Admin Dashboard</h1>
        <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
          <a href="/admin/today" style={{ background: "var(--navy)", color: "white", borderRadius: 6, padding: "0.5rem 1rem", fontSize: "0.82rem", fontWeight: 700, textDecoration: "none", fontFamily: "'DM Sans', sans-serif" }}>Today</a>
          <a href="/admin/tasks" style={{ background: "var(--pink)", color: "white", borderRadius: 6, padding: "0.5rem 1rem", fontSize: "0.82rem", fontWeight: 700, textDecoration: "none", fontFamily: "'DM Sans', sans-serif" }}>Tasks</a>
          <a href="/admin/edits" style={{ background: "var(--bg)", border: "1px solid var(--border)", borderRadius: 6, padding: "0.5rem 1rem", fontSize: "0.82rem", fontWeight: 600, textDecoration: "none", color: "var(--navy)", fontFamily: "'DM Sans', sans-serif" }}>Edits</a>
          <a href="/admin/relationships" style={{ background: "var(--bg)", border: "1px solid var(--border)", borderRadius: 6, padding: "0.5rem 1rem", fontSize: "0.82rem", fontWeight: 600, textDecoration: "none", color: "var(--navy)", fontFamily: "'DM Sans', sans-serif" }}>Relationships</a>
          <a href="/admin/metrics" style={{ background: "var(--navy)", color: "white", borderRadius: 6, padding: "0.5rem 1rem", fontSize: "0.82rem", fontWeight: 700, textDecoration: "none", fontFamily: "'DM Sans', sans-serif" }}>North Star Metrics</a>
          <a href="/admin/heatmap" style={{ background: "var(--bg)", border: "1px solid var(--border)", borderRadius: 6, padding: "0.5rem 1rem", fontSize: "0.82rem", fontWeight: 600, textDecoration: "none", color: "var(--navy)", fontFamily: "'DM Sans', sans-serif" }}>Heat Map</a>
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
              <p style={{ color: "var(--muted)" }}>No inquiries yet. They&rsquo;ll show up here when someone submits the contact or advertise form.</p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              {inquiries.map((inq) => (
                <div key={inq.id} style={{ background: "white", border: "1px solid var(--border)", borderRadius: 12, padding: "1.5rem" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.8rem" }}>
                    <div>
                      <strong style={{ color: "var(--navy)", fontSize: "1rem" }}>{inq.name}</strong>
                      <a href={`mailto:${inq.email}`} style={{ color: "var(--pink-text)", fontSize: "0.82rem", marginLeft: "0.8rem", fontWeight: 600 }}>{inq.email}</a>
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
          {renderBulkBar("player_listings", players)}
          {players.length === 0 ? (
            <div style={{ background: "var(--bg)", border: "1px solid var(--border)", borderRadius: 16, padding: "3rem", textAlign: "center" }}>
              <p style={{ color: "var(--muted)" }}>No player listings yet. They&rsquo;ll appear here when players create free listings.</p>
            </div>
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  <th aria-label="Select" style={{ padding: "0.8rem 0.6rem", background: "var(--bg)" }} />
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
                    {rowCheckbox(p, p.name)}
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
          {renderSourcePicker(venues)}
          {renderBulkBar("venue_listings", applySourceFilter(venues))}
          {venues.length === 0 ? (
            <div style={{ background: "var(--bg)", border: "1px solid var(--border)", borderRadius: 16, padding: "3rem", textAlign: "center" }}>
              <p style={{ color: "var(--muted)" }}>No venue listings yet. They&rsquo;ll appear here after payment is received.</p>
            </div>
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  <th aria-label="Select" style={{ padding: "0.8rem 0.6rem", background: "var(--bg)" }} />
                  <th style={{ textAlign: "left", padding: "0.8rem 1rem", background: "var(--bg)", fontSize: "0.78rem", fontWeight: 700, color: "var(--navy)", textTransform: "uppercase", letterSpacing: "0.1em" }}>Venue</th>
                  <th style={{ textAlign: "left", padding: "0.8rem 1rem", background: "var(--bg)", fontSize: "0.78rem", fontWeight: 700, color: "var(--navy)", textTransform: "uppercase", letterSpacing: "0.1em" }}>Location</th>
                  <th style={{ textAlign: "left", padding: "0.8rem 1rem", background: "var(--bg)", fontSize: "0.78rem", fontWeight: 700, color: "var(--navy)", textTransform: "uppercase", letterSpacing: "0.1em" }}>Tier</th>
                  <th style={{ textAlign: "left", padding: "0.8rem 1rem", background: "var(--bg)", fontSize: "0.78rem", fontWeight: 700, color: "var(--navy)", textTransform: "uppercase", letterSpacing: "0.1em" }}>Status</th>
                  <th style={{ textAlign: "left", padding: "0.8rem 1rem", background: "var(--bg)", fontSize: "0.78rem", fontWeight: 700, color: "var(--navy)", textTransform: "uppercase", letterSpacing: "0.1em" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {applySourceFilter(venues).map((v) => (
                  <tr key={v.id} style={{ borderBottom: "1px solid var(--border)" }}>
                    {rowCheckbox(v, v.business_name)}
                    <td style={{ padding: "0.8rem 1rem", fontSize: "0.9rem", fontWeight: 600, color: "var(--navy)" }}>
                      {v.business_name}
                      <div style={{ fontSize: "0.75rem", fontWeight: 400, color: "var(--muted)", marginTop: "0.15rem" }}>
                        {safeHttpUrl(v.website) ? <a href={safeHttpUrl(v.website)} target="_blank" rel="noopener noreferrer" style={{ color: "var(--pink-text)" }}>{String(v.website).replace(/^https?:\/\//, "").slice(0, 40)}</a> : "no website"}
                        {v.description ? ` · ${String(v.description).slice(0, 80)}` : ""}
                      </div>
                      {sourceHost(v.source_url) && (
                        <div style={{ fontSize: "0.72rem", fontWeight: 400, color: "var(--muted)", marginTop: "0.2rem" }}>
                          source: <a href={safeHttpUrl(v.source_url) || undefined} target="_blank" rel="noopener noreferrer" style={{ color: "var(--pink-text)" }}>{sourceHost(v.source_url)}</a>
                        </div>
                      )}
                    </td>
                    <td style={{ padding: "0.8rem 1rem", fontSize: "0.85rem", color: "var(--muted)" }}>{v.city}, {v.state}</td>
                    <td style={{ padding: "0.8rem 1rem", fontSize: "0.85rem", color: "var(--muted)" }}>{v.tier}</td>
                    <td style={{ padding: "0.8rem 1rem" }}><StatusBadge status={v.status} /></td>
                    <td style={{ padding: "0.8rem 1rem", display: "flex", gap: "0.4rem" }}>
                      {v.status === "published" && <button onClick={() => updateStatus("venue_listings", v.id, "flagged")} style={{ background: "#fef3c7", border: "1px solid #f5c842", borderRadius: 4, padding: "0.3rem 0.8rem", fontSize: "0.72rem", cursor: "pointer", fontWeight: 600, fontFamily: "'DM Sans', sans-serif" }}>Flag</button>}
                      {(v.status === "flagged" || v.status === "pending_review") && <button onClick={() => updateStatus("venue_listings", v.id, "published")} style={{ background: "var(--green)", color: "white", border: "none", borderRadius: 4, padding: "0.3rem 0.8rem", fontSize: "0.72rem", cursor: "pointer", fontWeight: 600, fontFamily: "'DM Sans', sans-serif" }}>Approve</button>}
                      <button onClick={() => copyClaimLinks("venue_listings", v.id, v.business_name)} style={{ background: "var(--bg)", border: "1px solid var(--border)", borderRadius: 4, padding: "0.3rem 0.8rem", fontSize: "0.72rem", cursor: "pointer", fontWeight: 600, fontFamily: "'DM Sans', sans-serif" }}>Claim link</button>
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
          {renderSourcePicker(events)}
          {renderBulkBar("event_listings", applySourceFilter(events))}
          {events.length === 0 ? (
            <div style={{ background: "var(--bg)", border: "1px solid var(--border)", borderRadius: 16, padding: "3rem", textAlign: "center" }}>
              <p style={{ color: "var(--muted)" }}>No event listings yet. They&rsquo;ll appear here after payment is received.</p>
            </div>
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  <th aria-label="Select" style={{ padding: "0.8rem 0.6rem", background: "var(--bg)" }} />
                  <th style={{ textAlign: "left", padding: "0.8rem 1rem", background: "var(--bg)", fontSize: "0.78rem", fontWeight: 700, color: "var(--navy)", textTransform: "uppercase", letterSpacing: "0.1em" }}>Event</th>
                  <th style={{ textAlign: "left", padding: "0.8rem 1rem", background: "var(--bg)", fontSize: "0.78rem", fontWeight: 700, color: "var(--navy)", textTransform: "uppercase", letterSpacing: "0.1em" }}>Location</th>
                  <th style={{ textAlign: "left", padding: "0.8rem 1rem", background: "var(--bg)", fontSize: "0.78rem", fontWeight: 700, color: "var(--navy)", textTransform: "uppercase", letterSpacing: "0.1em" }}>Date</th>
                  <th style={{ textAlign: "left", padding: "0.8rem 1rem", background: "var(--bg)", fontSize: "0.78rem", fontWeight: 700, color: "var(--navy)", textTransform: "uppercase", letterSpacing: "0.1em" }}>Status</th>
                  <th style={{ textAlign: "left", padding: "0.8rem 1rem", background: "var(--bg)", fontSize: "0.78rem", fontWeight: 700, color: "var(--navy)", textTransform: "uppercase", letterSpacing: "0.1em" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {applySourceFilter(events).map((ev) => (
                  <tr key={ev.id} style={{ borderBottom: "1px solid var(--border)" }}>
                    {rowCheckbox(ev, ev.event_name)}
                    <td style={{ padding: "0.8rem 1rem", fontSize: "0.9rem", fontWeight: 600, color: "var(--navy)" }}>
                      {ev.event_name}
                      <div style={{ fontSize: "0.75rem", fontWeight: 400, color: "var(--muted)", marginTop: "0.15rem" }}>
                        {safeHttpUrl(ev.registration_url) ? <a href={safeHttpUrl(ev.registration_url)} target="_blank" rel="noopener noreferrer" style={{ color: "var(--pink-text)" }}>{String(ev.registration_url).replace(/^https?:\/\//, "").slice(0, 40)}</a> : "no link"}
                        {ev.description ? ` · ${String(ev.description).slice(0, 80)}` : ""}
                      </div>
                      <ParsedScheduleHint ev={ev} />
                      {sourceHost(ev.source_url) && (
                        <div style={{ fontSize: "0.72rem", fontWeight: 400, color: "var(--muted)", marginTop: "0.2rem" }}>
                          source: <a href={safeHttpUrl(ev.source_url) || undefined} target="_blank" rel="noopener noreferrer" style={{ color: "var(--pink-text)" }}>{sourceHost(ev.source_url)}</a>
                        </div>
                      )}
                    </td>
                    <td style={{ padding: "0.8rem 1rem", fontSize: "0.85rem", color: "var(--muted)" }}>{ev.city}, {ev.state}</td>
                    <td style={{ padding: "0.8rem 1rem", fontSize: "0.85rem", color: "var(--muted)" }}>{ev.event_date ? formatDate(ev.event_date) : "-"}</td>
                    <td style={{ padding: "0.8rem 1rem" }}><StatusBadge status={ev.status} /></td>
                    <td style={{ padding: "0.8rem 1rem", display: "flex", gap: "0.4rem" }}>
                      {ev.status === "published" && <button onClick={() => updateStatus("event_listings", ev.id, "flagged")} style={{ background: "#fef3c7", border: "1px solid #f5c842", borderRadius: 4, padding: "0.3rem 0.8rem", fontSize: "0.72rem", cursor: "pointer", fontWeight: 600, fontFamily: "'DM Sans', sans-serif" }}>Flag</button>}
                      {(ev.status === "flagged" || ev.status === "pending_review") && <button onClick={() => updateStatus("event_listings", ev.id, "published")} style={{ background: "var(--green)", color: "white", border: "none", borderRadius: 4, padding: "0.3rem 0.8rem", fontSize: "0.72rem", cursor: "pointer", fontWeight: 600, fontFamily: "'DM Sans', sans-serif" }}>Approve</button>}
                      <button onClick={() => copyClaimLinks("event_listings", ev.id, ev.event_name)} style={{ background: "var(--bg)", border: "1px solid var(--border)", borderRadius: 4, padding: "0.3rem 0.8rem", fontSize: "0.72rem", cursor: "pointer", fontWeight: 600, fontFamily: "'DM Sans', sans-serif" }}>Claim link</button>
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
