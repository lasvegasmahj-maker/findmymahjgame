import type { Metadata } from "next";

export const metadata: Metadata = { title: "Thanks | Find My Mahj Game", robots: { index: false } };

export default async function PlayedPage({ searchParams }: { searchParams: Promise<{ result?: string }> }) {
  const { result } = await searchParams;
  const msg =
    result === "yes" ? { icon: "", title: "Wonderful!", body: "So glad your table became a real game. Want to keep it going? Start your next week now." }
    : result === "no" ? { icon: "", title: "Thanks for telling us", body: "No worries. When you're ready, start a new table and we'll help you fill it." }
    : { icon: "", title: "Thanks", body: "That link wasn't valid or has expired, but thank you for letting us know." };

  return (
    <main style={{ maxWidth: 520, margin: "0 auto", padding: "4rem 1.2rem", textAlign: "center" }}>
      <div style={{ fontSize: "3rem" }}>{msg.icon}</div>
      <h1 style={{ fontSize: "1.9rem", color: "var(--navy)", fontFamily: "var(--font-playfair), 'Playfair Display', serif" }}>{msg.title}</h1>
      <p style={{ fontSize: "1.2rem", color: "var(--navy)", lineHeight: 1.6 }}>{msg.body}</p>
      {result === "yes" && (
        <a href="/start" style={{ display: "inline-block", marginTop: "1.2rem", minHeight: 56, lineHeight: "56px", padding: "0 2rem", borderRadius: 14, background: "var(--pink)", color: "white", fontWeight: 800, fontSize: "1.15rem", textDecoration: "none" }}>Run it back: same time next week</a>
      )}
      <br />
      <a href="/" style={{ display: "inline-block", marginTop: "1.5rem", fontSize: "1.1rem", color: "var(--pink)", fontWeight: 700, textDecoration: "none" }}>&larr; Back home</a>
    </main>
  );
}
