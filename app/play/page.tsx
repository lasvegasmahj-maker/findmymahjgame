import type { Metadata } from "next";
import PlayClient from "./play-client";

export const metadata: Metadata = {
  title: "I Want to Play Mahjong",
  description: "Tell us where you are and we will help you find a mahjong game near you.",
  alternates: { canonical: "https://findmymahjgame.com/play" },
};

export default function PlayPage() {
  return <PlayClient />;
}
