"use client";

import { useState } from "react";
import { SAMPLE_TEACHERS, TEACHER_STATES } from "@/lib/teachers-data";

const fieldStyle: React.CSSProperties = { width: "100%", minHeight: 56, padding: "0.8rem 1rem", border: "2px solid var(--border)", borderRadius: 12, fontSize: "1.15rem", fontFamily: "'DM Sans', sans-serif", color: "var(--navy)", background: "white", outline: "none" };

export default function TeachersClient() {
  const [state, setState] = useState("");
  const teachers = state ? SAMPLE_TEACHERS.filter((t) => t.state === state) : SAMPLE_TEACHERS;

  return (
    <main style={{ maxWidth: 620, margin: "0 auto", padding: "1.5rem 1.2rem 4rem" }}>
      <a href="/" style={{ fontSize: "1.05rem", color: "var(--pink)", fontWeight: 700, textDecoration: "none" }}>&larr; Home</a>
      <h1 style={{ fontSize: "2rem", color: "var(--navy)", margin: "0.8rem 0 0.4rem", fontFamily: "var(--font-playfair), 'Playfair Display', serif" }}>Find a Mahjong Teacher</h1>
      <p style={{ fontSize: "1.15rem", color: "var(--muted)", lineHeight: 1.5, marginBottom: "1rem" }}>Teachers near you who welcome new players. Pick your state to see who is close.</p>

      <div style={{ background: "rgba(245,200,66,0.18)", border: "2px solid var(--gold)", borderRadius: 12, padding: "0.8rem 1.1rem", marginBottom: "1.2rem" }}>
        <div style={{ fontSize: "1rem", color: "#8a6d00", fontWeight: 700, lineHeight: 1.5 }}>Preview with sample names. These are placeholders to show the layout, not real teachers yet.</div>
      </div>

      <div style={{ fontSize: "1.2rem", fontWeight: 800, color: "var(--navy)", margin: "0 0 0.6rem" }}>Your state</div>
      <select style={fieldStyle} value={state} onChange={(e) => setState(e.target.value)}>
        <option value="">All states</option>
        {TEACHER_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
      </select>

      <div style={{ marginTop: "1.4rem", display: "flex", flexDirection: "column", gap: "1rem" }}>
        {teachers.map((t) => (
          <div key={t.id} style={{ background: "white", border: "2px solid var(--border)", borderRadius: 16, padding: "1.3rem 1.4rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "0.6rem" }}>
              <div style={{ fontSize: "1.35rem", fontWeight: 800, color: "var(--navy)" }}>{t.name}</div>
              {t.isAmbassador && (
                <span style={{ flexShrink: 0, background: "var(--green)", color: "white", fontWeight: 800, fontSize: "0.85rem", padding: "0.25rem 0.7rem", borderRadius: 999 }}>Ambassador</span>
              )}
            </div>
            <div style={{ fontSize: "1.1rem", color: "var(--muted)", margin: "0.3rem 0 0.9rem" }}>{t.city}, {t.state}</div>
            <a href={t.website} target="_blank" rel="noopener noreferrer nofollow" style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", minHeight: 52, padding: "0 1.4rem", borderRadius: 12, background: "var(--navy)", color: "white", fontSize: "1.1rem", fontWeight: 800, textDecoration: "none" }}>Visit website</a>
            <div style={{ fontSize: "0.95rem", color: "var(--muted)", marginTop: "0.7rem" }}>{t.contact}. We never share home addresses or personal phone numbers.</div>
          </div>
        ))}
      </div>

      <div style={{ marginTop: "2rem", background: "var(--bg)", borderRadius: 16, padding: "1.4rem 1.5rem" }}>
        <div style={{ fontSize: "1.15rem", fontWeight: 800, color: "var(--navy)", marginBottom: "0.4rem" }}>Are you a teacher?</div>
        <p style={{ fontSize: "1.05rem", color: "var(--muted)", lineHeight: 1.6, margin: "0 0 1rem" }}>We list teachers who welcome new players and keep games in safe, public places. Join the Founding Ambassadors to be listed first in your city.</p>
        <a href="/ambassadors" style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", minHeight: 56, padding: "0 1.5rem", borderRadius: 14, background: "var(--pink)", color: "white", fontSize: "1.15rem", fontWeight: 800, textDecoration: "none" }}>Become an Ambassador</a>
      </div>
    </main>
  );
}
