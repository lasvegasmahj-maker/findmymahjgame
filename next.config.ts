import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Allow next/image to optimize images from Supabase storage and external sponsor logos
    remotePatterns: [
      {
        protocol: "https",
        hostname: "prvsqhtxubjhljrrbkcj.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
      {
        protocol: "https",
        hostname: "lasvegasmahj.com",
      },
    ],
    // Serve modern formats — Vercel's image CDN handles this automatically
    formats: ["image/avif", "image/webp"],
  },
};

export default nextConfig;
