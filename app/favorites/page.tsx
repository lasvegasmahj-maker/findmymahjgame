import type { Metadata } from "next";
import FavoritesClient from "./favorites-client";

export const metadata: Metadata = {
  title: "My Favorites",
  description: "The mahjong games, events, and teachers you saved. Stored on your device only, no account needed.",
  alternates: { canonical: "https://findmymahjgame.com/favorites" },
  robots: { index: false },
};

export default function FavoritesPage() {
  return (
    <main style={{ maxWidth: 1000, margin: "0 auto", padding: "2.5rem 1.2rem 4rem" }}>
      <h1 style={{ fontFamily: "var(--font-playfair), 'Playfair Display', serif", fontSize: "2.2rem", color: "var(--navy)", textAlign: "center", margin: "0 0 0.4rem" }}>My favorites</h1>
      <p style={{ fontSize: "1.2rem", color: "var(--muted)", textAlign: "center", lineHeight: 1.5, margin: "0 0 1.8rem" }}>
        Saved on this device only. No account, nothing sent to us.
      </p>
      <FavoritesClient />
    </main>
  );
}
