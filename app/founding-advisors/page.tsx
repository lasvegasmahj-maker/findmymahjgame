import type { Metadata } from "next";
import Link from "next/link";
import { createServerClient } from "@/lib/supabase-server";
import TeacherCard from "@/components/teacher-card";
import StatusBadge from "@/components/status-badge";
import { LAS_VEGAS_MAHJONG } from "@/lib/featured-listings";

export const metadata: Metadata = {
  // Absolute: the title already carries the brand, so the root layout template
  // would render the brand twice.
  title: { absolute: "Founding Advisors | Find My Mahj Game" },
  description:
    "Founding Advisors are a small group of respected teachers, organizers, and community leaders, invited by Find My Mahj Game, who help establish the directory during launch.",
  alternates: { canonical: "https://findmymahjgame.com/founding-advisors" },
  openGraph: {
    title: "Founding Advisors | Find My Mahj Game",
    description: "A small group of respected teachers and community leaders, invited to help establish Find My Mahj Game.",
    url: "https://findmymahjgame.com/founding-advisors",
  },
};

export const revalidate = 3600;

type Advisor = {
  id: string;
  business_name: string | null;
  venue_type: string | null;
  city: string | null;
  state: string | null;
  description: string | null;
  website: string | null;
  instagram: string | null;
  display_email: string | null;
};

const liStyle: React.CSSProperties = { fontSize: "1rem", color: "var(--navy)", lineHeight: 1.7, paddingLeft: "1.5rem", position: "relative", marginBottom: "0.3rem" };

export default async function FoundingAdvisorsPage() {
  let dbAdvisors: Advisor[] = [];
  try {
    const supabase = createServerClient();
    const { data } = await supabase
      .from("venue_listings")
      .select("id, business_name, venue_type, city, state, description, website, instagram, display_email")
      .eq("status", "published")
      .eq("founding_advisor", true)
      .order("business_name", { ascending: true });
    dbAdvisors = (data || []) as Advisor[];
  } catch {
    // The founding_advisor column ships with the admin assign/remove build.
    // Until then this page shows Las Vegas Mahjong plus any flagged advisors.
  }
  // Las Vegas Mahjong is a Founding Advisor (the flagship example), shown
  // alongside any advisors flagged in the database.
  const advisors: Advisor[] = [
    LAS_VEGAS_MAHJONG as unknown as Advisor,
    ...dbAdvisors.filter((a) => a.id !== LAS_VEGAS_MAHJONG.id),
  ];

  return (
    <main style={{ maxWidth: 1000, margin: "0 auto", padding: "2.5rem 1.2rem 4rem" }}>
      <div style={{ textAlign: "center", marginBottom: "2.5rem" }}>
        <div style={{ display: "inline-flex", marginBottom: "1rem" }}><StatusBadge type="advisor" /></div>
        <h1 style={{ fontFamily: "var(--font-playfair), 'Playfair Display', serif", fontSize: "2.2rem", color: "var(--navy)", margin: "0 0 0.6rem" }}>Founding Advisors</h1>
        <p style={{ fontSize: "1.15rem", color: "var(--muted)", lineHeight: 1.6, maxWidth: 640, margin: "0 auto" }}>A small group of respected teachers, organizers, and community leaders, personally invited by Find My Mahj Game, who help establish the directory during launch. Founding Advisors are invited, not applied for.</p>
      </div>

      {advisors.length > 0 ? (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 300px), 1fr))", gap: "1.4rem", marginBottom: "3rem" }}>
          {advisors.map((a) => (
            <TeacherCard key={a.id} t={{ ...a, advisor: true }} />
          ))}
        </div>
      ) : (
        <div style={{ background: "var(--bg)", border: "2px dashed var(--border)", borderRadius: 18, padding: "2.6rem 1.6rem", textAlign: "center", maxWidth: 600, margin: "0 auto 3rem" }}>
          <div style={{ fontSize: "1.3rem", fontWeight: 800, color: "var(--navy)", marginBottom: "0.5rem" }}>We&rsquo;re welcoming our first Founding Advisors now.</div>
          <p style={{ fontSize: "1.05rem", color: "var(--muted)", lineHeight: 1.6, margin: 0 }}>This page will feature them as we welcome them. Founding Advisors are personally invited by Find My Mahj Game.</p>
        </div>
      )}

      <div style={{ background: "var(--navy)", borderRadius: 18, padding: "2.2rem", maxWidth: 720, margin: "0 auto" }}>
        <h2 style={{ fontFamily: "var(--font-playfair), 'Playfair Display', serif", fontSize: "1.5rem", color: "white", margin: "0 0 1rem" }}>What Founding Advisors receive</h2>
        <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
          <li style={{ ...liStyle, color: "rgba(255,255,255,0.92)" }}><span style={{ position: "absolute", left: 0, color: "var(--gold)", fontWeight: 800 }}>&#11088;</span>A permanent Founding Advisor badge on your profile</li>
          <li style={{ ...liStyle, color: "rgba(255,255,255,0.92)" }}><span style={{ position: "absolute", left: 0, color: "var(--gold)", fontWeight: 800 }}>&#11088;</span>A featured spot on this Founding Advisors page</li>
          <li style={{ ...liStyle, color: "rgba(255,255,255,0.92)" }}><span style={{ position: "absolute", left: 0, color: "var(--gold)", fontWeight: 800 }}>&#11088;</span>12 months free membership</li>
          <li style={{ ...liStyle, color: "rgba(255,255,255,0.92)" }}><span style={{ position: "absolute", left: 0, color: "var(--gold)", fontWeight: 800 }}>&#11088;</span>Lifetime locked-in Charter pricing after the first year</li>
          <li style={{ ...liStyle, color: "rgba(255,255,255,0.92)" }}><span style={{ position: "absolute", left: 0, color: "var(--gold)", fontWeight: 800 }}>&#11088;</span>Early access to new features</li>
          <li style={{ ...liStyle, color: "rgba(255,255,255,0.92)" }}><span style={{ position: "absolute", left: 0, color: "var(--gold)", fontWeight: 800 }}>&#11088;</span>Input on future platform development</li>
        </ul>
        <p style={{ color: "rgba(255,255,255,0.7)", fontSize: "0.95rem", lineHeight: 1.6, margin: "1.4rem 0 0" }}>The Founding Advisor badge stacks with Verified Teacher, Community Leader, and Ambassador.</p>
      </div>

      <p style={{ textAlign: "center", marginTop: "2.5rem" }}>
        <Link href="/join" style={{ color: "var(--pink-text)", fontWeight: 800, fontSize: "1.05rem", textDecoration: "none" }}>See all the ways to join the directory &rarr;</Link>
      </p>
    </main>
  );
}
