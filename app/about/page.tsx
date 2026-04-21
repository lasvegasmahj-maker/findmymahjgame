import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "About",
  description:
    "Find My Mahj Game connects mahjong players across all 50 states with local games, events, retreats, tournaments and places to play.",
};

export default function AboutPage() {
  return (
    <>
      <div className="page-hero">
        <div className="eyebrow">About Us</div>
        <h1>What is Find My Mahj Game?</h1>
        <p>
          The go-to platform connecting mahjong players, venues and events across all 50 states.
        </p>
      </div>

      <div className="page-body" style={{ maxWidth: 900 }}>
        {/* Mission Box */}
        <div className="bg-gradient-to-br from-[rgba(233,30,140,0.04)] to-[rgba(233,30,140,0.08)] border border-[rgba(233,30,140,0.2)] rounded-2xl p-8 text-center my-8">
          <h3 className="font-heading text-[1.4rem] text-navy mb-3">
            &ldquo;I learned how to play mahjong now what?&rdquo;
          </h3>
          <p className="text-muted max-w-[500px] mx-auto !mb-0">
            That question is exactly why Find My Mahj Game exists. Learning to play is just the
            beginning. Finding <em>your people</em> that&rsquo;s where the real game starts.
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4 my-10 max-sm:grid-cols-2">
          {[
            { num: "750K+", label: "US Players" },
            { num: "50", label: "States Covered" },
            { num: "Free", label: "For Players" },
            { num: "100%", label: "Mahj-Focused" },
          ].map((stat) => (
            <div
              key={stat.label}
              className="bg-bg border border-border rounded-xl p-5 text-center"
            >
              <div className="font-heading text-[1.8rem] text-navy font-black">{stat.num}</div>
              <div className="text-[0.75rem] text-muted mt-0.5">{stat.label}</div>
            </div>
          ))}
        </div>

        <h2>Our Story</h2>
        <p>
          Find My Mahj Game was created by Shauna, a certified Oh My Mahjong (OMM) instructor and
          founder of{" "}
          <a href="https://lasvegasmahj.com" target="_blank" rel="noopener noreferrer">
            Las Vegas Mahjong
          </a>
          .
        </p>
        <p>The idea came from two very real problems Shauna kept seeing over and over.</p>
        <p>
          The first: students who finished their lessons and then had no idea where to go next. They
          loved the game, they knew how to play but finding a regular group to play with felt like a
          second job. There was no central place to look. No directory. No map. Just word of mouth
          and luck.
        </p>
        <p>
          The second was personal. When Shauna moved to a brand new city, she was lucky enough to
          find a mahjong group to play with quickly but she knew that was the exception, not the
          rule. Most people who move to a new place and want to find their mahjong people have no
          easy way to do it. They search online and come up empty. They ask around and get nowhere.
          The community is out there, but now it will be easier to find it with Find My Mahj Game!
        </p>
        <p>
          Find My Mahj Game was built to solve both problems. It is the first and only platform
          built exclusively for the American mahjong community connecting players with local games,
          groups, events, venues, retreats and tournaments across all 50 states. Whether you just
          learned to play or you just moved to a new city, you should never have to wonder where
          your next game is.
        </p>

        <h2>Who We Serve</h2>
        <h3>Players</h3>
        <p>
          Find a game near you, discover open play nights, connect with local players, and explore
          mahjong events across the country all for free.
        </p>
        <h3>Venues &amp; Studios</h3>
        <p>
          Get discovered by players actively searching for places to play. Our &ldquo;Where to
          Play&rdquo; directory puts your restaurant, studio, JCC or community space in front of the
          right audience.
        </p>
        <h3>Event Organizers</h3>
        <p>
          Reach hundreds of engaged mahjong players with your retreat, tournament or local open play
          listing.
        </p>
        <h3>Brands &amp; Retailers</h3>
        <p>
          Advertise directly to an engaged niche of mahjong enthusiasts actively spending on sets,
          accessories and experiences.
        </p>

        <div className="highlight-box">
          <p>
            Want to advertise or partner with us? See our{" "}
            <Link href="/advertise">Advertise page</Link> or email us at{" "}
            <a href="mailto:hello@findmymahjgame.com">hello@findmymahjgame.com</a>.
          </p>
        </div>
      </div>
    </>
  );
}
