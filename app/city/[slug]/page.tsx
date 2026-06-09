import type { Metadata } from "next";
import { createClient } from "@supabase/supabase-js";
import SeatDots from "@/components/seat-dots";
import { SAMPLE_TEACHERS } from "@/lib/teachers-data";
import { SAMPLE_PROFILES } from "@/lib/ambassador-profiles-data";

export const dynamic = "force-dynamic";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const slugify = (s: string) => s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  return { title: `Mahjong in ${slug.replace(/-/g, " ")} | Find My Mahj Game`, robots: { index: false, follow: false } };
}

type Row = Record<string, unknown>;

export default async function CityPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  const { data: tblData } = await supabase
    .from("tables").select("id, share_code, day_of_week, time_of_day, city, state, seats_total, status")
    .in("status", ["forming", "full"]);
  const all = (tblData || []) as Row[];
  const cityTables = all.filter((t) => slugify(String(t.city || "")) === slug);

  const cityName = cityTables.length ? String(cityTables[0].city) : slug.replace(/-/g, " ").replace(/\b\w/g, (m) => m.toUpperCase());
  const hasActivity = cityTables.length > 0;

  // Fill counts for the forming tables (closest-to-full first).
  const forming: { share_code: string; day: string; time: string; total: number; filled: number }[] = [];
  for (const t of cityTables.filter((t) => t.status === "forming")) {
    const { count } = await supabase.from("table_seats").select("id", { count: "exact", head: true }).eq("table_id", t.id as string);
    forming.push({ share_code: String(t.share_code), day: String(t.day_of_week || ""), time: String(t.time_of_day || ""), total: Number(t.seats_total) || 4, filled: count ?? 1 });
  }
  forming.sort((a, b) => b.filled - a.filled);

  const ambassador = SAMPLE_PROFILES.find((p) => slugify(p.city) === slug);
  const teachers = SAMPLE_TEACHERS.filter((t) => slugify(t.city) === slug);

  const { data: evData } = await supabase
    .from("event_listings").select("event_name, city, event_date, registration_url").eq("status", "published").ilike("city", `%${cityName}%`).limit(4);
  const events = (evData || []) as Row[];

  if (!hasActivity) {
    return (
      <main style={{ maxWidth: 560, margin: "0 auto", padding: "1.5rem 1.2rem 4rem", textAlign: "center" }}>
        <a href="/" style={{ fontSize: "1.05rem", color: "var(--pink)", fontWeight: 700, textDecoration: "none", display: "block", textAlign: "left" }}>&larr; Home</a>
        <h1 style={{ fontSize: "2rem", color: "var(--navy)", margin: "1.2rem 0 0.5rem", fontFamily: "var(--font-playfair), 'Playfair Display', serif" }}>Mahjong in {cityName}</h1>
        <p style={{ fontSize: "1.2rem", color: "var(--muted)", lineHeight: 1.6, marginBottom: "1.6rem" }}>No games here yet. You could be the first to start one. It takes about a minute.</p>
        <a href="/start" style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", minHeight: 68, padding: "0 1.8rem", borderRadius: 16, background: "var(--pink)", color: "white", fontSize: "1.3rem", fontWeight: 800, textDecoration: "none" }}>Start a Table</a>
      </main>
    );
  }

  return (
    <main style={{ maxWidth: 620, margin: "0 auto", padding: "1.5rem 1.2rem 4rem" }}>
      <a href="/" style={{ fontSize: "1.05rem", color: "var(--pink)", fontWeight: 700, textDecoration: "none" }}>&larr; Home</a>
      <h1 style={{ fontSize: "2.1rem", color: "var(--navy)", margin: "0.8rem 0 0.3rem", fontFamily: "var(--font-playfair), 'Playfair Display', serif" }}>Mahjong in {cityName}</h1>
      <p style={{ fontSize: "1.15rem", color: "var(--muted)", lineHeight: 1.5, marginBottom: "1.6rem" }}>Games, teachers, and your local ambassador, all in one place.</p>

      {ambassador && (
        <a href={`/ambassadors/${ambassador.slug}`} style={{ display: "flex", alignItems: "center", gap: "1rem", background: "white", border: "2px solid var(--border)", borderRadius: 16, padding: "1.1rem 1.2rem", textDecoration: "none", marginBottom: "1.8rem" }}>
          <div style={{ width: 56, height: 56, flexShrink: 0, borderRadius: 999, background: "var(--navy)", color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.5rem", fontWeight: 800 }}>{ambassador.name.slice(0, 1)}</div>
          <div>
            <div style={{ fontSize: "0.85rem", color: "var(--green)", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.05em" }}>Your Founding Ambassador</div>
            <div style={{ fontSize: "1.3rem", fontWeight: 800, color: "var(--navy)" }}>{ambassador.name}</div>
          </div>
        </a>
      )}

      {forming.length > 0 && (
        <section style={{ marginBottom: "1.8rem" }}>
          <h2 style={{ fontSize: "1.5rem", color: "var(--navy)", fontFamily: "var(--font-playfair), 'Playfair Display', serif", marginBottom: "0.8rem" }}>Tables forming now</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.9rem" }}>
            {forming.map((g) => {
              const needs4th = g.total - g.filled === 1;
              return (
                <a key={g.share_code} href={`/t/${g.share_code}`} style={{ display: "block", background: "white", border: needs4th ? "2px solid var(--pink)" : "2px solid var(--border)", borderRadius: 16, padding: "1.2rem" }}>
                  {needs4th && <div style={{ display: "inline-block", background: "var(--pink)", color: "white", fontWeight: 800, fontSize: "0.9rem", padding: "0.25rem 0.8rem", borderRadius: 999, marginBottom: "0.5rem" }}>Need a 4th</div>}
                  <div style={{ fontSize: "1.25rem", fontWeight: 800, color: "var(--navy)" }}>{`${g.day} ${g.time}`.trim() || "Mahjong"}</div>
                  <div style={{ marginTop: "0.5rem" }}><SeatDots filled={g.filled} total={g.total} size="1.2rem" /></div>
                  <div style={{ marginTop: "0.6rem", color: "var(--pink)", fontWeight: 800 }}>Join this game &rarr;</div>
                </a>
              );
            })}
          </div>
        </section>
      )}

      <a href="/start" style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: 60, borderRadius: 14, background: "var(--pink)", color: "white", fontSize: "1.2rem", fontWeight: 800, textDecoration: "none", marginBottom: "2rem" }}>Start another table in {cityName}</a>

      {teachers.length > 0 && (
        <section style={{ marginBottom: "1.8rem" }}>
          <h2 style={{ fontSize: "1.5rem", color: "var(--navy)", fontFamily: "var(--font-playfair), 'Playfair Display', serif", marginBottom: "0.3rem" }}>Teachers here</h2>
          <p style={{ fontSize: "0.95rem", color: "var(--muted)", marginBottom: "0.8rem" }}>Sample listings for preview.</p>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.7rem" }}>
            {teachers.map((t) => (
              <div key={t.id} style={{ background: "white", border: "2px solid var(--border)", borderRadius: 14, padding: "1rem 1.1rem", display: "flex", justifyContent: "space-between", alignItems: "center", gap: "0.6rem" }}>
                <div style={{ fontSize: "1.15rem", fontWeight: 800, color: "var(--navy)" }}>{t.name}</div>
                {t.isAmbassador && <span style={{ background: "var(--green)", color: "white", fontWeight: 800, fontSize: "0.8rem", padding: "0.2rem 0.6rem", borderRadius: 999 }}>Ambassador</span>}
              </div>
            ))}
          </div>
          <a href="/teachers" style={{ display: "inline-block", marginTop: "0.7rem", color: "var(--pink)", fontWeight: 700 }}>See all teachers &rarr;</a>
        </section>
      )}

      {events.length > 0 && (
        <section>
          <h2 style={{ fontSize: "1.5rem", color: "var(--navy)", fontFamily: "var(--font-playfair), 'Playfair Display', serif", marginBottom: "0.8rem" }}>Events nearby</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.7rem" }}>
            {events.map((e, i) => (
              <div key={i} style={{ background: "white", border: "2px solid var(--border)", borderRadius: 14, padding: "1rem 1.1rem" }}>
                <div style={{ fontSize: "1.15rem", fontWeight: 800, color: "var(--navy)" }}>{String(e.event_name)}</div>
                {e.event_date ? <div style={{ fontSize: "1rem", color: "var(--muted)", marginTop: "0.2rem" }}>{new Date(String(e.event_date)).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}</div> : null}
              </div>
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
