"use client";

import { useState } from "react";

export default function UnsubscribeClient({ token }: { token: string }) {
  const [state, setState] = useState<"ready" | "busy" | "done" | "error">("ready");
  const [msg, setMsg] = useState("");

  async function unsubscribe() {
    setState("busy");
    try {
      const r = await fetch("/api/unsubscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });
      const j = await r.json();
      if (j.ok) setState("done");
      else { setState("error"); setMsg(j.error || "Something went wrong."); }
    } catch {
      setState("error");
      setMsg("Something went wrong. Email hello@findmymahjgame.com and a real person will remove you.");
    }
  }

  if (state === "done") {
    return <p style={{ color: "var(--navy)", fontWeight: 600, lineHeight: 1.6 }}>You are unsubscribed. We will not email you again.</p>;
  }
  if (state === "error") {
    return <p style={{ color: "var(--muted)", lineHeight: 1.6 }}>{msg}</p>;
  }
  return (
    <div>
      <p style={{ color: "var(--muted)", lineHeight: 1.6, marginBottom: "1.2rem" }}>
        Click below and we will stop emailing this address, immediately and permanently.
      </p>
      <button
        onClick={unsubscribe}
        disabled={state === "busy"}
        style={{ minHeight: 50, padding: "0 1.6rem", border: "none", borderRadius: 12, background: "var(--navy)", color: "white", fontWeight: 800, fontSize: "1rem", cursor: "pointer", fontFamily: "var(--font-dm-sans), 'DM Sans', sans-serif", opacity: state === "busy" ? 0.6 : 1 }}
      >
        {state === "busy" ? "Unsubscribing..." : "Unsubscribe me"}
      </button>
    </div>
  );
}
