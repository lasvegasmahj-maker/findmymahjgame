// Small, subtle brand badge for featured/verified items. Pairs the tile+pin
// mark with a short label in brand colors.
export default function FeaturedBadge({ label }: { label: string }) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem", background: "white", border: "1.5px solid var(--pink)", color: "var(--pink-text)", borderRadius: 999, padding: "0.25rem 0.7rem 0.25rem 0.45rem", fontSize: "0.78rem", fontWeight: 800, lineHeight: 1, whiteSpace: "nowrap" }}>
      <img src="/icons/icon-192.png" alt="" width={16} height={16} style={{ display: "block", borderRadius: 3 }} />
      {label}
    </span>
  );
}
