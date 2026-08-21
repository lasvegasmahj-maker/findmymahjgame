import { NextRequest, NextResponse } from "next/server";
import { STATES } from "@/lib/states-data";
import { rateLimit } from "@/lib/rate-limit";

// Server-side geocoding so client ad-blockers and CORS can't break "Use My
// Location" or ZIP search. Two free, no-key providers: Nominatim (coords -> city)
// and Zippopotam (US ZIP -> city). Browser only ever calls this same-origin route.
const ABBR_BY_NAME: Record<string, string> = Object.fromEntries(
  Object.values(STATES).map((s) => [s.name.toLowerCase(), s.abbr])
);

const UA = "FindMyMahjGame/1.0 (hello@findmymahjgame.com)";

export async function GET(req: NextRequest) {
  if (!(await rateLimit(req, "geocode", 20, 60))) {
    return NextResponse.json({ error: "Please wait a moment and try again." }, { status: 429 });
  }
  const sp = req.nextUrl.searchParams;
  const zip = (sp.get("zip") || "").trim();

  try {
    if (zip) {
      if (!/^\d{5}$/.test(zip)) return NextResponse.json({ error: "bad zip" }, { status: 400 });
      const r = await fetch(`https://api.zippopotam.us/us/${zip}`, { signal: AbortSignal.timeout(8000), cache: "force-cache" });
      if (!r.ok) return NextResponse.json({ city: "", state: "" });
      const g = await r.json();
      const p = (g.places || [])[0] || {};
      return NextResponse.json({ city: p["place name"] || "", state: p["state abbreviation"] || "" });
    }

    const lat = parseFloat(sp.get("lat") || "");
    const lng = parseFloat(sp.get("lng") || "");
    if (!isFinite(lat) || !isFinite(lng)) return NextResponse.json({ error: "bad coords" }, { status: 400 });
    const r = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=jsonv2&zoom=10&addressdetails=1`,
      { headers: { "User-Agent": UA }, signal: AbortSignal.timeout(8000), cache: "no-store" }
    );
    if (!r.ok) return NextResponse.json({ city: "", state: "" });
    const g = await r.json();
    const a = g.address || {};
    const city = a.city || a.town || a.village || a.hamlet || a.county || "";
    const iso = String(a["ISO3166-2-lvl4"] || "");
    const state = iso.includes("-") ? iso.split("-").pop()! : (ABBR_BY_NAME[String(a.state || "").toLowerCase()] || "");
    return NextResponse.json({ city, state });
  } catch {
    return NextResponse.json({ city: "", state: "" });
  }
}
