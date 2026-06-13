import { cookies } from "next/headers";
import { createClient } from "@supabase/supabase-js";
import { verifyAdminSessionToken, ADMIN_COOKIE } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

type Row = Record<string, unknown>;

export default async function HeatmapPage() {
  const c = await cookies();
  if (!verifyAdminSessionToken(c.get(ADMIN_COOKIE)?.value)) {
    return (
      <main style={{ maxWidth: 480, margin: "0 auto", padding: "4rem 1.5rem", textAlign: "center" }}>
        <p style={{ fontSize: "1.1rem", color: "var(--navy)" }}>Please sign in to view the heat map.</p>
        <a href="/admin" style={{ color: "var(--pink)", fontWeight: 700 }}>Go to Admin</a>
      </main>
    );
  }

  // Demand = "I want to play" requests, aggregated by city. Also pull forming
  // tables so we can show supply next to demand. Reads existing tables only.
  const [{ data: prData }, { data: tblData }] = await Promise.all([
    supabase.from("play_requests").select("city, state, created_at"),
    supabase.from("tables").select("city, status"),
  ]);
  const PR = (prData || []) as Row[];
  const TBL = (tblData || []) as Row[];

  const norm = (s: unknown) => String(s || "").trim();
  const key = (city: string, state: string) => (state ? `${city}, ${state}` : city);

  const demand: Record<string, number> = {};
  PR.forEach((r) => {
    const city = norm(r.city);
    if (!city) return;
    demand[key(city, norm(r.state))] = (demand[key(city, norm(r.state))] || 0) + 1;
  });
  const supply: Record<string, number> = {};
  TBL.forEach((r) => {
    const city = norm(r.city);
    if (!city) return;
    const k = city.toLowerCase();
    supply[k] = (supply[k] || 0) + 1;
  });

  const rows = Object.entries(demand).sort((a, b) => b[1] - a[1]);
  const max = rows.length ? rows[0][1] : 0;
  const totalDemand = PR.filter((r) => norm(r.city)).length;

  return (
    <main style={{ maxWidth: 760, margin: "0 auto", padding: "2rem 1.5rem 4rem" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "0.8rem", marginBottom: "0.3rem" }}>
        <h1 style={{ fontSize: "1.9rem", color: "var(--navy)", fontFamily: "var(--font-playfair), 'Playfair Display', serif", margin: 0 }}>Waitlist Heat Map</h1>
        <a href="/admin" style={{ background: "var(--bg)", border: "1px solid var(--border)", borderRadius: 6, padding: "0.5rem 1rem", fontSize: "0.82rem", fontWeight: 600, color: "var(--navy)", textDecoration: "none", fontFamily: "'DM Sans', sans-serif" }}>&larr; Admin</a>
      </div>
      <p style={{ color: "var(--muted)", marginBottom: "0.3rem" }}>Where players are asking to play, ranked by demand. Admin only.</p>
      <p style={{ color: "var(--muted)", marginBottom: "1.5rem", fontSize: "0.9rem" }}>{totalDemand} total requests across {rows.length} cities. Demand comes from the &ldquo;I Want to Play&rdquo; form. Supply is tables started in that city.</p>

      {rows.length === 0 ? (
        <div style={{ background: "var(--bg)", border: "1px solid var(--border)", borderRadius: 12, padding: "2rem", color: "var(--muted)", textAlign: "center" }}>
          No demand recorded yet. As players use &ldquo;I Want to Play&rdquo; and leave their town, the top cities appear here so you know where to place an ambassador next.
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.7rem" }}>
          {rows.map(([place, count], i) => {
            const cityLower = place.split(",")[0].trim().toLowerCase();
            const sup = supply[cityLower] || 0;
            const pct = max ? Math.round((count / max) * 100) : 0;
            return (
              <div key={place} style={{ background: "white", border: "2px solid var(--border)", borderRadius: 12, padding: "0.9rem 1.1rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "0.5rem" }}>
                  <div style={{ fontSize: "1.1rem", fontWeight: 800, color: "var(--navy)" }}>{i + 1}. {place}</div>
                  <div style={{ fontSize: "0.95rem", color: "var(--muted)" }}>{count} want to play{sup > 0 ? `, ${sup} table${sup !== 1 ? "s" : ""} started` : ", no tables yet"}</div>
                </div>
                <div style={{ height: 14, background: "var(--bg)", borderRadius: 999, overflow: "hidden" }}>
                  <div style={{ width: `${pct}%`, height: "100%", background: sup === 0 ? "var(--pink)" : "var(--green)", borderRadius: 999 }} />
                </div>
              </div>
            );
          })}
        </div>
      )}

      <p style={{ fontSize: "0.85rem", color: "var(--muted)", marginTop: "1.5rem" }}>
        Pink bars are cities with demand but no tables yet, the best places to recruit an ambassador. Green bars already have at least one table. No schema change; this reads existing data.
      </p>
    </main>
  );
}
