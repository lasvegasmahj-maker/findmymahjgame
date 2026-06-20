import type { Metadata } from "next";
import Link from "next/link";
import NotifyMe from "@/components/notify-me";
import BrandedEmptyState from "@/components/branded-empty-state";
import { createServerClient } from "@/lib/supabase-server";
import CityAutocomplete from "@/components/city-autocomplete";
import { nearMatches } from "@/lib/near-match";
import { safeHttpUrl } from "@/lib/sanitize";
import { attendInfo } from "@/lib/event-level";
import { STATES } from "@/lib/states-data";
import { DEMO, demoEvents } from "@/lib/demo-data";

export const metadata: Metadata = {
  title: "Mahjong Events and Open Plays Near You",
  description: "Find American Mahjong open plays, games, leagues, tournaments, and events near you. Where can you play this week?",
  alternates: { canonical: "https://findmymahjgame.com/events" },
};

export const revalidate = 300;

const NAME_BY_ABBR: Record<string, string> = {};
for (const s of Object.values(STATES)) NAME_BY_ABBR[s.abbr] = s.name;

const TYPE_RANK: Record<string, number> = {
  openplay: 1, recurring: 2, league: 3, tournament: 4, retreat: 5, cruise: 6, special: 7, event: 8,
};
const norm = (t: string | null | undefined) => (t || "").toLowerCase().replace(/[^a-z]/g, "");
function rank(t: string | null | undefined): number {
  return TYPE_RANK[norm(t)] ?? 50;
}
// Discovery filters: each chip narrows the public listings to one kind of
// Mahjong activity. "open_play" folds in recurring weekly games; "event" covers
// the destination/special formats.
const TYPE_GROUPS: Record<string, (t: string | null | undefined) => boolean> = {
  open_play: (t) => ["openplay", "recurring"].includes(norm(t)),
  tournament: (t) => norm(t) === "tournament",
  league: (t) => norm(t) === "league",
  event: (t) => ["event", "special", "retreat", "cruise", "conference", "festival", "fundraiser", "social"].includes(norm(t)),
};
const CHIPS: [string, string][] = [
  ["all", "All"], ["open_play", "Open plays"], ["tournament", "Tournaments"],
  ["league", "Leagues"], ["event", "Events & retreats"],
];
// Empty-state copy adapts to the active filter so a "Tournaments" view talks
// about tournaments (and offers to list one), not casual games.
const EMPTY_META: Record<string, { label: string; cta?: string; href?: string; phrase?: string; organizer?: boolean }> = {
  all: { label: "public games" },
  open_play: { label: "open plays" },
  tournament: { label: "tournaments", cta: "List a tournament", href: "/get-listed?type=Tournament", phrase: "a Mahjong tournament", organizer: true },
  league: { label: "leagues", cta: "List a league", href: "/get-listed?type=League", phrase: "a Mahjong league", organizer: true },
  event: { label: "events or retreats", cta: "List an event or retreat", href: "/get-listed?type=Retreat", phrase: "a Mahjong event or retreat", organizer: true },
};
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
const chipBase: React.CSSProperties = { display: "inline-block", padding: "0.5rem 1.1rem", borderRadius: 50, fontSize: "1rem", fontWeight: 800, textDecoration: "none", border: "2px solid var(--border)" };

