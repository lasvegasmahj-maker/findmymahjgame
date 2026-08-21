import { STATES } from "@/lib/states-data";

const NAME_BY_ABBR: Record<string, string> = Object.fromEntries(
  Object.values(STATES).map((s) => [s.abbr, s.name.toLowerCase()])
);
const ABBR_BY_NAME: Record<string, string> = Object.fromEntries(
  Object.values(STATES).map((s) => [s.name.toLowerCase(), s.abbr])
);

// Public pages query state with .eq("state", abbr), so a listing stored as "Nevada"
// appears on no page at all. Every write path must normalize before inserting.
export function toStateAbbr(input: string | null | undefined): string | null {
  const s = String(input || "").trim();
  if (!s) return null;
  if (/^[A-Za-z]{2}$/.test(s)) return s.toUpperCase();
  return ABBR_BY_NAME[s.toLowerCase()] || null;
}

// "texas" must match rows stored with the 2-letter code, and a 2-letter query
// must match the state code exactly instead of substring-matching city names.
export function nearMatches(near: string, city: string | null, state: string | null): boolean {
  const q = near.trim().toLowerCase();
  if (!q) return true;
  const st = (state || "").trim().toUpperCase();
  const cityLc = (city || "").toLowerCase();
  if (q.length === 2 && /^[a-z]{2}$/.test(q)) return st === q.toUpperCase();
  if (ABBR_BY_NAME[q]) return st === ABBR_BY_NAME[q];
  const fullName = NAME_BY_ABBR[st] || "";
  if (cityLc.includes(q) || fullName.includes(q)) return true;
  // Prefix match on any word in the city name ("santa" -> "Santa Monica").
  return cityLc.split(/[^a-z]+/).some((w) => w.length > 0 && w.startsWith(q));
}
