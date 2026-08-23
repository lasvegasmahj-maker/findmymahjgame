"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";

// The emailed link lands here with the token in the query, and signing in takes one
// tap. The tap matters: email scanners prefetch links, the token works exactly once,
// and a prefetch must not spend it before the person arrives.
export default function ConfirmClient() {
  const searchParams = useSearchParams();
  const tokenHash = searchParams.get("token_hash") || "";
  const role = searchParams.get("role") === "provider" ? "provider" : "player";
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function confirm() {
    setBusy(true);
    setError("");
    try {
      const r = await fetch("/api/auth/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token_hash: tokenHash, role }),
      });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) {
        setError(j.error || "Something went wrong. Please try again.");
        setBusy(false);
        return;
      }
      window.location.href = "/account";
    } catch {
      setError("Something went wrong. Please check your connection and try again.");
      setBusy(false);
    }
  }

  if (!tokenHash) {
    return <p style={{ color: "var(--muted)" }}>This link is incomplete. Open the newest sign-in email and tap the button again, or request a new link from the account page.</p>;
  }

  return (
    <div>
      <p style={{ color: "var(--muted)", margin: "0 0 1.4rem" }}>Tap below to finish signing in to Find My Mahj Game.</p>
      <button
        onClick={confirm}
        disabled={busy}
        style={{ background: "var(--pink)", color: "white", border: "none", borderRadius: 8, padding: "0.9rem 2rem", fontWeight: 700, fontSize: "1rem", cursor: busy ? "not-allowed" : "pointer", fontFamily: "'DM Sans', sans-serif", opacity: busy ? 0.7 : 1 }}
      >
        {busy ? "Signing in..." : "Sign in"}
      </button>
      {error && <p style={{ color: "#dc2626", fontWeight: 600, marginTop: "1rem" }}>{error}</p>}
    </div>
  );
}
