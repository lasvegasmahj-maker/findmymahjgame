import { cookies } from "next/headers";
import { createClient } from "@supabase/supabase-js";
import { verifyAdminSessionToken, ADMIN_COOKIE } from "@/lib/admin-auth";
import { lazyServerClient } from "@/lib/supabase-server";

export const dynamic = "force-dynamic";

const supabase = lazyServerClient();

type Row = Record<string, unknown>;

export default async function MetricsPage() {
  const c = await cookies();
  if (!verifyAdminSessionToken(c.get(ADMIN_COOKIE)?.value)) {
    return (
      <main style={{ maxWidth: 480, margin: "0 auto", padding: "4rem 1.5rem", textAlign: "center" }}>
        <p style={{ fontSize: "1.1rem", color: "var(--navy)" }}>Please sign in to view metrics.</p>
        <a href="/admin" style={{ color: "var(--pink-text)", fontWeight: 700 }}>Go to Admin</a>
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
  const fillTimes = T.filter((t) => t.filled_at && tCreated[t.id as string]).map((t) => new Date(t.filled_at as string).getTime() - tCreated[t.id as string]);
  const avgFill = fillTimes.length ? fillTimes.reduce((a, b) => a + b, 0) / fillTimes.length : null;
  const fmtDur = (ms: number | null) => ms == null ? "n/a" : ms < 3600000 ? `${Math.round(ms / 60000)} min` : `${Math.round((ms / 3600000) * 10) / 10} hr`;

  const hostCounts: Record<string, number> = {};
  T.forEach((t) => { const k = String(t.host_email || t.host_phone || "").toLowerCase(); if (k) hostCounts[k] = (hostCounts[k] || 0) + 1; });
  const repeatHosts = Object.values(hostCounts).filter((n) => n > 1).length;

  const contactTables: Record<string, Set<string>> = {};
  S.forEach((s) => { const k = String(s.email || s.phone || "").toLowerCase(); if (!k) return; (contactTables[k] ||= new Set()).add(s.table_id as string); });
  const repeatPlayers = Object.values(contactTables).filter((set) => set.size > 1).length;

  // Ambassador attribution: group tables by their referral code (referred_by).
  const byRef: Record<string, { formed: number; filled: number; played: number; recurring: number }> = {};
  T.forEach((t) => {
    const code = String(t.referred_by || "").trim();
    if (!code) return;
    const r = (byRef[code] ||= { formed: 0, filled: 0, played: 0, recurring: 0 });
    r.formed++;
    if (t.status === "full") r.filled++;
    if (t.played === true) r.played++;
    if (t.is_recurring === true) r.recurring++;
  });
  const refRows = Object.entries(byRef).sort((a, b) => b[1].formed - a[1].formed);
  const attributed = T.filter((t) => String(t.referred_by || "").trim()).length;

  const stat: React.CSSProperties = { background: "white", border: "2px solid var(--border)", borderRadius: 14, padding: "1.2rem", textAlign: "center" };
  const num: React.CSSProperties = { fontSize: "2.2rem", fontWeight: 800, color: "var(--navy)", fontFamily: "var(--font-playfair), 'Playfair Display', serif" };
  const lbl: React.CSSProperties = { fontSize: "0.9rem", color: "var(--muted)", marginTop: "0.3rem" };

  return (
    <main style={{ maxWidth: 760, margin: "0 auto", padding: "2rem 1.5rem 4rem" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "0.8rem", marginBottom: "0.3rem" }}>
        <h1 style={{ fontSize: "1.9rem", color: "var(--navy)", fontFamily: "var(--font-playfair), 'Playfair Display', serif", margin: 0 }}>Tables Dashboard</h1>
        <a href="/admin" style={{ background: "var(--bg)", border: "1px solid var(--border)", borderRadius: 6, padding: "0.5rem 1rem", fontSize: "0.82rem", fontWeight: 600, color: "var(--navy)", textDecoration: "none", fontFamily: "'DM Sans', sans-serif" }}>&larr; Admin</a>
      </div>
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

      <h2 style={{ fontSize: "1.4rem", color: "var(--navy)", fontFamily: "var(--font-playfair), 'Playfair Display', serif", margin: "2.5rem 0 0.3rem" }}>Ambassador attribution</h2>
      <p style={{ color: "var(--muted)", marginBottom: "1rem" }}>Tables credited to a referral code, {attributed} of {created} tables attributed. Ambassadors share a link like <code>/start?ref=THEIR-CODE</code>.</p>
      {refRows.length === 0 ? (
        <div style={{ background: "var(--bg)", border: "1px solid var(--border)", borderRadius: 12, padding: "1.5rem", color: "var(--muted)" }}>
          No attributed tables yet. When an ambassador&rsquo;s link is used to start a table, their code shows here.
        </div>
      ) : (
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              {["Referral code", "Formed", "Filled", "Played", "Recurring"].map((h, i) => (
                <th key={h} style={{ textAlign: i === 0 ? "left" : "center", padding: "0.6rem 0.8rem", background: "var(--bg)", fontSize: "0.78rem", fontWeight: 700, color: "var(--navy)", textTransform: "uppercase", letterSpacing: "0.08em" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {refRows.map(([code, r]) => (
              <tr key={code} style={{ borderBottom: "1px solid var(--border)" }}>
                <td style={{ padding: "0.6rem 0.8rem", fontWeight: 700, color: "var(--navy)" }}>{code}</td>
                <td style={{ padding: "0.6rem 0.8rem", textAlign: "center" }}>{r.formed}</td>
                <td style={{ padding: "0.6rem 0.8rem", textAlign: "center" }}>{r.filled}</td>
                <td style={{ padding: "0.6rem 0.8rem", textAlign: "center" }}>{r.played}</td>
                <td style={{ padding: "0.6rem 0.8rem", textAlign: "center" }}>{r.recurring}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <p style={{ fontSize: "0.85rem", color: "var(--muted)", marginTop: "1.5rem" }}>
        Games Played and Recurring require <code>supabase/sprint2.sql</code> to be run. Time to Fill is measured as the time from table creation to the 4th seat. Attribution uses the existing referred_by field, no schema change.
      </p>
    </main>
  );
}
