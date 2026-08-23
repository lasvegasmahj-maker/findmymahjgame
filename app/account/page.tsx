import type { Metadata } from "next";
import AccountClient from "./account-client";
import { lazyServerClient } from "@/lib/supabase-server";
import { isLaunched } from "@/lib/launch-gates";

export const metadata: Metadata = {
  title: "Your Account",
  description: "Sign in to Find My Mahj Game and manage your account.",
  robots: { index: false },
};

export const dynamic = "force-dynamic";

export default async function AccountPage() {
  const signupOpen = await isLaunched(lazyServerClient(), "publicSignup");
  return (
    <main style={{ maxWidth: 520, margin: "0 auto", padding: "2.5rem 1.2rem 4rem" }}>
      <h1 style={{ fontFamily: "var(--font-playfair), 'Playfair Display', serif", fontSize: "2rem", color: "var(--navy)", textAlign: "center", margin: "0 0 0.4rem" }}>
        Your account
      </h1>
      <AccountClient signupOpen={signupOpen} />
    </main>
  );
}
