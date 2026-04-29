"use client";

import { useState } from "react";
import Link from "next/link";

const CITIES = [
  "All of Nevada",
  "Las Vegas",
  "Summerlin",
  "Henderson",
  "North Las Vegas",
  "Reno",
  "Boulder City",
  "Sparks",
];

// Sample player listings
const SAMPLE_PLAYERS = [
  { name: "Sandra M.", city: "Henderson", level: "Intermediate", avail: "Weekday Mornings", color: "#e91e8c" },
  { name: "Jennifer K.", city: "Summerlin", level: "Beginner", avail: "Weekend Afternoons", color: "#2ec95c" },
  { name: "Carol B.", city: "Las Vegas", level: "Advanced", avail: "Tuesday Evenings", color: "#f5c842" },
  { name: "Diane R.", city: "Henderson", level: "Intermediate", avail: "Mon/Wed Mornings", color: "#7c5cbf" },
  { name: "Michelle P.", city: "Las Vegas", level: "Beginner", avail: "Thursday Mornings", color: "#00c9b1" },
  { name: "Karen L.", city: "Summerlin", level: "Intermediate", avail: "Weekends", color: "#e91e8c" },
];

// Sample events
const SAMPLE_EVENTS = [
  { type: "Open Play", name: "Las Vegas Open Play Night", date: "Every Tuesday, 6:30 PM", loc: "Honey Salt, Las Vegas", price: "Free" },
  { type: "Lesson", name: "Beginner Mahjong Lessons", date: "Saturdays, 10 AM", loc: "Las Vegas (Private)", price: "$45/session" },
  { type: "Tournament", name: "Nevada Spring Tournament", date: "May 17, 2025", loc: "Henderson Community Center", price: "$35 entry" },
];

// Sample venues
const SAMPLE_VENUES = [
  { name: "Honey Salt", type: "Restaurant", city: "Las Vegas", desc: "Welcoming to mahjong groups — great tables and atmosphere!", color: "var(--pink)" },
  { name: "Las Vegas Mahjong Studio", type: "Mahjong Studio", city: "Summerlin", desc: "Dedicated space for lessons and open play. Sets provided.", color: "var(--green)" },
];

function LevelBadge({ level }: { level: string }) {
  const bg = level === "Beginner" ? "rgba(46,201,92,0.1)" : level === "Intermediate" ? "rgba(245,200,66,0.15)" : "rgba(233,30,140,0.1)";
  const color = level === "Beginner" ? "#1a9648" : level === "Intermediate" ? "#a07800" : "var(--pink)";
  return (
    <span style={{ display: "inline-block", fontSize: "0.7rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", padding: "0.2rem 0.7rem", borderRadius: 50, background: bg, color }}>{level}</span>
  );
}

