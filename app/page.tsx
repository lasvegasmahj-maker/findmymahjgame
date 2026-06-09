import type { Metadata } from "next";
import Link from "next/link";
import USMap from "@/components/home/us-map";
import SearchBox from "@/components/home/search-box";
import { createServerClient } from "@/lib/supabase-server";
import { STATES } from "@/lib/states-data";
import SeatDots from "@/components/seat-dots";

export const metadata: Metadata = {
  title: "Find My Mahj Game | Mahjong Players, Groups and Events Nationwide",
  description:
    "Find mahjong players, groups, open plays, venues and events in all 50 states. Free for players. Click your state to get started.",
  alternates: {
    canonical: "https://findmymahjgame.com",
  },
  openGraph: {
    title: "Find My Mahj Game | Mahjong Players, Groups and Events Nationwide",
    description:
      "Find mahjong players, groups, open plays, venues and events in all 50 states. Free for players. Click your state to get started.",
    url: "https://findmymahjgame.com",
  },
};

// Short cache so forming tables ("Need a 4th") surface quickly.
export const revalidate = 60;

const ABBR_TO_SLUG: Record<string, string> = {};
for (const s of Object.values(STATES)) ABBR_TO_SLUG[s.abbr] = s.slug;

type StateCounts = Record<string, { players: number; events: number; venues: number }>;

