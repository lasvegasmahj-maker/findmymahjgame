import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Listing Action | Find My Mahj Game",
  robots: { index: false },
};

export default async function ApprovedPage({
  searchParams,
}: {
  searchParams: Promise<{ result?: string; action?: string; name?: string }>;
}) {
  const { result, action, name } = await searchParams;
  const listingName = name ? decodeURIComponent(name) : "the listing";

  const content = {
    approved: {
      icon: "✅",
      heading: "Approved!",
      color: "#1a6e3a",
      message: `${listingName} has been approved. The advertiser has been notified and will be live within 24 hours.`,
    },
    rejected: {
      icon: "❌",
      heading: "Rejected",
      color: "#dc2626",
      message: `${listingName} has been rejected. Follow up with the advertiser directly if needed.`,
    },
    already: {
      icon: "ℹ️",
      heading: "Already processed",
      color: "#1a1f5e",
      message: `This listing was already marked as "${action ?? "processed"}". No changes were made.`,
    },
    invalid: {
      icon: "⚠️",
      heading: "Invalid or expired link",
      color: "#6b7280",
      message: "This approval link is invalid or has expired. Approval links are valid for 7 days. Check your email for a newer link.",
    },
    notfound: {
      icon: "⚠️",
      heading: "Not found",
      color: "#6b7280",
      message: "That submission couldn't be found.",
    },
  }[result ?? "invalid"] ?? {
    icon: "⚠️",
    heading: "Unknown result",
    color: "#6b7280",
    message: "Something unexpected happened.",
  };

  return (
    <div className="page-body" style={{ maxWidth: 500, textAlign: "center", paddingTop: "5rem" }}>
      <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>{content.icon}</div>
      <h1 style={{ fontFamily: "var(--font-playfair), 'Playfair Display', serif", fontSize: "1.8rem", color: content.color, marginBottom: "0.75rem" }}>
        {content.heading}
      </h1>
      <p style={{ color: "var(--muted)", lineHeight: 1.7, marginBottom: "2rem" }}>
        {content.message}
      </p>
      <Link href="/advertise" style={{ color: "var(--pink)", fontWeight: 700, textDecoration: "none", fontSize: "0.9rem" }}>
        Back to Advertise page →
      </Link>
    </div>
  );
}
