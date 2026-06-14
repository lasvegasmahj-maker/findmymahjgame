import type { Metadata } from "next";
import Link from "next/link";
import NotifyMe from "@/components/notify-me";
import { createServerClient } from "@/lib/supabase-server";
import { nearMatches } from "@/lib/near-match";
import { safeHttpUrl } from "@/lib/sanitize";
import GroupedEvents, { type GroupedRow } from "@/components/grouped-events";

export const metadata: Metadata = {
  title: "Mahjong Tournaments Near You",
  description: "Find American Mahjong tournaments by state. Browse upcoming and recurring tournaments by location, see dates, venues, and registration links.",
  alternates: { canonical: "https://findmymahjgame.com/tournaments" },
};

export const revalidate = 300;

const norm = (t: string | null | undefined) => (t || "").toLowerCase().replace(/[^a-z]/g, "");

const field: React.CSSProperties = { minHeight: 54, padding: "0 1rem", border: "2px solid var(--border)", borderRadius: 12, fontSize: "1.1rem", fontFamily: "'DM Sans', sans-serif", color: "var(--navy)", flex: "1 1 200px" };
const goBtn: React.CSSProperties = { minHeight: 54, padding: "0 1.5rem", border: "none", borderRadius: 12, background: "var(--pink)", color: "white", fontWeight: 800, fontSize: "1.1rem", cursor: "pointer", fontFamily: "'DM Sans', sans-serif" };

export default async function TournamentsPage({ searchParams }: { searchParams: Promise<{ near?: string; sort?: string }> }) {
  const { near, sort } = await searchParams;
  const activeSort = (sort || "state").toLowerCase();
  const groupBy: "state" | "city" | null = activeSort === "city" ? "city" : activeSort === "soonest" ? null : "state";
  const supabase = createServerClient();
  const todayISO = new Date().toISOString().slice(0, 10);
  let { data } = await supabase.from("event_listings").select("id, event_name, event_type, city, state, venue, description, event_date, registration_url, day_time, frequency, beginner_friendly, confirmed_active_at, host").eq("status", "published").or(`event_date.gte.${todayISO},event_date.is.null,frequency.not.is.null`).order("event_date", { ascending: true });
  if (!data) {
    const fallback = await supabase.from("event_listings").select("id, event_name, event_type, city, state, venue, description, event_date, registration_url, day_time, frequency, beginner_friendly, host").eq("status", "published").or(`event_date.gte.${todayISO},event_date.is.null,frequency.not.is.null`).order("event_date", { ascending: true });
    data = (fallback.data || []).map((r) => ({ ...r, confirmed_active_at: null }));
  }

  const _today = new Date(); _today.setHours(0, 0, 0, 0);
  const isRecurring = (e: { event_date?: string | null; frequency?: string | null; day_time?: string | null }) => !e.event_date && (!!e.frequency || !!e.day_time);
  const isFutureDated = (e: { event_date?: string | null }) => {
    if (!e.event_date) return false;
    const d = new Date(e.event_date);
    return !isNaN(d.getTime()) && d >= _today;
  };

  let rows = (data || []).filter((e) => norm(e.event_type) === "tournament").filter((e) => isFutureDated(e) || isRecurring(e));
  if (near && near.trim()) {
    const n = near.trim().toLowerCase();
    rows = rows.filter((e) => nearMatches(n, e.city, e.state));
  }

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
  const SORTS: [string, string][] = [["state", "By state"], ["soonest", "Soonest"], ["city", "By city"]];

  return (
    <main style={{ maxWidth: 1000, margin: "0 auto", padding: "2.5rem 1.2rem 4rem" }}>
      {eventSchema.length > 0 && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(eventSchema) }} />}
      <h1 style={{ fontFamily: "var(--font-playfair), 'Playfair Display', serif", fontSize: "2.2rem", color: "var(--navy)", textAlign: "center", margin: "0 0 0.4rem" }}>Mahjong tournaments by state</h1>
      <p style={{ fontSize: "1.2rem", color: "var(--muted)", textAlign: "center", lineHeight: 1.5, margin: "0 0 1.8rem" }}>Upcoming and recurring American Mahjong tournaments, grouped by state. Search your city or browse below.</p>

      <form method="get" style={{ display: "flex", gap: "0.6rem", flexWrap: "wrap", justifyContent: "center", maxWidth: 520, margin: "0 auto 2.2rem" }}>
        <label htmlFor="near" style={{ position: "absolute", width: 1, height: 1, overflow: "hidden", clip: "rect(0 0 0 0)" }}>Your city or area</label>
        <input id="near" name="near" defaultValue={near || ""} placeholder="Your city or state" style={field} />
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
          <GroupedEvents rows={rows as GroupedRow[]} typeLabel="Tournament" cta="Register" groupBy={groupBy} />
        </>
      ) : (
        <div style={{ background: "var(--bg)", borderRadius: 18, padding: "2.4rem 1.6rem", textAlign: "center", maxWidth: 560, margin: "0 auto" }}>
          <div style={{ fontSize: "1.4rem", fontWeight: 800, color: "var(--navy)", marginBottom: "0.6rem" }}>No tournaments listed{near ? ` in ${near}` : ""} yet.</div>
          <p style={{ fontSize: "1.1rem", color: "var(--muted)", lineHeight: 1.6, marginBottom: "1.6rem" }}>Be the first. If you run a Mahjong tournament, list it here and players will find it.</p>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.8rem", maxWidth: 320, margin: "0 auto" }}>
            <Link href="/get-listed" style={{ minHeight: 56, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 14, background: "var(--pink)", color: "white", fontWeight: 800, fontSize: "1.1rem", textDecoration: "none" }}>List your tournament</Link>
            <Link href="/events" style={{ minHeight: 56, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 14, background: "white", color: "var(--navy)", border: "2px solid var(--navy)", fontWeight: 800, fontSize: "1.1rem", textDecoration: "none" }}>See all events and open plays</Link>
          </div>
          <div style={{ marginTop: "1.6rem" }}><NotifyMe defaultCity={near || ""} /></div>
        </div>
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
