import type { Metadata } from "next";
import { cookies, headers } from "next/headers";
import PlayClient from "./play-client";
import { quickTablesOpenFor } from "@/lib/tables-gate";
import { USER_COOKIE } from "@/lib/user-auth";
import { lazyServerClient } from "@/lib/supabase-server";

export const metadata: Metadata = {
  title: "I Want to Play Mahjong",
  description: "Tell us where you are and we will help you find a mahjong game near you.",
  alternates: { canonical: "https://findmymahjgame.com/play" },
};

export const dynamic = "force-dynamic";

export default async function PlayPage() {
  const [h, c] = await Promise.all([headers(), cookies()]);
  const { allowed } = await quickTablesOpenFor({ host: h.get("host"), sessionCookie: c.get(USER_COOKIE)?.value }, lazyServerClient());
  return <PlayClient tablesOpen={allowed} />;
}
