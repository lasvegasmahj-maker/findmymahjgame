import type { Metadata } from "next";
import Link from "next/link";
import NotifyMe from "@/components/notify-me";
import BrandedEmptyState from "@/components/branded-empty-state";
import { searchEvents } from "@/lib/search";
import CityAutocomplete from "@/components/city-autocomplete";
import { safeHttpUrl } from "@/lib/sanitize";
import GroupedEvents from "@/components/grouped-events";
import { schemaScriptProps } from "@/lib/schema";

export const metadata: Metadata = {
  title: "Mahjong Tournaments Near You",
  description: "Find American Mahjong tournaments by state. Browse upcoming and recurring tournaments by location, see dates, venues, and registration links.",
  alternates: { canonical: "https://findmymahjgame.com/tournaments" },
};

export const revalidate = 300;

const field: React.CSSProperties = { minHeight: 54, padding: "0 1rem", border: "2px solid var(--border)", borderRadius: 12, fontSize: "1.1rem", fontFamily: "'DM Sans', sans-serif", color: "var(--navy)", flex: "1 1 200px" };
const goBtn: React.CSSProperties = { minHeight: 54, padding: "0 1.5rem", border: "none", borderRadius: 12, background: "var(--pink)", color: "white", fontWeight: 800, fontSize: "1.1rem", cursor: "pointer", fontFamily: "'DM Sans', sans-serif" };

export default async function TournamentsPage({ searchParams }: { searchParams: Promise<{ near?: string; sort?: string }> }) {
  const { near, sort } = await searchParams;
  const activeSort = (sort || "state").toLowerCase();
  const groupBy: "state" | null = activeSort === "date" ? null : "state";
  const rows = await searchEvents({ types: ["tournament"], near: near || null });

  const _today = new Date(); _today.setHours(0, 0, 0, 0);
  const isFutureDated = (e: { event_date?: string | null }) => {
    if (!e.event_date) return false;
    const d = new Date(e.event_date);
    return !isNaN(d.getTime()) && d >= _today;
  };

  const eventSchema = rows
    .filter((e) => isFutureDated(e))
    .slice(0, 50)
    .map((e) => ({
      "@context": "https://schema.org",
      "@type": "Event",
      name: e.event_name || "Mahjong Tournament",
      startDate: e.event_date,
      eventStatus: "https://schema.org/EventScheduled",
      eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
      location: { "@type": "Place", name: e.venue || [e.city, e.state].filter(Boolean).join(", ") || "See listing", address: [e.city, e.state].filter(Boolean).join(", ") || "United States" },
      ...(safeHttpUrl(e.registration_url) ? { url: safeHttpUrl(e.registration_url)! } : {}),
    }));

  const sortHref = (k: string) => {
    const qs = new URLSearchParams();
    if (near && near.trim()) qs.set("near", near.trim());
    if (k !== "state") qs.set("sort", k);
    const s = qs.toString();
    return `/tournaments${s ? `?${s}` : ""}`;
  };
  const SORTS: [string, string][] = [["state", "By state"], ["date", "By date"]];

  return (
    <main style={{ maxWidth: 1000, margin: "0 auto", padding: "2.5rem 1.2rem 4rem" }}>
      {eventSchema.length > 0 && <script {...schemaScriptProps(eventSchema)} />}
      <h1 style={{ fontFamily: "var(--font-playfair), 'Playfair Display', serif", fontSize: "2.2rem", color: "var(--navy)", textAlign: "center", margin: "0 0 0.4rem" }}>Mahjong tournaments by state</h1>
      <p style={{ fontSize: "1.2rem", color: "var(--muted)", textAlign: "center", lineHeight: 1.5, margin: "0 0 1.8rem" }}>Upcoming and recurring American Mahjong tournaments, grouped by state. Search your city or browse below.</p>

      <form method="get" style={{ display: "flex", gap: "0.6rem", flexWrap: "wrap", justifyContent: "center", maxWidth: 520, margin: "0 auto 2.2rem" }}>
        <label htmlFor="near" style={{ position: "absolute", width: 1, height: 1, overflow: "hidden", clip: "rect(0 0 0 0)" }}>Your city or area</label>
        <CityAutocomplete id="near" name="near" defaultValue={near || ""} placeholder="Your city or state" inputStyle={field} submitOnPick />
        {activeSort !== "state" && <input type="hidden" name="sort" value={activeSort} />}
        <button type="submit" style={goBtn}>Search</button>
      </form>

      {rows.length > 0 ? (
        <>
          <div style={{ display: "flex", gap: "0.9rem", flexWrap: "wrap", justifyContent: "center", alignItems: "center", margin: "0 auto 2rem" }}>
            <span style={{ fontSize: "0.9rem", color: "var(--muted)", fontWeight: 700 }}>Sort:</span>
            {SORTS.map(([k, label]) => (
              <Link key={k} href={sortHref(k)} style={{ fontSize: "0.95rem", fontWeight: 700, textDecoration: "none", color: activeSort === k ? "var(--pink-text)" : "var(--muted)", borderBottom: activeSort === k ? "2px solid var(--pink)" : "2px solid transparent", paddingBottom: "0.1rem" }}>{label}</Link>
            ))}
          </div>
          <GroupedEvents rows={rows} typeLabel="Tournament" cta="Register" groupBy={groupBy} />
        </>
      ) : (
        <BrandedEmptyState
          title={`No tournaments listed${near ? ` in ${near}` : ""} yet.`}
          message="Be the first. If you run a Mahjong tournament, list it here and players will find it."
          ctaHref="/get-listed"
          ctaLabel="List your tournament"
          secondary={
            <div style={{ display: "flex", flexDirection: "column", gap: "0.8rem", maxWidth: 320, margin: "0 auto" }}>
              <Link href="/events" style={{ minHeight: 52, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 14, background: "white", color: "var(--navy)", border: "2px solid var(--navy)", fontWeight: 800, fontSize: "1.05rem", textDecoration: "none" }}>See all events and open plays</Link>
              <NotifyMe defaultCity={near || ""} />
            </div>
          }
        />
      )}

      {rows.length > 0 && (
        <div style={{ textAlign: "center", marginTop: "2.5rem", display: "flex", flexDirection: "column", gap: "0.6rem" }}>
          <Link href="/get-listed" style={{ color: "var(--pink-text)", fontWeight: 800, fontSize: "1.1rem" }}>Run a tournament? List it here &rarr;</Link>
          <Link href="/events" style={{ color: "var(--navy)", fontWeight: 800, fontSize: "1.05rem" }}>See all events and open plays &rarr;</Link>
        </div>
      )}
    </main>
  );
}
