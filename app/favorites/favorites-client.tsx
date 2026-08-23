"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import FavoriteButton, {
  favoritesSnapshot,
  removeFavorite,
  serverFavoritesSnapshot,
  subscribeFavorites,
} from "@/components/favorite-button";

type Card = {
  id: string;
  kind: "event" | "teacher";
  name: string;
  city: string | null;
  state: string | null;
  when: string | null;
  type: string | null;
  url: string | null;
};

type Status = "loading" | "ready" | "error";

const cardStyle: React.CSSProperties = { position: "relative", background: "white", border: "1px solid var(--border)", borderRadius: 14, padding: "1.1rem 3.7rem 1.1rem 1.2rem" };
const gridStyle: React.CSSProperties = { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 300px), 1fr))", gap: "1rem" };

export default function FavoritesClient() {
  const favorites = useSyncExternalStore(subscribeFavorites, favoritesSnapshot, serverFavoritesSnapshot);
  const [cards, setCards] = useState<Card[]>([]);
  const [status, setStatus] = useState<Status>("loading");

  useEffect(() => {
    let cancelled = false;
    const favs = favoritesSnapshot();
    if (favs.length === 0) {
      queueMicrotask(() => {
        if (!cancelled) setStatus("ready");
      });
      return () => {
        cancelled = true;
      };
    }
    fetch("/api/favorites", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        events: favs.filter((f) => f.kind === "event").map((f) => f.id).slice(0, 50),
        teachers: favs.filter((f) => f.kind === "teacher").map((f) => f.id).slice(0, 50),
      }),
    })
      .then((r) => r.json())
      .then((j) => {
        if (cancelled) return;
        if (!j.ok) throw new Error("lookup failed");
        setCards([...(j.events ?? []), ...(j.teachers ?? [])]);
        setStatus("ready");
      })
      .catch(() => {
        if (!cancelled) setStatus("error");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (status === "loading") {
    return <p style={{ textAlign: "center", color: "var(--muted)", fontSize: "1.05rem" }}>Loading your favorites...</p>;
  }

  if (status === "error") {
    return (
      <div style={{ textAlign: "center", maxWidth: 480, margin: "0 auto" }}>
        <p style={{ color: "var(--navy)", fontSize: "1.05rem", lineHeight: 1.5 }}>
          We could not check your saved listings right now. Your list is still on this device; try again in a minute.
        </p>
        <p style={{ marginTop: "1rem" }}>
          <Link href="/events" style={{ color: "var(--pink-text)", fontWeight: 800 }}>Browse events</Link>
        </p>
      </div>
    );
  }

  if (favorites.length === 0) {
    return (
      <div style={{ textAlign: "center", maxWidth: 480, margin: "0 auto" }}>
        <p style={{ color: "var(--navy)", fontSize: "1.1rem", lineHeight: 1.55 }}>
          You have not saved anything yet. Tap the heart on any listing.
        </p>
        <p style={{ marginTop: "1rem" }}>
          <Link href="/events" style={{ color: "var(--pink-text)", fontWeight: 800, fontSize: "1.05rem" }}>Browse events &rarr;</Link>
        </p>
      </div>
    );
  }

  const byKey = new Map(cards.map((c) => [`${c.kind}:${c.id.toLowerCase()}`, c]));

  return (
    <div style={gridStyle}>
      {favorites.map((f) => {
        const c = byKey.get(`${f.kind}:${f.id.toLowerCase()}`);
        if (!c) {
          return (
            <div key={`${f.kind}:${f.id}`} style={{ ...cardStyle, opacity: 0.55 }}>
              <div style={{ fontSize: "1.15rem", fontWeight: 800, color: "var(--navy)", lineHeight: 1.3 }}>{f.name}</div>
              <div style={{ fontSize: "0.95rem", color: "var(--muted)", marginTop: "0.3rem" }}>No longer listed</div>
              <button
                type="button"
                onClick={() => removeFavorite(f.id, f.kind)}
                style={{ marginTop: "0.55rem", padding: "0.35rem 0.9rem", borderRadius: 50, border: "2px solid var(--border)", background: "white", color: "var(--navy)", fontWeight: 700, fontSize: "0.9rem", cursor: "pointer", fontFamily: "var(--font-dm-sans), 'DM Sans', sans-serif" }}
              >
                Remove
              </button>
            </div>
          );
        }
        return (
          <div key={`${f.kind}:${f.id}`} style={cardStyle}>
            <div style={{ position: "absolute", top: "0.8rem", right: "0.8rem" }}>
              <FavoriteButton id={f.id} kind={f.kind} name={f.name} />
            </div>
            {c.type && (
              <div style={{ textTransform: "uppercase", letterSpacing: "0.08em", fontSize: "0.78rem", fontWeight: 800, color: "var(--pink-text)", marginBottom: "0.35rem" }}>
                {String(c.type).replace(/_/g, " ")}
              </div>
            )}
            <div style={{ fontSize: "1.15rem", fontWeight: 800, color: "var(--navy)", lineHeight: 1.3 }}>{c.name}</div>
            {c.when && <div style={{ fontSize: "0.98rem", color: "var(--navy)", marginTop: "0.3rem" }}>{c.when}</div>}
            <div style={{ fontSize: "0.95rem", color: "var(--muted)", marginTop: "0.25rem" }}>
              {[c.city, c.state].filter(Boolean).join(", ")}
            </div>
            {c.url && (
              <a
                href={c.url}
                target={c.url.startsWith("/") ? undefined : "_blank"}
                rel="noopener noreferrer"
                style={{ display: "inline-block", marginTop: "0.55rem", color: "var(--pink-text)", fontWeight: 700, fontSize: "0.95rem" }}
              >
                {c.kind === "teacher" ? "View teacher" : "Details"}
              </a>
            )}
          </div>
        );
      })}
    </div>
  );
}
