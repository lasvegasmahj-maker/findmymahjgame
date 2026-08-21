import Link from "next/link";

export default function Header() {
  return (
    <nav className="site-nav">
      <Link href="/" className="site-logo" aria-label="Find My Mahj Game home">
        <img src="/find-my-mahj-game-logo.png" alt="Find My Mahj Game" />
      </Link>
      <div className="nav-right">
        <Link href="/ask" className="nav-advertise">Ask</Link>
        <Link href="/events" className="nav-advertise">Events</Link>
        <Link href="/teachers" className="nav-advertise">Teachers</Link>
        <Link href="/tournaments" className="nav-advertise">Tournaments</Link>
        <Link href="/travel" className="nav-advertise">Getaways</Link>
        <Link href="/newsletter" className="nav-advertise">Newsletter</Link>
        <Link href="/list-my-game" className="nav-cta">Create Listing</Link>
      </div>
    </nav>
  );
}
