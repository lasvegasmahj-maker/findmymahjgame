import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sendEmail } from "@/lib/email";
import { signActionToken } from "@/lib/game-token";
import { escapeHtml } from "@/lib/sanitize";

// The Bench matcher, MVP. Ships DARK: app_settings.matcher_enabled must be
// 'true' AND every match still requires the founder's one-click approval
// before anyone is emailed an invite. Dallas-first per the pilot ruling:
// only the allowlisted metro pools. Daily cadence (Vercel Hobby allows daily).
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const PILOT_CITIES = ["dallas", "plano", "frisco", "richardson", "addison", "fort worth", "mckinney", "allen", "irving", "garland", "carrollton"];
const norm = (s: string | null) => (s || "").toLowerCase().replace(/[^a-z0-9 ]/g, "").trim();

export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: setting, error: settingErr } = await supabase
    .from("app_settings").select("value").eq("key", "matcher_enabled").maybeSingle();
  if (settingErr) {
    // Migration not applied yet: stay silent and dark.
    return NextResponse.json({ skipped: true, reason: "matching migration not applied" });
  }
  if (setting?.value !== "true") return NextResponse.json({ skipped: true, reason: "matcher disabled" });

  const { data: requests, error: reqErr } = await supabase
    .from("play_requests")
    .select("id, name, email, phone, city, state, day_pref, time_pref, created_at, status")
    .eq("status", "new")
    .order("created_at", { ascending: true })
    .limit(200);

  if (reqErr) {
    console.error("matcher: play_requests query failed:", reqErr.message);
    return NextResponse.json({ error: "query failed", detail: reqErr.message }, { status: 500 });
  }
  const pool = (requests || []).filter((r) => PILOT_CITIES.includes(norm(r.city)));

  // Cluster: same city bucket + same day/time preference (empty prefs are wildcards).
  const clusters = new Map<string, typeof pool>();
  for (const r of pool) {
    const key = `${norm(r.city)}|${norm(r.day_pref) || "*"}|${norm(r.time_pref) || "*"}`;
    const list = clusters.get(key) || [];
    list.push(r);
    clusters.set(key, list);
  }

  const { data: existingDrafts } = await supabase
    .from("match_drafts").select("request_ids").in("status", ["draft", "approved", "skipped"]).gte("created_at", new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString());
  const alreadyDrafted = new Set((existingDrafts || []).flatMap((d) => d.request_ids as string[]));

  const drafts: { city: string; day_pref: string | null; time_pref: string | null; request_ids: string[]; names: string[] }[] = [];
  for (const [, members] of clusters) {
    const fresh = members.filter((m) => !alreadyDrafted.has(m.id));
    if (fresh.length >= 3) {
      const take = fresh.slice(0, 4);
      drafts.push({
        city: take[0].city || "Dallas",
        day_pref: take[0].day_pref,
        time_pref: take[0].time_pref,
        request_ids: take.map((t) => t.id),
        names: take.map((t) => t.name || "Player"),
      });
    }
  }

  let created = 0;
  for (const d of drafts.slice(0, 3)) {
    const { data: row, error } = await supabase
      .from("match_drafts")
      .insert({ city: d.city, day_pref: d.day_pref, time_pref: d.time_pref, request_ids: d.request_ids })
      .select("id")
      .single();
    if (error || !row) { console.error("matcher: draft insert failed", error?.message); continue; }
    created++;

    const base = process.env.NEXT_PUBLIC_SITE_URL || "https://findmymahjgame.com";
    const approve = `${base}/api/match/decide?token=${signActionToken("match-approve", row.id, 7)}`;
    const skip = `${base}/api/match/decide?token=${signActionToken("match-skip", row.id, 7)}`;
    await sendEmail({
      to: "hello@findmymahjgame.com",
      kind: "match-draft",
      subject: `Match ready for your approval: ${d.names.length} players in ${d.city}`,
      html: `<div style="font-family:sans-serif;max-width:540px;margin:0 auto;padding:20px;">
        <h2 style="color:#1a1f5e;">A table wants to form in ${escapeHtml(d.city)}</h2>
        <p style="color:#374151;line-height:1.7;">
          Players: <strong>${d.names.map((n) => escapeHtml(n)).join(", ")}</strong><br/>
          Preference: ${escapeHtml(d.day_pref || "any day")}, ${escapeHtml(d.time_pref || "any time")}
        </p>
        <p style="color:#374151;line-height:1.7;">Approving creates the table and emails each player a claim link. Nothing sends until you approve.</p>
        <p style="margin:22px 0;">
          <a href="${approve}" style="background:#1a6e3a;color:#fff;padding:12px 22px;border-radius:10px;text-decoration:none;font-weight:700;">Approve this match</a>
          &nbsp;&nbsp;
          <a href="${skip}" style="background:#6b7280;color:#fff;padding:12px 22px;border-radius:10px;text-decoration:none;font-weight:700;">Skip</a>
        </p>
      </div>`,
    });
  }

  return NextResponse.json({ pooled: pool.length, clusters: clusters.size, drafts: created });
}
