import { cookies } from "next/headers";
import { createClient } from "@supabase/supabase-js";
import { verifyAdminSessionToken, ADMIN_COOKIE } from "@/lib/admin-auth";
import { PROSPECT_STATES } from "@/lib/prospect-state";

export const dynamic = "force-dynamic";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

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
  let settings: Record<string, string> = {};
  try {
    const [{ data: rows, error }, { data: st }] = await Promise.all([
      supabase.from("prospects").select("status"),
      supabase.from("app_settings").select("key, value").like("key", "growth_%"),
    ]);
    if (!error && rows) {
      counts = {};
      for (const s of PROSPECT_STATES) counts[s] = 0;
      for (const r of rows as { status: string }[]) counts[r.status] = (counts[r.status] || 0) + 1;
    }
    for (const s of (st || []) as { key: string; value: string }[]) settings[s.key] = s.value;
  } catch {
    counts = null;
  }

  const paused = settings["growth_global_pause"] !== "false";
  const outreachOn = settings["growth_outreach_enabled"] === "true";
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

      <p style={{ marginTop: "2rem", fontSize: "0.85rem", color: "var(--muted)" }}>
        Safety: sending is governed by deterministic guards (lib/growth-guards.ts) that fail
        closed, a database state machine (lib/prospect-state.ts), the global suppression list,
        and per-campaign limits. No email can be sent at autonomy level 0 regardless of what
        any agent requests.
      </p>
    </main>
  );
}
