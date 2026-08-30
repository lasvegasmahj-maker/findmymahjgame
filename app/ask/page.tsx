import type { Metadata } from "next";
import { Suspense } from "react";
import AskClient from "./ask-client";

export const metadata: Metadata = {
  title: "Ask Find My Mahj",
  description:
    "Find where to play, or ask how to play. Search reviewed listings for games, teachers, and events, or get straight answers to American Mahjong rules questions.",
  alternates: { canonical: "https://findmymahjgame.com/ask" },
};

export default function AskPage() {
  return (
    <main style={{ maxWidth: 1000, margin: "0 auto", padding: "2.5rem 1.2rem 4rem" }}>
      <h1 style={{ fontFamily: "var(--font-playfair), 'Playfair Display', serif", fontSize: "2.2rem", color: "var(--navy)", textAlign: "center", margin: "0 0 0.4rem" }}>
        Ask Find My Mahj
      </h1>
      <p style={{ fontSize: "1.15rem", color: "var(--navy)", textAlign: "center", lineHeight: 1.5, margin: "0 0 0.3rem", fontWeight: 600 }}>
        Find where to play, or ask how to play.
      </p>
      <p style={{ fontSize: "0.95rem", color: "var(--muted)", textAlign: "center", lineHeight: 1.5, margin: "0 auto 1.8rem", maxWidth: 620 }}>
        Search our reviewed directory for games, teachers, and events, or get straight answers to
        American Mahjong rules questions.
      </p>
      {/* Suspense lets AskClient read ?q= for prefill while the page stays static. */}
      <Suspense fallback={null}>
        <AskClient />
      </Suspense>
      <p style={{ fontSize: "0.85rem", color: "var(--muted)", textAlign: "center", marginTop: "2.5rem", maxWidth: 560, marginLeft: "auto", marginRight: "auto" }}>
        Ask Find My Mahj can help you find where to play, learn, and connect, and can answer
        American Mahjong rules questions using our reviewed rules knowledge. If a question needs one
        more detail, we ask for it, and if we cannot verify an answer, we say so instead of guessing.
      </p>
    </main>
  );
}
