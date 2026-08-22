import { createServerClient } from "@/lib/supabase-server";
import { canTransition, type ProspectState } from "@/lib/prospect-state";

// Deterministic send eligibility. An LLM never decides whether an email may be sent; it can
// at most request a send, and every request passes through this gate. The gate fails CLOSED:
// any lookup error, missing table, or missing setting is a denial, never a pass.

export type SendDenial =
  | "global_pause"
  | "outreach_disabled"
  | "autonomy_level_too_low"
  | "campaign_inactive"
  | "suppressed"
  | "do_not_contact"
  | "invalid_state"
  | "no_contact_email"
  | "duplicate_message"
  | "daily_limit_reached"
  | "already_a_member"
  | "lookup_failed";

export type SendVerdict = { allowed: false; denials: SendDenial[] } | { allowed: true; denials: [] };

async function setting(key: string): Promise<string | null> {
  try {
    const supabase = createServerClient();
    const { data, error } = await supabase.from("app_settings").select("value").eq("key", key).maybeSingle();
    if (error) return null;
    return data?.value ?? null;
  } catch {
    return null;
  }
}

export async function canSendOutreach(prospect: {
  id: string;
  status: string;
  public_email: string | null;
  do_not_contact: boolean;
  campaign_id: string | null;
  existing_listing_id?: string | null;
}): Promise<SendVerdict> {
  const denials: SendDenial[] = [];
  const supabase = createServerClient();

  // Missing settings deny; only the explicit safe value passes.
  if ((await setting("growth_global_pause")) !== "false") denials.push("global_pause");
  if ((await setting("growth_outreach_enabled")) !== "true") denials.push("outreach_disabled");
  const level = Number((await setting("growth_autonomy_level")) ?? "0");
  if (!Number.isFinite(level) || level < 2) denials.push("autonomy_level_too_low");

  if (prospect.do_not_contact) denials.push("do_not_contact");
  if (!prospect.public_email) denials.push("no_contact_email");
  if (prospect.status !== "READY_FOR_OUTREACH" && prospect.status !== "FOLLOW_UP_DUE") {
    denials.push("invalid_state");
  }

  // A prospect we published a listing for is already in the product. Matching on contact
  // email alone used to carry this, but a research sourced listing may legitimately have no
  // email, so the linkage column is the reliable signal.
  if (prospect.existing_listing_id) denials.push("already_a_member");

  if (prospect.public_email) {
    try {
      const { data, error } = await supabase
        .from("email_suppressions")
        .select("email")
        .eq("email", prospect.public_email.toLowerCase())
        .maybeSingle();
      if (error) denials.push("lookup_failed");
      else if (data) denials.push("suppressed");
    } catch {
      denials.push("lookup_failed");
    }

    // A published listing or a pending submission with this contact email means they are
    // already in the product; prospect outreach to them is forbidden.
    try {
      for (const table of ["venue_listings", "event_listings"]) {
        const { data, error } = await supabase
          .from(table)
          .select("id")
          .ilike("contact_email", prospect.public_email)
          .limit(1);
        if (error) { denials.push("lookup_failed"); break; }
        if (data && data.length > 0) { denials.push("already_a_member"); break; }
      }
    } catch {
      denials.push("lookup_failed");
    }
  }

  if (prospect.campaign_id) {
    try {
      const { data, error } = await supabase
        .from("outreach_campaigns")
        .select("active, daily_send_limit")
        .eq("id", prospect.campaign_id)
        .maybeSingle();
      if (error || !data) denials.push("lookup_failed");
      else if (!data.active) denials.push("campaign_inactive");
    } catch {
      denials.push("lookup_failed");
    }
  } else {
    denials.push("campaign_inactive");
  }

  try {
    const limit = Number((await setting("growth_daily_send_limit")) ?? "0");
    const since = new Date();
    since.setHours(0, 0, 0, 0);
    const { count, error } = await createServerClient()
      .from("outreach_messages")
      .select("id", { count: "exact", head: true })
      .eq("send_status", "sent")
      .gte("sent_at", since.toISOString());
    if (error) denials.push("lookup_failed");
    else if (!Number.isFinite(limit) || limit <= 0 || (count ?? 0) >= limit) denials.push("daily_limit_reached");
  } catch {
    denials.push("lookup_failed");
  }

  try {
    const { count, error } = await supabase
      .from("outreach_messages")
      .select("id", { count: "exact", head: true })
      .eq("prospect_id", prospect.id)
      .eq("send_status", "sent");
    if (error) denials.push("lookup_failed");
    else if ((count ?? 0) >= 3) denials.push("duplicate_message");
  } catch {
    denials.push("lookup_failed");
  }

  if (denials.length > 0) return { allowed: false, denials };
  return { allowed: true, denials: [] };
}

// The one write path for prospect state. Refuses illegal transitions and appends the audit
// event in the same call, so a state change without an audit trail cannot happen.
export async function transitionProspect(args: {
  prospectId: string;
  from: ProspectState;
  to: ProspectState;
  agent: string;
  reason: string;
  evidence?: string;
  aiGenerated?: boolean;
  humanApproved?: boolean;
}): Promise<{ ok: boolean; error?: string }> {
  if (!canTransition(args.from, args.to)) {
    return { ok: false, error: `illegal transition ${args.from} -> ${args.to}` };
  }
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from("prospects")
    .update({ status: args.to, updated_at: new Date().toISOString() })
    .eq("id", args.prospectId)
    .eq("status", args.from)
    .select("id");
  if (error) return { ok: false, error: error.message };
  if (!data || data.length === 0) {
    // Concurrent transition: someone else moved the row first. The conditional update makes
    // two workers claiming one prospect impossible to both succeed.
    return { ok: false, error: "state changed concurrently; transition not applied" };
  }
  const { error: auditErr } = await supabase.from("outreach_events").insert({
    prospect_id: args.prospectId,
    agent: args.agent,
    action: "state_transition",
    reason: args.reason,
    evidence: args.evidence || null,
    previous_state: args.from,
    new_state: args.to,
    ai_generated: args.aiGenerated ?? false,
    deterministic: !(args.aiGenerated ?? false),
    human_approved: args.humanApproved ?? false,
  });
  if (auditErr) console.error("growth audit insert failed:", auditErr.message);
  return { ok: true };
}
