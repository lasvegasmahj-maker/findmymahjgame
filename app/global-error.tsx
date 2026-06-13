"use client";

export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          textAlign: "center",
          padding: "2rem",
          background: "#f4f6ff",
          color: "#1a1f5e",
          fontFamily: "'DM Sans', system-ui, -apple-system, sans-serif",
        }}
      >
        <p style={{ fontSize: "0.72rem", fontWeight: 700, letterSpacing: "0.2em", textTransform: "uppercase", color: "#e91e8c", margin: "0 0 0.8rem" }}>
          Something went wrong
        </p>
        <h1 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: "2rem", margin: "0 0 1rem" }}>We hit a snag</h1>
        <p style={{ color: "#6b7280", maxWidth: 420, margin: "0 0 1.6rem", lineHeight: 1.6 }}>
          This one is on us, not you. Please try again, or reload the page.
        </p>
        <button
          onClick={reset}
          style={{
            background: "#e91e8c",
            color: "white",
            border: "none",
            borderRadius: 999,
            padding: "0.9rem 2rem",
            fontSize: "1rem",
            fontWeight: 700,
            cursor: "pointer",
            fontFamily: "inherit",
          }}
        >
          Try Again
        </button>
      </body>
    </html>
  );
}
