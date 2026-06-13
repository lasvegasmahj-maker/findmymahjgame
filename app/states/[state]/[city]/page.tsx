import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createServerClient } from "@/lib/supabase-server";
import { STATES, type StateData } from "@/lib/states-data";
import { safeHttpUrl } from "@/lib/sanitize";

export const revalidate = 600;
export const dynamicParams = true;

const titleize = (slug: string) => slug.split("-").map((w) => (w ? w[0].toUpperCase() + w.slice(1) : w)).join(" ");
const TEACHER_TYPE = /instructor|teacher|lesson|studio|school|class/i;

// Metro aliases so a city page also surfaces nearby suburb listings (a Dallas
// page should not look empty while Plano or Frisco listings exist).
const METRO: Record<string, string[]> = {
  dallas: ["dallas", "plano", "frisco", "richardson", "irving", "arlington", "mckinney", "allen", "garland", "fort worth", "addison"],
  houston: ["houston", "katy", "sugar land", "the woodlands", "cypress", "pearland"],
  "san-antonio": ["san antonio", "new braunfels", "boerne"],
  austin: ["austin", "round rock", "cedar park", "georgetown"],
  "las-vegas": ["las vegas", "summerlin", "henderson", "north las vegas", "boulder city"],
  scottsdale: ["scottsdale", "phoenix", "tempe", "mesa", "chandler", "paradise valley"],
  "boca-raton": ["boca raton", "delray beach", "boynton beach", "deerfield beach"],
  naples: ["naples", "bonita springs", "marco island", "estero"],
};

// The 8 launch metros are prebuilt; any other /states/{state}/{city} renders on
// demand (dynamicParams) and caches.
export function generateStaticParams() {
  return [
    { state: "texas", city: "dallas" }, { state: "texas", city: "houston" },
    { state: "texas", city: "austin" }, { state: "texas", city: "san-antonio" },
    { state: "nevada", city: "las-vegas" }, { state: "arizona", city: "scottsdale" },
    { state: "florida", city: "boca-raton" }, { state: "florida", city: "naples" },
  ];
}

function resolveState(stateSlug: string): StateData | undefined {
  return STATES[stateSlug] || Object.values(STATES).find((s) => s.abbr.toLowerCase() === stateSlug.toLowerCase());
}

export async function generateMetadata({ params }: { params: Promise<{ state: string; city: string }> }): Promise<Metadata> {
  const { state, city } = await params;
  const st = resolveState(state);
  const cityName = titleize(city);
  if (!st) return { title: "Mahjong Near You", robots: { index: false } };
  const title = `Mahjong in ${cityName}, ${st.abbr}: Open Play, Teachers and Events`;
  return {
    title: title.slice(0, 70),
    description: `Find American Mahjong open plays, games, teachers, venues and events in ${cityName}, ${st.name}. Free for players, and money never crosses the table.`,
    alternates: { canonical: `https://findmymahjgame.com/states/${st.slug}/${city}` },
  };
}

const cardWrap: React.CSSProperties = { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 280px), 1fr))", gap: "1rem" };
const card: React.CSSProperties = { background: "white", border: "2px solid var(--border)", borderRadius: 16, padding: "1.3rem" };
const sectionH2: React.CSSProperties = { fontFamily: "var(--font-playfair), 'Playfair Display', serif", fontSize: "1.6rem", color: "var(--navy)", margin: "2.4rem 0 1rem" };

function EmptyCta({ what }: { what: string }) {
  return (
    <div style={{ background: "var(--bg)", borderRadius: 14, padding: "1.4rem", textAlign: "center" }}>
      <p style={{ fontSize: "1.05rem", color: "var(--navy)", lineHeight: 1.5, margin: "0 0 0.9rem" }}>Be one of the first to list {what} here. It is free.</p>
      <Link href="/get-listed" style={{ color: "var(--pink)", fontWeight: 800, fontSize: "1.05rem" }}>List it free &rarr;</Link>
    </div>
  );
}

