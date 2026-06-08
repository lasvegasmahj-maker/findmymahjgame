"use client";

import { useState } from "react";
import SeatDots from "@/components/seat-dots";

const TIMES = ["Morning", "Afternoon", "Evening"];
const labelStyle: React.CSSProperties = { fontSize: "1.25rem", fontWeight: 800, color: "var(--navy)", margin: "1.6rem 0 0.7rem" };
const fieldStyle: React.CSSProperties = { width: "100%", minHeight: 56, padding: "0.8rem 1rem", border: "2px solid var(--border)", borderRadius: 12, fontSize: "1.15rem", fontFamily: "'DM Sans', sans-serif", color: "var(--navy)", background: "white", outline: "none" };
const bigBtn = (ready: boolean): React.CSSProperties => ({ width: "100%", minHeight: 68, marginTop: "1.5rem", borderRadius: 16, border: "none", background: ready ? "var(--pink)" : "#d9b3cc", color: "white", fontSize: "1.4rem", fontWeight: 800, cursor: ready ? "pointer" : "not-allowed", fontFamily: "'DM Sans', sans-serif" });

type Game = { share_code: string; day_of_week: string | null; time_of_day: string | null; venue_name: string | null; city: string | null; state: string | null; skill: string | null; seats_total: number; filled: number };

