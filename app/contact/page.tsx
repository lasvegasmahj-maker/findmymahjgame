import type { Metadata } from "next";
import Link from "next/link";
import { FORMSPREE_URL } from "@/lib/constants";
import { buildContactPageSchema, schemaScriptProps } from "@/lib/schema";

export const metadata: Metadata = {
  title: "Contact Find My Mahj Game | Player Listings and Advertising Help",
  description:
    "Questions about listing your game, advertising your venue, or partnering with us? We respond within 1-2 business days. Reach out anytime.",
  alternates: {
    canonical: "https://findmymahjgame.com/contact",
  },
  openGraph: {
    title: "Contact Find My Mahj Game | Player Listings and Advertising Help",
    description:
      "Questions about listing your game, advertising your venue, or partnering with us? We respond within 1-2 business days. Reach out anytime.",
    url: "https://findmymahjgame.com/contact",
  },
};

export default async function ContactPage({ searchParams }: { searchParams: Promise<{ sent?: string }> }) {
  const { sent } = await searchParams;
  return (
    <>
      <script {...schemaScriptProps(buildContactPageSchema())} />
      <div className="page-hero">
        <div className="eyebrow">Contact</div>
        <h1>Contact Find My Mahj Game</h1>
        <p>Questions about listings, advertising or anything else? We&rsquo;d love to hear from you.
        </p>
      </div>

      <div className="page-body" style={{ maxWidth: 860 }}>
        {sent && (
          <div id="sent" role="alert" style={{ background: "rgba(46,201,92,0.12)", border: "2px solid #2ec95c", borderRadius: 12, padding: "1rem 1.4rem", marginBottom: "1.6rem", textAlign: "center", color: "#1a6e3a", fontWeight: 700 }}>Thank you! Your message is on its way. A real person reads every one.
          </div>
        )}
        {/* Contact Cards */}
        <div className="grid grid-cols-2 gap-12 my-8 max-sm:grid-cols-1">
          <div className="bg-bg border border-border rounded-2xl p-6">
            <h3 className="font-heading text-[1.1rem] text-navy mb-2">General Inquiries</h3>
            <p className="text-[0.88rem] text-muted mb-3">Questions about the platform, player listings, or anything else.
            </p>
            <a
              href="mailto:hello@findmymahjgame.com"
              className="text-pink font-bold no-underline"
            >hello@findmymahjgame.com
            </a>
          </div>
          <div className="bg-bg border border-border rounded-2xl p-6">
            <h3 className="font-heading text-[1.1rem] text-navy mb-2">Advertising &amp; Partnerships
            </h3>
            <p className="text-[0.88rem] text-muted mb-3">Interested in advertising, venue listings, or event promotions?
            </p>
            <Link href="/advertise" className="text-pink font-bold no-underline">See Advertise page &rarr;
            </Link>
          </div>
          <div className="bg-bg border border-border rounded-2xl p-6">
            <h3 className="font-heading text-[1.1rem] text-navy mb-2">List Your Game or Venue
            </h3>
            <p className="text-[0.88rem] text-muted mb-3">Want to get your game, venue or event listed on Find My Mahj Game?
            </p>
            <Link href="/advertise" className="text-pink font-bold no-underline">See listing options &rarr;
            </Link>
          </div>
          <div className="bg-bg border border-border rounded-2xl p-6">
            <h3 className="font-heading text-[1.1rem] text-navy mb-2">Partnerships</h3>
            <p className="text-[0.88rem] text-muted mb-3">Interested in a partnership, collaboration or media opportunity?
            </p>
            <a
              href="mailto:hello@findmymahjgame.com"
              className="text-pink font-bold no-underline"
            >hello@findmymahjgame.com
            </a>
          </div>
        </div>

        {/* Contact Form */}
        <div className="bg-bg border border-border rounded-2xl p-8 my-8">
          <h2 style={{ border: "none", marginTop: 0 }}>Send Us a Message</h2>
          <form action={FORMSPREE_URL} method="POST">
            <input type="hidden" name="_next" value="https://findmymahjgame.com/contact?sent=1#sent" />
            <div className="grid grid-cols-2 gap-4 mb-5 max-sm:grid-cols-1">
              <div>
                <label className="block text-[0.82rem] font-bold text-navy mb-1">Your Name</label>
                <input
                  type="text"
                  name="name"
                  placeholder="Jane Smith"
                  required
                  className="w-full py-2.5 px-4 border-[1.5px] border-border rounded-lg font-body text-[1rem] text-text bg-white outline-none focus:border-pink transition-colors"
                />
              </div>
              <div>
                <label className="block text-[0.82rem] font-bold text-navy mb-1">Email Address
                </label>
                <input
                  type="email"
                  name="email"
                  placeholder="jane@example.com"
                  required
                  className="w-full py-2.5 px-4 border-[1.5px] border-border rounded-lg font-body text-[1rem] text-text bg-white outline-none focus:border-pink transition-colors"
                />
              </div>
            </div>
            <div className="mb-5">
              <label className="block text-[0.82rem] font-bold text-navy mb-1">What is this about?
              </label>
              <select
                name="topic"
                required
                className="form-select"
              >
                <option value="">Select a topic...</option>
                <option>Player listing question</option>
                <option>Advertising inquiry</option>
                <option>Venue listing</option>
                <option>Event listing</option>
                <option>Partnership opportunity</option>
                <option>Bug or website issue</option>
                <option>Other</option>
              </select>
            </div>
            <div className="mb-5">
              <label className="block text-[0.82rem] font-bold text-navy mb-1">Message</label>
              <textarea
                name="message"
                placeholder="Tell us what you need..."
                required
                className="w-full py-2.5 px-4 border-[1.5px] border-border rounded-lg font-body text-[1rem] text-text bg-white outline-none focus:border-pink transition-colors h-[120px] resize-y"
              />
            </div>
            <button
              type="submit"
              className="bg-pink text-white border-none rounded-lg py-3.5 px-10 font-body text-[1rem] font-bold cursor-pointer w-full hover:opacity-90 transition-opacity"
            >Send Message &rarr;
            </button>
            <p className="text-[0.78rem] text-muted text-center mt-4 mb-0">A real person reads every message. We never sell or share your email. See our <Link href="/privacy" className="text-pink no-underline">privacy policy</Link>.
            </p>
          </form>
        </div>

        <p className="text-[0.82rem] text-muted text-center">We typically respond within 1-2 business days. For fastest response, email us directly at{" "}
          <a href="mailto:hello@findmymahjgame.com">hello@findmymahjgame.com</a>.
        </p>
      </div>
    </>
  );
}
