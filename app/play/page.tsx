import type { Metadata } from "next";
import PlayClient from "./play-client";

export const metadata: Metadata = {
  title: "I Want to Play Mahjong | Find My Mahj Game",
  description: "Tell us where you are and we will help you find a mahjong game near you.",
};

export default function PlayPage() {
  return <PlayClient />;
}
