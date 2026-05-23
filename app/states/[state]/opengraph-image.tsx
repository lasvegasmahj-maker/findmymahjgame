import { ImageResponse } from "next/og";
import { STATES } from "@/lib/states-data";

export const runtime = "edge";
export const alt = "Find mahjong players and groups in this state";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OGImage({ params }: { params: { state: string } }) {
  const data = STATES[params.state];
  const stateName = data?.name ?? "Your State";
  const cities = data?.cities.slice(0, 3).join(", ") ?? "";

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
        {/* Eyebrow */}
        <div
          style={{
            fontSize: "16px",
            fontWeight: 700,
            textTransform: "uppercase",
            letterSpacing: "0.2em",
            color: "#e91e8c",
            marginBottom: "20px",
          }}
        >
          Find My Mahj Game
        </div>

        {/* Big tile icon */}
        <div style={{ fontSize: "64px", marginBottom: "24px" }}>🀄</div>

        {/* State headline */}
        <div
          style={{
            fontSize: "56px",
            fontWeight: 900,
            color: "white",
            textAlign: "center",
            lineHeight: 1.1,
            marginBottom: "16px",
          }}
        >
          Mahjong in{" "}
          <span style={{ color: "#e91e8c" }}>{stateName}</span>
        </div>

        {cities && (
          <div
            style={{
              fontSize: "22px",
              color: "rgba(255,255,255,0.55)",
              textAlign: "center",
              marginBottom: "40px",
            }}
          >
            {cities} and more
          </div>
        )}

        {/* Tag line */}
        <div
          style={{
            fontSize: "20px",
            color: "rgba(255,255,255,0.7)",
            background: "rgba(233,30,140,0.12)",
            border: "1px solid rgba(233,30,140,0.3)",
            borderRadius: "50px",
            padding: "12px 32px",
            fontWeight: 600,
          }}
        >
          Players, Groups, Events and Venues
        </div>

        {/* URL */}
        <div
          style={{
            marginTop: "40px",
            fontSize: "18px",
            color: "rgba(255,255,255,0.35)",
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
