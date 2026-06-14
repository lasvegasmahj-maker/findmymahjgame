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

const FAQ_ITEMS = [
  {
    q: "Is Find My Mahj Game free to use?",
    a: "Yes. Searching for mahjong players, groups, and events is completely free, and so is creating a player listing. Money never crosses the table between players. We make money only from optional business and venue advertising packages, never from you.",
  },
  {
    q: "What kind of mahjong is played here?",
    a: "The directory supports American mahjong (NMJL rules), Chinese mahjong, Japanese riichi, and any other style. Players indicate their preferred format in their listings so you can find the right match.",
  },
  {
    q: "How do I find players near me?",
    a: "Click your state on the map on the homepage, or use the city search box. You can also go directly to /states and browse by region. Every state has a dedicated page listing players, groups, and events.",
  },
  {
    q: "How do I create a free player listing?",
    a: "Go to /list-my-game and fill out the short form. We review and approve listings within 1-2 business days. You can include your city, skill level, availability, and a short bio.",
  },
  {
    q: "Is my information private and safe?",
    a: "Yes. You list yourself with your first name and last initial only (for example, Sandra M.), never your full name. Your email address is never shown publicly. When another player wants to connect, we forward their request to you privately, so you decide who to reply to. You stay in control.",
  },
  {
    q: "Can I list my mahjong group or club?",
    a: "Yes. Groups and open play hosts can create a listing at /list-my-game. Add your city and describe your group and how to join in the bio, or email hello@findmymahjgame.com and we will set it up for you.",
  },
  {
    q: "How do I list a mahjong event or tournament?",
    a: "Events and tournaments are listed through the advertise page at /advertise, or by contacting us at hello@findmymahjgame.com. Event listings are included in our paid advertising packages.",
  },
  {
    q: "I am a mahjong instructor. Can I get listed?",
    a: "Yes. Instructors can create a listing at /list-my-game and indicate that they offer lessons. Paid instructor spotlight placements are available through /advertise.",
  },
  {
    q: "How do I update or remove my listing?",
    a: "Email hello@findmymahjgame.com with your name and the listing you'd like to update or remove. We handle all changes manually right now.",
  },
  {
    q: "Who runs Find My Mahj Game?",
    a: "Find My Mahj Game is an independent national platform for helping players find games, teachers, and community. Our founder also owns Las Vegas Mahjong, a teaching business in Las Vegas. We are open about that. In Nevada we focus on games, open plays, and community rather than competing teacher listings; everywhere else in the country we welcome and promote every teacher equally. Our goal is simple: help more people find a seat at a table near them.",
  },
  {
    q: "Why is my state page empty?",
    a: "We are building the directory from scratch. If your state has no listings yet, you can be the first! Create a free listing at /list-my-game and invite your local group to do the same.",
  },
  {
    q: "I play on cruises. Can I find fellow passengers?",
    a: "Yes. Create a listing at /list-my-game and mention your upcoming cruise, ship, and dates in your description. Other players browsing listings can reach out before you sail.",
  },
  {
    q: "Do you cover all 50 states?",
    a: "Yes. Every state has a dedicated page. Browse them all at /states. Coverage grows as players create free listings.",
  },
  {
    q: "How do I advertise my business to mahjong players?",
    a: "Visit /advertise for sponsorship and advertising options. We offer banner placements, sponsored state pages, and event listings reaching mahjong players nationwide.",
  },
  {
    q: "Is this connected to the Las Vegas Mahjong site?",
    a: "Find My Mahj Game is a national directory. It is a sister site to Las Vegas Mahjong (lasvegasmahj.com), which focuses specifically on mahjong in the Las Vegas area.",
  },
  {
    q: "How do I contact you?",
    a: "Email us at hello@findmymahjgame.com or visit /contact. We read every message.",
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
          {FAQ_ITEMS.map(({ q, a }, i) => (
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
