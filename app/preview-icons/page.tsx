import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Homepage Icon Options (American Mahjong Tiles, Preview)",
  robots: { index: false, follow: false },
};

// Authentic American Mahjong tiles, rendered as SVG. White ivory tile face,
// rounded corners, a soft drop shadow and a top bevel highlight so it reads as
// a real tile. High contrast for older eyes. The Joker is the tell that this is
// American Mahjong (no Asian set has Jokers).
function WhiteTile({ children }: { children: React.ReactNode }) {
  return (
    <svg width="56" height="72" viewBox="0 0 44 56" style={{ display: "block", flexShrink: 0 }} aria-hidden="true">
      <rect x="6" y="8" width="34" height="46" rx="8" fill="#000000" opacity="0.13" />
      <rect x="4" y="4" width="34" height="46" rx="8" fill="#fffef9" stroke="#c7cad4" strokeWidth="1.5" />
      <rect x="7.5" y="7" width="27" height="5" rx="2.5" fill="#f1f2f6" />
      {children}
    </svg>
  );
}

// Bam (Bams suit): green bamboo, two stalks with node lines and small leaves.
const BamTile = (
  <WhiteTile>
    <rect x="14.5" y="15" width="5" height="26" rx="2.5" fill="#1f9d4d" />
    <rect x="22.5" y="15" width="5" height="26" rx="2.5" fill="#1f9d4d" />
    <rect x="13.3" y="21.5" width="7.4" height="2.4" rx="1.2" fill="#0f6e33" />
    <rect x="21.3" y="21.5" width="7.4" height="2.4" rx="1.2" fill="#0f6e33" />
    <rect x="13.3" y="31" width="7.4" height="2.4" rx="1.2" fill="#0f6e33" />
    <rect x="21.3" y="31" width="7.4" height="2.4" rx="1.2" fill="#0f6e33" />
    <path d="M15 15 q-4 -2.5 -5.5 -7" stroke="#1f9d4d" strokeWidth="2.2" fill="none" strokeLinecap="round" />
    <path d="M27 15 q4 -2.5 5.5 -7" stroke="#1f9d4d" strokeWidth="2.2" fill="none" strokeLinecap="round" />
  </WhiteTile>
);

// East Wind: the American convention adds the compass letter. Bold blue E.
const EastTile = (
  <WhiteTile>
    <text x="21" y="38" textAnchor="middle" fontFamily="Georgia, 'Times New Roman', serif" fontWeight="700" fontSize="29" fill="#1f3a93">E</text>
  </WhiteTile>
);

// Flower: colorful flower, pink petals, gold center, green stem.
const FlowerTile = (
  <WhiteTile>
    {[0, 60, 120, 180, 240, 300].map((deg) => {
      const r = (deg * Math.PI) / 180;
      return <circle key={deg} cx={21 + 7 * Math.cos(r)} cy={23 + 7 * Math.sin(r)} r="5" fill="#e91e8c" />;
    })}
    <circle cx="21" cy="23" r="4.6" fill="#f5c842" />
    <path d="M21 31 L21 41" stroke="#1f9d4d" strokeWidth="2.4" strokeLinecap="round" />
    <path d="M21 37 q5 -1 7 -5" stroke="#1f9d4d" strokeWidth="2.4" fill="none" strokeLinecap="round" />
  </WhiteTile>
);

// Joker: the American wild tile. A festive three-point jester hat with bells.
const JokerTile = (
  <WhiteTile>
    <path d="M12 32 L16 16 L21 32 Z" fill="#e91e8c" />
    <path d="M23 32 L28 16 L32 32 Z" fill="#1f9d4d" />
    <path d="M17 32 L22 12 L27 32 Z" fill="#f5c842" />
    <rect x="11" y="30" width="22" height="6.5" rx="3.2" fill="#1a1f5e" />
    <circle cx="16" cy="15" r="2.5" fill="#e91e8c" />
    <circle cx="22" cy="11" r="2.5" fill="#f5c842" />
    <circle cx="28" cy="15" r="2.5" fill="#1f9d4d" />
  </WhiteTile>
);

type Btn = { label: string; sub: string; bg: string; color: string; border?: string };
const BUTTONS: Btn[] = [
  { label: "I Want to Play", sub: "Find a game near you", bg: "#1a1f5e", color: "white" },
  { label: "Start a Table", sub: "Invite players to join", bg: "#e91e8c", color: "white" },
  { label: "I Need Help", sub: "Talk to a real person", bg: "white", color: "#1a1f5e", border: "2px solid #1a1f5e" },
];

function ButtonRow({ icons }: { icons: (React.ReactNode | null)[] }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.1rem" }}>
      {BUTTONS.map((b, i) => (
        <div key={b.label}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: icons[i] ? "flex-start" : "center", gap: "0.8rem", minHeight: 84, borderRadius: 16, background: b.bg, color: b.color, border: b.border, boxShadow: b.border ? "0 2px 10px rgba(26,31,94,0.12)" : undefined, fontSize: "1.4rem", fontWeight: 800, padding: icons[i] ? "0 1rem" : "0" }}>
            {icons[i] && <span style={{ display: "flex", alignItems: "center" }}>{icons[i]}</span>}
            <span>{b.label}</span>
          </div>
          <div style={{ fontSize: "0.98rem", color: "#565f6e", textAlign: "center", marginTop: "0.35rem" }}>{b.sub}</div>
        </div>
      ))}
    </div>
  );
}

