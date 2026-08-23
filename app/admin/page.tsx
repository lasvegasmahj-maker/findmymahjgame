import { cookies } from "next/headers";
import { verifyAdminSessionToken, ADMIN_COOKIE } from "@/lib/admin-auth";
import { lazyServerClient } from "@/lib/supabase-server";
import { readTruthMetrics, readDataQualityIssues, readMembershipBreakdown, readPremiumLeadDiagnostic, type TruthMetrics, type DataQualityIssue, type MembershipBreakdown, type PremiumLeadDiagnostic } from "@/lib/data-trust";
import { LAUNCH_GATES } from "@/lib/launch-gates";
import AdminLogin from "@/components/admin-login";

export const dynamic = "force-dynamic";

const supabase = lazyServerClient();

const heading: React.CSSProperties = { fontFamily: "var(--font-playfair), 'Playfair Display', serif", color: "var(--navy)" };
const card: React.CSSProperties = { background: "var(--bg)", border: "1px solid var(--border)", borderRadius: 10, padding: "0.8rem 1rem" };

function Stat({ label, value, sub, href, alert }: { label: string; value: string | number; sub?: string; href?: string; alert?: boolean }) {
  const body = (
    <div style={{ ...card, height: "100%" }}>
      <div style={{ fontSize: "1.6rem", fontWeight: 800, color: alert ? "#b3261e" : "var(--navy)", fontVariantNumeric: "tabular-nums" }}>{value}</div>
      <div style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--navy)" }}>{label}</div>
      {sub && <div style={{ fontSize: "0.76rem", color: "var(--muted)", marginTop: "0.2rem" }}>{sub}</div>}
    </div>
  );
  return href ? <a href={href} style={{ textDecoration: "none" }}>{body}</a> : body;
}

function Section({ title, source, children }: { title: string; source: string; children: React.ReactNode }) {
  return (
    <section style={{ marginTop: "1.8rem" }}>
      <div style={{ display: "flex", flexWrap: "wrap", alignItems: "baseline", gap: "0.6rem" }}>
        <h2 style={{ ...heading, fontSize: "1.25rem", margin: 0 }}>{title}</h2>
        <span style={{ fontSize: "0.72rem", fontWeight: 700, color: "var(--muted)", letterSpacing: "0.03em" }}>SOURCE: {source}</span>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 190px), 1fr))", gap: "0.6rem", marginTop: "0.6rem" }}>
        {children}
      </div>
    </section>
  );
}

function NotConnected({ label, note }: { label: string; note: string }) {
  return (
    <div style={{ ...card, borderStyle: "dashed" }}>
      <div style={{ fontSize: "1rem", fontWeight: 800, color: "var(--muted)" }}>Not connected</div>
      <div style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--navy)" }}>{label}</div>
      <div style={{ fontSize: "0.76rem", color: "var(--muted)", marginTop: "0.2rem" }}>{note}</div>
    </div>
  );
}

const NAV: Array<[string, string, string]> = [
  ["Control center", "/admin/control", "Launch simulation, claims, moderation, notifications, analytics"],
  ["Review queues", "/admin/review", "Approve or decline listings, players, inquiries"],
  ["Growth agents", "/admin/growth", "Coverage, digest, prospects, drafts, freshness"],
  ["Today", "/admin/today", "Roll-up of items awaiting action"],
  ["Metrics", "/admin/metrics", "Table funnel and referral counts"],
  ["Heatmap", "/admin/heatmap", "Geographic activity"],
  ["Relationships", "/admin/relationships", "Hand-curated CRM"],
];

