"use client";

import { useState } from "react";

export default function AdminLogin() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const res = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    setBusy(false);
    if (res.ok) {
      window.location.reload();
    } else if (res.status === 429) {
      setError("Too many attempts. Wait a few minutes and try again.");
    } else {
      setError("Incorrect password");
    }
  }

  return (
    <main style={{ maxWidth: 380, margin: "0 auto", padding: "5rem 1.5rem", textAlign: "center" }}>
      <h1 style={{ fontFamily: "var(--font-playfair), 'Playfair Display', serif", fontSize: "1.6rem", color: "var(--navy)", marginBottom: "1.2rem" }}>Admin sign in</h1>
      <form onSubmit={submit} style={{ display: "grid", gap: "0.8rem" }}>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          autoFocus
          style={{ padding: "0.7rem 0.9rem", border: "1px solid var(--border)", borderRadius: 8, fontSize: "1rem" }}
        />
        <button type="submit" disabled={busy || !password} style={{ padding: "0.7rem", background: "var(--navy)", color: "white", border: "none", borderRadius: 8, fontWeight: 700, fontSize: "1rem", cursor: "pointer" }}>
          {busy ? "Checking" : "Sign in"}
        </button>
        {error && <p style={{ color: "#b3261e", fontWeight: 600, margin: 0 }}>{error}</p>}
      </form>
    </main>
  );
}
