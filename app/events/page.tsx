import type { Metadata } from "next";
import Link from "next/link";
import { createServerClient } from "@/lib/supabase-server";
import { nearMatches } from "@/lib/near-match";
import { safeHttpUrl } from "@/lib/sanitize";

export const metadata: Metadata = {
  title: "Mahjong Events and Open Plays Near You",
  description: "Find American Mahjong open plays, games, leagues, and events near you. Where can you play this week?",
  alternates: { canonical: "https://findmymahjgame.com/events" },
};

export const revalidate = 300;

const TYPE_RANK: Record<string, number> = {
  openplay: 1, recurring: 2, league: 3, tournament: 4, retreat: 5, cruise: 6, special: 7, event: 8,
};
function rank(t: string | null | undefined): number {
  const k = (t || "").toLowerCase().replace(/[^a-z]/g, "");
  return TYPE_RANK[k] ?? 50;
}
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

export default async function EventsPage({ searchParams }: { searchParams: Promise<{ near?: string }> }) {
  const { near } = await searchParams;
  const supabase = createServerClient();
  const todayISO = new Date().toISOString().slice(0, 10);
  const { data } = await supabase.from("event_listings").select("id, event_name, event_type, city, state, venue, description, event_date, end_date, price, registration_url, tier, created_at, day_time, frequency, beginner_friendly").eq("status", "published").or(`event_date.is.null,event_date.gte.${todayISO},event_type.in.(open_play,openplay,recurring)`).order("event_date", { ascending: true });

  let rows = data || [];
  if (near && near.trim()) {
    const n = near.trim().toLowerCase();
    rows = rows.filter((e) => nearMatches(n, e.city, e.state));
  }
  rows = [...rows].sort((a, b) => rank(a.event_type) - rank(b.event_type));

  return (
    <main style={{ maxWidth: 1000, margin: "0 auto", padding: "2.5rem 1.2rem 4rem" }}>
      <h1 style={{ fontFamily: "var(--font-playfair), 'Playfair Display', serif", fontSize: "2.2rem", color: "var(--navy)", textAlign: "center", margin: "0 0 0.4rem" }}>Where can I play this week?</h1>
      <p style={{ fontSize: "1.2rem", color: "var(--muted)", textAlign: "center", lineHeight: 1.5, margin: "0 0 1.8rem" }}>American Mahjong open plays, games, and events near you.</p>

      <form method="get" style={{ display: "flex", gap: "0.6rem", flexWrap: "wrap", justifyContent: "center", maxWidth: 520, margin: "0 auto 2.4rem" }}>
        <label htmlFor="near" style={{ position: "absolute", width: 1, height: 1, overflow: "hidden", clip: "rect(0 0 0 0)" }}>Your city or area</label>
        <input id="near" name="near" defaultValue={near || ""} placeholder="Your city or ZIP" style={field} />
        <button type="submit" style={goBtn}>Search</button>
      </form>

      {rows.length > 0 ? (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 300px), 1fr))", gap: "1.2rem" }}>
          {rows.map((e) => {
            const safeUrl = safeHttpUrl(e.registration_url);
            const external = !!safeUrl;
            const card = (
              <>
                {e.event_type && <div style={{ display: "inline-block", textTransform: "uppercase", letterSpacing: "0.08em", fontSize: "0.85rem", fontWeight: 800, color: "var(--pink)", marginBottom: "0.5rem" }}>{String(e.event_type).replace(/_/g, " ")}</div>}
                <div style={{ fontSize: "1.3rem", fontWeight: 800, color: "var(--navy)", lineHeight: 1.25 }}>{e.event_name || "Mahjong"}</div>
                {whenLabel(e) && <div style={{ fontSize: "1.05rem", color: "var(--navy)", marginTop: "0.4rem" }}>{whenLabel(e)}</div>}
                {(e.venue || e.city) && <div style={{ fontSize: "1.05rem", color: "var(--muted)", marginTop: "0.3rem" }}>{[e.venue, e.city, e.state].filter(Boolean).join(", ")}</div>}
                {e.description && !external && <div style={{ fontSize: "0.98rem", color: "var(--muted)", marginTop: "0.4rem", lineHeight: 1.5 }}>{String(e.description).slice(0, 140)}</div>}
                {external && <div style={{ marginTop: "0.9rem", color: "var(--pink)", fontWeight: 800, fontSize: "1.15rem" }}>View details &rarr;</div>}
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
          <div style={{ fontSize: "1.4rem", fontWeight: 800, color: "var(--navy)", marginBottom: "0.6rem" }}>No public games listed{near ? ` in ${near}` : ""} yet.</div>
          <p style={{ fontSize: "1.1rem", color: "var(--muted)", lineHeight: 1.6, marginBottom: "1.6rem" }}>Be the first. You can list a game, start your own table, or get the weekly note when games open near you.</p>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.8rem", maxWidth: 320, margin: "0 auto" }}>
            <Link href="/get-listed" style={{ minHeight: 56, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 14, background: "var(--pink)", color: "white", fontWeight: 800, fontSize: "1.1rem", textDecoration: "none" }}>List a game free</Link>
            <Link href="/start" style={{ minHeight: 56, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 14, background: "var(--navy)", color: "white", fontWeight: 800, fontSize: "1.1rem", textDecoration: "none" }}>Start a table</Link>
            <Link href="/newsletter" style={{ minHeight: 56, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 14, background: "white", color: "var(--navy)", border: "2px solid var(--navy)", fontWeight: 800, fontSize: "1.1rem", textDecoration: "none" }}>Get the weekly list</Link>
          </div>
        </div>
      )}

      {rows.length > 0 && (
        <div style={{ textAlign: "center", marginTop: "2.5rem" }}>
          <Link href="/get-listed" style={{ color: "var(--pink)", fontWeight: 800, fontSize: "1.1rem" }}>Run a game? List it free &rarr;</Link>
        </div>
      )}
    </main>
  );
}