export default async function AdminHome() {
  const c = await cookies();
  if (!verifyAdminSessionToken(c.get(ADMIN_COOKIE)?.value)) return <AdminLogin />;

  let metrics: TruthMetrics | null = null;
  let issues: DataQualityIssue[] = [];
  let membership: MembershipBreakdown | null = null;
  let leads: PremiumLeadDiagnostic | null = null;
  let loadError: string | null = null;
  let gates: Array<{ label: string; key: string; on: boolean | null }> = [];
  try {
    const { data: gateRows, error: gateErr } = await supabase
      .from("app_settings").select("key, value").in("key", Object.values(LAUNCH_GATES));
    const gateMap = new Map((gateRows || []).map((r) => [r.key, r.value]));
    // A failed read is unknown, never a silent OFF: this is the most safety
    // critical panel, so it must never claim closed when it cannot see the value.
    const readGate = (key: string): boolean | null => (gateErr ? null : gateMap.get(key) === "true");
    gates = [
      { label: "Public signup", key: LAUNCH_GATES.publicSignup, on: readGate(LAUNCH_GATES.publicSignup) },
      { label: "Provider claims", key: LAUNCH_GATES.providerClaims, on: readGate(LAUNCH_GATES.providerClaims) },
      { label: "Payments", key: LAUNCH_GATES.payments, on: readGate(LAUNCH_GATES.payments) },
      { label: "Player matching", key: LAUNCH_GATES.playerMatching, on: readGate(LAUNCH_GATES.playerMatching) },
    ];
    [metrics, issues, membership, leads] = await Promise.all([
      readTruthMetrics(supabase),
      readDataQualityIssues(supabase),
      readMembershipBreakdown(supabase),
      readPremiumLeadDiagnostic(supabase),
    ]);
  } catch (err) {
    console.error("admin home metrics failed", err);
    loadError = "Metrics could not be computed. The numbers are missing, not zero.";
  }

  const m = metrics;
  return (
    <main style={{ maxWidth: 960, margin: "0 auto", padding: "2.2rem 1.2rem 4rem" }}>
      <div style={{ display: "flex", flexWrap: "wrap", alignItems: "baseline", gap: "0.8rem" }}>
        <h1 style={{ ...heading, fontSize: "2rem", margin: 0 }}>Find My Mahj Game admin</h1>
        <span style={{ fontSize: "0.72rem", fontWeight: 800, color: "var(--green-dark)", border: "1px solid var(--green-dark)", borderRadius: 6, padding: "0.15rem 0.5rem", letterSpacing: "0.04em" }}>
          PRODUCTION LIVE DATA
        </span>
      </div>
      <p style={{ color: "var(--muted)", margin: "0.4rem 0 0" }}>
        Every number below is computed from production records at page load. Signups count only real external people;
        imported directory listings and researched prospects are never counted as signups.
      </p>

      <nav style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 200px), 1fr))", gap: "0.6rem", marginTop: "1.4rem" }}>
        {NAV.map(([label, href, desc]) => (
          <a key={href} href={href} style={{ ...card, textDecoration: "none" }}>
            <div style={{ fontWeight: 800, color: "var(--pink-text)" }}>{label}</div>
            <div style={{ fontSize: "0.78rem", color: "var(--muted)" }}>{desc}</div>
          </a>
        ))}
      </nav>

      {loadError && (
        <p style={{ background: "#fee2e2", border: "1px solid #fca5a5", borderRadius: 10, padding: "0.7rem 1rem", color: "#b3261e", fontWeight: 700, marginTop: "1.4rem" }}>
          {loadError}
        </p>
      )}

      <Section title="Launch readiness" source="app_settings launch gates, read live">
        {gates.map((g) => (
          <div key={g.key} style={{ ...card }}>
            <div style={{ fontSize: "1.1rem", fontWeight: 800, color: g.on === null ? "var(--muted)" : g.on ? "#b3261e" : "var(--green-dark)" }}>
              {g.on === null ? "UNKNOWN" : g.on ? "ON" : "OFF"}
            </div>
            <div style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--navy)" }}>{g.label}</div>
            <div style={{ fontSize: "0.76rem", color: "var(--muted)", marginTop: "0.2rem" }}>
              {g.on === null ? "Could not read the setting. State unknown." : g.on ? "Live to the public." : "Closed. This is the right state before launch. Only you can flip it."}
            </div>
          </div>
        ))}
      </Section>

      {m && (
        <>
          <Section title="Real people" source="Supabase production tables, record_class = real_external">
            <Stat label="Real player signups" value={m.realPlayers} sub="published player listings from real external people" href="/admin/review" />
            <Stat label="Real players pending review" value={m.realPlayersPending} href="/admin/review" />
            <Stat label="Real provider submissions" value={m.realProviderSubmissions} sub="a submission requires a person filling in the form" />
            <Stat label="Claimed listings" value={m.claimedListings} sub="listings a real owner has claimed" />
            <Stat label="Seed, test and internal records" value={m.nonRealPlayers + m.testProviderSubmissions} sub="classified and excluded from every signup number" />
          </Section>

          <Section title="Membership and money" source="premium_until entitlement dates + payment records; a trial never counts as paying">
            <Stat label="Basic (free forever)" value={membership ? membership.basic : "?"} sub="published with no active Premium entitlement" />
            <Stat label="Complimentary Premium trial" value={membership ? membership.complimentaryTrial : "?"} sub="90 days from claim; no card, zero revenue" />
            <Stat label="Paid Premium" value={membership ? membership.paidPremium : "?"} sub="requires a real payment record" />
            <Stat label="Expired trial, back to Basic" value={membership ? membership.expiredReverted : "?"} sub="entitlement lapsed without payment; listing stays live" />
            <Stat label="Charter recognition" value={m.foundingMembers} sub="recognition, not a tier; no ranking effect" />
            <Stat label="Verified paying customers" value={m.verifiedPayments} sub="rows with a real payment id" />
            <NotConnected label="Revenue and MRR" note="No payment provider is integrated. Money metrics appear here once Stripe (or equivalent) is connected and becomes the source of truth." />
          </Section>

          <Section title="Premium conversion diagnostic" source="provider_leads metadata, real_external delivered leads only">
            <Stat label="Premium providers, 0 leads" value={leads ? leads.buckets.none : "?"} sub="no real leads yet: a liquidity signal, not a value signal" />
            <Stat label="1 lead" value={leads ? leads.buckets.one : "?"} />
            <Stat label="2-3 leads" value={leads ? leads.buckets.twoToThree : "?"} />
            <Stat label="4+ leads" value={leads ? leads.buckets.fourPlus : "?"} />
            <Stat
              label="Got a lead, then chose $89"
              value={leads ? `${leads.providersWithRealLeadWhoPaid} of ${leads.providersWithRealLead}` : "?"}
              sub="the primary diagnostic: separates liquidity failure from Premium value failure. No target is set; real data decides."
            />
          </Section>

          <Section title="Directory" source="Supabase venue_listings and event_listings">
            <Stat label="Published listings" value={m.publishedListings} href="/admin/review" />
            <Stat label="Research sourced" value={m.importedListings} sub="found and verified by agents; not signups" />
            <Stat label="Owner submitted" value={m.ownerSubmittedListings} sub="published from a provider's own submission" />
            <Stat label="Pending review" value={m.pendingReviewListings} href="/admin/review" />
          </Section>

          <Section title="Traffic and SEO" source="external systems">
            <NotConnected label="Site traffic (GA4)" note="Google Analytics is not connected to this dashboard." />
            <NotConnected label="Google Search (Search Console)" note="Search Console is set up for the site but not wired into this dashboard yet. View it at search.google.com/search-console." />
          </Section>

          <Section title="Data quality" source="deterministic reconciliation checks, computed live">
            {issues.length === 0 ? (
              <div style={{ ...card }}>
                <div style={{ fontSize: "1rem", fontWeight: 800, color: "var(--green-dark)" }}>All checks pass</div>
                <div style={{ fontSize: "0.78rem", color: "var(--muted)" }}>No seed data in public views, no unclassified records, no paid-looking rows without a payment record.</div>
              </div>
            ) : (
              issues.map((i) => (
                <Stat key={i.check} label={i.check} value={i.count} sub={i.detail} alert />
              ))
            )}
          </Section>
        </>
      )}
    </main>
  );
}
