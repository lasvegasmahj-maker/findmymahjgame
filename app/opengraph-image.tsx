import { renderOgImage } from "@/lib/og-image";

export const runtime = "edge";
export const alt = "Find My Mahj Game - Mahjong players, games and events nationwide";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return renderOgImage({ eyebrow: "Find My Mahj Game", title: "Find mahjong players, games, and events nationwide" });
}
