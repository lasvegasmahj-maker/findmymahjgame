"use client";

import { useState, useRef, useCallback, useEffect, useId } from "react";
import { STATES } from "@/lib/states-data";

type Suggestion = { label: string; city: string; state: string; kind: "state" | "city" };

// OSM place types we treat as "a place you can search" (cities, towns,
// neighborhoods); excludes attractions, sports centres, statistical areas, etc.
const PLACE_VALUES = new Set([
  "city", "town", "village", "hamlet", "municipality",
  "suburb", "neighbourhood", "locality", "quarter", "borough", "district",
]);

const STATE_OPTS = Object.values(STATES).map((s) => ({ name: s.name, abbr: s.abbr }));

// Match the typed text against the 50 states so typing a STATE name suggests the
// state itself (Photon only returns towns, e.g. tiny "Nevada, Iowa", not states).
function matchStates(q: string): Suggestion[] {
  const ql = q.toLowerCase();
  return STATE_OPTS
    .filter((s) => s.name.toLowerCase().startsWith(ql) || s.abbr.toLowerCase() === ql)
    .slice(0, 3)
    .map((s) => ({ label: s.name, city: "", state: s.name, kind: "state" as const }));
}

// Free, key-less US place autocomplete via Photon (OpenStreetMap), with our own
// state list merged in. Disambiguates cities that exist in multiple states.
export default function CityAutocomplete({
  id, name, defaultValue = "", placeholder, inputStyle, submitOnPick = false,
  onPick, onValueChange, onEnter,
}: {
  id?: string;
  name?: string;
  defaultValue?: string;
  placeholder?: string;
  inputStyle?: React.CSSProperties;
  submitOnPick?: boolean;
  onPick?: (label: string, s: Suggestion) => void;
  onValueChange?: (v: string) => void;
  onEnter?: () => void;
}) {
  const [value, setValue] = useState(defaultValue);
  const [submitVal, setSubmitVal] = useState(defaultValue);
  const [list, setList] = useState<Suggestion[]>([]);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const boxRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const listboxId = useId();

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const search = useCallback((q: string, baseStates: Suggestion[]) => {
    abortRef.current?.abort();
    const ac = new AbortController();
    abortRef.current = ac;
    fetch(`https://photon.komoot.io/api/?q=${encodeURIComponent(q)}&limit=8&lang=en`, { signal: ac.signal })
      .then((r) => r.json())
      .then((data: { features?: { properties?: Record<string, string> }[] }) => {
        const seen = new Set<string>(baseStates.map((s) => s.label));
        const cities: Suggestion[] = [];
        for (const f of data.features || []) {
          const p = f.properties || {};
          if (p.countrycode !== "US") continue;
          if (!PLACE_VALUES.has(p.osm_value)) continue;
          const city = p.name || "";
          const state = p.state || "";
          if (!city || !state) continue;
          const label = `${city}, ${state}`;
          if (seen.has(label)) continue;
          seen.add(label);
          cities.push({ label, city, state, kind: "city" });
          if (cities.length >= 5) break;
        }
        const merged = [...baseStates, ...cities];
        setList(merged);
        setOpen(merged.length > 0);
        setActive(-1);
      })
      .catch(() => { /* aborted or offline: leave the field usable */ });
  }, []);

  const change = (v: string) => {
    setValue(v);
    setSubmitVal(v);
    onValueChange?.(v);
    if (timerRef.current) clearTimeout(timerRef.current);
    const q = v.trim();
    if (q.length < 2) { setList([]); setOpen(false); return; }
    // Show state matches instantly; append Photon city matches when they arrive.
    const states = matchStates(q);
    setList(states);
    setOpen(states.length > 0);
    setActive(-1);
    if (q.length >= 3) timerRef.current = setTimeout(() => search(q, states), 220);
  };

  const pick = (s: Suggestion) => {
    setValue(s.label);
    // City for towns, state name for state picks; both are what nearMatches() expects.
    setSubmitVal(s.city || s.state);
    onValueChange?.(s.label);
    setOpen(false);
    setList([]);
    onPick?.(s.label, s);
    if (submitOnPick) requestAnimationFrame(() => inputRef.current?.form?.requestSubmit());
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      if (open && active >= 0 && list[active]) { e.preventDefault(); pick(list[active]); return; }
      if (onEnter) { e.preventDefault(); onEnter(); return; }
      return; // allow the default form submit (directory search)
    }
    if (!open) return;
    if (e.key === "ArrowDown") { e.preventDefault(); setActive((a) => Math.min(a + 1, list.length - 1)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setActive((a) => Math.max(a - 1, 0)); }
    else if (e.key === "Escape") setOpen(false);
  };

  return (
    <div ref={boxRef} style={{ position: "relative", flex: "1 1 220px", minWidth: 0 }}>
      {name && <input type="hidden" name={name} value={submitVal} />}
      <input
        ref={inputRef}
        id={id}
        type="text"
        autoComplete="off"
        role="combobox"
        aria-autocomplete="list"
        aria-expanded={open}
        aria-controls={listboxId}
        aria-activedescendant={open && active >= 0 ? `${listboxId}-opt-${active}` : undefined}
        value={value}
        placeholder={placeholder}
        aria-label={placeholder}
        onChange={(e) => change(e.target.value)}
        onKeyDown={onKeyDown}
        onFocus={() => { if (list.length) setOpen(true); }}
        style={{ ...inputStyle, width: "100%", boxSizing: "border-box" }}
      />
      {open && (
        <ul id={listboxId} role="listbox" style={{ position: "absolute", top: "calc(100% + 4px)", left: 0, right: 0, zIndex: 60, listStyle: "none", margin: 0, padding: "0.3rem", background: "white", border: "1px solid var(--border)", borderRadius: 12, boxShadow: "0 12px 32px rgba(26,31,94,0.16)", maxHeight: 300, overflowY: "auto" }}>
          {list.map((s, i) => (
            <li key={`${s.kind}:${s.label}`} id={`${listboxId}-opt-${i}`} role="option" aria-selected={i === active}>
              <button
                type="button"
                tabIndex={-1}
                onMouseDown={(e) => { e.preventDefault(); pick(s); }}
                onMouseEnter={() => setActive(i)}
                style={{ display: "block", width: "100%", textAlign: "left", padding: "0.6rem 0.8rem", border: "none", borderRadius: 8, background: i === active ? "var(--bg)" : "transparent", cursor: "pointer", fontFamily: "var(--font-dm-sans), 'DM Sans', sans-serif", fontSize: "1rem", color: "var(--navy)" }}
              >
                {s.kind === "state"
                  ? <><strong style={{ fontWeight: 700 }}>{s.state}</strong> <span style={{ color: "var(--muted)" }}>State</span></>
                  : <><strong style={{ fontWeight: 700 }}>{s.city}</strong> <span style={{ color: "var(--muted)" }}>{s.state}, United States</span></>}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
