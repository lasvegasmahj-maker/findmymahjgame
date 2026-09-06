"use client";

import { useEffect, useRef, useState, useSyncExternalStore, type FormEvent } from "react";
import { useSearchParams } from "next/navigation";
import { LABEL_TEXT, PENDING_NOTE, type AskLabel } from "@/lib/ask-core/engine/labels.ts";
import { AnswerText } from "@/components/ask/answer-text";

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

type Clarify = { id: string; prompt: string; question: string; options: Array<{ key: string; label: string }> };
type Suggestion = { label: string; href: string };

type AnswerTurn = {
  role: "assistant";
  content: string;
  label: AskLabel;
  kind: string;
  entry_id?: string;
  evidence?: string;
  followups: string[];
  clarify?: Clarify;
  results: Card[];
  suggestions: Suggestion[];
  year_note?: string;
  failed?: boolean;
};
type UserTurn = { role: "user"; content: string };
type ThreadTurn = UserTurn | AnswerTurn;

type AskResponse = {
  ok?: boolean;
  error?: string;
  fallback?: string;
  answer?: string;
  label?: string;
  kind?: string;
  entry_id?: string;
  evidence?: string;
  followups?: string[];
  clarify?: Clarify;
  results?: Card[];
  suggestions?: Suggestion[];
  year_note?: string;
  topic?: string;
  rules?: { clarify?: Clarify; evidence?: string };
};

const STORAGE_KEY = "fmg-ask-thread";
const MAX_CHARS = 300;
const LABELS: ReadonlySet<string> = new Set(Object.keys(LABEL_TEXT));

const EXAMPLES = [
  "Can I use a joker in a pair?",
  "Where can I play Saturday morning near Naples?",
  "How does the Charleston work?",
  "Find an instructor near Phoenix",
];

const FAILED_MESSAGE = "Something went wrong. The Events page search still works, and you can try again in a moment.";

function isTurn(x: unknown): x is ThreadTurn {
  if (!x || typeof x !== "object") return false;
  const t = x as Record<string, unknown>;
  if (typeof t.content !== "string") return false;
  if (t.role === "user") return true;
  if (t.role !== "assistant" || typeof t.label !== "string" || !LABELS.has(t.label)) return false;
  if (!Array.isArray(t.followups) || !t.followups.every((f) => typeof f === "string")) return false;
  if (!Array.isArray(t.results) || !Array.isArray(t.suggestions)) return false;
  return true;
}

function loadThread(): ThreadTurn[] {
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter(isTurn).slice(-20) : [];
  } catch {
    return [];
  }
}

function saveThread(thread: ThreadTurn[]) {
  try {
    window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(thread.slice(-20)));
  } catch {
    // Private mode or storage disabled: the thread lives in memory.
  }
}

const noop = () => () => {};

export default function AskClient() {
  const hydrated = useSyncExternalStore(noop, () => true, () => false);
  if (!hydrated) return <AskShell />;
  return <AskThread />;
}

const inputStyle = { flex: "1 1 300px", minHeight: 54, fontSize: "1.05rem" } as const;
const buttonStyle = { minHeight: 54, padding: "0 1.5rem", border: "none", borderRadius: 12, background: "var(--pink)", color: "white", fontWeight: 800, fontSize: "1.05rem", cursor: "pointer", fontFamily: "var(--font-dm-sans), 'DM Sans', sans-serif" } as const;
const chipStyle = { minHeight: 44, padding: "0.45rem 1rem", borderRadius: 50, fontSize: "0.9rem", fontWeight: 700, border: "2px solid var(--border)", background: "white", color: "var(--navy)", cursor: "pointer", fontFamily: "var(--font-dm-sans), 'DM Sans', sans-serif", textAlign: "left" as const };
const quietStyle = { minHeight: 44, background: "none", border: "none", color: "var(--muted)", fontWeight: 700, cursor: "pointer", fontSize: "0.9rem", fontFamily: "var(--font-dm-sans), 'DM Sans', sans-serif" } as const;

function AskShell() {
  return (
    <div>
      <form className="ask-composer-fmg" noValidate>
        <label htmlFor="ask-q" className="sr-only-fmg">Ask where to play or how to play</label>
        <input id="ask-q" className="form-input" style={inputStyle} placeholder="Ask about games, teachers, events, or mahjong rules..." maxLength={MAX_CHARS} readOnly />
        <button type="submit" style={buttonStyle} disabled>Ask</button>
      </form>
      <div className="ask-chips-fmg">
        {EXAMPLES.map((ex) => (
          <button key={ex} type="button" style={chipStyle} disabled>{ex}</button>
        ))}
      </div>
    </div>
  );
}

