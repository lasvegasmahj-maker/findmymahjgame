"use client";

import { useState } from "react";
import type { CruisePost } from "./page";

const SKILL_OPTIONS: [string, string][] = [
  ["any", "Any level"], ["beginner", "Beginner"], ["intermediate", "Intermediate"], ["advanced", "Advanced"],
];

const fmt = (d: string) => new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" });
const dateRange = (p: CruisePost) => (p.return_date ? `${fmt(p.depart_date)} - ${fmt(p.return_date)}` : fmt(p.depart_date));
const skillLabel = (s: string | null) => ({ beginner: "Beginner", intermediate: "Intermediate", advanced: "Advanced" } as Record<string, string>)[s || ""] || "Any level";

const label: React.CSSProperties = { display: "block", fontSize: "0.85rem", fontWeight: 800, color: "var(--navy)", marginBottom: "0.35rem" };
const input: React.CSSProperties = { width: "100%", minHeight: 50, padding: "0 0.9rem", border: "1.5px solid var(--border)", borderRadius: 10, fontSize: "16px", fontFamily: "'DM Sans', sans-serif", color: "var(--navy)", background: "white", boxSizing: "border-box" };
const card: React.CSSProperties = { background: "white", border: "2px solid var(--border)", borderRadius: 16, padding: "1.4rem" };
const pink: React.CSSProperties = { minHeight: 52, borderRadius: 12, border: "none", background: "var(--pink)", color: "white", fontWeight: 800, fontSize: "1.05rem", cursor: "pointer", fontFamily: "'DM Sans', sans-serif" };

