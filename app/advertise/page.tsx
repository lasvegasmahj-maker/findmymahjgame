import type { Metadata } from "next";
import AdvertiseClient from "./advertise-client";
import { buildAdvertisePageSchema, schemaScriptProps } from "@/lib/schema";

export const metadata: Metadata = {
  title: "Advertise on Find My Mahj Game | Reach Mahjong Players Nationwide",
  description:
    "List your mahjong venue, instructor business, event or brand. Reach players searching in all 50 states. Founding Partner spots available now.",
  alternates: {
    canonical: "https://findmymahjgame.com/advertise",
  },
  openGraph: {
    title: "Advertise on Find My Mahj Game | Reach Mahjong Players Nationwide",
    description:
      "List your mahjong venue, instructor business, event or brand. Reach players searching in all 50 states. Founding Partner spots available now.",
    url: "https://findmymahjgame.com/advertise",
  },
};

export default function AdvertisePage() {
  return (
    <>
      <script {...schemaScriptProps(buildAdvertisePageSchema())} />
      <AdvertiseClient />
    </>
  );
}
