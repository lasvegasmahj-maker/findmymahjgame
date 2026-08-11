export type Coords = { lat: number; lng: number };

export type GeoPrecision = "address" | "postal" | "city";

export const RADIUS_OPTIONS = [5, 10, 25, 50] as const;
export type RadiusMiles = (typeof RADIUS_OPTIONS)[number];

const EARTH_RADIUS_MILES = 3958.7613;

function toRadians(deg: number): number {
  return (deg * Math.PI) / 180;
}

export function distanceMiles(a: Coords, b: Coords): number {
  const dLat = toRadians(b.lat - a.lat);
  const dLng = toRadians(b.lng - a.lng);
  const lat1 = toRadians(a.lat);
  const lat2 = toRadians(b.lat);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.sin(dLng / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2);
  return 2 * EARTH_RADIUS_MILES * Math.asin(Math.sqrt(h));
}

export type BoundingBox = {
  minLat: number;
  maxLat: number;
  minLng: number;
  maxLng: number;
};

// A box is a cheap prefilter the database can index-scan. It over-selects at the corners,
// so callers must still apply distanceMiles to the rows it returns.
export function boundingBox(center: Coords, radiusMiles: number): BoundingBox {
  const latDelta = radiusMiles / 69.0;
  const cosLat = Math.cos(toRadians(center.lat));
  const lngDelta = radiusMiles / (69.0 * Math.max(cosLat, 0.01));
  return {
    minLat: center.lat - latDelta,
    maxLat: center.lat + latDelta,
    minLng: center.lng - lngDelta,
    maxLng: center.lng + lngDelta,
  };
}

export function hasCoords(row: {
  latitude?: number | null;
  longitude?: number | null;
}): boolean {
  return (
    typeof row.latitude === "number" &&
    typeof row.longitude === "number" &&
    Number.isFinite(row.latitude) &&
    Number.isFinite(row.longitude)
  );
}

export function coordsOf(row: {
  latitude?: number | null;
  longitude?: number | null;
}): Coords | null {
  return hasCoords(row)
    ? { lat: row.latitude as number, lng: row.longitude as number }
    : null;
}

// City centroids are accurate to a few miles at best. Reporting "0.4 miles away" from one
// would be a fabricated precision, so distance is rounded to match how it was derived.
export function formatDistance(
  miles: number,
  precision: GeoPrecision | null | undefined
): string {
  if (precision === "city") {
    return `about ${Math.round(miles)} mi`;
  }
  if (miles < 10) return `${miles.toFixed(1)} mi`;
  return `${Math.round(miles)} mi`;
}

export function isValidCoords(lat: unknown, lng: unknown): boolean {
  return (
    typeof lat === "number" &&
    typeof lng === "number" &&
    Number.isFinite(lat) &&
    Number.isFinite(lng) &&
    lat >= -90 &&
    lat <= 90 &&
    lng >= -180 &&
    lng <= 180 &&
    !(lat === 0 && lng === 0)
  );
}
