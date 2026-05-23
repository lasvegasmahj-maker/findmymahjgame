import { STATES } from "@/lib/states-data";
import { createServerClient } from "@/lib/supabase-server";
import StatePageClient from "../[state]/client";

export const revalidate = 3600;

export const metadata = {
  title: "Mahjong Players and Groups in Florida | Find My Mahj Game",
  description:
    "Find mahjong players, clubs, open plays and events in Florida. Search Miami, Boca Raton, Orlando, Tampa, Naples and more. Free directory for players.",
  alternates: { canonical: "https://findmymahjgame.com/states/florida" },
  openGraph: {
    title: "Mahjong Players and Groups in Florida | Find My Mahj Game",
    description:
      "Find mahjong players, clubs, open plays and events in Florida. Search Miami, Boca Raton, Orlando, Tampa, Naples and more. Free directory for players.",
    url: "https://findmymahjgame.com/states/florida",
  },
};

export default async function FloridaPage() {
  const stateData = STATES["florida"];
  const supabase = createServerClient();

  const [playersRes, eventsRes, venuesRes] = await Promise.all([
    supabase.from("player_listings").select("*").eq("state", "FL").eq("status", "published").order("created_at", { ascending: false }),
    supabase.from("event_listings").select("*").eq("state", "FL").eq("status", "published").order("event_date", { ascending: true }),
    supabase.from("venue_listings").select("*").eq("state", "FL").eq("status", "published").order("created_at", { ascending: false }),
  ]);

  return (
    <StatePageClient
      stateData={stateData}
      players={playersRes.data || []}
      events={eventsRes.data || []}
      venues={venuesRes.data || []}
    />
  );
}
