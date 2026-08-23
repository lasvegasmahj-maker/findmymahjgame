"use client";

import { useEffect, useState, useCallback } from "react";

type SimResult = { category: string; status: "PASS" | "FAIL"; detail: string };
type SimReport = { results: SimResult[]; overall: "PASS" | "FAIL"; ranAt: string };

const heading: React.CSSProperties = { fontFamily: "var(--font-playfair), 'Playfair Display', serif", color: "var(--navy)" };
const card: React.CSSProperties = { background: "var(--bg)", border: "1px solid var(--border)", borderRadius: 10, padding: "0.9rem 1.1rem" };
const btn = (bg: string): React.CSSProperties => ({ background: bg, color: "white", border: "none", borderRadius: 8, padding: "0.6rem 1.2rem", fontWeight: 700, fontSize: "0.9rem", cursor: "pointer", fontFamily: "'DM Sans', sans-serif" });
const green = "#1a6e3a";
const red = "#b3261e";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section style={{ marginTop: "2rem" }}>
      <h2 style={{ ...heading, fontSize: "1.3rem", margin: "0 0 0.7rem" }}>{title}</h2>
      {children}
    </section>
  );
}

export default function ControlClient() {
  return (
    <main style={{ maxWidth: 1000, margin: "0 auto", padding: "2.2rem 1.2rem 4rem" }}>
      <div style={{ display: "flex", flexWrap: "wrap", alignItems: "baseline", gap: "0.8rem" }}>
        <h1 style={{ ...heading, fontSize: "2rem", margin: 0 }}>Control center</h1>
        <a href="/admin" style={{ color: "var(--pink-text)", fontWeight: 700, textDecoration: "none", fontSize: "0.9rem" }}>&larr; Admin home</a>
      </div>
      <p style={{ color: "var(--muted)", margin: "0.4rem 0 0" }}>
        Every panel reads live production data. Nothing here counts test activity as real business.
      </p>
      <SimulatorPanel />
      <ClaimsPanel />
      <ModerationPanel />
      <NotificationsPanel />
      <AnalyticsPanel />
    </main>
  );
}

