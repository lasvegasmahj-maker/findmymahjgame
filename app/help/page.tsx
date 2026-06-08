import type { Metadata } from "next";
import { CONTACT_EMAIL, HELP_PHONE } from "@/lib/constants";

export const metadata: Metadata = {
  title: "I Need Help | Find My Mahj Game",
  description: "Need help finding or starting a mahjong game? Text us, call us, or read the simple steps.",
};

const card: React.CSSProperties = { display: "block", background: "white", border: "2px solid var(--border)", borderRadius: 16, padding: "1.3rem 1.4rem", marginBottom: "1rem", textDecoration: "none", color: "var(--navy)" };
const big: React.CSSProperties = { fontSize: "1.3rem", fontWeight: 800 };
const sub: React.CSSProperties = { fontSize: "1.05rem", color: "var(--muted)", marginTop: "0.3rem", lineHeight: 1.5 };

export default function HelpPage() {
  return (
    <main style={{ maxWidth: 560, margin: "0 auto", padding: "1.5rem 1.2rem 4rem" }}>
      <a href="/" style={{ fontSize: "1.05rem", color: "var(--pink)", fontWeight: 700, textDecoration: "none" }}>&larr; Home</a>
      <h1 style={{ fontSize: "2rem", color: "var(--navy)", margin: "0.8rem 0 1.2rem", fontFamily: "var(--font-playfair), 'Playfair Display', serif" }}>How can we help?</h1>

      {HELP_PHONE ? (
        <a href={`tel:${HELP_PHONE}`} style={card}>
          <div style={big}>📞  Call Us</div>
          <div style={sub}>Talk to a real person. {HELP_PHONE}</div>
        </a>
      ) : (
        <a href={`mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent("Please call me")}&body=${encodeURIComponent("Hi, please call me back. My number is: ")}`} style={card}>
          <div style={big}>📞  Call Us</div>
          <div style={sub}>Tap and we&rsquo;ll call you back. Leave your number and a good time.</div>
        </a>
      )}

      <a href={`mailto:${CONTACT_EMAIL}`} style={card}>
        <div style={big}>📧  Email us a question</div>
        <div style={sub}>We answer every message. {CONTACT_EMAIL}</div>
      </a>

      <a href="/play" style={card}>
        <div style={big}>🀄  Help me find a game</div>
        <div style={sub}>Tell us your town and we will find you a game.</div>
      </a>

      <div style={{ ...card, cursor: "default" }}>
        <div style={big}>▶  How to find a game</div>
        <div style={sub}>1) Tap &ldquo;I Want to Play.&rdquo; 2) Type your town. 3) Tap a game. 4) Tap &ldquo;Claim a Seat&rdquo; and add your name and phone or email. Done.</div>
      </div>

      <div style={{ ...card, cursor: "default" }}>
        <div style={big}>▶  How to start a table</div>
        <div style={sub}>1) Tap &ldquo;Start a Table.&rdquo; 2) Pick a day and time. 3) Add your name and number. 4) Share it with friends to fill the seats.</div>
      </div>

      <div style={{ ...card, cursor: "default", background: "var(--bg)" }}>
        <div style={big}>What is a &ldquo;table&rdquo;?</div>
        <div style={sub}>A table is a game of mahjong with 4 people. You can join one near you, or start your own and invite players.</div>
      </div>

      <a href={`mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent("Report a problem")}`} style={card}>
        <div style={big}>🚩  Report a Problem</div>
        <div style={sub}>See something wrong or someone behaving badly? Tell us and we&rsquo;ll look into it.</div>
      </a>
    </main>
  );
}
