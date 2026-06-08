import { cookies } from "next/headers";
import { createClient } from "@supabase/supabase-js";
import { verifyAdminSessionToken, ADMIN_COOKIE } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

type Row = Record<string, unknown>;

export default async function MetricsPage() {
  const c = await cookies();
  if (!verifyAdminSessionToken(c.get(ADMIN_COOKIE)?.value)) {
    return (
      <main style={{ maxWidth: 480, margin: "0 auto", padding: "4rem 1.5rem", textAlign: "center" }}>
        <p style={{ fontSize: "1.1rem", color: "var(--navy)" }}>Please sign in to view metrics.</p>
        <a href="/admin" style={{ color: "var(--pink)", fontWeight: 700 }}>Go to Admin</a>
      </main>
    );
  }

  const [{ data: tablesData }, { data: seatsData }] = await Promise.all([
    supabase.from("tables").select("*"),
    supabase.from("table_seats").select("table_id, created_at, email, phone"),
  ]);
  const T = (tablesData || []) as Row[];
  const S = (seatsData || []) as Row[];

  const created = T.length;
  const filled = T.filter((t) => t.status === "full").length;
  const played = T.filter((t) => t.played === true).length;
  const recurring = T.filter((t) => t.is_recurring === true).length;

  const tCreated: Record<string, number> = {};
  T.forEach((t) => { tCreated[t.id as string] = new Date(t.created_at as string).getTime(); });
  const seatMax: Record<string, number> = {};
  S.forEach((s) => {
    const id = s.table_id as string;
    const ts = new Date(s.created_at as string).getTime();
    if (!(id in seatMax) || ts > seatMax[id]) seatMax[id] = ts;
  });
  const fillTimes = T.filter((t) => t.status === "full" && seatMax[t.id as string]).map((t) => seatMax[t.id as string] - tCreated[t.id as string]);
  const avgFill = fillTimes.length ? fillTimes.reduce((a, b) => a + b, 0) / fillTimes.length : null;
  const fmtDur = (ms: number | null) => ms == null ? "n/a" : ms < 3600000 ? `${Math.round(ms / 60000)} min` : `${Math.round((ms / 3600000) * 10) / 10} hr`;

  const hostCounts: Record<string, number> = {};
  T.forEach((t) => { const k = String(t.host_email || t.host_phone || "").toLowerCase(); if (k) hostCounts[k] = (hostCounts[k] || 0) + 1; });
  const repeatHosts = Object.values(hostCounts).filter((n) => n > 1).length;

  const contactTables: Record<string, Set<string>> = {};
  S.forEach((s) => { const k = String(s.email || s.phone || "").toLowerCase(); if (!k) return; (contactTables[k] ||= new Set()).add(s.table_id as string); });
  const repeatPlayers = Object.values(contactTables).filter((set) => set.size > 1).length;

  const stat: React.CSSProperties = { background: "white", border: "2px solid var(--border)", borderRadius: 14, padding: "1.2rem", textAlign: "center" };
  const num: React.CSSProperties = { fontSize: "2.2rem", fontWeight: 800, color: "var(--navy)", fontFamily: "var(--font-playfair), 'Playfair Display', serif" };
  const lbl: React.CSSProperties = { fontSize: "0.9rem", color: "var(--muted)", marginTop: "0.3rem" };

  return (
    <main style={{ maxWidth: 760, margin: "0 auto", padding: "2rem 1.5rem 4rem" }}>
      <h1 style={{ fontSize: "1.9rem", color: "var(--navy)", fontFamily: "var(--font-playfair), 'Playfair Display', serif", marginBottom: "0.3rem" }}>Tables Dashboard</h1>
      <p style={{ color: "var(--muted)", marginBottom: "1.5rem" }}>North Star funnel: Created → Filled → Played → Recurring</p>

      <div style={{ display: "flex", gap: "0.6rem", alignItems: "stretch", marginBottom: "2rem", flexWrap: "wrap" }}>
        {[["Created", created], ["Filled", filled], ["Played", played], ["Recurring", recurring]].map(([l, n], i) => (
          <div key={l as string} style={{ ...stat, flex: 1, minWidth: 120, borderColor: i === 0 ? "var(--navy)" : i === 1 ? "var(--pink)" : i === 2 ? "#2ec95c" : "var(--gold)" }}>
            <div style={num}>{n as number}</div><div style={lbl}>{l as string}</div>
          </div>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: "0.8rem" }}>
        <div style={stat}><div style={num}>{created}</div><div style={lbl}>Tables Created</div></div>
        <div style={stat}><div style={num}>{filled}</div><div style={lbl}>Tables Filled</div></div>
        <div style={stat}><div style={num}>{fmtDur(avgFill)}</div><div style={lbl}>Avg Time to Fill</div></div>
        <div style={stat}><div style={num}>{played}</div><div style={lbl}>Games Played</div></div>
        <div style={stat}><div style={num}>{repeatHosts}</div><div style={lbl}>Repeat Hosts</div></div>
        <div style={stat}><div style={num}>{repeatPlayers}</div><div style={lbl}>Repeat Players</div></div>
      </div>

      <p style={{ fontSize: "0.85rem", color: "var(--muted)", marginTop: "1.5rem" }}>
        Games Played and Recurring require <code>supabase/sprint2.sql</code> to be run. Time to Fill is measured as the time from table creation to the 4th seat.
      </p>
    </main>
  );
}
