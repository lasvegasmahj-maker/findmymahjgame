import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  async headers() {
    // CSP allows Supabase (data + storage), the geolocation reverse-geocoder
    // used by /play, Google Fonts, and inline styles (the app uses inline
    // style objects throughout). Tighten further post-launch if desired.
    const csp = [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline'",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com",
      "img-src 'self' data: https:",
      "connect-src 'self' https://prvsqhtxubjhljrrbkcj.supabase.co https://api.bigdatacloud.net https://cdn.jsdelivr.net",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self' https://formspree.io",
    ].join("; ");
    return [{
      source: "/:path*",
      headers: [
        { key: "Content-Security-Policy", value: csp },
        { key: "X-Frame-Options", value: "DENY" },
        { key: "X-Content-Type-Options", value: "nosniff" },
        { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        { key: "Permissions-Policy", value: "geolocation=(self), camera=(), microphone=()" },
        { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
      ],
    }];
  },
  images: {
    // Allow next/image to optimize images from Supabase storage and sponsor logos
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
    // Serve modern formats; Vercel's image CDN handles this automatically
    formats: ["image/avif", "image/webp"],
  },
};

export default nextConfig;
