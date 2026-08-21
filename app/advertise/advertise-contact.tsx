"use client";

import { useState } from "react";

const input: React.CSSProperties = { width: "100%", minHeight: 52, padding: "0 1rem", border: "2px solid var(--border)", borderRadius: 12, fontSize: "16px", fontFamily: "'DM Sans', sans-serif", color: "var(--navy)", background: "white", boxSizing: "border-box" };
const label: React.CSSProperties = { display: "block", fontSize: "0.85rem", fontWeight: 800, color: "var(--navy)", marginBottom: "0.35rem" };

export default function AdvertiseContact() {
  const [form, setForm] = useState({ name: "", email: "", company: "", message: "" });
  const [status, setStatus] = useState<"idle" | "submitting" | "done" | "error">("idle");
  const [err, setErr] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("submitting"); setErr("");
    try {
      const res = await fetch("/api/advertise-inquiry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          company: form.company || undefined,
          interest: "Brand advertising / sponsorship",
          message: form.message || undefined,
        }),
      });
      if (res.ok) { setStatus("done"); return; }
      const d = await res.json().catch(() => ({}));
      setErr(d.error || "Something went wrong. Please try again."); setStatus("error");
    } catch {
      setErr("We could not reach the server. Please try again."); setStatus("error");
    }
  }

  if (status === "done") {
    return (
      <div style={{ background: "rgba(46,201,92,0.1)", border: "2px solid #2ec95c", borderRadius: 16, padding: "1.6rem", textAlign: "center", maxWidth: 520, margin: "0 auto" }}>
        <p style={{ fontSize: "1.1rem", color: "#1a6e3a", fontWeight: 800, lineHeight: 1.5, margin: 0 }}>Thank you. We received your inquiry and will be in touch with our media kit and options.</p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} style={{ background: "white", border: "2px solid var(--border)", borderRadius: 18, padding: "1.8rem 1.6rem", maxWidth: 520, margin: "0 auto", textAlign: "left" }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 220px), 1fr))", gap: "1rem" }}>
        <div>
          <label style={label} htmlFor="ad-name">Your name</label>
          <input id="ad-name" style={input} required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Jane Smith" />
        </div>
        <div>
          <label style={label} htmlFor="ad-email">Email</label>
          <input id="ad-email" style={input} type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="you@company.com" />
        </div>
      </div>
      <div style={{ marginTop: "1rem" }}>
        <label style={label} htmlFor="ad-company">Company / brand <span style={{ fontWeight: 400, color: "var(--muted)" }}>(optional)</span></label>
        <input id="ad-company" style={input} value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} placeholder="Your company" />
      </div>
      <div style={{ marginTop: "1rem" }}>
        <label style={label} htmlFor="ad-message">What are you hoping to do? <span style={{ fontWeight: 400, color: "var(--muted)" }}>(optional)</span></label>
        <textarea id="ad-message" value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} placeholder="Tell us about your brand, the audience you want to reach, and any areas or dates you have in mind." style={{ ...input, minHeight: 110, padding: "0.7rem 1rem", resize: "vertical" }} />
      </div>
      {status === "error" && <p role="alert" style={{ color: "#dc2626", fontSize: "1rem", marginTop: "0.8rem", marginBottom: 0 }}>{err}</p>}
      <button type="submit" disabled={status === "submitting"} style={{ width: "100%", minHeight: 56, marginTop: "1.3rem", borderRadius: 14, border: "none", background: "var(--pink)", color: "white", fontWeight: 800, fontSize: "1.1rem", cursor: status === "submitting" ? "not-allowed" : "pointer", fontFamily: "'DM Sans', sans-serif", opacity: status === "submitting" ? 0.7 : 1 }}>
        {status === "submitting" ? "Sending..." : "Get our media kit"}
      </button>
      <p style={{ fontSize: "0.82rem", color: "var(--muted)", textAlign: "center", marginTop: "0.8rem", marginBottom: 0 }}>We reply personally, usually within 1-2 business days.</p>
    </form>
  );
}
