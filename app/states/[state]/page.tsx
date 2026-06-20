import { STATES, ALL_STATE_SLUGS } from "@/lib/states-data";
import { createServerClient } from "@/lib/supabase-server";
import { notFound } from "next/navigation";
import StatePageClient from "./client";
import { buildStatePageSchema, schemaScriptProps } from "@/lib/schema";
import { LAS_VEGAS_MAHJONG } from "@/lib/featured-listings";

export const revalidate = 3600; // revalidate every hour

export function generateStaticParams() {
  return ALL_STATE_SLUGS.map((state) => ({ state }));
}

const STATE_META: Record<string, { title: string; description: string }> = {
  california: {
    title: "Mahjong Players and Groups in California",
    description:
      "Find mahjong players, open plays, teachers and events in California. Search Los Angeles, San Francisco, San Diego, Palm Springs and more. Free for players.",
  },
  florida: {
    title: "Mahjong Players and Groups in Florida",
    description:
      "Find mahjong players, clubs, open plays and events in Florida. Search Miami, Boca Raton, Orlando, Tampa, Naples and more. Free directory for players.",
  },
  "new-york": {
    title: "Mahjong Players and Groups in New York",
    description:
      "Find mahjong players, clubs and events in New York. Search NYC, Long Island, Westchester, White Plains and more. Connect with local players free.",
  },
  texas: {
    title: "Mahjong Players and Groups in Texas",
    description:
      "Find mahjong players, open plays, teachers and events in Texas. Search Houston, Dallas, Austin, San Antonio and more. Free for players statewide.",
  },
  nevada: {
    title: "Mahjong Players, Lessons and Events in Nevada",
    description:
      "Find mahjong players, open play nights, instructors and events in Nevada. Las Vegas, Henderson, Summerlin and Reno. Free for players. Lessons available.",
  },
};

export async function generateMetadata({ params }: { params: Promise<{ state: string }> }) {
  const { state } = await params;
  const data = STATES[state];
  if (!data) return {};

  if (STATE_META[state]) {
    return {
      ...STATE_META[state],
      alternates: { canonical: `https://findmymahjgame.com/states/${state}` },
      openGraph: {
        title: STATE_META[state].title,
        description: STATE_META[state].description,
        url: `https://findmymahjgame.com/states/${state}`,
      },
    };
  }

  const cityList = data.cities.slice(0, 4).join(", ");
  return {
    title: `Mahjong Players and Groups in ${data.name}`,
    description: `Find mahjong players, open plays, teachers and events in ${data.name}. Search ${cityList} and more. Free directory for players.`,
    alternates: { canonical: `https://findmymahjgame.com/states/${state}` },
    openGraph: {
      title: `Mahjong Players and Groups in ${data.name} | Find My Mahj Game`,
      description: `Find mahjong players, open plays, teachers and events in ${data.name}. Search ${cityList} and more. Free directory for players.`,
      url: `https://findmymahjgame.com/states/${state}`,
    },
  };
}

export default async function StatePage({ params, searchParams }: { params: Promise<{ state: string }>; searchParams: Promise<{ city?: string; tab?: string }> }) {
  const { state } = await params;
  const { city: initialCity, tab: initialTab } = await searchParams;
  const data = STATES[state];
  if (!data) notFound();

  const supabase = createServerClient();

  // Explicit public-safe columns only. These rows serialize into client props
  // (and some into JSON-LD), so select("*") would ship contact_email, phone,
  // stripe_payment_id, and reviewer_notes to every visitor's browser.
  const [playersRes, eventsRes, venuesRes] = await Promise.all([
    supabase
      .from("player_listings")
      .select("id, name, city, state, skill_level, availability, bio, avatar_color, created_at")
      .eq("state", data.abbr)
      .eq("status", "published")
      .order("created_at", { ascending: false }),
    supabase
      .from("event_listings")
      .select("id, event_name, event_type, city, state, venue, address, description, event_date, end_date, price, host, registration_url, tier, created_at")
      .eq("state", data.abbr)
      .eq("status", "published")
      .or(`event_date.is.null,event_date.gte.${new Date().toISOString().slice(0, 10)},event_type.in.(open_play,openplay,recurring)`)
      .order("event_date", { ascending: true }),
    supabase
      .from("venue_listings")
      .select("id, business_name, venue_type, city, state, address, description, website, instagram, display_email, logo_url, tier, created_at")
      .eq("state", data.abbr)
      .eq("status", "published")
      .order("created_at", { ascending: false }),
  ]);

  const players = playersRes.data || [];
  const events = eventsRes.data || [];
  let venues = venuesRes.data || [];
  // Always feature Las Vegas Mahjong (the founder's own business) on Nevada,
  // so it appears in the Nevada Teachers tab alongside the Sponsored block.
  if (data.abbr === "NV") venues = [LAS_VEGAS_MAHJONG, ...venues] as unknown as typeof venues;

  const STATE_CITIES: Record<string, [string, string][]> = {
    texas: [["dallas", "Dallas"], ["houston", "Houston"], ["austin", "Austin"], ["san-antonio", "San Antonio"]],
    nevada: [["las-vegas", "Las Vegas"]],
    arizona: [["scottsdale", "Scottsdale"]],
    florida: [["boca-raton", "Boca Raton"], ["naples", "Naples"]],
  };

  const stateSchema = buildStatePageSchema({
    stateName: data.name,
    stateSlug: data.slug,
    stateDesc: data.desc,
    venues,
    events,
  });

  return (
    <>
      <script {...schemaScriptProps(stateSchema)} />
      <StatePageClient
        stateData={data}
        players={players}
        events={events}
        venues={venues}
        initialCity={initialCity}
        initialTab={initialTab}
      />
      {STATE_CITIES[data.slug] && (
        <section style={{ maxWidth: 900, margin: "0 auto", padding: "0.5rem 1.2rem 3rem" }}>
          <h2 style={{ fontFamily: "var(--font-playfair), 'Playfair Display', serif", fontSize: "1.5rem", color: "var(--navy)", textAlign: "center", margin: "0 0 1rem" }}>Mahjong by city in {data.name}</h2>
          <div style={{ display: "flex", gap: "0.6rem", flexWrap: "wrap", justifyContent: "center" }}>
            {STATE_CITIES[data.slug].map(([slug, name]) => (
              <a key={slug} href={`/states/${data.slug}/${slug}`} style={{ padding: "0.55rem 1.1rem", borderRadius: 50, border: "2px solid var(--border)", color: "var(--navy)", fontWeight: 800, textDecoration: "none" }}>{name}</a>
            ))}
          </div>
        </section>
      )}
    </>
  );
}
