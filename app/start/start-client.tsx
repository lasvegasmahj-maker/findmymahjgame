"use client";

import { useState } from "react";

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const TIMES = ["Morning", "Afternoon", "Evening"];

const labelStyle: React.CSSProperties = { fontSize: "1.25rem", fontWeight: 800, color: "var(--navy)", margin: "1.6rem 0 0.7rem" };
const fieldStyle: React.CSSProperties = { width: "100%", minHeight: 56, padding: "0.8rem 1rem", border: "2px solid var(--border)", borderRadius: 12, fontSize: "1.15rem", fontFamily: "'DM Sans', sans-serif", color: "var(--navy)", background: "white", outline: "none" };

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button type="button" onClick={onClick} style={{
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
  const [venueType, setVenueType] = useState("public");
  const [venueName, setVenueName] = useState("");
  const [city, setCity] = useState("");
  const [skill, setSkill] = useState("anyone");
  const [hostName, setHostName] = useState("");
  const [hostPhone, setHostPhone] = useState("");
  const [status, setStatus] = useState<"idle" | "submitting" | "error">("idle");
  const [err, setErr] = useState("");

  const ready = day && time && hostName.trim() && hostPhone.trim();

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("submitting"); setErr("");
    const res = await fetch("/api/tables/create", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ day, time, venueType, venueName, city, skill, hostName, hostPhone }),
    });
    if (res.ok) {
      const { shareCode } = await res.json();
      window.location.href = `/t/${shareCode}?created=1`;
    } else {
      const d = await res.json().catch(() => ({}));
      setErr(d.error || "Something went wrong. Please try again.");
      setStatus("error");
    }
  }

  return (
    <main style={{ maxWidth: 560, margin: "0 auto", padding: "1.5rem 1.2rem 4rem" }}>
      <a href="/" style={{ fontSize: "1.05rem", color: "var(--pink)", fontWeight: 700, textDecoration: "none" }}>&larr; Back</a>
      <h1 style={{ fontSize: "2rem", color: "var(--navy)", margin: "0.8rem 0 0.3rem", fontFamily: "var(--font-playfair), 'Playfair Display', serif" }}>Start a Table</h1>
      <p style={{ fontSize: "1.15rem", color: "var(--muted)", lineHeight: 1.5 }}>Pick a day and time. We will help you find players.</p>

      <form onSubmit={submit}>
        <div style={labelStyle}>What day?</div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.6rem" }}>
          {DAYS.map((d) => <Chip key={d} active={day === d} onClick={() => setDay(d)}>{d}</Chip>)}
        </div>

        <div style={labelStyle}>What time?</div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.6rem" }}>
          {TIMES.map((t) => <Chip key={t} active={time === t} onClick={() => setTime(t)}>{t}</Chip>)}
        </div>

        <div style={labelStyle}>Where?</div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.6rem" }}>
          <Chip active={venueType === "public"} onClick={() => setVenueType("public")}>A public place</Chip>
          <Chip active={venueType === "home"} onClick={() => setVenueType("home")}>My home (invite only)</Chip>
        </div>
        <input style={{ ...fieldStyle, marginTop: "0.7rem" }} placeholder={venueType === "home" ? "Neighborhood (not your address)" : "Place name, e.g. Summerlin Library"} value={venueName} onChange={(e) => setVenueName(e.target.value)} />
        <input style={{ ...fieldStyle, marginTop: "0.7rem" }} placeholder="Town or city" value={city} onChange={(e) => setCity(e.target.value)} />

        <div style={labelStyle}>Who can join?</div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.6rem" }}>
          <Chip active={skill === "anyone"} onClick={() => setSkill("anyone")}>Anyone</Chip>
          <Chip active={skill === "beginner"} onClick={() => setSkill("beginner")}>Beginners welcome</Chip>
          <Chip active={skill === "experienced"} onClick={() => setSkill("experienced")}>Experienced</Chip>
        </div>

        <div style={labelStyle}>Your name</div>
        <input style={fieldStyle} placeholder="First name" value={hostName} onChange={(e) => setHostName(e.target.value)} />
        <div style={labelStyle}>Your mobile number</div>
        <input style={fieldStyle} type="tel" inputMode="tel" placeholder="So we can text you when players join" value={hostPhone} onChange={(e) => setHostPhone(e.target.value)} />
        <p style={{ fontSize: "0.95rem", color: "var(--muted)", marginTop: "0.5rem" }}>We never show your number to anyone.</p>

        {err && <p style={{ color: "#dc2626", fontSize: "1.05rem", marginTop: "1rem" }}>{err}</p>}

        <button type="submit" disabled={!ready || status === "submitting"} style={{
          width: "100%", minHeight: 68, marginTop: "1.8rem", borderRadius: 16, border: "none",
          background: ready ? "var(--pink)" : "#d9b3cc", color: "white", fontSize: "1.4rem", fontWeight: 800,
          cursor: ready ? "pointer" : "not-allowed", fontFamily: "'DM Sans', sans-serif",
        }}>
          {status === "submitting" ? "Creating..." : "Create My Table"}
        </button>
      </form>
    </main>
  );
}
