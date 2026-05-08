import { STATES } from "@/lib/states-data";
import { createServerClient } from "@/lib/supabase-server";
import StatePageClient from "../[state]/client";

export const revalidate = 3600;

export const metadata = {
  title: "Mahjong Players & Groups in Florida",
  description: "Find mahjong players, groups, open plays, venues and events in Florida. Connect with local mahjong players near you in Miami, Boca Raton, Orlando and more.",
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
