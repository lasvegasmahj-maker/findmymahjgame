"use client";

import { useState } from "react";

type Props = {
  token: string;
  table: string;
  listing: Record<string, string | null>;
  fields: { key: string; label: string; long?: boolean }[];
};

const field: React.CSSProperties = { width: "100%", minHeight: 48, padding: "0.7rem 0.9rem", border: "2px solid var(--border)", borderRadius: 10, fontSize: "1rem", fontFamily: "'DM Sans', sans-serif", color: "var(--navy)", background: "white" };
const label: React.CSSProperties = { display: "block", fontSize: "0.95rem", fontWeight: 700, color: "var(--navy)", margin: "1rem 0 0.35rem" };

export default function ClaimForm({ token, table, listing, fields }: Props) {
  const [form, setForm] = useState<Record<string, string>>(
    Object.fromEntries(fields.map((f) => [f.key, listing[f.key] || ""]))
  );
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "submitting" | "done" | "error">("idle");
  const [err, setErr] = useState("");
  const [edits, setEdits] = useState(0);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("submitting"); setErr("");
    try {
      const res = await fetch("/api/claim", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, table, email, ...form }),
      });
      const d = await res.json().catch(() => ({}));
      if (res.ok) { setEdits(d.edits || 0); setStatus("done"); return; }
      setErr(d.error || "Something went wrong. Please try again.");
      setStatus("error");
    } catch {
      setErr("We could not reach the server. Please check your connection and try again.");
      setStatus("error");
    }
  }

  if (status === "done") {
    return (
      <div style={{ background: "rgba(46,201,92,0.1)", border: "2px solid #2ec95c", borderRadius: 14, padding: "1.6rem", textAlign: "center" }}>
        <div style={{ fontSize: "1.4rem", fontWeight: 800, color: "var(--green-dark, #1a6e3a)", marginBottom: "0.5rem" }}>This listing is yours.</div>
        <p style={{ fontSize: "1.05rem", color: "var(--navy)", lineHeight: 1.6, margin: 0 }}>
          {edits > 0
            ? `We received your ${edits} update${edits === 1 ? "" : "s"}. A real person reviews every change, usually within a day, and we will email you when it is live.`
            : "Your listing is confirmed active. Any time you want to change something, just use this same link."}
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={submit}>
      {fields.map((f) => (
        <div key={f.key}>
          <label htmlFor={`claim-${f.key}`} style={label}>{f.label}</label>
          {f.long ? (
            <textarea id={`claim-${f.key}`} value={form[f.key]} onChange={(e) => setForm({ ...form, [f.key]: e.target.value })} style={{ ...field, minHeight: 100 }} />
          ) : (
            <input id={`claim-${f.key}`} value={form[f.key]} onChange={(e) => setForm({ ...form, [f.key]: e.target.value })} style={field} />
          )}
        </div>
      ))}
      <label htmlFor="claim-email" style={label}>Your email (so we can confirm changes with you)</label>
      <input id="claim-email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} style={field} />
      {err && <p role="alert" style={{ color: "#dc2626", fontSize: "1rem", marginTop: "0.9rem" }}>{err}</p>}
      <button type="submit" disabled={status === "submitting"} style={{ width: "100%", minHeight: 56, marginTop: "1.4rem", borderRadius: 12, border: "none", background: "var(--pink)", color: "white", fontWeight: 800, fontSize: "1.15rem", cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>
        {status === "submitting" ? "Saving..." : "Confirm my listing"}
      </button>
      <p style={{ fontSize: "0.9rem", color: "var(--muted)", marginTop: "0.8rem", lineHeight: 1.5 }}>
        Changes are reviewed by a real person before they appear. The email you enter here, so we can reach you, is never shown publicly. Only the public email you choose above appears on your listing.
      </p>
    </form>
  );
}
