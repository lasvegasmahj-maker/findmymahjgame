import type { Metadata } from "next";
import Link from "next/link";
import NotifyMe from "@/components/notify-me";
import BrandedEmptyState from "@/components/branded-empty-state";
import { createServerClient } from "@/lib/supabase-server";
import CityAutocomplete from "@/components/city-autocomplete";
import TeacherCard from "@/components/teacher-card";
import { nearMatches } from "@/lib/near-match";
import { LAS_VEGAS_MAHJONG } from "@/lib/featured-listings";

export const metadata: Metadata = {
  title: "Find a Mahjong Teacher Near You",
  description: "Find an American Mahjong teacher near you. Lessons and classes from instructors, city by city.",
  alternates: { canonical: "https://findmymahjgame.com/teachers" },
};

export const revalidate = 300;

// Teachers are sourced from listings whose type indicates instruction.
// Las Vegas guardrail: Nevada is Las Vegas Mahjong's home teaching market,
// so competing Nevada teachers are excluded here on purpose.
const TEACHER_TYPE = /instructor|teacher|lesson|studio|school|class/i;

const field: React.CSSProperties = { minHeight: 54, padding: "0 1rem", border: "2px solid var(--border)", borderRadius: 12, fontSize: "1.1rem", fontFamily: "'DM Sans', sans-serif", color: "var(--navy)", flex: "1 1 200px" };
const goBtn: React.CSSProperties = { minHeight: 54, padding: "0 1.5rem", border: "none", borderRadius: 12, background: "var(--pink)", color: "white", fontWeight: 800, fontSize: "1.1rem", cursor: "pointer", fontFamily: "'DM Sans', sans-serif" };

export default async function TeachersPage({ searchParams }: { searchParams: Promise<{ near?: string }> }) {
  const { near } = await searchParams;
  const supabase = createServerClient();
  const { data } = await supabase.from("venue_listings").select("id, business_name, venue_type, city, state, description, website, instagram, display_email, logo_url, tier, created_at").eq("status", "published").or("state.is.null,state.neq.NV");

  let rows = (data || [])
    .filter((r) => TEACHER_TYPE.test(`${r.venue_type || ""} ${r.description || ""}`));
  // Always feature Las Vegas Mahjong (the founder's own business). The Nevada
  // guardrail above excludes competing NV teachers, not this listing.
  rows = [LAS_VEGAS_MAHJONG, ...rows] as unknown as typeof rows;
  if (near && near.trim()) {
    const n = near.trim().toLowerCase();
    rows = rows.filter((r) => nearMatches(n, r.city, r.state));
  }
  return (
    <main style={{ maxWidth: 1000, margin: "0 auto", padding: "2.5rem 1.2rem 4rem" }}>
      <h1 style={{ fontFamily: "var(--font-playfair), 'Playfair Display', serif", fontSize: "2.2rem", color: "var(--navy)", textAlign: "center", margin: "0 0 0.4rem" }}>Find a mahjong teacher near you</h1>
      <p style={{ fontSize: "1.2rem", color: "var(--muted)", textAlign: "center", lineHeight: 1.5, margin: "0 0 1.8rem" }}>Lessons and classes from American Mahjong instructors. These teachers are listed here, and you contact them directly.</p>

      <form method="get" style={{ display: "flex", gap: "0.6rem", flexWrap: "wrap", justifyContent: "center", maxWidth: 520, margin: "0 auto 1.2rem" }}>
        <label htmlFor="near" style={{ position: "absolute", width: 1, height: 1, overflow: "hidden", clip: "rect(0 0 0 0)" }}>Your city or area</label>
        <CityAutocomplete id="near" name="near" defaultValue={near || ""} placeholder="Your city or state" inputStyle={field} submitOnPick />
        <button type="submit" style={goBtn}>Search</button>
      </form>

      <div style={{ background: "white", border: "2px solid var(--border)", borderRadius: 16, padding: "1.3rem 1.5rem", maxWidth: 680, margin: "0 auto 2.2rem", textAlign: "center" }}>
        <p style={{ fontSize: "0.85rem", fontWeight: 800, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--pink-text)", margin: "0 0 0.4rem" }}>Our promise to teachers</p>
        <p style={{ fontSize: "1.05rem", color: "var(--navy)", lineHeight: 1.6, margin: 0 }}>
          Find My Mahj Game never stands between you and your students. They book on your own site. No booking cuts, ever.
        </p>
      </div>

      {rows.length > 0 ? (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 300px), 1fr))", gap: "1.2rem" }}>
          {rows.map((t) => <TeacherCard key={t.id} t={t} />)}
        </div>
      ) : (
        <BrandedEmptyState
          title={`No teachers listed${near ? ` in ${near}` : ""} yet.`}
          message="Are you a teacher? Get listed so players can find you. Or get the weekly note as teachers are added."
          ctaHref="/get-listed"
          ctaLabel="Get listed"
          secondary={
            <div style={{ display: "flex", flexDirection: "column", gap: "0.8rem", maxWidth: 320, margin: "0 auto" }}>
              <Link href="/newsletter" style={{ minHeight: 52, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 14, background: "white", color: "var(--navy)", border: "2px solid var(--navy)", fontWeight: 800, fontSize: "1.05rem", textDecoration: "none" }}>Get the weekly list</Link>
              <NotifyMe defaultCity={near || ""} />
            </div>
          }
        />
      )}

      {rows.length > 0 && (
        <div style={{ textAlign: "center", marginTop: "2.5rem" }}>
          <Link href="/get-listed" style={{ color: "var(--pink-text)", fontWeight: 800, fontSize: "1.1rem" }}>Are you a teacher? Get listed &rarr;</Link>
        </div>
      )}
    </main>
  );
}
