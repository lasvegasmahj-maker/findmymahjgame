"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";

type Card = {
  id: string;
  kind: "event" | "teacher";
  name: string;
  city: string | null;
  state: string | null;
  when: string | null;
  distance: string | null;
  type: string | null;
  url: string | null;
};

type AskResponse = {
  ok: boolean;
  answer: string;
  results: Card[];
  suggestions?: Array<{ label: string; href: string }>;
  error?: string;
};

const EXAMPLES = [
  "Where can I play Saturday morning near Naples?",
  "Find mahjong within 10 miles of Dallas",
  "Find an instructor near Phoenix",
  "Are there games Wednesday evening near Atlanta?",
];

export default function AskClient() {
  // Prefill from /ask?q=... (the homepage "Continue on the Ask page" link).
  const searchParams = useSearchParams();
  const [q, setQ] = useState(() => (searchParams.get("q") || "").slice(0, 200));
  const [busy, setBusy] = useState(false);
  const [resp, setResp] = useState<AskResponse | null>(null);

  async function ask(question: string) {
    const query = question.trim();
    if (!query || busy) return;
    setBusy(true);
    setResp(null);
    try {
      const r = await fetch("/api/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ q: query }),
      });
      const j = await r.json();
      setResp({ ok: !!j.ok, answer: j.answer || "", results: j.results ?? [], suggestions: j.suggestions ?? [], error: j.error });
    } catch {
      setResp({ ok: false, answer: "", results: [], error: "Something went wrong. The Events page search still works." });
    }
    setBusy(false);
  }

  return (
    <div>
      <form
        onSubmit={(e) => { e.preventDefault(); ask(q); }}
        style={{ display: "flex", gap: "0.6rem", flexWrap: "wrap", justifyContent: "center", maxWidth: 560, margin: "0 auto 1rem" }}
      >
        <label htmlFor="ask-q" style={{ position: "absolute", width: 1, height: 1, overflow: "hidden", clip: "rect(0 0 0 0)" }}>
          Ask about mahjong near you
        </label>
        <input
          id="ask-q"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Where can I play Thursday evening near Dallas?"
          maxLength={200}
          className="form-input"
          style={{ flex: "1 1 300px", minHeight: 54, fontSize: "1.05rem" }}
        />
        <button
          type="submit"
          disabled={busy}
          style={{ minHeight: 54, padding: "0 1.5rem", border: "none", borderRadius: 12, background: "var(--pink)", color: "white", fontWeight: 800, fontSize: "1.05rem", cursor: "pointer", fontFamily: "var(--font-dm-sans), 'DM Sans', sans-serif", opacity: busy ? 0.6 : 1 }}
        >
          {busy ? "Searching..." : "Ask"}
        </button>
      </form>

      {!resp && (
        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", justifyContent: "center", marginBottom: "1.5rem" }}>
          {EXAMPLES.map((ex) => (
            <button
              key={ex}
              onClick={() => { setQ(ex); ask(ex); }}
              style={{ padding: "0.45rem 1rem", borderRadius: 50, fontSize: "0.9rem", fontWeight: 700, border: "2px solid var(--border)", background: "white", color: "var(--navy)", cursor: "pointer", fontFamily: "var(--font-dm-sans), 'DM Sans', sans-serif" }}
            >
              {ex}
            </button>
          ))}
        </div>
      )}

      {resp && (
        <div style={{ maxWidth: 720, margin: "0 auto" }}>
          <p style={{ fontSize: "1.1rem", color: "var(--navy)", fontWeight: 600, textAlign: "center", lineHeight: 1.55 }}>
            {resp.error || resp.answer}
          </p>

          {resp.results.length > 0 && (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 300px), 1fr))", gap: "1rem", marginTop: "1.2rem" }}>
              {resp.results.map((c) => (
                <div key={c.id} style={{ background: "white", border: "1px solid var(--border)", borderRadius: 14, padding: "1.1rem 1.2rem" }}>
                  {c.type && (
                    <div style={{ textTransform: "uppercase", letterSpacing: "0.08em", fontSize: "0.78rem", fontWeight: 800, color: "var(--pink-text)", marginBottom: "0.35rem" }}>
                      {String(c.type).replace(/_/g, " ")}
                    </div>
                  )}
                  <div style={{ fontSize: "1.15rem", fontWeight: 800, color: "var(--navy)", lineHeight: 1.3 }}>{c.name}</div>
                  {c.when && <div style={{ fontSize: "0.98rem", color: "var(--navy)", marginTop: "0.3rem" }}>{c.when}</div>}
                  <div style={{ fontSize: "0.95rem", color: "var(--muted)", marginTop: "0.25rem" }}>
                    {[c.city, c.state].filter(Boolean).join(", ")}
                    {c.distance ? ` (${c.distance}${c.distance === "nearby" ? "" : " away"})` : ""}
                  </div>
                  {c.url && (
                    <a
                      href={c.url}
                      target={c.url.startsWith("/") ? undefined : "_blank"}
                      rel="noopener noreferrer"
                      style={{ display: "inline-block", marginTop: "0.55rem", color: "var(--pink-text)", fontWeight: 700, fontSize: "0.95rem" }}
                    >
                      {c.kind === "teacher" ? "View teacher" : "Details"}
                    </a>
                  )}
                </div>
              ))}
            </div>
          )}

          {resp.suggestions && resp.suggestions.length > 0 && (
            <div style={{ display: "flex", gap: "0.6rem", flexWrap: "wrap", justifyContent: "center", marginTop: "1.4rem" }}>
              {resp.suggestions.map((s) => (
                <a key={s.href + s.label} href={s.href} style={{ padding: "0.5rem 1.1rem", borderRadius: 50, fontSize: "0.95rem", fontWeight: 800, border: "2px solid var(--navy)", color: "var(--navy)", textDecoration: "none" }}>
                  {s.label}
                </a>
              ))}
            </div>
          )}

          <p style={{ textAlign: "center", marginTop: "1.6rem" }}>
            <button
              onClick={() => { setResp(null); setQ(""); }}
              style={{ background: "none", border: "none", color: "var(--muted)", fontWeight: 700, cursor: "pointer", fontSize: "0.9rem", fontFamily: "var(--font-dm-sans), 'DM Sans', sans-serif" }}
            >
              Ask another question
            </button>
          </p>
        </div>
      )}
    </div>
  );
}
