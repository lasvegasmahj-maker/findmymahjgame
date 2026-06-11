import type { Metadata } from "next";
import StartClient from "./start-client";

export const metadata: Metadata = {
  title: "Start a Mahjong Table",
  description: "Start a mahjong table in under a minute. Pick a day and time, then invite players to fill your table.",
  alternates: { canonical: "https://findmymahjgame.com/start" },
};

export default function StartPage() {
  return <StartClient />;
}
