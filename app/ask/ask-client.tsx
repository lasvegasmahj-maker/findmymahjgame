"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import type { ClarifyPayload as Clarify } from "@/lib/rules/clarify";

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
  clarify?: Clarify | null;
  pendingReview?: boolean;
};

const EXAMPLES = [
  "Can I use a joker in a pair?",
  "Where can I play Saturday morning near Naples?",
  "How does the Charleston work?",
  "Find an instructor near Phoenix",
];

// A long rules answer read as one centered block of semibold text, roughly 40 lines on a
// phone. Split it into paragraphs and left-align once it passes a short-answer length.
function AnswerText({ text }: { text: string }) {
  const long = text.length > 400;
  if (!long) {
    return (
      <p style={{ fontSize: "1.1rem", color: "var(--navy)", fontWeight: 600, textAlign: "center", lineHeight: 1.55 }}>{text}</p>
    );
  }
  const sentences = text.match(/[^.!?]+[.!?]+(\s|$)/g) ?? [text];
  const paras: string[] = [];
  for (let i = 0; i < sentences.length; i += 3) paras.push(sentences.slice(i, i + 3).join("").trim());
  return (
    <div style={{ maxWidth: 640, margin: "0 auto" }}>
      {paras.map((p, i) => (
        <p key={i} style={{ fontSize: "1.05rem", color: "var(--navy)", fontWeight: 500, textAlign: "left", lineHeight: 1.6, margin: i === 0 ? "0 0 0.8rem" : "0 0 0.8rem" }}>
          {p}
        </p>
      ))}
    </div>
  );
}

export default function AskClient() {
  // Prefill from /ask?q=... (the homepage "Continue on the Ask page" link).
  const searchParams = useSearchParams();
  const [q, setQ] = useState(() => (searchParams.get("q") || "").slice(0, 200));
  const [busy, setBusy] = useState(false);
  const [resp, setResp] = useState<AskResponse | null>(null);

  async function ask(question: string, clarify: Clarify | null = null) {
    const query = question.trim();
    if (!query || busy) return;
    setBusy(true);
    setResp(null);
    try {
      const r = await fetch("/api/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(clarify ? { q: query, clarify: { id: clarify.id, question: clarify.question } } : { q: query }),
      });
      const j = await r.json();
      // A rate limit or server error keeps the pending clarification instead of stranding the player.
      const next: Clarify | null = j?.ok ? (j?.topic === "rules" && j?.rules?.clarify?.id ? j.rules.clarify : null) : clarify;
      setResp({ ok: !!j.ok, answer: j.answer || "", results: j.results ?? [], suggestions: j.suggestions ?? [], error: j.error, clarify: next, pendingReview: j?.rules?.evidence === "owner_review_pending" });
      if (next && j?.ok) setQ("");
    } catch {
      setResp({ ok: false, answer: "", results: [], error: "Something went wrong. The Events page search still works.", clarify });
    }
    setBusy(false);
  }

  const pending = resp?.clarify ?? null;

  return (
    <div>
      <form
        onSubmit={(e) => { e.preventDefault(); ask(q, pending); }}
        style={{ display: "flex", gap: "0.6rem", flexWrap: "wrap", justifyContent: "center", maxWidth: 560, margin: "0 auto 1rem" }}
      >
        <label htmlFor="ask-q" style={{ position: "absolute", width: 1, height: 1, overflow: "hidden", clip: "rect(0 0 0 0)" }}>
          Ask where to play or how to play
        </label>
        <input
          id="ask-q"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={pending ? "Type your answer, or pick one below" : "Ask about games, teachers, events, or mahjong rules..."}
          maxLength={200}
          className="form-input"
          style={{ flex: "1 1 300px", minHeight: 54, fontSize: "1.05rem" }}
        />
        <button
          type="submit"
          disabled={busy}
          style={{ minHeight: 54, padding: "0 1.5rem", border: "none", borderRadius: 12, background: "var(--pink)", color: "white", fontWeight: 800, fontSize: "1.05rem", cursor: "pointer", fontFamily: "var(--font-dm-sans), 'DM Sans', sans-serif", opacity: busy ? 0.6 : 1 }}
        >
          {busy ? "Searching..." : pending ? "Reply" : "Ask"}
        </button>
      </form>

      {!resp && (
        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", justifyContent: "center", marginBottom: "1.5rem" }}>
          {EXAMPLES.map((ex) => (
            <button
              key={ex}
              type="button"
              onClick={() => { setQ(ex); ask(ex); }}
              style={{ minHeight: 44, padding: "0.45rem 1rem", borderRadius: 50, fontSize: "0.9rem", fontWeight: 700, border: "2px solid var(--border)", background: "white", color: "var(--navy)", cursor: "pointer", fontFamily: "var(--font-dm-sans), 'DM Sans', sans-serif" }}
            >
              {ex}
            </button>
          ))}
        </div>
      )}

      {resp && (
        <div role="status" aria-live="polite" style={{ maxWidth: 720, margin: "0 auto" }}>
          {pending && (
            <p style={{ fontSize: "0.9rem", color: "var(--muted)", textAlign: "center", margin: "0 0 0.4rem" }}>You asked: {pending.question}</p>
          )}
          <AnswerText text={resp.error || resp.answer} />

          {resp.pendingReview && (
            <p data-testid="ask-pending-review" style={{ fontSize: "0.85rem", color: "var(--muted)", textAlign: "center", marginTop: "0.6rem" }}>
              Our instructor is reviewing this answer.
            </p>
          )}

          {pending && (
            <div data-testid="ask-clarify" role="group" aria-label={pending.prompt} style={{ display: "flex", gap: "0.6rem", flexWrap: "wrap", justifyContent: "center", marginTop: "1rem" }}>
              {pending.options.map((o) => (
                <button
                  key={o.key}
                  type="button"
                  disabled={busy}
                  onClick={() => ask(o.label, pending)}
                  className="btn-cta-outline"
                  style={{ minHeight: 44, borderRadius: 50, fontSize: "0.95rem", padding: "0.5rem 1.1rem", cursor: "pointer" }}
                >
                  {o.label}
                </button>
              ))}
              <button
                type="button"
                onClick={() => { setResp(null); setQ(""); }}
                style={{ flexBasis: "100%", minHeight: 44, background: "none", border: "none", color: "var(--muted)", fontWeight: 700, cursor: "pointer", fontSize: "0.9rem", fontFamily: "var(--font-dm-sans), 'DM Sans', sans-serif" }}
              >
                Never mind
              </button>
            </div>
          )}

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
