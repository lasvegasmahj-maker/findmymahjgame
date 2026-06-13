"use client";

import Link from "next/link";

export default function Error({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <>
      <div className="page-hero">
        <div className="eyebrow">Something went wrong</div>
        <h1>We hit a snag</h1>
        <p>This one is on us, not you. Please try again, or head back home to find your game.</p>
      </div>

      <div className="page-body" style={{ maxWidth: 680, textAlign: "center" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem", alignItems: "center" }}>
          <button onClick={reset} className="btn-cta-primary" style={{ border: "none", cursor: "pointer", fontFamily: "inherit" }}>
            Try Again
          </button>
          <Link href="/" style={{ color: "var(--pink)", fontWeight: 600, textDecoration: "none", fontSize: "0.9rem" }}>
            Back to Home
          </Link>
        </div>
      </div>
    </>
  );
}
