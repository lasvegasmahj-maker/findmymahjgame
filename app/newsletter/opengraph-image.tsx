import { renderOgImage } from "@/lib/og-image";

export const runtime = "edge";
export const alt = "The weekly mahjong newsletter - Find My Mahj Game";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return renderOgImage({ eyebrow: "Stay in the game", title: "The weekly mahjong newsletter" });
}
