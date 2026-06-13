import type { Metadata } from "next";
import Link from "next/link";
import { createServerClient } from "@/lib/supabase-server";
import { safeHttpUrl } from "@/lib/sanitize";
import { attendInfo } from "@/lib/event-level";
import NotifyMe from "@/components/notify-me";

export const metadata: Metadata = {
  title: "Travel Mahjong & Cruises: Find a Game Anywhere",
  description: "Traveling or cruising? Find American Mahjong open plays, games, events, retreats, and cruises in the places you go. Free for players, and money never crosses the table.",
  alternates: { canonical: "https://findmymahjgame.com/travel" },
};

export const revalidate = 3600;

const norm = (t: string | null | undefined) => (t || "").toLowerCase().replace(/[^a-z]/g, "");

type CruiseRow = {
  id: string; event_name: string | null; event_type: string | null; city: string | null;
  state: string | null; venue: string | null; description: string | null;
  event_date: string | null; registration_url: string | null; day_time: string | null;
  beginner_friendly: string | null;
};

const CITIES = [
  { label: "Dallas, TX", href: "/states/texas/dallas" },
  { label: "Houston, TX", href: "/states/texas/houston" },
  { label: "Austin, TX", href: "/states/texas/austin" },
  { label: "San Antonio, TX", href: "/states/texas/san-antonio" },
  { label: "Las Vegas, NV", href: "/states/nevada/las-vegas" },
  { label: "Scottsdale, AZ", href: "/states/arizona/scottsdale" },
  { label: "Boca Raton, FL", href: "/states/florida/boca-raton" },
  { label: "Naples, FL", href: "/states/florida/naples" },
];
const SNOWBIRD = [
  { label: "Florida", href: "/states/florida" },
  { label: "Arizona", href: "/states/arizona" },
  { label: "Nevada", href: "/states/nevada" },
];

const card: React.CSSProperties = { display: "block", background: "white", border: "2px solid var(--border)", borderRadius: 16, padding: "1.4rem", textDecoration: "none" };
const sectionH2: React.CSSProperties = { fontFamily: "var(--font-playfair), 'Playfair Display', serif", fontSize: "1.6rem", color: "var(--navy)", margin: "2.6rem 0 1rem", scrollMarginTop: "90px" };
const cardGrid: React.CSSProperties = { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 240px), 1fr))", gap: "1rem" };

