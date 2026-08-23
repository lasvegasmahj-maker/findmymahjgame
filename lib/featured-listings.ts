// Las Vegas Mahjong is the founder's own teaching business. It renders only
// inside the labelled "From our founder" block (components/teacher-card.tsx),
// never inside ranked results, and Nevada competitors list like everyone else.
// This is a real business, not seed or demo data.
// The founder's business appears only through the labelled FounderSpotlight,
// so organic lists drop any row that points at the founder's own site or
// Instagram (the database holds one such duplicate listing).
export function isFounderListing(r: { website?: string | null; instagram?: string | null }): boolean {
  const ig = String(r.instagram || "").replace(/^@/, "").toLowerCase();
  return String(r.website || "").toLowerCase().includes("lasvegasmahj.com") || ig === "lasvegasmahjong";
}

export const LAS_VEGAS_MAHJONG = {
  id: "las-vegas-mahjong",
  business_name: "Las Vegas Mahjong",
  venue_type: "Mahjong Instructor",
  city: "Las Vegas",
  state: "NV",
  address: null,
  description: "Learn American Mahjong in Las Vegas through private lessons, group classes, open play events, and corporate team-building experiences. Serving beginners, experienced players, social groups, conventions, and businesses throughout the Las Vegas area.",
  website: "https://lasvegasmahj.com",
  instagram: "lasvegasmahjong",
  display_email: "lasvegasmahj@gmail.com",
  logo_url: null,
  instructor: "Shauna Bruckman",
  tier: "pro",
  advisor: true,
  account_id: "founder",
  premium_until: "2099-01-01T00:00:00Z",
  created_at: "2026-01-01T00:00:00Z",
};
