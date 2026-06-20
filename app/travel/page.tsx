import type { Metadata } from "next";
import Link from "next/link";
import { createServerClient } from "@/lib/supabase-server";
import { safeHttpUrl } from "@/lib/sanitize";
import NotifyMe from "@/components/notify-me";
import GroupedEvents, { type GroupedRow } from "@/components/grouped-events";

export const metadata: Metadata = {
  title: "Traveling Mahjong Experiences: Cruises & Retreats",
  description: "Mahjong getaways you can travel to: organized cruises, retreats, and destination events. Plus find a game in the places you visit. Free for players.",
  alternates: { canonical: "https://findmymahjgame.com/travel" },
};

export const revalidate = 3600;

const norm = (t: string | null | undefined) => (t || "").toLowerCase().replace(/[^a-z]/g, "");

const SELECT_FULL = "id, event_name, event_type, city, state, venue, description, event_date, registration_url, price, day_time, frequency, beginner_friendly, confirmed_active_at, host";
const SELECT_FALLBACK = "id, event_name, event_type, city, state, venue, description, event_date, registration_url, price, day_time, frequency, beginner_friendly, host";

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

export default async function TravelPage({ searchParams }: { searchParams: Promise<{ sort?: string }> }) {
  const { sort } = await searchParams;
  const activeSort = (sort || "state").toLowerCase();
  const groupBy: "state" | null = activeSort === "date" ? null : "state";

  const supabase = createServerClient();
  const todayISO = new Date().toISOString().slice(0, 10);
  let rows: GroupedRow[] = [];
  try {
    let { data } = await supabase.from("event_listings").select(SELECT_FULL).eq("status", "published");
    if (!data) {
      const fb = await supabase.from("event_listings").select(SELECT_FALLBACK).eq("status", "published");
      data = (fb.data || []).map((r) => ({ ...r, confirmed_active_at: null }));
    }
    rows = ((data || [])
      .filter((e) => ["cruise", "retreat"].includes(norm(e.event_type)))
      .filter((e) => !e.event_date || e.event_date >= todayISO)) as GroupedRow[];
  } catch { /* table not ready: fall through to the empty state */ }

  const _today = new Date(); _today.setHours(0, 0, 0, 0);
  const eventSchema = rows
    .filter((e) => {
      if (!e.event_date) return false;
      const d = new Date(e.event_date);
      return !isNaN(d.getTime()) && d >= _today;
    })
    .slice(0, 50)
    .map((e) => ({
      "@context": "https://schema.org",
      "@type": "Event",
      name: e.event_name || "Mahjong Getaway",
      startDate: e.event_date,
      eventStatus: "https://schema.org/EventScheduled",
      eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
      location: { "@type": "Place", name: e.venue || [e.city, e.state].filter(Boolean).join(", ") || "See listing", address: [e.city, e.state].filter(Boolean).join(", ") || "United States" },
      ...(safeHttpUrl(e.registration_url) ? { url: safeHttpUrl(e.registration_url)! } : {}),
    }));

  const breadcrumb = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: "https://findmymahjgame.com" },
      { "@type": "ListItem", position: 2, name: "Getaways", item: "https://findmymahjgame.com/travel" },
    ],
  };
  const collectionPage = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "Traveling Mahjong Experiences",
    description: "Mahjong getaways you can travel to: organized cruises, retreats, and destination events, plus a game in the places you visit.",
    url: "https://findmymahjgame.com/travel",
    about: { "@type": "Thing", name: "American Mahjong" },
    isPartOf: { "@type": "WebSite", name: "Find My Mahj Game", url: "https://findmymahjgame.com" },
  };

  const sortHref = (k: string) => `/travel${k !== "state" ? `?sort=${k}` : ""}`;
  const SORTS: [string, string][] = [["state", "By state"], ["date", "By date"]];
  const typeLabelFor = (e: GroupedRow) => (norm(e.event_type) === "cruise" ? "Cruise" : "Retreat");

  return (
    <main style={{ maxWidth: 1000, margin: "0 auto", padding: "2.5rem 1.2rem 4rem" }}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify([breadcrumb, collectionPage]) }} />
      {eventSchema.length > 0 && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(eventSchema) }} />}

      <h1 style={{ fontFamily: "var(--font-playfair), 'Playfair Display', serif", fontSize: "2.2rem", color: "var(--navy)", textAlign: "center", margin: "0 0 0.4rem" }}>Traveling Mahjong Experiences</h1>
      <p style={{ fontSize: "1.2rem", color: "var(--muted)", textAlign: "center", lineHeight: 1.5, margin: "0 auto 1rem", maxWidth: 660 }}>Anything you travel to, in one place. Browse mahjong cruises and retreats you can sign up for, and find a game in the cities you visit.</p>
      <p style={{ fontSize: "1.1rem", color: "var(--navy)", textAlign: "center", lineHeight: 1.6, margin: "0 auto 1.6rem", maxWidth: 660 }}>Free for players.</p>

      <h2 style={sectionH2}>Cruising? Find your game</h2>
      <div style={{ background: "var(--bg)", border: "2px solid var(--border)", borderRadius: 16, padding: "1.5rem 1.6rem", maxWidth: 680 }}>
        <p style={{ fontSize: "1.1rem", color: "var(--navy)", lineHeight: 1.6, margin: "0 0 1.1rem" }}>On a regular cruise and want a game on board? Post your ship and sailing dates and connect with other American Mahjong players on the same trip. Free for players, no organized event needed.</p>
        <Link href="/cruise" style={{ display: "inline-flex", minHeight: 54, alignItems: "center", padding: "0 1.5rem", borderRadius: 14, background: "var(--pink)", color: "white", fontWeight: 800, fontSize: "1.05rem", textDecoration: "none" }}>Post your cruise &amp; find players &rarr;</Link>
      </div>

      <h2 id="getaways" style={sectionH2}>Mahjong cruises &amp; retreats</h2>
      <p style={{ fontSize: "1.05rem", color: "var(--muted)", lineHeight: 1.6, margin: "0 0 1.2rem", maxWidth: 660 }}>Organized mahjong cruises and retreats you can travel to, run by hosts. (Looking to find players on a regular cruise instead? That is free, just above.)</p>
      {rows.length > 0 ? (
        <>
          <div style={{ display: "flex", gap: "0.9rem", flexWrap: "wrap", alignItems: "center", margin: "0 0 1.6rem" }}>
            <span style={{ fontSize: "0.9rem", color: "var(--muted)", fontWeight: 700 }}>Sort:</span>
            {SORTS.map(([k, label]) => (
              <Link key={k} href={sortHref(k)} style={{ fontSize: "0.95rem", fontWeight: 700, textDecoration: "none", color: activeSort === k ? "var(--pink-text)" : "var(--muted)", borderBottom: activeSort === k ? "2px solid var(--pink)" : "2px solid transparent", paddingBottom: "0.1rem" }}>{label}</Link>
            ))}
          </div>
          <GroupedEvents rows={rows} typeLabel={typeLabelFor} cta="Sign up" groupBy={groupBy} />
        </>
      ) : (
        <div style={{ maxWidth: 560, margin: "0 auto" }}>
          <p style={{ fontSize: "1.1rem", color: "var(--muted)", lineHeight: 1.6, textAlign: "center", margin: "0 0 1.2rem" }}>No Mahjong cruises or retreats are listed yet. Tell us where you want to play and we will let you know the moment one is added.</p>
          <NotifyMe heading="Notify me about Mahjong cruises and retreats" />
          <div style={{ textAlign: "center", marginTop: "1rem" }}>
            <Link href="/get-listed" style={{ color: "var(--pink-text)", fontWeight: 800, fontSize: "1.05rem" }}>Run a Mahjong cruise or retreat? List it here &rarr;</Link>
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
