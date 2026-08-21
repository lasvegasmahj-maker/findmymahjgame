// The badge system. These are SEPARATE recognitions that can stack on one
// profile (e.g. Charter Member + Verified Teacher + Community Leader together):
//   charter     = early adopter who helped build the directory (permanent)
//   verified    = identity verified and admin-approved
//   leader      = earned through activity and contribution
//   ambassador  = invitation-only, exceptional community builders
//   advisor     = invitation-only founding advisor (top launch recognition)
const BADGES = {
  charter: { symbol: "⭐", label: "Charter Member", bg: "#fff7e6", color: "#a07800", border: "#f5c842" },
  verified: { symbol: "✓", label: "Verified Teacher", bg: "rgba(46,201,92,0.10)", color: "#1a9648", border: "rgba(46,201,92,0.45)" },
  leader: { symbol: "🏆", label: "Community Leader", bg: "rgba(233,30,140,0.08)", color: "var(--pink-text)", border: "rgba(233,30,140,0.30)" },
  ambassador: { symbol: "🥇", label: "Ambassador", bg: "rgba(26,31,94,0.06)", color: "var(--navy)", border: "rgba(26,31,94,0.22)" },
  advisor: { symbol: "⭐", label: "Founding Advisor", bg: "var(--navy)", color: "white", border: "var(--gold)" },
} as const;

export type BadgeType = keyof typeof BADGES;

export default function StatusBadge({ type, label }: { type: BadgeType; label?: string }) {
  const b = BADGES[type];
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem", background: b.bg, color: b.color, border: `1.5px solid ${b.border}`, borderRadius: 999, padding: "0.3rem 0.8rem", fontSize: "0.82rem", fontWeight: 800, lineHeight: 1, whiteSpace: "nowrap" }}>
      <span aria-hidden="true">{b.symbol}</span>
      {label || b.label}
    </span>
  );
}
