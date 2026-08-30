import Link from "next/link";

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="footer-inner">
        <div className="footer-brand">
          <Link href="/" aria-label="Find My Mahj Game home" className="footer-logo-link">
            <img src="/find-my-mahj-game-logo.png" alt="Find My Mahj Game" className="footer-logo-img" />
          </Link>
          <p className="footer-tagline">Find local mahjong games, players, teachers, tournaments, and retreats.</p>
        </div>
        <div className="footer-cols">
          <div>
            <h4>Find Games</h4>
            <Link href="/events">Events</Link>
            <Link href="/teachers">Teachers</Link>
            <Link href="/states">Browse States</Link>
            <Link href="/newsletter">Newsletter</Link>
          </div>
          <div>
            <h4>Explore</h4>
            <Link href="/">Home</Link>
            <Link href="/about">About</Link>
            <Link href="/how-it-works">How It Works</Link>
            <Link href="/faq">FAQ</Link>
            <Link href="/join">For Teachers &amp; Organizers</Link>
            <Link href="/founding-advisors">Founding Advisors</Link>
            <Link href="/contact">Contact</Link>
          </div>
          <div>
            <h4>Players</h4>
            <Link href="/list-my-game">Create a Free Listing</Link>
            <Link href="/states/texas">Texas</Link>
            <Link href="/states/florida">Florida</Link>
            <Link href="/states/california">California</Link>
            <Link href="/states/new-york">New York</Link>
            <Link href="/states/nevada">Nevada</Link>
          </div>
          <div>
            <h4>Teachers &amp; Organizers</h4>
            <Link href="/join">Join the Directory</Link>
            <Link href="/get-listed">Submit a Profile</Link>
          </div>
          <div>
            <h4>Legal</h4>
            <Link href="/terms">Terms of Use</Link>
            <Link href="/privacy">Privacy Policy</Link>
            <Link href="/provider-terms">Provider Terms</Link>
            <Link href="/billing-disclosures">Billing Disclosures</Link>
            <Link href="/matching-standards">Matching Community Standards</Link>
          </div>
        </div>
      </div>
      <div className="footer-bottom">
        <p>&copy; 2026 Find My Mahj Game. All rights reserved. &nbsp;|&nbsp; <a href="mailto:hello@findmymahjgame.com">hello@findmymahjgame.com</a></p>
      </div>
    </footer>
  );
}
