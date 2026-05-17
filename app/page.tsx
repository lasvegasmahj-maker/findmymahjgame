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
          <Link href="/#map" className="btn-cta-primary">Find a Game</Link>
          <Link href="/how-it-works" className="btn-cta-outline">How It Works</Link>
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
                <Link href="/list-my-game" className="listing-cta">Create My Own Listing to Find My Mahj Game</Link>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* RETREATS & TOURNAMENTS */}
      <section id="retreats" style={{ background: "#f0f2ff", padding: "5rem 3rem", borderTop: "1px solid rgba(26,31,94,0.1)" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <p className="section-label" style={{ textAlign: "center" }}>Go the Distance</p>
          <h2 style={{ fontFamily: "var(--font-playfair), 'Playfair Display', serif", fontSize: "2.2rem", color: "var(--navy)", marginBottom: "0.5rem", textAlign: "center" }}>Retreats &amp; Tournaments</h2>
          <div style={{ display: "flex", justifyContent: "center", marginTop: "2rem" }}>
            <div className="rt-card" style={{ maxWidth: 480, textAlign: "center" }}>
              <p style={{ color: "var(--muted)", marginBottom: "1.2rem", lineHeight: 1.6 }}>No retreats or tournaments listed yet. Hosting one? Get listed and reach players nationwide.</p>
              <Link href="/get-listed" className="rt-btn">Get Listed &rarr;</Link>
            </div>
          </div>
        </div>
      </section>

      {/* VENUES */}
      <section id="venues" style={{ background: "white", padding: "5rem 3rem", borderTop: "1px solid var(--border)" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <p className="section-label" style={{ textAlign: "center" }}>Play Near You</p>
          <h2 className="section-title" style={{ textAlign: "center", marginBottom: "0.5rem" }}>Mahjong-Friendly Venues</h2>
          <div style={{ display: "flex", justifyContent: "center", marginTop: "2rem" }}>
            <div className="rt-card" style={{ maxWidth: 480, textAlign: "center" }}>
              <p style={{ color: "var(--muted)", marginBottom: "1.2rem", lineHeight: 1.6 }}>No venues listed yet. Hosting one? Get listed and reach players nationwide.</p>
              <Link href="/get-listed" className="rt-btn">Get Listed &rarr;</Link>
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
