import type { Metadata } from "next";
import { Suspense } from "react";
import AskClient from "./ask-client";

export const metadata: Metadata = {
  title: "Ask Find My Mahj",
  description:
    "Ask where to play American mahjong in plain English. Answers come only from real listings reviewed by a real person: real games, real teachers, real schedules.",
  alternates: { canonical: "https://findmymahjgame.com/ask" },
};

export default function AskPage() {
  return (
    <main style={{ maxWidth: 1000, margin: "0 auto", padding: "2.5rem 1.2rem 4rem" }}>
      <h1 style={{ fontFamily: "var(--font-playfair), 'Playfair Display', serif", fontSize: "2.2rem", color: "var(--navy)", textAlign: "center", margin: "0 0 0.4rem" }}>
        Ask Find My Mahj
      </h1>
      <p style={{ fontSize: "1.15rem", color: "var(--muted)", textAlign: "center", lineHeight: 1.5, margin: "0 0 1.8rem" }}>
        Ask in plain English. Every answer comes from reviewed listings, never a guess.
      </p>
      {/* Suspense lets AskClient read ?q= for prefill while the page stays static. */}
      <Suspense fallback={null}>
        <AskClient />
      </Suspense>
      <p style={{ fontSize: "0.85rem", color: "var(--muted)", textAlign: "center", marginTop: "2.5rem", maxWidth: 560, marginLeft: "auto", marginRight: "auto" }}>
        Ask searches the same reviewed directory as the Events and Teachers pages. If nothing is
        listed, we say so instead of guessing, and you can ask to be notified when something is added.
      </p>
    </main>
  );
}
