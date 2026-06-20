import { renderOgImage } from "@/lib/og-image";

export const runtime = "edge";
export const alt = "Find a mahjong teacher near you - Find My Mahj Game";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return renderOgImage({ eyebrow: "Find a teacher", title: "Mahjong teachers near you" });
}
