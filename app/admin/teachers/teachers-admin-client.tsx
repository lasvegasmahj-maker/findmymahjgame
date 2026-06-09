"use client";

import { useState } from "react";

type Row = Record<string, unknown>;

const field: React.CSSProperties = { width: "100%", minHeight: 46, padding: "0.6rem 0.8rem", border: "1.5px solid var(--border)", borderRadius: 8, fontSize: "0.95rem", fontFamily: "'DM Sans', sans-serif", color: "var(--navy)", background: "white", outline: "none" };
const navLink: React.CSSProperties = { color: "var(--navy)", fontWeight: 600, fontSize: "0.85rem", textDecoration: "none", border: "1px solid var(--border)", borderRadius: 6, padding: "0.35rem 0.7rem" };
const btn = (bg: string, color: string): React.CSSProperties => ({ background: bg, color, border: "none", borderRadius: 6, padding: "0.35rem 0.8rem", fontSize: "0.78rem", fontWeight: 700, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" });

const LAUNCH_TARGET = 20;

export default function TeachersAdminClient({ initialTeachers, tableMissing, publishedCount }: { initialTeachers: Row[]; tableMissing: boolean; publishedCount: number }) {
  const [name, setName] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [website, setWebsite] = useState("");
  const [contact, setContact] = useState("");
  const [isAmbassador, setIsAmbassador] = useState(false);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  async function addTeacher(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true); setMsg("");
    const res = await fetch("/api/admin/teachers", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, city, state, website, contact, isAmbassador }),
    });
    setSaving(false);
    if (res.ok) { window.location.reload(); }
    else { const d = await res.json().catch(() => ({})); setMsg(d.error || "Could not save."); }
  }

  async function setStatus(id: string, status: string) {
    await fetch("/api/admin/update", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ table: "teachers", id, status }) });
    window.location.reload();
  }

  const pct = Math.min(100, Math.round((publishedCount / LAUNCH_TARGET) * 100));

  return (
    <div style={{ maxWidth: 900, margin: "0 auto", padding: "2rem 1.5rem 4rem" }}>
      <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", marginBottom: "1.5rem" }}>
        <a href="/admin/metrics" style={navLink}>Metrics</a>
        <a href="/admin/heatmap" style={navLink}>Heat Map</a>
        <a href="/admin/ambassador-profiles" style={navLink}>Ambassador Profiles</a>
        <a href="/admin" style={navLink}>Admin Home</a>
      </div>

      <h1 style={{ fontFamily: "var(--font-playfair), 'Playfair Display', serif", fontSize: "1.8rem", color: "var(--navy)", marginBottom: "0.3rem" }}>Teacher Directory, Admin</h1>
      <p style={{ color: "var(--muted)", marginBottom: "1.2rem" }}>Add and manage real teachers. Listings you add here are published right away.</p>

      {tableMissing && (
        <div style={{ background: "rgba(220,38,38,0.08)", border: "1px solid #fca5a5", borderRadius: 10, padding: "1rem 1.2rem", marginBottom: "1.5rem", color: "#b91c1c" }}>
          The <strong>teachers</strong> table does not exist yet. Run <code>supabase/teachers.sql</code> first, then this page works.
        </div>
      )}

      <div style={{ background: "var(--bg)", border: "1px solid var(--border)", borderRadius: 12, padding: "1rem 1.2rem", marginBottom: "1.5rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.9rem", fontWeight: 700, color: "var(--navy)", marginBottom: "0.4rem" }}>
          <span>Launch progress (published teachers)</span><span>{publishedCount} of {LAUNCH_TARGET}</span>
        </div>
        <div style={{ height: 12, background: "white", borderRadius: 999, overflow: "hidden", border: "1px solid var(--border)" }}>
          <div style={{ width: `${pct}%`, height: "100%", background: publishedCount >= LAUNCH_TARGET ? "var(--green)" : "var(--pink)" }} />
        </div>
        <div style={{ fontSize: "0.82rem", color: "var(--muted)", marginTop: "0.4rem" }}>{publishedCount >= LAUNCH_TARGET ? "Ready to launch the Teacher Directory." : `${LAUNCH_TARGET - publishedCount} more to reach the launch minimum.`}</div>
      </div>

      <form onSubmit={addTeacher} style={{ background: "white", border: "2px solid var(--border)", borderRadius: 12, padding: "1.2rem", marginBottom: "2rem" }}>
        <div style={{ fontSize: "1.1rem", fontWeight: 800, color: "var(--navy)", marginBottom: "0.8rem" }}>Add a teacher</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "0.8rem" }}>
          <input style={field} placeholder="Name (required)" value={name} onChange={(e) => setName(e.target.value)} />
          <input style={field} placeholder="City" value={city} onChange={(e) => setCity(e.target.value)} />
          <input style={field} placeholder="State" value={state} onChange={(e) => setState(e.target.value)} />
          <input style={field} placeholder="Website (https://...)" value={website} onChange={(e) => setWebsite(e.target.value)} />
          <input style={field} placeholder="Public contact (optional)" value={contact} onChange={(e) => setContact(e.target.value)} />
          <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.95rem", color: "var(--navy)", fontWeight: 600 }}>
            <input type="checkbox" checked={isAmbassador} onChange={(e) => setIsAmbassador(e.target.checked)} style={{ width: 20, height: 20 }} /> Is a Founding Ambassador
          </label>
        </div>
        {msg && <p style={{ color: "#dc2626", fontSize: "0.9rem", marginTop: "0.6rem" }}>{msg}</p>}
        <button type="submit" disabled={saving || !name.trim()} style={{ marginTop: "1rem", background: name.trim() ? "var(--pink)" : "#d9b3cc", color: "white", border: "none", borderRadius: 8, padding: "0.7rem 1.4rem", fontSize: "1rem", fontWeight: 800, cursor: name.trim() ? "pointer" : "not-allowed", fontFamily: "'DM Sans', sans-serif" }}>{saving ? "Saving..." : "Add teacher"}</button>
      </form>

      <div style={{ fontSize: "1.1rem", fontWeight: 800, color: "var(--navy)", marginBottom: "0.8rem" }}>All teachers ({initialTeachers.length})</div>
      {initialTeachers.length === 0 ? (
        <div style={{ background: "var(--bg)", border: "1px solid var(--border)", borderRadius: 12, padding: "2rem", textAlign: "center", color: "var(--muted)" }}>No teachers yet. Add your first above.</div>
      ) : (
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              {["Name", "Location", "Ambassador", "Status", "Actions"].map((h) => (
                <th key={h} style={{ textAlign: "left", padding: "0.6rem 0.8rem", background: "var(--bg)", fontSize: "0.75rem", fontWeight: 700, color: "var(--navy)", textTransform: "uppercase", letterSpacing: "0.08em" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {initialTeachers.map((t) => (
              <tr key={String(t.id)} style={{ borderBottom: "1px solid var(--border)" }}>
                <td style={{ padding: "0.6rem 0.8rem", fontWeight: 600, color: "var(--navy)" }}>{String(t.name)}</td>
                <td style={{ padding: "0.6rem 0.8rem", fontSize: "0.9rem", color: "var(--muted)" }}>{[t.city, t.state].filter(Boolean).join(", ")}</td>
                <td style={{ padding: "0.6rem 0.8rem", fontSize: "0.9rem" }}>{t.is_ambassador ? "Yes" : "-"}</td>
                <td style={{ padding: "0.6rem 0.8rem", fontSize: "0.85rem", fontWeight: 700, color: t.status === "published" ? "#1a9648" : t.status === "rejected" ? "#dc2626" : "#a07800" }}>{String(t.status)}</td>
                <td style={{ padding: "0.6rem 0.8rem", display: "flex", gap: "0.4rem", flexWrap: "wrap" }}>
                  {t.status !== "published" && <button onClick={() => setStatus(String(t.id), "published")} style={btn("var(--green)", "white")}>Publish</button>}
                  {t.status === "published" && <button onClick={() => setStatus(String(t.id), "flagged")} style={btn("#fef3c7", "#a07800")}>Flag</button>}
                  <button onClick={() => setStatus(String(t.id), "rejected")} style={btn("#fee2e2", "#dc2626")}>Reject</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
