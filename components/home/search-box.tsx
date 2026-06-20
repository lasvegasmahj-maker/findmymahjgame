"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { STATES } from "@/lib/states-data";
import CityAutocomplete from "@/components/city-autocomplete";

// city (lowercase) -> { slug, name } so a city search can pre-select that city on
// the destination state page instead of dumping the player on the whole state.
const CITY_INFO: Record<string, { slug: string; name: string }> = {};
for (const state of Object.values(STATES)) {
  for (const city of state.cities) {
    CITY_INFO[city.toLowerCase()] = { slug: state.slug, name: city };
  }
}

function stateSlug(input: string): string | null {
  const n = input.trim().toLowerCase();
  if (!n) return null;
  if (CITY_INFO[n]) return CITY_INFO[n].slug;
  const partial = Object.keys(CITY_INFO).find((c) => c.startsWith(n));
  if (partial) return CITY_INFO[partial].slug;
  const s = Object.values(STATES).find((st) => st.name.toLowerCase() === n || st.abbr.toLowerCase() === n);
  return s ? s.slug : null;
}

// Resolve free text to a known curated city (canonical casing) when possible.
function knownCity(input: string): string | null {
  const n = input.trim().toLowerCase();
  if (!n) return null;
  if (CITY_INFO[n]) return CITY_INFO[n].name;
  const partial = Object.keys(CITY_INFO).find((c) => c.startsWith(n));
  return partial ? CITY_INFO[partial].name : null;
}

// Land players on the Events tab (where actual games are), pre-filtered to their
// city when we have one, instead of the whole-state Players tab.
function dest(slug: string, city?: string | null): string {
  const qs = new URLSearchParams();
  if (city) qs.set("city", city);
  qs.set("tab", "events");
  return `/states/${slug}?${qs.toString()}`;
}

export default function SearchBox() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [msg, setMsg] = useState("");

  const go = useCallback(async () => {
    const raw = query.trim();
    if (!raw) return;
    setMsg("");
    // A 5-digit ZIP is resolved to its city/state server-side, then routed there.
    if (/^\d{5}$/.test(raw)) {
      try {
        const r = await fetch(`/api/geocode?zip=${raw}`);
        const g = await r.json().catch(() => ({}));
        if (g.city || g.state) {
          const slug = stateSlug(g.state || "") || stateSlug(g.city || "");
          if (slug) { router.push(dest(slug, g.city || null)); return; }
        }
        setMsg("We couldn't find that ZIP code. Try your city or state instead.");
      } catch {
        setMsg("We couldn't look that up right now. Try your city or state instead.");
      }
      return;
    }
    // Numeric but not a valid 5-digit ZIP.
    if (/^\d+$/.test(raw)) { setMsg("Enter a city, a state, or a 5-digit ZIP code."); return; }
    const slug = stateSlug(raw);
    if (slug) { router.push(dest(slug, knownCity(raw))); return; }
    setMsg("no-state");
  }, [query, router]);

  const handlePick = useCallback((_label: string, s: { city: string; state: string }) => {
    setMsg("");
    const slug = stateSlug(s.state) || stateSlug(s.city);
    if (slug) { router.push(dest(slug, knownCity(s.city) || s.city || null)); return; }
    setMsg("no-state");
  }, [router]);

  return (
    <div className="inline-search">
      <div className="inline-search-inner">
        <div className="home-search-row" style={{ display: "flex", gap: "0.6rem", flexWrap: "wrap", marginBottom: "1rem" }}>
          <CityAutocomplete
            placeholder="City, state, or ZIP code"
            inputStyle={{ minHeight: 54, padding: "0 1.2rem", border: "none", borderRadius: 12, fontSize: "1rem", fontFamily: "var(--font-dm-sans), 'DM Sans', sans-serif", color: "var(--text)", background: "white", outline: "none" }}
            onValueChange={(v) => { setQuery(v); setMsg(""); }}
            onPick={handlePick}
            onEnter={go}
          />
          <button type="button" onClick={go} style={{ minHeight: 54, padding: "0 1.6rem", border: "none", borderRadius: 12, background: "var(--pink)", color: "white", fontWeight: 700, fontSize: "1rem", cursor: "pointer", fontFamily: "var(--font-dm-sans), 'DM Sans', sans-serif", flexShrink: 0 }}>Find a Game</button>
        </div>
        {msg === "no-state" ? (
          <p style={{ color: "rgba(255,255,255,0.75)", fontSize: "0.82rem", marginTop: "0.7rem", textAlign: "center" }}>
            No match found. <Link href="/states" style={{ color: "white", fontWeight: 600 }}>Browse all 50 states &rarr;</Link>
          </p>
        ) : msg ? (
          <p role="alert" style={{ color: "rgba(255,255,255,0.9)", fontSize: "0.82rem", marginTop: "0.7rem", textAlign: "center" }}>{msg}</p>
        ) : null}
      </div>
    </div>
  );
}
