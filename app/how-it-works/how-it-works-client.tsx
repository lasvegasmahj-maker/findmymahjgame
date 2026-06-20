"use client";

import { useState } from "react";
import Link from "next/link";

function Step({ num, title, desc }: { num: number; title: string; desc: string }) {
  return (
    <div className="flex gap-5 items-start">
      <div className="w-10 h-10 rounded-full bg-navy text-white flex items-center justify-center font-black font-heading text-[1.1rem] shrink-0">
        {num}
      </div>
      <div>
        <h3 className="text-[1rem] font-bold text-navy mb-1">{title}</h3>
        <p className="text-muted text-[0.9rem] !mb-0">{desc}</p>
      </div>
    </div>
  );
}

export default function HowItWorksClient() {
  const [activeTab, setActiveTab] = useState<"players" | "advertisers">("players");

  return (
    <>
      <div className="page-hero">
        <div className="eyebrow">How It Works</div>
        <h1>Everything You Need to Know</h1>
        <p>Whether you&rsquo;re a player looking for a game or a teacher or organizer growing your
          local mahjong community, we make it simple.
        </p>
      </div>

      <div className="page-body" style={{ maxWidth: 860 }}>
        {/* Tabs */}
        <div className="flex gap-0 border-b-2 border-border my-8 overflow-x-auto">
          <button
            className={`py-3 px-6 text-[0.92rem] font-semibold cursor-pointer border-b-2 -mb-[2px] transition-all bg-transparent ${
              activeTab === "players"
                ? "text-navy border-pink"
                : "text-muted border-transparent"
            }`}
            onClick={() => setActiveTab("players")}
          >For Players
          </button>
          <button
            className={`py-3 px-6 text-[0.92rem] font-semibold cursor-pointer border-b-2 -mb-[2px] transition-all bg-transparent ${
              activeTab === "advertisers"
                ? "text-navy border-pink"
                : "text-muted border-transparent"
            }`}
            onClick={() => setActiveTab("advertisers")}
          >For Teachers &amp; Organizers
          </button>
        </div>

        {/* Players Tab */}
        {activeTab === "players" && (
          <div>
            <h2 style={{ marginTop: 0 }}>Finding Your Game</h2>
            <div className="flex flex-col gap-6 my-6">
              <Step num={1} title="Go to your state page" desc="Click your state on the map or navigate directly e.g. findmymahjgame.com/florida. Every state has its own page with players, events and teachers." />
              <Step num={2} title="Search by city or zip code" desc="Use the city dropdown or enter your zip code and select your distance range 5, 10, 25 or 50 miles. Results update instantly." />
              <Step num={3} title="Browse players, events and teachers" desc="Switch between the Players, Events and Teachers tabs to find exactly what you're looking for." />
              <Step num={4} title="Connect & play!" desc="Click Connect on a player card, RSVP to an event, or contact a teacher. It's always free for players." />
            </div>

            <h2>List Yourself as a Player</h2>
            <div className="flex flex-col gap-6 my-6">
              <Step num={1} title='Click "Create My Listing"' desc="On any state page or from the map on the homepage." />
              <Step num={2} title="Fill in your info" desc="Your city, skill level, preferred schedule and a short bio. No last name or personal contact info required." />
              <Step num={3} title="Go live!" desc="Your listing appears on your state page and players nearby can connect with you. Always free." />
            </div>

            <div className="highlight-box">
              <p>Player listings are always <strong>100% free</strong>. Find My Mahj Game will never
                charge players to find or list a game.
              </p>
            </div>
          </div>
        )}

        {/* Advertisers Tab */}
        {activeTab === "advertisers" && (
          <div>
            <h2 style={{ marginTop: 0 }}>Joining the Directory</h2>
            <div className="flex flex-col gap-6 my-6">
              <Step num={1} title="Submit your profile" desc="Create your profile on the Join page or email hello@findmymahjgame.com. Takes less than 2 minutes." />
              <Step num={2} title="We review & approve" desc="All listings are reviewed within 1-2 business days. We maintain quality standards for everyone listed." />
              <Step num={3} title="Choose your plan" desc="Stay on the free Community Listing, or join the Directory Membership for a verified badge and more visibility." />
              <Step num={4} title="Go live!" desc="Your listing goes live within 24-48 hours. Players start finding you right away." />
            </div>

            <h2>Membership Tiers for Teachers &amp; Organizers</h2>
            <p>Being listed is free forever. Premium tiers add visibility, a verified badge, and promotion. Players never pay.</p>
            <div className="grid grid-cols-2 gap-4 my-6 max-sm:grid-cols-1">
              <div className="bg-bg border border-border rounded-xl p-5">
                <h3 className="text-[0.9rem] font-bold text-navy mb-1">Community Listing</h3>
                <div className="font-heading text-[1.4rem] text-pink font-black mb-1">Free</div>
                <p className="text-[0.78rem] text-muted !mb-0">Your basic profile, appearing in search so players can find you. Free to be listed, always.
                </p>
              </div>
              <div className="bg-bg border border-pink rounded-xl p-5">
                <h3 className="text-[0.9rem] font-bold text-navy mb-1">Directory Membership
                </h3>
                <div className="font-heading text-[1.4rem] text-pink font-black mb-1">$89/year</div>
                <p className="text-[0.78rem] text-muted !mb-0">Verified badge, priority placement, featured on state pages, more photos, and featured events. First 6 months free with code FINDMYMAHJGAME.
                </p>
              </div>
            </div>

            <p className="text-center mt-4">
              <Link
                href="/join"
                className="bg-pink text-white py-3 px-8 rounded-md font-bold no-underline inline-block"
              >Join the Directory &rarr;
              </Link>
            </p>
          </div>
        )}
      </div>
    </>
  );
}
