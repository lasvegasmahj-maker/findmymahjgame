import type { Metadata } from "next";
import Link from "next/link";
import { createServerClient } from "@/lib/supabase-server";
import { nearMatches } from "@/lib/near-match";
import { safeHttpUrl } from "@/lib/sanitize";

export const metadata: Metadata = {
  title: "Mahjong Leagues Near You",
  description: "Find American Mahjong leagues near you. Recurring weekly play, seasonal standings, and ongoing groups you can join.",
  alternates: { canonical: "https://findmymahjgame.com/leagues" },
};

export const revalidate = 300;

const norm = (t: string | null | undefined) => (t || "").toLowerCase().replace(/[^a-z]/g, "");
const isLeague = (t: string | null | undefined) => norm(t) === "league";

function whenLabel(e: { event_date?: string | null; day_time?: string | null; day_of_week?: string | null; time_of_day?: string | null }): string {
  if (e.day_time && !e.event_date) return e.day_time;
  if (e.day_time && e.event_date && new Date(e.event_date).getTime() < Date.now()) return e.day_time;
  if (e.event_date) {
    const d = new Date(e.event_date);
    if (!isNaN(d.getTime())) return d.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", timeZone: "UTC" });
  }
  return e.day_time || [e.day_of_week, e.time_of_day].filter(Boolean).join(" ");
}

const field: React.CSSProperties = { minHeight: 54, padding: "0 1rem", border: "2px solid var(--border)", borderRadius: 12, fontSize: "1.1rem", fontFamily: "'DM Sans', sans-serif", color: "var(--navy)", flex: "1 1 200px" };
const goBtn: React.CSSProperties = { minHeight: 54, padding: "0 1.5rem", border: "none", borderRadius: 12, background: "var(--pink)", color: "white", fontWeight: 800, fontSize: "1.1rem", cursor: "pointer", fontFamily: "'DM Sans', sans-serif" };