export default function CruiseBoard({ posts }: { posts: CruisePost[] }) {
  const [pf, setPf] = useState({ name: "", email: "", cruise_line: "", ship: "", depart_date: "", return_date: "", skill_level: "any" });
  const [pStatus, setPStatus] = useState<"idle" | "submitting" | "done" | "error">("idle");
  const [pErr, setPErr] = useState("");

  const [conn, setConn] = useState<CruisePost | null>(null);
  const [cf, setCf] = useState({ name: "", email: "", message: "" });
  const [cStatus, setCStatus] = useState<"idle" | "submitting" | "done" | "error">("idle");
  const [cErr, setCErr] = useState("");

  async function submitPost(e: React.FormEvent) {
    e.preventDefault();
    setPStatus("submitting"); setPErr("");
    try {
      const res = await fetch("/api/cruise/post", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(pf) });
      if (res.ok) { setPStatus("done"); return; }
      const d = await res.json().catch(() => ({}));
      setPErr(d.error || "Something went wrong. Please try again."); setPStatus("error");
    } catch {
      setPErr("We could not reach the server. Please try again."); setPStatus("error");
    }
  }

  function openConnect(p: CruisePost) {
    setConn(p); setCf({ name: "", email: "", message: "" }); setCStatus("idle"); setCErr("");
  }

  async function submitConnect(e: React.FormEvent) {
    e.preventDefault();
    if (!conn) return;
    setCStatus("submitting"); setCErr("");
    try {
      const res = await fetch("/api/connect", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ source: "cruise", id: conn.id, name: cf.name, email: cf.email, message: cf.message }) });
      if (res.ok) { setCStatus("done"); return; }
      const d = await res.json().catch(() => ({}));
      setCErr(d.error || "Something went wrong. Please try again."); setCStatus("error");
    } catch {
      setCErr("We could not reach the server. Please try again."); setCStatus("error");
    }
  }

  return (
    <>
      {/* POST YOUR CRUISE */}
      <section style={{ ...card, background: "var(--bg)", marginBottom: "2.6rem" }}>
        <h2 style={{ fontFamily: "var(--font-playfair), 'Playfair Display', serif", fontSize: "1.5rem", color: "var(--navy)", margin: "0 0 0.3rem" }}>Post your cruise</h2>
        {pStatus === "done" ? (
          <div style={{ background: "rgba(46,201,92,0.1)", border: "2px solid #2ec95c", borderRadius: 14, padding: "1.3rem", textAlign: "center" }}>
            <p style={{ fontSize: "1.1rem", color: "#1a6e3a", fontWeight: 800, lineHeight: 1.5, margin: 0 }}>Thanks, we got your sailing! It appears on the board after a quick review; we check new posts regularly. Once it is live, other players sailing with you can send you a request, and it comes straight to your email.</p>
          </div>
        ) : (
          <form onSubmit={submitPost}>
            <p style={{ fontSize: "1rem", color: "var(--muted)", lineHeight: 1.6, margin: "0 0 1.2rem" }}>Tell us your sailing and we will list it so other players aboard can find you. Your email is never shown publicly.</p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 220px), 1fr))", gap: "1rem" }}>
              <div>
                <label style={label} htmlFor="cp-name">Your name <span style={{ fontWeight: 400, color: "var(--muted)" }}>(first name + last initial)</span></label>
                <input id="cp-name" style={input} required maxLength={40} placeholder="Sandra M." value={pf.name} onChange={(e) => setPf({ ...pf, name: e.target.value })} />
              </div>
              <div>
                <label style={label} htmlFor="cp-email">Your email <span style={{ fontWeight: 400, color: "var(--muted)" }}>(private)</span></label>
                <input id="cp-email" style={input} type="email" required placeholder="you@example.com" value={pf.email} onChange={(e) => setPf({ ...pf, email: e.target.value })} />
              </div>
              <div>
                <label style={label} htmlFor="cp-line">Cruise line</label>
                <input id="cp-line" style={input} required maxLength={60} placeholder="Royal Caribbean" value={pf.cruise_line} onChange={(e) => setPf({ ...pf, cruise_line: e.target.value })} />
              </div>
              <div>
                <label style={label} htmlFor="cp-ship">Ship <span style={{ fontWeight: 400, color: "var(--muted)" }}>(optional)</span></label>
                <input id="cp-ship" style={input} maxLength={60} placeholder="Symphony of the Seas" value={pf.ship} onChange={(e) => setPf({ ...pf, ship: e.target.value })} />
              </div>
              <div>
                <label style={label} htmlFor="cp-depart">Departure date</label>
                <input id="cp-depart" style={input} type="date" required value={pf.depart_date} onChange={(e) => setPf({ ...pf, depart_date: e.target.value })} />
              </div>
              <div>
                <label style={label} htmlFor="cp-return">Return date <span style={{ fontWeight: 400, color: "var(--muted)" }}>(optional)</span></label>
                <input id="cp-return" style={input} type="date" value={pf.return_date} onChange={(e) => setPf({ ...pf, return_date: e.target.value })} />
              </div>
              <div>
                <label style={label} htmlFor="cp-skill">Your level</label>
                <select id="cp-skill" style={input} value={pf.skill_level} onChange={(e) => setPf({ ...pf, skill_level: e.target.value })}>
                  {SKILL_OPTIONS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </select>
              </div>
            </div>
            {pStatus === "error" && <p role="alert" style={{ color: "#dc2626", fontSize: "1rem", marginTop: "1rem", marginBottom: 0 }}>{pErr}</p>}
            <button type="submit" disabled={pStatus === "submitting"} style={{ ...pink, width: "100%", minHeight: 56, marginTop: "1.3rem", opacity: pStatus === "submitting" ? 0.7 : 1 }}>{pStatus === "submitting" ? "Posting..." : "Post my cruise"}</button>
            <p style={{ fontSize: "0.82rem", color: "var(--muted)", textAlign: "center", marginTop: "0.8rem", marginBottom: 0 }}>Free for players. Your email is never shown publicly or sold.</p>
          </form>
        )}
      </section>

      {/* BOARD */}
      <h2 style={{ fontFamily: "var(--font-playfair), 'Playfair Display', serif", fontSize: "1.5rem", color: "var(--navy)", margin: "0 0 1rem" }}>Players sailing soon</h2>
      {posts.length > 0 ? (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 280px), 1fr))", gap: "1.2rem" }}>
          {posts.map((p) => (
            <div key={p.id} style={card}>
              <div style={{ fontSize: "1.25rem", fontWeight: 800, color: "var(--navy)", lineHeight: 1.25 }}>{[p.cruise_line, p.ship].filter(Boolean).join(" - ")}</div>
              <div style={{ fontSize: "1.05rem", color: "var(--navy)", marginTop: "0.4rem" }}>{dateRange(p)}</div>
              <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", alignItems: "center", marginTop: "0.7rem" }}>
                <span style={{ fontSize: "0.85rem", fontWeight: 800, color: "#1a6e3a", background: "rgba(46,201,92,0.14)", borderRadius: 50, padding: "0.2rem 0.7rem" }}>{skillLabel(p.skill_level)}</span>
                <span style={{ fontSize: "1rem", color: "var(--muted)" }}>{p.name}</span>
              </div>
              <button type="button" onClick={() => openConnect(p)} style={{ ...pink, width: "100%", marginTop: "1rem" }}>Connect</button>
            </div>
          ))}
        </div>
      ) : (
        <div style={{ background: "var(--bg)", borderRadius: 18, padding: "2.2rem 1.6rem", textAlign: "center", maxWidth: 560, margin: "0 auto" }}>
          <p style={{ fontSize: "1.15rem", color: "var(--navy)", fontWeight: 800, marginBottom: "0.5rem" }}>No cruises posted yet.</p>
          <p style={{ fontSize: "1.05rem", color: "var(--muted)", lineHeight: 1.6, margin: 0 }}>Be the first. Post your sailing above and players who join later will find you.</p>
        </div>
      )}

      {/* CONNECT MODAL */}
      {conn && (
        <div role="dialog" aria-modal="true" aria-label={`Connect with ${conn.name}`} onClick={() => setConn(null)} style={{ position: "fixed", inset: 0, background: "rgba(26,31,94,0.55)", display: "flex", alignItems: "center", justifyContent: "center", padding: "1.2rem", zIndex: 1000 }}>
          <div onClick={(e) => e.stopPropagation()} style={{ background: "white", borderRadius: 20, padding: "2rem", maxWidth: 440, width: "100%", position: "relative", maxHeight: "90vh", overflowY: "auto" }}>
            <button aria-label="Close" onClick={() => setConn(null)} style={{ position: "absolute", top: "1rem", right: "1rem", background: "var(--bg)", border: "1px solid var(--border)", borderRadius: "50%", width: 32, height: 32, cursor: "pointer", fontSize: "1.1rem", fontFamily: "'DM Sans', sans-serif" }}>×</button>
            {cStatus === "done" ? (
              <div style={{ textAlign: "center", padding: "1rem 0" }}>
                <h3 style={{ fontFamily: "var(--font-playfair), 'Playfair Display', serif", fontSize: "1.4rem", color: "var(--navy)", marginBottom: "0.5rem" }}>Request sent!</h3>
                <p style={{ color: "var(--muted)", fontSize: "0.98rem", lineHeight: 1.7 }}>Your request went straight to <strong>{conn.name}</strong>. If it&rsquo;s a good match, they&rsquo;ll reply right to your email.</p>
                <button onClick={() => setConn(null)} style={{ ...pink, marginTop: "1.4rem", padding: "0 2rem" }}>Done</button>
              </div>
            ) : (
              <>
                <p style={{ fontSize: "0.72rem", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.12em", color: "var(--pink-text)", margin: "0 0 0.2rem" }}>Connect with</p>
                <h3 style={{ fontFamily: "var(--font-playfair), 'Playfair Display', serif", fontSize: "1.3rem", color: "var(--navy)", margin: "0 0 0.2rem" }}>{conn.name}</h3>
                <p style={{ fontSize: "0.9rem", color: "var(--muted)", margin: "0 0 1.3rem" }}>{[conn.cruise_line, conn.ship].filter(Boolean).join(" - ")} &middot; {dateRange(conn)}</p>
                <form onSubmit={submitConnect}>
                  <div style={{ marginBottom: "1rem" }}>
                    <label style={label} htmlFor="cc-name">Your name</label>
                    <input id="cc-name" style={input} required maxLength={40} placeholder="Jane S." value={cf.name} onChange={(e) => setCf({ ...cf, name: e.target.value })} />
                  </div>
                  <div style={{ marginBottom: "1rem" }}>
                    <label style={label} htmlFor="cc-email">Your email</label>
                    <input id="cc-email" style={input} type="email" required placeholder="jane@example.com" value={cf.email} onChange={(e) => setCf({ ...cf, email: e.target.value })} />
                  </div>
                  <div style={{ marginBottom: "1.3rem" }}>
                    <label style={label} htmlFor="cc-message">Message <span style={{ fontWeight: 400, color: "var(--muted)" }}>(optional)</span></label>
                    <textarea id="cc-message" placeholder={`Hi ${conn.name.split(" ")[0]}! I'm on the same sailing and would love a game.`} value={cf.message} onChange={(e) => setCf({ ...cf, message: e.target.value })} style={{ ...input, minHeight: 96, padding: "0.7rem 0.9rem", resize: "vertical" }} />
                  </div>
                  {cStatus === "error" && <p role="alert" style={{ color: "#dc2626", fontSize: "1rem", marginTop: 0 }}>{cErr}</p>}
                  <button type="submit" disabled={cStatus === "submitting"} style={{ ...pink, width: "100%", minHeight: 56, opacity: cStatus === "submitting" ? 0.7 : 1 }}>{cStatus === "submitting" ? "Sending..." : "Send Connection Request"}</button>
                  <p style={{ fontSize: "0.8rem", color: "var(--muted)", textAlign: "center", marginTop: "0.8rem", marginBottom: 0 }}>Free for players. Your email is never shown publicly. Your request goes straight to {conn.name.split(" ")[0]}, who can reply to you directly. We keep your name and email so that reply can reach you.</p>
                </form>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
