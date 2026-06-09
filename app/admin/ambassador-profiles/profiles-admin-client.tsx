"use client";

import { useState } from "react";

type Row = Record<string, unknown>;

const field: React.CSSProperties = { width: "100%", minHeight: 44, padding: "0.55rem 0.8rem", border: "1.5px solid var(--border)", borderRadius: 8, fontSize: "0.95rem", fontFamily: "'DM Sans', sans-serif", color: "var(--navy)", background: "white", outline: "none" };
const navLink: React.CSSProperties = { color: "var(--navy)", fontWeight: 600, fontSize: "0.85rem", textDecoration: "none", border: "1px solid var(--border)", borderRadius: 6, padding: "0.35rem 0.7rem" };

const LAUNCH_TARGET = 10;

function ProfileEditor({ a }: { a: Row }) {
  const [slug, setSlug] = useState(String(a.slug || ""));
  const [bio, setBio] = useState(String(a.bio || ""));
  const [photo, setPhoto] = useState(String(a.photo_url || ""));
  const [code, setCode] = useState(String(a.referral_code || ""));
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  const published = a.profile_status === "published";

  async function save(profile_status: "draft" | "published") {
    setBusy(true); setMsg("");
    const res = await fetch("/api/admin/ambassador-profile", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: a.id, slug, bio, photo_url: photo, referral_code: code, profile_status }),
    });
    setBusy(false);
    if (res.ok) { window.location.reload(); }
    else { const d = await res.json().catch(() => ({})); setMsg(d.error || "Could not save."); }
  }

  return (
    <div style={{ background: "white", border: "2px solid var(--border)", borderRadius: 12, padding: "1.1rem 1.2rem", marginBottom: "1rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.7rem" }}>
        <div style={{ fontSize: "1.1rem", fontWeight: 800, color: "var(--navy)" }}>{String(a.name)} <span style={{ fontWeight: 600, color: "var(--muted)", fontSize: "0.9rem" }}>{[a.city, a.state].filter(Boolean).join(", ")}</span></div>
        <span style={{ fontSize: "0.78rem", fontWeight: 700, padding: "0.2rem 0.7rem", borderRadius: 999, background: published ? "rgba(46,201,92,0.12)" : "var(--bg)", color: published ? "#1a9648" : "var(--muted)" }}>{published ? "published" : "draft"}</span>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "0.7rem" }}>
        <input style={field} placeholder="slug (e.g. ruth-las-vegas)" value={slug} onChange={(e) => setSlug(e.target.value)} />
        <input style={field} placeholder="referral code (e.g. FMM-LV-RUTH)" value={code} onChange={(e) => setCode(e.target.value)} />
        <input style={field} placeholder="photo URL (https://...)" value={photo} onChange={(e) => setPhoto(e.target.value)} />
      </div>
      <textarea style={{ ...field, minHeight: 80, marginTop: "0.7rem", resize: "vertical" }} placeholder="Short public bio" value={bio} onChange={(e) => setBio(e.target.value)} />
      {msg && <p style={{ color: "#dc2626", fontSize: "0.9rem", marginTop: "0.5rem" }}>{msg}</p>}
      <div style={{ display: "flex", gap: "0.6rem", marginTop: "0.8rem", flexWrap: "wrap" }}>
        <button onClick={() => save("draft")} disabled={busy} style={{ background: "var(--bg)", border: "1px solid var(--border)", borderRadius: 8, padding: "0.5rem 1rem", fontSize: "0.9rem", fontWeight: 700, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>Save draft</button>
        {published
          ? <button onClick={() => save("draft")} disabled={busy} style={{ background: "#fef3c7", border: "1px solid #f5c842", borderRadius: 8, padding: "0.5rem 1rem", fontSize: "0.9rem", fontWeight: 700, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>Unpublish</button>
          : <button onClick={() => save("published")} disabled={busy} style={{ background: "var(--green)", color: "white", border: "none", borderRadius: 8, padding: "0.5rem 1rem", fontSize: "0.9rem", fontWeight: 800, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>Publish profile</button>}
        {slug && <a href={`/ambassadors/${slug}`} target="_blank" rel="noopener noreferrer" style={{ alignSelf: "center", color: "var(--pink)", fontWeight: 700, fontSize: "0.9rem" }}>Preview page</a>}
      </div>
    </div>
  );
}

export default function ProfilesAdminClient({ initialAmbassadors, tableMissing, publishedCount }: { initialAmbassadors: Row[]; tableMissing: boolean; publishedCount: number }) {
  const pct = Math.min(100, Math.round((publishedCount / LAUNCH_TARGET) * 100));
  return (
    <div style={{ maxWidth: 900, margin: "0 auto", padding: "2rem 1.5rem 4rem" }}>
      <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", marginBottom: "1.5rem" }}>
        <a href="/admin/metrics" style={navLink}>Metrics</a>
        <a href="/admin/heatmap" style={navLink}>Heat Map</a>
        <a href="/admin/teachers" style={navLink}>Teachers</a>
        <a href="/admin" style={navLink}>Admin Home</a>
      </div>

      <h1 style={{ fontFamily: "var(--font-playfair), 'Playfair Display', serif", fontSize: "1.8rem", color: "var(--navy)", marginBottom: "0.3rem" }}>Ambassador Profiles, Admin</h1>
      <p style={{ color: "var(--muted)", marginBottom: "1.2rem" }}>Set the public profile for approved ambassadors. Publish only when the bio and photo are ready.</p>

      <div style={{ background: "rgba(245,200,66,0.15)", border: "1px solid var(--gold)", borderRadius: 10, padding: "0.9rem 1.1rem", marginBottom: "1.2rem", color: "#8a6d00", fontSize: "0.9rem" }}>
        Profile fields require <code>supabase/ambassador-profiles.sql</code> to be run first. Until then, Save will report a database error.
      </div>

      {tableMissing && (
        <div style={{ background: "rgba(220,38,38,0.08)", border: "1px solid #fca5a5", borderRadius: 10, padding: "1rem 1.2rem", marginBottom: "1.5rem", color: "#b91c1c" }}>
          Could not read the ambassadors table. Make sure the ambassadors table exists.
        </div>
      )}

      <div style={{ background: "var(--bg)", border: "1px solid var(--border)", borderRadius: 12, padding: "1rem 1.2rem", marginBottom: "1.5rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.9rem", fontWeight: 700, color: "var(--navy)", marginBottom: "0.4rem" }}>
          <span>Launch progress (published profiles)</span><span>{publishedCount} of {LAUNCH_TARGET}</span>
        </div>
        <div style={{ height: 12, background: "white", borderRadius: 999, overflow: "hidden", border: "1px solid var(--border)" }}>
          <div style={{ width: `${pct}%`, height: "100%", background: publishedCount >= LAUNCH_TARGET ? "var(--green)" : "var(--pink)" }} />
        </div>
        <div style={{ fontSize: "0.82rem", color: "var(--muted)", marginTop: "0.4rem" }}>{publishedCount >= LAUNCH_TARGET ? "Ready to launch Ambassador Profiles." : `${LAUNCH_TARGET - publishedCount} more published profiles to reach the launch minimum.`}</div>
      </div>

      <div style={{ fontSize: "1.1rem", fontWeight: 800, color: "var(--navy)", marginBottom: "0.8rem" }}>Approved ambassadors ({initialAmbassadors.length})</div>
      {initialAmbassadors.length === 0 ? (
        <div style={{ background: "var(--bg)", border: "1px solid var(--border)", borderRadius: 12, padding: "2rem", textAlign: "center", color: "var(--muted)" }}>No approved ambassadors yet. Approve applicants in the Admin dashboard first.</div>
      ) : (
        initialAmbassadors.map((a) => <ProfileEditor key={String(a.id)} a={a} />)
      )}
    </div>
  );
}
