import type { Metadata } from "next";
import SubClient from "./sub-client";

export const metadata: Metadata = {
  title: "Need a Sub | Find My Mahj Game",
  description: "Missing a player for your mahjong game? Ask nearby players to fill in.",
};

export default function SubPage() {
  return <SubClient />;
}