export default async function CityPage({ params }: { params: Promise<{ state: string; city: string }> }) {
  const { state, city } = await params;
  const st = resolveState(state);
  if (!st) notFound();
  const cityName = titleize(city);
  const aliases = METRO[city] || [cityName.toLowerCase()];
  const inCity = (c: string | null | undefined) => !!c && aliases.includes(String(c).trim().toLowerCase());
  const isNevada = st.abbr === "NV";

  const supabase = createServerClient();
  const [eventsRes, venuesRes] = await Promise.all([
    supabase.from("event_listings").select("id, event_name, event_type, city, state, venue, description, registration_url, day_time, event_date, beginner_friendly").eq("state", st.abbr).eq("status", "published"),
    supabase.from("venue_listings").select("id, business_name, venue_type, city, state, description, website, instagram, display_email").eq("state", st.abbr).eq("status", "published"),
  ]);
  const events = (eventsRes.data || []).filter((e) => inCity(e.city));
  const allVenues = (venuesRes.data || []).filter((v) => inCity(v.city));
  const teachers = isNevada ? [] : allVenues.filter((v) => TEACHER_TYPE.test(`${v.venue_type || ""} ${v.description || ""}`));
  const venues = allVenues.filter((v) => !TEACHER_TYPE.test(`${v.venue_type || ""} ${v.description || ""}`));

  const breadcrumb = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "States", item: "https://findmymahjgame.com/states" },
      { "@type": "ListItem", position: 2, name: st.name, item: `https://findmymahjgame.com/states/${st.slug}` },
      { "@type": "ListItem", position: 3, name: cityName, item: `https://findmymahjgame.com/states/${st.slug}/${city}` },
    ],
  };

  const collectionPage = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: `Mahjong in ${cityName}, ${st.abbr}`,
    description: `American Mahjong open plays, teachers, venues, and events in ${cityName}, ${st.name}.`,
    url: `https://findmymahjgame.com/states/${st.slug}/${city}`,
    about: { "@type": "Thing", name: "American Mahjong" },
    isPartOf: { "@type": "WebSite", name: "Find My Mahj Game", url: "https://findmymahjgame.com" },
  };

  return (
    <main style={{ maxWidth: 1000, margin: "0 auto", padding: "2.5rem 1.2rem 4rem" }}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify([breadcrumb, collectionPage]) }} />
      <nav style={{ fontSize: "0.95rem", color: "var(--muted)", marginBottom: "0.8rem" }}>
        <Link href={`/states/${st.slug}`} style={{ color: "var(--pink)", fontWeight: 700 }}>{st.name}</Link> &rsaquo; {cityName}
      </nav>
      <h1 style={{ fontFamily: "var(--font-playfair), 'Playfair Display', serif", fontSize: "2.2rem", color: "var(--navy)", margin: "0 0 0.4rem" }}>Mahjong in {cityName}, {st.abbr}</h1>
      <p style={{ fontSize: "1.2rem", color: "var(--muted)", lineHeight: 1.5, margin: "0 0 1rem" }}>Open plays, teachers, venues, and events near {cityName}. Free for players, and money never crosses the table.</p>

      <h2 style={sectionH2}>Open play and events</h2>
      {events.length > 0 ? (
        <div style={cardWrap}>
          {events.map((e) => {
            const url = safeHttpUrl(e.registration_url);
            const inner = (
              <>
                {e.event_type && <div style={{ textTransform: "uppercase", letterSpacing: "0.08em", fontSize: "0.8rem", fontWeight: 800, color: "var(--pink)", marginBottom: "0.4rem" }}>{String(e.event_type).replace(/_/g, " ")}</div>}
                <div style={{ fontSize: "1.2rem", fontWeight: 800, color: "var(--navy)" }}>{e.event_name || "Mahjong"}</div>
                {(e.day_time || e.venue) && <div style={{ fontSize: "1rem", color: "var(--muted)", marginTop: "0.3rem" }}>{[e.day_time, e.venue].filter(Boolean).join(" - ")}</div>}
                {e.beginner_friendly === true && <div style={{ display: "inline-block", marginTop: "0.5rem", fontSize: "0.8rem", fontWeight: 800, color: "#1a6e3a", background: "rgba(46,201,92,0.14)", borderRadius: 50, padding: "0.2rem 0.7rem" }}>Beginners welcome</div>}
              </>
            );
            return url ? <a key={e.id} href={url} target="_blank" rel="noopener noreferrer" style={{ ...card, textDecoration: "none", display: "block" }}>{inner}</a> : <div key={e.id} style={card}>{inner}</div>;
          })}
        </div>
      ) : <EmptyCta what="an open play or event" />}

      <h2 style={sectionH2}>Teachers</h2>
      {isNevada ? (
        <div style={{ ...card, textAlign: "center" }}>
          <p style={{ fontSize: "1.05rem", color: "var(--navy)", lineHeight: 1.5, margin: 0 }}>For lessons in {cityName}, visit <a href="https://lasvegasmahj.com" target="_blank" rel="noopener noreferrer" style={{ color: "var(--pink)", fontWeight: 800 }}>Las Vegas Mahjong</a>.</p>
        </div>
      ) : teachers.length > 0 ? (
        <div style={cardWrap}>
          {teachers.map((t) => {
            const site = safeHttpUrl(t.website);
            const inner = (
              <>
                <div style={{ fontSize: "1.2rem", fontWeight: 800, color: "var(--navy)" }}>{t.business_name || "Teacher"}</div>
                {t.description && <div style={{ fontSize: "0.98rem", color: "var(--muted)", marginTop: "0.4rem", lineHeight: 1.5 }}>{String(t.description).slice(0, 100)}</div>}
                {!site && (t.display_email || t.instagram) && (
                  <div style={{ display: "flex", gap: "1rem", marginTop: "0.7rem" }}>
                    {t.display_email && <a href={`mailto:${t.display_email}`} style={{ color: "var(--pink)", fontWeight: 800 }}>Email</a>}
                    {t.instagram && <a href={`https://instagram.com/${t.instagram.replace("@", "")}`} target="_blank" rel="noopener noreferrer" style={{ color: "var(--pink)", fontWeight: 800 }}>Instagram</a>}
                  </div>
                )}
                {site && <div style={{ marginTop: "0.7rem", color: "var(--pink)", fontWeight: 800 }}>Visit &rarr;</div>}
              </>
            );
            return site ? <a key={t.id} href={site} target="_blank" rel="noopener noreferrer" style={{ ...card, textDecoration: "none", display: "block" }}>{inner}</a> : <div key={t.id} style={card}>{inner}</div>;
          })}
        </div>
      ) : <EmptyCta what="a teacher or class" />}

      <h2 style={sectionH2}>Places to play</h2>
      {venues.length > 0 ? (
        <div style={cardWrap}>
          {venues.map((v) => {
            const site = safeHttpUrl(v.website);
            const inner = (
              <>
                <div style={{ fontSize: "1.2rem", fontWeight: 800, color: "var(--navy)" }}>{v.business_name || "Venue"}</div>
                {v.description && <div style={{ fontSize: "0.98rem", color: "var(--muted)", marginTop: "0.4rem", lineHeight: 1.5 }}>{String(v.description).slice(0, 100)}</div>}
                {site && <div style={{ marginTop: "0.7rem", color: "var(--pink)", fontWeight: 800 }}>Visit &rarr;</div>}
              </>
            );
            return site ? <a key={v.id} href={site} target="_blank" rel="noopener noreferrer" style={{ ...card, textDecoration: "none", display: "block" }}>{inner}</a> : <div key={v.id} style={card}>{inner}</div>;
          })}
        </div>
      ) : <EmptyCta what="a place to play" />}

      <div style={{ textAlign: "center", marginTop: "3rem", display: "flex", flexDirection: "column", gap: "0.8rem", maxWidth: 360, marginInline: "auto" }}>
        <Link href={`/states/${st.slug}`} style={{ minHeight: 54, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 14, background: "var(--navy)", color: "white", fontWeight: 800, fontSize: "1.05rem", textDecoration: "none" }}>See all of {st.name}</Link>
        <Link href="/play" style={{ minHeight: 54, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 14, background: "white", color: "var(--navy)", border: "2px solid var(--navy)", fontWeight: 800, fontSize: "1.05rem", textDecoration: "none" }}>Looking for players? Find a game</Link>
      </div>
    </main>
  );
}
