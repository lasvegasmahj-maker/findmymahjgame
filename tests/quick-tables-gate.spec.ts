import { test, expect } from "@playwright/test";
import fs from "fs";
import path from "path";
import { createClient } from "@supabase/supabase-js";
import { canUseDarkFeature } from "../lib/launch-gates";
import { signGameToken } from "../lib/game-token";

// The legacy quick-table routes sit behind launch_player_matching with the shared dark-launch
// rule. While the gate is OFF (production today), a real visitor is refused before any read of
// the request body and before any write; test traffic keeps working so the product can be QA-run.
// The real-visitor cases send the production Host header over HTTP, which is exactly how the
// route tells real traffic from test traffic, against the live gate value.

const ROOT = path.join(__dirname, "..");
const ROUTES = ["create", "find", "claim", "played", "run-it-back"] as const;
const REAL = { host: "findmymahjgame.com" };

function loadEnv() {
  const envPath = path.join(ROOT, ".env.local");
  if (!fs.existsSync(envPath)) return;
  for (const line of fs.readFileSync(envPath, "utf8").split("\n")) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].trim().replace(/^["']|["']$/g, "");
  }
}
loadEnv();
const SERVICE = process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY
  ? createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)
  : null;

async function gateValue(): Promise<string | null> {
  const { data } = await SERVICE!.from("app_settings").select("value").eq("key", "launch_player_matching").maybeSingle();
  return data?.value ?? null;
}

