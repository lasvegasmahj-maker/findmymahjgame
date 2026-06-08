"use client";

import { useState } from "react";
import SeatDots from "@/components/seat-dots";
import AddToCalendar from "@/components/add-to-calendar";

const fieldStyle: React.CSSProperties = { width: "100%", minHeight: 56, padding: "0.8rem 1rem", border: "2px solid var(--border)", borderRadius: 12, fontSize: "1.15rem", fontFamily: "'DM Sans', sans-serif", color: "var(--navy)", background: "white", outline: "none", marginBottom: "0.7rem" };

export default function ClaimClient({
  shareCode, title, dayOfWeek, timeOfDay, place, filled, total,
}: {
  shareCode: string;
  title: string;
  dayOfWeek: string | null;
  timeOfDay: string | null;
  place?: string | null;
  filled: number;
  total: number;
}) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "submitting" | "done" | "error" | "full">("idle");
  const [err, setErr] = useState("");

  const ready = name.trim() && (phone.trim() || email.trim());

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("submitting"); setErr("");
    const res = await fetch("/api/tables/claim", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ shareCode, name, phone, email }),
    });
    if (res.ok) { setStatus("done"); return; }
    if (res.status === 409) { setStatus("full"); return; }
    const d = await res.json().catch(() => ({}));
    setErr(d.error || "Something went wrong. Please try again.");
    setStatus("error");
  }

  if (status === "done") {
    return (
      <div style={{ textAlign: "center", padding: "0.5rem 0" }}>
        <div style={{ fontSize: "2.4rem" }}>✅</div>
        <div style={{ fontSize: "1.5rem", fontWeight: 800, color: "#1a9648", marginBottom: "0.8rem" }}>You&rsquo;re in!</div>
        <div style={{ display: "inline-block" }}><SeatDots filled={filled + 1} total={total} you /></div>
        <p style={{ fontSize: "1.1rem", color: "var(--navy)", lineHeight: 1.5, margin: "0.8rem 0 1rem" }}>We saved your seat. The host will be in touch with the details.</p>
        <div style={{ maxWidth: 320, margin: "0 auto" }}>
          <AddToCalendar title={title} dayOfWeek={dayOfWeek} timeOfDay={timeOfDay} place={place} />
        </div>
      </div>
    );
  }
  if (status === "full") {
    return <p style={{ fontSize: "1.15rem", color: "var(--navy)" }}>This table just filled up. <a href="/play" style={{ color: "var(--pink)", fontWeight: 700 }}>Tell us you want to play</a> and we&rsquo;ll find you another.</p>;
  }

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} style={{
        width: "100%", minHeight: 68, borderRadius: 16, border: "none",
        background: "var(--pink)", color: "white", fontSize: "1.4rem", fontWeight: 800,
        cursor: "pointer", fontFamily: "'DM Sans', sans-serif",
      }}>Claim a Seat</button>
    );
  }

  return (
    <form onSubmit={submit}>
      <input style={fieldStyle} placeholder="First name" value={name} onChange={(e) => setName(e.target.value)} autoFocus />
      <input style={fieldStyle} type="tel" inputMode="tel" placeholder="Mobile number" value={phone} onChange={(e) => setPhone(e.target.value)} />
      <input style={fieldStyle} type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
      <p style={{ fontSize: "0.95rem", color: "var(--muted)", margin: "0 0 0.8rem" }}>Add a phone, an email, or both, so we can reach you. We never show it to anyone.</p>
      {err && <p style={{ color: "#dc2626", fontSize: "1.05rem" }}>{err}</p>}
      <button type="submit" disabled={!ready || status === "submitting"} style={{
        width: "100%", minHeight: 68, borderRadius: 16, border: "none",
        background: ready ? "var(--pink)" : "#d9b3cc", color: "white",
        fontSize: "1.4rem", fontWeight: 800, cursor: ready ? "pointer" : "not-allowed", fontFamily: "'DM Sans', sans-serif",
      }}>{status === "submitting" ? "Saving..." : "Yes, I'm in!"}</button>
    </form>
  );
}
