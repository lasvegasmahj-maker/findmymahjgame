import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@supabase/supabase-js";
import { verifyActionToken } from "@/lib/game-token";
import ClaimForm from "./claim-form";

export const metadata: Metadata = { title: "Claim your listing", robots: { index: false } };
export const dynamic = "force-dynamic";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const FIELDS: Record<string, { key: string; label: string; long?: boolean }[]> = {
  venue_listings: [
    { key: "business_name", label: "Business or club name" },
    { key: "city", label: "City" },
    { key: "state", label: "State (two letters)" },
    { key: "website", label: "Website" },
    { key: "instagram", label: "Instagram" },
    { key: "display_email", label: "Public email (shown to players)" },
    { key: "description", label: "About your lessons or games", long: true },
  ],
  event_listings: [
    { key: "event_name", label: "Game or event name" },
    { key: "venue", label: "Where it meets" },
    { key: "city", label: "City" },
    { key: "state", label: "State (two letters)" },
    { key: "day_time", label: "Day and time (for example, Tuesdays 1-4pm)" },
    { key: "registration_url", label: "Link for players (website or signup)" },
    { key: "description", label: "Anything players should know", long: true },
  ],
};

export default async function ClaimPage({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const { token } = await searchParams;
  const v = token ? verifyActionToken(token) : null;

  const shell = (children: React.ReactNode) => (
    <main style={{ maxWidth: 620, margin: "0 auto", padding: "2.5rem 1.2rem 4rem", fontFamily: "'DM Sans', sans-serif" }}>
      {children}
    </main>
  );

  if (!v || v.action !== "claim" || !token) {
    return shell(
      <div style={{ textAlign: "center" }}>
        <h1 style={{ fontSize: "1.9rem", color: "var(--navy)", fontFamily: "var(--font-playfair), 'Playfair Display', serif" }}>That link has expired</h1>
        <p style={{ fontSize: "1.1rem", color: "var(--muted)", lineHeight: 1.6 }}>No worries. Email us at hello@findmymahjgame.com and we will send a fresh one.</p>
        <Link href="/" style={{ display: "inline-block", marginTop: "1.2rem", color: "var(--pink)", fontWeight: 700, textDecoration: "none" }}>&larr; Back home</Link>
      </div>
    );
  }

  const [table, id] = String(v.subjectId).split("|");
  const fields = FIELDS[table];
  if (!fields || !id) {
    return shell(<p style={{ textAlign: "center", color: "var(--muted)" }}>Invalid claim link.</p>);
  }

  const { data: listing } = await supabase.from(table).select("*").eq("id", id).single();
  if (!listing) {
    return shell(<p style={{ textAlign: "center", color: "var(--muted)" }}>This listing no longer exists.</p>);
  }

  const name = String(listing.business_name || listing.event_name || "your listing");
  const safe: Record<string, string | null> = {};
  for (const f of fields) safe[f.key] = listing[f.key] ?? null;

  return shell(
    <>
      <h1 style={{ fontSize: "1.9rem", color: "var(--navy)", fontFamily: "var(--font-playfair), 'Playfair Display', serif", marginBottom: "0.4rem" }}>This is you: {name}</h1>
      <p style={{ fontSize: "1.1rem", color: "var(--muted)", lineHeight: 1.6, marginBottom: "1.6rem" }}>
        Welcome! Check the details below, fix anything that is wrong, and this listing is yours. Listing here is free, with no charge ever. Players are sent to your own website and pages; money never crosses our table.
      </p>
      <ClaimForm token={token} table={table} listing={safe} fields={fields} />
    </>
  );
}
