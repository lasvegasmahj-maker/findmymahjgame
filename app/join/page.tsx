import type { Metadata } from "next";
import Link from "next/link";
import StatusBadge from "@/components/status-badge";

export const metadata: Metadata = {
  title: "Join the Find My Mahj Game Directory",
  description:
    "Teachers, organizers, and community leaders: list your profile, classes, and events on the national mahjong directory. 6 months free with code FINDMYMAHJGAME, then $89 a year. Charter Member recognition for early supporters.",
  alternates: { canonical: "https://findmymahjgame.com/join" },
  openGraph: {
    title: "Join the Find My Mahj Game Directory",
    description:
      "List your profile, classes, and events on the national mahjong directory. 6 months free with code FINDMYMAHJGAME, then $89 a year.",
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

export default function JoinPage() {
  return (
    <main>
      <section className="page-hero">
        <p className="eyebrow">Join the directory</p>
        <h1>Join the Find My Mahj Game Directory</h1>
        <p>Anyone can join so players can find your games, classes, and events across the country. Players never pay.</p>
        <p style={{ marginTop: "0.8rem" }}>Join during launch and lock in Charter Member recognition.</p>
      </section>

      <div className="page-body" style={{ maxWidth: 920 }}>
        {/* Standard membership */}
        <div style={{ ...cardFeatured, background: "#fff5fa", marginBottom: "1.8rem" }}>
          <p className="eyebrow" style={{ marginBottom: "0.4rem" }}>Launch offer</p>
          <h2 style={sectionH2}>Directory Membership</h2>
          <p style={tierLead}>The standard membership. Everyone can join.</p>
          <div style={price}>6 months free <span style={{ fontSize: "1rem", color: "var(--muted)", fontWeight: 600 }}>with code FINDMYMAHJGAME</span></div>
          <p style={{ fontWeight: 700, color: "var(--navy)", margin: "0.2rem 0 1rem" }}>Then $89/year</p>
          <p style={label}>Includes:</p>
          <ul style={list}>
            <Check>Profile</Check>
            <Check>Events</Check>
            <Check>Classes</Check>
            <Check>Website and social links</Check>
            <Check>Search placement</Check>
            <Check>State directory placement</Check>
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
            <Check>Join during the launch period</Check>
            <Check>Use Find My Mahj Game as a primary directory listing</Check>
            <Check>List your classes and events on the platform</Check>
            <Check>Keep an active profile</Check>
          </ul>
          <p style={label}>Charter Members receive:</p>
          <ul style={list}>
            <Check>A permanent Charter Member badge</Check>
            <Check>Locked-in pricing</Check>
            <Check>Higher placement than standard members</Check>
            <Check>Permanent recognition as an early supporter</Check>
            <Check>Priority consideration for Community Leader and Ambassador status</Check>
          </ul>
        </div>

        {/* Status badges (separate, stackable) */}
        <h2>Status badges</h2>
        <p>These are separate from your membership and from each other, earned in different ways. A teacher can hold several at once, for example Charter Member, Verified Teacher, and Community Leader together.</p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 260px), 1fr))", gap: "1.4rem", margin: "1.2rem 0 2.5rem" }}>
          <div style={card}>
            <StatusBadge type="verified" />
            <p style={{ ...tierLead, margin: "0.8rem 0 0" }}>Identity verified and approved by our team. Shows players you are a real, confirmed teacher.</p>
          </div>
          <div style={card}>
            <StatusBadge type="leader" />
            <p style={{ ...tierLead, margin: "0.8rem 0 0" }}>Earned through activity and contribution to the community. Recognizes teachers who keep games and players connected.</p>
          </div>
          <div style={card}>
            <StatusBadge type="ambassador" />
            <p style={{ ...tierLead, margin: "0.8rem 0 0" }}>Invitation only, for exceptional community builders who go above and beyond.</p>
          </div>
        </div>

        {/* Event Listings */}
        <h2>Event Listings</h2>
        <p>All approved teachers, organizers, leagues, tournaments, retreats, and community events may be listed at no charge during our growth phase.</p>
        <p>Our current priority is helping players discover more mahjong opportunities nationwide.</p>

        {/* CTA */}
        <div style={{ textAlign: "center", marginTop: "3rem", padding: "2.5rem 1.5rem", background: "var(--bg)", borderRadius: 20, border: "1px solid var(--border)" }}>
          <h2 style={{ border: "none", margin: "0 0 0.6rem", color: "var(--navy)", fontFamily: "var(--font-playfair), 'Playfair Display', serif", fontSize: "1.6rem" }}>Ready to join?</h2>
          <p style={{ color: "var(--muted)", fontSize: "1.05rem", lineHeight: 1.6, maxWidth: 540, margin: "0 auto 1.5rem" }}>Submit your profile with code FINDMYMAHJGAME to claim your 6 months free and Charter Member status.</p>
          <Link href="/get-listed" style={{ display: "inline-flex", minHeight: 56, alignItems: "center", justifyContent: "center", padding: "0 2.2rem", borderRadius: 14, background: "var(--pink)", color: "white", fontWeight: 800, fontSize: "1.1rem", textDecoration: "none" }}>Submit My Profile &rarr;</Link>
        </div>
      </div>
    </main>
  );
}
