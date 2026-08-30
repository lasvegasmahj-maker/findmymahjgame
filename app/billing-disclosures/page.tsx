import type { Metadata } from "next";
import PolicyPage from "@/components/policy-doc";
import { doc } from "@/content/policy/billing-disclosures";

export const metadata: Metadata = {
  title: "Billing Disclosures",
  description: "Find My Mahj Premium billing disclosures: $89 a year, the 90-day claim trial, renewal reminders, cancellation, failed payments, and refunds.",
  alternates: { canonical: "https://findmymahjgame.com/billing-disclosures" },
  robots: { index: false, follow: true },
};

export default function Page() {
  return <PolicyPage doc={doc} />;
}
