import type { Metadata } from "next";
import StartClient from "./start-client";

export const metadata: Metadata = {
  title: "Start a Mahjong Table | Find My Mahj Game",
  description: "Start a mahjong table in under a minute. Pick a day and time, then invite players to fill your table.",
};

export default function StartPage() {
  return <StartClient />;
}
