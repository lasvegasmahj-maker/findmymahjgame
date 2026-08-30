import type { Metadata } from "next";
import PolicyPage from "@/components/policy-doc";
import { doc } from "@/content/policy/provider-terms";

export const metadata: Metadata = {
  title: "Provider Terms",
  description: "Provider Terms for teachers, organizers, and businesses listed on Find My Mahj Game: listings, claims, editing, Find My Mahj Premium, badges, and removal.",
  alternates: { canonical: "https://findmymahjgame.com/provider-terms" },
  robots: { index: false, follow: true },
};

export default function Page() {
  return <PolicyPage doc={doc} />;
}
