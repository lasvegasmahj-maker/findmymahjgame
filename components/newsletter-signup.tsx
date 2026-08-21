"use client";

import { useState } from "react";
import { STATES } from "@/lib/states-data";

const STATE_OPTIONS = Object.values(STATES).sort((a, b) => a.name.localeCompare(b.name));

export default function NewsletterSignup({ dark = false }: { dark?: boolean }) {
  const [email, setEmail] = useState("");
  const [usState, setUsState] = useState("");
  const [city, setCity] = useState("");
  const [status, setStatus] = useState<"idle" | "submitting" | "done" | "error">("idle");
  const [err, setErr] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    try {
      setStatus("submitting"); setErr("");
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, state: usState, city: city || undefined }),
      });
      if (res.ok) { setStatus("done"); return; }
      const d = await res.json().catch(() => ({}));
      setErr(d.error || "Something went wrong. Please try again.");
      setStatus("error");
    } catch {
      setErr("We could not reach the server. Please check your connection and try again.");
      setStatus("error");
    }
  }

  const labelColor = dark ? "rgba(255,255,255,0.9)" : "var(--navy)";
  const noteColor = dark ? "rgba(255,255,255,0.7)" : "var(--muted)";
  const fieldStyle: React.CSSProperties = { minHeight: 56, padding: "0 1rem", fontSize: "1.05rem", fontFamily: "'DM Sans', sans-serif" };

  if (status === "done") {
    return (
      <p style={{ color: labelColor, fontSize: "1.1rem", margin: 0, lineHeight: 1.5 }}>
        Thank you. You are on the list. Look out for Find My Mahj Weekly in your inbox.
      </p>
    );
  }

  return (
    <form onSubmit={submit} style={{ maxWidth: 460, margin: "0 auto" }}>
      <label htmlFor="nl-email" style={{ display: "block", textAlign: "left", color: labelColor, fontSize: "0.95rem", marginBottom: "0.4rem", fontWeight: 600 }}>
        Email address
      </label>
      <input
        id="nl-email"
        type="email"
        required
        placeholder="your@email.com"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="nl-input"
        style={{ ...fieldStyle, width: "100%", boxSizing: "border-box", marginBottom: "0.8rem" }}
      />
      <label htmlFor="nl-state" style={{ display: "block", textAlign: "left", color: labelColor, fontSize: "0.95rem", marginBottom: "0.4rem", fontWeight: 600 }}>
        Your state <span style={{ fontWeight: 400, color: noteColor }}>(so we send games near you)</span>
      </label>
      <div style={{ display: "flex", gap: "0.6rem", flexWrap: "wrap" }}>
        <select
          id="nl-state"
          required
          value={usState}
          onChange={(e) => setUsState(e.target.value)}
          className="nl-input"
          style={{ ...fieldStyle, flex: "1 1 160px" }}
        >
          <option value="">Select your state...</option>
          {STATE_OPTIONS.map((s) => <option key={s.abbr} value={s.abbr}>{s.name}</option>)}
        </select>
        <input
          id="nl-city"
          type="text"
          placeholder="City (optional)"
          aria-label="Your city, optional"
          value={city}
          onChange={(e) => setCity(e.target.value)}
          className="nl-input"
          style={{ ...fieldStyle, flex: "1 1 140px" }}
        />
      </div>
      <button type="submit" disabled={status === "submitting"} style={{ width: "100%", minHeight: 56, marginTop: "0.8rem", borderRadius: 12, border: "none", background: "var(--pink)", color: "#fff", fontWeight: 800, fontSize: "1.05rem", cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>
        {status === "submitting" ? "..." : "Subscribe"}
      </button>
      {err && <p role="alert" style={{ color: dark ? "#ffd1e6" : "#dc2626", fontSize: "1rem", marginTop: "0.6rem" }}>{err}</p>}
      <p style={{ color: noteColor, fontSize: "0.9rem", margin: "0.8rem 0 0" }}>No spam. Unsubscribe anytime.</p>
    </form>
  );
}
