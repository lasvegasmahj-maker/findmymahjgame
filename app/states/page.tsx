import type { Metadata } from "next";
import Link from "next/link";
import { STATES } from "@/lib/states-data";
import { createServerClient } from "@/lib/supabase-server";
import USMap from "@/components/home/us-map";

export const metadata: Metadata = {
  title: "Browse Mahjong Players by State | All 50 States",
  description:
    "Find mahjong players, open play groups, instructors and events in your state. Browse all 50 states in the national mahjong player directory.",
  alternates: { canonical: "https://findmymahjgame.com/states" },
  openGraph: {
    title: "Browse Mahjong Players by State | Find My Mahj Game",
    description: "Find mahjong players, groups and events in all 50 states. Free to search, free for players.",
    url: "https://findmymahjgame.com/states",
    type: "website",
  },
};

const REGIONS: Record<string, string[]> = {
  Northeast: ["connecticut", "maine", "massachusetts", "new-hampshire", "new-jersey", "new-york", "pennsylvania", "rhode-island", "vermont"],
  Southeast: ["alabama", "arkansas", "florida", "georgia", "kentucky", "louisiana", "mississippi", "north-carolina", "south-carolina", "tennessee", "virginia", "west-virginia"],
  Midwest: ["illinois", "indiana", "iowa", "kansas", "michigan", "minnesota", "missouri", "nebraska", "north-dakota", "ohio", "south-dakota", "wisconsin"],
  Southwest: ["arizona", "new-mexico", "oklahoma", "texas"],
  West: ["alaska", "california", "colorado", "hawaii", "idaho", "montana", "nevada", "oregon", "utah", "washington", "wyoming"],
  "Mid-Atlantic": ["delaware", "maryland"],
};

type Counts = Record<string, { players: number; events: number; venues: number }>;


export const revalidate = 300;
export default async function StatesIndexPage() {
  const supabase = createServerClient();
  const stateCounts: Counts = {};
  try {
    const [playersRes, eventsRes, venuesRes] = await Promise.all([
      supabase.from("player_listings").select("state").eq("status", "published"),
      supabase.from("event_listings").select("state").eq("status", "published"),
      supabase.from("venue_listings").select("state").eq("status", "published"),
    ]);
    const bump = (st: string | null, key: "players" | "events" | "venues") => {
      const a = (st || "").toUpperCase();
      if (!a) return;
      (stateCounts[a] ||= { players: 0, events: 0, venues: 0 })[key]++;
    };
    (playersRes.data || []).forEach((r) => bump(r.state, "players"));
    (eventsRes.data || []).forEach((r) => bump(r.state, "events"));
    (venuesRes.data || []).forEach((r) => bump(r.state, "venues"));
  } catch {
    // No live data; the map simply renders with no active states highlighted.
  }

  return (
    <>
      <div className="page-hero">
        <div className="eyebrow" style={{ color: "rgba(255,255,255,0.85)" }}>Player Directory</div>
        <h1>Browse Mahjong Players by State</h1>
        <p>
          Find players, open play groups, instructors and events across all 50 states.
          Free to search, free for players.
        </p>
      </div>

      <div className="page-body" style={{ maxWidth: 1000 }}>

        {/* Region blocks */}
        {Object.entries(REGIONS).map(([region, slugs]) => {
          const states = slugs
            .map((s) => STATES[s])
            .filter(Boolean)
            .sort((a, b) => a.name.localeCompare(b.name));
          return (
            <div key={region} style={{ marginBottom: "2.5rem" }}>
              <h2 style={{ fontSize: "1.1rem", color: "var(--navy)", marginBottom: "1rem", paddingBottom: "0.5rem", borderBottom: "2px solid var(--border)" }}>
                {region}
              </h2>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(190px, 1fr))", gap: "0.8rem" }}>
                {states.map((state) => (
                  <Link
                    key={state.slug}
                    href={`/states/${state.slug}`}
                    style={{
                      display: "block",
                      padding: "1rem 1.1rem",
                      background: "var(--bg)",
                      border: "1px solid var(--border)",
                      borderRadius: 10,
                      textDecoration: "none",
                      color: "var(--navy)",
                      fontWeight: 700,
                      fontSize: "1.05rem",
                      transition: "border-color 0.15s, background 0.15s",
                    }}
                  >
                    {state.name}
                    <span style={{ display: "block", fontSize: "0.95rem", color: "var(--muted)", fontWeight: 400, marginTop: "0.25rem" }}>
                      {state.cities.slice(0, 2).join(", ")}
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          );
        })}

        <div style={{ marginTop: "3rem" }}>
          <h2 style={{ fontSize: "1.1rem", color: "var(--navy)", marginBottom: "1rem", paddingBottom: "0.5rem", borderBottom: "2px solid var(--border)" }}>
            Or tap your state on the map
            <span style={{ position: "absolute", width: 1, height: 1, overflow: "hidden", clip: "rect(0 0 0 0)" }}>The map is a visual shortcut; the state list above works with a keyboard or screen reader.</span>
          </h2>
          <USMap stateCounts={stateCounts} />
        </div>

        <div style={{ textAlign: "center", marginTop: "2.5rem" }}>
          <Link href="/list-my-game" className="btn-cta-primary">
            Create Your Free Player Listing &rarr;
          </Link>
        </div>
      </div>
    </>
  );
}
