import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getProfile } from "@/lib/ambassador-profiles-data";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const p = getProfile(slug);
  return {
    title: p ? `${p.name}, Founding Ambassador in ${p.city} | Find My Mahj Game` : "Ambassador | Find My Mahj Game",
    robots: { index: false, follow: false },
  };
}

const bigBtn: React.CSSProperties = { display: "flex", alignItems: "center", justifyContent: "center", minHeight: 72, borderRadius: 16, fontSize: "1.35rem", fontWeight: 800, textDecoration: "none" };

export default async function AmbassadorProfilePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const p = getProfile(slug);
  if (!p) notFound();

  const initials = p.name.trim().slice(0, 1).toUpperCase();

  return (
    <main style={{ maxWidth: 560, margin: "0 auto", padding: "1.5rem 1.2rem 4rem" }}>
      <a href="/ambassadors" style={{ fontSize: "1.05rem", color: "var(--pink)", fontWeight: 700, textDecoration: "none" }}>&larr; Ambassadors</a>

      <div style={{ background: "rgba(245,200,66,0.18)", border: "2px solid var(--gold)", borderRadius: 12, padding: "0.7rem 1rem", margin: "1rem 0 1.4rem" }}>
        <div style={{ fontSize: "0.95rem", color: "#8a6d00", fontWeight: 700 }}>Preview with sample profile. Not a real person yet.</div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center" }}>
        <div style={{ width: 110, height: 110, borderRadius: 999, background: "var(--navy)", color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "3rem", fontWeight: 800, fontFamily: "var(--font-playfair), 'Playfair Display', serif" }}>{initials}</div>
        <h1 style={{ fontSize: "2rem", color: "var(--navy)", margin: "1rem 0 0.2rem", fontFamily: "var(--font-playfair), 'Playfair Display', serif" }}>{p.name}</h1>
        <div style={{ display: "inline-block", background: "var(--green)", color: "white", fontWeight: 800, fontSize: "0.9rem", padding: "0.3rem 0.9rem", borderRadius: 999 }}>Founding Ambassador</div>
        <div style={{ fontSize: "1.2rem", color: "var(--muted)", marginTop: "0.6rem" }}>{p.city}, {p.state}</div>
      </div>

      <p style={{ fontSize: "1.2rem", color: "var(--navy)", lineHeight: 1.6, margin: "1.6rem 0" }}>{p.bio}</p>

      <div style={{ display: "flex", flexDirection: "column", gap: "1.2rem", marginTop: "0.5rem" }}>
        <div>
          <a href={`/start?ref=${encodeURIComponent(p.refCode)}`} style={{ ...bigBtn, background: "var(--pink)", color: "white" }}>Start a Table</a>
          <div style={{ fontSize: "1rem", color: "var(--muted)", textAlign: "center", marginTop: "0.4rem" }}>Host a game, credited to {p.name}</div>
        </div>
        <div>
          <a href="/play" style={{ ...bigBtn, background: "var(--navy)", color: "white" }}>I Want to Play</a>
          <div style={{ fontSize: "1rem", color: "var(--muted)", textAlign: "center", marginTop: "0.4rem" }}>Find a game near you</div>
        </div>
      </div>

      <p style={{ fontSize: "1rem", color: "var(--muted)", lineHeight: 1.6, marginTop: "1.8rem", textAlign: "center" }}>New groups meet in public places for the first game. We never share home addresses or phone numbers.</p>
    </main>
  );
}
