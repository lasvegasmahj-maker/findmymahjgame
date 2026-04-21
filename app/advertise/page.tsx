import type { Metadata } from "next";
import { FORMSPREE_URL, AD_EMAIL } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Advertise",
  description:
    "Reach 750,000+ US mahjong players with advertising on Find My Mahj Game. Brand placements, venue listings, event promotions and more.",
};

export default function AdvertisePage() {
  return (
    <>
      <div className="page-hero">
        <div className="eyebrow">Advertise</div>
        <h1>Reach the Mahjong Community</h1>
        <p>
          Connect your brand, venue or event with 750,000+ US mahjong players actively searching for
          their next game.
        </p>
      </div>

      <div className="page-body" style={{ maxWidth: 900 }}>
        {/* Stats */}
        <div className="grid grid-cols-4 gap-4 my-10 max-sm:grid-cols-2">
          {[
            { num: "750K+", label: "US Players" },
            { num: "50", label: "State Pages" },
            { num: "23.4%", label: "Global Mahj Clicks" },
            { num: "100%", label: "Niche Audience" },
          ].map((stat) => (
            <div key={stat.label} className="bg-bg border border-border rounded-xl p-5 text-center">
              <div className="font-heading text-[1.8rem] text-navy font-black">{stat.num}</div>
              <div className="text-[0.75rem] text-muted mt-0.5">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Brand Advertising */}
        <h2>Brand &amp; Company Advertising</h2>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse my-4">
            <thead>
              <tr>
                <th className="bg-navy text-white py-3 px-4 text-left text-[0.82rem] font-bold">Placement</th>
                <th className="bg-navy text-white py-3 px-4 text-left text-[0.82rem] font-bold">Description</th>
                <th className="bg-navy text-white py-3 px-4 text-left text-[0.82rem] font-bold">Reach</th>
                <th className="bg-navy text-white py-3 px-4 text-left text-[0.82rem] font-bold">Price</th>
              </tr>
            </thead>
            <tbody>
              {[
                { place: "Top Partner Bar", desc: "Premium placement at top of every page", reach: "All visitors", price: "$299/mo" },
                { place: "Featured Partner Card", desc: "Logo, tagline + CTA next to the map", reach: "All visitors", price: "$229/mo" },
                { place: "Sponsored Banner", desc: "Full-width banner between page sections", reach: "All visitors", price: "$149/mo" },
                { place: "Sponsored Map Card", desc: "Appears in player search results by state", reach: "By state", price: "$99/mo" },
              ].map((row, i) => (
                <tr key={row.place} className={i % 2 === 1 ? "bg-bg" : ""}>
                  <td className="py-3 px-4 border-b border-border text-[0.88rem] font-bold text-navy">{row.place}</td>
                  <td className="py-3 px-4 border-b border-border text-[0.88rem] text-muted">{row.desc}</td>
                  <td className="py-3 px-4 border-b border-border text-[0.88rem] text-muted">{row.reach}</td>
                  <td className="py-3 px-4 border-b border-border text-[0.95rem] text-pink font-bold">{row.price}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Venue Listings */}
        <h2>Where to Play &mdash; Venue Listings</h2>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse my-4">
            <thead>
              <tr>
                <th className="bg-navy text-white py-3 px-4 text-left text-[0.82rem] font-bold">Tier</th>
                <th className="bg-navy text-white py-3 px-4 text-left text-[0.82rem] font-bold">Features</th>
                <th className="bg-navy text-white py-3 px-4 text-left text-[0.82rem] font-bold">Monthly</th>
                <th className="bg-navy text-white py-3 px-4 text-left text-[0.82rem] font-bold">Annual</th>
              </tr>
            </thead>
            <tbody>
              {[
                { tier: "Starter Listing", feat: "Name, city, hours, description, website link", monthly: "$19/mo", annual: "$129/yr" },
                { tier: "Featured Spot ⭐", feat: "Top placement, highlighted listing, photo", monthly: "$39/mo", annual: "$329/yr" },
                { tier: "Official Mahj Spot", feat: "Featured + homepage placement + displayable badge", monthly: "$79/mo", annual: "$699/yr" },
              ].map((row, i) => (
                <tr key={row.tier} className={i % 2 === 1 ? "bg-bg" : ""}>
                  <td className="py-3 px-4 border-b border-border text-[0.88rem] font-bold text-navy">{row.tier}</td>
                  <td className="py-3 px-4 border-b border-border text-[0.88rem] text-muted">{row.feat}</td>
                  <td className="py-3 px-4 border-b border-border text-[0.95rem] text-pink font-bold">{row.monthly}</td>
                  <td className="py-3 px-4 border-b border-border text-[0.95rem] text-[#1a6e3a] font-bold bg-[#f0fff4]">{row.annual}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Event Listings */}
        <h2>Event &amp; Tournament Listings</h2>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse my-4">
            <thead>
              <tr>
                <th className="bg-navy text-white py-3 px-4 text-left text-[0.82rem] font-bold">Type</th>
                <th className="bg-navy text-white py-3 px-4 text-left text-[0.82rem] font-bold">Description</th>
                <th className="bg-navy text-white py-3 px-4 text-left text-[0.82rem] font-bold">Reach</th>
                <th className="bg-navy text-white py-3 px-4 text-left text-[0.82rem] font-bold">Price</th>
              </tr>
            </thead>
            <tbody>
              {[
                { type: "Local Event", desc: "Open play or city event (30 days)", reach: "Regional", price: "$10/event or $199/yr" },
                { type: "National Event", desc: "Retreats & tournaments (60 days)", reach: "US audience", price: "$199/listing or $500/yr" },
                { type: "Featured Event", desc: "Top placement on all event pages", reach: "US audience", price: "$299/mo" },
              ].map((row, i) => (
                <tr key={row.type} className={i % 2 === 1 ? "bg-bg" : ""}>
                  <td className="py-3 px-4 border-b border-border text-[0.88rem] font-bold text-navy">{row.type}</td>
                  <td className="py-3 px-4 border-b border-border text-[0.88rem] text-muted">{row.desc}</td>
                  <td className="py-3 px-4 border-b border-border text-[0.88rem] text-muted">{row.reach}</td>
                  <td className="py-3 px-4 border-b border-border text-[0.95rem] text-pink font-bold">{row.price}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Founding Partner */}
        <div className="bg-gradient-to-br from-[#fffdf0] to-[#fff8dc] border-2 border-gold rounded-2xl p-8 text-center my-8">
          <h3 className="font-heading text-[1.4rem] text-[#5a4000] mb-2">
            ⭐ Founding Partner &mdash; Limited Spots
          </h3>
          <p className="text-[0.9rem] text-[#7a6020] max-w-[500px] mx-auto mb-5">
            Lock in early pricing + priority placement + Founding Partner badge featured in all
            launch marketing. Only a few spots available.
          </p>
          <a
            href="#inquire"
            className="inline-block bg-gold text-[#5a4000] rounded-md py-2.5 px-7 font-bold text-[0.9rem] no-underline"
          >
            Apply Now &rarr;
          </a>
        </div>

        {/* How It Works Steps */}
        <h2>How It Works</h2>
        <div className="flex my-6 max-sm:flex-col">
          {[
            { icon: "📝", title: "1. Submit Inquiry", desc: "Fill out the form below — takes 2 minutes" },
            { icon: "✅", title: "2. Review & Approve", desc: "We respond within 1-2 business days" },
            { icon: "💳", title: "3. Receive Invoice", desc: "Monthly or annual — your choice" },
            { icon: "🚀", title: "4. Go Live!", desc: "Within 24-48 hrs of payment" },
          ].map((step, i) => (
            <div
              key={step.title}
              className={`flex-1 text-center p-5 ${
                i < 3
                  ? "border-r border-border max-sm:border-r-0 max-sm:border-b"
                  : ""
              }`}
            >
              <div className="text-[1.5rem] mb-1">{step.icon}</div>
              <div className="font-bold text-[0.88rem] text-navy mb-1">{step.title}</div>
              <div className="text-[0.78rem] text-muted">{step.desc}</div>
            </div>
          ))}
        </div>

        {/* Inquiry Form */}
        <div className="bg-bg border border-border rounded-2xl p-8 my-8" id="inquire">
          <h2 style={{ border: "none", marginTop: 0 }}>Start Your Inquiry</h2>
          <form action={FORMSPREE_URL} method="POST">
            <div className="grid grid-cols-2 gap-4 mb-5 max-sm:grid-cols-1">
              <div>
                <label className="block text-[0.82rem] font-bold text-navy mb-1">Name</label>
                <input
                  type="text"
                  name="name"
                  required
                  placeholder="Your name"
                  className="w-full py-2.5 px-4 border-[1.5px] border-border rounded-lg font-body text-[0.9rem] text-text bg-white outline-none focus:border-pink transition-colors"
                />
              </div>
              <div>
                <label className="block text-[0.82rem] font-bold text-navy mb-1">Email</label>
                <input
                  type="email"
                  name="email"
                  required
                  placeholder="you@company.com"
                  className="w-full py-2.5 px-4 border-[1.5px] border-border rounded-lg font-body text-[0.9rem] text-text bg-white outline-none focus:border-pink transition-colors"
                />
              </div>
            </div>
            <div className="mb-5">
              <label className="block text-[0.82rem] font-bold text-navy mb-1">
                Company / Business Name
              </label>
              <input
                type="text"
                name="company"
                placeholder="Your company or venue name"
                className="w-full py-2.5 px-4 border-[1.5px] border-border rounded-lg font-body text-[0.9rem] text-text bg-white outline-none focus:border-pink transition-colors"
              />
            </div>
            <div className="mb-5">
              <label className="block text-[0.82rem] font-bold text-navy mb-1">
                What are you interested in?
              </label>
              <select
                name="interest"
                required
                className="w-full py-2.5 px-4 border-[1.5px] border-border rounded-lg font-body text-[0.9rem] text-text bg-white outline-none focus:border-pink transition-colors"
              >
                <option value="">Select an option...</option>
                <option>Brand / Company Advertising</option>
                <option>Where to Play — Venue Listing</option>
                <option>Local Event Listing</option>
                <option>National Event / Retreat / Tournament</option>
                <option>Founding Partner</option>
                <option>Bundle Package</option>
                <option>Other / Not Sure</option>
              </select>
            </div>
            <div className="mb-5">
              <label className="block text-[0.82rem] font-bold text-navy mb-1">
                Tell us about your brand, venue or event
              </label>
              <textarea
                name="message"
                placeholder="What do you offer? Where are you located? What are you hoping to achieve?"
                className="w-full py-2.5 px-4 border-[1.5px] border-border rounded-lg font-body text-[0.9rem] text-text bg-white outline-none focus:border-pink transition-colors h-[100px] resize-y"
              />
            </div>
            <button
              type="submit"
              className="bg-pink text-white border-none rounded-lg py-3.5 px-10 font-body text-[1rem] font-bold cursor-pointer w-full"
            >
              Submit Inquiry &rarr;
            </button>
          </form>
        </div>

        <p className="text-[0.82rem] text-muted text-center">
          Questions? Email us at <a href={`mailto:${AD_EMAIL}`}>{AD_EMAIL}</a>. See full pricing
          details in our{" "}
          <a href="/findmymahjgame_mediakit.pdf" target="_blank">
            Media Kit PDF
          </a>
          .
        </p>
      </div>
    </>
  );
}
