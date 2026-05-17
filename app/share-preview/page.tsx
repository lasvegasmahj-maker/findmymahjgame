"use client";

import Link from "next/link";
import { useState } from "react";

const MOCK_PLAYER = {
  name: "Sandra M.",
  city: "Henderson",
  state: "NV",
  skill_level: "Intermediate",
  availability: "Weekday Mornings",
  bio: "Love playing American Mahjong! Looking for a fun group near Henderson.",
  avatar_color: "#e91e8c",
  state_slug: "nevada",
};

const SHARE_URL = `https://findmymahjgame.com/states/${MOCK_PLAYER.state_slug}`;

const SHARE_TEXT = `I just listed myself on Find My Mahj Game — the free directory connecting mahjong players across all 50 states! Looking for a game in ${MOCK_PLAYER.city}, ${MOCK_PLAYER.state}? Find me there. 🀄`;

export default function SharePreviewPage() {
  const [copied, setCopied] = useState(false);
  const [copiedText, setCopiedText] = useState(false);

  function copyLink() {
    navigator.clipboard.writeText(SHARE_URL);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function copyText() {
    navigator.clipboard.writeText(SHARE_TEXT + "\n\n" + SHARE_URL);
    setCopiedText(true);
    setTimeout(() => setCopiedText(false), 2000);
  }

  return (
    <div style={{ maxWidth: 560, margin: "4rem auto", padding: "0 1.5rem" }}>

      {/* Success header */}
      <div style={{ textAlign: "center", marginBottom: "2.5rem" }}>
        <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>🎉</div>
        <h1 style={{ fontFamily: "var(--font-playfair), 'Playfair Display', serif", fontSize: "1.8rem", color: "var(--navy)", marginBottom: "0.5rem" }}>
          You&rsquo;re listed!
        </h1>
        <p style={{ color: "var(--muted)", fontSize: "1rem", lineHeight: 1.7 }}>
          Players in {MOCK_PLAYER.city}, {MOCK_PLAYER.state} can now find you. Help grow the community by sharing your listing.
        </p>
      </div>

      {/* Player card preview */}
      <div style={{ background: "var(--bg)", border: "1px solid var(--border)", borderRadius: 16, padding: "1.4rem", marginBottom: "2rem" }}>
        <p style={{ fontSize: "0.72rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.12em", color: "var(--muted)", marginBottom: "0.8rem" }}>Your listing looks like this:</p>
        <div style={{ display: "flex", alignItems: "center", gap: "0.8rem", marginBottom: "0.8rem" }}>
          <div style={{ width: 42, height: 42, borderRadius: "50%", background: MOCK_PLAYER.avatar_color, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, color: "white", fontSize: "1rem", flexShrink: 0 }}>
            {MOCK_PLAYER.name.charAt(0)}
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: "0.92rem", color: "var(--navy)" }}>{MOCK_PLAYER.name}</div>
            <div style={{ fontSize: "0.78rem", color: "var(--muted)" }}>{MOCK_PLAYER.city}, {MOCK_PLAYER.state}</div>
          </div>
        </div>
        <span style={{ display: "inline-block", fontSize: "0.7rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", padding: "0.2rem 0.7rem", borderRadius: 50, background: "rgba(245,200,66,0.15)", color: "#a07800" }}>
          {MOCK_PLAYER.skill_level}
        </span>
        <div style={{ fontSize: "0.8rem", color: "var(--muted)", margin: "0.6rem 0 0.8rem" }}>📅 {MOCK_PLAYER.availability}</div>
        <p style={{ fontSize: "0.78rem", color: "var(--muted)", lineHeight: 1.5, marginBottom: "0.9rem" }}>{MOCK_PLAYER.bio}</p>
        <div style={{ width: "100%", border: "1.5px solid var(--pink)", color: "var(--pink)", borderRadius: 6, padding: "0.5rem", fontWeight: 700, fontSize: "0.8rem", textAlign: "center" }}>
          Connect
        </div>
      </div>

      {/* Share options */}
      <div style={{ background: "white", border: "1px solid var(--border)", borderRadius: 16, padding: "1.8rem", marginBottom: "1.5rem" }}>
        <h2 style={{ fontFamily: "var(--font-playfair), 'Playfair Display', serif", fontSize: "1.2rem", color: "var(--navy)", marginBottom: "1.2rem" }}>
          Share your listing
        </h2>

        {/* Copy link */}
        <div style={{ marginBottom: "1rem" }}>
          <div style={{ fontSize: "0.78rem", fontWeight: 700, color: "var(--navy)", marginBottom: "0.4rem", textTransform: "uppercase", letterSpacing: "0.08em" }}>Your state page</div>
          <div style={{ display: "flex", gap: "0.5rem" }}>
            <div style={{ flex: 1, background: "var(--bg)", border: "1px solid var(--border)", borderRadius: 6, padding: "0.6rem 0.9rem", fontSize: "0.85rem", color: "var(--muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {SHARE_URL}
            </div>
            <button onClick={copyLink} style={{ background: copied ? "var(--green)" : "var(--navy)", color: "white", border: "none", borderRadius: 6, padding: "0.6rem 1rem", fontWeight: 700, fontSize: "0.82rem", cursor: "pointer", fontFamily: "'DM Sans', sans-serif", whiteSpace: "nowrap", transition: "background 0.2s", minWidth: 90 }}>
              {copied ? "Copied!" : "Copy Link"}
            </button>
          </div>
        </div>

        {/* Pre-written post */}
        <div style={{ marginBottom: "1.2rem" }}>
          <div style={{ fontSize: "0.78rem", fontWeight: 700, color: "var(--navy)", marginBottom: "0.4rem", textTransform: "uppercase", letterSpacing: "0.08em" }}>Ready-to-post caption</div>
          <div style={{ background: "var(--bg)", border: "1px solid var(--border)", borderRadius: 8, padding: "0.9rem 1rem", fontSize: "0.85rem", color: "var(--muted)", lineHeight: 1.65, marginBottom: "0.5rem" }}>
            {SHARE_TEXT}
            <br /><br />
            <span style={{ color: "var(--pink)" }}>{SHARE_URL}</span>
          </div>
          <button onClick={copyText} style={{ width: "100%", background: copiedText ? "var(--green)" : "transparent", color: copiedText ? "white" : "var(--navy)", border: `1.5px solid ${copiedText ? "var(--green)" : "var(--border)"}`, borderRadius: 6, padding: "0.55rem", fontWeight: 700, fontSize: "0.82rem", cursor: "pointer", fontFamily: "'DM Sans', sans-serif", transition: "all 0.2s" }}>
            {copiedText ? "Copied!" : "Copy Caption + Link"}
          </button>
        </div>

        {/* Social share buttons */}
        <div style={{ fontSize: "0.78rem", fontWeight: 700, color: "var(--navy)", marginBottom: "0.6rem", textTransform: "uppercase", letterSpacing: "0.08em" }}>Share directly</div>
        <div style={{ display: "flex", gap: "0.6rem", flexWrap: "wrap" }}>
          <a
            href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(SHARE_URL)}&quote=${encodeURIComponent(SHARE_TEXT)}`}
            target="_blank" rel="noopener noreferrer"
            style={{ display: "flex", alignItems: "center", gap: "0.4rem", background: "#1877f2", color: "white", borderRadius: 6, padding: "0.55rem 1rem", fontSize: "0.82rem", fontWeight: 700, textDecoration: "none" }}>
            Facebook
          </a>
          <a
            href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(SHARE_TEXT + "\n\n" + SHARE_URL)}`}
            target="_blank" rel="noopener noreferrer"
            style={{ display: "flex", alignItems: "center", gap: "0.4rem", background: "#000", color: "white", borderRadius: 6, padding: "0.55rem 1rem", fontSize: "0.82rem", fontWeight: 700, textDecoration: "none" }}>
            X (Twitter)
          </a>
          <a
            href={`mailto:?subject=Find your mahjong game!&body=${encodeURIComponent(SHARE_TEXT + "\n\n" + SHARE_URL)}`}
            style={{ display: "flex", alignItems: "center", gap: "0.4rem", background: "var(--bg)", color: "var(--navy)", border: "1px solid var(--border)", borderRadius: 6, padding: "0.55rem 1rem", fontSize: "0.82rem", fontWeight: 700, textDecoration: "none" }}>
            Email a Friend
          </a>
        </div>
      </div>

      {/* What's next */}
      <div style={{ background: "var(--navy)", borderRadius: 16, padding: "1.8rem", textAlign: "center" }}>
        <p style={{ color: "rgba(255,255,255,0.7)", fontSize: "0.88rem", marginBottom: "1rem", lineHeight: 1.6 }}>
          Want to find a game in your area while you wait for players to connect with you?
        </p>
        <Link href={`/states/${MOCK_PLAYER.state_slug}`} style={{ background: "var(--pink)", color: "white", borderRadius: 6, padding: "0.7rem 1.8rem", fontWeight: 700, fontSize: "0.9rem", textDecoration: "none", display: "inline-block" }}>
          Browse {MOCK_PLAYER.state_slug.charAt(0).toUpperCase() + MOCK_PLAYER.state_slug.slice(1)} Players &rarr;
        </Link>
      </div>

      <p style={{ textAlign: "center", fontSize: "0.78rem", color: "var(--muted)", marginTop: "1.5rem" }}>
        This is a preview. <Link href="/list-my-game" style={{ color: "var(--pink)" }}>Create your real listing</Link>
      </p>
    </div>
  );
}
