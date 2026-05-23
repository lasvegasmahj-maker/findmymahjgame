import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "Find My Mahj Game - Mahjong Players, Groups and Events Nationwide";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OGImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #1a1f5e 0%, #252b7a 100%)",
          fontFamily: "sans-serif",
          padding: "60px",
        }}
      >
        {/* Logo / brand */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "16px",
            marginBottom: "32px",
          }}
        >
          <div
            style={{
              fontSize: "52px",
              lineHeight: 1,
            }}
          >
            🀄
          </div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <span
              style={{
                fontSize: "20px",
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "0.2em",
                color: "#e91e8c",
                marginBottom: "4px",
              }}
            >
              Find My
            </span>
            <span
              style={{
                fontSize: "44px",
                fontWeight: 900,
                color: "white",
                lineHeight: 1,
              }}
            >
              Mahj Game
            </span>
          </div>
        </div>

        {/* Headline */}
        <div
          style={{
            fontSize: "32px",
            fontWeight: 600,
            color: "rgba(255,255,255,0.85)",
            textAlign: "center",
            maxWidth: "800px",
            lineHeight: 1.4,
            marginBottom: "40px",
          }}
        >
          Find Players, Groups and Events Near You
        </div>

        {/* Stats row */}
        <div
          style={{
            display: "flex",
            gap: "60px",
            background: "rgba(255,255,255,0.08)",
            borderRadius: "20px",
            padding: "28px 60px",
            border: "1px solid rgba(255,255,255,0.12)",
          }}
        >
          {[
            { num: "50", label: "States" },
            { num: "Free", label: "For Players" },
            { num: "Live", label: "Listings" },
          ].map((s) => (
            <div
              key={s.label}
              style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "4px" }}
            >
              <span style={{ fontSize: "36px", fontWeight: 900, color: "#e91e8c" }}>
                {s.num}
              </span>
              <span style={{ fontSize: "16px", color: "rgba(255,255,255,0.5)", fontWeight: 600 }}>
                {s.label}
              </span>
            </div>
          ))}
        </div>

        {/* URL */}
        <div
          style={{
            marginTop: "36px",
            fontSize: "18px",
            color: "rgba(255,255,255,0.4)",
            fontWeight: 600,
            letterSpacing: "0.05em",
          }}
        >
          findmymahjgame.com
        </div>
      </div>
    ),
    size
  );
}
