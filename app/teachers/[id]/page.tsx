import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createServerClient } from "@/lib/supabase-server";
import { safeHttpUrl } from "@/lib/sanitize";
import { schemaScriptProps } from "@/lib/schema";

export const revalidate = 600;
export const dynamicParams = true;

const TEACHER_TYPE = /instructor|teacher|lesson|studio|school|class/i;
const isBeginnerFriendly = (s: string) => /beginner|new player|all levels|learn/i.test(s);
const FRESH_MS = 90 * 24 * 60 * 60 * 1000;
const isFresh = (at?: string | null) => !!at && Date.now() - new Date(at).getTime() < FRESH_MS;

type Teacher = {
  id: string;
  business_name: string | null;
  venue_type: string | null;
  city: string | null;
  state: string | null;
  description: string | null;
  website: string | null;
  instagram: string | null;
  display_email: string | null;
  confirmed_active_at: string | null;
};

async function getTeacher(id: string): Promise<Teacher | null> {
  const supabase = createServerClient();
  let { data } = await supabase
    .from("venue_listings")
    .select("id, business_name, venue_type, city, state, description, website, instagram, display_email, confirmed_active_at")
    .eq("id", id)
    .eq("status", "published")
    .maybeSingle();
  if (!data) {
    // confirmed_active_at arrives with the claims-freshness migration; until it
    // is applied that select errors, so retry without it and the profile still renders.
    const r = await supabase
      .from("venue_listings")
      .select("id, business_name, venue_type, city, state, description, website, instagram, display_email")
      .eq("id", id)
      .eq("status", "published")
      .maybeSingle();
    data = r.data ? { ...r.data, confirmed_active_at: null } : null;
  }
  if (!data) return null;
  const t = data as Teacher;
  if (t.state === "NV") return null;
  if (!TEACHER_TYPE.test(`${t.venue_type || ""} ${t.description || ""}`)) return null;
  return t;
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const t = await getTeacher(id);
  if (!t) return { title: "Mahjong Teacher", robots: { index: false } };
  const name = t.business_name || "Mahjong teacher";
  const city = t.city || "your area";
  const title = `${name}: Mahjong Lessons in ${city}`.slice(0, 70);
  return {
    title,
    description: `${name} teaches American Mahjong${t.city ? ` in ${t.city}${t.state ? `, ${t.state}` : ""}` : ""}. Book on their own site.`,
    alternates: { canonical: `https://findmymahjgame.com/teachers/${id}` },
  };
}

export default async function TeacherProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const t = await getTeacher(id);
  if (!t) notFound();

  const name = t.business_name || "Mahjong teacher";
  const location = [t.city, t.state].filter(Boolean).join(", ");
  const beginner = isBeginnerFriendly(`${t.venue_type || ""} ${t.description || ""}`);
  const site = safeHttpUrl(t.website);
  const fresh = isFresh(t.confirmed_active_at);

  const breadcrumb = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Teachers", item: "https://findmymahjgame.com/teachers" },
      { "@type": "ListItem", position: 2, name, item: `https://findmymahjgame.com/teachers/${id}` },
    ],
  };

  const profile = {
    "@context": "https://schema.org",
    "@type": site ? "LocalBusiness" : "Person",
    name,
    ...(t.description ? { description: String(t.description) } : {}),
    ...(location ? { areaServed: { "@type": "Place", name: location } } : {}),
    url: site || `https://findmymahjgame.com/teachers/${id}`,
  };

  return (
    <main style={{ maxWidth: 760, margin: "0 auto", padding: "2.5rem 1.2rem 4rem" }}>
      <script {...schemaScriptProps([breadcrumb, profile])} />

      <nav style={{ fontSize: "0.95rem", color: "var(--muted)", marginBottom: "0.8rem" }}>
        <Link href="/teachers" style={{ color: "var(--pink-text)", fontWeight: 700 }}>Teachers</Link> &rsaquo; {name}
      </nav>

      <h1 style={{ fontFamily: "var(--font-playfair), 'Playfair Display', serif", fontSize: "2.2rem", color: "var(--navy)", margin: "0 0 0.4rem" }}>{name}</h1>
      {location && <p style={{ fontSize: "1.2rem", color: "var(--muted)", lineHeight: 1.5, margin: "0 0 0.8rem" }}>{location}</p>}

      <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", marginBottom: "1.2rem" }}>
        {beginner && (
          <span style={{ display: "inline-block", background: "rgba(46,201,92,0.14)", color: "#1a6e3a", fontWeight: 800, fontSize: "0.9rem", padding: "0.25rem 0.8rem", borderRadius: 50 }}>Beginners welcome</span>
        )}
        {fresh && (
          <span style={{ display: "inline-block", background: "rgba(46,201,92,0.12)", color: "var(--green-dark, #1a6e3a)", fontWeight: 800, fontSize: "0.9rem", padding: "0.25rem 0.8rem", borderRadius: 50 }}>
            Confirmed active {new Date(t.confirmed_active_at!).toLocaleDateString("en-US", { month: "long", year: "numeric", timeZone: "UTC" })}
          </span>
        )}
      </div>

      {t.description && (
        <p style={{ fontSize: "1.1rem", color: "var(--navy)", lineHeight: 1.6, margin: "0 0 1.8rem" }}>{String(t.description)}</p>
      )}

      {(site || t.display_email || t.instagram) && (
        <div style={{ background: "white", border: "2px solid var(--border)", borderRadius: 16, padding: "1.4rem 1.5rem", marginBottom: "1.8rem" }}>
          <p style={{ fontSize: "0.85rem", fontWeight: 800, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--pink-text)", margin: "0 0 0.8rem" }}>Contact directly</p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "1.4rem", alignItems: "center" }}>
            {site && <a href={site} target="_blank" rel="noopener noreferrer" style={{ color: "var(--pink-text)", fontWeight: 800, fontSize: "1.1rem" }}>Visit website &rarr;</a>}
            {t.display_email && <a href={`mailto:${t.display_email}`} style={{ color: "var(--pink-text)", fontWeight: 800, fontSize: "1.1rem" }}>Email</a>}
            {t.instagram && <a href={`https://instagram.com/${t.instagram.replace("@", "")}`} target="_blank" rel="noopener noreferrer" style={{ color: "var(--pink-text)", fontWeight: 800, fontSize: "1.1rem" }}>{t.instagram.startsWith("@") ? t.instagram : `@${t.instagram}`}</a>}
          </div>
        </div>
      )}

      <div style={{ background: "var(--bg)", borderRadius: 16, padding: "1.3rem 1.5rem", marginBottom: "2.2rem" }}>
        <p style={{ fontSize: "1.05rem", color: "var(--navy)", lineHeight: 1.6, margin: 0 }}>You book on their own site. Find My Mahj Game never stands between you and your teacher.</p>
      </div>

      <div style={{ textAlign: "center" }}>
        <Link href="/teachers" style={{ color: "var(--pink-text)", fontWeight: 800, fontSize: "1.1rem" }}>&larr; See all teachers</Link>
      </div>
    </main>
  );
}
