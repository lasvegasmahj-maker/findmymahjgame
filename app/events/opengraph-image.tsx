import { renderOgImage } from "@/lib/og-image";

export const runtime = "edge";
export const alt = "Find mahjong events and open plays near you - Find My Mahj Game";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return renderOgImage({ eyebrow: "Find a game", title: "Mahjong events and open plays" });
}
