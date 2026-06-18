"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { STATES } from "@/lib/states-data";
import CityAutocomplete from "@/components/city-autocomplete";

// Build city -> slug lookup once at module level
const CITY_TO_SLUG: Record<string, string> = {};
for (const state of Object.values(STATES)) {
  for (const city of state.cities) {
    CITY_TO_SLUG[city.toLowerCase()] = state.slug;
  }
}

function findStateByInput(input: string): string | null {
  const normalized = input.trim().toLowerCase();
  if (!normalized) return null;
  // Exact city match
  if (CITY_TO_SLUG[normalized]) return CITY_TO_SLUG[normalized];
  // Partial city match (user typed "boca" → "boca raton")
  const partial = Object.keys(CITY_TO_SLUG).find((city) => city.startsWith(normalized));
  if (partial) return CITY_TO_SLUG[partial];
  // State name match
  const stateByName = Object.values(STATES).find(
    (s) => s.name.toLowerCase() === normalized || s.abbr.toLowerCase() === normalized
  );
  if (stateByName) return stateByName.slug;
  return null;
}

export default function SearchBox() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [noMatch, setNoMatch] = useState(false);

  const handleSearch = useCallback(async () => {
    const raw = query.trim();
    if (!raw) return;
    // A 5-digit ZIP is resolved to its state server-side, then routed there.
    if (/^\d{5}$/.test(raw)) {
      try {
        const r = await fetch(`/api/geocode?zip=${raw}`);
        const g = await r.json().catch(() => ({}));
        const zipSlug = findStateByInput(g.state || "") || findStateByInput(g.city || "");
        if (zipSlug) { setNoMatch(false); router.push(`/states/${zipSlug}`); return; }
      } catch { /* fall through to no-match */ }
      setNoMatch(true);
      return;
    }
    const slug = findStateByInput(raw);
    if (slug) { setNoMatch(false); router.push(`/states/${slug}`); }
    else setNoMatch(true);
  }, [query, router]);

  const handlePick = useCallback((_label: string, s: { city: string; state: string }) => {
    const slug = findStateByInput(s.state) || findStateByInput(s.city);
    if (slug) { setNoMatch(false); router.push(`/states/${slug}`); }
    else setNoMatch(true);
  }, [router]);

  return (
    <div className="inline-search">
      <div className="inline-search-inner">
        <div style={{ display: "flex", gap: "0.6rem", flexWrap: "wrap", marginBottom: "1rem" }}>
          <CityAutocomplete
            placeholder="City, state, or ZIP code"
            inputStyle={{ minHeight: 54, padding: "0 1.2rem", border: "none", borderRadius: 12, fontSize: "1rem", fontFamily: "var(--font-dm-sans), 'DM Sans', sans-serif", color: "var(--text)", background: "white", outline: "none" }}
            onValueChange={(v) => { setQuery(v); setNoMatch(false); }}
            onPick={handlePick}
            onEnter={handleSearch}
          />
          <button type="button" onClick={handleSearch} style={{ minHeight: 54, padding: "0 1.6rem", border: "none", borderRadius: 12, background: "var(--pink)", color: "white", fontWeight: 700, fontSize: "1rem", cursor: "pointer", fontFamily: "var(--font-dm-sans), 'DM Sans', sans-serif", flexShrink: 0 }}>Find a Game</button>
        </div>
        {noMatch && (
          <p style={{ color: "rgba(255,255,255,0.75)", fontSize: "0.82rem", marginTop: "0.7rem", textAlign: "center" }}>
            No match found. <Link href="/states" style={{ color: "white", fontWeight: 600 }}>Browse all 50 states &rarr;</Link>
          </p>
        )}
        <p style={{ textAlign: "center", marginTop: "0.3rem", marginBottom: 0, color: "rgba(255,255,255,0.8)", fontSize: "0.92rem" }}>
          Can&rsquo;t find a game nearby? <Link href="/list-my-game" style={{ color: "white", fontWeight: 700, textDecoration: "underline" }}>Create a listing</Link>
        </p>
      </div>
    </div>
  );
}
