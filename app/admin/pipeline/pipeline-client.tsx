"use client";

import { useState } from "react";

type Row = Record<string, unknown>;

const STAGES = ["identified", "contacted", "conversation", "candidate", "approved", "activated"];
const STAGE_LABEL: Record<string, string> = {
  identified: "Identified", contacted: "Contacted", conversation: "Conversations",
  candidate: "Candidates", approved: "Approved", activated: "Activated",
};
const HEAT_COLOR: Record<string, string> = { hot: "#dc2626", warm: "#a07800", cold: "#6b7280" };

const field: React.CSSProperties = { minHeight: 44, padding: "0.55rem 0.8rem", border: "1.5px solid var(--border)", borderRadius: 8, fontSize: "0.95rem", fontFamily: "'DM Sans', sans-serif", color: "var(--navy)", background: "white", outline: "none" };
const navLink: React.CSSProperties = { color: "var(--navy)", fontWeight: 600, fontSize: "0.85rem", textDecoration: "none", border: "1px solid var(--border)", borderRadius: 6, padding: "0.35rem 0.7rem" };

export default function PipelineClient({ initialContacts, tableMissing }: { initialContacts: Row[]; tableMissing: boolean }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [city, setCity] = useState("");
  const [statev, setStatev] = useState("");
  const [role, setRole] = useState("");
  const [heat, setHeat] = useState("warm");
  const [source, setSource] = useState("oh_my_mahjong");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const [ommOnly, setOmmOnly] = useState(true);

  const visible = ommOnly ? initialContacts.filter((c) => c.source === "oh_my_mahjong") : initialContacts;
  const counts = (rows: Row[]) => STAGES.map((s) => rows.filter((r) => r.stage === s).length);
  const ommCounts = counts(initialContacts.filter((c) => c.source === "oh_my_mahjong"));
  const allCounts = counts(initialContacts);

  async function add(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); setMsg("");
    const res = await fetch("/api/admin/pipeline", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "create", name, email, city, state: statev, role, heat, source }),
    });
    setBusy(false);
    if (res.ok) window.location.reload();
    else { const d = await res.json().catch(() => ({})); setMsg(d.error || "Could not save."); }
  }

  async function advance(id: string, currentStage: string) {
    const idx = STAGES.indexOf(currentStage);
    const next = STAGES[Math.min(STAGES.length - 1, idx + 1)];
    await fetch("/api/admin/pipeline", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "update", id, stage: next }) });
    window.location.reload();
  }

  const stat: React.CSSProperties = { background: "white", border: "2px solid var(--border)", borderRadius: 12, padding: "1rem 0.5rem", textAlign: "center", flex: 1, minWidth: 90 };

  return (
    <div style={{ maxWidth: 1000, margin: "0 auto", padding: "2rem 1.5rem 4rem" }}>
      <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", marginBottom: "1.5rem" }}>
        <a href="/admin/metrics" style={navLink}>Metrics</a>
        <a href="/admin/heatmap" style={navLink}>Heat Map</a>
        <a href="/admin/teachers" style={navLink}>Teachers</a>
        <a href="/admin/ambassador-profiles" style={navLink}>Profiles</a>
        <a href="/admin" style={navLink}>Admin Home</a>
      </div>

      <h1 style={{ fontFamily: "var(--font-playfair), 'Playfair Display', serif", fontSize: "1.9rem", color: "var(--navy)", marginBottom: "0.3rem" }}>Warm Relationship Pipeline</h1>
      <p style={{ color: "var(--muted)", marginBottom: "1.2rem" }}>The founder KPI. Relationships are the highest-leverage growth asset. Oh My Mahjong contacts come first.</p>

      {tableMissing && (
        <div style={{ background: "rgba(220,38,38,0.08)", border: "1px solid #fca5a5", borderRadius: 10, padding: "1rem 1.2rem", marginBottom: "1.5rem", color: "#b91c1c" }}>
          The <strong>warm_contacts</strong> table does not exist yet. Run <code>supabase/warm_contacts.sql</code> first, then this dashboard works.
        </div>
      )}

      <div style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--navy)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "0.5rem" }}>Oh My Mahjong funnel</div>
      <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", marginBottom: "1rem" }}>
        {STAGES.map((s, i) => (
          <div key={s} style={{ ...stat, borderColor: s === "activated" ? "var(--green)" : "var(--border)" }}>
            <div style={{ fontSize: "1.8rem", fontWeight: 800, color: s === "activated" ? "#1a9648" : "var(--navy)", fontFamily: "var(--font-playfair), 'Playfair Display', serif" }}>{ommCounts[i]}</div>
            <div style={{ fontSize: "0.78rem", color: "var(--muted)", marginTop: "0.2rem" }}>{STAGE_LABEL[s]}</div>
          </div>
        ))}
      </div>
      <p style={{ fontSize: "0.82rem", color: "var(--muted)", marginBottom: "1.8rem" }}>All sources combined: {allCounts.join(" / ")} (Identified / Contacted / Conversations / Candidates / Approved / Activated).</p>

      <form onSubmit={add} style={{ background: "white", border: "2px solid var(--border)", borderRadius: 12, padding: "1.2rem", marginBottom: "2rem" }}>
        <div style={{ fontSize: "1.1rem", fontWeight: 800, color: "var(--navy)", marginBottom: "0.8rem" }}>Add a contact</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "0.7rem" }}>
          <input style={field} placeholder="Name (required)" value={name} onChange={(e) => setName(e.target.value)} />
          <input style={field} placeholder="Email or phone" value={email} onChange={(e) => setEmail(e.target.value)} />
          <input style={field} placeholder="City" value={city} onChange={(e) => setCity(e.target.value)} />
          <input style={field} placeholder="State" value={statev} onChange={(e) => setStatev(e.target.value)} />
          <select style={field} value={role} onChange={(e) => setRole(e.target.value)}>
            <option value="">Role</option>
            {["teacher", "studio_owner", "organizer", "host", "club_leader", "other"].map((r) => <option key={r} value={r}>{r.replace("_", " ")}</option>)}
          </select>
          <select style={field} value={source} onChange={(e) => setSource(e.target.value)}>
            <option value="oh_my_mahjong">Oh My Mahjong</option>
            <option value="referral">Referral</option>
            <option value="inbound">Inbound</option>
            <option value="other">Other</option>
          </select>
          <select style={field} value={heat} onChange={(e) => setHeat(e.target.value)}>
            <option value="hot">Hot</option>
            <option value="warm">Warm</option>
            <option value="cold">Cold</option>
          </select>
        </div>
        {msg && <p style={{ color: "#dc2626", fontSize: "0.9rem", marginTop: "0.6rem" }}>{msg}</p>}
        <button type="submit" disabled={busy || !name.trim()} style={{ marginTop: "1rem", background: name.trim() ? "var(--pink)" : "#d9b3cc", color: "white", border: "none", borderRadius: 8, padding: "0.7rem 1.4rem", fontSize: "1rem", fontWeight: 800, cursor: name.trim() ? "pointer" : "not-allowed", fontFamily: "'DM Sans', sans-serif" }}>{busy ? "Saving..." : "Add contact"}</button>
      </form>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.8rem" }}>
        <div style={{ fontSize: "1.1rem", fontWeight: 800, color: "var(--navy)" }}>Contacts ({visible.length})</div>
        <label style={{ fontSize: "0.9rem", color: "var(--navy)", fontWeight: 600, display: "flex", alignItems: "center", gap: "0.4rem" }}>
          <input type="checkbox" checked={ommOnly} onChange={(e) => setOmmOnly(e.target.checked)} style={{ width: 18, height: 18 }} /> Oh My Mahjong only
        </label>
      </div>
      {visible.length === 0 ? (
        <div style={{ background: "var(--bg)", border: "1px solid var(--border)", borderRadius: 12, padding: "2rem", textAlign: "center", color: "var(--muted)" }}>No contacts yet. Add your Oh My Mahjong relationships above.</div>
      ) : (
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead><tr>{["Name", "City", "Role", "Heat", "Stage", ""].map((h) => <th key={h} style={{ textAlign: "left", padding: "0.5rem 0.7rem", background: "var(--bg)", fontSize: "0.72rem", fontWeight: 700, color: "var(--navy)", textTransform: "uppercase", letterSpacing: "0.06em" }}>{h}</th>)}</tr></thead>
          <tbody>
            {visible.map((c) => (
              <tr key={String(c.id)} style={{ borderBottom: "1px solid var(--border)" }}>
                <td style={{ padding: "0.5rem 0.7rem", fontWeight: 600, color: "var(--navy)" }}>{String(c.name)}</td>
                <td style={{ padding: "0.5rem 0.7rem", fontSize: "0.88rem", color: "var(--muted)" }}>{[c.city, c.state].filter(Boolean).join(", ")}</td>
                <td style={{ padding: "0.5rem 0.7rem", fontSize: "0.85rem", color: "var(--muted)" }}>{String(c.role || "").replace("_", " ")}</td>
                <td style={{ padding: "0.5rem 0.7rem", fontSize: "0.8rem", fontWeight: 800, color: HEAT_COLOR[String(c.heat)] || "var(--muted)", textTransform: "uppercase" }}>{String(c.heat || "")}</td>
                <td style={{ padding: "0.5rem 0.7rem", fontSize: "0.85rem", fontWeight: 700, color: c.stage === "activated" ? "#1a9648" : "var(--navy)" }}>{STAGE_LABEL[String(c.stage)] || String(c.stage)}</td>
                <td style={{ padding: "0.5rem 0.7rem" }}>
                  {c.stage !== "activated" && <button onClick={() => advance(String(c.id), String(c.stage))} style={{ background: "var(--navy)", color: "white", border: "none", borderRadius: 6, padding: "0.3rem 0.7rem", fontSize: "0.75rem", fontWeight: 700, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>Advance &rarr;</button>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
