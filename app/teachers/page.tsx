import type { Metadata } from "next";
import Link from "next/link";
import { createServerClient } from "@/lib/supabase-server";
import { safeHttpUrl } from "@/lib/sanitize";

export const metadata: Metadata = {
  title: "Find a Mahjong Teacher Near You",
  description: "Find an American Mahjong teacher near you. Lessons, classes, and beginner-friendly instructors, city by city.",
  alternates: { canonical: "https://findmymahjgame.com/teachers" },
};

export const revalidate = 300;

// Teachers are sourced from listings whose type indicates instruction.
// Las Vegas guardrail: Nevada is Las Vegas Mahjong's home teaching market,
// so competing Nevada teachers are excluded here on purpose.
const TEACHER_TYPE = /instructor|teacher|lesson|studio|school|class/i;
const isBeginnerFriendly = (s: string) => /beginner|new player|all levels|learn/i.test(s);

const field: React.CSSProperties = { minHeight: 54, padding: "0 1rem", border: "2px solid var(--border)", borderRadius: 12, fontSize: "1.1rem", fontFamily: "'DM Sans', sans-serif", color: "var(--navy)", flex: "1 1 200px" };
const goBtn: React.CSSProperties = { minHeight: 54, padding: "0 1.5rem", border: "none", borderRadius: 12, background: "var(--pink)", color: "white", fontWeight: 800, fontSize: "1.1rem", cursor: "pointer", fontFamily: "'DM Sans', sans-serif" };

