import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Mahjong Player Directory FAQ",
  description:
    "Answers to common questions about finding mahjong players, creating a free listing, and how Find My Mahj Game works.",
  alternates: { canonical: "https://findmymahjgame.com/faq" },
  openGraph: {
    title: "Mahjong Player Directory FAQ | Find My Mahj Game",
    description: "Answers to common questions about finding mahjong players and how Find My Mahj Game works.",
    url: "https://findmymahjgame.com/faq",
  },
};

type FaqItem = { q: string; a: string; links?: { href: string; label: string }[] };

const FAQ_ITEMS: FaqItem[] = [
  {
    q: "Is Find My Mahj Game free to use?",
    a: "Yes. Searching for mahjong players, groups, and events is completely free, and so is creating a player listing. Players never pay to find a game.",
    links: [{ href: "/list-my-game", label: "Create a free listing" }],
  },
  {
    q: "What kind of mahjong is played here?",
    a: "Find My Mahj Game is built for American mahjong, the most popular version in the United States, played with the National Mah Jongg League (NMJL) card. Every new listing has its variant confirmed against the source before it goes live, and we are working back through the older listings to confirm those too.",
  },
  {
    q: "How do I find players near me?",
    a: "Click your state on the map on the homepage, or use the city and ZIP search box. Every state has a dedicated page listing players, groups, and events near you.",
    links: [{ href: "/states", label: "Browse all 50 states" }],
  },
  {
    q: "How do I create a free player listing?",
    a: "Fill out the short form with your city, skill level, availability, and a brief bio. We review and approve listings within 1-2 business days.",
    links: [{ href: "/list-my-game", label: "Create my free listing" }],
  },
  {
    q: "Is my information private and safe?",
    a: "Yes. You list yourself with your first name and last initial only (for example, Sandra M.), never your full name. Your email address is never shown publicly. When another player wants to connect, we forward their request to you privately, so you decide who to reply to. You stay in control.",
  },
  {
    q: "Can I list my mahjong group or club?",
    a: "Yes. Groups and open play hosts can create a free listing. Add your city and describe your group and how to join, or email us and we will set it up for you.",
    links: [
      { href: "/list-my-game", label: "List your group" },
      { href: "mailto:hello@findmymahjgame.com", label: "Email us" },
    ],
  },
  {
    q: "How do I list a mahjong event or tournament?",
    a: "Submit your event or tournament through our listing form, or email us and we will add it for you. It shows on your state page and on the events page so players can find it.",
    links: [{ href: "/get-listed", label: "Submit an event" }],
  },
  {
    q: "I am a mahjong instructor. Can I get listed?",
    a: "Yes. Create your free teacher listing and claim it to earn the Verified badge. Find My Mahj Premium ($89 a year, with 90 days free when you claim) adds on-platform lesson requests from players and the Premium Provider badge. Premium never buys placement or ranking.",
    links: [
      { href: "/get-listed", label: "Get listed" },
      { href: "/join", label: "Join the directory" },
    ],
  },
  {
    q: "How do I update or remove my listing?",
    a: "Email us with your name and the listing you would like to update or remove. We handle all changes manually right now.",
    links: [{ href: "mailto:hello@findmymahjgame.com", label: "Email us" }],
  },
  {
    q: "Who runs Find My Mahj Game?",
    a: "Find My Mahj Game is an independent national platform for helping players find games, teachers, and community. Our founder also owns Las Vegas Mahjong, a teaching business in Las Vegas. We are open about that: her business appears only in a clearly labeled card, never mixed into search results, and we list and rank every teacher in every state, including Nevada, the same way. Our goal is simple: help more people find a seat at a table near them.",
    links: [{ href: "/about", label: "More about us" }],
  },
  {
    q: "Why is my state page empty?",
    a: "We are building the directory from scratch. If your state has no listings yet, you can be the first. Create a free listing and invite your local group to do the same.",
    links: [{ href: "/list-my-game", label: "Be the first to list" }],
  },
  {
    q: "I play on cruises. Can I find fellow passengers?",
    a: "Yes. Post your cruise, ship, and sailing dates and connect with other American mahjong players on the same trip. You can also browse organized mahjong cruises and retreats you can travel to.",
    links: [
      { href: "/cruise", label: "Post your cruise" },
      { href: "/travel", label: "Traveling mahjong experiences" },
    ],
  },
  {
    q: "Do you cover all 50 states?",
    a: "Yes. Every state has a dedicated page, and coverage grows as players create free listings.",
    links: [{ href: "/states", label: "Browse all 50 states" }],
  },
  {
    q: "Is this connected to the Las Vegas Mahjong site?",
    a: "Find My Mahj Game is a national directory. It is a sister site to Las Vegas Mahjong, which focuses specifically on mahjong in the Las Vegas area.",
    links: [{ href: "https://lasvegasmahj.com", label: "Visit Las Vegas Mahjong" }],
  },
  {
    q: "How do I contact you?",
    a: "Email us at hello@findmymahjgame.com or use our contact form. We read every message.",
    links: [
      { href: "/contact", label: "Contact us" },
      { href: "mailto:hello@findmymahjgame.com", label: "Email us" },
    ],
  },
];

