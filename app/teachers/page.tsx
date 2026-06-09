import type { Metadata } from "next";
import TeachersClient from "./teachers-client";

export const metadata: Metadata = {
  title: "Find a Mahjong Teacher | Find My Mahj Game",
  description: "A simple, trustworthy directory of mahjong teachers by city and state. Preview.",
  robots: { index: false, follow: false },
};

export default function TeachersPage() {
  return <TeachersClient />;
}
