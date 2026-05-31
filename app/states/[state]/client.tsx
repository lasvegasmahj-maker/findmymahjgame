"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import type { StateData } from "@/lib/states-data";

interface Player {
  id: string;
  name: string;
  city: string;
  state: string;
  skill_level: string;
  availability: string | null;
  bio: string | null;
  avatar_color: string;
}

interface Event {
  id: string;
  event_name: string;
  event_type: string;
  city: string;
  state: string;
  venue: string | null;
  description: string | null;
  event_date: string | null;
  price: string | null;
  registration_url: string | null;
  tier: string;
}

interface Venue {
  id: string;
  business_name: string;
  venue_type: string;
  city: string;
  state: string;
  description: string | null;
  website: string | null;
  instagram: string | null;
  display_email: string | null;
  logo_url: string | null;
  tier: string;
}

interface Props {
  stateData: StateData;
  players: Player[];
  events: Event[];
  venues: Venue[];
}

function SponsorLogo({ src, name }: { src: string | null; name: string }) {
  if (src) {
    return (
      // next/image handles lazy loading, WebP conversion, and explicit dimensions
      // which eliminates the CLS caused by unsized <img> tags.
      <div style={{ width: 48, height: 48, borderRadius: 10, overflow: "hidden", border: "1px solid var(--border)", flexShrink: 0, background: "white", position: "relative" }}>
        <Image
          src={src}
          alt={name}
          fill
          sizes="48px"
          style={{ objectFit: "cover" }}
        />
      </div>
    );
  }
  const initial = name.trim().charAt(0).toUpperCase();
  return (
    <div style={{ width: 48, height: 48, borderRadius: 10, background: "var(--navy)", border: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.25rem", fontWeight: 700, color: "white", flexShrink: 0 }}>{initial || "🀄"}</div>
  );
}

function LevelBadge({ level }: { level: string }) {
  const bg = level === "beginner" ? "rgba(46,201,92,0.1)" : level === "intermediate" ? "rgba(245,200,66,0.15)" : "rgba(233,30,140,0.1)";
  const color = level === "beginner" ? "#1a9648" : level === "intermediate" ? "#a07800" : "var(--pink)";
  const label = level.charAt(0).toUpperCase() + level.slice(1);
  return (
    <span style={{ display: "inline-block", fontSize: "0.7rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", padding: "0.2rem 0.7rem", borderRadius: 50, background: bg, color }}>{label}</span>
  );
}

function formatEventDate(dateStr: string | null) {
  if (!dateStr) return "TBD";
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function EventTypeBadge({ type }: { type: string }) {
  const labels: Record<string, { label: string; color: string }> = {
    open_play: { label: "Open Play", color: "var(--green)" },
    lesson: { label: "Lesson", color: "var(--pink)" },
    tournament: { label: "Tournament", color: "var(--navy)" },
    retreat: { label: "Retreat", color: "#7c5cbf" },
    social: { label: "Social", color: "#00c9b1" },
  };
  const t = labels[type] || { label: type, color: "var(--muted)" };
  return <span style={{ fontSize: "0.7rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: t.color }}>{t.label}</span>;
}

const AVATAR_COLORS = ["#e91e8c","#2ec95c","#f5c842","#7c5cbf","#00c9b1","#1a1f5e","#e91e8c"];

interface ConnectForm {
  player: Player;
  name: string;
  email: string;
  message: string;
  submitted: boolean;
  submitting: boolean;
}

export default function StatePageClient({ stateData, players, events, venues }: Props) {
  const [activeTab, setActiveTab] = useState<"players" | "events" | "venues">("players");
  const [selectedCity, setSelectedCity] = useState(`All of ${stateData.name}`);
  const allCities = [`All of ${stateData.name}`, ...stateData.cities];
  const [connectForm, setConnectForm] = useState<ConnectForm | null>(null);

  async function handleConnectSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!connectForm) return;
    setConnectForm({ ...connectForm, submitting: true });

    await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/inquiries`, {
      method: "POST",
      headers: {
        "apikey": process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        "Authorization": `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!}`,
        "Content-Type": "application/json",
        "Prefer": "return=minimal",
      },
      body: JSON.stringify({
        name: connectForm.name,
        email: connectForm.email,
        inquiry_type: "player_connect",
        interest: `Connect with ${connectForm.player.name} in ${connectForm.player.city}, ${connectForm.player.state}`,
        message: connectForm.message,
        status: "new",
      }),
    });

    await fetch("/api/notify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: "connect",
        subject: `New Connect Request: ${connectForm.name} wants to play with ${connectForm.player.name}`,
        body: `From: ${connectForm.name} (${connectForm.email})\nPlayer: ${connectForm.player.name} — ${connectForm.player.city}, ${connectForm.player.state}\nSkill Level: ${connectForm.player.skill_level}\n\nMessage:\n${connectForm.message || "(no message)"}`,
      }),
    });

    setConnectForm({ ...connectForm, submitting: false, submitted: true });
  }

  // Filter by city if selected
  const filteredPlayers = selectedCity === `All of ${stateData.name}`
    ? players
    : players.filter(p => p.city.toLowerCase() === selectedCity.toLowerCase());

  const filteredEvents = selectedCity === `All of ${stateData.name}`
    ? events
    : events.filter(e => e.city.toLowerCase() === selectedCity.toLowerCase());

  const filteredVenues = selectedCity === `All of ${stateData.name}`
    ? venues
    : venues.filter(v => v.city.toLowerCase() === selectedCity.toLowerCase());

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
            { num: players.length || "—", label: "Players Listed" },
            { num: events.length || "—", label: "Events" },
            { num: venues.length || "—", label: "Venues" },
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
            { id: "players" as const, label: "Players", icon: "👥", count: filteredPlayers.length },
            { id: "events" as const, label: "Events", icon: "🎫", count: filteredEvents.length },
            { id: "venues" as const, label: "Where to Play", icon: "🏛", count: filteredVenues.length },
          ]).map((tab) => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{ padding: "0.9rem 1.8rem", fontSize: "0.95rem", fontWeight: 600, cursor: "pointer", background: "transparent", border: "none", borderBottom: "2px solid", borderBottomColor: activeTab === tab.id ? "var(--pink)" : "transparent", marginBottom: -2, color: activeTab === tab.id ? "var(--navy)" : "var(--muted)", fontFamily: "'DM Sans', sans-serif", transition: "all 0.2s", display: "flex", alignItems: "center", gap: "0.4rem" }}>
              {tab.icon} {tab.label}
              {tab.count > 0 && <span style={{ background: "var(--pink)", color: "white", borderRadius: 50, fontSize: "0.65rem", fontWeight: 700, padding: "0.1rem 0.5rem", minWidth: 18, textAlign: "center" }}>{tab.count}</span>}
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

            {filteredPlayers.length > 0 ? (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "2rem" }}>
                {filteredPlayers.map((player, i) => (
                  <div key={player.id} style={{ background: "var(--bg)", border: "1px solid var(--border)", borderRadius: 16, padding: "1.4rem", transition: "all 0.2s", display: "flex", flexDirection: "column" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.8rem", marginBottom: "0.8rem" }}>
                      <div style={{ width: 42, height: 42, borderRadius: "50%", background: player.avatar_color || AVATAR_COLORS[i % AVATAR_COLORS.length], display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, color: "white", fontSize: "1rem", flexShrink: 0 }}>
                        {player.name.charAt(0)}
                      </div>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: "0.92rem", color: "var(--navy)" }}>{player.name}</div>
                        <div style={{ fontSize: "0.78rem", color: "var(--muted)" }}>{player.city}, {player.state}</div>
                      </div>
                    </div>
                    <LevelBadge level={player.skill_level} />
                    {player.availability && <div style={{ fontSize: "0.8rem", color: "var(--muted)", margin: "0.6rem 0 0.5rem" }}>📅 {player.availability}</div>}
                    {player.bio && <div style={{ fontSize: "0.78rem", color: "var(--muted)", lineHeight: 1.5, marginBottom: "0.5rem", flex: 1 }}>{player.bio}</div>}
                    <div style={{ flex: 1 }} />
                    <button
                      onClick={() => setConnectForm({ player, name: "", email: "", message: "", submitted: false, submitting: false })}
                      style={{ width: "100%", background: "transparent", border: "1.5px solid var(--pink)", color: "var(--pink)", borderRadius: 6, padding: "0.55rem", fontWeight: 700, fontSize: "0.8rem", cursor: "pointer", fontFamily: "'DM Sans', sans-serif", transition: "all 0.2s", marginTop: "0.8rem" }}
                      onMouseOver={e => { (e.target as HTMLButtonElement).style.background = "var(--pink)"; (e.target as HTMLButtonElement).style.color = "white"; }}
                      onMouseOut={e => { (e.target as HTMLButtonElement).style.background = "transparent"; (e.target as HTMLButtonElement).style.color = "var(--pink)"; }}
                    >
                      Connect
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ background: "var(--bg)", border: "2px dashed var(--border)", borderRadius: 20, padding: "4rem 2rem", textAlign: "center", marginBottom: "2.5rem" }}>
                <div style={{ fontSize: "3.5rem", marginBottom: "1.2rem" }}>🀄</div>
                <h3 style={{ fontFamily: "var(--font-playfair), 'Playfair Display', serif", fontSize: "1.4rem", color: "var(--navy)", marginBottom: "0.8rem" }}>
                  No players listed in {stateData.name} yet
                </h3>
                <p style={{ fontSize: "1rem", color: "var(--muted)", marginBottom: "2rem", maxWidth: 420, marginLeft: "auto", marginRight: "auto", lineHeight: 1.7 }}>
                  Be the first! Create a free listing and let other players in {stateData.name} find you.
                </p>
                <Link href="/list-my-game" className="btn-cta-primary" style={{ padding: "0.9rem 2.5rem" }}>
                  Create My Free Listing &rarr;
                </Link>
              </div>
            )}

            {/* Las Vegas Mahjong — sponsored only on Nevada */}
            {stateData.abbr === "NV" && (
              <div style={{ background: "linear-gradient(135deg, rgba(233,30,140,0.04), rgba(233,30,140,0.08))", border: "1px solid rgba(233,30,140,0.18)", borderRadius: 16, padding: "1.5rem 2rem", marginBottom: "2rem" }}>
                <span style={{ fontSize: "0.62rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--pink)", display: "block", marginBottom: "0.8rem" }}>Sponsored</span>
                <div style={{ display: "flex", alignItems: "flex-start", gap: "1.2rem", flexWrap: "wrap" }}>
                  <SponsorLogo src="https://lasvegasmahj.com/logo.png" name="Las Vegas Mahjong" />
                  <div style={{ flex: 1, minWidth: 200 }}>
                    <div style={{ fontWeight: 700, fontSize: "0.95rem", color: "var(--navy)", marginBottom: "0.3rem" }}>Las Vegas Mahjong</div>
                    <div style={{ fontSize: "0.82rem", color: "var(--muted)", lineHeight: 1.6, marginBottom: "0.6rem" }}>Lessons, open play and events with certified instructor Shauna in Las Vegas. All levels welcome.</div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "0.8rem" }}>
                      <a href="https://lasvegasmahj.com" target="_blank" rel="noopener noreferrer" style={{ fontSize: "0.8rem", color: "var(--pink)", textDecoration: "none", fontWeight: 600 }}>🌐 lasvegasmahj.com</a>
                      <a href="mailto:lasvegasmahj@gmail.com" style={{ fontSize: "0.8rem", color: "var(--pink)", textDecoration: "none", fontWeight: 600 }}>✉️ lasvegasmahj@gmail.com</a>
                      <a href="https://instagram.com/lasvegasmahjong" target="_blank" rel="noopener noreferrer" style={{ fontSize: "0.8rem", color: "var(--pink)", textDecoration: "none", fontWeight: 600 }}>📸 @lasvegasmahjong</a>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div style={{ background: "var(--navy)", borderRadius: 16, padding: "2.5rem", textAlign: "center" }}>
              <h3 style={{ fontFamily: "var(--font-playfair), 'Playfair Display', serif", fontSize: "1.3rem", color: "white", marginBottom: "0.5rem" }}>
                Want to be listed here? It&rsquo;s free!
              </h3>
              <p style={{ fontSize: "0.9rem", color: "rgba(255,255,255,0.55)", marginBottom: "1.5rem" }}>
                Add your free listing and let local players in {stateData.name} find you.
              </p>
              <Link href="/list-my-game" className="btn-cta-primary" style={{ padding: "0.9rem 2.5rem" }}>
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

            {filteredEvents.length > 0 ? (
              <div style={{ display: "flex", flexDirection: "column", gap: "1rem", marginBottom: "2rem" }}>
                {filteredEvents.map((event) => (
                  <div key={event.id} style={{ background: "var(--bg)", border: "1px solid var(--border)", borderRadius: 16, padding: "1.5rem 2rem", transition: "all 0.2s", cursor: "pointer" }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "1rem" }}>
                      <div>
                        <EventTypeBadge type={event.event_type} />
                        <h3 style={{ fontWeight: 700, fontSize: "1.05rem", color: "var(--navy)", margin: "0.3rem 0" }}>{event.event_name}</h3>
                        <div style={{ fontSize: "0.82rem", color: "var(--muted)" }}>
                          📅 {formatEventDate(event.event_date)}
                          {event.venue && <> &nbsp;&middot;&nbsp; 📍 {event.venue}, {event.city}</>}
                        </div>
                        {event.description && <div style={{ fontSize: "0.82rem", color: "var(--muted)", marginTop: "0.4rem", lineHeight: 1.5 }}>{event.description}</div>}
                      </div>
                      <div style={{ textAlign: "right", flexShrink: 0 }}>
                        <div style={{ fontSize: "0.88rem", fontWeight: 700, color: event.price === "Free" ? "var(--green)" : "var(--navy)", marginBottom: "0.5rem" }}>{event.price || "Free"}</div>
                        {event.registration_url ? (
                          <a href={event.registration_url} target="_blank" rel="noopener noreferrer" style={{ display: "inline-block", background: "var(--navy)", color: "white", padding: "0.5rem 1.2rem", borderRadius: 6, fontSize: "0.78rem", fontWeight: 700, textDecoration: "none" }}>Register &rarr;</a>
                        ) : (
                          <Link href="/contact" style={{ display: "inline-block", background: "var(--navy)", color: "white", padding: "0.5rem 1.2rem", borderRadius: 6, fontSize: "0.78rem", fontWeight: 700, textDecoration: "none" }}>Details &rarr;</Link>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ background: "var(--bg)", border: "2px dashed var(--border)", borderRadius: 20, padding: "4rem 2rem", textAlign: "center", marginBottom: "2rem" }}>
                <div style={{ fontSize: "3.5rem", marginBottom: "1.2rem" }}>🎫</div>
                <h3 style={{ fontFamily: "var(--font-playfair), 'Playfair Display', serif", fontSize: "1.4rem", color: "var(--navy)", marginBottom: "0.8rem" }}>No events listed yet</h3>
                <p style={{ fontSize: "1rem", color: "var(--muted)", marginBottom: "2rem", maxWidth: 450, marginLeft: "auto", marginRight: "auto", lineHeight: 1.7 }}>
                  Host an open play, tournament, or mahjong night? List it and reach players searching for games. Starting at $10/event.
                </p>
                <Link href="/advertise" className="btn-cta-primary" style={{ padding: "0.9rem 2.5rem" }}>List Your Event &rarr;</Link>
              </div>
            )}

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

            {filteredVenues.length > 0 ? (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "2rem" }}>
                {filteredVenues.map((venue) => (
                  <div key={venue.id} className="venue-card">
                    {venue.logo_url
                      ? (
                        <div style={{ position: "relative", width: "100%", height: 80 }}>
                          <Image
                            src={venue.logo_url}
                            alt={venue.business_name}
                            fill
                            sizes="(max-width: 768px) 100vw, 50vw"
                            style={{ objectFit: "cover" }}
                          />
                        </div>
                      )
                      : <div className="venue-stripe" style={{ background: "var(--pink)" }} />
                    }
                    <div className="venue-body">
                      <div className="venue-type" style={{ color: "var(--pink)" }}>{venue.venue_type} &middot; {venue.city}</div>
                      <h3 className="venue-name">{venue.business_name}</h3>
                      <p className="venue-meta">📍 {venue.city}, {venue.state}</p>
                      {venue.description && <p className="venue-desc">{venue.description}</p>}
                      <div style={{ display: "flex", flexWrap: "wrap", gap: "0.6rem", alignItems: "center", marginBottom: "0.9rem" }}>
                        {venue.display_email && (
                          <a href={`mailto:${venue.display_email}`} style={{ fontSize: "0.78rem", color: "var(--pink)", textDecoration: "none", fontWeight: 600 }}>✉️ {venue.display_email}</a>
                        )}
                        {venue.instagram && (
                          <a href={`https://instagram.com/${venue.instagram.replace("@","")}`} target="_blank" rel="noopener noreferrer" style={{ fontSize: "0.78rem", color: "var(--pink)", textDecoration: "none", fontWeight: 600 }}>📸 {venue.instagram.startsWith("@") ? venue.instagram : `@${venue.instagram}`}</a>
                        )}
                      </div>
                      {venue.website ? (
                        <a href={venue.website} target="_blank" rel="noopener noreferrer" className="venue-btn" style={{ background: "var(--pink)", color: "white" }}>Visit Website &rarr;</a>
                      ) : venue.instagram ? (
                        <a href={`https://instagram.com/${venue.instagram.replace("@","")}`} target="_blank" rel="noopener noreferrer" className="venue-btn" style={{ background: "var(--pink)", color: "white" }}>Visit Instagram &rarr;</a>
                      ) : (
                        <Link href={`/contact?venue=${encodeURIComponent(venue.business_name)}`} className="venue-btn" style={{ background: "var(--pink)", color: "white" }}>Get Info &rarr;</Link>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ background: "var(--bg)", border: "2px dashed var(--border)", borderRadius: 20, padding: "4rem 2rem", textAlign: "center", marginBottom: "2rem" }}>
                <div style={{ fontSize: "3.5rem", marginBottom: "1.2rem" }}>🏛</div>
                <h3 style={{ fontFamily: "var(--font-playfair), 'Playfair Display', serif", fontSize: "1.4rem", color: "var(--navy)", marginBottom: "0.8rem" }}>No venues listed yet</h3>
                <p style={{ fontSize: "1rem", color: "var(--muted)", marginBottom: "2rem", maxWidth: 450, marginLeft: "auto", marginRight: "auto", lineHeight: 1.7 }}>
                  Own a mahjong-friendly venue? Get discovered by players searching for places to play. Listings from $19/mo.
                </p>
                <Link href="/advertise" className="btn-cta-primary" style={{ padding: "0.9rem 2.5rem" }}>List Your Venue &rarr;</Link>
              </div>
            )}

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

      {/* ══════════ CONNECT MODAL ══════════ */}
      {connectForm && (
        <div
          onClick={() => setConnectForm(null)}
          style={{ position: "fixed", inset: 0, background: "rgba(26,31,94,0.6)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: "1.5rem" }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{ background: "white", borderRadius: 20, padding: "2.5rem", maxWidth: 480, width: "100%", position: "relative", boxShadow: "0 20px 60px rgba(26,31,94,0.25)" }}
          >
            {/* Close */}
            <button onClick={() => setConnectForm(null)} style={{ position: "absolute", top: "1rem", right: "1rem", background: "var(--bg)", border: "1px solid var(--border)", borderRadius: "50%", width: 32, height: 32, cursor: "pointer", fontSize: "1.1rem", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'DM Sans', sans-serif" }}>×</button>

            {connectForm.submitted ? (
              <div style={{ textAlign: "center", padding: "1rem 0" }}>
                <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>✅</div>
                <h3 style={{ fontFamily: "var(--font-playfair), 'Playfair Display', serif", fontSize: "1.4rem", color: "var(--navy)", marginBottom: "0.5rem" }}>Request Sent!</h3>
                <p style={{ color: "var(--muted)", fontSize: "0.95rem", lineHeight: 1.7 }}>
                  Your connection request to <strong>{connectForm.player.name}</strong> has been received. We&rsquo;ll pass your message along and you&rsquo;ll hear back via email.
                </p>
                <button onClick={() => setConnectForm(null)} style={{ marginTop: "1.5rem", background: "var(--pink)", color: "white", border: "none", borderRadius: 8, padding: "0.8rem 2rem", fontWeight: 700, fontSize: "0.95rem", cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>Done</button>
              </div>
            ) : (
              <>
                {/* Header */}
                <div style={{ display: "flex", alignItems: "center", gap: "0.9rem", marginBottom: "1.5rem" }}>
                  <div style={{ width: 48, height: 48, borderRadius: "50%", background: connectForm.player.avatar_color || "#e91e8c", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, color: "white", fontSize: "1.2rem", flexShrink: 0 }}>
                    {connectForm.player.name.charAt(0)}
                  </div>
                  <div>
                    <p style={{ fontSize: "0.72rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.12em", color: "var(--pink)", marginBottom: "0.2rem" }}>Connect with</p>
                    <h3 style={{ fontFamily: "var(--font-playfair), 'Playfair Display', serif", fontSize: "1.3rem", color: "var(--navy)", margin: 0 }}>{connectForm.player.name}</h3>
                    <p style={{ fontSize: "0.8rem", color: "var(--muted)", margin: 0 }}>{connectForm.player.city}, {connectForm.player.state} &middot; <LevelBadge level={connectForm.player.skill_level} /></p>
                  </div>
                </div>

                <form onSubmit={handleConnectSubmit}>
                  <div style={{ marginBottom: "1rem" }}>
                    <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 700, color: "var(--navy)", marginBottom: "0.4rem" }}>Your Name</label>
                    <input
                      type="text" required placeholder="Jane Smith"
                      value={connectForm.name}
                      onChange={e => setConnectForm({ ...connectForm, name: e.target.value })}
                      style={{ width: "100%", padding: "0.7rem 1rem", border: "1.5px solid var(--border)", borderRadius: 8, fontFamily: "'DM Sans', sans-serif", fontSize: "0.9rem", outline: "none", color: "var(--text)" }}
                    />
                  </div>
                  <div style={{ marginBottom: "1rem" }}>
                    <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 700, color: "var(--navy)", marginBottom: "0.4rem" }}>Your Email</label>
                    <input
                      type="email" required placeholder="jane@example.com"
                      value={connectForm.email}
                      onChange={e => setConnectForm({ ...connectForm, email: e.target.value })}
                      style={{ width: "100%", padding: "0.7rem 1rem", border: "1.5px solid var(--border)", borderRadius: 8, fontFamily: "'DM Sans', sans-serif", fontSize: "0.9rem", outline: "none", color: "var(--text)" }}
                    />
                  </div>
                  <div style={{ marginBottom: "1.5rem" }}>
                    <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 700, color: "var(--navy)", marginBottom: "0.4rem" }}>Message <span style={{ fontWeight: 400, color: "var(--muted)" }}>(optional)</span></label>
                    <textarea
                      placeholder={`Hi ${connectForm.player.name.split(" ")[0]}! I'm looking for a mahjong group in ${connectForm.player.city}...`}
                      value={connectForm.message}
                      onChange={e => setConnectForm({ ...connectForm, message: e.target.value })}
                      style={{ width: "100%", padding: "0.7rem 1rem", border: "1.5px solid var(--border)", borderRadius: 8, fontFamily: "'DM Sans', sans-serif", fontSize: "0.9rem", outline: "none", color: "var(--text)", height: 100, resize: "vertical" }}
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={connectForm.submitting}
                    style={{ width: "100%", background: "var(--pink)", color: "white", border: "none", borderRadius: 8, padding: "0.9rem", fontWeight: 700, fontSize: "1rem", cursor: connectForm.submitting ? "not-allowed" : "pointer", fontFamily: "'DM Sans', sans-serif", opacity: connectForm.submitting ? 0.7 : 1 }}
                  >
                    {connectForm.submitting ? "Sending..." : "Send Connection Request →"}
                  </button>
                  <p style={{ fontSize: "0.75rem", color: "var(--muted)", textAlign: "center", marginTop: "0.8rem" }}>
                    Free for players. We&rsquo;ll pass your request along to {connectForm.player.name.split(" ")[0]}.
                  </p>
                </form>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
