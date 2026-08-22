// Real mahjong games happen at people's homes, and a host's home is not a public venue. The
// address column already sits outside the public field allowlist in lib/search.ts, so the
// leak risk lives in the free text fields research imports wrote, which is what this governs.
// The rule: nothing narrower than a city may be shown for a private residence game.

export const PRIVATE_LOCATION_FLAG = "private_location_hold";

export type LocationFields = {
  venue?: string | null;
  address?: string | null;
  description?: string | null;
  city?: string | null;
  state?: string | null;
};

const RESIDENCE_RE =
  /\b(private residence|at (the )?(organizer|host)'?s? (home|house|place)|member'?s homes?|members' homes|at my (home|house)|in (my|her|his|their) home|home game|house game)\b/i;

// Street-level detail: a house number with a street name, or a cross-street pair. Either one
// narrows a home to a block, which is the thing this policy exists to prevent.
const STREET_ADDRESS_RE =
  /\b\d{1,6}\s+[NSEW]?\.?\s?[A-Za-z][A-Za-z.'-]*(\s+[A-Za-z][A-Za-z.'-]*){0,3}\s+(st|street|ave|avenue|rd|road|blvd|boulevard|dr|drive|ln|lane|way|ct|court|pl|place|ter|terrace|cir|circle|pkwy|parkway|hwy|highway)\b\.?/i;
const CROSS_STREET_RE =
  /\b(near|at|by|around)\s+[A-Za-z0-9.'-]+(\s+[A-Za-z0-9.'-]+)?\s+(st|street|ave|avenue|rd|road|blvd|boulevard|dr|drive)\b\.?\s*(and|&|\/|\+)\s*[A-Za-z0-9.'-]+(\s+[A-Za-z0-9.'-]+)?\s+(st|street|ave|avenue|rd|road|blvd|boulevard|dr|drive)\b/i;

export type PrivacySignals = {
  isPrivateResidence: boolean;
  hasStreetDetail: boolean;
  fields: string[];
  reasons: string[];
};

export function detectPrivateLocation(r: LocationFields): PrivacySignals {
  const parts: Array<[string, string]> = [
    ["venue", r.venue || ""],
    ["address", r.address || ""],
    ["description", r.description || ""],
  ];
  const fields: string[] = [];
  const reasons: string[] = [];
  let isPrivateResidence = false;
  let hasStreetDetail = false;

  for (const [field, text] of parts) {
    if (!text) continue;
    if (RESIDENCE_RE.test(text)) {
      isPrivateResidence = true;
      if (!fields.includes(field)) fields.push(field);
      reasons.push(`${field} describes a private home`);
    }
    if (STREET_ADDRESS_RE.test(text) || CROSS_STREET_RE.test(text)) {
      hasStreetDetail = true;
      if (!fields.includes(field)) fields.push(field);
      reasons.push(`${field} contains street level detail`);
    }
  }
  return { isPrivateResidence, hasStreetDetail, fields, reasons };
}

// A private game whose street detail sits in a public field is the urgent case: it is live
// on the site right now and narrows a person's home.
export function isUrgentPrivacyExposure(r: LocationFields & { status?: string | null }): boolean {
  const s = detectPrivateLocation(r);
  return Boolean(r.status === "published" && s.isPrivateResidence && s.hasStreetDetail);
}

export const LOCATION_ON_REQUEST_TEXT = "The host shares the location once you join the group";

// The safe public form: city and state, plus a neighborhood only when the source named one,
// and never a street. Callers pass a neighborhood only when a source states it.
export function safePublicVenue(city?: string | null, state?: string | null, neighborhood?: string | null): string {
  const place = [neighborhood, city, state].filter(Boolean).join(", ");
  return place ? `${place} (${LOCATION_ON_REQUEST_TEXT.toLowerCase()})` : LOCATION_ON_REQUEST_TEXT;
}

// Strips street level detail from a free text field without inventing anything. Used when a
// legitimate private game is kept live: the game, day, and city survive; the block does not.
export function redactStreetDetail(text: string | null | undefined): string {
  if (!text) return "";
  return String(text)
    .replace(CROSS_STREET_RE, "")
    .replace(STREET_ADDRESS_RE, "")
    .replace(/\(\s*[;,]\s*/g, "(")
    .replace(/\s*[;,]\s*\)/g, ")")
    .replace(/\(\s*\)/g, "")
    .replace(/\s{2,}/g, " ")
    .replace(/\s+([.,;])/g, "$1")
    .replace(/[·,;]\s*$/, "")
    .trim();
}
