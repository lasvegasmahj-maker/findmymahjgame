"use client";

import { useState } from "react";
import Link from "next/link";

const CITIES = [
  "All of Florida",
  "Miami",
  "Boca Raton",
  "Orlando",
  "Tampa",
  "Naples",
  "Fort Lauderdale",
  "Palm Beach",
  "Sarasota",
  "Jacksonville",
];

export default function FloridaPage() {
  const [activeTab, setActiveTab] = useState<"players" | "events" | "venues">("players");
  const [selectedCity, setSelectedCity] = useState("All of Florida");

  return (
    <>
      {/* Ad Banner */}
      <div className="bg-bg py-3 px-8">
        <div className="max-w-[1100px] mx-auto bg-white border-2 border-dashed border-[rgba(233,30,140,0.25)] rounded-xl py-5 px-8 flex items-center justify-between gap-4 flex-wrap">
          <div>
            <span className="text-[0.62rem] font-bold tracking-[0.15em] uppercase text-[rgba(233,30,140,0.5)] block mb-1">
              Advertisement
            </span>
            <div className="font-bold text-[0.95rem] text-navy">
              Advertise Here &mdash; Reach Mahjong Players in Florida
            </div>
            <div className="text-[0.78rem] text-muted mt-0.5">
              Advertise to thousands of mahjong players across Florida and the US
            </div>
          </div>
          <Link
            href="/advertise"
            className="bg-pink text-white rounded-md py-2 px-5 font-bold text-[0.82rem] no-underline whitespace-nowrap shrink-0"
          >
            Learn More &rarr;
          </Link>
        </div>
      </div>

      {/* Hero */}
      <section className="bg-gradient-to-br from-navy to-navy-light py-12 px-8 text-center">
        <p className="text-[0.78rem] text-white/50 mb-4">
          <Link href="/" className="text-pink no-underline">
            Home
          </Link>{" "}
          &rsaquo;{" "}
          <Link href="/#map" className="text-pink no-underline">
            Find Players
          </Link>{" "}
          &rsaquo; Florida
        </p>
        <h1 className="font-heading text-[clamp(2rem,5vw,3.5rem)] text-white mb-2">
          Mahjong in <span className="text-pink">Florida</span>
        </h1>
        <p className="text-[1rem] text-white/65 max-w-[500px] mx-auto mb-8">
          Find players, groups, open plays and events across Florida &mdash; from Miami to
          Jacksonville and everywhere in between.
        </p>
        <div className="flex gap-10 justify-center flex-wrap">
          <div>
            <div className="font-heading text-[2rem] text-white font-black">&mdash;</div>
            <div className="text-[0.75rem] text-white/50 mt-0.5">Players Listed</div>
          </div>
          <div>
            <div className="font-heading text-[2rem] text-white font-black">&mdash;</div>
            <div className="text-[0.75rem] text-white/50 mt-0.5">Groups</div>
          </div>
          <div>
            <div className="font-heading text-[2rem] text-white font-black">&mdash;</div>
            <div className="text-[0.75rem] text-white/50 mt-0.5">Events</div>
          </div>
          <div>
            <div className="font-heading text-[2rem] text-white font-black">&mdash;</div>
            <div className="text-[0.75rem] text-white/50 mt-0.5">Venues</div>
          </div>
        </div>
      </section>

      {/* Search Bar */}
      <div className="bg-navy py-5 px-8 border-t border-white/10 sticky top-[52px] z-50">
        <div className="max-w-[1100px] mx-auto flex items-end gap-4 flex-wrap justify-center">
          <div className="flex flex-col gap-1">
            <div className="text-[0.68rem] font-bold tracking-[0.12em] uppercase text-white/50">
              City / Town
            </div>
            <select
              value={selectedCity}
              onChange={(e) => setSelectedCity(e.target.value)}
              className="bg-white border-none rounded-md py-2.5 px-4 font-body text-[0.88rem] text-navy outline-none cursor-pointer min-w-[190px]"
            >
              {CITIES.map((city) => (
                <option key={city} value={city}>
                  {city}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <div className="text-[0.68rem] font-bold tracking-[0.12em] uppercase text-white/50">
              Distance
            </div>
            <div className="flex gap-1.5">
              {["5 mi", "10 mi", "25 mi", "50 mi"].map((d, i) => (
                <button
                  key={d}
                  className={`border-[1.5px] rounded-md py-2 px-3 text-[0.8rem] font-semibold cursor-pointer font-body transition-all ${
                    i === 0
                      ? "bg-pink border-pink text-white"
                      : "bg-white/10 border-white/20 text-white/70 hover:bg-pink hover:border-pink hover:text-white"
                  }`}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>
          <div className="flex flex-col gap-1">
            <div className="text-[0.68rem] font-bold tracking-[0.12em] uppercase text-white/50">
              Or Enter Zip Code
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Enter zip"
                maxLength={5}
                className="bg-white border-none rounded-md py-2.5 px-4 font-body text-[0.88rem] text-navy outline-none w-[120px]"
              />
              <button className="bg-pink text-white border-none rounded-md py-2.5 px-4 font-bold text-[0.85rem] cursor-pointer font-body">
                Search
              </button>
            </div>
          </div>
        </div>
        <div className="text-center mt-3 text-[0.8rem] text-white/55">
          Showing all players, events &amp; venues across{" "}
          <strong className="text-white">Florida</strong>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-[1100px] mx-auto py-12 px-8 grid grid-cols-[1fr_260px] gap-8 items-start max-md:grid-cols-1">
        <div>
          {/* Tabs */}
          <div className="flex gap-0 border-b-2 border-border mb-6">
            {[
              { id: "players" as const, label: "Players", icon: "👥" },
              { id: "events" as const, label: "Events", icon: "🎫" },
              { id: "venues" as const, label: "Where to Play", icon: "🏛" },
            ].map((tab) => (
              <button
                key={tab.id}
                className={`py-2.5 px-5 text-[0.88rem] font-semibold cursor-pointer border-b-2 -mb-[2px] transition-all bg-transparent ${
                  activeTab === tab.id
                    ? "text-navy border-pink"
                    : "text-muted border-transparent"
                }`}
                onClick={() => setActiveTab(tab.id)}
              >
                {tab.icon} {tab.label}
              </button>
            ))}
          </div>

          {/* Players Tab */}
          {activeTab === "players" && (
            <div>
              <p className="section-label">Looking for a Group</p>
              <h2 className="section-title mb-1">Players in Florida</h2>
              <p className="text-[0.9rem] text-muted mb-6">
                Connect with mahjong players across Florida looking for their perfect weekly game.
              </p>

              {/* Sponsored ad */}
              <div className="bg-gradient-to-br from-[rgba(233,30,140,0.04)] to-[rgba(233,30,140,0.08)] border border-[rgba(233,30,140,0.2)] rounded-2xl p-5 mb-6">
                <span className="text-[0.62rem] font-bold tracking-[0.12em] uppercase text-pink block mb-2">
                  📢 Advertisement
                </span>
                <div className="flex items-center justify-between flex-wrap gap-4">
                  <div>
                    <div className="font-bold text-[0.9rem] text-navy mb-1">
                      Advertise Here &mdash; Reach Mahjong Players Across Florida
                    </div>
                    <div className="text-[0.78rem] text-muted leading-relaxed">
                      Connect your brand, shop, or service with active mahjong players in Florida
                      and nationwide.
                    </div>
                  </div>
                  <Link
                    href="/advertise"
                    className="bg-pink text-white rounded-md py-2 px-5 font-bold text-[0.78rem] no-underline whitespace-nowrap"
                  >
                    Learn More &rarr;
                  </Link>
                </div>
              </div>

              {/* Empty State */}
              <div className="bg-bg border-2 border-dashed border-border rounded-2xl p-10 text-center mb-6">
                <div className="text-[2.5rem] mb-3">🀄</div>
                <h3 className="font-heading text-[1.2rem] text-navy mb-2">
                  No players listed in Florida yet
                </h3>
                <p className="text-[0.88rem] text-muted mb-4 max-w-[400px] mx-auto">
                  Be the first! Create a free listing and let other players in Florida find you.
                </p>
                <Link
                  href="/#map"
                  className="inline-block bg-pink text-white py-3 px-8 rounded-md font-bold text-[0.88rem] no-underline"
                >
                  Create My Listing &rarr;
                </Link>
              </div>

              {/* CTA Bar */}
              <div className="bg-navy rounded-2xl p-6 text-center mb-8">
                <h3 className="font-heading text-[1.2rem] text-white mb-1">
                  Looking for your Mahj Game in Florida?
                </h3>
                <p className="text-[0.82rem] text-white/55 mb-4">
                  Add your free listing and let local players find you!
                </p>
                <Link
                  href="/#map"
                  className="inline-block bg-pink text-white py-2.5 px-7 rounded-md font-bold text-[0.88rem] no-underline"
                >
                  Create My Listing &rarr;
                </Link>
              </div>
            </div>
          )}

          {/* Events Tab */}
          {activeTab === "events" && (
            <div>
              <p className="section-label">Happening in Florida</p>
              <h2 className="section-title mb-1">Events Near You</h2>
              <p className="text-[0.9rem] text-muted mb-6">
                Open plays, game nights, and mahjong events happening across Florida.
              </p>

              <div className="bg-bg border-2 border-dashed border-border rounded-xl p-8 text-center mb-6">
                <div className="text-[1.8rem] mb-2">🎫</div>
                <div className="font-bold text-[0.95rem] text-navy mb-1">
                  Host an Event in Florida?
                </div>
                <div className="text-[0.82rem] text-muted mb-4 leading-relaxed">
                  List your open play, tournament or mahjong night and reach players actively
                  searching for games near them. Starting at just $10/event.
                </div>
                <Link
                  href="/advertise"
                  className="inline-block bg-pink text-white rounded-md py-2.5 px-6 font-bold text-[0.85rem] no-underline"
                >
                  List Your Event &rarr;
                </Link>
              </div>
            </div>
          )}

          {/* Venues Tab */}
          {activeTab === "venues" && (
            <div>
              <p className="section-label">Where to Play</p>
              <h2 className="section-title mb-1">Venues in Florida</h2>
              <p className="text-[0.9rem] text-muted mb-6">
                Restaurants, studios, and community spaces in Florida that welcome mahjong players.
              </p>

              <div className="bg-bg border-2 border-dashed border-border rounded-xl p-8 text-center mb-6">
                <div className="text-[1.8rem] mb-2">🏛</div>
                <div className="font-bold text-[0.95rem] text-navy mb-1">
                  Know a mahjong-friendly venue in Florida?
                </div>
                <div className="text-[0.82rem] text-muted mb-4 leading-relaxed">
                  Help fellow players by suggesting a venue, or list your own business to get
                  discovered by players searching nearby.
                </div>
                <Link
                  href="/advertise"
                  className="inline-block bg-pink text-white rounded-md py-2.5 px-6 font-bold text-[0.85rem] no-underline"
                >
                  List a Venue &rarr;
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="sticky top-[140px] max-md:static">
          {/* Nearby States */}
          <div className="bg-bg border border-border rounded-2xl p-5 mb-4">
            <h3 className="font-heading text-[1rem] text-navy mb-4">Nearby States</h3>
            <div className="flex flex-wrap gap-2 mt-2">
              {["Georgia", "Alabama", "South Carolina", "Mississippi"].map((state) => (
                <Link
                  key={state}
                  href="#"
                  className="bg-white border-[1.5px] border-border rounded-full py-1.5 px-3.5 text-[0.78rem] font-semibold text-navy no-underline transition-all hover:border-pink hover:text-pink"
                >
                  {state}
                </Link>
              ))}
            </div>
          </div>

          {/* Ad Sidebar */}
          <div className="bg-white border-2 border-dashed border-[rgba(233,30,140,0.25)] rounded-xl p-6 text-center">
            <span className="text-[0.62rem] font-bold tracking-[0.15em] uppercase text-[rgba(233,30,140,0.5)] block mb-2">
              Advertisement
            </span>
            <div className="text-[1.8rem] mb-2">📢</div>
            <div className="font-bold text-[0.88rem] text-navy mb-1">Your Brand Here</div>
            <div className="text-[0.75rem] text-muted mb-4 leading-snug">
              Reach active mahjong players in Florida with a featured partner placement.
            </div>
            <Link
              href="/advertise"
              className="block bg-pink text-white rounded-md py-1.5 px-4 font-bold text-[0.78rem] no-underline"
            >
              Advertise Here &rarr;
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
