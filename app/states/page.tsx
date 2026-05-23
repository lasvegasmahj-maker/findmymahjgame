import type { Metadata } from "next";
import Link from "next/link";
import { STATES } from "@/lib/states-data";

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

const ALL_STATES = Object.values(STATES).sort((a, b) => a.name.localeCompare(b.name));

export default function StatesIndexPage() {
  return (
    <>
      <div className="page-hero">
        <div className="eyebrow">Player Directory</div>
        <h1>Browse Mahjong Players by State</h1>
        <p>
          Find players, open play groups, instructors and events across all 50 states.
          Free to search, free to list.
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
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: "0.6rem" }}>
                {states.map((state) => (
                  <Link
                    key={state.slug}
                    href={`/states/${state.slug}`}
                    style={{
                      display: "block",
                      padding: "0.8rem 1rem",
                      background: "var(--bg)",
                      border: "1px solid var(--border)",
                      borderRadius: 10,
                      textDecoration: "none",
                      color: "var(--navy)",
                      fontWeight: 600,
                      fontSize: "0.88rem",
                      transition: "border-color 0.15s, background 0.15s",
                    }}
                  >
                    {state.name}
                    <span style={{ display: "block", fontSize: "0.72rem", color: "var(--muted)", fontWeight: 400, marginTop: "0.15rem" }}>
                      {state.cities.slice(0, 2).join(", ")}
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          );
        })}

        {/* A-Z fallback / full list */}
        <div style={{ background: "var(--navy)", borderRadius: 16, padding: "2rem", textAlign: "center", marginTop: "1rem" }}>
          <p style={{ color: "rgba(255,255,255,0.8)", marginBottom: "1.2rem", fontSize: "0.95rem" }}>
            Don&rsquo;t see your state above? Every state has a page.
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem", justifyContent: "center" }}>
            {ALL_STATES.map((state) => (
              <Link
                key={state.slug}
                href={`/states/${state.slug}`}
                style={{
                  fontSize: "0.78rem",
                  color: "rgba(255,255,255,0.85)",
                  background: "rgba(255,255,255,0.1)",
                  border: "1px solid rgba(255,255,255,0.2)",
                  borderRadius: 5,
                  padding: "0.2rem 0.6rem",
                  textDecoration: "none",
                }}
              >
                {state.abbr}
              </Link>
            ))}
          </div>
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
