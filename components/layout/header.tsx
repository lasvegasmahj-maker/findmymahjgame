import Link from "next/link";

export default function Header() {
  return (
    <nav className="site-nav">
      <Link href="/" className="site-logo">
        Find My <span>Mahj Game</span>
      </Link>
      <div className="nav-right">
        <Link href="/advertise" className="nav-advertise">Advertise</Link>
        <Link href="#" className="btn-login">Log In</Link>
      </div>
    </nav>
  );
}
