import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Find My Mahj Game",
    short_name: "Mahj",
    description: "Find people to play mahjong with near you.",
    start_url: "/",
    display: "standalone",
    background_color: "#1a1f5e",
    theme_color: "#1a1f5e",
    orientation: "portrait",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icons/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
