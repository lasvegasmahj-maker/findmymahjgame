"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { DAYS_OF_WEEK, TIMES_OF_DAY } from "@/lib/match/engine";

type Me = { role: string; displayName: string | null; qa: boolean };

type RequestInfo = {
  id: string;
  status: string;
  city: string | null;
  state: string | null;
  day: string | null;
  time: string | null;
  variant: string;
} | null;

type ProposalInfo = {
  tableId: string;
  mySeatStatus: string;
  day: string | null;
  time: string | null;
  city: string | null;
  state: string | null;
  variant: string;
  others: { firstName: string; accepted: boolean }[];
} | null;

type TableInfo = {
  id: string;
  shareCode: string;
  status: string;
  day: string | null;
  time: string | null;
  area: string | null;
  members: string[];
} | null;

type HistoryEntry = {
  tableId: string;
  status: string;
  seatStatus: string;
  day: string | null;
  time: string | null;
  city: string | null;
};

type MatchState = { request: RequestInfo; proposal: ProposalInfo; table: TableInfo; history: HistoryEntry[] };

const card: React.CSSProperties = { background: "var(--bg)", border: "1px solid var(--border)", borderRadius: 12, padding: "1.4rem", marginBottom: "1rem" };
const fieldInput: React.CSSProperties = { width: "100%", minHeight: 48, padding: "0 1rem", border: "2px solid var(--border)", borderRadius: 10, fontSize: "1rem", fontFamily: "'DM Sans', sans-serif", color: "var(--navy)", background: "white" };
const fieldLabel: React.CSSProperties = { display: "block", fontWeight: 700, color: "var(--navy)", fontSize: "0.9rem", marginBottom: "0.4rem" };
const primaryBtn: React.CSSProperties = { background: "var(--pink)", color: "white", border: "none", borderRadius: 8, padding: "0.8rem 1.5rem", fontWeight: 700, fontSize: "0.95rem", cursor: "pointer", fontFamily: "'DM Sans', sans-serif" };
const quietBtn: React.CSSProperties = { background: "white", border: "1px solid var(--border)", borderRadius: 8, padding: "0.8rem 1.5rem", fontWeight: 600, fontSize: "0.9rem", cursor: "pointer", fontFamily: "'DM Sans', sans-serif", color: "var(--navy)" };
const dangerBtn: React.CSSProperties = { ...quietBtn, color: "#dc2626", borderColor: "#fca5a5" };
const row: React.CSSProperties = { display: "flex", gap: "0.6rem", flexWrap: "wrap", marginTop: "0.9rem" };

function factsLine(day: string | null, time: string | null, city: string | null, state: string | null): string {
  const when = [day, time].filter(Boolean).join(" ");
  const where = [city, state].filter(Boolean).join(", ");
  if (when && where) return `${when} in ${where}`;
  if (when) return when;
  if (where) return `Somewhere in ${where}`;
  return "Flexible day and time";
}

