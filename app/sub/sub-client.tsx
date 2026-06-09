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

export default function SubClient() {
  const [area, setArea] = useState("");
  const [day, setDay] = useState("");
  const [time, setTime] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [note, setNote] = useState("");
  const [status, setStatus] = useState<"idle" | "submitting" | "error" | "done">("idle");
  const [err, setErr] = useState("");
  const [count, setCount] = useState<number | null>(null);

  const ready = area.trim() && name.trim() && (phone.trim() || email.trim());

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("submitting"); setErr("");
    const res = await fetch("/api/sub", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ city: area, day, time, name, phone, email, note }),
    });
    if (res.ok) {
      const d = await res.json().catch(() => ({}));
      setCount(typeof d.notified === "number" ? d.notified : null);
      setStatus("done");
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      const d = await res.json().catch(() => ({}));
      setErr(d.error || "Something went wrong. Please try again.");
      setStatus("error");
    }
  }

  if (status === "done") {
    return (
      <main style={{ maxWidth: 560, margin: "0 auto", padding: "1.5rem 1.2rem 4rem" }}>
        <div style={{ background: "rgba(46,201,92,0.1)", border: "2px solid var(--green)", borderRadius: 18, padding: "2rem 1.6rem", textAlign: "center", marginTop: "1.5rem" }}>
          <div style={{ fontSize: "1.5rem", fontWeight: 800, color: "#1a6e3a", marginBottom: "0.6rem" }}>We are finding you a sub</div>
          <p style={{ fontSize: "1.15rem", color: "var(--navy)", lineHeight: 1.6 }}>
            {count && count > 0
              ? `We let ${count} nearby player${count !== 1 ? "s" : ""} know. Anyone who can fill in will reach out to you.`
              : "We sent your request to our team. We will help find a player near you and reach out."}
          </p>
          <p style={{ fontSize: "1rem", color: "var(--muted)", lineHeight: 1.6, marginTop: "0.8rem" }}>You will meet in a public place. We never share home addresses or phone numbers.</p>
          <a href="/" style={{ display: "inline-block", marginTop: "1rem", color: "var(--pink)", fontWeight: 800, fontSize: "1.1rem", textDecoration: "none" }}>Back to home</a>
        </div>
      </main>
    );
  }

  return (
    <main style={{ maxWidth: 560, margin: "0 auto", padding: "1.5rem 1.2rem 4rem" }}>
      <a href="/" style={{ fontSize: "1.05rem", color: "var(--pink)", fontWeight: 700, textDecoration: "none" }}>&larr; Home</a>
      <h1 style={{ fontSize: "2rem", color: "var(--navy)", margin: "0.8rem 0 0.3rem", fontFamily: "var(--font-playfair), 'Playfair Display', serif" }}>Need a Sub?</h1>
      <p style={{ fontSize: "1.15rem", color: "var(--muted)", lineHeight: 1.5 }}>Missing a player this week? Tell us where and when, and we will ask nearby players to fill in.</p>

      <form onSubmit={submit}>
        <div style={labelStyle}>Your area or ZIP code</div>
        <input style={fieldStyle} placeholder="e.g. Summerlin, Henderson, or 89135" value={area} onChange={(e) => setArea(e.target.value)} />

        <div style={labelStyle}>What day?</div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.6rem" }}>
          {DAYS.map((d) => <Chip key={d} active={day === d} onClick={() => setDay(d)}>{d}</Chip>)}
        </div>

        <div style={labelStyle}>What time?</div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.6rem" }}>
          {TIMES.map((t) => <Chip key={t} active={time === t} onClick={() => setTime(t)}>{t}</Chip>)}
        </div>

        <div style={labelStyle}>Your name</div>
        <input style={fieldStyle} placeholder="First name" value={name} onChange={(e) => setName(e.target.value)} />
        <div style={labelStyle}>How can a sub reach you?</div>
        <input style={fieldStyle} type="tel" inputMode="tel" placeholder="Mobile number" value={phone} onChange={(e) => setPhone(e.target.value)} />
        <input style={{ ...fieldStyle, marginTop: "0.7rem" }} type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
        <p style={{ fontSize: "0.95rem", color: "var(--muted)", marginTop: "0.5rem" }}>Add a phone, an email, or both. Players who can sub will use it to reach you. We never show it publicly.</p>

        <div style={labelStyle}>Anything to add? <span style={{ fontWeight: 600, fontSize: "0.95rem", color: "var(--muted)" }}>(optional)</span></div>
        <textarea style={{ ...fieldStyle, minHeight: 90, resize: "vertical", paddingTop: "0.8rem" }} placeholder="For example, the date, or beginners welcome." value={note} onChange={(e) => setNote(e.target.value)} />

        {err && <p style={{ color: "#dc2626", fontSize: "1.05rem", marginTop: "1rem" }}>{err}</p>}

        <button type="submit" disabled={!ready || status === "submitting"} style={{
          width: "100%", minHeight: 68, marginTop: "1.8rem", borderRadius: 16, border: "none",
          background: ready ? "var(--pink)" : "#d9b3cc", color: "white", fontSize: "1.35rem", fontWeight: 800,
          cursor: ready ? "pointer" : "not-allowed", fontFamily: "'DM Sans', sans-serif",
        }}>
          {status === "submitting" ? "Sending..." : "Find me a sub"}
        </button>
      </form>
    </main>
  );
}
