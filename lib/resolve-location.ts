import { createServerClient } from "@/lib/supabase-server";
import { isValidCoords, type Coords } from "@/lib/geo";

export type ResolvedLocation = {
  coords: Coords;
  label: string;
  source: "zip" | "directory" | "geocoder";
};

// Turns what a person typed into coordinates so radius search can run. The directory itself is
// tried before any external call, because 331 of its city and state pairs are already geocoded
// and a local hit is both faster and consistent with what the listings say.
export async function resolveLocation(input: string): Promise<ResolvedLocation | null> {
  const q = String(input || "").trim();
  if (!q) return null;

  if (/^\d{5}$/.test(q)) {
    const viaZip = await fromZip(q);
    if (viaZip) return viaZip;
  }

  const viaDirectory = await fromDirectory(q);
  if (viaDirectory) return viaDirectory;

  return fromGeocoder(q);
}

// Zippopotam returns latitude and longitude alongside the place name. The app used to read the
// name and throw the coordinates away, which is why ZIP search could never do distance.
async function fromZip(zip: string): Promise<ResolvedLocation | null> {
  try {
    const res = await fetch(`https://api.zippopotam.us/us/${zip}`, { cache: "force-cache" });
    if (!res.ok) return null;
    const body = await res.json();
    const place = (body.places || [])[0];
    if (!place) return null;
    const lat = Number(place.latitude);
    const lng = Number(place.longitude);
    if (!isValidCoords(lat, lng)) return null;
    return {
      coords: { lat, lng },
      label: `${place["place name"]}, ${place["state abbreviation"]}`,
      source: "zip",
    };
  } catch {
    return null;
  }
}

function splitCityState(q: string): { city: string; state: string | null } {
  const parts = q.split(",").map((s) => s.trim()).filter(Boolean);
  if (parts.length >= 2 && /^[A-Za-z]{2}$/.test(parts[1])) {
    return { city: parts[0], state: parts[1].toUpperCase() };
  }
  return { city: parts[0] || q, state: null };
}

async function fromDirectory(q: string): Promise<ResolvedLocation | null> {
  const { city, state } = splitCityState(q);
  if (!city) return null;
  const supabase = createServerClient();

  for (const table of ["venue_listings", "event_listings"]) {
    let query = supabase
      .from(table)
      .select("city, state, latitude, longitude")
      .ilike("city", city)
      .not("latitude", "is", null)
      .limit(1);
    if (state) query = query.eq("state", state);
    const { data, error } = await query;
    if (error || !data || data.length === 0) continue;
    const hit = data[0] as { city: string; state: string; latitude: number; longitude: number };
    if (!isValidCoords(hit.latitude, hit.longitude)) continue;
    return {
      coords: { lat: hit.latitude, lng: hit.longitude },
      label: `${hit.city}, ${hit.state}`,
      source: "directory",
    };
  }
  return null;
}

async function fromGeocoder(q: string): Promise<ResolvedLocation | null> {
  const { city, state } = splitCityState(q);
  try {
    const url =
      "https://nominatim.openstreetmap.org/search?format=json&limit=1&countrycodes=us" +
      `&city=${encodeURIComponent(city)}` +
      (state ? `&state=${encodeURIComponent(state)}` : "");
    const res = await fetch(url, {
      headers: { "User-Agent": "FindMyMahjGame/1.0 (https://findmymahjgame.com)" },
      cache: "force-cache",
    });
    if (!res.ok) return null;
    const body = await res.json();
    const hit = Array.isArray(body) ? body[0] : null;
    if (!hit) return null;
    const lat = Number(hit.lat);
    const lng = Number(hit.lon);
    if (!isValidCoords(lat, lng)) return null;
    return { coords: { lat, lng }, label: q, source: "geocoder" };
  } catch {
    return null;
  }
}