test.describe("quick-table routes: gate shape", () => {
  test("every /api/tables route imports the shared gate and checks it before any write", () => {
    for (const r of ROUTES) {
      const src = fs.readFileSync(path.join(ROOT, "app", "api", "tables", r, "route.ts"), "utf8");
      expect(src, r).toMatch(/import \{ quickTablesAccess[^}]*\} from "@\/lib\/tables-gate"/);
      const gateAt = src.indexOf("quickTablesAccess(req, supabase)");
      expect(gateAt, `${r} must call the gate`).toBeGreaterThan(0);
      for (const write of [".insert(", ".update(", ".delete(", "sendEmail("]) {
        const at = src.indexOf(write);
        if (at >= 0) expect(at, `${r}: ${write} must come after the gate check`).toBeGreaterThan(gateAt);
      }
    }
  });

  test("the gate is the existing launch_player_matching gate with the shared dark-launch rule, not a new one", () => {
    const src = fs.readFileSync(path.join(ROOT, "lib", "tables-gate.ts"), "utf8");
    expect(src).toMatch(/isLaunched\(supabase, "playerMatching"\)/);
    expect(src).toMatch(/canUseDarkFeature\(launched, recordClass\)/);
    expect(src).not.toMatch(/matcher_enabled/);
    expect(src).not.toMatch(/launch_tables|quick_tables_enabled/);
    expect(canUseDarkFeature(false, "real_external")).toBe(false);
    expect(canUseDarkFeature(false, "test")).toBe(true);
    expect(canUseDarkFeature(true, "real_external")).toBe(true);
    // Only a local development host counts as test by host; a deployment alias does not.
    expect(src).toMatch(/LOCAL_HOST = \/\^\(localhost\|127\\\.0\\\.0\\\.1\|\\\[::1\\\]\)\$\/i/);
    expect(src).not.toMatch(/hostRecordClass\(/);
    expect(src).toMatch(/LOCAL_HOST\.test\(host\) && !process\.env\.VERCEL/);
    expect(src).toMatch(/return data\?\.record_class === "test" \? "test" : "real_external";/);
  });

  test("the lifecycle around the routes honors the gate too: the ask-played cron only asks real tables and the homepage advertises no seat while closed", () => {
    const cron = fs.readFileSync(path.join(ROOT, "app", "api", "cron", "ask-played", "route.ts"), "utf8");
    expect(cron).toMatch(/if \(!\(await isLaunched\(supabase, "playerMatching"\)\)\) return NextResponse\.json\(\{ asked: 0 \}\);/);
    expect(cron).toMatch(/\.eq\("record_class", "real_external"\)\s*\.eq\("status", "full"\)/);
    const tablePage = fs.readFileSync(path.join(ROOT, "app", "t", "[code]", "page.tsx"), "utf8");
    expect(tablePage).toMatch(/if \(!t \|\| t\.record_class !== recordClass\) notFound\(\);/);
    const home = fs.readFileSync(path.join(ROOT, "app", "page.tsx"), "utf8");
    expect(home).toMatch(/const tablesOpen = await isLaunched\(supabase, "playerMatching"\)/);
    const sitemap = fs.readFileSync(path.join(ROOT, "app", "sitemap.ts"), "utf8");
    expect(sitemap).toMatch(/tablesOpen \? \[\{ url: `\$\{BASE\}\/start`/);
  });

  test("the automated matcher still checks matcher_enabled on its own, separate from the launch gate", () => {
    const cron = fs.readFileSync(path.join(ROOT, "app", "api", "cron", "matcher", "route.ts"), "utf8");
    expect(cron).toMatch(/eq\("key", "matcher_enabled"\)/);
    expect(cron).toMatch(/isLaunched\(db, "playerMatching"\)/);
    expect(cron).not.toMatch(/tables-gate/);
  });

  test("tables started, joined, or repeated carry the record class of who made them", () => {
    const create = fs.readFileSync(path.join(ROOT, "app", "api", "tables", "create", "route.ts"), "utf8");
    expect((create.match(/record_class: access\.recordClass/g) ?? []).length).toBe(2);
    const claim = fs.readFileSync(path.join(ROOT, "app", "api", "tables", "claim", "route.ts"), "utf8");
    expect(claim).toMatch(/record_class: t\.record_class/);
    const back = fs.readFileSync(path.join(ROOT, "app", "api", "tables", "run-it-back", "route.ts"), "utf8");
    expect(back).toMatch(/referred_by, record_class"/);
    expect((back.match(/record_class: orig\.record_class/g) ?? []).length).toBe(2);
  });
});

const REMOTE = Boolean(process.env.PLAYWRIGHT_BASE_URL && !/localhost|127\.0\.0\.1/.test(process.env.PLAYWRIGHT_BASE_URL));

test.describe("quick-table routes: gate OFF refuses a real visitor and writes nothing", () => {
  test.skip(!SERVICE, "Supabase service env not available in this environment");
  test.skip(REMOTE, "needs the local server: the Host header is the real-visitor signal");

  // Once the owner flips the gate ON these refusals no longer apply, so the block skips
  // instead of failing on launch day.
  test.beforeAll(async () => {
    const gate = await gateValue();
    test.skip(gate === "true", "launch_player_matching is ON; the dark-launch refusals do not apply");
  });

  test("create: 403, no table row", async ({ request }) => {
    const hostName = `QA Gate Check ${Date.now()}`;
    const res = await request.post("/api/tables/create", { headers: REAL, data: { hostName, hostEmail: "qa-gate@fmg-qa.test", city: "Gateville", day: "Monday", time: "Morning", skill: "anyone" } });
    expect(res.status()).toBe(403);
    expect((await res.json()).error).toBe("Game tables are not open yet.");
    const { count } = await SERVICE!.from("tables").select("id", { count: "exact", head: true }).eq("host_name", hostName);
    expect(count).toBe(0);
  });

  test("find: 403 with an empty list, before the query", async ({ request }) => {
    const res = await request.get("/api/tables/find?city=Gateville", { headers: REAL });
    expect(res.status()).toBe(403);
    const j = await res.json();
    expect(j.tables).toEqual([]);
    expect(j.error).toBe("Game tables are not open yet.");
  });

  test("claim: 403 before the table is even looked up, no seat row", async ({ request }) => {
    const name = `QA Gate Seat ${Date.now()}`;
    const res = await request.post("/api/tables/claim", { headers: REAL, data: { shareCode: "nosuchcode", name, email: "qa-gate@fmg-qa.test" } });
    expect(res.status()).toBe(403);
    const { count } = await SERVICE!.from("table_seats").select("id", { count: "exact", head: true }).eq("name", name);
    expect(count).toBe(0);
  });

  test("played: the form POST lands on the closed page without touching the token", async ({ request }) => {
    const res = await request.post("/api/tables/played", { headers: REAL, form: { token: "not-a-real-token" }, maxRedirects: 0 });
    expect(res.status()).toBe(303);
    expect(res.headers()["location"]).toMatch(/\/played\?result=closed$/);
  });

  test("run-it-back: the form POST lands on the closed page, no clone", async ({ request }) => {
    const since = new Date(Date.now() - 5_000).toISOString();
    const res = await request.post("/api/tables/run-it-back", { headers: REAL, form: { token: "not-a-real-token" }, maxRedirects: 0 });
    expect(res.status()).toBe(303);
    expect(res.headers()["location"]).toMatch(/\/played\?result=closed$/);
    // Other suites create test-classified tables in parallel; a real-classified row is the only
    // thing this route could have written, and there must be none.
    const { count } = await SERVICE!.from("tables").select("id", { count: "exact", head: true }).eq("record_class", "real_external").gte("created_at", since);
    expect(count).toBe(0);
  });

  test("the pages that front the routes show a closed state instead of a form", async ({ request }) => {
    const start = await request.get("/start", { headers: REAL });
    expect(start.status()).toBe(200);
    const startHtml = await start.text();
    expect(startHtml).toContain("Not open yet");
    expect(startHtml).not.toMatch(/name="hostName"|Start your table|type="submit"/);
    expect(startHtml).toMatch(/<meta name="robots" content="noindex/);
    const confirm = await request.get(`/played/confirm?token=${encodeURIComponent(signGameToken("00000000-0000-0000-0000-000000000000", "yes"))}`, { headers: REAL });
    expect(confirm.status()).toBe(200);
    const confirmHtml = await confirm.text();
    expect(confirmHtml).toContain("Not open yet");
    expect(confirmHtml).not.toMatch(/action="\/api\/tables\/played"/);
    const thanks = await request.get("/played?result=closed", { headers: REAL });
    expect(await thanks.text()).toContain("did not record your answer");
  });

  test("/play shows the closed state, not a fake empty search, when the find route refuses", async ({ page }) => {
    // A browser cannot send a custom Host header, so the refusal the route-level test proves
    // above is replayed here to exercise the client's handling of it.
    await page.route("**/api/tables/find**", (route) => route.fulfill({ status: 403, contentType: "application/json", body: JSON.stringify({ tables: [], error: "Game tables are not open yet." }) }));
    await page.goto("/play");
    await page.getByRole("textbox").first().fill("Gateville");
    await page.getByRole("button", { name: /find|search|games/i }).first().click();
    await expect(page.getByRole("heading", { name: "Not open yet" })).toBeVisible();
    await expect(page.getByText(/the moment it opens in Gateville/i)).toBeVisible();
    await expect(page.getByRole("link", { name: /start your own table/i })).toHaveCount(0);
    await expect(page.getByText("No public games in")).toHaveCount(0);
  });
});

test.describe("quick-table routes: gate ON and test traffic", () => {
  test("with the gate ON the same helper admits a real visitor: launched short-circuits the dark rule", () => {
    const src = fs.readFileSync(path.join(ROOT, "lib", "tables-gate.ts"), "utf8");
    expect(src).toMatch(/const \[launched, recordClass\] = await Promise\.all\(\[isLaunched\(supabase, "playerMatching"\), requesterRecordClass\(who, supabase\)\]\)/);
    expect(src).toMatch(/allowed: canUseDarkFeature\(launched, recordClass\)/);
    expect(canUseDarkFeature(true, "real_external")).toBe(true);
    expect(canUseDarkFeature(true, "test")).toBe(true);
  });

  test("the pages front the same shared rule (no second copy of it)", () => {
    for (const f of ["app/start/page.tsx", "app/t/[code]/page.tsx", "app/played/confirm/page.tsx"]) {
      const src = fs.readFileSync(path.join(ROOT, f), "utf8");
      expect(src, f).toMatch(/quickTablesOpenFor\(\{ host: \w+\.get\("host"\), sessionCookie: \w+\.get\(USER_COOKIE\)\?\.value \}, lazyServerClient\(\)\)/);
      expect(src, f).not.toMatch(/hostRecordClass|isLaunched\(/);
    }
    const claim = fs.readFileSync(path.join(ROOT, "app", "api", "tables", "claim", "route.ts"), "utf8");
    expect(claim).toMatch(/if \(t\.record_class !== "real_external"\) return NextResponse\.json\(\{ success: true, seatsRemaining: remaining \}\);/);
    // Class matching: find lists the requester's class only, and claim refuses a table of another class.
    const find = fs.readFileSync(path.join(ROOT, "app", "api", "tables", "find", "route.ts"), "utf8");
    expect(find).toMatch(/\.eq\("record_class", access\.recordClass\)/);
    expect(claim).toMatch(/if \(!t \|\| t\.record_class !== access\.recordClass\) return NextResponse\.json\(\{ error: "Table not found\." \}, \{ status: 404 \}\);/);
    // Every "Start a table" entry point honors the gate.
    for (const f of ["components/find-game-fallback.tsx", "app/leagues/page.tsx", "app/events/page.tsx", "app/play/play-client.tsx", "app/help/page.tsx"]) {
      expect(fs.readFileSync(path.join(ROOT, f), "utf8"), f).toMatch(/tablesOpen/);
    }
  });

  test("test traffic keeps working while dark, and what it creates is classified test", async ({ request }) => {
    test.skip(!SERVICE, "Supabase service env not available in this environment");
    test.skip(REMOTE, "needs the local server: a local host is what makes the requester test traffic");
    const hostName = `QA Gate Local ${Date.now()}`;
    const res = await request.post("/api/tables/create", { data: { hostName, hostEmail: "qa-gate-local@fmg-qa.test", city: "Gateville", day: "Tuesday", time: "Evening", skill: "anyone" } });
    expect(res.status()).toBe(200);
    const { shareCode } = await res.json();
    try {
      const { data: row } = await SERVICE!.from("tables").select("id, record_class").eq("share_code", shareCode).single();
      expect(row?.record_class).toBe("test");
      const { data: seat } = await SERVICE!.from("table_seats").select("record_class").eq("table_id", row!.id).single();
      expect(seat?.record_class).toBe("test");
      const claim = await request.post("/api/tables/claim", { data: { shareCode, name: "QA Gate Joiner", email: "qa-gate-joiner@fmg-qa.test" } });
      expect(claim.status()).toBe(200);
      const { data: seats } = await SERVICE!.from("table_seats").select("record_class").eq("table_id", row!.id);
      expect(seats?.every((s) => s.record_class === "test")).toBe(true);
      // A test requester sees its own test tables, and only those.
      const find = await request.get(`/api/tables/find?city=Gateville`);
      expect(find.status()).toBe(200);
      expect((await find.json()).tables.some((t: { share_code: string }) => t.share_code === shareCode)).toBe(true);
    } finally {
      const { data: row } = await SERVICE!.from("tables").select("id").eq("share_code", shareCode).maybeSingle();
      if (row?.id) { await SERVICE!.from("table_seats").delete().eq("table_id", row.id); await SERVICE!.from("tables").delete().eq("id", row.id); }
    }
  });
});
