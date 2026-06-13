import Link from "next/link";

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="footer-inner">
        <div>
          <div className="footer-logo">Find My <span>Mahj Game</span></div>
          <p className="footer-tagline">Connecting mahjong players across all 50 states.</p>
        </div>
        <div className="footer-cols">
          <div>
            <h4>Find Games</h4>
            <Link href="/events">Events</Link>
            <Link href="/teachers">Teachers</Link>
            <Link href="/states">Browse States</Link>
            <Link href="/newsletter">Newsletter</Link>
            <Link href="/help">Help</Link>
          </div>
          <div>
            <h4>Explore</h4>
            <Link href="/">Home</Link>
            <Link href="/about">About</Link>
            <Link href="/how-it-works">How It Works</Link>
            <Link href="/faq">FAQ</Link>
            <Link href="/ambassadors">Become an Ambassador</Link>
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
            <h4>Businesses</h4>
            <Link href="/get-listed">Get Listed</Link>
            <Link href="/advertise">Advertise</Link>
            <Link href="/advertiser-terms">Advertiser Terms</Link>
          </div>
          <div>
            <h4>Legal</h4>
            <Link href="/privacy">Privacy Policy</Link>
            <Link href="/terms">Terms of Use</Link>
          </div>
        </div>
      </div>
      <div className="footer-bottom">
        <p>&copy; 2026 Find My Mahj Game. All rights reserved. &nbsp;|&nbsp; <a href="mailto:hello@findmymahjgame.com">hello@findmymahjgame.com</a></p>
      </div>
    </footer>
  );
}
