"use client";

import { useState } from "react";
import type { Metadata } from "next";
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

export default function HowItWorksPage() {
  const [activeTab, setActiveTab] = useState<"players" | "advertisers">("players");

  return (
    <>
      <div className="page-hero">
        <div className="eyebrow">How It Works</div>
        <h1>Everything You Need to Know</h1>
        <p>
          Whether you&rsquo;re a player looking for a game or a business wanting to reach mahjong
          players, we make it simple.
        </p>
      </div>

      <div className="page-body" style={{ maxWidth: 860 }}>
        {/* Tabs */}
        <div className="flex gap-0 border-b-2 border-border my-8">
          <button
            className={`py-3 px-6 text-[0.92rem] font-semibold cursor-pointer border-b-2 -mb-[2px] transition-all bg-transparent ${
              activeTab === "players"
                ? "text-navy border-pink"
                : "text-muted border-transparent"
            }`}
            onClick={() => setActiveTab("players")}
          >
            For Players
          </button>
          <button
            className={`py-3 px-6 text-[0.92rem] font-semibold cursor-pointer border-b-2 -mb-[2px] transition-all bg-transparent ${
              activeTab === "advertisers"
                ? "text-navy border-pink"
                : "text-muted border-transparent"
            }`}
            onClick={() => setActiveTab("advertisers")}
          >
            For Advertisers &amp; Venues
          </button>
        </div>

        {/* Players Tab */}
        {activeTab === "players" && (
          <div>
            <h2 style={{ marginTop: 0 }}>Finding Your Game</h2>
            <div className="flex flex-col gap-6 my-6">
              <Step num={1} title="Go to your state page" desc="Click your state on the map or navigate directly e.g. findmymahjgame.com/florida. Every state has its own page with players, events and venues." />
              <Step num={2} title="Search by city or zip code" desc="Use the city dropdown or enter your zip code and select your distance range 5, 10, 25 or 50 miles. Results update instantly." />
              <Step num={3} title="Browse players, events and venues" desc="Switch between the Players, Events and Where to Play tabs to find exactly what you're looking for." />
              <Step num={4} title="Connect & play!" desc="Click Connect on a player card, RSVP to an event, or visit a venue. It's always free for players." />
            </div>

            <h2>List Yourself as a Player</h2>
            <div className="flex flex-col gap-6 my-6">
              <Step num={1} title='Click "Create My Listing"' desc="On any state page or from the map on the homepage." />
              <Step num={2} title="Fill in your info" desc="Your city, skill level, preferred schedule and a short bio. No last name or personal contact info required." />
              <Step num={3} title="Go live!" desc="Your listing appears on your state page and players nearby can connect with you. Always free." />
            </div>

            <div className="highlight-box">
              <p>
                Player listings are always <strong>100% free</strong>. Find My Mahj Game will never
                charge players to find or list a game.
              </p>
            </div>
          </div>
        )}

        {/* Advertisers Tab */}
        {activeTab === "advertisers" && (
          <div>
            <h2 style={{ marginTop: 0 }}>Advertising &amp; Listings</h2>
            <div className="flex flex-col gap-6 my-6">
              <Step num={1} title="Submit your inquiry" desc="Fill out the form on our Advertise page or email hello@findmymahjgame.com. Takes less than 2 minutes." />
              <Step num={2} title="We review & approve" desc="All listings are reviewed within 1-2 business days. We maintain quality standards for all advertisers." />
              <Step num={3} title="Receive your invoice" desc="Once approved you'll receive a payment link. Choose monthly or annual your call." />
              <Step num={4} title="Go live!" desc="Your listing or ad goes live within 24-48 hours of payment. Start reaching players right away." />
            </div>

            <h2>Where to Play Venue Tiers</h2>
            <div className="grid grid-cols-3 gap-4 my-6 max-sm:grid-cols-1">
              <div className="bg-bg border border-border rounded-xl p-5">
                <h3 className="text-[0.9rem] font-bold text-navy mb-1">Starter Listing</h3>
                <div className="font-heading text-[1.4rem] text-pink font-black mb-1">$19/mo</div>
                <p className="text-[0.78rem] text-muted !mb-0">
                  Name, city, hours, description, website link
                </p>
              </div>
              <div className="bg-bg border border-pink rounded-xl p-5">
                <h3 className="text-[0.9rem] font-bold text-navy mb-1">
                  Featured Spot ⭐ Most Popular
                </h3>
                <div className="font-heading text-[1.4rem] text-pink font-black mb-1">$39/mo</div>
                <p className="text-[0.78rem] text-muted !mb-0">
                  Top placement + highlighted listing + photo
                </p>
              </div>
              <div className="bg-bg border border-border rounded-xl p-5">
                <h3 className="text-[0.9rem] font-bold text-navy mb-1">Official Mahj Spot</h3>
                <div className="font-heading text-[1.4rem] text-pink font-black mb-1">$79/mo</div>
                <p className="text-[0.78rem] text-muted !mb-0">
                  Featured + homepage + badge you can display
                </p>
              </div>
            </div>

            <p className="text-center mt-4">
              <Link
                href="/advertise"
                className="bg-pink text-white py-3 px-8 rounded-md font-bold no-underline inline-block"
              >
                See All Advertising Options &rarr;
              </Link>
            </p>
          </div>
        )}
      </div>
    </>
  );
}