function OptionCard({ tag, title, note, icons, preferred }: { tag: string; title: string; note: string; icons: (React.ReactNode | null)[]; preferred?: boolean }) {
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
  const optionA = [BamTile, EastTile, JokerTile];
  const optionB = [BamTile, FlowerTile, JokerTile];
  const optionC: (React.ReactNode | null)[] = [null, null, null];

  return (
    <main style={{ maxWidth: 1100, margin: "0 auto", padding: "1.5rem 1.2rem 4rem" }}>
      <a href="/" style={{ fontSize: "1.05rem", color: "#e91e8c", fontWeight: 700, textDecoration: "none" }}>&larr; Home</a>
      <h1 style={{ fontSize: "2rem", color: "#1a1f5e", margin: "0.8rem 0 0.3rem", fontFamily: "var(--font-playfair), 'Playfair Display', serif" }}>Homepage Buttons, American Mahjong Tiles</h1>
      <p style={{ fontSize: "1.1rem", color: "#6b7280", lineHeight: 1.5, marginBottom: "1.8rem" }}>Authentic American Mahjong tile icons (white tiles, rounded corners), not generic or Asian-style graphics. Preview only, nothing is live. On your phone the three options stack one under another.</p>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(290px, 1fr))", gap: "1.2rem" }}>
        <OptionCard tag="Option A" title="Bam, East Wind, Joker" note="Play uses a green Bam (bamboo) tile. Start uses the East Wind tile, in American Mahjong East is the dealer who starts the game, so it fits perfectly. Help uses the Joker, the American wild tile that saves your hand. The most meaningful set for players who know the game." icons={optionA} preferred />
        <OptionCard tag="Option B" title="Bam, Flower, Joker" note="Play uses the Bam tile, Start uses a colorful Flower tile (warm and welcoming), Help uses the Joker. Friendlier and more colorful for newcomers, but the Flower is less tied to the meaning of starting a game than the East Wind is." icons={optionB} />
        <OptionCard tag="Option C" title="No icons, large text only" note="Just big, high-contrast text. The most foolproof for older eyes and the least cluttered, but it loses the instant mahjong identity that real tiles give. A strong, safe floor." icons={optionC} />
      </div>

      <div style={{ background: "#f4f6ff", borderRadius: 18, padding: "1.5rem 1.6rem", marginTop: "2rem" }}>
        <h2 style={{ fontSize: "1.3rem", color: "#1a1f5e", margin: "0 0 0.6rem", fontWeight: 800 }}>Do icons even help conversion? An honest take</h2>
        <p style={{ fontSize: "1.05rem", color: "#1a1f5e", lineHeight: 1.6, margin: "0 0 0.8rem" }}>For older adults, the words carry the meaning, not the picture. An icon never replaces the label; the safest button is large, high-contrast text (Option C). So icons are not required to convert. What an authentic tile adds is identity and recognition: an American Mahjong player sees a Bam, an East Wind, and a Joker and instantly knows this is built for their game, which the old magnifier, plus, and question-mark icons never did. The win is tile plus large text, never tile instead of text.</p>
        <p style={{ fontSize: "1rem", color: "#6b7280", lineHeight: 1.6, margin: 0 }}>So the real choice is not "icons or not" for usability (text already does that job); it is "do we want the buttons to feel unmistakably like American Mahjong." If yes, Option A. If you want maximum simplicity, Option C.</p>
      </div>

      <div style={{ background: "white", border: "2px solid #e8eaf0", borderRadius: 18, padding: "1.5rem 1.6rem", marginTop: "1.2rem" }}>
        <h2 style={{ fontSize: "1.3rem", color: "#1a1f5e", margin: "0 0 0.8rem", fontWeight: 800 }}>Recommendation: Option A</h2>
        <ul style={{ fontSize: "1.02rem", color: "#1a1f5e", lineHeight: 1.6, margin: 0, paddingLeft: "1.2rem" }}>
          <li><strong>American Mahjong player recognition:</strong> this is the real differentiator, and Option A wins it clearly. East Wind is the dealer who starts the game and the Joker is the wild tile that helps you, so the icons match the actions, not just decorate them. Unmistakably American.</li>
          <li><strong>Senior usability:</strong> honestly, a wash across all three. The large, high-contrast text does the work; the tile is a helpful cue, not a crutch. A is no easier or harder to read than B or C.</li>
          <li><strong>Mobile usability:</strong> also a wash. All three keep big tap targets and large text. The white tiles read fine at a glance, but they are not what makes the button usable; the words are.</li>
          <li><strong>Brand consistency:</strong> A and B are equal here (white ivory tiles with our navy, pink, green, and gold suit a clean, premium brand). C is the most minimal, which is also on-brand.</li>
        </ul>
        <p style={{ fontSize: "1rem", color: "#565f6e", lineHeight: 1.6, marginTop: "0.8rem", marginBottom: 0 }}>So the four criteria really come down to one: player recognition, where A is strongest. A versus B is a single trade: A is more meaningful to players who know the game (East starts, Joker helps), B is warmer for brand-new players (the Flower is friendlier than a letter E). C is the safe minimal floor. Pick A to feel unmistakably like American Mahjong; pick C to keep it ultra-simple. None of the three hurts conversion, because all keep the text large.</p>
      </div>
    </main>
  );
}
