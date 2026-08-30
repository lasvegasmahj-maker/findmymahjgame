import type { Metadata } from "next";
import PolicyPage from "@/components/policy-doc";
import { doc } from "@/content/policy/privacy-policy";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "Privacy Policy for Find My Mahj Game: what we collect, how we use it, who we share it with, and how to have it deleted.",
  alternates: { canonical: "https://findmymahjgame.com/privacy" },
  robots: { index: false, follow: true },
};

export default function PrivacyPage() {
  return <PolicyPage doc={doc} />;
}
