import { cookies } from "next/headers";
import { createClient } from "@supabase/supabase-js";
import { verifyAdminSessionToken, ADMIN_COOKIE } from "@/lib/admin-auth";
import { PROSPECT_STATES } from "@/lib/prospect-state";
import { lazyServerClient } from "@/lib/supabase-server";

export const dynamic = "force-dynamic";

const supabase = lazyServerClient();

const FUNNEL: Array<[string, string]> = [
  ["DISCOVERED", "Discovered"],
  ["VERIFYING", "Verifying"],
  ["QUALIFIED", "Qualified"],
  ["NEEDS_REVIEW", "Needs review"],
  ["READY_FOR_OUTREACH", "Ready for outreach"],
  ["OUTREACH_ACTIVE", "In outreach"],
  ["FOLLOW_UP_DUE", "Follow-ups due"],
  ["REPLIED", "Replied"],
  ["INTERESTED", "Interested"],
  ["ONBOARDING", "Onboarding"],
  ["SIGNUP_STARTED", "Signups started"],
  ["LISTING_SUBMITTED", "Listings submitted"],
  ["CONVERTED", "Converted"],
  ["UNSUBSCRIBED", "Unsubscribed"],
  ["BOUNCED", "Bounced"],
  ["DO_NOT_CONTACT", "Do not contact"],
];

