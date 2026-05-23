import { STATES, ALL_STATE_SLUGS } from "@/lib/states-data";
import { createServerClient } from "@/lib/supabase-server";
import { notFound } from "next/navigation";
import StatePageClient from "./client";
import { buildStatePageSchema, schemaScriptProps } from "@/lib/schema";

export const revalidate = 3600; // revalidate every hour

export function generateStaticParams() {
  return ALL_STATE_SLUGS.map((state) => ({ state }));
}

const STATE_META: Record<string, { title: string; description: string }> = {
  california: {
    title: "Mahjong Players and Groups in California | Find My Mahj Game",
    description:
      "Find mahjong players, open plays, venues and events in California. Search Los Angeles, San Francisco, San Diego, Palm Springs and more. Free for players.",
  },
  florida: {
    title: "Mahjong Players and Groups in Florida | Find My Mahj Game",
    description:
      "Find mahjong players, clubs, open plays and events in Florida. Search Miami, Boca Raton, Orlando, Tampa, Naples and more. Free directory for players.",
  },
  "new-york": {
    title: "Mahjong Players and Groups in New York | Find My Mahj Game",
    description:
      "Find mahjong players, clubs and events in New York. Search NYC, Long Island, Westchester, White Plains and more. Connect with local players free.",
  },
  texas: {
    title: "Mahjong Players and Groups in Texas | Find My Mahj Game",
    description:
      "Find mahjong players, open plays, venues and events in Texas. Search Houston, Dallas, Austin, San Antonio and more. Free for players statewide.",
  },
  nevada: {
    title: "Mahjong Players, Lessons and Events in Nevada | Find My Mahj Game",
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
    title: `Mahjong Players and Groups in ${data.name} | Find My Mahj Game`,
    description: `Find mahjong players, open plays, venues and events in ${data.name}. Search ${cityList} and more. Free directory for players.`,
    alternates: { canonical: `https://findmymahjgame.com/states/${state}` },
    openGraph: {
      title: `Mahjong Players and Groups in ${data.name} | Find My Mahj Game`,
      description: `Find mahjong players, open plays, venues and events in ${data.name}. Search ${cityList} and more. Free directory for players.`,
      url: `https://findmymahjgame.com/states/${state}`,
    },
  };
}

export default async function StatePage({ params }: { params: Promise<{ state: string }> }) {
  const { state } = await params;
  const data = STATES[state];
  if (!data) notFound();

  const supabase = createServerClient();

  // Fetch all published data for this state in parallel
  const [playersRes, eventsRes, venuesRes] = await Promise.all([
    supabase
      .from("player_listings")
      .select("*")
      .eq("state", data.abbr)
      .eq("status", "published")
      .order("created_at", { ascending: false }),
    supabase
      .from("event_listings")
      .select("*")
      .eq("state", data.abbr)
      .eq("status", "published")
      .order("event_date", { ascending: true }),
    supabase
      .from("venue_listings")
      .select("*")
      .eq("state", data.abbr)
      .eq("status", "published")
      .order("created_at", { ascending: false }),
  ]);

  const players = playersRes.data || [];
  const events = eventsRes.data || [];
  const venues = venuesRes.data || [];

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
      />
    </>
  );
}
