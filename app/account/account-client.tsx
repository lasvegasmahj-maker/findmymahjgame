"use client";

import { useEffect, useState } from "react";

type Me = { role: string; displayName: string | null; qa: boolean };

const card: React.CSSProperties = { background: "var(--bg)", border: "1px solid var(--border)", borderRadius: 12, padding: "1.4rem" };
const input: React.CSSProperties = { width: "100%", minHeight: 48, padding: "0 1rem", border: "2px solid var(--border)", borderRadius: 10, fontSize: "1rem", fontFamily: "'DM Sans', sans-serif", color: "var(--navy)" };
const primaryBtn: React.CSSProperties = { background: "var(--pink)", color: "white", border: "none", borderRadius: 8, padding: "0.8rem 1.5rem", fontWeight: 700, fontSize: "0.95rem", cursor: "pointer", fontFamily: "'DM Sans', sans-serif" };
const quietBtn: React.CSSProperties = { background: "var(--bg)", border: "1px solid var(--border)", borderRadius: 8, padding: "0.8rem 1.5rem", fontWeight: 600, fontSize: "0.9rem", cursor: "pointer", fontFamily: "'DM Sans', sans-serif", color: "var(--navy)" };

export default function AccountClient() {
  const [me, setMe] = useState<Me | null>(null);
  const [checked, setChecked] = useState(false);
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [name, setName] = useState("");

  useEffect(() => {
    fetch("/api/auth/me", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => {
        if (j?.ok) {
          setMe(j);
          setName(j.displayName || "");
        }
      })
      .catch(() => {})
      .finally(() => setChecked(true));
  }, []);

  async function post(url: string, body: unknown): Promise<{ ok: boolean; j: { error?: string; message?: string; displayName?: string } }> {
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const r = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) setError(j.error || "Something went wrong. Please try again.");
      return { ok: r.ok, j };
    } catch {
      setError("Something went wrong. Please check your connection and try again.");
      return { ok: false, j: {} };
    } finally {
      setBusy(false);
    }
  }

  async function signIn(e: React.FormEvent) {
    e.preventDefault();
    const { ok, j } = await post("/api/auth/signin", { email });
    if (ok) setNotice(j.message || "Check your email for a sign-in link.");
  }

  async function saveName(e: React.FormEvent) {
    e.preventDefault();
    const { ok, j } = await post("/api/account", { action: "set_display_name", display_name: name });
    if (ok) {
      setNotice("Name saved.");
      if (j.displayName) setName(j.displayName);
    }
  }

  async function signOut() {
    await post("/api/auth/signout", {});
    window.location.href = "/";
  }

  async function deactivate() {
    if (!window.confirm("Deactivate your account? You can come back any time by signing in again.")) return;
    const { ok } = await post("/api/account", { action: "deactivate" });
    if (ok) window.location.href = "/";
  }

  async function requestDeletion() {
    if (!window.confirm("Ask us to permanently delete your account and data? We confirm by email when it is done.")) return;
    const { ok, j } = await post("/api/account", { action: "request_deletion" });
    if (ok) setNotice(j.message || "We received your deletion request.");
  }

  if (!checked) return <p style={{ color: "var(--muted)", textAlign: "center" }}>Loading...</p>;

  if (!me) {
    return (
      <div>
        <p style={{ color: "var(--muted)", textAlign: "center", margin: "0 0 1.6rem" }}>
          Sign in with your email. No password to remember; we send you a one-tap link.
        </p>
        <form onSubmit={signIn} style={card}>
          <label htmlFor="acct-email" style={{ display: "block", fontWeight: 700, color: "var(--navy)", fontSize: "0.9rem", marginBottom: "0.4rem" }}>
            Email address
          </label>
          <input id="acct-email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" style={input} maxLength={254} />
          <button type="submit" disabled={busy} style={{ ...primaryBtn, width: "100%", marginTop: "0.9rem", opacity: busy ? 0.7 : 1 }}>
            {busy ? "Sending..." : "Email me a sign-in link"}
          </button>
          {notice && <p style={{ color: "#1a6e3a", fontWeight: 700, marginTop: "0.9rem", marginBottom: 0 }}>{notice}</p>}
          {error && <p style={{ color: "#dc2626", fontWeight: 600, marginTop: "0.9rem", marginBottom: 0 }}>{error}</p>}
          <p style={{ fontSize: "0.78rem", color: "var(--muted)", marginTop: "0.9rem", marginBottom: 0 }}>
            Browsing and search never need an account. We keep your email to sign you in and never show it publicly.
          </p>
        </form>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1rem", marginTop: "1.2rem" }}>
      <div style={card}>
        <p style={{ margin: 0, color: "var(--navy)", fontWeight: 700 }}>
          Signed in{me.displayName ? ` as ${me.displayName}` : ""} ({me.role})
          {me.qa && <span style={{ marginLeft: "0.6rem", fontSize: "0.72rem", fontWeight: 800, color: "#a07800", background: "rgba(245,200,66,0.18)", borderRadius: 4, padding: "0.15rem 0.5rem" }}>TEST ACCOUNT</span>}
        </p>
      </div>

      <form onSubmit={saveName} style={card}>
        <label htmlFor="acct-name" style={{ display: "block", fontWeight: 700, color: "var(--navy)", fontSize: "0.9rem", marginBottom: "0.4rem" }}>
          Display name (first name and last initial)
        </label>
        <input id="acct-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Sandra M." style={input} maxLength={40} />
        <button type="submit" disabled={busy} style={{ ...primaryBtn, marginTop: "0.9rem", opacity: busy ? 0.7 : 1 }}>Save name</button>
      </form>

      <div style={{ ...card, display: "flex", gap: "0.6rem", flexWrap: "wrap" }}>
        <button onClick={signOut} disabled={busy} style={quietBtn}>Sign out</button>
        <button onClick={deactivate} disabled={busy} style={quietBtn}>Deactivate account</button>
        <button onClick={requestDeletion} disabled={busy} style={{ ...quietBtn, color: "#dc2626", borderColor: "#fca5a5" }}>Request deletion</button>
      </div>

      {notice && <p style={{ color: "#1a6e3a", fontWeight: 700, margin: 0 }}>{notice}</p>}
      {error && <p style={{ color: "#dc2626", fontWeight: 600, margin: 0 }}>{error}</p>}
    </div>
  );
}
