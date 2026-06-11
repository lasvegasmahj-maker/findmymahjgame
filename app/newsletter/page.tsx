import type { Metadata } from "next";
import NewsletterSignup from "@/components/newsletter-signup";

export const metadata: Metadata = {
  title: "Find My Mahj Weekly",
  description: "A free weekly note with the games and open plays near you, plus one quick tip. Sign up for Find My Mahj Weekly.",
  alternates: { canonical: "https://findmymahjgame.com/newsletter" },
};

const li: React.CSSProperties = { fontSize: "1.15rem", color: "var(--navy)", lineHeight: 1.6, marginBottom: "0.7rem" };

export default function NewsletterPage() {
  return (
    <main style={{ maxWidth: 620, margin: "0 auto", padding: "2.5rem 1.2rem 4rem" }}>
      <h1 style={{ fontFamily: "var(--font-playfair), 'Playfair Display', serif", fontSize: "2.2rem", color: "var(--navy)", textAlign: "center", margin: "0 0 0.6rem" }}>
        Find My Mahj Weekly
      </h1>
      <p style={{ fontSize: "1.2rem", color: "var(--muted)", textAlign: "center", lineHeight: 1.5, margin: "0 0 2rem" }}>
        The week&rsquo;s games and open plays near you, plus one quick tip. Free.
      </p>

      <div style={{ background: "white", border: "2px solid var(--border)", borderRadius: 18, padding: "1.8rem 1.6rem", marginBottom: "2rem" }}>
        <h2 style={{ fontSize: "1.3rem", color: "var(--navy)", margin: "0 0 1rem", fontWeight: 800 }}>What you&rsquo;ll receive</h2>
        <ul style={{ margin: 0, paddingLeft: "1.2rem" }}>
          <li style={li}>Open plays and tables that need a player, near you</li>
          <li style={li}>New games, events, and teachers in your area</li>
          <li style={{ ...li, marginBottom: 0 }}>One quick tip to sharpen your game</li>
        </ul>
      </div>

      <NewsletterSignup />
    </main>
  );
}
