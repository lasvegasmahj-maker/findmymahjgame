import { ImageResponse } from "next/og";

// Shared Open Graph renderer: the page title on the brand background with the
// full logo as a small corner watermark, so every shared link is on-brand and
// readable. Used by the per-section opengraph-image routes.
export function renderOgImage({ eyebrow, title }: { eyebrow: string; title: string }) {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          background: "linear-gradient(135deg, #1a1f5e 0%, #252b7a 100%)",
          fontFamily: "sans-serif",
          padding: "80px",
          position: "relative",
        }}
      >
        <div style={{ display: "flex", position: "absolute", top: "44px", right: "44px", background: "white", borderRadius: "14px", padding: "12px 16px" }}>
          <img src="https://findmymahjgame.com/find-my-mahj-game-logo.png" width={196} height={99} alt="Find My Mahj Game" />
        </div>
        <div style={{ fontSize: "26px", fontWeight: 700, letterSpacing: "0.16em", textTransform: "uppercase", color: "#e91e8c", marginBottom: "16px" }}>{eyebrow}</div>
        <div style={{ display: "flex", fontSize: "70px", fontWeight: 900, color: "white", lineHeight: 1.1, maxWidth: "860px" }}>{title}</div>
        <div style={{ fontSize: "24px", color: "rgba(255,255,255,0.6)", marginTop: "30px", fontWeight: 600 }}>findmymahjgame.com</div>
      </div>
    ),
    { width: 1200, height: 630 }
  );
}
