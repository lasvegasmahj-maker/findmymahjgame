"use client";

import { useState } from "react";

const ROLES = ["Teacher", "Host", "Organizer", "Club leader", "Other"];
const REACH = ["Just a few (1-3)", "A small group (4-10)", "A class or club (10-30)", "A large network (30 or more)"];
const STATES = [
  "Alabama", "Alaska", "Arizona", "Arkansas", "California", "Colorado", "Connecticut",
  "Delaware", "Florida", "Georgia", "Hawaii", "Idaho", "Illinois", "Indiana", "Iowa",
  "Kansas", "Kentucky", "Louisiana", "Maine", "Maryland", "Massachusetts", "Michigan",
  "Minnesota", "Mississippi", "Missouri", "Montana", "Nebraska", "Nevada", "New Hampshire",
  "New Jersey", "New Mexico", "New York", "North Carolina", "North Dakota", "Ohio",
  "Oklahoma", "Oregon", "Pennsylvania", "Rhode Island", "South Carolina", "South Dakota",
  "Tennessee", "Texas", "Utah", "Vermont", "Virginia", "Washington", "Washington DC",
  "West Virginia", "Wisconsin", "Wyoming",
];

const labelStyle: React.CSSProperties = { fontSize: "1.2rem", fontWeight: 800, color: "var(--navy)", margin: "1.5rem 0 0.6rem" };
const fieldStyle: React.CSSProperties = { width: "100%", minHeight: 56, padding: "0.8rem 1rem", border: "2px solid var(--border)", borderRadius: 12, fontSize: "1.1rem", fontFamily: "'DM Sans', sans-serif", color: "var(--navy)", background: "white", outline: "none" };
const optional: React.CSSProperties = { fontWeight: 600, fontSize: "0.95rem", color: "var(--muted)" };

export default function AmbassadorForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [role, setRole] = useState("");
  const [reach, setReach] = useState("");
  const [why, setWhy] = useState("");
  const [status, setStatus] = useState<"idle" | "submitting" | "error" | "done">("idle");
  const [err, setErr] = useState("");

  const ready = name.trim() && email.trim() && city.trim() && state && role && why.trim();

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    try {      setStatus("submitting"); setErr("");
      const res = await fetch("/api/ambassadors/apply", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, phone, city, state, role, reach, why }),
      });
      if (res.ok) {
        setStatus("done");
        window.scrollTo({ top: 0, behavior: "smooth" });
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

  if (status === "done") {
    return (
      <div style={{ background: "rgba(46,201,92,0.1)", border: "2px solid var(--green)", borderRadius: 18, padding: "2rem 1.6rem", textAlign: "center", marginTop: "1.5rem" }}>
        <div style={{ fontSize: "1.5rem", fontWeight: 800, color: "#1a6e3a", marginBottom: "0.6rem" }}>Thank you for stepping up!</div>
        <p style={{ fontSize: "1.15rem", color: "var(--navy)", lineHeight: 1.6 }}>
          Your application is in. We sent a confirmation to <strong>{email}</strong> and a real person will reach out soon about becoming a Founding Ambassador.
        </p>
        <a href="/" style={{ display: "inline-block", marginTop: "1rem", color: "var(--pink)", fontWeight: 800, fontSize: "1.1rem", textDecoration: "none" }}>Back to home</a>
      </div>
    );
  }

  return (
    <form onSubmit={submit} style={{ marginTop: "0.5rem" }}>
      <div style={labelStyle}>Your name</div>
      <input style={fieldStyle} aria-label="Your name" placeholder="First and last name" value={name} onChange={(e) => setName(e.target.value)} />

      <div style={labelStyle}>Email</div>
      <input style={fieldStyle} type="email" aria-label="Email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} />

      <div style={labelStyle}>Phone <span style={optional}>(optional)</span></div>
      <input style={fieldStyle} type="tel" inputMode="tel" aria-label="Phone (optional)" placeholder="Mobile number" value={phone} onChange={(e) => setPhone(e.target.value)} />

      <div style={labelStyle}>City</div>
      <input style={fieldStyle} aria-label="City" placeholder="Your city or town" value={city} onChange={(e) => setCity(e.target.value)} />

      <div style={labelStyle}>State</div>
      <select style={fieldStyle} aria-label="State" value={state} onChange={(e) => setState(e.target.value)}>
        <option value="">Choose your state</option>
        {STATES.map((s) => <option key={s} value={s}>{s}</option>)}
      </select>

      <div style={labelStyle}>Your role</div>
      <select style={fieldStyle} aria-label="Your role" value={role} onChange={(e) => setRole(e.target.value)}>
        <option value="">Choose one</option>
        {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
      </select>

      <div style={labelStyle}>How many players can you reach? <span style={optional}>(optional)</span></div>
      <select style={fieldStyle} aria-label="How many players can you reach (optional)" value={reach} onChange={(e) => setReach(e.target.value)}>
        <option value="">Choose one</option>
        {REACH.map((r) => <option key={r} value={r}>{r}</option>)}
      </select>

      <div style={labelStyle}>Why do you want to help?</div>
      <textarea style={{ ...fieldStyle, minHeight: 120, resize: "vertical", paddingTop: "0.8rem", lineHeight: 1.5 }} aria-label="Why do you want to help?" placeholder="Tell us a little about how you bring players together." value={why} onChange={(e) => setWhy(e.target.value)} />

      {err && <p role="alert" style={{ color: "#dc2626", fontSize: "1.05rem", marginTop: "1rem" }}>{err}</p>}

      <button type="submit" disabled={!ready || status === "submitting"} style={{
        width: "100%", minHeight: 68, marginTop: "1.8rem", borderRadius: 16, border: "none",
        background: ready ? "var(--pink)" : "#d9b3cc", color: "white", fontSize: "1.35rem", fontWeight: 800,
        cursor: ready ? "pointer" : "not-allowed", fontFamily: "'DM Sans', sans-serif",
      }}>
        {status === "submitting" ? "Sending..." : "Apply to be an Ambassador"}
      </button>
      <p style={{ fontSize: "0.95rem", color: "var(--muted)", marginTop: "0.8rem", textAlign: "center" }}>We never share your phone number or email.</p>
    </form>
  );
}
