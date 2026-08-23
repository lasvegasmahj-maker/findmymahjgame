import type { SupabaseClient } from "@supabase/supabase-js";

// The master public launch gates. Every unfinished user-facing capability sits behind one of
// these so the whole product can be built, integrated and QA-tested in production without a
// real member of the public ever reaching an unlaunched flow. Launch day is flipping these
// values and verifying, not another build.
//
// Convention matches the existing growth_* and matcher_enabled flags in app_settings: string
// values, and absence means OFF. Reading fails closed: a missing table, a query error, or an
// unexpected value is always a denial.

export const LAUNCH_GATES = {
  publicSignup: "launch_public_signup",
  providerClaims: "launch_provider_claims",
  payments: "launch_payments",
  playerMatching: "launch_player_matching",
} as const;

export type LaunchGate = keyof typeof LAUNCH_GATES;

export async function isLaunched(supabase: SupabaseClient, gate: LaunchGate): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from("app_settings").select("value").eq("key", LAUNCH_GATES[gate]).maybeSingle();
    if (error) return false;
    return data?.value === "true";
  } catch {
    return false;
  }
}

// QA identities let every flow be exercised end to end while the gates stay closed. The rules
// that make this safe: the QA domain is unroutable so no real person can receive mail at it,
// every account created through it is classified test at the database level, and creating one
// requires an already-authenticated admin session on top of the domain match.
export const QA_EMAIL_DOMAIN = "fmg-qa.test";

export function isQaEmail(email: unknown): boolean {
  return typeof email === "string" && email.toLowerCase().endsWith("@" + QA_EMAIL_DOMAIN);
}

// The shared dark-launch rule: while a gate is OFF, only test-classified accounts
// may use the feature, so the whole product can be QA-run in production without a
// real person ever reaching an unlaunched flow. Real accounts pass only once the
// gate flips. Every gated feature route uses this, not its own variant.
export function canUseDarkFeature(launched: boolean, recordClass: string | null | undefined): boolean {
  return launched || recordClass === "test";
}
