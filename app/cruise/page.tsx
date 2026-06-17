import type { Metadata } from "next";
import Link from "next/link";
import { createServerClient } from "@/lib/supabase-server";
import CruiseBoard from "./cruise-board";
import { DEMO, demoCruisePosts } from "@/lib/demo-data";

export const metadata: Metadata = {
  title: "Find Mahjong Players on Your Cruise",
  description: "Sailing soon? Find other American Mahjong players on your exact cruise and dates, so you have a game on board. Free for players. Different from an organized mahjong cruise.",
  alternates: { canonical: "https://findmymahjgame.com/cruise" },
};

export const revalidate = 300;

export type CruisePost = {
  id: string;
  name: string;
  cruise_line: string;
  ship: string | null;
  depart_date: string;
  return_date: string | null;
  skill_level: string | null;
};

export default async function CruisePage() {
  const supabase = createServerClient();
  const todayISO = new Date().toISOString().slice(0, 10);
  let posts: CruisePost[] = [];
  try {
    const { data } = await supabase
      .from("cruise_posts")
      .select("id, name, cruise_line, ship, depart_date, return_date, skill_level")
      .eq("status", "published")
      .order("depart_date", { ascending: true });
    posts = (data || []).filter((p) => (p.return_date || p.depart_date) >= todayISO) as CruisePost[];
  } catch { /* table not ready yet: show empty board + the post form */ }
  if (DEMO) posts = demoCruisePosts;

  const breadcrumb = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: "https://findmymahjgame.com" },
      { "@type": "ListItem", position: 2, name: "Travel", item: "https://findmymahjgame.com/travel" },
      { "@type": "ListItem", position: 3, name: "Cruising", item: "https://findmymahjgame.com/cruise" },
    ],
  };
  const collectionPage = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "Find Mahjong Players on Your Cruise",
    description: "Find other American Mahjong players sailing on your cruise and dates.",
    url: "https://findmymahjgame.com/cruise",
    about: { "@type": "Thing", name: "American Mahjong" },
    isPartOf: { "@type": "WebSite", name: "Find My Mahj Game", url: "https://findmymahjgame.com" },
  };

  return (
    <main style={{ maxWidth: 1000, margin: "0 auto", padding: "2.5rem 1.2rem 4rem" }}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify([breadcrumb, collectionPage]) }} />

      <p style={{ textAlign: "center", margin: "0 0 0.8rem" }}><Link href="/travel" style={{ color: "var(--pink-text)", fontWeight: 700, fontSize: "1rem" }}>&lsaquo; Travel</Link></p>
      <h1 style={{ fontFamily: "var(--font-playfair), 'Playfair Display', serif", fontSize: "2.2rem", color: "var(--navy)", textAlign: "center", margin: "0 0 0.4rem" }}>Find mahjong players on your cruise</h1>
      <p style={{ fontSize: "1.2rem", color: "var(--muted)", textAlign: "center", lineHeight: 1.5, margin: "0 auto 0.8rem", maxWidth: 680 }}>Going on a cruise and want a game on board? Post your ship and sailing dates, then see who else who plays American Mahjong is on the same trip. Free for players.</p>
      <p style={{ fontSize: "1rem", color: "var(--navy)", textAlign: "center", lineHeight: 1.6, margin: "0 auto 2rem", maxWidth: 680 }}>Looking for an organized mahjong cruise or retreat instead? <Link href="/travel#retreats" style={{ color: "var(--pink-text)", fontWeight: 700 }}>See those here</Link>.</p>

      <CruiseBoard posts={posts} />
    </main>
  );
}
