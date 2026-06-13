// Visual table progress, shown everywhere a table appears. Dots + plain words
// (never dots alone, so it reads for low-vision and color-blind users).
export default function SeatDots({
  filled,
  total = 4,
  you = false,
  size = "1.6rem",
}: {
  filled: number;
  total?: number;
  you?: boolean;
  size?: string;
}) {
  const f = Math.max(0, Math.min(filled, total));
  const remaining = total - f;

  let words: string;
  if (remaining <= 0) words = "Table full, time to play";
  else if (remaining === 1) words = `${f} of ${total} players, 1 seat to go`;
  else words = `${you ? "You're " : ""}${f} of ${total} players`;

  return (
    <div>
      <div style={{ fontSize: size, letterSpacing: "0.25em", lineHeight: 1 }} aria-hidden="true">
        <span style={{ color: "var(--pink-text)" }}>{"●".repeat(f)}</span>
        <span style={{ color: "#cbd5e1" }}>{"○".repeat(remaining)}</span>
      </div>
      <div style={{ fontSize: "1.15rem", fontWeight: 800, color: remaining <= 0 ? "#1a9648" : "var(--navy)", marginTop: "0.4rem" }}>
        {words}
      </div>
    </div>
  );
}
