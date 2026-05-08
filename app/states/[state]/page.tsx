import { STATES, ALL_STATE_SLUGS } from "@/lib/states-data";
import { createServerClient } from "@/lib/supabase-server";
import { notFound } from "next/navigation";
import StatePageClient from "./client";

export const revalidate = 3600; // revalidate every hour

export function generateStaticParams() {
  return ALL_STATE_SLUGS.map((state) => ({ state }));
}

export async function generateMetadata({ params }: { params: Promise<{ state: string }> }) {
  const { state } = await params;
  const data = STATES[state];
  if (!data) return {};
  return {
    title: `Mahjong Players & Groups in ${data.name}`,
    description: `Find mahjong players, groups, open plays, venues and events in ${data.name}. Connect with local mahjong players near you in ${data.cities.slice(0, 3).join(", ")} and more.`,
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

  return (
    <StatePageClient
      stateData={data}
      players={playersRes.data || []}
      events={eventsRes.data || []}
      venues={venuesRes.data || []}
    />
  );
}
