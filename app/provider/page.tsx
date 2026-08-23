import type { Metadata } from "next";
import { cookies } from "next/headers";
import ProviderClient from "./provider-client";
import { lazyServerClient } from "@/lib/supabase-server";
import { isLaunched, canUseDarkFeature } from "@/lib/launch-gates";
import { verifyUserSessionToken, USER_COOKIE } from "@/lib/user-auth";

export const metadata: Metadata = {
  title: "Provider Dashboard",
  description: "Manage your Find My Mahj Game listings, claims, and membership.",
  robots: { index: false },
};

export const dynamic = "force-dynamic";

export default async function ProviderPage() {
  const cookieStore = await cookies();
  const session = verifyUserSessionToken(cookieStore.get(USER_COOKIE)?.value);

  let gateOpen = false;
  if (session) {
    const supabase = lazyServerClient();
    const { data: profile } = await supabase.from("profiles").select("record_class").eq("id", session.userId).maybeSingle();
    const launched = await isLaunched(supabase, "providerClaims");
    gateOpen = canUseDarkFeature(launched, profile?.record_class ?? null);
  }

  return (
    <main style={{ maxWidth: 880, margin: "0 auto", padding: "2.5rem 1.2rem 4rem" }}>
      <h1
        style={{
          fontFamily: "var(--font-playfair), 'Playfair Display', serif",
          fontSize: "2rem",
          color: "var(--navy)",
          textAlign: "center",
          margin: "0 0 0.4rem",
        }}
      >
        Provider dashboard
      </h1>
      <p style={{ color: "var(--muted)", textAlign: "center", margin: "0 0 2rem", fontFamily: "'DM Sans', sans-serif" }}>
        Manage the listings you own, claim a listing, and check your membership status.
      </p>
      <ProviderClient signedIn={!!session} gateOpen={gateOpen} />
    </main>
  );
}
