import { verifyActionToken } from "@/lib/game-token";
import UnsubscribeClient from "./unsubscribe-client";

export const metadata = { title: "Unsubscribe", robots: { index: false } };

export default async function UnsubscribePage({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const { token } = await searchParams;
  const verified = token ? verifyActionToken(token) : null;
  const valid = Boolean(verified && verified.action === "unsub");
  return (
    <main style={{ maxWidth: 520, margin: "0 auto", padding: "4rem 1.5rem", textAlign: "center" }}>
      <h1 style={{ fontFamily: "var(--font-playfair), 'Playfair Display', serif", fontSize: "1.9rem", color: "var(--navy)", margin: "0 0 0.8rem" }}>
        Unsubscribe
      </h1>
      {valid ? (
        <UnsubscribeClient token={token!} />
      ) : (
        <p style={{ color: "var(--muted)", lineHeight: 1.6 }}>
          This unsubscribe link is invalid or expired. Email hello@findmymahjgame.com and a real
          person will remove you right away.
        </p>
      )}
    </main>
  );
}
