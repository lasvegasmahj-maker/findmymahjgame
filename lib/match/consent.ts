import type { SupabaseClient } from "@supabase/supabase-js";

// Matching consent is a server-checked database fact, never a client claim.
// Bump the version when the consent language changes materially; players on an
// older version must re-consent before matching acts on their behalf.
export const CONSENT_VERSION = "2026-08-v1";

export type ConsentCheck = {
  eligible: boolean;
  reasons: string[];
  recordClass: "real_external" | "test" | "internal" | "seed_demo" | null;
};

// The four requirements, in order: an active account, an adult affirmation, an
// explicit current-version opt in, and no deactivation. Every matching operation
// (requesting, proposing, accepting, even being considered by the matcher) calls
// this first. There is no path into matching that skips it.
export async function readMatchingConsent(supabase: SupabaseClient, userId: string): Promise<ConsentCheck> {
  const reasons: string[] = [];
  const { data: profile, error: pErr } = await supabase
    .from("profiles").select("deactivated_at, record_class").eq("id", userId).maybeSingle();
  if (pErr) return { eligible: false, reasons: ["profile read failed"], recordClass: null };
  if (!profile) return { eligible: false, reasons: ["no account"], recordClass: null };
  if (profile.deactivated_at) reasons.push("account deactivated");

  const { data: mp, error: mErr } = await supabase
    .from("matching_profiles")
    .select("adult_affirmed_at, consent_version, matching_opt_in_at, matching_deactivated_at")
    .eq("user_id", userId).maybeSingle();
  if (mErr) return { eligible: false, reasons: ["matching profile read failed"], recordClass: profile.record_class };
  if (!mp) reasons.push("no matching profile");
  else {
    if (!mp.adult_affirmed_at) reasons.push("18+ not affirmed");
    if (!mp.matching_opt_in_at) reasons.push("matching not opted in");
    if (mp.consent_version !== CONSENT_VERSION) reasons.push("consent version outdated");
    if (mp.matching_deactivated_at) reasons.push("matching deactivated");
  }
  return { eligible: reasons.length === 0, reasons, recordClass: profile.record_class };
}
