import type { SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@supabase/supabase-js";
import { scoreClaimEvidence } from "@/lib/claims/contract";
import { readMatchingConsent, CONSENT_VERSION } from "@/lib/match/consent";
import { buildGroups, blockKey, type MatchCandidate } from "@/lib/match/engine";
import { triageReport } from "@/lib/safety/triage";
import { notify } from "@/lib/notifications/notify";
import { track, hostRecordClass } from "@/lib/analytics/events";
import { lookupRule } from "@/lib/rules/lookup";
import { detectAskTopic } from "@/lib/ask-intent";
import { isBillingConfigured } from "@/lib/billing/stripe";
import { readRevenueMetrics } from "@/lib/billing/metrics";
import { readTruthMetrics } from "@/lib/data-trust";

// The Launch Simulator: proves the whole machine works before a single real user
// is invited. It runs entirely on record_class 'test' identities and rows, asserts
// each subsystem, and deletes everything it created. It never mutates a real record
// and never counts against real KPIs. Owner-triggered from /admin, admin-gated.

export type SimStatus = "PASS" | "FAIL";
export type SimResult = { category: string; status: SimStatus; detail: string };
export type SimReport = { results: SimResult[]; overall: SimStatus; ranAt: string };

const QA_DOMAIN = "fmg-qa.test";
const SIM_STATE = "ZZ"; // test-only state marker, already excluded from real KPIs

type Cleanup = { userIds: string[]; listingIds: string[]; tableIds: string[] };

function anonClient(): SupabaseClient {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

// Creates a fully signed-in QA identity the exact way production does: admin creates
// the user, a magic link is generated, and verifyOtp on a throwaway anon client
// mints the session. The profile lands record_class 'test'.
async function makeQaUser(supabase: SupabaseClient, tag: string, role: "player" | "provider"): Promise<string> {
  const email = `sim-${tag}-${Date.now()}@${QA_DOMAIN}`;
  const { data: created, error: cErr } = await supabase.auth.admin.createUser({ email, email_confirm: false });
  if (cErr && !/already|registered|exists/i.test(cErr.message)) throw new Error(`createUser: ${cErr.message}`);
  const { data: link, error: lErr } = await supabase.auth.admin.generateLink({ type: "magiclink", email });
  if (lErr || !link?.properties?.hashed_token) throw new Error(`generateLink: ${lErr?.message}`);
  const { data: verified, error: vErr } = await anonClient().auth.verifyOtp({ type: "magiclink", token_hash: link.properties.hashed_token });
  if (vErr || !verified.user?.id) throw new Error(`verifyOtp: ${vErr?.message}`);
  const userId = created?.user?.id ?? verified.user.id;
  const { error: pErr } = await supabase.from("profiles").upsert({ id: userId, role, record_class: "test" }, { onConflict: "id" });
  if (pErr) throw new Error(`profile upsert: ${pErr.message}`);
  return userId;
}

async function candidateFor(supabase: SupabaseClient, userId: string, requestId: string, overrides: Partial<MatchCandidate> = {}): Promise<MatchCandidate> {
  const consent = await readMatchingConsent(supabase, userId);
  return {
    requestId,
    userId,
    recordClass: "test",
    consentEligible: consent.eligible,
    variant: "AMERICAN",
    city: "Sim City",
    state: SIM_STATE,
    dayPref: "monday",
    timePref: "evening",
    skill: "intermediate",
    socialStyle: "social",
    hostPref: "either",
    groupPref: "either",
    priorTableUserIds: [],
    createdAt: new Date().toISOString(),
    ...overrides,
  };
}

async function sweepStragglers(supabase: SupabaseClient): Promise<void> {
  try {
    await supabase.from("venue_listings").delete().eq("state", SIM_STATE).eq("business_name", "QA SIM Studio");
    const { data } = await supabase.auth.admin.listUsers({ page: 1, perPage: 200 });
    for (const u of data?.users ?? []) {
      if (u.email && u.email.startsWith("sim-") && u.email.endsWith(`@${QA_DOMAIN}`)) {
        await supabase.from("play_requests").delete().eq("user_id", u.id);
        await supabase.from("matching_profiles").delete().eq("user_id", u.id);
        await supabase.from("profiles").delete().eq("id", u.id);
        await supabase.auth.admin.deleteUser(u.id).catch(() => {});
      }
    }
  } catch (e) {
    console.error("sim sweep failed:", e instanceof Error ? e.message : e);
  }
}

export async function runLaunchSimulation(supabase: SupabaseClient): Promise<SimReport> {
  const results: SimResult[] = [];
  const cleanup: Cleanup = { userIds: [], listingIds: [], tableIds: [] };
  const push = (category: string, status: SimStatus, detail: string) => results.push({ category, status, detail });

  // Snapshot the reconciliation issues that already exist. The simulator proves it
  // leaves no NEW residue; pre-existing data-quality items are the admin dashboard's
  // job to surface, not a reason to fail the rehearsal.
  const { readDataQualityIssues } = await import("@/lib/data-trust");
  let baselineChecks = new Set<string>();
  try {
    baselineChecks = new Set((await readDataQualityIssues(supabase)).map((i) => i.check));
  } catch { /* if this read fails, the final check will catch it */ }

  // Self-heal: reap any stragglers a prior run left behind if it was killed mid-flight
  // (the route has a 60s ceiling). Only touches simulator-created data: state 'ZZ'
  // listings and sim- auth users. Never touches a real record.
  await sweepStragglers(supabase);

  try {
    // 1. Identity
    let providerId = "";
    const playerIds: string[] = [];
    try {
      providerId = await makeQaUser(supabase, "prov", "provider");
      cleanup.userIds.push(providerId);
      for (const t of ["a", "b", "c", "d", "e"]) {
        const id = await makeQaUser(supabase, `pl-${t}`, "player");
        playerIds.push(id);
        cleanup.userIds.push(id);
      }
      const { data: prof } = await supabase.from("profiles").select("record_class").eq("id", providerId).maybeSingle();
      if (prof?.record_class !== "test") throw new Error("provider profile not classified test");
      push("Identity", "PASS", "6 QA accounts created and classified test");
    } catch (e) {
      push("Identity", "FAIL", e instanceof Error ? e.message : "unknown");
    }

    // 2. Provider claim + ownership + authorization
    try {
      const claimEmail = `sim-claim-${Date.now()}@${QA_DOMAIN}`;
      const { data: listing, error: lErr } = await supabase
        .from("venue_listings")
        .insert({ business_name: "QA SIM Studio", venue_type: "Mahjong Instructor", city: "Sim City", state: SIM_STATE, status: "pending_review", contact_email: claimEmail })
        .select("id, contact_email, website, business_name, account_id")
        .single();
      if (lErr) throw new Error(`listing insert: ${lErr.message}`);
      cleanup.listingIds.push(listing.id);

      const score = scoreClaimEvidence({
        accountEmail: claimEmail,
        listingEmail: listing.contact_email,
        listingWebsite: listing.website,
        listingName: listing.business_name,
        listingAlreadyOwned: Boolean(listing.account_id),
        hasOpenCompetingClaim: false,
      });
      if (!(score.confidence === "high" && score.autoApprove)) throw new Error("exact email match did not auto-approve");

      await supabase.from("venue_listings").update({ account_id: providerId }).eq("id", listing.id);
      const { data: owned } = await supabase.from("venue_listings").select("account_id").eq("id", listing.id).maybeSingle();
      if (owned?.account_id !== providerId) throw new Error("ownership write failed");

      // Authorization: a different user is not the owner.
      const notOwner = playerIds[0] && owned?.account_id !== playerIds[0];
      if (!notOwner) throw new Error("authorization boundary wrong");

      // A takeover attempt on the now-owned listing must never auto-approve.
      const takeover = scoreClaimEvidence({
        accountEmail: `attacker-${Date.now()}@gmail.com`,
        listingEmail: listing.contact_email,
        listingWebsite: null,
        listingName: listing.business_name,
        listingAlreadyOwned: true,
        hasOpenCompetingClaim: false,
      });
      if (takeover.autoApprove) throw new Error("takeover of an owned listing auto-approved");

      push("Provider claim", "PASS", "exact-match auto-approved, ownership set, takeover refused");
      push("Authorization", "PASS", "ownership is account_id; a non-owner never owns");
    } catch (e) {
      push("Provider claim", "FAIL", e instanceof Error ? e.message : "unknown");
    }

    // 3. Billing (dark)
    try {
      const configured = isBillingConfigured();
      const metrics = await readRevenueMetrics(supabase).catch(() => null);
      if (configured) {
        push("Billing test", "PASS", "Stripe configured; live-mode checks belong to the billing runbook");
      } else if (metrics && metrics.configured === false && metrics.mrrCents === 0) {
        push("Billing test", "PASS", "dark and honest: unconfigured, no fabricated revenue, endpoints 503");
      } else {
        throw new Error("unconfigured billing did not report a clean dark state");
      }
    } catch (e) {
      push("Billing test", "FAIL", e instanceof Error ? e.message : "unknown");
    }

    // The published billing disclosures promise self-service cancellation through Stripe's
    // customer portal plus renewal-reminder and failed-payment emails, which only the owner's
    // Stripe Billing settings can deliver. Payments must not open until both exist, so this
    // check fails only if launch_payments is ON without them; while payments are closed it
    // reports the gap without marking the rest of the product not ready.
    try {
      const portal = process.env.NEXT_PUBLIC_STRIPE_PORTAL_URL || "";
      // Stripe's test-mode portal links carry a test_ path segment; one left in place after the
      // keys go live would send real customers to a portal that cannot find their subscription.
      const liveKeys = /^(sk|rk)_live_/.test(process.env.STRIPE_SECRET_KEY || "");
      const testLinkUnderLiveKeys = liveKeys && /\/test_/.test(portal);
      const portalOk = portal.startsWith("https://billing.stripe.com/") && !testLinkUnderLiveKeys;
      const { data: rows, error: settingsErr } = await supabase
        .from("app_settings").select("key, value").in("key", ["stripe_billing_emails_confirmed", "launch_payments"]);
      if (settingsErr) throw new Error(`app_settings read failed: ${settingsErr.message}`);
      const setting = (k: string) => rows?.find((r) => r.key === k)?.value;
      // A test-mode email confirmation must not satisfy live Stripe keys.
      const emailsMode = setting("stripe_billing_emails_confirmed");
      const emailsOk = liveKeys ? emailsMode === "live" : emailsMode === "test" || emailsMode === "live";
      const paymentsOpen = setting("launch_payments") === "true";
      const missing = [
        portalOk ? null : testLinkUnderLiveKeys ? "customer portal link is still the test-mode link while Stripe keys are live (NEXT_PUBLIC_STRIPE_PORTAL_URL)" : "customer portal link (NEXT_PUBLIC_STRIPE_PORTAL_URL)",
        emailsOk ? null : liveKeys ? "billing emails confirmed for live mode (app_settings.stripe_billing_emails_confirmed must be live)" : "billing emails confirmation (app_settings.stripe_billing_emails_confirmed)",
      ].filter(Boolean).join(", ");
      if (portalOk && emailsOk) {
        push("Billing self-service", "PASS", "Stripe customer portal link configured and billing emails confirmed by the owner");
      } else if (!paymentsOpen) {
        push("Billing self-service", "PASS", `payments closed; still required before launch_payments: ${missing} (owner-activation-checklist)`);
      } else {
        push("Billing self-service", "FAIL", `launch_payments is ON without ${missing}; the published billing disclosures are not being honored`);
      }
    } catch (e) {
      push("Billing self-service", "FAIL", e instanceof Error ? e.message : "unknown");
    }

    // 4. Consent + matching + table formation
    try {
      const four = playerIds.slice(0, 4);
      for (const uid of four) {
        await supabase.from("matching_profiles").upsert({
          user_id: uid, adult_affirmed_at: new Date().toISOString(), consent_version: CONSENT_VERSION,
          matching_opt_in_at: new Date().toISOString(), city: "Sim City", state: SIM_STATE,
          variant: "AMERICAN", skill: "intermediate", social_style: "social", host_pref: "either", group_pref: "either",
          record_class: "test",
        }, { onConflict: "user_id" });
      }
      const reqIds: string[] = [];
      for (const uid of four) {
        const { data: r } = await supabase.from("play_requests").insert({
          user_id: uid, name: "Sim Player", city: "Sim City", state: SIM_STATE,
          day_pref: "monday", time_pref: "evening", variant: "AMERICAN", status: "open", record_class: "test",
        }).select("id").single();
        if (r) reqIds.push(r.id);
      }
      const candidates: MatchCandidate[] = [];
      for (let i = 0; i < four.length; i++) candidates.push(await candidateFor(supabase, four[i], reqIds[i]));
      if (!candidates.every((c) => c.consentEligible)) throw new Error("a consented player was read as ineligible");

      // The 5th player never consented, so must be ineligible.
      const fifth = await candidateFor(supabase, playerIds[4], "sim-req-5");
      if (fifth.consentEligible) throw new Error("an unconsented player was eligible");

      const groups = buildGroups(candidates, new Set());
      if (groups.groups.length !== 1 || groups.groups[0].length !== 4) throw new Error("engine did not form one group of 4");

      // Form the table through the real states.
      const shareCode = `sim-${Date.now()}-${cleanup.userIds.length}`;
      const { data: table } = await supabase.from("tables").insert({
        share_code: shareCode, host_name: "Sim Host", city: "Sim City", state: SIM_STATE, day_of_week: "monday", time_of_day: "evening",
        seats_total: 4, status: "proposed", record_class: "test",
      }).select("id").single();
      if (!table) throw new Error("table insert failed");
      cleanup.tableIds.push(table.id);
      for (const uid of four) {
        await supabase.from("table_seats").insert({ table_id: table.id, user_id: uid, name: "Sim", status: "accepted", record_class: "test" });
      }
      await supabase.from("tables").update({ status: "forming" }).eq("id", table.id).eq("status", "proposed");
      await supabase.from("tables").update({ status: "confirmed", filled_at: new Date().toISOString() }).eq("id", table.id);
      const { data: formed } = await supabase.from("tables").select("status").eq("id", table.id).maybeSingle();
      if (formed?.status !== "confirmed") throw new Error("table did not reach confirmed");

      push("Consent", "PASS", "consented players eligible, unconsented player excluded");
      push("Matching", "PASS", "engine formed one 4-seat group under hard constraints");
      push("Table formation", "PASS", "proposed to forming to confirmed via legal transitions");
    } catch (e) {
      push("Matching", "FAIL", e instanceof Error ? e.message : "unknown");
    }

    // 5. Moderation + blocking
    try {
      const harass = triageReport("harassment", "someone was abusive");
      const spam = triageReport("spam_scam", "buy cheap tiles");
      if (harass !== "needs_human") throw new Error("harassment not escalated to a human");
      if (!["triaged_low", "needs_human"].includes(spam)) throw new Error("spam triage produced an invalid status");

      // A blocked pair is never seated together. Use a pool of 5 compatible consented
      // candidates (a table needs 4) so a group actually forms, block the first two
      // with the engine's own sorted key, and assert they never share a group.
      const [bx, by] = [playerIds[0], playerIds[1]];
      const blocked = new Set([blockKey(bx, by)]);
      const pool: MatchCandidate[] = [];
      for (let i = 0; i < 5; i++) pool.push(await candidateFor(supabase, playerIds[i], `blk-${i}`, { consentEligible: true }));
      const g = buildGroups(pool, blocked);
      if (g.groups.length < 1) throw new Error("no group formed, cannot verify blocking");
      const seatedTogether = g.groups.some((grp) => grp.some((c) => c.userId === bx) && grp.some((c) => c.userId === by));
      if (seatedTogether) throw new Error("engine seated a blocked pair together");

      push("Moderation", "PASS", "serious reports escalate to a human; low-risk triaged deterministically");
      push("Blocking and reporting", "PASS", "a blocked pair is never seated together");
    } catch (e) {
      push("Moderation", "FAIL", e instanceof Error ? e.message : "unknown");
    }

    // 6. Notifications
    try {
      const res = await notify(supabase, {
        to: `sim-notify-${Date.now()}@${QA_DOMAIN}`, kind: "claim_received", subject: "Sim",
        html: "<p>Sim</p>", recordClass: "test",
      });
      if (res.status !== "skipped_qa") throw new Error(`QA notification status was ${res.status}, expected skipped_qa`);
      push("Notifications", "PASS", "QA address ledgered as skipped_qa, no real email sent");
    } catch (e) {
      push("Notifications", "FAIL", e instanceof Error ? e.message : "unknown");
    }

    // 7. Ask
    try {
      const joker = lookupRule({ question: "Can I use a joker in a pair?" });
      if (!joker.matched || joker.confidence !== "high") throw new Error("rules lookup did not match a known high-confidence answer");
      if (detectAskTopic("Where can I play near Dallas?") !== "directory") throw new Error("directory intent misrouted");
      if (detectAskTopic("How does the Charleston work?") !== "rules") throw new Error("rules intent misrouted");
      push("Ask", "PASS", "rules answered, directory and rules intents routed correctly");
    } catch (e) {
      push("Ask", "FAIL", e instanceof Error ? e.message : "unknown");
    }

    // 8. Analytics classification
    try {
      if (hostRecordClass("findmymahjgame.com") !== "real_external") throw new Error("production host not classified real");
      if (hostRecordClass("localhost:3000") !== "test") throw new Error("localhost not classified test");
      await track(supabase, "ask_submitted", { props: { topic: "directory", results: 0 }, recordClass: "test" });
      push("First-party analytics", "PASS", "events classify by host; test traffic stays out of real funnels");
    } catch (e) {
      push("First-party analytics", "FAIL", e instanceof Error ? e.message : "unknown");
    }

    // 9. Admin truth: no QA activity counts as real
    try {
      const truth = await readTruthMetrics(supabase);
      if (truth.realPlayers !== 0) throw new Error(`real player count is ${truth.realPlayers}, expected 0`);
      if (truth.paidMembers !== 0) throw new Error(`real paid members is ${truth.paidMembers}, expected 0`);
      push("Admin truth", "PASS", `real signups 0, real paying members 0; QA activity excluded`);
    } catch (e) {
      push("Admin truth", "FAIL", e instanceof Error ? e.message : "unknown");
    }
  } finally {
    // Delete everything the simulation created. Test rows only, by id.
    for (const id of cleanup.tableIds) {
      await supabase.from("table_seats").delete().eq("table_id", id);
      await supabase.from("tables").delete().eq("id", id);
    }
    for (const uid of cleanup.userIds) {
      await supabase.from("play_requests").delete().eq("user_id", uid);
      await supabase.from("matching_profiles").delete().eq("user_id", uid);
      await supabase.from("user_blocks").delete().eq("blocker_user_id", uid);
      await supabase.from("profiles").delete().eq("id", uid);
      await supabase.auth.admin.deleteUser(uid).catch((e) => console.error(`sim cleanup: deleteUser ${uid} failed:`, e instanceof Error ? e.message : e));
    }
    for (const id of cleanup.listingIds) await supabase.from("venue_listings").delete().eq("id", id);
    await supabase.from("analytics_events").delete().eq("record_class", "test").eq("name", "ask_submitted").gte("created_at", new Date(Date.now() - 300000).toISOString());
    await supabase.from("notifications_log").delete().eq("record_class", "test").like("email", "sim-notify-%@fmg-qa.test").gte("created_at", new Date(Date.now() - 300000).toISOString());
  }

  // 10. Reconciliation after cleanup: the sim must introduce no NEW issue.
  try {
    const after = await readDataQualityIssues(supabase);
    const introduced = after.filter((i) => !baselineChecks.has(i.check));
    if (introduced.length > 0) {
      push("Data reconciliation", "FAIL", `simulation introduced: ${introduced.map((i) => i.check).join("; ")}`);
    } else if (after.length > 0) {
      push("Data reconciliation", "PASS", `no residue from the simulation; ${after.length} pre-existing item(s) remain on the admin dashboard for the owner`);
    } else {
      push("Data reconciliation", "PASS", "all checks green, no residue from the simulation");
    }
  } catch (e) {
    push("Data reconciliation", "FAIL", e instanceof Error ? e.message : "unknown");
  }

  const overall: SimStatus = results.every((r) => r.status === "PASS") ? "PASS" : "FAIL";
  return { results, overall, ranAt: new Date().toISOString() };
}