export default async function LeaguesPage({ searchParams }: { searchParams: Promise<{ near?: string }> }) {
  const { near } = await searchParams;
  const supabase = createServerClient();
  const todayISO = new Date().toISOString().slice(0, 10);
  let { data } = await supabase.from("event_listings").select("id, event_name, event_type, city, state, venue, description, event_date, end_date, price, registration_url, tier, created_at, day_time, frequency, beginner_friendly, confirmed_active_at").eq("status", "published").eq("event_type", "league").or(`event_date.is.null,event_date.gte.${todayISO}`).order("event_date", { ascending: true });
  if (!data) {
    const fallback = await supabase.from("event_listings").select("id, event_name, event_type, city, state, venue, description, event_date, end_date, price, registration_url, tier, created_at, day_time, frequency, beginner_friendly").eq("status", "published").eq("event_type", "league").or(`event_date.is.null,event_date.gte.${todayISO}`).order("event_date", { ascending: true });
    data = (fallback.data || []).map((r) => ({ ...r, confirmed_active_at: null }));
  }

  let rows = (data || []).filter((e) => isLeague(e.event_type));
  if (near && near.trim()) {
    const n = near.trim().toLowerCase();
    rows = rows.filter((e) => nearMatches(n, e.city, e.state));
  }

  const FRESH_MS = 90 * 24 * 60 * 60 * 1000;
  const isFresh = (at?: string | null) => !!at && Date.now() - new Date(at).getTime() < FRESH_MS;
  rows = [...rows].sort((a, b) => (isFresh(b.confirmed_active_at) ? 1 : 0) - (isFresh(a.confirmed_active_at) ? 1 : 0));

  const _today = new Date(); _today.setHours(0, 0, 0, 0);
  const eventSchema = rows
    .filter((e) => {
      if (!e.event_date) return false;
      const d = new Date(e.event_date);
      return !isNaN(d.getTime()) && d >= _today;
    })
    .slice(0, 50)
    .map((e) => ({
      "@context": "https://schema.org",
      "@type": "Event",
      name: e.event_name || "Mahjong League",
      startDate: e.event_date,
      eventStatus: "https://schema.org/EventScheduled",
      eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
      location: { "@type": "Place", name: e.venue || [e.city, e.state].filter(Boolean).join(", ") || "See listing", address: [e.city, e.state].filter(Boolean).join(", ") || "United States" },
      ...(safeHttpUrl(e.registration_url) ? { url: safeHttpUrl(e.registration_url)! } : {}),
    }));

  return (
    <main style={{ maxWidth: 1000, margin: "0 auto", padding: "2.5rem 1.2rem 4rem" }}>
      {eventSchema.length > 0 && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(eventSchema) }} />}
      <h1 style={{ fontFamily: "var(--font-playfair), 'Playfair Display', serif", fontSize: "2.2rem", color: "var(--navy)", textAlign: "center", margin: "0 0 0.4rem" }}>Mahjong leagues near you</h1>
      <p style={{ fontSize: "1.2rem", color: "var(--muted)", textAlign: "center", lineHeight: 1.5, margin: "0 0 1.8rem" }}>American Mahjong leagues with recurring play and seasonal standings. Join a group near you.</p>

      <form method="get" style={{ display: "flex", gap: "0.6rem", flexWrap: "wrap", justifyContent: "center", maxWidth: 520, margin: "0 auto 2.2rem" }}>
        <label htmlFor="near" style={{ position: "absolute", width: 1, height: 1, overflow: "hidden", clip: "rect(0 0 0 0)" }}>Your city or area</label>
        <input id="near" name="near" defaultValue={near || ""} placeholder="Your city or state" style={field} />
        <button type="submit" style={goBtn}>Search</button>
      </form>

      {rows.length > 0 ? (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 300px), 1fr))", gap: "1.2rem" }}>
          {rows.map((e) => {
            const safeUrl = safeHttpUrl(e.registration_url);
            const external = !!safeUrl;
            const card = (
              <>
                <div style={{ display: "inline-block", textTransform: "uppercase", letterSpacing: "0.08em", fontSize: "0.85rem", fontWeight: 800, color: "var(--pink-text)", marginBottom: "0.5rem" }}>League</div>
                <div style={{ fontSize: "1.3rem", fontWeight: 800, color: "var(--navy)", lineHeight: 1.25 }}>{e.event_name || "Mahjong League"}</div>
                {whenLabel(e) && <div style={{ fontSize: "1.05rem", color: "var(--navy)", marginTop: "0.4rem" }}>{whenLabel(e)}</div>}
                {(e.venue || e.city) && <div style={{ fontSize: "1.05rem", color: "var(--muted)", marginTop: "0.3rem" }}>{[e.venue, e.city, e.state].filter(Boolean).join(", ")}</div>}
                <div style={{ marginTop: "0.45rem", display: "flex", gap: "0.4rem", flexWrap: "wrap" }}>
                  {e.beginner_friendly === true && (
                    <span style={{ display: "inline-block", fontSize: "0.85rem", fontWeight: 800, color: "#1a6e3a", background: "rgba(46,201,92,0.14)", borderRadius: 50, padding: "0.2rem 0.7rem" }}>Beginners welcome</span>
                  )}
                  {isFresh(e.confirmed_active_at) && (
                    <span style={{ display: "inline-block", fontSize: "0.85rem", fontWeight: 800, color: "var(--green-dark, #1a6e3a)", background: "rgba(46,201,92,0.12)", borderRadius: 50, padding: "0.2rem 0.7rem" }}>
                      Confirmed active {new Date(e.confirmed_active_at!).toLocaleDateString("en-US", { month: "long", year: "numeric", timeZone: "UTC" })}
                    </span>
                  )}
                </div>
                {e.description && !external && <div style={{ fontSize: "0.98rem", color: "var(--muted)", marginTop: "0.4rem", lineHeight: 1.5 }}>{String(e.description).slice(0, 140)}</div>}
                {external && <div style={{ marginTop: "0.9rem", color: "var(--pink-text)", fontWeight: 800, fontSize: "1.15rem" }}>View details &rarr;</div>}
              </>
            );
            const cardStyle = { display: "block", background: "white", border: "2px solid var(--border)", borderRadius: 16, padding: "1.4rem", textDecoration: "none" } as const;
            return external ? (
              <a key={e.id} href={safeUrl} target="_blank" rel="noopener noreferrer" style={cardStyle}>{card}</a>
            ) : (
              <div key={e.id} style={cardStyle}>{card}</div>
            );
          })}
        </div>
      ) : (
        <div style={{ background: "var(--bg)", borderRadius: 18, padding: "2.4rem 1.6rem", textAlign: "center", maxWidth: 560, margin: "0 auto" }}>
          <div style={{ fontSize: "1.4rem", fontWeight: 800, color: "var(--navy)", marginBottom: "0.6rem" }}>No leagues listed{near ? ` in ${near}` : ""} yet.</div>
          <p style={{ fontSize: "1.1rem", color: "var(--muted)", lineHeight: 1.6, marginBottom: "1.6rem" }}>Be the first. You can list a league, start your own, or browse every kind of game and event near you.</p>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.8rem", maxWidth: 320, margin: "0 auto" }}>
            <Link href="/get-listed" style={{ minHeight: 56, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 14, background: "var(--pink)", color: "white", fontWeight: 800, fontSize: "1.1rem", textDecoration: "none" }}>List a league free</Link>
            <Link href="/start" style={{ minHeight: 56, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 14, background: "var(--navy)", color: "white", fontWeight: 800, fontSize: "1.1rem", textDecoration: "none" }}>Start a table</Link>
            <Link href="/events" style={{ minHeight: 56, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 14, background: "white", color: "var(--navy)", border: "2px solid var(--navy)", fontWeight: 800, fontSize: "1.1rem", textDecoration: "none" }}>Browse all games and events</Link>
          </div>
        </div>
      )}

      {rows.length > 0 && (
        <div style={{ textAlign: "center", marginTop: "2.5rem" }}>
          <Link href="/get-listed" style={{ color: "var(--pink-text)", fontWeight: 800, fontSize: "1.1rem" }}>Run a league? List it free &rarr;</Link>
        </div>
      )}
    </main>
  );
}