export default async function TravelPage() {
  const supabase = createServerClient();
  const todayISO = new Date().toISOString().slice(0, 10);
  let cruises: CruiseRow[] = [];
  try {
    const { data } = await supabase
      .from("event_listings")
      .select("id, event_name, event_type, city, state, venue, description, event_date, registration_url, day_time, beginner_friendly")
      .eq("status", "published");
    cruises = (data || [])
      .filter((e) => ["cruise", "retreat"].includes(norm(e.event_type)))
      .filter((e) => !e.event_date || e.event_date >= todayISO) as CruiseRow[];
  } catch { /* table not ready: fall through to the empty state */ }

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
    name: "Travel Mahjong & Cruises: Find a Game Anywhere",
    description: "Find American Mahjong open plays, games, events, retreats, and cruises in the places you visit.",
    url: "https://findmymahjgame.com/travel",
    about: { "@type": "Thing", name: "American Mahjong" },
    isPartOf: { "@type": "WebSite", name: "Find My Mahj Game", url: "https://findmymahjgame.com" },
  };

  return (
    <main style={{ maxWidth: 1000, margin: "0 auto", padding: "2.5rem 1.2rem 4rem" }}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify([breadcrumb, collectionPage]) }} />

      <h1 style={{ fontFamily: "var(--font-playfair), 'Playfair Display', serif", fontSize: "2.2rem", color: "var(--navy)", textAlign: "center", margin: "0 0 0.4rem" }}>Travel Mahjong &amp; cruises: find a game anywhere</h1>
      <p style={{ fontSize: "1.2rem", color: "var(--muted)", textAlign: "center", lineHeight: 1.5, margin: "0 auto 1rem", maxWidth: 660 }}>Going somewhere? Check before you pack the card. See who is playing American Mahjong, and find open plays, events, retreats, and cruises in the places you travel.</p>
      <p style={{ fontSize: "1.1rem", color: "var(--navy)", textAlign: "center", lineHeight: 1.6, margin: "0 auto 1.6rem", maxWidth: 660 }}>Free for players, and money never crosses the table.</p>

      <h2 id="retreats" style={sectionH2}>Mahjong cruises &amp; retreats</h2>
      {cruises.length > 0 ? (
        <div style={cardGrid}>
          {cruises.map((e) => {
            const url = safeHttpUrl(e.registration_url);
            const when = e.day_time || (e.event_date ? new Date(e.event_date).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric", timeZone: "UTC" }) : "");
            const inner = (
              <>
                <div style={{ textTransform: "uppercase", letterSpacing: "0.08em", fontSize: "0.8rem", fontWeight: 800, color: "var(--pink-text)", marginBottom: "0.4rem" }}>{norm(e.event_type) === "cruise" ? "Cruise" : "Retreat"}</div>
                <div style={{ fontSize: "1.2rem", fontWeight: 800, color: "var(--navy)" }}>{e.event_name || "Mahjong getaway"}</div>
                {when && <div style={{ fontSize: "1rem", color: "var(--navy)", marginTop: "0.3rem" }}>{when}</div>}
                {(e.venue || e.city) && <div style={{ fontSize: "1rem", color: "var(--muted)", marginTop: "0.2rem" }}>{[e.venue, e.city, e.state].filter(Boolean).join(", ")}</div>}
                {(() => { const a = attendInfo(e.event_type, e.beginner_friendly); return <div style={{ display: "inline-block", marginTop: "0.5rem", fontSize: "0.8rem", fontWeight: 800, color: a.color, background: a.bg, borderRadius: 50, padding: "0.2rem 0.7rem" }}>{a.label}</div>; })()}
                {url && <div style={{ marginTop: "0.7rem", color: "var(--pink-text)", fontWeight: 800 }}>View details &rarr;</div>}
              </>
            );
            return url ? <a key={e.id} href={url} target="_blank" rel="noopener noreferrer" style={card}>{inner}</a> : <div key={e.id} style={card}>{inner}</div>;
          })}
        </div>
      ) : (
        <div style={{ maxWidth: 560, margin: "0 auto" }}>
          <p style={{ fontSize: "1.1rem", color: "var(--muted)", lineHeight: 1.6, textAlign: "center", margin: "0 0 1.2rem" }}>No Mahjong cruises or retreats are listed yet. Tell us where you want to play and we will let you know the moment one is added.</p>
          <NotifyMe heading="Notify me about Mahjong cruises and retreats" />
          <div style={{ textAlign: "center", marginTop: "1rem" }}>
            <Link href="/get-listed" style={{ color: "var(--pink-text)", fontWeight: 800, fontSize: "1.05rem" }}>Run a Mahjong cruise or retreat? List it free &rarr;</Link>
          </div>
        </div>
      )}

      <h2 style={sectionH2}>Popular destinations</h2>
      <div style={cardGrid}>
        {CITIES.map((c) => (
          <Link key={c.href} href={c.href} style={card}>
            <div style={{ fontSize: "1.25rem", fontWeight: 800, color: "var(--navy)" }}>{c.label}</div>
            <div style={{ marginTop: "0.6rem", color: "var(--pink-text)", fontWeight: 800, fontSize: "1.05rem" }}>See games &rarr;</div>
          </Link>
        ))}
      </div>

      <h2 style={sectionH2}>Snowbird states</h2>
      <p style={{ fontSize: "1.1rem", color: "var(--muted)", lineHeight: 1.6, margin: "0 0 1rem", maxWidth: 640 }}>Heading south for the season? Find your people before you settle in.</p>
      <div style={cardGrid}>
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
