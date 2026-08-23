"use client";

import { useState } from "react";

// Primary conversion path when a discovery page has no inventory yet: capture a
// name (optional), email (required), and area (state required, city optional) so
// we can recruit supply, personalize follow-up, and notify the player when games
// appear near them.
export default function NotifyMe({
  defaultCity = "",
  defaultState = "",
  heading = "Notify me when Mahjong comes to my area",
}: {
  defaultCity?: string;
  defaultState?: string;
  heading?: string;
}) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [city, setCity] = useState(defaultCity);
  const [state, setState] = useState(defaultState);
  const [status, setStatus] = useState<"idle" | "submitting" | "done" | "error">("idle");
  const [err, setErr] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("submitting");
    setErr("");
    try {
      const res = await fetch("/api/notify-area", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, city, state }),
      });
      if (res.ok) {
        setStatus("done");
        return;
      }
      const d = await res.json().catch(() => ({}));
      setErr(d.error || "Something went wrong. Please try again.");
      setStatus("error");
    } catch {
      setErr("We could not reach the server. Please try again.");
      setStatus("error");
    }
  }

  const input: React.CSSProperties = { minHeight: 52, padding: "0 1rem", border: "2px solid var(--border)", borderRadius: 12, fontSize: "16px", fontFamily: "'DM Sans', sans-serif", color: "var(--navy)", width: "100%" };

  if (status === "done") {
    return (
      <div style={{ background: "rgba(46,201,92,0.1)", border: "2px solid #2ec95c", borderRadius: 16, padding: "1.4rem", textAlign: "center", maxWidth: 460, margin: "0 auto" }}>
        <p style={{ fontSize: "1.1rem", color: "#1a6e3a", fontWeight: 800, lineHeight: 1.5, margin: 0 }}>
          You&rsquo;re on the list{name ? `, ${name}` : ""}. We will email you the moment Mahjong opens up near {city || "you"}.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} style={{ background: "white", border: "2px solid var(--border)", borderRadius: 16, padding: "1.4rem 1.5rem", maxWidth: 460, margin: "0 auto", textAlign: "left" }}>
      <div style={{ fontSize: "1.1rem", fontWeight: 800, color: "var(--navy)", marginBottom: "0.8rem", textAlign: "center" }}>{heading}</div>
      <label htmlFor="nm-name" style={{ position: "absolute", width: 1, height: 1, overflow: "hidden", clip: "rect(0 0 0 0)" }}>Your name (optional)</label>
      <input id="nm-name" aria-label="Your name (optional)" placeholder="Your name (optional)" value={name} onChange={(e) => setName(e.target.value)} style={{ ...input, marginBottom: "0.7rem" }} />
      <label htmlFor="nm-email" style={{ position: "absolute", width: 1, height: 1, overflow: "hidden", clip: "rect(0 0 0 0)" }}>Your email</label>
      <input id="nm-email" type="email" required aria-label="Your email" placeholder="Your email" value={email} onChange={(e) => setEmail(e.target.value)} style={{ ...input, marginBottom: "0.7rem" }} />
      <div style={{ display: "flex", gap: "0.6rem", marginBottom: "0.9rem" }}>
        <span style={{ flex: 2 }}>
          <label htmlFor="nm-city" style={{ position: "absolute", width: 1, height: 1, overflow: "hidden", clip: "rect(0 0 0 0)" }}>Your city (optional)</label>
          <input id="nm-city" aria-label="Your city (optional)" placeholder="City (optional)" value={city} onChange={(e) => setCity(e.target.value)} style={input} />
        </span>
        <span style={{ flex: 1 }}>
          <label htmlFor="nm-state" style={{ position: "absolute", width: 1, height: 1, overflow: "hidden", clip: "rect(0 0 0 0)" }}>Your state</label>
          <input id="nm-state" required aria-label="Your state" placeholder="State" value={state} onChange={(e) => setState(e.target.value)} style={input} />
        </span>
      </div>
      <button type="submit" disabled={status === "submitting"} style={{ width: "100%", minHeight: 56, borderRadius: 14, border: "none", background: status === "submitting" ? "#d9b3cc" : "var(--pink)", color: "white", fontWeight: 800, fontSize: "1.1rem", cursor: status === "submitting" ? "not-allowed" : "pointer", fontFamily: "'DM Sans', sans-serif" }}>
        {status === "submitting" ? "Adding you..." : "Notify me"}
      </button>
      {status === "error" && <p role="alert" style={{ color: "#dc2626", fontSize: "1rem", textAlign: "center", marginTop: "0.7rem", marginBottom: 0 }}>{err}</p>}
      <p style={{ fontSize: "0.85rem", color: "var(--muted)", textAlign: "center", marginTop: "0.7rem", marginBottom: 0 }}>Free. Your email is never shown publicly or sold. We keep your name and email so we can tell you when games open up near you.</p>
    </form>
  );
}