export default async function TeachersPage({ searchParams }: { searchParams: Promise<{ near?: string }> }) {
  const { near } = await searchParams;
  const supabase = createServerClient();
  const { data } = await supabase.from("venue_listings").select("id, business_name, venue_type, city, state, description, website, instagram, display_email, logo_url, tier, created_at").eq("status", "published").or("state.is.null,state.neq.NV");

  let rows = (data || []).filter((r) => TEACHER_TYPE.test(`${r.venue_type || ""} ${r.description || ""}`));
  if (near && near.trim()) {
    const n = near.trim().toLowerCase();
    rows = rows.filter((r) => `${r.city || ""} ${r.state || ""}`.toLowerCase().includes(n));
  }

  return (
    <main style={{ maxWidth: 1000, margin: "0 auto", padding: "2.5rem 1.2rem 4rem" }}>
      <h1 style={{ fontFamily: "var(--font-playfair), 'Playfair Display', serif", fontSize: "2.2rem", color: "var(--navy)", textAlign: "center", margin: "0 0 0.4rem" }}>Find a mahjong teacher near you</h1>
      <p style={{ fontSize: "1.2rem", color: "var(--muted)", textAlign: "center", lineHeight: 1.5, margin: "0 0 1.8rem" }}>Lessons and classes, beginners welcome.</p>

      <form method="get" style={{ display: "flex", gap: "0.6rem", flexWrap: "wrap", justifyContent: "center", maxWidth: 520, margin: "0 auto 2.4rem" }}>
        <label htmlFor="near" style={{ position: "absolute", width: 1, height: 1, overflow: "hidden", clip: "rect(0 0 0 0)" }}>Your city or area</label>
        <input id="near" name="near" defaultValue={near || ""} placeholder="Your city or ZIP" style={field} />
        <button type="submit" style={goBtn}>Search</button>
      </form>

      {near && /vegas|nevada|henderson|summerlin|\bnv\b/i.test(near) && (
        <div style={{ background: "var(--bg)", border: "1px solid var(--border)", borderRadius: 14, padding: "1.1rem 1.3rem", maxWidth: 560, margin: "0 auto 1.6rem", textAlign: "center" }}>
          <p style={{ fontSize: "1.05rem", color: "var(--navy)", lineHeight: 1.5, margin: 0 }}>
            Looking for mahjong lessons in Las Vegas? Visit{" "}
            <a href="https://lasvegasmahj.com" target="_blank" rel="noopener noreferrer" style={{ color: "var(--pink)", fontWeight: 800 }}>Las Vegas Mahjong</a>.
          </p>
        </div>
      )}

      <div style={{ background: "white", border: "2px solid var(--border)", borderRadius: 16, padding: "1.3rem 1.5rem", maxWidth: 680, margin: "0 auto 2.2rem", textAlign: "center" }}>
        <p style={{ fontSize: "0.85rem", fontWeight: 800, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--pink)", margin: "0 0 0.4rem" }}>Our promise to teachers</p>
        <p style={{ fontSize: "1.05rem", color: "var(--navy)", lineHeight: 1.6, margin: 0 }}>
          Find My Mahj stands after the lesson, never between you and your student: your students book on your own site, and money never crosses the table. No booking cuts, no pay-for-placement, ever.
        </p>
      </div>

      {rows.length > 0 ? (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 300px), 1fr))", gap: "1.2rem" }}>
          {rows.map((t) => {
            const beginner = isBeginnerFriendly(`${t.venue_type || ""} ${t.description || ""}`);
            const safeSite = safeHttpUrl(t.website);
            const href = safeSite || "/get-listed";
            const external = !!safeSite;
            return (
              <a key={t.id} href={href} target={external ? "_blank" : undefined} rel={external ? "noopener noreferrer" : undefined} style={{ display: "block", background: "white", border: "2px solid var(--border)", borderRadius: 16, padding: "1.4rem", textDecoration: "none" }}>
                <div style={{ fontSize: "1.3rem", fontWeight: 800, color: "var(--navy)", lineHeight: 1.25 }}>{t.business_name || "Teacher"}</div>
                {(t.city || t.state) && <div style={{ fontSize: "1.05rem", color: "var(--muted)", marginTop: "0.3rem" }}>{[t.city, t.state].filter(Boolean).join(", ")}</div>}
                {beginner && <div style={{ display: "inline-block", background: "rgba(46,201,92,0.14)", color: "#1a6e3a", fontWeight: 800, fontSize: "0.85rem", padding: "0.2rem 0.7rem", borderRadius: 50, marginTop: "0.6rem" }}>Beginners welcome</div>}
                {t.description && <div style={{ fontSize: "1rem", color: "var(--muted)", marginTop: "0.5rem", lineHeight: 1.5 }}>{String(t.description).slice(0, 110)}{String(t.description).length > 110 ? "..." : ""}</div>}
                <div style={{ marginTop: "0.8rem", color: "var(--pink)", fontWeight: 800 }}>Visit &rarr;</div>
              </a>
            );
          })}
        </div>
      ) : (
        <div style={{ background: "var(--bg)", borderRadius: 18, padding: "2.4rem 1.6rem", textAlign: "center", maxWidth: 560, margin: "0 auto" }}>
          <div style={{ fontSize: "1.4rem", fontWeight: 800, color: "var(--navy)", marginBottom: "0.6rem" }}>No teachers listed{near ? ` in ${near}` : ""} yet.</div>
          <p style={{ fontSize: "1.1rem", color: "var(--muted)", lineHeight: 1.6, marginBottom: "1.6rem" }}>Are you a teacher? Get listed free so players can find you. Or get the weekly note as teachers are added.</p>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.8rem", maxWidth: 320, margin: "0 auto" }}>
            <Link href="/get-listed" style={{ minHeight: 56, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 14, background: "var(--pink)", color: "white", fontWeight: 800, fontSize: "1.1rem", textDecoration: "none" }}>Get listed free</Link>
            <Link href="/newsletter" style={{ minHeight: 56, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 14, background: "white", color: "var(--navy)", border: "2px solid var(--navy)", fontWeight: 800, fontSize: "1.1rem", textDecoration: "none" }}>Get the weekly list</Link>
          </div>
        </div>
      )}

      {rows.length > 0 && (
        <div style={{ textAlign: "center", marginTop: "2.5rem" }}>
          <Link href="/get-listed" style={{ color: "var(--pink)", fontWeight: 800, fontSize: "1.1rem" }}>Are you a teacher? Get listed free &rarr;</Link>
        </div>
      )}
    </main>
  );
}
