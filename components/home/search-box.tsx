"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { STATES } from "@/lib/states-data";

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

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter") handleSearch();
    },
    [handleSearch]
  );

  return (
    <div className="inline-search">
      <div className="inline-search-inner">
        <div className="inline-search-box">
          <input
            type="text"
            aria-label="City, state, or ZIP code" placeholder="City, state, or ZIP code"
            value={query}
            onChange={(e) => { setQuery(e.target.value); setNoMatch(false); }}
            onKeyDown={handleKeyDown}
          />
          <button onClick={handleSearch}>Search</button>
        </div>
        {noMatch && (
          <p style={{ color: "rgba(255,255,255,0.75)", fontSize: "0.82rem", marginTop: "0.7rem", textAlign: "center" }}>
            No match found. <Link href="/states" style={{ color: "white", fontWeight: 600 }}>Browse all 50 states &rarr;</Link>
          </p>
        )}
        <div style={{ textAlign: "center", marginTop: "1.2rem", paddingTop: "1.2rem", borderTop: "1px solid rgba(255,255,255,0.1)" }}>
          <p style={{ color: "rgba(255,255,255,0.85)", fontSize: "0.95rem", margin: "0 0 0.7rem" }}>Can&rsquo;t find a game near you?</p>
          <Link href="/list-my-game" className="listing-cta">Create your own listing</Link>
        </div>
      </div>
    </div>
  );
}
