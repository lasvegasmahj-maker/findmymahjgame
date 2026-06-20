import Link from "next/link";

// Branded "no results" state: the tile+pin mark in a white badge, a clear
// message, and a primary action. Used on directory pages with no listings yet.
export default function BrandedEmptyState({
  title,
  message,
  ctaHref,
  ctaLabel,
  secondary,
}: {
  title: string;
  message: string;
  ctaHref: string;
  ctaLabel: string;
  secondary?: React.ReactNode;
}) {
  return (
    <div style={{ background: "var(--bg)", borderRadius: 18, padding: "2.6rem 1.6rem", textAlign: "center", maxWidth: 560, margin: "0 auto" }}>
      <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 88, height: 88, borderRadius: "50%", background: "white", boxShadow: "0 4px 16px rgba(26,31,94,0.10)", marginBottom: "1.1rem" }}>
        <img src="/icons/icon-192.png" alt="" width={60} height={60} style={{ display: "block" }} />
      </span>
      <div style={{ fontSize: "1.4rem", fontWeight: 800, color: "var(--navy)", marginBottom: "0.5rem" }}>{title}</div>
      <p style={{ fontSize: "1.1rem", color: "var(--muted)", lineHeight: 1.6, marginBottom: "1.6rem", maxWidth: 440, marginLeft: "auto", marginRight: "auto" }}>{message}</p>
      <Link href={ctaHref} style={{ minHeight: 54, display: "inline-flex", alignItems: "center", justifyContent: "center", padding: "0 1.8rem", borderRadius: 14, background: "var(--pink)", color: "white", fontWeight: 800, fontSize: "1.05rem", textDecoration: "none" }}>{ctaLabel}</Link>
      {secondary && <div style={{ marginTop: "1.2rem" }}>{secondary}</div>}
    </div>
  );
}
