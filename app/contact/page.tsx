import type { Metadata } from "next";
import Link from "next/link";
import { FORMSPREE_URL } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Contact",
  description:
    "Get in touch with Find My Mahj Game. Questions about listings, advertising, partnerships or general inquiries.",
};

export default function ContactPage() {
  return (
    <>
      <div className="page-hero">
        <div className="eyebrow">Contact</div>
        <h1>Get in Touch</h1>
        <p>
          Questions about listings, advertising or anything else we&rsquo;d love to hear from you.
        </p>
      </div>

      <div className="page-body" style={{ maxWidth: 860 }}>
        {/* Contact Cards */}
        <div className="grid grid-cols-2 gap-12 my-8 max-sm:grid-cols-1">
          <div className="bg-bg border border-border rounded-2xl p-6">
            <div className="text-[2rem] mb-3">📩</div>
            <h3 className="font-heading text-[1.1rem] text-navy mb-2">General Inquiries</h3>
            <p className="text-[0.88rem] text-muted mb-3">
              Questions about the platform, player listings, or anything else.
            </p>
            <a
              href="mailto:hello@findmymahjgame.com"
              className="text-pink font-bold no-underline"
            >
              hello@findmymahjgame.com
            </a>
          </div>
          <div className="bg-bg border border-border rounded-2xl p-6">
            <div className="text-[2rem] mb-3">📢</div>
            <h3 className="font-heading text-[1.1rem] text-navy mb-2">
              Advertising &amp; Partnerships
            </h3>
            <p className="text-[0.88rem] text-muted mb-3">
              Interested in advertising, venue listings, or event promotions?
            </p>
            <Link href="/advertise" className="text-pink font-bold no-underline">
              See Advertise page &rarr;
            </Link>
          </div>
          <div className="bg-bg border border-border rounded-2xl p-6">
            <div className="text-[2rem] mb-3">📍</div>
            <h3 className="font-heading text-[1.1rem] text-navy mb-2">
              List Your Game or Venue
            </h3>
            <p className="text-[0.88rem] text-muted mb-3">
              Want to get your game, venue or event listed on Find My Mahj Game?
            </p>
            <Link href="/advertise" className="text-pink font-bold no-underline">
              See listing options &rarr;
            </Link>
          </div>
          <div className="bg-bg border border-border rounded-2xl p-6">
            <div className="text-[2rem] mb-3">🤝</div>
            <h3 className="font-heading text-[1.1rem] text-navy mb-2">Partnerships</h3>
            <p className="text-[0.88rem] text-muted mb-3">
              Interested in a partnership, collaboration or media opportunity?
            </p>
            <a
              href="mailto:hello@findmymahjgame.com"
              className="text-pink font-bold no-underline"
            >
              hello@findmymahjgame.com
            </a>
          </div>
        </div>

        {/* Contact Form */}
        <div className="bg-bg border border-border rounded-2xl p-8 my-8">
          <h2 style={{ border: "none", marginTop: 0 }}>Send Us a Message</h2>
          <form action={FORMSPREE_URL} method="POST">
            <div className="grid grid-cols-2 gap-4 mb-5 max-sm:grid-cols-1">
              <div>
                <label className="block text-[0.82rem] font-bold text-navy mb-1">Your Name</label>
                <input
                  type="text"
                  name="name"
                  placeholder="Jane Smith"
                  required
                  className="w-full py-2.5 px-4 border-[1.5px] border-border rounded-lg font-body text-[0.9rem] text-text bg-white outline-none focus:border-pink transition-colors"
                />
              </div>
              <div>
                <label className="block text-[0.82rem] font-bold text-navy mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  name="email"
                  placeholder="jane@example.com"
                  required
                  className="w-full py-2.5 px-4 border-[1.5px] border-border rounded-lg font-body text-[0.9rem] text-text bg-white outline-none focus:border-pink transition-colors"
                />
              </div>
            </div>
            <div className="mb-5">
              <label className="block text-[0.82rem] font-bold text-navy mb-1">
                What is this about?
              </label>
              <select
                name="topic"
                required
                className="w-full py-2.5 px-4 border-[1.5px] border-border rounded-lg font-body text-[0.9rem] text-text bg-white outline-none focus:border-pink transition-colors"
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
                className="w-full py-2.5 px-4 border-[1.5px] border-border rounded-lg font-body text-[0.9rem] text-text bg-white outline-none focus:border-pink transition-colors h-[120px] resize-y"
              />
            </div>
            <button
              type="submit"
              className="bg-pink text-white border-none rounded-lg py-3.5 px-10 font-body text-[1rem] font-bold cursor-pointer w-full hover:opacity-90 transition-opacity"
            >
              Send Message &rarr;
            </button>
          </form>
        </div>

        <p className="text-[0.82rem] text-muted text-center">
          We typically respond within 1-2 business days. For fastest response, email us directly at{" "}
          <a href="mailto:hello@findmymahjgame.com">hello@findmymahjgame.com</a>.
        </p>
      </div>
    </>
  );
}
