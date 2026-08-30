import type { Metadata } from "next";
import PolicyPage from "@/components/policy-doc";
import { doc } from "@/content/policy/terms-of-use";

export const metadata: Metadata = {
  title: "Terms of Use",
  description: "Terms of Use for Find My Mahj Game, operated by Mahjong Collective, LLC: accounts, listings, Mahj Match, safety, prohibited use, and governing law.",
  alternates: { canonical: "https://findmymahjgame.com/terms" },
  robots: { index: false, follow: true },
};

export default function TermsPage() {
  return <PolicyPage doc={doc} />;
}