const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: FAQ_ITEMS.map(({ q, a }) => ({
    "@type": "Question",
    name: q,
    acceptedAnswer: { "@type": "Answer", text: a },
  })),
};

const linkStyle: React.CSSProperties = { color: "var(--pink-text)", fontWeight: 700, fontSize: "0.9rem", textDecoration: "none" };

export default function FAQPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema).replace(/</g, "\\u003c") }}
      />

      <div className="page-hero">
        <div className="eyebrow">Help &amp; Info</div>
        <h1>Frequently Asked Questions</h1>
        <p>Everything you need to know about finding your mahj game.</p>
      </div>

      <div className="page-body" style={{ maxWidth: 740 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          {FAQ_ITEMS.map(({ q, a, links }, i) => (
            <div
              key={i}
              style={{
                background: "var(--bg)",
                border: "1px solid var(--border)",
                borderRadius: 12,
                padding: "1.4rem 1.6rem",
              }}
            >
              <h2
                style={{
                  fontSize: "1rem",
                  fontWeight: 700,
                  color: "var(--navy)",
                  marginBottom: "0.6rem",
                  fontFamily: "var(--font-dm-sans), 'DM Sans', sans-serif",
                }}
              >
                {q}
              </h2>
              <p style={{ color: "var(--muted)", lineHeight: 1.65, fontSize: "0.93rem", margin: 0 }}>{a}</p>
              {links && links.length > 0 && (
                <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem 1.2rem", marginTop: "0.9rem" }}>
                  {links.map((l) =>
                    l.href.startsWith("/") ? (
                      <Link key={l.href} href={l.href} style={linkStyle}>{l.label} &rarr;</Link>
                    ) : (
                      <a
                        key={l.href}
                        href={l.href}
                        style={linkStyle}
                        {...(l.href.startsWith("http") ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                      >{l.label} &rarr;</a>
                    )
                  )}
                </div>
              )}
            </div>
          ))}
        </div>

        <div style={{ background: "var(--navy)", borderRadius: 16, padding: "2rem", textAlign: "center", marginTop: "3rem" }}>
          <p style={{ color: "rgba(255,255,255,0.85)", marginBottom: "1.2rem", fontSize: "0.95rem" }}>
            Still have questions? We&rsquo;d love to hear from you.
          </p>
          <div style={{ display: "flex", gap: "0.8rem", justifyContent: "center", flexWrap: "wrap" }}>
            <Link href="/contact" className="btn-cta-primary">Contact Us</Link>
            <Link href="/list-my-game" style={{ color: "rgba(255,255,255,0.8)", fontWeight: 600, textDecoration: "none", padding: "0.75rem 1.4rem", border: "1px solid rgba(255,255,255,0.3)", borderRadius: 10, fontSize: "0.9rem" }}>
              Create a Free Listing
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
