import type { Metadata } from "next";
import SubmitClient from "./submit-client";

export const metadata: Metadata = {
  title: "Submit Your Listing | Find My Mahj Game",
  description: "Submit your full listing details for Find My Mahj Game. We'll review and get you live within 24 hours.",
  robots: { index: false },
};

export default function SubmitPage() {
  return <SubmitClient />;
}
