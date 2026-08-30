import type { Metadata } from "next";
import { cache } from "react";
import { cookies, headers } from "next/headers";
import StartClient from "./start-client";
import TablesClosed from "@/components/tables-closed";
import { quickTablesOpenFor } from "@/lib/tables-gate";
import { USER_COOKIE } from "@/lib/user-auth";
import { lazyServerClient } from "@/lib/supabase-server";

export const dynamic = "force-dynamic";

const tablesOpen = cache(async (): Promise<boolean> => {
  const [h, c] = await Promise.all([headers(), cookies()]);
  return (await quickTablesOpenFor({ host: h.get("host"), sessionCookie: c.get(USER_COOKIE)?.value }, lazyServerClient())).allowed;
});

// While the gate is OFF a real visitor gets the closed page, which must not be indexed under
// a title that promises the feature.
export async function generateMetadata(): Promise<Metadata> {
  const open = await tablesOpen();
  return {
    title: "Start a Mahjong Table",
    description: "Start a mahjong table in under a minute. Pick a day and time, then invite players to fill your table.",
    alternates: { canonical: "https://findmymahjgame.com/start" },
    ...(open ? {} : { robots: { index: false, follow: true } }),
  };
}

export default async function StartPage() {
  if (!(await tablesOpen())) return <TablesClosed what="Starting a table" />;
  return <StartClient />;
}
