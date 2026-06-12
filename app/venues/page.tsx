import type { Metadata } from "next";
import Link from "next/link";
import { createServerClient } from "@/lib/supabase-server";
import { nearMatches } from "@/lib/near-match";
import { safeHttpUrl } from "@/lib/sanitize";

export const metadata: Metadata = {
  title: "Places to Play Mahjong Near You",
  description: "Find mahjong-friendly places near you: studios, libraries, senior centers, and venues where American Mahjong is played.",
  alternates: { canonical: "https://findmymahjgame.com/venues" },
  robots: { index: false, follow: true },
};

export const revalidate = 300;

const field: React.CSSProperties = { minHeight: 54, padding: "0 1rem", border: "2px solid var(--border)", borderRadius: 12, fontSize: "1.1rem", fontFamily: "'DM Sans', sans-serif", color: "var(--navy)", flex: "1 1 200px" };
const goBtn: React.CSSProperties = { minHeight: 54, padding: "0 1.5rem", border: "none", borderRadius: 12, background: "var(--pink)", color: "white", fontWeight: 800, fontSize: "1.1rem", cursor: "pointer", fontFamily: "'DM Sans', sans-serif" };

export default async function VenuesPage({ searchParams }: { searchParams: Promise<{ near?: string }> }) {
  const { near } = await searchParams;
  const supabase = createServerClient();
  const { data } = await supabase.from("venue_listings").select("id, business_name, venue_type, city, state, address, description, website, instagram, display_email, logo_url, tier, created_at").eq("status", "published").order("created_at", { ascending: false });

  let rows = data || [];
  if (near && near.trim()) {
    const n = near.trim().toLowerCase();
    rows = rows.filter((v) => nearMatches(n, v.city, v.state));
  }

  return (
    <main style={{ maxWidth: 1000, margin: "0 auto", padding: "2.5rem 1.2rem 4rem" }}>
      <h1 style={{ fontFamily: "var(--font-playfair), 'Playfair Display', serif", fontSize: "2.2rem", color: "var(--navy)", textAlign: "center", margin: "0 0 0.4rem" }}>Places to play mahjong near you</h1>
      <p style={{ fontSize: "1.2rem", color: "var(--muted)", textAlign: "center", lineHeight: 1.5, margin: "0 0 1.8rem" }}>Studios, libraries, senior centers, and spots where mahjong happens.</p>

      <form method="get" style={{ display: "flex", gap: "0.6rem", flexWrap: "wrap", justifyContent: "center", maxWidth: 520, margin: "0 auto 2.4rem" }}>
        <label htmlFor="near" style={{ position: "absolute", width: 1, height: 1, overflow: "hidden", clip: "rect(0 0 0 0)" }}>Your city or area</label>
        <input id="near" name="near" defaultValue={near || ""} placeholder="Your city or ZIP" style={field} />
        <button type="submit" style={goBtn}>Search</button>
      </form>

      {rows.length > 0 ? (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 300px), 1fr))", gap: "1.2rem" }}>
          {rows.map((v) => {
            const safeSite = safeHttpUrl(v.website);
            const external = !!safeSite;
            return (
              external ? (<a key={v.id} href={safeSite!} target={external ? "_blank" : undefined} rel={external ? "noopener noreferrer" : undefined} style={{ display: "block", background: "white", border: "2px solid var(--border)", borderRadius: 16, padding: "1.4rem", textDecoration: "none" }}>
                {v.venue_type && <div style={{ display: "inline-block", textTransform: "uppercase", letterSpacing: "0.08em", fontSize: "0.78rem", fontWeight: 800, color: "var(--navy)", marginBottom: "0.5rem" }}>{v.venue_type}</div>}
                <div style={{ fontSize: "1.3rem", fontWeight: 800, color: "var(--navy)", lineHeight: 1.25 }}>{v.business_name || "Venue"}</div>
                {(v.city || v.state) && <div style={{ fontSize: "1.05rem", color: "var(--muted)", marginTop: "0.3rem" }}>{[v.city, v.state].filter(Boolean).join(", ")}</div>}
                {v.description && <div style={{ fontSize: "1rem", color: "var(--muted)", marginTop: "0.5rem", lineHeight: 1.5 }}>{String(v.description).slice(0, 110)}{String(v.description).length > 110 ? "..." : ""}</div>}
                <div style={{ marginTop: "0.8rem", color: "var(--pink)", fontWeight: 800 }}>View details &rarr;</div>
              </a>) : (<div key={v.id} style={{ display: "block", background: "white", border: "2px solid var(--border)", borderRadius: 16, padding: "1.4rem" }}>
                {v.venue_type && <div style={{ display: "inline-block", textTransform: "uppercase", letterSpacing: "0.08em", fontSize: "0.78rem", fontWeight: 800, color: "var(--navy)", marginBottom: "0.5rem" }}>{v.venue_type}</div>}
                <div style={{ fontSize: "1.3rem", fontWeight: 800, color: "var(--navy)", lineHeight: 1.25 }}>{v.business_name || "Venue"}</div>
                {(v.city || v.state) && <div style={{ fontSize: "1.05rem", color: "var(--muted)", marginTop: "0.3rem" }}>{[v.city, v.state].filter(Boolean).join(", ")}</div>}
                {v.description && <div style={{ fontSize: "1rem", color: "var(--muted)", marginTop: "0.5rem", lineHeight: 1.5 }}>{String(v.description).slice(0, 110)}{String(v.description).length > 110 ? "..." : ""}</div>}
              </div>)
            );
          })}
        </div>
      ) : (
        <div style={{ background: "var(--bg)", borderRadius: 18, padding: "2.4rem 1.6rem", textAlign: "center", maxWidth: 560, margin: "0 auto" }}>
          <div style={{ fontSize: "1.4rem", fontWeight: 800, color: "var(--navy)", marginBottom: "0.6rem" }}>No mahjong-friendly places listed{near ? ` in ${near}` : ""} yet.</div>
          <p style={{ fontSize: "1.1rem", color: "var(--muted)", lineHeight: 1.6, marginBottom: "1.6rem" }}>Know a place where mahjong is played, or run one? List it free, or get the weekly note as places are added.</p>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.8rem", maxWidth: 320, margin: "0 auto" }}>
            <Link href="/get-listed" style={{ minHeight: 56, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 14, background: "var(--pink)", color: "white", fontWeight: 800, fontSize: "1.1rem", textDecoration: "none" }}>List a venue free</Link>
            <Link href="/newsletter" style={{ minHeight: 56, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 14, background: "white", color: "var(--navy)", border: "2px solid var(--navy)", fontWeight: 800, fontSize: "1.1rem", textDecoration: "none" }}>Get the weekly list</Link>
          </div>
        </div>
      )}

      {rows.length > 0 && (
        <div style={{ textAlign: "center", marginTop: "2.5rem" }}>
          <Link href="/get-listed" style={{ color: "var(--pink)", fontWeight: 800, fontSize: "1.1rem" }}>Mahjong-friendly business? List it free &rarr;</Link>
        </div>
      )}
    </main>
  );
}
