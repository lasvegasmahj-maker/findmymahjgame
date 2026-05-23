import type { Metadata } from "next";
import GetListedClient from "./get-listed-client";
import { buildGetListedPageSchema, schemaScriptProps } from "@/lib/schema";

export const metadata: Metadata = {
  title: "List Your Mahjong Venue, Instructor or Event | Find My Mahj Game",
  description:
    "Get your mahjong venue, instructor business or event in front of players searching state by state. Submit your listing and reach the mahjong community nationwide.",
  alternates: {
    canonical: "https://findmymahjgame.com/get-listed",
  },
  openGraph: {
    title: "List Your Mahjong Venue, Instructor or Event | Find My Mahj Game",
    description:
      "Get your mahjong venue, instructor business or event in front of players searching state by state. Submit your listing and reach the mahjong community nationwide.",
    url: "https://findmymahjgame.com/get-listed",
  },
};

export default function GetListedPage() {
  return (
    <>
      <script {...schemaScriptProps(buildGetListedPageSchema())} />
      <GetListedClient />
    </>
  );
}
