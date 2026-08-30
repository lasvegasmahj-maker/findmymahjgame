import Link from "next/link";

export default function TablesClosed({ what }: { what: string }) {
  return (
    <main style={{ maxWidth: 520, margin: "0 auto", padding: "4rem 1.2rem", textAlign: "center" }}>
      <h1 style={{ fontSize: "1.9rem", color: "var(--navy)", fontFamily: "var(--font-playfair), 'Playfair Display', serif" }}>Not open yet</h1>
      <p style={{ fontSize: "1.15rem", color: "var(--navy)", lineHeight: 1.6 }}>{what} is not open yet. Want to know when it opens? <Link href="/play" style={{ color: "var(--pink-text)", fontWeight: 700 }}>Tell us on the Play page</Link>.</p>
      <Link href="/" style={{ display: "inline-block", marginTop: "1.5rem", fontSize: "1.1rem", color: "var(--pink-text)", fontWeight: 700, textDecoration: "none" }}>&larr; Back home</Link>
    </main>
  );
}
