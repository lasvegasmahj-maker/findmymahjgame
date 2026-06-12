import type { Metadata } from "next";
import Link from "next/link";
import { createServerClient } from "@/lib/supabase-server";
import NewsletterSignup from "@/components/newsletter-signup";
import styles from "./home-v2.module.css";

export const metadata: Metadata = {
  title: "Find My Mahj Game | Find Mahjong Players Near You",
  description: "Find people to play American Mahjong with, near you, free, in all 50 states.",
  robots: { index: false, follow: true },
};

export const revalidate = 60;

const btn = (bg: string, color: string, border?: string): React.CSSProperties => ({
  display: "flex", alignItems: "center", justifyContent: "center", minHeight: 72,
  borderRadius: 16, fontSize: "1.4rem", fontWeight: 800, textDecoration: "none",
  background: bg, color, ...(border ? { border } : {}),
});
const sub: React.CSSProperties = { fontSize: "1rem", color: "var(--muted)", textAlign: "center", marginTop: "0.4rem" };

export default async function HomeV2() {
  const supabase = createServerClient();
  let players = 0;
  let tables = 0;
  let cities = 0;
  try {
    const [p, t] = await Promise.all([
      supabase.from("player_listings").select("city", { count: "exact" }).eq("status", "published"),
      supabase.from("tables").select("city", { count: "exact" }),
    ]);
    players = p.count ?? 0;
    tables = t.count ?? 0;
    const citySet = new Set<string>();
    (p.data || []).forEach((r: { city: string | null }) => { if (r.city) citySet.add(String(r.city).toLowerCase()); });
    (t.data || []).forEach((r: { city: string | null }) => { if (r.city) citySet.add(String(r.city).toLowerCase()); });
    cities = citySet.size;
  } catch {
    // Leave counts at zero; the proof section hides itself when there is nothing real to show.
  }

  const showProof = players + tables > 0;

  return (
    <>
      <section className="hero" style={{ paddingBottom: "1.5rem" }}>
        <h1>Find people to play <em>mahjong</em> with</h1>
        <p>American Mahjong, near you. Free. In all 50 states.</p>
        <div style={{ maxWidth: 440, margin: "0.8rem auto 0", display: "flex", flexDirection: "column", gap: "1.4rem" }}>
          <div>
            <Link href="/play" style={btn("var(--navy)", "white")}>I Want to Play</Link>
            <div style={sub}>Find a game near you</div>
          </div>
          <div>
            <Link href="/start" style={btn("var(--pink)", "white")}>Start a Table</Link>
            <div style={sub}>Invite players to join</div>
          </div>
          <div>
            <Link href="/help" style={btn("white", "var(--navy)", "2px solid var(--navy)")}>I Need Help</Link>
            <div style={sub}>Talk to a real person</div>
          </div>
        </div>
        <div style={{ marginTop: "1.6rem", textAlign: "center" }}>
          <Link href="/how-it-works" style={{ fontSize: "1.1rem", color: "var(--pink)", fontWeight: 700 }}>New to mahjong? Learn how</Link>
        </div>
      </section>

      <section className={styles.section}>
        <p className={styles.eyebrow}>How it works</p>
        <h2 className={styles.h2}>Three simple steps</h2>
        <div className={styles.cards}>
          <div className={styles.card}>
            <div className={styles.badge}>1</div>
            <h3 className={styles.cardTitle}>Find</h3>
            <p className={styles.cardText}>Find players, events, teachers, and places to play near you.</p>
          </div>
          <div className={styles.card}>
            <div className={styles.badge}>2</div>
            <h3 className={styles.cardTitle}>Connect</h3>
            <p className={styles.cardText}>Join a game or start one of your own.</p>
          </div>
          <div className={styles.card}>
            <div className={styles.badge}>3</div>
            <h3 className={styles.cardTitle}>Play</h3>
            <p className={styles.cardText}>Meet safely in public places and enjoy the game.</p>
          </div>
        </div>
      </section>

      {showProof && (
        <section className={`${styles.section} ${styles.sectionAlt}`}>
          <div className={styles.proof}>
            {players > 0 && (
              <div className={styles.stat}><div className={styles.statNum}>{players}</div><div className={styles.statLabel}>Players listed</div></div>
            )}
            {tables > 0 && (
              <div className={styles.stat}><div className={styles.statNum}>{tables}</div><div className={styles.statLabel}>Tables started</div></div>
            )}
            {cities > 0 && (
              <div className={styles.stat}><div className={styles.statNum}>{cities}</div><div className={styles.statLabel}>Cities active</div></div>
            )}
          </div>
        </section>
      )}

      <section className={styles.section}>
        <div className={styles.newsletter}>
          <h2 className={styles.nlTitle}>Stay Connected</h2>
          <p className={styles.nlText}>Get updates on events, open plays, teachers, and community news.</p>
          <NewsletterSignup dark />
        </div>
      </section>
    </>
  );
}
