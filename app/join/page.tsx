import type { Metadata } from "next";
import Link from "next/link";
import StatusBadge from "@/components/status-badge";

export const metadata: Metadata = {
  title: "Join the Find My Mahj Game Directory",
  description:
    "Teachers and organizers: your listing on the national mahjong directory is free. Premium, $89 a year, adds on-platform lesson requests and a Premium Provider badge, with 90 days free when you claim your listing.",
  alternates: { canonical: "https://findmymahjgame.com/join" },
  openGraph: {
    title: "Join the Find My Mahj Game Directory",
    description:
      "Your listing on the national mahjong directory is free. Premium adds on-platform lesson requests and a Premium Provider badge: $89 a year, 90 days free when you claim.",
    url: "https://findmymahjgame.com/join",
  },
};

const card: React.CSSProperties = {
  background: "white",
  border: "2px solid var(--border)",
  borderRadius: 18,
  padding: "1.8rem",
};
const cardFeatured: React.CSSProperties = {
  ...card,
  border: "2px solid var(--pink)",
  boxShadow: "0 6px 24px rgba(233,30,140,0.12)",
};
const cardCharter: React.CSSProperties = {
  ...card,
  border: "2px solid var(--gold)",
  background: "#fffdf5",
};
const tierLead: React.CSSProperties = { fontSize: "1rem", color: "var(--muted)", lineHeight: 1.6, marginBottom: "1rem" };
const price: React.CSSProperties = { fontFamily: "var(--font-playfair), 'Playfair Display', serif", fontSize: "1.6rem", fontWeight: 900, color: "var(--pink-text)", marginTop: "0.4rem" };
const sectionH2: React.CSSProperties = { border: "none", margin: "0 0 0.3rem", fontSize: "1.6rem", color: "var(--navy)", fontFamily: "var(--font-playfair), 'Playfair Display', serif" };
const list: React.CSSProperties = { listStyle: "none", margin: "0 0 0.5rem", padding: 0 };
const liStyle: React.CSSProperties = { fontSize: "0.98rem", color: "var(--navy)", lineHeight: 1.7, paddingLeft: "1.5rem", position: "relative", marginBottom: "0.2rem" };
const label: React.CSSProperties = { fontWeight: 700, color: "var(--navy)", margin: "0 0 0.5rem" };

function Check({ children }: { children: React.ReactNode }) {
  return (
    <li style={liStyle}>
      <span style={{ position: "absolute", left: 0, color: "var(--pink)", fontWeight: 800 }}>&#10003;</span>
      {children}
    </li>
  );
}

import { lazyServerClient } from "@/lib/supabase-server";

// Invitation attribution: an outreach invite link lands here; the first visit stamps
// clicked_at so the prospect funnel can measure invite -> visit -> signup. Unknown or
// missing tokens change nothing and the page renders normally either way.
async function recordInviteClick(invite: string | undefined) {
  if (!invite || !/^inv_[A-Za-z0-9_-]{8,40}$/.test(invite)) return;
  try {
    const supabase = lazyServerClient();
    await supabase
      .from("invite_tokens")
      .update({ clicked_at: new Date().toISOString(), conversion_stage: "clicked" })
      .eq("token", invite)
      .is("clicked_at", null);
  } catch { /* attribution must never break the page */ }
}

