import type { Metadata } from "next";
import ListMyGameClient from "./list-my-game-client";
import { buildListMyGamePageSchema, schemaScriptProps } from "@/lib/schema";

export const metadata: Metadata = {
  title: "Create a Free Mahjong Player Listing | Find My Mahj Game",
  description:
    "List yourself as a mahjong player so others in your area can find you. 100% free, no credit card. Appears on your state page after approval.",
  alternates: {
    canonical: "https://findmymahjgame.com/list-my-game",
  },
  openGraph: {
    title: "Create a Free Mahjong Player Listing | Find My Mahj Game",
    description:
      "List yourself as a mahjong player so others in your area can find you. 100% free, no credit card. Appears on your state page after approval.",
    url: "https://findmymahjgame.com/list-my-game",
  },
};

export default function ListMyGamePage() {
  return (
    <>
      <script {...schemaScriptProps(buildListMyGamePageSchema())} />
      <ListMyGameClient />
    </>
  );
}
