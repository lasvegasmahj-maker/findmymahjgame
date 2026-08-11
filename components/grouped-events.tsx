import { safeHttpUrl } from "@/lib/sanitize";
import { whenLabel } from "@/lib/event-display";
import { attendInfo } from "@/lib/event-level";
import { STATES } from "@/lib/states-data";

// Renders event listings grouped under state (or city) headers, or as a flat
// soonest-first list. Lets retreats/tournaments be found two ways: on a state
// page, and here. Sorted by group name, then soonest date within each group.
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
  price: string | null;
  beginner_friendly: string | null;
  confirmed_active_at: string | null;
  day_of_week?: string[] | null;
  time_of_day?: string | null;
};

const FRESH_MS = 90 * 24 * 60 * 60 * 1000;
const isFresh = (at?: string | null) => !!at && Date.now() - new Date(at).getTime() < FRESH_MS;


const byDate = (a: GroupedRow, b: GroupedRow) => {
  const da = a.event_date ? new Date(a.event_date).getTime() : Infinity;
  const db = b.event_date ? new Date(b.event_date).getTime() : Infinity;
  return da - db;
};

const cardGrid: React.CSSProperties = { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 300px), 1fr))", gap: "1.2rem" };
const groupHeader: React.CSSProperties = { fontFamily: "var(--font-playfair), 'Playfair Display', serif", fontSize: "1.5rem", color: "var(--navy)", margin: "0 0 1rem", paddingBottom: "0.4rem", borderBottom: "2px solid var(--border)" };
const cardStyle: React.CSSProperties = { display: "block", background: "white", border: "2px solid var(--border)", borderRadius: 16, padding: "1.4rem", textDecoration: "none" };

function Card({ e, typeLabel, cta }: { e: GroupedRow; typeLabel: string | ((e: GroupedRow) => string); cta: string }) {
  const safeUrl = safeHttpUrl(e.registration_url);
  const external = !!safeUrl;
  const label = typeof typeLabel === "function" ? typeLabel(e) : typeLabel;
  const inner = (
    <>
      <div style={{ display: "inline-block", textTransform: "uppercase", letterSpacing: "0.08em", fontSize: "0.85rem", fontWeight: 800, color: "var(--pink-text)", marginBottom: "0.5rem" }}>{label}</div>
      <div style={{ fontSize: "1.3rem", fontWeight: 800, color: "var(--navy)", lineHeight: 1.25 }}>{e.event_name || label}</div>
      {whenLabel(e) && <div style={{ fontSize: "1.05rem", color: "var(--navy)", marginTop: "0.4rem" }}>{whenLabel(e)}</div>}
      {(e.venue || e.city) && <div style={{ fontSize: "1.05rem", color: "var(--muted)", marginTop: "0.3rem" }}>{[e.venue, e.city, e.state].filter(Boolean).join(", ")}</div>}
      {e.host && <div style={{ fontSize: "1rem", color: "var(--muted)", marginTop: "0.2rem" }}>Hosted by {e.host}</div>}
      {e.price && <div style={{ fontSize: "1rem", fontWeight: 800, color: e.price.toLowerCase() === "free" ? "#1a6e3a" : "var(--navy)", marginTop: "0.2rem" }}>{e.price}</div>}
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
    <a href={safeUrl!} target="_blank" rel="noopener noreferrer" style={cardStyle}>{inner}</a>
  ) : (
    <div style={cardStyle}>{inner}</div>
  );
}

export default function GroupedEvents({ rows, typeLabel, cta, groupBy = "state" }: { rows: GroupedRow[]; typeLabel: string | ((e: GroupedRow) => string); cta: string; groupBy?: "state" | "city" | null }) {
  if (!groupBy) {
    const items = [...rows].sort(byDate);
    return <div style={cardGrid}>{items.map((e) => <Card key={e.id} e={e} typeLabel={typeLabel} cta={cta} />)}</div>;
  }

  const groups = new Map<string, GroupedRow[]>();
  for (const e of rows) {
    const k = groupBy === "city" ? ((e.city || "").trim() || "Other") : ((e.state || "").toUpperCase() || "ZZ");
    (groups.get(k) || groups.set(k, []).get(k)!).push(e);
  }
  const ordered = [...groups.entries()]
    .map(([k, items]) => ({
      key: k,
      label: groupBy === "city" ? k : (NAME_BY_ABBR[k] || (k === "ZZ" ? "Other locations" : k)),
      items: [...items].sort(byDate),
    }))
    .sort((a, b) => a.label.localeCompare(b.label));

  return (
    <>
      {ordered.map((g) => (
        <section key={g.key} style={{ marginBottom: "2.6rem" }}>
          <h2 style={groupHeader}>{g.label}</h2>
          <div style={cardGrid}>
            {g.items.map((e) => <Card key={e.id} e={e} typeLabel={typeLabel} cta={cta} />)}
          </div>
        </section>
      ))}
    </>
  );
}
