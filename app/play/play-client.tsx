"use client";

import { useState } from "react";

const TIMES = ["Morning", "Afternoon", "Evening"];
const labelStyle: React.CSSProperties = { fontSize: "1.25rem", fontWeight: 800, color: "var(--navy)", margin: "1.6rem 0 0.7rem" };
const fieldStyle: React.CSSProperties = { width: "100%", minHeight: 56, padding: "0.8rem 1rem", border: "2px solid var(--border)", borderRadius: 12, fontSize: "1.15rem", fontFamily: "'DM Sans', sans-serif", color: "var(--navy)", background: "white", outline: "none" };

export default function PlayClient() {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState("");
  const [timePref, setTimePref] = useState("");
  const [status, setStatus] = useState<"idle" | "submitting" | "done" | "error">("idle");
  const [err, setErr] = useState("");

  const ready = name.trim() && phone.trim() && city.trim();

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("submitting"); setErr("");
    const res = await fetch("/api/want-to-play", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, phone, city, timePref }),
    });
    if (res.ok) { setStatus("done"); return; }
    const d = await res.json().catch(() => ({}));
    setErr(d.error || "Something went wrong. Please try again.");
    setStatus("error");
  }

  if (status === "done") {
    return (
      <main style={{ maxWidth: 560, margin: "0 auto", padding: "3rem 1.2rem", textAlign: "center" }}>
        <div style={{ fontSize: "3rem" }}>🀄</div>
        <h1 style={{ fontSize: "1.9rem", color: "var(--navy)", fontFamily: "var(--font-playfair), 'Playfair Display', serif" }}>You&rsquo;re on the list!</h1>
        <p style={{ fontSize: "1.2rem", color: "var(--navy)", lineHeight: 1.6 }}>We will text you as soon as there is a game near {city}. Want one sooner? <a href="/start" style={{ color: "var(--pink)", fontWeight: 700 }}>Start your own table</a> and invite friends.</p>
        <a href="/" style={{ display: "inline-block", marginTop: "1.5rem", fontSize: "1.1rem", color: "var(--pink)", fontWeight: 700, textDecoration: "none" }}>&larr; Back home</a>
      </main>
    );
  }

  return (
    <main style={{ maxWidth: 560, margin: "0 auto", padding: "1.5rem 1.2rem 4rem" }}>
      <a href="/" style={{ fontSize: "1.05rem", color: "var(--pink)", fontWeight: 700, textDecoration: "none" }}>&larr; Back</a>
      <h1 style={{ fontSize: "2rem", color: "var(--navy)", margin: "0.8rem 0 0.3rem", fontFamily: "var(--font-playfair), 'Playfair Display', serif" }}>I Want to Play</h1>
      <p style={{ fontSize: "1.15rem", color: "var(--muted)", lineHeight: 1.5 }}>Tell us where you are. We will help you find a game.</p>

      <form onSubmit={submit}>
        <div style={labelStyle}>Your name</div>
        <input style={fieldStyle} placeholder="First name" value={name} onChange={(e) => setName(e.target.value)} />
        <div style={labelStyle}>Your mobile number</div>
        <input style={fieldStyle} type="tel" inputMode="tel" placeholder="So we can text you a game" value={phone} onChange={(e) => setPhone(e.target.value)} />
        <div style={labelStyle}>Your town or city</div>
        <input style={fieldStyle} placeholder="Where do you want to play?" value={city} onChange={(e) => setCity(e.target.value)} />
        <div style={labelStyle}>Best time? <span style={{ fontWeight: 400, color: "var(--muted)", fontSize: "1rem" }}>(optional)</span></div>
        <div style={{ display: "flex", gap: "0.6rem", flexWrap: "wrap" }}>
          {TIMES.map((t) => (
            <button key={t} type="button" onClick={() => setTimePref(timePref === t ? "" : t)} style={{
              minHeight: 54, padding: "0.6rem 1.1rem", borderRadius: 12, cursor: "pointer", fontSize: "1.1rem", fontWeight: 700, fontFamily: "'DM Sans', sans-serif",
              border: timePref === t ? "2.5px solid var(--pink)" : "2px solid var(--border)", background: timePref === t ? "var(--pink)" : "white", color: timePref === t ? "white" : "var(--navy)",
            }}>{t}</button>
          ))}
        </div>
        <p style={{ fontSize: "0.95rem", color: "var(--muted)", marginTop: "0.7rem" }}>We never show your number to anyone.</p>
        {err && <p style={{ color: "#dc2626", fontSize: "1.05rem", marginTop: "1rem" }}>{err}</p>}
        <button type="submit" disabled={!ready || status === "submitting"} style={{
          width: "100%", minHeight: 68, marginTop: "1.8rem", borderRadius: 16, border: "none",
          background: ready ? "var(--pink)" : "#d9b3cc", color: "white", fontSize: "1.4rem", fontWeight: 800,
          cursor: ready ? "pointer" : "not-allowed", fontFamily: "'DM Sans', sans-serif",
        }}>{status === "submitting" ? "Sending..." : "Find Me a Game"}</button>
      </form>
    </main>
  );
}
