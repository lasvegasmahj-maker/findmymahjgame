"use client";

import { useState } from "react";

// Toggles a block on another player. Blocking is silent: the blocked person is
// never told, here or anywhere else. Pass the current state in via initialBlocked
// (the parent already has it from wherever it loaded this player); this component
// does not fetch it itself.
export default function BlockButton({
  targetUserId,
  initialBlocked = false,
  onChange,
}: {
  targetUserId: string;
  initialBlocked?: boolean;
  onChange?: (blocked: boolean) => void;
}) {
  const [blocked, setBlocked] = useState(initialBlocked);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function toggle() {
    const nextAction = blocked ? "unblock" : "block";
    if (nextAction === "block" && !window.confirm("Block this player? They will not be matched with you again, and will not be told.")) return;
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/safety/block", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: nextAction, user_id: targetUserId }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(j.error || "Something went wrong. Please try again.");
        return;
      }
      const next = Boolean(j.blocked);
      setBlocked(next);
      onChange?.(next);
    } catch {
      setError("We could not reach the server. Please check your connection and try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <button
        type="button"
        onClick={toggle}
        disabled={busy}
        style={{
          background: blocked ? "var(--bg)" : "white",
          border: `1.5px solid ${blocked ? "var(--border)" : "#fca5a5"}`,
          borderRadius: 8,
          padding: "0.5rem 0.9rem",
          fontWeight: 700,
          fontSize: "0.85rem",
          cursor: busy ? "not-allowed" : "pointer",
          color: blocked ? "var(--navy)" : "#dc2626",
          fontFamily: "'DM Sans', sans-serif",
          opacity: busy ? 0.7 : 1,
        }}
      >
        {busy ? "..." : blocked ? "Unblock" : "Block"}
      </button>
      {error && <p style={{ color: "#dc2626", fontSize: "0.78rem", margin: "0.4rem 0 0" }}>{error}</p>}
    </div>
  );
}