export default async function Home() {
  const supabase = createServerClient();

  const [playersRes, eventsRes, venuesRes] = await Promise.all([
    supabase.from("player_listings").select("state").eq("status", "published"),
    supabase.from("event_listings").select("*").eq("status", "published"),
    supabase.from("venue_listings").select("*").eq("status", "published"),
  ]);

  const players = playersRes.data || [];
  const events = eventsRes.data || [];
  const venues = venuesRes.data || [];

  const stateCounts: StateCounts = {};
  const bump = (st: string | null, key: "players" | "events" | "venues") => {
    const a = (st || "").toUpperCase();
    if (!a) return;
    (stateCounts[a] ||= { players: 0, events: 0, venues: 0 })[key]++;
  };
  players.forEach((r) => bump(r.state, "players"));
  events.forEach((r) => bump(r.state, "events"));
  venues.forEach((r) => bump(r.state, "venues"));

  const featuredEvents = events
    .filter((e) => ["tournament", "retreat"].includes(e.event_type))
    .slice(0, 6);
  const featuredVenues = venues.slice(0, 6);

  // Forming tables (Need a 4th): surface closest-to-full first.
  const { data: formingRaw } = await supabase
    .from("tables")
    .select("id, share_code, day_of_week, time_of_day, city, seats_total")
    .eq("status", "forming")
    .order("created_at", { ascending: false })
    .limit(20);
  const forming: { share_code: string; day_of_week: string | null; time_of_day: string | null; city: string | null; total: number; filled: number }[] = [];
  for (const t of formingRaw || []) {
    const { count } = await supabase.from("table_seats").select("id", { count: "exact", head: true }).eq("table_id", t.id);
    forming.push({ share_code: t.share_code, day_of_week: t.day_of_week, time_of_day: t.time_of_day, city: t.city, total: t.seats_total || 4, filled: count ?? 1 });
  }
  forming.sort((a, b) => b.filled - a.filled);
  const formingTop = forming.slice(0, 6);

  return (
    <>
      {/* HERO: senior-simple, three big actions */}
      <section className="hero" style={{ paddingBottom: "1.5rem" }}>
        <h1>Find people to play <em>mahjong</em> with</h1>
        <p>Near you. Free. In all 50 states.</p>
        <div style={{ maxWidth: 440, margin: "0.8rem auto 0", display: "flex", flexDirection: "column", gap: "1.4rem" }}>
          <div>
            <Link href="/play" style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: 72, borderRadius: 16, fontSize: "1.4rem", fontWeight: 800, textDecoration: "none", background: "var(--navy)", color: "white" }}>🔍&nbsp; I Want to Play</Link>
            <div style={{ fontSize: "1rem", color: "var(--muted)", textAlign: "center", marginTop: "0.4rem" }}>Find a game near you</div>
          </div>
          <div>
            <Link href="/start" style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: 72, borderRadius: 16, fontSize: "1.4rem", fontWeight: 800, textDecoration: "none", background: "var(--pink)", color: "white" }}>➕&nbsp; Start a Table</Link>
            <div style={{ fontSize: "1rem", color: "var(--muted)", textAlign: "center", marginTop: "0.4rem" }}>Invite players to join</div>
          </div>
          <div>
            <Link href="/help" style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: 72, borderRadius: 16, fontSize: "1.4rem", fontWeight: 800, textDecoration: "none", background: "white", color: "var(--navy)", border: "2px solid var(--navy)" }}>❓&nbsp; I Need Help</Link>
            <div style={{ fontSize: "1rem", color: "var(--muted)", textAlign: "center", marginTop: "0.4rem" }}>Talk to a real person</div>
          </div>
        </div>
        <div style={{ marginTop: "1.6rem", textAlign: "center" }}>
          <Link href="/how-it-works" style={{ fontSize: "1.1rem", color: "var(--pink)", fontWeight: 700 }}>New to mahjong? Learn how</Link>
        </div>
      </section>

      {/* TABLES FORMING (Need a 4th) */}
      {formingTop.length > 0 && (
        <section style={{ background: "#fff5fa", padding: "3.5rem 1.2rem", borderTop: "1px solid rgba(233,30,140,0.1)" }}>
          <div style={{ maxWidth: 760, margin: "0 auto" }}>
            <h2 style={{ fontFamily: "var(--font-playfair), 'Playfair Display', serif", fontSize: "2rem", color: "var(--navy)", textAlign: "center", marginBottom: "0.3rem" }}>Tables forming now</h2>
            <p style={{ textAlign: "center", color: "var(--muted)", fontSize: "1.05rem", marginBottom: "1.6rem" }}>Grab a seat and play this week.</p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "1rem" }}>
              {formingTop.map((g) => {
                const title = `${g.day_of_week || ""} ${g.time_of_day || ""} Mahjong`.trim();
                const needs4th = g.total - g.filled === 1;
                return (
                  <a key={g.share_code} href={`/t/${g.share_code}`} style={{ display: "block", background: "white", border: needs4th ? "2px solid var(--pink)" : "2px solid var(--border)", borderRadius: 16, padding: "1.3rem", textDecoration: "none" }}>
                    {needs4th && <div style={{ display: "inline-block", background: "var(--pink)", color: "white", fontWeight: 800, fontSize: "0.9rem", padding: "0.25rem 0.8rem", borderRadius: 50, marginBottom: "0.6rem" }}>🔥 Need a 4th</div>}
                    <div style={{ fontSize: "1.3rem", fontWeight: 800, color: "var(--navy)" }}>{title}</div>
                    {g.city && <div style={{ fontSize: "1.05rem", color: "var(--muted)", margin: "0.3rem 0 0.7rem" }}>📍 {g.city}</div>}
                    <SeatDots filled={g.filled} total={g.total} size="1.2rem" />
                    <div style={{ marginTop: "0.7rem", color: "var(--pink)", fontWeight: 800 }}>Join this game &rarr;</div>
                  </a>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* MAP SECTION */}
      <section className="map-section" id="map">
        <div className="map-inner">
          <div className="map-header">
            <p className="section-label" style={{ textAlign: "center" }}>Find My Local Mahj Game</p>
            <h2 className="section-title" style={{ textAlign: "center" }}>Find Players &amp; Events Near You</h2>
            <p className="map-subtitle" style={{ textAlign: "center" }}>Click your state to see players looking for a group, add your own listing, and find local events, or search by city below.</p>
          </div>

          {/* Full-width map */}
          <div className="map-wrapper">
            <USMap stateCounts={stateCounts} />
          </div>

          {/* Search below map */}
          <SearchBox />

        </div>
      </section>

      {/* RETREATS & TOURNAMENTS (only when real listings exist) */}
      {featuredEvents.length > 0 && (
        <section id="retreats" style={{ background: "#f0f2ff", padding: "5rem 3rem", borderTop: "1px solid rgba(26,31,94,0.1)" }}>
          <div style={{ maxWidth: 1100, margin: "0 auto" }}>
            <p className="section-label" style={{ textAlign: "center" }}>Go the Distance</p>
            <h2 style={{ fontFamily: "var(--font-playfair), 'Playfair Display', serif", fontSize: "2.2rem", color: "var(--navy)", marginBottom: "0.5rem", textAlign: "center" }}>Retreats &amp; Tournaments</h2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "1.2rem", marginTop: "2rem" }}>
              {featuredEvents.map((e) => {
                const slug = ABBR_TO_SLUG[(e.state || "").toUpperCase()];
                const href = e.registration_url || (slug ? `/states/${slug}` : "/#map");
                return (
                  <a key={e.id} href={href} className="rt-card" target={e.registration_url ? "_blank" : undefined} rel={e.registration_url ? "noopener noreferrer" : undefined}>
                    <div className="rt-tag" style={{ color: "var(--pink)" }}>{e.event_type === "retreat" ? "Retreat" : "Tournament"}</div>
                    <h3 className="rt-title">{e.event_name}</h3>
                    <p className="rt-meta">{[e.city, e.state].filter(Boolean).join(", ")}</p>
                    {e.event_date && <p className="rt-meta">{new Date(e.event_date).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}</p>}
                    <span className="rt-btn" style={{ marginTop: "0.8rem", display: "inline-block" }}>View details &rarr;</span>
                  </a>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* VENUES (only when real listings exist) */}
      {featuredVenues.length > 0 && (
        <section id="venues" style={{ background: "white", padding: "5rem 3rem", borderTop: "1px solid var(--border)" }}>
          <div style={{ maxWidth: 1100, margin: "0 auto" }}>
            <p className="section-label" style={{ textAlign: "center" }}>Play Near You</p>
            <h2 className="section-title" style={{ textAlign: "center", marginBottom: "0.5rem" }}>Mahjong-Friendly Venues</h2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "1.2rem", marginTop: "2rem" }}>
              {featuredVenues.map((v) => {
                const slug = ABBR_TO_SLUG[(v.state || "").toUpperCase()];
                const href = v.website || (slug ? `/states/${slug}` : "/#map");
                return (
                  <a key={v.id} href={href} className="rt-card" target={v.website ? "_blank" : undefined} rel={v.website ? "noopener noreferrer" : undefined}>
                    <div className="rt-tag" style={{ color: "var(--navy)" }}>{v.venue_type || "Venue"}</div>
                    <h3 className="rt-title">{v.business_name}</h3>
                    <p className="rt-meta">{[v.city, v.state].filter(Boolean).join(", ")}</p>
                    {v.description && <p className="rt-meta" style={{ marginTop: "0.4rem", color: "var(--muted)" }}>{v.description.slice(0, 90)}{v.description.length > 90 ? "..." : ""}</p>}
                    <span className="rt-btn" style={{ marginTop: "0.8rem", display: "inline-block" }}>View details &rarr;</span>
                  </a>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* TRAVELING */}
      <section id="anywhere" style={{ background: "#fff5fa", padding: "5rem 3rem", borderTop: "1px solid rgba(233,30,140,0.1)" }}>
        <div className="anywhere-inner">
          <p className="section-label" style={{ textAlign: "center" }}>Take Your Game on the Road</p>
          <h2 style={{ fontFamily: "var(--font-playfair), 'Playfair Display', serif", fontSize: "2.2rem", color: "var(--navy)", marginBottom: "0.5rem", textAlign: "center" }}>Traveling and Want to Play?</h2>
          <p style={{ color: "var(--muted)", marginBottom: "2.5rem", fontSize: "1rem", textAlign: "center" }}>Don&rsquo;t let travel stop your game, find players wherever you land or connect with fellow cruise passengers before you board.</p>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.2rem" }}>
            <div className="anywhere-card">
              <div className="anywhere-icon">✈️</div>
              <h3>Traveling? Find a Game</h3>
              <p>Visiting a new city? Use the map to find local players wherever you land. Never go without mahjong again!</p>
              <Link href="#map" className="btn-anywhere">Use the Map &rarr;</Link>
            </div>
            <div className="anywhere-card">
              <div className="anywhere-icon">🚢</div>
              <h3>Going on a Cruise?</h3>
              <p>Setting sail? Don&rsquo;t forget your tiles! Post your cruise ship and dates to find fellow passengers who play, someone might even bring a set. Your perfect sea-day game is waiting!</p>
              <Link href="/list-my-game" className="btn-anywhere">Find Cruise Passengers &rarr;</Link>
            </div>
          </div>
        </div>
      </section>

      {/* AMBASSADORS (secondary, community CTA, kept near the bottom) */}
      <section style={{ background: "white", padding: "3.5rem 1.2rem", borderTop: "1px solid var(--border)" }}>
        <div style={{ maxWidth: 620, margin: "0 auto", textAlign: "center" }}>
          <h2 style={{ fontFamily: "var(--font-playfair), 'Playfair Display', serif", fontSize: "1.6rem", color: "var(--navy)", marginBottom: "0.5rem" }}>Want to help build mahjong in your city?</h2>
          <p style={{ color: "var(--muted)", fontSize: "1.05rem", lineHeight: 1.6, marginBottom: "1.4rem" }}>Teachers, hosts, and organizers help players find safe games and form real tables.</p>
          <Link href="/ambassadors" style={{ display: "inline-block", padding: "0.85rem 1.6rem", borderRadius: 14, fontSize: "1.1rem", fontWeight: 800, textDecoration: "none", color: "var(--navy)", border: "2px solid var(--navy)", background: "white" }}>Become a Founding Ambassador &rarr;</Link>
        </div>
      </section>

      {/* ADVERTISE */}
      <section id="advertise" className="ads-section">
        <div className="ads-inner">
          <p className="section-label" style={{ color: "var(--green)" }}>Advertise With Us</p>
          <h2 className="section-title">Reach Mahjong Players Nationwide</h2>
          <p style={{ color: "var(--muted)", lineHeight: 1.7, margin: "1rem auto 2.5rem", maxWidth: 480 }}>Interested in advertising your brand, company, or event to thousands of mahjong players? We&rsquo;d love to hear from you!</p>
          <Link href="/advertise" className="btn-cta-primary">Get In Touch &rarr;</Link>
        </div>
      </section>
    </>
  );
}
