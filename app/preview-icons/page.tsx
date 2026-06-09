import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Homepage Icon Options (Preview)",
  robots: { index: false, follow: false },
};

// Custom SVG mahjong-tile icons (Option C). One tile base, three symbols, brand
// colors, high contrast, render identically on every device.
function Tile({ children }: { children: React.ReactNode }) {
  return (
    <svg width="46" height="58" viewBox="0 0 40 52" style={{ display: "block", flexShrink: 0 }} aria-hidden="true">
      <rect x="2" y="2" width="36" height="48" rx="7" fill="#fffdf7" stroke="#1a1f5e" strokeWidth="2.5" />
      {children}
    </svg>
  );
}
// I Want to Play: Bam (bamboo) tile, green
const PlayTile = (
  <Tile>
    <rect x="14" y="13" width="4.5" height="26" rx="2.2" fill="#2ec95c" />
    <rect x="21.5" y="13" width="4.5" height="26" rx="2.2" fill="#2ec95c" />
    <rect x="12" y="23" width="9" height="2.6" rx="1.3" fill="#1a9648" />
    <rect x="19.5" y="23" width="9" height="2.6" rx="1.3" fill="#1a9648" />
  </Tile>
);
// Start a Table: Red Dragon (the zhong tile), red
const StartTile = (
  <Tile>
    <rect x="11.5" y="18" width="17" height="15" rx="1.5" fill="none" stroke="#d11f3f" strokeWidth="3" />
    <rect x="18" y="11" width="4" height="30" rx="1" fill="#d11f3f" />
  </Tile>
);
// I Need Help: Flower tile, navy petals with a gold center (warm, high contrast)
const HelpTile = (
  <Tile>
    {[0, 60, 120, 180, 240, 300].map((deg) => {
      const r = (deg * Math.PI) / 180;
      return <circle key={deg} cx={20 + 7 * Math.cos(r)} cy={26 + 7 * Math.sin(r)} r="4.6" fill="#1a1f5e" />;
    })}
    <circle cx="20" cy="26" r="4.2" fill="#f5c842" />
  </Tile>
);

type Btn = { label: string; sub: string; bg: string; color: string; border?: string };
const BUTTONS: Btn[] = [
  { label: "I Want to Play", sub: "Find a game near you", bg: "#1a1f5e", color: "white" },
  { label: "Start a Table", sub: "Invite players to join", bg: "#e91e8c", color: "white" },
  { label: "I Need Help", sub: "Talk to a real person", bg: "white", color: "#1a1f5e", border: "2px solid #1a1f5e" },
];

function ButtonRow({ icons }: { icons: React.ReactNode[] }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.1rem" }}>
      {BUTTONS.map((b, i) => (
        <div key={b.label}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.7rem", minHeight: 72, borderRadius: 16, background: b.bg, color: b.color, border: b.border, fontSize: "1.35rem", fontWeight: 800, padding: "0 1rem" }}>
            <span style={{ display: "flex", alignItems: "center", fontSize: "1.9rem", lineHeight: 1 }}>{icons[i]}</span>
            <span>{b.label}</span>
          </div>
          <div style={{ fontSize: "0.95rem", color: "#6b7280", textAlign: "center", marginTop: "0.35rem" }}>{b.sub}</div>
        </div>
      ))}
    </div>
  );
}

function OptionCard({ tag, title, note, icons, preferred }: { tag: string; title: string; note: string; icons: React.ReactNode[]; preferred?: boolean }) {
  return (
    <div style={{ background: "white", border: preferred ? "3px solid #2ec95c" : "2px solid #e8eaf0", borderRadius: 18, padding: "1.4rem 1.3rem" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", marginBottom: "0.2rem" }}>
        <span style={{ background: preferred ? "#2ec95c" : "#1a1f5e", color: "white", fontWeight: 800, fontSize: "0.85rem", padding: "0.2rem 0.7rem", borderRadius: 999 }}>{tag}</span>
        {preferred && <span style={{ color: "#1a9648", fontWeight: 800, fontSize: "0.85rem" }}>Recommended</span>}
      </div>
      <h2 style={{ fontSize: "1.25rem", color: "#1a1f5e", margin: "0.3rem 0 0.2rem", fontWeight: 800 }}>{title}</h2>
      <p style={{ fontSize: "0.95rem", color: "#6b7280", lineHeight: 1.5, margin: "0 0 1.1rem" }}>{note}</p>
      <ButtonRow icons={icons} />
    </div>
  );
}

export default function PreviewIconsPage() {
  const optionA = ["\u{1F004}", "\u{1F004}", "\u{1F004}"]; // the same red dragon emoji on all three
  const optionB = ["\u{1F005}", "\u{1F004}", "\u{1F006}"]; // green dragon, red dragon, white dragon
  const optionC = [PlayTile, StartTile, HelpTile];

  return (
    <main style={{ maxWidth: 1100, margin: "0 auto", padding: "1.5rem 1.2rem 4rem" }}>
      <a href="/" style={{ fontSize: "1.05rem", color: "#e91e8c", fontWeight: 700, textDecoration: "none" }}>&larr; Home</a>
      <h1 style={{ fontSize: "2rem", color: "#1a1f5e", margin: "0.8rem 0 0.3rem", fontFamily: "var(--font-playfair), 'Playfair Display', serif" }}>Homepage Button Icons</h1>
      <p style={{ fontSize: "1.1rem", color: "#6b7280", lineHeight: 1.5, marginBottom: "1.8rem" }}>Three options to replace the search, plus, and question-mark icons with mahjong-themed graphics. Preview only, nothing is live. Compare them below, on your phone the three stack one under another.</p>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(290px, 1fr))", gap: "1.2rem" }}>
        <OptionCard tag="Option A" title="One mahjong tile on all three" note="The red dragon mahjong emoji on every button. Simple and clearly mahjong, but all three look the same, so the buttons are harder to tell apart at a glance." icons={optionA} />
        <OptionCard tag="Option B" title="A different mahjong tile per button" note="Green dragon for Play, red dragon for Start, white dragon for Help. More variety, but these tile emojis render small and often gray or as empty boxes on many phones, which hurts older eyes." icons={optionB} />
        <OptionCard tag="Option C" title="Custom brand tile icons" note="Hand-built tiles in our colors: a green bamboo (Bam) tile for Play, the red dragon tile for Start, a flower tile for Help. Big, high-contrast, identical on every device, unmistakably mahjong." icons={optionC} preferred />
      </div>

      <div style={{ background: "#f4f6ff", borderRadius: 18, padding: "1.5rem 1.6rem", marginTop: "2rem" }}>
        <h2 style={{ fontSize: "1.3rem", color: "#1a1f5e", margin: "0 0 0.6rem", fontWeight: 800 }}>Recommendation</h2>
        <p style={{ fontSize: "1.05rem", color: "#1a1f5e", lineHeight: 1.6, margin: "0 0 0.8rem" }}><strong>Option C.</strong> It is the only one that is large, high-contrast, and looks the same on every phone, which matters most for older players. Each button gets its own clear tile, so they are easy to tell apart, and the whole row reads as mahjong instantly.</p>
        <p style={{ fontSize: "1rem", color: "#6b7280", lineHeight: 1.6, margin: 0 }}>Option A is a safe, simple second choice. Option B looks best on a designer&rsquo;s screen but is risky in real life, the tile emojis often show up tiny, gray, or as empty boxes on phones and tablets, which is exactly the audience we cannot afford to lose.</p>
      </div>
    </main>
  );
}
