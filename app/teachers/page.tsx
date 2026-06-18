import type { Metadata } from "next";
import Link from "next/link";
import NotifyMe from "@/components/notify-me";
import { createServerClient } from "@/lib/supabase-server";
import { nearMatches } from "@/lib/near-match";
import { DEMO, demoTeachers } from "@/lib/demo-data";

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

// Las Vegas Mahjong is the founder's flagship teaching business and is always
// featured on this page. It links out to lasvegasmahj.com for booking.
const LAS_VEGAS_MAHJONG = {
  id: "las-vegas-mahjong",
  business_name: "Las Vegas Mahjong",
  venue_type: "Mahjong Instructor",
  city: "Las Vegas",
  state: "NV",
  description: "American Mahjong lessons in Las Vegas, private and group, for every level. Book directly on the Las Vegas Mahjong site.",
  website: "https://lasvegasmahj.com",
  instagram: "lasvegasmahjong",
  display_email: null,
  logo_url: null,
  instructor: "Shauna B.",
  tier: "pro",
  created_at: "2026-01-01T00:00:00Z",
};

const field: React.CSSProperties = { minHeight: 54, padding: "0 1rem", border: "2px solid var(--border)", borderRadius: 12, fontSize: "1.1rem", fontFamily: "'DM Sans', sans-serif", color: "var(--navy)", flex: "1 1 200px" };
const goBtn: React.CSSProperties = { minHeight: 54, padding: "0 1.5rem", border: "none", borderRadius: 12, background: "var(--pink)", color: "white", fontWeight: 800, fontSize: "1.1rem", cursor: "pointer", fontFamily: "'DM Sans', sans-serif" };

export default async function TeachersPage({ searchParams }: { searchParams: Promise<{ near?: string }> }) {
  const { near } = await searchParams;
  const supabase = createServerClient();
  const { data } = await supabase.from("venue_listings").select("id, business_name, venue_type, city, state, description, website, instagram, display_email, logo_url, tier, created_at").eq("status", "published").or("state.is.null,state.neq.NV");

  let rows = (data || [])
    .filter((r) => TEACHER_TYPE.test(`${r.venue_type || ""} ${r.description || ""}`));
  if (DEMO) rows = demoTeachers as unknown as typeof rows;
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
        <input id="near" name="near" defaultValue={near || ""} placeholder="Your city or state" style={field} />
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
          {rows.map((t) => {
            const cardStyle = { display: "block", background: "white", border: "2px solid var(--border)", borderRadius: 16, padding: "1.4rem", textDecoration: "none" } as const;
            const external = t.id === "las-vegas-mahjong" && !!t.website;
            const instructor = (t as { instructor?: string }).instructor;
            const ig = t.instagram ? String(t.instagram).replace(/^@/, "") : "";
            const head = (
              <>
                {t.logo_url && (
                  <img src={t.logo_url} alt={t.business_name || "Teacher"} loading="lazy" style={{ width: "100%", height: 150, objectFit: "contain", background: "var(--bg)", borderRadius: 10, marginBottom: "0.9rem", border: "1px solid var(--border)" }} />
                )}
                <div style={{ fontSize: "1.3rem", fontWeight: 800, color: "var(--navy)", lineHeight: 1.25 }}>{t.business_name || "Teacher"}</div>
                {instructor && <div style={{ fontSize: "1rem", color: "var(--pink-text)", fontWeight: 700, marginTop: "0.2rem" }}>Taught by {instructor}</div>}
                {(t.city || t.state) && <div style={{ fontSize: "1.05rem", color: "var(--muted)", marginTop: "0.3rem" }}>{[t.city, t.state].filter(Boolean).join(", ")}</div>}
              </>
            );
            const desc = t.description ? <div style={{ fontSize: "1rem", color: "var(--muted)", marginTop: "0.5rem", lineHeight: 1.5 }}>{String(t.description).slice(0, 110)}{String(t.description).length > 110 ? "..." : ""}</div> : null;
            // Las Vegas Mahjong: a plain container (not a wrapping link) so the
            // Instagram handle and the website CTA can each be their own link.
            if (external) {
              return (
                <div key={t.id} style={cardStyle}>
                  {head}
                  {ig && <a href={`https://instagram.com/${ig}`} target="_blank" rel="noopener noreferrer" style={{ display: "inline-block", fontSize: "0.95rem", color: "var(--pink-text)", fontWeight: 600, marginTop: "0.4rem", textDecoration: "none" }}>@{ig}</a>}
                  {desc}
                  <a href={t.website!} target="_blank" rel="noopener noreferrer" style={{ display: "block", marginTop: "0.8rem", color: "var(--pink-text)", fontWeight: 800, textDecoration: "none" }}>Visit Las Vegas Mahjong &rarr;</a>
                </div>
              );
            }
            return (
              <Link key={t.id} href={`/teachers/${t.id}`} style={cardStyle}>
                {head}
                {ig && <div style={{ fontSize: "0.95rem", color: "var(--pink-text)", fontWeight: 600, marginTop: "0.4rem" }}>@{ig}</div>}
                {desc}
                <div style={{ marginTop: "0.8rem", color: "var(--pink-text)", fontWeight: 800 }}>View details &rarr;</div>
              </Link>
            );
          })}
        </div>
      ) : (
        <div style={{ background: "var(--bg)", borderRadius: 18, padding: "2.4rem 1.6rem", textAlign: "center", maxWidth: 560, margin: "0 auto" }}>
          <div style={{ fontSize: "1.4rem", fontWeight: 800, color: "var(--navy)", marginBottom: "0.6rem" }}>No teachers listed{near ? ` in ${near}` : ""} yet.</div>
          <p style={{ fontSize: "1.1rem", color: "var(--muted)", lineHeight: 1.6, marginBottom: "1.6rem" }}>Are you a teacher? Get listed so players can find you. Or get the weekly note as teachers are added.</p>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.8rem", maxWidth: 320, margin: "0 auto" }}>
            <Link href="/get-listed" style={{ minHeight: 56, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 14, background: "var(--pink)", color: "white", fontWeight: 800, fontSize: "1.1rem", textDecoration: "none" }}>Get listed</Link>
            <Link href="/newsletter" style={{ minHeight: 56, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 14, background: "white", color: "var(--navy)", border: "2px solid var(--navy)", fontWeight: 800, fontSize: "1.1rem", textDecoration: "none" }}>Get the weekly list</Link>
          </div>
          <div style={{ marginTop: "1.6rem" }}><NotifyMe defaultCity={near || ""} /></div>
        </div>
      )}

      {rows.length > 0 && (
        <div style={{ textAlign: "center", marginTop: "2.5rem" }}>
          <Link href="/get-listed" style={{ color: "var(--pink-text)", fontWeight: 800, fontSize: "1.1rem" }}>Are you a teacher? Get listed &rarr;</Link>
        </div>
      )}
    </main>
  );
}
