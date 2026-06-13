import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Page Not Found",
  description: "This page doesn't exist. Find mahjong players, groups and events near you on Find My Mahj Game.",
  robots: { index: false, follow: false },
};

const TOP_STATES = [
  { name: "Florida", slug: "florida" },
  { name: "New York", slug: "new-york" },
  { name: "California", slug: "california" },
  { name: "Nevada", slug: "nevada" },
  { name: "Texas", slug: "texas" },
  { name: "Arizona", slug: "arizona" },
  { name: "New Jersey", slug: "new-jersey" },
  { name: "Illinois", slug: "illinois" },
];

export default function NotFound() {
  return (
    <>
      <div className="page-hero">
        <div className="eyebrow">404</div>
        <h1>Page Not Found</h1>
        <p>This page doesn&rsquo;t exist. Let&rsquo;s get you back to finding your game.</p>
      </div>

      <div className="page-body" style={{ maxWidth: 680, textAlign: "center" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem", alignItems: "center", marginBottom: "2.5rem" }}>
          <Link href="/" className="btn-cta-primary">Back to Home &rarr;</Link>
          <Link href="/list-my-game" style={{ color: "var(--pink-text)", fontWeight: 600, textDecoration: "none", fontSize: "0.9rem" }}>
            Create a Free Player Listing
          </Link>
        </div>

        <div style={{ background: "var(--bg)", border: "1px solid var(--border)", borderRadius: 16, padding: "1.8rem" }}>
          <p style={{ color: "var(--muted)", marginBottom: "1.2rem", fontSize: "0.9rem", fontWeight: 600 }}>
            Browse players by state:
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", justifyContent: "center" }}>
            {TOP_STATES.map(({ name, slug }) => (
              <Link
                key={slug}
                href={`/states/${slug}`}
                style={{
                  fontSize: "0.82rem",
                  color: "var(--navy)",
                  background: "white",
                  border: "1px solid var(--border)",
                  borderRadius: 6,
                  padding: "0.35rem 0.9rem",
                  textDecoration: "none",
                  fontWeight: 500,
                }}
              >
                {name}
              </Link>
            ))}
          </div>
          <div style={{ marginTop: "1.2rem", paddingTop: "1rem", borderTop: "1px solid var(--border)" }}>
            <Link href="/states" style={{ color: "var(--pink-text)", fontSize: "0.85rem", fontWeight: 600, textDecoration: "none" }}>
              View all 50 states &rarr;
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
