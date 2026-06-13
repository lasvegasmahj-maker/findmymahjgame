"use client";

import { useState } from "react";

export default function NewsletterSignup({ dark = false }: { dark?: boolean }) {
  const [email, setEmail] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState<"idle" | "submitting" | "done" | "error">("idle");
  const [err, setErr] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    try {
      setState("submitting"); setErr("");
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, city: city || undefined }),
      });
      if (res.ok) { setState("done"); return; }
      const d = await res.json().catch(() => ({}));
      setErr(d.error || "Something went wrong. Please try again.");
      setState("error");
    } catch {
      setErr("We could not reach the server. Please check your connection and try again.");
      setState("error");
    }
  }

  const labelColor = dark ? "rgba(255,255,255,0.9)" : "var(--navy)";
  const noteColor = dark ? "rgba(255,255,255,0.7)" : "var(--muted)";

  if (state === "done") {
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
      <div style={{ display: "flex", gap: "0.6rem", flexWrap: "wrap" }}>
        <input
          id="nl-email"
          type="email"
          required
          placeholder="your@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="nl-input"
          style={{ flex: "1 1 220px", minHeight: 56, padding: "0 1rem", fontSize: "1.05rem", fontFamily: "'DM Sans', sans-serif" }}
        />
        <input
          id="nl-city"
          type="text"
          placeholder="Your city or ZIP (optional)"
          aria-label="Your city or ZIP, optional"
          value={city}
          onChange={(e) => setCity(e.target.value)}
          className="nl-input"
          style={{ flex: "1 1 160px", minHeight: 56, padding: "0 1rem", fontSize: "1.05rem", fontFamily: "'DM Sans', sans-serif" }}
        />
        <button type="submit" disabled={state === "submitting"} style={{ minHeight: 56, padding: "0 1.6rem", borderRadius: 12, border: "none", background: "var(--pink)", color: "#fff", fontWeight: 800, fontSize: "1.05rem", cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>
          {state === "submitting" ? "..." : "Subscribe"}
        </button>
      </div>
      {err && <p role="alert" style={{ color: dark ? "#ffd1e6" : "#dc2626", fontSize: "1rem", marginTop: "0.6rem" }}>{err}</p>}
      <p style={{ color: noteColor, fontSize: "0.9rem", margin: "0.8rem 0 0" }}>No spam. Unsubscribe anytime.</p>
    </form>
  );
}
