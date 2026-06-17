import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Join the Find My Mahj Game Directory",
  description:
    "Teachers, organizers, leagues, tournaments, retreats, cruises, and community leaders: create a free profile and list your events on the national mahjong directory. Founding Partner spots are open now.",
  alternates: { canonical: "https://findmymahjgame.com/join" },
  openGraph: {
    title: "Join the Find My Mahj Game Directory",
    description:
      "Create a free profile and list your events on the national mahjong directory. Founding Partner spots are open now.",
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
const tierName: React.CSSProperties = { fontSize: "1.3rem", fontWeight: 800, color: "var(--navy)", marginBottom: "0.3rem" };
const tierLead: React.CSSProperties = { fontSize: "1rem", color: "var(--muted)", lineHeight: 1.6, marginBottom: "1rem" };
const price: React.CSSProperties = { fontFamily: "var(--font-playfair), 'Playfair Display', serif", fontSize: "1.6rem", fontWeight: 900, color: "var(--pink-text)", marginTop: "0.4rem" };
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

export default function JoinPage() {
  return (
    <main>
      <section className="page-hero">
        <p className="eyebrow">Join the directory</p>
        <h1>Join the Find My Mahj Game Directory</h1>
        <p>Find My Mahj Game helps players discover mahjong games, teachers, leagues, tournaments, and events across the country.</p>
        <p style={{ marginTop: "0.8rem" }}>Our goal is simple: make it easy for people to find and connect with mahjong communities.</p>
      </section>

      <div className="page-body" style={{ maxWidth: 920 }}>
        {/* Founding Partner */}
        <div style={{ ...cardFeatured, background: "#fff5fa", marginBottom: "2.5rem" }}>
          <p className="eyebrow" style={{ marginBottom: "0.4rem" }}>Limited time</p>
          <h2 style={{ border: "none", margin: "0 0 0.6rem", fontSize: "1.6rem", color: "var(--navy)", fontFamily: "var(--font-playfair), 'Playfair Display', serif" }}>Founding Partner Opportunity</h2>
          <p style={tierLead}>We&rsquo;re currently building the largest national mahjong directory and are inviting early teachers, organizers, and community leaders to join as Founding Partners.</p>
          <p style={label}>Founding Partners receive:</p>
          <ul style={list}>
            <Check>Free profile listing</Check>
            <Check>Free event listings</Check>
            <Check>Founding Partner badge</Check>
            <Check>Priority consideration for future Ambassador status</Check>
            <Check>Locked-in discounted pricing on future premium plans</Check>
          </ul>
          <p style={{ marginTop: "1rem", fontWeight: 700, color: "var(--navy)" }}>Use code <span style={{ color: "var(--pink-text)" }}>FINDMYMAHJ</span> when submitting your profile.</p>
        </div>

        {/* Free + paid tiers */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 300px), 1fr))", gap: "1.4rem", marginBottom: "2.5rem" }}>
          <div style={card}>
            <div style={tierName}>Community Listing</div>
            <div style={price}>Free</div>
            <p style={{ ...tierLead, marginTop: "0.6rem" }}>Perfect for teachers, organizers, leagues, clubs, and community leaders.</p>
            <p style={label}>Includes:</p>
            <ul style={list}>
              <Check>Public profile</Check>
              <Check>Biography and teaching information</Check>
              <Check>Website and social links</Check>
              <Check>Contact information</Check>
              <Check>Unlimited event listings</Check>
              <Check>State directory placement</Check>
              <Check>Search visibility</Check>
            </ul>
          </div>

          <div style={cardFeatured}>
            <div style={tierName}>Verified Community Leader</div>
            <div style={price}>$12/month <span style={{ fontSize: "1rem", color: "var(--muted)", fontWeight: 600 }}>or $99/year</span></div>
            <p style={{ ...tierLead, marginTop: "0.6rem" }}>For teachers and organizers who want additional visibility and credibility.</p>
            <p style={label}>Everything in the Free listing, plus:</p>
            <ul style={list}>
              <Check>Verified badge</Check>
              <Check>Priority placement in search results</Check>
              <Check>Featured placement on state pages</Check>
              <Check>Enhanced profile</Check>
              <Check>Additional photos and media</Check>
              <Check>Featured events</Check>
            </ul>
          </div>
        </div>

        {/* Ambassador */}
        <h2>Ambassador Program</h2>
        <p>Our highest recognition level for active mahjong community builders.</p>
        <p>Ambassadors are selected based on activity, professionalism, and contribution to the mahjong community.</p>
        <p style={{ ...label, marginTop: "0.5rem" }}>Benefits include:</p>
        <ul style={{ ...list, marginBottom: "1rem" }}>
          <Check>Ambassador badge</Check>
          <Check>Featured profile placement</Check>
          <Check>State-level spotlight opportunities</Check>
          <Check>Newsletter features</Check>
          <Check>Early access to new platform features</Check>
          <Check>Ambassador directory recognition</Check>
          <Check>Community leadership recognition</Check>
        </ul>
        <p>Pricing and eligibility details will be announced soon. Applications will open after the directory reaches critical mass.</p>
        <p style={{ marginTop: "0.6rem" }}><Link href="/ambassadors" style={{ color: "var(--pink-text)", fontWeight: 700 }}>Learn about the Ambassador program &rarr;</Link></p>

        {/* Event Listings */}
        <h2>Event Listings</h2>
        <p>All approved teachers, organizers, leagues, tournaments, retreats, and community events may be listed at no charge during our growth phase.</p>
        <p>Our current priority is helping players discover more mahjong opportunities nationwide.</p>

        {/* CTA */}
        <div style={{ textAlign: "center", marginTop: "3rem", padding: "2.5rem 1.5rem", background: "var(--bg)", borderRadius: 20, border: "1px solid var(--border)" }}>
          <h2 style={{ border: "none", margin: "0 0 0.6rem", color: "var(--navy)", fontFamily: "var(--font-playfair), 'Playfair Display', serif", fontSize: "1.6rem" }}>Interested in Joining?</h2>
          <p style={{ color: "var(--muted)", fontSize: "1.05rem", lineHeight: 1.6, maxWidth: 540, margin: "0 auto 1.5rem" }}>Create your profile and submit your events to become part of the growing Find My Mahj Game community.</p>
          <Link href="/get-listed" style={{ display: "inline-flex", minHeight: 56, alignItems: "center", justifyContent: "center", padding: "0 2.2rem", borderRadius: 14, background: "var(--pink)", color: "white", fontWeight: 800, fontSize: "1.1rem", textDecoration: "none" }}>Submit My Profile &rarr;</Link>
        </div>
      </div>
    </main>
  );
}