export default async function GrowthAgentsPage() {
  const c = await cookies();
  if (!verifyAdminSessionToken(c.get(ADMIN_COOKIE)?.value)) {
    return (
      <main style={{ maxWidth: 480, margin: "0 auto", padding: "4rem 1.5rem", textAlign: "center" }}>
        <p style={{ fontSize: "1.1rem", color: "var(--navy)" }}>Please sign in to view Growth Agents.</p>
        <a href="/admin" style={{ color: "var(--pink-text)", fontWeight: 700 }}>Go to Admin</a>
      </main>
    );
  }

  let counts: Record<string, number> | null = null;
  const settings: Record<string, string> = {};
  type PhoneRow = { id: string; name: string; city: string | null; state: string | null; phone: string | null; note: string };
  let phoneQueue: PhoneRow[] = [];
  let drafts: Array<{ id: string; subject: string | null; prospect: string; created: string }> = [];
  let recentProspects: Array<{ name: string; city: string | null; state: string | null; type: string; score: number | null; status: string }> = [];
  let objectives: Array<{ reason: string | null; created: string }> = [];
  try {
    const [{ data: rows, error }, { data: st }, { data: pv }, { data: pe }, { data: dr }, { data: rp }, { data: ob }] = await Promise.all([
      supabase.from("prospects").select("status"),
      supabase.from("app_settings").select("key, value").like("key", "growth_%"),
      supabase.from("venue_listings").select("id,business_name,city,state,phone,reviewer_notes").eq("review_flag", "phone_verify").limit(200),
      supabase.from("event_listings").select("id,event_name,city,state,reviewer_notes").eq("review_flag", "phone_verify").limit(50),
      supabase.from("outreach_messages").select("id,generated_subject,created_at,prospect_id,prospects(name)").eq("send_status", "draft").eq("approved_by_human", false).order("created_at", { ascending: false }).limit(40),
      supabase.from("prospects").select("name,city,state,prospect_type,qualification_score,status").order("discovered_at", { ascending: false }).limit(15),
      supabase.from("outreach_events").select("reason,created_at").eq("agent", "growth-allocation-l0").order("created_at", { ascending: false }).limit(12),
    ]);
    if (!error && rows) {
      counts = {};
      for (const s of PROSPECT_STATES) counts[s] = 0;
      for (const r of rows as { status: string }[]) counts[r.status] = (counts[r.status] || 0) + 1;
    }
    for (const s of (st || []) as { key: string; value: string }[]) settings[s.key] = s.value;
    type VRow = { id: string; business_name: string; city: string | null; state: string | null; phone: string | null; reviewer_notes: string | null };
    type ERow = { id: string; event_name: string; city: string | null; state: string | null; reviewer_notes: string | null };
    phoneQueue = [
      ...((pv || []) as VRow[]).map((r) => ({ id: r.id, name: r.business_name, city: r.city, state: r.state, phone: r.phone, note: (r.reviewer_notes || "").split("PHONE QUEUE:").pop()?.slice(0, 90) || "" })),
      ...((pe || []) as ERow[]).map((r) => ({ id: r.id, name: r.event_name, city: r.city, state: r.state, phone: null, note: (r.reviewer_notes || "").split("PHONE QUEUE:").pop()?.slice(0, 90) || "" })),
    ];
    type DRow = { id: string; generated_subject: string | null; created_at: string; prospect_id: string; prospects: { name: string } | null };
    drafts = ((dr || []) as unknown as DRow[]).map((d) => ({ id: d.id, subject: d.generated_subject, prospect: d.prospects?.name || d.prospect_id, created: String(d.created_at).slice(0, 10) }));
    type PRow = { name: string; city: string | null; state: string | null; prospect_type: string; qualification_score: number | null; status: string };
    recentProspects = ((rp || []) as PRow[]).map((r) => ({ name: r.name, city: r.city, state: r.state, type: r.prospect_type, score: r.qualification_score, status: r.status }));
    objectives = ((ob || []) as Array<{ reason: string | null; created_at: string }>).map((o) => ({ reason: o.reason, created: String(o.created_at).slice(0, 10) }));
  } catch {
    counts = null;
  }

  // Level 2 readiness. Send cap, webhook secret, and production sending read live
  // configuration; the TESTED rows are
  // point-in-time
  // engineering assessments from the 2026-08-22 Phase 4 gate, backed by tests/. Business decisions are labelled as such so engineering-done
  // is not mistaken for permission to send.
  const sendCap = Number(settings["growth_daily_send_limit"] ?? "0");
  const outreachOn = settings["growth_outreach_enabled"] === "true";
  const webhookSecretSet = Boolean(process.env.RESEND_WEBHOOK_SECRET);
  const READINESS: Array<[string, string, string]> = [
    ["Prospect discovery", "TESTED", "5 metros plus nationwide tournaments researched into the CRM"],
    ["Dedupe and canonical exclusions", "TESTED", "shared admission guards with automated tests"],
    ["Qualification", "TESTED", "deterministic scoring; deep-verify pass on review prospects"],
    ["Provenance", "TESTED", "every prospect carries source URL and quoted evidence"],
    ["Draft generation", "TESTED", "deterministic fact-only templates, stored unapproved"],
    ["Human draft approval", "HUMAN DECISION REQUIRED", "drafts wait in this console for explicit approval"],
    ["Unsubscribe suppression", "TESTED", "one-click rail live; suppression checked on every send"],
    ["Bounce handling", "TESTED", "webhook suppresses and cancels; fails closed"],
    ["Complaint handling", "TESTED", "same webhook path as bounces"],
    ["Invite attribution", "TESTED", "join page stamps clicks; tokens tracked to conversion"],
    ["Reply classification", "TESTED", "deterministic classifier plus policy layer; 36 automated tests"],
    ["Ambiguous replies to human review", "TESTED", "low confidence never changes state; follow-ups pause and a person decides"],
    ["Freshness monitoring", "TESTED", "severity-scored, idempotent, cadence configurable"],
    ["Send-rate enforcement", "READY", `guards fail closed; cap currently ${sendCap}`],
    ["Sender domain configuration", "HUMAN DECISION REQUIRED", "dedicated subdomain on Resend not yet chosen"],
    ["Webhook secret configured", webhookSecretSet ? "READY" : "NOT CONFIGURED", webhookSecretSet ? "RESEND_WEBHOOK_SECRET present" : "set RESEND_WEBHOOK_SECRET in Vercel when the sender is created"],
    ["Production sending", outreachOn ? "BLOCKED" : "HUMAN DECISION REQUIRED", outreachOn ? "flag on but autonomy still gates" : "explicitly disabled; Level 2 is NOT enabled"],
  ];

  const paused = settings["growth_global_pause"] !== "false";
  const level = settings["growth_autonomy_level"] ?? "0";

  return (
    <main style={{ maxWidth: 900, margin: "0 auto", padding: "2.5rem 1.2rem 4rem" }}>
      <h1 style={{ fontFamily: "var(--font-playfair), 'Playfair Display', serif", fontSize: "2rem", color: "var(--navy)", margin: "0 0 0.4rem" }}>Growth Agents</h1>
      <p style={{ color: "var(--muted)", margin: "0 0 1.6rem" }}>
        Prospecting, qualification, and outreach oversight. Research only until you raise the autonomy level.
      </p>

      <div style={{ display: "flex", gap: "0.8rem", flexWrap: "wrap", marginBottom: "1.8rem" }}>
        <div style={{ background: paused ? "#fee2e2" : "#dcfce7", border: `1px solid ${paused ? "#fca5a5" : "#86efac"}`, borderRadius: 10, padding: "0.7rem 1.1rem", fontWeight: 700, color: paused ? "#b3261e" : "#1a6e3a" }}>
          {paused ? "OUTREACH PAUSED (global)" : "Global pause off"}
        </div>
        <div style={{ background: "var(--bg)", border: "1px solid var(--border)", borderRadius: 10, padding: "0.7rem 1.1rem", color: "var(--navy)" }}>
          Autonomy level: <strong>{level}</strong> (0 = research only)
        </div>
        <div style={{ background: "var(--bg)", border: "1px solid var(--border)", borderRadius: 10, padding: "0.7rem 1.1rem", color: "var(--navy)" }}>
          Automatic sending: <strong>{outreachOn ? "enabled" : "disabled"}</strong>
        </div>
      </div>

      {counts === null ? (
        <div style={{ background: "var(--bg)", border: "1px solid var(--border)", borderRadius: 12, padding: "2rem", color: "var(--muted)" }}>
          The Growth CRM tables are not in the database yet. Apply
          supabase/migrations/2026-08-20-growth-crm.sql in the Supabase SQL editor and this
          dashboard will populate.
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 200px), 1fr))", gap: "0.8rem" }}>
          {FUNNEL.map(([key, label]) => (
            <div key={key} style={{ background: "var(--bg)", border: "1px solid var(--border)", borderRadius: 10, padding: "0.9rem 1rem" }}>
              <div style={{ fontSize: "1.5rem", fontWeight: 800, color: "var(--navy)" }}>{counts![key] ?? 0}</div>
              <div style={{ fontSize: "0.8rem", color: "var(--muted)", fontWeight: 600 }}>{label}</div>
            </div>
          ))}
        </div>
      )}



      <h2 style={{ fontFamily: "var(--font-playfair), 'Playfair Display', serif", fontSize: "1.4rem", color: "var(--navy)", margin: "2.2rem 0 0.6rem" }}>Level 2 readiness</h2>
      <p style={{ color: "var(--muted)", fontSize: "0.88rem", margin: "0 0 0.8rem" }}>Level 2 (guarded automatic sending) is NOT enabled. This shows what is engineering-ready versus what waits on your decision.</p>
      <div style={{ display: "grid", gap: "0.35rem" }}>
        {READINESS.map(([item, status, note]) => (
          <div key={item} style={{ display: "flex", flexWrap: "wrap", gap: "0.3rem 0.7rem", alignItems: "baseline", fontSize: "0.88rem" }}>
            <span style={{ minWidth: "min(190px, 45vw)", fontWeight: 700, color: "var(--navy)" }}>{item}</span>
            <span style={{ fontWeight: 800, color: status === "TESTED" || status === "READY" ? "var(--green-dark)" : status === "NOT CONFIGURED" || status === "BLOCKED" ? "#b3261e" : "#a07800" }}>{status}</span>
            <span style={{ color: "var(--muted)", wordBreak: "break-word" }}>{note}</span>
          </div>
        ))}
      </div>

      <h2 style={{ fontFamily: "var(--font-playfair), 'Playfair Display', serif", fontSize: "1.4rem", color: "var(--navy)", margin: "2.2rem 0 0.6rem" }}>Outreach drafts awaiting your approval ({drafts.length})</h2>
      {drafts.length === 0 ? <p style={{ color: "var(--muted)" }}>No drafts. Run the draft generator after qualifying prospects.</p> : (
        <div style={{ display: "grid", gap: "0.5rem" }}>
          {drafts.map((d) => (
            <div key={d.id} style={{ background: "var(--bg)", border: "1px solid var(--border)", borderRadius: 8, padding: "0.6rem 0.9rem", fontSize: "0.9rem", color: "var(--navy)" }}>
              <strong>{d.prospect}</strong>: {d.subject} <span style={{ color: "var(--muted)" }}>({d.created}; nothing sends until approved and autonomy allows)</span>
            </div>
          ))}
        </div>
      )}

      <h2 style={{ fontFamily: "var(--font-playfair), 'Playfair Display', serif", fontSize: "1.4rem", color: "var(--navy)", margin: "2.2rem 0 0.6rem" }}>Phone verification queue ({phoneQueue.length})</h2>
      {phoneQueue.length === 0 ? <p style={{ color: "var(--muted)" }}>Nothing waiting on a call.</p> : (
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.88rem" }}>
            <thead><tr>{["Listing", "Where", "Phone", "Why"].map((h) => <th key={h} style={{ textAlign: "left", padding: "0.5rem 0.7rem", background: "var(--bg)", color: "var(--navy)", fontSize: "0.72rem", textTransform: "uppercase", letterSpacing: "0.08em" }}>{h}</th>)}</tr></thead>
            <tbody>
              {phoneQueue.slice(0, 60).map((r) => (
                <tr key={r.id} style={{ borderBottom: "1px solid var(--border)" }}>
                  <td style={{ padding: "0.5rem 0.7rem", fontWeight: 600, color: "var(--navy)" }}>{r.name}</td>
                  <td style={{ padding: "0.5rem 0.7rem", color: "var(--muted)" }}>{[r.city, r.state].filter(Boolean).join(", ")}</td>
                  <td style={{ padding: "0.5rem 0.7rem" }}>{r.phone ? <a href={"tel:" + r.phone.replace(/[^0-9+]/g, "")} style={{ color: "var(--pink-text)", fontWeight: 700 }}>{r.phone}</a> : "see note"}</td>
                  <td style={{ padding: "0.5rem 0.7rem", color: "var(--muted)" }}>{r.note}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {phoneQueue.length > 60 && <p style={{ color: "var(--muted)", fontSize: "0.8rem" }}>Showing 60 of {phoneQueue.length}.</p>}
        </div>
      )}

      <h2 style={{ fontFamily: "var(--font-playfair), 'Playfair Display', serif", fontSize: "1.4rem", color: "var(--navy)", margin: "2.2rem 0 0.6rem" }}>Newest prospects</h2>
      <div style={{ display: "grid", gap: "0.4rem" }}>
        {recentProspects.map((r, i) => (
          <div key={i} style={{ fontSize: "0.88rem", color: "var(--navy)" }}>
            <strong>{r.name}</strong> <span style={{ color: "var(--muted)" }}>{r.type}, {[r.city, r.state].filter(Boolean).join(", ")}, score {r.score ?? "-"}, {r.status}</span>
          </div>
        ))}
      </div>

      <h2 style={{ fontFamily: "var(--font-playfair), 'Playfair Display', serif", fontSize: "1.4rem", color: "var(--navy)", margin: "2.2rem 0 0.6rem" }}>Ranked growth objectives</h2>
      <ol style={{ paddingLeft: "1.2rem", color: "var(--navy)", fontSize: "0.9rem", display: "grid", gap: "0.3rem" }}>
        {objectives.map((o, i) => <li key={i}>{o.reason} <span style={{ color: "var(--muted)" }}>({o.created})</span></li>)}
      </ol>

      <p style={{ marginTop: "2rem", fontSize: "0.85rem", color: "var(--muted)" }}>
        Safety: sending is governed by deterministic guards (lib/growth-guards.ts) that fail
        closed, a database state machine (lib/prospect-state.ts), the global suppression list,
        and per-campaign limits. No email can be sent at autonomy level 0 regardless of what
        any agent requests.
      </p>
    </main>
  );
}
