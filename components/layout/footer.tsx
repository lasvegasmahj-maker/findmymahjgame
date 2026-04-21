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
            <h4>Explore</h4>
            <Link href="/">Home</Link>
            <Link href="/about">About</Link>
            <Link href="/how-it-works">How It Works</Link>
            <Link href="/contact">Contact</Link>
          </div>
          <div>
            <h4>Advertisers</h4>
            <Link href="/advertise">Advertise</Link>
            <Link href="/advertiser-terms">Advertiser Terms</Link>
          </div>
          <div>
            <h4>Legal</h4>
            <Link href="#">Privacy Policy</Link>
            <Link href="/terms">Terms of Use</Link>
          </div>
        </div>
      </div>
      <div className="footer-bottom">
        <p>&copy; 2026 Find My Mahj Game. All rights reserved. &nbsp;|&nbsp; <a href="mailto:lasvegasmahj@gmail.com">lasvegasmahj@gmail.com</a></p>
      </div>
    </footer>
  );
}