export default async function EventsPage({ searchParams }: { searchParams: Promise<{ near?: string; type?: string; sort?: string }> }) {
  const { near, type, sort } = await searchParams;
  const activeType = (type || "all").toLowerCase();
  const activeSort = (sort || "state").toLowerCase();
  const em = EMPTY_META[activeType] || EMPTY_META.all;
  const supabase = createServerClient();
  const todayISO = new Date().toISOString().slice(0, 10);
  let { data } = await supabase.from("event_listings").select("id, event_name, event_type, city, state, venue, description, event_date, end_date, price, registration_url, tier, created_at, day_time, frequency, beginner_friendly, confirmed_active_at, host").eq("status", "published").or(`event_date.is.null,event_date.gte.${todayISO},event_type.in.(open_play,openplay,recurring)`).order("event_date", { ascending: true });
  if (!data) {
    const fallback = await supabase.from("event_listings").select("id, event_name, event_type, city, state, venue, description, event_date, end_date, price, registration_url, tier, created_at, day_time, frequency, beginner_friendly, host").eq("status", "published").or(`event_date.is.null,event_date.gte.${todayISO},event_type.in.(open_play,openplay,recurring)`).order("event_date", { ascending: true });
    data = (fallback.data || []).map((r) => ({ ...r, confirmed_active_at: null }));
  }
  if (DEMO) data = demoEvents as unknown as typeof data;

  let rows = data || [];
  if (near && near.trim()) {
    const n = near.trim().toLowerCase();
    rows = rows.filter((e) => nearMatches(n, e.city, e.state));
  }
  const typeFilter = TYPE_GROUPS[activeType];
  if (typeFilter) rows = rows.filter((e) => typeFilter(e.event_type));

  const FRESH_MS = 90 * 24 * 60 * 60 * 1000;
  const isFresh = (at?: string | null) => !!at && Date.now() - new Date(at).getTime() < FRESH_MS;
  const byDate = (a: { event_date?: string | null }, b: { event_date?: string | null }) => {
    const da = a.event_date ? new Date(a.event_date).getTime() : Infinity;
    const db = b.event_date ? new Date(b.event_date).getTime() : Infinity;
    return da - db;
  };
  if (activeSort === "date") {
    rows = [...rows].sort(byDate);
  } else if (activeSort === "state") {
    rows = [...rows].sort((a, b) => (a.state || "").localeCompare(b.state || "") || byDate(a, b));
  } else if (activeSort === "city") {
    rows = [...rows].sort((a, b) => (a.city || "").localeCompare(b.city || "") || byDate(a, b));
  } else {
    // "Featured" sort, preserved for the future paid (Verified Community Leader)
    // tier. Reachable now via ?sort=featured; re-add it to SORTS below to surface
    // it in the UI once paid listings exist. Today it ranks by event type, then
    // freshness; when the paid tier ships, sort verified/paid listings first here.
    rows = [...rows].sort((a, b) => {
      const byType = rank(a.event_type) - rank(b.event_type);
      if (byType !== 0) return byType;
      return (isFresh(b.confirmed_active_at) ? 1 : 0) - (isFresh(a.confirmed_active_at) ? 1 : 0);
    });
  }

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
      name: e.event_name || "Mahjong",
      startDate: e.event_date,
      eventStatus: "https://schema.org/EventScheduled",
      eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
      location: { "@type": "Place", name: e.venue || [e.city, e.state].filter(Boolean).join(", ") || "See listing", address: [e.city, e.state].filter(Boolean).join(", ") || "United States" },
      ...(safeHttpUrl(e.registration_url) ? { url: safeHttpUrl(e.registration_url)! } : {}),
    }));

  const chipHref = (k: string) => {
    const qs = new URLSearchParams();
    if (near && near.trim()) qs.set("near", near.trim());
    if (k !== "all") qs.set("type", k);
    if (activeSort !== "state") qs.set("sort", activeSort);
    const s = qs.toString();
    return `/events${s ? `?${s}` : ""}`;
  };
  const sortHref = (k: string) => {
    const qs = new URLSearchParams();
    if (near && near.trim()) qs.set("near", near.trim());
    if (activeType !== "all") qs.set("type", activeType);
    if (k !== "state") qs.set("sort", k);
    const s = qs.toString();
    return `/events${s ? `?${s}` : ""}`;
  };
  const SORTS: [string, string][] = [
    ["state", "By state"],
    ["date", "By date"],
    // ["featured", "Featured"], // re-enable when the paid Verified Community Leader tier is live (sort logic above)
  ];

  const renderCard = (e: typeof rows[number]) => {
    const safeUrl = safeHttpUrl(e.registration_url);
    const external = !!safeUrl;
    const card = (
      <>
        {e.event_type && <div style={{ display: "inline-block", textTransform: "uppercase", letterSpacing: "0.08em", fontSize: "0.85rem", fontWeight: 800, color: "var(--pink-text)", marginBottom: "0.5rem" }}>{String(e.event_type).replace(/_/g, " ")}</div>}
        <div style={{ fontSize: "1.3rem", fontWeight: 800, color: "var(--navy)", lineHeight: 1.25 }}>{e.event_name || "Mahjong"}</div>
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
        {external && <div style={{ marginTop: "0.9rem", color: "var(--pink-text)", fontWeight: 800, fontSize: "1.15rem" }}>Sign up &rarr;</div>}
      </>
    );
    const cardStyle = { display: "block", background: "white", border: "2px solid var(--border)", borderRadius: 16, padding: "1.4rem", textDecoration: "none" } as const;
    return external ? (
      <a key={e.id} href={safeUrl} target="_blank" rel="noopener noreferrer" style={cardStyle}>{card}</a>
    ) : (
      <div key={e.id} style={cardStyle}>{card}</div>
    );
  };

  const stateGroups = Object.entries(
    rows.reduce<Record<string, typeof rows>>((acc, e) => {
      const k = (e.state || "").toUpperCase() || "ZZ";
      (acc[k] ||= []).push(e);
      return acc;
    }, {})
  ).sort((a, b) => a[0].localeCompare(b[0]));
  const gridStyle: React.CSSProperties = { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 300px), 1fr))", gap: "1.2rem" };

  return (
    <main style={{ maxWidth: 1000, margin: "0 auto", padding: "2.5rem 1.2rem 4rem" }}>
      {eventSchema.length > 0 && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(eventSchema) }} />}
      <h1 style={{ fontFamily: "var(--font-playfair), 'Playfair Display', serif", fontSize: "2.2rem", color: "var(--navy)", textAlign: "center", margin: "0 0 0.4rem" }}>Where can I play this week?</h1>
      <p style={{ fontSize: "1.2rem", color: "var(--muted)", textAlign: "center", lineHeight: 1.5, margin: "0 0 1.8rem" }}>American Mahjong open plays, leagues, tournaments, and events near you.</p>

      <form method="get" style={{ display: "flex", gap: "0.6rem", flexWrap: "wrap", justifyContent: "center", maxWidth: 520, margin: "0 auto 1.2rem" }}>
        <label htmlFor="near" style={{ position: "absolute", width: 1, height: 1, overflow: "hidden", clip: "rect(0 0 0 0)" }}>Your city or area</label>
        <CityAutocomplete id="near" name="near" defaultValue={near || ""} placeholder="Your city or state" inputStyle={field} submitOnPick />
        {activeType !== "all" && <input type="hidden" name="type" value={activeType} />}
        {activeSort !== "state" && <input type="hidden" name="sort" value={activeSort} />}
        <button type="submit" style={goBtn}>Search</button>
      </form>

      <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", justifyContent: "center", margin: "0 auto 1rem" }}>
        {CHIPS.map(([k, label]) => {
          const active = activeType === k || (k === "all" && !TYPE_GROUPS[activeType]);
          return (
            <Link key={k} href={chipHref(k)} style={{ ...chipBase, background: active ? "var(--navy)" : "white", color: active ? "white" : "var(--navy)", borderColor: active ? "var(--navy)" : "var(--border)" }}>{label}</Link>
          );
        })}
      </div>

      <div style={{ display: "flex", gap: "0.9rem", flexWrap: "wrap", justifyContent: "center", alignItems: "center", margin: "0 auto 2.2rem" }}>
        <span style={{ fontSize: "0.9rem", color: "var(--muted)", fontWeight: 700 }}>Sort:</span>
        {SORTS.map(([k, label]) => (
          <Link key={k} href={sortHref(k)} style={{ fontSize: "0.95rem", fontWeight: 700, textDecoration: "none", color: activeSort === k ? "var(--pink-text)" : "var(--muted)", borderBottom: activeSort === k ? "2px solid var(--pink)" : "2px solid transparent", paddingBottom: "0.1rem" }}>{label}</Link>
        ))}
      </div>

      {rows.length > 0 ? (
        activeSort === "state" ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "2.5rem" }}>
            {stateGroups.map(([abbr, evs]) => (
              <section key={abbr}>
                <h2 style={{ fontFamily: "var(--font-playfair), 'Playfair Display', serif", fontSize: "1.6rem", color: "var(--navy)", margin: "0 0 1rem", paddingBottom: "0.4rem", borderBottom: "2px solid var(--border)" }}>{NAME_BY_ABBR[abbr] || (abbr === "ZZ" ? "Other locations" : abbr)}</h2>
                <div style={gridStyle}>
                  {evs.map(renderCard)}
                </div>
              </section>
            ))}
          </div>
        ) : (
          <div style={gridStyle}>
            {rows.map(renderCard)}
          </div>
        )
      ) : (
        <BrandedEmptyState
          title={`No ${em.label} listed${near ? ` in ${near}` : ""} yet.`}
          message={em.organizer ? `Be the first. If you run ${em.phrase}, list it here so players can find it.` : "Be the first. You can list a game, start your own table, or get the weekly note when games open near you."}
          ctaHref={em.organizer ? em.href! : "/get-listed"}
          ctaLabel={em.organizer ? em.cta! : "List your game"}
          secondary={
            <div style={{ display: "flex", flexDirection: "column", gap: "0.8rem", maxWidth: 320, margin: "0 auto" }}>
              {!em.organizer && <Link href="/start" style={{ minHeight: 52, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 14, background: "var(--navy)", color: "white", fontWeight: 800, fontSize: "1.05rem", textDecoration: "none" }}>Start a table</Link>}
              <Link href="/newsletter" style={{ minHeight: 52, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 14, background: "white", color: "var(--navy)", border: "2px solid var(--navy)", fontWeight: 800, fontSize: "1.05rem", textDecoration: "none" }}>Get the weekly list</Link>
              <NotifyMe defaultCity={near || ""} />
            </div>
          }
        />
      )}

      {rows.length > 0 && (
        <div style={{ textAlign: "center", marginTop: "2.5rem" }}>
          <Link href={em.href || "/get-listed"} style={{ color: "var(--pink-text)", fontWeight: 800, fontSize: "1.1rem" }}>{em.organizer ? `Run ${em.phrase}? List it here` : "Run a game? List it here"} &rarr;</Link>
        </div>
      )}
    </main>
  );
}
