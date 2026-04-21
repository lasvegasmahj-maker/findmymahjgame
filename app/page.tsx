import Link from "next/link";
import USMap from "@/components/home/us-map";

export default function Home() {
  return (
    <>
      {/* HERO */}
      <section className="hero">
        <h1>Find Your <em>Perfect</em><br />Mahjong Game</h1>
        <p>Find players, join a group, and discover local events &mdash; all in one place.</p>
        <div className="hero-btns">
          <Link href="#map" className="btn-cta-primary">Find a Game</Link>
          <Link href="/how-it-works" className="btn-cta-outline">How It Works</Link>
        </div>
        <div className="hero-stats">
          <div><div className="stat-num">2,400+</div><div className="stat-label">Players Nationwide</div></div>
          <div><div className="stat-num">180+</div><div className="stat-label">Cities</div></div>
          <div><div className="stat-num">600+</div><div className="stat-label">Groups Formed</div></div>
          <div><div className="stat-num">Free</div><div className="stat-label">For Players Always</div></div>
        </div>
      </section>

      {/* MAP SECTION */}
      <section className="map-section" id="map">
        <div className="map-inner">
          <div className="map-header">
            <p className="section-label" style={{ textAlign: "center" }}>Find My Local Mahj Game</p>
            <h2 className="section-title" style={{ textAlign: "center" }}>Find Players &amp; Events Near You</h2>
            <p className="map-subtitle" style={{ textAlign: "center" }}>Click your state to see players looking for a group, add your own listing, and find local events &mdash; or search by city or zip below.</p>
          </div>

          {/* Full-width map */}
          <div className="map-wrapper">
            <USMap />
          </div>

          {/* Search below map */}
          <div className="inline-search">
            <div className="inline-search-inner">
              <p className="inline-search-label">🔍 Search by city or zip &mdash; find players, groups &amp; events near you</p>
              <div className="inline-search-box">
                <input type="text" placeholder="Enter your city or zip code..." />
                <select>
                  <option>Any Level</option>
                  <option>Beginner</option>
                  <option>Intermediate</option>
                  <option>Advanced</option>
                </select>
                <button>Search</button>
              </div>
              <div style={{ textAlign: "center", marginTop: "1.2rem", paddingTop: "1.2rem", borderTop: "1px solid rgba(255,255,255,0.1)" }}>
                <Link href="#" className="listing-cta">Create My Own Listing to Find My Mahj Game</Link>
              </div>
            </div>
          </div>

          {/* Partners row */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "1.2rem", marginTop: "2rem" }}>
            <div className="partner-card">
              <div className="partner-logo" style={{ background: "#fff0f8" }}>🎮</div>
              <div className="partner-name">Oh My Mahjong</div>
              <div className="partner-tagline">Beautiful sets &amp; accessories</div>
              <Link href="#" className="partner-btn">Shop Now &rarr;</Link>
            </div>
            <div className="partner-card" style={{ border: "2px dashed var(--border)", background: "white" }}>
              <div className="partner-name" style={{ color: "var(--muted)", marginBottom: "0.3rem" }}>Your Brand Here</div>
              <div className="partner-tagline">Reach players nationwide</div>
              <Link href="#advertise" className="partner-btn" style={{ background: "var(--navy)" }}>Get Listed &rarr;</Link>
            </div>
            <div className="partner-card" style={{ border: "2px dashed var(--border)", background: "white" }}>
              <div className="partner-name" style={{ color: "var(--muted)", marginBottom: "0.3rem" }}>Your Brand Here</div>
              <div className="partner-tagline">Reach players nationwide</div>
              <Link href="#advertise" className="partner-btn" style={{ background: "var(--navy)" }}>Get Listed &rarr;</Link>
            </div>
            <div className="partner-card" style={{ border: "2px dashed var(--border)", background: "white" }}>
              <div className="partner-name" style={{ color: "var(--muted)", marginBottom: "0.3rem" }}>Your Brand Here</div>
              <div className="partner-tagline">Reach players nationwide</div>
              <Link href="#advertise" className="partner-btn" style={{ background: "var(--navy)" }}>Get Listed &rarr;</Link>
            </div>
          </div>
        </div>
      </section>

      {/* SPONSORED BANNER */}
      <div className="sponsored-banner">
        <div className="sponsored-banner-inner">
          <span className="sponsored-tag">Sponsored</span>
          <div className="sponsored-logo" style={{ background: "#fff0f8" }}>🀄</div>
          <div className="sponsored-text">
            <strong>Oh My Mahjong &mdash; The #1 Destination for Mahjong Sets &amp; Accessories</strong>
            <p>Use code FINDMYMAHJ for 10% off your first order &mdash; sets, bags, racks &amp; more!</p>
          </div>
          <Link href="#" className="sponsored-cta">Shop Now &rarr;</Link>
        </div>
      </div>

      {/* RETREATS & TOURNAMENTS */}
      <section id="retreats" style={{ background: "#f0f2ff", padding: "5rem 3rem", borderTop: "1px solid rgba(26,31,94,0.1)" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <p className="section-label" style={{ textAlign: "center" }}>Go the Distance</p>
          <h2 style={{ fontFamily: "var(--font-playfair), 'Playfair Display', serif", fontSize: "2.2rem", color: "var(--navy)", marginBottom: "0.5rem", textAlign: "center" }}>Retreats &amp; Tournaments</h2>
          <p style={{ color: "var(--muted)", marginBottom: "2rem", fontSize: "1rem", maxWidth: 600, textAlign: "center", marginLeft: "auto", marginRight: "auto" }}>Browse mahjong retreats and tournaments across the US. Click any listing to visit the organizer&rsquo;s page and sign up directly.</p>

          <p style={{ fontSize: "0.72rem", fontWeight: 700, letterSpacing: "0.2em", textTransform: "uppercase", color: "var(--muted)", marginBottom: "1rem" }}>🏖️ Retreats</p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "1.2rem", marginBottom: "2.5rem" }}>
            <div className="rt-card">
              <p className="rt-tag" style={{ color: "var(--pink)" }}>Retreat &middot; Arizona</p>
              <h3 className="rt-title">Southwest Mahjong Retreat</h3>
              <p className="rt-meta">📅 May 2&ndash;4, 2025</p>
              <p className="rt-meta">📍 Sedona, AZ</p>
              <Link href="#" className="rt-btn">Visit &amp; Register &rarr;</Link>
            </div>
            <div className="rt-card">
              <p className="rt-tag" style={{ color: "var(--pink)" }}>Retreat &middot; California</p>
              <h3 className="rt-title">Palm Springs Mahj Weekend</h3>
              <p className="rt-meta">📅 August 8&ndash;10, 2025</p>
              <p className="rt-meta">📍 Palm Springs, CA</p>
              <Link href="#" className="rt-btn">Visit &amp; Register &rarr;</Link>
            </div>
            <div className="cta-placeholder">
              <p className="cta-title">Hosting a Retreat?</p>
              <p className="cta-desc">Get your listing in front of players nationwide</p>
              <Link href="#advertise" className="rt-btn">Get Listed &rarr;</Link>
            </div>
          </div>

          <p style={{ fontSize: "0.72rem", fontWeight: 700, letterSpacing: "0.2em", textTransform: "uppercase", color: "var(--muted)", marginBottom: "1rem" }}>🏆 Tournaments</p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "1.2rem" }}>
            <div className="rt-card">
              <p className="rt-tag" style={{ color: "var(--navy)" }}>Tournament &middot; New York</p>
              <h3 className="rt-title">Northeast Mahjong Tournament</h3>
              <p className="rt-meta">📅 June 7&ndash;8, 2025</p>
              <p className="rt-meta">📍 Manhattan, NY</p>
              <Link href="#" className="rt-btn">Visit &amp; Register &rarr;</Link>
            </div>
            <div className="rt-card">
              <p className="rt-tag" style={{ color: "var(--navy)" }}>Tournament &middot; Florida</p>
              <h3 className="rt-title">Sunshine State Mahjong Classic</h3>
              <p className="rt-meta">📅 September 20&ndash;21, 2025</p>
              <p className="rt-meta">📍 Boca Raton, FL</p>
              <Link href="#" className="rt-btn">Visit &amp; Register &rarr;</Link>
            </div>
            <div className="cta-placeholder">
              <p className="cta-title">Running a Tournament?</p>
              <p className="cta-desc">Reach competitive players nationwide</p>
              <Link href="#advertise" className="rt-btn">Get Listed &rarr;</Link>
            </div>
          </div>
        </div>
      </section>

      {/* VENUES */}
      <section id="venues" style={{ background: "white", padding: "5rem 3rem", borderTop: "1px solid var(--border)" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <p className="section-label" style={{ textAlign: "center" }}>Play Near You</p>
          <h2 className="section-title" style={{ textAlign: "center", marginBottom: "0.5rem" }}>Mahjong-Friendly Venues</h2>
          <p style={{ textAlign: "center", color: "var(--muted)", marginBottom: "2rem", maxWidth: 600, marginLeft: "auto", marginRight: "auto" }}>Find restaurants, studios, social clubs, and community spaces near you that welcome mahjong players. Click any listing to visit their website.</p>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "1.2rem" }}>
            {[
              { color: "var(--pink)", typeColor: "var(--pink)", type: "Restaurant · Nevada", name: "Honey Salt", loc: "Las Vegas, NV", desc: "Welcoming to mahjong groups — great tables and atmosphere!", btnBg: "var(--pink)", btnColor: "white" },
              { color: "var(--navy)", typeColor: "var(--navy)", type: "Community Center · Florida", name: "Boca Raton JCC", loc: "Boca Raton, FL", desc: "Regular mahjong sessions with dedicated table space for groups.", btnBg: "var(--navy)", btnColor: "white" },
              { color: "var(--green)", typeColor: "var(--green)", type: "Mahjong Studio · New York", name: "NYC Mahjong Club", loc: "Manhattan, NY", desc: "Dedicated mahjong studio with sets provided. Drop-in and membership options.", btnBg: "var(--green)", btnColor: "var(--navy)" },
              { color: "var(--pink)", typeColor: "var(--pink)", type: "Restaurant · Illinois", name: "Panera Bread — Evanston", loc: "Evanston, IL", desc: "Spacious seating, free WiFi and welcoming to regular mahjong groups.", btnBg: "var(--pink)", btnColor: "white" },
              { color: "var(--gold)", typeColor: "#a07800", type: "Social Club · California", name: "Palm Springs Mahj Social", loc: "Palm Springs, CA", desc: "Weekly social club with morning and afternoon sessions. All levels welcome.", btnBg: "var(--gold)", btnColor: "var(--navy)" },
            ].map((v) => (
              <div key={v.name} className="venue-card">
                <div className="venue-stripe" style={{ background: v.color }} />
                <div className="venue-body">
                  <div className="venue-type" style={{ color: v.typeColor }}>{v.type}</div>
                  <h3 className="venue-name">{v.name}</h3>
                  <p className="venue-meta">📍 {v.loc}</p>
                  <p className="venue-desc">{v.desc}</p>
                  <Link href="#" className="venue-btn" style={{ background: v.btnBg, color: v.btnColor }}>Visit Website &rarr;</Link>
                </div>
              </div>
            ))}

            {/* List venue CTA */}
            <div style={{ background: "var(--navy)", borderRadius: 16, padding: "1.4rem", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", minHeight: 180 }}>
              <div style={{ fontSize: "1.8rem", marginBottom: "0.6rem", color: "white" }}>+</div>
              <h3 style={{ color: "white", fontSize: "1rem", marginBottom: "0.4rem" }}>List Your Venue</h3>
              <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "0.8rem", marginBottom: "1rem", lineHeight: 1.5 }}>Restaurant, studio, or community space? Reach local mahjong players!</p>
              <Link href="#advertise" className="rt-btn">Get Listed &rarr;</Link>
            </div>
          </div>
        </div>
      </section>

      {/* TRAVELING */}
      <section id="anywhere" style={{ background: "#fff5fa", padding: "5rem 3rem", borderTop: "1px solid rgba(233,30,140,0.1)" }}>
        <div className="anywhere-inner">
          <p className="section-label" style={{ textAlign: "center" }}>Take Your Game on the Road</p>
          <h2 style={{ fontFamily: "var(--font-playfair), 'Playfair Display', serif", fontSize: "2.2rem", color: "var(--navy)", marginBottom: "0.5rem", textAlign: "center" }}>Traveling and Want to Play?</h2>
          <p style={{ color: "var(--muted)", marginBottom: "2.5rem", fontSize: "1rem", textAlign: "center" }}>Don&rsquo;t let travel stop your game &mdash; find players wherever you land or connect with fellow cruise passengers before you board.</p>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.2rem" }}>
            <div className="anywhere-card">
              <div className="anywhere-icon">✈️</div>
              <h3>Traveling? Find a Game</h3>
              <p>Visiting a new city? Use the map to find local players wherever you land. Never go without mahjong again!</p>
              <Link href="#map" className="btn-anywhere">Use the Map &rarr;</Link>
            </div>
            <div className="anywhere-card">
              <div className="anywhere-icon">🚢</div>
              <h3>Going on a Cruise?</h3>
              <p>Setting sail? Don&rsquo;t forget your tiles! Post your cruise ship and dates to find fellow passengers who play &mdash; someone might even bring a set. Your perfect sea-day game is waiting!</p>
              <Link href="#" className="btn-anywhere">Find Cruise Passengers &rarr;</Link>
            </div>
          </div>
        </div>
      </section>

      {/* ADVERTISE */}
      <section id="advertise" className="ads-section">
        <div className="ads-inner">
          <p className="section-label" style={{ color: "var(--green)" }}>Advertise With Us</p>
          <h2 className="section-title">Reach Mahjong Players Nationwide</h2>
          <p style={{ color: "var(--muted)", lineHeight: 1.7, margin: "1rem auto 2.5rem", maxWidth: 480 }}>Interested in advertising your brand, company, or event to thousands of mahjong players? We&rsquo;d love to hear from you!</p>
          <Link href="/advertise" className="btn-cta-primary">Get In Touch &rarr;</Link>
        </div>
      </section>
    </>
  );
}
