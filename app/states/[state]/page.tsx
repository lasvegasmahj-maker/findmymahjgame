import { STATES, ALL_STATE_SLUGS } from "@/lib/states-data";
import { notFound } from "next/navigation";
import StatePageClient from "./client";

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
  return <StatePageClient stateData={data} />;
}
