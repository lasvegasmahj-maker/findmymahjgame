import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Thanks | Find My Mahj Game", robots: { index: false } };

export default async function PlayedPage({ searchParams }: { searchParams: Promise<{ result?: string; token?: string }> }) {
  const { result, token } = await searchParams;
  const msg =
    result === "yes" ? { title: "Wonderful!", body: "So glad your table became a real game. Want to keep it going? Set up next week's table with the same day, time, and place in one tap." }
    : result === "recurring" ? { title: "Your standing game is set!", body: "We marked this as a weekly game. When a seat opens, we'll help you fill it. It is free, and money never crosses the table." }
    : result === "no" ? { title: "Thanks for telling us", body: "No worries. When you're ready, start a new table and we'll help you fill it." }
    : { title: "Thanks", body: "That link wasn't valid or has expired, but thank you for letting us know." };

  return (
    <main style={{ maxWidth: 520, margin: "0 auto", padding: "4rem 1.2rem", textAlign: "center" }}>
      <h1 style={{ fontSize: "1.9rem", color: "var(--navy)", fontFamily: "var(--font-playfair), 'Playfair Display', serif" }}>{msg.title}</h1>
      <p style={{ fontSize: "1.2rem", color: "var(--navy)", lineHeight: 1.6 }}>{msg.body}</p>

      {result === "yes" && token && (
        <form method="POST" action="/api/tables/run-it-back" style={{ marginTop: "1.4rem" }}>
          <input type="hidden" name="token" value={token} />
          <button type="submit" style={{ minHeight: 60, padding: "0 2rem", borderRadius: 14, border: "none", background: "var(--pink)", color: "white", fontWeight: 800, fontSize: "1.15rem", cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>
            Set up next week&rsquo;s game
          </button>
          <div style={{ fontSize: "1rem", color: "var(--muted)", marginTop: "0.7rem", lineHeight: 1.5 }}>
            Same day, time, and place. You get a fresh link to invite your players. It is free, and money never crosses the table.
          </div>
        </form>
      )}

      {result === "yes" && !token && (
        <a href="/start" style={{ display: "inline-block", marginTop: "1.2rem", minHeight: 56, lineHeight: "56px", padding: "0 2rem", borderRadius: 14, background: "var(--pink)", color: "white", fontWeight: 800, fontSize: "1.15rem", textDecoration: "none" }}>Run it back: same time next week</a>
      )}

      <br />
      <Link href="/" style={{ display: "inline-block", marginTop: "1.5rem", fontSize: "1.1rem", color: "var(--pink-text)", fontWeight: 700, textDecoration: "none" }}>&larr; Back home</Link>
    </main>
  );
}