export default function PlayClient() {
  const [step, setStep] = useState<"where" | "results" | "capture" | "done">("where");
  const [city, setCity] = useState("");
  const [games, setGames] = useState<Game[]>([]);
  const [searching, setSearching] = useState(false);

  // capture fields
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [timePref, setTimePref] = useState("");
  const [status, setStatus] = useState<"idle" | "submitting" | "error">("idle");
  const [err, setErr] = useState("");
  const [geoMsg, setGeoMsg] = useState("");

  async function runFind(town: string) {
    setSearching(true); setGeoMsg("");
    const res = await fetch(`/api/tables/find?city=${encodeURIComponent(town.trim())}`);
    const d = await res.json().catch(() => ({ tables: [] }));
    setSearching(false);
    if ((d.tables || []).length > 0) { setGames(d.tables); setStep("results"); }
    else { setStep("capture"); }
  }

  async function findGames(e: React.FormEvent) {
    e.preventDefault();
    if (city.trim()) runFind(city);
  }

  function useMyLocation() {
    setGeoMsg("");
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setGeoMsg("Location isn't available on this device. Please type your town.");
      return;
    }
    setSearching(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const { latitude, longitude } = pos.coords;
          const r = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`);
          const g = await r.json();
          const town = g.city || g.locality || g.principalSubdivision || "";
          if (!town) { setSearching(false); setGeoMsg("We couldn't find your town. Please type it below."); return; }
          setCity(town);
          runFind(town);
        } catch {
          setSearching(false);
          setGeoMsg("Something went wrong. Please type your town below.");
        }
      },
      () => { setSearching(false); setGeoMsg("We couldn't get your location. Please type your town below."); },
      { timeout: 10000 }
    );
  }

  async function submitCapture(e: React.FormEvent) {
    e.preventDefault();
    setStatus("submitting"); setErr("");
    const res = await fetch("/api/want-to-play", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, phone, email, city, timePref }),
    });
    if (res.ok) { setStep("done"); return; }
    const d = await res.json().catch(() => ({}));
    setErr(d.error || "Something went wrong. Please try again."); setStatus("error");
  }

  const shell = (children: React.ReactNode) => (
    <main style={{ maxWidth: 560, margin: "0 auto", padding: "1.5rem 1.2rem 4rem" }}>
      <a href="/" style={{ fontSize: "1.05rem", color: "var(--pink)", fontWeight: 700, textDecoration: "none" }}>&larr; Back</a>
      {children}
    </main>
  );

  // STEP 1: where
  if (step === "where") {
    return shell(
      <>
        <h1 style={{ fontSize: "2rem", color: "var(--navy)", margin: "0.8rem 0 0.3rem", fontFamily: "var(--font-playfair), 'Playfair Display', serif" }}>I Want to Play</h1>
        <p style={{ fontSize: "1.15rem", color: "var(--muted)", lineHeight: 1.5 }}>Find a game near you.</p>
        <button type="button" onClick={useMyLocation} disabled={searching} style={{ width: "100%", minHeight: 68, marginTop: "1.4rem", borderRadius: 16, border: "none", background: "var(--navy)", color: "white", fontSize: "1.3rem", fontWeight: 800, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>
          {searching ? "Looking..." : "📍 Use My Location"}
        </button>
        <div style={{ textAlign: "center", color: "var(--muted)", fontSize: "1.05rem", margin: "1rem 0 0.2rem" }}>or type your town</div>
        {geoMsg && <p style={{ color: "#dc2626", fontSize: "1.05rem", textAlign: "center", marginTop: 0 }}>{geoMsg}</p>}
        <form onSubmit={findGames}>
          <input style={fieldStyle} placeholder="Town or city" value={city} onChange={(e) => setCity(e.target.value)} />
          <button type="submit" disabled={!city.trim() || searching} style={bigBtn(!!city.trim())}>{searching ? "Looking..." : "Find a Game"}</button>
        </form>
      </>
    );
  }

  // STEP 2: results (games found)
  if (step === "results") {
    return shell(
      <>
        <h1 style={{ fontSize: "1.8rem", color: "var(--navy)", margin: "0.8rem 0 0.3rem", fontFamily: "var(--font-playfair), 'Playfair Display', serif" }}>Games near {city}</h1>
        <p style={{ fontSize: "1.1rem", color: "var(--muted)" }}>Tap a game to join it.</p>
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem", marginTop: "1.2rem" }}>
          {games.map((g) => {
            const title = `${g.day_of_week || ""} ${g.time_of_day || ""} Mahjong`.trim();
            const place = [g.venue_name, g.city].filter(Boolean).join(", ");
            return (
              <a key={g.share_code} href={`/t/${g.share_code}`} style={{ display: "block", background: "white", border: (g.seats_total || 4) - g.filled === 1 ? "2px solid var(--pink)" : "2px solid var(--border)", borderRadius: 16, padding: "1.3rem", textDecoration: "none" }}>
                {(g.seats_total || 4) - g.filled === 1 && <div style={{ display: "inline-block", background: "var(--pink)", color: "white", fontWeight: 800, fontSize: "0.95rem", padding: "0.25rem 0.8rem", borderRadius: 50, marginBottom: "0.6rem" }}>🔥 Need a 4th, 1 seat left</div>}
                <div style={{ fontSize: "1.4rem", fontWeight: 800, color: "var(--navy)" }}>{title}</div>
                {place && <div style={{ fontSize: "1.1rem", color: "var(--muted)", margin: "0.3rem 0 0.8rem" }}>📍 {place}</div>}
                <SeatDots filled={g.filled} total={g.seats_total || 4} size="1.3rem" />
                <div style={{ marginTop: "0.8rem", color: "var(--pink)", fontWeight: 800, fontSize: "1.1rem" }}>Join this game &rarr;</div>
              </a>
            );
          })}
        </div>
        <div style={{ marginTop: "1.6rem", textAlign: "center" }}>
          <p style={{ fontSize: "1.05rem", color: "var(--muted)" }}>Don&rsquo;t see your game?</p>
          <a href="/start" style={{ display: "inline-block", color: "var(--pink)", fontWeight: 800, fontSize: "1.15rem", margin: "0.4rem 0" }}>Start your own table &rarr;</a><br />
          <button type="button" onClick={() => setStep("capture")} style={{ background: "none", border: "none", color: "var(--pink)", fontWeight: 700, fontSize: "1.05rem", cursor: "pointer", textDecoration: "underline" }}>Or tell us when a new game opens</button>
        </div>
      </>
    );
  }

  // STEP 4: done
  if (step === "done") {
    return shell(
      <div style={{ textAlign: "center", paddingTop: "2rem" }}>
        <div style={{ fontSize: "3rem" }}>🀄</div>
        <h1 style={{ fontSize: "1.9rem", color: "var(--navy)", fontFamily: "var(--font-playfair), 'Playfair Display', serif" }}>You&rsquo;re on the list!</h1>
        <p style={{ fontSize: "1.2rem", color: "var(--navy)", lineHeight: 1.6 }}>We&rsquo;ll reach out as soon as there&rsquo;s a game near {city}. Want one sooner? <a href="/start" style={{ color: "var(--pink)", fontWeight: 700 }}>Start your own table</a> and invite friends.</p>
      </div>
    );
  }

  // STEP 3: capture (no games found, or user asked to be notified)
  const ready = !!(name.trim() && (phone.trim() || email.trim()) && city.trim());
  return shell(
    <>
      <h1 style={{ fontSize: "1.9rem", color: "var(--navy)", margin: "0.8rem 0 0.3rem", fontFamily: "var(--font-playfair), 'Playfair Display', serif" }}>No games in {city} yet</h1>
      <p style={{ fontSize: "1.15rem", color: "var(--muted)", lineHeight: 1.5 }}>Be the first to know. We&rsquo;ll reach out the moment a game opens near you, or <a href="/start" style={{ color: "var(--pink)", fontWeight: 700 }}>start your own</a>.</p>
      <form onSubmit={submitCapture}>
        <div style={labelStyle}>Your name</div>
        <input style={fieldStyle} placeholder="First name" value={name} onChange={(e) => setName(e.target.value)} />
        <div style={labelStyle}>How can we reach you?</div>
        <input style={fieldStyle} type="tel" inputMode="tel" placeholder="Mobile number" value={phone} onChange={(e) => setPhone(e.target.value)} />
        <input style={{ ...fieldStyle, marginTop: "0.7rem" }} type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
        <p style={{ fontSize: "0.95rem", color: "var(--muted)", marginTop: "0.5rem" }}>Add a phone, an email, or both. We never show it to anyone.</p>
        <div style={labelStyle}>Best time? <span style={{ fontWeight: 400, color: "var(--muted)", fontSize: "1rem" }}>(optional)</span></div>
        <div style={{ display: "flex", gap: "0.6rem", flexWrap: "wrap" }}>
          {TIMES.map((t) => (
            <button key={t} type="button" onClick={() => setTimePref(timePref === t ? "" : t)} style={{ minHeight: 54, padding: "0.6rem 1.1rem", borderRadius: 12, cursor: "pointer", fontSize: "1.1rem", fontWeight: 700, fontFamily: "'DM Sans', sans-serif", border: timePref === t ? "2.5px solid var(--pink)" : "2px solid var(--border)", background: timePref === t ? "var(--pink)" : "white", color: timePref === t ? "white" : "var(--navy)" }}>{t}</button>
          ))}
        </div>
        {err && <p style={{ color: "#dc2626", fontSize: "1.05rem", marginTop: "1rem" }}>{err}</p>}
        <button type="submit" disabled={!ready || status === "submitting"} style={bigBtn(ready)}>{status === "submitting" ? "Sending..." : "Tell Me When a Game Opens"}</button>
      </form>
    </>
  );
}