export default async function JoinPage({ searchParams }: { searchParams: Promise<{ invite?: string }> }) {
  const { invite } = await searchParams;
  await recordInviteClick(invite);

  return (
    <main>
      <section className="page-hero">
        <p className="eyebrow">Join the directory</p>
        <h1>Join the Find My Mahj Game Directory</h1>
        <p>Anyone can join so players can find your games, classes, and events across the country. Players never pay.</p>
        <p style={{ marginTop: "0.8rem" }}>Join during launch and lock in Charter Member recognition.</p>
      </section>

      <div className="page-body" style={{ maxWidth: 920 }}>
        {/* Basic: free forever */}
        <div style={{ ...cardFeatured, marginBottom: "1.8rem" }}>
          <h2 style={sectionH2}>Basic listing</h2>
          <p style={tierLead}>Free forever. Basic gets you found: a legitimate provider never pays just to be part of the marketplace.</p>
          <div style={price}>Free</div>
          <p style={label}>Includes:</p>
          <ul style={list}>
            <Check>Your profile on the national directory</Check>
            <Check>Claim and control your listing</Check>
            <Check>Your events, classes, and open plays</Check>
            <Check>Website, email, and social links</Check>
            <Check>The same fair search and state placement as everyone</Check>
            <Check>Included in Ask Find My Mahj answers</Check>
          </ul>
        </div>

        {/* Premium: $89/year with the 90-day claim trial */}
        <div style={{ ...cardFeatured, background: "#fff5fa", marginBottom: "1.8rem" }}>
          <p className="eyebrow" style={{ marginBottom: "0.4rem" }}>Founding launch offer</p>
          <h2 style={sectionH2}>Premium</h2>
          <p style={tierLead}>Premium helps turn discovery into customers. Try it free for 90 days when you claim your listing; no card needed to start. After the trial, choose $89 a year or stay on your free Basic listing.</p>
          <div style={price}>$89/year <span style={{ fontSize: "1rem", color: "var(--muted)", fontWeight: 600 }}>90 days free when you claim</span></div>
          <p style={label}>Adds:</p>
          <ul style={list}>
            <Check>On-platform lesson requests from players, sent straight to your inbox</Check>
            <Check>The Premium Provider badge on your listing</Check>
            <Check>Your free trial never turns into a charge on its own: paying is always your explicit choice</Check>
          </ul>
        </div>

        {/* Charter Member (replaces Founding Teacher) */}
        <div style={{ ...cardCharter, marginBottom: "2.5rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.7rem", flexWrap: "wrap", marginBottom: "0.6rem" }}>
            <StatusBadge type="charter" />
            <span className="eyebrow">Early supporters, limited time</span>
          </div>
          <h2 style={sectionH2}>Charter Member</h2>
          <p style={tierLead}>A Charter Member is an early adopter who commits to helping build the directory. The badge stays on your profile permanently, our thank-you for being here first. It is recognition, not a tier above the others.</p>
          <p style={label}>To qualify:</p>
          <ul style={list}>
            <Check>Claim your listing during the launch period</Check>
            <Check>Choose Premium during your 90-day trial</Check>
            <Check>Keep an active profile</Check>
          </ul>
          <p style={label}>Charter Members receive:</p>
          <ul style={list}>
            <Check>A permanent &#11088; Charter Member badge</Check>
            <Check>Locked-in $89/year renewal, as long as you stay active</Check>
            <Check>Permanent recognition as an early supporter</Check>
          </ul>
        </div>

        {/* Founding Advisor (invitation only) */}
        <div style={{ ...cardCharter, border: "2px solid var(--navy)", background: "#f7f8ff", marginBottom: "2.5rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.7rem", flexWrap: "wrap", marginBottom: "0.6rem" }}>
            <StatusBadge type="advisor" />
            <span className="eyebrow">By invitation only</span>
          </div>
          <h2 style={sectionH2}>Founding Advisor</h2>
          <p style={tierLead}>A small group of respected teachers, organizers, and community leaders, personally invited by us, who help establish Find My Mahj Game during launch. You cannot apply, Founding Advisors are invited.</p>
          <ul style={list}>
            <Check>12 months free, then lifetime locked-in Charter pricing</Check>
            <Check>A permanent Founding Advisor badge and a featured spot on the Founding Advisors page</Check>
            <Check>Early access to new features and input on what we build</Check>
            <Check>Stacks with Verified, Community Leader, and Ambassador</Check>
          </ul>
          <Link href="/founding-advisors" style={{ color: "var(--pink-text)", fontWeight: 800, fontSize: "1.05rem", textDecoration: "none" }}>Meet our Founding Advisors &rarr;</Link>
        </div>

        {/* Status badges: Verified is active at launch; Leader/Ambassador come later */}
        <h2>Status badges</h2>
        <p>Badges are separate from your membership and stack on your profile, for example Charter Member and Verified Teacher together.</p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 260px), 1fr))", gap: "1.4rem", margin: "1.2rem 0 2rem" }}>
          <div style={card}>
            <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
              <StatusBadge type="verified" />
              <StatusBadge type="verified" label="Verified Organizer" />
              <StatusBadge type="premium" />
            </div>
            <p style={{ ...tierLead, margin: "0.8rem 0 0" }}>A trust badge earned by verifying you own your listing through the claim process. It is never sold: no payment can buy it, and paying does not add it. Shows players you are confirmed and legitimate. Stacks with Charter Member.</p>
            <p style={{ ...tierLead, margin: "0.8rem 0 0" }}>The Premium Provider badge is different: it marks a commercial membership (paid or on the 90-day trial), never trust or verification, and it has no effect on search placement.</p>
          </div>
        </div>

        <div style={{ ...card, background: "var(--bg)", borderStyle: "dashed", marginBottom: "2.5rem" }}>
          <p className="eyebrow" style={{ marginBottom: "0.6rem" }}>Coming later</p>
          <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", opacity: 0.55, marginBottom: "0.8rem" }}>
            <StatusBadge type="leader" />
            <StatusBadge type="ambassador" />
          </div>
          <p style={{ ...tierLead, margin: 0 }}>Community Leader and Ambassador recognition will launch once the directory has more active listings and event data, so we can assign them fairly.</p>
        </div>

        {/* Event Listings */}
        <h2>Event Listings</h2>
        <p>All approved teachers, organizers, leagues, tournaments, retreats, and community events may be listed at no charge during our growth phase.</p>
        <p>Our current priority is helping players discover more mahjong opportunities nationwide.</p>

        {/* CTA */}
        <div style={{ textAlign: "center", marginTop: "3rem", padding: "2.5rem 1.5rem", background: "var(--bg)", borderRadius: 20, border: "1px solid var(--border)" }}>
          <h2 style={{ border: "none", margin: "0 0 0.6rem", color: "var(--navy)", fontFamily: "var(--font-playfair), 'Playfair Display', serif", fontSize: "1.6rem" }}>Ready to join?</h2>
          <p style={{ color: "var(--muted)", fontSize: "1.05rem", lineHeight: 1.6, maxWidth: 540, margin: "0 auto 1.5rem" }}>List for free, claim your listing, and your 90 days of Premium start automatically. No card, no code.</p>
          <Link href="/get-listed" style={{ display: "inline-flex", minHeight: 56, alignItems: "center", justifyContent: "center", padding: "0 2.2rem", borderRadius: 14, background: "var(--pink)", color: "white", fontWeight: 800, fontSize: "1.1rem", textDecoration: "none" }}>Submit My Profile &rarr;</Link>
        </div>
      </div>
    </main>
  );
}