export default function MahjMatchClient({ launched }: { launched: boolean }) {
  const [me, setMe] = useState<Me | null>(null);
  const [checked, setChecked] = useState(false);
  const [state, setState] = useState<MatchState | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const [city, setCity] = useState("");
  const [region, setRegion] = useState("");
  const [day, setDay] = useState("");
  const [time, setTime] = useState("");

  const loadMatch = useCallback(async () => {
    const r = await fetch("/api/match/request", { cache: "no-store" });
    if (r.ok) setState(await r.json());
  }, []);

  useEffect(() => {
    fetch("/api/auth/me", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then(async (j) => {
        if (j?.ok) {
          setMe(j);
          await loadMatch();
        }
      })
      .catch(() => {})
      .finally(() => setChecked(true));
  }, [loadMatch]);

  async function post(url: string, body: unknown): Promise<{ ok: boolean; j: Record<string, unknown> }> {
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const r = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) {
        setError(typeof j.error === "string" ? j.error : "Something went wrong. Please try again.");
        return { ok: false, j };
      }
      return { ok: true, j };
    } catch {
      setError("Something went wrong. Please check your connection and try again.");
      return { ok: false, j: {} };
    } finally {
      setBusy(false);
    }
  }

  async function createRequest(e: React.FormEvent) {
    e.preventDefault();
    const { ok } = await post("/api/match/request", { action: "create", city, state: region, day: day || undefined, time: time || undefined });
    if (ok) {
      setNotice("You're in the pool. We'll email you the moment a table is ready.");
      await loadMatch();
    }
  }

  async function cancelRequest() {
    if (!window.confirm("Cancel your Mahj Match request?")) return;
    const { ok } = await post("/api/match/request", { action: "cancel" });
    if (ok) {
      setNotice("Request cancelled.");
      await loadMatch();
    }
  }

  async function respond(tableId: string, action: "accept" | "decline" | "leave") {
    if (action === "leave" && !window.confirm("Leave this table? Your seat opens up for someone else.")) return;
    const { ok, j } = await post("/api/match/respond", { action, tableId });
    if (ok) {
      setNotice(
        action === "accept"
          ? j.tableStatus === "confirmed"
            ? "Your table is confirmed! See it below."
            : "You're in. Waiting on the rest of the table to accept."
          : action === "decline"
            ? "You declined that table. We'll keep looking for another one."
            : "You left the table."
      );
      await loadMatch();
    }
  }

  if (!checked) return <p style={{ color: "var(--muted)", textAlign: "center" }}>Loading...</p>;

  if (!me) {
    return (
      <div style={card}>
        <p style={{ margin: 0, color: "var(--navy)", lineHeight: 1.7 }}>
          Mahj Match fills an open seat for you automatically. Tell us your city, day, and time, and once three other
          players want the same game, we introduce everyone and hand you a table with a link to coordinate. Sign in
          to get started; it takes a name and an email, no password.
        </p>
        <Link href="/account" style={{ ...primaryBtn, display: "inline-block", marginTop: "1rem", textDecoration: "none" }}>
          Sign in at Your Account
        </Link>
      </div>
    );
  }

  const canUse = launched || me.qa;
  if (!canUse) {
    return (
      <div style={card}>
        <p style={{ margin: 0, color: "var(--navy)", fontWeight: 700 }}>Mahj Match is still in testing.</p>
        <p style={{ margin: "0.5rem 0 0", color: "var(--muted)" }}>It is not open to the public yet. Check back soon.</p>
      </div>
    );
  }

  return (
    <div>
      {me.qa && (
        <div style={{ ...card, background: "rgba(245,200,66,0.12)", borderColor: "#f5c842" }}>
          <p style={{ margin: 0, fontSize: "0.85rem", fontWeight: 700, color: "#a07800" }}>
            TEST ACCOUNT: this account can use Mahj Match early because it is test-classified.
          </p>
        </div>
      )}
      {error && (
        <div role="alert" style={{ ...card, background: "#fef2f2", borderColor: "#fca5a5" }}>
          <p style={{ margin: 0, color: "#dc2626", fontWeight: 600 }}>{error}</p>
        </div>
      )}
      {notice && (
        <div role="status" style={{ ...card, background: "rgba(46,201,92,0.12)", borderColor: "#2ec95c" }}>
          <p style={{ margin: 0, color: "#1a6e3a", fontWeight: 700 }}>{notice}</p>
        </div>
      )}

      {!state && <p style={{ color: "var(--muted)", textAlign: "center" }}>Checking your Mahj Match status...</p>}

      {state?.table && (
        <div style={card}>
          <p style={{ margin: 0, fontSize: "1.2rem", fontWeight: 800, color: "var(--navy)" }}>Your table is set!</p>
          <p style={{ margin: "0.4rem 0 0", color: "var(--muted)" }}>{factsLine(state.table.day, state.table.time, state.table.area, null)}</p>
          <p style={{ margin: "0.7rem 0 0", color: "var(--navy)" }}>
            Players: {state.table.members.length ? state.table.members.join(", ") : "you and three others"}
          </p>
          <div style={row}>
            <Link href={`/t/${state.table.shareCode}`} style={{ ...primaryBtn, textDecoration: "none" }}>
              See your table
            </Link>
            <button onClick={() => respond(state.table!.id, "leave")} disabled={busy} style={dangerBtn}>
              Leave table
            </button>
          </div>
        </div>
      )}

      {state?.proposal && (
        <div style={card}>
          <p style={{ margin: 0, fontSize: "1.2rem", fontWeight: 800, color: "var(--navy)" }}>A table wants to form</p>
          <p style={{ margin: "0.4rem 0 0", color: "var(--muted)" }}>
            {factsLine(state.proposal.day, state.proposal.time, state.proposal.city, state.proposal.state)}
          </p>
          <p style={{ margin: "0.7rem 0 0", color: "var(--navy)" }}>
            With you:{" "}
            {state.proposal.others.length
              ? state.proposal.others.map((o) => `${o.firstName}${o.accepted ? " (accepted)" : ""}`).join(", ")
              : "waiting to fill the table"}
          </p>
          {state.proposal.mySeatStatus === "invited" ? (
            <div style={row}>
              <button onClick={() => respond(state.proposal!.tableId, "accept")} disabled={busy} style={primaryBtn}>
                Accept
              </button>
              <button onClick={() => respond(state.proposal!.tableId, "decline")} disabled={busy} style={quietBtn}>
                Decline
              </button>
            </div>
          ) : (
            <p style={{ margin: "0.7rem 0 0", color: "#1a6e3a", fontWeight: 700 }}>You accepted. Waiting on the rest of the table.</p>
          )}
        </div>
      )}

      {state && !state.table && !state.proposal && state.request?.status === "open" && (
        <div style={card}>
          <p style={{ margin: 0, fontSize: "1.2rem", fontWeight: 800, color: "var(--navy)" }}>You&rsquo;re in the pool</p>
          <p style={{ margin: "0.4rem 0 0", color: "var(--muted)" }}>
            {factsLine(state.request.day, state.request.time, state.request.city, state.request.state)}
          </p>
          <p style={{ margin: "0.7rem 0 0", color: "var(--muted)" }}>We&rsquo;ll email you the moment three other players want the same game.</p>
          <div style={row}>
            <button onClick={cancelRequest} disabled={busy} style={quietBtn}>
              Cancel request
            </button>
          </div>
        </div>
      )}

      {state && !state.request && (
        <form onSubmit={createRequest} style={card}>
          <p style={{ margin: "0 0 1rem", fontSize: "1.2rem", fontWeight: 800, color: "var(--navy)" }}>Ask for a table</p>
          <label style={fieldLabel} htmlFor="mm-city">City</label>
          <input id="mm-city" required value={city} onChange={(e) => setCity(e.target.value)} placeholder="Las Vegas" maxLength={80} style={fieldInput} />
          <label style={{ ...fieldLabel, marginTop: "0.9rem" }} htmlFor="mm-state">State</label>
          <input id="mm-state" required value={region} onChange={(e) => setRegion(e.target.value)} placeholder="NV" maxLength={60} style={fieldInput} />
          <label style={{ ...fieldLabel, marginTop: "0.9rem" }} htmlFor="mm-day">Day (optional, any day if left blank)</label>
          <select id="mm-day" className="form-select" value={day} onChange={(e) => setDay(e.target.value)} style={fieldInput}>
            <option value="">Any day</option>
            {DAYS_OF_WEEK.map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
          <label style={{ ...fieldLabel, marginTop: "0.9rem" }} htmlFor="mm-time">Time (optional, any time if left blank)</label>
          <select id="mm-time" className="form-select" value={time} onChange={(e) => setTime(e.target.value)} style={fieldInput}>
            <option value="">Any time</option>
            {TIMES_OF_DAY.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
          <button type="submit" disabled={busy} style={{ ...primaryBtn, width: "100%", marginTop: "1.1rem", opacity: busy ? 0.7 : 1 }}>
            {busy ? "Submitting..." : "Find my table"}
          </button>
        </form>
      )}

      {!!state?.history.length && (
        <div style={card}>
          <p style={{ margin: "0 0 0.8rem", fontSize: "1.05rem", fontWeight: 800, color: "var(--navy)" }}>Match history</p>
          {state.history.map((h) => (
            <p key={h.tableId} style={{ margin: "0.3rem 0", fontSize: "0.92rem", color: "var(--muted)" }}>
              {factsLine(h.day, h.time, h.city, null)} &middot; {h.seatStatus === "declined" ? "you declined" : "you left"}
            </p>
          ))}
        </div>
      )}
    </div>
  );
}
