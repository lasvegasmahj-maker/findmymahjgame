import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Travel Mahjong: Find a Game Anywhere",
  description: "Traveling? Check before you go. Find American Mahjong open plays, games, and events in the cities you visit. Free for players, and money never crosses the table.",
  alternates: { canonical: "https://findmymahjgame.com/travel" },
};

export const revalidate = 86400;

const CITIES: { label: string; href: string }[] = [
  { label: "Dallas, TX", href: "/states/texas/dallas" },
  { label: "Houston, TX", href: "/states/texas/houston" },
  { label: "Austin, TX", href: "/states/texas/austin" },
  { label: "San Antonio, TX", href: "/states/texas/san-antonio" },
  { label: "Las Vegas, NV", href: "/states/nevada/las-vegas" },
  { label: "Scottsdale, AZ", href: "/states/arizona/scottsdale" },
  { label: "Boca Raton, FL", href: "/states/florida/boca-raton" },
  { label: "Naples, FL", href: "/states/florida/naples" },
];

const SNOWBIRD: { label: string; href: string }[] = [
  { label: "Florida", href: "/states/florida" },
  { label: "Arizona", href: "/states/arizona" },
  { label: "Nevada", href: "/states/nevada" },
];

const card: React.CSSProperties = { display: "block", background: "white", border: "2px solid var(--border)", borderRadius: 16, padding: "1.4rem", textDecoration: "none" };
const sectionH2: React.CSSProperties = { fontFamily: "var(--font-playfair), 'Playfair Display', serif", fontSize: "1.6rem", color: "var(--navy)", margin: "2.6rem 0 1rem" };

export default function TravelPage() {
  const breadcrumb = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: "https://findmymahjgame.com" },
      { "@type": "ListItem", position: 2, name: "Travel", item: "https://findmymahjgame.com/travel" },
    ],
  };

  const collectionPage = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "Travel Mahjong: Find a Game Anywhere",
    description: "Find American Mahjong open plays, games, and events in the cities you visit.",
    url: "https://findmymahjgame.com/travel",
    about: { "@type": "Thing", name: "American Mahjong" },
    isPartOf: { "@type": "WebSite", name: "Find My Mahj Game", url: "https://findmymahjgame.com" },
  };

  return (
    <main style={{ maxWidth: 1000, margin: "0 auto", padding: "2.5rem 1.2rem 4rem" }}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify([breadcrumb, collectionPage]) }} />

      <h1 style={{ fontFamily: "var(--font-playfair), 'Playfair Display', serif", fontSize: "2.2rem", color: "var(--navy)", textAlign: "center", margin: "0 0 0.4rem" }}>Travel Mahjong: find a game anywhere</h1>
      <p style={{ fontSize: "1.2rem", color: "var(--muted)", textAlign: "center", lineHeight: 1.5, margin: "0 auto 1rem", maxWidth: 640 }}>Check before you travel. Wherever you go, see who is playing American Mahjong and where the games are before you pack the card.</p>
      <p style={{ fontSize: "1.1rem", color: "var(--navy)", textAlign: "center", lineHeight: 1.6, margin: "0 auto 2rem", maxWidth: 640 }}>Find My Mahj Game helps you find a game wherever you go. It is free for players, and money never crosses the table.</p>

      <h2 style={sectionH2}>Popular destinations</h2>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 240px), 1fr))", gap: "1rem" }}>
        {CITIES.map((c) => (
          <Link key={c.href} href={c.href} style={card}>
            <div style={{ fontSize: "1.25rem", fontWeight: 800, color: "var(--navy)" }}>{c.label}</div>
            <div style={{ marginTop: "0.6rem", color: "var(--pink-text)", fontWeight: 800, fontSize: "1.05rem" }}>See games &rarr;</div>
          </Link>
        ))}
      </div>

      <h2 style={sectionH2}>Snowbird states</h2>
      <p style={{ fontSize: "1.1rem", color: "var(--muted)", lineHeight: 1.6, margin: "0 0 1rem", maxWidth: 640 }}>Heading south for the season? Find your people before you settle in.</p>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 240px), 1fr))", gap: "1rem" }}>
        {SNOWBIRD.map((s) => (
          <Link key={s.href} href={s.href} style={card}>
            <div style={{ fontSize: "1.25rem", fontWeight: 800, color: "var(--navy)" }}>{s.label}</div>
            <div style={{ marginTop: "0.6rem", color: "var(--pink-text)", fontWeight: 800, fontSize: "1.05rem" }}>Browse the state &rarr;</div>
          </Link>
        ))}
      </div>

      <div style={{ textAlign: "center", marginTop: "3rem", display: "flex", flexDirection: "column", gap: "0.8rem", maxWidth: 360, marginInline: "auto" }}>
        <Link href="/states" style={{ minHeight: 54, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 14, background: "var(--navy)", color: "white", fontWeight: 800, fontSize: "1.05rem", textDecoration: "none" }}>Browse all states</Link>
        <Link href="/events" style={{ minHeight: 54, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 14, background: "white", color: "var(--navy)", border: "2px solid var(--navy)", fontWeight: 800, fontSize: "1.05rem", textDecoration: "none" }}>Where can I play this week?</Link>
      </div>
    </main>
  );
}
