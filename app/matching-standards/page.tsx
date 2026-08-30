import type { Metadata } from "next";
import PolicyPage from "@/components/policy-doc";
import { doc } from "@/content/policy/matching-community-standards";

export const metadata: Metadata = {
  title: "Matching Community Standards",
  description: "Mahj Match matching terms and community standards: 18+ only, what we share and when, blocking, reporting, and our review process.",
  alternates: { canonical: "https://findmymahjgame.com/matching-standards" },
  robots: { index: false, follow: true },
};

export default function Page() {
  return <PolicyPage doc={doc} />;
}
