import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sendEmail } from "@/lib/email";
import { signActionToken } from "@/lib/game-token";
import { escapeHtml } from "@/lib/sanitize";
import { lazyServerClient } from "@/lib/supabase-server";

// The Bench matcher, MVP. Ships DARK: app_settings.matcher_enabled must be
// 'true' AND every match still requires the founder's one-click approval
// before anyone is emailed an invite. Dallas-first per the pilot ruling:
// only the allowlisted metro pools. Daily cadence (Vercel Hobby allows daily).
const supabase = lazyServerClient();

const PILOT_CITIES = ["dallas", "plano", "frisco", "richardson", "addison", "fort worth", "mckinney", "allen", "irving", "garland", "carrollton"];
const norm = (s: string | null) => (s || "").toLowerCase().replace(/[^a-z0-9 ]/g, "").trim();

export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  const presented = req.headers.get("authorization") || "";
  const expected = `Bearer ${secret}`;
  const ok = !!secret && presented.length === expected.length &&
    crypto.timingSafeEqual(Buffer.from(presented), Buffer.from(expected));
  if (!ok) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: setting, error: settingErr } = await supabase
    .from("app_settings").select("value").eq("key", "matcher_enabled").maybeSingle();
  if (settingErr) {
    if (settingErr.code === "42P01" || settingErr.code === "PGRST205") {
      // Migration not applied yet: stay silent and dark.
      return NextResponse.json({ skipped: true, reason: "matching migration not applied" });
    }
    console.error("matcher: settings query failed:", settingErr.message);
    return NextResponse.json({ error: "settings query failed" }, { status: 500 });
  }
  if (setting?.value !== "true") return NextResponse.json({ skipped: true, reason: "matcher disabled" });

  const { data: requests, error: reqErr } = await supabase
    .from("play_requests")
    .select("id, name, email, city, state, day_pref, time_pref, created_at, status")
    .eq("status", "new")
    .or("day_pref.is.null,day_pref.neq.area-notify")
    .order("created_at", { ascending: true })
    .limit(200);

  if (reqErr) {
    console.error("matcher: play_requests query failed:", reqErr.message);
    return NextResponse.json({ error: "query failed" }, { status: 500 });
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
    .from("match_drafts").select("request_ids").in("status", ["draft", "approved"]).gte("created_at", new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString());
  const alreadyDrafted = new Set((existingDrafts || []).flatMap((d) => d.request_ids as string[]));

  const drafts: { city: string; day_pref: string | null; time_pref: string | null; request_ids: string[]; names: string[] }[] = [];
  const used = new Set<string>();
  for (const [key, members] of clusters) {
    let fresh = members.filter((m) => !alreadyDrafted.has(m.id) && !used.has(m.id));
    // A specific cluster one short of three borrows from the same city's
    // any-day/any-time players, so a flexible player completes the table.
    if (fresh.length === 2 && !key.endsWith("|*|*")) {
      const cityKey = key.split("|")[0];
      const wild = clusters.get(`${cityKey}|*|*`) || [];
      const extra = wild.find((m) => !alreadyDrafted.has(m.id) && !used.has(m.id) && !fresh.some((f) => f.id === m.id));
      if (extra) fresh = [...fresh, extra];
    }
    if (fresh.length >= 3) {
      const take = fresh.slice(0, 4);
      for (const t of take) used.add(t.id);
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
