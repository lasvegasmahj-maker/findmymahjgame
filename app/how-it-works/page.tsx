import type { Metadata } from "next";
import HowItWorksClient from "./how-it-works-client";
import { buildHowItWorksSchema, schemaScriptProps } from "@/lib/schema";

export const metadata: Metadata = {
  title: "How Find My Mahj Game Works | Find or List a Mahjong Game",
  description:
    "Find a local mahjong game in 3 steps, or list your venue, event or business. See how Find My Mahj Game connects players and advertisers nationwide.",
  alternates: {
    canonical: "https://findmymahjgame.com/how-it-works",
  },
  openGraph: {
    title: "How Find My Mahj Game Works | Find or List a Mahjong Game",
    description:
      "Find a local mahjong game in 3 steps, or list your venue, event or business. See how Find My Mahj Game connects players and advertisers nationwide.",
    url: "https://findmymahjgame.com/how-it-works",
  },
};

export default function HowItWorksPage() {
  return (
    <>
      <script {...schemaScriptProps(buildHowItWorksSchema())} />
      <HowItWorksClient />
    </>
  );
}
