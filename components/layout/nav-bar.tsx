import Link from "next/link";

export default function NavBar() {
  return (
    <div className="nav-bar">
      <Link href="/#map">Find My Local Mahj Game / Events</Link>
      <span className="sep">|</span>
      <Link href="/#retreats">Retreats &amp; Tournaments</Link>
      <span className="sep">|</span>
      <Link href="/#anywhere">Traveling and Want to Play?</Link>
      <span className="sep">|</span>
      <Link href="/#advertise">Advertise Your Company or Event</Link>
    </div>
  );
}
