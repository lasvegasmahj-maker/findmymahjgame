"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { Search, Sparkles } from "lucide-react";
import SearchBox from "@/components/home/search-box";
import type { ClarifyPayload } from "@/lib/rules/clarify";
import styles from "./home-search-card.module.css";

// Same shape the /ask page consumes from POST /api/ask. Additive-only contract;
// only fields that exist today are read.
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
  error?: string;
  clarify?: ClarifyPayload | null;
};

// Verified against production /api/ask: rules questions with a high-confidence
// answer, and directory questions with real results. Never substitute an
// unverified question here.
const ROTATING_QUESTIONS = [
  "Can I use a joker in a pair?",
  "Where can I play Saturday morning near Naples?",
  "How does the Charleston work?",
  "Find an instructor near Phoenix",
];

const CHIPS = ["Can I use a joker in a pair?", "Find an instructor near Phoenix", "How does the Charleston work?"];

const ROTATE_MS = 3500;
const FADE_MS = 300;

function subscribeReducedMotion(onChange: () => void) {
  const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
  mq.addEventListener("change", onChange);
  return () => mq.removeEventListener("change", onChange);
}
function getReducedMotionSnapshot() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}
function getReducedMotionServerSnapshot() {
  return false;
}

export default function HomeSearchCard() {
  const [q, setQ] = useState("");
  const [busy, setBusy] = useState(false);
  const [resp, setResp] = useState<AskResponse | null>(null);
  const [askedQ, setAskedQ] = useState("");

  const reducedMotion = useSyncExternalStore(subscribeReducedMotion, getReducedMotionSnapshot, getReducedMotionServerSnapshot);
  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  const [fading, setFading] = useState(false);
  const [focused, setFocused] = useState(false);
  // Once true this never resets: the rotation is a discovery aid for a blank
  // field, not something that should reappear after someone has engaged.
  const [rotationStopped, setRotationStopped] = useState(false);
  const fadeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (reducedMotion || rotationStopped) return;
    const id = setInterval(() => {
      setFading(true);
      fadeTimeoutRef.current = setTimeout(() => {
        setPlaceholderIndex((i) => (i + 1) % ROTATING_QUESTIONS.length);
        setFading(false);
      }, FADE_MS);
    }, ROTATE_MS);
    return () => {
      clearInterval(id);
      if (fadeTimeoutRef.current) clearTimeout(fadeTimeoutRef.current);
    };
  }, [reducedMotion, rotationStopped]);

  function stopRotation() {
    if (!rotationStopped) setRotationStopped(true);
  }

  // A rules question that needs one more fact comes back as a clarification; its options
  // post back with the clarification so the player is never stranded on the home card.
  async function submitAsk(question: string, clarify: ClarifyPayload | null = null) {
    const query = question.trim();
    if (!query || busy) return;
    setBusy(true);
    setResp(null);
    if (!clarify) setAskedQ(query);
    try {
      const r = await fetch("/api/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(clarify ? { q: query, clarify: { id: clarify.id, question: clarify.question } } : { q: query }),
      });
      const j = await r.json();
      const next: ClarifyPayload | null = j?.topic === "rules" && j?.rules?.clarify?.id ? j.rules.clarify : null;
      setResp({ ok: !!j.ok, answer: j.answer || "", results: j.results ?? [], error: j.error, clarify: next });
    } catch {
      // Never invent an answer: a failed request shows only this fixed message.
      setResp({ ok: false, answer: "", results: [], error: "Something went wrong. Try again, or browse the Events page." });
    }
    setBusy(false);
  }

  function onAskSubmit(e: React.FormEvent) {
    e.preventDefault();
    submitAsk(q);
  }

  function onAskChange(e: React.ChangeEvent<HTMLInputElement>) {
    setQ(e.target.value);
    stopRotation();
  }

  function onAskFocus() {
    setFocused(true);
    stopRotation();
  }

  function onChipClick(text: string) {
    setQ(text);
    stopRotation();
    submitAsk(text);
  }

  const overlayVisible = !rotationStopped && !focused && q.length === 0;
  const overlayText = reducedMotion ? ROTATING_QUESTIONS[0] : ROTATING_QUESTIONS[placeholderIndex];

  return (
    <div>
      <div className={styles.grid}>
        <div className={styles.card}>
          <div className={styles.cardHead}>
            <Search size={18} aria-hidden="true" className={styles.cardIcon} />
            <div>
              <h2 className={styles.cardTitle}>Find a Game</h2>
              <p className={styles.cardSub}>Find games near you</p>
            </div>
          </div>
          <SearchBox />
          <p className={styles.freeLine}>Always free for players.</p>
        </div>

        <div className={`${styles.card} ${styles.askCard}`}>
          <div className={styles.cardHead}>
            <Sparkles size={18} aria-hidden="true" className={styles.askIcon} />
            <div>
              <h2 className={styles.cardTitle}>Ask Find My Mahj</h2>
              <p className={styles.cardSub}>Your mahjong concierge</p>
            </div>
          </div>

          <form onSubmit={onAskSubmit} className={styles.askRow}>
            <label htmlFor="home-ask-q" className={styles.srOnly}>
              Ask where to play or how to play
            </label>
            <div className={styles.askInputWrap}>
              <input
                id="home-ask-q"
                value={q}
                onChange={onAskChange}
                onFocus={onAskFocus}
                onBlur={() => setFocused(false)}
                placeholder=""
                maxLength={200}
                className={styles.askInput}
              />
              <span
                aria-hidden="true"
                data-testid="ask-placeholder-overlay"
                className={styles.askPlaceholderOverlay}
                style={{ opacity: overlayVisible && !fading ? 1 : 0, visibility: overlayVisible ? "visible" : "hidden" }}
              >
                {overlayText}
              </span>
            </div>
            <button type="submit" disabled={busy} className={styles.askBtn}>
              {busy ? "Searching..." : "Ask"}
            </button>
          </form>

          <div className={styles.chips}>
            {CHIPS.map((c) => (
              <button key={c} type="button" onClick={() => onChipClick(c)} className={styles.chip}>
                {c}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div role="status" aria-live="polite">
        {busy && <p className={styles.askStatus}>Looking that up...</p>}
        {!busy && resp && (
          <div className={styles.answer}>
            <p className={styles.answerText}>{resp.error || resp.answer}</p>
            {resp.clarify && (
              <div data-testid="home-ask-clarify" role="group" aria-label={resp.clarify.prompt} className={styles.chips}>
                {resp.clarify.options.map((o) => (
                  <button key={o.key} type="button" disabled={busy} onClick={() => submitAsk(o.label, resp.clarify ?? null)} className={styles.chip}>
                    {o.label}
                  </button>
                ))}
              </div>
            )}
            {resp.results.length > 0 && (
              <ul className={styles.answerList}>
                {resp.results.slice(0, 3).map((c) => {
                  const meta = [[c.city, c.state].filter(Boolean).join(", "), c.when].filter(Boolean).join(" · ");
                  return (
                    <li key={c.id}>
                      {c.url ? (
                        <a
                          href={c.url}
                          target={c.url.startsWith("/") ? undefined : "_blank"}
                          rel="noopener noreferrer"
                          className={styles.answerLink}
                        >
                          {c.name}
                        </a>
                      ) : (
                        <span className={styles.answerName}>{c.name}</span>
                      )}
                      {meta && <span> {"·"} {meta}</span>}
                    </li>
                  );
                })}
              </ul>
            )}
            <p className={styles.answerContinue}>
              <a href={`/ask?q=${encodeURIComponent(askedQ)}`}>Continue on the Ask page &rarr;</a>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
