"use client";

import { useSyncExternalStore } from "react";

export type Favorite = {
  id: string;
  kind: "event" | "teacher";
  name: string;
  savedAt: string;
};

const STORAGE_KEY = "fmg_favorites";
const CHANGE_EVENT = "fmg-favorites-change";
const EMPTY: Favorite[] = [];

let cachedRaw: string | null = null;
let cachedList: Favorite[] = EMPTY;

function parseList(raw: string | null): Favorite[] {
  if (!raw) return EMPTY;
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return EMPTY;
    return parsed.filter(
      (f): f is Favorite =>
        !!f &&
        typeof f.id === "string" &&
        (f.kind === "event" || f.kind === "teacher") &&
        typeof f.name === "string"
    );
  } catch {
    return EMPTY;
  }
}

// useSyncExternalStore needs a stable snapshot reference while storage is unchanged,
// so the parse is cached against the raw string instead of re-parsing every render.
export function favoritesSnapshot(): Favorite[] {
  if (typeof window === "undefined") return EMPTY;
  let raw: string | null = null;
  try {
    raw = window.localStorage.getItem(STORAGE_KEY);
  } catch {
    raw = null;
  }
  if (raw !== cachedRaw) {
    cachedRaw = raw;
    cachedList = parseList(raw);
  }
  return cachedList;
}

// The server must always render the unsaved state; the real list is read only on the client.
export function serverFavoritesSnapshot(): Favorite[] {
  return EMPTY;
}

export function subscribeFavorites(onChange: () => void): () => void {
  window.addEventListener("storage", onChange);
  window.addEventListener(CHANGE_EVENT, onChange);
  return () => {
    window.removeEventListener("storage", onChange);
    window.removeEventListener(CHANGE_EVENT, onChange);
  };
}

function writeFavorites(list: Favorite[]): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  } catch {
    // localStorage can be unavailable (private mode, storage full); saving is best effort
  }
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

export function removeFavorite(id: string, kind: Favorite["kind"]): void {
  writeFavorites(favoritesSnapshot().filter((f) => !(f.id === id && f.kind === kind)));
}

export default function FavoriteButton({
  id,
  kind,
  name,
}: {
  id: string;
  kind: "event" | "teacher";
  name: string;
}) {
  const favorites = useSyncExternalStore(subscribeFavorites, favoritesSnapshot, serverFavoritesSnapshot);
  const saved = favorites.some((f) => f.id === id && f.kind === kind);

  function toggle(e: React.MouseEvent<HTMLButtonElement>) {
    e.preventDefault();
    e.stopPropagation();
    const list = favoritesSnapshot();
    if (list.some((f) => f.id === id && f.kind === kind)) {
      writeFavorites(list.filter((f) => !(f.id === id && f.kind === kind)));
    } else {
      writeFavorites([...list, { id, kind, name, savedAt: new Date().toISOString() }]);
    }
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-pressed={saved}
      aria-label={saved ? "Saved" : "Save to favorites"}
      title={saved ? "Saved" : "Save to favorites"}
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        width: 44,
        height: 44,
        padding: 0,
        border: saved ? "2px solid var(--pink)" : "2px solid var(--border)",
        borderRadius: "50%",
        background: "white",
        cursor: "pointer",
        lineHeight: 0,
      }}
    >
      <svg
        viewBox="0 0 24 24"
        width={16}
        height={16}
        fill={saved ? "var(--pink)" : "none"}
        stroke={saved ? "var(--pink)" : "var(--navy)"}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
        focusable="false"
      >
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
      </svg>
    </button>
  );
}
