import type { Metadata, Viewport } from "next";
import { Playfair_Display, DM_Sans } from "next/font/google";
import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";
import { buildHomepageSchema, schemaScriptProps } from "@/lib/schema";
import SWRegister from "@/components/sw-register";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";

export const viewport: Viewport = {
  themeColor: "#1a1f5e",
};

// Headings only — swap is acceptable because headings are not LCP elements
const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
  display: "swap",
  weight: ["700", "900"],
  style: ["normal", "italic"],
});

// Body font — "optional" tells the browser: use the cached font or skip it entirely.
// This eliminates FOUT on repeat visits and prevents layout shift on first load
// because the browser never swaps a fallback into a loaded font mid-render.
const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dm-sans",
  display: "optional",
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: {
    default: "Find My Mahj Game | Mahjong Players, Groups and Events Nationwide",
    template: "%s | Find My Mahj Game",
  },
  description:
    "Find mahjong players, groups, open plays, venues and events in all 50 states. Free for players. Join the national mahjong directory today.",
  metadataBase: new URL("https://findmymahjgame.com"),
  openGraph: {
    siteName: "Find My Mahj Game",
    type: "website",
    locale: "en_US",
    url: "https://findmymahjgame.com",
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: "Find My Mahj Game, Mahjong Players, Groups and Events Nationwide",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    images: ["/opengraph-image"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${playfair.variable} ${dmSans.variable} h-full antialiased`}
    >
      <head>
        {/* Preconnect to Supabase so the first data fetch doesn't pay DNS + TLS cost */}
        <link rel="preconnect" href="https://prvsqhtxubjhljrrbkcj.supabase.co" />
        {/* Preconnect to the CDN that serves the topojson map data */}
        <link rel="preconnect" href="https://cdn.jsdelivr.net" crossOrigin="anonymous" />
        <script {...schemaScriptProps(buildHomepageSchema())} />
      </head>
      <body className="min-h-full flex flex-col">
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
        {/* No proactive install prompt by design. The PWA stays installable via
            the browser's own Add to Home Screen. A gentle, value-gated suggestion
            may be added later (Phase 2). */}
        <SWRegister />
        <Analytics />
      </body>
    </html>
  );
}