function AskThread() {
  const searchParams = useSearchParams();
  const [thread, setThread] = useState<ThreadTurn[]>(loadThread);
  const [q, setQ] = useState(() => (searchParams.get("q") || "").slice(0, MAX_CHARS));
  const [busy, setBusy] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const lastQuestionRef = useRef<HTMLDivElement>(null);
  const endRef = useRef<HTMLDivElement>(null);
  // A shared /ask?q= link answers itself once per load; the home card never builds one.
  const autoAsked = useRef(false);

  useEffect(() => {
    saveThread(thread);
  }, [thread]);

  const lastAnswer = [...thread].reverse().find((t): t is AnswerTurn => t.role === "assistant");
  const pending = lastAnswer?.clarify;

  async function ask(raw: string, clarify: Clarify | null = pending ?? null, keepInput = false) {
    const query = raw.trim().slice(0, MAX_CHARS);
    if (!query || busy) return;
    const history = thread
      .filter((t) => t.role === "user" || !t.failed)
      .slice(-10)
      .map((t) => (t.role === "user" ? { role: "user" as const, content: t.content } : { role: "assistant" as const, content: t.content, entry_id: t.entry_id }));
    setThread((prev) => [...prev, { role: "user", content: query }]);
    if (!keepInput) setQ("");
    setBusy(true);
    if (window.matchMedia?.("(pointer: coarse)").matches) inputRef.current?.blur();
    let answer: AnswerTurn;
    try {
      const r = await fetch("/api/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: query, history, clarify: clarify ? { id: clarify.id, question: clarify.question } : undefined }),
      });
      const j = (await r.json().catch(() => null)) as AskResponse | null;
      if (r.ok && j?.ok) {
        const next = j.topic === "rules" && j.clarify?.id ? j.clarify : j.topic === "rules" && j.rules?.clarify?.id ? j.rules.clarify : undefined;
        answer = {
          role: "assistant",
          content: j.answer || "",
          label: LABELS.has(j.label ?? "") ? (j.label as AskLabel) : "chat",
          kind: j.kind ?? (j.topic === "rules" ? "answer" : "directory"),
          entry_id: j.entry_id,
          evidence: j.evidence ?? j.rules?.evidence,
          followups: Array.isArray(j.followups) ? j.followups.slice(0, 3) : [],
          clarify: next,
          results: Array.isArray(j.results) ? j.results : [],
          suggestions: Array.isArray(j.suggestions) ? j.suggestions.filter((s) => typeof s?.href === "string").slice(0, 4) : [],
          year_note: j.year_note,
        };
      } else {
        // A rate limit or a kill switch explains itself; a pending clarification survives the
        // failure so the player is not stranded.
        const explained = (r.status === 429 || r.status === 503) && j?.error ? j.error : FAILED_MESSAGE;
        answer = { role: "assistant", content: explained, label: "chat", kind: "error", followups: [], clarify: clarify ?? undefined, results: [], suggestions: [{ label: "Browse all events", href: "/events" }], failed: true };
      }
    } catch {
      answer = { role: "assistant", content: FAILED_MESSAGE, label: "chat", kind: "error", followups: [], clarify: clarify ?? undefined, results: [], suggestions: [{ label: "Browse all events", href: "/events" }], failed: true };
    }
    setThread((prev) => [...prev, answer]);
    setBusy(false);
  }

  useEffect(() => {
    if (autoAsked.current) return;
    const initial = (searchParams.get("q") || "").slice(0, MAX_CHARS).trim();
    if (!initial) return;
    autoAsked.current = true;
    let done = false;
    try {
      done = window.sessionStorage.getItem(`fmg-ask-auto:${initial}`) === "1";
      window.sessionStorage.setItem(`fmg-ask-auto:${initial}`, "1");
    } catch {}
    if (!done) void ask(initial, null, true);
    // ask is stable for this purpose and re-running on every render would loop.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const restoredRef = useRef(true);
  useEffect(() => {
    if (restoredRef.current) {
      restoredRef.current = false;
      return;
    }
    if (!thread.length) return;
    const last = thread[thread.length - 1];
    const behavior: ScrollBehavior = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth";
    if (last.role === "assistant") lastQuestionRef.current?.scrollIntoView({ block: "start", behavior });
    else endRef.current?.scrollIntoView({ block: "end", behavior });
  }, [thread]);

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    void ask(q);
  }

  function neverMind() {
    setThread((prev) => [...prev, { role: "user", content: "Never mind" }, { role: "assistant", content: "No problem. Ask another question any time.", label: "chat", kind: "cancelled", followups: [], results: [], suggestions: [] }]);
    setQ("");
    inputRef.current?.focus();
  }

  function reset() {
    setThread([]);
    setQ("");
    inputRef.current?.focus();
  }

  const lastAnswerIndex = thread.map((t) => t.role).lastIndexOf("assistant");
  const lastQuestionIndex = thread.map((t) => t.role).lastIndexOf("user");

  return (
    <div>
      <div role="log" aria-live="polite" aria-busy={busy} className="ask-thread-fmg">
        {thread.map((t, i) =>
          t.role === "user" ? (
            <div key={i} className="ask-turn-fmg ask-turn-fmg-user" ref={i === lastQuestionIndex ? lastQuestionRef : undefined}>
              <span className="ask-who-fmg">You</span>
              <p>{t.content}</p>
            </div>
          ) : (
            <div key={i} className={`ask-turn-fmg ask-turn-fmg-answer${t.failed ? " ask-turn-fmg-failed" : ""}`}>
              <div className="ask-head-fmg">
                <span className="ask-who-fmg">Find My Mahj</span>
                {t.label !== "chat" && LABEL_TEXT[t.label] ? <span className={`ask-label-fmg ask-label-fmg-${t.label}`}>{LABEL_TEXT[t.label]}</span> : null}
              </div>
              <AnswerText text={t.content} className="ask-answer-fmg" />
              {t.evidence === "owner_review_pending" ? (
                <p data-testid="ask-pending-review" className="ask-note-fmg">{PENDING_NOTE}</p>
              ) : null}
              {t.year_note ? <p className="ask-note-fmg">{t.year_note}</p> : null}
              {i === lastAnswerIndex && t.clarify && t.clarify.options.length > 0 ? (
                <div data-testid="ask-clarify" role="group" aria-label={t.clarify.prompt || "Pick one"} className="ask-chips-fmg">
                  {t.clarify.options.map((o) => (
                    <button key={o.key} type="button" disabled={busy} onClick={() => void ask(o.label, t.clarify!)} className="btn-cta-outline" style={{ minHeight: 44, borderRadius: 50, fontSize: "0.95rem", padding: "0.5rem 1.1rem", cursor: "pointer" }}>
                      {o.label}
                    </button>
                  ))}
                  <button type="button" onClick={neverMind} disabled={busy} style={{ ...quietStyle, flexBasis: "100%" }}>
                    Never mind
                  </button>
                </div>
              ) : null}
              {t.results.length > 0 ? (
                <div className="ask-cards-fmg">
                  {t.results.map((c) => (
                    <div key={c.id} className="ask-card-fmg">
                      {c.type ? <div className="ask-card-fmg-type">{String(c.type).replace(/_/g, " ")}</div> : null}
                      <div className="ask-card-fmg-name">{c.name}</div>
                      {c.when ? <div className="ask-card-fmg-when">{c.when}</div> : null}
                      <div className="ask-card-fmg-meta">
                        {[c.city, c.state].filter(Boolean).join(", ")}
                        {c.distance ? ` (${c.distance}${c.distance === "nearby" ? "" : " away"})` : ""}
                      </div>
                      {c.url ? (
                        <a href={c.url} target={c.url.startsWith("/") ? undefined : "_blank"} rel="noopener noreferrer" className="ask-card-fmg-link">
                          {c.kind === "teacher" ? "View teacher" : "Details"}
                        </a>
                      ) : null}
                    </div>
                  ))}
                </div>
              ) : null}
              {i === lastAnswerIndex && !t.clarify && t.followups.length > 0 ? (
                <div className="ask-chips-fmg" aria-label="Suggested follow-up questions">
                  {t.followups.map((f) => (
                    <button key={f} type="button" disabled={busy} onClick={() => void ask(f, null)} style={chipStyle}>
                      {f}
                    </button>
                  ))}
                </div>
              ) : null}
              {t.suggestions.length > 0 ? (
                <div className="ask-chips-fmg">
                  {t.suggestions.map((s) => (
                    <a key={s.href + s.label} href={s.href} className="ask-suggestion-fmg">
                      {s.label}
                    </a>
                  ))}
                </div>
              ) : null}
            </div>
          ),
        )}
        {busy ? (
          <div className="ask-turn-fmg ask-turn-fmg-answer ask-thinking-fmg" role="status">
            <span className="ask-who-fmg">Find My Mahj</span>
            <p>{pending ? "Checking..." : "Looking that up..."}</p>
          </div>
        ) : null}
        <div ref={endRef} />
      </div>

      <form onSubmit={onSubmit} className="ask-composer-fmg" noValidate>
        <label htmlFor="ask-q" className="sr-only-fmg">Ask where to play or how to play</label>
        <input
          id="ask-q"
          ref={inputRef}
          value={q}
          onChange={(e) => setQ(e.target.value.slice(0, MAX_CHARS))}
          placeholder={pending ? "Type your answer, or pick one above" : thread.length ? "Ask a follow-up or a new question" : "Ask about games, teachers, events, or mahjong rules..."}
          maxLength={MAX_CHARS}
          className="form-input"
          style={inputStyle}
          autoComplete="off"
          autoCapitalize="sentences"
          enterKeyHint="send"
        />
        <button type="submit" disabled={busy || !q.trim()} style={{ ...buttonStyle, opacity: busy ? 0.6 : 1 }}>
          {pending ? "Reply" : "Ask"}
        </button>
      </form>

      {thread.length === 0 ? (
        <div className="ask-chips-fmg">
          {EXAMPLES.map((ex) => (
            <button key={ex} type="button" onClick={() => void ask(ex, null)} style={chipStyle}>
              {ex}
            </button>
          ))}
        </div>
      ) : (
        <p style={{ textAlign: "center", marginTop: "0.6rem" }}>
          <button type="button" onClick={reset} style={quietStyle}>Ask another question</button>
        </p>
      )}
    </div>
  );
}