export default function NevadaPage() {
  const [activeTab, setActiveTab] = useState<"players" | "events" | "venues">("players");
  const [selectedCity, setSelectedCity] = useState("All of Nevada");

  return (
    <>
      {/* Hero */}
      <section className="page-hero" style={{ padding: "3.5rem 2rem" }}>
        <p style={{ fontSize: "0.82rem", color: "rgba(255,255,255,0.5)", marginBottom: "1.2rem" }}>
          <Link href="/" style={{ color: "var(--pink)", textDecoration: "none" }}>Home</Link>
          {" "}&rsaquo;{" "}
          <Link href="/#map" style={{ color: "var(--pink)", textDecoration: "none" }}>Find Players</Link>
          {" "}&rsaquo; Nevada
        </p>
        <h1 style={{ fontSize: "clamp(2.2rem, 5vw, 3.5rem)", marginBottom: "0.8rem" }}>
          Mahjong in <span style={{ color: "var(--pink)" }}>Nevada</span>
        </h1>
        <p style={{ maxWidth: 520 }}>
          Find players, groups, open plays and events across Nevada &mdash; from Las Vegas to Sparks and everywhere in between.
        </p>
        <div style={{ display: "flex", gap: "3rem", justifyContent: "center", marginTop: "2.5rem", flexWrap: "wrap" }}>
          {[
            { num: "6", label: "Players Listed" },
            { num: "2", label: "Groups" },
            { num: "3", label: "Events" },
            { num: "2", label: "Venues" },
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
            <select
              value={selectedCity}
              onChange={(e) => setSelectedCity(e.target.value)}
              style={{ background: "white", border: "none", borderRadius: 6, padding: "0.7rem 1.2rem", fontFamily: "'DM Sans', sans-serif", fontSize: "0.9rem", color: "var(--navy)", outline: "none", cursor: "pointer", minWidth: 200 }}
            >
              {CITIES.map((city) => (
                <option key={city} value={city}>{city}</option>
              ))}
            </select>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
            <div style={{ fontSize: "0.7rem", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "rgba(255,255,255,0.5)" }}>Distance</div>
            <div style={{ display: "flex", gap: "0.4rem" }}>
              {["5 mi", "10 mi", "25 mi", "50 mi"].map((d, i) => (
                <button key={d} style={{ background: i === 0 ? "var(--pink)" : "rgba(255,255,255,0.1)", border: i === 0 ? "1.5px solid var(--pink)" : "1.5px solid rgba(255,255,255,0.2)", color: i === 0 ? "white" : "rgba(255,255,255,0.7)", borderRadius: 6, padding: "0.6rem 1rem", fontSize: "0.82rem", fontWeight: 600, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>
                  {d}
                </button>
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
          Showing all players, events &amp; venues across <strong style={{ color: "white" }}>Nevada</strong>
        </p>
      </div>

      {/* Main Content */}
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "3rem 2rem" }}>
        {/* Tabs */}
        <div style={{ display: "flex", gap: 0, borderBottom: "2px solid var(--border)", marginBottom: "2.5rem" }}>
          {[
            { id: "players" as const, label: "Players", icon: "👥" },
            { id: "events" as const, label: "Events", icon: "🎫" },
            { id: "venues" as const, label: "Where to Play", icon: "🏛" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{ padding: "0.9rem 1.8rem", fontSize: "0.95rem", fontWeight: 600, cursor: "pointer", background: "transparent", border: "none", borderBottom: "2px solid", borderBottomColor: activeTab === tab.id ? "var(--pink)" : "transparent", marginBottom: -2, color: activeTab === tab.id ? "var(--navy)" : "var(--muted)", fontFamily: "'DM Sans', sans-serif", transition: "all 0.2s" }}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>

        {/* ══════════ PLAYERS TAB ══════════ */}
        {activeTab === "players" && (
          <div>
            <p className="section-label">Looking for a Group</p>
            <h2 className="section-title" style={{ marginBottom: "0.5rem" }}>Players in Nevada</h2>
            <p style={{ fontSize: "1rem", color: "var(--muted)", marginBottom: "2rem", lineHeight: 1.7 }}>
              Connect with mahjong players across Nevada looking for their perfect weekly game.
            </p>

            {/* Player cards grid */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "2rem" }}>
              {SAMPLE_PLAYERS.map((player) => (
                <div key={player.name} style={{ background: "var(--bg)", border: "1px solid var(--border)", borderRadius: 16, padding: "1.4rem", transition: "all 0.2s", cursor: "pointer" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.8rem", marginBottom: "0.8rem" }}>
                    <div style={{ width: 42, height: 42, borderRadius: "50%", background: player.color, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, color: "white", fontSize: "1rem", flexShrink: 0 }}>
                      {player.name.charAt(0)}
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: "0.92rem", color: "var(--navy)" }}>{player.name}</div>
                      <div style={{ fontSize: "0.78rem", color: "var(--muted)" }}>{player.city}, NV</div>
                    </div>
                  </div>
                  <LevelBadge level={player.level} />
                  <div style={{ fontSize: "0.8rem", color: "var(--muted)", margin: "0.6rem 0 0.9rem" }}>📅 {player.avail}</div>
                  <button style={{ width: "100%", background: "transparent", border: "1.5px solid var(--pink)", color: "var(--pink)", borderRadius: 6, padding: "0.5rem", fontWeight: 700, fontSize: "0.8rem", cursor: "pointer", fontFamily: "'DM Sans', sans-serif", transition: "all 0.2s" }}>
                    Connect
                  </button>
                </div>
              ))}
            </div>

            {/* Tasteful sponsored card — blends with player cards */}
            <div style={{ background: "linear-gradient(135deg, rgba(233,30,140,0.04), rgba(233,30,140,0.08))", border: "1px solid rgba(233,30,140,0.18)", borderRadius: 16, padding: "1.5rem 2rem", marginBottom: "2rem" }}>
              <span style={{ fontSize: "0.62rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--pink)", display: "block", marginBottom: "0.6rem" }}>Sponsored</span>
              <div style={{ display: "flex", alignItems: "center", gap: "1.2rem", flexWrap: "wrap" }}>
                <div style={{ width: 48, height: 48, borderRadius: 10, background: "white", border: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.3rem", flexShrink: 0 }}>🀄</div>
                <div style={{ flex: 1, minWidth: 200 }}>
                  <div style={{ fontWeight: 700, fontSize: "0.95rem", color: "var(--navy)" }}>Las Vegas Mahjong</div>
                  <div style={{ fontSize: "0.82rem", color: "var(--muted)", lineHeight: 1.5, marginTop: "0.2rem" }}>Lessons, open play &amp; events with certified instructor Shauna. All levels welcome.</div>
                </div>
                <Link href="https://lasvegasmahj.com" target="_blank" style={{ background: "var(--pink)", color: "white", borderRadius: 6, padding: "0.6rem 1.4rem", fontWeight: 700, fontSize: "0.82rem", textDecoration: "none", whiteSpace: "nowrap" }}>Visit &rarr;</Link>
              </div>
            </div>

            {/* CTA */}
            <div style={{ background: "var(--navy)", borderRadius: 16, padding: "2.5rem", textAlign: "center" }}>
              <h3 style={{ fontFamily: "var(--font-playfair), 'Playfair Display', serif", fontSize: "1.3rem", color: "white", marginBottom: "0.5rem" }}>
                Want to be listed here? It&rsquo;s free!
              </h3>
              <p style={{ fontSize: "0.9rem", color: "rgba(255,255,255,0.55)", marginBottom: "1.5rem" }}>
                Add your free listing and let local players find you.
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
            <p className="section-label">Happening in Nevada</p>
            <h2 className="section-title" style={{ marginBottom: "0.5rem" }}>Events Near You</h2>
            <p style={{ fontSize: "1rem", color: "var(--muted)", marginBottom: "2rem", lineHeight: 1.7 }}>
              Open plays, game nights, and mahjong events happening across Nevada.
            </p>

            {/* Event cards */}
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem", marginBottom: "2rem" }}>
              {SAMPLE_EVENTS.map((event) => (
                <div key={event.name} style={{ background: "var(--bg)", border: "1px solid var(--border)", borderRadius: 16, padding: "1.5rem 2rem", transition: "all 0.2s", cursor: "pointer" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "1rem" }}>
                    <div>
                      <span style={{ fontSize: "0.7rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: event.type === "Open Play" ? "var(--green)" : event.type === "Tournament" ? "var(--navy)" : "var(--pink)" }}>{event.type}</span>
                      <h3 style={{ fontWeight: 700, fontSize: "1.05rem", color: "var(--navy)", margin: "0.3rem 0" }}>{event.name}</h3>
                      <div style={{ fontSize: "0.82rem", color: "var(--muted)" }}>📅 {event.date} &nbsp;&middot;&nbsp; 📍 {event.loc}</div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontSize: "0.82rem", fontWeight: 700, color: event.price === "Free" ? "var(--green)" : "var(--navy)" }}>{event.price}</div>
                      <Link href="#" style={{ display: "inline-block", background: "var(--navy)", color: "white", padding: "0.5rem 1.2rem", borderRadius: 6, fontSize: "0.78rem", fontWeight: 700, textDecoration: "none", marginTop: "0.5rem" }}>Details &rarr;</Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Sponsored */}
            <div style={{ background: "linear-gradient(135deg, rgba(233,30,140,0.04), rgba(233,30,140,0.08))", border: "1px solid rgba(233,30,140,0.18)", borderRadius: 16, padding: "1.5rem 2rem", marginBottom: "2rem" }}>
              <span style={{ fontSize: "0.62rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--pink)", display: "block", marginBottom: "0.6rem" }}>Sponsored</span>
              <div style={{ display: "flex", alignItems: "center", gap: "1.2rem", flexWrap: "wrap" }}>
                <div style={{ width: 48, height: 48, borderRadius: 10, background: "white", border: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.3rem", flexShrink: 0 }}>🀄</div>
                <div style={{ flex: 1, minWidth: 200 }}>
                  <div style={{ fontWeight: 700, fontSize: "0.95rem", color: "var(--navy)" }}>Las Vegas Mahjong — Weekly Open Play</div>
                  <div style={{ fontSize: "0.82rem", color: "var(--muted)", lineHeight: 1.5, marginTop: "0.2rem" }}>Join us every Tuesday evening for open play in Las Vegas. All levels welcome. No RSVP needed.</div>
                </div>
                <Link href="https://lasvegasmahj.com" target="_blank" style={{ background: "var(--pink)", color: "white", borderRadius: 6, padding: "0.6rem 1.4rem", fontWeight: 700, fontSize: "0.82rem", textDecoration: "none", whiteSpace: "nowrap" }}>Visit &rarr;</Link>
              </div>
            </div>

            {/* CTA */}
            <div style={{ background: "var(--navy)", borderRadius: 16, padding: "2.5rem", textAlign: "center" }}>
              <h3 style={{ fontFamily: "var(--font-playfair), 'Playfair Display', serif", fontSize: "1.3rem", color: "white", marginBottom: "0.5rem" }}>
                Host an event in Nevada?
              </h3>
              <p style={{ fontSize: "0.9rem", color: "rgba(255,255,255,0.55)", marginBottom: "1.5rem" }}>
                List your open play, tournament, or mahjong night starting at $10/event.
              </p>
              <Link href="/advertise" className="btn-cta-primary" style={{ padding: "0.9rem 2.5rem" }}>
                List Your Event &rarr;
              </Link>
            </div>
          </div>
        )}

        {/* ══════════ VENUES TAB ══════════ */}
        {activeTab === "venues" && (
          <div>
            <p className="section-label">Where to Play</p>
            <h2 className="section-title" style={{ marginBottom: "0.5rem" }}>Venues in Nevada</h2>
            <p style={{ fontSize: "1rem", color: "var(--muted)", marginBottom: "2rem", lineHeight: 1.7 }}>
              Restaurants, studios, and community spaces in Nevada that welcome mahjong players.
            </p>

            {/* Venue cards */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "2rem" }}>
              {SAMPLE_VENUES.map((venue) => (
                <div key={venue.name} className="venue-card">
                  <div className="venue-stripe" style={{ background: venue.color }} />
                  <div className="venue-body">
                    <div className="venue-type" style={{ color: venue.color }}>{venue.type} &middot; Nevada</div>
                    <h3 className="venue-name">{venue.name}</h3>
                    <p className="venue-meta">📍 {venue.city}, NV</p>
                    <p className="venue-desc">{venue.desc}</p>
                    <Link href="#" className="venue-btn" style={{ background: venue.color, color: "white" }}>Visit Website &rarr;</Link>
                  </div>
                </div>
              ))}
            </div>

            {/* Sponsored */}
            <div style={{ background: "linear-gradient(135deg, rgba(233,30,140,0.04), rgba(233,30,140,0.08))", border: "1px solid rgba(233,30,140,0.18)", borderRadius: 16, padding: "1.5rem 2rem", marginBottom: "2rem" }}>
              <span style={{ fontSize: "0.62rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--pink)", display: "block", marginBottom: "0.6rem" }}>Sponsored</span>
              <div style={{ display: "flex", alignItems: "center", gap: "1.2rem", flexWrap: "wrap" }}>
                <div style={{ width: 48, height: 48, borderRadius: 10, background: "white", border: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.3rem", flexShrink: 0 }}>🀄</div>
                <div style={{ flex: 1, minWidth: 200 }}>
                  <div style={{ fontWeight: 700, fontSize: "0.95rem", color: "var(--navy)" }}>Las Vegas Mahjong — Private Events</div>
                  <div style={{ fontSize: "0.82rem", color: "var(--muted)", lineHeight: 1.5, marginTop: "0.2rem" }}>Book a private mahjong party, corporate event, or group lesson at your venue or ours.</div>
                </div>
                <Link href="https://lasvegasmahj.com" target="_blank" style={{ background: "var(--pink)", color: "white", borderRadius: 6, padding: "0.6rem 1.4rem", fontWeight: 700, fontSize: "0.82rem", textDecoration: "none", whiteSpace: "nowrap" }}>Visit &rarr;</Link>
              </div>
            </div>

            {/* CTA */}
            <div style={{ background: "var(--navy)", borderRadius: 16, padding: "2.5rem", textAlign: "center" }}>
              <h3 style={{ fontFamily: "var(--font-playfair), 'Playfair Display', serif", fontSize: "1.3rem", color: "white", marginBottom: "0.5rem" }}>
                Own a mahjong-friendly venue?
              </h3>
              <p style={{ fontSize: "0.9rem", color: "rgba(255,255,255,0.55)", marginBottom: "1.5rem" }}>
                Get discovered by players searching for places to play. Listings start at $19/mo.
              </p>
              <Link href="/advertise" className="btn-cta-primary" style={{ padding: "0.9rem 2.5rem" }}>
                List Your Venue &rarr;
              </Link>
            </div>
          </div>
        )}

        {/* Nearby States */}
        <div style={{ marginTop: "3rem", padding: "2rem", background: "var(--bg)", border: "1px solid var(--border)", borderRadius: 16 }}>
          <h3 style={{ fontFamily: "var(--font-playfair), 'Playfair Display', serif", fontSize: "1.1rem", color: "var(--navy)", marginBottom: "1rem" }}>Explore Nearby States</h3>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.6rem" }}>
            {["California", "Arizona", "Utah", "Oregon", "Idaho", "Colorado"].map((state) => (
              <Link key={state} href="#" style={{ background: "white", border: "1.5px solid var(--border)", borderRadius: 50, padding: "0.5rem 1.2rem", fontSize: "0.85rem", fontWeight: 600, color: "var(--navy)", textDecoration: "none", transition: "all 0.2s" }}>
                {state}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
