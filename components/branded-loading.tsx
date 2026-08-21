// Branded loading state: the tile+pin mark gently pulsing, with a message in
// the brand voice. Replaces generic spinners on data-fetching routes.
export default function BrandedLoading({ message = "Finding games near you..." }: { message?: string }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "1rem", padding: "4.5rem 1.5rem", textAlign: "center" }}>
      <span className="brand-pulse" style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 84, height: 84, borderRadius: "50%", background: "white", boxShadow: "0 4px 16px rgba(26,31,94,0.10)" }}>
        <img src="/icons/icon-192.png" alt="" width={56} height={56} style={{ display: "block" }} />
      </span>
      <div style={{ fontSize: "1.1rem", fontWeight: 700, color: "var(--navy)" }}>{message}</div>
    </div>
  );
}
