import crypto from "crypto";

// Google Search Console adapter. Ships dark: without the owner's service-account
// credential it reports notConnected honestly and nothing else runs. When the
// credential arrives (env GSC_SERVICE_ACCOUNT_JSON, a service account with Search
// Console access to the property), the adapter signs its own JWT and calls the
// Search Analytics API directly; no SDK dependency.

const PROPERTY = "sc-domain:findmymahjgame.com";
const TOKEN_URL = "https://oauth2.googleapis.com/token";
const SCOPE = "https://www.googleapis.com/auth/webmasters.readonly";

export type GscStatus =
  | { connected: false; reason: "credential-missing" | "credential-invalid" | "api-error"; detail?: string }
  | { connected: true; property: string };

export type GscQueryRow = { keys: string[]; clicks: number; impressions: number; ctr: number; position: number };

type ServiceAccount = { client_email: string; private_key: string };

function readCredential(): ServiceAccount | null {
  const raw = process.env.GSC_SERVICE_ACCOUNT_JSON;
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    if (typeof parsed.client_email === "string" && typeof parsed.private_key === "string") return parsed;
    return null;
  } catch {
    return null;
  }
}

function b64url(input: Buffer | string): string {
  return Buffer.from(input).toString("base64url");
}

async function accessToken(sa: ServiceAccount): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const header = b64url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const claims = b64url(JSON.stringify({
    iss: sa.client_email,
    scope: SCOPE,
    aud: TOKEN_URL,
    iat: now,
    exp: now + 3600,
  }));
  const signature = crypto.createSign("RSA-SHA256").update(`${header}.${claims}`).sign(sa.private_key);
  const assertion = `${header}.${claims}.${b64url(signature)}`;
  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer", assertion }),
  });
  if (!res.ok) throw new Error(`token exchange failed: ${res.status}`);
  const j = await res.json();
  if (!j.access_token) throw new Error("token exchange returned no access_token");
  return j.access_token;
}

export async function gscStatus(): Promise<GscStatus> {
  const sa = readCredential();
  if (!sa) {
    return process.env.GSC_SERVICE_ACCOUNT_JSON
      ? { connected: false, reason: "credential-invalid" }
      : { connected: false, reason: "credential-missing" };
  }
  try {
    await accessToken(sa);
    return { connected: true, property: PROPERTY };
  } catch (e) {
    return { connected: false, reason: "api-error", detail: e instanceof Error ? e.message : "unknown" };
  }
}

// Top queries or pages for the window. Only callable when connected; callers must
// branch on gscStatus first and show NOT CONNECTED otherwise, never zeros.
export async function gscSearchAnalytics(opts: {
  dimension: "query" | "page";
  days: number;
  limit?: number;
}): Promise<GscQueryRow[]> {
  const sa = readCredential();
  if (!sa) throw new Error("Search Console credential missing");
  const token = await accessToken(sa);
  const end = new Date();
  const start = new Date(end.getTime() - opts.days * 86400000);
  const fmt = (d: Date) => d.toISOString().slice(0, 10);
  const res = await fetch(
    `https://searchconsole.googleapis.com/webmasters/v3/sites/${encodeURIComponent(PROPERTY)}/searchAnalytics/query`,
    {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        startDate: fmt(start),
        endDate: fmt(end),
        dimensions: [opts.dimension],
        rowLimit: opts.limit ?? 25,
      }),
    }
  );
  if (!res.ok) throw new Error(`search analytics failed: ${res.status}`);
  const j = await res.json();
  return (j.rows ?? []) as GscQueryRow[];
}
