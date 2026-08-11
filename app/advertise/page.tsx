import type { Metadata } from "next";
import { createServerClient } from "@/lib/supabase-server";
import { buildAdvertisePageSchema, schemaScriptProps } from "@/lib/schema";
import AdvertiseContact from "./advertise-contact";

export const metadata: Metadata = {
  title: "Advertise on Find My Mahj Game | Reach Mahjong Players Nationwide",
  description:
    "Reach the American Mahjong community nationwide. Sponsor the weekly newsletter, a state, or a category. Audience demographics, network stats, and sponsorship options.",
  alternates: { canonical: "https://findmymahjgame.com/advertise" },
  robots: { index: false, follow: true },
  openGraph: {
    title: "Advertise on Find My Mahj Game | Reach Mahjong Players Nationwide",
    description: "Reach the American Mahjong community nationwide. Sponsor the newsletter, a state, or a category.",
    url: "https://findmymahjgame.com/advertise",
  },
};

export const revalidate = 3600;

const TEACHER_TYPE = /instructor|teacher|lesson|studio|school|class/i;

async function mailchimpCount(): Promise<number | null> {
  const key = process.env.MAILCHIMP_API_KEY;
  const list = process.env.MAILCHIMP_AUDIENCE_ID;
  if (!key || !list) return null;
  const dc = key.split("-")[1];
  if (!dc) return null;
  try {
    const r = await fetch(`https://${dc}.api.mailchimp.com/3.0/lists/${list}?fields=stats.member_count`, {
      headers: { Authorization: `Basic ${Buffer.from(`anystring:${key}`).toString("base64")}` },
      next: { revalidate: 3600 },
    });
    if (!r.ok) return null;
    const d = await r.json();
    return typeof d?.stats?.member_count === "number" ? d.stats.member_count : null;
  } catch {
    return null;
  }
}

const OPPORTUNITIES: [string, string][] = [
  ["Weekly newsletter sponsorship", "A sponsor slot in Find My Mahj Weekly, nationally or in the states you choose."],
  ["State & metro sponsorship", "Your brand featured on the state and city pages where your customers play."],
  ["Category sponsorship", "Own a category, for example “Tiles brought to you by…” across the directory."],
  ["Featured brand placement", "Stand out on high-traffic discovery pages: events, teachers, and venues."],
  ["Event & retreat sponsorship", "Back tournaments, retreats, and open plays and reach the players attending them."],
];

const sectionTitle: React.CSSProperties = { fontFamily: "var(--font-playfair), 'Playfair Display', serif", fontSize: "1.8rem", color: "var(--navy)", textAlign: "center", margin: "0 0 0.6rem" };
const sectionSub: React.CSSProperties = { fontSize: "1.1rem", color: "var(--muted)", textAlign: "center", lineHeight: 1.6, margin: "0 auto 2rem", maxWidth: 640 };

export default async function AdvertisePage() {
  const supabase = createServerClient();
  let players = 0, events = 0, teachers = 0;
  try {
    const [pl, ev, ve] = await Promise.all([
      supabase.from("player_listings").select("id", { count: "exact", head: true }).eq("status", "published"),
      supabase.from("event_listings").select("id", { count: "exact", head: true }).eq("status", "published"),
      supabase.from("venue_listings").select("venue_type, description").eq("status", "published"),
    ]);
    players = pl.count ?? 0;
    events = ev.count ?? 0;
    teachers = (ve.data || []).filter((v) => TEACHER_TYPE.test(`${v.venue_type || ""} ${v.description || ""}`)).length;
  } catch { /* show what we can */ }
  const subscribers = await mailchimpCount();

  const stats: [string, string][] = [
    ["50", "States covered"],
    [String(players), "Players listed"],
    [String(teachers), "Teachers listed"],
    [String(events), "Events listed"],
  ];
  if (subscribers != null) stats.push([String(subscribers), "Newsletter subscribers"]);

  return (
    <main style={{ maxWidth: 1000, margin: "0 auto", padding: "2.5rem 1.2rem 4rem" }}>
      <script {...schemaScriptProps(buildAdvertisePageSchema())} />

      <p style={{ fontSize: "0.8rem", fontWeight: 800, letterSpacing: "0.18em", textTransform: "uppercase", color: "var(--pink-text)", textAlign: "center", margin: "0 0 0.6rem" }}>Advertise with us</p>
      <h1 style={{ fontFamily: "var(--font-playfair), 'Playfair Display', serif", fontSize: "2.4rem", color: "var(--navy)", textAlign: "center", margin: "0 0 0.6rem", lineHeight: 1.15 }}>Reach the American Mahjong community, nationwide</h1>
      <p style={{ fontSize: "1.2rem", color: "var(--muted)", textAlign: "center", lineHeight: 1.6, margin: "0 auto 2.5rem", maxWidth: 660 }}>Find My Mahj Game is becoming the place American Mahjong players go to find games, teachers, venues, and events. Put your brand in front of a passionate, loyal, and hard-to-reach audience.</p>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: "1rem", margin: "0 auto 0.8rem", maxWidth: 920 }}>
        {stats.map(([num, lab]) => (
          <div key={lab} style={{ background: "var(--bg)", border: "2px solid var(--border)", borderRadius: 16, padding: "1.4rem 1rem", textAlign: "center" }}>
            <div style={{ fontFamily: "var(--font-playfair), 'Playfair Display', serif", fontSize: "2.2rem", fontWeight: 900, color: "var(--navy)", lineHeight: 1 }}>{num}</div>
            <div style={{ fontSize: "0.92rem", color: "var(--muted)", marginTop: "0.4rem", fontWeight: 700 }}>{lab}</div>
          </div>
        ))}
      </div>
      <p style={{ fontSize: "0.9rem", color: "var(--muted)", textAlign: "center", margin: "0 auto 3rem", maxWidth: 640 }}>Live figures from the directory, growing every week.</p>

      <h2 style={sectionTitle}>The audience</h2>
      <p style={sectionSub}>American Mahjong players are a passionate, loyal, and largely untapped market. They are predominantly women, span their 40s through 70s, are socially active, and play weekly with the same circles. They regularly buy sets, tiles, accessories, lessons, and travel, and they trust recommendations from their community.</p>

      <h2 style={sectionTitle}>Who advertises with us</h2>
      <p style={sectionSub}>Tile and set makers, accessory and gift brands, mahjong cruises and retreats, lesson and class programs, and local businesses that want to reach engaged players in a specific city, a specific state, or nationwide.</p>

      <h2 style={sectionTitle}>Sponsorship opportunities</h2>
      <p style={sectionSub}>Flexible, targetable by location, and built around your goals. Custom packages welcome.</p>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 300px), 1fr))", gap: "1rem", margin: "0 auto 3.5rem", maxWidth: 920 }}>
        {OPPORTUNITIES.map(([title, desc]) => (
          <div key={title} style={{ background: "white", border: "2px solid var(--border)", borderRadius: 16, padding: "1.4rem" }}>
            <div style={{ fontSize: "1.15rem", fontWeight: 800, color: "var(--navy)", marginBottom: "0.4rem" }}>{title}</div>
            <div style={{ fontSize: "1rem", color: "var(--muted)", lineHeight: 1.55 }}>{desc}</div>
          </div>
        ))}
      </div>

      <h2 style={sectionTitle}>Get in touch</h2>
      <p style={sectionSub}>Tell us about your brand and we will send our media kit and the options that fit.</p>
      <AdvertiseContact />
    </main>
  );
}
