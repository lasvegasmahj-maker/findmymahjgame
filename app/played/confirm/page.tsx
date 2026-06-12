import type { Metadata } from "next";
import { verifyGameToken } from "@/lib/game-token";

export const metadata: Metadata = { title: "Confirm your game", robots: { index: false } };

// Mail scanners follow GET links, so the email link lands here and the actual
// recording happens only on the form POST below. Scanners do not submit forms.
export default async function PlayedConfirmPage({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const { token } = await searchParams;
  const v = token ? verifyGameToken(token) : null;

  if (!v || !token) {
    return (
      <main style={{ maxWidth: 520, margin: "0 auto", padding: "4rem 1.2rem", textAlign: "center" }}>
        <h1 style={{ fontSize: "1.9rem", color: "var(--navy)", fontFamily: "var(--font-playfair), 'Playfair Display', serif" }}>That link has expired</h1>
        <p style={{ fontSize: "1.15rem", color: "var(--navy)", lineHeight: 1.6 }}>No worries. If your table played, just reply to our email and tell us.</p>
        <a href="/" style={{ display: "inline-block", marginTop: "1.5rem", fontSize: "1.1rem", color: "var(--pink)", fontWeight: 700, textDecoration: "none" }}>&larr; Back home</a>
      </main>
    );
  }

  const yes = v.answer === "yes";
  return (
    <main style={{ maxWidth: 520, margin: "0 auto", padding: "4rem 1.2rem", textAlign: "center" }}>
      <h1 style={{ fontSize: "1.9rem", color: "var(--navy)", fontFamily: "var(--font-playfair), 'Playfair Display', serif" }}>
        {yes ? "Wonderful! Confirm your game" : "Confirm: not yet?"}
      </h1>
      <p style={{ fontSize: "1.15rem", color: "var(--navy)", lineHeight: 1.6 }}>
        {yes
          ? "One tap and it counts. Thanks for letting us know your table became a real game."
          : "One tap to let us know your table has not played yet. You can always tell us later."}
      </p>
      <form method="POST" action="/api/tables/played" style={{ marginTop: "1.6rem" }}>
        <input type="hidden" name="token" value={token} />
        <button type="submit" style={{ minHeight: 60, padding: "0 2.2rem", borderRadius: 14, border: "none", background: yes ? "#1a6e3a" : "var(--navy)", color: "white", fontWeight: 800, fontSize: "1.2rem", cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>
          {yes ? "Yes, we played" : "Not yet"}
        </button>
      </form>
    </main>
  );
}