function SimulatorPanel() {
  const [report, setReport] = useState<SimReport | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function run() {
    setBusy(true);
    setError("");
    setReport(null);
    try {
      const r = await fetch("/api/admin/simulator", { method: "POST" });
      const j = await r.json();
      if (!r.ok) setError(j.error || "The simulation could not run.");
      else setReport(j);
    } catch {
      setError("The simulation could not run. Check your connection.");
    }
    setBusy(false);
  }

  return (
    <Section title="Launch simulation">
      <p style={{ color: "var(--muted)", margin: "0 0 0.9rem", fontSize: "0.92rem" }}>
        Runs the entire product end to end on test accounts, then deletes them. Proves the machine works before anyone real is invited.
      </p>
      <button onClick={run} disabled={busy} style={{ ...btn("var(--navy)"), opacity: busy ? 0.6 : 1 }}>
        {busy ? "Running the full rehearsal..." : "Run launch simulation"}
      </button>
      {error && <p style={{ color: red, fontWeight: 700, marginTop: "0.8rem" }}>{error}</p>}
      {report && (
        <div style={{ marginTop: "1.1rem" }}>
          <div style={{ ...card, borderColor: report.overall === "PASS" ? green : red, borderWidth: 2, marginBottom: "0.8rem" }}>
            <span style={{ fontSize: "1.3rem", fontWeight: 800, color: report.overall === "PASS" ? green : red }}>
              {report.overall === "PASS" ? "READY" : "NOT READY"}
            </span>
            <span style={{ marginLeft: "0.8rem", color: "var(--muted)", fontSize: "0.85rem" }}>
              {report.results.filter((r) => r.status === "PASS").length} of {report.results.length} checks passed
            </span>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 280px), 1fr))", gap: "0.5rem" }}>
            {report.results.map((r) => (
              <div key={r.category} style={{ ...card, display: "flex", gap: "0.6rem", alignItems: "flex-start" }}>
                <span style={{ fontWeight: 800, color: r.status === "PASS" ? green : red, minWidth: 42 }}>{r.status}</span>
                <span>
                  <span style={{ fontWeight: 700, color: "var(--navy)", display: "block" }}>{r.category}</span>
                  <span style={{ fontSize: "0.8rem", color: "var(--muted)" }}>{r.detail}</span>
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </Section>
  );
}

type Claim = { id: string; listing_table: string; listing_id: string; claimer_email: string; confidence: string | null; status: string; decision_reason: string | null; created_at: string };

function ClaimsPanel() {
  const [items, setItems] = useState<Claim[]>([]);
  const [msg, setMsg] = useState("");
  const load = useCallback(() => {
    fetch("/api/admin/claims?status=needs_review", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null)).then((j) => j && setItems(j.items || [])).catch(() => {});
  }, []);
  useEffect(load, [load]);

  async function decide(id: string, decision: "approve" | "reject") {
    setMsg("");
    const r = await fetch("/api/admin/claims", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, decision, reason: decision === "reject" ? "Reviewed by admin" : undefined }) });
    if (r.ok) { setMsg(decision === "approve" ? "Approved and ownership granted." : "Rejected."); void load(); }
    else setMsg((await r.json()).error || "Could not update the claim.");
  }

  return (
    <Section title={`Provider claims awaiting review (${items.length})`}>
      {msg && <p style={{ color: "var(--navy)", fontWeight: 700, fontSize: "0.9rem" }}>{msg}</p>}
      {items.length === 0 ? (
        <p style={{ color: "var(--muted)" }}>No claims need a human right now. High-confidence claims approve automatically.</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
          {items.map((c) => (
            <div key={c.id} style={{ ...card, display: "flex", flexWrap: "wrap", gap: "0.8rem", alignItems: "center", justifyContent: "space-between" }}>
              <div>
                <div style={{ fontWeight: 700, color: "var(--navy)" }}>{c.claimer_email}</div>
                <div style={{ fontSize: "0.8rem", color: "var(--muted)" }}>{c.listing_table} · confidence {c.confidence || "unknown"} · {c.decision_reason}</div>
              </div>
              <div style={{ display: "flex", gap: "0.5rem" }}>
                <button onClick={() => decide(c.id, "approve")} style={btn(green)}>Approve</button>
                <button onClick={() => decide(c.id, "reject")} style={btn(red)}>Reject</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </Section>
  );
}

type Report = { id: string; category: string; detail: string | null; status: string; created_at: string };

function ModerationPanel() {
  const [items, setItems] = useState<Report[]>([]);
  const [msg, setMsg] = useState("");
  const load = useCallback(() => {
    fetch("/api/admin/reports?status=needs_human", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null)).then((j) => j && setItems(j.items || [])).catch(() => {});
  }, []);
  useEffect(load, [load]);

  async function decide(id: string, decision: "resolve" | "dismiss") {
    setMsg("");
    const r = await fetch("/api/admin/reports", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, decision, triage_note: "Reviewed by admin" }) });
    if (r.ok) { setMsg("Updated."); void load(); }
    else setMsg((await r.json()).error || "Could not update the report.");
  }

  return (
    <Section title={`Reports needing a human (${items.length})`}>
      {msg && <p style={{ color: "var(--navy)", fontWeight: 700, fontSize: "0.9rem" }}>{msg}</p>}
      {items.length === 0 ? (
        <p style={{ color: "var(--muted)" }}>No serious reports are waiting. Low-risk reports are triaged automatically.</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
          {items.map((r) => (
            <div key={r.id} style={{ ...card, display: "flex", flexWrap: "wrap", gap: "0.8rem", alignItems: "center", justifyContent: "space-between" }}>
              <div>
                <div style={{ fontWeight: 700, color: "var(--navy)", textTransform: "capitalize" }}>{r.category.replace("_", " and ")}</div>
                <div style={{ fontSize: "0.8rem", color: "var(--muted)" }}>{r.detail || "No detail provided."}</div>
              </div>
              <div style={{ display: "flex", gap: "0.5rem" }}>
                <button onClick={() => decide(r.id, "resolve")} style={btn(green)}>Resolve</button>
                <button onClick={() => decide(r.id, "dismiss")} style={btn("var(--muted)")}>Dismiss</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </Section>
  );
}

type NotifWindow = Record<string, { sent: number; failed: number; skipped_qa: number }>;

function NotificationsPanel() {
  const [data, setData] = useState<{ windows: { last7Days: NotifWindow; last30Days: NotifWindow }; failures: Array<{ kind: string; email: string; error: string | null }> } | null>(null);
  useEffect(() => {
    void fetch("/api/admin/notifications", { cache: "no-store" }).then((r) => (r.ok ? r.json() : null)).then(setData).catch(() => {});
  }, []);
  if (!data) return <Section title="Notifications"><p style={{ color: "var(--muted)" }}>Loading...</p></Section>;
  const kinds = Object.keys(data.windows.last7Days || {});
  return (
    <Section title="Notifications (last 7 days)">
      {kinds.length === 0 ? (
        <p style={{ color: "var(--muted)" }}>No transactional emails have been sent yet.</p>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 220px), 1fr))", gap: "0.5rem" }}>
          {kinds.map((k) => {
            const w = data.windows.last7Days[k];
            return (
              <div key={k} style={card}>
                <div style={{ fontWeight: 700, color: "var(--navy)", fontSize: "0.85rem" }}>{k}</div>
                <div style={{ fontSize: "0.8rem", color: "var(--muted)" }}>sent {w.sent} · failed {w.failed} · qa {w.skipped_qa}</div>
              </div>
            );
          })}
        </div>
      )}
      {data.failures.length > 0 && (
        <p style={{ color: red, fontWeight: 700, marginTop: "0.8rem", fontSize: "0.9rem" }}>{data.failures.length} failed sends in the window. Investigate the notification cron.</p>
      )}
    </Section>
  );
}

function AnalyticsPanel() {
  const [data, setData] = useState<{ windows: { "7d": { real: { byName: Record<string, number> }; test: { byName: Record<string, number> } } }; dataHealth: { totalEvents: number } } | null>(null);
  useEffect(() => {
    void fetch("/api/admin/analytics", { cache: "no-store" }).then((r) => (r.ok ? r.json() : null)).then(setData).catch(() => {});
  }, []);
  if (!data) return <Section title="Analytics"><p style={{ color: "var(--muted)" }}>Loading...</p></Section>;
  const real = data.windows["7d"].real.byName || {};
  const names = Object.keys(real).sort((a, b) => real[b] - real[a]).slice(0, 12);
  return (
    <Section title="First-party analytics (real, last 7 days)">
      <p style={{ color: "var(--muted)", fontSize: "0.85rem", margin: "0 0 0.7rem" }}>{data.dataHealth.totalEvents} events recorded total. Test traffic is tracked separately and never mixed in here.</p>
      {names.length === 0 ? (
        <p style={{ color: "var(--muted)" }}>No real events in the last 7 days. This is expected before launch.</p>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 200px), 1fr))", gap: "0.5rem" }}>
          {names.map((n) => (
            <div key={n} style={card}>
              <div style={{ fontSize: "1.3rem", fontWeight: 800, color: "var(--navy)" }}>{real[n]}</div>
              <div style={{ fontSize: "0.8rem", color: "var(--muted)" }}>{n}</div>
            </div>
          ))}
        </div>
      )}
    </Section>
  );
}
