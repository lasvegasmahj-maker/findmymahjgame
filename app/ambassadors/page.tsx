import type { Metadata } from "next";
import AmbassadorForm from "./ambassadors-form";

export const metadata: Metadata = {
  title: "Become a Founding Ambassador | Find My Mahj Game",
  description:
    "Help build the mahjong community in your city. Founding Ambassadors help players find safe, public games and form real tables. Teachers, hosts, organizers, and club leaders welcome.",
  alternates: { canonical: "https://findmymahjgame.com/ambassadors" },
};

const point: React.CSSProperties = { display: "flex", gap: "0.9rem", alignItems: "flex-start", marginBottom: "1.1rem" };
const check: React.CSSProperties = { flexShrink: 0, width: 30, height: 30, borderRadius: 999, background: "var(--green)", color: "white", fontWeight: 800, fontSize: "1rem", display: "flex", alignItems: "center", justifyContent: "center", marginTop: 2 };
const pointText: React.CSSProperties = { fontSize: "1.15rem", color: "var(--navy)", lineHeight: 1.5 };

export default function AmbassadorsPage() {
  return (
    <main style={{ maxWidth: 620, margin: "0 auto", padding: "1.5rem 1.2rem 4rem" }}>
      <a href="/" style={{ fontSize: "1.05rem", color: "var(--pink)", fontWeight: 700, textDecoration: "none" }}>&larr; Home</a>

      <div style={{ display: "inline-block", marginTop: "1rem", background: "rgba(245,200,66,0.18)", color: "#8a6d00", fontWeight: 800, fontSize: "0.9rem", letterSpacing: "0.05em", textTransform: "uppercase", padding: "0.4rem 0.9rem", borderRadius: 999 }}>
        Founding Ambassador Program
      </div>

      <h1 style={{ fontSize: "2.2rem", color: "var(--navy)", margin: "0.9rem 0 0.6rem", fontFamily: "var(--font-playfair), 'Playfair Display', serif", lineHeight: 1.15 }}>
        Help build the mahjong community in your city
      </h1>
      <p style={{ fontSize: "1.2rem", color: "var(--muted)", lineHeight: 1.6, marginBottom: "1.8rem" }}>
        Founding Ambassadors are the trusted teachers, hosts, and organizers who make real games happen. If you bring players together, we want your help, and we want to support you.
      </p>

      <div style={{ background: "white", border: "2px solid var(--border)", borderRadius: 18, padding: "1.6rem 1.5rem", marginBottom: "1.6rem" }}>
        <h2 style={{ fontSize: "1.3rem", color: "var(--navy)", margin: "0 0 1.2rem", fontWeight: 800 }}>What ambassadors do</h2>
        <div style={point}><span style={check}>&#10003;</span><span style={pointText}><strong>Help players find safe, public games.</strong> New groups meet in public places like libraries and community centers, never home addresses.</span></div>
        <div style={point}><span style={check}>&#10003;</span><span style={pointText}><strong>Help form real tables that actually meet.</strong> Connect the players you already know and help fill empty seats.</span></div>
        <div style={point}><span style={check}>&#10003;</span><span style={pointText}><strong>Grow the game in your city.</strong> Welcome beginners, support hosts, and keep tables coming back.</span></div>
      </div>

      <div style={{ background: "var(--bg)", borderRadius: 18, padding: "1.4rem 1.5rem", marginBottom: "1.6rem" }}>
        <h2 style={{ fontSize: "1.15rem", color: "var(--navy)", margin: "0 0 0.5rem", fontWeight: 800 }}>Who we are looking for</h2>
        <p style={{ fontSize: "1.1rem", color: "var(--muted)", lineHeight: 1.6, margin: 0 }}>
          Teachers, hosts, organizers, and club leaders. If you can bring even a few players together, you can be a Founding Ambassador.
        </p>
      </div>

      <div style={{ background: "white", border: "2px solid var(--border)", borderRadius: 18, padding: "1.6rem 1.5rem", marginBottom: "2.2rem" }}>
        <h2 style={{ fontSize: "1.3rem", color: "var(--navy)", margin: "0 0 1.2rem", fontWeight: 800 }}>What ambassadors receive</h2>
        <div style={point}><span style={check}>&#10003;</span><span style={pointText}>Recognition as a Founding Ambassador.</span></div>
        <div style={point}><span style={check}>&#10003;</span><span style={pointText}>Early access to new Find My Mahj Game tools.</span></div>
        <div style={point}><span style={check}>&#10003;</span><span style={pointText}>A direct line to the FMG team.</span></div>
        <div style={point}><span style={check}>&#10003;</span><span style={pointText}>A real say in how mahjong grows in your city.</span></div>
        <div style={{ ...point, marginBottom: 0 }}><span style={check}>&#10003;</span><span style={pointText}>Optional visibility for you and your games when ambassador profiles go live.</span></div>
      </div>

      <h2 style={{ fontSize: "1.6rem", color: "var(--navy)", margin: "0 0 0.3rem", fontFamily: "var(--font-playfair), 'Playfair Display', serif" }}>Apply to become an ambassador</h2>
      <p style={{ fontSize: "1.1rem", color: "var(--muted)", lineHeight: 1.5, marginBottom: "0.5rem" }}>It takes about a minute. We read every application and will be in touch.</p>
      <AmbassadorForm />
    </main>
  );
}
