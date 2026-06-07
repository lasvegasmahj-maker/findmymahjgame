"use client";

import { useState } from "react";

const fieldStyle: React.CSSProperties = { width: "100%", minHeight: 56, padding: "0.8rem 1rem", border: "2px solid var(--border)", borderRadius: 12, fontSize: "1.15rem", fontFamily: "'DM Sans', sans-serif", color: "var(--navy)", background: "white", outline: "none", marginBottom: "0.7rem" };

export default function ClaimClient({ shareCode }: { shareCode: string }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [status, setStatus] = useState<"idle" | "submitting" | "done" | "error" | "full">("idle");
  const [err, setErr] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("submitting"); setErr("");
    const res = await fetch("/api/tables/claim", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ shareCode, name, phone }),
    });
    if (res.ok) { setStatus("done"); return; }
    if (res.status === 409) { setStatus("full"); return; }
    const d = await res.json().catch(() => ({}));
    setErr(d.error || "Something went wrong. Please try again.");
    setStatus("error");
  }

  if (status === "done") {
    return (
      <div style={{ textAlign: "center", padding: "1rem 0" }}>
        <div style={{ fontSize: "2.4rem" }}>✅</div>
        <div style={{ fontSize: "1.4rem", fontWeight: 800, color: "#1a9648" }}>You&rsquo;re in!</div>
        <p style={{ fontSize: "1.1rem", color: "var(--navy)", lineHeight: 1.5 }}>We just saved your seat. The host will be in touch with the details.</p>
      </div>
    );
  }
  if (status === "full") {
    return <p style={{ fontSize: "1.15rem", color: "var(--navy)" }}>This table just filled up. Try another, or <a href="/play" style={{ color: "var(--pink)", fontWeight: 700 }}>tell us you want to play</a> and we&rsquo;ll find you one.</p>;
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
      <p style={{ fontSize: "0.95rem", color: "var(--muted)", margin: "0 0 0.8rem" }}>We text you the details. Your number is never shown to anyone.</p>
      {err && <p style={{ color: "#dc2626", fontSize: "1.05rem" }}>{err}</p>}
      <button type="submit" disabled={!name.trim() || !phone.trim() || status === "submitting"} style={{
        width: "100%", minHeight: 68, borderRadius: 16, border: "none",
        background: name.trim() && phone.trim() ? "var(--pink)" : "#d9b3cc", color: "white",
        fontSize: "1.4rem", fontWeight: 800, cursor: "pointer", fontFamily: "'DM Sans', sans-serif",
      }}>{status === "submitting" ? "Saving..." : "Yes, I'm in!"}</button>
    </form>
  );
}
