import Link from "next/link";

export default function Header() {
  return (
    <nav className="site-nav">
      <Link href="/" className="site-logo">
        Find My <span>Mahj Game</span>
      </Link>
      <div className="nav-right">
        <Link href="/events" className="nav-advertise">Events</Link>
        <Link href="/teachers" className="nav-advertise">Teachers</Link>
        <Link href="/states" className="nav-advertise">Browse States</Link>
        <Link href="/help" className="nav-advertise">Help</Link>
        <Link href="/newsletter" className="nav-advertise">Newsletter</Link>
      </div>
    </nav>
  );
}
