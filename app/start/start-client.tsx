"use client";

import { useState, useEffect } from "react";

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const TIMES = ["Morning", "Afternoon", "Evening"];

const labelStyle: React.CSSProperties = { fontSize: "1.25rem", fontWeight: 800, color: "var(--navy)", margin: "1.6rem 0 0.7rem" };
const fieldStyle: React.CSSProperties = { width: "100%", minHeight: 56, padding: "0.8rem 1rem", border: "2px solid var(--border)", borderRadius: 12, fontSize: "1.15rem", fontFamily: "'DM Sans', sans-serif", color: "var(--navy)", background: "white" };

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button type="button" aria-pressed={active ? "true" : "false"} onClick={onClick} style={{
      minHeight: 54, padding: "0.6rem 1.1rem", borderRadius: 12, cursor: "pointer",
      fontSize: "1.1rem", fontWeight: 700, fontFamily: "'DM Sans', sans-serif",
      border: active ? "2.5px solid var(--pink)" : "2px solid var(--border)",
      background: active ? "var(--pink)" : "white", color: active ? "white" : "var(--navy)",
    }}>{children}</button>
  );
}

export default function StartClient() {
  const [day, setDay] = useState("");
  const [time, setTime] = useState("");
  const [area, setArea] = useState("");
  const [skill, setSkill] = useState("anyone");
  const [hostName, setHostName] = useState("");
  const [hostPhone, setHostPhone] = useState("");
  const [hostEmail, setHostEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "submitting" | "error">("idle");
  const [err, setErr] = useState("");
  const [ref, setRef] = useState("");

  // Capture a community leader referral code from the link (e.g. /start?ref=FMM-LV-RUTH)
  // so the table they start is credited to them. Uses the existing referred_by field.
  useEffect(() => {
    try {
      const r = new URLSearchParams(window.location.search).get("ref");
      if (r) setRef(r.slice(0, 40));
    } catch { /* ignore */ }
  }, []);

  const ready = day && time && area.trim() && hostName.trim() && (hostPhone.trim() || hostEmail.trim());

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("submitting"); setErr("");
    try {
      const res = await fetch("/api/tables/create", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ day, time, city: area, skill, hostName, hostPhone, hostEmail, referredBy: ref || undefined }),
      });
      if (res.ok) {
        const { shareCode } = await res.json();
        window.location.href = `/t/${shareCode}?created=1`;
      } else {
        const d = await res.json().catch(() => ({}));
        setErr(d.error || "Something went wrong. Please try again.");
        setStatus("error");
      }
    } catch {
      setErr("We could not reach the server. Please check your connection and try again.");
      setStatus("error");
    }
  }

  return (
    <main style={{ maxWidth: 560, margin: "0 auto", padding: "1.5rem 1.2rem 4rem" }}>
      <a href="/" style={{ fontSize: "1.05rem", color: "var(--pink-text)", fontWeight: 700, textDecoration: "none" }}>&larr; Back</a>
      <h1 style={{ fontSize: "2rem", color: "var(--navy)", margin: "0.8rem 0 0.3rem", fontFamily: "var(--font-playfair), 'Playfair Display', serif" }}>Start a Table</h1>
      <p style={{ fontSize: "1.15rem", color: "var(--muted)", lineHeight: 1.5 }}>Pick a day and time, and your area. We will help you find players nearby. It is always free for players.</p>

      <div style={{ background: "rgba(46,201,92,0.1)", border: "2px solid #2ec95c", borderRadius: 14, padding: "1rem 1.2rem", margin: "1.2rem 0 0.5rem" }}>
        <div style={{ fontSize: "1.05rem", color: "#1a6e3a", fontWeight: 700, lineHeight: 1.5 }}>For safety, we recommend new groups meet in public places for their first game. We&rsquo;ll suggest spots after your table fills.
        </div>
      </div>

      {ref && (
        <div style={{ background: "rgba(245,200,66,0.18)", border: "2px solid var(--gold)", borderRadius: 14, padding: "0.8rem 1.1rem", margin: "0.6rem 0" }}>
          <div style={{ fontSize: "1.05rem", color: "#8a6d00", fontWeight: 700, lineHeight: 1.5 }}>You came from a local community leader invite. We will credit your table to them, thank you for joining.</div>
        </div>
      )}

      <form onSubmit={submit}>
        <div style={labelStyle}>What day?</div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.6rem" }}>
          {DAYS.map((d) => <Chip key={d} active={day === d} onClick={() => setDay(d)}>{d}</Chip>)}
        </div>

        <div style={labelStyle}>What time?</div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.6rem" }}>
          {TIMES.map((t) => <Chip key={t} active={time === t} onClick={() => setTime(t)}>{t}</Chip>)}
        </div>

        <div style={labelStyle}>Your area or ZIP code</div>
        <input style={fieldStyle} aria-label="Your area or ZIP code" placeholder="e.g. Summerlin, Henderson, or 89135" value={area} onChange={(e) => setArea(e.target.value)} />
        <p style={{ fontSize: "0.95rem", color: "var(--muted)", marginTop: "0.5rem" }}>We match you with players in your area. You&rsquo;ll choose a public place to meet after your table fills, no home address needed.</p>

        <div style={labelStyle}>Who can join?</div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.6rem" }}>
          <Chip active={skill === "anyone"} onClick={() => setSkill("anyone")}>Anyone</Chip>
          <Chip active={skill === "beginner"} onClick={() => setSkill("beginner")}>Beginners welcome</Chip>
          <Chip active={skill === "experienced"} onClick={() => setSkill("experienced")}>Experienced</Chip>
        </div>

        <div style={labelStyle}>Your name</div>
        <input style={fieldStyle} aria-label="Your first name" placeholder="First name" value={hostName} onChange={(e) => setHostName(e.target.value)} />
        <div style={labelStyle}>How can we reach you?</div>
        <input style={fieldStyle} type="tel" inputMode="tel" aria-label="Mobile number" placeholder="Mobile number" value={hostPhone} onChange={(e) => setHostPhone(e.target.value)} />
        <input style={{ ...fieldStyle, marginTop: "0.7rem" }} type="email" aria-label="Email" placeholder="Email" value={hostEmail} onChange={(e) => setHostEmail(e.target.value)} />
        <p style={{ fontSize: "0.95rem", color: "var(--muted)", marginTop: "0.5rem" }}>Add a phone, an email, or both, so we can reach you when players join. We never show it to anyone.</p>

        {err && <p role="alert" style={{ color: "#dc2626", fontSize: "1.05rem", marginTop: "1rem" }}>{err}</p>}

        <button type="submit" disabled={!ready || status === "submitting"} style={{
          width: "100%", minHeight: 68, marginTop: "1.8rem", borderRadius: 16, border: "none",
          background: ready ? "var(--pink)" : "#d9b3cc", color: "white", fontSize: "1.4rem", fontWeight: 800,
          cursor: ready ? "pointer" : "not-allowed", fontFamily: "'DM Sans', sans-serif",
        }}>
          {status === "submitting" ? "Creating..." : "Create My Table"}
        </button>
        {!ready && status !== "submitting" && (
          <p style={{ fontSize: "1rem", color: "var(--muted)", textAlign: "center", marginTop: "0.7rem" }}>
            To finish: {[!day && "pick a day", !time && "pick a time", !area.trim() && "add your area", !hostName.trim() && "add your name", !(hostPhone.trim() || hostEmail.trim()) && "add a phone or email"].filter(Boolean).join(", ")}.
          </p>
        )}
      </form>
    </main>
  );
}
