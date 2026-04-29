"use client";

import { useState } from "react";
import Link from "next/link";
import type { StateData } from "@/lib/states-data";

function LevelBadge({ level }: { level: string }) {
  const bg = level === "Beginner" ? "rgba(46,201,92,0.1)" : level === "Intermediate" ? "rgba(245,200,66,0.15)" : "rgba(233,30,140,0.1)";
  const color = level === "Beginner" ? "#1a9648" : level === "Intermediate" ? "#a07800" : "var(--pink)";
  return (
    <span style={{ display: "inline-block", fontSize: "0.7rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", padding: "0.2rem 0.7rem", borderRadius: 50, background: bg, color }}>{level}</span>
  );
}

export default function StatePageClient({ stateData }: { stateData: StateData }) {
  const [activeTab, setActiveTab] = useState<"players" | "events" | "venues">("players");
  const [selectedCity, setSelectedCity] = useState(`All of ${stateData.name}`);
  const allCities = [`All of ${stateData.name}`, ...stateData.cities];

  return (
    <>
      {/* Hero */}
      <section className="page-hero" style={{ padding: "3.5rem 2rem" }}>
        <p style={{ fontSize: "0.82rem", color: "rgba(255,255,255,0.5)", marginBottom: "1.2rem" }}>
          <Link href="/" style={{ color: "var(--pink)", textDecoration: "none" }}>Home</Link>
          {" "}&rsaquo;{" "}
          <Link href="/#map" style={{ color: "var(--pink)", textDecoration: "none" }}>Find Players</Link>
          {" "}&rsaquo; {stateData.name}
        </p>
        <h1 style={{ fontSize: "clamp(2.2rem, 5vw, 3.5rem)", marginBottom: "0.8rem" }}>
          Mahjong in <span style={{ color: "var(--pink)" }}>{stateData.name}</span>
        </h1>
        <p style={{ maxWidth: 520 }}>{stateData.desc}</p>
        <div style={{ display: "flex", gap: "3rem", justifyContent: "center", marginTop: "2.5rem", flexWrap: "wrap" }}>
          {[
            { num: "—", label: "Players Listed" },
            { num: "—", label: "Groups" },
            { num: "—", label: "Events" },
            { num: "—", label: "Venues" },
          ].map((s) => (
            <div key={s.label} style={{ textAlign: "center" }}>
              <div style={{ fontFamily: "var(--font-playfair), 'Playfair Display', serif", fontSize: "2rem", color: "white", fontWeight: 900 }}>{s.num}</div>
              <div style={{ fontSize: "0.78rem", color: "rgba(255,255,255,0.5)", marginTop: "0.2rem" }}>{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Search Bar */}
      <div style={{ background: "var(--navy)", padding: "1.5rem 2rem", borderTop: "1px solid rgba(255,255,255,0.1)" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", display: "flex", alignItems: "flex-end", gap: "1.5rem", flexWrap: "wrap", justifyContent: "center" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
            <div style={{ fontSize: "0.7rem", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "rgba(255,255,255,0.5)" }}>City / Town</div>
            <select value={selectedCity} onChange={(e) => setSelectedCity(e.target.value)} style={{ background: "white", border: "none", borderRadius: 6, padding: "0.7rem 1.2rem", fontFamily: "'DM Sans', sans-serif", fontSize: "0.9rem", color: "var(--navy)", outline: "none", cursor: "pointer", minWidth: 200 }}>
              {allCities.map((city) => (<option key={city} value={city}>{city}</option>))}
            </select>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
            <div style={{ fontSize: "0.7rem", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "rgba(255,255,255,0.5)" }}>Distance</div>
            <div style={{ display: "flex", gap: "0.4rem" }}>
              {["5 mi", "10 mi", "25 mi", "50 mi"].map((d, i) => (
                <button key={d} style={{ background: i === 0 ? "var(--pink)" : "rgba(255,255,255,0.1)", border: i === 0 ? "1.5px solid var(--pink)" : "1.5px solid rgba(255,255,255,0.2)", color: i === 0 ? "white" : "rgba(255,255,255,0.7)", borderRadius: 6, padding: "0.6rem 1rem", fontSize: "0.82rem", fontWeight: 600, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>{d}</button>
              ))}
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
            <div style={{ fontSize: "0.7rem", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "rgba(255,255,255,0.5)" }}>Or Enter Zip Code</div>
            <div style={{ display: "flex", gap: "0.5rem" }}>
              <input type="text" placeholder="Enter zip" maxLength={5} style={{ background: "white", border: "none", borderRadius: 6, padding: "0.7rem 1.2rem", fontFamily: "'DM Sans', sans-serif", fontSize: "0.9rem", color: "var(--navy)", outline: "none", width: 130 }} />
              <button style={{ background: "var(--pink)", color: "white", border: "none", borderRadius: 6, padding: "0.7rem 1.2rem", fontWeight: 700, fontSize: "0.88rem", cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>Search</button>
            </div>
          </div>
        </div>
        <p style={{ textAlign: "center", marginTop: "1rem", fontSize: "0.82rem", color: "rgba(255,255,255,0.55)" }}>
          Showing all players, events &amp; venues across <strong style={{ color: "white" }}>{stateData.name}</strong>
        </p>
      </div>

      {/* Main Content */}
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "3rem 2rem" }}>
        {/* Tabs */}
        <div style={{ display: "flex", gap: 0, borderBottom: "2px solid var(--border)", marginBottom: "2.5rem" }}>
          {([
            { id: "players" as const, label: "Players", icon: "👥" },
            { id: "events" as const, label: "Events", icon: "🎫" },
            { id: "venues" as const, label: "Where to Play", icon: "🏛" },
          ]).map((tab) => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{ padding: "0.9rem 1.8rem", fontSize: "0.95rem", fontWeight: 600, cursor: "pointer", background: "transparent", border: "none", borderBottom: "2px solid", borderBottomColor: activeTab === tab.id ? "var(--pink)" : "transparent", marginBottom: -2, color: activeTab === tab.id ? "var(--navy)" : "var(--muted)", fontFamily: "'DM Sans', sans-serif", transition: "all 0.2s" }}>
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>

        {/* ══════════ PLAYERS TAB ══════════ */}
        {activeTab === "players" && (
          <div>
            <p className="section-label">Looking for a Group</p>
            <h2 className="section-title" style={{ marginBottom: "0.5rem" }}>Players in {stateData.name}</h2>
            <p style={{ fontSize: "1rem", color: "var(--muted)", marginBottom: "2rem", lineHeight: 1.7 }}>
              Connect with mahjong players across {stateData.name} looking for their perfect weekly game.
            </p>

            {/* Empty state — no players yet */}
            <div style={{ background: "var(--bg)", border: "2px dashed var(--border)", borderRadius: 20, padding: "4rem 2rem", textAlign: "center", marginBottom: "2.5rem" }}>
              <div style={{ fontSize: "3.5rem", marginBottom: "1.2rem" }}>🀄</div>
              <h3 style={{ fontFamily: "var(--font-playfair), 'Playfair Display', serif", fontSize: "1.4rem", color: "var(--navy)", marginBottom: "0.8rem" }}>
                No players listed in {stateData.name} yet
              </h3>
              <p style={{ fontSize: "1rem", color: "var(--muted)", marginBottom: "2rem", maxWidth: 420, marginLeft: "auto", marginRight: "auto", lineHeight: 1.7 }}>
                Be the first! Create a free listing and let other players in {stateData.name} find you.
              </p>
              <Link href="/#map" className="btn-cta-primary" style={{ padding: "0.9rem 2.5rem" }}>
                Create My Free Listing &rarr;
              </Link>
            </div>

            {/* Sponsored — Instructors */}
            <div style={{ background: "linear-gradient(135deg, rgba(233,30,140,0.04), rgba(233,30,140,0.08))", border: "1px solid rgba(233,30,140,0.18)", borderRadius: 16, padding: "1.5rem 2rem", marginBottom: "2rem" }}>
              <span style={{ fontSize: "0.62rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--pink)", display: "block", marginBottom: "0.6rem" }}>Sponsored</span>
              <div style={{ display: "flex", alignItems: "center", gap: "1.2rem", flexWrap: "wrap" }}>
                <div style={{ width: 48, height: 48, borderRadius: 10, background: "white", border: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.3rem", flexShrink: 0 }}>🎓</div>
                <div style={{ flex: 1, minWidth: 200 }}>
                  <div style={{ fontWeight: 700, fontSize: "0.95rem", color: "var(--navy)" }}>Teach Mahjong in {stateData.name}?</div>
                  <div style={{ fontSize: "0.82rem", color: "var(--muted)", lineHeight: 1.5, marginTop: "0.2rem" }}>Get your instructor listing in front of players actively searching for lessons. Reach students in {stateData.cities[0]} and beyond.</div>
                </div>
                <Link href="/advertise" style={{ background: "var(--pink)", color: "white", borderRadius: 6, padding: "0.6rem 1.4rem", fontWeight: 700, fontSize: "0.82rem", textDecoration: "none", whiteSpace: "nowrap" }}>Get Listed &rarr;</Link>
              </div>
            </div>

            {/* Ad cards — Mahjong companies + Studios */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "2.5rem" }}>
              <div style={{ background: "white", border: "2px dashed rgba(233,30,140,0.2)", borderRadius: 12, padding: "1.8rem", textAlign: "center" }}>
                <span style={{ fontSize: "0.62rem", fontWeight: 700, letterSpacing: "0.15em", textTransform: "uppercase", color: "rgba(233,30,140,0.5)", marginBottom: "0.5rem", display: "block" }}>Advertisement</span>
                <div style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>🛍️</div>
                <div style={{ fontWeight: 700, fontSize: "0.92rem", color: "var(--navy)", marginBottom: "0.3rem" }}>Sell Mahjong Sets or Accessories?</div>
                <div style={{ fontSize: "0.82rem", color: "var(--muted)", marginBottom: "1.2rem", lineHeight: 1.5 }}>Reach players in {stateData.name} who are actively looking for sets, tiles, racks and more.</div>
                <Link href="/advertise" style={{ display: "block", background: "var(--pink)", color: "white", borderRadius: 6, padding: "0.5rem 1rem", fontWeight: 700, fontSize: "0.82rem", textDecoration: "none" }}>Advertise Here &rarr;</Link>
              </div>
              <div style={{ background: "white", border: "2px dashed rgba(233,30,140,0.2)", borderRadius: 12, padding: "1.8rem", textAlign: "center" }}>
                <span style={{ fontSize: "0.62rem", fontWeight: 700, letterSpacing: "0.15em", textTransform: "uppercase", color: "rgba(233,30,140,0.5)", marginBottom: "0.5rem", display: "block" }}>Advertisement</span>
                <div style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>🏠</div>
                <div style={{ fontWeight: 700, fontSize: "0.92rem", color: "var(--navy)", marginBottom: "0.3rem" }}>Mahjong Studio in {stateData.name}?</div>
                <div style={{ fontSize: "0.82rem", color: "var(--muted)", marginBottom: "1.2rem", lineHeight: 1.5 }}>Get listed and reach players searching for a dedicated place to play near them.</div>
                <Link href="/advertise" style={{ display: "block", background: "var(--pink)", color: "white", borderRadius: 6, padding: "0.5rem 1rem", fontWeight: 700, fontSize: "0.82rem", textDecoration: "none" }}>Get Listed &rarr;</Link>
              </div>
            </div>

            {/* CTA */}
            <div style={{ background: "var(--navy)", borderRadius: 16, padding: "2.5rem", textAlign: "center" }}>
              <h3 style={{ fontFamily: "var(--font-playfair), 'Playfair Display', serif", fontSize: "1.3rem", color: "white", marginBottom: "0.5rem" }}>
                Want to be listed here? It&rsquo;s free!
              </h3>
              <p style={{ fontSize: "0.9rem", color: "rgba(255,255,255,0.55)", marginBottom: "1.5rem" }}>
                Add your free listing and let local players in {stateData.name} find you.
              </p>
              <Link href="/#map" className="btn-cta-primary" style={{ padding: "0.9rem 2.5rem" }}>
                Create My Free Listing &rarr;
              </Link>
            </div>
          </div>
        )}

        {/* ══════════ EVENTS TAB ══════════ */}
        {activeTab === "events" && (
          <div>
            <p className="section-label">Happening in {stateData.name}</p>
            <h2 className="section-title" style={{ marginBottom: "0.5rem" }}>Events Near You</h2>
            <p style={{ fontSize: "1rem", color: "var(--muted)", marginBottom: "2rem", lineHeight: 1.7 }}>
              Open plays, game nights, and mahjong events happening across {stateData.name}.
            </p>

            <div style={{ background: "var(--bg)", border: "2px dashed var(--border)", borderRadius: 20, padding: "4rem 2rem", textAlign: "center" }}>
              <div style={{ fontSize: "3.5rem", marginBottom: "1.2rem" }}>🎫</div>
              <h3 style={{ fontFamily: "var(--font-playfair), 'Playfair Display', serif", fontSize: "1.4rem", color: "var(--navy)", marginBottom: "0.8rem" }}>
                No events listed in {stateData.name} yet
              </h3>
              <p style={{ fontSize: "1rem", color: "var(--muted)", marginBottom: "2rem", maxWidth: 450, marginLeft: "auto", marginRight: "auto", lineHeight: 1.7 }}>
                Host an open play, tournament, or mahjong night? List your event and reach players actively searching for games. Starting at just $10/event.
              </p>
              <Link href="/advertise" className="btn-cta-primary" style={{ padding: "0.9rem 2.5rem" }}>
                List Your Event &rarr;
              </Link>
            </div>

            {/* Sponsored */}
            <div style={{ background: "linear-gradient(135deg, rgba(233,30,140,0.04), rgba(233,30,140,0.08))", border: "1px solid rgba(233,30,140,0.18)", borderRadius: 16, padding: "1.5rem 2rem", marginTop: "2rem" }}>
              <span style={{ fontSize: "0.62rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--pink)", display: "block", marginBottom: "0.6rem" }}>Sponsored</span>
              <div style={{ display: "flex", alignItems: "center", gap: "1.2rem", flexWrap: "wrap" }}>
                <div style={{ width: 48, height: 48, borderRadius: 10, background: "white", border: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.3rem", flexShrink: 0 }}>📅</div>
                <div style={{ flex: 1, minWidth: 200 }}>
                  <div style={{ fontWeight: 700, fontSize: "0.95rem", color: "var(--navy)" }}>Promote Your Mahjong Event in {stateData.name}</div>
                  <div style={{ fontSize: "0.82rem", color: "var(--muted)", lineHeight: 1.5, marginTop: "0.2rem" }}>Reach players in {stateData.cities[0]}, {stateData.cities[1] || stateData.cities[0]} and across the state. Event listings start at $10.</div>
                </div>
                <Link href="/advertise" style={{ background: "var(--pink)", color: "white", borderRadius: 6, padding: "0.6rem 1.4rem", fontWeight: 700, fontSize: "0.82rem", textDecoration: "none", whiteSpace: "nowrap" }}>Get Listed &rarr;</Link>
              </div>
            </div>
          </div>
        )}

        {/* ══════════ VENUES TAB ══════════ */}
        {activeTab === "venues" && (
          <div>
            <p className="section-label">Where to Play</p>
            <h2 className="section-title" style={{ marginBottom: "0.5rem" }}>Venues in {stateData.name}</h2>
            <p style={{ fontSize: "1rem", color: "var(--muted)", marginBottom: "2rem", lineHeight: 1.7 }}>
              Restaurants, studios, and community spaces in {stateData.name} that welcome mahjong players.
            </p>

            <div style={{ background: "var(--bg)", border: "2px dashed var(--border)", borderRadius: 20, padding: "4rem 2rem", textAlign: "center" }}>
              <div style={{ fontSize: "3.5rem", marginBottom: "1.2rem" }}>🏛</div>
              <h3 style={{ fontFamily: "var(--font-playfair), 'Playfair Display', serif", fontSize: "1.4rem", color: "var(--navy)", marginBottom: "0.8rem" }}>
                No venues listed in {stateData.name} yet
              </h3>
              <p style={{ fontSize: "1rem", color: "var(--muted)", marginBottom: "2rem", maxWidth: 450, marginLeft: "auto", marginRight: "auto", lineHeight: 1.7 }}>
                Own a mahjong-friendly venue? Get discovered by players searching for places to play. Listings start at $19/mo.
              </p>
              <Link href="/advertise" className="btn-cta-primary" style={{ padding: "0.9rem 2.5rem" }}>
                List Your Venue &rarr;
              </Link>
            </div>

            {/* Ad cards — Venues + Studios */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginTop: "2rem" }}>
              <div style={{ background: "white", border: "2px dashed rgba(233,30,140,0.2)", borderRadius: 12, padding: "1.8rem", textAlign: "center" }}>
                <span style={{ fontSize: "0.62rem", fontWeight: 700, letterSpacing: "0.15em", textTransform: "uppercase", color: "rgba(233,30,140,0.5)", marginBottom: "0.5rem", display: "block" }}>Advertisement</span>
                <div style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>🍽️</div>
                <div style={{ fontWeight: 700, fontSize: "0.92rem", color: "var(--navy)", marginBottom: "0.3rem" }}>Restaurant or Caf&eacute; in {stateData.name}?</div>
                <div style={{ fontSize: "0.82rem", color: "var(--muted)", marginBottom: "1.2rem", lineHeight: 1.5 }}>Welcome mahjong groups? Get listed and they&rsquo;ll find you.</div>
                <Link href="/advertise" style={{ display: "block", background: "var(--pink)", color: "white", borderRadius: 6, padding: "0.5rem 1rem", fontWeight: 700, fontSize: "0.82rem", textDecoration: "none" }}>Get Listed &rarr;</Link>
              </div>
              <div style={{ background: "white", border: "2px dashed rgba(233,30,140,0.2)", borderRadius: 12, padding: "1.8rem", textAlign: "center" }}>
                <span style={{ fontSize: "0.62rem", fontWeight: 700, letterSpacing: "0.15em", textTransform: "uppercase", color: "rgba(233,30,140,0.5)", marginBottom: "0.5rem", display: "block" }}>Advertisement</span>
                <div style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>🀄</div>
                <div style={{ fontWeight: 700, fontSize: "0.92rem", color: "var(--navy)", marginBottom: "0.3rem" }}>Mahjong Studio or JCC?</div>
                <div style={{ fontSize: "0.82rem", color: "var(--muted)", marginBottom: "1.2rem", lineHeight: 1.5 }}>Reach players searching for dedicated mahjong spaces in {stateData.name}.</div>
                <Link href="/advertise" style={{ display: "block", background: "var(--pink)", color: "white", borderRadius: 6, padding: "0.5rem 1rem", fontWeight: 700, fontSize: "0.82rem", textDecoration: "none" }}>Get Listed &rarr;</Link>
              </div>
            </div>
          </div>
        )}

        {/* Nearby States */}
        <div style={{ marginTop: "3rem", padding: "2rem", background: "var(--bg)", border: "1px solid var(--border)", borderRadius: 16 }}>
          <h3 style={{ fontFamily: "var(--font-playfair), 'Playfair Display', serif", fontSize: "1.1rem", color: "var(--navy)", marginBottom: "1rem" }}>Explore Nearby States</h3>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.6rem" }}>
            {stateData.nearby.map((state) => (
              <Link key={state} href={`/states/${state.toLowerCase().replace(/\s+/g, "-")}`} style={{ background: "white", border: "1.5px solid var(--border)", borderRadius: 50, padding: "0.5rem 1.2rem", fontSize: "0.85rem", fontWeight: 600, color: "var(--navy)", textDecoration: "none", transition: "all 0.2s" }}>
                {state}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
