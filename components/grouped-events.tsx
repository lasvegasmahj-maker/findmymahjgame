import { safeHttpUrl } from "@/lib/sanitize";
import { attendInfo } from "@/lib/event-level";
import { STATES } from "@/lib/states-data";

// Renders event listings grouped under state headers, so retreats/tournaments
// can be found two ways: on a state page, and here grouped by state. Sorted by
// state name, then soonest date within each state.
const NAME_BY_ABBR: Record<string, string> = Object.fromEntries(
  Object.values(STATES).map((s) => [s.abbr, s.name])
);

export type GroupedRow = {
  id: string;
  event_name: string | null;
  event_type: string | null;
  city: string | null;
  state: string | null;
  venue: string | null;
  description: string | null;
  event_date: string | null;
  day_time: string | null;
  registration_url: string | null;
  host: string | null;
  beginner_friendly: string | null;
  confirmed_active_at: string | null;
};

const FRESH_MS = 90 * 24 * 60 * 60 * 1000;
const isFresh = (at?: string | null) => !!at && Date.now() - new Date(at).getTime() < FRESH_MS;

function whenLabel(e: GroupedRow): string {
  if (e.day_time && !e.event_date) return e.day_time;
  if (e.day_time && e.event_date && new Date(e.event_date).getTime() < Date.now()) return e.day_time;
  if (e.event_date) {
    const d = new Date(e.event_date);
    if (!isNaN(d.getTime())) return d.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", timeZone: "UTC" });
  }
  return e.day_time || "";
}

const byDate = (a: GroupedRow, b: GroupedRow) => {
  const da = a.event_date ? new Date(a.event_date).getTime() : Infinity;
  const db = b.event_date ? new Date(b.event_date).getTime() : Infinity;
  return da - db;
};

const cardGrid: React.CSSProperties = { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 300px), 1fr))", gap: "1.2rem" };
const stateHeader: React.CSSProperties = { fontFamily: "var(--font-playfair), 'Playfair Display', serif", fontSize: "1.5rem", color: "var(--navy)", margin: "0 0 1rem", paddingBottom: "0.4rem", borderBottom: "2px solid var(--border)" };
const cardStyle: React.CSSProperties = { display: "block", background: "white", border: "2px solid var(--border)", borderRadius: 16, padding: "1.4rem", textDecoration: "none" };

export default function GroupedEvents({ rows, typeLabel, cta }: { rows: GroupedRow[]; typeLabel: string; cta: string }) {
  const groups = new Map<string, GroupedRow[]>();
  for (const e of rows) {
    const k = (e.state || "").toUpperCase() || "ZZ";
    (groups.get(k) || groups.set(k, []).get(k)!).push(e);
  }
  const ordered = [...groups.entries()]
    .map(([abbr, items]) => ({ abbr, name: NAME_BY_ABBR[abbr] || (abbr === "ZZ" ? "Other locations" : abbr), items: [...items].sort(byDate) }))
    .sort((a, b) => a.name.localeCompare(b.name));

  return (
    <>
      {ordered.map((g) => (
        <section key={g.abbr} style={{ marginBottom: "2.6rem" }}>
          <h2 style={stateHeader}>{g.name}</h2>
          <div style={cardGrid}>
            {g.items.map((e) => {
              const safeUrl = safeHttpUrl(e.registration_url);
              const external = !!safeUrl;
              const inner = (
                <>
                  <div style={{ display: "inline-block", textTransform: "uppercase", letterSpacing: "0.08em", fontSize: "0.85rem", fontWeight: 800, color: "var(--pink-text)", marginBottom: "0.5rem" }}>{typeLabel}</div>
                  <div style={{ fontSize: "1.3rem", fontWeight: 800, color: "var(--navy)", lineHeight: 1.25 }}>{e.event_name || typeLabel}</div>
                  {whenLabel(e) && <div style={{ fontSize: "1.05rem", color: "var(--navy)", marginTop: "0.4rem" }}>{whenLabel(e)}</div>}
                  {(e.venue || e.city) && <div style={{ fontSize: "1.05rem", color: "var(--muted)", marginTop: "0.3rem" }}>{[e.venue, e.city, e.state].filter(Boolean).join(", ")}</div>}
                  {e.host && <div style={{ fontSize: "1rem", color: "var(--muted)", marginTop: "0.2rem" }}>Hosted by {e.host}</div>}
                  <div style={{ marginTop: "0.45rem", display: "flex", gap: "0.4rem", flexWrap: "wrap" }}>
                    {(() => { const a = attendInfo(e.event_type, e.beginner_friendly); return <span style={{ display: "inline-block", fontSize: "0.85rem", fontWeight: 800, color: a.color, background: a.bg, borderRadius: 50, padding: "0.2rem 0.7rem" }}>{a.label}</span>; })()}
                    {isFresh(e.confirmed_active_at) && (
                      <span style={{ display: "inline-block", fontSize: "0.85rem", fontWeight: 800, color: "var(--green-dark, #1a6e3a)", background: "rgba(46,201,92,0.12)", borderRadius: 50, padding: "0.2rem 0.7rem" }}>
                        Confirmed active {new Date(e.confirmed_active_at!).toLocaleDateString("en-US", { month: "long", year: "numeric", timeZone: "UTC" })}
                      </span>
                    )}
                  </div>
                  {e.description && !external && <div style={{ fontSize: "0.98rem", color: "var(--muted)", marginTop: "0.4rem", lineHeight: 1.5 }}>{String(e.description).slice(0, 140)}</div>}
                  {external && <div style={{ marginTop: "0.9rem", color: "var(--pink-text)", fontWeight: 800, fontSize: "1.15rem" }}>{cta} &rarr;</div>}
                </>
              );
              return external ? (
                <a key={e.id} href={safeUrl} target="_blank" rel="noopener noreferrer" style={cardStyle}>{inner}</a>
              ) : (
                <div key={e.id} style={cardStyle}>{inner}</div>
              );
            })}
          </div>
        </section>
      ))}
    </>
  );
}
