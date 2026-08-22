"use client";

import { useRef, useState } from "react";
import SearchBox from "@/components/home/search-box";
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
};

type Mode = "find" | "ask";

export default function HomeSearchCard() {
  const [mode, setMode] = useState<Mode>("find");
  const [q, setQ] = useState("");
  const [busy, setBusy] = useState(false);
  const [resp, setResp] = useState<AskResponse | null>(null);
  const [askedQ, setAskedQ] = useState("");
  const findTabRef = useRef<HTMLButtonElement>(null);
  const askTabRef = useRef<HTMLButtonElement>(null);

  function switchMode(next: Mode, moveFocus = false) {
    setMode(next);
    if (moveFocus) (next === "find" ? findTabRef : askTabRef).current?.focus();
  }

  // Standard tabs keyboard pattern: arrows move between the two tabs and
  // selection follows focus.
  function onTablistKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowLeft" || e.key === "Home") {
      e.preventDefault();
      switchMode("find", true);
    } else if (e.key === "ArrowRight" || e.key === "End") {
      e.preventDefault();
      switchMode("ask", true);
    }
  }

  async function ask(e: React.FormEvent) {
    e.preventDefault();
    const query = q.trim();
    if (!query || busy) return;
    setBusy(true);
    setResp(null);
    setAskedQ(query);
    try {
      const r = await fetch("/api/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ q: query }),
      });
      const j = await r.json();
      setResp({ ok: !!j.ok, answer: j.answer || "", results: j.results ?? [], error: j.error });
    } catch {
      // Never invent an answer: a failed request shows only this fixed message.
      setResp({ ok: false, answer: "", results: [], error: "Something went wrong. Try again, or browse the Events page." });
    }
    setBusy(false);
  }

  return (
    <div>
      <div className={styles.card}>
        <div role="tablist" aria-label="Search mode" className={styles.tabs} onKeyDown={onTablistKeyDown}>
          <button
            ref={findTabRef}
            type="button"
            role="tab"
            id="home-tab-find"
            aria-selected={mode === "find"}
            aria-controls="home-panel-find"
            tabIndex={mode === "find" ? 0 : -1}
            className={styles.tab}
            onClick={() => switchMode("find")}
          >
            Find a Game
          </button>
          <button
            ref={askTabRef}
            type="button"
            role="tab"
            id="home-tab-ask"
            aria-selected={mode === "ask"}
            aria-controls="home-panel-ask"
            tabIndex={mode === "ask" ? 0 : -1}
            className={styles.tab}
            onClick={() => switchMode("ask")}
          >
            Ask Find My Mahj
          </button>
        </div>

        {/* Both panels stay mounted so switching modes never wipes what was typed. */}
        <div role="tabpanel" id="home-panel-find" aria-labelledby="home-tab-find" hidden={mode !== "find"}>
          <SearchBox />
        </div>
        <div role="tabpanel" id="home-panel-ask" aria-labelledby="home-tab-ask" hidden={mode !== "ask"}>
          <form onSubmit={ask} className={styles.askRow}>
            <label htmlFor="home-ask-q" className={styles.srOnly}>
              Ask about mahjong, games, lessons, or rules
            </label>
            <input
              id="home-ask-q"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Ask about mahjong, games, lessons, or rules..."
              maxLength={200}
              className={styles.askInput}
            />
            <button type="submit" disabled={busy} className={styles.askBtn}>
              {busy ? "Searching..." : "Ask"}
            </button>
          </form>
        </div>
      </div>

      <div role="status" aria-live="polite">
        {mode === "ask" && busy && <p className={styles.askStatus}>Looking that up...</p>}
        {mode === "ask" && !busy && resp && (
          <div className={styles.answer}>
            <p className={styles.answerText}>{resp.error || resp.answer}</p>
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
