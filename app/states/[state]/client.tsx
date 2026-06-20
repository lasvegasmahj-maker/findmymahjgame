"use client";

import { useRef, useState, useEffect } from "react";
import Link from "next/link";
import type { StateData } from "@/lib/states-data";
import TeacherCard from "@/components/teacher-card";

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
  host: string | null;
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
  const [failed, setFailed] = useState(false);
  if (src && !failed) {
    return (
      // Plain img: logo_url is an arbitrary advertiser host, which next/image
      // rejects unless every host is whitelisted in next.config.
      <div style={{ width: 48, height: 48, borderRadius: 10, overflow: "hidden", border: "1px solid var(--border)", flexShrink: 0, background: "white", position: "relative" }}>
        <img
          src={src}
          alt={name}
          loading="lazy"
          onError={() => setFailed(true)}
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
        />
      </div>
    );
  }
  const initial = name.trim().charAt(0).toUpperCase();
  return (
    <div style={{ width: 48, height: 48, borderRadius: 10, background: "var(--navy)", border: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.25rem", fontWeight: 700, color: "white", flexShrink: 0 }}>{initial}</div>
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
    open_play: { label: "Open Play", color: "var(--green-dark)" },
    lesson: { label: "Lesson", color: "var(--pink-text)" },
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
  const [activeTab, setActiveTab] = useState<"players" | "events" | "teachers">("players");
  const [selectedCities, setSelectedCities] = useState<string[]>([]);
  const [cityMenuOpen, setCityMenuOpen] = useState(false);
  const cityMenuRef = useRef<HTMLDivElement | null>(null);
  const [eventSort, setEventSort] = useState<"date" | "city">("date");
  // Empty selection means "all of the state"; otherwise filter to the chosen cities.
  const cityMatch = (c: string | null | undefined) =>
    selectedCities.length === 0 || selectedCities.some((sc) => sc.toLowerCase() === String(c || "").trim().toLowerCase());
  const toggleCity = (city: string) =>
    setSelectedCities((prev) => (prev.includes(city) ? prev.filter((c) => c !== city) : [...prev, city]));
  const cityLabel = selectedCities.length === 0
    ? `All of ${stateData.name}`
    : selectedCities.length === 1 ? selectedCities[0] : `${selectedCities.length} areas selected`;
  const [connectForm, setConnectForm] = useState<ConnectForm | null>(null);
  const connectDialogRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    if (connectForm) connectDialogRef.current?.querySelector<HTMLInputElement>("input")?.focus();
  }, [connectForm?.player.id]);
  useEffect(() => {
    if (!cityMenuOpen) return;
    const onDoc = (e: MouseEvent) => {
      if (cityMenuRef.current && !cityMenuRef.current.contains(e.target as Node)) setCityMenuOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [cityMenuOpen]);

  useEffect(() => {
    if (!connectForm) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setConnectForm(null); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [connectForm]);

  async function handleConnectSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!connectForm) return;
    setConnectForm({ ...connectForm, submitting: true });
    try {
      const res = await fetch("/api/connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          player_id: connectForm.player.id,
          name: connectForm.name,
          email: connectForm.email,
          message: connectForm.message,
        }),
      });
      if (!res.ok) throw new Error("send failed");

      setConnectForm({ ...connectForm, submitting: false, submitted: true });
    } catch {
      window.alert("We could not send your request. Please check your connection and try again.");
      setConnectForm((c) => (c ? { ...c, submitting: false } : c));
    }
  }

  // Filter by the selected cities (empty selection = all of the state).
  const filteredPlayers = players.filter(p => cityMatch(p.city));
  const filteredEvents = events.filter(e => cityMatch(e.city));

  const byEventDate = (a: typeof events[number], b: typeof events[number]) => {
    const da = a.event_date ? new Date(a.event_date).getTime() : Infinity;
    const db = b.event_date ? new Date(b.event_date).getTime() : Infinity;
    return da - db;
  };
  const eventsByDate = [...filteredEvents].sort(byEventDate);
  const eventsByCity = Object.entries(
    filteredEvents.reduce<Record<string, typeof filteredEvents>>((acc, e) => {
      const c = (e.city || "").trim() || "Other";
      (acc[c] ||= []).push(e);
      return acc;
    }, {})
  )
    .map(([city, evs]) => [city, [...evs].sort(byEventDate)] as [string, typeof filteredEvents])
    .sort((a, b) => a[0].localeCompare(b[0]));

  const renderEventCard = (event: typeof events[number]) => (
    <div key={event.id} style={{ background: "var(--bg)", border: "1px solid var(--border)", borderRadius: 16, padding: "1.5rem 2rem" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <EventTypeBadge type={event.event_type} />
          <h3 style={{ fontWeight: 700, fontSize: "1.05rem", color: "var(--navy)", margin: "0.3rem 0" }}>{event.event_name}</h3>
          <div style={{ fontSize: "0.82rem", color: "var(--muted)" }}>
            {formatEventDate(event.event_date)}
            {event.venue && <> &nbsp;&middot;&nbsp;{event.venue}, {event.city}</>}
          </div>
          {event.host && <div style={{ fontSize: "0.82rem", color: "var(--muted)", marginTop: "0.3rem" }}>Hosted by {event.host}</div>}
          {event.description && <div style={{ fontSize: "0.82rem", color: "var(--muted)", marginTop: "0.4rem", lineHeight: 1.5 }}>{event.description}</div>}
        </div>
        <div style={{ textAlign: "right", flexShrink: 0 }}>
          {event.price && <div style={{ fontSize: "0.88rem", fontWeight: 700, color: event.price.toLowerCase() === "free" ? "var(--green)" : "var(--navy)", marginBottom: "0.5rem" }}>{event.price}</div>}
          {event.registration_url ? (
            <a href={event.registration_url} target="_blank" rel="noopener noreferrer" style={{ display: "inline-block", background: "var(--navy)", color: "white", padding: "0.5rem 1.2rem", borderRadius: 6, fontSize: "0.78rem", fontWeight: 700, textDecoration: "none" }}>Register &rarr;</a>
          ) : (
            <Link href="/contact" style={{ display: "inline-block", background: "var(--navy)", color: "white", padding: "0.5rem 1.2rem", borderRadius: 6, fontSize: "0.78rem", fontWeight: 700, textDecoration: "none" }}>Details &rarr;</Link>
          )}
        </div>
      </div>
    </div>
  );

  // Instructors/teachers are stored in venue_listings; surface them on the Teachers tab.
  const TEACHER_TYPE = /instructor|teacher|lesson|studio|school|class/i;
  const teacherVenues = venues.filter(v => TEACHER_TYPE.test(`${v.venue_type || ""} ${v.description || ""}`));
  const filteredTeachers = teacherVenues.filter(v => cityMatch(v.city));

  return (
    <>
      {/* Hero */}
      <section className="page-hero" style={{ padding: "3.5rem 2rem" }}>
        <p style={{ fontSize: "0.82rem", color: "rgba(255,255,255,0.5)", marginBottom: "1.2rem" }}>
          <Link href="/" style={{ color: "var(--pink-text)", textDecoration: "none" }}>Home</Link>
          {" "}&rsaquo;{" "}
          <Link href="/#map" style={{ color: "var(--pink-text)", textDecoration: "none" }}>Find Players</Link>
          {" "}&rsaquo; {stateData.name}
        </p>
        <h1 style={{ fontSize: "clamp(2.2rem, 5vw, 3.5rem)", marginBottom: "0.8rem" }}>Mahjong in <span style={{ color: "var(--pink-text)" }}>{stateData.name}</span>
        </h1>
        <p style={{ maxWidth: 520 }}>{stateData.desc}</p>
        {players.length + events.length + teacherVenues.length > 0 ? (
          <div style={{ display: "flex", gap: "3rem", justifyContent: "center", marginTop: "2.5rem", flexWrap: "wrap" }}>
            {[
              { num: players.length, label: "Players Listed" },
              { num: events.length, label: "Events" },
              { num: teacherVenues.length, label: "Teachers" },
            ].map((s) => (
              <div key={s.label} style={{ textAlign: "center" }}>
                <div style={{ fontFamily: "var(--font-playfair), 'Playfair Display', serif", fontSize: "2rem", color: "white", fontWeight: 900 }}>{s.num}</div>
                <div style={{ fontSize: "0.78rem", color: "rgba(255,255,255,0.5)", marginTop: "0.2rem" }}>{s.label}</div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ marginTop: "2.5rem" }}>
            <p style={{ color: "rgba(255,255,255,0.75)", maxWidth: 480, margin: "0 auto 1.5rem" }}>Be one of the first players listed in {stateData.name}. It is free to join, and we will help you find a game.</p>
            <Link href="/list-my-game" className="btn-cta-primary" style={{ padding: "0.9rem 2.5rem" }}>Create My Free Listing &rarr;</Link>
          </div>
        )}
      </section>

      {/* Search Bar */}
      <div style={{ background: "var(--navy)", padding: "1.5rem 2rem", borderTop: "1px solid rgba(255,255,255,0.1)" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", display: "flex", alignItems: "flex-end", gap: "1.5rem", flexWrap: "wrap", justifyContent: "center" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
            <div style={{ fontSize: "0.7rem", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "rgba(255,255,255,0.5)" }}>City / Town</div>
            <div ref={cityMenuRef} style={{ position: "relative", minWidth: 220 }}>
              <button type="button" onClick={() => setCityMenuOpen((o) => !o)} aria-haspopup="true" aria-expanded={cityMenuOpen ? "true" : "false"} style={{ width: "100%", background: "white", border: "none", borderRadius: 6, padding: "0.7rem 1.2rem", fontFamily: "'DM Sans', sans-serif", fontSize: "0.9rem", color: "var(--navy)", outline: "none", cursor: "pointer", textAlign: "left", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "0.6rem" }}>
                <span>{cityLabel}</span>
                <span aria-hidden="true" style={{ color: "var(--muted)" }}>&#9662;</span>
              </button>
              {cityMenuOpen && (
                <div role="group" aria-label={`Filter by city in ${stateData.name}`} style={{ position: "absolute", top: "calc(100% + 6px)", left: 0, right: 0, zIndex: 70, background: "white", border: "1px solid var(--border)", borderRadius: 10, boxShadow: "0 12px 32px rgba(26,31,94,0.18)", padding: "0.4rem", maxHeight: 280, overflowY: "auto" }}>
                  <button type="button" onClick={() => setSelectedCities([])} style={{ display: "flex", alignItems: "center", gap: "0.6rem", width: "100%", textAlign: "left", padding: "0.55rem 0.7rem", border: "none", borderRadius: 8, background: "transparent", cursor: "pointer", fontFamily: "'DM Sans', sans-serif", fontSize: "0.9rem", color: "var(--navy)", fontWeight: selectedCities.length === 0 ? 800 : 500 }}>
                    <span style={{ width: 18, height: 18, borderRadius: 4, border: "2px solid var(--border)", background: selectedCities.length === 0 ? "var(--pink)" : "white", borderColor: selectedCities.length === 0 ? "var(--pink)" : "var(--border)", display: "inline-flex", alignItems: "center", justifyContent: "center", color: "white", fontSize: "0.7rem", flexShrink: 0 }}>{selectedCities.length === 0 ? "✓" : ""}</span>
                    All of {stateData.name}
                  </button>
                  {stateData.cities.map((city) => {
                    const checked = selectedCities.includes(city);
                    return (
                      <label key={city} style={{ display: "flex", alignItems: "center", gap: "0.6rem", width: "100%", padding: "0.55rem 0.7rem", borderRadius: 8, cursor: "pointer", fontFamily: "'DM Sans', sans-serif", fontSize: "0.9rem", color: "var(--navy)" }}>
                        <input type="checkbox" checked={checked} onChange={() => toggleCity(city)} style={{ position: "absolute", opacity: 0, width: 1, height: 1 }} />
                        <span style={{ width: 18, height: 18, borderRadius: 4, border: "2px solid", borderColor: checked ? "var(--pink)" : "var(--border)", background: checked ? "var(--pink)" : "white", display: "inline-flex", alignItems: "center", justifyContent: "center", color: "white", fontSize: "0.7rem", flexShrink: 0 }}>{checked ? "✓" : ""}</span>
                        {city}
                      </label>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
        <p style={{ textAlign: "center", marginTop: "1rem", fontSize: "0.82rem", color: "rgba(255,255,255,0.55)" }}>{selectedCities.length === 0 ? (<>Showing players, events &amp; teachers across <strong style={{ color: "white" }}>{stateData.name}</strong></>) : (<>Showing players, events &amp; teachers in <strong style={{ color: "white" }}>{selectedCities.join(", ")}</strong></>)}
        </p>
      </div>

      {/* Main Content */}
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "3rem 2rem" }}>
        {/* Tabs */}
        <div style={{ display: "flex", gap: 0, borderBottom: "2px solid var(--border)", marginBottom: "2.5rem", overflowX: "auto" }}>
          {([
            { id: "players" as const, label: "Players", count: filteredPlayers.length },
            { id: "events" as const, label: "Events", count: filteredEvents.length },
            { id: "teachers" as const, label: "Teachers", count: filteredTeachers.length },
          ]).map((tab) => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)} aria-pressed={activeTab === tab.id ? "true" : "false"} style={{ padding: "1rem 1.4rem", flexShrink: 0, whiteSpace: "nowrap", fontSize: "1.05rem", fontWeight: activeTab === tab.id ? 800 : 600, cursor: "pointer", background: "transparent", border: "none", borderBottom: "3px solid", borderBottomColor: activeTab === tab.id ? "var(--pink)" : "transparent", marginBottom: -2, color: activeTab === tab.id ? "var(--navy)" : "var(--muted)", fontFamily: "'DM Sans', sans-serif", transition: "all 0.2s", display: "flex", alignItems: "center", gap: "0.4rem" }}>
              {tab.label}
              {tab.count > 0 && <span style={{ background: "var(--pink)", color: "white", borderRadius: 50, fontSize: "0.8rem", fontWeight: 700, padding: "0.12rem 0.55rem", minWidth: 22, textAlign: "center" }}>{tab.count}</span>}
            </button>
          ))}
        </div>

        {/* ══════════ PLAYERS TAB ══════════ */}
        {activeTab === "players" && (
          <div>
            <p className="section-label">Looking for a Group</p>
            <h2 className="section-title" style={{ marginBottom: "0.5rem" }}>Players in {stateData.name}</h2>
            <p style={{ fontSize: "1rem", color: "var(--muted)", marginBottom: "0.6rem", lineHeight: 1.7 }}>Connect with mahjong players across {stateData.name} looking for their perfect weekly game.
            </p>
            <p style={{ fontSize: "0.9rem", color: "var(--muted)", marginBottom: "2rem", lineHeight: 1.7 }}>Always free for players. We pass your message along privately, and your email is never shown publicly or sold.
            </p>

            {filteredPlayers.length > 0 ? (
              <div className="dir-grid" style={{ marginBottom: "2rem" }}>
                {filteredPlayers.map((player, i) => (
                  <div key={player.id} style={{ background: "var(--bg)", border: "1px solid var(--border)", borderRadius: 16, padding: "1.6rem", transition: "all 0.2s", display: "flex", flexDirection: "column" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.8rem", marginBottom: "0.8rem" }}>
                      <div style={{ width: 42, height: 42, borderRadius: "50%", background: player.avatar_color || AVATAR_COLORS[i % AVATAR_COLORS.length], display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, color: "white", fontSize: "1rem", flexShrink: 0 }}>
                        {player.name.charAt(0)}
                      </div>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: "1.05rem", color: "var(--navy)" }}>{player.name}</div>
                        <div style={{ fontSize: "0.92rem", color: "var(--muted)" }}>{player.city}, {player.state}</div>
                      </div>
                    </div>
                    <LevelBadge level={player.skill_level} />
                    {player.availability && <div style={{ fontSize: "0.95rem", color: "var(--muted)", margin: "0.6rem 0 0.5rem" }}>{player.availability}</div>}
                    {player.bio && <div style={{ fontSize: "0.95rem", color: "var(--muted)", lineHeight: 1.5, marginBottom: "0.5rem", flex: 1 }}>{player.bio}</div>}
                    <div style={{ flex: 1 }} />
                    <button
                      onClick={() => setConnectForm({ player, name: "", email: "", message: "", submitted: false, submitting: false })}
                      style={{ width: "100%", background: "var(--pink)", border: "1.5px solid var(--pink)", color: "white", borderRadius: 10, padding: "0.75rem", fontWeight: 800, fontSize: "1rem", cursor: "pointer", fontFamily: "'DM Sans', sans-serif", transition: "all 0.2s", marginTop: "0.9rem" }}
                    >Connect
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ background: "var(--bg)", border: "2px dashed var(--border)", borderRadius: 20, padding: "4rem 2rem", textAlign: "center", marginBottom: "2.5rem" }}>
                <h3 style={{ fontFamily: "var(--font-playfair), 'Playfair Display', serif", fontSize: "1.4rem", color: "var(--navy)", marginBottom: "0.8rem" }}>No players listed in {stateData.name} yet
                </h3>
                <p style={{ fontSize: "1rem", color: "var(--muted)", marginBottom: "2rem", maxWidth: 420, marginLeft: "auto", marginRight: "auto", lineHeight: 1.7 }}>Be the first! Create a free listing and let other players in {stateData.name} find you.
                </p>
                <Link href="/list-my-game" className="btn-cta-primary" style={{ padding: "0.9rem 2.5rem" }}>Create My Free Listing &rarr;
                </Link>
              </div>
            )}

            {/* Las Vegas Mahjong — sponsored only on Nevada */}
            {stateData.abbr === "NV" && (
              <div style={{ background: "linear-gradient(135deg, rgba(233,30,140,0.04), rgba(233,30,140,0.08))", border: "1px solid rgba(233,30,140,0.18)", borderRadius: 16, padding: "1.5rem 2rem", marginBottom: "2rem" }}>
                <span style={{ fontSize: "0.62rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--pink-text)", display: "block", marginBottom: "0.8rem" }}>Sponsored</span>
                <div style={{ display: "flex", alignItems: "flex-start", gap: "1.2rem", flexWrap: "wrap" }}>
                  <SponsorLogo src={null} name="Las Vegas Mahjong" />
                  <div style={{ flex: 1, minWidth: 200 }}>
                    <div style={{ fontWeight: 700, fontSize: "0.95rem", color: "var(--navy)", marginBottom: "0.3rem" }}>Las Vegas Mahjong</div>
                    <div style={{ fontSize: "0.82rem", color: "var(--muted)", lineHeight: 1.6, marginBottom: "0.6rem" }}>Lessons, open play and events with certified instructor Shauna in Las Vegas. All levels welcome.</div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "0.8rem" }}>
                      <a href="https://lasvegasmahj.com" target="_blank" rel="noopener noreferrer" style={{ fontSize: "0.8rem", color: "var(--pink-text)", textDecoration: "none", fontWeight: 600 }}>lasvegasmahj.com</a>
                      <a href="mailto:lasvegasmahj@gmail.com" style={{ fontSize: "0.8rem", color: "var(--pink-text)", textDecoration: "none", fontWeight: 600 }}>lasvegasmahj@gmail.com</a>
                      <a href="https://instagram.com/lasvegasmahjong" target="_blank" rel="noopener noreferrer" style={{ fontSize: "0.8rem", color: "var(--pink-text)", textDecoration: "none", fontWeight: 600 }}>@lasvegasmahjong</a>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div style={{ background: "var(--navy)", borderRadius: 16, padding: "2.5rem", textAlign: "center" }}>
              <h3 style={{ fontFamily: "var(--font-playfair), 'Playfair Display', serif", fontSize: "1.3rem", color: "white", marginBottom: "0.5rem" }}>Can&rsquo;t find a game in {stateData.name}?
              </h3>
              <p style={{ fontSize: "0.9rem", color: "rgba(255,255,255,0.55)", marginBottom: "1.5rem" }}>Add your free listing and let local players find you. It&rsquo;s always free.
              </p>
              <Link href="/list-my-game" className="btn-cta-primary" style={{ padding: "0.9rem 2.5rem" }}>Create My Free Listing &rarr;
              </Link>
            </div>
          </div>
        )}

        {/* ══════════ EVENTS TAB ══════════ */}
        {activeTab === "events" && (
          <div>
            <p className="section-label">Happening in {stateData.name}</p>
            <h2 className="section-title" style={{ marginBottom: "0.5rem" }}>Events Near You</h2>
            <p style={{ fontSize: "1rem", color: "var(--muted)", marginBottom: "2rem", lineHeight: 1.7 }}>Open plays, game nights, and mahjong events happening across {stateData.name}.
            </p>

            {filteredEvents.length > 0 ? (
              <>
                {eventsByCity.length > 1 && (
                  <div style={{ display: "flex", gap: "0.9rem", alignItems: "center", marginBottom: "1.4rem" }}>
                    <span style={{ fontSize: "0.9rem", color: "var(--muted)", fontWeight: 700 }}>Sort:</span>
                    {(["date", "city"] as const).map((k) => (
                      <button key={k} type="button" onClick={() => setEventSort(k)} style={{ background: "none", border: "none", cursor: "pointer", fontFamily: "'DM Sans', sans-serif", fontSize: "0.95rem", fontWeight: 700, color: eventSort === k ? "var(--pink-text)" : "var(--muted)", borderBottom: eventSort === k ? "2px solid var(--pink)" : "2px solid transparent", paddingBottom: "0.1rem" }}>{k === "date" ? "By date" : "By city"}</button>
                    ))}
                  </div>
                )}
                {eventSort === "city" && eventsByCity.length > 1 ? (
                  <div style={{ display: "flex", flexDirection: "column", gap: "1.8rem", marginBottom: "2rem" }}>
                    {eventsByCity.map(([city, evs]) => (
                      <div key={city}>
                        <h3 style={{ fontFamily: "var(--font-playfair), 'Playfair Display', serif", fontSize: "1.15rem", color: "var(--navy)", margin: "0 0 0.8rem", paddingBottom: "0.4rem", borderBottom: "2px solid var(--border)" }}>{city}</h3>
                        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                          {evs.map(renderEventCard)}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: "1rem", marginBottom: "2rem" }}>
                    {eventsByDate.map(renderEventCard)}
                  </div>
                )}
              </>
            ) : (
              <div style={{ background: "var(--bg)", border: "2px dashed var(--border)", borderRadius: 20, padding: "4rem 2rem", textAlign: "center", marginBottom: "2rem" }}>
                <h3 style={{ fontFamily: "var(--font-playfair), 'Playfair Display', serif", fontSize: "1.4rem", color: "var(--navy)", marginBottom: "0.8rem" }}>No events listed yet</h3>
                <p style={{ fontSize: "1rem", color: "var(--muted)", marginBottom: "2rem", maxWidth: 450, marginLeft: "auto", marginRight: "auto", lineHeight: 1.7 }}>Host an open play, tournament, or mahjong night? List it and reach players searching for games.
                </p>
                <Link href="/advertise" className="btn-cta-primary" style={{ padding: "0.9rem 2.5rem" }}>List Your Event &rarr;</Link>
              </div>
            )}

          </div>
        )}

        {/* ══════════ TEACHERS TAB ══════════ */}
        {activeTab === "teachers" && (
          <div>
            <p className="section-label">Learn to Play</p>
            <h2 className="section-title" style={{ marginBottom: "0.5rem" }}>Teachers in {stateData.name}</h2>
            <p style={{ fontSize: "1rem", color: "var(--muted)", marginBottom: "2rem", lineHeight: 1.7 }}>American Mahjong instructors offering lessons in {stateData.name}. You contact them directly.
            </p>

            {filteredTeachers.length > 0 ? (
              <>
                <div className="dir-grid" style={{ marginBottom: "2rem" }}>
                  {filteredTeachers.map((venue) => <TeacherCard key={venue.id} t={venue} />)}
                </div>
                <div style={{ textAlign: "center", marginBottom: "2.5rem" }}>
                  <p style={{ fontSize: "0.95rem", color: "var(--muted)", marginBottom: "0.8rem" }}>Teach mahjong in {stateData.name}?</p>
                  <Link href="/get-listed?type=Mahjong%20Instructor" style={{ display: "inline-flex", minHeight: 52, alignItems: "center", justifyContent: "center", padding: "0 1.6rem", borderRadius: 14, background: "var(--navy)", color: "white", fontWeight: 800, fontSize: "1.05rem", textDecoration: "none" }}>Want to add your lessons? &rarr;</Link>
                </div>
              </>
            ) : (
              <div style={{ background: "var(--bg)", border: "2px dashed var(--border)", borderRadius: 20, padding: "4rem 2rem", textAlign: "center", marginBottom: "2rem" }}>
                <h3 style={{ fontFamily: "var(--font-playfair), 'Playfair Display', serif", fontSize: "1.4rem", color: "var(--navy)", marginBottom: "0.8rem" }}>No teachers listed yet</h3>
                <p style={{ fontSize: "1rem", color: "var(--muted)", marginBottom: "2rem", maxWidth: 450, marginLeft: "auto", marginRight: "auto", lineHeight: 1.7 }}>Teach American Mahjong in {stateData.name}? Get in front of players looking to learn.
                </p>
                <Link href="/get-listed?type=Mahjong%20Instructor" className="btn-cta-primary" style={{ padding: "0.9rem 2.5rem" }}>List your lessons &rarr;</Link>
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
            ref={connectDialogRef} role="dialog" aria-modal="true" aria-label={`Connect with ${connectForm.player.name}`}
            onClick={e => e.stopPropagation()}
            style={{ background: "white", borderRadius: 20, padding: "2.5rem", maxWidth: 480, width: "100%", position: "relative", boxShadow: "0 20px 60px rgba(26,31,94,0.25)" }}
          >
            {/* Close */}
            <button aria-label="Close" onClick={() => setConnectForm(null)} style={{ position: "absolute", top: "1rem", right: "1rem", background: "var(--bg)", border: "1px solid var(--border)", borderRadius: "50%", width: 32, height: 32, cursor: "pointer", fontSize: "1.1rem", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'DM Sans', sans-serif" }}>×</button>

            {connectForm.submitted ? (
              <div style={{ textAlign: "center", padding: "1rem 0" }}>
                <h3 style={{ fontFamily: "var(--font-playfair), 'Playfair Display', serif", fontSize: "1.4rem", color: "var(--navy)", marginBottom: "0.5rem" }}>Request Sent!</h3>
                <p style={{ color: "var(--muted)", fontSize: "0.95rem", lineHeight: 1.7 }}>Your request was sent straight to <strong>{connectForm.player.name}</strong>. If it&rsquo;s a good match, they&rsquo;ll reply right to your email.
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
                    <p style={{ fontSize: "0.72rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.12em", color: "var(--pink-text)", marginBottom: "0.2rem" }}>Connect with</p>
                    <h3 style={{ fontFamily: "var(--font-playfair), 'Playfair Display', serif", fontSize: "1.3rem", color: "var(--navy)", margin: 0 }}>{connectForm.player.name}</h3>
                    <p style={{ fontSize: "0.8rem", color: "var(--muted)", margin: 0 }}>{connectForm.player.city}, {connectForm.player.state} &middot; <LevelBadge level={connectForm.player.skill_level} /></p>
                  </div>
                </div>

                <form onSubmit={handleConnectSubmit}>
                  <div style={{ marginBottom: "1rem" }}>
                    <label htmlFor="connect-name" style={{ display: "block", fontSize: "0.82rem", fontWeight: 700, color: "var(--navy)", marginBottom: "0.4rem" }}>Your Name</label>
                    <input
                      id="connect-name" type="text" required placeholder="Jane Smith" value={connectForm.name}
                      onChange={e => setConnectForm({ ...connectForm, name: e.target.value })}
                      style={{ width: "100%", padding: "0.7rem 1rem", border: "1.5px solid var(--border)", borderRadius: 8, fontFamily: "'DM Sans', sans-serif", fontSize: "0.9rem", outline: "none", color: "var(--text)" }}
                    />
                  </div>
                  <div style={{ marginBottom: "1rem" }}>
                    <label htmlFor="connect-email" style={{ display: "block", fontSize: "0.82rem", fontWeight: 700, color: "var(--navy)", marginBottom: "0.4rem" }}>Your Email</label>
                    <input
                      id="connect-email" type="email" required placeholder="jane@example.com" value={connectForm.email}
                      onChange={e => setConnectForm({ ...connectForm, email: e.target.value })}
                      style={{ width: "100%", padding: "0.7rem 1rem", border: "1.5px solid var(--border)", borderRadius: 8, fontFamily: "'DM Sans', sans-serif", fontSize: "0.9rem", outline: "none", color: "var(--text)" }}
                    />
                  </div>
                  <div style={{ marginBottom: "1.5rem" }}>
                    <label htmlFor="connect-message" style={{ display: "block", fontSize: "0.82rem", fontWeight: 700, color: "var(--navy)", marginBottom: "0.4rem" }}>Message <span style={{ fontWeight: 400, color: "var(--muted)" }}>(optional)</span></label>
                    <textarea
                      id="connect-message" placeholder={`Hi ${connectForm.player.name.split(" ")[0]}! I'm looking for a mahjong group in ${connectForm.player.city}...`}
                      value={connectForm.message}
                      onChange={e => setConnectForm({ ...connectForm, message: e.target.value })}
                      style={{ width: "100%", padding: "0.7rem 1rem", border: "1.5px solid var(--border)", borderRadius: 8, fontFamily: "'DM Sans', sans-serif", fontSize: "0.9rem", outline: "none", color: "var(--text)", height: 100, resize: "vertical" }}
                    />
                  </div>
                  <button
                    type="submit" disabled={connectForm.submitting}
                    style={{ width: "100%", background: "var(--pink)", color: "white", border: "none", borderRadius: 8, padding: "0.9rem", fontWeight: 700, fontSize: "1rem", cursor: connectForm.submitting ? "not-allowed" : "pointer", fontFamily: "'DM Sans', sans-serif", opacity: connectForm.submitting ? 0.7 : 1 }}
                  >
                    {connectForm.submitting ? "Sending..." : "Send Connection Request →"}
                  </button>
                  <p style={{ fontSize: "0.75rem", color: "var(--muted)", textAlign: "center", marginTop: "0.8rem" }}>Free for players. Your email is never shown publicly or sold. Your request goes straight to {connectForm.player.name.split(" ")[0]}, who can reply to you directly.
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
